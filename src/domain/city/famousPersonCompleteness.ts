import { validateFamousPersonDates } from '@/domain/city/famousPersonDates';
import type { FamousPerson } from '@/types/models/City';

/**
 * Campi obbligatori (stringa) per completezza / pubblicabilità di un FamousPerson.
 *
 * Requisiti aggiuntivi (non stringa):
 * - ≥ 1 categoria (specificCategoryIds o categories)
 * - date valide per publish (birth_year; se !isLiving death_year; se isLiving nessuna morte)
 *
 * `role` non è più un requisito (sostituito dalla tassonomia Master/Specific).
 */
export const FAMOUS_PERSON_REQUIRED_FIELDS = ['name', 'bio', 'imageUrl'] as const;

export type FamousPersonRequiredField = (typeof FAMOUS_PERSON_REQUIRED_FIELDS)[number];

/** Campi recuperabili via prompt testuale AI (mai imageUrl). */
export const FAMOUS_PERSON_TEXT_REQUIRED_FIELDS = ['name', 'bio'] as const;

export type FamousPersonTextRequiredField = (typeof FAMOUS_PERSON_TEXT_REQUIRED_FIELDS)[number];

/** Gap di completezza/pubblicabilità (campi stringa + categorie + date). */
export type FamousPersonPublishGap = FamousPersonRequiredField | 'categories' | 'dates';

export type FamousPersonCompletenessInput = Partial<
  Record<FamousPersonRequiredField, string | null | undefined>
> &
  Partial<Pick<FamousPerson, 'status' | 'id' | 'categories' | 'isLiving'>> & {
    specificCategoryIds?: string[] | null;
    birthYear?: number | null;
    birthDate?: string | null;
    deathYear?: number | null;
    deathDate?: string | null;
  };

const FIELD_LABELS: Record<FamousPersonPublishGap, string> = {
  name: 'Nome',
  bio: 'Biografia',
  imageUrl: 'Immagine',
  categories: 'Categorie',
  dates: 'Date',
};

export function getFamousPersonFieldLabel(field: FamousPersonPublishGap): string {
  return FIELD_LABELS[field];
}

export function formatMissingFamousPersonFields(
  missingFields: readonly FamousPersonPublishGap[],
): string {
  return missingFields.map(getFamousPersonFieldLabel).join(', ');
}

/** Presente solo se stringa non vuota dopo trim. null / undefined / whitespace = mancante. */
export function isFamousPersonRequiredValuePresent(
  value: string | null | undefined,
): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * ≥1 categoria per completezza.
 * - `specificCategoryIds` soli (senza oggetti `categories`): ≥1 id è sufficiente —
 *   l’assegnabilità degli id è validata al layer save/service (no query qui).
 * - Con oggetti `categories`: `isActive === false` non conta (usa `isActive` di
 *   FamousPersonCategoryRef quando presente).
 */
function hasAtLeastOneCategory(person: FamousPersonCompletenessInput): boolean {
  if (Array.isArray(person.specificCategoryIds)) {
    const hasValidId = person.specificCategoryIds.some(
      (id) => typeof id === 'string' && id.trim().length > 0
    );
    if (hasValidId) return true;
  }
  if (Array.isArray(person.categories) && person.categories.length >= 1) {
    return person.categories.some((c) => {
      if ('isActive' in c && c.isActive === false) return false;
      return true;
    });
  }
  return false;
}

function hasValidPublishDates(person: FamousPersonCompletenessInput): boolean {
  return validateFamousPersonDates({
    birthYear: person.birthYear,
    birthDate: person.birthDate,
    isLiving: person.isLiving,
    deathYear: person.deathYear,
    deathDate: person.deathDate,
  }).ok;
}

export function getMissingFamousPersonFields(
  person: FamousPersonCompletenessInput,
): FamousPersonPublishGap[] {
  const missing: FamousPersonPublishGap[] = [];
  for (const field of FAMOUS_PERSON_REQUIRED_FIELDS) {
    if (!isFamousPersonRequiredValuePresent(person[field])) {
      missing.push(field);
    }
  }
  if (!hasAtLeastOneCategory(person)) {
    missing.push('categories');
  }
  if (!hasValidPublishDates(person)) {
    missing.push('dates');
  }
  return missing;
}

export function isFamousPersonComplete(person: FamousPersonCompletenessInput): boolean {
  return getMissingFamousPersonFields(person).length === 0;
}

/**
 * Pubblicabile solo se campi stringa, categorie e date soddisfano il gate.
 * Lo `status` non entra nella decisione: è l’esito della pubblicazione, non un prerequisito.
 */
export function canPublishFamousPerson(person: FamousPersonCompletenessInput): boolean {
  return isFamousPersonComplete(person);
}

export class FamousPersonPublishBlockedError extends Error {
  readonly code = 'FAMOUS_PERSON_PUBLISH_BLOCKED' as const;
  readonly missingFields: FamousPersonPublishGap[];
  readonly personName: string;

  constructor(missingFields: FamousPersonPublishGap[], personName = '') {
    const labels = formatMissingFamousPersonFields(missingFields);
    super(
      personName
        ? `Personaggio non pubblicabile («${personName}»): mancano ${labels}.`
        : `Personaggio non pubblicabile: mancano ${labels}.`,
    );
    this.name = 'FamousPersonPublishBlockedError';
    this.missingFields = missingFields;
    this.personName = personName;
  }
}

function isFamousPersonPublishGap(value: unknown): value is FamousPersonPublishGap {
  return (
    value === 'name' ||
    value === 'bio' ||
    value === 'imageUrl' ||
    value === 'categories' ||
    value === 'dates'
  );
}

/**
 * Type guard strutturale: `code`, `missingFields` (FamousPersonPublishGap[]), `personName` (string).
 * Nessun cast alla classe; verifica la forma, non l’istanza.
 */
export function isFamousPersonPublishBlockedError(
  error: unknown,
): error is FamousPersonPublishBlockedError {
  if (typeof error !== 'object' || error === null) return false;

  const obj = error as Record<string, unknown>;
  if (obj.code !== 'FAMOUS_PERSON_PUBLISH_BLOCKED') return false;
  if (typeof obj.personName !== 'string') return false;
  if (!Array.isArray(obj.missingFields)) return false;
  return obj.missingFields.every(isFamousPersonPublishGap);
}

/**
 * Gate di pubblicazione: lancia se manca anche un solo requisito.
 * SoT della decisione di pubblicabilità personaggi famosi.
 */
export function assertFamousPersonPublishable(person: FamousPersonCompletenessInput): void {
  const missing = getMissingFamousPersonFields(person);
  if (missing.length > 0) {
    const name = isFamousPersonRequiredValuePresent(person.name) ? person.name.trim() : '';
    throw new FamousPersonPublishBlockedError(missing, name);
  }
}

/**
 * Esito di un tentativo di pubblicazione (toggle / bulk).
 * Condivide hooks CRUD e AI senza dipendenze circolari.
 * `incomplete` = gate completezza; `runtime` = errore DB/rete/altro (non inventare missingFields).
 */
export type FamousPersonPublishAttemptResult =
  | { ok: true }
  | {
      ok: false;
      cause: 'incomplete';
      missingFields: FamousPersonPublishGap[];
      person: FamousPerson;
    }
  | {
      ok: false;
      cause: 'runtime';
      person: FamousPerson;
      message: string;
    };
