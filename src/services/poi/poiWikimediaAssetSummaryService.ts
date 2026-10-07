import {
  type ImageAssetStatusDb,
  type ImageVerificationStepOutcomeDb,
  isImageAssetStatusDb,
  isImageVerificationStepOutcomeDb,
  isPubliclyVisibleAssignmentStatus,
} from '@/constants/governance';
import {
  isAssetEligibleForPublicUse,
  wikimediaFunctionalStatusLabel,
} from '@/domain/media/imagePublicationPolicy';
import { loadLatestCanonicalVerificationRun } from '@/services/media/canonicalVerificationRun';
import { entityImageAssignmentsQuery } from '@/services/media/entityImageAssignmentsQuery';
import { mf3ImageVerificationStepsTable, mf3MediaAssetsTable } from '@/services/media/mf3DbClient';
import { buildPublicStorageUrl } from '@/utils/storagePathFromPublicUrl';

export type PoiWikimediaLinkedAsset = {
  assignmentId: string;
  assetId: string;
  assetStatus: ImageAssetStatusDb | null;
  rawAssetStatus: string;
  /**
   * Asset e assignment pubblicabili, con URL pubblico dello storage dell'asset.
   * Non usa lo snapshot né source_image_url. Senza il toggle pois.wikimedia_public_enabled.
   * Non è il risultato D-22.
   */
  publicUsable: boolean;
  previewUrl: string | null;
  sourceUrl: string | null;
  licenseCode: string | null;
  sourceRef: string | null;
  wikimediaValidated: boolean | null;
  adminBlocked: boolean;
  assignmentStatus: string;
  functionalStatus: string | null;
  overallOutcome: ImageVerificationStepOutcomeDb | null;
  aiSummary: string | null;
  reasons: string[];
};

export type PoiWikimediaAssetSummary = {
  linked: PoiWikimediaLinkedAsset | null;
  /** Altre righe di assignment Wikimedia correnti, oltre a quella mostrata. Non è un conteggio di asset distinti. */
  otherCurrentCount: number;
};

type AssignmentRow = {
  id: string;
  media_asset_id: string;
  assignment_status: string;
  source_image_url: string | null;
  source_storage_bucket: string | null;
  source_storage_path: string | null;
  updated_at: string;
};

type AssetRow = {
  id: string;
  asset_status: string;
  origin_type: string;
  license_code: string | null;
  source_url: string | null;
  source_ref: string | null;
  wikimedia_validated: boolean | null;
  admin_blocked: boolean;
  metadata: unknown;
  storage_bucket: string;
  storage_path: string;
};

function readBlockingReasons(metadata: unknown): string[] {
  if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) return [];
  const raw = Object.entries(metadata).find(([key]) => key === 'blocking_reasons')?.[1];
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/** Anteprima amministrativa. Un URL non vuoto non è da solo l'eleggibilità D-22. */
function previewUrlFor(assignment: AssignmentRow, asset: AssetRow): string | null {
  const fromAsset = buildPublicStorageUrl(asset.storage_bucket, asset.storage_path);
  if (fromAsset) return fromAsset;
  const snapshotBucket = assignment.source_storage_bucket?.trim() ?? '';
  const snapshotPath = assignment.source_storage_path?.trim() ?? '';
  const fromSnapshot =
    snapshotBucket && snapshotPath ? buildPublicStorageUrl(snapshotBucket, snapshotPath) : null;
  if (fromSnapshot) return fromSnapshot;
  const direct = assignment.source_image_url?.trim() ?? '';
  return direct || null;
}

/**
 * Assignment Wikimedia `is_current` già collegato al POI.
 * Gli import in quarantena senza assignment non sono recuperabili da qui.
 *
 * La riga mostrata è l'assignment Wikimedia corrente con `updated_at`
 * testuale più alto. Non è l'assignment pubblicabile del resolver D-22:
 * uno sospeso, non validato o senza URL può essere quello mostrato.
 * Il confronto non ha `ORDER BY` nella query. Il vincolo di un solo corrente
 * vale per `assignment_role = primary`. L'import POI forza `gallery`, e più
 * gallery correnti sono ammesse. Schema e audit non nominano la riga
 * principale e non definiscono uno spareggio: `id` e `created_at` non entrano
 * nell'ordine. A `updated_at` identico il vincitore non è deterministico:
 * resta quello dell'ordine di lettura, che non è stabilito.
 */
