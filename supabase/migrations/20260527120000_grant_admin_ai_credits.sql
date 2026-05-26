-- ==========================================
-- FASE 2 — STEP B: grant_admin_ai_credits
-- Date: 2026-05-27
-- Purpose: Secure admin wallet credit grants via SECURITY DEFINER RPC.
-- Prerequisite: public.is_td_admin(uuid) must exist (remote SSOT).
-- Does NOT alter consume_ai_credits, Stripe flow, pricing, or analytics RPCs.
-- ==========================================

BEGIN;

CREATE OR REPLACE FUNCTION public.grant_admin_ai_credits(
    p_user_id uuid,
    p_flash_credits integer,
    p_pro_credits integer DEFAULT 0,
    p_expires_at timestamptz DEFAULT NULL,
    p_reason text DEFAULT 'manual_admin_grant'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_admin_id uuid := auth.uid();
    v_grant_id uuid;
    v_wallet_id uuid;
    v_expires_at timestamptz;
    v_credit_type text;
    v_total_amount integer;
BEGIN
    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'NOT_AUTHENTICATED'
            USING ERRCODE = '42501';
    END IF;

    IF NOT public.is_td_admin(v_admin_id) THEN
        RAISE EXCEPTION 'FORBIDDEN: admin privileges required'
            USING ERRCODE = '42501';
    END IF;

    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'INVALID_INPUT: p_user_id is required'
            USING ERRCODE = '22023';
    END IF;

    IF p_flash_credits IS NULL OR p_pro_credits IS NULL THEN
        RAISE EXCEPTION 'INVALID_INPUT: credit amounts cannot be null'
            USING ERRCODE = '22023';
    END IF;

    IF p_flash_credits < 0 OR p_pro_credits < 0 THEN
        RAISE EXCEPTION 'INVALID_INPUT: credit amounts must be non-negative'
            USING ERRCODE = '22023';
    END IF;

    v_total_amount := p_flash_credits + p_pro_credits;

    IF v_total_amount <= 0 THEN
        RAISE EXCEPTION 'INVALID_INPUT: at least one credit must be granted'
            USING ERRCODE = '22023';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = p_user_id
    ) THEN
        RAISE EXCEPTION 'USER_NOT_FOUND: %', p_user_id
            USING ERRCODE = 'P0002';
    END IF;

    v_expires_at := COALESCE(p_expires_at, now() + interval '365 days');

    IF p_flash_credits > 0 AND p_pro_credits > 0 THEN
        v_credit_type := 'mixed';
    ELSIF p_pro_credits > 0 THEN
        v_credit_type := 'pro';
    ELSE
        v_credit_type := 'flash';
    END IF;

    INSERT INTO public.admin_credit_grants (
        admin_id,
        user_id,
        amount,
        credit_type,
        reason,
        source,
        expires_at
    )
    VALUES (
        v_admin_id,
        p_user_id,
        v_total_amount,
        v_credit_type,
        COALESCE(NULLIF(btrim(p_reason), ''), 'manual_admin_grant'),
        'manual_adjustment',
        v_expires_at
    )
    RETURNING id INTO v_grant_id;

    INSERT INTO public.user_ai_credits (
        user_id,
        flash_remaining,
        pro_remaining,
        expires_at,
        source,
        metadata
    )
    VALUES (
        p_user_id,
        p_flash_credits,
        p_pro_credits,
        v_expires_at,
        'bonus'::public.ai_credit_source,
        jsonb_build_object(
            'granted_by', v_admin_id,
            'reason', COALESCE(NULLIF(btrim(p_reason), ''), 'manual_admin_grant'),
            'grant_type', 'admin',
            'admin_credit_grant_id', v_grant_id
        )
    )
    RETURNING id INTO v_wallet_id;

    RETURN json_build_object(
        'success', true,
        'grant_id', v_grant_id,
        'wallet_id', v_wallet_id,
        'user_id', p_user_id,
        'flash_credits', p_flash_credits,
        'pro_credits', p_pro_credits,
        'expires_at', v_expires_at
    );
END;
$$;

REVOKE ALL ON FUNCTION public.grant_admin_ai_credits(
    uuid,
    integer,
    integer,
    timestamptz,
    text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.grant_admin_ai_credits(
    uuid,
    integer,
    integer,
    timestamptz,
    text
) TO authenticated;

COMMIT;
