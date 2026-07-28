-- WF-12 / MP-02 STEP-3 — Preferiti (attributo trasversale) + Esploratore (città visitate).
-- SoT: DOC 35 §7–8 / PV-003 / PV-005. Nessuna cartella Preferiti; delete Viaggio ↛ città visitata.

-- ---------------------------------------------------------------------------
-- Preferiti: stato Preferito trasversale (no dominio, no copie, no raccolte).
-- entity_kind CHECK ↔ USER_FAVORITE_ENTITY_KINDS in userFavoritesService.ts (SoT TS).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_favorites (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  entity_kind text NOT NULL CHECK (
    entity_kind IN (
      'city',
      'poi',
      'shop',
      'guide',
      'tour_operator',
      'character',
      'viaggio',
      'suitcase',
      'template'
    )
  ),
  entity_id text NOT NULL CHECK (length(trim(entity_id)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, entity_kind, entity_id)
);

COMMENT ON TABLE public.user_favorites IS
  'Attributo Preferito trasversale (DOC 35 §7). Vista personale; non crea entità/copie/cartelle.';

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_kind
  ON public.user_favorites (user_id, entity_kind);

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own user_favorites"
  ON public.user_favorites;
CREATE POLICY "Users manage own user_favorites"
  ON public.user_favorites
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR public.is_td_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_td_admin(auth.uid()));

GRANT SELECT, INSERT, DELETE ON public.user_favorites TO authenticated;

-- ---------------------------------------------------------------------------
-- Esploratore: archivio città visitate (indipendente dai Viaggi).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_visited_cities (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  city_id text NOT NULL REFERENCES public.cities (id) ON DELETE CASCADE,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'auto' CHECK (source IN ('auto', 'manual')),
  PRIMARY KEY (user_id, city_id)
);

COMMENT ON TABLE public.user_visited_cities IS
  'Archivio Esploratore — città visitate (DOC 35 §8 / PV-005). Delete Viaggio non rimuove righe.';

CREATE INDEX IF NOT EXISTS idx_user_visited_cities_user
  ON public.user_visited_cities (user_id);

ALTER TABLE public.user_visited_cities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own user_visited_cities"
  ON public.user_visited_cities;
CREATE POLICY "Users manage own user_visited_cities"
  ON public.user_visited_cities
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR public.is_td_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_td_admin(auth.uid()));

GRANT SELECT, INSERT, DELETE ON public.user_visited_cities TO authenticated;
