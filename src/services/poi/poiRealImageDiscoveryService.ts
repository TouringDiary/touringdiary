import { isAssignmentStatusDb, parseImageAssetStatusDb } from '@/constants/governance';
import {
  type PoiImageD22Context,
  poiHasHigherPriorityThanWikimedia,
} from '@/domain/poi/poiImageD22Resolver';
import { entityImageAssignmentsQuery } from '@/services/media/entityImageAssignmentsQuery';
import {
  fetchMediaAssetsByIds,
  mediaAssetOriginForImageResolver,
} from '@/services/media/mediaAssetService';
import { supabase } from '@/services/supabaseClient';
import {
  asCommonsDownloadImported,
  buildCommonsFileDescriptionPageUrl,
  type CommonsDownloadPipelineResult,
  runCommonsDownloadPipeline,
} from '@/services/wikimedia/commonsDownloadPipeline';
import { parseCommonsLicenseMetadata } from '@/services/wikimedia/commonsLicenseParser';
import {
  rankWikimediaProposals,
  type WikimediaProposalPreview,
} from '@/services/wikimedia/rankWikimediaProposals';
import {
  fetchCommonsExtMetadata,
  lookupWikidataP18Proposal,
  WIKIDATA_MATCH_MIN_SCORE,
  type WikidataCandidate,
  type WikidataLookupResult,
  type WikidataP18Proposal,
} from '@/services/wikimedia/wikidataLookupService';
import { buildPublicStorageUrl } from '@/utils/storagePathFromPublicUrl';

export type PoiDiscoveryActivation = 'on_create' | 'mass_import' | 'bonifica' | 'manual_api';

export type PoiDiscoveryOptions = {
  activation: PoiDiscoveryActivation;
  skipIfHigherPriorityPrimary?: boolean;
  cityName?: string | null;
};

export type PoiDiscoveryResult =
  | { status: 'skipped'; reason: string }
  | { status: 'lookup'; lookup: WikidataLookupResult }
  | { status: 'imported'; message: string; mediaAssetId?: string }
  | { status: 'failed'; stage: string; message: string };

type PoiRow = {
  id: string;
  city_id: string;
  name: string;
  description: string | null;
  wikimedia_public_enabled: boolean | null;
  category: string | null;
};

const ALLOWED_ACTIVATIONS = new Set<PoiDiscoveryActivation>([
  'on_create',
  'mass_import',
  'bonifica',
  'manual_api',
]);

async function loadPoiRow(poiId: string, cityId: string): Promise<PoiRow | null> {
  const { data, error } = await supabase
    .from('pois')
    .select('id, city_id, name, description, wikimedia_public_enabled, category')
    .eq('id', poiId)
    .eq('city_id', cityId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.id || !data.city_id) return null;
  return {
    id: data.id,
    city_id: data.city_id,
    name: data.name,
    description: data.description,
    wikimedia_public_enabled: data.wikimedia_public_enabled,
    category: data.category,
  };
}

async function poiHasCurrentWikimediaAssignment(poiId: string, cityId: string): Promise<boolean> {
  const { data, error } = await entityImageAssignmentsQuery()
    .select('media_asset_id')
    .eq('entity_type', 'poi')
    .eq('entity_id', poiId)
    .eq('city_id', cityId)
    .eq('is_current', true)
    .in('assignment_status', ['active', 'restored']);
  if (error) throw new Error(error.message);
  const ids = (data ?? [])
    .map((row) => (typeof row.media_asset_id === 'string' ? row.media_asset_id.trim() : ''))
    .filter((id) => id.length > 0);
  const assets = await fetchMediaAssetsByIds(ids);
  for (const asset of assets.values()) {
    if (asset.origin_type === 'wikimedia') return true;
  }
  return false;
}

