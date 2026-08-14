# Phase 1 — Project Scaffold & Design System

Load this with CLAUDE.md. Goal: a running Next.js app with the design system wired up
and provable via a few placeholder screens — nothing functional yet, just the foundation
everything else builds on.

## Tasks

1. **Init the project**: Next.js 14+, App Router, TypeScript strict, Tailwind CSS, ESLint.
2. **Tailwind theme**: encode all 7 background themes from CLAUDE.md as CSS custom
   properties (not hardcoded Tailwind colors), switchable at runtime via a `data-theme`
   attribute on `<html>` or `<body>`. This must support live-preview (theme changes
   instantly on click, before any save action) — use CSS variables + React context, not
   a page reload.
3. **Fonts**: load Fraunces + Inter via `next/font/google`, expose as Tailwind font
   families `font-serif` (Fraunces) and `font-sans` (Inter, default).
4. **Base components** (in `/components/ui`):
   - `Card` — rounded (16-18px), soft border, cream-card background
   - `Button` (primary/terracotta, secondary/outline, ghost)
   - `ProgressBar` (used for subject progress + timed-practice segments)
   - `Toggle` (used throughout Settings)
   - `Badge`/`Pill` (status indicators — Passed/In Progress/Not Started, etc.)
   - `Toast` (bottom confirmation messages, auto-dismiss)
5. **Theme picker component**: grid of swatch cards per CLAUDE.md's theme table, each
   showing "Live text preview" + name, selected state with checkmark, click = instant
   live preview of the WHOLE current page background (not just the swatch), with a
   "Previewing — not saved yet" pill that appears on selection and a Save action that
   persists the choice (persistence itself comes in Phase 2/3 once auth+DB exist — for
   this phase, local React state is fine).
6. **Placeholder routes**: `/`, `/home`, `/settings` — just enough to prove theming works
   across navigation.

## Acceptance criteria

- Switching theme on the picker updates the entire visible page instantly, no flash/reload.
- All 7 themes render with correct contrast (text legible against every background,
  including Quiet Night and Cocoa).
- Components are generic/reusable — no phase-specific business logic yet.
- Deployed and viewable on Vercel (even if mostly placeholder) before moving to Phase 2.
