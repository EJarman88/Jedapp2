-- Phase 8 bugfix — proves reportable_extended_responses() exposes only safe
-- extended-response metadata (id, privacy_status, submitted_at) to admin/restricted
-- viewers for the reports dashboard's trait-trends section, while the underlying
-- extended_responses table itself stays completely locked down for those roles —
-- raw_text must never become reachable through this function or otherwise.
-- Run with: supabase test db.
begin;
select plan(6);

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

select tests.authenticate_as('jalisa@example.com');
insert into public.extended_responses (user_id, prompt_id, raw_text)
values (tests.get_supabase_uid('jalisa@example.com'), 'school-uniforms', 'Raw extended-response text.');

select is(
  (select count(*) from public.reportable_extended_responses(tests.get_supabase_uid('jalisa@example.com')))::int,
  1,
  'student reads her own response metadata through the function'
);

-- The direct table lockdown from Phase 6 still holds for admin — this function is a
-- separate, narrower mechanism, not a widened table policy.
select tests.authenticate_as('parent@example.com');

select is(
  (select count(*) from public.extended_responses)::int,
  0,
  'admin still reads zero rows directly from extended_responses (unchanged lockdown)'
);

select is(
  (select count(*) from public.reportable_extended_responses(tests.get_supabase_uid('jalisa@example.com')))::int,
  1,
  'admin reads response metadata through the function instead'
);

select throws_ok(
  $$ select raw_text from public.reportable_extended_responses(
       (select id from public.users where role = 'student')
     ) limit 1 $$,
  'column "raw_text" does not exist',
  'the function''s return type has no raw_text column to leak'
);

-- Restricted role: gated by the same active-grant check as the rest of reporting.
select tests.authenticate_as('dad@example.com');

select is(
  (select count(*) from public.reportable_extended_responses(tests.get_supabase_uid('jalisa@example.com')))::int,
  0,
  'restricted role reads zero response rows through the function before his grant is active'
);

select tests.clear_authentication();
update public.access_grants
  set status = 'active'
  where grantee_user_id = tests.get_supabase_uid('dad@example.com');

select tests.authenticate_as('dad@example.com');

select is(
  (select count(*) from public.reportable_extended_responses(tests.get_supabase_uid('jalisa@example.com')))::int,
  1,
  'restricted role reads response metadata through the function once his grant is active'
);

select finish();
rollback;
