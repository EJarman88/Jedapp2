# Phase 5 — Timed Practice, Diagnostic & Remediation Engine

Load this with CLAUDE.md. Goal: this is the core pedagogical loop of the whole app —
timed practice, then real diagnosis of WHY something was missed, then a targeted
rebuild. Reference mockup (`edapp-full-experience.html`) shows exact behavior for the
diagnosis → remediation → completion arc — treat it as ground truth over prose here.

## Data model

```sql
question_bank      -- id, subject, skill_tag, stimulus_md, question_md, options (jsonb),
                    -- correct_index, misconception_notes (jsonb, keyed by wrong-option index)
practice_sessions  -- id, user_id, started_at, completed_at, time_limit_seconds
practice_answers   -- session_id, question_id, selected_index, is_correct, time_spent_seconds
ged_ready_scores   -- user_id, subject, score, attempt_number, taken_at  -- manual entry,
                    -- see note below
remediation_lessons -- id, skill_tag, title, content_blocks (jsonb) -- scaffolded,
                    -- more-broken-down version of a skill, distinct from the main
                    -- curriculum lesson on that same skill
```

**GED Ready scores are manually entered by the user** (per product design — GED Ready is
an external paid tool, not something this app calls). Build a simple entry form; this
data drives the passing-threshold (145) displays throughout Reports.

## Timed practice screen (match reference mockup exactly)

- Live countdown timer, turns visually urgent (red/amber) under 1 minute remaining.
- Question-of-total counter, segmented progress bar (done/current/upcoming states).
- One question at a time: stimulus card (if applicable) + question + 4 options + flag +
  next/submit. "Next" disabled until an option is selected.
- Auto-submits current answers and ends the set if the timer hits zero.

## Diagnostic engine (this is the key feature — build it as real logic, not a stub)

After a practice set completes, for every MISSED question:
1. Record which `skill_tag` it belonged to.
2. Look up `misconception_notes[selected_index]` for plain-language "what happened"
   text (e.g., "picked the claim itself instead of the supporting detail") — this
   should be authored per-question in the content data, not generated live, so it's
   accurate and consistent.
3. **Pattern detection**: tally missed questions by `skill_tag`. If one skill_tag
   accounts for 2+ misses, that's "the common thread" — surface it explicitly as the
   priority to address. If misses are all different skills, surface the single most
   recent/severe one, or list them without forcing a false pattern.

## Diagnosis screen

- Per the reference mockup: one card per missed question showing subject, the question
  asked, the "what happened" note, and the skill tag.
- A distinct "common thread" card at the end, sage-colored, stating the pattern plainly
  and specifically. This should read as genuinely useful, not generic ("you missed some
  questions") — reference the actual skill_tag content.
- CTA: "Let's rebuild this together" → remediation lesson for that skill_tag.

## Remediation lesson

- Pulled from `remediation_lessons` keyed by the identified skill_tag — NOT the same
  content as the original curriculum lesson; should be more scaffolded (smaller steps,
  a heuristic/framework, a fully worked example, then one fresh check question).
- No timer, explicitly framed as lower-pressure ("no timer, no pressure" per mockup).
- Tagged "Review · Built From Your Misses" so the connection to her actual performance
  is visible, not generic review content.

## Completion screen

- Explicit before/after: "First attempt — missed this pattern" vs "Just now — got it."
- Ties back to tone principle: trajectory over snapshot, stated directly in copy
  ("This is what 'you vs. your last attempt' looks like — not a score in isolation").

## Confidence check-in

- Before any heavy-lift task (full practice set, extended response — see Phase 6): quick
  4-option tappable scale (😟😐🙂😄), stored in `confidence_checkins` (user_id, context_type,
  context_id, rating, created_at, phase='pre'|'post').
- Light post-task reflection uses the same table with `phase='post'`.
- This data feeds the admin Reports confidence-vs-actual chart (Phase 8) — no learner-
  facing analysis needed here, just capture.

## Acceptance criteria

- A practice set with 2+ misses in the same skill_tag correctly surfaces that skill as
  "the common thread," not a generic message.
- The remediation lesson content is genuinely distinct from the original lesson on the
  same skill (verify content differs, not just re-served).
- Score <4/5 (or your chosen threshold) shows the "See What To Work On" path; a strong
  score does not surface remediation UI at all.
