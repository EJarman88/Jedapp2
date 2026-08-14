-- Phase 3 — Onboarding, Home Screen & Agenda

alter table public.users add column theme_preference text
  check (theme_preference in (
    'warm-cream', 'soft-sage', 'warm-gray', 'quiet-night',
    'golden-hour', 'soft-clay', 'cocoa'
  ));

-- Null plan_style is the "hasn't onboarded yet" sentinel for a student.
alter table public.users add column plan_style text
  check (plan_style in ('fixed', 'flexible', 'suggested'));

create table public.agenda_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  subtitle text,
  subject text,
  item_type text not null check (item_type in ('lesson', 'practice', 'other')),
  scheduled_date date not null default current_date,
  status text not null check (status in ('pending', 'done')) default 'pending',
  carried_over_from date,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create index agenda_items_user_date_idx on public.agenda_items (user_id, scheduled_date, order_index);

alter table public.agenda_items enable row level security;

create policy "student manages own agenda items"
  on public.agenda_items for all
  using (public.current_user_role() = 'student' and user_id = auth.uid())
  with check (public.current_user_role() = 'student' and user_id = auth.uid());

-- Broadens the Phase 2 self-update trigger (which only allowed the parent-access
-- toggle) to also let a student save her own theme and plan-style choices. Renamed
-- since its job is no longer just the parent-access toggle.
drop trigger if exists users_enforce_parent_access_toggle on public.users;
drop function if exists public.enforce_parent_access_toggle();

create or replace function public.enforce_student_self_update()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() = new.id and public.current_user_role() = 'student' then
    if new.role is distinct from old.role
       or new.email is distinct from old.email
       or new.display_name is distinct from old.display_name
       or new.date_of_birth is distinct from old.date_of_birth then
      raise exception 'You can only change your theme, plan style, or parent-access setting here.';
    end if;

    if new.parent_access_enabled is distinct from old.parent_access_enabled then
      if old.date_of_birth is null or age(old.date_of_birth) < interval '18 years' then
        raise exception 'You need to be 18 or older to change this.';
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger users_enforce_student_self_update
  before update on public.users
  for each row execute function public.enforce_student_self_update();
