# Phase 3 — Onboarding, Home Screen & Agenda

Load this with CLAUDE.md. Goal: Jalesa's actual daily entry point into the app, fully
functional and persisted.

## Onboarding (first login only)

1. **Theme picker** — from Phase 1, now persists selection to `users.theme_preference`.
2. **Daily plan style choice** — three options, stored as `users.plan_style`:
   - `fixed` — agenda items shown in a set order, must be completed in sequence
   - `flexible` — same items, any order, no imposed sequence
   - `suggested` — ordered but fully skippable (default recommendation if user is unsure)
   Framing matches the theme picker's "make it yours, change anytime" philosophy.
3. Both settings editable later from Settings (Phase 9), not just at onboarding.

## Data model

```sql
agenda_items   -- id, user_id, title, subtitle, subject, item_type ('lesson'|'practice'|'other'),
               -- scheduled_date, status ('pending'|'done'), carried_over_from (nullable date),
               -- order_index, created_at
```

## Agenda logic (important — this is a real scheduling engine, not static content)

- Each day, incomplete items from previous days automatically carry forward (per product
  decision: carryover is automatic, not optional).
- Carried-over items are visually marked with a simple italicized "carryover" label —
  no icon, no badge, no colored warning treatment. Keep it exactly this understated.
- New items generate based on the learner's study plan (Phase 4/5 will define where
  agenda items originate — for this phase, build the display/completion/carryover
  mechanics against a seedable/mock data source so it's testable independent of the
  curriculum engine).
- Respect `plan_style`: fixed = enforce order (later items disabled until earlier ones
  complete), flexible = no restriction, suggested = show a suggested order visually but
  never block interaction.

## Home Screen

Build to match the reference mockup exactly:
- Header: "EdApp" wordmark + avatar (initial), avatar links to... (no destructive action,
  just a placeholder for now, real destination TBD when Settings exists)
- Greeting + date/day-of-plan subtext
- Today's agenda card (see above)
- Subject progress card — 4 subjects (RLA, Math, Science, Social Studies), progress bars
  driven by real completion data once Phase 4/5 exist; stub with mock percentages for now
- "Continue where you left off" card — links to most recently active lesson/practice
- Quote card — pulls from a static curated quote bank (see Phase 4 for data source),
  rotates, shows attribution
- Bottom tab bar: Lessons (home), Ask, Practice, Progress — wire navigation, screens
  themselves come in later phases

## Acceptance criteria

- Completing an agenda item and reloading shows it persisted as done.
- An item left incomplete past its scheduled date shows up the next day tagged
  "carryover" automatically, no manual step required.
- Theme and plan-style choices persist across sessions.
