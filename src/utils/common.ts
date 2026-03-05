
import React from 'react';
import { Landmark, Utensils, Bed, Trees, Sparkles, PartyPopper, ShoppingBag, MapPin, Camera, Box, Scan, Music, Sun } from 'lucide-react';
import { PointOfInterest, PoiCategory } from '../types/index';
import { getCachedSetting, SETTINGS_KEYS } from '../services/settingsService';

// NEW: Utility per correggere casing (es. tRECASE -> Trecase)
export const toTitleCase = (str: string) => {
    if (!str) return '';
    return str.replace(
        /\w\S*/g,
        text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
};

export const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' }).format(date);
};

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
};

export const formatVisitors = (num: number | undefined | null) => {
    if (num === undefined || num === null) return '-';
    if (num >= 1000000) return (num / 1000000).toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
    return num.toString();
};

export const getDaysArray = (start: string, end: string) => {
    if (!start || !end) return [];
    const s = new Date(start);
    const e = new Date(end);
    const days = [];
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) days.push(new Date(d));
    return days;
};

export const openMap = (lat: number, lng: number, name?: string, address?: string) => {
    if (name) {
        const query = encodeURIComponent(`${name} ${address || ''}`.trim());
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}&z=19`, '_blank');
    } else {
        window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}&z=19`, '_blank');
    }
};

export const open3DView = (lat: number, lng: number, name?: string, address?: string) => {
    if (name) {
         const query = encodeURIComponent(`${name} ${address || ''}`.trim());
         window.open(`https://earth.google.com/web/search/${query}`, '_blank');
    } else {
         window.open(`https://earth.google.com/web/@${lat},${lng},100a,500d,35y,0h,0t,0r`, '_blank');
    }
};

// --- CENTRALIZED POI UI HELPERS ---

export const getPoiCategoryLabel = (category: string): string => {
    switch(category) {
        case 'monument': return 'Destinazioni';
        case 'food': return 'Sapori';
        case 'hotel': return 'Alloggi';
        case 'nature': return 'Natura';
        case 'discovery': return 'Novità';
        case 'leisure': return 'Svago';
        case 'shop': return 'Shopping';
        default: return category.charAt(0).toUpperCase() + category.slice(1);
    }
};

export const getSubCategoryLabel = (subCat: string): string => {
    if (!subCat) return '';
    const lower = subCat.toLowerCase().trim();
    switch(lower) {
        // CIBO (Sapori)
        case 'restaurant': return 'Ristorante';
        case 'pizzeria': return 'Pizzeria';
        case 'trattoria': return 'Trattoria / Osteria';
        case 'street_food': return 'Street Food';
        case 'pastry': return 'Pasticceria';
        case 'gelato': return 'Gelateria';
        case 'cafe': return 'Caffetteria';
        case 'bakery': return 'Forno / Panetteria';
        case 'gastronomy': return 'Gastronomia';
        case 'dairy': return 'Caseificio';
        case 'braceria': return 'Braceria / Steakhouse'; // NEW
        case 'fast_food': return 'Fast Food'; // NEW
        
        // SVAGO (Leisure) - Include Nightlife ora
        case 'pub': return 'Pub & Birreria';
        case 'wine_bar': return 'Enoteca / Wine Bar';
        case 'cocktail_bar': return 'Cocktail Bar';
        case 'disco': return 'Discoteca / Club';
        case 'cinema': return 'Cinema';
        case 'theater': return 'Teatro';
        case 'spa': return 'SPA & Benessere';
        case 'water_park': return 'Acquapark'; 
        case 'zoo': return 'Zoo / Acquario';
        case 'playground': return 'Parco Giochi'; // NEW
        case 'stadium': return 'Stadio / Sport';
        
        // NATURA / MARE
        case 'beach_club': return 'Lido / Beach Club';
        case 'beach_free': return 'Spiaggia Libera'; // Distinct
        case 'park': return 'Parco Pubblico';
        case 'garden': return 'Giardino / Villa';
        case 'hiking': return 'Sentiero / Trekking';
        case 'viewpoint': return 'Belvedere / Panorama';
        case 'lake': return 'Lago';
        case 'river': return 'Fiume / Cascata';
        case 'reserve': return 'Riserva Naturale';
        
        // CULTURA (Monumenti)
        case 'church': return 'Chiesa / Luogo Sacro';
        case 'castle': return 'Castello / Fortezza';
        case 'museum': return 'Museo';
        case 'gallery': return 'Galleria d\'Arte';
        case 'square': return 'Piazza'; // Already present
        case 'archaeology': return 'Sito Archeologico';
        case 'palace': return 'Palazzo Storico';
        case 'monument': return 'Monumento / Statua';
        case 'library': return 'Biblioteca';
        
        // SHOPPING
        case 'fashion': return 'Moda & Abbigliamento';
        case 'crafts': return 'Artigianato Locale'; // Ceramiche, Presepi...
        case 'jewelry': return 'Gioielleria';
        case 'souvenir': return 'Souvenir';
        case 'market': return 'Mercato Rionale';
        case 'mall': return 'Centro Commerciale';
        case 'food_shop': return 'Prodotti Tipici (Vendita)'; // Diversi da ristorazione

        // HOTEL
        case 'hotel': return 'Hotel';
        case 'resort': return 'Resort';
        case 'bnb': return 'B&B';
        case 'apartment': return 'Casa Vacanze';
        case 'hostel': return 'Ostello';
        case 'guest_house': return 'Affittacamere';
        
        // DEFAULT FALLBACK
        default: return subCat.charAt(0).toUpperCase() + subCat.slice(1).replace(/_/g, ' ');
    }
};

