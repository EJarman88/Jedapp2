-- Replaces the old 2-role model (single admin = the learner herself) with three
-- roles: admin (capped at 1 — already exists), student (capped at 2), and
-- restricted_reports (capped at 3). All self-service signup, role chosen explicitly
-- via `requested_role` in user metadata. Admin is no longer offered at signup at all
-- — it's permanently filled.

alter table public.users add column date_of_birth date;
alter table public.users add column parent_access_enabled boolean not null default true;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  student_count int;
  restricted_count int;
begin
  requested_role := new.raw_user_meta_data ->> 'requested_role';

  if requested_role not in ('student', 'restricted_reports') then
    raise exception 'Choose an account type to sign up.';
  end if;

  if requested_role = 'student' then
    select count(*) into student_count from public.users where role = 'student';
    if student_count >= 2 then
      raise exception 'Both student account slots are already taken.';
    end if;
  else
    select count(*) into restricted_count from public.users where role = 'restricted_reports';
    if restricted_count >= 3 then
      raise exception 'All reports-only account slots are already taken.';
    end if;
  end if;

  insert into public.users (id, role, display_name, email, date_of_birth)
  values (
    new.id,
    requested_role,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.email,
    case
      when requested_role = 'student' then nullif(new.raw_user_meta_data ->> 'date_of_birth', '')::date
      else null
    end
  );

  if requested_role = 'restricted_reports' then
    insert into public.access_grants (grantor_user_id, grantee_user_id, scope, status)
    select id, new.id, 'reports', 'inert' from public.users where role = 'admin' limit 1;

    insert into public.digest_subscriptions (user_id, enabled)
    values (new.id, false);
  end if;

  return new;
end;
$$;

-- Lets /signup show only the account types that still have room, without a session.
create or replace function public.student_signup_available()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select (select count(*) from public.users where role = 'student') < 2;
$$;

create or replace function public.restricted_signup_available()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select (select count(*) from public.users where role = 'restricted_reports') < 3;
$$;

drop function if exists public.admin_account_exists();
drop function if exists public.restricted_account_exists();

grant execute on function public.student_signup_available() to anon, authenticated;
grant execute on function public.restricted_signup_available() to anon, authenticated;

-- A student may update only her own parent_access_enabled flag, and only once she's
-- 18+ — the RLS policy grants row-level eligibility; the trigger below enforces which
-- column actually changed and the age gate (RLS alone can't do column-level rules).
create policy "students update own row"
  on public.users for update
  using (id = auth.uid() and role = 'student')
  with check (id = auth.uid() and role = 'student');

create or replace function public.enforce_parent_access_toggle()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() = new.id and public.current_user_role() = 'student' then
    if new.role is distinct from old.role
       or new.email is distinct from old.email
       or new.display_name is distinct from old.display_name
       or new.date_of_birth is distinct from old.date_of_birth then
      raise exception 'You can only change your parent-access setting here.';
    end if;

    if new.parent_access_enabled is distinct from old.parent_access_enabled then
      if old.date_of_birth is null or age(old.date_of_birth) < interval '18 years' then
        raise exception 'You need to be 18 or older to change this.';
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger users_enforce_parent_access_toggle
  before update on public.users
  for each row execute function public.enforce_parent_access_toggle();

-- extended_responses was scoped to "admin, own rows" — wrong now that admin and
-- student are different people. Raw extended-response text belongs to the student who
-- wrote it, per CLAUDE.md's privacy rule; nobody else (not even the admin/parent) gets
-- an automatic policy here. Phase 6 adds the one-time reviewer-link mechanism on top.
drop policy "admin only access to own extended responses" on public.extended_responses;

create policy "student manages own extended responses"
  on public.extended_responses for all
  using (public.current_user_role() = 'student' and user_id = auth.uid())
  with check (public.current_user_role() = 'student' and user_id = auth.uid());
