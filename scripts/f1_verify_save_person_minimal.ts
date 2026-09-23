/**
 * FASE 1 F1-5 — test minimo save person via RPC (service_role).
 * Mutativo: richiede F1_5_CONFIRM=1 e SUPABASE_SERVICE_ROLE_KEY.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import type { DatabaseCityPersonInsert } from '@/types/database';

/**
 * Client service_role operativo (allineato a `backfill` / `cleanup_orphan_storage`).
 * Tabelle MF5 (`entity_image_assignments`, `media_assets`) e RPC D90 non sono ancora in `Database` generato.
 */
function createF1ServiceClient(supabaseUrl: string, serviceRoleKey: string) {
  return createClient(supabaseUrl, serviceRoleKey);
}

type F1SupabaseClient = ReturnType<typeof createF1ServiceClient>;

config();

const PERSON_ID = 'cf74d735-4cbf-4b81-9ad0-124fab426304';
const CITY_ID = 'city_torre-annunziata';
const CONFIRM_ENV = 'F1_5_CONFIRM';

type AssignmentRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  city_id: string;
  assignment_role: string;
  is_current: boolean | null;
  assignment_status: string | null;
  media_asset_id: string | null;
};

/** Colonne lette da city_people per il payload D90 (contratto allineato a `saveCityPerson`). */
type F1PersonRow = DatabaseCityPersonInsert & {
  id: string;
  city_id: string;
  name: string;
  image_url: string | null;
};

type SaveCityPersonWithImageRpcArgs = {
  p_person: DatabaseCityPersonInsert;
  p_specific_category_ids: string[];
  p_image_url: string | null;
  p_storage_bucket: string | null;
  p_storage_path: string | null;
  p_origin_type: string;
};

function fail(message: string): never {
  console.error(`[F1-5] FAIL: ${message}`);
  process.exit(1);
}

function isF1PersonRow(value: unknown): value is F1PersonRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    typeof row.city_id === 'string' &&
    typeof row.name === 'string' &&
    (row.image_url === null || typeof row.image_url === 'string')
  );
}

function isAssignmentRow(value: unknown): value is AssignmentRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    typeof row.entity_type === 'string' &&
    typeof row.entity_id === 'string' &&
    typeof row.city_id === 'string' &&
    typeof row.assignment_role === 'string' &&
    (row.is_current === null || typeof row.is_current === 'boolean') &&
    (row.assignment_status === null || typeof row.assignment_status === 'string') &&
    (row.media_asset_id === null || typeof row.media_asset_id === 'string')
  );
}

function diagPrefix(): string {
  return `[personId=${PERSON_ID} cityId=${CITY_ID}]`;
}

async function loadPersonRow(sb: F1SupabaseClient): Promise<F1PersonRow> {
  const { data: row, error: loadErr } = await sb
    .from('city_people')
    .select(
      'id,city_id,name,bio,full_bio,quote,birth_year,birth_date,is_living,death_year,death_date,lifespan_display,famous_works,awards,private_life,related_places,career_stats,status,order_index,image_url',
    )
    .eq('id', PERSON_ID)
    .single();
  if (loadErr || !row) {
    fail(`${diagPrefix()} load person failed: ${loadErr?.message ?? 'no row'}`);
  }
  if (!isF1PersonRow(row)) {
    fail(`${diagPrefix()} load person: row shape non valida per F1-5`);
  }
  return row;
}

function buildSavePayload(row: F1PersonRow): DatabaseCityPersonInsert {
  return {
    id: row.id,
    city_id: row.city_id,
    name: row.name,
    bio: row.bio,
    full_bio: row.full_bio,
    image_url: null,
    quote: row.quote,
    birth_year: row.birth_year,
    birth_date: row.birth_date,
    is_living: row.is_living,
    death_year: row.death_year,
    death_date: row.death_date,
    lifespan_display: row.lifespan_display,
    famous_works: row.famous_works,
    awards: row.awards,
    private_life: row.private_life,
    related_places: row.related_places,
    career_stats: row.career_stats,
    status: row.status,
    order_index: row.order_index,
  };
}

async function runSaveRpc(
  sb: F1SupabaseClient,
  payload: DatabaseCityPersonInsert,
  imageUrl: string,
): Promise<void> {
  const rpcArgs: SaveCityPersonWithImageRpcArgs = {
    p_person: payload,
    p_specific_category_ids: [],
    p_image_url: imageUrl.length > 0 ? imageUrl : null,
    p_storage_bucket: null,
    p_storage_path: null,
    p_origin_type: 'admin',
  };
  const { data: savedId, error: rpcErr } = await sb.rpc(
    'save_city_person_with_image_assignment',
    rpcArgs,
  );

  if (rpcErr) {
    fail(`${diagPrefix()} RPC failed: ${rpcErr.message}`);
  }
  if (savedId !== PERSON_ID) {
    fail(`${diagPrefix()} savedId mismatch: got ${String(savedId)} expected ${PERSON_ID}`);
  }
}

async function fetchPrimaryCurrentAssignments(
  sb: F1SupabaseClient,
  cityId: string,
): Promise<AssignmentRow[]> {
  const { data: assignments, error: aErr } = await sb
    .from('entity_image_assignments')
    .select(
      'id,entity_type,entity_id,city_id,assignment_role,is_current,assignment_status,media_asset_id',
    )
    .eq('entity_type', 'city_person')
    .eq('entity_id', PERSON_ID)
    .eq('city_id', cityId)
    .eq('assignment_role', 'primary')
    .eq('is_current', true);

  if (aErr) {
    fail(`${diagPrefix()} assignment read failed: ${aErr.message}`);
  }
  const out: AssignmentRow[] = [];
  for (const raw of assignments ?? []) {
    if (isAssignmentRow(raw)) out.push(raw);
  }
  return out;
}

