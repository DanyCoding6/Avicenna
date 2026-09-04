// UI primitives: toasts, bottom sheets, confirm, skeletons.
import { khatam, icons } from './icons.js';
import { esc } from './format.js';

const $ = (sel, root = document) => root.querySelector(sel);

export function toast(message, { type = 'info', action, onAction, duration = 3200 } = {}) {
  const host = $('#toasts');
  const el = document.createElement('div');
  el.className = `toast${type === 'error' ? ' toast--error' : ''}`;
  el.setAttribute('role', 'status');
  el.innerHTML = `${type === 'error' ? '' : khatam()}<span>${esc(message)}</span>${action ? `<button class="toast__action" type="button">${esc(action)}</button>` : ''}`;
  if (action) el.querySelector('.toast__action').addEventListener('click', () => { onAction?.(); el.remove(); });
  host.appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity 200ms'; el.style.opacity = '0'; setTimeout(() => el.remove(), 220); }, duration);
  return el;
}

let currentSheet = null;
let closeTimer = null;
export function sheet({ title, body = '', actions = [], onMount, onClose, dismissible = true }) {
  closeSheet();
  clearTimeout(closeTimer);
  const root = $('#sheet-root');
  root.innerHTML = `
    <div class="sheet__scrim" data-close></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title || 'Sheet')}">
      <div class="sheet__grab"></div>
      <div class="sheet__head">
        <div class="sheet__title">${esc(title || '')}</div>
        ${dismissible ? `<button class="btn-icon" type="button" data-close aria-label="Close">${icons.x}</button>` : ''}
      </div>
      <div class="sheet__body">${body}</div>
      ${actions.length ? `<div class="sheet__actions">${actions.map((a, i) => `<button class="btn ${a.kind || 'btn--primary'}" type="button" data-action-idx="${i}">${esc(a.label)}</button>`).join('')}</div>` : ''}
    </div>`;
  root.setAttribute('data-open', '0');
  requestAnimationFrame(() => requestAnimationFrame(() => root.setAttribute('data-open', '1')));
  document.body.style.overflow = 'hidden';

  const api = { root, el: root.querySelector('.sheet'), body: root.querySelector('.sheet__body'), close: () => closeSheet() };
  currentSheet = { api, onClose };
  root.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => dismissible && closeSheet()));
  root.querySelectorAll('[data-action-idx]').forEach((b) => b.addEventListener('click', async () => {
    const a = actions[Number(b.dataset.actionIdx)];
    b.disabled = true;
    try { const r = await a.onClick?.(api); if (r !== false) closeSheet(); } finally { b.disabled = false; }
  }));
  onMount?.(api);
  return api;
}

export function closeSheet() {
  if (!currentSheet) return;
  const { api, onClose } = currentSheet;
  currentSheet = null;
  api.root.setAttribute('data-open', '0');
  document.body.style.overflow = '';
  closeTimer = setTimeout(() => { api.root.removeAttribute('data-open'); api.root.innerHTML = ''; }, 330);
  onClose?.();
}

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

export function confirm({ title, body, confirmLabel = 'Confirm', danger = false }) {
  return new Promise((resolve) => {
    let done = false;
    sheet({
      title, body: `<p class="secondary">${esc(body)}</p>`,
      actions: [
        { label: 'Cancel', kind: 'btn--ghost', onClick: () => { done = true; resolve(false); } },
        { label: confirmLabel, kind: danger ? 'btn--danger' : 'btn--primary', onClick: () => { done = true; resolve(true); } },
      ],
      onClose: () => { if (!done) resolve(false); },
    });
  });
}

export const skeletonRows = (n = 4) => `<div class="ledger">${Array.from({ length: n }, () => `
  <div class="skeleton-row"><div class="skeleton"></div><div><div class="skeleton" style="width:70%;height:16px"></div><div class="skeleton mt-2" style="width:45%"></div></div></div>`).join('')}</div>`;

export const emptyState = (title, sub = '') => `<div class="empty">${khatam()}<div class="empty__title">${esc(title)}</div>${sub ? `<div class="empty__sub">${esc(sub)}</div>` : ''}</div>`;

// One delegated click handler per root; re-binding on re-render replaces the previous one.
export function bindActions(root, handlers) {
  if (root._actionsHandler) root.removeEventListener('click', root._actionsHandler);
  root._actionsHandler = (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || !root.contains(el)) return;
    const fn = handlers[el.dataset.action];
    if (fn) { e.preventDefault(); fn(el, e); }
  };
  root.addEventListener('click', root._actionsHandler);
}
