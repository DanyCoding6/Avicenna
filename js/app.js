// App bootstrap: data layer, auth gate, header/tab bar, routes, service worker, install prompts.
import { DEMO, APP_VERSION } from './config.js';
import { initData } from './data.js';
import { defineRoutes, onRoute, start, navigate, back } from './router.js';
import { icons, khatam } from './icons.js';
import { esc } from './format.js';
import { toast, sheet } from './ui.js';
import { avatar } from './components/index.js';
import { prefs } from './store.js';
import { brand } from './brand.js';
import { refresh } from './router.js';

import * as signin from './views/signin.js';
import * as home from './views/home.js';
import * as events from './views/events.js';
import * as event from './views/event.js';
import * as opportunity from './views/opportunities.js';
import * as programme from './views/programme.js';
import * as coaching from './views/coaching.js';
import * as curriculum from './views/curriculum.js';
import * as project from './views/project.js';
import * as mentorship from './views/mentorship.js';
import * as chaplaincy from './views/chaplaincy.js';
import * as hub from './views/hub.js';
import * as scholar from './views/scholar.js';
import * as post from './views/post.js';
import * as thread from './views/thread.js';
import * as journal from './views/journal.js';
import * as profile from './views/profile.js';
import * as staff from './views/staff.js';
import * as scholarship from './views/scholarship.js';

const $ = (s) => document.querySelector(s);
const TABS = [
  { id: 'home', label: 'Home', href: '#/home', icon: icons.home },
  { id: 'events', label: 'Events', href: '#/events', icon: icons.events },
  { id: 'coaching', label: 'Coaching', href: '#/coaching', icon: icons.compass },
  { id: 'programme', label: 'Programme', href: '#/programme', icon: icons.programme },
  { id: 'hub', label: 'Hub', href: '#/hub', icon: icons.hub },
];

const state = { me: null, api: null, session: null, installPrompt: null };

function renderTabs(activeTab) {
  $('#tabs').innerHTML = TABS.map((t) => `<a class="tab" href="${t.href}" ${t.id === activeTab ? 'aria-current="page"' : ''}>${t.icon}<span>${t.label}</span></a>`).join('');
}

function renderHeader(match, ctx) {
  const header = $('#header');
  const view = match.route.view;
  const h = typeof view.header === 'function' ? view.header(ctx) : view.header;
  if (h === null) { header.hidden = true; return; }
  header.hidden = false;
  if (!h || h.top) {
    const mark = brand.wordmarkSvg ? `<span class="wordmark__svg">${brand.wordmarkSvg}</span>` : `${brand.markSvg ? `<span class="wordmark__mark">${brand.markSvg}</span>` : khatam('khatam')}<span class="wordmark__text">${esc(brand.name)}</span>`;
    header.innerHTML = `<div class="header__bar">
      <a class="wordmark" href="#/home" aria-label="${esc(brand.name)} home">${mark}</a>
      <span class="row" style="gap:10px">${state.me?.role === 'staff' ? '<a class="pill pill--gilt" href="#/staff">Staff</a>' : ''}<a href="#/profile" aria-label="Your profile">${avatar(state.me, 'avatar--s')}</a></span>
    </div>`;
  } else {
    header.innerHTML = `<div class="header__bar">
      <button class="header__back" type="button" data-back>${icons.chevronLeft}<span>${esc(h.backLabel || 'Back')}</span></button>
      <div class="header__title truncate">${esc(h.title || '')}</div>
      <div style="width:44px;display:flex;justify-content:flex-end">${h.action || ''}</div>
    </div>`;
    header.querySelector('[data-back]').addEventListener('click', () => back(h.backTo || '/home'));
  }
}

function routes() {
  return [
    { path: '/home', tab: 'home', view: home },
    { path: '/events', tab: 'events', view: events },
    { path: '/events/:id', tab: 'events', view: event },
    { path: '/opportunities/:id', tab: 'events', view: opportunity },
    { path: '/coaching', tab: 'coaching', view: coaching },
    { path: '/programme', tab: 'programme', view: programme },
    { path: '/programme/coaching', tab: 'coaching', view: { render: () => { navigate('/coaching', { replace: true }); return ''; } } },
    { path: '/programme/curriculum', tab: 'programme', view: curriculum },
    { path: '/programme/curriculum/:id', tab: 'programme', view: curriculum },
    { path: '/programme/project', tab: 'programme', view: project },
    { path: '/programme/mentorship', tab: 'programme', view: mentorship },
    { path: '/programme/chaplaincy', tab: 'programme', view: chaplaincy },
    { path: '/thread/:id', tab: 'coaching', view: thread },
    { path: '/hub', tab: 'hub', view: hub },
    { path: '/hub/:segment', tab: 'hub', view: hub },
    { path: '/scholar/:id', tab: 'hub', view: scholar },
    { path: '/post/:id', tab: 'hub', view: post },
    { path: '/journal', tab: 'home', view: journal },
    { path: '/journal/:id', tab: 'home', view: journal },
    { path: '/profile', tab: 'home', view: profile },
    { path: '/scholarship', tab: 'home', view: scholarship },
    { path: '/staff', tab: 'home', view: staff },
    { path: '/staff/:section', tab: 'home', view: staff },
    { path: '*', tab: 'home', view: home },
  ];
}

