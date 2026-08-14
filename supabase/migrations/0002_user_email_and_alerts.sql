-- Adds email to public.users (denormalized from auth.users, which the client can't
-- query directly) so the admin's Settings screen can show who has signed up.

alter table public.users add column email text not null default '';

update public.users u
set email = a.email
from auth.users a
where u.id = a.id and u.email = '';

alter table public.users alter column email drop default;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_exists boolean;
  restricted_exists boolean;
  assigned_role text;
  admin_id uuid;
begin
  select exists(select 1 from public.users where role = 'admin') into admin_exists;
  select exists(select 1 from public.users where role = 'restricted_reports') into restricted_exists;

  if not admin_exists then
    assigned_role := 'admin';
  elsif not restricted_exists then
    assigned_role := 'restricted_reports';
  else
    raise exception 'EdApp only supports one admin account and one restricted-reports account.';
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
