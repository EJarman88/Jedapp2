# Phase 8 — Reporting & Admin Dashboard

Load this with CLAUDE.md. This screen is shared between two consumers with different
access levels: Jalesa (full, via her own Settings → "View my Reports") and dad
(restricted role, Reports-only login, gated by `access_grants`). Build ONE dashboard
component, parameterize by viewer role — don't build two separate dashboards.

## Two-tier data structure (per CLAUDE.md)

- **Always-on tier** (both viewers, when access is granted): subject score cards,
  incentive progress, trait-score trends, confidence-vs-actual, weekly digest. NEVER
  includes raw extended-response text.
- **Full-text tier**: raw extended-response text — visible ONLY to Jalesa, or to a named
  reviewer via their one-time link (Phase 6). Dad's restricted role never gets this tier
  regardless of `access_grants` status.

## Dashboard sections (match reference mockup exactly)

1. **Subject score cards** (RLA, Math, Science, Social Studies): current GED Ready score,
   attempt count (of 2 funded attempts), sparkline trend, status pill (Passed ≥145 /
   In Progress / Not Started), trend text ("130 → 143 → 148").
2. **Incentive progress**: per-subject $75 status (earned/in-progress/not-started), total
   ring ($X of $300), computed from `ged_ready_scores` reaching 145 AND a real-test-pass
   flag (add a `real_test_results` table: user_id, subject, passed bool, paid_out bool,
   date — since GED Ready ≥145 alone isn't the same as passing the actual exam; confirm
   with project owner exactly which event triggers the $75, likely the real test pass).
3. **Weekly digest**: plain-language, behavior-only summary generated from
   `practice_sessions`, `agenda_items` completion patterns, avoidance signals (Phase 9).
   Should read like natural sentences, not a bulleted log dump — consider a lightweight
   Claude API call to phrase the summary from structured inputs, with a strict prompt
   constraint: never speculate about emotional state, describe activity only.
4. **Extended response trait trends**: per-trait mini bar trend (4 traits), plus a
   private/shared indicator line ("5 responses logged · 1 shared · 4 kept private").
5. **Confidence vs. actual**: line chart from `confidence_checkins` (pre-task confidence)
   vs. actual practice/GED Ready scores over time.

## Role-based rendering

- If viewer = Jalesa: show everything, plus a note that this is her own view.
- If viewer = dad (restricted): identical layout/data, but gate the route itself behind
  the Phase 2 RLS/access check — if access is inert/revoked, show a plain "not currently
  available" state, not a broken page.

## Acceptance criteria

- The same component renders correctly for both roles with only data-access differing,
  not layout/code duplication.
- Revoking dad's access (Phase 2/9) immediately removes his ability to load this route,
  even mid-session.
- No code path allows raw extended-response text to reach the dad-role render, verified
  by checking the actual data fetched server-side, not just what's hidden client-side.
