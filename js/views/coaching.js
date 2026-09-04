import { esc, range, dayParts, time, weekday, relative, monthName } from '../format.js';
import { icons } from '../icons.js';
import { bindActions, toast, sheet, confirm, emptyState, skeletonPage, haptic } from '../ui.js';
import { cadence, personCard } from '../components/index.js';
import { refresh } from '../router.js';

export const header = { top: true };
export const skeleton = () => skeletonPage({ rows: 3 });

const sessionRow = (s, { past = false } = {}) => { const d = dayParts(s.starts_at); return `
  <div class="ledger-row${past ? ' ledger-row--muted' : ''}">
    <span class="ledger-row__date"><span class="ledger-row__num">${d.num}</span><span class="ledger-row__mon">${d.mon}</span></span>
    <span class="ledger-row__body"><span class="ledger-row__title">${weekday(s.starts_at)} ${time(s.starts_at)}–${time(s.ends_at)}</span><span class="ledger-row__sub">${past ? (s.status === 'completed' ? 'Completed' : 'Missed') : `Online · ${relative(s.starts_at)}`}${s.reflection ? ' · reflection saved' : ''}</span></span>
    <span class="ledger-row__trail">${past ? `<button class="btn btn--quiet btn--s" type="button" data-action="reflect" data-id="${esc(s.id)}">${s.reflection ? 'Edit' : 'Reflect'}</button>` : `<a class="btn btn--s btn--primary" href="${esc(s.meeting_link || '#')}" target="_blank" rel="noopener">Join</a><button class="btn-icon" type="button" data-action="cancel" data-id="${esc(s.id)}" aria-label="Cancel session">${icons.x}</button>`}</span>
  </div>`; };

export async function render({ api }) {
  const c = await api.coaching.overview();
  return `
    <div class="events-head"><h1>Coaching</h1><p class="secondary mt-2">Two sessions a month with your coach. Fifty minutes, online, yours.</p></div>
    <div class="panel mt-6">${personCard(c.coach, 'Your coach')}<div class="row mt-4"><a class="btn btn--ghost grow" href="#/thread/${esc(c.coach?.id)}">${icons.comment} Message</a><button class="btn btn--primary grow" type="button" data-action="book">${icons.plus} Book a session</button></div></div>
    <section class="section"><div class="section__head"><span class="label">${monthName()}</span></div>${cadence(c.cadence)}</section>
    <section class="section"><div class="section__head"><span class="label">Upcoming</span></div>${c.upcoming.length ? `<div class="ledger">${c.upcoming.map((s) => sessionRow(s)).join('')}</div>` : `<p class="secondary">Nothing booked. ${c.slots.length ? `${c.slots.length} open slots this fortnight.` : ''}</p>`}</section>
    <section class="section"><div class="section__head"><span class="label label--muted">Past</span></div>${c.past.length ? `<div class="ledger">${c.past.slice(0, 6).map((s) => sessionRow(s, { past: true })).join('')}</div>` : '<p class="secondary">No sessions yet.</p>'}</section>`;
}

export function mount(root, { api }) {
  bindActions(root, {
    book: async () => {
      const c = await api.coaching.overview();
      if (!c.slots.length) { toast('No open slots right now'); return; }
      let chosen = null;
      sheet({
        title: 'Book a session',
        body: `<p class="secondary">${esc(c.coach?.full_name || 'Your coach')}'s open slots. Pick one.</p><div class="slot-grid mt-4">${c.slots.map((s) => `<button class="slot" type="button" data-slot="${esc(s.id)}"><div class="slot__day">${weekday(s.starts_at)} ${dayParts(s.starts_at).num} ${dayParts(s.starts_at).mon}</div><div class="slot__time">${time(s.starts_at)}</div></button>`).join('')}</div>`,
        actions: [{ label: 'Confirm booking', onClick: async () => { if (!chosen) { toast('Pick a slot first', { type: 'error' }); return false; } try { await api.coaching.book(chosen); haptic(); toast('Session booked'); refresh(); } catch (e) { toast(e.message, { type: 'error' }); refresh(); } } }],
        onMount: (s) => s.body.querySelectorAll('[data-slot]').forEach((b) => b.addEventListener('click', () => { chosen = b.dataset.slot; s.body.querySelectorAll('[data-slot]').forEach((x) => x.setAttribute('aria-pressed', x === b)); })),
      });
    },
    cancel: async (el) => { if (await confirm({ title: 'Cancel this session?', body: 'The slot goes back to your coach\'s calendar for others to book.', confirmLabel: 'Cancel session', danger: true })) { await api.coaching.cancel(el.dataset.id); toast('Session cancelled'); refresh(); } },
    reflect: (el) => sheet({
      title: 'After the session',
      body: `<label class="field"><span class="field__label label">Two or three lines, just for you</span><textarea class="textarea" id="reflection" placeholder="What shifted? What will you try before next time?"></textarea><div class="field__hint">Private. Your coach cannot see this.</div></label>`,
      actions: [{ label: 'Save', onClick: async (s) => { await api.coaching.reflect(el.dataset.id, s.body.querySelector('#reflection').value.trim()); toast('Saved'); refresh(); } }],
    }),
  });
}
