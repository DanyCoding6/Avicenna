// Pure render functions shared across views. All return HTML strings.
import { esc, dayParts, time, range, daysUntil, initials, relative, plural, deadlineLabel } from '../format.js';
import { icons, khatam } from '../icons.js';

export const avatar = (p, size = '') => {
  if (!p) return `<span class="avatar ${size}">?</span>`;
  const cls = `avatar ${size}${p.role === 'coach' || p.role === 'mentor' ? ' avatar--gilt' : ''}`;
  return p.avatar_url ? `<span class="${cls}"><img src="${esc(p.avatar_url)}" alt="${esc(p.full_name)}"></span>` : `<span class="${cls}" aria-hidden="true">${esc(initials(p.full_name))}</span>`;
};

export const sectionHead = (label, { href, linkText = 'See all', ornament = false } = {}) => `
  <div class="section__head">
    <span class="label">${ornament ? khatam('khatam') : ''}${esc(label)}</span>
    ${href ? `<a class="section__link" href="#${href}">${esc(linkText)} ${icons.chevronRight.replace('<svg', '<svg style="width:14px;height:14px;display:inline;vertical-align:-2px"')}</a>` : ''}
  </div>`;

export const pillFor = (e) => {
  const bits = [];
  if (e.kind === 'retreat') bits.push('<span class="pill pill--gilt">Retreat</span>');
  if (e.kind === 'reception') bits.push('<span class="pill pill--gilt">Reception</span>');
  if (e.kind === 'presentation') bits.push('<span class="pill pill--gilt">Presentation</span>');
  if (e.scope === 'cohort') bits.push(`<span class="pill">Cohort ${esc(e.cohort)}</span>`);
  if (e.venue === 'online') bits.push('<span class="pill pill--lapis">Online</span>');
  if (e.venue === 'adam_hub') bits.push('<span class="pill">Adam Hub</span>');
  return bits.join(' ');
};

export const isLive = (e) => { const s = new Date(e.starts_at) - 15 * 60000, en = new Date(e.ends_at || e.starts_at); const n = Date.now(); return n >= s && n <= en; };

export const eventRow = (e, { muted = false } = {}) => {
  const d = dayParts(e.starts_at);
  const live = isLive(e);
  const sub = e.venue === 'online' ? `${time(e.starts_at)} · Online` : `${time(e.starts_at)} · ${esc(e.location || '')}`;
  return `<a class="ledger-row ledger-row--pad${muted ? ' ledger-row--muted' : ''}" href="#/events/${esc(e.id)}">
    <span class="ledger-row__date"><span class="ledger-row__num">${d.num}</span><span class="ledger-row__mon">${d.mon}</span></span>
    <span class="ledger-row__body">
      <span class="ledger-row__title clamp-2">${esc(e.title)}</span>
      <span class="ledger-row__sub truncate">${live ? '<span class="pill pill--tile pill--live">Live</span> ' : ''}${sub}</span>
      <span class="ledger-row__meta">${e.scope === 'cohort' ? `Cohort ${esc(e.cohort)}` : 'Foundation'}${e.kind === 'retreat' ? ' · Retreat' : ''}${e.going_count ? ` · ${e.going_count} going` : ''}</span>
    </span>
    <span class="ledger-row__trail">${e.my_status === 'going' ? `<span class="tick" title="You are going">${icons.check}</span>` : ''}${icons.chevronRight}</span>
  </a>`;
};

