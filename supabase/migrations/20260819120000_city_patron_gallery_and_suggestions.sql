-- =============================================================================
-- PROPOSED — NOT APPLIED (awaiting PO approval after technical audit)
-- Patron / Festa Patronale — Gallery ufficiale, segnalazioni foto, segnalazioni abuso
-- Separato da cities.gallery, photo_submissions e dominio Photograph.
--
-- Audit 2026-08-19: RLS admin-only SELECT su moderazione; INSERT hardening;
-- report snapshot su delete foto; trigger updated_at; GRANT espliciti; RPC submit.
-- Audit 2026-08-19 (rev.2): p_rights_confirmed esplicito; reporter SET NULL;
-- storage_path NOT NULL; user_name da profiles; INSERT utente solo via RPC.
-- Prerequisito: bucket storage `public-media` già presente su Supabase remoto.
-- Post-apply: aggiornare servizi app (vedi AI_CONTEXT/22 + audit PO).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Gallery ufficiale Patrono / Festa Patronale
-- ---------------------------------------------------------------------------
CREATE TABLE public.city_patron_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id TEXT NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    storage_path TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    source_suggestion_item_id UUID,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_city_patron_gallery_city_id ON public.city_patron_gallery (city_id);
CREATE INDEX idx_city_patron_gallery_city_sort ON public.city_patron_gallery (city_id, sort_order);

COMMENT ON TABLE public.city_patron_gallery IS
    'Fotografie ufficiali Patrono / Festa Patronale per città. Non condivide cities.gallery.';
COMMENT ON COLUMN public.city_patron_gallery.source_suggestion_item_id IS
    'Provenienza opzionale da moderazione patron_photo_suggestion_items (audit).';

-- ---------------------------------------------------------------------------
-- 2. Segnalazioni foto (suggerimenti utente)
-- ---------------------------------------------------------------------------
CREATE TABLE public.patron_photo_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    city_id TEXT NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    city_name TEXT NOT NULL,
    patron_name TEXT NOT NULL,
    notes TEXT,
    rights_confirmed BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_patron_photo_suggestions_status ON public.patron_photo_suggestions (status, created_at DESC);
CREATE INDEX idx_patron_photo_suggestions_user ON public.patron_photo_suggestions (user_id);
CREATE INDEX idx_patron_photo_suggestions_city ON public.patron_photo_suggestions (city_id);

COMMENT ON TABLE public.patron_photo_suggestions IS
    'Segnalazioni utente di foto Patrono/Festa in attesa di moderazione. Visibili solo agli admin.';

-- ---------------------------------------------------------------------------
-- 3. Foto singole nella segnalazione
-- ---------------------------------------------------------------------------
CREATE TABLE public.patron_photo_suggestion_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suggestion_id UUID NOT NULL REFERENCES public.patron_photo_suggestions(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_patron_photo_suggestion_items_suggestion
    ON public.patron_photo_suggestion_items (suggestion_id, sort_order);
CREATE INDEX idx_patron_photo_suggestion_items_status
    ON public.patron_photo_suggestion_items (suggestion_id, status);

-- FK gallery → item (dopo entrambe le tabelle)
ALTER TABLE public.city_patron_gallery
    ADD CONSTRAINT city_patron_gallery_source_suggestion_item_id_fkey
    FOREIGN KEY (source_suggestion_item_id)
    REFERENCES public.patron_photo_suggestion_items(id)
    ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 4. Segnalazioni abuso su foto già pubblicate
-- ---------------------------------------------------------------------------
CREATE TABLE public.patron_photo_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gallery_photo_id UUID REFERENCES public.city_patron_gallery(id) ON DELETE SET NULL,
    gallery_image_url TEXT NOT NULL,
    gallery_storage_path TEXT,
    reporter_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reporter_user_name TEXT,
    city_id TEXT NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    city_name TEXT NOT NULL,
    patron_name TEXT NOT NULL,
    reason TEXT NOT NULL
        CHECK (reason IN ('copyright', 'other_rights', 'unauthorized', 'other')),
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_patron_photo_reports_status ON public.patron_photo_reports (status, created_at DESC);
CREATE INDEX idx_patron_photo_reports_gallery ON public.patron_photo_reports (gallery_photo_id);
CREATE INDEX idx_patron_photo_reports_city ON public.patron_photo_reports (city_id, created_at DESC);

COMMENT ON TABLE public.patron_photo_reports IS
    'Segnalazioni abuso/copyright su foto ufficiali. Snapshot URL conservato se la foto gallery viene rimossa.';
COMMENT ON COLUMN public.patron_photo_reports.gallery_image_url IS
    'Snapshot URL al momento della segnalazione (audit trail).';
COMMENT ON COLUMN public.patron_photo_reports.reporter_user_id IS
    'Utente segnalatore; NULL se account eliminato (audit trail conservato via reporter_user_name).';

-- ---------------------------------------------------------------------------
-- 5. updated_at triggers (pattern progetto)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_patron_moderation_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_patron_photo_suggestions_updated_at
    BEFORE UPDATE ON public.patron_photo_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_patron_moderation_updated_at();

CREATE TRIGGER trg_patron_photo_reports_updated_at
    BEFORE UPDATE ON public.patron_photo_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.set_patron_moderation_updated_at();

-- ---------------------------------------------------------------------------
-- 6. RLS — city_patron_gallery
-- ---------------------------------------------------------------------------
ALTER TABLE public.city_patron_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "city_patron_gallery_public_read"
    ON public.city_patron_gallery
    FOR SELECT
    USING (true);

CREATE POLICY "city_patron_gallery_admin_insert"
    ON public.city_patron_gallery
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_td_admin(auth.uid()));

