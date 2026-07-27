-- WF-09 / MP-01 STEP-5 — Ricordi · Allegati · annotazioni Riepilogo (DOC 37 §§6–7,10)
-- Ownership media/allegati sul Viaggio; Riepilogo resta View (annotazioni leggere, non Resource CRUD).

-- updated_at: stesso pattern di set_collaboration_updated_at / set_packing_updated_at (NEW.updated_at = now()).
CREATE OR REPLACE FUNCTION public.set_viaggio_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ── Ricordi: Foto / Video ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.viaggio_ricordi_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viaggio_id uuid NOT NULL REFERENCES public.viaggi (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('photo', 'video')),
  day_key text NOT NULL CHECK (length(trim(day_key)) > 0),
  title text NULL,
  storage_path text NOT NULL CHECK (length(trim(storage_path)) > 0),
  mime_type text NOT NULL CHECK (length(trim(mime_type)) > 0),
  size_bytes bigint NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  coords_lat double precision NULL,
  coords_lng double precision NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT viaggio_ricordi_media_coords_pair_chk CHECK (
    (coords_lat IS NULL AND coords_lng IS NULL)
    OR (coords_lat IS NOT NULL AND coords_lng IS NOT NULL)
  ),
  CONSTRAINT viaggio_ricordi_media_coords_range_chk CHECK (
    (coords_lat IS NULL OR (coords_lat >= -90 AND coords_lat <= 90))
    AND (coords_lng IS NULL OR (coords_lng >= -180 AND coords_lng <= 180))
  )
);

COMMENT ON TABLE public.viaggio_ricordi_media IS
  'Ricordi Foto/Video del Viaggio (DOC 37 §6). Ownership sul Viaggio; day_key = struttura giorni.';

CREATE INDEX IF NOT EXISTS idx_viaggio_ricordi_media_viaggio_day
  ON public.viaggio_ricordi_media (viaggio_id, day_key, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_viaggio_ricordi_media_user
  ON public.viaggio_ricordi_media (user_id, created_at DESC);

ALTER TABLE public.viaggio_ricordi_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own viaggio_ricordi_media" ON public.viaggio_ricordi_media;
CREATE POLICY "Users manage own viaggio_ricordi_media"
  ON public.viaggio_ricordi_media
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR public.is_td_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_td_admin(auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.viaggio_ricordi_media TO authenticated;

-- ── Ricordi: Note per giorno ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.viaggio_ricordi_day_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viaggio_id uuid NOT NULL REFERENCES public.viaggi (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  day_key text NOT NULL CHECK (length(trim(day_key)) > 0),
  body text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT viaggio_ricordi_day_notes_unique UNIQUE (viaggio_id, day_key)
);

COMMENT ON TABLE public.viaggio_ricordi_day_notes IS
  'Note per giorno in Ricordi (≠ note Diario ≠ annotazioni Riepilogo) — DOC 37 §6 / glossario.';

CREATE INDEX IF NOT EXISTS idx_viaggio_ricordi_day_notes_viaggio
  ON public.viaggio_ricordi_day_notes (viaggio_id, day_key);

DROP TRIGGER IF EXISTS trg_viaggio_ricordi_day_notes_updated_at
  ON public.viaggio_ricordi_day_notes;
CREATE TRIGGER trg_viaggio_ricordi_day_notes_updated_at
  BEFORE UPDATE ON public.viaggio_ricordi_day_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_viaggio_updated_at();

ALTER TABLE public.viaggio_ricordi_day_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own viaggio_ricordi_day_notes" ON public.viaggio_ricordi_day_notes;
CREATE POLICY "Users manage own viaggio_ricordi_day_notes"
  ON public.viaggio_ricordi_day_notes
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR public.is_td_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_td_admin(auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.viaggio_ricordi_day_notes TO authenticated;

-- ── Allegati del Viaggio (≠ workspace_attachments) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.viaggio_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viaggio_id uuid NOT NULL REFERENCES public.viaggi (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  file_name text NOT NULL CHECK (length(trim(file_name)) > 0),
  storage_path text NOT NULL CHECK (length(trim(storage_path)) > 0),
  mime_type text NOT NULL CHECK (length(trim(mime_type)) > 0),
  size_bytes bigint NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  category text NOT NULL DEFAULT 'misc'
    CHECK (category IN ('documents', 'tickets', 'bookings', 'expenses', 'misc')),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.viaggio_attachments IS
  'Allegati personali del Viaggio (DOC 37 §7). Distinti da workspace_attachments.';

CREATE INDEX IF NOT EXISTS idx_viaggio_attachments_viaggio
  ON public.viaggio_attachments (viaggio_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_viaggio_attachments_user
  ON public.viaggio_attachments (user_id, created_at DESC);

ALTER TABLE public.viaggio_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own viaggio_attachments" ON public.viaggio_attachments;
CREATE POLICY "Users manage own viaggio_attachments"
  ON public.viaggio_attachments
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR public.is_td_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_td_admin(auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.viaggio_attachments TO authenticated;

-- ── Riepilogo: annotazioni leggere (View, non Resource peer) ────────────────
CREATE TABLE IF NOT EXISTS public.viaggio_riepilogo_annotations (
  viaggio_id uuid PRIMARY KEY REFERENCES public.viaggi (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  general jsonb NOT NULL DEFAULT '{}'::jsonb,
  by_day jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.viaggio_riepilogo_annotations IS
  'Annotazioni leggere sulla View Riepilogo (DOC 37 §10). Non promuove Riepilogo a Resource CRUD.';

DROP TRIGGER IF EXISTS trg_viaggio_riepilogo_annotations_updated_at
  ON public.viaggio_riepilogo_annotations;
CREATE TRIGGER trg_viaggio_riepilogo_annotations_updated_at
  BEFORE UPDATE ON public.viaggio_riepilogo_annotations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_viaggio_updated_at();

ALTER TABLE public.viaggio_riepilogo_annotations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own viaggio_riepilogo_annotations"
  ON public.viaggio_riepilogo_annotations;
CREATE POLICY "Users manage own viaggio_riepilogo_annotations"
  ON public.viaggio_riepilogo_annotations
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR public.is_td_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_td_admin(auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.viaggio_riepilogo_annotations TO authenticated;

-- ── Storage buckets (privati, path-scoped all’owner) ────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('viaggio-ricordi', 'viaggio-ricordi', false),
  ('viaggio-attachments', 'viaggio-attachments', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users read own viaggio-ricordi" ON storage.objects;
CREATE POLICY "Users read own viaggio-ricordi"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'viaggio-ricordi'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users write own viaggio-ricordi" ON storage.objects;
CREATE POLICY "Users write own viaggio-ricordi"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'viaggio-ricordi'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users update own viaggio-ricordi" ON storage.objects;
CREATE POLICY "Users update own viaggio-ricordi"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'viaggio-ricordi'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users delete own viaggio-ricordi" ON storage.objects;
CREATE POLICY "Users delete own viaggio-ricordi"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'viaggio-ricordi'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users read own viaggio-attachments" ON storage.objects;
CREATE POLICY "Users read own viaggio-attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'viaggio-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users write own viaggio-attachments" ON storage.objects;
CREATE POLICY "Users write own viaggio-attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'viaggio-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users update own viaggio-attachments" ON storage.objects;
CREATE POLICY "Users update own viaggio-attachments"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'viaggio-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users delete own viaggio-attachments" ON storage.objects;
CREATE POLICY "Users delete own viaggio-attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'viaggio-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
