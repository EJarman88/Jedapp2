-- Proves the Phase 2 access-control rules hold at the RLS layer, not just in app code.
-- Run with: supabase test db
-- Requires the "supabase_test_helpers" (basejump) extension for auth impersonation —
-- see supabase/tests/README.md. NOTE: this assumes tests.create_supabase_user accepts
-- a `metadata` argument (recent supabase_test_helpers versions do); if yours doesn't,
-- swap those calls for a direct insert into auth.users with raw_user_meta_data set.
begin;
select plan(8);

-- The admin account already exists in production before this trigger version ever
-- runs (bootstrapped under the old order-based trigger). Simulate that directly.
insert into auth.users (id, email) values (gen_random_uuid(), 'parent@example.com');
insert into public.users (id, role, display_name, email)
select id, 'admin', 'Parent', email from auth.users where email = 'parent@example.com';

select tests.create_supabase_user(
  'jalisa@example.com',
  metadata => '{"requested_role": "student", "date_of_birth": "2015-01-01"}'::jsonb
);

select is(
  (select role from public.users where id = tests.get_supabase_uid('jalisa@example.com')),
  'student',
  'signing up with requested_role=student creates a student account'
);

select tests.create_supabase_user(
  'dad@example.com',
  metadata => '{"requested_role": "restricted_reports"}'::jsonb
);

select is(
  (select role from public.users where id = tests.get_supabase_uid('dad@example.com')),
  'restricted_reports',
  'signing up with requested_role=restricted_reports creates that role'
);

select is(
  (select status from public.access_grants where grantee_user_id = tests.get_supabase_uid('dad@example.com')),
  'inert',
  'dad''s reports grant starts inert until an admin activates it'
);

-- Jalisa writes an extended response as herself — this table belongs to students now.
select tests.authenticate_as('jalisa@example.com');
insert into public.extended_responses (user_id, raw_text)
values (tests.get_supabase_uid('jalisa@example.com'), 'Raw extended-response text.');

select is(
  (select count(*) from public.extended_responses)::int,
  1,
  'a student can write her own extended-response text'
);

-- Nobody but the student sees her raw text — not even the admin/parent by default,
-- per CLAUDE.md's privacy rule (only the student, or a named reviewer, ever does).
select tests.authenticate_as('parent@example.com');

select is(
  (select count(*) from public.extended_responses)::int,
  0,
  'admin reads zero extended-response rows — there is no admin policy on this table'
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

-- A student under 18 cannot toggle her own parent-access flag, even on her own row.
select tests.authenticate_as('jalisa@example.com');

select throws_ok(
  $$ update public.users set parent_access_enabled = false where id = auth.uid() $$,
  'You need to be 18 or older to change this.',
  'a minor student cannot disable parent access'
);

select finish();
rollback;
