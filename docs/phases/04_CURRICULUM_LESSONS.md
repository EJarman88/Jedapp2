# Phase 4 — Curriculum & Lessons

Load this with CLAUDE.md. Goal: the lesson experience, content model, and the curated
supplementary-video system.

## Content approach (per CLAUDE.md rule #1)

All lesson/practice content is ORIGINAL, written to match real GED format and rigor.
Never real GED Testing Service items. Content should be authored as structured data
(JSON or MDX under `/content`), not hardcoded in components, so it's editable without
code changes.

## Data model

```sql
lessons         -- id, subject, title, standard_tag, order_index
lesson_blocks   -- id, lesson_id, block_type ('content'|'check'), body_md, order_index
                -- for 'check' blocks: question, options (jsonb), correct_index, feedback_correct, feedback_incorrect
vocab_terms     -- id, lesson_id, term, definition   (for tap-to-define underlining)
lesson_progress -- user_id, lesson_id, status, last_position, updated_at
curated_videos  -- id, skill_tag, title, youtube_url, channel_name, duration_seconds
quotes          -- id, text, attribution, category ('resilience'|'general')  -- see note below
```

## Lesson screen requirements (match reference mockup exactly)

- **No mascot/character.** No avatar, no persona, no speech bubble UI.
- **Read-aloud**: single icon button, top-right, reads the full lesson content aloud
  (use the Web Speech API `SpeechSynthesis` client-side — no need for a paid TTS service
  unless voice quality becomes a real issue later).
- **Italic tip line**: short, quiet encouragement text under the progress bar — no
  character attribution, just plain supportive copy.
- **Vocab terms**: dotted underline, tappable, reveals inline plain-language definition
  (from `vocab_terms` table). Keep the reveal lightweight — no modal, inline expansion.
- **Standards tag**: shown quietly on the content card (e.g., "RLA.2.a — Determine
  central ideas") — visible to Jalesa but not emphasized; this same tag feeds admin
  reporting later.
- **Embedded comprehension checks**: multiple-choice, immediate feedback on selection
  (correct = sage green + checkmark, incorrect = show correct answer + a supportive,
  specific explanation, never just "wrong").
- **Optional curated video card**: shown only if a video exists for this lesson's skill
  tag — absent entirely otherwise, never a placeholder or broken state. Card links out
  to YouTube (`target="_blank"`), tagged "Optional · matches this lesson."

## Curated video system (per CLAUDE.md — curated, not algorithmic)

- No live YouTube API search calls at runtime. Videos are manually selected ahead of
  time and stored in `curated_videos`, keyed by `skill_tag` (topic-level, reused across
  multiple lessons touching that skill — not one video per lesson).
  - Note: the YouTube Data API is free, quota-limited rather than billed — worth using
  once, ahead of time, only to verify a video still exists / pull its title metadata,
  never for live per-lesson-load search.
- Build an admin-only internal page (simple table view is fine, doesn't need to be
  pretty) where Jalesa or the project owner can add/edit `curated_videos` rows without
  a code deploy.

## Quote bank

- Static, curated, sponsor-supplied list (loaded from a JSON seed file, not
  AI-generated at runtime). Rotate contextually: `category='resilience'` before
  heavy-lift tasks (extended response, full practice sets), `general` elsewhere.

## Acceptance criteria

- A lesson can be fully authored via content files/seed data with zero code changes.
- Read-aloud works on both a lesson with and without vocab terms present.
- A lesson with no matching `curated_videos` row renders with no gap or placeholder.
- Vocab tap-to-define works via keyboard/touch, not just mouse hover (accessibility).
