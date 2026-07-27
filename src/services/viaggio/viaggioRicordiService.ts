import { supabase } from '../supabaseClient';
import type { Database } from '@/types/supabase';
import type {
  ViaggioRicordoDayNote,
  ViaggioRicordoMedia,
  ViaggioRicordoMediaKind,
} from '@/types/models/ViaggioRicordi';

const RICORDI_BUCKET = 'viaggio-ricordi';

type RicordiMediaRow = Database['public']['Tables']['viaggio_ricordi_media']['Row'];
type RicordiDayNoteRow = Database['public']['Tables']['viaggio_ricordi_day_notes']['Row'];

const PHOTO_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const VIDEO_MIME = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

function parseMediaKind(kind: string): ViaggioRicordoMediaKind {
  if (kind === 'photo' || kind === 'video') return kind;
  throw new Error(`Kind Ricordi non valido: ${kind}`);
}

function mapMediaRow(row: RicordiMediaRow): ViaggioRicordoMedia {
  return {
    id: row.id,
    viaggioId: row.viaggio_id,
    userId: row.user_id,
    kind: parseMediaKind(row.kind),
    dayKey: row.day_key,
    title: row.title,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes) || 0,
    coordsLat: row.coords_lat,
    coordsLng: row.coords_lng,
    createdAt: row.created_at,
  };
}

function mapNoteRow(row: RicordiDayNoteRow): ViaggioRicordoDayNote {
  return {
    id: row.id,
    viaggioId: row.viaggio_id,
    userId: row.user_id,
    dayKey: row.day_key,
    body: row.body ?? '',
    updatedAt: row.updated_at,
  };
}

function kindFromMime(mime: string): ViaggioRicordoMediaKind | null {
  if (PHOTO_MIME.has(mime)) return 'photo';
  if (VIDEO_MIME.has(mime)) return 'video';
  return null;
}

export async function listRicordiMediaByViaggio(viaggioId: string): Promise<ViaggioRicordoMedia[]> {
  const { data, error } = await supabase
    .from('viaggio_ricordi_media')
    .select('*')
    .eq('viaggio_id', viaggioId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[viaggioRicordiService] listRicordiMediaByViaggio:', error.message);
    throw new Error(error.message);
  }
  return (data ?? []).map(mapMediaRow);
}

export async function listRicordiDayNotesByViaggio(viaggioId: string): Promise<ViaggioRicordoDayNote[]> {
  const { data, error } = await supabase
    .from('viaggio_ricordi_day_notes')
    .select('*')
    .eq('viaggio_id', viaggioId);

  if (error) {
    console.error('[viaggioRicordiService] listRicordiDayNotesByViaggio:', error.message);
    throw new Error(error.message);
  }
  return (data ?? []).map(mapNoteRow);
}

export async function upsertRicordiDayNote(params: {
  viaggioId: string;
  userId: string;
  dayKey: string;
  body: string;
}): Promise<ViaggioRicordoDayNote> {
  const { data, error } = await supabase
    .from('viaggio_ricordi_day_notes')
    .upsert(
      {
        viaggio_id: params.viaggioId,
        user_id: params.userId,
        day_key: params.dayKey,
        body: params.body,
      },
      { onConflict: 'viaggio_id,day_key' },
    )
    .select('*')
    .single();

  if (error || !data) {
    console.error('[viaggioRicordiService] upsertRicordiDayNote:', error?.message);
    throw new Error(error?.message ?? 'Salvataggio nota Ricordi non riuscito.');
  }
  return mapNoteRow(data);
}

export async function uploadRicordoMedia(params: {
  viaggioId: string;
  userId: string;
  dayKey: string;
  file: File;
  title?: string | null;
  coordsLat?: number | null;
  coordsLng?: number | null;
}): Promise<ViaggioRicordoMedia> {
  const kind = kindFromMime(params.file.type);
  if (!kind) {
    throw new Error('Formato non supportato. Usa foto (JPEG/PNG/WebP/GIF) o video (MP4/WebM/MOV).');
  }

  const safeName = params.file.name.replace(/[^\w.\-]+/g, '_');
  const storagePath = `${params.userId}/${params.viaggioId}/${params.dayKey}/${crypto.randomUUID()}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(RICORDI_BUCKET)
    .upload(storagePath, params.file, { cacheControl: '3600', upsert: false });

  if (uploadError) {
    console.error('[viaggioRicordiService] upload:', uploadError.message);
    throw new Error(uploadError.message);
  }

  const { data, error } = await supabase
    .from('viaggio_ricordi_media')
    .insert({
      viaggio_id: params.viaggioId,
      user_id: params.userId,
      kind,
      day_key: params.dayKey,
      title: params.title ?? params.file.name,
      storage_path: storagePath,
      mime_type: params.file.type,
      size_bytes: params.file.size,
      coords_lat: params.coordsLat ?? null,
      coords_lng: params.coordsLng ?? null,
    })
    .select('*')
    .single();

  if (error || !data) {
    await supabase.storage.from(RICORDI_BUCKET).remove([storagePath]);
    console.error('[viaggioRicordiService] insert media:', error?.message);
    throw new Error(error?.message ?? 'Salvataggio media non riuscito.');
  }
  return mapMediaRow(data);
}

export async function deleteRicordoMedia(media: ViaggioRicordoMedia): Promise<void> {
  const { error } = await supabase.from('viaggio_ricordi_media').delete().eq('id', media.id);
  if (error) {
    console.error('[viaggioRicordiService] deleteRicordoMedia:', error.message);
    throw new Error(error.message);
  }
  await supabase.storage.from(RICORDI_BUCKET).remove([media.storagePath]);
}

export async function createSignedRicordoMediaUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(RICORDI_BUCKET)
    .createSignedUrl(storagePath, 60 * 60);
  if (error) {
    console.error('[viaggioRicordiService] signedUrl:', error.message);
    return null;
  }
  return data?.signedUrl ?? null;
}
