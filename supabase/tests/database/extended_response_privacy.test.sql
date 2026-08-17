-- Phase 6 — proves the extended-response privacy rules hold at the RLS layer.
-- Run with: supabase test db (see supabase/tests/README.md for the
-- supabase_test_helpers / tests.create_supabase_user setup this depends on).
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

update public.access_grants
  set status = 'active'
  where grantee_user_id = tests.get_supabase_uid('dad@example.com');

-- Jalisa submits and scores a response.
select tests.authenticate_as('jalisa@example.com');

insert into public.extended_responses (user_id, prompt_id, raw_text)
values (tests.get_supabase_uid('jalisa@example.com'), 'school-uniforms', 'Her actual essay text.');

insert into public.trait_scores (response_id, trait, score, ai_notes_md)
select id, 'argument_analysis', 3, 'Warm feedback about her argument.'
from public.extended_responses where user_id = tests.get_supabase_uid('jalisa@example.com');

insert into public.trait_scores (response_id, trait, score, ai_notes_md)
select id, 'organization', 2, 'Warm feedback about her organization.'
from public.extended_responses where user_id = tests.get_supabase_uid('jalisa@example.com');

select is(
  (select count(*) from public.trait_scores)::int,
  2,
  'a student can write trait scores for her own response'
);

-- Deleting actually removes raw_text, not just a flag.
update public.extended_responses
  set raw_text = null, privacy_status = 'deleted', privacy_decided_at = now()
  where user_id = tests.get_supabase_uid('jalisa@example.com');

select is(
  (select raw_text from public.extended_responses where user_id = tests.get_supabase_uid('jalisa@example.com')),
  null,
  'deleting a response actually nulls raw_text'
);

select is(
  (select count(*) from public.trait_scores)::int,
  2,
  'trait_scores remain queryable after raw_text is deleted'
);

-- Restricted role never sees raw text, active grant or not.
select tests.authenticate_as('dad@example.com');

select is(
  (select count(*) from public.extended_responses)::int,
  0,
  'restricted role reads zero extended_responses rows even with an active reports grant'
);

select is(
  (select count(*) from public.trait_scores)::int,
  2,
  'restricted role reads trait_scores when its reports grant is active'
);

-- Revoke the grant; trait_scores access should disappear too.
select tests.clear_authentication();
update public.access_grants
  set status = 'revoked'
  where grantee_user_id = tests.get_supabase_uid('dad@example.com');

select tests.authenticate_as('dad@example.com');

select is(
  (select count(*) from public.trait_scores)::int,
  0,
  'restricted role loses trait_scores access once its reports grant is revoked'
);

select throws_ok(
  $$ insert into public.trait_scores (response_id, trait, score, ai_notes_md)
     values (gen_random_uuid(), 'grammar_conventions', 4, 'attempted write') $$,
  'new row violates row-level security policy for table "trait_scores"',
  'restricted role cannot write trait_scores'
);

-- reviewer_links: student-only, no policy at all for any other role.
select tests.authenticate_as('jalisa@example.com');

insert into public.reviewer_links (response_id, reviewer_label)
select id, 'Erica' from public.extended_responses where user_id = tests.get_supabase_uid('jalisa@example.com');

select is(
  (select count(*) from public.reviewer_links)::int,
  1,
  'a student can create a reviewer link for her own response'
);

update public.reviewer_links
  set revoked_at = now()
  where response_id in (select id from public.extended_responses where user_id = tests.get_supabase_uid('jalisa@example.com'));

select is(
  (select revoked_at is not null from public.reviewer_links limit 1),
  true,
  'a student can revoke her own reviewer link at any time'
);

select tests.authenticate_as('dad@example.com');

select is(
  (select count(*) from public.reviewer_links)::int,
  0,
  'restricted role reads zero reviewer_links rows — there is no policy for that role at all'
);

select tests.authenticate_as('parent@example.com');

select is(
  (select count(*) from public.extended_responses)::int,
  0,
  'admin reads zero extended_responses rows — there is no admin policy on this table either'
);

select finish();
rollback;
