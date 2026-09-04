-- Row-level security. Everything requires an authenticated user; staff can write foundation content;
-- chaplaincy is readable only by the scholar and the chaplain (never staff).

-- ---------- Helpers (security definer so they can read scholars without recursion) ----------
create or replace function public.my_role() returns scholar_role
language sql stable security definer set search_path = public as $$
  select role from scholars where id = auth.uid()
$$;
create or replace function public.my_cohort() returns text
language sql stable security definer set search_path = public as $$
  select cohort from scholars where id = auth.uid()
$$;
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'staff' from scholars where id = auth.uid()), false)
$$;
create or replace function public.is_chaplain() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'chaplain' from scholars where id = auth.uid()), false)
$$;
create or replace function public.is_project_member(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from project_members where project_id = p and scholar_id = auth.uid())
$$;

-- ---------- Enable ----------
alter table scholars enable row level security;
alter table events enable row level security;
alter table rsvps enable row level security;
alter table coaching_sessions enable row level security;
alter table messages enable row level security;
alter table mentor_meetings enable row level security;
alter table curriculum_modules enable row level security;
alter table module_progress enable row level security;
alter table resources enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table project_milestone_templates enable row level security;
alter table chaplaincy_requests enable row level security;
alter table announcements enable row level security;
alter table opportunities enable row level security;
alter table opportunity_interest enable row level security;
alter table space_requests enable row level security;
alter table journal_entries enable row level security;
alter table hub_posts enable row level security;
alter table hub_likes enable row level security;
alter table hub_comments enable row level security;

-- ---------- scholars ----------
drop policy if exists scholars_read on scholars;
create policy scholars_read on scholars for select to authenticated using (true);
drop policy if exists scholars_update_self on scholars;
create policy scholars_update_self on scholars for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists scholars_staff_write on scholars;
create policy scholars_staff_write on scholars for all to authenticated using (is_staff()) with check (is_staff());
-- Scholars may edit their profile but never their role, cohort, email or assignments.
create or replace function public.protect_scholar_columns() returns trigger language plpgsql as $$
begin
  if not is_staff() and (new.role <> old.role or new.cohort is distinct from old.cohort or new.email <> old.email
                         or new.coach_id is distinct from old.coach_id or new.mentor_id is distinct from old.mentor_id
                         or new.auth_linked <> old.auth_linked) then
    raise exception 'Only staff can change role, cohort, email or assignments.';
  end if;
  return new;
end $$;
drop trigger if exists protect_scholar_columns on scholars;
create trigger protect_scholar_columns before update on scholars for each row execute function public.protect_scholar_columns();
-- Phone numbers never leave the base table directly: the app reads people through the `directory` view
-- (0004), which returns phone only when phone_visible or it is your own row.
revoke select on scholars from anon, authenticated;
grant select (id, email, full_name, university, subject, year_of_study, cohort, role, coach_id, mentor_id, avatar_url, bio, currently,
              linkedin_url, phone_visible, interests, auth_linked, created_at, updated_at) on scholars to authenticated;
grant update on scholars to authenticated;

-- ---------- events / rsvps ----------
drop policy if exists events_read on events;
create policy events_read on events for select to authenticated
  using (scope = 'foundation' or cohort = my_cohort() or is_staff());
drop policy if exists events_staff_write on events;
create policy events_staff_write on events for all to authenticated using (is_staff()) with check (is_staff());

drop policy if exists rsvps_read on rsvps;
create policy rsvps_read on rsvps for select to authenticated using (true);      -- "who's going" is visible to all
drop policy if exists rsvps_write_own on rsvps;
create policy rsvps_write_own on rsvps for all to authenticated using (scholar_id = auth.uid()) with check (scholar_id = auth.uid());

-- ---------- coaching ----------
drop policy if exists coaching_read on coaching_sessions;
create policy coaching_read on coaching_sessions for select to authenticated
  using (scholar_id = auth.uid() or coach_id = auth.uid() or is_staff()
         or (status = 'open' and coach_id = (select coach_id from scholars where id = auth.uid())));
