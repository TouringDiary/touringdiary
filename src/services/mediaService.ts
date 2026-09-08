import { dataURLtoFile } from '../utils/common';
// FIX: Import diretti per evitare cicli
import { fetchGlobalCityMediaInfo } from './city/cityReadService';
import { supabase } from './supabaseClient';

const PUBLIC_BUCKET = 'public-media';

// --- (Keep existing upload/delete functions unchanged) ---
export const getPendingPhotoCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('photo_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    if (error) throw error;
    return count || 0;
  } catch (e: unknown) {
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

export const uploadPublicMediaDetailed = async (
  file: File,
  folder: string = 'general',
): Promise<PublicMediaUploadResult | null> => {
  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const filePath = `${folder}/${timestamp}_${safeName}`;
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

/** Copia un file dentro `public-media` (es. suggestion → gallery ufficiale). */
export const copyPublicMediaToFolder = async (
  sourceStoragePath: string,
  destFolder: string,
): Promise<PublicMediaUploadResult | null> => {
  try {
    const fileName = sourceStoragePath.split('/').pop();
    if (!fileName) return null;
    const destPath = `${destFolder.replace(/\/$/, '')}/${Date.now()}_${fileName.replace(/^\d+_/, '')}`;

    const { error: copyError } = await supabase.storage
      .from(PUBLIC_BUCKET)
      .copy(sourceStoragePath, destPath);

    if (copyError) {
      const { data: blob, error: downloadError } = await supabase.storage
        .from(PUBLIC_BUCKET)
        .download(sourceStoragePath);
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
  } catch (e) {
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
    const marker = `/object/public/${PUBLIC_BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return false;

    const path = decodeURIComponent(url.slice(idx + marker.length).split('?')[0]);
    if (!path || !path.startsWith('admin_assets/')) return false;

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
 * Cerca un ritratto esistente per una persona famosa (es. recupero dopo cancellazione)
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
    cityMediaInfos.forEach((info) => {
      addToMap(info.imageUrl, `City Card: ${info.name}`);
      addToMap(info.heroImage, `City Hero: ${info.name}`);
      info.gallery.forEach((asset) => addToMap(asset.url, `City Gallery: ${info.name}`));
    });

    // 2. POIs
    const { data: pois } = await supabase.from('pois').select('name, image_url');
    pois?.forEach((p) => {
      addToMap(p.image_url, `POI: ${p.name}`);
    });

    // 3. People
    const { data: people } = await supabase.from('city_people').select('name, image_url');
    people?.forEach((p) => {
      addToMap(p.image_url, `Person: ${p.name}`);
    });

    // 4. Shops
    const { data: shops } = await supabase.from('shops').select('name, image_url');
    shops?.forEach((s) => {
      addToMap(s.image_url, `Shop: ${s.name}`);
    });

    // 5. Events & Guides
    const { data: events } = await supabase.from('city_events').select('name, image_url');
    events?.forEach((e) => addToMap(e.image_url, `Event: ${e.name}`));

    const { data: guides } = await supabase.from('city_guides').select('name, image_url');
    guides?.forEach((g) => addToMap(g.image_url, `Guide: ${g.name}`));

    // 6. Social Templates
    const { data: templates } = await supabase.from('social_templates').select('name, bg_url');
    templates?.forEach((t) => addToMap(t.bg_url, `Template: ${t.name}`));
  } catch (e) {
    console.error('Error building asset usage map:', e);
  }

  return usageMap;
};
