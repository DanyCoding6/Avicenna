import { esc, dateLong, time, range } from '../../format.js';
import { bindActions } from '../../ui.js';
import { pillFor } from '../../components/index.js';
import { formSheet, staffRow, addButton, COHORT_OPTIONS } from './shared.js';

const fields = (e = {}) => [
  { name: 'title', label: 'Title', type: 'text', required: true, value: e.title },
  { name: 'kind', label: 'Kind', type: 'select', half: true, value: e.kind || 'event', options: [['event', 'Event'], ['retreat', 'Retreat'], ['reception', 'Reception'], ['workshop', 'Workshop'], ['social', 'Social'], ['presentation', 'Presentation']] },
  { name: 'venue', label: 'Venue', type: 'select', half: true, value: e.venue || 'external', options: [['external', 'External venue'], ['adam_hub', 'Adam Hub'], ['online', 'Online']] },
  { name: 'location', label: 'Location', type: 'text', value: e.location, placeholder: 'Adam Hub, Westminster' },
  { name: 'join_link', label: 'Join link', type: 'url', value: e.join_link, placeholder: 'https://teams.microsoft.com/…' },
  { name: 'scope', label: 'Who', type: 'select', half: true, value: e.scope || 'foundation', options: [['foundation', 'Everyone'], ['cohort', 'One cohort']] },
  { name: 'cohort', label: 'Cohort', type: 'select', half: true, value: e.cohort || '', options: [['', '—'], ...COHORT_OPTIONS.map((c) => [c, c])] },
  { name: 'starts_at', label: 'Starts', type: 'datetime', required: true, half: true, value: e.starts_at },
  { name: 'ends_at', label: 'Ends', type: 'datetime', half: true, value: e.ends_at },
  { name: 'capacity', label: 'Capacity', type: 'number', value: e.capacity, min: 1 },
  { name: 'description', label: 'Description', type: 'textarea', value: e.description, rows: 4 },
  { name: 'itinerary_text', label: 'Itinerary', type: 'textarea', value: itineraryToText(e.itinerary), rows: 5, hint: 'One line per row: "Friday" starts a day, "15:00 Arrive, rooms, tea" adds a row.' },
];
function itineraryToText(it) { if (!it?.length) return ''; return it.map((d) => [d.day, ...d.rows.map(([t, w]) => `${t} ${w}`)].join('\n')).join('\n\n'); }
function textToItinerary(txt) { if (!txt) return null; const days = []; let cur = null; for (const raw of txt.split('\n')) { const line = raw.trim(); if (!line) continue; const m = /^(\d{1,2}:\d{2})\s+(.+)$/.exec(line); if (m && cur) cur.rows.push([m[1], m[2]]); else { cur = { day: line, rows: [] }; days.push(cur); } } return days.length ? days : null; }

export async function render({ api }) {
  const list = await api.staff.events.list();
  const now = new Date();
  const up = list.filter((e) => new Date(e.ends_at || e.starts_at) >= now).reverse(), past = list.filter((e) => new Date(e.ends_at || e.starts_at) < now);
  const row = (e, muted) => staffRow({ id: e.id, title: e.title, sub: `${esc(range(e.starts_at, e.ends_at))} · ${esc(e.location || 'Online')}`, meta: `${e.scope === 'cohort' ? `Cohort ${esc(e.cohort)}` : 'Everyone'}${e.going_count ? ` · ${e.going_count} going` : ''}`, pill: pillFor(e), muted });
  return `${addButton('New event')}
    <div class="ledger mt-4">${up.map((e) => row(e)).join('') || '<p class="wrap secondary">No upcoming events.</p>'}</div>
    ${past.length ? `<div class="section"><div class="section__head"><span class="label">Past</span></div></div><div class="ledger">${past.map((e) => row(e, true)).join('')}</div>` : ''}`;
}

export function mount(root, { api }) {
  const open = (e = {}) => formSheet({
    title: e.id ? 'Edit event' : 'New event', fields: fields(e),
    onSave: async (d) => { const { itinerary_text, ...rest } = d; if (rest.scope === 'cohort' && !rest.cohort) throw new Error('Pick a cohort'); if (rest.scope !== 'cohort') rest.cohort = null; await api.staff.events.upsert({ id: e.id, ...rest, itinerary: textToItinerary(itinerary_text) }); },
    onDelete: e.id ? () => api.staff.events.remove(e.id) : null, confirmDelete: { title: 'Delete this event?', body: 'RSVPs go with it.' },
  });
  bindActions(root, { add: () => open(), edit: async (el) => { const list = await api.staff.events.list(); open(list.find((e) => e.id === el.dataset.id)); } });
}
