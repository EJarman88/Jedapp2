# Phase 2 — Auth & Account Model

Load this with CLAUDE.md. Goal: working login for both roles, with the access-control
rules from CLAUDE.md fully enforced at the database level (RLS), not just hidden in the UI.

## Data model (Supabase/Postgres)

```sql
-- Core tables (sketch — refine as needed)
users              -- id, role ('admin' | 'restricted_reports'), display_name, created_at
access_grants      -- grantor_user_id, grantee_user_id, scope ('reports'), status ('inert'|'active'|'revoked'), created_at, updated_at
digest_subscriptions -- user_id (recipient), enabled (bool)
```

Only ONE `admin` user will ever exist (Jalisa). Only one `restricted_reports` user will
ever exist (dad). Don't over-engineer for multi-tenancy — but DO use real RLS policies,
not just app-layer checks, since Reports data sensitivity matters even in a small app.

## Tasks

1. **Supabase Auth setup** — email/password is sufficient (no need for social login).
2. **Roles & RLS**:
   - Admin (Jalisa) can read/write everything.
   - Restricted (dad) can ONLY read from Reports-related views/tables (see Phase 8 for
     exact schema) — enforce via RLS policy checking `access_grants.status = 'active'`
     AND `scope = 'reports'`, not just a role flag, since access must be revocable.
   - Extended-response raw text table must have RLS that blocks the restricted role
     entirely, always — this is not something a `status='active'` grant should ever
     override. Only Jalisa or a one-time reviewer-link mechanism (Phase 6) can access it.
3. **Account activation flow**: dad's account row is created but `access_grants.status`
   starts at `'inert'`. Only Jalisa flipping it to `'active'` (from Settings, Phase 9)
   makes his login functional for Reports. Revoking sets it back to `'revoked'`
   (distinct from `'inert'` for clarity/audit — both block access, but revoked implies
   "was active, now isn't").
4. **Digest subscription**: separate boolean, independent of `access_grants` status —
   dad can be revoked from full Reports but this is a distinct toggle (per product rules).
5. **Session/routing**: `(learner)` route group requires admin role; `(admin)` route
   group (dad's restricted view) requires active reports grant, redirect/block otherwise
   with a plain "access not currently available" state (not an error page).

## Acceptance criteria

- Logging in as dad before Jalisa activates the grant shows a clear "not yet active" state.
- Toggling access off in the database immediately blocks dad's next request (test by
  revoking mid-session, not just at login).
- Attempting to query extended-response raw text as the restricted role fails at the
  RLS layer even if application code has a bug — write a test that tries this directly.
