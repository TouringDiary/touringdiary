-- MF2 — content_reports unificato (§42.4, Q19)

CREATE TABLE IF NOT EXISTS public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_group_id uuid NOT NULL,
  parent_report_id uuid REFERENCES public.content_reports (id) ON DELETE SET NULL,
  report_kind text NOT NULL CHECK (
    report_kind IN (
      'entity_abuse',
      'image_abuse',
      'community_error',
      'suggestion_photo',
      'suggestion_person'
    )
  ),
  entity_type text NOT NULL CHECK (
    entity_type IN (
      'city_person',
      'poi',
      'patron',
      'photo_submission',
      'community_live',
      'city_gallery',
      'community'
    )
  ),
  entity_id text NOT NULL,
  city_id text NOT NULL REFERENCES public.cities (id) ON DELETE CASCADE,
  assignment_id uuid REFERENCES public.entity_image_assignments (id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'nuovo' CHECK (
    status IN ('nuovo', 'in_verifica', 'ok', 'ko')
  ),
  reason text NOT NULL CHECK (
    reason IN ('copyright', 'other_rights', 'unauthorized', 'other', 'error', 'suggestion')
  ),
  user_notes text NOT NULL,
  admin_notes text,
  reporter_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  reporter_user_name text,
  reporter_email text,
  reporter_email_verified boolean NOT NULL DEFAULT false,
  source_context text CHECK (
    source_context IS NULL
    OR source_context IN (
      'official_photo',
      'community_live',
      'city_gallery',
      'patron_gallery',
      'poi',
      'suggestion'
    )
  ),
  snapshot_entity_name text,
  snapshot_image_url text,
  snapshot_storage_bucket text,
  snapshot_storage_path text,
  snapshot_entity_status text,
  snapshot_assignment_status text,
  evidence_storage_bucket text,
  evidence_storage_path text,
  evidence_content_hash text,
  evidence_captured_at timestamptz,
  legacy_table text,
  legacy_report_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_reports_user_notes_chk CHECK (
    char_length(trim(user_notes)) > 0 AND char_length(user_notes) <= 4000
  )
);

CREATE INDEX IF NOT EXISTS content_reports_status_entity_idx
  ON public.content_reports (status, entity_type, created_at DESC);

CREATE INDEX IF NOT EXISTS content_reports_group_idx
  ON public.content_reports (report_group_id, created_at DESC);

CREATE INDEX IF NOT EXISTS content_reports_city_idx
  ON public.content_reports (city_id, status);

CREATE INDEX IF NOT EXISTS content_reports_assignment_idx
  ON public.content_reports (assignment_id)
  WHERE assignment_id IS NOT NULL;

COMMENT ON TABLE public.content_reports IS
  'MF2 — segnalazioni centrali (Modello B, evidence, stati NUOVO/IN VERIFICA/OK/KO).';

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- Insert: authenticated users (guest must complete OTP → session before insert)
DROP POLICY IF EXISTS content_reports_insert_authenticated ON public.content_reports;
CREATE POLICY content_reports_insert_authenticated ON public.content_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Read/update: admin only
DROP POLICY IF EXISTS content_reports_admin_select ON public.content_reports;
CREATE POLICY content_reports_admin_select ON public.content_reports
  FOR SELECT
  TO authenticated
  USING (public.is_td_admin(auth.uid()) OR public.is_service_role());

DROP POLICY IF EXISTS content_reports_admin_update ON public.content_reports;
CREATE POLICY content_reports_admin_update ON public.content_reports
  FOR UPDATE
  TO authenticated
  USING (public.is_td_admin(auth.uid()) OR public.is_service_role())
  WITH CHECK (public.is_td_admin(auth.uid()) OR public.is_service_role());

GRANT SELECT, INSERT, UPDATE ON public.content_reports TO authenticated;
GRANT ALL ON public.content_reports TO service_role;
