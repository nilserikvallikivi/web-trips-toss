ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS venue_id uuid REFERENCES public.venues(id) ON DELETE SET NULL;