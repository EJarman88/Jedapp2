-- Phase 2 — Auth & Account Model
--
-- Two accounts will ever exist: Jalisa (role='admin', full access) and her dad
-- (role='restricted_reports', Reports-only, gated by access_grants). Row creation is
-- driven entirely by a trigger on auth.users so app code never gets to choose a role.

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'restricted_reports')),
  display_name text not null,
  created_at timestamptz not null default now()
);

create table public.access_grants (
  id uuid primary key default gen_random_uuid(),
  grantor_user_id uuid not null references public.users (id) on delete cascade,
  grantee_user_id uuid not null references public.users (id) on delete cascade,
  scope text not null check (scope in ('reports')),
  status text not null check (status in ('inert', 'active', 'revoked')) default 'inert',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (grantee_user_id, scope)
);

create table public.digest_subscriptions (
  user_id uuid primary key references public.users (id) on delete cascade,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Minimal stub for the raw extended-response text this phase must prove is
-- unreachable by the restricted role. Phase 6 owns the full holding-state/sharing
-- schema and will extend this table — the lockdown policy below must survive that.
create table public.extended_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  raw_text text not null,
  created_at timestamptz not null default now()
);

create index access_grants_grantee_idx on public.access_grants (grantee_user_id, scope);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger access_grants_set_updated_at
  before update on public.access_grants
  for each row execute function public.set_updated_at();

create trigger digest_subscriptions_set_updated_at
  before update on public.digest_subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Account provisioning: role is assigned server-side, never chosen by the client.
-- First person to sign up becomes admin (Jalisa). The second becomes the
-- restricted reports role (dad), with an inert grant and a disabled digest
-- subscription created automatically — no separate "create dad's account" step.
-- A third signup is rejected outright since only these two accounts ever exist.
-- ---------------------------------------------------------------------------
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

  insert into public.users (id, role, display_name)
  values (
    new.id,
    assigned_role,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.access_grants enable row level security;
alter table public.digest_subscriptions enable row level security;
alter table public.extended_responses enable row level security;

-- SECURITY DEFINER helpers so policies on `users` don't recurse into `users`.
create or replace function public.current_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.has_active_reports_grant(target_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.access_grants
    where grantee_user_id = target_user_id
      and scope = 'reports'
      and status = 'active'
  );
$$;

-- users -----------------------------------------------------------------
create policy "users read own row"
  on public.users for select
  using (id = auth.uid());

create policy "admin reads all users"
  on public.users for select
  using (public.current_user_role() = 'admin');

create policy "admin updates users"
  on public.users for update
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- access_grants -----------------------------------------------------------
-- Only Jalisa (as grantor) can create/change grants — this is what Settings (Phase 9)
-- writes to when she toggles dad's access. Dad may only ever read his own row, which
-- is what powers his "not yet active" / "access not currently available" state.
create policy "admin manages own grants"
  on public.access_grants for all
  using (public.current_user_role() = 'admin' and grantor_user_id = auth.uid())
  with check (public.current_user_role() = 'admin' and grantor_user_id = auth.uid());

create policy "grantee reads own grant"
  on public.access_grants for select
  using (grantee_user_id = auth.uid());

-- digest_subscriptions ------------------------------------------------------
create policy "admin manages digest subscriptions"
  on public.digest_subscriptions for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "grantee reads own digest subscription"
  on public.digest_subscriptions for select
  using (user_id = auth.uid());

-- extended_responses ---------------------------------------------------------
-- Deliberately the ONLY policy on this table: Jalisa, on her own rows. There is no
-- policy of any kind for restricted_reports, on purpose — RLS defaults to deny, so
-- the restricted role gets zero rows no matter what access_grants.status says.
-- Do not add a restricted-role policy here, ever, even in Phase 6.
create policy "admin only access to own extended responses"
  on public.extended_responses for all
  using (public.current_user_role() = 'admin' and user_id = auth.uid())
  with check (public.current_user_role() = 'admin' and user_id = auth.uid());