async function boot() {
  state.api = await initData();
  document.documentElement.dataset.mode = state.api.mode;

  // Auth gate
  const authed = await requireSession();
  if (!authed) return;

  state.me = await state.api.me();
  defineRoutes(routes(), () => ({ me: state.me, api: state.api, refreshMe: async () => { state.me = await state.api.me(); return state.me; }, signOut, state }));
  onRoute((match, ctx) => { renderHeader(match, ctx); renderTabs(match.route.tab); });
  $('#tabbar').hidden = false;
  await start();
  if (navigator.onLine) state.api.flushQueue?.().catch(() => {});
  wirePullToRefresh();
  registerSW();
  wireInstall();
  wireNetwork();
}

async function requireSession() {
  if (DEMO) return true;
  const { getSession, onAuthChange } = await import('./auth.js');
  const session = await getSession();
  if (session) { state.session = session; onAuthChange((s) => { if (!s) location.reload(); }); return true; }
  $('#tabbar').hidden = true; $('#header').hidden = true;
  $('#view').innerHTML = signin.render({ api: state.api });
  signin.mount($('#view'), { api: state.api, onSignedIn: () => location.reload() });
  return false;
}

async function signOut() {
  await state.api.auth.signOut();
  if (DEMO) { toast('Demo data reset'); location.hash = '#/home'; location.reload(); }
}

function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js').then((reg) => {
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w?.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) {
          toast('Update available', { action: 'Reload', duration: 8000, onAction: () => { w.postMessage('SKIP_WAITING'); } });
        }
      });
    });
  }).catch(() => {});
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloading) { reloading = true; location.reload(); } });
}

function wireInstall() {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); state.installPrompt = e; document.dispatchEvent(new CustomEvent('avicenna:installable')); });
  window.addEventListener('appinstalled', () => { state.installPrompt = null; prefs.set('installed', true); toast('Avicenna is on your home screen'); });
}

export const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
export const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;

export function showInstallHelp() {
  if (state.installPrompt) { state.installPrompt.prompt(); return; }
  const ios = isIOS();
  sheet({
    title: 'Add Avicenna to your home screen',
    body: ios
      ? `<ol class="stack" style="padding-left:20px;list-style:decimal;color:var(--paper-300)">
           <li>Tap the <strong style="color:var(--paper-100)">Share</strong> button ${icons.share.replace('<svg', '<svg style="width:18px;height:18px;display:inline;vertical-align:-4px;stroke:var(--gilt-500)"')} at the bottom of Safari.</li>
           <li>Scroll and choose <strong style="color:var(--paper-100)">Add to Home Screen</strong>.</li>
           <li>Tap <strong style="color:var(--paper-100)">Add</strong>. Avicenna opens full-screen from then on.</li>
         </ol><p class="field__hint mt-4">Sign-in codes arrive by email, so you never need to leave the app once it is installed.</p>`
      : `<p class="secondary">Open the browser menu (⋮) and choose <strong style="color:var(--paper-100)">Install app</strong> or <strong style="color:var(--paper-100)">Add to Home screen</strong>.</p>`,
    actions: [{ label: 'Got it', kind: 'btn--primary' }],
  });
}

window.avicenna = { version: APP_VERSION, state, showInstallHelp, navigate };
boot().catch((err) => { console.error(err); $('#view').innerHTML = `<div class="empty"><div class="empty__title">Could not start</div><div class="empty__sub">${esc(err.message || err)}</div></div>`; });

// Pull to refresh on the four tab roots: a khatam that turns with the pull and spins while refreshing.
function wirePullToRefresh() {
  const ROOTS = new Set(['/home', '/events', '/coaching', '/programme', '/hub']);
  const el = document.createElement('div'); el.className = 'ptr'; el.innerHTML = khatam('khatam'); document.body.appendChild(el);
  const icon = el.querySelector('.khatam');
  let startY = 0, pulling = false, dist = 0;
  const THRESHOLD = 64;
  const eligible = () => window.scrollY <= 0 && ROOTS.has((location.hash.replace(/^#/, '') || '/home').split('?')[0].replace(/\/(scholars|feed|space)$/, ''));
  document.addEventListener('touchstart', (e) => { if (!eligible() || document.querySelector('#sheet-root[data-open]')) return; startY = e.touches[0].clientY; pulling = true; dist = 0; }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    if (!pulling) return;
    dist = Math.max(0, e.touches[0].clientY - startY);
    if (dist < 8) return;
    const p = Math.min(1, dist / THRESHOLD);
    icon.style.opacity = String(p); icon.style.transform = `translateY(${Math.min(dist, 96) * 0.5}px) rotate(${p * 180}deg)`;
    el.classList.toggle('ptr--armed', dist >= THRESHOLD);
  }, { passive: true });
  document.addEventListener('touchend', async () => {
    if (!pulling) return; pulling = false;
    if (dist >= THRESHOLD) {
      el.classList.add('ptr--refreshing'); icon.style.transform = 'translateY(32px)';
      try { await refresh(); } finally { setTimeout(() => { el.classList.remove('ptr--refreshing', 'ptr--armed'); icon.style.opacity = '0'; icon.style.transform = ''; }, 300); }
    } else { el.classList.remove('ptr--armed'); icon.style.opacity = '0'; icon.style.transform = ''; }
  });
}
window.avicennaRefresh = refresh;

function wireNetwork() {
  const set = () => document.body.classList.toggle('is-offline', !navigator.onLine);
  window.addEventListener('online', () => { set(); document.dispatchEvent(new CustomEvent('avicenna:online')); });
  window.addEventListener('offline', set);
  set();
}
