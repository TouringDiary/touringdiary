-- MF1 — Predisposizione architetturale media_assets (schema minimo §42.1 subset).

CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_bucket text NOT NULL,
  storage_path text NOT NULL,
  origin_type text NOT NULL DEFAULT 'admin_upload',
  is_placeholder boolean NOT NULL DEFAULT false,
  generated_by_ai boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS media_assets_storage_bucket_path_idx
  ON public.media_assets (storage_bucket, storage_path);

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS media_assets_admin_manage ON public.media_assets;

CREATE POLICY media_assets_admin_manage ON public.media_assets
  FOR ALL
  USING (public.is_td_admin(auth.uid()) OR public.is_service_role())
  WITH CHECK (public.is_td_admin(auth.uid()) OR public.is_service_role());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;

COMMENT ON TABLE public.media_assets IS
  'MF1 base schema — lifecycle/assignments/report in MF2+';
