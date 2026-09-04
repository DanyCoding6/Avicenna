// Supabase API. Same surface as data/demo.js so views never know which one they are talking to.
import { getClient } from '../supabase.js';
import { SUPABASE_URL } from '../config.js';
import { sendCode, verifyCode, signOut as authSignOut } from '../auth.js';
import { queue, cache } from '../store.js';
import { toDate } from '../format.js';

const sb = () => getClient();
const uid = () => sb().auth.getSession().then(({ data }) => data.session?.user?.id);
let ME = null; // cached profile row
const must = ({ data, error }) => { if (error) throw new Error(error.message || String(error)); return data; };
const nowIso = () => new Date().toISOString();
const byStart = (a, b) => toDate(a.starts_at) - toDate(b.starts_at);
const PERSON = 'id, full_name, university, subject, year_of_study, cohort, role, avatar_url, currently, bio, linkedin_url, interests';

async function people(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return new Map();
  const rows = must(await sb().from('scholars').select(PERSON).in('id', unique));
  return new Map(rows.map((r) => [r.id, r]));
}
async function person(id) { if (!id) return null; if (ME && id === ME.id) return ME; return must(await sb().from('directory').select('*').eq('id', id).maybeSingle()); }
async function me() {
  if (ME) return ME;
  const id = await uid();
  ME = must(await sb().from('directory').select('*').eq('id', id).single());
  return ME;
}

// Offline-tolerant mutation: run now, or queue when offline and let the caller keep its optimistic state.
async function mutate(kind, payload, run) {
  if (!navigator.onLine) { queue.push({ kind, payload }); return { queued: true }; }
  return run();
}
export async function flushQueue() {
  await queue.flush(async ({ kind, payload }) => {
    if (kind === 'rsvp') await rsvpNow(payload.id, payload.status);
    else if (kind === 'like') await must(await sb().rpc('toggle_like', { p_post: payload.id }));
    else if (kind === 'comment') await must(await sb().from('hub_comments').insert({ post_id: payload.id, author_id: payload.me, body: payload.body }));
    else if (kind === 'module') { if (payload.done) await must(await sb().from('module_progress').upsert({ scholar_id: payload.me, module_id: payload.id })); else await must(await sb().from('module_progress').delete().match({ scholar_id: payload.me, module_id: payload.id })); }
  });
}
document.addEventListener('avicenna:online', () => flushQueue().catch(() => {}));

async function rsvpNow(id, status) {
  const m = await me();
  if (status) return must(await sb().from('rsvps').upsert({ event_id: id, scholar_id: m.id, status }, { onConflict: 'event_id,scholar_id' }));
  return must(await sb().from('rsvps').delete().match({ event_id: id, scholar_id: m.id }));
}

function eventVisible(e, m) { return e.scope === 'foundation' || e.cohort === m.cohort; }

async function eventsAll() {
  const rows = must(await sb().from('events_with_my_rsvp').select('*').order('starts_at'));
  return rows;
}
async function attendees(eventId) {
  const rows = must(await sb().from('rsvps').select('scholar:scholars(id, full_name, avatar_url, role, cohort)').eq('event_id', eventId).eq('status', 'going').limit(8));
  return rows.map((r) => r.scholar).filter(Boolean);
}

async function cadence() {
  const [row] = must(await sb().rpc('my_month_cadence'));
  const m = await me();
  const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
  const sessions = must(await sb().from('coaching_sessions').select('*').eq('scholar_id', m.id).in('status', ['booked', 'completed']).gte('starts_at', start.toISOString()).order('starts_at'));
  return { target: row?.target ?? 2, done: row?.done ?? 0, booked: row?.booked ?? 0, sessions };
}

async function curriculumView() {
  const m = await me();
  const [mods, prog, res] = await Promise.all([
    must(await sb().from('curriculum_modules').select('*').order('position')),
    must(await sb().from('module_progress').select('module_id').eq('scholar_id', m.id)),
    must(await sb().from('resources').select('*').order('published_at', { ascending: false })),
  ]);
  const done = new Set(prog.map((p) => p.module_id));
  const modules = mods.map((x) => ({ ...x, done: done.has(x.id), resources: res.filter((r) => r.module_id === x.id) }));
  const current = modules.find((x) => !x.done) || modules[modules.length - 1] || null;
  return { modules, current, done: done.size, total: modules.length };
}

