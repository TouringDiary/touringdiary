import { getPrimarySpecific } from '@/domain/city/famousPersonCategories';
import {
  type FamousPersonPublishGap,
  type FamousPersonRequiredField,
  type FamousPersonTextRequiredField,
  getMissingFamousPersonFields,
  isFamousPersonComplete,
  isFamousPersonRequiredValuePresent,
} from '@/domain/city/famousPersonCompleteness';
import { validateFamousPersonDates } from '@/domain/city/famousPersonDates';
import { isAiProviderQuotaExhaustedError } from '@/services/ai/aiEdgeErrors';
import { aiGateway } from '@/services/ai/aiGateway';
import { generateHistoricalPortrait } from '@/services/ai/aiVision';
import type { FamousPerson } from '@/types/index';
import {
  buildCompletePersonFieldsPrompt,
  buildRecoverPersonDatesPrompt,
} from '../../../data/ai/prompts';
import { assertAiRuntimeAvailable } from '../aiRuntimeStatus';
import { cleanJsonOutput } from '../aiUtils';
import type { PersonDiscoveryResult } from './peopleGenerator';

/**
 * Tentativi funzionali di recovery automatico per i campi ancora mancanti.
 * Il secondo tentativo ripete la stessa strategia (stessa richiesta mirata):
 * serve a tollerare fallimenti AI transienti, non una strategia differenziata.
 *
 * Identità: senza un `name` affidabile già presente non si recupera nulla
 * (nessuna identità inventata). Categorie: mai inventate dall’AI; restano array/ID.
 */
export const MAX_AUTO_RECOVERY_ATTEMPTS = 2;

/** Clamp: niente negativi / Infinity / valori oltre il tetto funzionale. */
function resolveMaxRecoveryAttempts(requested: number): number {
  if (!Number.isFinite(requested) || requested <= 0) return 0;
  return Math.min(Math.floor(requested), MAX_AUTO_RECOVERY_ATTEMPTS);
}

function pickPresentString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function pickOptionalYear(value: unknown): number | null | undefined {
  if (value === null) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) && Number.isInteger(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^-?\d+$/.test(trimmed)) {
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
  }
  return undefined;
}

function pickOptionalDate(value: unknown): string | null | undefined {
  if (value === null) return null;
  return pickPresentString(value) ?? undefined;
}

/**
 * Draft intenzionalmente incompleto: i required possono mancare.
 * Non è un FamousPerson completo di dominio.
 */
export type FamousPersonCompletenessDraft = {
  name?: string;
  bio?: string;
  imageUrl?: string | null;
  specificCategoryIds?: string[];
  specificCategorySlugs?: string[];
  categories?: FamousPerson['categories'];
  birthYear?: number | null;
  birthDate?: string | null;
  isLiving?: boolean;
  deathYear?: number | null;
  deathDate?: string | null;
} & Partial<Omit<FamousPerson, FamousPersonRequiredField>>;

/** Solo i required realmente presenti (nessuna stringa vuota fittizia). */
export type FamousPersonPresentRequiredFields = {
  name?: string;
  bio?: string;
  imageUrl?: string | null;
  specificCategoryIds?: string[];
  birthYear?: number | null;
  birthDate?: string | null;
  isLiving?: boolean;
  deathYear?: number | null;
  deathDate?: string | null;
};

export type FamousPersonCompleteRequiredFields = Pick<FamousPerson, 'name' | 'bio' | 'imageUrl'> & {
  specificCategoryIds: string[];
  birthYear: number;
  birthDate?: string | null;
  isLiving: boolean;
  deathYear?: number | null;
  deathDate?: string | null;
};

export type FamousPersonRecoveryResult = {
  person: FamousPersonCompletenessDraft;
  complete: boolean;
  missingFields: ReturnType<typeof getMissingFamousPersonFields>;
  /** Tentativi funzionali di recovery eseguiti (0..MAX_AUTO_RECOVERY_ATTEMPTS). */
  recoveryAttemptsUsed: number;
  /** Quota portrait rilevata durante questa esecuzione (non se skipImageAiRecovery era già true in ingresso). */
  portraitQuotaExceeded?: boolean;
};

