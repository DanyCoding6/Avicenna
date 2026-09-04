import { esc, dateLong } from '../../format.js';
import { bindActions, sheet, toast } from '../../ui.js';
import { avatar } from '../../components/index.js';
import { form, readForm } from '../../components/form.js';
import { formSheet, addButton, COHORT_OPTIONS, YEAR_OPTIONS } from './shared.js';
import { refresh } from '../../router.js';

const ROLES = [['scholar', 'Scholar'], ['alumni', 'Alumni'], ['coach', 'Coach'], ['mentor', 'Mentor'], ['chaplain', 'Chaplain'], ['staff', 'Staff']];
const fields = (s = {}, people = []) => {
  const opt = (role) => [['', '—'], ...people.filter((p) => p.role === role).map((p) => [p.id, p.full_name])];
  return [
    { name: 'full_name', label: 'Full name', type: 'text', required: true, value: s.full_name },
    { name: 'email', label: 'Email', type: 'email', required: true, value: s.email, hint: 'The address they will sign in with.' },
    { name: 'role', label: 'Role', type: 'select', half: true, value: s.role || 'scholar', options: ROLES },
    { name: 'cohort', label: 'Cohort', type: 'select', half: true, value: s.cohort || '', options: [['', '—'], ...COHORT_OPTIONS.map((c) => [c, c])] },
    { name: 'university', label: 'University', type: 'text', value: s.university },
    { name: 'subject', label: 'Subject', type: 'text', half: true, value: s.subject },
    { name: 'year_of_study', label: 'Year', type: 'number', half: true, value: s.year_of_study, min: 1, max: 7 },
    { name: 'coach_id', label: 'Coach', type: 'select', half: true, value: s.coach_id || '', options: opt('coach') },
    { name: 'mentor_id', label: 'Mentor', type: 'select', half: true, value: s.mentor_id || '', options: opt('mentor') },
  ];
};
const fundingFields = (y = {}) => [
  { name: 'academic_year', label: 'Academic year', type: 'select', half: true, value: y.academic_year || YEAR_OPTIONS[2], options: YEAR_OPTIONS },
  { name: 'funding_status', label: 'Funding', type: 'select', half: true, value: y.funding_status || 'pending', options: [['pending', 'Pending'], ['confirmed', 'Confirmed'], ['paid', 'Paid'], ['on_hold', 'On hold']] },
  { name: 'fee_amount', label: 'Fee (£)', type: 'number', half: true, value: y.fee_amount, step: '0.01' },
  { name: 'enrolment_due', label: 'Enrolment proof due', type: 'date', half: true, value: y.enrolment_due },
  { name: 'transcript_due', label: 'Transcript due', type: 'date', value: y.transcript_due },
  { name: 'notes', label: 'Notes to the scholar', type: 'textarea', value: y.notes },
];

let all = [];
export async function render({ api }) {
  all = await api.staff.scholars.all();
  const groups = [['scholar', 'Scholars'], ['alumni', 'Alumni'], ['coach', 'Coaches'], ['mentor', 'Mentors'], ['chaplain', 'Chaplain'], ['staff', 'Staff']];
  return `${addButton('Add a person')}
    <div class="wrap mt-4"><label class="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg><input class="input" id="st-q" type="search" placeholder="Search" autocomplete="off"></label></div>
    <div id="st-list">${groups.map(([role, label]) => { const list = all.filter((s) => s.role === role); return list.length ? `<div class="section" style="padding:0;margin-top:20px"><div class="section__head" style="padding:0 var(--gutter);margin-bottom:4px"><span class="label">${label}</span><span class="meta">${list.length}</span></div>${list.map(rowHtml).join('')}</div>` : ''; }).join('')}</div>`;
}
const rowHtml = (s) => `<button class="scholar" type="button" data-action="edit" data-id="${esc(s.id)}" style="text-align:left;width:100%">${avatar(s)}<span class="grow"><span class="scholar__name truncate" style="display:block">${esc(s.full_name)}</span><span class="scholar__line truncate" style="display:block">${esc([s.email, s.cohort && `Cohort ${s.cohort}`, s.university].filter(Boolean).join(' · ') || s.currently || '')}</span></span><span class="scholar__cohort">${s.auth_linked === false ? 'INVITED' : ''}</span></button>`;

export function mount(root, { api }) {
  root.querySelector('#st-q')?.addEventListener('input', (e) => { const q = e.target.value.trim().toLowerCase(); root.querySelector('#st-list').innerHTML = q ? `<div class="mt-2">${all.filter((s) => `${s.full_name} ${s.email || ''} ${s.university || ''} ${s.cohort || ''}`.toLowerCase().includes(q)).map(rowHtml).join('')}</div>` : root.querySelector('#st-list').innerHTML; if (!q) refresh(); });
  const open = async (s = {}) => {
    const people = all;
    formSheet({ title: s.id ? s.full_name : 'Add a person', fields: fields(s, people), onSave: (d) => api.staff.scholars.upsert({ id: s.id, ...d, cohort: d.cohort || null, coach_id: d.coach_id || null, mentor_id: d.mentor_id || null }), onDelete: s.id ? () => api.staff.scholars.remove(s.id) : null, confirmDelete: { title: `Remove ${s.full_name}?`, body: 'Their RSVPs, bookings and posts are removed too. Prefer changing their role to alumni.' } });
    if (s.id && ['scholar', 'alumni'].includes(s.role)) {
      const years = await api.staff.scholars.funding(s.id);
      const body = document.querySelector('#sheet-root .sheet__body');
      body?.insertAdjacentHTML('beforeend', `<div class="section" style="padding:0"><div class="section__head"><span class="label">Scholarship</span><button class="btn btn--s btn--secondary" type="button" data-fund="new">+ Year</button></div>${years.map((y) => `<button class="ledger-row" type="button" data-fund="${esc(y.academic_year)}" style="grid-template-columns:1fr auto"><span class="ledger-row__body"><span class="ledger-row__title">${esc(y.academic_year)} · <span class="pill ${y.funding_status === 'paid' ? 'pill--tile' : y.funding_status === 'on_hold' ? 'pill--coral' : ''}">${esc(y.funding_status)}</span></span><span class="ledger-row__meta">${y.fee_amount ? `£${Number(y.fee_amount).toLocaleString('en-GB')}` : 'no fee set'}${y.enrolment_due ? ` · enrolment by ${esc(dateLong(y.enrolment_due))}` : ''}</span></span><span class="ledger-row__trail">Edit</span></button>`).join('') || '<p class="secondary">No scholarship years recorded.</p>'}</div>`);
      body?.querySelectorAll('[data-fund]').forEach((b) => b.addEventListener('click', () => {
        const y = years.find((x) => x.academic_year === b.dataset.fund) || {};
        const f = fundingFields(y);
        sheet({ title: `${s.full_name} · scholarship`, body: form(f), actions: [{ label: 'Save', onClick: async (sh) => { const { data, errors } = readForm(sh.body, f); if (errors.length) { toast(`Needed: ${errors.join(', ')}`, { type: 'error' }); return false; } const { academic_year, ...patch } = data; await api.staff.scholars.setFunding(s.id, academic_year, patch); toast('Saved'); } }] });
      }));
    }
  };
  bindActions(root, { add: () => open(), edit: (el) => open(all.find((s) => s.id === el.dataset.id)) });
}
