# EdApp — Master Project Context

Read this file first, in every session, before writing any code. This is the persistent
context that doesn't change between build phases. Phase-specific instructions live in
separate numbered files (01_..., 02_..., etc.) — load this file PLUS the relevant phase
file for whatever you're building that session.

## What this is

EdApp is a GED test-prep companion built for Jalesa, an 18-year-old adult learner
(Maryland resident) who is no longer enrolled in public school. Goal: GED credential,
all 4 subjects, by February 2027. Starting point: approx. 9th-grade level.

This is a single-family, low-scale app — not a multi-tenant SaaS product. Design and
build decisions should favor simplicity and correctness over scalability. There will
never be more than a handful of user accounts.

## Tech stack

- **Next.js 14+ (App Router), TypeScript** — all new code in TypeScript, strict mode on
- **Tailwind CSS** — theme tokens defined in `tailwind.config.ts`, see Design System below
- **Supabase** — Postgres (schema + RLS policies), Auth, Storage (for uploaded homework photos)
- **Anthropic API (Claude)** — extended-response scoring, Socratic tutoring, diagnostic/remediation generation
- **Vercel** — deployment target

## Design system (do not deviate without asking)

Warm, editorial, calm. NOT childish, NOT gamified, NOT cold corporate SaaS. No mascots,
no cartoon characters, no game-like chrome. Reference points: modern wellness/journaling
apps, not typical EdTech dashboards.

**Fonts:** Fraunces (serif, headings) + Inter (sans, body) — both via Google Fonts.

**Background theme options** (user-selectable, live-previewed before saving, changeable
anytime from Settings):
| Name | Background | Ink (text) | Card | Line |
|---|---|---|---|---|
| Warm Cream (default) | #F6F1E8 | #2C2620 | #FFFEFB | #E7DFD1 |
| Soft Sage | #EDF1E7 | #2E3928 | #FBFCF9 | #D9E1D1 |
| Warm Gray | #EBE9E4 | #2C2C2A | #FAFAF8 | #DCDAD3 |
| Quiet Night (dark) | #242220 | #F1EDE6 | #2E2B27 | #3C3833 |
| Golden Hour | #F5EAD3 | #4A3A18 | #FDFAF3 | #E9DAB4 |
| Soft Clay | #F5E6DE | #4A2E24 | #FDF7F3 | #EAD3C4 |
| Cocoa | #3E2E22 | #F1E6D9 | #4A3829 | #5A4636 |

**Accent:** Terracotta `#C1704F` (primary actions), Sage `#7C9270` (success/growth state),
Amber `#C98A3E` (in-progress/attention, never harsh red).

Reference mockups (attached separately, or ask the project owner for them) show the exact
visual language: rounded cards (16-18px radius), soft borders, generous padding, no sharp
corporate BI-style charts.

## Non-negotiable product rules

These apply across every phase. Do not implement anything that violates these, even if a
feature spec seems to imply otherwise — flag it instead.

1. **No real GED exam content, ever.** All practice/lesson questions must be original
   content written to match GED format and rigor. Never scrape, reproduce, or reference
   actual GED Testing Service copyrighted items.

2. **Tone.** Every learner-facing string (feedback, scores, errors) must be warm, specific,
   growth-framed. Trajectory over snapshot ("you vs. your last attempt," not isolated score
   vs. passing threshold). Never robotic scorecard language. Never use a diagnosed
   mental-health or emotional label about the user anywhere in the product.

3. **Extended response privacy is inviolable.**
   - AI scores every extended response immediately against rubric traits.
   - Raw text always enters a temporary holding state (24-48hr default) until the user
     chooses: delete permanently / keep private / share with a named reviewer (one-time
     link, revocable anytime).
   - Structured trait scores persist regardless of the raw-text choice; raw text does not.
   - Dad's account (see Auth phase) NEVER sees raw extended-response text under any
     circumstance unless Jalesa has specifically named him as reviewer for that one item.

4. **Engagement/behavioral signals are metadata-only.** Time-on-task, paste-detection,
   answer patterns, avoidance patterns — never infer or store emotional/mental state,
   trauma, or mood. Behavior only, never "why."

5. **Account model.**
   - Jalesa = admin. Full access to everything, including granting/revoking dad's access.
   - Dad = separate login, scoped ONLY to Reports (structured data — see Reporting phase).
     No access to lessons, Ask Me (Almost) Anything, or Talk to Claude.
   - Dad's account is inert until Jalesa explicitly activates it.
   - Access revocation takes effect immediately; re-granting does not require
     re-registration.

6. **"Ask Me (Almost) Anything"** is the correct name for the outside-help feature — do
   not call it "Homework Help" (there's no school/homework context here). It has two
   distinct entry points: in-app tracked help (upload/photo, logged, Socratic guidance),
   and a separate "Talk to Claude" link that is clearly a different, unmonitored space —
   do not blend these into one flow.

## Repo structure (target)

```
/app                    — Next.js App Router pages
  /(learner)             — Jalesa's routes (home, lessons, practice, ask, settings)
  /(admin)                — Dad's restricted routes (reports only)
  /api                     — API routes (Claude calls, Supabase server actions)
/components
  /ui                     — shared primitives (Card, Button, ProgressBar, etc.)
  /lessons
  /practice
  /reports
/lib
  /supabase                — client + server helpers
  /claude                   — Anthropic API wrappers (scoring, tutoring, diagnosis)
  /content                   — curriculum/question data access
/content                     — curriculum, question bank, curated video library (JSON/MD)
/supabase
  /migrations                — SQL schema + RLS policies
```

## How this project is organized across sessions

Each numbered phase file is meant to be a separate Claude Code session/conversation,
run roughly in order since later phases depend on earlier ones. Load `CLAUDE.md` (this
file) plus the one phase file relevant to that session. Phases:

1. `01_SCAFFOLD_AND_DESIGN_SYSTEM.md`
2. `02_AUTH_AND_ACCOUNTS.md`
3. `03_ONBOARDING_HOME_AGENDA.md`
4. `04_CURRICULUM_LESSONS.md`
5. `05_PRACTICE_DIAGNOSTIC_REMEDIATION.md`
6. `06_EXTENDED_RESPONSE_PRIVACY.md`
7. `07_ASK_ME_ANYTHING.md`
8. `08_REPORTING_ADMIN_DASHBOARD.md`
9. `09_SETTINGS_ENGAGEMENT_SIGNALS.md`

At the start of each new phase's first message, tell Claude Code something like:
"Read CLAUDE.md and 04_CURRICULUM_LESSONS.md, then let's build this phase."

## Working reference mockups

A set of working HTML prototypes exists (built during design) showing exact interaction
patterns: color picker with live preview, Home Screen with agenda, lesson screen, timed
practice with countdown, results + diagnosis + remediation flow, settings screen, admin
dashboard. If available, these should be provided to Claude Code as visual/interaction
reference at the start of the relevant phase — they are ground truth for exact behavior,
more precise than this document's prose descriptions.
