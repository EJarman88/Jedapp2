-- Phase 5 — Timed Practice, Diagnostic & Remediation
--
-- Same content-vs-database split as Phase 4 (see 0005's header comment): the phase
-- doc sketches `question_bank` and `remediation_lessons` as tables, but both are
-- static, admin/dev-authored content with zero per-user state, so they live as JSON
-- under content/practice and content/remediation instead — one less thing to seed or
-- keep in sync with a migration. `practice_answers.question_id` is a content id (text),
-- the same pattern `lesson_progress.lesson_id` already uses for content/lessons.
--
-- What *is* real per-user state, and so does live in Postgres: practice_sessions,
-- practice_answers, ged_ready_scores (manual entry — GED Ready is an external paid
-- tool, per the phase doc), and confidence_checkins.

create table public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  -- Ordered content-id array of the questions drawn for this set, so results can be
  -- scored/diagnosed against the same set later without re-randomizing.
  question_ids jsonb not null,
  time_limit_seconds int not null,
  score int,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index practice_sessions_user_idx on public.practice_sessions (user_id, started_at desc);

create table public.practice_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.practice_sessions (id) on delete cascade,
  question_id text not null,
  selected_index int,
  is_correct boolean not null default false,
  time_spent_seconds int not null default 0,
  created_at timestamptz not null default now()
);

create index practice_answers_session_idx on public.practice_answers (session_id);

create table public.ged_ready_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  subject text not null check (subject in ('RLA', 'Math', 'Science', 'Social Studies')),
  score int not null check (score between 100 and 200),
  attempt_number int not null default 1 check (attempt_number > 0),
  taken_at date not null default current_date,
  created_at timestamptz not null default now()
);

create index ged_ready_scores_user_subject_idx on public.ged_ready_scores (user_id, subject, taken_at);

create table public.confidence_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  context_type text not null check (context_type in ('practice_session', 'extended_response')),
  context_id uuid not null,
  rating int not null check (rating between 1 and 4),
  phase text not null check (phase in ('pre', 'post')),
  created_at timestamptz not null default now()
);

create index confidence_checkins_context_idx on public.confidence_checkins (context_type, context_id);

alter table public.practice_sessions enable row level security;
alter table public.practice_answers enable row level security;
alter table public.ged_ready_scores enable row level security;
alter table public.confidence_checkins enable row level security;

-- practice_sessions ----------------------------------------------------------
create policy "student manages own practice sessions"
  on public.practice_sessions for all
  using (public.current_user_role() = 'student' and user_id = auth.uid())
  with check (public.current_user_role() = 'student' and user_id = auth.uid());

-- Mirrors 0006: lets the admin's "preview as student" mode run real practice sets
-- under her own user_id, fully separate from Jalisa's real rows.
create policy "admin manages own preview practice sessions"
  on public.practice_sessions for all
  using (public.current_user_role() = 'admin' and user_id = auth.uid())
  with check (public.current_user_role() = 'admin' and user_id = auth.uid());

-- Scores only, never raw text — feeds admin reporting later (Phase 8), same reasoning
-- as 0005's "admin reads lesson progress" policy.
create policy "admin reads practice sessions"
  on public.practice_sessions for select
  using (public.current_user_role() = 'admin');

-- practice_answers -------------------------------------------------------------
create policy "student manages own practice answers"
  on public.practice_answers for all
  using (
    public.current_user_role() = 'student'
    and exists (
      select 1 from public.practice_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  )
  with check (
    public.current_user_role() = 'student'
    and exists (
      select 1 from public.practice_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

create policy "admin manages own preview practice answers"
  on public.practice_answers for all
  using (
    public.current_user_role() = 'admin'
    and exists (
      select 1 from public.practice_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  )
  with check (
    public.current_user_role() = 'admin'
    and exists (
      select 1 from public.practice_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

create policy "admin reads practice answers"
  on public.practice_answers for select
  using (public.current_user_role() = 'admin');

-- ged_ready_scores ------------------------------------------------------------
create policy "student manages own ged ready scores"
  on public.ged_ready_scores for all
  using (public.current_user_role() = 'student' and user_id = auth.uid())
  with check (public.current_user_role() = 'student' and user_id = auth.uid());

create policy "admin reads ged ready scores"
  on public.ged_ready_scores for select
  using (public.current_user_role() = 'admin');

-- confidence_checkins ----------------------------------------------------------
create policy "student manages own confidence checkins"
  on public.confidence_checkins for all
  using (public.current_user_role() = 'student' and user_id = auth.uid())
  with check (public.current_user_role() = 'student' and user_id = auth.uid());

create policy "admin manages own preview confidence checkins"
  on public.confidence_checkins for all
  using (public.current_user_role() = 'admin' and user_id = auth.uid())
  with check (public.current_user_role() = 'admin' and user_id = auth.uid());

create policy "admin reads confidence checkins"
  on public.confidence_checkins for select
  using (public.current_user_role() = 'admin');
