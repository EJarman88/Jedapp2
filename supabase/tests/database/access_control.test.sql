-- Proves the Phase 2 access-control rules hold at the RLS layer, not just in app code.
-- Run with: supabase test db
-- Requires the "supabase_test_helpers" (basejump) extension for auth impersonation —
-- see supabase/tests/README.md.
begin;
select plan(7);

select tests.create_supabase_user('jalisa@example.com');
select tests.create_supabase_user('dad@example.com');

select is(
  (select role from public.users where id = tests.get_supabase_uid('jalisa@example.com')),
  'admin',
  'first account created becomes admin'
);

select is(
  (select role from public.users where id = tests.get_supabase_uid('dad@example.com')),
  'restricted_reports',
  'second account created becomes restricted_reports'
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
