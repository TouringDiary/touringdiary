-- Migration: user_template_preferences
-- Purpose: Persists per-user suitcase template preferences for personalization and future AI ranking.
-- Designed to be forward-compatible with ML-based preference scoring.

CREATE TABLE IF NOT EXISTS public.user_template_preferences (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.suitcases(id) ON DELETE CASCADE,
  enabled     boolean NOT NULL DEFAULT true,   -- false = dismissed
  priority    integer NOT NULL DEFAULT 0,       -- for future AI ranking (higher = more preferred)
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  -- One preference record per user+template combination
  UNIQUE (user_id, template_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_utp_user_id   ON public.user_template_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_utp_template_id ON public.user_template_preferences(template_id);

-- RLS: users can only read/write their own preferences
ALTER TABLE public.user_template_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "utp: users can manage own preferences"
  ON public.user_template_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_utp_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_utp_updated_at
  BEFORE UPDATE ON public.user_template_preferences
  FOR EACH ROW EXECUTE FUNCTION update_utp_timestamp();
