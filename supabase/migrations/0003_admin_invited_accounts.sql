-- Closes open self-signup after the admin account exists. Previously the second
-- person to hit /signup automatically became the restricted_reports account — that
-- let anyone who found the URL grab that slot ahead of dad. Now:
--
--   - The first signup still bootstraps the admin account (Jalisa), same as before.
--   - Any account after that is only created if it carries an `invited_by_admin` flag
--     in its user metadata — which only the admin-only invite Server Action sets, via
--     the service-role key. Signing up through the public form after an admin exists
--     is rejected outright.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_exists boolean;
  restricted_exists boolean;
  invited boolean;
  assigned_role text;
  admin_id uuid;
begin
  select exists(select 1 from public.users where role = 'admin') into admin_exists;
  select exists(select 1 from public.users where role = 'restricted_reports') into restricted_exists;
  invited := coalesce((new.raw_user_meta_data ->> 'invited_by_admin')::boolean, false);

  if not admin_exists then
    assigned_role := 'admin';
  elsif invited and not restricted_exists then
    assigned_role := 'restricted_reports';
  else
    raise exception 'This account can only be created by the admin, from Settings.';
  end if;

  insert into public.users (id, role, display_name, email)
  values (
    new.id,
    assigned_role,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.email
  );

  if assigned_role = 'restricted_reports' then
    select id into admin_id from public.users where role = 'admin';

    insert into public.access_grants (grantor_user_id, grantee_user_id, scope, status)
    values (admin_id, new.id, 'reports', 'inert');

    insert into public.digest_subscriptions (user_id, enabled)
    values (new.id, false);
  end if;

  return new;
end;
$$;

-- Lets the public /signup page tell "nobody has bootstrapped yet" from "admin already
-- exists, so signup is closed" without needing a session — reveals nothing but a
-- boolean, so it's safe to expose to anon.
create or replace function public.admin_account_exists()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(select 1 from public.users where role = 'admin');
$$;

grant execute on function public.admin_account_exists() to anon, authenticated;
