-- Round 2: calendar subscription token, scholarship years and documents.

-- ---------- Calendar token ----------
alter table scholars add column if not exists calendar_token uuid not null default gen_random_uuid();
create unique index if not exists scholars_calendar_token_idx on scholars(calendar_token);
-- Never exposed through the base table; the directory view returns it only for your own row.
revoke select (calendar_token) on scholars from authenticated;
create or replace view public.directory as
  select id, email, full_name, university, subject, year_of_study, cohort, role, coach_id, mentor_id, avatar_url, bio, currently,
         linkedin_url, case when phone_visible or id = auth.uid() then phone end as phone, phone_visible, interests,
         case when id = auth.uid() then calendar_token end as calendar_token
  from scholars;
revoke all on public.directory from anon, public;
grant select on public.directory to authenticated;

create or replace function public.rotate_calendar_token() returns uuid
language sql security definer set search_path = public as $$
  update scholars set calendar_token = gen_random_uuid() where id = auth.uid() returning calendar_token;
$$;
grant execute on function public.rotate_calendar_token() to authenticated;

-- ---------- Scholarship years & documents ----------
do $$ begin
  create type funding_status as enum ('pending','confirmed','paid','on_hold');
  create type document_kind as enum ('enrolment_confirmation','transcript','fee_invoice','other');
  create type document_status as enum ('uploaded','accepted','rejected');
exception when duplicate_object then null; end $$;

create table if not exists scholarship_years (
  scholar_id uuid not null references scholars(id) on delete cascade on update cascade,
  academic_year text not null,                       -- '2025/26'
  funding_status funding_status not null default 'pending',
  fee_amount numeric(10,2),
  enrolment_due date,
  transcript_due date,
  notes text,
  updated_at timestamptz not null default now(),
  primary key (scholar_id, academic_year)
);
create table if not exists scholar_documents (
  id uuid primary key default gen_random_uuid(),
  scholar_id uuid not null references scholars(id) on delete cascade on update cascade,
  academic_year text not null,
  kind document_kind not null,
  storage_path text not null,                        -- in the private 'scholar-documents' bucket, folder = scholar_id
  filename text not null,
  size_bytes integer,
  uploaded_at timestamptz not null default now(),
  status document_status not null default 'uploaded',
  staff_note text,
  reviewed_at timestamptz
);
create index if not exists scholar_documents_scholar_idx on scholar_documents(scholar_id, academic_year);

alter table scholarship_years enable row level security;
alter table scholar_documents enable row level security;
drop policy if exists years_read on scholarship_years;
create policy years_read on scholarship_years for select to authenticated using (scholar_id = auth.uid() or is_staff());
drop policy if exists years_staff on scholarship_years;
create policy years_staff on scholarship_years for all to authenticated using (is_staff()) with check (is_staff());
drop policy if exists docs_read on scholar_documents;
create policy docs_read on scholar_documents for select to authenticated using (scholar_id = auth.uid() or is_staff());
drop policy if exists docs_insert_own on scholar_documents;
create policy docs_insert_own on scholar_documents for insert to authenticated with check (scholar_id = auth.uid() and status = 'uploaded');
drop policy if exists docs_delete_own on scholar_documents;
create policy docs_delete_own on scholar_documents for delete to authenticated using (scholar_id = auth.uid() and status = 'uploaded');
drop policy if exists docs_staff on scholar_documents;
create policy docs_staff on scholar_documents for update to authenticated using (is_staff()) with check (is_staff());

insert into storage.buckets (id, name, public) values ('scholar-documents', 'scholar-documents', false) on conflict (id) do nothing;
drop policy if exists "scholar documents own" on storage.objects;
create policy "scholar documents own" on storage.objects for all to authenticated
  using (bucket_id = 'scholar-documents' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'scholar-documents' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "scholar documents staff read" on storage.objects;
create policy "scholar documents staff read" on storage.objects for select to authenticated
  using (bucket_id = 'scholar-documents' and is_staff());

-- Staff inbox counts in one call.
create or replace function public.staff_inbox_counts()
returns table (space int, interest int, documents int)
language sql stable security definer set search_path = public as $$
  select (select count(*) from space_requests where status = 'pending')::int,
         (select count(*) from opportunity_interest where status = 'submitted')::int,
         (select count(*) from scholar_documents where status = 'uploaded')::int
  where is_staff();
$$;
grant execute on function public.staff_inbox_counts() to authenticated;