export type EnsureFamousPersonCompletenessOptions = {
  /** Evita recovery portrait AI (es. dopo 429/quota già rilevata). */
  skipImageAiRecovery?: boolean;
};

/** Label per portrait: specific primaria, altrimenti prima categoria, altrimenti fallback. */
export function resolvePortraitCategoryLabel(person: FamousPersonCompletenessDraft): string {
  const cats = person.categories;
  if (cats && cats.length > 0) {
    const sortable = cats.map((c) => ({
      label: c.specificLabel,
      slug: c.specificSlug,
      orderIndex: c.specificOrderIndex,
      masterOrderIndex: c.masterOrderIndex,
      masterSlug: c.masterSlug,
    }));
    const primary = getPrimarySpecific(sortable);
    if (primary?.label?.trim()) return primary.label.trim();
    const first = cats[0]?.specificLabel?.trim();
    if (first) return first;
  }
  return 'personaggio storico';
}

function normalizeCategoryId(id: unknown): string | undefined {
  if (typeof id !== 'string') return undefined;
  const trimmed = id.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function resolveSpecificCategoryIds(
  draft: FamousPersonCompletenessDraft | PersonDiscoveryResult,
): string[] {
  if ('specificCategoryIds' in draft && Array.isArray(draft.specificCategoryIds)) {
    const ids = draft.specificCategoryIds
      .map(normalizeCategoryId)
      .filter((id): id is string => id !== undefined);
    if (ids.length > 0) return [...new Set(ids)];
  }
  if ('categories' in draft && Array.isArray(draft.categories) && draft.categories.length > 0) {
    const ids = draft.categories
      .map((c) => normalizeCategoryId(c.specificId))
      .filter((id): id is string => id !== undefined);
    return [...new Set(ids)];
  }
  return [];
}

/** Campi ancora recuperabili via AI in questa sessione (esclude portrait se bloccato). */
function getRecoverableMissingFields(
  draft: FamousPersonCompletenessDraft,
  skipImageAiRecovery: boolean,
): FamousPersonPublishGap[] {
  return getMissingFamousPersonFields(draft).filter((field) => {
    if (field === 'imageUrl' && skipImageAiRecovery) return false;
    if (field === 'categories' || field === 'name') return false;
    return true;
  });
}

function hasMeaningfulRecoveryWork(
  draft: FamousPersonCompletenessDraft,
  skipImageAiRecovery: boolean,
): boolean {
  return getRecoverableMissingFields(draft, skipImageAiRecovery).length > 0;
}

/**
 * Merge solo gap stringa (name, bio, imageUrl). Preserva dati già presenti.
 * Categorie non passano da qui (restano array/ID; recovery non le inventa).
 */
function mergePersonFields(
  base: FamousPersonCompletenessDraft,
  patch: Partial<Pick<FamousPerson, FamousPersonTextRequiredField | 'imageUrl'>>,
): FamousPersonCompletenessDraft {
  const next = { ...base };
  const name = pickPresentString(patch.name);
  if (name && !isFamousPersonRequiredValuePresent(next.name)) {
    next.name = name;
  }
  const bio = pickPresentString(patch.bio);
  if (bio && !isFamousPersonRequiredValuePresent(next.bio)) {
    next.bio = bio;
  }
  const imageUrl = pickPresentString(patch.imageUrl);
  if (imageUrl && !isFamousPersonRequiredValuePresent(next.imageUrl)) {
    next.imageUrl = imageUrl;
  }
  return next;
}

function hasDateConsistencyErrors(dates: {
  birthYear?: number | null;
  birthDate?: string | null;
  isLiving?: boolean;
  deathYear?: number | null;
  deathDate?: string | null;
}): boolean {
  const res = validateFamousPersonDates(dates);
  if (res.ok) return false;
  // Filtra gli errori puri di completezza (campi obbligatori mancanti)
  const consistencyErrors = res.errors.filter(
    (err) =>
      err !== 'Anno di nascita obbligatorio.' &&
      err !== 'Anno di morte obbligatorio per un personaggio non vivente.' &&
      err !== 'Stato in vita o deceduto non specificato.',
  );
  return consistencyErrors.length > 0;
}

function mergeDateFields(
  base: FamousPersonCompletenessDraft,
  patch: Partial<
    Pick<FamousPerson, 'birthYear' | 'birthDate' | 'isLiving' | 'deathYear' | 'deathDate'>
  >,
): FamousPersonCompletenessDraft {
  const baseValid = validateFamousPersonDates({
    birthYear: base.birthYear,
    birthDate: base.birthDate,
    isLiving: base.isLiving,
    deathYear: base.deathYear,
    deathDate: base.deathDate,
  });
  if (baseValid.ok) return base;

  const next = { ...base };

  const birthYearPatch = pickOptionalYear(patch.birthYear);
  if (birthYearPatch !== undefined && (base.birthYear === null || base.birthYear === undefined)) {
    next.birthYear = birthYearPatch;
  }

  const birthDatePatch = pickOptionalDate(patch.birthDate);
  if (birthDatePatch !== undefined && (base.birthDate === null || base.birthDate === undefined)) {
    next.birthDate = birthDatePatch;
  }

  if (typeof patch.isLiving === 'boolean' && base.isLiving === undefined) {
    next.isLiving = patch.isLiving;
  }

  const deathYearPatch = pickOptionalYear(patch.deathYear);
  if (deathYearPatch !== undefined && (base.deathYear === null || base.deathYear === undefined)) {
    next.deathYear = deathYearPatch;
  }

  const deathDatePatch = pickOptionalDate(patch.deathDate);
  if (deathDatePatch !== undefined && (base.deathDate === null || base.deathDate === undefined)) {
    next.deathDate = deathDatePatch;
  }

  // Verifica che lo stato risultante non introduca incoerenze (es. morte prima della nascita)
  if (hasDateConsistencyErrors(next)) {
    return base;
  }

  return next;
}

function toDraftFromInput(
  input: FamousPersonCompletenessDraft | PersonDiscoveryResult,
): FamousPersonCompletenessDraft {
  const specificCategoryIds = resolveSpecificCategoryIds(input);
  const birthYear = pickOptionalYear(input.birthYear);
  const birthDate = pickOptionalDate(input.birthDate);
  const deathYear = pickOptionalYear(input.deathYear);
  const deathDate = pickOptionalDate(input.deathDate);

  const draft: FamousPersonCompletenessDraft = {
    id: 'id' in input ? input.id : undefined,
    name: pickPresentString(input.name),
    bio:
      pickPresentString(input.bio) ??
      ('fullBio' in input ? pickPresentString(input.fullBio) : undefined),
    imageUrl: pickPresentString(input.imageUrl),
    specificCategoryIds: specificCategoryIds.length > 0 ? specificCategoryIds : undefined,
    specificCategorySlugs: Array.isArray(input.specificCategorySlugs)
      ? input.specificCategorySlugs.filter((s): s is string => typeof s === 'string')
      : undefined,
    birthYear: birthYear !== undefined ? birthYear : input.birthYear,
    birthDate: birthDate !== undefined ? birthDate : input.birthDate,
    isLiving: input.isLiving,
    deathYear: deathYear !== undefined ? deathYear : input.deathYear,
    deathDate: deathDate !== undefined ? deathDate : input.deathDate,
  };

  if ('categories' in input) {
    draft.categories = input.categories;
  }
  if ('status' in input) {
    draft.status = input.status;
  }
  if ('quote' in input) {
    draft.quote = input.quote;
  }
  if ('famousWorks' in input) {
    draft.famousWorks = input.famousWorks;
  }
  if ('relatedPlaces' in input) {
    draft.relatedPlaces = input.relatedPlaces;
  }
  if ('fullBio' in input) {
    draft.fullBio = input.fullBio;
  }
  if ('privateLife' in input) {
    draft.privateLife = input.privateLife;
  }
  if ('collaborations' in input) {
    draft.collaborations = input.collaborations;
  }
  if ('awards' in input) {
    draft.awards = input.awards;
  }
  if ('careerStats' in input) {
    draft.careerStats = input.careerStats;
  }

  return draft;
}

/**
 * Una chiamata AI mirata ai soli campi testuali mancanti (nessun retry funzionale qui:
 * i tentativi funzionali sono contati da `ensureFamousPersonCompletenessWithAi`).
 */
export const completePersonTextFieldsFromAi = async (
  personName: string,
  cityName: string,
  missingTextFields: FamousPersonTextRequiredField[],
  knownContext: FamousPersonCompletenessDraft,
): Promise<Partial<Pick<FamousPerson, FamousPersonTextRequiredField>>> => {
  if (missingTextFields.length === 0) return {};

  assertAiRuntimeAvailable();

  const prompt = buildCompletePersonFieldsPrompt(
    personName,
    cityName,
    missingTextFields,
    knownContext,
  );

  const response = await aiGateway.generateLegacy({
    // gemini-2.0-pro non è un ID API utilizzabile; allineato al modello testo già usato in aiVision.
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      tools: [{ googleSearch: {} }],
    },
  });

  const rawText = response.text || '{}';
  try {
    const parsed: unknown = JSON.parse(cleanJsonOutput(rawText));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const record = parsed as Record<string, unknown>;
    const out: Partial<Pick<FamousPerson, FamousPersonTextRequiredField>> = {};
    for (const field of missingTextFields) {
      const value = pickPresentString(record[field]);
      if (value) out[field] = value;
    }
    return out;
  } catch (e) {
    console.error('[peopleCompleteness] Errore parsing completePersonTextFieldsFromAi', e);
    return {};
  }
};

