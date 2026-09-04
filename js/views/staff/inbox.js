import { esc, dateLong, time, relative, plural } from '../../format.js';
import { bindActions, toast, sheet, emptyState } from '../../ui.js';
import { avatar } from '../../components/index.js';
import { refresh } from '../../router.js';

const KIND = { enrolment_confirmation: 'Enrolment confirmation', transcript: 'Transcript', fee_invoice: 'Fee invoice', other: 'Document' };
const person = (p) => `<span class="row" style="gap:8px">${avatar(p, 'avatar--s')}<span><span style="display:block;font-weight:500">${esc(p?.full_name || 'Scholar')}</span><span class="secondary" style="font-size:13px">${esc(p?.cohort ? `Cohort ${p.cohort} · ${p.university || ''}` : p?.role || '')}</span></span></span>`;

export async function render({ api }) {
  const i = await api.staff.inbox();
  const empty = !i.space.length && !i.interest.length && !i.documents.length;
  return `
    ${empty ? emptyState('Inbox clear', 'Nothing waiting on you.') : ''}
    ${i.space.length ? `<section class="section"><div class="section__head"><span class="label">Adam Hub requests</span><span class="meta">${i.space.length}</span></div>${i.space.map((r) => `
      <div class="panel mb-2" style="margin-left:0;margin-right:0">${person(r.scholar)}
        <div class="mt-4" style="font-weight:500">${esc(r.purpose)}</div>
        <div class="secondary">${esc(dateLong(r.starts_at))} · ${time(r.starts_at)}–${time(r.ends_at)} · ${plural(r.headcount, 'person', 'people')}</div>
        <div class="row mt-4"><button class="btn btn--ghost grow" type="button" data-action="space" data-id="${esc(r.id)}" data-status="declined">Decline</button><button class="btn btn--primary grow" type="button" data-action="space" data-id="${esc(r.id)}" data-status="approved">Approve</button></div>
      </div>`).join('')}</section>` : ''}
    ${i.interest.length ? `<section class="section"><div class="section__head"><span class="label">Opportunity interest</span><span class="meta">${i.interest.length}</span></div>${i.interest.map((x) => `
      <div class="panel mb-2" style="margin-left:0;margin-right:0">${person(x.scholar)}
        <div class="mt-4 label">${esc(x.opportunity?.title || '')}</div>
        <p class="secondary mt-2" style="font-style:italic">“${esc(x.statement || '')}”</p>
        <div class="row" style="flex-wrap:wrap"><button class="btn btn--s btn--ghost" type="button" data-action="interest" data-op="${esc(x.opportunity_id)}" data-sid="${esc(x.scholar_id)}" data-status="unsuccessful">Not this time</button><button class="btn btn--s btn--secondary" type="button" data-action="interest" data-op="${esc(x.opportunity_id)}" data-sid="${esc(x.scholar_id)}" data-status="shortlisted">Shortlist</button><button class="btn btn--s btn--primary" type="button" data-action="interest" data-op="${esc(x.opportunity_id)}" data-sid="${esc(x.scholar_id)}" data-status="selected">Select</button></div>
      </div>`).join('')}</section>` : ''}
    ${i.documents.length ? `<section class="section"><div class="section__head"><span class="label">Documents to review</span><span class="meta">${i.documents.length}</span></div>${i.documents.map((d) => `
      <div class="panel mb-2" style="margin-left:0;margin-right:0">${person(d.scholar)}
        <div class="mt-4" style="font-weight:500">${esc(KIND[d.kind] || d.kind)} · ${esc(d.academic_year)}</div>
        <div class="secondary">${esc(d.filename)} · ${relative(d.uploaded_at)}${d.size_bytes ? ` · ${Math.round(d.size_bytes / 1024)} KB` : ''}</div>
        <div class="row mt-4"><button class="btn btn--quiet" type="button" data-action="open-doc" data-id="${esc(d.id)}">Open</button><button class="btn btn--ghost grow" type="button" data-action="doc" data-id="${esc(d.id)}" data-status="rejected">Reject</button><button class="btn btn--primary grow" type="button" data-action="doc" data-id="${esc(d.id)}" data-status="accepted">Accept</button></div>
      </div>`).join('')}</section>` : ''}`;
}

export function mount(root, { api }) {
  const withNote = (title, onSave) => sheet({ title, body: `<label class="field"><span class="field__label label">Note for the scholar</span><textarea class="textarea" id="note" placeholder="Optional"></textarea></label>`, actions: [{ label: 'Confirm', onClick: async (s) => { await onSave(s.body.querySelector('#note').value.trim() || null); refresh(); } }] });
  bindActions(root, {
    space: (el) => { const { id, status } = el.dataset; if (status === 'approved') { api.staff.space.decide(id, 'approved').then(() => { toast('Approved'); refresh(); }); } else withNote('Decline request', (note) => api.staff.space.decide(id, 'declined', note)); },
    interest: async (el) => { const { op, sid, status } = el.dataset; await api.staff.interest.setStatus(op, sid, status); toast(`Marked ${status}`); refresh(); },
    doc: (el) => { const { id, status } = el.dataset; if (status === 'accepted') { api.staff.documents.decide(id, 'accepted').then(() => { toast('Accepted'); refresh(); }); } else withNote('Reject document', (note) => api.staff.documents.decide(id, 'rejected', note)); },
    'open-doc': async (el) => { const i = await api.staff.inbox(); const d = i.documents.find((x) => x.id === el.dataset.id); const url = await api.staff.documents.url(d); if (url) window.open(url, '_blank', 'noopener'); else toast('Files open once Supabase storage is connected'); },
  });
}
