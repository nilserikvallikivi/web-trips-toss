
-- 1. Soft delete / archive columns
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS anonymized_at timestamptz;

-- 2. Seed Super Admin: auto-promote erik.vallikivi@gmail.com on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  IF lower(NEW.email) = 'erik.vallikivi@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin')
      ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'player')
    ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: if erik.vallikivi@gmail.com already exists, promote
DO $$
DECLARE uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE lower(email) = 'erik.vallikivi@gmail.com' LIMIT 1;
  IF uid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'super_admin')
      ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 3. Block removing the last super_admin
CREATE OR REPLACE FUNCTION public.protect_last_super_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role app_role;
  v_user uuid;
  remaining int;
  email_text text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_role := OLD.role; v_user := OLD.user_id;
  ELSE
    v_role := OLD.role; v_user := OLD.user_id;
  END IF;

  IF v_role <> 'super_admin' THEN RETURN OLD; END IF;

  SELECT count(*) INTO remaining
  FROM public.user_roles ur
  JOIN public.profiles p ON p.id = ur.user_id
  WHERE ur.role = 'super_admin'
    AND ur.user_id <> v_user
    AND p.is_active = true
    AND p.deleted_at IS NULL;

  IF remaining = 0 THEN
    RAISE EXCEPTION 'Cannot remove the last active Super Admin. Assign another Super Admin first.';
  END IF;

  -- Extra protection for seeded super admin
  SELECT email INTO email_text FROM auth.users WHERE id = v_user;
  IF lower(coalesce(email_text,'')) = 'erik.vallikivi@gmail.com' AND remaining < 1 THEN
    RAISE EXCEPTION 'Cannot remove Super Admin from erik.vallikivi@gmail.com unless another Super Admin exists.';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_last_super_admin ON public.user_roles;
CREATE TRIGGER trg_protect_last_super_admin
BEFORE DELETE OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.protect_last_super_admin();

-- 4. Block removing the last club admin
CREATE OR REPLACE FUNCTION public.protect_last_club_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  remaining int;
  v_was_admin boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_was_admin := OLD.role = 'admin';
  ELSE
    v_was_admin := OLD.role = 'admin' AND NEW.role <> 'admin';
  END IF;

  IF NOT v_was_admin THEN RETURN COALESCE(NEW, OLD); END IF;

  SELECT count(*) INTO remaining
  FROM public.club_members
  WHERE club_id = OLD.club_id
    AND role = 'admin'
    AND user_id <> OLD.user_id;

  IF remaining = 0 THEN
    RAISE EXCEPTION 'Every club must have at least one admin. Assign another club admin before removing this one.';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_last_club_admin ON public.club_members;
CREATE TRIGGER trg_protect_last_club_admin
BEFORE DELETE OR UPDATE ON public.club_members
FOR EACH ROW EXECUTE FUNCTION public.protect_last_club_admin();

-- 5. Restrict club creation to Super Admin
DROP POLICY IF EXISTS "any user can create club" ON public.clubs;
CREATE POLICY "super admin creates club"
ON public.clubs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by AND has_role(auth.uid(), 'super_admin'));

-- Restrict club delete to Super Admin
DROP POLICY IF EXISTS "club admins delete club" ON public.clubs;
CREATE POLICY "super admin deletes club"
ON public.clubs FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

-- 6. user_has_history helper
CREATE OR REPLACE FUNCTION public.user_has_history(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM public.matches WHERE player1_id=_user_id OR player2_id=_user_id OR player3_id=_user_id OR player4_id=_user_id)
      OR EXISTS(SELECT 1 FROM public.event_registrations WHERE user_id=_user_id OR partner_id=_user_id)
      OR EXISTS(SELECT 1 FROM public.rankings WHERE user_id=_user_id);
$$;

-- 7. Anonymize helper
CREATE OR REPLACE FUNCTION public.anonymize_user(_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT (is_admin(auth.uid()) OR auth.uid() = _user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.profiles
    SET full_name = 'Anonymous Player',
        phone = NULL,
        avatar_url = NULL,
        is_active = false,
        anonymized_at = now(),
        deleted_at = now()
  WHERE id = _user_id;
END;
$$;

-- 8. club_has_history
CREATE OR REPLACE FUNCTION public.club_has_history(_club_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM public.matches WHERE club_id=_club_id)
      OR EXISTS(SELECT 1 FROM public.events WHERE club_id=_club_id)
      OR EXISTS(SELECT 1 FROM public.rankings WHERE club_id=_club_id);
$$;

-- 9. Audit log triggers
CREATE OR REPLACE FUNCTION public.audit_role_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.admin_audit_logs (admin_user_id, action_type, target_type, target_id, previous_value, new_value)
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    CASE WHEN TG_OP='INSERT' THEN 'role_granted' WHEN TG_OP='DELETE' THEN 'role_removed' ELSE 'role_changed' END,
    'user_role',
    COALESCE(NEW.user_id, OLD.user_id),
    CASE WHEN TG_OP<>'INSERT' THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP<>'DELETE' THEN to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END $$;
DROP TRIGGER IF EXISTS trg_audit_role_change ON public.user_roles;
CREATE TRIGGER trg_audit_role_change
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_role_change();

CREATE OR REPLACE FUNCTION public.audit_club_member_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.admin_audit_logs (admin_user_id, action_type, target_type, target_id, previous_value, new_value, notes)
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    CASE WHEN TG_OP='INSERT' THEN 'club_member_added'
         WHEN TG_OP='DELETE' THEN 'club_member_removed'
         ELSE 'club_member_role_changed' END,
    'club_member',
    COALESCE(NEW.user_id, OLD.user_id),
    CASE WHEN TG_OP<>'INSERT' THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP<>'DELETE' THEN to_jsonb(NEW) END,
    'club:' || COALESCE(NEW.club_id, OLD.club_id)::text
  );
  RETURN COALESCE(NEW, OLD);
END $$;
DROP TRIGGER IF EXISTS trg_audit_club_member ON public.club_members;
CREATE TRIGGER trg_audit_club_member
AFTER INSERT OR UPDATE OR DELETE ON public.club_members
FOR EACH ROW EXECUTE FUNCTION public.audit_club_member_change();

CREATE OR REPLACE FUNCTION public.audit_club_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.admin_audit_logs (admin_user_id, action_type, target_type, target_id, previous_value, new_value)
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    CASE
      WHEN TG_OP='INSERT' THEN 'club_created'
      WHEN TG_OP='DELETE' THEN 'club_deleted'
      WHEN OLD.archived_at IS NULL AND NEW.archived_at IS NOT NULL THEN 'club_archived'
      ELSE 'club_edited'
    END,
    'club',
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP<>'INSERT' THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP<>'DELETE' THEN to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END $$;
DROP TRIGGER IF EXISTS trg_audit_club ON public.clubs;
CREATE TRIGGER trg_audit_club
AFTER INSERT OR UPDATE OR DELETE ON public.clubs
FOR EACH ROW EXECUTE FUNCTION public.audit_club_change();