export async function loadPoiWikimediaAssetSummary(
  poiId: string,
  cityId: string,
): Promise<PoiWikimediaAssetSummary> {
  const trimmedPoi = poiId.trim();
  const trimmedCity = cityId.trim();
  if (!trimmedPoi || !trimmedCity) {
    return { linked: null, otherCurrentCount: 0 };
  }

  const { data: assignmentData, error: assignmentError } = await entityImageAssignmentsQuery()
    .select(
      'id, media_asset_id, assignment_status, source_image_url, source_storage_bucket, source_storage_path, updated_at',
    )
    .eq('entity_type', 'poi')
    .eq('entity_id', trimmedPoi)
    .eq('city_id', trimmedCity)
    .eq('is_current', true);

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  const assignments: AssignmentRow[] = assignmentData ?? [];
  if (assignments.length === 0) {
    return { linked: null, otherCurrentCount: 0 };
  }

  const assetIds = [...new Set(assignments.map((row) => row.media_asset_id).filter(Boolean))];
  const { data: assetData, error: assetError } = await mf3MediaAssetsTable()
    .select(
      'id, asset_status, origin_type, license_code, source_url, source_ref, wikimedia_validated, admin_blocked, metadata, storage_bucket, storage_path',
    )
    .in('id', assetIds)
    .eq('origin_type', 'wikimedia');

  if (assetError) {
    throw new Error(assetError.message);
  }

  const assets: AssetRow[] = assetData ?? [];
  const assetById = new Map(assets.map((asset) => [asset.id, asset]));
  const linkedAssignments = assignments
    .filter((row) => assetById.has(row.media_asset_id))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  const latest = linkedAssignments[0];
  if (!latest) {
    return { linked: null, otherCurrentCount: 0 };
  }

  const asset = assetById.get(latest.media_asset_id);
  if (!asset) {
    return { linked: null, otherCurrentCount: 0 };
  }

  const run = await loadLatestCanonicalVerificationRun(asset.id);

  const reasons = readBlockingReasons(asset.metadata);
  const runId = run?.id ?? null;
  if (runId && reasons.length === 0) {
    const { data: steps, error: stepsError } = await mf3ImageVerificationStepsTable()
      .select('outcome, ai_rationale, step_order')
      .eq('run_id', runId)
      .order('step_order', { ascending: true });
    if (stepsError) {
      throw new Error(stepsError.message);
    }
    for (const step of steps ?? []) {
      if (step.outcome !== 'blocked' && step.outcome !== 'unverified' && step.outcome !== 'doubt') {
        continue;
      }
      const rationale = step.ai_rationale?.trim() ?? '';
      if (rationale && !reasons.includes(rationale)) reasons.push(rationale);
    }
  }

  const rawStatus = String(asset.asset_status ?? '');
  const assetStatus = isImageAssetStatusDb(rawStatus) ? rawStatus : null;
  const assetPublicUrl = buildPublicStorageUrl(asset.storage_bucket, asset.storage_path);
  const previewUrl = previewUrlFor(latest, asset);
  const overallRaw = run?.overallOutcome ?? '';
  const overallOutcome = isImageVerificationStepOutcomeDb(overallRaw) ? overallRaw : null;
  const aiSummary = run?.aiSummary?.trim() ? run.aiSummary.trim() : null;

  return {
    linked: {
      assignmentId: latest.id,
      assetId: asset.id,
      assetStatus,
      rawAssetStatus: rawStatus,
      publicUsable:
        assetStatus != null &&
        isAssetEligibleForPublicUse({
          originType: asset.origin_type,
          assetStatus,
          wikimediaValidated:
            asset.wikimedia_validated === true
              ? true
              : asset.wikimedia_validated === false
                ? false
                : null,
          adminBlocked: asset.admin_blocked === true,
        }) &&
        isPubliclyVisibleAssignmentStatus(latest.assignment_status) &&
        assetPublicUrl != null,
      adminBlocked: asset.admin_blocked === true,
      assignmentStatus: latest.assignment_status,
      sourceRef: asset.source_ref?.trim() || null,
      wikimediaValidated:
        asset.wikimedia_validated === true
          ? true
          : asset.wikimedia_validated === false
            ? false
            : null,
      functionalStatus: wikimediaFunctionalStatusLabel({
        assetStatus,
        adminBlocked: asset.admin_blocked === true,
        wikimediaValidated:
          asset.wikimedia_validated === true
            ? true
            : asset.wikimedia_validated === false
              ? false
              : null,
      }),
      previewUrl,
      sourceUrl: asset.source_url?.trim() || null,
      licenseCode: asset.license_code?.trim() || null,
      overallOutcome,
      aiSummary,
      reasons,
    },
    otherCurrentCount: Math.max(0, linkedAssignments.length - 1),
  };
}