export const opportunityRow = (o) => {
  const d = dayParts(o.deadline);
  const n = daysUntil(o.deadline);
  return `<a class="ledger-row ledger-row--pad${n < 0 ? ' ledger-row--muted' : ''}" href="#/opportunities/${esc(o.id)}">
    <span class="ledger-row__date"><span class="ledger-row__num">${d.num}</span><span class="ledger-row__mon">${d.mon}</span></span>
    <span class="ledger-row__body">
      <span class="ledger-row__title clamp-2">${esc(o.title)}</span>
      <span class="ledger-row__sub truncate">${esc(o.organisation)} · ${esc(o.location)}</span>
      <span class="ledger-row__meta deadline${n >= 0 && n <= 7 ? ' deadline--soon' : ''}">${deadlineLabel(o.deadline)}${o.mine ? ` · <span class="gilt">${esc(o.mine.status)}</span>` : ''}</span>
    </span>
    <span class="ledger-row__trail">${o.mine ? `<span class="tick">${icons.check}</span>` : ''}${icons.chevronRight}</span>
  </a>`;
};

export const strandRow = ({ href, icon, title, status, badge = 0, confidential = false }) => `
  <a class="ledger-row ledger-row--pad${confidential ? ' ledger-row--confidential' : ''}" href="#${href}">
    <span class="ledger-row__icon">${icon}</span>
    <span class="ledger-row__body">
      <span class="ledger-row__title">${esc(title)}</span>
      <span class="ledger-row__sub">${status}</span>
    </span>
    <span class="ledger-row__trail">${badge ? `<span class="pill pill--coral">${badge}</span>` : ''}${icons.chevronRight}</span>
  </a>`;

export const cadence = (c, { showText = true } = {}) => {
  const dots = [];
  for (let i = 0; i < c.target; i++) {
    const s = c.sessions[i];
    const cls = s ? (s.status === 'completed' ? 'cadence__dot--done' : 'cadence__dot--booked') : '';
    dots.push(`<span class="cadence__dot ${cls}" title="${s ? esc(range(s.starts_at, s.ends_at)) : 'Not booked'}">${s ? icons.check : ''}</span>`);
  }
  const n = c.done + c.booked;
  const text = n >= c.target ? `<strong>Both sessions ${c.done === c.target ? 'done' : 'in the diary'}</strong><span class="secondary">Well kept.</span>`
    : n === 0 ? `<strong>Nothing booked yet</strong><span class="secondary">Two sessions this month</span>`
    : `<strong>${n} of ${c.target} booked</strong><span class="secondary">${c.done ? `${c.done} done · ` : ''}one more to book</span>`;
  return `<div class="cadence"><div class="cadence__dots">${dots.join('')}</div>${showText ? `<div class="cadence__text">${text}</div>` : ''}</div>`;
};

export const spine = (cur) => `<div class="spine" role="img" aria-label="${cur.done} of ${cur.total} chapters complete">${cur.modules.map((m) => `<span class="spine__stroke${m.done ? ' spine__stroke--done' : m.id === cur.current?.id ? ' spine__stroke--current' : ''}"></span>`).join('')}</div>`;

export const rail = (milestones) => {
  const nextIdx = milestones.findIndex((m) => !m.done_at);
  return `<div class="rail">${milestones.map((m, i) => {
    const cls = m.done_at ? 'rail__item--done' : i === nextIdx ? 'rail__item--next' : m.final ? 'rail__item--final' : '';
    const n = daysUntil(m.due_on);
    const when = m.done_at ? `Done ${relative(m.done_at)}` : n < 0 ? `Overdue by ${plural(-n, 'day')}` : n === 0 ? 'Due today' : `Due ${dayParts(m.due_on).num} ${dayParts(m.due_on).mon} · in ${plural(n, 'day')}`;
    return `<div class="rail__item ${cls}"><button class="rail__node" type="button" data-action="toggle-milestone" data-idx="${i}" aria-label="${m.done_at ? 'Mark not done' : 'Mark done'}">${m.done_at || m.final ? khatam('') : khatam('')}</button><div class="rail__title">${esc(m.title)}</div><div class="rail__meta">${when}</div></div>`;
  }).join('')}</div>`;
};

