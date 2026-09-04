import { esc, relative } from '../format.js';
import { icons } from '../icons.js';
import { bindActions, toast, emptyState } from '../ui.js';
import { postCard, avatar } from '../components/index.js';

export const header = { title: 'Post', backTo: '/hub/feed' };

const commentHtml = (c) => `<div class="post" style="padding-left:calc(var(--gutter) + 12px)"><div class="post__head">${avatar(c.author, 'avatar--s')}<div class="post__who"><div class="post__name">${esc(c.author?.full_name || '')}</div><div class="post__meta">${relative(c.created_at)}</div></div></div><div class="post__body" style="margin-top:8px">${esc(c.body)}</div></div>`;

export async function render({ api, params }) {
  const p = await api.feed.get(params.id);
  if (!p) return emptyState('Post not found');
  return `${postCard(p, { link: false })}
    <div id="comments">${p.comments.map(commentHtml).join('')}</div>
    <form class="composer" id="comment-form"><input class="input grow" name="body" placeholder="Reply" autocomplete="off" maxlength="500"><button class="btn btn--primary" type="submit" aria-label="Send" style="padding:0 14px">${icons.send}</button></form>`;
}

export function mount(root, { api, params }) {
  bindActions(root, {
    like: async (el) => { const on = el.getAttribute('aria-pressed') === 'true'; const n = el.querySelector('span'); const count = Number(n.textContent || 0); el.setAttribute('aria-pressed', String(!on)); n.textContent = (on ? count - 1 : count + 1) || ''; try { await api.feed.toggleLike(el.dataset.id); } catch (e) { toast(e.message, { type: 'error' }); } },
  });
  const form = root.querySelector('#comment-form');
  form.addEventListener('submit', async (e) => { e.preventDefault(); const body = form.body.value.trim(); if (!body) return; form.body.value = ''; const c = await api.feed.comment(params.id, body); root.querySelector('#comments').insertAdjacentHTML('beforeend', commentHtml(c)); });
}
