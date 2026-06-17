-- =============================================================================
-- MACROFASE A: catalogo packing DB-driven (standard, template specifici, AI)
-- Categorie restano frontend-only — nessuna tabella categories.
-- =============================================================================

-- 1. Standard items (core valigia / seed)
CREATE TABLE IF NOT EXISTS public.packing_standard_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    tier TEXT NOT NULL DEFAULT 'core'
        CHECK (tier IN ('core', 'additional', 'additional_ai_only')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT packing_standard_items_unique_name UNIQUE (category, name)
);

CREATE INDEX IF NOT EXISTS idx_packing_standard_items_active
    ON public.packing_standard_items (is_active, sort_order);

COMMENT ON TABLE public.packing_standard_items IS
    'Oggetti standard condivisi (core valigia). Categorie = nomi canonici frontend.';

-- 2. Template specific items (solo template TD)
CREATE TABLE IF NOT EXISTS public.packing_template_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.suitcases(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT packing_template_items_unique_name UNIQUE (template_id, category, name)
);

CREATE INDEX IF NOT EXISTS idx_packing_template_items_template
    ON public.packing_template_items (template_id, is_active, sort_order);

COMMENT ON TABLE public.packing_template_items IS
    'Oggetti specifici per template TD (user_id IS NULL). Composizione = standard + specifici.';

-- 3. Catalogo AI admin-driven
CREATE TABLE IF NOT EXISTS public.packing_ai_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT packing_ai_catalog_unique_name UNIQUE (name)
);

CREATE INDEX IF NOT EXISTS idx_packing_ai_catalog_active
    ON public.packing_ai_catalog (is_active, sort_order);

CREATE INDEX IF NOT EXISTS idx_packing_ai_catalog_tags
    ON public.packing_ai_catalog USING GIN (tags);

COMMENT ON TABLE public.packing_ai_catalog IS
    'Catalogo AI admin-driven. Motore AI (MACROFASE C) leggerà da qui.';

-- 4. updated_at trigger (pattern progetto)
CREATE OR REPLACE FUNCTION public.set_packing_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_packing_standard_items_updated ON public.packing_standard_items;
CREATE TRIGGER trg_packing_standard_items_updated
    BEFORE UPDATE ON public.packing_standard_items
    FOR EACH ROW EXECUTE FUNCTION public.set_packing_updated_at();

DROP TRIGGER IF EXISTS trg_packing_template_items_updated ON public.packing_template_items;
CREATE TRIGGER trg_packing_template_items_updated
    BEFORE UPDATE ON public.packing_template_items
    FOR EACH ROW EXECUTE FUNCTION public.set_packing_updated_at();

DROP TRIGGER IF EXISTS trg_packing_ai_catalog_updated ON public.packing_ai_catalog;
CREATE TRIGGER trg_packing_ai_catalog_updated
    BEFORE UPDATE ON public.packing_ai_catalog
    FOR EACH ROW EXECUTE FUNCTION public.set_packing_updated_at();

-- 5. RLS
ALTER TABLE public.packing_standard_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packing_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packing_ai_catalog ENABLE ROW LEVEL SECURITY;

-- Lettura pubblica (autenticati) per composizione runtime
CREATE POLICY "Authenticated users can read active packing standard items"
ON public.packing_standard_items FOR SELECT TO authenticated
USING (is_active = true OR public.is_td_admin(auth.uid()) OR public.is_service_role());

CREATE POLICY "Authenticated users can read active packing template items"
ON public.packing_template_items FOR SELECT TO authenticated
USING (
    is_active = true
    OR public.is_td_admin(auth.uid())
    OR public.is_service_role()
);

CREATE POLICY "Authenticated users can read active packing ai catalog"
ON public.packing_ai_catalog FOR SELECT TO authenticated
USING (is_active = true OR public.is_td_admin(auth.uid()) OR public.is_service_role());

-- Admin full access
CREATE POLICY "Admins manage packing standard items"
ON public.packing_standard_items FOR ALL TO authenticated
USING (public.is_td_admin(auth.uid()) OR public.is_service_role())
WITH CHECK (public.is_td_admin(auth.uid()) OR public.is_service_role());

CREATE POLICY "Admins manage packing template items"
ON public.packing_template_items FOR ALL TO authenticated
USING (public.is_td_admin(auth.uid()) OR public.is_service_role())
WITH CHECK (public.is_td_admin(auth.uid()) OR public.is_service_role());

CREATE POLICY "Admins manage packing ai catalog"
ON public.packing_ai_catalog FOR ALL TO authenticated
USING (public.is_td_admin(auth.uid()) OR public.is_service_role())
WITH CHECK (public.is_td_admin(auth.uid()) OR public.is_service_role());
