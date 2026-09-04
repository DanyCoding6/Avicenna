// Demo API: same surface as the Supabase API, backed by demo-data.js.
// Mutations persist in localStorage so RSVPs, likes and bookings survive a reload.
import * as D from '../demo-data.js';
import { cache } from '../store.js';
import { toDate, academicYear } from '../format.js';

const KEY = 'demo-state';
const clone = (x) => JSON.parse(JSON.stringify(x));
const uid = () => 'd-' + Math.random().toString(36).slice(2, 10);
const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms));

function load() {
  const saved = cache.get(KEY);
  const base = {
    rsvps: D.rsvps, coaching_sessions: D.coaching_sessions, messages: D.messages, mentor_meetings: D.mentor_meetings,
    module_progress: D.module_progress, projects: D.projects, chaplaincy_requests: D.chaplaincy_requests,
    opportunity_interest: D.opportunity_interest, space_requests: D.space_requests,
    hub_posts: D.hub_posts, hub_likes: D.hub_likes, hub_comments: D.hub_comments, me: D.scholars.find((s) => s.id === D.ME_ID),
    dismissed: [],
  };
  // Demo data is regenerated relative to "now" on every load; only user mutations are kept.
  if (!saved) return clone(base);
  return { ...clone(base), ...saved.mut, me: { ...base.me, ...(saved.me || {}) } };
}
let S = load();
const persist = () => cache.set(KEY, { mut: { rsvps: S.rsvps, coaching_sessions: S.coaching_sessions, messages: S.messages, mentor_meetings: S.mentor_meetings, module_progress: S.module_progress, projects: S.projects, chaplaincy_requests: S.chaplaincy_requests, opportunity_interest: S.opportunity_interest, space_requests: S.space_requests, hub_posts: S.hub_posts, hub_likes: S.hub_likes, hub_comments: S.hub_comments, dismissed: S.dismissed }, me: S.me });
export const resetDemo = () => { cache.del(KEY); S = load(); };

const ME = D.ME_ID;
const person = (id) => (id === ME ? S.me : D.scholars.find((s) => s.id === id)) || null;
const byStart = (a, b) => toDate(a.starts_at) - toDate(b.starts_at);
const visibleEvent = (e) => e.scope === 'foundation' || e.cohort === S.me.cohort;

function eventWithMeta(e) {
  const going = S.rsvps.filter((r) => r.event_id === e.id && r.status === 'going');
  const mine = S.rsvps.find((r) => r.event_id === e.id && r.scholar_id === ME);
  return { ...e, going_count: going.length, my_status: mine?.status || null, attendees: going.slice(0, 8).map((r) => person(r.scholar_id)).filter(Boolean) };
}

function monthCadence(d = new Date()) {
  const m = d.getMonth(), y = d.getFullYear();
  const mine = S.coaching_sessions.filter((s) => s.scholar_id === ME && ['booked', 'completed'].includes(s.status)).filter((s) => { const x = toDate(s.starts_at); return x.getMonth() === m && x.getFullYear() === y; }).sort(byStart);
  return { target: 2, sessions: mine, done: mine.filter((s) => s.status === 'completed').length, booked: mine.filter((s) => s.status === 'booked').length };
}

function projectView() {
  const p = S.projects.find((p) => p.members.includes(ME));
  if (!p) return null;
  const ev = D.events.find((e) => e.id === p.presentation_event_id);
  const next = p.milestones.find((m) => !m.done_at);
  return { ...p, members: p.members.map(person), presentation: ev, next_milestone: next, done_count: p.milestones.filter((m) => m.done_at).length };
}

function curriculumView() {
  const doneIds = new Set(S.module_progress.map((m) => m.module_id));
  const mods = D.curriculum_modules.map((m) => ({ ...m, done: doneIds.has(m.id), resources: D.resources.filter((r) => r.module_id === m.id) }));
  const current = mods.find((m) => !m.done) || mods[mods.length - 1];
  return { modules: mods, current, done: doneIds.size, total: mods.length };
}

const postView = (p) => ({ ...p, author: person(p.author_id), like_count: S.hub_likes.filter((l) => l.post_id === p.id).length, liked_by_me: S.hub_likes.some((l) => l.post_id === p.id && l.scholar_id === ME), comment_count: S.hub_comments.filter((c) => c.post_id === p.id).length });

