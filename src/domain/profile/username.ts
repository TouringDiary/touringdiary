/** Regole Nome utente (§10.1) — corrispondenza tecnica con profiles.slug */

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_-]*[a-z0-9]$|^[a-z0-9]$/;

export function normalizeUsernameToSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '');
}

export function validateUsernameFormat(raw: string): string | null {
  const slug = normalizeUsernameToSlug(raw);

  if (!slug) {
    return 'Inserisci un Nome utente valido.';
  }
  if (slug.length < USERNAME_MIN_LENGTH) {
    return `Il Nome utente deve avere almeno ${USERNAME_MIN_LENGTH} caratteri.`;
  }
  if (slug.length > USERNAME_MAX_LENGTH) {
    return `Il Nome utente non può superare ${USERNAME_MAX_LENGTH} caratteri.`;
  }
  if (!USERNAME_PATTERN.test(slug)) {
    return 'Usa solo lettere minuscole, numeri, trattini e underscore.';
  }
  return null;
}

export function userNeedsUsername(slug: string | undefined | null): boolean {
  return !slug?.trim();
}
