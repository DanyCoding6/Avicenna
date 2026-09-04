// Builds the calendar feed from the demo dataset and checks the iCalendar output is well formed.
import { buildCalendar, scholarEvents, fold } from '../supabase/functions/_shared/ics.js';
import * as D from '../js/demo-data.js';
const me = D.scholars[0];
const ics = buildCalendar({ name: 'Avicenna', description: 'Test feed', events: scholarEvents({
  scholar: me, appUrl: 'https://scholars.example.org/',
  events: D.events, rsvps: D.rsvps.filter((r) => r.scholar_id === me.id),
  sessions: D.coaching_sessions.filter((s) => s.scholar_id === me.id).map((s) => ({ ...s, coach_name: 'Yusuf Ali' })),
  bookings: D.space_requests.filter((r) => r.scholar_id === me.id), projects: D.projects,
  interests: D.opportunity_interest.map((i) => ({ ...i, opportunity: D.opportunities.find((o) => o.id === i.opportunity_id) })),
  years: D.scholarship_years.filter((y) => y.scholar_id === me.id),
}) });
const fails = [];
const check = (name, ok) => { console.log((ok ? 'ok   ' : 'FAIL ') + name); if (!ok) fails.push(name); };
const lines = ics.split('\r\n');
check('CRLF line endings only', !/[^\r]\n/.test(ics) && ics.endsWith('\r\n'));
check('every line ≤ 75 octets', lines.every((l) => new TextEncoder().encode(l).length <= 75));
check('BEGIN/END VEVENT balanced', (ics.match(/BEGIN:VEVENT/g) || []).length === (ics.match(/END:VEVENT/g) || []).length && ics.startsWith('BEGIN:VCALENDAR') && ics.trim().endsWith('END:VCALENDAR'));
const uids = [...ics.matchAll(/^UID:(.+)$/gm)].map((m) => m[1]); check('UIDs unique', new Set(uids).size === uids.length && uids.length > 5);
check('UTC DTSTART format', [...ics.matchAll(/^DTSTART:(\S+)$/gm)].every((m) => /^\d{8}T\d{6}Z$/.test(m[1])));
check('all-day milestones use VALUE=DATE', /DTSTART;VALUE=DATE:\d{8}/.test(ics) && /SUMMARY:Project: /.test(ics));
check('retreat has a day-before alarm', /SUMMARY:Winter Retreat[\s\S]*?TRIGGER:-PT1440M/.test(ics));
check('commas and semicolons escaped', /LOCATION:Plas y Brenin\\, Snowdonia/.test(ics));
check('scholarship deadline present', /enrolment confirmation due/.test(ics));
check('declined and un-RSVPed events excluded', !/Parliamentary Reception/.test(ics));
check('fold splits long lines with a leading space', fold('X'.repeat(200)).split('\r\n').slice(1).every((l) => l.startsWith(' ')));
console.log(`\n${uids.length} events, ${ics.length} bytes`);
if (fails.length) process.exit(1); console.log('ics check passed');
