-- ==========================================
-- WF-02 STEP-2 Fase 2.4 — RPC contratti, shop sync, city lifecycle (DOC 29 Fase 4)
-- Date: 2026-07-14
-- Closes: B4 (contratti), O6 (shop sync), O7/DL-022/DL-029 (city lifecycle), DL-023/DL-028/DL-034
-- Out of scope: messaggi B8 (Fase 2.5), audit O8 (Fase 2.6)
-- ==========================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Schema — city_id nullable + last_city_id (DL-022 / DL-029)
-- ---------------------------------------------------------------------------
ALTER TABLE public.sponsors
    ALTER COLUMN city_id DROP NOT NULL;

ALTER TABLE public.sponsors
    ADD COLUMN IF NOT EXISTS last_city_id text REFERENCES public.cities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sponsors_disconnected
    ON public.sponsors (status, city_id)
    WHERE status = 'approved' AND city_id IS NULL;

-- ---------------------------------------------------------------------------
-- 2. Helper — append partner_logs CRM (DL-023)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.append_sponsor_partner_log(
    p_sponsor_id uuid,
    p_message text,
    p_log_type text DEFAULT 'system'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_logs jsonb;
    v_entry jsonb;
BEGIN
    SELECT COALESCE(partner_logs::jsonb, '[]'::jsonb)
    INTO v_logs
    FROM public.sponsors
    WHERE id = p_sponsor_id;

    IF v_logs IS NULL THEN
        RAISE EXCEPTION 'Sponsor not found: %', p_sponsor_id;
    END IF;

    v_entry := jsonb_build_object(
        'id', gen_random_uuid()::text,
        'date', to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'type', COALESCE(NULLIF(btrim(p_log_type), ''), 'system'),
        'direction', 'outbound',
        'message', p_message
    );

    UPDATE public.sponsors
    SET partner_logs = (v_logs || v_entry)::json,
        updated_at = now()
    WHERE id = p_sponsor_id;
END;
$$;

REVOKE ALL ON FUNCTION public.append_sponsor_partner_log(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.append_sponsor_partner_log(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.append_sponsor_partner_log(uuid, text, text) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. cancel_sponsor_contract — admin_all only (O4 / DL-034)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_sponsor_contract(
    p_sponsor_id uuid,
    p_reason text
)
RETURNS public.sponsors
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_row public.sponsors;
    v_admin_label text;
BEGIN
    IF NOT public.is_service_role() THEN
        IF v_caller IS NULL OR NOT EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = v_caller AND role = 'admin_all'
        ) THEN
            RAISE EXCEPTION 'FORBIDDEN: admin_all privileges required'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    IF p_reason IS NULL OR btrim(p_reason) = '' THEN
        RAISE EXCEPTION 'Cancellation reason is required'
            USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_row FROM public.sponsors WHERE id = p_sponsor_id;
    IF v_row IS NULL THEN
        RAISE EXCEPTION 'Sponsor not found: %', p_sponsor_id;
    END IF;

    IF v_row.status IS DISTINCT FROM 'approved' THEN
        RAISE EXCEPTION 'Sponsor contract must be approved to cancel, got: %', v_row.status
            USING ERRCODE = 'P0001';
    END IF;

    SELECT COALESCE(p.email, p.id::text)
    INTO v_admin_label
    FROM public.profiles p
    WHERE p.id = v_caller;

    UPDATE public.sponsors
    SET status = 'cancelled',
        admin_notes = btrim(p_reason),
        admin_notes_last_updated = now(),
        updated_at = now()
    WHERE id = p_sponsor_id
    RETURNING * INTO v_row;

    UPDATE public.subscriptions
    SET status = 'cancelled',
        updated_at = now()
    WHERE sponsor_id = p_sponsor_id
      AND status = 'active';

    PERFORM public.append_sponsor_partner_log(
        p_sponsor_id,
        format(
            'Terminazione contratto da %s. Motivo: %s',
            COALESCE(v_admin_label, 'sistema'),
            btrim(p_reason)
        ),
        'system'
    );

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_sponsor_contract(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_sponsor_contract(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.cancel_sponsor_contract(uuid, text) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. extend_sponsor_contract — singola (O10 / DL-023)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.extend_sponsor_contract(
    p_sponsor_id uuid,
    p_new_end_date date,
    p_reason text
)
RETURNS public.sponsors
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_row public.sponsors;
    v_admin_label text;
    v_days integer;
BEGIN
    IF NOT public.is_service_role() THEN
        IF v_caller IS NULL OR NOT public.is_td_admin(v_caller) THEN
            RAISE EXCEPTION 'FORBIDDEN: admin privileges required'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    IF p_new_end_date IS NULL THEN
        RAISE EXCEPTION 'New end date is required'
            USING ERRCODE = 'P0001';
    END IF;

    IF p_reason IS NULL OR btrim(p_reason) = '' THEN
        RAISE EXCEPTION 'Extension reason is required'
            USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_row FROM public.sponsors WHERE id = p_sponsor_id;
    IF v_row IS NULL THEN
        RAISE EXCEPTION 'Sponsor not found: %', p_sponsor_id;
    END IF;

    IF v_row.status IS DISTINCT FROM 'approved' THEN
        RAISE EXCEPTION 'Sponsor contract must be approved to extend, got: %', v_row.status
            USING ERRCODE = 'P0001';
    END IF;

    IF v_row.end_date IS NOT NULL AND p_new_end_date <= v_row.end_date::date THEN
        RAISE EXCEPTION 'New end date must be after current end date'
            USING ERRCODE = 'P0001';
    END IF;

    v_days := (p_new_end_date - COALESCE(v_row.end_date::date, CURRENT_DATE));

    SELECT COALESCE(p.email, p.id::text)
    INTO v_admin_label
    FROM public.profiles p
    WHERE p.id = v_caller;

    UPDATE public.sponsors
    SET end_date = p_new_end_date,
        updated_at = now()
    WHERE id = p_sponsor_id
    RETURNING * INTO v_row;

    UPDATE public.subscriptions
    SET end_date = p_new_end_date,
        current_period_end = p_new_end_date,
        updated_at = now()
    WHERE sponsor_id = p_sponsor_id
      AND status = 'active';

    PERFORM public.append_sponsor_partner_log(
        p_sponsor_id,
        format(
            'Estensione contratto da %s: +%s giorni fino al %s. Motivo: %s',
            COALESCE(v_admin_label, 'sistema'),
            v_days,
            to_char(p_new_end_date, 'YYYY-MM-DD'),
            btrim(p_reason)
        ),
        'system'
    );

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.extend_sponsor_contract(uuid, date, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.extend_sponsor_contract(uuid, date, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.extend_sponsor_contract(uuid, date, text) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. extend_sponsors_bulk — massiva solo ids[] checkbox (DL-028 / DL-023)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.extend_sponsors_bulk(
    p_sponsor_ids uuid[],
    p_days integer,
    p_reason text,
    p_exclude_critical boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_admin_label text;
    v_id uuid;
    v_row public.sponsors;
    v_new_end date;
    v_count integer := 0;
    v_skipped integer := 0;
    v_shop_rating numeric;
BEGIN
    IF NOT public.is_service_role() THEN
        IF v_caller IS NULL OR NOT public.is_td_admin(v_caller) THEN
            RAISE EXCEPTION 'FORBIDDEN: admin privileges required'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    IF p_sponsor_ids IS NULL OR array_length(p_sponsor_ids, 1) IS NULL THEN
        RAISE EXCEPTION 'At least one sponsor id is required'
            USING ERRCODE = 'P0001';
    END IF;

    IF p_days IS NULL OR p_days <= 0 THEN
        RAISE EXCEPTION 'Days must be greater than zero'
            USING ERRCODE = 'P0001';
    END IF;

    IF p_reason IS NULL OR btrim(p_reason) = '' THEN
        RAISE EXCEPTION 'Extension reason is required'
            USING ERRCODE = 'P0001';
    END IF;

    SELECT COALESCE(p.email, p.id::text)
    INTO v_admin_label
    FROM public.profiles p
    WHERE p.id = v_caller;

    FOREACH v_id IN ARRAY p_sponsor_ids LOOP
        SELECT s.* INTO v_row
        FROM public.sponsors s
        WHERE s.id = v_id;

        IF v_row IS NULL OR v_row.status IS DISTINCT FROM 'approved' THEN
            v_skipped := v_skipped + 1;
            CONTINUE;
        END IF;

        IF p_exclude_critical AND v_row.shop_id IS NOT NULL THEN
            SELECT sh.rating INTO v_shop_rating
            FROM public.shops sh
            WHERE sh.id = v_row.shop_id;

            IF v_shop_rating IS NOT NULL AND v_shop_rating < 3 THEN
                v_skipped := v_skipped + 1;
                CONTINUE;
            END IF;
        END IF;

        v_new_end := (COALESCE(v_row.end_date::date, CURRENT_DATE) + (p_days || ' days')::interval)::date;

        UPDATE public.sponsors
        SET end_date = v_new_end,
            updated_at = now()
        WHERE id = v_id;

        UPDATE public.subscriptions
        SET end_date = v_new_end,
            current_period_end = v_new_end,
            updated_at = now()
        WHERE sponsor_id = v_id
          AND status = 'active';

        PERFORM public.append_sponsor_partner_log(
            v_id,
            format(
                'Estensione massiva da %s: +%s giorni fino al %s. Motivo: %s',
                COALESCE(v_admin_label, 'sistema'),
                p_days,
                to_char(v_new_end, 'YYYY-MM-DD'),
                btrim(p_reason)
            ),
            'system'
        );

        v_count := v_count + 1;
    END LOOP;

    RETURN jsonb_build_object('count', v_count, 'skipped', v_skipped);
END;
$$;

REVOKE ALL ON FUNCTION public.extend_sponsors_bulk(uuid[], integer, text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.extend_sponsors_bulk(uuid[], integer, text, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.extend_sponsors_bulk(uuid[], integer, text, boolean) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6. sync_sponsor_profile_from_shop — partner-scoped (O6)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_sponsor_profile_from_shop(
    p_shop_id uuid,
    p_refresh_subscription boolean DEFAULT false,
    p_subscription_tier text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller uuid := auth.uid();
    v_shop public.shops;
    v_sponsor_id uuid;
    v_start_date date := CURRENT_DATE;
    v_end_date date;
    v_tier text;
BEGIN
    IF NOT public.is_service_role() THEN
        IF v_caller IS NULL OR NOT public.can_manage_shop(p_shop_id) THEN
            RAISE EXCEPTION 'FORBIDDEN: shop management privileges required'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    SELECT * INTO v_shop FROM public.shops WHERE id = p_shop_id;
    IF v_shop IS NULL THEN
        RAISE EXCEPTION 'Shop not found: %', p_shop_id;
    END IF;

    SELECT s.id INTO v_sponsor_id
    FROM public.sponsors s
    WHERE s.shop_id = p_shop_id
    LIMIT 1;

    IF v_sponsor_id IS NULL AND v_shop.vat_number IS NOT NULL THEN
        SELECT s.id INTO v_sponsor_id
        FROM public.sponsors s
        WHERE s.vat_number = v_shop.vat_number
          AND (v_shop.owner_id IS NULL OR s.owner_id = v_shop.owner_id)
        ORDER BY s.created_at DESC
        LIMIT 1;
    END IF;

    IF v_sponsor_id IS NULL THEN
        RETURN;
    END IF;

    UPDATE public.sponsors
    SET company_name = v_shop.name,
        address = v_shop.address,
        owner_id = COALESCE(v_shop.owner_id, owner_id),
        shop_id = COALESCE(shop_id, p_shop_id),
        updated_at = now()
    WHERE id = v_sponsor_id;

    IF NOT p_refresh_subscription THEN
        RETURN;
    END IF;

    v_tier := COALESCE(NULLIF(btrim(p_subscription_tier), ''), 'standard');

    IF v_tier = 'premium' THEN
        v_end_date := (v_start_date + interval '1 year')::date;
    ELSE
        v_end_date := (v_start_date + interval '6 months')::date;
    END IF;

    UPDATE public.sponsors
    SET status = 'approved',
        start_date = v_start_date,
        end_date = v_end_date,
        updated_at = now()
    WHERE id = v_sponsor_id;

    UPDATE public.subscriptions
    SET start_date = v_start_date,
        end_date = v_end_date,
        current_period_start = v_start_date,
        current_period_end = v_end_date,
        status = 'active',
        updated_at = now()
    WHERE sponsor_id = v_sponsor_id
      AND status = 'active';
END;
$$;

REVOKE ALL ON FUNCTION public.sync_sponsor_profile_from_shop(uuid, boolean, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_sponsor_profile_from_shop(uuid, boolean, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.sync_sponsor_profile_from_shop(uuid, boolean, text) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 7. handle_city_deleted_for_sponsors — Da ricollegare, mai DELETE (DL-022)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_city_deleted_for_sponsors(
    p_city_id text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_count integer;
BEGIN
    UPDATE public.sponsors
    SET last_city_id = city_id,
        city_id = NULL,
        updated_at = now()
    WHERE city_id = p_city_id
      AND status = 'approved';

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_city_deleted_for_sponsors(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_city_deleted_for_sponsors(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.handle_city_deleted_for_sponsors(text) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 8. relink_orphaned_sponsors_to_city — ricreazione città (O7)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.relink_orphaned_sponsors_to_city(
    p_city_id text,
    p_city_name text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_count integer;
BEGIN
    IF p_city_name IS NULL OR btrim(p_city_name) = '' THEN
        RAISE EXCEPTION 'City name is required for relink matching'
            USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.sponsors
    SET city_id = p_city_id,
        last_city_id = NULL,
        updated_at = now()
    WHERE status = 'approved'
      AND city_id IS NULL
      AND (
          last_city_id = p_city_id
          OR address ILIKE '%' || p_city_name || '%'
      );

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.relink_orphaned_sponsors_to_city(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.relink_orphaned_sponsors_to_city(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.relink_orphaned_sponsors_to_city(text, text) TO authenticated, service_role;

COMMIT;