export const getPoiIcon = (category: PoiCategory) => {
    switch (category) {
        case 'monument': return Landmark;
        case 'food': return Utensils;
        case 'hotel': return Bed;
        case 'shop': return ShoppingBag;
        case 'nature': return Sun;
        case 'discovery': return Scan;
        case 'leisure': return Music;
        default: return MapPin;
    }
};

export const getPoiColorStyle = (category: string) => {
    switch(category) {
        case 'monument': return { bg: 'bg-violet-500/20', text: 'text-violet-200', border: 'border-violet-500/50', icon: 'text-violet-400' };
        case 'food': return { bg: 'bg-orange-500/20', text: 'text-orange-200', border: 'border-orange-500/50', icon: 'text-orange-400' };
        case 'nature': return { bg: 'bg-emerald-500/20', text: 'text-emerald-200', border: 'border-emerald-500/50', icon: 'text-emerald-400' };
        case 'shop': return { bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-200', border: 'border-fuchsia-500/50', icon: 'text-fuchsia-400' };
        case 'leisure': return { bg: 'bg-cyan-500/20', text: 'text-cyan-200', border: 'border-cyan-500/50', icon: 'text-cyan-400' };
        case 'hotel': return { bg: 'bg-blue-500/20', text: 'text-blue-200', border: 'border-blue-500/50', icon: 'text-blue-400' };
        default: return { bg: 'bg-indigo-500/20', text: 'text-indigo-200', border: 'border-indigo-500/50', icon: 'text-indigo-400' };
    }
};

export const isPoiNew = (poi: PointOfInterest): boolean => {
    const today = new Date().toISOString().split('T')[0];
    if (poi.showcaseExpiry) return poi.showcaseExpiry >= today;
    if (poi.category === 'discovery') return true;
    if (poi.dateAdded) {
        const added = new Date(poi.dateAdded);
        const limit = new Date();
        limit.setDate(limit.getDate() - 90);
        return added >= limit;
    }
    return false;
};

// FIX: Robust DataURL conversion to prevent "atob" errors
export const dataURLtoFile = (dataurl: string, filename: string): File => {
    try {
        const arr = dataurl.split(',');
        if (arr.length < 2) throw new Error("Invalid data URL format");
        
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
        
        const bstr = atob(arr[1].trim()); // Trim whitespace
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while(n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, {type: mime});
    } catch (e) {
        console.error("Error converting DataURL to File:", e);
        // Fallback: create empty file to prevent crash, but log error
        return new File([""], "error.jpg", {type: "image/jpeg"});
    }
};

const compressImageGeneric = (file: File, maxWidth: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const elem = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > height) { if (width > maxWidth) { height *= (maxWidth / width); width = maxWidth; } }
                else { if (height > maxWidth) { width *= (maxWidth / height); height = maxWidth; } }
                elem.width = width;
                elem.height = height;
                const ctx = elem.getContext('2d');
                if (!ctx) return reject(new Error("Canvas error"));
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                resolve(elem.toDataURL('image/jpeg', quality));
            };
            img.onerror = (e) => reject(e);
        };
        reader.onerror = (e) => reject(e);
    });
};

