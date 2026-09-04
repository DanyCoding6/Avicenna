import { esc } from '../format.js';
import { icons } from '../icons.js';
import { emptyState } from '../ui.js';
import { scholarRow, chips } from '../components/index.js';

let all = [];
const state = { q: '', cohort: 'all' };
const shortUni = (u = '') => u.replace(/^University of /, '').replace(/^The /, '').replace(' University of London', '').replace('University College London', 'UCL').replace("King's College London", "King's").replace('London School of Economics', 'LSE').replace('Imperial College London', 'Imperial');

const filtered = () => all.filter((s) => (state.cohort === 'all' || (state.cohort === 'alumni' ? s.role === 'alumni' : s.cohort === state.cohort)) && (!state.q || `${s.full_name} ${s.university} ${s.subject} ${s.currently || ''}`.toLowerCase().includes(state.q)));
const listHtml = () => { const rows = filtered(); if (!rows.length) return emptyState('No one matches', 'Try a university, subject or name.');
  return `<div class="ledger mt-2">${rows.map((s) => scholarRow({ ...s, university: shortUni(s.university) })).join('')}</div>`;
};

export async function render({ api }) {
  all = (await api.scholars.list()).sort((a, b) => a.full_name.localeCompare(b.full_name));
  const cohorts = [...new Set(all.filter((s) => s.role === 'scholar').map((s) => s.cohort))].sort();
  return `
    <div class="wrap mt-4"><label class="search">${icons.search}<input class="input" id="dir-q" type="search" placeholder="Search name, university, subject" autocomplete="off" value="${esc(state.q)}"></label></div>
    ${chips([{ value: 'all', label: `All · ${all.length}` }, ...cohorts.map((c) => ({ value: c, label: `Cohort ${c}` })), { value: 'alumni', label: 'Alumni' }], state.cohort, 'cohort')}
    <div id="dir-list">${listHtml()}</div>`;
}

export function mount(root) {
  const list = root.querySelector('#dir-list');
  root.querySelector('#dir-q').addEventListener('input', (e) => { state.q = e.target.value.trim().toLowerCase(); list.innerHTML = listHtml(); });
  root.addEventListener('click', (e) => { const c = e.target.closest('[data-action=cohort]'); if (!c) return; e.preventDefault(); state.cohort = c.dataset.value; root.querySelectorAll('[data-action=cohort]').forEach((x) => x.setAttribute('aria-pressed', x === c)); list.innerHTML = listHtml(); });
}
