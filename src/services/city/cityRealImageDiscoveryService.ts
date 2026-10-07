import { supabase } from '@/services/supabaseClient';
import {
  asCommonsDownloadImported,
  type CommonsDownloadPipelineResult,
  runCommonsDownloadPipeline,
} from '@/services/wikimedia/commonsDownloadPipeline';
import {
  lookupWikidataP18Proposal,
  type WikidataLookupResult,
  type WikidataP18Proposal,
} from '@/services/wikimedia/wikidataLookupService';

export type CityHeroWikimediaActivation = 'magic_add' | 'complete_city' | 'manual_api';

const ALLOWED_ACTIVATIONS = new Set<CityHeroWikimediaActivation>([
  'magic_add',
  'complete_city',
  'manual_api',
]);

export type CityDiscoveryResult =
  | { status: 'skipped'; reason: string }
  | { status: 'lookup'; lookup: WikidataLookupResult; message: string }
  | { status: 'imported'; message: string; togglePersisted: boolean }
  | { status: 'failed'; stage: string; message: string };

function validateCityInput(cityId: string, cityName: string): string | null {
  if (!cityId.trim()) return 'cityId obbligatorio.';
  if (!cityName.trim()) return 'cityName obbligatorio per lookup Wikidata.';
  return null;
}

async function loadCityHeroAdminUrl(cityId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('cities')
    .select('hero_image')
    .eq('id', cityId.trim())
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  const raw = data?.hero_image?.trim();
  return raw ? raw : null;
}

function canAutoImportFromLookup(lookup: WikidataLookupResult): lookup is {
  status: 'proposal';
  proposal: WikidataP18Proposal;
} {
  return (
    lookup.status === 'proposal' &&
    lookup.proposal.confidence !== 'low' &&
    !lookup.proposal.requiresAdminConfirm
  );
}

/** Lookup/proposta — nessun import; consentito anche con Admin Hero presente (manual_api). */
export async function lookupCityHeroWikimediaProposal(
  cityId: string,
  cityName: string,
): Promise<CityDiscoveryResult> {
  const inputError = validateCityInput(cityId, cityName);
  if (inputError) {
    return { status: 'failed', stage: 'input', message: inputError };
  }

  let lookup: WikidataLookupResult;
  try {
    lookup = await lookupWikidataP18Proposal({
      label: cityName.trim(),
      cityName: cityName.trim(),
    });
  } catch (err) {
    return {
      status: 'failed',
      stage: 'wikidata_lookup',
      message: err instanceof Error ? err.message : 'Lookup Wikidata fallito.',
    };
  }

  if (lookup.status === 'proposal') {
    return {
      status: 'lookup',
      lookup,
      message: lookup.proposal.requiresAdminConfirm
        ? 'Conferma Admin richiesta prima dell’import Commons.'
        : 'Proposta Wikimedia disponibile.',
    };
  }

  return {
    status: 'lookup',
    lookup,
    message: lookup.message,
  };
}

/** Import solo dopo conferma Admin esplicita (manual_api / modal). */
export async function importConfirmedCityHeroWikimedia(
  cityId: string,
  cityName: string,
  proposal: WikidataP18Proposal,
  options: { activation: CityHeroWikimediaActivation; adminConfirmed: true },
): Promise<CityDiscoveryResult> {
  if (!ALLOWED_ACTIVATIONS.has(options.activation)) {
    return { status: 'skipped', reason: 'activation non consentita' };
  }
  const trimmedCityId = cityId.trim();
  const inputError = validateCityInput(trimmedCityId, cityName);
  if (inputError) {
    return { status: 'failed', stage: 'input', message: inputError };
  }
  if (!options.adminConfirmed) {
    return { status: 'failed', stage: 'confirm', message: 'Conferma Admin obbligatoria.' };
  }

  let pipeline: CommonsDownloadPipelineResult;
  try {
    pipeline = await runCommonsDownloadPipeline({
      proposal,
      adminConfirmedQid: true,
      entity: { entityType: 'city', entityId: trimmedCityId, cityId: trimmedCityId },
      assignToEntity: true,
      assignmentRole: 'gallery',
    });
  } catch (err) {
    return {
      status: 'failed',
      stage: 'commons_pipeline',
      message: err instanceof Error ? err.message : 'Pipeline Commons fallita.',
    };
  }

  const imported = asCommonsDownloadImported(pipeline);
  if ('failed' in imported) {
    return { status: 'failed', stage: imported.failed.stage, message: imported.failed.message };
  }

  return {
    status: 'imported',
    message: imported.message,
    togglePersisted: false,
  };
}

