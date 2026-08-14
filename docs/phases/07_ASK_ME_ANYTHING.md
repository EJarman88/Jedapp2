# Phase 7 — Ask Me (Almost) Anything

Load this with CLAUDE.md. Two distinct features live under this one section — build
them as clearly separate flows, not blended (per CLAUDE.md rule #6).

## Feature A: In-app tracked help (upload/photo)

### Data model

```sql
help_sessions   -- id, user_id, subject, started_at, completed_at, status
help_problems   -- id, session_id, source_image_url, extracted_text, order_index, solved (bool)
help_messages   -- id, problem_id, role ('user'|'assistant'), content, created_at
                -- (full transcript, subject to same privacy tiers as extended response
                -- if the project owner wants that — confirm before building; default
                -- to same delete/keep/share pattern as Phase 6 for consistency)
```

### Flow

1. Learner photographs or uploads image(s) of a problem (Supabase Storage).
2. Send image(s) to Claude API (vision) to extract all problems into one ordered list,
   regardless of how many source pages/images.
3. Present problems one at a time. Guidance is Socratic — Claude API prompt should
   explicitly instruct: work the learner toward the answer via questions and hints,
   NEVER state the final answer outright, even if asked directly.
4. For math: an in-app canvas/scratch pad (freehand draw). On "Check My Work," send the
   canvas image to Claude for handwriting transcription, show the transcription back to
   her for confirmation BEFORE generating guidance based on it (avoids guidance based on
   a misread).
5. For other subjects: typed input.
6. Full transcript logged. Apply the same privacy tiers as Phase 6 (delete/keep/share)
   if the project owner confirms that's wanted — otherwise default to: visible to Jalisa
   always, visible to dad only if his Reports access includes this data.
7. **Session cap**: 5 sessions/day (cost control). No limit on pages per single session.

## Feature B: "Talk to Claude" (separate, unmonitored)

- A clearly distinct entry point (own button/card, not nested inside Feature A's flow).
- Opens a plain conversation with Claude — general-purpose, no Socratic-only constraint,
  no logging into `help_sessions`/`help_messages` at all. This is intentionally OUTSIDE
  EdApp's tracking system per product design.
- Label: something functional like "Talk to Claude — a separate conversation, outside
  EdApp." Do not narrate the specific tracking mechanics beyond that (per CLAUDE.md
  tone rules — state what it is, not the detection/monitoring logic behind it).
- Implementation-wise this can be a simple embedded chat UI hitting the Claude API
  directly with no system prompt tying it to EdApp's tutoring persona, and critically,
  no writes to any EdApp database table.

## Acceptance criteria

- Feature A and Feature B are reachable from the same screen but are visually and
  functionally distinct — no shared conversation thread, no shared data model.
- Session cap enforces at 5/day and shows a clear, kind message when hit (not a hard
  error) — e.g., "You've used today's sessions — more tomorrow, or try Talk to Claude."
- Socratic guidance genuinely withholds final answers under adversarial testing (try
  prompting it directly for the answer during QA and confirm it redirects instead).
