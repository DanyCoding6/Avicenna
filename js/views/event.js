import { esc, dayParts, range, time, dateFull, nl2p, plural, daysUntil } from '../format.js';
import { icons } from '../icons.js';
import { refresh } from '../router.js';
import { bindActions, toast, sheet, emptyState } from '../ui.js';
import { pillFor, avatar, isLive } from '../components/index.js';

export const header = { title: 'Event', backTo: '/events' };

function ics(e) {
  const fmt = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Avicenna//EN', 'BEGIN:VEVENT', `UID:${e.id}@avicenna`, `DTSTAMP:${fmt(new Date())}`, `DTSTART:${fmt(e.starts_at)}`, `DTEND:${fmt(e.ends_at || e.starts_at)}`, `SUMMARY:${e.title}`, `LOCATION:${e.location || ''}`, `DESCRIPTION:${(e.description || '').replace(/\n/g, '\\n')}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}
const gcal = (e) => { const f = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(e.title)}&dates=${f(e.starts_at)}/${f(e.ends_at || e.starts_at)}&location=${encodeURIComponent(e.location || '')}&details=${encodeURIComponent(e.description || '')}`; };

export async function render({ api, params }) {
  const e = await api.events.get(params.id);
  if (!e) return emptyState('Event not found', 'It may be for another cohort.');
  const d = dayParts(e.starts_at);
  const past = new Date(e.ends_at || e.starts_at) < new Date();
  const live = isLive(e);
  const multi = e.ends_at && new Date(e.ends_at).toDateString() !== new Date(e.starts_at).toDateString();
  return `
    <div class="event-hero">
      <div class="event-hero__date"><span class="event-hero__num">${d.num}</span><span class="event-hero__mon">${d.mon}${multi ? ` – ${dayParts(e.ends_at).num} ${dayParts(e.ends_at).mon}` : ''}</span></div>
      <h1 class="event-hero__title">${esc(e.title)}</h1>
      <div class="event-hero__pills">${pillFor(e)}${live ? '<span class="pill pill--tile pill--live">Live now</span>' : ''}${past ? '<span class="pill">Past</span>' : ''}</div>
    </div>
    <div class="event-facts">
      <div class="fact">${icons.clock}<div><div class="fact__main">${multi ? esc(range(e.starts_at, e.ends_at)) : esc(dateFull(e.starts_at))}</div><div class="fact__sub">${multi ? `Arrive from ${time(e.starts_at)}` : `${time(e.starts_at)}${e.ends_at ? `–${time(e.ends_at)}` : ''}`}${!past ? ` · in ${plural(Math.max(0, daysUntil(e.starts_at)), 'day')}` : ''}</div></div></div>
      <div class="fact">${e.venue === 'online' ? icons.video : icons.pin}<div><div class="fact__main">${esc(e.location || 'Online')}</div>${e.venue === 'online' && e.join_link ? `<div class="fact__sub"><a href="${esc(e.join_link)}" target="_blank" rel="noopener">Join link${live ? ' · open now' : ' · opens 15 minutes before'}</a></div>` : e.venue !== 'online' ? `<div class="fact__sub"><a href="https://maps.google.com/?q=${encodeURIComponent(e.location)}" target="_blank" rel="noopener">Open in Maps</a></div>` : ''}</div></div>
      ${e.capacity ? `<div class="fact">${icons.users}<div><div class="fact__main">${e.going_count} going${e.capacity ? ` · ${e.capacity - e.going_count} places left` : ''}</div></div></div>` : ''}
    </div>
    ${e.attendees?.length ? `<div class="going-list"><div class="avatar-stack">${e.attendees.slice(0, 5).map((a) => avatar(a, 'avatar--s')).join('')}</div><span class="secondary">${e.attendees.slice(0, 2).map((a) => esc(a.full_name.split(' ')[0])).join(', ')}${e.going_count > 2 ? ` and ${e.going_count - 2} others` : ''} going</span></div>` : ''}
    <div class="prose">${nl2p(e.description || '')}</div>
    ${e.itinerary?.length ? `<section class="section"><div class="section__head"><span class="label">Itinerary</span></div><div class="itinerary">${e.itinerary.map((day) => `<div class="itinerary__day"><div class="display display-m">${esc(day.day)}</div>${day.rows.map(([t, w]) => `<div class="itinerary__row"><span class="itinerary__time">${esc(t)}</span><span>${esc(w)}</span></div>`).join('')}</div>`).join('')}</div></section>` : ''}
    ${!past ? `<div class="rsvp-bar">
      <button class="btn ${e.my_status === 'going' ? 'btn--on' : 'btn--primary'}" type="button" data-action="rsvp" data-status="going">${e.my_status === 'going' ? `${icons.check} Going` : 'I\'m going'}</button>
      <button class="btn ${e.my_status === 'maybe' ? 'btn--ghost' : 'btn--secondary'}" type="button" data-action="rsvp" data-status="maybe" style="flex:0 0 auto">Maybe</button>
      <button class="btn-icon" type="button" data-action="calendar" aria-label="Add to calendar" style="background:var(--ink-800)">${icons.calendarPlus}</button>
    </div>` : ''}`;
}

export function mount(root, { api, params, navigate }) {
  bindActions(root, {
    rsvp: async (el) => {
      const status = el.dataset.status;
      const current = root.querySelector('[data-action=rsvp].btn--on') ? 'going' : root.querySelector('[data-action=rsvp][data-status=maybe].btn--ghost') ? 'maybe' : null;
      const next = current === status ? null : status;
      try {
        await api.events.rsvp(params.id, next);
        toast(next === 'going' ? 'See you there' : next === 'maybe' ? 'Marked as maybe' : 'RSVP removed');
        refresh();
      } catch (e) { toast(e.message, { type: 'error' }); }
    },
    calendar: async () => {
      const e = await api.events.get(params.id);
      const blob = new Blob([ics(e)], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      sheet({ title: 'Add to calendar', body: `<div class="stack-s">
        <a class="btn btn--ghost btn--block" href="${url}" download="${esc(e.title)}.ics">${icons.download} Apple / Outlook (.ics)</a>
        <a class="btn btn--ghost btn--block" href="${gcal(e)}" target="_blank" rel="noopener">${icons.external} Google Calendar</a></div>` });
    },
  });
}
