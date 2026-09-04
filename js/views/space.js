import { esc, time, dayParts, weekday, dateLong, relative, isSameDay } from '../format.js';
import { icons } from '../icons.js';
import { bindActions, toast, sheet } from '../ui.js';
import { refresh } from '../router.js';

export async function render({ api }) {
  const [w, mine] = await Promise.all([api.space.week(), api.space.requests()]);
  const today = new Date();
  const dayHtml = w.days.map((d) => `<div class="week__day${isSameDay(d.date, today) ? ' week__day--today' : ''}"><div class="week__dow">${weekday(d.date).slice(0, 2)}</div><div class="week__num">${d.date.getDate()}</div><div class="week__dots">${d.items.slice(0, 3).map((i) => `<i class="${i.type === 'event' || i.mine ? '' : 'busy'}"></i>`).join('')}</div></div>`).join('');
  const listed = w.days.filter((d) => d.items.length);
  return `
    <div class="wrap mt-4"><div class="row-between"><div><div style="font-weight:500">This week at the Hub</div><div class="secondary" style="font-size:13px">${esc(w.hours)}</div></div><button class="btn btn--primary btn--s" type="button" data-action="apply">${icons.plus} Apply to use</button></div></div>
    <div class="week mt-4">${dayHtml}</div>
    <div class="wrap mt-4">${listed.length ? listed.map((d) => `<div class="label label--muted mt-4" style="display:block">${esc(dateLong(d.date))}</div>${d.items.map((i) => `<div class="space-slot"><span class="space-slot__time">${time(i.starts_at)}<br>${time(i.ends_at)}</span><span class="grow">${i.type === 'event' ? `<a href="#/events/${esc(i.id)}" style="color:inherit;font-weight:500">${esc(i.title)}</a><div class="secondary" style="font-size:13px">Foundation event</div>` : `<span style="font-weight:500">${esc(i.title)}</span><div class="secondary" style="font-size:13px">${i.mine ? `Your booking · ${i.headcount} people` : 'Space in use'}</div>`}</span>${i.type === 'event' ? `<span class="pill pill--gilt">Event</span>` : i.mine ? '<span class="pill pill--tile">Yours</span>' : ''}</div>`).join('')}`).join('') : '<p class="secondary">Nothing booked this week. The space is yours.</p>'}</div>
    <div class="notice mt-6">${icons.building}<div>${esc(w.address)}. Ring the bell; a staff member lets you in. Requests are approved by the programme team, usually within a working day.</div></div>
    <section class="section"><div class="section__head"><span class="label label--muted">Your requests</span></div>${mine.length ? mine.map((r) => `<div class="announcement"><div class="announcement__title">${esc(r.purpose)} <span class="pill ${r.status === 'approved' ? 'pill--tile' : r.status === 'declined' ? 'pill--coral' : 'pill--gilt'}">${esc(r.status)}</span></div><div class="announcement__body">${esc(dateLong(r.starts_at))} · ${time(r.starts_at)}–${time(r.ends_at)} · ${r.headcount} ${r.headcount === 1 ? 'person' : 'people'}</div>${r.staff_note ? `<div class="announcement__body">Note: ${esc(r.staff_note)}</div>` : ''}</div>`).join('') : '<p class="secondary">None yet.</p>'}</section>`;
}

export function mount(root, { api }) {
  bindActions(root, {
    apply: () => sheet({
      title: 'Apply to use the Adam Hub',
      body: `
        <label class="field"><span class="field__label label">Date</span><input class="input" type="date" id="sp-date" min="${new Date().toISOString().slice(0, 10)}"></label>
        <div class="row mt-4"><label class="field grow"><span class="field__label label">From</span><input class="input" type="time" id="sp-from" value="10:00" min="09:00" max="21:00"></label><label class="field grow" style="margin-top:0"><span class="field__label label">Until</span><input class="input" type="time" id="sp-to" value="13:00" min="09:00" max="21:00"></label></div>
        <label class="field"><span class="field__label label">Purpose</span><input class="input" id="sp-purpose" maxlength="120" placeholder="Project meeting, study, society planning…"></label>
        <label class="field"><span class="field__label label">How many people</span><input class="input" type="number" id="sp-n" value="1" min="1" max="12"></label>
        <div class="field__hint">Open 09:00–21:00 Monday to Friday, up to 12 people, bookable six weeks ahead.</div>`,
      actions: [{ label: 'Send request', onClick: async (s) => {
        const q = (id) => s.body.querySelector(id).value;
        if (!q('#sp-date') || !q('#sp-purpose').trim()) { toast('Date and purpose are needed', { type: 'error' }); return false; }
        const starts_at = new Date(`${q('#sp-date')}T${q('#sp-from')}`), ends_at = new Date(`${q('#sp-date')}T${q('#sp-to')}`);
        if (ends_at <= starts_at) { toast('End time must be after start', { type: 'error' }); return false; }
        await api.space.apply({ date: q('#sp-date'), starts_at: starts_at.toISOString(), ends_at: ends_at.toISOString(), purpose: q('#sp-purpose').trim(), headcount: Number(q('#sp-n')) || 1 });
        toast('Request sent'); refresh();
      } }],
    }),
  });
}
