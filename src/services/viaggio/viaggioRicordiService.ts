import { supabase } from '../supabaseClient';
import type { Database } from '@/types/supabase';
import type {
  ViaggioRicordoDayNote,
  ViaggioRicordoMedia,
  ViaggioRicordoMediaKind,
} from '@/types/models/ViaggioRicordi';

const RICORDI_BUCKET = 'viaggio-ricordi';

/** Sentinel colonna legacy `day_key` quando non ci sono link giorno. */
const DAY_KEY_UNASSIGNED = '_unassigned';

type RicordiMediaRow = Database['public']['Tables']['viaggio_ricordi_media']['Row'];
type RicordiDayNoteRow = Database['public']['Tables']['viaggio_ricordi_day_notes']['Row'];
type DayLinkRow = Database['public']['Tables']['viaggio_ricordi_media_day_links']['Row'];

const PHOTO_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const VIDEO_MIME = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

function parseMediaKind(kind: string): ViaggioRicordoMediaKind {
  if (kind === 'photo' || kind === 'video') return kind;
  throw new Error(`Kind Ricordi non valido: ${kind}`);
}

function mapMediaRow(row: RicordiMediaRow, dayKeys: string[]): ViaggioRicordoMedia {
  const keys =
    dayKeys.length > 0
      ? dayKeys
      : row.day_key === DAY_KEY_UNASSIGNED
        ? []
        : [row.day_key];
  return {
    id: row.id,
    viaggioId: row.viaggio_id,
    userId: row.user_id,
    kind: parseMediaKind(row.kind),
    dayKey: keys[0] ?? row.day_key,
    dayKeys: keys,
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

/** ISO YYYY-MM-DD lexical OK; d0..dN numeric (evita d10 < d2). */
function compareDayKeys(a: string, b: string): number {
  const ma = /^d(\d+)$/.exec(a);
  const mb = /^d(\d+)$/.exec(b);
  if (ma && mb) return Number(ma[1]) - Number(mb[1]);
  return a < b ? -1 : a > b ? 1 : 0;
}

function sortDayKeys(keys: string[]): string[] {
  return [...new Set(keys)].sort(compareDayKeys);
}

/** Literal PostgREST per `.not(col, 'in', …)` — es. `("a","b")`. */
function buildPostgrestInListLiteral(values: string[]): string {
  return `(${values.map((k) => `"${k.replace(/"/g, '')}"`).join(',')})`;
}

function groupLinksByMedia(links: DayLinkRow[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const link of links) {
    const prev = map.get(link.media_id) ?? [];
    prev.push(link.day_key);
    map.set(link.media_id, prev);
  }
  for (const [id, keys] of map) {
    map.set(id, sortDayKeys(keys));
  }
  return map;
}