export const recoverPersonDatesFromAi = async (
  personName: string,
  cityName: string,
  knownContext: FamousPersonCompletenessDraft,
): Promise<
  Partial<Pick<FamousPerson, 'birthYear' | 'birthDate' | 'isLiving' | 'deathYear' | 'deathDate'>>
> => {
  assertAiRuntimeAvailable();

  const prompt = buildRecoverPersonDatesPrompt(personName, cityName, knownContext);
  const response = await aiGateway.generateLegacy({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      tools: [{ googleSearch: {} }],
    },
  });

  const rawText = response.text || '{}';
  try {
    const parsed: unknown = JSON.parse(cleanJsonOutput(rawText));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const record = parsed as Record<string, unknown>;
    const out: Partial<
      Pick<FamousPerson, 'birthYear' | 'birthDate' | 'isLiving' | 'deathYear' | 'deathDate'>
    > = {};
    const birthYear = pickOptionalYear(record.birthYear);
    if (birthYear !== undefined) out.birthYear = birthYear;
    const birthDate = pickOptionalDate(record.birthDate);
    if (birthDate !== undefined) out.birthDate = birthDate;
    if (typeof record.isLiving === 'boolean') out.isLiving = record.isLiving;
    const deathYear = pickOptionalYear(record.deathYear);
    if (deathYear !== undefined) out.deathYear = deathYear;
    const deathDate = pickOptionalDate(record.deathDate);
    if (deathDate !== undefined) out.deathDate = deathDate;
    return out;
  } catch (e) {
    console.error('[peopleCompleteness] Errore parsing recoverPersonDatesFromAi', e);
    return {};
  }
};

