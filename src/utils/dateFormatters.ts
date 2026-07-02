const ITALIAN_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};

const ITALIAN_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  ...ITALIAN_DATE_OPTIONS,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
};

const ITALIAN_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
};

const ITALIAN_TIME_WITH_SECONDS_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
};

/** Solo data in formato italiano, es. 24/06/2026 */
export function formatItalianDate(value: string | number | Date): string {
  return new Date(value).toLocaleDateString('it-IT', ITALIAN_DATE_OPTIONS);
}

/** Data e ora in formato italiano compatto, es. 24/06/2026 09:38 */
export function formatItalianDateTime(value: string | number | Date): string {
  return new Date(value)
    .toLocaleString('it-IT', ITALIAN_DATE_TIME_OPTIONS)
    .replace(',', '');
}

/** Data e ora in formato italiano con secondi, es. 24/06/2026 - 09:38:12 */
export function formatItalianDateTimeWithSeconds(value: string | number | Date): string {
  const date = new Date(value);
  const datePart = date.toLocaleDateString('it-IT', ITALIAN_DATE_OPTIONS);
  const timePart = date.toLocaleTimeString('it-IT', ITALIAN_TIME_WITH_SECONDS_OPTIONS);
  return `${datePart} - ${timePart}`;
}

/** Timestamp numerico valorizzato e non epoch (evita 01/01/1970 da `0`). */
export function isValidTimestamp(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/** Solo ora in formato italiano, es. 09:38 */
export function formatItalianTime(value: string | number | Date): string {
  return new Date(value).toLocaleTimeString('it-IT', ITALIAN_TIME_OPTIONS);
}

/** Solo ora in formato italiano con secondi, es. 09:38:12 */
export function formatItalianTimeWithSeconds(value: string | number | Date): string {
  return new Date(value).toLocaleTimeString('it-IT', ITALIAN_TIME_WITH_SECONDS_OPTIONS);
}