export const seasonHero = (e) => {
  const n = daysUntil(e.starts_at);
  return `<a class="season" href="#/events/${esc(e.id)}">
    <div class="season__kicker label">Retreat · ${esc(range(e.starts_at, e.ends_at))}</div>
    <div class="season__title">${esc(e.title)}</div>
    <div class="season__sub">${esc(e.location)}${e.going_count ? ` · ${e.going_count} going` : ''}</div>
    <div class="season__foot">
      <div class="season__days">${n}<small>${n === 1 ? 'day away' : 'days away'}</small></div>
      <span class="btn ${e.my_status === 'going' ? 'btn--on' : 'btn--primary'}">${e.my_status === 'going' ? `${icons.check} Going` : 'RSVP'}</span>
    </div>
  </a>`;
};

export const pass = (next, me) => {
  if (!next) return `<div class="pass pass--empty">${khatam('khatam')}<div class="mt-4 display display-m italic">A quiet week.</div><div class="secondary mt-2">Nothing in the diary yet. Book a coaching session or browse events.</div></div>`;
  const { type, item } = next;
  const d = dayParts(item.starts_at);
  let kind, title, sub, foot, href;
  if (type === 'event') {
    kind = item.kind === 'retreat' ? 'Retreat' : item.scope === 'cohort' ? `Cohort ${item.cohort}` : 'Foundation event';
    title = item.title; sub = `${range(item.starts_at, item.ends_at)}<br>${esc(item.location)}`; href = `#/events/${item.id}`;
    foot = `<button class="btn ${item.my_status === 'going' ? 'btn--on' : 'btn--primary'}" type="button" data-action="rsvp" data-id="${esc(item.id)}">${item.my_status === 'going' ? `${icons.check} I'm going` : 'RSVP'}</button><span class="pass__count">${item.going_count ? `${item.going_count} going` : ''}</span>`;
  } else if (type === 'coaching') {
    kind = 'Coaching session'; title = `With ${item.coach?.full_name || 'your coach'}`; sub = `${range(item.starts_at, item.ends_at)}<br>Online`; href = '#/programme/coaching';
    foot = `<a class="btn btn--primary" href="${esc(item.meeting_link || '#')}" target="_blank" rel="noopener">${icons.video} Join</a><span class="pass__count">${relative(item.starts_at)}</span>`;
  } else {
    kind = 'Adam Hub booking'; title = item.purpose; sub = `${range(item.starts_at, item.ends_at)}<br>Adam Hub, Westminster`; href = '#/hub/space';
    foot = `<span class="pill pill--tile">Approved</span><span class="pass__count">${plural(item.headcount, 'person', 'people')}</span>`;
  }
  return `<div class="pass girih-veil">
    <a class="pass__top" href="${href}">
      <span class="pass__date"><span class="pass__num">${d.num}</span><span class="pass__mon">${d.mon}</span></span>
      <span><span class="label pass__kind">${esc(kind)}</span><span class="pass__title" style="display:block">${esc(title)}</span><span class="pass__sub" style="display:block">${sub}</span></span>
    </a>
    <div class="pass__tear"></div>
    <div class="pass__bottom">${foot}</div>
  </div>`;
};

export const postCard = (p, { link = true } = {}) => `
  <article class="post${p.pinned ? ' post--pinned' : ''}" data-post="${esc(p.id)}">
    <div class="post__head">
      <a href="#/scholar/${esc(p.author?.id)}">${avatar(p.author)}</a>
      <div class="post__who">
        <div class="post__name truncate">${esc(p.author?.full_name || 'Scholar')}</div>
        <div class="post__meta truncate">${p.author?.role === 'alumni' ? 'Alumni' : `Cohort ${esc(p.author?.cohort || '')}`} · ${relative(p.created_at)}</div>
      </div>
      ${p.kind === 'ask' ? '<span class="pill pill--lapis">Ask</span>' : p.kind === 'win' ? '<span class="pill pill--gilt">Win</span>' : ''}${p.pinned ? ` <span class="pill pill--gilt">${khatam('khatam').replace('class="khatam"', 'style="width:10px;height:10px"')} Pinned</span>` : ''}
    </div>
    ${link ? `<a href="#/post/${esc(p.id)}" style="color:inherit;display:block" class="post__body">${esc(p.body)}</a>` : `<div class="post__body">${esc(p.body)}</div>`}
    ${p.image_url ? `<div class="post__image"><img src="${esc(p.image_url)}" alt="" loading="lazy"></div>` : ''}
    <div class="post__actions">
      <button class="post__action" type="button" data-action="like" data-id="${esc(p.id)}" aria-pressed="${p.liked_by_me}">${icons.heart}<span>${p.like_count || ''}</span></button>
      <a class="post__action" href="#/post/${esc(p.id)}">${icons.comment}<span>${p.comment_count || ''}</span></a>
    </div>
  </article>`;