async function buildD22GuardContext(
  poiId: string,
  cityId: string,
  poiRow: PoiRow,
): Promise<PoiImageD22Context> {
  const { data, error } = await entityImageAssignmentsQuery()
    .select('media_asset_id, assignment_role, assignment_status, created_at, entity_id, city_id')
    .eq('entity_type', 'poi')
    .eq('entity_id', poiId)
    .eq('city_id', cityId)
    .eq('is_current', true)
    .in('assignment_status', ['active', 'restored'])
    .in('assignment_role', ['primary', 'gallery']);

  if (error) throw new Error(error.message);

  const guardRows = data ?? [];
  const assetIds = [...new Set(guardRows.map((r) => r.media_asset_id.trim()))].filter(Boolean);
  const assets = await fetchMediaAssetsByIds(assetIds);

  const assignments: PoiImageD22Context['assignments'] = [];
  for (const row of guardRows) {
    const mediaAssetId = row.media_asset_id.trim();
    if (!mediaAssetId) continue;
    const asset = assets.get(mediaAssetId);
    if (!asset) continue;
    const originType = mediaAssetOriginForImageResolver(asset.origin_type);
    if (!originType) continue;
    const bucket = asset.storage_bucket.trim();
    const path = asset.storage_path.trim();
    if (!isAssignmentStatusDb(row.assignment_status)) continue;
    let assetStatus: PoiImageD22Context['assignments'][number]['assetStatus'];
    try {
      assetStatus = parseImageAssetStatusDb(asset.asset_status);
    } catch {
      continue;
    }
    const assignmentRole =
      row.assignment_role === 'gallery'
        ? 'gallery'
        : row.assignment_role === 'primary'
          ? 'primary'
          : null;
    if (!assignmentRole) continue;
    assignments.push({
      assignmentRole,
      isCurrent: true,
      assignmentStatus: row.assignment_status,
      originType,
      assetStatus,
      wikimediaValidated: asset.wikimedia_validated,
      adminBlocked: asset.admin_blocked,
      publicUrl: bucket && path ? buildPublicStorageUrl(bucket, path) : null,
      createdAt: row.created_at,
      stableId: mediaAssetId,
    });
  }

  const category = poiRow.category?.trim() ?? '';
  return {
    wikimediaPublicEnabled: poiRow.wikimedia_public_enabled === true,
    category,
    assignments,
  };
}

function canAutoImportFromLookup(lookup: WikidataLookupResult): lookup is {
  status: 'proposal';
  proposal: NonNullable<Extract<WikidataLookupResult, { status: 'proposal' }>['proposal']>;
} {
  return (
    lookup.status === 'proposal' &&
    lookup.proposal.confidence !== 'low' &&
    lookup.proposal.requiresAdminConfirm === false
  );
}

/**
 * Orchestratore unico Wikimedia POI (§38). Fail-closed; auto = gallery staged, non primary pubblica.
 */
export async function discoverForPoi(
  poiId: string,
  cityId: string,
  options: PoiDiscoveryOptions,
): Promise<PoiDiscoveryResult> {
  if (!ALLOWED_ACTIVATIONS.has(options.activation)) {
    return { status: 'skipped', reason: 'activation non consentita' };
  }

  const trimmedPoiId = poiId.trim();
  const trimmedCityId = cityId.trim();
  if (!trimmedPoiId || !trimmedCityId) {
    return { status: 'failed', stage: 'input', message: 'poiId/cityId obbligatori.' };
  }

  const poi = await loadPoiRow(trimmedPoiId, trimmedCityId);
  if (!poi) {
    return { status: 'failed', stage: 'poi', message: 'POI non trovato.' };
  }

  if (
    options.activation === 'on_create' &&
    (await poiHasCurrentWikimediaAssignment(trimmedPoiId, trimmedCityId))
  ) {
    return {
      status: 'skipped',
      reason: 'Il POI ha già una foto Wikimedia corrente. Il salvataggio non rilancia l’import.',
    };
  }

  const lookup = await lookupWikidataP18Proposal({
    label: poi.name,
    description: poi.description,
    cityName: options.cityName ?? null,
  });

  if (options.activation === 'manual_api') {
    return { status: 'lookup', lookup };
  }

  if (options.skipIfHigherPriorityPrimary !== false) {
    const guardContext = await buildD22GuardContext(trimmedPoiId, trimmedCityId, poi);
    if (poiHasHigherPriorityThanWikimedia(guardContext)) {
      return {
        status: 'skipped',
        reason: 'Immagine esistente con priorità superiore a Wikimedia (D-22).',
      };
    }
  }

  if (lookup.status !== 'proposal') {
    return { status: 'lookup', lookup };
  }

  if (!canAutoImportFromLookup(lookup)) {
    return { status: 'lookup', lookup };
  }

  const pipeline = await runCommonsDownloadPipeline({
    proposal: lookup.proposal,
    autoValidatedProposal: true,
    entity: { entityType: 'poi', entityId: trimmedPoiId, cityId: trimmedCityId },
    assignToEntity: true,
    assignmentRole: 'gallery',
  });

  const imported = asCommonsDownloadImported(pipeline);
  if ('failed' in imported) {
    return { status: 'failed', stage: imported.failed.stage, message: imported.failed.message };
  }

  return {
    status: 'imported',
    message: imported.message,
    mediaAssetId: imported.mediaAssetId,
  };
}

