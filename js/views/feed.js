import { esc } from '../format.js';
import { icons } from '../icons.js';
import { bindActions, toast, sheet, emptyState } from '../ui.js';
import { postCard } from '../components/index.js';
import { refresh } from '../router.js';

export async function render({ api }) {
  const posts = await api.feed.list();
  return `
    <div class="wrap mt-4 row"><button class="btn btn--primary grow" type="button" data-action="compose">${icons.plus} Post to the cohort</button></div>
    <div class="mt-4">${posts.length ? posts.map((p) => postCard(p)).join('') : emptyState('Quiet in here', 'Start something.')}</div>`;
}

export function mount(root, { api }) {
  bindActions(root, {
    like: async (el) => {
      const on = el.getAttribute('aria-pressed') === 'true';
      const n = el.querySelector('span'); const count = Number(n.textContent || 0);
      el.setAttribute('aria-pressed', String(!on)); n.textContent = (on ? count - 1 : count + 1) || '';
      try { await api.feed.toggleLike(el.dataset.id); } catch (e) { toast(e.message, { type: 'error' }); }
    },
    compose: () => composeSheet(api),
  });
}

export function composeSheet(api) {
  let kind = 'general';
  sheet({
    title: 'New post',
    body: `<div class="chips" style="padding:0 0 12px"><button class="chip" type="button" data-kind="general" aria-pressed="true">General</button><button class="chip" type="button" data-kind="ask" aria-pressed="false">Ask the cohort</button><button class="chip" type="button" data-kind="win" aria-pressed="false">Win</button></div>
      <textarea class="textarea" id="post-body" maxlength="1000" placeholder="What's happening?" style="min-height:140px"></textarea><div class="field__hint">Visible to all scholars, alumni and staff.</div>`,
    actions: [{ label: 'Post', onClick: async (s) => { const body = s.body.querySelector('#post-body').value.trim(); if (!body) { toast('Write something first', { type: 'error' }); return false; } await api.feed.create({ kind, body }); toast('Posted'); refresh(); } }],
    onMount: (s) => { s.body.querySelectorAll('[data-kind]').forEach((b) => b.addEventListener('click', () => { kind = b.dataset.kind; s.body.querySelectorAll('[data-kind]').forEach((x) => x.setAttribute('aria-pressed', x === b)); })); s.body.querySelector('#post-body').focus(); },
  });
}
