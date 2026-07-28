import { uploadPublicMedia } from '@/services/mediaService';
import { updateViaggio } from '@/services/viaggio/viaggioService';
import type { Viaggio } from '@/types/models/Viaggio';

/** Upload cover Viaggio (identità, non Ricordo) → public-media + update cover_image. */
export async function uploadViaggioCover(params: {
  userId: string;
  viaggioId: string;
  file: File;
}): Promise<Viaggio> {
  const url = await uploadPublicMedia(params.file, `viaggio_covers/${params.userId}`);
  if (!url) throw new Error('[viaggioCoverService] upload fallito');
  return updateViaggio(params.viaggioId, { coverImage: url });
}

export async function clearViaggioCover(viaggioId: string): Promise<Viaggio> {
  return updateViaggio(viaggioId, { coverImage: null });
}