CREATE POLICY "city_patron_gallery_admin_update"
    ON public.city_patron_gallery
    FOR UPDATE
    TO authenticated
    USING (public.is_td_admin(auth.uid()))
    WITH CHECK (public.is_td_admin(auth.uid()));

CREATE POLICY "city_patron_gallery_admin_delete"
    ON public.city_patron_gallery
    FOR DELETE
    TO authenticated
    USING (public.is_td_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- 7. RLS — patron_photo_suggestions (SELECT solo admin)
-- ---------------------------------------------------------------------------
ALTER TABLE public.patron_photo_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patron_photo_suggestions_admin_select"
    ON public.patron_photo_suggestions
    FOR SELECT
    TO authenticated
    USING (public.is_td_admin(auth.uid()));

-- Nessuna policy INSERT per authenticated: write path utente = RPC submit_patron_photo_suggestion.

CREATE POLICY "patron_photo_suggestions_admin_update"
    ON public.patron_photo_suggestions
    FOR UPDATE
    TO authenticated
    USING (public.is_td_admin(auth.uid()))
    WITH CHECK (public.is_td_admin(auth.uid()));

CREATE POLICY "patron_photo_suggestions_admin_delete"
    ON public.patron_photo_suggestions
    FOR DELETE
    TO authenticated
    USING (public.is_td_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- 8. RLS — patron_photo_suggestion_items (SELECT solo admin)
-- ---------------------------------------------------------------------------
ALTER TABLE public.patron_photo_suggestion_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patron_photo_suggestion_items_admin_select"
    ON public.patron_photo_suggestion_items
    FOR SELECT
    TO authenticated
    USING (public.is_td_admin(auth.uid()));

-- Nessuna policy INSERT per authenticated: write path utente = RPC submit_patron_photo_suggestion.

CREATE POLICY "patron_photo_suggestion_items_admin_update"
    ON public.patron_photo_suggestion_items
    FOR UPDATE
    TO authenticated
    USING (public.is_td_admin(auth.uid()))
    WITH CHECK (public.is_td_admin(auth.uid()));

CREATE POLICY "patron_photo_suggestion_items_admin_delete"
    ON public.patron_photo_suggestion_items
    FOR DELETE
    TO authenticated
    USING (public.is_td_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- 9. RLS — patron_photo_reports (SELECT solo admin)
-- ---------------------------------------------------------------------------
ALTER TABLE public.patron_photo_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patron_photo_reports_admin_select"
    ON public.patron_photo_reports
    FOR SELECT
    TO authenticated
    USING (public.is_td_admin(auth.uid()));

CREATE POLICY "patron_photo_reports_insert_authenticated"
    ON public.patron_photo_reports
    FOR INSERT
    TO authenticated
    WITH CHECK (
        reporter_user_id = auth.uid()
        AND status = 'pending'
        AND admin_notes IS NULL
        AND gallery_image_url IS NOT NULL
        AND trim(gallery_image_url) <> ''
        AND (
            gallery_photo_id IS NULL
            OR EXISTS (
                SELECT 1 FROM public.city_patron_gallery g
                WHERE g.id = gallery_photo_id
                  AND g.city_id = city_id
            )
        )
    );

CREATE POLICY "patron_photo_reports_admin_update"
    ON public.patron_photo_reports
    FOR UPDATE
    TO authenticated
    USING (public.is_td_admin(auth.uid()))
    WITH CHECK (public.is_td_admin(auth.uid()));

CREATE POLICY "patron_photo_reports_admin_delete"
    ON public.patron_photo_reports
    FOR DELETE
    TO authenticated
    USING (public.is_td_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- 10. GRANT (coerente con altre migration del repo)
-- ---------------------------------------------------------------------------
GRANT SELECT ON public.city_patron_gallery TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.city_patron_gallery TO authenticated;

GRANT SELECT, UPDATE, DELETE ON public.patron_photo_suggestions TO authenticated;

GRANT SELECT, UPDATE, DELETE ON public.patron_photo_suggestion_items TO authenticated;

GRANT INSERT ON public.patron_photo_reports TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.patron_photo_reports TO authenticated;

-- ---------------------------------------------------------------------------
-- 11. RPC — submit segnalazione (SECURITY DEFINER, unico write path utente)
-- Identità: auth.uid() + public.profiles.name (pattern add_community_reply).
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.submit_patron_photo_suggestion(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.submit_patron_photo_suggestion(TEXT, TEXT, TEXT, BOOLEAN, TEXT, JSONB);

CREATE OR REPLACE FUNCTION public.submit_patron_photo_suggestion(
    p_city_id TEXT,
    p_rights_confirmed BOOLEAN,
    p_notes TEXT DEFAULT NULL,
    p_items JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_suggestion_id UUID;
    v_item JSONB;
    v_sort INTEGER := 0;
    v_profile public.profiles%ROWTYPE;
    v_user_name TEXT;
    v_city_name TEXT;
    v_patron_name TEXT;
    v_storage_path TEXT;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Autenticazione richiesta.';
    END IF;

    IF p_rights_confirmed IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'Conferma sui diritti obbligatoria.';
    END IF;

    IF p_items IS NULL OR jsonb_array_length(p_items) < 1 THEN
        RAISE EXCEPTION 'Almeno una fotografia è obbligatoria.';
    END IF;

    SELECT
        trim(COALESCE(c.name, '')),
        trim(COALESCE(c.patron_details->>'name', ''))
    INTO v_city_name, v_patron_name
    FROM public.cities c
    WHERE c.id = p_city_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Città non valida.';
    END IF;

    IF v_city_name = '' THEN
        RAISE EXCEPTION 'Nome città non disponibile.';
    END IF;

    SELECT * INTO v_profile
    FROM public.profiles
    WHERE id = v_uid;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profilo utente non trovato.';
    END IF;

    v_user_name := trim(COALESCE(v_profile.name, ''));
    IF v_user_name = '' THEN
        RAISE EXCEPTION 'Nome profilo obbligatorio.';
    END IF;

    INSERT INTO public.patron_photo_suggestions (
        user_id, user_name, city_id, city_name, patron_name, notes,
        rights_confirmed, status, admin_notes
    )
    VALUES (
        v_uid,
        v_user_name,
        p_city_id,
        v_city_name,
        v_patron_name,
        NULLIF(trim(COALESCE(p_notes, '')), ''),
        true,
        'pending',
        NULL
    )
    RETURNING id INTO v_suggestion_id;

    FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
    LOOP
        IF COALESCE(trim(v_item->>'image_url'), '') = '' THEN
            RAISE EXCEPTION 'image_url mancante in item.';
        END IF;

        v_storage_path := trim(COALESCE(v_item->>'storage_path', ''));
        IF v_storage_path = '' THEN
            RAISE EXCEPTION 'storage_path mancante in item.';
        END IF;

        IF v_storage_path NOT LIKE ('patron_photo_suggestions/' || v_uid::text || '/%') THEN
            RAISE EXCEPTION 'storage_path non consentito.';
        END IF;

        INSERT INTO public.patron_photo_suggestion_items (
            suggestion_id, image_url, storage_path, sort_order, status
        )
        VALUES (
            v_suggestion_id,
            trim(v_item->>'image_url'),
            v_storage_path,
            COALESCE((v_item->>'sort_order')::INTEGER, v_sort),
            'pending'
        );

        v_sort := v_sort + 1;
    END LOOP;

    RETURN v_suggestion_id;
END;
$$;

COMMENT ON FUNCTION public.submit_patron_photo_suggestion(TEXT, BOOLEAN, TEXT, JSONB) IS
    'Invio segnalazione foto Patrono/Festa. Richiede p_rights_confirmed = true. user_name da profiles; city_name da cities.name; patron_name da cities.patron_details->>name; items con storage_path obbligatorio sotto patron_photo_suggestions/{uid}/.';

REVOKE ALL ON FUNCTION public.submit_patron_photo_suggestion(TEXT, BOOLEAN, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_patron_photo_suggestion(TEXT, BOOLEAN, TEXT, JSONB)
    TO authenticated;
REVOKE EXECUTE ON FUNCTION public.submit_patron_photo_suggestion(TEXT, BOOLEAN, TEXT, JSONB)
    FROM anon;

-- ---------------------------------------------------------------------------
-- 12. Storage — public-media (cartelle dedicate)
-- city_patron_gallery/{cityId}/  → upload admin (gallery ufficiale)
-- patron_photo_suggestions/{userId}/ → upload utente (segnalazioni)
-- Prerequisito: bucket `public-media` già esistente (non creato in repo).
-- ---------------------------------------------------------------------------

CREATE POLICY "public_media_patron_gallery_admin_insert"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'public-media'
        AND public.is_td_admin(auth.uid())
        AND name LIKE 'city_patron_gallery/%'
    );

CREATE POLICY "public_media_patron_suggestions_user_insert"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'public-media'
        AND auth.uid() IS NOT NULL
        AND name LIKE 'patron_photo_suggestions/%'
        AND (string_to_array(name, '/'))[2] = auth.uid()::text
    );

CREATE POLICY "public_media_patron_gallery_admin_delete"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'public-media'
        AND public.is_td_admin(auth.uid())
        AND (
            name LIKE 'city_patron_gallery/%'
            OR name LIKE 'patron_photo_suggestions/%'
        )
    );
