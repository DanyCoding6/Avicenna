import { esc, firstName, greetingLine, daysUntil, monthName, plural, dayParts } from '../format.js';
import { icons, khatam } from '../icons.js';
import { skeletonRows, bindActions, toast } from '../ui.js';
import { pass, cadence, spine, sectionHead, announcementRow, opportunityRow, journalCard } from '../components/index.js';
import { prefs } from '../store.js';

export const header = { top: true };

export async function render({ api, me }) {
  const h = await api.home();
  const installable = !window.matchMedia('(display-mode: standalone)').matches && !prefs.get('install-dismissed') && !prefs.get('installed');
  const proj = h.project;
  const projDays = proj?.presentation ? daysUntil(proj.presentation.starts_at) : null;
  return `
    <section class="greeting girih-veil">
      <h1 class="greeting__salaam">Salaam, <em>${esc(firstName(me.full_name))}.</em></h1>
      <div class="greeting__line">${greetingLine()}. ${h.unread ? `${plural(h.unread, 'new message')} · ` : ''}${monthName()} at a glance.</div>
    </section>
    ${installable ? `<div class="install-row">${khatam('khatam')}<div class="grow"><div style="font-weight:500">Add Avicenna to your home screen</div><div class="secondary" style="font-size:13px">Opens full-screen, works offline.</div></div><button class="btn btn--s btn--secondary" type="button" data-action="install">How</button><button class="btn-icon" type="button" data-action="dismiss-install" aria-label="Dismiss">${icons.x}</button></div>` : ''}
    <section class="section" style="margin-top:20px">
      ${sectionHead('Next', { href: '/events' })}
      <div style="margin:0 calc(-1 * var(--gutter))">${pass(h.next, me)}</div>
    </section>
    <section class="section">
      ${sectionHead('This month')}
      <div class="home-strands">
        <a class="tile-card" href="#/programme/coaching"><span class="label">Coaching</span>${cadence(h.cadence, { showText: false })}<div class="tile-card__sub">${h.cadence.done + h.cadence.booked} of ${h.cadence.target} sessions ${h.cadence.done + h.cadence.booked >= 2 ? 'in the diary' : 'booked'}${h.cadence.done + h.cadence.booked < 2 ? ' · book one' : ''}</div></a>
        ${proj ? `<a class="tile-card" href="#/programme/project"><span class="label">Project</span><div class="tile-card__big">${projDays != null ? projDays : '–'}<small>days</small></div><div class="tile-card__sub">to presentation · next: ${esc(proj.next_milestone?.title || 'all done')}</div></a>` : ''}
      </div>
      <a class="tile-card mt-4" href="#/programme/curriculum" style="margin:12px var(--gutter) 0;display:block">
        <div class="row-between"><span class="label">Curriculum</span><span class="meta">${h.curriculum.done} / ${h.curriculum.total}</span></div>
        <div class="mt-2">${spine(h.curriculum)}</div>
        <div class="tile-card__sub">Chapter ${h.curriculum.current?.position} · ${esc(h.curriculum.current?.title || '')}</div>
      </a>
    </section>
    <section class="section">
      ${sectionHead('From the Foundation', { ornament: true })}
      <div class="ledger">${h.announcements.map(announcementRow).join('')}</div>
    </section>
    ${h.opportunities.length ? `<section class="section">${sectionHead('Closing soon', { href: '/events?seg=opportunities', linkText: 'All opportunities' })}<div class="ledger" style="margin:0 calc(-1 * var(--gutter))">${h.opportunities.map(opportunityRow).join('')}</div></section>` : ''}
    ${h.journal.length ? `<section class="section">${sectionHead('The Avicenna Journal', { href: '/journal', linkText: 'Read' })}<div class="hscroll" style="margin:0 calc(-1 * var(--gutter))">${h.journal.map(journalCard).join('')}</div></section>` : ''}
    <div class="rule-gilt">${khatam('khatam')}</div>
    <p class="wrap muted" style="text-align:center;font-size:13px">Avicenna Foundation · scholars' app</p>`;
}

export function mount(root, ctx) {
  bindActions(root, {
    install: () => window.avicenna.showInstallHelp(),
    'dismiss-install': (el) => { prefs.set('install-dismissed', true); el.closest('.install-row').remove(); },
    rsvp: async (el) => {
      const id = el.dataset.id;
      const going = el.classList.contains('btn--on');
      el.classList.toggle('btn--on', !going); el.classList.toggle('btn--primary', going);
      el.innerHTML = going ? 'RSVP' : `${icons.check} I'm going`;
      try { await ctx.api.events.rsvp(id, going ? null : 'going'); toast(going ? 'RSVP removed' : 'See you there'); }
      catch (e) { toast(e.message, { type: 'error' }); }
    },
  });
}
