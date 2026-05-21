
/**
 * Image Optimizer Utility
 * Layer tecnico puro per l'ottimizzazione e la trasformazione degli URL delle immagini.
 * 
 * Responsabilità:
 * - Sanitizzazione tecnica degli URL (trim, base64/blob bypass)
 * - Ottimizzazione parametri Unsplash (resize, quality, format)
 * - Passthrough deterministico per provider esterni
 * 
 * Nota: Questo file NON contiene logica semantica, euristiche sui contenuti o blacklist.
 * La governance dei media è demandata esclusivamente al Database.
 */

export type ImageSize = 'thumbnail' | 'small' | 'medium' | 'large' | 'original';

const SIZES = {
    thumbnail: { width: 150, quality: 60 },
    small: { width: 400, quality: 75 },
    medium: { width: 800, quality: 80 },
    large: { width: 1200, quality: 90 },
    original: { width: null, quality: null }
} as const;

/**
 * Ottimizza un URL immagine applicando trasformazioni tecniche basate sul provider.
 * @param url URL originale dell'immagine
 * @param size Target size definita nel sistema
 * @returns URL ottimizzato o URL originale se non supportato
 */
export const getOptimizedImageUrl = (url: string, size: ImageSize = 'medium'): string => {
    if (!url) return '';
    
    // 1. Sanitizzazione tecnica (Rimozione spazi)
    const cleanUrl = url.trim();

    // 2. Bypass per stream di dati locali o oggetti blob
    if (cleanUrl.startsWith('data:') || cleanUrl.startsWith('blob:')) return cleanUrl; 
    
    // 3. Passthrough per percorsi relativi (asset locali)
    if (cleanUrl.startsWith('/')) return cleanUrl;

    // 4. Se richiesto il formato originale, non applicare trasformazioni
    if (size === 'original') return cleanUrl;

    try {
        const urlObj = new URL(cleanUrl);

        // OTTIMIZZAZIONE UNSPLASH
        // Applica parametri nativi Unsplash per ridurre il peso dell'immagine alla sorgente
        if (
            urlObj.hostname === 'images.unsplash.com' ||
            urlObj.hostname.endsWith('.unsplash.com')
        ) {
            const targetWidth = SIZES[size].width;
            const targetQuality = SIZES[size].quality;
            
            if (targetWidth) urlObj.searchParams.set('w', targetWidth.toString());
            if (targetQuality) urlObj.searchParams.set('q', targetQuality.toString());
            
            urlObj.searchParams.set('fit', 'crop');
            urlObj.searchParams.set('auto', 'format');
            
            return urlObj.toString();
        }

        // Passthrough deterministico per altri provider
        return cleanUrl;

    } catch {
        // Fallback soft in caso di URL malformati
        return cleanUrl;
    }
};

/**
 * Normalizza un URL immagine per confronti tecnici (rimozione parametri query, trim, lowercase).
 */
export const normalizeImageUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    return url.split('?')[0].trim().toLowerCase();
};

/**
 * Verifica se un URL punta a un placeholder noto del sistema.
 */
export const isPlaceholderUrl = (url: string | null | undefined): boolean => {
    if (!url) return true;
    const normalized = normalizeImageUrl(url);
    return normalized.includes('unsplash.com/photo-1596825205486-3c36957b9fba') || normalized.includes('placeholder');
};
