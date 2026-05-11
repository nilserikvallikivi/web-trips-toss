-- Event recurrence
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS recurrence text NOT NULL DEFAULT 'none';
-- Values: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'

-- Venues table (multiple locations per club)
CREATE TABLE IF NOT EXISTS public.venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text NOT NULL,
  google_maps_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view venues of accessible clubs"
  ON public.venues FOR SELECT TO authenticated
  USING (
    public.is_club_member(club_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = club_id AND c.privacy = 'public')
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "club admin manages venues"
  ON public.venues FOR ALL TO authenticated
  USING (public.is_club_admin(club_id, auth.uid()))
  WITH CHECK (public.is_club_admin(club_id, auth.uid()));