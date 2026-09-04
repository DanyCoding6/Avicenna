import { esc, dateLong } from '../../format.js';
import { bindActions } from '../../ui.js';
import { formSheet, staffRow, addButton, YEAR_OPTIONS } from './shared.js';

const fields = (j = {}, scholars = []) => [
  { name: 'title', label: 'Title', type: 'text', required: true, value: j.title },
  { name: 'occurred_on', label: 'Date', type: 'date', required: true, half: true, value: j.occurred_on },
  { name: 'academic_year', label: 'Academic year', type: 'select', half: true, value: j.academic_year || YEAR_OPTIONS[2], options: YEAR_OPTIONS },
  { name: 'body', label: 'Entry', type: 'textarea', required: true, value: j.body, rows: 8 },
  { name: 'tagged_scholars', label: 'Scholars in this entry', type: 'tags', value: (j.tagged_scholars || []).map((id) => scholars.find((s) => s.id === id)?.full_name || id), hint: 'Names, comma separated. Must match the directory.' },
];
export async function render({ api }) {
  const list = await api.staff.journal.list();
  return `${addButton('New entry')}<div class="ledger mt-4">${list.map((j) => staffRow({ id: j.id, title: j.title, sub: esc(j.body).slice(0, 110), meta: `${esc(dateLong(j.occurred_on))} · ${esc(j.academic_year)}` })).join('') || '<p class="wrap secondary">No entries yet.</p>'}</div>`;
}
export function mount(root, { api }) {
  const open = async (j = {}) => {
    const scholars = await api.staff.scholars.all();
    formSheet({ title: j.id ? 'Edit entry' : 'New entry', fields: fields(j, scholars),
      onSave: (d) => { const ids = d.tagged_scholars.map((n) => scholars.find((s) => s.full_name.toLowerCase() === n.toLowerCase())?.id).filter(Boolean); return api.staff.journal.upsert({ id: j.id, ...d, tagged_scholars: ids }); },
      onDelete: j.id ? () => api.staff.journal.remove(j.id) : null });
  };
  bindActions(root, { add: () => open(), edit: async (el) => { const list = await api.staff.journal.list(); open(list.find((j) => j.id === el.dataset.id)); } });
}
