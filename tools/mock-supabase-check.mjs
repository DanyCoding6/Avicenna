// Runs every route with js/config.js pointed at a fake Supabase host whose REST/RPC calls are mocked.
// Verifies the Supabase data layer executes without exceptions. Needs a static server on :8080.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(execSync('npm root -g').toString().trim() + '/');
const { chromium, devices } = require('playwright');
const base = process.env.BASE || 'http://127.0.0.1:8080/';
const REF = 'mockproject';
const HOST = `https://${REF}.supabase.co`;
const ME = { id: '11111111-1111-4111-8111-111111111111', email: 'aisha@example.org', full_name: 'Aisha Rahman', university: 'University of Manchester', subject: 'Medicine', year_of_study: 2, cohort: '2024', role: 'scholar', coach_id: '22222222-2222-4222-8222-222222222222', mentor_id: '33333333-3333-4333-8333-333333333333', avatar_url: null, bio: 'x', currently: 'y', linkedin_url: null, phone: null, phone_visible: false, interests: [] };
const COACH = { ...ME, id: ME.coach_id, full_name: 'Yusuf Ali', role: 'coach', cohort: null };
const jwt = () => { const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url'); return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: ME.id, exp: Math.floor(Date.now() / 1000) + 86400, role: 'authenticated', aud: 'authenticated' })}.sig`; };
const session = { access_token: jwt(), refresh_token: 'r', token_type: 'bearer', expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, user: { id: ME.id, email: ME.email, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() } };
const calls = [];
function respond(url, method) {
  const u = new URL(url); const path = u.pathname.replace('/rest/v1/', ''); const q = u.searchParams;
  calls.push(`${method} ${path}?${[...q.keys()].join(',')}`);
  const one = q.get('id')?.startsWith('eq.');
  if (path === 'directory') { const id = q.get('id')?.replace('eq.', ''); return id === ME.coach_id ? [COACH] : id === ME.mentor_id ? [{ ...COACH, id: ME.mentor_id, full_name: 'Dr Samira Khan', role: 'mentor' }] : q.get('role') ? [{ ...COACH, id: '4', role: 'chaplain', full_name: 'Imam' }] : [ME]; }
  if (path === 'rpc/my_month_cadence') return [{ target: 2, done: 1, booked: 0 }];
  if (path === 'rpc/book_session') return { id: 's1', status: 'booked' };
  if (path === 'rpc/toggle_like') return true;
  if (path.startsWith('rpc/')) return [];
  if (path === 'events_with_my_rsvp') { const e = { id: 'e1', title: 'Winter Retreat', kind: 'retreat', venue: 'external', location: 'Snowdonia', scope: 'foundation', cohort: null, starts_at: new Date(Date.now() + 5 * 864e5).toISOString(), ends_at: new Date(Date.now() + 7 * 864e5).toISOString(), capacity: 60, going_count: 3, my_status: 'going', description: 'd', itinerary: null }; return one ? [e] : [e, { ...e, id: 'e2', title: 'Past thing', kind: 'event', starts_at: new Date(Date.now() - 5 * 864e5).toISOString(), ends_at: new Date(Date.now() - 5 * 864e5).toISOString() }]; }
  if (path === 'projects') return [{ id: 'p1', academic_year: '2025/26', title: 'Project', summary: 's', status: 'in_progress', milestones: [{ title: 'A', due_on: '2026-10-01', done_at: null }], project_members: [{ scholar_id: ME.id }], presentation: null }];
  if (path === 'scholars') return [ME, COACH];
  if (path === 'curriculum_modules') return [{ id: 'm1', position: 1, title: 'Niyyah', theme: 'Intention', taught_at: new Date().toISOString() }];
  if (path === 'hub_feed') return [{ id: 'hp1', author_id: ME.id, kind: 'general', body: 'hello', pinned: false, created_at: new Date().toISOString(), like_count: 1, liked_by_me: false, comment_count: 0, image_path: null }];
  if (path === 'opportunities') return [{ id: 'op1', title: 'COP', organisation: 'X', kind: 'delegation', location: 'Y', deadline: new Date(Date.now() + 5 * 864e5).toISOString(), link: 'https://example.org/', description: 'd' }];
  if (path === 'journal_entries') return [{ id: 'j1', title: 'Windsor', body: 'b', occurred_on: '2026-06-01', academic_year: '2025/26', gallery: [], tagged_scholars: [ME.id], author_id: ME.id }];
  if (path === 'messages') return method === 'POST' ? { id: 'x', body: 'hi', sender_id: ME.id, created_at: new Date().toISOString() } : [];
  if (method === 'POST' || method === 'PATCH') return one ? {} : [];
  return [];
}
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['iPhone 14'], serviceWorkers: 'block' });
await ctx.addInitScript(([key, s]) => { localStorage.setItem(key, JSON.stringify(s)); }, [`sb-${REF}-auth-token`, session]);
await ctx.route(`${base}js/config.js`, (r) => r.fulfill({ contentType: 'application/javascript', body: `export const SUPABASE_URL='${HOST}'; export const SUPABASE_ANON_KEY='anon'; export const APP_VERSION='test'; export const DEMO=false;` }));
await ctx.route(`${HOST}/**`, (r) => { const req = r.request(); const u = new URL(req.url()); if (u.pathname.startsWith('/auth/')) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(session.user) }); if (u.pathname.startsWith('/realtime')) return r.abort(); const body = respond(req.url(), req.method()); const single = /application\/vnd\.pgrst\.object/.test(req.headers().accept || ''); const payload = single && Array.isArray(body) ? (body[0] ?? null) : body; if (single && payload == null) return r.fulfill({ status: 406, contentType: 'application/json', body: JSON.stringify({ message: 'no rows' }) }); return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'content-range': '0-0/0' }, body: JSON.stringify(payload) }); });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error' && !/realtime|websocket/i.test(m.text())) errors.push(`[console] ${m.text().slice(0, 200)}`); });
const routes = ['/home', '/events', '/events?seg=opportunities', '/events/e1', '/opportunities/op1', '/programme', '/programme/coaching', '/programme/curriculum', '/programme/curriculum/m1', '/programme/project', '/programme/mentorship', '/programme/chaplaincy', `/thread/${ME.coach_id}`, '/hub/scholars', '/hub/feed', '/hub/space', `/scholar/${ME.id}`, '/post/hp1', '/journal', '/journal/j1', '/profile'];
await page.goto(base + '#/home', { waitUntil: 'networkidle' });
for (const r of routes) { await page.goto(base + '#' + r); await page.waitForTimeout(400); const text = (await page.locator('#view').innerText()).slice(0, 70).replace(/\s+/g, ' '); console.log(r.padEnd(34), text); if (/went wrong|Could not start/.test(text)) errors.push(`[view] ${r}: ${text}`); }
// A few mutations
await page.goto(base + '#/events/e1'); await page.waitForTimeout(300); await page.click('[data-action=rsvp][data-status=maybe]'); await page.waitForTimeout(300);
await page.goto(base + '#/hub/feed'); await page.waitForTimeout(300); await page.click('[data-action=like]'); await page.waitForTimeout(200);
await browser.close();
console.log(`\n${calls.length} Supabase calls, e.g.\n  ` + [...new Set(calls)].slice(0, 12).join('\n  '));
if (errors.length) { console.log('\nERRORS:'); errors.forEach((e) => console.log(' ', e)); process.exit(1); }
console.log('\nmock supabase check passed');
