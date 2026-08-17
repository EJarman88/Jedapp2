-- Phase 8 — proves real_test_results RLS: admin manages every row unconditioned,
-- the student reads only her own, and a restricted_reports account reads it only
-- while her reports grant is active (same gate as Phase 7's help_* tables).
-- Run with: supabase test db.
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

-- Admin enters a passed real-test result for the student.
select tests.authenticate_as('parent@example.com');

insert into public.real_test_results (user_id, subject, passed)
values (tests.get_supabase_uid('jalisa@example.com'), 'Math', true);

select is(
  (select count(*) from public.real_test_results)::int,
  1,
  'admin can insert a real test result for the student'
);

update public.real_test_results set paid_out = true
where user_id = tests.get_supabase_uid('jalisa@example.com') and subject = 'Math';

select is(
  (select paid_out from public.real_test_results where subject = 'Math'),
  true,
  'admin can update paid_out on a real test result'
);

-- Jalisa sees her own row.
select tests.authenticate_as('jalisa@example.com');

select is(
  (select count(*) from public.real_test_results)::int,
  1,
  'student reads her own real test result'
);

select throws_ok(
  $$ insert into public.real_test_results (user_id, subject, passed)
     values (auth.uid(), 'Science', true) $$,
  'new row violates row-level security policy for table "real_test_results"',
  'student cannot insert her own real test result — admin-entered only'
);

-- Restricted role sees nothing until his reports grant is active.
select tests.authenticate_as('dad@example.com');

select is(
  (select count(*) from public.real_test_results)::int,
  0,
  'restricted role reads zero real_test_results rows before his reports grant is active'
);

select throws_ok(
  $$ insert into public.real_test_results (user_id, subject, passed)
     values (tests.get_supabase_uid('jalisa@example.com'), 'Science', true) $$,
  'new row violates row-level security policy for table "real_test_results"',
  'restricted role cannot write real_test_results even before his grant is active'
);

select tests.clear_authentication();
update public.access_grants
  set status = 'active'
  where grantee_user_id = tests.get_supabase_uid('dad@example.com');

select tests.authenticate_as('dad@example.com');

select is(
  (select count(*) from public.real_test_results)::int,
  1,
  'restricted role reads real_test_results once his reports grant is active'
);

select throws_ok(
  $$ insert into public.real_test_results (user_id, subject, passed)
     values (tests.get_supabase_uid('jalisa@example.com'), 'Science', true) $$,
  'new row violates row-level security policy for table "real_test_results"',
  'restricted role still cannot write real_test_results even with an active reports grant'
);

select finish();
rollback;
