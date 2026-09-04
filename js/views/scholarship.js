// My scholarship: funding status, key dates, and the documents the foundation needs each year.
import { esc, dateLong, daysUntil, relative, plural, dayParts } from '../format.js';
import { icons } from '../icons.js';
import { bindActions, toast, confirm, emptyState, skeletonPage } from '../ui.js';
import { refresh } from '../router.js';

export const header = { title: 'My scholarship', backTo: '/profile' };
export const skeleton = () => skeletonPage({ rows: 3 });
const KIND = { enrolment_confirmation: 'Enrolment confirmation', transcript: 'Transcript', fee_invoice: 'Fee invoice', other: 'Other document' };
const STATUS = { pending: ['Pending', ''], confirmed: ['Confirmed', 'pill--gilt'], paid: ['Paid', 'pill--tile'], on_hold: ['On hold', 'pill--coral'] };
const docPill = (d) => d.status === 'accepted' ? '<span class="pill pill--tile">Accepted</span>' : d.status === 'rejected' ? '<span class="pill pill--coral">Rejected</span>' : '<span class="pill">In review</span>';

export function dueSoon(o) {
  const y = o.years.find((y) => y.academic_year === o.current); if (!y) return null;
  const has = (k) => y.documents.some((d) => d.kind === k && d.status !== 'rejected');
  const rejected = y.documents.find((d) => d.status === 'rejected');
  if (rejected) return { kind: rejected.kind, reason: 'rejected', note: rejected.staff_note };
  for (const [k, due] of [['enrolment_confirmation', y.enrolment_due], ['transcript', y.transcript_due]]) { if (due && !has(k)) { const n = daysUntil(due); if (n <= 30) return { kind: k, reason: 'due', days: n, due }; } }
  return null;
}

export async function render({ api }) {
  const o = await api.scholarship.overview();
  if (!o.years.length) return emptyState('Nothing recorded yet', 'The programme team adds your scholarship year at the start of term.');
  const year = (y, open) => {
    const [label, cls] = STATUS[y.funding_status] || [y.funding_status, ''];
    const dateRow = (title, due, kind) => { if (!due) return ''; const d = dayParts(due); const n = daysUntil(due); const done = y.documents.some((x) => x.kind === kind && x.status === 'accepted'); const pending = y.documents.some((x) => x.kind === kind && x.status === 'uploaded'); return `<div class="ledger-row"><span class="ledger-row__date"><span class="ledger-row__num">${d.num}</span><span class="ledger-row__mon">${d.mon}</span></span><span class="ledger-row__body"><span class="ledger-row__title">${esc(title)}</span><span class="ledger-row__meta ${!done && !pending && n >= 0 && n <= 14 ? 'coral' : ''}">${done ? 'Received' : pending ? 'In review' : n < 0 ? `Overdue by ${plural(-n, 'day')}` : n === 0 ? 'Due today' : `Due in ${plural(n, 'day')}`}</span></span><span class="ledger-row__trail">${done ? `<span class="tick">${icons.check}</span>` : ''}</span></div>`; };
    const checklist = ['enrolment_confirmation', 'transcript', 'other'].map((k) => { const docs = y.documents.filter((d) => d.kind === k); return `<div class="ledger-row" style="grid-template-columns:1fr auto"><span class="ledger-row__body"><span class="ledger-row__title">${esc(KIND[k])}</span>${docs.length ? docs.map((d) => `<span class="ledger-row__sub row" style="gap:8px;margin-top:6px">${docPill(d)}<span class="truncate">${esc(d.filename)}</span><span class="meta">${relative(d.uploaded_at)}</span>${d.status === 'uploaded' ? `<button class="btn-icon" style="width:32px;height:32px" type="button" data-action="remove" data-id="${esc(d.id)}" aria-label="Remove">${icons.x}</button>` : ''}</span>${d.staff_note ? `<span class="ledger-row__meta coral">${esc(d.staff_note)}</span>` : ''}`).join('') : `<span class="ledger-row__sub">${k === 'other' ? 'Anything else the team asks for' : 'Not uploaded yet'}</span>`}</span><span class="ledger-row__trail"><button class="btn btn--s ${docs.some((d) => d.status !== 'rejected') ? 'btn--ghost' : 'btn--secondary'}" type="button" data-action="upload" data-kind="${k}" data-year="${esc(y.academic_year)}">${icons.share} Upload</button></span></div>`; }).join('');
    return `<details class="section" ${open ? 'open' : ''} style="margin-top:24px">
      <summary class="row-between" style="cursor:pointer;list-style:none;padding:8px 0"><span class="display display-l">${esc(y.academic_year)}</span><span class="pill ${cls}">${label}</span></summary>
      ${y.fee_amount ? `<div class="secondary mt-2">Tuition of £${Number(y.fee_amount).toLocaleString('en-GB')} paid to your university by the foundation.</div>` : ''}
      ${y.notes ? `<div class="notice mt-4" style="margin-left:0;margin-right:0">${icons.info}<div>${esc(y.notes)}</div></div>` : ''}
      <div class="section__head mt-6"><span class="label">Key dates</span></div><div class="ledger">${dateRow('Enrolment confirmation', y.enrolment_due, 'enrolment_confirmation')}${dateRow('End-of-year transcript', y.transcript_due, 'transcript')}</div>
      <div class="section__head mt-6"><span class="label">Documents</span></div><div class="ledger">${checklist}</div>
    </details>`;
  };
  return `<div class="strand-hero"><h1 class="strand-hero__title">My scholarship</h1><p class="strand-hero__sub">The foundation pays your fees each year once it has your enrolment confirmation. Upload it here and the team confirms within a few days.</p></div>
    ${o.years.map((y, i) => year(y, i === 0)).join('')}`;
}

export function mount(root, { api }) {
  bindActions(root, {
    upload: (el) => {
      const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf,.jpg,.jpeg,.png';
      input.addEventListener('change', async () => { const f = input.files[0]; if (!f) return; if (f.size > 10 * 1024 * 1024) { toast('Keep it under 10 MB', { type: 'error' }); return; } toast('Uploading…'); try { await api.scholarship.upload(el.dataset.kind, el.dataset.year, f); toast('Uploaded. The team will review it.'); refresh(); } catch (e) { toast(e.message, { type: 'error' }); } });
      input.click();
    },
    remove: async (el) => { if (await confirm({ title: 'Remove this file?', body: 'You can upload another one.', confirmLabel: 'Remove', danger: true })) { await api.scholarship.remove(el.dataset.id); refresh(); } },
  });
}