export const scholarRow = (s) => `
  <a class="scholar" href="#/scholar/${esc(s.id)}">
    ${avatar(s)}
    <span class="grow">
      <span class="scholar__name truncate" style="display:block">${esc(s.full_name)}</span>
      <span class="scholar__line truncate" style="display:block">${esc(s.role === 'alumni' ? (s.currently || '') : `${s.subject} · ${s.university}`)}</span>
    </span>
    <span class="scholar__cohort">${s.role === 'alumni' ? 'ALUMNI' : `'${esc(String(s.cohort).slice(2))}`}</span>
  </a>`;

export const resourceRow = (r) => `
  <a class="resource" href="${esc(r.url || '#')}" ${r.url && r.url !== '#' ? 'target="_blank" rel="noopener"' : 'data-action="open-resource"'} data-id="${esc(r.id)}">
    <span class="resource__icon">${r.kind === 'recording' ? icons.play : r.kind === 'pdf' ? icons.file : icons.link}</span>
    <span class="grow"><span class="resource__title clamp-2" style="display:block">${esc(r.title)}</span><span class="resource__meta">${r.kind === 'recording' ? `Recording · ${esc(r.duration || '')}` : r.kind === 'pdf' ? `PDF · ${r.pages || ''} pages` : 'Link'}</span></span>
    <span class="ledger-row__trail">${r.kind === 'link' ? icons.external : icons.chevronRight}</span>
  </a>`;

export const announcementRow = (a) => `
  <article class="announcement">
    <div class="announcement__title">${a.pinned ? khatam('khatam') : ''}${esc(a.title)}</div>
    <div class="announcement__body clamp-3">${esc(a.body)}</div>
    <div class="announcement__meta meta">${relative(a.published_at)}</div>
  </article>`;

export const journalCard = (j) => `
  <a class="journal-card" href="#/journal/${esc(j.id)}">
    <div class="cover girih" style="background-image: linear-gradient(135deg, rgba(20,34,74,.9), rgba(12,24,48,.95)), url('')"></div>
    <div class="journal-card__body"><div class="journal-card__title clamp-2">${esc(j.title)}</div><div class="meta mt-2">${esc(dayParts(j.occurred_on).num)} ${esc(dayParts(j.occurred_on).mon)} · ${esc(j.academic_year)}</div></div>
  </a>`;

export const segmented = (items, selected) => `<div class="segmented" role="tablist">${items.map((it) => `<button class="segmented__item" role="tab" type="button" data-action="segment" data-value="${esc(it.value)}" aria-selected="${it.value === selected}">${esc(it.label)}${it.count != null ? `<span class="segmented__count">${it.count}</span>` : ''}</button>`).join('')}</div>`;

export const chips = (items, selected, action = 'chip') => `<div class="chips">${items.map((it) => `<button class="chip" type="button" data-action="${action}" data-value="${esc(it.value)}" aria-pressed="${it.value === selected}">${esc(it.label)}</button>`).join('')}</div>`;

export const personCard = (p, role) => `
  <div class="person">${avatar(p, 'avatar--l')}<div class="grow"><div class="person__name">${esc(p?.full_name || '')}</div><div class="person__role">${esc(p?.currently || role || '')}</div></div></div>`;
