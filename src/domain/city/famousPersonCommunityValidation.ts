/**
 * Validazione community Famous Person (nota obbligatoria su suggestion personaggio).
 * SoT: AI_CONTEXT/AUDIT_ANGOLO_CULTURA_TIMELINE_v2.txt — D2.
 */

export const FAMOUS_PERSON_SUGGESTION_NOTES_MAX = 2000;
export const FAMOUS_PERSON_SUGGESTION_NAME_MAX = 200;

export type FamousPersonSuggestionValidationResult =
  | { ok: true; suggestedName: string; notes: string }
  | { ok: false; errors: string[] };

export function validateFamousPersonSuggestionInput(input: {
  suggestedName?: string | null;
  notes?: string | null;
}): FamousPersonSuggestionValidationResult {
  const errors: string[] = [];
  const suggestedName = typeof input.suggestedName === 'string' ? input.suggestedName.trim() : '';
  const notes = typeof input.notes === 'string' ? input.notes.trim() : '';

  if (!suggestedName) {
    errors.push('Nome personaggio obbligatorio.');
  } else if (suggestedName.length > FAMOUS_PERSON_SUGGESTION_NAME_MAX) {
    errors.push('Nome personaggio troppo lungo.');
  }

  if (!notes) {
    errors.push('La nota è obbligatoria.');
  } else if (notes.length > FAMOUS_PERSON_SUGGESTION_NOTES_MAX) {
    errors.push('Nota troppo lunga.');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, suggestedName, notes };
}
