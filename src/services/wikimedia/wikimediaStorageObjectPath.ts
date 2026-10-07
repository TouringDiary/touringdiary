/**
 * Path oggetto Wikimedia in `public-media`.
 *
 * Il suffisso è solo l'estensione del MIME dei byte.
 * Il titolo Commons (`File:Nome.ext`) entra nello stelo senza la propria estensione,
 * così il path non diventa `Nome.jpg.jpg`.
 */

const STEM_MAX = 80;

export function extensionForImageMime(mime: string): string {
  switch (mime) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'jpg';
  }
}

export function buildWikimediaStorageObjectPath(input: {
  folder: string;
  qid: string;
  contentHash: string;
  commonsFileTitle: string;
  mime: string;
  /** Default 32. 64 solo per un nuovo asset quando il path canonico è occupato da byte diversi. */
  contentHashLength?: number;
}): string {
  const safeQid = input.qid.replace(/[^a-zA-Z0-9]/g, '');
  const sanitized = input.commonsFileTitle.replace(/^File:/i, '').replace(/[^a-zA-Z0-9._-]+/g, '_');
  const stem = (sanitized.replace(/\.[A-Za-z0-9]+$/, '') || 'file').slice(0, STEM_MAX);
  const ext = extensionForImageMime(input.mime);
  const hashLength = input.contentHashLength ?? 32;
  return `${input.folder}/${safeQid}/${input.contentHash.slice(0, hashLength)}_${stem}.${ext}`;
}
