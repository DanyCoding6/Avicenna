import { esc, dateLong, deadlineLabel, relative } from '../../format.js';
import { bindActions, sheet, toast } from '../../ui.js';
import { avatar } from '../../components/index.js';
import { formSheet, staffRow, addButton } from './shared.js';
import { refresh } from '../../router.js';

const fields = (o = {}) => [
  { name: 'title', label: 'Title', type: 'text', required: true, value: o.title },
  { name: 'organisation', label: 'Organisation', type: 'text', half: true, value: o.organisation },
  { name: 'kind', label: 'Kind', type: 'select', half: true, value: o.kind || 'other', options: [['delegation', 'Delegation'], ['internship', 'Internship'], ['fellowship', 'Fellowship'], ['competition', 'Competition'], ['other', 'Other']] },
  { name: 'location', label: 'Location', type: 'text', half: true, value: o.location },
  { name: 'deadline', label: 'Deadline', type: 'datetime', required: true, half: true, value: o.deadline },
  { name: 'link', label: 'Link', type: 'url', value: o.link },
  { name: 'description', label: 'Description', type: 'textarea', value: o.description, rows: 4 },
];
export async function render({ api }) {
  const list = await api.staff.opportunities.list();
  return `${addButton('New opportunity')}<div class="ledger mt-4">${list.map((o) => staffRow({ id: o.id, title: o.title, sub: `${esc(o.organisation || '')} · ${esc(o.location || '')}`, meta: deadlineLabel(o.deadline), muted: new Date(o.deadline) < new Date() })).join('')}</div>`;
}
export function mount(root, { api }) {
  const open = async (o = {}) => {
    const interest = o.id ? await api.staff.opportunities.interest(o.id) : [];
    formSheet({ title: o.id ? 'Edit opportunity' : 'New opportunity', fields: fields(o), onSave: (d) => api.staff.opportunities.upsert({ id: o.id, ...d }), onDelete: o.id ? () => api.staff.opportunities.remove(o.id) : null });
    if (interest.length) {
      const body = document.querySelector('#sheet-root .sheet__body');
      body.insertAdjacentHTML('afterbegin', `<div class="section" style="padding:0;margin:0 0 20px"><div class="section__head"><span class="label">Interest</span><span class="meta">${interest.length}</span></div>${interest.map((i) => `<div class="row" style="align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--hairline)">${avatar(i.scholar, 'avatar--s')}<div class="grow"><div style="font-weight:500">${esc(i.scholar?.full_name || '')} <span class="pill">${esc(i.status)}</span></div><div class="secondary" style="font-size:13px;font-style:italic">“${esc(i.statement || '')}”</div></div></div>`).join('')}</div>`);
    }
  };
  bindActions(root, { add: () => open(), edit: async (el) => { const list = await api.staff.opportunities.list(); open(list.find((o) => o.id === el.dataset.id)); } });
}
