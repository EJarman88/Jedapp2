-- Lets the admin permanently preview the real student experience (Home agenda, lesson
-- screens) under her own account, instead of a second real `student` account — which
-- the handle_new_user trigger deliberately caps at exactly one. The admin's preview
-- agenda/lesson-progress rows live under her own user_id, completely separate from the
-- student's real rows, so previewing can never touch or disturb the student's actual
-- progress. No new account, no shared credentials, nothing reachable except by the
-- admin's own login. See lib/auth/session.ts's requireStudentOrAdmin().

create policy "admin manages own preview agenda items"
  on public.agenda_items for all
  using (public.current_user_role() = 'admin' and user_id = auth.uid())
  with check (public.current_user_role() = 'admin' and user_id = auth.uid());

create policy "admin manages own preview lesson progress"
  on public.lesson_progress for all
  using (public.current_user_role() = 'admin' and user_id = auth.uid())
  with check (public.current_user_role() = 'admin' and user_id = auth.uid());