export const compressImage = (file: File) => compressImageGeneric(file, 1024, 0.7);
export const compressImageHighQuality = (file: File) => compressImageGeneric(file, 1920, 0.9);

export const getSafeServiceType = (rawType: string): string => {
    const t = rawType ? rawType.toLowerCase().trim() : 'other';
    const validTypes = [
        'airport', 'train', 'bus', 'taxi', 'maritime', 'other', 'emergency', 'pharmacy', 
        'guide', 'transport', 'info', 'hospital', 'police', 'fire', 'atm', 'consulate', 
        'parking', 'rental', 'post', 'water', 'luggage', 'tour_operator', 'agency'
    ];
    if (validTypes.includes(t)) return t;
    if (t.includes('aeroport') || t.includes('aereo') || t.includes('volo')) return 'airport';
    if (t.includes('treno') || t.includes('ferrovi') || t.includes('stazione') || t.includes('metro') || t.includes('circum')) return 'train';
    if (t.includes('bus') || t.includes('autobus') || t.includes('tram') || t.includes('pullman') || t.includes('navetta')) return 'bus';
    if (t.includes('taxi') || t.includes('ncc') || t.includes('noleggio') || t.includes('auto') || t.includes('parcheggio') || t.includes('car')) return 'taxi';
    if (t.includes('porto') || t.includes('nave') || t.includes('traghetto') || t.includes('aliscafo') || t.includes('marittim')) return 'maritime';
    if (t.includes('ospedale') || t.includes('pronto soccorso') || t.includes('medico') || t.includes('clinica') || t.includes('sanit')) return 'hospital'; 
    if (t.includes('farmacia') || t.includes('parafarmacia')) return 'pharmacy';
    if (t.includes('polizia') || t.includes('carabinieri') || t.includes('vigili') || t.includes('questura')) return 'police'; 
    if (t.includes('pompieri') || t.includes('fuoco')) return 'fire';
    if (t.includes('emergenza') || t.includes('soccorso')) return 'emergency';
    if (t.includes('post')) return 'post';
    if (t.includes('banca') || t.includes('bancomat') || t.includes('atm')) return 'atm';
    if (t.includes('info') || t.includes('turism') || t.includes('pro loco')) return 'info';
    if (t.includes('bagagli')) return 'luggage';
    if (t.includes('acqua') || t.includes('fontan')) return 'water';
    if (t.includes('consolato') || t.includes('ambasciata')) return 'consulate';
    if (t.includes('tour') || t.includes('agenzia') || t.includes('viaggi')) return 'tour_operator';
    return 'other';
};

// --- FIX: SANITIZZAZIONE EVENTI DINAMICA ---
// Usa la mappa tassonomica recuperata dal DB (o fallback)
export const getSafeEventCategory = (rawCat: string): string => {
    if (!rawCat) return 'Altro';
    const c = rawCat.toLowerCase().trim();
    
    // Recupera mappa dalla cache (sincrona)
    const map = getCachedSetting<Record<string, string>>(SETTINGS_KEYS.EVENT_TAXONOMY_MAP) || {};
    
    // Itera attraverso le chiavi (sinonimi) della mappa
    for (const [key, canonical] of Object.entries(map)) {
        if (c.includes(key)) {
            return canonical;
        }
    }
    
    // Fallback se nessun match
    return 'Altro';
};
