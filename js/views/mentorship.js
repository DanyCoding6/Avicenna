import { esc, dateLong, dateFull, relative } from '../format.js';
import { icons } from '../icons.js';
import { bindActions, toast, sheet, emptyState } from '../ui.js';
import { personCard } from '../components/index.js';
import { refresh } from '../router.js';

export const header = { title: 'Mentorship', backTo: '/programme' };

export async function render({ api }) {
  const m = await api.mentorship.overview();
  if (!m.mentor) return emptyState('Mentor to be assigned', 'The programme team matches you with a mentor in your first term.');
  return `
    <div class="strand-hero"><h1 class="strand-hero__title">Mentorship</h1><p class="strand-hero__sub">Career support from a professional in your field. Once a month, on Teams or in person.</p></div>
    <div class="panel mt-6">${personCard(m.mentor, 'Your mentor')}<p class="secondary mt-4">${esc(m.mentor.bio || '')}</p><div class="row mt-4"><a class="btn btn--ghost grow" href="#/thread/${esc(m.mentor.id)}">${icons.comment} Message</a><button class="btn btn--secondary grow" type="button" data-action="log">${icons.plus} Log a catch-up</button></div></div>
    <section class="section"><div class="section__head"><span class="label">Next catch-up</span></div>${m.next ? `<div style="font-weight:500">${esc(dateFull(m.next.met_at))}</div><div class="secondary">${relative(m.next.met_at)}</div>` : '<p class="secondary">Nothing scheduled. Agree a date in your thread and log it here.</p>'}</section>
    <section class="section"><div class="section__head"><span class="label label--muted">Meeting log</span></div>${m.log.length ? m.log.map((l) => `<div class="announcement"><div class="announcement__title">${esc(dateLong(l.met_at))}</div><div class="announcement__body">${esc(l.summary || 'No notes')}</div></div>`).join('') : '<p class="secondary">No meetings logged yet.</p>'}</section>`;
}

export function mount(root, { api }) {
  bindActions(root, {
    log: () => sheet({
      title: 'Log a catch-up',
      body: `<label class="field"><span class="field__label label">When</span><input class="input" type="datetime-local" id="mm-when"></label><label class="field"><span class="field__label label">What you covered</span><textarea class="textarea" id="mm-summary" placeholder="Leave empty if it is a future date."></textarea></label>`,
      actions: [{ label: 'Save', onClick: async (s) => { const when = s.body.querySelector('#mm-when').value; if (!when) { toast('Pick a date', { type: 'error' }); return false; } await api.mentorship.logMeeting({ met_at: new Date(when).toISOString(), summary: s.body.querySelector('#mm-summary').value.trim() || null }); toast('Logged'); refresh(); } }],
    }),
  });
}
