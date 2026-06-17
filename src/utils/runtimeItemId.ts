/** Prefissi ID item usati solo nel view-model runtime — mai persistiti su DB. */
const EPHEMERAL_ID_PREFIXES = ['composed-', 'seed-', 'draft-item-', 'guest-item-'] as const;

export function isEphemeralItemId(id: string | undefined | null): boolean {
  if (!id) return false;
  return EPHEMERAL_ID_PREFIXES.some((prefix) => id.startsWith(prefix));
}
