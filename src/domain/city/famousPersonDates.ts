/**
 * Date strutturate personaggi famosi + display derivato.
 * SoT: AI_CONTEXT/AUDIT_ANGOLO_CULTURA_TIMELINE.md §F3.6.
 */

export type FamousPersonStructuredDates = {
  birthYear: number | null;
  birthDate: string | null;
  isLiving: boolean;
  deathYear: number | null;
  deathDate: string | null;
};

export type FamousPersonDatesInput = {
  birthYear?: number | null;
  birthDate?: string | null;
  isLiving?: boolean;
  deathYear?: number | null;
  deathDate?: string | null;
};

export type FamousPersonDatesValidationResult = { ok: true } | { ok: false; errors: string[] };

const IT_SHORT_MONTHS = [
  'gen',
  'feb',
  'mar',
  'apr',
  'mag',
  'giu',
  'lug',
  'ago',
  'set',
  'ott',
  'nov',
  'dic',
] as const;

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseIsoDateParts(value: string): { year: number; month: number; day: number } | null {
  const match = ISO_DATE_RE.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  
  const probe = new Date(0);
  probe.setUTCHours(0, 0, 0, 0);
  probe.setUTCFullYear(year);
  probe.setUTCMonth(month - 1, day);

  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

function formatLifespanEndpoint(
  year: number | null | undefined,
  date: string | null | undefined,
): string | null {
  if (typeof date === 'string' && date.trim()) {
    const parts = parseIsoDateParts(date);
    if (parts) {
      const monthLabel = IT_SHORT_MONTHS[parts.month - 1];
      return `${parts.day} ${monthLabel} ${parts.year}`;
    }
  }
  if (typeof year === 'number' && Number.isInteger(year)) {
    return String(year);
  }
  return null;
}

/**
 * Stringa display derivata (non SoT).
 * Esempi: `15 mar 1452 – 2 mag 1519`, `1970 – presente`.
 */
export function buildLifespanDisplay(input: FamousPersonDatesInput): string {
  const birth = formatLifespanEndpoint(input.birthYear, input.birthDate);
  if (!birth) return '';

  if (input.isLiving === true) {
    return `${birth} – presente`;
  }

  const death = formatLifespanEndpoint(input.deathYear, input.deathDate);
  if (!death) return birth;
  return `${birth} – ${death}`;
}

function compareEndpoints(
  yearA: number,
  dateA: string | null | undefined,
  yearB: number,
  dateB: string | null | undefined,
): number {
  const partsA = typeof dateA === 'string' && dateA.trim() ? parseIsoDateParts(dateA) : null;
  const partsB = typeof dateB === 'string' && dateB.trim() ? parseIsoDateParts(dateB) : null;
  if (partsA && partsB) {
    const a = partsA.year * 10_000 + partsA.month * 100 + partsA.day;
    const b = partsB.year * 10_000 + partsB.month * 100 + partsB.day;
    return a - b;
  }
  return yearA - yearB;
}

export function validateFamousPersonDates(
  input: FamousPersonDatesInput,
): FamousPersonDatesValidationResult {
  const errors: string[] = [];
  const hasIsLiving = input.isLiving !== undefined && input.isLiving !== null;
  const isLiving = input.isLiving === true;

  const birthYearRaw = input.birthYear;
  const isBirthYearValid = typeof birthYearRaw === 'number' && Number.isInteger(birthYearRaw);
  const birthYear = isBirthYearValid ? birthYearRaw : null;

  if (birthYearRaw !== undefined && birthYearRaw !== null && !isBirthYearValid) {
    errors.push('Anno di nascita deve essere un numero intero valido.');
  } else if (birthYear == null) {
    errors.push('Anno di nascita obbligatorio.');
  }

  const birthDate =
    typeof input.birthDate === 'string' && input.birthDate.trim() ? input.birthDate.trim() : null;
  if (birthDate) {
    const parts = parseIsoDateParts(birthDate);
    if (!parts) {
      errors.push('Data di nascita non valida (atteso YYYY-MM-DD).');
    } else if (birthYear != null && parts.year !== birthYear) {
      errors.push('Anno di nascita non coerente con la data di nascita.');
    }
  }

  const deathYearRaw = input.deathYear;
  const isDeathYearValid = typeof deathYearRaw === 'number' && Number.isInteger(deathYearRaw);
  const deathYear = isDeathYearValid ? deathYearRaw : null;

  if (deathYearRaw !== undefined && deathYearRaw !== null && !isDeathYearValid) {
    errors.push('Anno di morte deve essere un numero intero valido.');
  }

  const deathDate =
    typeof input.deathDate === 'string' && input.deathDate.trim() ? input.deathDate.trim() : null;

  if (!hasIsLiving) {
    errors.push('Stato in vita o deceduto non specificato.');
  } else if (isLiving) {
    if (deathYear != null || deathDate) {
      errors.push('Un personaggio vivente non può avere data o anno di morte.');
    }
  } else {
    if (deathYearRaw == null) {
      errors.push('Anno di morte obbligatorio per un personaggio non vivente.');
    }
    if (deathDate) {
      const parts = parseIsoDateParts(deathDate);
      if (!parts) {
        errors.push('Data di morte non valida (atteso YYYY-MM-DD).');
      } else if (deathYear != null && parts.year !== deathYear) {
        errors.push('Anno di morte non coerente con la data di morte.');
      }
    }
  }

  if (hasIsLiving && !isLiving && birthYear != null && deathYear != null) {
    if (compareEndpoints(birthYear, birthDate, deathYear, deathDate) > 0) {
      errors.push('La morte non può precedere la nascita.');
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true };
}
