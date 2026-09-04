-- Avicenna scholars' app — schema
-- Run in the Supabase SQL editor (or `supabase db push`). Idempotent where practical.

create extension if not exists "pgcrypto";

-- ---------- Enums ----------
do $$ begin
  create type scholar_role as enum ('scholar','alumni','coach','mentor','chaplain','staff');
  create type event_kind as enum ('event','retreat','reception','workshop','social','presentation');
  create type event_venue as enum ('adam_hub','external','online');
  create type event_scope as enum ('cohort','foundation');
  create type rsvp_status as enum ('going','maybe','declined');
  create type session_status as enum ('open','booked','completed','cancelled');
  create type resource_kind as enum ('pdf','recording','link');
  create type project_status as enum ('proposed','in_progress','submitted','presented');
  create type chaplaincy_channel as enum ('phone','video','in_person');
  create type chaplaincy_status as enum ('open','contacted','closed');
  create type opportunity_kind as enum ('delegation','internship','fellowship','competition','other');
  create type interest_status as enum ('submitted','shortlisted','selected','unsuccessful');
  create type request_status as enum ('pending','approved','declined');
  create type post_kind as enum ('general','ask','win');
exception when duplicate_object then null; end $$;

-- ---------- People ----------
-- One row per person. Scholars are pre-loaded by staff (invite-only); the auth trigger below links them.
create table if not exists scholars (
  id uuid primary key default gen_random_uuid(),           -- becomes auth.users.id once they sign in
  email text not null unique,
  full_name text not null,
  university text,
  subject text,
  year_of_study smallint check (year_of_study between 1 and 7),
  cohort text,                                             -- e.g. '2024' (intake year); null for staff/coaches
  role scholar_role not null default 'scholar',
  coach_id uuid references scholars(id) on delete set null,
  mentor_id uuid references scholars(id) on delete set null,
  avatar_url text,
  bio text,
  currently text,                                          -- one line: "2nd year Medicine · summer at NHS England"
  linkedin_url text,
  phone text,
  phone_visible boolean not null default false,
  interests text[] not null default '{}',
  auth_linked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists scholars_cohort_idx on scholars(cohort);
create index if not exists scholars_role_idx on scholars(role);

-- ---------- Events ----------
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  kind event_kind not null default 'event',
  venue event_venue not null default 'external',
  location text,
  join_link text,
  scope event_scope not null default 'foundation',
  cohort text,                                             -- required when scope = 'cohort'
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity integer,
  cover_url text,
  itinerary jsonb,                                         -- [{day, rows:[[time, what], ...]}]
  created_by uuid references scholars(id),
  created_at timestamptz not null default now(),
  check (scope <> 'cohort' or cohort is not null)
);
create index if not exists events_starts_idx on events(starts_at);

create table if not exists rsvps (
  event_id uuid not null references events(id) on delete cascade,
  scholar_id uuid not null references scholars(id) on delete cascade,
  status rsvp_status not null default 'going',
  created_at timestamptz not null default now(),
  primary key (event_id, scholar_id)
);

