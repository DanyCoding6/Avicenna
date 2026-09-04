import { esc, dateLong, time, weekday } from '../../format.js';
import { bindActions, sheet, toast, confirm } from '../../ui.js';
import { form, readForm } from '../../components/form.js';
import { avatar } from '../../components/index.js';
import { refresh } from '../../router.js';
import { prefs } from '../../store.js';

export async function render({ api }) {
  const coaches = await api.staff.coaching.coaches();
  const coachId = prefs.get('staff-coach', coaches[0]?.id);
  const slots = coachId ? await api.staff.coaching.slots(coachId) : [];
  return `
    <div class="wrap mt-4 row"><select class="select grow" id="coach-select">${coaches.map((c) => `<option value="${esc(c.id)}" ${c.id === coachId ? 'selected' : ''}>${esc(c.full_name)}</option>`).join('')}</select><button class="btn btn--primary" type="button" data-action="add">+ Slots</button></div>
    <div class="ledger mt-4">${slots.map((s) => `<div class="ledger-row ledger-row--pad" style="grid-template-columns:1fr auto"><span class="ledger-row__body"><span class="ledger-row__title">${esc(weekday(s.starts_at))} ${esc(dateLong(s.starts_at))} · ${time(s.starts_at)}–${time(s.ends_at)}</span><span class="ledger-row__sub">${s.scholar ? `Booked by ${esc(s.scholar.full_name)}` : s.status === 'open' ? 'Open' : esc(s.status)}</span></span><span class="ledger-row__trail">${s.status === 'open' ? `<button class="btn-icon" type="button" data-action="remove" data-id="${esc(s.id)}" aria-label="Remove slot"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>` : '<span class="pill pill--tile">Booked</span>'}</span></div>`).join('') || '<p class="wrap secondary">No upcoming slots for this coach.</p>'}</div>`;
}

export function mount(root, { api }) {
  root.querySelector('#coach-select')?.addEventListener('change', (e) => { prefs.set('staff-coach', e.target.value); refresh(); });
  const fields = [
    { name: 'date', label: 'First date', type: 'date', required: true, half: true },
    { name: 'weeks', label: 'Repeat weekly for', type: 'number', half: true, value: 1, min: 1, max: 12, hint: 'weeks' },
    { name: 'times', label: 'Start times', type: 'text', required: true, value: '17:00, 18:00', hint: 'Comma separated, 24-hour. Each slot lasts one hour.' },
    { name: 'meeting_link', label: 'Meeting link', type: 'url', value: 'https://teams.microsoft.com/' },
  ];
  bindActions(root, {
    add: () => sheet({ title: 'Open coaching slots', body: form(fields), actions: [{ label: 'Create', onClick: async (s) => {
      const { data, errors } = readForm(s.body, fields); if (errors.length) { toast(`Needed: ${errors.join(', ')}`, { type: 'error' }); return false; }
      const coachId = root.querySelector('#coach-select').value; const slots = [];
      for (let w = 0; w < (data.weeks || 1); w++) for (const t of data.times.split(',').map((x) => x.trim()).filter(Boolean)) { const [h, m] = t.split(':').map(Number); const d = new Date(`${data.date}T00:00`); d.setDate(d.getDate() + w * 7); d.setHours(h, m || 0, 0, 0); if (d < new Date()) continue; const e = new Date(d); e.setHours(e.getHours() + 1); slots.push({ starts_at: d.toISOString(), ends_at: e.toISOString(), meeting_link: data.meeting_link }); }
      if (!slots.length) { toast('All of those are in the past', { type: 'error' }); return false; }
      await api.staff.coaching.createSlots(coachId, slots); toast(`${slots.length} slots opened`); refresh();
    } }] }),
    remove: async (el) => { if (await confirm({ title: 'Remove this slot?', body: 'Only open slots can be removed.', confirmLabel: 'Remove', danger: true })) { await api.staff.coaching.removeSlot(el.dataset.id); refresh(); } },
  });
}
