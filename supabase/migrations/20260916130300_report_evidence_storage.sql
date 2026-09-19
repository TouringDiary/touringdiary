-- MF2 — bucket privato report-evidence (§42.5) — admin-only

INSERT INTO storage.buckets (id, name, public)
VALUES ('report-evidence', 'report-evidence', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS report_evidence_admin_read ON storage.objects;
CREATE POLICY report_evidence_admin_read ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'report-evidence'
    AND (public.is_td_admin(auth.uid()) OR public.is_service_role())
  );

DROP POLICY IF EXISTS report_evidence_admin_write ON storage.objects;
CREATE POLICY report_evidence_admin_write ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'report-evidence'
    AND (public.is_td_admin(auth.uid()) OR public.is_service_role())
  );

DROP POLICY IF EXISTS report_evidence_service_all ON storage.objects;
CREATE POLICY report_evidence_service_all ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'report-evidence')
  WITH CHECK (bucket_id = 'report-evidence');
