import { esc, time, dateLong, isSameDay } from '../format.js';
import { icons } from '../icons.js';
import { toast, emptyState } from '../ui.js';
import { avatar } from '../components/index.js';

export const header = ({ params, state }) => ({ title: state?.threadName || 'Messages', backTo: '/programme' });

export async function render({ api, params, me, state }) {
  const t = await api.messages.thread(params.id);
  if (!t.counterpart) return emptyState('No thread');
  state.threadName = t.counterpart.full_name;
  document.querySelector('.header__title') && (document.querySelector('.header__title').textContent = t.counterpart.full_name);
  let lastDay = null;
  const bubbles = t.messages.map((m) => { const dayHead = !lastDay || !isSameDay(lastDay, m.created_at) ? `<div class="meta" style="text-align:center;margin:12px 0 4px">${esc(dateLong(m.created_at))}</div>` : ''; lastDay = m.created_at; return `${dayHead}<div class="bubble ${m.sender_id === me.id ? 'bubble--me' : 'bubble--them'}">${esc(m.body)}<span class="bubble__time">${time(m.created_at)}</span></div>`; }).join('');
  return `
    <div class="wrap mt-4 row">${avatar(t.counterpart)}<div><div style="font-weight:500">${esc(t.counterpart.full_name)}</div><div class="secondary" style="font-size:13px">${esc(t.counterpart.currently || '')}</div></div></div>
    <div class="thread" id="thread">${bubbles || '<p class="secondary" style="text-align:center">Say salaam.</p>'}</div>
    <form class="composer" id="composer"><input class="input grow" name="body" placeholder="Message" autocomplete="off" maxlength="2000"><button class="btn btn--primary" type="submit" aria-label="Send" style="padding:0 14px">${icons.send}</button></form>`;
}

let unsubscribe = null;
export function mount(root, { api, params, me }) {
  const form = root.querySelector('#composer');
  const thread = root.querySelector('#thread');
  window.scrollTo(0, document.body.scrollHeight);
  unsubscribe?.();
  if (api.messages.subscribe) {
    unsubscribe = api.messages.subscribe(params.id, (m) => {
      if (m.sender_id === me.id || m.scholar_id !== me.id) return;
      const el = document.createElement('div'); el.className = 'bubble bubble--them'; el.innerHTML = `${esc(m.body)}<span class="bubble__time">${time(m.created_at)}</span>`; thread.appendChild(el);
      window.scrollTo(0, document.body.scrollHeight);
    });
    window.addEventListener('hashchange', () => { unsubscribe?.(); unsubscribe = null; }, { once: true });
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = form.body.value.trim(); if (!body) return;
    form.body.value = '';
    const el = document.createElement('div'); el.className = 'bubble bubble--me'; el.innerHTML = `${esc(body)}<span class="bubble__time">${time(new Date())}</span>`; thread.appendChild(el);
    window.scrollTo(0, document.body.scrollHeight);
    try { await api.messages.send(params.id, body); } catch (err) { toast(err.message, { type: 'error' }); }
  });
}
