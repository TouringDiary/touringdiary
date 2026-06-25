const ITALIAN_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
};

const ITALIAN_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
};

/** Data e ora in formato italiano compatto, es. 24/06/2026 09:38 */
export function formatItalianDateTime(value: string | number | Date): string {
  return new Date(value)
    .toLocaleString('it-IT', ITALIAN_DATE_TIME_OPTIONS)
    .replace(',', '');
}

/** Solo ora in formato italiano, es. 09:38 */
export function formatItalianTime(value: string | number | Date): string {
  return new Date(value).toLocaleTimeString('it-IT', ITALIAN_TIME_OPTIONS);
}