/**
 * Discovery automatica (magic_add / complete_city): rispetta Admin Hero e conferma Admin sulla proposta.
 */
export async function runAutomaticCityHeroWikimediaDiscovery(
  cityId: string,
  cityName: string,
  activation: Exclude<CityHeroWikimediaActivation, 'manual_api'>,
): Promise<CityDiscoveryResult> {
  if (!ALLOWED_ACTIVATIONS.has(activation)) {
    return { status: 'skipped', reason: 'activation non consentita' };
  }

  const trimmedCityId = cityId.trim();
  const inputError = validateCityInput(trimmedCityId, cityName);
  if (inputError) {
    return { status: 'failed', stage: 'input', message: inputError };
  }

  let adminHero: string | null;
  try {
    adminHero = await loadCityHeroAdminUrl(trimmedCityId);
  } catch (err) {
    return {
      status: 'failed',
      stage: 'admin_hero_read',
      message: err instanceof Error ? err.message : 'Lettura Admin Hero fallita.',
    };
  }
  if (adminHero) {
    return { status: 'skipped', reason: 'Admin Hero già presente (hero_image).' };
  }

  let lookup: WikidataLookupResult;
  try {
    lookup = await lookupWikidataP18Proposal({
      label: cityName.trim(),
      cityName: cityName.trim(),
    });
  } catch (err) {
    return {
      status: 'failed',
      stage: 'wikidata_lookup',
      message: err instanceof Error ? err.message : 'Lookup Wikidata fallito.',
    };
  }

  if (lookup.status !== 'proposal') {
    return {
      status: 'lookup',
      lookup,
      message: lookup.message,
    };
  }

  if (lookup.proposal.requiresAdminConfirm) {
    return {
      status: 'lookup',
      lookup,
      message: 'Conferma Admin richiesta; discovery automatica non importa.',
    };
  }

  if (!canAutoImportFromLookup(lookup)) {
    return {
      status: 'lookup',
      lookup,
      message: 'Proposta non utilizzabile in automatico (confidence o validazione).',
    };
  }

  let pipeline: CommonsDownloadPipelineResult;
  try {
    pipeline = await runCommonsDownloadPipeline({
      proposal: lookup.proposal,
      autoValidatedProposal: true,
      entity: { entityType: 'city', entityId: trimmedCityId, cityId: trimmedCityId },
      assignToEntity: true,
      assignmentRole: 'gallery',
    });
  } catch (err) {
    return {
      status: 'failed',
      stage: 'commons_pipeline',
      message: err instanceof Error ? err.message : 'Pipeline Commons fallita.',
    };
  }

  const imported = asCommonsDownloadImported(pipeline);
  if ('failed' in imported) {
    return { status: 'failed', stage: imported.failed.stage, message: imported.failed.message };
  }

  return {
    status: 'imported',
    message: imported.message,
    togglePersisted: false,
  };
}

/** @deprecated Usare lookup + importConfirmed o runAutomatic…; mantenuto per compatibilità call site legacy. */
export async function discoverCityHeroWikimedia(
  cityId: string,
  cityName: string,
  options?: { adminManualConfirm?: boolean },
): Promise<CityDiscoveryResult> {
  if (options?.adminManualConfirm) {
    return lookupCityHeroWikimediaProposal(cityId, cityName);
  }
  return runAutomaticCityHeroWikimediaDiscovery(cityId, cityName, 'complete_city');
}

export function scheduleCityHeroWikimediaDiscovery(
  cityId: string,
  cityName: string,
  activation: CityHeroWikimediaActivation,
): void {
  const runner =
    activation === 'manual_api'
      ? () => lookupCityHeroWikimediaProposal(cityId, cityName)
      : () => runAutomaticCityHeroWikimediaDiscovery(cityId, cityName, activation);

  void runner().catch((err) => {
    console.error('[cityRealImageDiscoveryService]', activation, cityId, err);
  });
}
