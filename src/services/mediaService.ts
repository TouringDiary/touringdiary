import { dataURLtoFile } from '../utils/common';
// FIX: Import diretti per evitare cicli
import { fetchGlobalCityMediaInfo } from './city/cityReadService';
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
  if (expectedOrigin && parsed.origin !== expectedOrigin) return null;

  const storagePathPrefix = `/storage/v1/object/public/${PUBLIC_BUCKET}/`;
  let relativePath: string;
  if (parsed.pathname.startsWith(storagePathPrefix)) {
    relativePath = parsed.pathname.slice(storagePathPrefix.length);
  } else {
    const marker = `/object/public/${PUBLIC_BUCKET}/`;
    const markerIndex = trimmed.indexOf(marker);
    if (markerIndex === -1) return null;
    relativePath = trimmed.slice(markerIndex + marker.length).split('?')[0];
  }

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

/**
 * Cerca un ritratto esistente per una persona famosa (recovery legacy URL).
 * Il risultato non attesta verifica licenza/provenance MF4.
 */
export const findExistingPortrait = async (personName: string): Promise<string | null> => {
  try {
    // Cerca nella tabella city_people se esiste già un record per questa persona con una foto valida
    const { data } = await supabase
      .from('city_people')
      .select('image_url')
      .ilike('name', personName)
      .neq('image_url', '')
      .not('image_url', 'is', null)
      .limit(1);

    if (data && data.length > 0) {
      const url = data[0].image_url;
      // Filtra placeholder noti e avatar di default generici se non si vuole riusarli
      if (url && !url.includes('ui-avatars')) {
        return url;
      }
    }

    return null;
  } catch (e) {
    console.error('Error finding existing portrait:', e);
    return null;
  }
};

/**
 * Costruisce una mappa di utilizzo degli asset (immagini) nel database.
 * Chiave: URL immagine (normalizzato) -> Valore: Array di stringhe che descrivono dove è usata.
 *
 * @deprecated Preferire `mediaCatalogService.listMediaCatalogPage` + assignment drill-down (MF4).
 * Resta per overlay tab Storage legacy e compatibilità URL-only fino a cutover MF5.
 * Non è una garanzia transazionale di usage/lifecycle MF4 (solo best-effort URL matching).
 */
export const getAssetUsageMap = async (): Promise<Record<string, string[]>> => {
  const usageMap: Record<string, string[]> = {};

  const addToMap = (url: string | null | undefined, context: string) => {
    if (!url) return;
    const cleanUrl = url.split('?')[0].trim();
    if (!usageMap[cleanUrl]) usageMap[cleanUrl] = [];
    if (!usageMap[cleanUrl].includes(context)) usageMap[cleanUrl].push(context);
  };

  try {
    // 1. Cities (Hero, Card, Gallery) - BOUNDARY RECOVERY
    const cityMediaInfos = await fetchGlobalCityMediaInfo();
    for (const info of cityMediaInfos) {
      addToMap(info.imageUrl, `City Card: ${info.name}`);
      addToMap(info.heroImage, `City Hero: ${info.name}`);
      for (const asset of info.gallery) {
        addToMap(asset.url, `City Gallery: ${info.name}`);
      }
    }

    // 2. POIs
    const { data: pois } = await supabase.from('pois').select('name, image_url');
    for (const poi of pois ?? []) {
      addToMap(poi.image_url, `POI: ${poi.name}`);
    }

    // 3. People
    const { data: people } = await supabase.from('city_people').select('name, image_url');
    for (const person of people ?? []) {
      addToMap(person.image_url, `Person: ${person.name}`);
    }

    // 4. Shops
    const { data: shops } = await supabase.from('shops').select('name, image_url');
    for (const shop of shops ?? []) {
      addToMap(shop.image_url, `Shop: ${shop.name}`);
    }

    // 5. Events & Guides
    const { data: events } = await supabase.from('city_events').select('name, image_url');
    for (const event of events ?? []) {
      addToMap(event.image_url, `Event: ${event.name}`);
    }

    const { data: guides } = await supabase.from('city_guides').select('name, image_url');
    for (const guide of guides ?? []) {
      addToMap(guide.image_url, `Guide: ${guide.name}`);
    }

    // 6. Social Templates
    const { data: templates } = await supabase.from('social_templates').select('name, bg_url');
    for (const template of templates ?? []) {
      addToMap(template.bg_url, `Template: ${template.name}`);
    }
  } catch (e) {
    console.error('Error building asset usage map:', e);
  }

  return usageMap;
};