drop policy if exists coaching_coach_write on coaching_sessions;
create policy coaching_coach_write on coaching_sessions for all to authenticated
  using (coach_id = auth.uid() or is_staff()) with check (coach_id = auth.uid() or is_staff());
drop policy if exists coaching_scholar_reflect on coaching_sessions;
create policy coaching_scholar_reflect on coaching_sessions for update to authenticated
  using (scholar_id = auth.uid()) with check (scholar_id = auth.uid());
-- Booking and cancelling go through the RPCs in 0004 (atomic; scholars cannot edit arbitrary columns).

-- ---------- messages / mentor meetings ----------
drop policy if exists messages_parties on messages;
create policy messages_parties on messages for select to authenticated using (auth.uid() in (scholar_id, counterpart_id));
drop policy if exists messages_send on messages;
create policy messages_send on messages for insert to authenticated with check (sender_id = auth.uid() and auth.uid() in (scholar_id, counterpart_id));
drop policy if exists messages_read_receipt on messages;
create policy messages_read_receipt on messages for update to authenticated using (auth.uid() in (scholar_id, counterpart_id) and sender_id <> auth.uid());

drop policy if exists mentor_meetings_parties on mentor_meetings;
create policy mentor_meetings_parties on mentor_meetings for all to authenticated
  using (auth.uid() in (scholar_id, mentor_id) or is_staff()) with check (auth.uid() in (scholar_id, mentor_id) or is_staff());

-- ---------- curriculum ----------
drop policy if exists modules_read on curriculum_modules;
create policy modules_read on curriculum_modules for select to authenticated using (cohort is null or cohort = my_cohort() or is_staff());
drop policy if exists modules_staff on curriculum_modules;
create policy modules_staff on curriculum_modules for all to authenticated using (is_staff()) with check (is_staff());
drop policy if exists progress_own on module_progress;
create policy progress_own on module_progress for all to authenticated using (scholar_id = auth.uid() or is_staff()) with check (scholar_id = auth.uid() or is_staff());
drop policy if exists resources_read on resources;
create policy resources_read on resources for select to authenticated using (true);
drop policy if exists resources_staff on resources;
create policy resources_staff on resources for all to authenticated using (is_staff()) with check (is_staff());

-- ---------- projects ----------
drop policy if exists projects_read on projects;
create policy projects_read on projects for select to authenticated using (is_project_member(id) or is_staff());
drop policy if exists projects_member_update on projects;
create policy projects_member_update on projects for update to authenticated using (is_project_member(id)) with check (is_project_member(id));
drop policy if exists projects_staff on projects;
create policy projects_staff on projects for all to authenticated using (is_staff()) with check (is_staff());
drop policy if exists project_members_read on project_members;
create policy project_members_read on project_members for select to authenticated using (true);
drop policy if exists project_members_staff on project_members;
create policy project_members_staff on project_members for all to authenticated using (is_staff()) with check (is_staff());
drop policy if exists templates_read on project_milestone_templates;
create policy templates_read on project_milestone_templates for select to authenticated using (true);
drop policy if exists templates_staff on project_milestone_templates;
create policy templates_staff on project_milestone_templates for all to authenticated using (is_staff()) with check (is_staff());

-- ---------- chaplaincy: scholar + chaplain only. Staff explicitly excluded. ----------
drop policy if exists chaplaincy_scholar on chaplaincy_requests;
create policy chaplaincy_scholar on chaplaincy_requests for select to authenticated using (scholar_id = auth.uid() or is_chaplain());
drop policy if exists chaplaincy_insert on chaplaincy_requests;
create policy chaplaincy_insert on chaplaincy_requests for insert to authenticated with check (scholar_id = auth.uid());
drop policy if exists chaplaincy_chaplain_update on chaplaincy_requests;
create policy chaplaincy_chaplain_update on chaplaincy_requests for update to authenticated using (is_chaplain()) with check (is_chaplain());
-- Wipe the note when a request is closed.
create or replace function public.chaplaincy_close_wipe() returns trigger language plpgsql as $$
begin if new.status = 'closed' then new.note = null; new.closed_at = coalesce(new.closed_at, now()); end if; return new; end $$;
drop trigger if exists chaplaincy_close_wipe on chaplaincy_requests;
create trigger chaplaincy_close_wipe before update on chaplaincy_requests for each row execute function public.chaplaincy_close_wipe();

