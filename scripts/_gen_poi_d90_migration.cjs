/* One-off generator — POI D90 migration from person primary template. */
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const src = fs.readFileSync(
  path.join(root, 'supabase/migrations/20260922125900_upsert_entity_primary_image_assignment.sql'),
  'utf8',
);

let poi = src
  .replaceAll('upsert_entity_primary_image_assignment', 'upsert_poi_primary_image_assignment')
  .replace('p_entity_id uuid', 'p_entity_id text')
  .replaceAll("'city_person'", "'poi'")
  .replaceAll('p_entity_id::text', 'p_entity_id')
  .replaceAll('public.city_people cp', 'public.pois p')
  .replaceAll('cp.id = p_entity_id', 'p.id = p_entity_id')
  .replaceAll('cp.city_id = p_city_id', 'p.city_id = p_city_id')
  .replaceAll('cp.status', 'p.status')
  .replace('city_person non trovato', 'poi non trovato')
  .replace('primary per city_person', 'primary per poi')
  .replace(
    'SoT assignment definitivo (city_person primary)',
    'SoT assignment definitivo (poi primary)',
  );

poi = poi.replace(
  /REVOKE ALL ON FUNCTION public\.upsert_poi_primary_image_assignment\(\s*uuid, text,/,
  'REVOKE ALL ON FUNCTION public.upsert_poi_primary_image_assignment(\n  text, text,',
);
poi = poi.replace(
  /GRANT EXECUTE ON FUNCTION public\.upsert_poi_primary_image_assignment\(\s*uuid, text,/,
  'GRANT EXECUTE ON FUNCTION public.upsert_poi_primary_image_assignment(\n  text, text,',
);

const savePoi = `-- POST-MF5 / D90 — atomicità save pois + primary image assignment (single transaction)

CREATE OR REPLACE FUNCTION public.save_poi_with_image_assignment(
  p_poi jsonb,
  p_image_url text DEFAULT NULL,
  p_storage_bucket text DEFAULT NULL,
  p_storage_path text DEFAULT NULL,
  p_origin_type text DEFAULT 'admin'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_poi_id text;
  v_city_id text;
  v_url text;
  v_bucket text;
  v_path text;
  v_poi_payload jsonb;
  v_uid uuid;
  v_lock_key bigint;
  v_current_primary public.entity_image_assignments%ROWTYPE;
  v_existing public.pois%ROWTYPE;
BEGIN
  v_uid := auth.uid();
  IF NOT public.is_service_role() THEN
    IF v_uid IS NULL THEN
      RAISE EXCEPTION 'Autenticazione richiesta.';
    END IF;
    IF NOT public.is_td_admin(v_uid) THEN
      RAISE EXCEPTION 'Permessi admin richiesti.';
    END IF;
  END IF;

  IF p_poi IS NULL OR jsonb_typeof(p_poi) <> 'object' THEN
    RAISE EXCEPTION 'Payload POI non valido.';
  END IF;

  IF p_poi->>'id' IS NULL OR trim(p_poi->>'id') = '' THEN
    RAISE EXCEPTION 'POI id obbligatorio.';
  END IF;

  IF p_poi->>'city_id' IS NULL OR trim(p_poi->>'city_id') = '' THEN
    RAISE EXCEPTION 'city_id obbligatorio.';
  END IF;

  v_poi_id := trim(p_poi->>'id');
  v_city_id := trim(p_poi->>'city_id');

  v_poi_payload := jsonb_set(p_poi, '{image_url}', 'null'::jsonb, true);

  SELECT * INTO v_existing
  FROM public.pois p
  WHERE p.id = v_poi_id
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing.city_id IS DISTINCT FROM v_city_id THEN
      RAISE EXCEPTION
        'city_id del payload (%) non corrisponde alla città del POI (%); spostamento tra città non consentito.',
        v_city_id,
        v_existing.city_id;
    END IF;
  END IF;

  INSERT INTO public.pois (
    id, city_id, name, category, sub_category, description, address,
    image_url, image_status, image_credit, image_license,
    coords_lat, coords_lng, rating, votes, status,
    visit_duration, price_level, is_sponsored, tier, showcase_expiry,
    ai_reliability, tourism_interest, last_verified,
    opening_hours, affiliate, link_metadata,
    date_added, created_at, created_by, updated_at, updated_by
  )
  VALUES (
    v_poi_id,
    v_city_id,
    COALESCE(NULLIF(trim(v_poi_payload->>'name'), ''), 'Senza Nome'),
    COALESCE(NULLIF(trim(v_poi_payload->>'category'), ''), 'discovery'),
    NULLIF(v_poi_payload->>'sub_category', ''),
    COALESCE(v_poi_payload->>'description', ''),
    NULLIF(v_poi_payload->>'address', ''),
    NULL,
    COALESCE(NULLIF(trim(v_poi_payload->>'image_status'), ''), 'real')::public.media_status,
    NULLIF(v_poi_payload->>'image_credit', ''),
    NULLIF(v_poi_payload->>'image_license', '')::public.image_license,
    COALESCE((v_poi_payload->>'coords_lat')::double precision, 0),
    COALESCE((v_poi_payload->>'coords_lng')::double precision, 0),
    COALESCE((v_poi_payload->>'rating')::numeric, 0),
    COALESCE((v_poi_payload->>'votes')::integer, 0),
    COALESCE(NULLIF(trim(v_poi_payload->>'status'), ''), 'published'),
    NULLIF(v_poi_payload->>'visit_duration', ''),
    NULLIF(v_poi_payload->>'price_level', '')::integer,
    COALESCE((v_poi_payload->>'is_sponsored')::boolean, false),
    NULLIF(v_poi_payload->>'tier', ''),
    NULLIF(v_poi_payload->>'showcase_expiry', ''),
    NULLIF(v_poi_payload->>'ai_reliability', ''),
    NULLIF(v_poi_payload->>'tourism_interest', ''),
    NULLIF(v_poi_payload->>'last_verified', '')::timestamptz,
    COALESCE(v_poi_payload->'opening_hours', 'null'::jsonb),
    COALESCE(v_poi_payload->'affiliate', 'null'::jsonb),
    COALESCE(v_poi_payload->'link_metadata', 'null'::jsonb),
    COALESCE((v_poi_payload->>'date_added')::date, CURRENT_DATE),
    COALESCE((v_poi_payload->>'created_at')::timestamptz, now()),
    COALESCE(NULLIF(trim(v_poi_payload->>'created_by'), ''), 'Sistema'),
    COALESCE((v_poi_payload->>'updated_at')::timestamptz, now()),
    COALESCE(NULLIF(trim(v_poi_payload->>'updated_by'), ''), 'Sistema')
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    sub_category = EXCLUDED.sub_category,
    description = EXCLUDED.description,
    address = EXCLUDED.address,
    image_url = NULL,
    image_status = EXCLUDED.image_status,
    image_credit = EXCLUDED.image_credit,
    image_license = EXCLUDED.image_license,
    coords_lat = EXCLUDED.coords_lat,
    coords_lng = EXCLUDED.coords_lng,
    rating = EXCLUDED.rating,
    votes = EXCLUDED.votes,
    status = EXCLUDED.status,
    visit_duration = EXCLUDED.visit_duration,
    price_level = EXCLUDED.price_level,
    is_sponsored = EXCLUDED.is_sponsored,
    tier = EXCLUDED.tier,
    showcase_expiry = EXCLUDED.showcase_expiry,
    ai_reliability = EXCLUDED.ai_reliability,
    tourism_interest = EXCLUDED.tourism_interest,
    last_verified = EXCLUDED.last_verified,
    opening_hours = EXCLUDED.opening_hours,
    affiliate = EXCLUDED.affiliate,
    link_metadata = EXCLUDED.link_metadata,
    date_added = EXCLUDED.date_added,
    updated_at = EXCLUDED.updated_at,
    updated_by = EXCLUDED.updated_by;

  v_url := NULLIF(trim(p_image_url), '');
  v_bucket := NULLIF(trim(p_storage_bucket), '');
  v_path := NULLIF(trim(p_storage_path), '');

  IF v_url IS NULL AND v_path IS NULL THEN
    v_lock_key := hashtextextended(
      'poi' || E'\\x1f' || v_poi_id || E'\\x1f' || v_city_id || E'\\x1f' || 'primary',
      0
    );
    PERFORM pg_advisory_xact_lock(v_lock_key);

    SELECT * INTO v_current_primary
    FROM public.entity_image_assignments eia
    WHERE eia.entity_type = 'poi'
      AND eia.entity_id = v_poi_id
      AND eia.city_id = v_city_id
      AND eia.assignment_role = 'primary'
      AND eia.is_current = true
      AND eia.assignment_status = 'active'
    LIMIT 1
    FOR UPDATE;

    IF FOUND THEN
      UPDATE public.entity_image_assignments
      SET
        assignment_status = 'removed',
        is_current = false,
        removed_at = now(),
        updated_at = now()
      WHERE id = v_current_primary.id;

      PERFORM public.append_entity_image_history_trusted(
        'assignment_status_changed',
        v_current_primary.media_asset_id,
        v_current_primary.id,
        'poi',
        v_poi_id,
        v_city_id,
        'active',
        'removed',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        false,
        jsonb_build_object(
          'assignment_role', 'primary',
          'source', 'save_poi_with_image_assignment',
          'reason', 'image_cleared_on_save'
        )
      );
    END IF;
  ELSE
    PERFORM public.upsert_poi_primary_image_assignment(
      v_poi_id,
      v_city_id,
      v_url,
      v_bucket,
      v_path,
      COALESCE(NULLIF(trim(p_origin_type), ''), 'admin')
    );
  END IF;

  RETURN v_poi_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_poi_with_image_assignment(
  jsonb, text, text, text, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_poi_with_image_assignment(
  jsonb, text, text, text, text
) TO authenticated;

COMMENT ON FUNCTION public.save_poi_with_image_assignment IS
  'POST-MF5 D90 — upsert pois (image_url null) + primary assignment/revoke in una transazione.';
`;

const deletePoi = `-- POST-MF5 / D90 — revoca assignment + history + DELETE poi (single transaction)

CREATE OR REPLACE FUNCTION public.delete_poi_with_image_cleanup(
  p_poi_id text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid;
  v_poi_id text;
  v_city_id text;
  v_row public.entity_image_assignments%ROWTYPE;
BEGIN
  v_uid := auth.uid();
  IF NOT public.is_service_role() THEN
    IF v_uid IS NULL THEN
      RAISE EXCEPTION 'Autenticazione richiesta.';
    END IF;
    IF NOT public.is_td_admin(v_uid) THEN
      RAISE EXCEPTION 'Permessi admin richiesti.';
    END IF;
  END IF;

  v_poi_id := NULLIF(trim(p_poi_id), '');
  IF v_poi_id IS NULL THEN
    RAISE EXCEPTION 'POI id obbligatorio.';
  END IF;

  SELECT p.city_id INTO v_city_id
  FROM public.pois p
  WHERE p.id = v_poi_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'POI non trovato: %', v_poi_id;
  END IF;

  FOR v_row IN
    SELECT eia.*
    FROM public.entity_image_assignments eia
    WHERE eia.entity_type = 'poi'
      AND eia.entity_id = v_poi_id
      AND eia.city_id = v_city_id
      AND eia.is_current = true
      AND eia.assignment_status = 'active'
    FOR UPDATE
  LOOP
    UPDATE public.entity_image_assignments
    SET
      assignment_status = 'removed',
      is_current = false,
      removed_at = now(),
      updated_at = now()
    WHERE id = v_row.id;

    PERFORM public.append_entity_image_history_trusted(
      'assignment_status_changed',
      v_row.media_asset_id,
      v_row.id,
      'poi',
      v_poi_id,
      v_city_id,
      'active',
      'removed',
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      false,
      jsonb_build_object(
        'assignment_role', v_row.assignment_role,
        'source', 'delete_poi_with_image_cleanup',
        'reason', 'poi_deleted'
      )
    );
  END LOOP;

  DELETE FROM public.pois WHERE id = v_poi_id;

  RETURN v_city_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_poi_with_image_cleanup(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_poi_with_image_cleanup(text) TO authenticated;

COMMENT ON FUNCTION public.delete_poi_with_image_cleanup IS
  'POST-MF5 D90 — revoca assignment correnti attive + DELETE poi; non DELETE media_assets condivisi.';
`;

const header = `-- POST-MF5 / D90 — POI primary assignment + atomic save/delete (FASE 1 DEC-P10)
-- Variante POI del pattern 20260922125900 / 20260922130000 (city_person).

`;

function assertGeneratedMigration(poiSql, saveSql, deleteSql) {
  const combined = `${poiSql}\n${saveSql}\n${deleteSql}`;

  const requiredSubstrings = [
    ['upsert_poi_primary_image_assignment', 'funzione upsert POI primary'],
    ["entity_type = 'poi'", 'entity_type poi'],
    ['FROM public.pois', 'tabella public.pois'],
    ['p_entity_id text', 'parametro p_entity_id text'],
    ['save_poi_with_image_assignment', 'funzione save POI D90'],
    ['delete_poi_with_image_cleanup', 'funzione delete POI D90'],
    ['v_existing.city_id IS DISTINCT FROM v_city_id', 'controllo city_id POI (save D90)'],
    ['spostamento tra città non consentito', 'messaggio city_id mismatch'],
  ];
  for (const [needle, label] of requiredSubstrings) {
    if (!combined.includes(needle)) {
      throw new Error(`Generazione migration incompleta: manca ${label} (${needle})`);
    }
  }

  const signatureChecks = [
    [
      /CREATE OR REPLACE FUNCTION public\.upsert_poi_primary_image_assignment\s*\(\s*\n?\s*p_entity_id text,\s*\n?\s*p_city_id text/m,
      'firma upsert_poi_primary_image_assignment (p_entity_id text, p_city_id text, …)',
    ],
    [
      /CREATE OR REPLACE FUNCTION public\.save_poi_with_image_assignment\s*\(\s*\n?\s*p_poi jsonb,\s*\n?\s*p_image_url text/m,
      'firma save_poi_with_image_assignment (p_poi jsonb, p_image_url text, …)',
    ],
    [
      /CREATE OR REPLACE FUNCTION public\.delete_poi_with_image_cleanup\s*\(\s*\n?\s*p_poi_id text\s*\)/m,
      'firma delete_poi_with_image_cleanup (p_poi_id text)',
    ],
  ];
  for (const [pattern, label] of signatureChecks) {
    if (!pattern.test(combined)) {
      throw new Error(`Generazione migration incompleta: ${label}`);
    }
  }

  const forbiddenSubstrings = [
    [
      'upsert_entity_primary_image_assignment',
      'vecchia funzione upsert_entity_primary_image_assignment',
    ],
    ['public.city_people', 'tabella public.city_people'],
    ["entity_type = 'city_person'", "entity_type 'city_person'"],
  ];
  for (const [needle, label] of forbiddenSubstrings) {
    if (combined.includes(needle)) {
      throw new Error(`Generazione migration incompleta: residuo ${label}`);
    }
  }

  const forbiddenPatterns = [
    [/\bcp\./, 'alias cp (atteso alias p su public.pois)'],
    [/'city_person'\s*\|\|\s*E'\\x1f'/, "lock key advisory con prefisso 'city_person'"],
  ];
  for (const [pattern, label] of forbiddenPatterns) {
    if (pattern.test(combined)) {
      throw new Error(`Generazione migration incompleta: ${label}`);
    }
  }

  const structuralPatterns = [
    [/'poi'\s*\|\|\s*E'\\x1f'/, 'advisory lock key con entity_type poi'],
    [/\bp\.id\s*=\s*p_entity_id/, 'join pois p.id = p_entity_id'],
    [/\bp\.city_id\s*=\s*p_city_id/, 'join pois p.city_id = p_city_id'],
    [/SELECT 1 FROM public\.pois p/, 'exists check su public.pois'],
  ];
  for (const [pattern, label] of structuralPatterns) {
    if (!pattern.test(combined)) {
      throw new Error(`Generazione migration incompleta: manca ${label}`);
    }
  }
}

const outPath = path.join(
  root,
  'supabase/migrations/20260923153000_poi_d90_save_with_image_assignment.sql',
);
assertGeneratedMigration(poi, savePoi, deletePoi);
fs.writeFileSync(outPath, `${header}${poi}\n\n${savePoi}\n\n${deletePoi}`);
console.log('Wrote', outPath);
