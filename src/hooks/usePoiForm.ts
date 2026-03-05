
import { useState, useEffect } from 'react';
import { PointOfInterest, AffiliateLinks } from '../types/index';
import { getCachedPlaceholder } from '../services/settingsService';
import { generatePoiCoords } from '../services/ai';
import { getCorrectCategory } from '../services/ai/utils/taxonomyUtils';
import { GEO_CONFIG } from '../constants/geoConfig';

const DEFAULT_POI: PointOfInterest = {
    id: '', name: '', description: '', imageUrl: '', category: 'monument', subCategory: 'square', rating: 4.5, votes: 0,
    coords: GEO_CONFIG.DEFAULT_CENTER, address: '', visitDuration: '1 h', priceLevel: 1, // DEFAULT A 1 PER SICUREZZA
    affiliate: {}, linkMetadata: {}, status: 'published',
    openingHours: { days: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'], morning: '09:00 - 13:00', afternoon: '15:00 - 19:00' }
};

export const usePoiForm = (poi: PointOfInterest | null, cityName?: string) => {
    const [formData, setFormData] = useState<PointOfInterest>(DEFAULT_POI);
    const [initialState, setInitialState] = useState<string>('');
    const [isImageValid, setIsImageValid] = useState(true);
    const [isLocating, setIsLocating] = useState(false);

    useEffect(() => {
        if (poi) {
            const data = JSON.parse(JSON.stringify(poi));
            if (!data.affiliate) data.affiliate = {};
            if (!data.openingHours) data.openingHours = { days: ['Lun-Dom'], morning: '', afternoon: '', evening: '' };
            setFormData(data);
            setInitialState(JSON.stringify(data));
        } else {
             // Reset for new
             const fresh = JSON.parse(JSON.stringify(DEFAULT_POI));
             fresh.id = `poi_${Date.now()}`;
             setFormData(fresh);
             setInitialState(JSON.stringify(fresh));
        }
    }, [poi]);

    const isDirty = JSON.stringify(formData) !== initialState;

    const updateField = (field: keyof PointOfInterest, value: any) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };
            
            // --- AUTOMAZIONE TASSONOMIA ---
            if (field === 'subCategory') {
                const autoCategory = getCorrectCategory(value as string, prev.category, prev.name);
                if (autoCategory !== prev.category) {
                    newData.category = autoCategory as any;
                }
            }
            
            // --- AUTOMAZIONE PREZZO (FIX: Piazze/Chiese a 1 Euro) ---
            if (field === 'category') {
                const newCat = value as string;
                if (newCat === 'monument' || newCat === 'nature' || newCat === 'discovery') {
                    newData.priceLevel = 1; // Default a Gratis/Basso
                } else if (newCat === 'food' || newCat === 'hotel' || newCat === 'shop' || newCat === 'leisure') {
                    // Mantieni 2 per cibo/hotel se non già settato diversamente
                    // Ma se era 1 (dal default), lo portiamo a 2 per logica
                    if (prev.priceLevel === 1) newData.priceLevel = 2; 
                }
            }
            
            return newData;
        });
    };
    
    const updateCoord = (type: 'lat' | 'lng', value: string) => setFormData(prev => ({ ...prev, coords: { ...prev.coords, [type]: parseFloat(value) } }));
    
    const updateAffiliate = (key: keyof AffiliateLinks, value: string) => {
        setFormData(prev => ({ ...prev, affiliate: { ...prev.affiliate, [key]: value } }));
    };

    const handleAutoLocate = async () => {
        if (!formData.name) return { error: "Inserisci il nome del POI." };
        setIsLocating(true);
        try {
            const coords = await generatePoiCoords(formData.name, cityName || GEO_CONFIG.DEFAULT_REGION);
            if (coords) {
                setFormData(prev => ({ ...prev, coords: { lat: coords.lat, lng: coords.lng } }));
                return { success: true };
            } else {
                return { error: "Coordinate non trovate." };
            }
        } catch (e) {
            return { error: "Errore servizio AI." };
        } finally {
            setIsLocating(false);
        }
    };

    const validate = () => {
        if (!formData.subCategory) return "ERRORE: La Sottocategoria è obbligatoria.";
        if (!isImageValid) return "Correggi i problemi di copyright immagine.";
        
        const placeholder = getCachedPlaceholder(formData.category);
        const hasAsset = !!formData.imageUrl || !!placeholder;
        if (!hasAsset && formData.status === 'published') {
            return "BLOCCO QUALITÀ: Manca foto o placeholder per pubblicare.";
        }
        return null;
    };

    return {
        formData, setFormData,
        isDirty,
        isImageValid, setIsImageValid,
        isLocating,
        updateField, updateCoord, updateAffiliate,
        handleAutoLocate,
        validate,
        // Derived props for UI
        categoryPlaceholder: getCachedPlaceholder(formData.category),
        isMissingAsset: !formData.imageUrl && !getCachedPlaceholder(formData.category)
    };
};
