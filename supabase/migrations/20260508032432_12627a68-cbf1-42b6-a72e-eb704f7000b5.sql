
-- =========================
-- Presence
-- =========================
CREATE TYPE public.presence_status AS ENUM ('online','idle','offline');
CREATE TYPE public.presence_visibility AS ENUM ('everyone','admins_only','hidden');

CREATE TABLE public.user_presence (
  user_id uuid PRIMARY KEY,
  status presence_status NOT NULL DEFAULT 'offline',
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.presence_privacy_settings (
  user_id uuid PRIMARY KEY,
  visibility presence_visibility NOT NULL DEFAULT 'everyone',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.presence_privacy_settings ENABLE ROW LEVEL SECURITY;

-- Helper: can current user view another user's presence
CREATE OR REPLACE FUNCTION public.can_view_presence(_target uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT
    _target = auth.uid()
    OR public.has_role(auth.uid(),'super_admin')
    OR COALESCE(
      (SELECT CASE
        WHEN visibility = 'everyone' THEN true
        WHEN visibility = 'admins_only' THEN public.is_admin(auth.uid())
        ELSE false END
       FROM public.presence_privacy_settings WHERE user_id = _target),
      true -- default everyone
    );
$$;

CREATE POLICY "view presence respecting privacy" ON public.user_presence
  FOR SELECT TO authenticated USING (public.can_view_presence(user_id));
CREATE POLICY "user upserts own presence" ON public.user_presence
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "user updates own presence" ON public.user_presence
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "user views own privacy" ON public.presence_privacy_settings
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "user manages own privacy" ON public.presence_privacy_settings
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Heartbeat RPC
CREATE OR REPLACE FUNCTION public.presence_heartbeat()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  INSERT INTO public.user_presence (user_id, status, last_seen_at, updated_at)
  VALUES (auth.uid(), 'online', now(), now())
  ON CONFLICT (user_id) DO UPDATE
    SET status='online', last_seen_at=now(), updated_at=now();
END $$;

CREATE OR REPLACE FUNCTION public.presence_set_offline()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  UPDATE public.user_presence SET status='offline', updated_at=now() WHERE user_id=auth.uid();
END $$;

-- =========================
-- Matches: confirmation
-- =========================
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS confirmed boolean NOT NULL DEFAULT false;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

-- =========================
-- Rating history & player statistics
-- =========================
CREATE TABLE public.rating_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  discipline discipline NOT NULL,
  scope text NOT NULL DEFAULT 'global', -- 'global' | 'club'
  club_id uuid,
  match_id uuid,
  old_rating numeric NOT NULL,
  new_rating numeric NOT NULL,
  delta numeric NOT NULL,
  k_factor int NOT NULL DEFAULT 32,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rating_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view rating history" ON public.rating_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins write rating history" ON public.rating_history FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.player_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  scope text NOT NULL DEFAULT 'global', -- 'global' | 'club'
  club_id uuid,
  discipline discipline NOT NULL,
  matches_played int NOT NULL DEFAULT 0,
  wins int NOT NULL DEFAULT 0,
  losses int NOT NULL DEFAULT 0,
  sets_won int NOT NULL DEFAULT 0,
  sets_lost int NOT NULL DEFAULT 0,
  games_won int NOT NULL DEFAULT 0,
  games_lost int NOT NULL DEFAULT 0,
  walkovers_won int NOT NULL DEFAULT 0,
  walkovers_lost int NOT NULL DEFAULT 0,
  retired_matches int NOT NULL DEFAULT 0,
  current_streak int NOT NULL DEFAULT 0,
  longest_streak int NOT NULL DEFAULT 0,
  last_match_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, scope, club_id, discipline)
);
ALTER TABLE public.player_statistics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view stats" ON public.player_statistics FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins write stats" ON public.player_statistics FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- =========================
-- User reports
-- =========================
CREATE TYPE public.report_reason AS ENUM (
  'bad_behavior','abusive_language','no_show','repeated_cancellations',
  'false_score','unfair_play','harassment','safety_concern','do_not_recommend','other'
);
CREATE TYPE public.report_status AS ENUM ('new','under_review','resolved','dismissed','malicious');

CREATE TABLE public.user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_user_id uuid NOT NULL,
  club_id uuid,
  reason report_reason NOT NULL,
  details text,
  status report_status NOT NULL DEFAULT 'new',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (reporter_id <> reported_user_id)
);
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reporter views own reports" ON public.user_reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "user submits report" ON public.user_reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "admins update reports" ON public.user_reports FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TABLE public.report_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.user_reports(id) ON DELETE CASCADE,
  admin_user_id uuid NOT NULL,
  action_type text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.report_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins view actions" ON public.report_actions FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "admins write actions" ON public.report_actions FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()) AND admin_user_id = auth.uid());

-- =========================
-- Avoidance preferences (private)
-- =========================
CREATE TABLE public.user_avoidance_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  avoided_user_id uuid NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, avoided_user_id),
  CHECK (user_id <> avoided_user_id)
);
ALTER TABLE public.user_avoidance_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user manages own avoidance" ON public.user_avoidance_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (user_id = auth.uid());

-- =========================
-- Admin feedback
-- =========================
CREATE TYPE public.feedback_category AS ENUM ('bug','feature_request','ux','ranking','registration','scheduling','scoring','club_mgmt','moderation','other');
CREATE TYPE public.feedback_priority AS ENUM ('low','medium','high','critical');
CREATE TYPE public.feedback_status AS ENUM ('submitted','under_review','planned','in_progress','released','rejected');

CREATE TABLE public.admin_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by uuid NOT NULL,
  club_id uuid,
  title text NOT NULL,
  description text NOT NULL,
  category feedback_category NOT NULL DEFAULT 'other',
  priority feedback_priority NOT NULL DEFAULT 'medium',
  affected_module text,
  attachment_url text,
  status feedback_status NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "submitter or admin views feedback" ON public.admin_feedback FOR SELECT TO authenticated
  USING (submitted_by = auth.uid() OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "club admin submits feedback" ON public.admin_feedback FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid() AND public.is_admin(auth.uid()));
CREATE POLICY "super admin updates feedback" ON public.admin_feedback FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'));

CREATE TABLE public.feedback_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NOT NULL REFERENCES public.admin_feedback(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  comment text NOT NULL,
  internal boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feedback_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view feedback comments" ON public.feedback_comments FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'super_admin')
    OR EXISTS (SELECT 1 FROM public.admin_feedback f WHERE f.id = feedback_id AND f.submitted_by = auth.uid() AND internal = false)
  );
CREATE POLICY "admins write feedback comments" ON public.feedback_comments FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) AND author_id = auth.uid());

CREATE TABLE public.feedback_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NOT NULL REFERENCES public.admin_feedback(id) ON DELETE CASCADE,
  changed_by uuid NOT NULL,
  old_status feedback_status,
  new_status feedback_status NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feedback_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins view status history" ON public.feedback_status_history FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.audit_feedback_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP='UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.feedback_status_history (feedback_id, changed_by, old_status, new_status)
    VALUES (NEW.id, COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid), OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_feedback_status AFTER UPDATE ON public.admin_feedback
  FOR EACH ROW EXECUTE FUNCTION public.audit_feedback_status();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
