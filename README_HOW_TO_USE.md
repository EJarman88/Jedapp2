# How to use these files

This folder has everything you need to hand off to Claude Code, split so each build
phase is its own focused session instead of one giant unmanageable conversation.

## Setup (one time)

1. Create your GitHub repo, clone it locally.
2. Copy `CLAUDE.md` into the repo root. Claude Code automatically reads a file named
   exactly `CLAUDE.md` at the start of every session in that repo — this is what keeps
   every future session consistent without you re-explaining the project each time.
3. Create a folder in the repo, e.g. `/docs/phases/`, and put the 9 numbered phase files
   there. They won't be auto-read like CLAUDE.md, so you'll point Claude Code at the
   right one each session (see below).
4. Also drop in the working HTML mockups from our design conversations
   (`edapp-mockup.html`, `edapp-full-experience.html`, `admin-dashboard.html`,
   `lesson-practice-mockup.html`, `settings-mockup.html`) into `/docs/reference-mockups/`.
   These are more precise than prose for exact interaction behavior — tell Claude Code
   to open and reference them when building the matching phase.

## Running each phase

Open a **new Claude Code session per phase** — don't try to do this all in one long
conversation, it'll degrade. At the start of each one, say something like:

> Read CLAUDE.md and docs/phases/03_ONBOARDING_HOME_AGENDA.md. Also look at
> docs/reference-mockups/edapp-full-experience.html for exact Home Screen behavior.
> Let's build this phase.

Work through the phase to completion (including the acceptance criteria listed at the
bottom of each file) before starting the next one — they build on each other in order:

1. Scaffold & Design System
2. Auth & Accounts
3. Onboarding, Home Screen & Agenda
4. Curriculum & Lessons
5. Timed Practice, Diagnostic & Remediation Engine
6. Extended Response & Privacy System
7. Ask Me (Almost) Anything
8. Reporting & Admin Dashboard
9. Settings & Engagement Signals

Phases 4 and 5 are the biggest — feel free to split either into two sessions if it gets
unwieldy (e.g., "lessons" and "curated videos" as separate sub-sessions within Phase 4).

## When something feels ambiguous mid-build

A few things are intentionally flagged as open decisions in the phase files rather than
hardcoded, because they need your input:
- Exact contact info for the Settings support card (Phase 9)
- Whether Ask Me (Almost) Anything transcripts get the same privacy tiers as extended
  response (Phase 7) — the file defaults to "yes, same pattern" but confirm that's right
- Exactly which event (GED Ready ≥145, or the real test pass) triggers each $75 incentive
  payout marker (Phase 8) — confirm against what we discussed: it's the REAL test pass,
  not just GED Ready readiness, but double check this gets wired correctly since it's a
  real financial commitment

If Claude Code hits one of these and guesses instead of asking, double-check its guess
against your actual intent before moving forward.

## Keeping this doc set updated

If you make new decisions in a design conversation (with me, in chat) that change
something in these files, come back and ask me to update the relevant phase file rather
than letting the repo and the design conversation drift out of sync. These files should
stay the source of truth Claude Code actually builds from.
