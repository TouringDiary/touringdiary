/** Validazione MIME e firma file per allegati workspace (§12.6). */

export interface AllowedFileType {
  mime: string;
  extensions: string[];
  /** Primi byte attesi (firma). Vuoto = solo MIME dichiarato + estensione. */
  signature?: number[];
}

export const WORKSPACE_ATTACHMENT_ALLOWED_TYPES: AllowedFileType[] = [
  { mime: 'application/pdf', extensions: ['pdf'], signature: [0x25, 0x50, 0x44, 0x46] },
  {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extensions: ['docx'],
    signature: [0x50, 0x4b, 0x03, 0x04],
  },
  {
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extensions: ['xlsx'],
    signature: [0x50, 0x4b, 0x03, 0x04],
  },
  {
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    extensions: ['pptx'],
    signature: [0x50, 0x4b, 0x03, 0x04],
  },
  { mime: 'application/msword', extensions: ['doc'], signature: [0xd0, 0xcf, 0x11, 0xe0] },
  { mime: 'application/vnd.ms-excel', extensions: ['xls'], signature: [0xd0, 0xcf, 0x11, 0xe0] },
  { mime: 'image/jpeg', extensions: ['jpg', 'jpeg'], signature: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', extensions: ['png'], signature: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/webp', extensions: ['webp'], signature: [0x52, 0x49, 0x46, 0x46] },
  { mime: 'image/gif', extensions: ['gif'], signature: [0x47, 0x49, 0x46] },
];

function readFileHeader(file: File, length: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(reader.result));
      } else {
        reject(new Error('Lettura file non riuscita.'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('Lettura file non riuscita.'));
    reader.readAsArrayBuffer(file.slice(0, length));
  });
}

function matchesSignature(header: Uint8Array, signature: number[]): boolean {
  if (header.length < signature.length) return false;
  return signature.every((byte, index) => header[index] === byte);
}

function extensionOf(fileName: string): string {
  const parts = fileName.toLowerCase().split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

export async function validateWorkspaceAttachmentFile(
  file: File
): Promise<{ ok: true; mimeType: string } | { ok: false; error: string }> {
  const ext = extensionOf(file.name);
  const candidates = WORKSPACE_ATTACHMENT_ALLOWED_TYPES.filter((type) =>
    type.extensions.includes(ext)
  );

  if (candidates.length === 0) {
    return { ok: false, error: 'Tipo di file non consentito per gli allegati workspace.' };
  }

  const maxSigLen = Math.max(...candidates.map((c) => c.signature?.length ?? 0), 12);
  const header = await readFileHeader(file, maxSigLen);

  const matched = candidates.find((type) => {
    if (!type.signature || type.signature.length === 0) return true;
    return matchesSignature(header, type.signature);
  });

  if (!matched) {
    return {
      ok: false,
      error: 'Il contenuto del file non corrisponde al tipo dichiarato.',
    };
  }

  return { ok: true, mimeType: matched.mime };
}