/**
 * Completa un solo campo obbligatorio stringa (admin o recovery mirato).
 * imageUrl → vision pipeline; bio → prompt mirato.
 * `name` non si inventa: senza nome affidabile già presente → null.
 * Categorie non sono campi stringa recuperabili qui.
 */
export const generateFamousPersonRequiredField = async (
  person: FamousPersonCompletenessDraft,
  cityName: string,
  field: FamousPersonRequiredField,
): Promise<string | null> => {
  const personName = pickPresentString(person.name);
  if (!personName) {
    console.error('[peopleCompleteness] generateFamousPersonRequiredField: nome assente');
    return null;
  }

  // Non inventare un’identità: il nome deve già essere presente (precondizione).
  if (field === 'name') {
    return personName;
  }

  if (field === 'imageUrl') {
    const categoryLabel = resolvePortraitCategoryLabel(person);
    try {
      return await generateHistoricalPortrait(personName, categoryLabel, cityName);
    } catch (e) {
      if (isAiProviderQuotaExhaustedError(e)) throw e;
      console.error('[peopleCompleteness] generateHistoricalPortrait failed', e);
      return null;
    }
  }

  try {
    const patch = await completePersonTextFieldsFromAi(personName, cityName, [field], person);
    return pickPresentString(patch[field]) ?? null;
  } catch (e) {
    console.error(`[peopleCompleteness] generate field ${field} failed`, e);
    return null;
  }
};