-- ---------- Coaching (2 sessions a month) ----------
create table if not exists coaching_sessions (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references scholars(id) on delete cascade,
  scholar_id uuid references scholars(id) on delete set null, -- null = open slot
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status session_status not null default 'open',
  meeting_link text,
  reflection text,                                         -- private to the scholar
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists coaching_sessions_coach_idx on coaching_sessions(coach_id, starts_at);
create index if not exists coaching_sessions_scholar_idx on coaching_sessions(scholar_id, starts_at);

-- One table serves both the coach thread and the mentor thread.
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  scholar_id uuid not null references scholars(id) on delete cascade,
  counterpart_id uuid not null references scholars(id) on delete cascade,  -- coach or mentor
  sender_id uuid not null references scholars(id) on delete cascade,
  body text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists messages_thread_idx on messages(scholar_id, counterpart_id, created_at);

-- ---------- Mentorship (career support) ----------
create table if not exists mentor_meetings (
  id uuid primary key default gen_random_uuid(),
  scholar_id uuid not null references scholars(id) on delete cascade,
  mentor_id uuid not null references scholars(id) on delete cascade,
  met_at timestamptz not null,
  summary text,
  created_at timestamptz not null default now()
);

-- ---------- Curriculum ----------
create table if not exists curriculum_modules (
  id uuid primary key default gen_random_uuid(),
  cohort text,                                             -- null = every cohort
  position integer not null,
  title text not null,
  theme text,
  summary text,
  taught_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists module_progress (
  scholar_id uuid not null references scholars(id) on delete cascade,
  module_id uuid not null references curriculum_modules(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (scholar_id, module_id)
);
create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references curriculum_modules(id) on delete set null,
  title text not null,
  description text,
  kind resource_kind not null default 'pdf',
  storage_path text,                                       -- in the private 'resources' bucket
  url text,                                                -- for links / external recordings
  duration text,
  pages integer,
  published_at timestamptz not null default now()
);

-- ---------- Project (one a year, final presentation) ----------
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  academic_year text not null,                             -- '2025/26'
  title text not null,
  summary text,
  status project_status not null default 'proposed',
  presentation_event_id uuid references events(id) on delete set null,
  deliverable_path text,                                   -- in 'project-deliverables' bucket
  milestones jsonb not null default '[]',                  -- [{title, due_on, done_at, final}]
  created_at timestamptz not null default now()
);
create table if not exists project_members (
  project_id uuid not null references projects(id) on delete cascade,
  scholar_id uuid not null references scholars(id) on delete cascade,
  primary key (project_id, scholar_id)
);
-- Staff-maintained milestone template copied into new projects.
create table if not exists project_milestone_templates (
  academic_year text not null,
  position integer not null,
  title text not null,
  due_on date not null,
  final boolean not null default false,
  primary key (academic_year, position)
);

-- ---------- Chaplaincy (confidential; minimal by design) ----------
create table if not exists chaplaincy_requests (
  id uuid primary key default gen_random_uuid(),
  scholar_id uuid not null references scholars(id) on delete cascade,
  channel chaplaincy_channel not null default 'phone',
  preferred_times text not null,
  note text check (note is null or length(note) <= 300),
  status chaplaincy_status not null default 'open',
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

-- ---------- Foundation content ----------
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  pinned boolean not null default false,
  published_at timestamptz not null default now(),
  author_id uuid references scholars(id)
);
create table if not exists opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organisation text,
  description text,
  kind opportunity_kind not null default 'other',
  location text,
  deadline timestamptz not null,
  link text,
  published_at timestamptz not null default now()
);
create table if not exists opportunity_interest (
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  scholar_id uuid not null references scholars(id) on delete cascade,
  statement text check (length(statement) <= 600),
  status interest_status not null default 'submitted',
  created_at timestamptz not null default now(),
  primary key (opportunity_id, scholar_id)
);
create table if not exists space_requests (                -- Adam Hub bookings
  id uuid primary key default gen_random_uuid(),
  scholar_id uuid not null references scholars(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  purpose text not null,
  headcount smallint not null default 1 check (headcount between 1 and 12),
  status request_status not null default 'pending',
  staff_note text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists space_requests_time_idx on space_requests(starts_at);
create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  cover_url text,
  gallery jsonb not null default '[]',                     -- [storage paths in 'journal' bucket]
  occurred_on date not null,
  academic_year text not null,
  tagged_scholars uuid[] not null default '{}',
  author_id uuid references scholars(id),
  created_at timestamptz not null default now()
);

-- ---------- Hub feed ----------
create table if not exists hub_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references scholars(id) on delete cascade,
  kind post_kind not null default 'general',
  body text not null check (length(body) between 1 and 1000),
  image_path text,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists hub_posts_created_idx on hub_posts(created_at desc);
create table if not exists hub_likes (
  post_id uuid not null references hub_posts(id) on delete cascade,
  scholar_id uuid not null references scholars(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, scholar_id)
);
create table if not exists hub_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references hub_posts(id) on delete cascade,
  author_id uuid not null references scholars(id) on delete cascade,
  body text not null check (length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

-- ---------- updated_at ----------
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists scholars_updated_at on scholars;
create trigger scholars_updated_at before update on scholars for each row execute function set_updated_at();
