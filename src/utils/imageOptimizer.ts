
/**
 * Utility per l'ottimizzazione delle immagini.
 * Gestisce trasformazioni per Unsplash e Supabase Storage.
 */

export type ImageSize = 'thumbnail' | 'small' | 'medium' | 'large' | 'original';

const SIZES = {
    thumbnail: { width: 150, quality: 60 },
    small: { width: 400, quality: 75 },
    medium: { width: 800, quality: 80 },
    large: { width: 1200, quality: 90 },
    original: { width: null, quality: null }
};

export const getOptimizedImageUrl = (url: string, size: ImageSize = 'medium'): string => {
    if (!url || typeof url !== 'string') return '';
    
    // FIX CRITICO: Rimuove spazi vuoti che rompono i link copiati
    const cleanUrl = url.trim();

    // Non toccare base64 o blob
    if (cleanUrl.startsWith('data:') || cleanUrl.startsWith('blob:')) return cleanUrl; 
    
    // --- FIX AUTO-REPAIR URL ---
    if (cleanUrl.startsWith('photo-') && !cleanUrl.startsWith('http')) {
        return `https://images.unsplash.com/${cleanUrl}`;
    }
    
    if (cleanUrl.startsWith('/')) return cleanUrl;

    // Se richiesto originale, ritorna subito senza toccare nulla
    if (size === 'original') return cleanUrl;

    try {
        const urlObj = new URL(cleanUrl);

        // 1. GESTIONE UNSPLASH (Funziona sempre, ottimizziamo)
        if (urlObj.hostname.includes('unsplash.com')) {
            const targetWidth = SIZES[size].width;
            const targetQuality = SIZES[size].quality;
            
            urlObj.searchParams.set('w', targetWidth?.toString() || '800');
            urlObj.searchParams.set('q', targetQuality?.toString() || '80');
            urlObj.searchParams.set('fit', 'crop');
            urlObj.searchParams.set('auto', 'format');
            return urlObj.toString();
        }

        // 2. GESTIONE SUPABASE STORAGE
        if (urlObj.hostname.includes('supabase.co')) {
             return cleanUrl;
        }

        return cleanUrl;

    } catch (e) {
        return cleanUrl;
    }
};
