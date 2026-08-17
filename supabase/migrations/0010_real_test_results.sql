-- Phase 8 — Reporting & Admin Dashboard
--
-- Only new table this phase needs: real_test_results. The $75-per-subject incentive
-- is earned by actually passing the real GED exam (confirmed with the project owner)
-- — not by a GED Ready score reaching 145, which the phase doc itself flags as a
-- meaningfully different (and lower) bar. Entered manually by the admin, same "no
-- external API call" reasoning as ged_ready_scores.

create table public.real_test_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  subject text not null check (subject in ('RLA', 'Math', 'Science', 'Social Studies')),
  passed boolean not null default false,
  -- Separate from `passed`: she can pass the exam before the $75 actually changes
  -- hands. The dashboard's "earned" badge reflects `passed`; `paid_out` is its own
  -- ledger flag so admin can track the money separately from the credential.
  paid_out boolean not null default false,
  date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, subject)
);

alter table public.real_test_results enable row level security;

-- Admin-entered ledger data about the single student, not "her own rows" in the
-- usual sense — admin manages every row here, unscoped, the same way she manages
-- access_grants and curated_videos.
create policy "admin manages real test results"
  on public.real_test_results for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "student reads own real test results"
  on public.real_test_results for select
  using (public.current_user_role() = 'student' and user_id = auth.uid());

create policy "restricted reports reads real test results when granted"
  on public.real_test_results for select
  using (
    exists (
      select 1 from public.access_grants ag
      where ag.grantee_user_id = auth.uid() and ag.scope = 'reports' and ag.status = 'active'
    )
  );

-- Bug fix (still within Phase 8, not yet shipped): the trait-trends section of the
-- reports dashboard needs to know which extended_responses exist, their privacy
-- status, and submission order — but extended_responses has deliberately NO policy
-- for admin/restricted (Phase 6, so raw_text can never leak to them). That lockdown
-- correctly blocks raw_text, but it also blocked these three harmless columns, which
-- broke trait trends + the privacy summary line for every non-student viewer.
--
-- Fix: a SECURITY DEFINER function that returns only the safe columns — raw_text
-- structurally cannot leak through it, because the function's return type doesn't
-- include it, regardless of what future app code does with the result. This is the
-- narrow exception to "no restricted-role policy on this table, ever" — it's a
-- different, safer mechanism, not a policy on the table itself.
create or replace function public.reportable_extended_responses(target_user_id uuid)
returns table (id uuid, privacy_status text, submitted_at timestamptz)
language sql
security definer
stable
set search_path = public
as $$
  select er.id, er.privacy_status, er.submitted_at
  from public.extended_responses er
  where er.user_id = target_user_id
    and (
      (public.current_user_role() = 'student' and target_user_id = auth.uid())
      or public.current_user_role() = 'admin'
      or public.has_active_reports_grant(auth.uid())
    )
  order by er.submitted_at asc;
$$;

grant execute on function public.reportable_extended_responses(uuid) to authenticated;
