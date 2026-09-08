-- =============================================================================
-- Angolo Cultura: taxonomy Master/Specific + junction N:M + structured dates
-- PO-M seed §F3.3 | PO-N/PO-R soft-delete only (no app hard delete) | PO-J drop role
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Master categories
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.famous_person_master_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  label text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT famous_person_master_categories_slug_unique UNIQUE (slug),
  CONSTRAINT famous_person_master_categories_active_deleted_chk CHECK (
    (is_active = true AND deleted_at IS NULL)
    OR (is_active = false AND deleted_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_fp_master_active_order
  ON public.famous_person_master_categories (is_active, order_index);

COMMENT ON TABLE public.famous_person_master_categories IS
  'SoT Master categories for Famous People (Angolo Cultura). Soft-delete only.';

-- ---------------------------------------------------------------------------
-- 2. Specific categories
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.famous_person_specific_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id uuid NOT NULL REFERENCES public.famous_person_master_categories (id) ON DELETE RESTRICT,
  slug text NOT NULL,
  label text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT famous_person_specific_categories_slug_unique UNIQUE (slug),
  CONSTRAINT famous_person_specific_categories_active_deleted_chk CHECK (
    (is_active = true AND deleted_at IS NULL)
    OR (is_active = false AND deleted_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_fp_specific_master_order
  ON public.famous_person_specific_categories (master_id, is_active, order_index);

COMMENT ON TABLE public.famous_person_specific_categories IS
  'SoT Specific categories for Famous People. Each Specific belongs to one Master.';

-- ---------------------------------------------------------------------------
-- 3. updated_at triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_famous_person_category_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fp_master_updated ON public.famous_person_master_categories;
CREATE TRIGGER trg_fp_master_updated
  BEFORE UPDATE ON public.famous_person_master_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_famous_person_category_updated_at();

DROP TRIGGER IF EXISTS trg_fp_specific_updated ON public.famous_person_specific_categories;
CREATE TRIGGER trg_fp_specific_updated
  BEFORE UPDATE ON public.famous_person_specific_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_famous_person_category_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Bonifica dati test city_people (cutover)
-- ---------------------------------------------------------------------------
DELETE FROM public.city_people;

-- ---------------------------------------------------------------------------
-- 5. Structured date columns + drop role
-- ---------------------------------------------------------------------------
ALTER TABLE public.city_people
  ADD COLUMN IF NOT EXISTS birth_year integer NULL,
  ADD COLUMN IF NOT EXISTS birth_date date NULL,
  ADD COLUMN IF NOT EXISTS is_living boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS death_year integer NULL,
  ADD COLUMN IF NOT EXISTS death_date date NULL,
  ADD COLUMN IF NOT EXISTS lifespan_display text NULL;

ALTER TABLE public.city_people DROP COLUMN IF EXISTS role;

ALTER TABLE public.city_people DROP CONSTRAINT IF EXISTS city_people_dates_living_chk;
ALTER TABLE public.city_people
  ADD CONSTRAINT city_people_dates_living_chk CHECK (
    (is_living = true AND death_year IS NULL AND death_date IS NULL)
    OR (is_living = false AND death_year IS NOT NULL)
  );

ALTER TABLE public.city_people DROP CONSTRAINT IF EXISTS city_people_birth_date_year_chk;
ALTER TABLE public.city_people
  ADD CONSTRAINT city_people_birth_date_year_chk CHECK (
    birth_date IS NULL OR birth_year IS NULL OR EXTRACT(YEAR FROM birth_date)::integer = birth_year
  );

ALTER TABLE public.city_people DROP CONSTRAINT IF EXISTS city_people_death_date_year_chk;
ALTER TABLE public.city_people
  ADD CONSTRAINT city_people_death_date_year_chk CHECK (
    death_date IS NULL OR death_year IS NULL OR EXTRACT(YEAR FROM death_date)::integer = death_year
  );

ALTER TABLE public.city_people DROP CONSTRAINT IF EXISTS city_people_death_year_ge_birth_year_chk;
ALTER TABLE public.city_people
  ADD CONSTRAINT city_people_death_year_ge_birth_year_chk CHECK (
    death_year IS NULL OR birth_year IS NULL OR death_year >= birth_year
  );

ALTER TABLE public.city_people DROP CONSTRAINT IF EXISTS city_people_death_date_ge_birth_date_chk;
ALTER TABLE public.city_people
  ADD CONSTRAINT city_people_death_date_ge_birth_date_chk CHECK (
    death_date IS NULL OR birth_date IS NULL OR death_date >= birth_date
  );

CREATE INDEX IF NOT EXISTS idx_city_people_birth_year
  ON public.city_people (birth_year);

-- ---------------------------------------------------------------------------
-- 6. Junction N:M
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.city_person_category_links (
  person_id uuid NOT NULL REFERENCES public.city_people (id) ON DELETE CASCADE,
  specific_category_id uuid NOT NULL REFERENCES public.famous_person_specific_categories (id) ON DELETE RESTRICT,
  PRIMARY KEY (person_id, specific_category_id)
);

CREATE INDEX IF NOT EXISTS idx_city_person_category_links_specific
  ON public.city_person_category_links (specific_category_id);

COMMENT ON TABLE public.city_person_category_links IS
  'N:M Famous Person ↔ Specific category. Master is derived from Specific.';

-- ---------------------------------------------------------------------------
-- 7. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.famous_person_master_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.famous_person_specific_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_person_category_links ENABLE ROW LEVEL SECURITY;

-- Public/authenticated: read active categories (anon + authenticated for public Culture)
DROP POLICY IF EXISTS fp_master_select_active_or_admin ON public.famous_person_master_categories;
CREATE POLICY fp_master_select_active_or_admin ON public.famous_person_master_categories
  FOR SELECT
  USING (
    (is_active = true AND deleted_at IS NULL)
    OR public.is_td_admin(auth.uid())
    OR public.is_service_role()
  );

DROP POLICY IF EXISTS fp_master_admin_write ON public.famous_person_master_categories;
CREATE POLICY fp_master_admin_write ON public.famous_person_master_categories
  FOR ALL TO authenticated
  USING (public.is_td_admin(auth.uid()) OR public.is_service_role())
  WITH CHECK (public.is_td_admin(auth.uid()) OR public.is_service_role());

DROP POLICY IF EXISTS fp_specific_select_active_or_admin ON public.famous_person_specific_categories;
CREATE POLICY fp_specific_select_active_or_admin ON public.famous_person_specific_categories
  FOR SELECT
  USING (
    (is_active = true AND deleted_at IS NULL)
    OR public.is_td_admin(auth.uid())
    OR public.is_service_role()
  );

DROP POLICY IF EXISTS fp_specific_admin_write ON public.famous_person_specific_categories;
CREATE POLICY fp_specific_admin_write ON public.famous_person_specific_categories
  FOR ALL TO authenticated
  USING (public.is_td_admin(auth.uid()) OR public.is_service_role())
  WITH CHECK (public.is_td_admin(auth.uid()) OR public.is_service_role());

-- Links: readable when person is published OR admin; write admin only
DROP POLICY IF EXISTS city_person_category_links_select ON public.city_person_category_links;
CREATE POLICY city_person_category_links_select ON public.city_person_category_links
  FOR SELECT
  USING (
    public.is_td_admin(auth.uid())
    OR public.is_service_role()
    OR EXISTS (
      SELECT 1 FROM public.city_people cp
      WHERE cp.id = person_id AND cp.status = 'published'
    )
  );

DROP POLICY IF EXISTS city_person_category_links_admin_write ON public.city_person_category_links;
CREATE POLICY city_person_category_links_admin_write ON public.city_person_category_links
  FOR ALL TO authenticated
  USING (public.is_td_admin(auth.uid()) OR public.is_service_role())
  WITH CHECK (public.is_td_admin(auth.uid()) OR public.is_service_role());

GRANT SELECT ON public.famous_person_master_categories TO anon, authenticated;
GRANT SELECT ON public.famous_person_specific_categories TO anon, authenticated;
GRANT SELECT ON public.city_person_category_links TO anon, authenticated;
GRANT ALL ON public.famous_person_master_categories TO authenticated;
GRANT ALL ON public.famous_person_specific_categories TO authenticated;
GRANT ALL ON public.city_person_category_links TO authenticated;

-- ---------------------------------------------------------------------------
-- 8. Seed §F3.3 (definitive)
-- ---------------------------------------------------------------------------
WITH masters(slug, label, order_index) AS (
  VALUES
    ('arte', 'Arte', 1),
    ('letteratura', 'Letteratura', 2),
    ('musica', 'Musica', 3),
    ('teatro_cinema', 'Teatro e cinema', 4),
    ('filosofia', 'Filosofia', 5),
    ('scienze', 'Scienze', 6),
    ('medicina', 'Medicina', 7),
    ('diritto', 'Diritto', 8),
    ('politica', 'Politica e Stato', 9),
    ('storia', 'Storia e antichità', 10),
    ('religione', 'Religione', 11),
    ('militare', 'Militare', 12),
    ('tecnica', 'Invenzione e tecnica', 13),
    ('esplorazione', 'Esplorazione', 14),
    ('economia', 'Economia e impresa', 15),
    ('educazione', 'Educazione', 16),
    ('sport', 'Sport', 17),
    ('gastronomia', 'Gastronomia', 18),
    ('design_moda', 'Design e moda', 19)
)
INSERT INTO public.famous_person_master_categories (slug, label, order_index)
SELECT slug, label, order_index FROM masters
ON CONFLICT (slug) DO UPDATE SET label = EXCLUDED.label, order_index = EXCLUDED.order_index;

WITH specs(master_slug, slug, label, order_index) AS (
  VALUES
    ('arte', 'pittore', 'Pittore', 1),
    ('arte', 'scultore', 'Scultore', 2),
    ('arte', 'architetto', 'Architetto', 3),
    ('arte', 'incisore', 'Incisore', 4),
    ('arte', 'illustratore', 'Illustratore', 5),
    ('arte', 'fotografo', 'Fotografo', 6),
    ('letteratura', 'poeta', 'Poeta', 1),
    ('letteratura', 'romanziere', 'Romanziere', 2),
    ('letteratura', 'drammaturgo', 'Drammaturgo', 3),
    ('letteratura', 'saggista', 'Saggista', 4),
    ('letteratura', 'giornalista', 'Giornalista', 5),
    ('musica', 'compositore', 'Compositore', 1),
    ('musica', 'cantante', 'Cantante', 2),
    ('musica', 'musicista_strumentista', 'Musicista strumentista', 3),
    ('musica', 'direttore_orchestra', 'Direttore d''orchestra', 4),
    ('musica', 'cantautore', 'Cantautore', 5),
    ('teatro_cinema', 'attore', 'Attore', 1),
    ('teatro_cinema', 'regista', 'Regista', 2),
    ('teatro_cinema', 'sceneggiatore', 'Sceneggiatore', 3),
    ('teatro_cinema', 'comico', 'Comico', 4),
    ('filosofia', 'filosofo', 'Filosofo', 1),
    ('filosofia', 'epistemologo', 'Epistemologo', 2),
    ('filosofia', 'etica', 'Filosofo morale / etica', 3),
    ('scienze', 'matematico', 'Matematico', 1),
    ('scienze', 'fisico', 'Fisico', 2),
    ('scienze', 'chimico', 'Chimico', 3),
    ('scienze', 'biologo', 'Biologo', 4),
    ('scienze', 'astronomo', 'Astronomo', 5),
    ('scienze', 'naturalista', 'Naturalista', 6),
    ('scienze', 'informatico', 'Informatico', 7),
    ('medicina', 'medico', 'Medico', 1),
    ('medicina', 'chirurgo', 'Chirurgo', 2),
    ('medicina', 'anatomista', 'Anatomista', 3),
    ('medicina', 'cardiologo', 'Cardiologo', 4),
    ('medicina', 'neurologo', 'Neurologo', 5),
    ('medicina', 'pediatra', 'Pediatra', 6),
    ('medicina', 'farmacologo', 'Farmacologo', 7),
    ('diritto', 'giurista', 'Giurista', 1),
    ('diritto', 'avvocato', 'Avvocato', 2),
    ('diritto', 'magistrato', 'Magistrato', 3),
    ('politica', 'politico', 'Politico', 1),
    ('politica', 'statista', 'Statista', 2),
    ('politica', 'diplomatico', 'Diplomatico', 3),
    ('politica', 'rivoluzionario', 'Rivoluzionario', 4),
    ('storia', 'storico', 'Storico', 1),
    ('storia', 'archeologo', 'Archeologo', 2),
    ('storia', 'umanista', 'Umanista', 3),
    ('storia', 'epigrafista', 'Epigrafista', 4),
    ('religione', 'teologo', 'Teologo', 1),
    ('religione', 'religioso', 'Religioso', 2),
    ('religione', 'predicatore', 'Predicatore', 3),
    ('religione', 'vescovo', 'Vescovo', 4),
    ('militare', 'condottiero', 'Condottiero', 1),
    ('militare', 'generale', 'Generale', 2),
    ('militare', 'ammiraglio', 'Ammiraglio', 3),
    ('militare', 'stratega', 'Stratega', 4),
    ('tecnica', 'inventore', 'Inventore', 1),
    ('tecnica', 'ingegnere', 'Ingegnere', 2),
    ('tecnica', 'esploratore_tecnico', 'Esploratore tecnico', 3),
    ('esplorazione', 'esploratore', 'Esploratore', 1),
    ('esplorazione', 'navigatore', 'Navigatore', 2),
    ('esplorazione', 'cartografo', 'Cartografo', 3),
    ('economia', 'economista', 'Economista', 1),
    ('economia', 'imprenditore', 'Imprenditore', 2),
    ('economia', 'banchiere', 'Banchiere', 3),
    ('educazione', 'pedagogista', 'Pedagogista', 1),
    ('educazione', 'educatore', 'Educatore', 2),
    ('educazione', 'accademico', 'Accademico', 3),
    ('sport', 'calciatore', 'Calciatore', 1),
    ('sport', 'tennista', 'Tennista', 2),
    ('sport', 'atleta', 'Atleta', 3),
    ('sport', 'pugile', 'Pugile', 4),
    ('sport', 'pilota', 'Pilota', 5),
    ('sport', 'allenatore', 'Allenatore', 6),
    ('gastronomia', 'chef', 'Chef', 1),
    ('gastronomia', 'gastronomo', 'Gastronomo', 2),
    ('gastronomia', 'enologo', 'Enologo', 3),
    ('design_moda', 'designer', 'Designer', 1),
    ('design_moda', 'stilista', 'Stilista', 2),
    ('design_moda', 'artigiano_darte', 'Artigiano d''arte', 3)
)
INSERT INTO public.famous_person_specific_categories (master_id, slug, label, order_index)
SELECT m.id, s.slug, s.label, s.order_index
FROM specs s
JOIN public.famous_person_master_categories m ON m.slug = s.master_slug
ON CONFLICT (slug) DO UPDATE SET
  label = EXCLUDED.label,
  order_index = EXCLUDED.order_index,
  master_id = EXCLUDED.master_id;

COMMIT;
