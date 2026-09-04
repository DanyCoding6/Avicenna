import { esc, dayParts, dateFull, deadlineLabel, nl2p, daysUntil } from '../format.js';
import { icons } from '../icons.js';
import { refresh } from '../router.js';
import { bindActions, toast, sheet, emptyState, confirm } from '../ui.js';

export const header = { title: 'Opportunity', backTo: '/events?seg=opportunities' };
const KIND = { delegation: 'Delegation', internship: 'Internship', fellowship: 'Fellowship', competition: 'Competition', other: 'Opportunity' };

export async function render({ api, params }) {
  const o = await api.opportunities.get(params.id);
  if (!o) return emptyState('Not found');
  const d = dayParts(o.deadline);
  const closed = daysUntil(o.deadline) < 0;
  return `
    <div class="event-hero">
      <div class="event-hero__date"><span class="event-hero__num">${d.num}</span><span class="event-hero__mon">${d.mon} · deadline</span></div>
      <h1 class="event-hero__title">${esc(o.title)}</h1>
      <div class="event-hero__pills"><span class="pill pill--gilt">${KIND[o.kind] || 'Opportunity'}</span><span class="pill">${esc(o.organisation)}</span>${closed ? '<span class="pill">Closed</span>' : `<span class="pill ${daysUntil(o.deadline) <= 7 ? 'pill--coral' : 'pill--tile'}">${deadlineLabel(o.deadline)}</span>`}</div>
    </div>
    <div class="event-facts">
      <div class="fact">${icons.pin}<div><div class="fact__main">${esc(o.location)}</div></div></div>
      <div class="fact">${icons.clock}<div><div class="fact__main">Apply by ${esc(dateFull(o.deadline))}</div><div class="fact__sub">Nominations go through the foundation</div></div></div>
      ${o.link && o.link !== '#' ? `<div class="fact">${icons.external}<div><a href="${esc(o.link)}" target="_blank" rel="noopener">Read more at ${esc(new URL(o.link).hostname)}</a></div></div>` : ''}
    </div>
    <div class="prose">${nl2p(o.description || '')}</div>
    ${o.mine ? `<div class="notice mt-6">${icons.check}<div><strong style="color:var(--paper-100)">Interest expressed</strong> · status: <span class="gilt">${esc(o.mine.status)}</span><div class="mt-2" style="font-size:13px">“${esc(o.mine.statement)}”</div></div></div>` : ''}
    ${!closed ? `<div class="rsvp-bar">${o.mine ? `<button class="btn btn--danger" type="button" data-action="withdraw">Withdraw</button>` : `<button class="btn btn--primary" type="button" data-action="express">Express interest</button>`}</div>` : ''}`;
}

export function mount(root, { api, params, navigate }) {
    bindActions(root, {
    express: () => sheet({
      title: 'Express interest',
      body: `<label class="field"><span class="field__label label">Why you, in a few lines</span><textarea class="textarea" id="op-statement" maxlength="600" placeholder="What you would bring, and what you would bring back."></textarea><div class="field__hint">The programme team reads these to decide nominations. 600 characters max.</div></label>`,
      actions: [{ label: 'Submit', onClick: async (s) => { const v = s.body.querySelector('#op-statement').value.trim(); if (v.length < 20) { toast('A little more detail, please', { type: 'error' }); return false; } await api.opportunities.express(params.id, v); toast('Interest submitted'); refresh(); } }],
      onMount: (s) => s.body.querySelector('#op-statement').focus(),
    }),
    withdraw: async () => { if (await confirm({ title: 'Withdraw interest?', body: 'You can express interest again before the deadline.', confirmLabel: 'Withdraw', danger: true })) { await api.opportunities.withdraw(params.id); toast('Withdrawn'); refresh(); } },
  });
}