/**
 * Un tentativo funzionale: recupera i campi ancora mancanti
 * (bio via testo AI, date strutturate, poi ritratto).
 *
 * Precondizione identità: senza `name` affidabile si interrompe — nessun nome inventato.
 * Con name presente, il recovery testuale (`completePersonTextFieldsFromAi`) è di fatto bio.
 * Categorie: non inventate (restano array/ID già presenti o gap ‘categories’).
 */
type RecoveryAttemptState = {
  draft: FamousPersonCompletenessDraft;
  skipImageAiRecovery: boolean;
  portraitQuotaExceeded: boolean;
};

async function runOneRecoveryAttempt(
  draft: FamousPersonCompletenessDraft,
  cityName: string,
  skipImageAiRecovery: boolean,
): Promise<RecoveryAttemptState> {
  const missing = getMissingFamousPersonFields(draft);
  if (missing.length === 0) {
    return { draft, skipImageAiRecovery, portraitQuotaExceeded: false };
  }

  let next = { ...draft };
  let skipImage = skipImageAiRecovery;
  let portraitQuotaExceeded = false;
  const personName = pickPresentString(next.name);

  // Senza nome affidabile: stop. Nessuna identità inventata.
  if (!personName) {
    return { draft: next, skipImageAiRecovery: skipImage, portraitQuotaExceeded };
  }

  // Name già presente → gap testuale recuperabile = bio (mai name).
  if (missing.includes('bio')) {
    try {
      const patch = await completePersonTextFieldsFromAi(personName, cityName, ['bio'], next);
      next = mergePersonFields(next, patch);
    } catch (e) {
      console.error('[peopleCompleteness] recovery text fields failed', e);
    }
  }

  if (getMissingFamousPersonFields(next).includes('dates')) {
    try {
      const datePatch = await recoverPersonDatesFromAi(personName, cityName, next);
      next = mergeDateFields(next, datePatch);
    } catch (e) {
      console.error('[peopleCompleteness] recovery dates failed', e);
    }
  }

  if (!skipImage && getMissingFamousPersonFields(next).includes('imageUrl')) {
    try {
      const imageUrl = await generateFamousPersonRequiredField(next, cityName, 'imageUrl');
      if (imageUrl) {
        next = mergePersonFields(next, { imageUrl });
      }
    } catch (e) {
      if (isAiProviderQuotaExhaustedError(e)) {
        skipImage = true;
        portraitQuotaExceeded = true;
        console.warn(
          '[peopleCompleteness] portrait AI quota exhausted; skipping further image recovery.',
        );
      } else {
        console.error('[peopleCompleteness] recovery imageUrl failed', e);
      }
    }
  }

  return { draft: next, skipImageAiRecovery: skipImage, portraitQuotaExceeded };
}

/**
 * Verifica completezza e, se mancano campi, esegue fino a `maxAttempts` recovery funzionali
 * (clamped a `MAX_AUTO_RECOVERY_ATTEMPTS`). Nessun valore vuoto/fittizio.
 * Senza name presente: recovery non avanza (identità non inventata). Categorie non recuperate via AI.
 */
