DROP POLICY IF EXISTS "self register" ON public.event_registrations;

CREATE POLICY "self register"
  ON public.event_registrations FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      (status = 'approved' AND EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = event_id AND e.auto_approve = true
      ))
      OR status = 'pending'
    )
  );

DROP POLICY IF EXISTS "organizer or self update registration" ON public.event_registrations;

CREATE POLICY "organizer or self update registration"
  ON public.event_registrations FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id
      AND public.is_club_admin(e.club_id, auth.uid())
    )
  );