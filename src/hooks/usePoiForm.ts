import { useState, useEffect } from 'react';
import { PointOfInterest, AffiliateLinks } from '../types/index';
import { PoiFormData, mapPoiToFormData, normalizePoiFormData } from '../types/write/poiForm';
import { getCachedSetting } from '../services/settingsService';
import { generatePoiCoords } from '../services/ai';
import { getCorrectCategory } from '../services/ai/utils/taxonomyUtils';
import { GEO_CONFIG } from '../constants/geoConfig';

export const usePoiForm = (poi: PointOfInterest | null, cityName?: string) => {

    const [formData, setFormData] = useState<PoiFormData>(mapPoiToFormData(poi));
    const [initialState, setInitialState] = useState<string>('');
    const [isImageValid, setIsImageValid] = useState(true);
    const [isLocating, setIsLocating] = useState(false);

    useEffect(() => {
        const data = mapPoiToFormData(poi);
        setFormData(data);
        setInitialState(JSON.stringify(data));
    }, [poi]);

    const isDirty = JSON.stringify(formData) !== initialState;

    const updateField = <K extends keyof PoiFormData>(field: K, value: PoiFormData[K]) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };

            // --- AUTOMAZIONE TASSONOMIA ---
            if (field === 'subCategory' && typeof value === 'string') {
                const autoCategory = getCorrectCategory(
                    value,
                    prev.category,
                    prev.name
                );

                if (autoCategory !== prev.category) {
                    newData.category = autoCategory as PointOfInterest['category'];
                }
            }

            // --- AUTOMAZIONE PREZZO (FIX: Piazze/Chiese a 1 Euro) ---
            if (field === 'category' && typeof value === 'string') {
                const newCat = value;

                if (
                    newCat === 'monument' ||
                    newCat === 'nature' ||
                    newCat === 'discovery'
                ) {
                    newData.priceLevel = 1; // Gratis/Basso
                }
                else if (
                    ['food', 'hotel', 'shop', 'leisure'].includes(newCat)
                ) {
                    if (prev.priceLevel === 1) newData.priceLevel = 2;
                }
            }

            return newData;
        });
    };

    const updateCoord = (type: 'lat' | 'lng', value: string) => {
        if (value === '') {
            setFormData(prev => ({ ...prev, coords: { ...prev.coords, [type]: 0 } }));
            return;
        }
        const num = parseFloat(value);
        if (!isNaN(num)) {
            setFormData(prev => ({ ...prev, coords: { ...prev.coords, [type]: num } }));
        }
    };

    const updateAffiliate = (key: keyof AffiliateLinks, value: string) => {
        setFormData(prev => ({
            ...prev,
            affiliate: {
                ...prev.affiliate,
                [key]: value
            }
        }));
    };

    const handleAutoLocate = async () => {
        if (!formData.name) {
            return { error: "Inserisci il nome del POI." };
        }

        setIsLocating(true);
        try {
            const coords = await generatePoiCoords(
                formData.name,
                cityName || GEO_CONFIG.DEFAULT_REGION
            );

            if (coords) {
                setFormData(prev => ({
                    ...prev,
                    coords: {
                        lat: coords.lat,
                        lng: coords.lng
                    }
                }));
                return { success: true };
            } else {
                return { error: "Coordinate non trovate." };
            }
        } catch (e: unknown) {
            return { error: "Errore servizio AI." };
        } finally {
            setIsLocating(false);
        }
    };

    const validate = () => {
        if (!formData.subCategory) {
            return "ERRORE: La Sottocategoria è obbligatoria.";
        }

        if (!isImageValid) {
            return "Correggi i problemi di copyright immagine.";
        }

        const placeholder = formData.category
            ? getCachedSetting(formData.category)
            : null;

        const hasAsset = !!formData.imageUrl || !!placeholder;

        if (!hasAsset && formData.status === 'published') {
            return "BLOCCO QUALITÀ: Manca foto o placeholder per pubblicare.";
        }

        return null;
    };

    const categoryPlaceholder = formData.category
        ? getCachedSetting(formData.category)
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
        updateCoord,
        updateAffiliate,
        handleAutoLocate,
        validate,
        getNormalizedData, // NEW: Espone il convertitore domain-driven

        // Derived props for UI
        categoryPlaceholder,
        isMissingAsset
    };
};