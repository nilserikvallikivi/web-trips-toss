ALTER TABLE public.courts ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS court_id uuid REFERENCES public.courts(id) ON DELETE SET NULL;