export const api = {
  mode: 'demo',
  async me() { return { ...S.me, coach: person(S.me.coach_id), mentor: person(S.me.mentor_id) }; },
  async updateMe(patch) { S.me = { ...S.me, ...patch }; persist(); return api.me(); },
  async dismiss(key) { if (!S.dismissed.includes(key)) S.dismissed.push(key); persist(); },
  dismissed(key) { return S.dismissed.includes(key); },

  async home() {
    await wait();
    const upcoming = D.events.filter(visibleEvent).filter((e) => toDate(e.ends_at || e.starts_at) > new Date()).sort(byStart).map(eventWithMeta);
    const nextSession = S.coaching_sessions.filter((s) => s.scholar_id === ME && s.status === 'booked' && toDate(s.starts_at) > new Date()).sort(byStart)[0];
    const approvedSpace = S.space_requests.filter((r) => r.scholar_id === ME && r.status === 'approved' && toDate(r.starts_at) > new Date()).sort(byStart)[0];
    const candidates = [
      ...upcoming.slice(0, 3).map((e) => ({ type: 'event', at: e.starts_at, item: e })),
      nextSession && { type: 'coaching', at: nextSession.starts_at, item: { ...nextSession, coach: person(nextSession.coach_id) } },
      approvedSpace && { type: 'space', at: approvedSpace.starts_at, item: approvedSpace },
    ].filter(Boolean).sort((a, b) => toDate(a.at) - toDate(b.at));
    return {
      next: candidates[0] || null,
      cadence: monthCadence(),
      project: projectView(),
      curriculum: curriculumView(),
      announcements: [...D.announcements].sort((a, b) => (b.pinned - a.pinned) || (toDate(b.published_at) - toDate(a.published_at))).slice(0, 4),
      opportunities: D.opportunities.filter((o) => toDate(o.deadline) > new Date()).sort((a, b) => toDate(a.deadline) - toDate(b.deadline)).slice(0, 3),
      journal: [...D.journal_entries].sort((a, b) => toDate(b.occurred_on) - toDate(a.occurred_on)).slice(0, 4),
      unread: S.messages.filter((m) => m.scholar_id === ME && m.sender_id !== ME && !m.read_at).length,
    };
  },

  events: {
    async list() {
      await wait();
      const all = D.events.filter(visibleEvent).map(eventWithMeta);
      const nowT = new Date();
      return {
        upcoming: all.filter((e) => toDate(e.ends_at || e.starts_at) >= nowT).sort(byStart),
        past: all.filter((e) => toDate(e.ends_at || e.starts_at) < nowT).sort((a, b) => byStart(b, a)),
      };
    },
    async get(id) { await wait(80); const e = D.events.find((e) => e.id === id); return e && visibleEvent(e) ? eventWithMeta(e) : null; },
    async rsvp(id, status) {
      S.rsvps = S.rsvps.filter((r) => !(r.event_id === id && r.scholar_id === ME));
      if (status) S.rsvps.push({ event_id: id, scholar_id: ME, status });
      persist();
      return api.events.get(id);
    },
  },

  opportunities: {
    async list() { await wait(); return [...D.opportunities].sort((a, b) => toDate(a.deadline) - toDate(b.deadline)).map((o) => ({ ...o, mine: S.opportunity_interest.find((i) => i.opportunity_id === o.id) || null })); },
    async get(id) { await wait(60); const o = D.opportunities.find((o) => o.id === id); return o ? { ...o, mine: S.opportunity_interest.find((i) => i.opportunity_id === o.id) || null } : null; },
    async express(id, statement) { S.opportunity_interest = S.opportunity_interest.filter((i) => i.opportunity_id !== id); S.opportunity_interest.push({ opportunity_id: id, scholar_id: ME, statement, status: 'submitted', created_at: new Date().toISOString() }); persist(); return api.opportunities.get(id); },
    async withdraw(id) { S.opportunity_interest = S.opportunity_interest.filter((i) => i.opportunity_id !== id); persist(); return api.opportunities.get(id); },
  },

  programme: {
    async status() {
      await wait();
      const cad = monthCadence();
      const cur = curriculumView();
      const proj = projectView();
      const nextMeeting = S.mentor_meetings.filter((m) => m.scholar_id === ME && toDate(m.met_at) > new Date()).sort((a, b) => toDate(a.met_at) - toDate(b.met_at))[0];
      const openReq = S.chaplaincy_requests.find((r) => r.scholar_id === ME && r.status !== 'closed');
      return { cadence: cad, curriculum: cur, project: proj, mentor: person(S.me.mentor_id), coach: person(S.me.coach_id), chaplain: D.scholars.find((s) => s.role === 'chaplain'), nextMeeting, openChaplaincy: openReq || null,
        unread: { coach: S.messages.filter((m) => m.counterpart_id === S.me.coach_id && m.sender_id !== ME && !m.read_at).length, mentor: S.messages.filter((m) => m.counterpart_id === S.me.mentor_id && m.sender_id !== ME && !m.read_at).length } };
    },
  },

  coaching: {
    async overview() {
      await wait();
      const mine = S.coaching_sessions.filter((s) => s.scholar_id === ME);
      return {
        coach: person(S.me.coach_id), cadence: monthCadence(),
        upcoming: mine.filter((s) => s.status === 'booked' && toDate(s.starts_at) > new Date()).sort(byStart),
        past: mine.filter((s) => s.status === 'completed' || toDate(s.starts_at) < new Date()).sort((a, b) => byStart(b, a)),
        slots: S.coaching_sessions.filter((s) => s.status === 'open' && s.coach_id === S.me.coach_id && toDate(s.starts_at) > new Date()).sort(byStart),
      };
    },
    async book(id) { await wait(200); const s = S.coaching_sessions.find((s) => s.id === id); if (!s || s.status !== 'open') throw new Error('That slot has just been taken.'); s.status = 'booked'; s.scholar_id = ME; persist(); return s; },
    async cancel(id) { const s = S.coaching_sessions.find((s) => s.id === id && s.scholar_id === ME); if (s) { s.status = 'open'; s.scholar_id = null; persist(); } },
    async reflect(id, text) { const s = S.coaching_sessions.find((s) => s.id === id); if (s) { s.reflection = text; persist(); } },
  },

  messages: {
    async thread(counterpartId) { await wait(60); S.messages.forEach((m) => { if (m.counterpart_id === counterpartId && m.sender_id !== ME) m.read_at = m.read_at || new Date().toISOString(); }); persist(); return { counterpart: person(counterpartId), messages: S.messages.filter((m) => m.scholar_id === ME && m.counterpart_id === counterpartId).sort((a, b) => toDate(a.created_at) - toDate(b.created_at)) }; },
    async send(counterpartId, body) { const m = { id: uid(), scholar_id: ME, counterpart_id: counterpartId, sender_id: ME, body, created_at: new Date().toISOString() }; S.messages.push(m); persist(); return m; },
  },

  curriculum: {
    async overview() { await wait(); return curriculumView(); },
    async module(id) { await wait(60); const c = curriculumView(); return c.modules.find((m) => m.id === id) || null; },
    async setDone(id, done) { S.module_progress = S.module_progress.filter((m) => m.module_id !== id); if (done) S.module_progress.push({ scholar_id: ME, module_id: id, completed_at: new Date().toISOString() }); persist(); },
  },

  project: {
    async current() { await wait(); return projectView(); },
    async toggleMilestone(idx) { const p = S.projects.find((p) => p.members.includes(ME)); const m = p?.milestones[idx]; if (m) { m.done_at = m.done_at ? null : new Date().toISOString(); persist(); } return projectView(); },
  },

  mentorship: {
    async overview() { await wait(); const log = S.mentor_meetings.filter((m) => m.scholar_id === ME).sort((a, b) => toDate(b.met_at) - toDate(a.met_at)); return { mentor: person(S.me.mentor_id), next: log.filter((m) => toDate(m.met_at) > new Date()).pop() || null, log: log.filter((m) => toDate(m.met_at) <= new Date()) }; },
    async logMeeting({ met_at, summary }) { S.mentor_meetings.push({ id: uid(), scholar_id: ME, mentor_id: S.me.mentor_id, met_at, summary }); persist(); },
  },

  chaplaincy: {
    async overview() { await wait(); return { chaplain: D.scholars.find((s) => s.role === 'chaplain'), requests: S.chaplaincy_requests.filter((r) => r.scholar_id === ME).sort((a, b) => toDate(b.created_at) - toDate(a.created_at)) }; },
    async request(data) { S.chaplaincy_requests.push({ id: uid(), scholar_id: ME, status: 'open', created_at: new Date().toISOString(), ...data }); persist(); },
  },

  scholars: {
    async list() { await wait(); return D.scholars.filter((s) => ['scholar', 'alumni'].includes(s.role)).map((s) => (s.id === ME ? S.me : s)); },
    async get(id) { await wait(60); return person(id); },
  },

  feed: {
    async list() { await wait(); return [...S.hub_posts].sort((a, b) => (b.pinned - a.pinned) || (toDate(b.created_at) - toDate(a.created_at))).map(postView); },
    async get(id) { await wait(60); const p = S.hub_posts.find((p) => p.id === id); return p ? { ...postView(p), comments: S.hub_comments.filter((c) => c.post_id === id).sort((a, b) => toDate(a.created_at) - toDate(b.created_at)).map((c) => ({ ...c, author: person(c.author_id) })) } : null; },
    async create({ kind, body }) { const p = { id: uid(), author_id: ME, kind, body, image_path: null, pinned: false, created_at: new Date().toISOString() }; S.hub_posts.unshift(p); persist(); return postView(p); },
    async toggleLike(id) { const i = S.hub_likes.findIndex((l) => l.post_id === id && l.scholar_id === ME); if (i >= 0) S.hub_likes.splice(i, 1); else S.hub_likes.push({ post_id: id, scholar_id: ME }); persist(); return postView(S.hub_posts.find((p) => p.id === id)); },
    async comment(id, body) { const c = { id: uid(), post_id: id, author_id: ME, body, created_at: new Date().toISOString() }; S.hub_comments.push(c); persist(); return { ...c, author: person(ME) }; },
  },

  space: {
    async week() {
      await wait();
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
      const items = [
        ...S.space_requests.filter((r) => r.status === 'approved').map((r) => ({ type: 'booking', starts_at: r.starts_at, ends_at: r.ends_at, title: r.scholar_id === ME ? r.purpose : 'Booked', mine: r.scholar_id === ME, headcount: r.headcount })),
        ...D.events.filter((e) => e.venue === 'adam_hub' && visibleEvent(e)).map((e) => ({ type: 'event', id: e.id, starts_at: e.starts_at, ends_at: e.ends_at, title: e.title })),
      ].sort(byStart);
      return { days: days.map((d) => ({ date: d, items: items.filter((i) => toDate(i.starts_at).toDateString() === d.toDateString()) })), hours: '09:00–21:00, Monday to Friday', address: 'Adam Hub, 1 Great George Street, Westminster SW1P 3AA' };
    },
    async requests() { await wait(60); return S.space_requests.filter((r) => r.scholar_id === ME).sort((a, b) => toDate(b.starts_at) - toDate(a.starts_at)); },
    async apply(data) { S.space_requests.push({ id: uid(), scholar_id: ME, status: 'pending', created_at: new Date().toISOString(), ...data }); persist(); },
  },

  journal: {
    async list() { await wait(); return [...D.journal_entries].sort((a, b) => toDate(b.occurred_on) - toDate(a.occurred_on)).map((j) => ({ ...j, tagged: (j.tagged_scholars || []).map(person).filter(Boolean) })); },
    async get(id) { await wait(60); const j = D.journal_entries.find((j) => j.id === id); return j ? { ...j, tagged: (j.tagged_scholars || []).map(person).filter(Boolean), author: person(j.author_id) } : null; },
  },

  announcements: { async list() { await wait(); return [...D.announcements].sort((a, b) => (b.pinned - a.pinned) || (toDate(b.published_at) - toDate(a.published_at))); } },
  auth: {
    async signIn() { return { ok: true }; },
    async verify() { return { ok: true }; },
    async signOut() { resetDemo(); },
  },
};
export const currentAcademicYear = academicYear();