export function schedulePoiRealImageDiscovery(
  poiId: string,
  cityId: string,
  activation: Exclude<PoiDiscoveryActivation, 'manual_api'>,
  cityName?: string | null,
): void {
  void discoverForPoi(poiId, cityId, {
    activation,
    skipIfHigherPriorityPrimary: true,
    cityName,
  }).catch((err) => {
    console.error('[poiRealImageDiscoveryService]', activation, poiId, err);
  });
}

export type RankedWikimediaManualCandidate = {
  candidate: WikidataCandidate;
  lookup: WikidataLookupResult;
  isBest: boolean;
  validityNote: string;
};

export type WikimediaManualDiscoveryResult = {
  poiName: string;
  proposals: WikimediaProposalPreview[];
  error?: string;
};

function isHardBlockedLicense(blockingReasons: string[]): boolean {
  return blockingReasons.some(
    (reason) => reason === 'Licenza assente' || reason === 'Formato file non supportato',
  );
}

const MANUAL_WIKIMEDIA_PROPOSAL_LIMIT = 5;

function manualCandidatePool(lookup: WikidataLookupResult): {
  pool: WikidataCandidate[];
  matchingAmbiguous: boolean;
} {
  if (lookup.status === 'ambiguous') {
    return {
      matchingAmbiguous: true,
      pool: lookup.candidates.filter((row) => row.matchScore >= WIKIDATA_MATCH_MIN_SCORE),
    };
  }
  if (lookup.status === 'proposal' || lookup.status === 'none') {
    return {
      matchingAmbiguous: false,
      pool: (lookup.eligibleCandidates ?? []).filter(
        (row) => row.matchScore >= WIKIDATA_MATCH_MIN_SCORE,
      ),
    };
  }
  return { matchingAmbiguous: false, pool: [] };
}

async function previewFromLookup(
  candidate: WikidataCandidate,
  lookup: WikidataLookupResult,
): Promise<WikimediaProposalPreview> {
  if (lookup.status !== 'proposal') {
    const validityNote = lookup.status === 'error' ? lookup.message : lookup.message;
    return {
      candidate,
      proposal: null,
      license: null,
      isImportable: false,
      validityNote,
    };
  }

  const proposal = lookup.proposal;
  try {
    const extMetadata = await fetchCommonsExtMetadata(proposal.commonsFileTitle);
    const commonsPageUrl = buildCommonsFileDescriptionPageUrl(proposal.commonsFileTitle);
    const license = parseCommonsLicenseMetadata(
      proposal.commonsFileTitle,
      extMetadata,
      commonsPageUrl,
    );
    const isImportable = !isHardBlockedLicense(license.blockingReasons);
    const validityNote = license.isCcBy40AutoPathEligible
      ? 'CC BY 4.0 — percorso verifica automatica disponibile.'
      : isImportable
        ? 'Utilizzabile con verifica Admin (licenza o metadati non auto-path).'
        : license.blockingReasons.join(' · ') || 'Proposta non importabile.';
    return {
      candidate,
      proposal,
      license,
      isImportable,
      validityNote,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      candidate,
      proposal,
      license: null,
      isImportable: false,
      validityNote: `Metadati Commons non disponibili (${message}); proposta non verificabile/importabile in questa fase.`,
    };
  }
}

