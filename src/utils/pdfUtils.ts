
import QRCode from 'qrcode';
import { Itinerary, ItineraryItem } from '../types/index';
import { getCityDetails } from '../services/city/cityReadService';
import { calculateDistance } from '../services/geo';

// --- INTERFACCE DEDICATE AL PDF ---
// Estendiamo l'ItineraryItem con campi "ready-to-print" (Base64) e distanza
export interface PreparedItineraryItem extends ItineraryItem {
    processedImage?: string; // Base64 or null
    qrCodeUrl?: string;      // Base64 QR code
    distanceFromPrev?: number | null; // Distanza dal POI precedente in km
}

export interface CityVisualInfo {
    id: string;
    name: string;
    heroImageBase64?: string;
}

export interface PreparedItinerary extends Omit<Itinerary, 'items'> {
    items: PreparedItineraryItem[];
    citiesInfo: CityVisualInfo[]; // Lista città con immagini
    formattedCityList: string;    // Stringa "Napoli, Sorrento..."
}

// --- CONFIGURAZIONE ---
const IMAGE_QUALITY = 0.7;
const MAX_IMAGE_WIDTH = 800; // Bilanciamento qualità/dimensione PDF
const GOOGLE_MAPS_BASE = "https://www.google.com/maps/search/?api=1&query=";

/**
 * Scarica un'immagine da URL, la ridimensiona e la converte in Base64.
 * Gestisce CORS e errori di rete.
 */
const processImage = async (url: string): Promise<string | undefined> => {
    if (!url) return undefined;
    
    // Se è già base64, ritorna così com'è
    if (url.startsWith('data:')) return url;

    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous"; // Cruciale per canvas tainted
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Resize logic
            if (width > MAX_IMAGE_WIDTH) {
                height = Math.round(height * (MAX_IMAGE_WIDTH / width));
                width = MAX_IMAGE_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(undefined);
                return;
            }

            // Disegna su sfondo bianco (per gestire PNG trasparenti)
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            // Export to JPG Base64
            try {
                const dataUrl = canvas.toDataURL('image/jpeg', IMAGE_QUALITY);
                resolve(dataUrl);
            } catch (e) {
                // Se il canvas è tainted, ritorna l'URL originale come fallback
                resolve(url);
            }
        };

        img.onerror = () => {
            // Fallback: se fallisce il caricamento con CORS, prova a ritornare l'URL originale
            // react-pdf potrebbe riuscire a caricarlo internamente
            resolve(url); 
        };

        // Aggiungiamo un parametro per bypassare la cache del browser che potrebbe
        // aver salvato l'immagine senza gli header CORS corretti
        const cacheBuster = url.includes('?') ? `&_cb=${Date.now()}` : `?_cb=${Date.now()}`;
        img.src = url + cacheBuster;
    });
};

/**
 * Genera un QR Code Base64 per una coppia di coordinate o indirizzo.
 */
const generateQr = async (lat: number, lng: number, query?: string): Promise<string | undefined> => {
    // Se non ci sono coordinate valide, non generare QR
    if ((!lat && !lng) && !query) return undefined;

    const targetUrl = (lat && lng) 
        ? `${GOOGLE_MAPS_BASE}${lat},${lng}`
        : `${GOOGLE_MAPS_BASE}${encodeURIComponent(query || '')}`;

    try {
        // Genera QR con margine minimo e colori scuri per contrasto su carta
        const url = await QRCode.toDataURL(targetUrl, {
            errorCorrectionLevel: 'M',
            margin: 1,
            color: {
                dark: '#000000',
                light: '#ffffff'
            },
            width: 150 // Dimensione sufficiente per la stampa
        });
        return url;
    } catch (e) {
        console.error("QR Generation Error", e);
        return undefined;
    }
};

/**
 * Funzione Principale: Prepara l'intero itinerario per la stampa.
 * Esegue le operazioni in parallelo ma con un limite di concorrenza per non intasare la rete.
 */
export const prepareItineraryForPdf = async (
    sourceItinerary: Itinerary,
    coverImageUrl: string, 
    options: { includePhotos: boolean, includeQr: boolean },
    onProgress: (percent: number) => void
): Promise<PreparedItinerary> => {
    
    // 1. Ordinamento Items per calcolo distanze coerente
    const sortedItems = [...sourceItinerary.items].sort((a, b) => {
        if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
        return a.timeSlotStr.localeCompare(b.timeSlotStr);
    });

    // 2. Identificazione Città Univoche
    onProgress(5);
    const uniqueCityIds = Array.from(new Set(
        sortedItems
            .map(i => i.cityId)
            .filter(id => id && id !== 'custom' && id !== 'unknown')
    ));

    // 3. Fetch Dettagli Città (per Nomi e Immagini Hero)
    const citiesInfo: CityVisualInfo[] = [];
    const citiesToFetch = uniqueCityIds.slice(0, 4);

    for (const cityId of citiesToFetch) {
        try {
            const cityDetails = await getCityDetails(cityId);
            if (cityDetails) {
                let heroBase64: string | undefined = undefined;
                if (options.includePhotos && cityDetails.details.heroImage) {
                    heroBase64 = await processImage(cityDetails.details.heroImage);
                }
                
                citiesInfo.push({
                    id: cityDetails.id,
                    name: cityDetails.name,
                    heroImageBase64: heroBase64
                });
            }
        } catch (e) {
            console.warn(`Could not fetch details for city ${cityId}`, e);
        }
    }
    
    const formattedCityList = citiesInfo.map(c => c.name).join(', ');
    onProgress(20);

    // 4. Prepara Items (POI) e Calcola Distanze
    const totalItems = sortedItems.length;
    const processedItems: PreparedItineraryItem[] = [];
    
    for (let i = 0; i < totalItems; i++) {
        const item = sortedItems[i];
        
        // Calcolo Distanza dal precedente (se stesso giorno)
        let distance: number | null = null;
        if (i > 0) {
            const prev = sortedItems[i - 1];
            if (prev.dayIndex === item.dayIndex && !prev.isCustom && !item.isCustom) {
                // Calcola solo se coordinate valide
                if (prev.poi.coords.lat && item.poi.coords.lat) {
                    distance = calculateDistance(
                        prev.poi.coords.lat, prev.poi.coords.lng,
                        item.poi.coords.lat, item.poi.coords.lng
                    );
                }
            }
        }

        // A. Immagine POI
        let imgBase64: string | undefined = undefined;
        if (options.includePhotos && item.poi && item.poi.imageUrl) {
            imgBase64 = await processImage(item.poi.imageUrl);
        }

        // B. QR Code
        let qrBase64: string | undefined = undefined;
        if (options.includeQr && item.poi) {
            qrBase64 = await generateQr(item.poi.coords.lat, item.poi.coords.lng, `${item.poi.name} ${item.poi.address || ''}`);
        }

        processedItems.push({
            ...item,
            processedImage: imgBase64,
            qrCodeUrl: qrBase64,
            distanceFromPrev: distance
        });

        // Calcolo progresso (da 20% a 95%)
        const progress = 20 + Math.round(((i + 1) / totalItems) * 75);
        onProgress(progress);
    }

    onProgress(100);

    return {
        ...sourceItinerary,
        items: processedItems,
        citiesInfo,
        formattedCityList
    };
};
