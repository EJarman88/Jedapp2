## Local Supabase workflow

```bash
npx supabase init      # first time only, already done if supabase/config.toml exists
npx supabase start     # local Postgres + Auth + Studio
npx supabase db reset  # applies everything in supabase/migrations, in order
```

Copy `.env.example` to `.env.local` and fill in the URL/anon key that `supabase start`
prints out (or your hosted project's values from the Supabase dashboard).

### Running the RLS tests

`supabase/tests/database/access_control.test.sql` proves the Phase 2 rules — most
importantly that the restricted (`dad`) role can never read `extended_responses` raw
text, even with an active reports grant — hold at the database layer regardless of
application code.

The tests impersonate auth users via `supabase_test_helpers` (basejump), which isn't
installed by default. One-time setup:

```bash
npx supabase test new access_control --db  # only if you need to scaffold a new test
```

then add to `supabase/migrations` (or run directly against your local DB before testing):

```sql
create extension if not exists "supabase_test_helpers"
  with schema extensions;
```

See https://github.com/usebasejump/supabase-test-helpers for the extension itself.
Then run:

```bash
npx supabase test db
```

### Account creation

There is no admin-only "create account" screen. Role is assigned entirely server-side
by the `handle_new_user` trigger (`supabase/migrations/0001_auth_accounts.sql`):

- The **first** person to sign up via `/signup` becomes `admin` (Jalisa).
- The **second** becomes `restricted_reports` (dad) — his `access_grants` row is
  created automatically with `status = 'inert'` and his digest subscription starts
  disabled. He can log in immediately; his `/reports` route just shows a plain
  "not currently available yet" state until Jalisa activates the grant.
- Any signup attempt after that raises an error — only these two accounts ever exist.

Activating/revoking dad's access (flipping `access_grants.status`) is Settings UI in
Phase 9. Until that lands, do it directly against the database:

```sql
update public.access_grants
  set status = 'active'
  where grantee_user_id = '<dad-user-id>';
```

Because `(admin)/layout.tsx` and `/reports` re-check `access_grants.status` on every
request (no caching), this takes effect on dad's very next request — including
mid-session.
