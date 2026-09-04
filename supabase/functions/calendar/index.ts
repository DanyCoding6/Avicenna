// Per-scholar calendar feed. GET /calendar?t=<calendar_token> → text/calendar
// Deploy: supabase functions deploy calendar --no-verify-jwt   (the token is the credential)
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY are injected automatically; set APP_URL to the app's public URL.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { buildCalendar, scholarEvents } from '../_shared/ics.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405 });
  const token = new URL(req.url).searchParams.get('t') || '';
  if (!UUID.test(token)) return new Response('Not found', { status: 404 });

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { data: scholar } = await sb.from('scholars').select('id, full_name, cohort').eq('calendar_token', token).maybeSingle();
  if (!scholar) return new Response('Not found', { status: 404 });

  const since = new Date(Date.now() - 90 * 86400000).toISOString();
  const [events, rsvps, sessions, bookings, members, interests, years] = await Promise.all([
    sb.from('events').select('id, title, description, kind, venue, location, join_link, starts_at, ends_at, scope, cohort').gte('starts_at', since).or(`scope.eq.foundation,cohort.eq.${scholar.cohort ?? 'none'}`),
    sb.from('rsvps').select('event_id, status').eq('scholar_id', scholar.id),
    sb.from('coaching_sessions').select('id, starts_at, ends_at, status, meeting_link, coach:scholars!coaching_sessions_coach_id_fkey(full_name)').eq('scholar_id', scholar.id).gte('starts_at', since),
    sb.from('space_requests').select('id, starts_at, ends_at, purpose, status').eq('scholar_id', scholar.id).gte('starts_at', since),
    sb.from('project_members').select('project:projects(id, title, milestones)').eq('scholar_id', scholar.id),
    sb.from('opportunity_interest').select('status, opportunity:opportunities(id, title, deadline)').eq('scholar_id', scholar.id),
    sb.from('scholarship_years').select('academic_year, enrolment_due, transcript_due').eq('scholar_id', scholar.id),
  ]);

  const body = buildCalendar({
    name: 'Avicenna',
    description: `Events, coaching, Adam Hub bookings and deadlines for ${scholar.full_name}`,
    events: scholarEvents({
      scholar, appUrl: Deno.env.get('APP_URL') || '',
      events: events.data || [], rsvps: rsvps.data || [],
      sessions: (sessions.data || []).map((s: any) => ({ ...s, coach_name: s.coach?.full_name })),
      bookings: bookings.data || [], projects: (members.data || []).map((m: any) => m.project).filter(Boolean),
      interests: interests.data || [], years: years.data || [],
    }),
  });
  return new Response(body, { headers: { 'content-type': 'text/calendar; charset=utf-8', 'cache-control': 'private, max-age=900', 'content-disposition': 'inline; filename="avicenna.ics"' } });
});
