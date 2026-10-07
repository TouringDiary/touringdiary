import { useEffect, useState } from 'react';
import { resolveCategoryPlaceholderUrl } from '@/domain/poi/resolvePoiDisplayImageUrl';
import { GEO_CONFIG } from '../constants/geoConfig';
import { generatePoiCoords } from '../services/ai';
import { getCorrectCategory } from '../services/ai/utils/taxonomyUtils';
import { getCategoryPlaceholders } from '../services/settingsService';
import type { AffiliateLinks, PointOfInterest } from '../types/index';
import {
  hasRequiredOpeningHours,
  isAdminOpeningHoursPristine,
  isAdminSubCategoryPristine,
  mapPoiToFormData,
  normalizePoiFormData,
  type PoiFormData,
} from '../types/write/poiForm';
import {
  parseStorageLocationFromPublicUrl,
  samePublicStorageObject,
} from '../utils/storagePathFromPublicUrl';

const placeholderUrlForCategory = (category: string): string | null =>
  resolveCategoryPlaceholderUrl({
    category,
    categoryPlaceholders: getCategoryPlaceholders(),
  }) ?? null;

/** URL del campo Admin: upload admin o link esterno digitato. Non la foto pubblica D-22. */
function adminOwnedImageUrl(url: string, category: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  const placeholder = placeholderUrlForCategory(category);
  if (placeholder && trimmed === placeholder) return '';
  const stored = parseStorageLocationFromPublicUrl(trimmed);
  if (stored?.storagePath) {
    const root = stored.storagePath.split('/')[0] ?? '';
    if (root === 'admin_uploads' || root === 'admin_assets') return trimmed;
    return '';
  }
  try {
    const protocol = new URL(trimmed).protocol;
    if (protocol === 'http:' || protocol === 'https:') return trimmed;
  } catch {
    return '';
  }
  return '';
}

function formFromPoi(poi: PointOfInterest | null): PoiFormData {
  const data = mapPoiToFormData(poi);
  return { ...data, imageUrl: adminOwnedImageUrl(data.imageUrl, data.category) };
}

export const usePoiForm = (poi: PointOfInterest | null, cityName?: string) => {
  const [formData, setFormData] = useState<PoiFormData>(formFromPoi(poi));
  const [initialState, setInitialState] = useState<string>('');
  const [isImageValid, setIsImageValid] = useState(true);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const data = formFromPoi(poi);
    setFormData(data);
    setInitialState(JSON.stringify(data));
  }, [poi]);

  const isDirty = JSON.stringify(formData) !== initialState;

  const releaseAdminImageUrl = (imageUrl: string) => {
    const target = imageUrl.trim();
    if (!target) return;
    setFormData((prev) =>
      samePublicStorageObject(prev.imageUrl, target)
        ? { ...prev, imageUrl: '', image_status: 'missing' }
        : prev,
    );
    setInitialState((raw) => {
      try {
        const parsed = JSON.parse(raw) as PoiFormData;
        if (!samePublicStorageObject(parsed.imageUrl, target)) return raw;
        return JSON.stringify({ ...parsed, imageUrl: '', image_status: 'missing' });
      } catch {
        return raw;
      }
    });
  };

  const updateField = <K extends keyof PoiFormData>(field: K, value: PoiFormData[K]) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // --- AUTOMAZIONE TASSONOMIA ---
      if (field === 'subCategory') {
        newData.subCategoryEdited = true;
      }
      if (field === 'openingHours') {
        newData.openingHoursEdited = true;
      }

      if (field === 'subCategory' && typeof value === 'string') {
        const autoCategory = getCorrectCategory(value, prev.category, prev.name);

        if (autoCategory !== prev.category) {
          newData.category = autoCategory as PointOfInterest['category'];
        }
      }

      // --- AUTOMAZIONE PREZZO (FIX: Piazze/Chiese a 1 Euro) ---
      if (field === 'category' && typeof value === 'string') {
        const newCat = value;

        if (newCat === 'monument' || newCat === 'nature' || newCat === 'discovery') {
          newData.priceLevel = 1; // Gratis/Basso
        } else if (['food', 'hotel', 'shop', 'leisure'].includes(newCat)) {
          if (prev.priceLevel === 1) newData.priceLevel = 2;
        }
      }

      return newData;
    });
  };

  const updateCoord = (type: 'lat' | 'lng', value: string) => {
    setFormData((prev) => {
      if (value.trim() === '') {
        const next = { ...prev.coords };
        delete next[type];
        const hasLat = typeof next.lat === 'number' && Number.isFinite(next.lat);
        const hasLng = typeof next.lng === 'number' && Number.isFinite(next.lng);
        return { ...prev, coords: hasLat || hasLng ? next : undefined };
      }
      const num = parseFloat(value);
      if (Number.isNaN(num)) return prev;
      return {
        ...prev,
        coords: { ...prev.coords, [type]: num },
      };
    });
  };

  const updateAffiliate = (key: keyof AffiliateLinks, value: string) => {
    setFormData((prev) => ({
      ...prev,
      affiliate: {
        ...prev.affiliate,
        [key]: value,
      },
    }));
  };

  const handleAutoLocate = async () => {
    if (!formData.name) {
      return { error: 'Inserisci il nome del POI.' };
    }

    setIsLocating(true);
    try {
      const coords = await generatePoiCoords(formData.name, cityName || GEO_CONFIG.DEFAULT_REGION);

      if (coords) {
        setFormData((prev) => ({
          ...prev,
          coords: {
            lat: coords.lat,
            lng: coords.lng,
          },
        }));
        return { success: true };
      } else {
        return { error: 'Coordinate non trovate.' };
      }
    } catch {
      return { error: 'Errore servizio AI.' };
    } finally {
      setIsLocating(false);
    }
  };

  const validate = () => {
    if (!isAdminSubCategoryPristine(formData) && !formData.subCategory.trim()) {
      return 'ERRORE: La Sottocategoria è obbligatoria.';
    }

    if (!isAdminOpeningHoursPristine(formData) && !hasRequiredOpeningHours(formData.openingHours)) {
      return 'ERRORE: Giorni e almeno una fascia oraria di apertura sono obbligatori.';
    }

    if (!isImageValid) {
      return 'Correggi i problemi di copyright immagine.';
    }

    const placeholder = formData.category ? placeholderUrlForCategory(formData.category) : null;

    const hasAsset = !!formData.imageUrl || !!placeholder;

    if (!hasAsset && formData.status === 'published') {
      return 'BLOCCO QUALITÀ: Manca foto o placeholder per pubblicare.';
    }

    return null;
  };

  const categoryPlaceholder = formData.category
    ? placeholderUrlForCategory(formData.category)
    : null;

  const isMissingAsset = !formData.imageUrl && !categoryPlaceholder;

  /**
   * getNormalizedData: Converte lo stato del form in una Entity STRICT
   * pronta per il service layer.
   */
  const getNormalizedData = (): PointOfInterest => {
    return normalizePoiFormData(formData);
  };

  return {
    formData,
    setFormData,
    isDirty,
    isImageValid,
    setIsImageValid,
    isLocating,
    updateField,
    releaseAdminImageUrl,
    updateCoord,
    updateAffiliate,
    handleAutoLocate,
    validate,
    getNormalizedData, // NEW: Espone il convertitore domain-driven

    // Derived props for UI
    categoryPlaceholder,
    isMissingAsset,
  };
};
