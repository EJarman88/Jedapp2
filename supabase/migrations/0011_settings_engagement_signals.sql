-- Phase 9 — Settings & Engagement Signals
--
-- Three pieces: (1) lets the student manage her own digest_subscriptions rows and
-- read the admin/restricted_reports display names her Settings screen needs to show
-- (both previously admin-only per Phase 2's RLS), (2) the engagement_events log that
-- feeds the weekly digest, and (3) a carryover counter on agenda_items so
-- "item_avoided" can fire at a precise threshold instead of being recomputed ad hoc.

-- ---------------------------------------------------------------------------------
-- digest_subscriptions: the student decides whether a weekly summary goes out about
-- her own activity — separate from full Reports access (CLAUDE.md doesn't specify
-- this, but it's the same "her own data, her call" pattern as parent_access_enabled).
-- ---------------------------------------------------------------------------------
create policy "student reads digest subscriptions"
  on public.digest_subscriptions for select
  using (public.current_user_role() = 'student');

create policy "student toggles digest subscriptions"
  on public.digest_subscriptions for update
  using (public.current_user_role() = 'student')
  with check (public.current_user_role() = 'student');

create or replace function public.enforce_digest_subscription_student_toggle()
returns trigger
language plpgsql
as $$
begin
  if public.current_user_role() = 'student' and new.user_id is distinct from old.user_id then
    raise exception 'You can only change whether the digest is enabled.';
  end if;
  return new;
end;
$$;

create trigger digest_subscriptions_enforce_student_toggle
  before update on public.digest_subscriptions
  for each row execute function public.enforce_digest_subscription_student_toggle();

-- ---------------------------------------------------------------------------------
-- A narrow, SECURITY DEFINER read of household display names — not a broadened
-- `users` policy, which would also expose email/theme/etc. Only id/role/display_name,
-- and only the admin + restricted_reports rows, and only to the student.
-- ---------------------------------------------------------------------------------
create or replace function public.household_members_for_student()
returns table (id uuid, role text, display_name text)
language sql
security definer
stable
set search_path = public
as $$
  select u.id, u.role, u.display_name
  from public.users u
  where public.current_user_role() = 'student'
    and u.role in ('admin', 'restricted_reports');
$$;

grant execute on function public.household_members_for_student() to authenticated;

-- ---------------------------------------------------------------------------------
-- Agenda carryover count — lets item_avoided fire exactly once, at the moment an
-- item crosses 3 carryovers, instead of being recomputed from scratch on every digest.
-- ---------------------------------------------------------------------------------
alter table public.agenda_items add column carryover_count int not null default 0;

-- ---------------------------------------------------------------------------------
-- engagement_events — CLAUDE.md rule #4: metadata-only, behavior never emotion. No
-- column here may ever encode an inferred mental/emotional state (mood, stress,
-- etc.) — if a future event type needs that, it doesn't belong in this table.
-- ---------------------------------------------------------------------------------
create table public.engagement_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  event_type text not null check (event_type in (
    'session_started', 'session_completed', 'item_avoided', 'hint_skipped',
    'fast_completion', 'paste_detected', 'answer_pattern_flag'
  )),
  context_type text,
  context_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index engagement_events_user_idx on public.engagement_events (user_id, created_at desc);

alter table public.engagement_events enable row level security;

create policy "student logs own engagement events"
  on public.engagement_events for insert
  with check (public.current_user_role() = 'student' and user_id = auth.uid());

create policy "student reads own engagement events"
  on public.engagement_events for select
  using (public.current_user_role() = 'student' and user_id = auth.uid());

create policy "admin reads engagement events"
  on public.engagement_events for select
  using (public.current_user_role() = 'admin');

create policy "restricted reports reads engagement events when granted"
  on public.engagement_events for select
  using (public.has_active_reports_grant(auth.uid()));
