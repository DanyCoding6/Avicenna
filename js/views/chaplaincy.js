import { esc, relative } from '../format.js';
import { icons } from '../icons.js';
import { bindActions, toast, sheet } from '../ui.js';
import { personCard } from '../components/index.js';
import { refresh } from '../router.js';

export const header = { title: 'Chaplaincy', backTo: '/programme' };

export async function render({ api }) {
  const c = await api.chaplaincy.overview();
  return `
    <div class="strand-hero"><div class="row" style="gap:8px;color:var(--lapis-300)">${icons.lock.replace('<svg', '<svg style="width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.5"')}<span class="label" style="color:var(--lapis-300)">Confidential</span></div><h1 class="strand-hero__title mt-2">Chaplaincy</h1><p class="strand-hero__sub">Religious and pastoral support, in confidence. Nothing here is shared with the programme team or your coach.</p></div>
    <div class="panel panel--confidential mt-6">${personCard(c.chaplain, 'Foundation chaplain')}<p class="secondary mt-4">${esc(c.chaplain?.bio || '')}</p><button class="btn btn--lapis btn--block mt-4" type="button" data-action="request">Request a conversation</button></div>
    <div class="notice notice--lapis mt-4">${icons.lock}<div>The app stores only your preferred times and how you would like to be contacted. Say as little or as much as you want; the conversation itself happens off the app.</div></div>
    ${c.requests.length ? `<section class="section"><div class="section__head"><span class="label label--muted">Your requests</span></div>${c.requests.map((r) => `<div class="announcement"><div class="announcement__title">${esc(r.channel === 'in_person' ? 'In person' : r.channel === 'video' ? 'Video call' : 'Phone call')} <span class="pill ${r.status === 'open' ? 'pill--lapis' : r.status === 'contacted' ? 'pill--tile' : ''}">${esc(r.status)}</span></div><div class="announcement__body">${esc(r.preferred_times)}</div><div class="announcement__meta meta">${relative(r.created_at)}</div></div>`).join('')}</section>` : ''}`;
}

export function mount(root, { api }) {
  bindActions(root, {
    request: () => sheet({
      title: 'Request a conversation',
      body: `
        <div class="label mb-2">How</div>
        <div class="chips" style="padding:0 0 12px"><button class="chip" type="button" data-ch="phone" aria-pressed="true">Phone</button><button class="chip" type="button" data-ch="video" aria-pressed="false">Video</button><button class="chip" type="button" data-ch="in_person" aria-pressed="false">In person</button></div>
        <label class="field"><span class="field__label label">When suits you</span><input class="input" id="ch-times" placeholder="e.g. weekday evenings after 7"></label>
        <label class="field"><span class="field__label label">Anything you want to say (optional)</span><textarea class="textarea" id="ch-note" maxlength="300" placeholder="Kept short and deleted once the request is closed."></textarea></label>`,
      actions: [{ label: 'Send request', kind: 'btn--lapis', onClick: async (s) => { const times = s.body.querySelector('#ch-times').value.trim(); if (!times) { toast('Tell us when suits you', { type: 'error' }); return false; } const channel = s.body.querySelector('[data-ch][aria-pressed=true]').dataset.ch; await api.chaplaincy.request({ channel, preferred_times: times, note: s.body.querySelector('#ch-note').value.trim() || null }); toast('Request sent in confidence'); refresh(); } }],
      onMount: (s) => s.body.querySelectorAll('[data-ch]').forEach((b) => b.addEventListener('click', () => s.body.querySelectorAll('[data-ch]').forEach((x) => x.setAttribute('aria-pressed', x === b)))),
    }),
  });
}
