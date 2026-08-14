-- Signup stays open and self-service for everyone, but the account type is now an
-- explicit choice on the form (`requested_role` in user metadata) instead of inferred
-- from signup order. Any number of `admin` accounts can exist (e.g. a parent and
-- Jalisa both with full access); exactly one `restricted_reports` account ever can.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  restricted_exists boolean;
  admin_exists boolean;
  admin_id uuid;
begin
  requested_role := new.raw_user_meta_data ->> 'requested_role';

  if requested_role not in ('admin', 'restricted_reports') then
    raise exception 'Choose an account type to sign up.';
  end if;

  if requested_role = 'restricted_reports' then
    select exists(select 1 from public.users where role = 'restricted_reports') into restricted_exists;
    if restricted_exists then
      raise exception 'The reports-only account has already been created.';
    end if;

    select exists(select 1 from public.users where role = 'admin') into admin_exists;
    if not admin_exists then
      raise exception 'An admin account needs to be created first.';
    end if;
  end if;

  insert into public.users (id, role, display_name, email)
  values (
    new.id,
    requested_role,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.email
  );

  if requested_role = 'restricted_reports' then
    select id into admin_id from public.users where role = 'admin' limit 1;

    insert into public.access_grants (grantor_user_id, grantee_user_id, scope, status)
    values (admin_id, new.id, 'reports', 'inert');

    insert into public.digest_subscriptions (user_id, enabled)
    values (new.id, false);
  end if;

  return new;
end;
$$;

-- Lets /signup hide the "Reports only" choice once that single slot is taken, without
-- needing a session. Reveals nothing but a boolean.
create or replace function public.restricted_account_exists()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(select 1 from public.users where role = 'restricted_reports');
$$;

grant execute on function public.restricted_account_exists() to anon, authenticated;

-- Any admin can manage the reports grant now — not just whichever admin happened to
-- be recorded as grantor_user_id when it was created.
drop policy if exists "admin manages own grants" on public.access_grants;

create policy "admin manages grants"
  on public.access_grants for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');
