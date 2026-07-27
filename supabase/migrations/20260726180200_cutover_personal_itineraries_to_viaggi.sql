-- WF-05 / MP-01 STEP-1 (M3)
-- Cutover idempotente: 1 Viaggio per ogni Diario personal senza viaggio_id.
-- Ordine obbligatorio (trigger trg_viaggi_active_diary_belongs):
--   (1) INSERT viaggi active_diary_id NULL
--   (2) UPDATE itineraries.viaggio_id
--   (3) UPDATE viaggi.active_diary_id

DO $$
DECLARE
  r RECORD;
  new_viaggio_id uuid;
  v_title text;
  v_start date;
  v_end date;
  v_destination text;
BEGIN
  FOR r IN
    SELECT
      i.id,
      i.user_id,
      i.title,
      i.cover_image,
      i.items_json,
      i.main_city
    FROM public.itineraries i
    WHERE i.type = 'personal'
      AND i.user_id IS NOT NULL
      AND i.viaggio_id IS NULL
  LOOP
    v_title := COALESCE(NULLIF(BTRIM(r.title), ''), 'Viaggio');
    v_destination := NULLIF(BTRIM(COALESCE(r.main_city, '')), '');

    v_start := NULL;
    v_end := NULL;
    BEGIN
      IF r.items_json IS NOT NULL
         AND jsonb_typeof(r.items_json::jsonb) = 'object'
         AND (r.items_json::jsonb ? 'startDate')
         AND NULLIF(BTRIM(r.items_json::jsonb->>'startDate'), '') IS NOT NULL THEN
        v_start := (r.items_json::jsonb->>'startDate')::date;
      END IF;
    EXCEPTION WHEN others THEN
      v_start := NULL;
    END;

    BEGIN
      IF r.items_json IS NOT NULL
         AND jsonb_typeof(r.items_json::jsonb) = 'object'
         AND (r.items_json::jsonb ? 'endDate')
         AND NULLIF(BTRIM(r.items_json::jsonb->>'endDate'), '') IS NOT NULL THEN
        v_end := (r.items_json::jsonb->>'endDate')::date;
      END IF;
    EXCEPTION WHEN others THEN
      v_end := NULL;
    END;

    -- Se periodo invertito, annulla le date sul Viaggio (CHECK viaggi_period_order_chk)
    IF v_start IS NOT NULL AND v_end IS NOT NULL AND v_end < v_start THEN
      v_start := NULL;
      v_end := NULL;
    END IF;

    INSERT INTO public.viaggi (
      user_id,
      title,
      destination,
      period_start,
      period_end,
      cover_image,
      active_diary_id,
      metadata
    )
    VALUES (
      r.user_id,
      v_title,
      v_destination,
      v_start,
      v_end,
      r.cover_image,
      NULL,
      '{}'::jsonb
    )
    RETURNING id INTO new_viaggio_id;

    UPDATE public.itineraries
    SET viaggio_id = new_viaggio_id
    WHERE id = r.id;

    UPDATE public.viaggi
    SET active_diary_id = r.id,
        updated_at = now()
    WHERE id = new_viaggio_id;
  END LOOP;
END $$;