-- ---------- foundation content ----------
drop policy if exists announcements_read on announcements;
create policy announcements_read on announcements for select to authenticated using (true);
drop policy if exists announcements_staff on announcements;
create policy announcements_staff on announcements for all to authenticated using (is_staff()) with check (is_staff());
drop policy if exists opportunities_read on opportunities;
create policy opportunities_read on opportunities for select to authenticated using (true);
drop policy if exists opportunities_staff on opportunities;
create policy opportunities_staff on opportunities for all to authenticated using (is_staff()) with check (is_staff());
drop policy if exists interest_own on opportunity_interest;
create policy interest_own on opportunity_interest for all to authenticated using (scholar_id = auth.uid() or is_staff()) with check (scholar_id = auth.uid() or is_staff());
drop policy if exists space_own on space_requests;
create policy space_own on space_requests for select to authenticated using (scholar_id = auth.uid() or is_staff());
drop policy if exists space_insert on space_requests;
create policy space_insert on space_requests for insert to authenticated with check (scholar_id = auth.uid() and status = 'pending');
drop policy if exists space_staff on space_requests;
create policy space_staff on space_requests for update to authenticated using (is_staff()) with check (is_staff());
drop policy if exists journal_read on journal_entries;
create policy journal_read on journal_entries for select to authenticated using (true);
drop policy if exists journal_staff on journal_entries;
create policy journal_staff on journal_entries for all to authenticated using (is_staff()) with check (is_staff());

-- ---------- hub ----------
drop policy if exists posts_read on hub_posts;
create policy posts_read on hub_posts for select to authenticated using (true);
drop policy if exists posts_insert on hub_posts;
create policy posts_insert on hub_posts for insert to authenticated with check (author_id = auth.uid());
drop policy if exists posts_own on hub_posts;
create policy posts_own on hub_posts for delete to authenticated using (author_id = auth.uid() or is_staff());
drop policy if exists posts_staff_pin on hub_posts;
create policy posts_staff_pin on hub_posts for update to authenticated using (is_staff() or author_id = auth.uid()) with check (is_staff() or author_id = auth.uid());
drop policy if exists likes_read on hub_likes;
create policy likes_read on hub_likes for select to authenticated using (true);
drop policy if exists likes_own on hub_likes;
create policy likes_own on hub_likes for all to authenticated using (scholar_id = auth.uid()) with check (scholar_id = auth.uid());
drop policy if exists comments_read on hub_comments;
create policy comments_read on hub_comments for select to authenticated using (true);
drop policy if exists comments_insert on hub_comments;
create policy comments_insert on hub_comments for insert to authenticated with check (author_id = auth.uid());
drop policy if exists comments_delete on hub_comments;
create policy comments_delete on hub_comments for delete to authenticated using (author_id = auth.uid() or is_staff());

-- ---------- Storage buckets ----------
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('hub-images', 'hub-images', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('journal', 'journal', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('resources', 'resources', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('project-deliverables', 'project-deliverables', false) on conflict (id) do nothing;

drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "avatars own write" on storage.objects;
create policy "avatars own write" on storage.objects for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "members read" on storage.objects;
create policy "members read" on storage.objects for select to authenticated using (bucket_id in ('hub-images','journal','resources'));
drop policy if exists "hub images own write" on storage.objects;
create policy "hub images own write" on storage.objects for insert to authenticated
  with check (bucket_id = 'hub-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "staff content write" on storage.objects;
create policy "staff content write" on storage.objects for all to authenticated
  using (bucket_id in ('journal','resources') and is_staff()) with check (bucket_id in ('journal','resources') and is_staff());
drop policy if exists "project deliverables members" on storage.objects;
create policy "project deliverables members" on storage.objects for all to authenticated
  using (bucket_id = 'project-deliverables' and (is_staff() or is_project_member(((storage.foldername(name))[1])::uuid)))
  with check (bucket_id = 'project-deliverables' and is_project_member(((storage.foldername(name))[1])::uuid));