async function assertD90State(
  sb: F1SupabaseClient,
  cityId: string,
  expectImage: boolean,
  expectedPrimary?: { assignmentId: string; mediaAssetId: string },
): Promise<{ assignmentId: string; mediaAssetId: string } | null> {
  const person = await loadPersonRow(sb);
  if (person.city_id !== CITY_ID) {
    fail(
      `${diagPrefix()} city_id mismatch after save: row=${String(person.city_id)} expected=${CITY_ID}`,
    );
  }

  const legacyImage = (person.image_url as string | null)?.trim() ?? '';
  if (legacyImage.length > 0) {
    fail(
      `${diagPrefix()} city_people.image_url must be NULL after D90 save; got length=${legacyImage.length}`,
    );
  }

  const currentPrimaries = await fetchPrimaryCurrentAssignments(sb, cityId);
  if (currentPrimaries.length > 1) {
    fail(
      `${diagPrefix()} più di un primary is_current=true: count=${currentPrimaries.length} ids=${currentPrimaries.map((a) => a.id).join(',')}`,
    );
  }

  const activePrimaries = currentPrimaries.filter(
    (a) =>
      a.assignment_status === 'active' &&
      typeof a.media_asset_id === 'string' &&
      a.media_asset_id.length > 0,
  );

  const nonActiveCurrent = currentPrimaries.filter((a) => a.assignment_status !== 'active');
  if (nonActiveCurrent.length > 0 && expectImage) {
    fail(
      `${diagPrefix()} primary current non-active con immagine attesa: ${nonActiveCurrent.map((a) => `${a.id}:${a.assignment_status}`).join(',')}`,
    );
  }

  if (expectImage) {
    if (activePrimaries.length !== 1) {
      fail(
        `${diagPrefix()} expected exactly 1 active primary assignment with image; found active=${activePrimaries.length} current=${currentPrimaries.length}`,
      );
    }
    const assetId = activePrimaries[0].media_asset_id as string;
    const assignmentId = activePrimaries[0].id;
    const { data: asset, error: assetErr } = await sb
      .from('media_assets')
      .select('id')
      .eq('id', assetId)
      .maybeSingle();
    if (assetErr || !asset) {
      fail(`${diagPrefix()} media_asset missing for assignment ${assignmentId}: ${assetId}`);
    }

    if (expectedPrimary) {
      if (assignmentId !== expectedPrimary.assignmentId) {
        fail(
          `${diagPrefix()} idempotenza: assignment id changed ${expectedPrimary.assignmentId} → ${assignmentId}`,
        );
      }
      if (assetId !== expectedPrimary.mediaAssetId) {
        fail(
          `${diagPrefix()} idempotenza: media_asset_id changed ${expectedPrimary.mediaAssetId} → ${assetId}`,
        );
      }
    }

    return { assignmentId, mediaAssetId: assetId };
  }

  if (activePrimaries.length > 0) {
    fail(
      `${diagPrefix()} expected no active primary assignment without image; found ${activePrimaries.length}`,
    );
  }
  if (currentPrimaries.length > 0) {
    fail(
      `${diagPrefix()} expected no primary is_current=true without image; found ${currentPrimaries.length} (statuses: ${currentPrimaries.map((a) => a.assignment_status).join(',')})`,
    );
  }

  return null;
}

async function main(): Promise<void> {
  if (process.env[CONFIRM_ENV] !== '1') {
    console.error(
      `[F1-5] Test mutativo disabilitato. Imposta ${CONFIRM_ENV}=1 per eseguire save_city_person_with_image_assignment su DB reale.`,
    );
    process.exit(1);
  }

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    fail(`${diagPrefix()} Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY`);
  }

  const sb = createF1ServiceClient(url, key);

  const row = await loadPersonRow(sb);
  if (row.city_id !== CITY_ID) {
    fail(`${diagPrefix()} city_id mismatch: row=${String(row.city_id)} expected=${CITY_ID}`);
  }

  const imageUrl = (row.image_url as string | null)?.trim() ?? '';
  if (imageUrl.length === 0) {
    fail(
      `${diagPrefix()} F1-5 richiede una city_people.image_url utilizzabile sul record di test per esercitare il ramo D90 con immagine (p_image_url). Valorizzare l'immagine legacy o scegliere un'altra PERSON_ID — non si inventano URL.`,
    );
  }

  console.log(
    `[F1-5] ramo esercitato: save con immagine (p_image_url da legacy image_url, length=${imageUrl.length})`,
  );

  const payload = buildSavePayload(row);
  const expectImage = true;

  await runSaveRpc(sb, payload, imageUrl);
  const firstPrimary = await assertD90State(sb, row.city_id, expectImage);

  await runSaveRpc(sb, payload, imageUrl);
  const secondPrimary = await assertD90State(
    sb,
    row.city_id,
    expectImage,
    firstPrimary ?? undefined,
  );

  console.log(
    '[F1-5] OK — save person D90 verificato (legacy image_url null, assignment, idempotenza)',
    {
      personId: PERSON_ID,
      cityId: row.city_id,
      withImage: expectImage,
      primaryAssignmentId: secondPrimary?.assignmentId ?? firstPrimary?.assignmentId ?? null,
    },
  );
}

main().catch((e) => {
  console.error('[F1-5] FAIL:', e instanceof Error ? e.message : e);
  process.exit(1);
});
