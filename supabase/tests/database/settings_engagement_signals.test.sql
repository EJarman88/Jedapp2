-- Phase 9 — proves the student's new Settings-screen write paths (digest_subscriptions,
-- household_members_for_student) and the engagement_events log's three-tier RLS.
-- Run with: supabase test db.
begin;
select plan(11);

insert into auth.users (id, email) values (gen_random_uuid(), 'parent@example.com');
insert into public.users (id, role, display_name, email)
select id, 'admin', 'Parent', email from auth.users where email = 'parent@example.com';

select tests.create_supabase_user(
  'jalisa@example.com',
  metadata => '{"requested_role": "student", "date_of_birth": "2005-01-01"}'::jsonb
);
select tests.create_supabase_user(
  'dad@example.com',
  metadata => '{"requested_role": "restricted_reports"}'::jsonb
);

-- household_members_for_student(): only the student can call it, and it returns only
-- id/role/display_name for the admin + restricted_reports accounts.
select tests.authenticate_as('jalisa@example.com');

select is(
  (select count(*) from public.household_members_for_student())::int,
  2,
  'student sees both the admin and the restricted_reports account via the function'
);

select tests.authenticate_as('parent@example.com');

select is(
  (select count(*) from public.household_members_for_student())::int,
  0,
  'admin gets zero rows from household_members_for_student — student-only'
);

-- digest_subscriptions: the student can read and toggle any account's row (it's about
-- her own activity), but only the `enabled` column.
select tests.authenticate_as('jalisa@example.com');

select is(
  (select count(*) from public.digest_subscriptions)::int,
  1,
  'student reads the restricted_reports account''s digest subscription row'
);

update public.digest_subscriptions
  set enabled = true
  where user_id = tests.get_supabase_uid('dad@example.com');

select is(
  (select enabled from public.digest_subscriptions where user_id = tests.get_supabase_uid('dad@example.com')),
  true,
  'student can turn on a restricted_reports account''s weekly digest'
);

select throws_ok(
  $$ update public.digest_subscriptions
       set user_id = gen_random_uuid()
       where user_id = (select id from public.users where role = 'restricted_reports') $$,
  'You can only change whether the digest is enabled.',
  'student cannot repoint a digest_subscriptions row to a different user'
);

-- engagement_events: student logs and reads her own.
insert into public.engagement_events (user_id, event_type, context_type, context_id)
values (tests.get_supabase_uid('jalisa@example.com'), 'session_started', 'practice_session', gen_random_uuid());

select is(
  (select count(*) from public.engagement_events)::int,
  1,
  'student logs her own engagement event'
);

select throws_ok(
  $$ insert into public.engagement_events (user_id, event_type)
     values (tests.get_supabase_uid('dad@example.com'), 'session_started') $$,
  'new row violates row-level security policy for table "engagement_events"',
  'student cannot log an engagement event for another user'
);

-- Admin reads unconditioned, same precedent as help_sessions/lesson_progress.
select tests.authenticate_as('parent@example.com');

select is(
  (select count(*) from public.engagement_events)::int,
  1,
  'admin reads engagement events unconditioned'
);

select throws_ok(
  $$ insert into public.engagement_events (user_id, event_type)
     values (auth.uid(), 'session_started') $$,
  'new row violates row-level security policy for table "engagement_events"',
  'admin cannot write engagement_events — read-only for this role'
);

-- Restricted role: gated by the same active-grant mechanism as the rest of reporting.
select tests.authenticate_as('dad@example.com');

select is(
  (select count(*) from public.engagement_events)::int,
  0,
  'restricted role reads zero engagement events before his reports grant is active'
);

select tests.clear_authentication();
update public.access_grants
  set status = 'active'
  where grantee_user_id = tests.get_supabase_uid('dad@example.com');

select tests.authenticate_as('dad@example.com');

select is(
  (select count(*) from public.engagement_events)::int,
  1,
  'restricted role reads engagement events once his reports grant is active'
);

select finish();
rollback;
