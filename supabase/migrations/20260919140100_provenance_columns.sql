-- MF3 — Provenance strutturata su media_assets (D76, §42.1)

ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS source_ref text,
  ADD COLUMN IF NOT EXISTS content_hash text,
  ADD COLUMN IF NOT EXISTS license_code text,
  ADD COLUMN IF NOT EXISTS license_url text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS attribution_text text,
  ADD COLUMN IF NOT EXISTS copyright_notice text,
  ADD COLUMN IF NOT EXISTS author_name text,
  ADD COLUMN IF NOT EXISTS rights_holder text,
  ADD COLUMN IF NOT EXISTS retrieved_at timestamptz,
  ADD COLUMN IF NOT EXISTS license_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS media_assets_content_hash_idx
  ON public.media_assets (content_hash)
  WHERE content_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS media_assets_generated_by_ai_idx
  ON public.media_assets (generated_by_ai)
  WHERE generated_by_ai = true;

COMMENT ON COLUMN public.media_assets.source_ref IS
  'Riferimento strutturato alla sorgente (es. wikimedia file title, submission id) — non euristica URL.';
