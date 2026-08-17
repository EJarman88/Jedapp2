-- Phase 7 — proves Ask Me (Almost) Anything's RLS matches the "simple default"
-- privacy tier: visible to Jalisa always, visible to dad only while his Reports
-- access is active. Run with: supabase test db.
begin;
select plan(8);

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

-- Jalisa starts a help session and logs a tutoring exchange.
select tests.authenticate_as('jalisa@example.com');

insert into public.help_sessions (user_id, subject)
values (tests.get_supabase_uid('jalisa@example.com'), 'Math');

insert into public.help_problems (session_id, extracted_text)
select id, 'Solve for x: 2x + 4 = 10' from public.help_sessions
where user_id = tests.get_supabase_uid('jalisa@example.com');

insert into public.help_messages (problem_id, role, content)
select id, 'user', 'I think x = 3' from public.help_problems
where session_id in (select id from public.help_sessions where user_id = tests.get_supabase_uid('jalisa@example.com'));

select is(
  (select count(*) from public.help_messages)::int,
  1,
  'a student can log her own tutoring transcript'
);

-- Admin sees it unconditioned (same precedent as lesson_progress / practice_sessions).
select tests.authenticate_as('parent@example.com');

select is(
  (select count(*) from public.help_sessions)::int,
  1,
  'admin reads help_sessions unconditioned'
);

select is(
  (select count(*) from public.help_messages)::int,
  1,
  'admin reads help_messages unconditioned'
);

-- Restricted role sees nothing until his reports grant is active.
select tests.authenticate_as('dad@example.com');

select is(
  (select count(*) from public.help_sessions)::int,
  0,
  'restricted role reads zero help_sessions rows before his reports grant is active'
);

select tests.clear_authentication();
update public.access_grants
  set status = 'active'
  where grantee_user_id = tests.get_supabase_uid('dad@example.com');

select tests.authenticate_as('dad@example.com');

select is(
  (select count(*) from public.help_sessions)::int,
  1,
  'restricted role reads help_sessions once his reports grant is active'
);

select is(
  (select count(*) from public.help_problems)::int,
  1,
  'restricted role reads help_problems once his reports grant is active'
);

select is(
  (select count(*) from public.help_messages)::int,
  1,
  'restricted role reads the full help_messages transcript once his reports grant is active'
);

select throws_ok(
  $$ insert into public.help_sessions (user_id, subject) values (auth.uid(), 'Math') $$,
  'new row violates row-level security policy for table "help_sessions"',
  'restricted role cannot write help_sessions'
);

select finish();
rollback;
