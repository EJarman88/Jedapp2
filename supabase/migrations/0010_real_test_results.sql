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
