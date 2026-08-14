-- Proves the Phase 2 access-control rules hold at the RLS layer, not just in app code.
-- Run with: supabase test db
-- Requires the "supabase_test_helpers" (basejump) extension for auth impersonation —
-- see supabase/tests/README.md.
begin;
select plan(8);

select tests.create_supabase_user('jalisa@example.com');

select is(
  (select role from public.users where id = tests.get_supabase_uid('jalisa@example.com')),
  'admin',
  'first account created becomes admin'
);

-- Open self-signup is closed once an admin exists. NOTE: this assumes
-- tests.create_supabase_user accepts a `metadata` argument (recent
-- supabase_test_helpers versions do) — if your installed version doesn't, swap this
-- for a direct insert into auth.users with raw_user_meta_data set accordingly.
select throws_ok(
  $$ select tests.create_supabase_user('stranger@example.com') $$,
  'This account can only be created by the admin, from Settings.',
  'signup after admin exists is rejected without the invited_by_admin flag'
);

-- Simulates the admin-invite Server Action (lib/auth/invite.ts), which is the only
-- code path that sets invited_by_admin — never settable from the public /signup form.
select tests.create_supabase_user(
  'dad@example.com',
  metadata => '{"invited_by_admin": true}'::jsonb
);

select is(
  (select role from public.users where id = tests.get_supabase_uid('dad@example.com')),
  'restricted_reports',
  'admin-invited account becomes restricted_reports'
);

select is(
  (select status from public.access_grants where grantee_user_id = tests.get_supabase_uid('dad@example.com')),
  'inert',
  'dad''s reports grant starts inert until Jalisa activates it'
);

-- Jalisa writes an extended response as herself.
select tests.authenticate_as('jalisa@example.com');
insert into public.extended_responses (user_id, raw_text)
values (tests.get_supabase_uid('jalisa@example.com'), 'Raw extended-response text.');

select is(
  (select count(*) from public.extended_responses)::int,
  1,
  'admin can write her own extended-response text'
);

-- Test setup: activate dad's reports grant (elevated role, not app-role access).
select tests.clear_authentication();
update public.access_grants
  set status = 'active'
  where grantee_user_id = tests.get_supabase_uid('dad@example.com');

-- Even with an ACTIVE reports grant, dad must never read raw extended-response text.
select tests.authenticate_as('dad@example.com');

select is(
  (select count(*) from public.extended_responses)::int,
  0,
  'restricted role reads zero extended-response rows even with an active reports grant'
);

select throws_ok(
  $$ insert into public.extended_responses (user_id, raw_text)
     values (auth.uid(), 'attempted write') $$,
  'new row violates row-level security policy for table "extended_responses"',
  'restricted role cannot insert into extended_responses'
);

-- Revoking access blocks the reports grant read immediately.
select tests.clear_authentication();
update public.access_grants
  set status = 'revoked'
  where grantee_user_id = tests.get_supabase_uid('dad@example.com');

select tests.authenticate_as('dad@example.com');

select is(
  (select status from public.access_grants where grantee_user_id = auth.uid()),
  'revoked',
  'dad sees his own grant flip to revoked on his very next read'
);

select finish();
rollback;
