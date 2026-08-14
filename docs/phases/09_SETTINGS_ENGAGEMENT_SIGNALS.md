# Phase 9 — Settings & Engagement Signals

Load this with CLAUDE.md. Two related pieces: the Settings screen (where most of the
account-control mechanics surface to Jalesa) and the behavioral engagement-signal
system that feeds the weekly digest (Phase 8).

## Settings screen (match reference mockup exactly)

Sections, in order:
1. **Appearance** — background theme (links to Phase 1/3 picker), read-aloud voice
   settings, daily plan style (fixed/flexible/suggested, from Phase 3).
2. **Who can see your reports** — dad's access card: name, scope description ("Reports
   access only — no lessons, no Ask Me (Almost) Anything"), status pill (Active/Revoked),
   toggle that writes directly to `access_grants.status` (Phase 2). Include the
   reassurance copy from the mockup: toggling off takes effect immediately, toggling back
   on later doesn't require dad to re-register.
3. **Weekly digest** — independent toggle writing to `digest_subscriptions.enabled`
   (Phase 2 schema) — explicitly separate from the full-access toggle above.
4. **Your own reports** — link into the same dashboard component from Phase 8, viewed
   as Jalesa. NOT surfaced on the Home Screen (per product decision) — only reachable
   from here.
5. **Support** — "Reach out to [Name]" card. Display NAME ONLY, never an email or phone
   number as visible text. The action button should be a `tel:` or `sms:` link with the
   actual contact info in the `href` attribute only (never rendered as text content) —
   confirm the actual contact method/number with the project owner before hardcoding it;
   treat it as a config value, not something to guess or leave as a placeholder string
   in a public repo. Consider storing it in an environment variable rather than
   committing it to source control.
6. **Sign out.**

## Engagement signals (feeds Phase 8's weekly digest)

### Data model

```sql
engagement_events -- id, user_id, event_type, context_type, context_id, metadata (jsonb), created_at
-- event_type examples: 'session_started','session_completed','item_avoided',
-- 'hint_skipped','fast_completion','paste_detected','answer_pattern_flag'
```

### Signals to implement (metadata only — see CLAUDE.md rule #4)

- **Time-on-task outliers**: flag if an extended-response or multi-step problem is
  completed suspiciously fast (define a threshold, e.g., <20% of median time for that
  task type).
- **Answer-pattern anomalies**: same-option straight-lining across a practice set;
  easy-question-missed-but-hard-question-correct in the same session.
- **Paste-detection**: on typed (non-canvas) inputs in Ask Me (Almost) Anything, detect
  large text blocks appearing in one input event vs. incremental typing (`onPaste` event
  is sufficient — don't over-engineer keystroke timing analysis).
- **Hint-skipping**: repeated "just tell me" requests in Socratic guidance (Phase 7)
  without engaging offered hints first.
- **Avoidance patterns**: an agenda item (Phase 3) that's been carried over 3+ times
  without being started.
- **Session frequency trend**: count of `session_started` events per week, compared to
  prior week.

### Guardrails (re-stating CLAUDE.md rule #4 because this is where it's easiest to violate)

- These events generate soft internal flags only, surfaced in the digest as plain
  behavioral sentences ("Math avoided twice — may be worth a check-in"). NEVER an
  in-app warning, alert, or accusatory message to Jalesa herself.
- No event type or metadata field should ever encode an inferred emotional/mental state.
  If you find yourself wanting to add a field like `mood_guess` or `stress_level` —
  don't. Flag it to the project owner instead of building it.

## Acceptance criteria

- Toggling dad's access off in Settings is reflected in his session within one request
  (verify by having two browser sessions open simultaneously during testing).
- The support contact number/email never appears in rendered HTML/DOM text content,
  only as an href attribute.
- Weekly digest sentences read naturally and never speculate about emotional causes
  behind a behavioral pattern.