export const ensureFamousPersonCompletenessWithAi = async (
  input: FamousPersonCompletenessDraft | PersonDiscoveryResult,
  cityName: string,
  maxAttempts: number = MAX_AUTO_RECOVERY_ATTEMPTS,
  options?: EnsureFamousPersonCompletenessOptions,
): Promise<FamousPersonRecoveryResult> => {
  let draft = toDraftFromInput(input);
  const attemptBudget = resolveMaxRecoveryAttempts(maxAttempts);
  let skipImageAiRecovery = options?.skipImageAiRecovery ?? false;
  let portraitQuotaExceeded = false;

  let attempts = 0;
  while (
    !isFamousPersonComplete(draft) &&
    attempts < attemptBudget &&
    hasMeaningfulRecoveryWork(draft, skipImageAiRecovery)
  ) {
    attempts += 1;
    const result = await runOneRecoveryAttempt(draft, cityName, skipImageAiRecovery);
    draft = result.draft;
    skipImageAiRecovery = result.skipImageAiRecovery;
    if (result.portraitQuotaExceeded) portraitQuotaExceeded = true;
  }

  const missingFields = getMissingFamousPersonFields(draft);
  return {
    person: draft,
    complete: missingFields.length === 0,
    missingFields,
    recoveryAttemptsUsed: attempts,
    portraitQuotaExceeded: portraitQuotaExceeded || undefined,
  };
};

/**
 * Espone solo i required realmente presenti. Nessuna stringa vuota al posto dei mancanti.
 */
export function toDraftFamousPersonSaveFields(
  draft: FamousPersonCompletenessDraft,
): FamousPersonPresentRequiredFields {
  const out: FamousPersonPresentRequiredFields = {};
  const name = pickPresentString(draft.name);
  const bio = pickPresentString(draft.bio);
  const imageUrl = pickPresentString(draft.imageUrl);
  const specificCategoryIds = resolveSpecificCategoryIds(draft);
  if (name) out.name = name;
  if (bio) out.bio = bio;
  if (imageUrl) out.imageUrl = imageUrl;
  if (specificCategoryIds.length > 0) out.specificCategoryIds = specificCategoryIds;
  const birthYear = pickOptionalYear(draft.birthYear);
  if (birthYear !== undefined) out.birthYear = birthYear;
  const birthDate = pickOptionalDate(draft.birthDate);
  if (birthDate !== undefined) out.birthDate = birthDate;
  if (typeof draft.isLiving === 'boolean') out.isLiving = draft.isLiving;
  const deathYear = pickOptionalYear(draft.deathYear);
  if (deathYear !== undefined) out.deathYear = deathYear;
  const deathDate = pickOptionalDate(draft.deathDate);
  if (deathDate !== undefined) out.deathDate = deathDate;
  return out;
}

/**
 * Restituisce i required tipizzati solo se il draft è completo.
 * Altrimenti `null` (il caller non deve salvare come completo/pubblicabile).
 */
export function toCompleteFamousPersonRequiredFields(
  draft: FamousPersonCompletenessDraft,
): FamousPersonCompleteRequiredFields | null {
  if (!isFamousPersonComplete(draft)) return null;

  const name = pickPresentString(draft.name);
  const bio = pickPresentString(draft.bio);
  const imageUrl = pickPresentString(draft.imageUrl);
  const specificCategoryIds = resolveSpecificCategoryIds(draft);
  const birthYear = pickOptionalYear(draft.birthYear);

  if (!name || !bio || !imageUrl || specificCategoryIds.length === 0 || birthYear == null) {
    return null;
  }

  const isLiving = draft.isLiving === true;
  return {
    name,
    bio,
    imageUrl,
    specificCategoryIds,
    birthYear,
    birthDate: pickOptionalDate(draft.birthDate) ?? null,
    isLiving,
    deathYear: isLiving ? null : (pickOptionalYear(draft.deathYear) ?? null),
    deathDate: isLiving ? null : (pickOptionalDate(draft.deathDate) ?? null),
  };
}
