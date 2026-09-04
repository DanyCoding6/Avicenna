import { esc, dateFull, nl2p, dayParts } from '../format.js';
import { emptyState } from '../ui.js';
import { avatar } from '../components/index.js';

export const header = ({ params }) => (params.id ? { title: 'Journal', backTo: '/journal' } : { title: 'The Avicenna Journal', backTo: '/home' });

export async function render({ api, params }) {
  if (params.id) {
    const j = await api.journal.get(params.id);
    if (!j) return emptyState('Entry not found');
    return `<article class="journal-entry">
      <div class="cover" style="margin:16px var(--gutter) 0"></div>
      <h1 class="journal-entry__title">${esc(j.title)}</h1>
      <div class="wrap meta mt-2">${esc(dateFull(j.occurred_on))} · ${esc(j.academic_year)}</div>
      <div class="prose">${nl2p(j.body)}</div>
      ${j.gallery ? `<div class="gallery">${Array.from({ length: j.gallery }, (_, i) => `<div class="cover" style="opacity:${1 - i * 0.12}"></div>`).join('')}</div>` : ''}
      ${j.tagged?.length ? `<section class="section"><div class="section__head"><span class="label">Scholars in this entry</span></div><div class="row" style="flex-wrap:wrap">${j.tagged.map((t) => `<a class="row" style="gap:8px;color:inherit" href="#/scholar/${esc(t.id)}">${avatar(t, 'avatar--s')}<span class="secondary">${esc(t.full_name)}</span></a>`).join('')}</div></section>` : ''}
    </article>`;
  }
  const list = await api.journal.list();
  const years = [...new Set(list.map((j) => j.academic_year))];
  return `<div class="events-head"><p class="secondary">What we did, year by year. Written by the foundation, lived by the scholars.</p></div>
    ${years.map((y) => `<div class="year-head"><span class="display display-l italic">${esc(y)}</span></div><div class="ledger">${list.filter((j) => j.academic_year === y).map((j) => { const d = dayParts(j.occurred_on); return `<a class="ledger-row ledger-row--pad" href="#/journal/${esc(j.id)}"><span class="ledger-row__date"><span class="ledger-row__num">${d.num}</span><span class="ledger-row__mon">${d.mon}</span></span><span class="ledger-row__body"><span class="ledger-row__title">${esc(j.title)}</span><span class="ledger-row__sub clamp-2">${esc(j.body)}</span></span></a>`; }).join('')}</div>`).join('')}`;
}
