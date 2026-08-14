# Phase 6 — Extended Response & Privacy System

Load this with CLAUDE.md. This is the most sensitive phase in the app — re-read
CLAUDE.md rule #3 before starting. Get this right; do not take shortcuts on the RLS/
access rules here even under time pressure.

## Data model

```sql
extended_responses  -- id, user_id, prompt_id, raw_text, submitted_at,
                     -- privacy_status ('pending'|'deleted'|'private'|'shared'),
                     -- privacy_decided_at, auto_delete_at (submitted_at + 48h default)

trait_scores         -- response_id, trait ('argument_analysis'|'organization'|
                     -- 'language_command'|'grammar_conventions'), score (1-4 or your scale),
                     -- ai_notes_md (plain-language, pattern-level, no verbatim quoting
                     -- of her text back at her in a clinical way)

reviewer_links        -- id, response_id, token (unique, unguessable), created_at,
                     -- revoked_at (nullable), viewed_at (nullable), reviewer_label
                     -- (free text, e.g. "Erica" or whoever she names)
```

## Flow

1. Learner submits extended response text.
2. **Immediately** (same request/transaction ideally), call Claude API to score against
   the 4 GED RLA rubric traits. Store `trait_scores` — this data does NOT depend on what
   happens to `raw_text` afterward and must survive deletion.
3. `raw_text` enters `privacy_status = 'pending'`, `auto_delete_at` set to now + 48h.
4. Learner is presented the choice (delete / keep private / share):
   - **Delete**: set `privacy_status='deleted'`, and actually null out or hard-delete
     `raw_text` from the row — don't just flag it, remove it. `trait_scores` remain.
   - **Keep private**: `privacy_status='private'`, raw_text stays, visible only to
     Jalesa (never dad, never anyone else).
   - **Share**: `privacy_status='shared'`, generate a `reviewer_links` row with a random
     token, produce a shareable URL (`/review/[token]`). This page requires no login —
     it's a one-time-link pattern — but MUST check `revoked_at IS NULL` on every load,
     not just at creation.
5. **Revocation**: Jalesa can set `revoked_at` on a `reviewer_links` row at any time,
   from her own view of that response. This should be enforced at the RLS/query level
   (the review page query includes `WHERE revoked_at IS NULL`), not just hidden in UI.
6. **Auto-delete job**: a scheduled function (Supabase cron / Vercel cron) that finds
   `privacy_status='pending' AND auto_delete_at < now()` and deletes raw_text,
   transitioning to `privacy_status='deleted'`, same as a manual delete.

## Scoring copy (tone — critical)

Claude API prompt for scoring should produce:
- Trait scores (structured/numeric — internal use)
- `ai_notes_md`: WARM, plain-language feedback for the learner. Not "Trait 2: 2/3." More
  like: "You picked a clear side and gave two solid reasons. The essay gets stronger if
  you explain *why* your evidence proves your point, not just that it exists." Socratic
  where possible — a question that helps her notice the gap herself, not a correction.
- Never generate a psychological/emotional read of her writing. Rubric traits only.

## RLS rules (verify explicitly, write a test)

- `raw_text` column: readable by (a) the response's own `user_id` (Jalesa), or (b) a
  valid unrevoked `reviewer_links` token holder for that specific response_id. NEVER
  readable by the `restricted_reports` role (dad's default login) under any status.
- `trait_scores`: readable by Jalesa always; readable by dad ONLY if his `access_grants`
  status is active (per Phase 2) — this table is NOT subject to the same lockout as
  raw_text, since structured scores are always safe to share per product design.

## Acceptance criteria

- Deleting a response actually removes `raw_text` from the database (verify via direct
  query), while `trait_scores` remain queryable afterward.
- A revoked reviewer link returns a clear "no longer available" state, not an error.
- Attempting to query `raw_text` as the restricted (dad) role fails at the RLS layer in
  a direct test, regardless of `privacy_status`.
- The 48-hour auto-delete actually fires (test with a shortened interval in dev).
