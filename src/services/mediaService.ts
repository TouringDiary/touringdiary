import { resolvePrimaryImagePublicUrlsForCityPeople } from '@/services/media/entityPrimaryImageReadService';
import { dataURLtoFile } from '../utils/common';
import { buildAssetUsageMap } from './media/assetUsageMapService';
import { supabase } from './supabaseClient';

const PUBLIC_BUCKET = 'public-media';

/** Cartelle legacy ammesse per upload/copy su public-media (esclude namespace MF4 Wikimedia/verified). */
const LEGACY_PUBLIC_MEDIA_ROOT_FOLDERS = new Set([
  'admin_assets',
  'admin_uploads',
  'ai_generated',
  'city_patron_gallery',
  'comms_assets',
  'edited',
  'edited_assets',
  'famous_person_photo_suggestions',
  'general',
  'onboarding_assets',
  'patron_photo_suggestions',
  'people_portraits',
  'shop_products',
  'social_templates',
  'viaggio_covers',
]);

/** Namespace object path MF4 — non copiabili/cancellabili via utility legacy. */
const MF4_PUBLIC_MEDIA_OBJECT_PREFIXES = ['verified/', 'wikimedia/'] as const;

function normalizeLegacyMediaFolder(folder: string): string {
  return folder.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
}

function hasSafeObjectPathSegments(objectPath: string): boolean {
  if (!objectPath || objectPath.includes('\\')) return false;
  const segments = objectPath.split('/');
  return !segments.some((segment) => segment.length === 0 || segment === '.' || segment === '..');
}

function isMf4ManagedPublicMediaObjectPath(objectPath: string): boolean {
  return MF4_PUBLIC_MEDIA_OBJECT_PREFIXES.some((prefix) => objectPath.startsWith(prefix));
}

function isLegacyPublicMediaObjectPath(objectPath: string): boolean {
  if (!hasSafeObjectPathSegments(objectPath)) return false;
  if (isMf4ManagedPublicMediaObjectPath(objectPath)) return false;
  const root = objectPath.split('/')[0] ?? '';
  return LEGACY_PUBLIC_MEDIA_ROOT_FOLDERS.has(root);
}

function isLegacyPublicMediaFolderAllowed(folder: string): boolean {
  const normalized = normalizeLegacyMediaFolder(folder);
  if (!normalized || normalized.includes('..')) return false;
  return isLegacyPublicMediaObjectPath(normalized);
}

function getConfiguredSupabaseOrigin(): string | null {
  const raw = import.meta.env.VITE_SUPABASE_URL;
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    return new URL(raw.trim()).origin;
  } catch {
    return null;
  }
}

/** Estrae object path public-media da URL Storage Supabase (fail-closed). */
function parsePublicMediaStorageObjectPathFromPublicUrl(url: string): string | null {
  const trimmed = url.trim();
  if (trimmed.includes('[') || trimmed.includes('](')) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;

  const expectedOrigin = getConfiguredSupabaseOrigin();
  if (!expectedOrigin) return null;
  if (parsed.origin !== expectedOrigin) return null;

  const storagePathPrefix = `/storage/v1/object/public/${PUBLIC_BUCKET}/`;
  if (!parsed.pathname.startsWith(storagePathPrefix)) return null;
  const relativePath = parsed.pathname.slice(storagePathPrefix.length);

  const path = decodeURIComponent(relativePath.replace(/^\/+/, ''));
  if (!path || !hasSafeObjectPathSegments(path)) return null;
  return path;
}

// --- (Keep existing upload/delete functions unchanged) ---
export const getPendingPhotoCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('photo_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    if (error) throw error;
    return count || 0;
  } catch {
    // Silenzia completamente gli errori di rete per i contatori background
    return 0;
  }
};

export type PublicMediaUploadResult = {
  publicUrl: string;
  storagePath: string;
};

