-- Profile phone visibility function
CREATE OR REPLACE FUNCTION public.profile_phone_visible(_profile_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() = _profile_id
      OR public.has_role(auth.uid(), 'super_admin');
$$;