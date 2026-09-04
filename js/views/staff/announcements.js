import { esc, relative } from '../../format.js';
import { bindActions } from '../../ui.js';
import { formSheet, staffRow, addButton } from './shared.js';

const fields = (a = {}) => [
  { name: 'title', label: 'Title', type: 'text', required: true, value: a.title },
  { name: 'body', label: 'Body', type: 'textarea', required: true, value: a.body, rows: 5 },
  { name: 'pinned', label: 'Pin to the top of Home', type: 'checkbox', value: a.pinned },
];
export async function render({ api }) {
  const list = await api.staff.announcements.list();
  return `${addButton('New announcement')}<div class="ledger mt-4">${list.map((a) => staffRow({ id: a.id, title: a.title, sub: esc(a.body).slice(0, 110), meta: relative(a.published_at), pill: a.pinned ? '<span class="pill pill--gilt">Pinned</span>' : '' })).join('') || '<p class="wrap secondary">Nothing posted yet.</p>'}</div>`;
}
export function mount(root, { api }) {
  const open = (a = {}) => formSheet({ title: a.id ? 'Edit announcement' : 'New announcement', fields: fields(a), onSave: (d) => api.staff.announcements.upsert({ id: a.id, ...d }), onDelete: a.id ? () => api.staff.announcements.remove(a.id) : null });
  bindActions(root, { add: () => open(), edit: async (el) => { const list = await api.staff.announcements.list(); open(list.find((a) => a.id === el.dataset.id)); } });
}