export const publicMediaPathFromUrl = (url: string | null | undefined): string | null => {
  if (!url?.trim()) return null;
  const marker = `/object/public/${PUBLIC_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const path = decodeURIComponent(url.slice(idx + marker.length).split('?')[0]);
  return path || null;
};

/**
 * Upload legacy su public-media (path libero sotto `folder/`).
 * Non esegue verifica licenza, pipeline MF4, assignment né lifecycle media_assets.
 */
export const uploadPublicMediaDetailed = async (
  file: File,
  folder: string = 'general',
): Promise<PublicMediaUploadResult | null> => {
  try {
    const normalizedFolder = normalizeLegacyMediaFolder(folder);
    if (!isLegacyPublicMediaFolderAllowed(normalizedFolder)) {
      console.error(
        '[mediaService] uploadPublicMediaDetailed blocked: folder non legacy o namespace MF4:',
        folder,
      );
      return null;
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const filePath = `${normalizedFolder}/${timestamp}_${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from(PUBLIC_BUCKET)
      .upload(filePath, file, { cacheControl: '3600', upsert: false });
    if (uploadError) throw uploadError;
    const {
      data: { publicUrl },
    } = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(filePath);
    return { publicUrl, storagePath: filePath };
  } catch {
    return null;
  }
};

/** Rimuove un file da `public-media` per path Patrono gallery / segnalazioni / Famous Person suggestions. */
export const deletePublicMediaByStoragePath = async (
  storagePath: string | null | undefined,
): Promise<boolean> => {
  if (!storagePath?.trim()) return false;
  const path = storagePath.trim();
  if (!hasSafeObjectPathSegments(path)) return false;
  if (
    !path.startsWith('city_patron_gallery/') &&
    !path.startsWith('patron_photo_suggestions/') &&
    !path.startsWith('famous_person_photo_suggestions/')
  ) {
    return false;
  }
  try {
    const { error } = await supabase.storage.from(PUBLIC_BUCKET).remove([path]);
    if (error) {
      console.error('[mediaService] deletePublicMediaByStoragePath failed:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[mediaService] deletePublicMediaByStoragePath error:', e);
    return false;
  }
};

/**
 * Copia un file dentro `public-media` (es. suggestion → gallery ufficiale).
 * Utility storage legacy: nessuna verifica MF4, provenance o verified_real.
 */
export const copyPublicMediaToFolder = async (
  sourceStoragePath: string,
  destFolder: string,
): Promise<PublicMediaUploadResult | null> => {
  try {
    const sourcePath = sourceStoragePath.trim();
    if (!isLegacyPublicMediaObjectPath(sourcePath)) {
      console.error(
        '[mediaService] copyPublicMediaToFolder blocked: source path non legacy o namespace MF4:',
        sourceStoragePath,
      );
      return null;
    }
    const normalizedDestFolder = normalizeLegacyMediaFolder(destFolder);
    if (!isLegacyPublicMediaFolderAllowed(normalizedDestFolder)) {
      console.error(
        '[mediaService] copyPublicMediaToFolder blocked: dest folder non legacy o namespace MF4:',
        destFolder,
      );
      return null;
    }
    const fileName = sourcePath.split('/').pop();
    if (!fileName) return null;
    const destPath = `${normalizedDestFolder}/${Date.now()}_${fileName.replace(/^\d+_/, '')}`;

    const { error: copyError } = await supabase.storage
      .from(PUBLIC_BUCKET)
      .copy(sourcePath, destPath);

    if (copyError) {
      const { data: blob, error: downloadError } = await supabase.storage
        .from(PUBLIC_BUCKET)
        .download(sourcePath);
      if (downloadError || !blob) return null;
      const { error: uploadError } = await supabase.storage
        .from(PUBLIC_BUCKET)
        .upload(destPath, blob, { cacheControl: '3600', upsert: false });
      if (uploadError) return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(destPath);
    return { publicUrl, storagePath: destPath };
  } catch (e) {
    console.error('[mediaService] copyPublicMediaToFolder error:', e);
    return null;
  }
};

export const uploadPublicMedia = async (
  file: File,
  folder: string = 'general',
): Promise<string | null> => {
  const result = await uploadPublicMediaDetailed(file, folder);
  return result?.publicUrl ?? null;
};

export const uploadBase64PublicMedia = async (
  base64Data: string,
  folder: string = 'edited',
): Promise<string | null> => {
  try {
    const fileName = `edited_${Date.now()}.jpg`;
    const file = dataURLtoFile(base64Data, fileName);
    return await uploadPublicMedia(file, folder);
  } catch {
    return null;
  }
};

/**
 * Elimina un file da `public-media` a partire dall'URL pubblico.
 * Solo path sotto `admin_assets/` (Asset Globali). URL esterni / default → no-op.
 * Non tocca photo_submissions (i Placeholder non appartengono al dominio Photo).
 */
export const deleteAdminAssetByUrl = async (url: string | null | undefined): Promise<boolean> => {
  if (!url?.trim()) return false;

  try {
    const path = parsePublicMediaStorageObjectPathFromPublicUrl(url);
    if (!path?.startsWith('admin_assets/')) return false;
    if (!hasSafeObjectPathSegments(path)) return false;
    if (!isLegacyPublicMediaObjectPath(path)) return false;

    const { error } = await supabase.storage.from(PUBLIC_BUCKET).remove([path]);
    if (error) {
      console.error('[mediaService] deleteAdminAssetByUrl failed:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[mediaService] deleteAdminAssetByUrl error:', e);
    return false;
  }
};

// --- FIX LIKE LOGIC: ABSOLUTE COUNT RECALCULATION ---

// FUNZIONI DI LIKE RIMOSSE -> SPOSTATE IN photoService.ts ED ESEGUITE VIA RPC

type PortraitCandidateRow = {
  name: string;
  order_index: number | null;
  id: string;
};

function escapeIlikeExactLiteral(value: string): string {
  return value.replace(/[%_\\]/g, (char) => `\\${char}`);
}

function portraitUrlQualityScore(publicUrl: string): number {
  let score = 0;
  if (publicUrl.includes('people_portraits/')) score += 4;
  if (publicUrl.includes('/object/public/public-media/')) score += 2;
  if (!publicUrl.includes('ui-avatars.com')) score += 1;
  return score;
}

function isPortraitCandidateRow(value: unknown): value is PortraitCandidateRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    typeof row.name === 'string' &&
    (row.order_index === null || typeof row.order_index === 'number')
  );
}

/**
 * Cerca un ritratto esistente per persona **nella stessa città** (MF5 §36.8 / Appendice C A5).
 * Ordine deterministico: qualità URL → order_index asc → id asc (match esatto nome, stessa città).
 * Non attesta verifica licenza/provenance MF4.
 */
export const findExistingPortrait = async (
  personName: string,
  cityId: string,
): Promise<string | null> => {
  const trimmedName = personName.trim();
  const trimmedCityId = cityId.trim();
  if (!trimmedName || !trimmedCityId) return null;

  try {
    const { data, error } = await supabase
      .from('city_people')
      .select('name, order_index, id')
      .eq('city_id', trimmedCityId)
      .ilike('name', escapeIlikeExactLiteral(trimmedName))
      .order('order_index', { ascending: true })
      .order('id', { ascending: true })
      .limit(25);

    if (error) throw error;

    const normalizedName = trimmedName.toLowerCase();
    const candidates: PortraitCandidateRow[] = [];
    for (const row of data ?? []) {
      if (!isPortraitCandidateRow(row)) continue;
      if (row.name.trim().toLowerCase() !== normalizedName) continue;
      candidates.push(row);
    }

    if (candidates.length === 0) return null;

    const urlByEntityId = await resolvePrimaryImagePublicUrlsForCityPeople(
      trimmedCityId,
      candidates.map((c) => c.id),
    );

    const withUrls = candidates
      .map((row) => {
        const url = urlByEntityId.get(row.id)?.trim() ?? '';
        if (!url || url.includes('ui-avatars.com')) return null;
        return { row, url };
      })
      .filter((entry): entry is { row: PortraitCandidateRow; url: string } => entry !== null);

    if (withUrls.length === 0) return null;

    withUrls.sort((a, b) => {
      const scoreDiff = portraitUrlQualityScore(b.url) - portraitUrlQualityScore(a.url);
      if (scoreDiff !== 0) return scoreDiff;
      const aOrder = typeof a.row.order_index === 'number' ? a.row.order_index : 0;
      const bOrder = typeof b.row.order_index === 'number' ? b.row.order_index : 0;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.row.id.localeCompare(b.row.id);
    });

    return withUrls[0].url;
  } catch (e) {
    console.error('Error finding existing portrait:', e);
    return null;
  }
};

/**
 * Mappa utilizzo asset: assignment-based (POST-MF5 SoT).
 * Preferire `mediaCatalogService` per catalogo paginato MF4.
 */
export const getAssetUsageMap = async (): Promise<Record<string, string[]>> => {
  return buildAssetUsageMap();
};
