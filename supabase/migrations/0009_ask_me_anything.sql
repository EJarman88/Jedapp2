-- Phase 7 — Ask Me (Almost) Anything
--
-- Numbered 0009, not 0007: this branch forked from main before the Phase 5
-- (practice/diagnostic/remediation, 0007) and Phase 6 (extended-response privacy,
-- 0008) branches merged, so those numbers are already claimed on branches this one
-- doesn't depend on. Neither phase's tables are referenced here.
--
-- Feature A only (in-app tracked help) has a data model — Feature B ("Talk to
-- Claude") deliberately writes to nothing, per the phase doc.
--
-- Privacy tier for help_messages (per the phase doc's "confirm before building"
-- note): the simple default, not Phase 6's delete/keep/share treatment — visible to
-- Jalisa always, visible to dad only while his Reports access is active. This is
-- the same shape as trait_scores' RLS in 0008, applied directly here since there's
-- no raw-text-vs-structured-score split for a tutoring transcript.

create table public.help_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  subject text not null check (subject in ('RLA', 'Math', 'Science', 'Social Studies')),
  status text not null check (status in ('active', 'completed')) default 'active',
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index help_sessions_user_started_idx on public.help_sessions (user_id, started_at desc);

create table public.help_problems (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.help_sessions (id) on delete cascade,
  -- Private-bucket storage path (help-photos/<user_id>/<session_id>/<file>), not a
  -- public URL — read access is generated as a short-lived signed URL. Null for a
  -- typed-in problem (no photo).
  source_image_path text,
  extracted_text text not null,
  order_index int not null default 0,
  solved boolean not null default false
);

create index help_problems_session_idx on public.help_problems (session_id, order_index);

create table public.help_messages (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.help_problems (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index help_messages_problem_idx on public.help_messages (problem_id, created_at);

alter table public.help_sessions enable row level security;
alter table public.help_problems enable row level security;
alter table public.help_messages enable row level security;

-- help_sessions ------------------------------------------------------------------
create policy "student manages own help sessions"
  on public.help_sessions for all
  using (public.current_user_role() = 'student' and user_id = auth.uid())
  with check (public.current_user_role() = 'student' and user_id = auth.uid());

-- Mirrors 0006: lets the admin's "preview as student" mode run real help sessions
-- under her own user_id, fully separate from Jalisa's real rows.
create policy "admin manages own preview help sessions"
  on public.help_sessions for all
  using (public.current_user_role() = 'admin' and user_id = auth.uid())
  with check (public.current_user_role() = 'admin' and user_id = auth.uid());

create policy "admin reads help sessions"
  on public.help_sessions for select
  using (public.current_user_role() = 'admin');

create policy "restricted reports reads help sessions when granted"
  on public.help_sessions for select
  using (
    exists (
      select 1 from public.access_grants ag
      where ag.grantee_user_id = auth.uid() and ag.scope = 'reports' and ag.status = 'active'
    )
  );

-- help_problems --------------------------------------------------------------
create policy "student manages own help problems"
  on public.help_problems for all
  using (
    public.current_user_role() = 'student'
    and exists (select 1 from public.help_sessions hs where hs.id = session_id and hs.user_id = auth.uid())
  )
  with check (
    public.current_user_role() = 'student'
    and exists (select 1 from public.help_sessions hs where hs.id = session_id and hs.user_id = auth.uid())
  );

create policy "admin manages own preview help problems"
  on public.help_problems for all
  using (
    public.current_user_role() = 'admin'
    and exists (select 1 from public.help_sessions hs where hs.id = session_id and hs.user_id = auth.uid())
  )
  with check (
    public.current_user_role() = 'admin'
    and exists (select 1 from public.help_sessions hs where hs.id = session_id and hs.user_id = auth.uid())
  );

create policy "admin reads help problems"
  on public.help_problems for select
  using (public.current_user_role() = 'admin');

create policy "restricted reports reads help problems when granted"
  on public.help_problems for select
  using (
    exists (
      select 1 from public.access_grants ag
      where ag.grantee_user_id = auth.uid() and ag.scope = 'reports' and ag.status = 'active'
    )
  );

-- help_messages ----------------------------------------------------------------
create policy "student manages own help messages"
  on public.help_messages for all
  using (
    public.current_user_role() = 'student'
    and exists (
      select 1 from public.help_problems hp
      join public.help_sessions hs on hs.id = hp.session_id
      where hp.id = problem_id and hs.user_id = auth.uid()
    )
  )
  with check (
    public.current_user_role() = 'student'
    and exists (
      select 1 from public.help_problems hp
      join public.help_sessions hs on hs.id = hp.session_id
      where hp.id = problem_id and hs.user_id = auth.uid()
    )
  );

create policy "admin manages own preview help messages"
  on public.help_messages for all
  using (
    public.current_user_role() = 'admin'
    and exists (
      select 1 from public.help_problems hp
      join public.help_sessions hs on hs.id = hp.session_id
      where hp.id = problem_id and hs.user_id = auth.uid()
    )
  )
  with check (
    public.current_user_role() = 'admin'
    and exists (
      select 1 from public.help_problems hp
      join public.help_sessions hs on hs.id = hp.session_id
      where hp.id = problem_id and hs.user_id = auth.uid()
    )
  );

create policy "admin reads help messages"
  on public.help_messages for select
  using (public.current_user_role() = 'admin');

create policy "restricted reports reads help messages when granted"
  on public.help_messages for select
  using (
    exists (
      select 1 from public.access_grants ag
      where ag.grantee_user_id = auth.uid() and ag.scope = 'reports' and ag.status = 'active'
    )
  );

-- Storage: private bucket for homework photos ----------------------------------
-- Not public — every read goes through a short-lived signed URL generated
-- server-side for the owning student (see lib/help/storage.ts).
insert into storage.buckets (id, name, public)
values ('help-photos', 'help-photos', false)
on conflict (id) do nothing;

-- Path convention: <user_id>/<session_id>/<filename> — storage.foldername(name)[1]
-- is the first path segment, so this scopes access to the uploader's own folder.
-- Kept student/admin-preview-only, same as the tables above; nobody else needs the
-- raw photo (admin/restricted reporting reads the extracted_text transcript instead).
create policy "student manages own help photos"
  on storage.objects for all
  using (
    bucket_id = 'help-photos'
    and public.current_user_role() = 'student'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'help-photos'
    and public.current_user_role() = 'student'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "admin manages own preview help photos"
  on storage.objects for all
  using (
    bucket_id = 'help-photos'
    and public.current_user_role() = 'admin'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'help-photos'
    and public.current_user_role() = 'admin'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
