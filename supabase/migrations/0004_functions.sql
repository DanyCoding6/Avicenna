-- RPCs and views the app reads.

-- Atomic booking: only succeeds if the slot is still open and belongs to my coach.
create or replace function public.book_session(session_id uuid) returns coaching_sessions
language plpgsql security definer set search_path = public as $$
declare s coaching_sessions;
begin
  update coaching_sessions
     set scholar_id = auth.uid(), status = 'booked'
   where id = session_id and status = 'open' and scholar_id is null
     and coach_id = (select coach_id from scholars where id = auth.uid())
     and starts_at > now()
  returning * into s;
  if s.id is null then raise exception 'That slot has just been taken.' using errcode = 'P0002'; end if;
  return s;
end $$;

create or replace function public.cancel_session(session_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update coaching_sessions set scholar_id = null, status = 'open'
   where id = session_id and scholar_id = auth.uid() and status = 'booked' and starts_at > now();
end $$;

create or replace function public.toggle_like(p_post uuid) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from hub_likes where post_id = p_post and scholar_id = auth.uid()) then
    delete from hub_likes where post_id = p_post and scholar_id = auth.uid(); return false;
  else
    insert into hub_likes (post_id, scholar_id) values (p_post, auth.uid()); return true;
  end if;
end $$;

create or replace function public.mark_thread_read(p_counterpart uuid) returns void
language sql security definer set search_path = public as $$
  update messages set read_at = now()
   where scholar_id = auth.uid() and counterpart_id = p_counterpart and sender_id <> auth.uid() and read_at is null;
$$;

-- ---------- Views ----------
-- Directory: phone only when the scholar allows it.
create or replace view public.directory with (security_invoker = true) as
  select id, email, full_name, university, subject, year_of_study, cohort, role, coach_id, mentor_id, avatar_url, bio, currently,
         linkedin_url, case when phone_visible or id = auth.uid() then phone end as phone, phone_visible, interests
  from scholars;

create or replace view public.events_with_my_rsvp with (security_invoker = true) as
  select e.*,
         (select count(*) from rsvps r where r.event_id = e.id and r.status = 'going') as going_count,
         (select status from rsvps r where r.event_id = e.id and r.scholar_id = auth.uid()) as my_status
  from events e;

create or replace view public.hub_feed with (security_invoker = true) as
  select p.*,
         (select count(*) from hub_likes l where l.post_id = p.id) as like_count,
         exists (select 1 from hub_likes l where l.post_id = p.id and l.scholar_id = auth.uid()) as liked_by_me,
         (select count(*) from hub_comments c where c.post_id = p.id) as comment_count
  from hub_posts p;

-- Adam Hub calendar: approved bookings (anonymised unless mine) + events held at the Hub.
-- A definer function, because space_requests RLS hides other scholars' rows.
create or replace function public.space_calendar_week(p_from timestamptz, p_to timestamptz)
returns table (type text, event_id uuid, starts_at timestamptz, ends_at timestamptz, title text, mine boolean, headcount smallint)
language sql stable security definer set search_path = public as $$
  select 'booking', null::uuid, r.starts_at, r.ends_at, case when r.scholar_id = auth.uid() then r.purpose else 'Booked' end, r.scholar_id = auth.uid(), r.headcount
    from space_requests r where r.status = 'approved' and r.starts_at >= p_from and r.starts_at < p_to
  union all
  select 'event', e.id, e.starts_at, e.ends_at, e.title, false, null
    from events e where e.venue = 'adam_hub' and e.starts_at >= p_from and e.starts_at < p_to
      and (e.scope = 'foundation' or e.cohort = my_cohort())
  order by 3;
$$;

-- This month's coaching cadence for the caller.
create or replace function public.my_month_cadence(p_month date default current_date)
returns table (target int, done int, booked int)
language sql stable security definer set search_path = public as $$
  select 2,
         count(*) filter (where status = 'completed')::int,
         count(*) filter (where status = 'booked')::int
    from coaching_sessions
   where scholar_id = auth.uid() and date_trunc('month', starts_at) = date_trunc('month', p_month::timestamptz);
$$;

-- Create a project for a team from the year's milestone template (staff).
create or replace function public.create_project(p_year text, p_title text, p_summary text, p_members uuid[])
returns uuid language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  if not is_staff() then raise exception 'staff only'; end if;
  insert into projects (academic_year, title, summary, status, milestones)
  values (p_year, p_title, p_summary, 'in_progress',
          coalesce((select jsonb_agg(jsonb_build_object('title', title, 'due_on', due_on, 'done_at', null, 'final', final) order by position)
                    from project_milestone_templates where academic_year = p_year), '[]'))
  returning id into pid;
  insert into project_members (project_id, scholar_id) select pid, unnest(p_members);
  return pid;
end $$;

grant execute on function public.book_session(uuid), public.cancel_session(uuid), public.toggle_like(uuid), public.mark_thread_read(uuid),
  public.space_calendar_week(timestamptz, timestamptz), public.my_month_cadence(date), public.create_project(text, text, text, uuid[]) to authenticated;
