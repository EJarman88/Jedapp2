-- Phase 6 — Extended Response & Privacy System
--
-- The most sensitive phase in the app (CLAUDE.md rule #3). Extends the minimal
-- extended_responses stub from 0001/0003 with the full holding-state/sharing schema,
-- and adds trait_scores + reviewer_links. question prompts are content (JSON), same
-- content-vs-database split as Phase 4/5 — see content/extended-response.

alter table public.extended_responses rename column created_at to submitted_at;
alter table public.extended_responses alter column raw_text drop not null;

alter table public.extended_responses add column prompt_id text not null default '';
alter table public.extended_responses alter column prompt_id drop default;

alter table public.extended_responses add column privacy_status text not null
  check (privacy_status in ('pending', 'deleted', 'private', 'shared')) default 'pending';
alter table public.extended_responses add column privacy_decided_at timestamptz;
alter table public.extended_responses add column auto_delete_at timestamptz not null
  default (now() + interval '48 hours');

create table public.trait_scores (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.extended_responses (id) on delete cascade,
  trait text not null check (
    trait in ('argument_analysis', 'organization', 'language_command', 'grammar_conventions')
  ),
  score int not null check (score between 1 and 4),
  -- Warm, plain-language, pattern-level feedback for the learner — never a clinical
  -- score readout, never a psychological/emotional read (CLAUDE.md rule #2/#4).
  ai_notes_md text not null,
  created_at timestamptz not null default now(),
  unique (response_id, trait)
);

create index trait_scores_response_idx on public.trait_scores (response_id);

create table public.reviewer_links (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.extended_responses (id) on delete cascade,
  -- Unguessable one-time-link token — a uuid, same randomness source as every other
  -- id in this schema (gen_random_uuid()), so no extra token-generation code needed.
  token uuid not null default gen_random_uuid() unique,
  reviewer_label text not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  viewed_at timestamptz
);

create index reviewer_links_response_idx on public.reviewer_links (response_id);
-- Fast, RLS-free lookup by token for the public /review/[token] page (queried via the
-- service-role client — see lib/supabase/admin.ts — since an anonymous visitor has no
-- auth.uid() for RLS to key off at all).
create index reviewer_links_token_idx on public.reviewer_links (token) where revoked_at is null;

alter table public.trait_scores enable row level security;
alter table public.reviewer_links enable row level security;

-- trait_scores ------------------------------------------------------------------
-- Structured scores are always safe to share per product design — NOT subject to the
-- same total lockout as raw_text (below). Student writes/reads her own via the same
-- request that calls the scoring API; admin/restricted read for reporting (Phase 8),
-- gated by the same access_grants mechanism Phase 2 already uses for reports access.
create policy "student manages own trait scores"
  on public.trait_scores for all
  using (
    public.current_user_role() = 'student'
    and exists (
      select 1 from public.extended_responses er
      where er.id = response_id and er.user_id = auth.uid()
    )
  )
  with check (
    public.current_user_role() = 'student'
    and exists (
      select 1 from public.extended_responses er
      where er.id = response_id and er.user_id = auth.uid()
    )
  );

create policy "admin reads trait scores"
  on public.trait_scores for select
  using (public.current_user_role() = 'admin');

create policy "restricted reports reads trait scores when granted"
  on public.trait_scores for select
  using (
    exists (
      select 1 from public.access_grants ag
      where ag.grantee_user_id = auth.uid()
        and ag.scope = 'reports'
        and ag.status = 'active'
    )
  );

-- reviewer_links ------------------------------------------------------------------
-- Student-only, scoped through the response she owns. Deliberately no policy for
-- anyone else — including no restricted/admin policy — so RLS denies every other
-- role by default. The public /review/[token] page never uses this policy at all:
-- it goes through the service-role client and does its own token check in code.
create policy "student manages own reviewer links"
  on public.reviewer_links for all
  using (
    public.current_user_role() = 'student'
    and exists (
      select 1 from public.extended_responses er
      where er.id = response_id and er.user_id = auth.uid()
    )
  )
  with check (
    public.current_user_role() = 'student'
    and exists (
      select 1 from public.extended_responses er
      where er.id = response_id and er.user_id = auth.uid()
    )
  );