async function projectView() {
  const m = await me();
  const rows = must(await sb().from('projects').select('*, project_members(scholar_id), presentation:events(id, title, starts_at, ends_at, location)').order('created_at', { ascending: false }).limit(1));
  const p = rows[0]; if (!p) return null;
  const ids = p.project_members.map((x) => x.scholar_id);
  const map = await people(ids);
  const milestones = p.milestones || [];
  return { ...p, members: ids.map((id) => map.get(id) || { id, full_name: 'Scholar' }), presentation: p.presentation || null, milestones, next_milestone: milestones.find((x) => !x.done_at) || null, done_count: milestones.filter((x) => x.done_at).length };
}

export const api = {
  mode: 'supabase',
  flushQueue,
  async me() { const m = await me(); return { ...m, coach: await person(m.coach_id), mentor: await person(m.mentor_id) }; },
  async updateMe(patch) { const m = await me(); must(await sb().from('scholars').update(patch).eq('id', m.id)); ME = null; return api.me(); },
  async dismiss(key) { cache.set('dismiss:' + key, true); },
  dismissed(key) { return !!cache.get('dismiss:' + key); },

  async home() {
    const m = await me();
    const now = nowIso();
    const [events, sessions, space, cad, project, curriculum, announcements, opportunities, journal, unread] = await Promise.all([
      must(await sb().from('events_with_my_rsvp').select('*').gte('ends_at', now).order('starts_at').limit(3)),
      must(await sb().from('coaching_sessions').select('*').eq('scholar_id', m.id).eq('status', 'booked').gte('starts_at', now).order('starts_at').limit(1)),
      must(await sb().from('space_requests').select('*').eq('scholar_id', m.id).eq('status', 'approved').gte('starts_at', now).order('starts_at').limit(1)),
      cadence(), projectView(), curriculumView(),
      must(await sb().from('announcements').select('*').order('pinned', { ascending: false }).order('published_at', { ascending: false }).limit(4)),
      must(await sb().from('opportunities').select('*').gte('deadline', now).order('deadline').limit(3)),
      must(await sb().from('journal_entries').select('id, title, occurred_on, academic_year, cover_url').order('occurred_on', { ascending: false }).limit(4)),
      sb().from('messages').select('id', { count: 'exact', head: true }).eq('scholar_id', m.id).neq('sender_id', m.id).is('read_at', null),
    ]);
    const candidates = [
      ...events.map((e) => ({ type: 'event', at: e.starts_at, item: e })),
      sessions[0] && { type: 'coaching', at: sessions[0].starts_at, item: { ...sessions[0], coach: await person(sessions[0].coach_id) } },
      space[0] && { type: 'space', at: space[0].starts_at, item: space[0] },
    ].filter(Boolean).sort((a, b) => toDate(a.at) - toDate(b.at));
    return { next: candidates[0] || null, cadence: cad, project, curriculum, announcements, opportunities, journal, unread: unread.count || 0 };
  },

  events: {
    async list() {
      const all = await eventsAll(); const t = new Date();
      return { upcoming: all.filter((e) => toDate(e.ends_at || e.starts_at) >= t).sort(byStart), past: all.filter((e) => toDate(e.ends_at || e.starts_at) < t).sort((a, b) => byStart(b, a)) };
    },
    async get(id) {
      const e = must(await sb().from('events_with_my_rsvp').select('*').eq('id', id).maybeSingle());
      if (!e) return null;
      return { ...e, attendees: await attendees(id) };
    },
    async rsvp(id, status) { await mutate('rsvp', { id, status }, () => rsvpNow(id, status)); return api.events.get(id); },
  },

  opportunities: {
    async list() {
      const m = await me();
      const [ops, mine] = await Promise.all([must(await sb().from('opportunities').select('*').order('deadline')), must(await sb().from('opportunity_interest').select('*').eq('scholar_id', m.id))]);
      return ops.map((o) => ({ ...o, mine: mine.find((i) => i.opportunity_id === o.id) || null }));
    },
    async get(id) { const m = await me(); const o = must(await sb().from('opportunities').select('*').eq('id', id).maybeSingle()); if (!o) return null; return { ...o, mine: must(await sb().from('opportunity_interest').select('*').match({ opportunity_id: id, scholar_id: m.id }).maybeSingle()) }; },
    async express(id, statement) { const m = await me(); must(await sb().from('opportunity_interest').upsert({ opportunity_id: id, scholar_id: m.id, statement, status: 'submitted' })); return api.opportunities.get(id); },
    async withdraw(id) { const m = await me(); must(await sb().from('opportunity_interest').delete().match({ opportunity_id: id, scholar_id: m.id })); return api.opportunities.get(id); },
  },

  programme: {
    async status() {
      const m = await me();
      const [cad, curriculum, project, mentor, coach, chaplainRows, meetings, openReq, unreadRows] = await Promise.all([
        cadence(), curriculumView(), projectView(), person(m.mentor_id), person(m.coach_id),
        must(await sb().from('directory').select('*').eq('role', 'chaplain').limit(1)),
        must(await sb().from('mentor_meetings').select('*').eq('scholar_id', m.id).gte('met_at', nowIso()).order('met_at').limit(1)),
        must(await sb().from('chaplaincy_requests').select('*').eq('scholar_id', m.id).neq('status', 'closed').order('created_at', { ascending: false }).limit(1)),
        must(await sb().from('messages').select('counterpart_id').eq('scholar_id', m.id).neq('sender_id', m.id).is('read_at', null)),
      ]);
      return { cadence: cad, curriculum, project, mentor, coach, chaplain: chaplainRows[0] || null, nextMeeting: meetings[0] || null, openChaplaincy: openReq[0] || null,
        unread: { coach: unreadRows.filter((r) => r.counterpart_id === m.coach_id).length, mentor: unreadRows.filter((r) => r.counterpart_id === m.mentor_id).length } };
    },
  },

  coaching: {
    async overview() {
      const m = await me(); const now = nowIso();
      const [mine, slots, cad] = await Promise.all([
        must(await sb().from('coaching_sessions').select('*').eq('scholar_id', m.id).order('starts_at')),
        m.coach_id ? must(await sb().from('coaching_sessions').select('*').eq('coach_id', m.coach_id).eq('status', 'open').gte('starts_at', now).order('starts_at').limit(12)) : [],
        cadence(),
      ]);
      return { coach: await person(m.coach_id), cadence: cad, upcoming: mine.filter((s) => s.status === 'booked' && s.starts_at > now), past: mine.filter((s) => s.status === 'completed' || s.starts_at < now).reverse(), slots };
    },
    async book(id) { return must(await sb().rpc('book_session', { session_id: id })); },
    async cancel(id) { must(await sb().rpc('cancel_session', { session_id: id })); },
    async reflect(id, text) { must(await sb().from('coaching_sessions').update({ reflection: text }).eq('id', id)); },
  },

  messages: {
    async thread(counterpartId) {
      const m = await me();
      const [rows, counterpart] = await Promise.all([must(await sb().from('messages').select('*').eq('scholar_id', m.id).eq('counterpart_id', counterpartId).order('created_at')), person(counterpartId)]);
      sb().rpc('mark_thread_read', { p_counterpart: counterpartId }).then(() => {});
      return { counterpart, messages: rows };
    },
    async send(counterpartId, body) { const m = await me(); return must(await sb().from('messages').insert({ scholar_id: m.id, counterpart_id: counterpartId, sender_id: m.id, body }).select().single()); },
    subscribe(counterpartId, onMessage) {
      const ch = sb().channel(`thread-${counterpartId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `counterpart_id=eq.${counterpartId}` }, (p) => onMessage(p.new)).subscribe();
      return () => sb().removeChannel(ch);
    },
  },

  curriculum: {
    async overview() { return curriculumView(); },
    async module(id) { const c = await curriculumView(); return c.modules.find((x) => x.id === id) || null; },
    async setDone(id, done) { const m = await me(); await mutate('module', { id, done, me: m.id }, async () => { if (done) must(await sb().from('module_progress').upsert({ scholar_id: m.id, module_id: id })); else must(await sb().from('module_progress').delete().match({ scholar_id: m.id, module_id: id })); }); },
  },
  resources: {
    async url(r) { if (r.url) return r.url; if (!r.storage_path) return null; const { data, error } = await sb().storage.from('resources').createSignedUrl(r.storage_path, 3600); if (error) throw new Error(error.message); return data.signedUrl; },
  },

  project: {
    async current() { return projectView(); },
    async toggleMilestone(idx) { const p = await projectView(); if (!p) return null; const ms = p.milestones.map((x, i) => (i === idx ? { ...x, done_at: x.done_at ? null : nowIso() } : x)); must(await sb().from('projects').update({ milestones: ms }).eq('id', p.id)); return projectView(); },
    async upload(file) { const p = await projectView(); const path = `${p.id}/${Date.now()}-${file.name}`; const { error } = await sb().storage.from('project-deliverables').upload(path, file); if (error) throw new Error(error.message); must(await sb().from('projects').update({ deliverable_path: path, status: 'submitted' }).eq('id', p.id)); },
  },

  mentorship: {
    async overview() { const m = await me(); const log = must(await sb().from('mentor_meetings').select('*').eq('scholar_id', m.id).order('met_at', { ascending: false })); const now = nowIso(); return { mentor: await person(m.mentor_id), next: log.filter((x) => x.met_at > now).pop() || null, log: log.filter((x) => x.met_at <= now) }; },
    async logMeeting({ met_at, summary }) { const m = await me(); must(await sb().from('mentor_meetings').insert({ scholar_id: m.id, mentor_id: m.mentor_id, met_at, summary })); },
  },

  chaplaincy: {
    async overview() { const m = await me(); const [ch, reqs] = await Promise.all([must(await sb().from('directory').select('*').eq('role', 'chaplain').limit(1)), must(await sb().from('chaplaincy_requests').select('*').eq('scholar_id', m.id).order('created_at', { ascending: false }))]); return { chaplain: ch[0] || null, requests: reqs }; },
    async request(data) { const m = await me(); must(await sb().from('chaplaincy_requests').insert({ scholar_id: m.id, ...data })); },
  },

  scholars: {
    async list() { return must(await sb().from('directory').select('*').in('role', ['scholar', 'alumni']).order('full_name')); },
    async get(id) { return person(id); },
  },

  feed: {
    async list() {
      const posts = must(await sb().from('hub_feed').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(50));
      const map = await people(posts.map((p) => p.author_id));
      return Promise.all(posts.map(async (p) => ({ ...p, author: map.get(p.author_id), image_url: await api.feed.imageUrl(p.image_path) })));
    },
    async get(id) {
      const p = must(await sb().from('hub_feed').select('*').eq('id', id).maybeSingle()); if (!p) return null;
      const comments = must(await sb().from('hub_comments').select('*').eq('post_id', id).order('created_at'));
      const map = await people([p.author_id, ...comments.map((c) => c.author_id)]);
      return { ...p, author: map.get(p.author_id), image_url: await api.feed.imageUrl(p.image_path), comments: comments.map((c) => ({ ...c, author: map.get(c.author_id) })) };
    },
    async create({ kind, body, file }) {
      const m = await me(); let image_path = null;
      if (file) { const path = `${m.id}/${Date.now()}-${file.name}`; const { error } = await sb().storage.from('hub-images').upload(path, file); if (error) throw new Error(error.message); image_path = path; }
      return must(await sb().from('hub_posts').insert({ author_id: m.id, kind, body, image_path }).select().single());
    },
    async toggleLike(id) { return mutate('like', { id }, async () => must(await sb().rpc('toggle_like', { p_post: id }))); },
    async comment(id, body) { const m = await me(); const r = await mutate('comment', { id, body, me: m.id }, async () => must(await sb().from('hub_comments').insert({ post_id: id, author_id: m.id, body }).select().single())); return { ...(r.queued ? { id: 'q', post_id: id, author_id: m.id, body, created_at: nowIso() } : r), author: m }; },
    async imageUrl(path) { if (!path) return null; const { data } = await sb().storage.from('hub-images').createSignedUrl(path, 3600); return data?.signedUrl || null; },
  },

  space: {
    async week() {
      const start = new Date(); start.setHours(0, 0, 0, 0); const end = new Date(start); end.setDate(end.getDate() + 7);
      const items = must(await sb().rpc('space_calendar_week', { p_from: start.toISOString(), p_to: end.toISOString() }));
      const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return { date: d, items: items.filter((x) => toDate(x.starts_at).toDateString() === d.toDateString()).map((x) => ({ ...x, id: x.event_id })) }; });
      return { days, hours: '09:00–21:00, Monday to Friday', address: 'Adam Hub, Westminster' };
    },
    async requests() { const m = await me(); return must(await sb().from('space_requests').select('*').eq('scholar_id', m.id).order('starts_at', { ascending: false })); },
    async apply({ starts_at, ends_at, purpose, headcount }) { const m = await me(); must(await sb().from('space_requests').insert({ scholar_id: m.id, starts_at, ends_at, purpose, headcount })); },
  },

  journal: {
    async list() { const rows = must(await sb().from('journal_entries').select('*').order('occurred_on', { ascending: false })); const map = await people(rows.flatMap((j) => j.tagged_scholars || [])); return rows.map((j) => ({ ...j, gallery: Array.isArray(j.gallery) ? j.gallery.length : 0, tagged: (j.tagged_scholars || []).map((id) => map.get(id)).filter(Boolean) })); },
    async get(id) { const j = must(await sb().from('journal_entries').select('*').eq('id', id).maybeSingle()); if (!j) return null; const map = await people([...(j.tagged_scholars || []), j.author_id]); return { ...j, gallery: Array.isArray(j.gallery) ? j.gallery.length : 0, tagged: (j.tagged_scholars || []).map((x) => map.get(x)).filter(Boolean), author: map.get(j.author_id) }; },
  },

  announcements: { async list() { return must(await sb().from('announcements').select('*').order('pinned', { ascending: false }).order('published_at', { ascending: false })); } },

  scholarship: {
    async overview() {
      const m = await me();
      const [years, docs] = await Promise.all([
        must(await sb().from('scholarship_years').select('*').eq('scholar_id', m.id).order('academic_year', { ascending: false })),
        must(await sb().from('scholar_documents').select('*').eq('scholar_id', m.id).order('uploaded_at', { ascending: false })),
      ]);
      return { years: years.map((y) => ({ ...y, documents: docs.filter((d) => d.academic_year === y.academic_year) })), current: years[0]?.academic_year || null };
    },
    async upload(kind, academic_year, file) {
      const m = await me(); const path = `${m.id}/${academic_year.replace('/', '-')}/${Date.now()}-${file.name}`;
      const { error } = await sb().storage.from('scholar-documents').upload(path, file); if (error) throw new Error(error.message);
      return must(await sb().from('scholar_documents').insert({ scholar_id: m.id, academic_year, kind, storage_path: path, filename: file.name, size_bytes: file.size }).select().single());
    },
    async remove(id) { const d = must(await sb().from('scholar_documents').select('storage_path').eq('id', id).single()); must(await sb().from('scholar_documents').delete().eq('id', id)); await sb().storage.from('scholar-documents').remove([d.storage_path]); },
    async url(doc) { const { data, error } = await sb().storage.from('scholar-documents').createSignedUrl(doc.storage_path, 600); if (error) throw new Error(error.message); return data.signedUrl; },
  },

  staff: {
    async inbox() {
      const [space, interest, documents] = await Promise.all([
        must(await sb().from('space_requests').select('*').eq('status', 'pending').order('starts_at')),
        must(await sb().from('opportunity_interest').select('*, opportunity:opportunities(id, title, organisation, deadline)').eq('status', 'submitted').order('created_at')),
        must(await sb().from('scholar_documents').select('*').eq('status', 'uploaded').order('uploaded_at')),
      ]);
      const map = await people([...space.map((r) => r.scholar_id), ...interest.map((i) => i.scholar_id), ...documents.map((d) => d.scholar_id)]);
      const withScholar = (rows) => rows.map((r) => ({ ...r, scholar: map.get(r.scholar_id) }));
      return { space: withScholar(space), interest: withScholar(interest), documents: withScholar(documents), counts: { space: space.length, interest: interest.length, documents: documents.length } };
    },
    async counts() { const [row] = must(await sb().rpc('staff_inbox_counts')); return row || { space: 0, interest: 0, documents: 0 }; },
    space: { async decide(id, status, note) { must(await sb().from('space_requests').update({ status, staff_note: note || null }).eq('id', id)); } },
    interest: { async setStatus(opportunity_id, scholar_id, status) { must(await sb().from('opportunity_interest').update({ status }).match({ opportunity_id, scholar_id })); } },
    documents: { async decide(id, status, note) { must(await sb().from('scholar_documents').update({ status, staff_note: note || null, reviewed_at: nowIso() }).eq('id', id)); }, async url(doc) { return api.scholarship.url(doc); } },
    events: {
      async list() { return must(await sb().from('events_with_my_rsvp').select('*').order('starts_at', { ascending: false })); },
      async upsert(row) { const m = await me(); const { id, going_count, my_status, attendees, ...data } = row; if (id) return must(await sb().from('events').update(data).eq('id', id).select().single()); return must(await sb().from('events').insert({ ...data, created_by: m.id }).select().single()); },
      async remove(id) { must(await sb().from('events').delete().eq('id', id)); },
    },
    announcements: {
      async list() { return api.announcements.list(); },
      async upsert(row) { const m = await me(); const { id, ...data } = row; if (id) return must(await sb().from('announcements').update(data).eq('id', id).select().single()); return must(await sb().from('announcements').insert({ ...data, author_id: m.id }).select().single()); },
      async remove(id) { must(await sb().from('announcements').delete().eq('id', id)); },
    },
    opportunities: {
      async list() { return must(await sb().from('opportunities').select('*').order('deadline', { ascending: false })); },
      async upsert(row) { const { id, mine, ...data } = row; if (id) return must(await sb().from('opportunities').update(data).eq('id', id).select().single()); return must(await sb().from('opportunities').insert(data).select().single()); },
      async remove(id) { must(await sb().from('opportunities').delete().eq('id', id)); },
      async interest(id) { const rows = must(await sb().from('opportunity_interest').select('*').eq('opportunity_id', id).order('created_at')); const map = await people(rows.map((r) => r.scholar_id)); return rows.map((r) => ({ ...r, scholar: map.get(r.scholar_id) })); },
    },
    journal: {
      async list() { return must(await sb().from('journal_entries').select('*').order('occurred_on', { ascending: false })); },
      async upsert(row) { const m = await me(); const { id, tagged, author, gallery, ...data } = row; if (id) return must(await sb().from('journal_entries').update(data).eq('id', id).select().single()); return must(await sb().from('journal_entries').insert({ ...data, author_id: m.id }).select().single()); },
      async remove(id) { must(await sb().from('journal_entries').delete().eq('id', id)); },
    },
    scholars: {
      async all() { return must(await sb().from('directory').select('*').order('full_name')); },
      async upsert(row) { const { id, coach, mentor, phone, calendar_token, ...data } = row; if (id) return must(await sb().from('scholars').update(data).eq('id', id).select().single()); return must(await sb().from('scholars').insert(data).select().single()); },
      async remove(id) { must(await sb().from('scholars').delete().eq('id', id)); },
      async funding(scholarId) { return must(await sb().from('scholarship_years').select('*').eq('scholar_id', scholarId).order('academic_year', { ascending: false })); },
      async setFunding(scholar_id, academic_year, patch) { must(await sb().from('scholarship_years').upsert({ scholar_id, academic_year, ...patch, updated_at: nowIso() })); },
    },
    coaching: {
      async coaches() { return must(await sb().from('directory').select('*').eq('role', 'coach').order('full_name')); },
      async slots(coachId) { const rows = must(await sb().from('coaching_sessions').select('*').eq('coach_id', coachId).gte('starts_at', nowIso()).order('starts_at')); const map = await people(rows.map((r) => r.scholar_id)); return rows.map((r) => ({ ...r, scholar: map.get(r.scholar_id) || null })); },
      async createSlots(coachId, slots) { must(await sb().from('coaching_sessions').insert(slots.map((s) => ({ coach_id: coachId, starts_at: s.starts_at, ends_at: s.ends_at, status: 'open', meeting_link: s.meeting_link || null })))); },
      async removeSlot(id) { must(await sb().from('coaching_sessions').delete().eq('id', id).eq('status', 'open')); },
    },
  },

  calendar: {
    async url() { const m = await me(); if (!m.calendar_token) return null; return `${SUPABASE_URL.replace('.supabase.co', '.functions.supabase.co')}/calendar?t=${m.calendar_token}`; },
    async rotate() { ME = null; const token = must(await sb().rpc('rotate_calendar_token')); return api.calendar.url(); },
  },

  auth: {
    async signIn(email) { return sendCode(email); },
    async verify(email, code) { return verifyCode(email, code); },
    async signOut() { ME = null; cache.clear(); await authSignOut(); },
  },
};
