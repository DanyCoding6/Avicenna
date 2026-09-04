-- Invite-only sign-in. Staff insert a scholars row (email, name, cohort…) first.
-- When that email signs in for the first time, the new auth user is linked to the row.
-- Any other email is rejected, so the magic-link/OTP flow refuses unknown addresses.
--
-- The scholars.id must equal auth.users.id for RLS to be simple, so on first sign-in
-- we re-key the pre-loaded row to the new auth id (FKs cascade via ON UPDATE below).

alter table scholars drop constraint if exists scholars_coach_id_fkey;
alter table scholars add constraint scholars_coach_id_fkey foreign key (coach_id) references scholars(id) on delete set null on update cascade;
alter table scholars drop constraint if exists scholars_mentor_id_fkey;
alter table scholars add constraint scholars_mentor_id_fkey foreign key (mentor_id) references scholars(id) on delete set null on update cascade;

create or replace function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  existing_id uuid;
begin
  select id into existing_id from scholars where lower(email) = lower(new.email);
  if existing_id is null then
    raise exception 'This email address is not on the Avicenna scholars list.' using errcode = 'P0001';
  end if;
  if existing_id <> new.id then
    -- Re-key the pre-loaded row to the auth user id. Referencing rows follow via ON UPDATE CASCADE
    -- (added below for every FK that points at scholars).
    update scholars set id = new.id, auth_linked = true where id = existing_id;
  else
    update scholars set auth_linked = true where id = new.id;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Make every FK to scholars(id) follow the re-key.
do $$
declare r record;
begin
  for r in
    select con.conname, con.conrelid::regclass as tbl, att.attname
    from pg_constraint con
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any(con.conkey)
    where con.contype = 'f' and con.confrelid = 'public.scholars'::regclass and con.confupdtype <> 'c'
  loop
    execute format('alter table %s drop constraint %I', r.tbl, r.conname);
    execute format('alter table %s add constraint %I foreign key (%I) references public.scholars(id) on delete cascade on update cascade', r.tbl, r.conname, r.attname);
  end loop;
end $$;
