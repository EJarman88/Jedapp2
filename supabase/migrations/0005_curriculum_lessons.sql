-- Phase 4 — Curriculum & Lessons
--
-- Deliberate deviation from the phase doc's literal `lessons` / `lesson_blocks` /
-- `vocab_terms` sketch: this app favors simplicity (CLAUDE.md — single-family, low-scale)
-- over a DB-backed content model. Lesson content lives as JSON under /content/lessons,
-- read directly by the app — "authored via content files with zero code changes" is
-- true without a seed/sync step. The DB only owns what's genuinely per-user state
-- (lesson_progress) or admin-editable-without-a-deploy (curated_videos), per the
-- phase doc's own curated-video-system note.

create table public.curated_videos (
  id uuid primary key default gen_random_uuid(),
  skill_tag text not null,
  title text not null,
  youtube_url text not null,
  channel_name text,
  duration_seconds int,
  created_at timestamptz not null default now()
);

create index curated_videos_skill_tag_idx on public.curated_videos (skill_tag);

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  -- References a Lesson.id (slug) from content/lessons — not a DB foreign key, since
  -- lesson content isn't a table here.
  lesson_id text not null,
  status text not null check (status in ('not_started', 'in_progress', 'completed')) default 'not_started',
  last_position int not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create trigger lesson_progress_set_updated_at
  before update on public.lesson_progress
  for each row execute function public.set_updated_at();

-- Links an agenda item to the lesson (or, later, practice set) it opens. Nullable —
-- 'other' items and not-yet-content-backed items have none.
alter table public.agenda_items add column content_slug text;

alter table public.curated_videos enable row level security;
alter table public.lesson_progress enable row level security;

-- curated_videos ------------------------------------------------------------
create policy "student reads curated videos"
  on public.curated_videos for select
  using (public.current_user_role() = 'student');

create policy "admin manages curated videos"
  on public.curated_videos for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- lesson_progress -------------------------------------------------------------
create policy "student manages own lesson progress"
  on public.lesson_progress for all
  using (public.current_user_role() = 'student' and user_id = auth.uid())
  with check (public.current_user_role() = 'student' and user_id = auth.uid());

-- Standards mastery feeds admin reporting later (Phase 8) — admin needs read access,
-- never write, and never touches the raw-text privacy rules (this table has no text).
create policy "admin reads lesson progress"
  on public.lesson_progress for select
  using (public.current_user_role() = 'admin');

-- One demo row so the "optional curated video" card has something to render out of the
-- box; the admin-only /videos page is the real ongoing way to add these.
insert into public.curated_videos (skill_tag, title, youtube_url, channel_name, duration_seconds)
values ('claims-vs-evidence', 'Claims vs. Evidence, Explained', 'https://www.youtube.com/watch?v=REPLACE_ME', 'Study Hall', 240);