async function loadDayLinksForMediaIds(mediaIds: string[]): Promise<Map<string, string[]>> {
  if (mediaIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from('viaggio_ricordi_media_day_links')
    .select('*')
    .in('media_id', mediaIds);
  if (error) {
    console.error('[viaggioRicordiService] loadDayLinks:', error.message);
    throw new Error(error.message);
  }
  return groupLinksByMedia((data ?? []) as DayLinkRow[]);
}

/** Sync day_key primario sulla riga media (compatibilità storage / legacy). */
async function syncPrimaryDayKey(mediaId: string, dayKeys: string[]): Promise<void> {
  if (dayKeys.length === 0) return;
  const { error } = await supabase
    .from('viaggio_ricordi_media')
    .update({ day_key: dayKeys[0] })
    .eq('id', mediaId);
  if (error) {
    console.error('[viaggioRicordiService] syncPrimaryDayKey:', error.message);
    throw new Error(error.message);
  }
}

function sameDayKeySet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((k) => setB.has(k));
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
  const rows = data ?? [];
  const links = await loadDayLinksForMediaIds(rows.map((r) => r.id));
  return rows.map((row) => mapMediaRow(row, links.get(row.id) ?? []));
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
  /** Giorno di collegamento iniziale; se omesso → solo patrimonio viaggio (link dopo). */
  dayKey?: string | null;
  file: File;
  title?: string | null;
  coordsLat?: number | null;
  coordsLng?: number | null;
}): Promise<ViaggioRicordoMedia> {
  const kind = kindFromMime(params.file.type);
  if (!kind) {
    throw new Error('Formato non supportato. Usa foto (JPEG/PNG/WebP/GIF) o video (MP4/WebM/MOV).');
  }

  const folderKey = params.dayKey?.trim() || '_viaggio';
  const safeName = params.file.name.replace(/[^\w.\-]+/g, '_');
  const storagePath = `${params.userId}/${params.viaggioId}/${folderKey}/${crypto.randomUUID()}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(RICORDI_BUCKET)
    .upload(storagePath, params.file, { cacheControl: '3600', upsert: false });

  if (uploadError) {
    console.error('[viaggioRicordiService] upload:', uploadError.message);
    throw new Error(uploadError.message);
  }

  const primaryDay = params.dayKey?.trim() || DAY_KEY_UNASSIGNED;

  const { data, error } = await supabase
    .from('viaggio_ricordi_media')
    .insert({
      viaggio_id: params.viaggioId,
      user_id: params.userId,
      kind,
      day_key: primaryDay,
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

  const dayKeys = params.dayKey?.trim() ? [params.dayKey.trim()] : [];
  if (dayKeys.length > 0) {
    const { error: linkError } = await supabase.from('viaggio_ricordi_media_day_links').insert(
      dayKeys.map((day_key) => ({ media_id: data.id, day_key })),
    );
    if (linkError) {
      // Rollback completo: riga media + file storage (link non creati)
      await supabase.from('viaggio_ricordi_media').delete().eq('id', data.id);
      await supabase.storage.from(RICORDI_BUCKET).remove([storagePath]);
      console.error('[viaggioRicordiService] insert day link:', linkError.message);
      throw new Error(linkError.message);
    }
  }

  // dayKeys vuoto → mapMediaRow tratta DAY_KEY_UNASSIGNED come nessun link
  return mapMediaRow(data, dayKeys);
}

/**
 * Sostituisce i link giorno del media (contenuto invariato).
 * `dayKeys` vuoto = media solo nel patrimonio viaggio (nessun giorno).
 * Ordine: upsert desiderati → delete eccedenze (mai lasciare zero link se target non vuoto).
 */
export async function setRicordoMediaDayLinks(
  mediaId: string,
  dayKeys: string[],
): Promise<string[]> {
  const unique = sortDayKeys(dayKeys.map((k) => k.trim()).filter(Boolean));

  if (unique.length === 0) {
    const { error: delError } = await supabase
      .from('viaggio_ricordi_media_day_links')
      .delete()
      .eq('media_id', mediaId);
    if (delError) {
      console.error('[viaggioRicordiService] clear day links:', delError.message);
      throw new Error(delError.message);
    }
    await syncPrimaryDayKey(mediaId, [DAY_KEY_UNASSIGNED]);
    return [];
  }

  const { error: insError } = await supabase.from('viaggio_ricordi_media_day_links').upsert(
    unique.map((day_key) => ({ media_id: mediaId, day_key })),
    { onConflict: 'media_id,day_key', ignoreDuplicates: true },
  );
  if (insError) {
    console.error('[viaggioRicordiService] set day links upsert:', insError.message);
    throw new Error(insError.message);
  }

  const { error: delError } = await supabase
    .from('viaggio_ricordi_media_day_links')
    .delete()
    .eq('media_id', mediaId)
    .not('day_key', 'in', buildPostgrestInListLiteral(unique));
  if (delError) {
    console.error('[viaggioRicordiService] trim day links:', delError.message);
    throw new Error(delError.message);
  }

  await syncPrimaryDayKey(mediaId, unique);
  return unique;
}

/** Sposta: rimuove `fromDayKey` (se presente) e assicura `toDayKey`. */
export async function moveRicordoMediaDay(params: {
  media: ViaggioRicordoMedia;
  fromDayKey: string | null;
  toDayKey: string;
}): Promise<string[]> {
  const to = params.toDayKey.trim();
  if (!to) return params.media.dayKeys;

  const next = new Set(params.media.dayKeys);
  if (params.fromDayKey) next.delete(params.fromDayKey);
  next.add(to);
  const nextArr = [...next];
  if (sameDayKeySet(nextArr, params.media.dayKeys)) return params.media.dayKeys;

  return setRicordoMediaDayLinks(params.media.id, nextArr);
}

/** Aggiunge un giorno senza rimuovere gli altri (multi-giorno). */
export async function linkRicordoMediaToDay(
  media: ViaggioRicordoMedia,
  dayKey: string,
): Promise<string[]> {
  const key = dayKey.trim();
  if (!key || media.dayKeys.includes(key)) return media.dayKeys;
  return setRicordoMediaDayLinks(media.id, [...media.dayKeys, key]);
}

/** Rimuove solo il link al giorno; il media resta sul Viaggio. */
export async function unlinkRicordoMediaFromDay(
  media: ViaggioRicordoMedia,
  dayKey: string,
): Promise<string[]> {
  if (!media.dayKeys.includes(dayKey)) return media.dayKeys;
  return setRicordoMediaDayLinks(
    media.id,
    media.dayKeys.filter((k) => k !== dayKey),
  );
}

export async function deleteRicordoMedia(media: ViaggioRicordoMedia): Promise<void> {
  const { error } = await supabase.from('viaggio_ricordi_media').delete().eq('id', media.id);
  if (error) {
    console.error('[viaggioRicordiService] deleteRicordoMedia:', error.message);
    throw new Error(error.message);
  }
  // Best-effort storage: SoT è il DB (CASCADE sui link). File orfano solo se remove fallisce.
  const { error: storageError } = await supabase.storage
    .from(RICORDI_BUCKET)
    .remove([media.storagePath]);
  if (storageError) {
    console.error('[viaggioRicordiService] storage remove after delete:', storageError.message);
  }
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

export { filterRicordiMediaForScope } from './viaggioRicordiFilters';
