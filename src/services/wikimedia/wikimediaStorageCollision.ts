/**
 * Identità di un oggetto Wikimedia già indirizzato per hash.
 * Il contenuto è lo stesso solo se lo SHA-256 dei byte coincide.
 * Dimensione e MIME restano fatti da mostrare, non un secondo criterio di uguaglianza.
 */

export type WikimediaStorageContentRelation = 'absent' | 'identical' | 'different';

export function classifyWikimediaStorageContent(
  incomingContentHash: string,
  existingContentHash: string | null,
): WikimediaStorageContentRelation {
  if (!existingContentHash) return 'absent';
  return existingContentHash.toLowerCase() === incomingContentHash.toLowerCase()
    ? 'identical'
    : 'different';
}

/**
 * L'import automatico assegna solo il percorso CC BY 4.0.
 * La scelta Admin «usa l'asset già presente» usa lo stesso assignment, senza promuovere lo stato.
 */
export function shouldAssignWikimediaAsset(input: {
  autoPath: boolean;
  assignToEntity: boolean;
  adminReuse: boolean;
}): boolean {
  if (!input.assignToEntity) return false;
  return input.autoPath || input.adminReuse;
}

export function formatByteLength(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) return `${kilobytes.toFixed(1)} KB`;
  return `${(kilobytes / 1024).toFixed(1)} MB`;
}
