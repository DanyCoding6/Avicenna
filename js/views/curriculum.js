import { esc, dateLong } from '../format.js';
import { icons } from '../icons.js';
import { bindActions, toast, emptyState } from '../ui.js';
import { spine, resourceRow } from '../components/index.js';
import { refresh } from '../router.js';

export const header = ({ params }) => (params.id ? { title: 'Chapter', backTo: '/programme/curriculum' } : { title: 'Curriculum', backTo: '/programme' });

export async function render({ api, params }) {
  if (params.id) {
    const m = await api.curriculum.module(params.id);
    if (!m) return emptyState('Chapter not found');
    return `
      <div class="strand-hero"><span class="label">Chapter ${m.position} · ${esc(m.theme)}</span><h1 class="strand-hero__title mt-2">${esc(m.title)}</h1><p class="strand-hero__sub">${esc(m.summary || 'Notes to follow after the session.')}</p><p class="meta mt-2">${new Date(m.taught_at) > new Date() ? 'Taught' : 'Taught'} ${dateLong(m.taught_at)}</p></div>
      <div class="wrap mt-6"><button class="btn ${m.done ? 'btn--on' : 'btn--secondary'} btn--block" type="button" data-action="toggle-done">${m.done ? `${icons.check} Completed` : 'Mark as completed'}</button></div>
      <section class="section"><div class="section__head"><span class="label">Resources</span></div>${m.resources.length ? `<div class="ledger">${m.resources.map(resourceRow).join('')}</div>` : '<p class="secondary">Recordings and readings appear here after the session.</p>'}</section>`;
  }
  const c = await api.curriculum.overview();
  return `
    <div class="strand-hero"><h1 class="strand-hero__title">Curriculum</h1><p class="strand-hero__sub">Twelve chapters on knowledge, character and leadership in the Islamic tradition.</p></div>
    <div class="wrap mt-6"><div class="row-between"><span class="label">Progress</span><span class="meta">${c.done} of ${c.total}</span></div><div class="mt-2">${spine(c)}</div></div>
    <div class="ledger mt-6" style="margin-left:var(--gutter);margin-right:var(--gutter)">${c.modules.map((m) => `
      <a class="module${m.done ? ' module--done' : m.id === c.current?.id ? ' module--current' : ''}" href="#/programme/curriculum/${esc(m.id)}">
        <span class="module__n">${m.position}</span>
        <span class="grow"><span class="module__title" style="display:block">${esc(m.title)}</span><span class="module__theme">${esc(m.theme)} · ${new Date(m.taught_at) > new Date() ? dateLong(m.taught_at) : `${m.resources.length} resources`}</span></span>
        <span class="ledger-row__trail">${m.done ? `<span class="tick">${icons.check}</span>` : ''}${icons.chevronRight}</span>
      </a>`).join('')}</div>`;
}

export function mount(root, { api, params }) {
  bindActions(root, {
    'toggle-done': async (el) => { const done = !el.classList.contains('btn--on'); await api.curriculum.setDone(params.id, done); toast(done ? 'Chapter completed' : 'Marked as not done'); refresh(); },
    'open-resource': () => toast('Available once Supabase storage is connected'),
  });
}
