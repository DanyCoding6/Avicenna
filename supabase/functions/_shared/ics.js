// Minimal, correct iCalendar writer. Plain ESM with no runtime APIs so it runs in Deno (Edge Functions) and Node (tests).
// RFC 5545: CRLF line endings, 75-octet folding, escaped text, UTC timestamps.

const pad = (n) => String(n).padStart(2, '0');
export const toUtc = (d) => { const x = new Date(d); return `${x.getUTCFullYear()}${pad(x.getUTCMonth() + 1)}${pad(x.getUTCDate())}T${pad(x.getUTCHours())}${pad(x.getUTCMinutes())}${pad(x.getUTCSeconds())}Z`; };
export const toDateOnly = (d) => { const x = new Date(d); return `${x.getUTCFullYear()}${pad(x.getUTCMonth() + 1)}${pad(x.getUTCDate())}`; };
export const escapeText = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// Fold at 75 octets (not characters): measure in UTF-8 bytes.
export function fold(line) {
  const enc = new TextEncoder(); const out = []; let cur = ''; let bytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    const limit = out.length ? 74 : 75; // continuation lines start with a space
    if (bytes + b > limit) { out.push(cur); cur = ' ' + ch; bytes = 1 + b; } else { cur += ch; bytes += b; }
  }
  out.push(cur);
  return out.join('\r\n');
}

export function buildCalendar({ name = 'Avicenna', description = '', events = [], refreshHours = 6, prodId = '-//Avicenna Foundation//Scholars app//EN', now = new Date() }) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:${prodId}`, 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(name)}`, description ? `X-WR-CALDESC:${escapeText(description)}` : null,
    `REFRESH-INTERVAL;VALUE=DURATION:PT${refreshHours}H`, `X-PUBLISHED-TTL:PT${refreshHours}H`];
  const seen = new Set();
  for (const e of events) {
    if (!e || !e.uid || !e.start || seen.has(e.uid)) continue;
    seen.add(e.uid);
    lines.push('BEGIN:VEVENT', `UID:${e.uid}`, `DTSTAMP:${toUtc(now)}`);
    if (e.allDay) {
      const endDay = e.end ? new Date(e.end) : new Date(new Date(e.start).getTime() + 86400000);
      lines.push(`DTSTART;VALUE=DATE:${toDateOnly(e.start)}`, `DTEND;VALUE=DATE:${toDateOnly(endDay)}`);
    } else {
      lines.push(`DTSTART:${toUtc(e.start)}`, `DTEND:${toUtc(e.end || new Date(new Date(e.start).getTime() + 3600000))}`);
    }
    lines.push(`SUMMARY:${escapeText(e.summary || '')}`);
    if (e.description) lines.push(`DESCRIPTION:${escapeText(e.description)}`);
    if (e.location) lines.push(`LOCATION:${escapeText(e.location)}`);
    if (e.url) lines.push(`URL:${e.url}`);
    if (e.categories?.length) lines.push(`CATEGORIES:${e.categories.map(escapeText).join(',')}`);
    if (e.status) lines.push(`STATUS:${e.status}`);
    if (e.alarmMinutes) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escapeText(e.summary || 'Reminder')}`, `TRIGGER:-PT${e.alarmMinutes}M`, 'END:VALARM');
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.filter(Boolean).map(fold).join('\r\n') + '\r\n';
}

// Turn the scholar's data into calendar events. Shared by the Edge Function and the test.
export function scholarEvents({ scholar, events = [], rsvps = [], sessions = [], bookings = [], projects = [], interests = [], years = [], appUrl = '' }) {
  const out = [];
  const link = (hash) => (appUrl ? `${appUrl}#${hash}` : undefined);
  const myRsvp = new Map(rsvps.map((r) => [r.event_id, r.status]));
  for (const e of events) {
    const st = myRsvp.get(e.id);
    if (!st || st === 'declined') continue;
    out.push({ uid: `event-${e.id}@avicenna`, start: e.starts_at, end: e.ends_at, summary: st === 'maybe' ? `${e.title} (maybe)` : e.title, description: e.description, location: e.venue === 'online' ? (e.join_link || 'Online') : e.location, url: link(`/events/${e.id}`), categories: ['Avicenna', e.kind === 'retreat' ? 'Retreat' : 'Event'], status: st === 'maybe' ? 'TENTATIVE' : 'CONFIRMED', alarmMinutes: e.kind === 'retreat' ? 1440 : 60 });
  }
  for (const s of sessions) {
    if (!['booked', 'completed'].includes(s.status)) continue;
    out.push({ uid: `coaching-${s.id}@avicenna`, start: s.starts_at, end: s.ends_at, summary: `Coaching${s.coach_name ? ` with ${s.coach_name}` : ''}`, location: s.meeting_link || 'Online', url: link('/programme/coaching'), categories: ['Avicenna', 'Coaching'], alarmMinutes: 30 });
  }
  for (const b of bookings) {
    if (b.status !== 'approved') continue;
    out.push({ uid: `hub-${b.id}@avicenna`, start: b.starts_at, end: b.ends_at, summary: `Adam Hub: ${b.purpose}`, location: 'Adam Hub, Westminster', url: link('/hub/space'), categories: ['Avicenna', 'Adam Hub'], alarmMinutes: 60 });
  }
  for (const p of projects) {
    (p.milestones || []).forEach((m, i) => { if (m.due_on && !m.done_at) out.push({ uid: `project-${p.id}-${i}@avicenna`, start: m.due_on, allDay: true, summary: `Project: ${m.title}`, description: p.title, url: link('/programme/project'), categories: ['Avicenna', 'Project'] }); });
  }
  for (const i of interests) {
    if (!i.opportunity?.deadline || i.status === 'unsuccessful') continue;
    out.push({ uid: `opp-${i.opportunity.id}@avicenna`, start: i.opportunity.deadline, allDay: true, summary: `Deadline: ${i.opportunity.title}`, url: link(`/opportunities/${i.opportunity.id}`), categories: ['Avicenna', 'Opportunity'] });
  }
  for (const y of years) {
    if (y.enrolment_due) out.push({ uid: `enrol-${y.academic_year}@avicenna`, start: y.enrolment_due, allDay: true, summary: 'Avicenna: enrolment confirmation due', url: link('/scholarship'), categories: ['Avicenna', 'Scholarship'] });
    if (y.transcript_due) out.push({ uid: `transcript-${y.academic_year}@avicenna`, start: y.transcript_due, allDay: true, summary: 'Avicenna: transcript due', url: link('/scholarship'), categories: ['Avicenna', 'Scholarship'] });
  }
  return out;
}