/**
 * Lookup manuale: una ricerca Wikidata, poi fino a 5 proposte con P18.
 * Il preview CC BY 4.0 non è la verifica definitiva del file e non interrompe la raccolta.
 */
export async function buildManualWikimediaProposalsForPoi(
  poiId: string,
  cityId: string,
  cityName?: string | null,
): Promise<WikimediaManualDiscoveryResult> {
  const poi = await loadPoiRow(poiId.trim(), cityId.trim());
  if (!poi) return { poiName: '', proposals: [], error: 'POI non trovato.' };

  const firstLookup = await lookupWikidataP18Proposal({
    label: poi.name,
    description: poi.description,
    cityName: cityName ?? null,
  });

  const { pool } = manualCandidatePool(firstLookup);

  if (pool.length === 0) {
    return {
      poiName: poi.name,
      proposals: [],
      error:
        firstLookup.status === 'error' || firstLookup.status === 'none'
          ? firstLookup.message
          : 'Nessuna proposta Wikimedia disponibile.',
    };
  }

  const previews: WikimediaProposalPreview[] = [];
  for (const candidate of pool) {
    if (previews.length >= MANUAL_WIKIMEDIA_PROPOSAL_LIMIT) break;
    const lookup =
      firstLookup.status === 'proposal' && candidate.qid === firstLookup.proposal.qid
        ? firstLookup
        : await lookupWikidataP18Proposal({
            label: candidate.label,
            description: candidate.description,
            knownQid: candidate.qid,
            cityName: cityName ?? null,
          });
    const preview = await previewFromLookup(candidate, lookup);
    if (!preview.proposal) continue;
    previews.push(preview);
  }

  if (previews.length === 0) {
    return {
      poiName: poi.name,
      proposals: [],
      error:
        firstLookup.status === 'error' || firstLookup.status === 'none'
          ? firstLookup.message
          : 'Nessuna proposta Wikimedia disponibile.',
    };
  }

  return { poiName: poi.name, proposals: rankWikimediaProposals(previews) };
}

export async function importWikimediaProposalForPoi(
  poiId: string,
  cityId: string,
  proposal: WikidataP18Proposal,
  storageResolution?: 'reuse_existing' | 'import_new',
): Promise<CommonsDownloadPipelineResult> {
  return runCommonsDownloadPipeline({
    proposal,
    adminConfirmedQid: true,
    entity: { entityType: 'poi', entityId: poiId.trim(), cityId: cityId.trim() },
    assignToEntity: true,
    assignmentRole: 'gallery',
    interactiveStorageDecision: true,
    storageResolution,
  });
}

/** Compat legacy — mappa le preview §38.2 sul tipo storico. */
export async function rankManualWikimediaCandidatesForPoi(
  poiId: string,
  cityId: string,
  cityName?: string | null,
): Promise<{ poiName: string; ranked: RankedWikimediaManualCandidate[]; error?: string }> {
  const built = await buildManualWikimediaProposalsForPoi(poiId, cityId, cityName);
  const ranked: RankedWikimediaManualCandidate[] = built.proposals.map((row) => {
    const lookup: WikidataLookupResult = row.proposal
      ? { status: 'proposal', proposal: row.proposal }
      : row.candidate.ambiguous
        ? { status: 'ambiguous', candidates: [row.candidate], message: row.validityNote }
        : { status: 'none', message: row.validityNote };
    return {
      candidate: row.candidate,
      lookup,
      isBest: row.isBest ?? false,
      validityNote: row.validityNote,
    };
  });
  return { poiName: built.poiName, ranked, error: built.error };
}
