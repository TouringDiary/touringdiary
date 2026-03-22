import QRCode from 'qrcode';
import { Itinerary, ItineraryItem } from '../types/index';
import { getCityDetails } from '../services/city/cityReadService';
import { calculateDistance } from '../services/geo';

// --- INTERFACCE DEDICATE AL PDF ---
export interface PreparedItineraryItem extends ItineraryItem {
    processedImage?: string;
    qrCodeUrl?: string;
    distanceFromPrev?: number | null;
}

export interface CityVisualInfo {
    id: string;
    name: string;
    heroImageBase64?: string;
}

export interface PreparedItinerary extends Omit<Itinerary, 'items'> {
    items: PreparedItineraryItem[];
    citiesInfo: CityVisualInfo[];
    formattedCityList: string;
}

// --- CONFIGURAZIONE ---
const IMAGE_QUALITY = 0.7;
const MAX_IMAGE_WIDTH = 800;
const GOOGLE_MAPS_BASE = "https://www.google.com/maps/search/?api=1&query=";

/**
 * Scarica un'immagine da URL, la ridimensiona e la converte in Base64.
 */
const processImage = async (url: string): Promise<string | undefined> => {

    if (!url) return undefined;

    if (url.startsWith('data:')) return url;

    return new Promise((resolve) => {

        const img = new Image();
        img.crossOrigin = "Anonymous";

        img.onload = () => {

            const canvas = document.createElement('canvas');

            let width = img.width;
            let height = img.height;

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

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);

            ctx.drawImage(img, 0, 0, width, height);

            try {

                const dataUrl = canvas.toDataURL('image/jpeg', IMAGE_QUALITY);
                resolve(dataUrl);

            } catch {

                resolve(url);

            }

        };

        img.onerror = () => resolve(url);

        const cacheBuster = url.includes('?')
            ? `&_cb=${Date.now()}`
            : `?_cb=${Date.now()}`;

        img.src = url + cacheBuster;

    });

};

/**
 * Genera un QR Code Base64
 */
const generateQr = async (
    lat: number,
    lng: number,
    query?: string
): Promise<string | undefined> => {

    const hasValidCoords = lat != null && lng != null;

    if (!hasValidCoords && !query) return undefined;

    const targetUrl = hasValidCoords
        ? `${GOOGLE_MAPS_BASE}${lat},${lng}`
        : `${GOOGLE_MAPS_BASE}${encodeURIComponent(query || '')}`;

    try {

        return await QRCode.toDataURL(targetUrl, {
            errorCorrectionLevel: 'M',
            margin: 1,
            color: {
                dark: '#000000',
                light: '#ffffff'
            },
            width: 150
        });

    } catch (e) {

        console.error("QR Generation Error", e);
        return undefined;

    }

};


/**
 * Funzione principale per preparare i dati del PDF
 */
export const prepareItineraryForPdf = async (

    sourceItinerary: Itinerary,
    coverImageUrl: string,
    options: { includePhotos: boolean, includeQr: boolean },
    onProgress: (percent: number) => void

): Promise<PreparedItinerary> => {

    const sortedItems = [...sourceItinerary.items].sort((a, b) => {

        if (a.dayIndex !== b.dayIndex)
            return a.dayIndex - b.dayIndex;

        return a.timeSlotStr.localeCompare(b.timeSlotStr);

    });

    onProgress(5);

    const uniqueCityIds = Array.from(new Set(
        sortedItems
            .map(i => i.cityId)
            .filter(id => id && id !== 'custom' && id !== 'unknown')
    ));

    const citiesInfo: CityVisualInfo[] = [];

    const citiesToFetch = uniqueCityIds.slice(0, 4);

    for (const cityId of citiesToFetch) {

        try {

            const cityDetails = await getCityDetails(cityId);

            if (cityDetails) {

                let heroBase64: string | undefined;

                if (options.includePhotos && cityDetails.details.heroImage) {

                    heroBase64 = await processImage(
                        cityDetails.details.heroImage
                    );

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

    const totalItems = sortedItems.length;

    const processedItems: PreparedItineraryItem[] = [];

    for (let i = 0; i < totalItems; i++) {

        const item = sortedItems[i];

        let distance: number | null = null;

        if (i > 0) {

            const prev = sortedItems[i - 1];

            if (prev.dayIndex === item.dayIndex && !prev.isCustom && !item.isCustom) {

                if (

                    prev.poi &&
                    prev.poi.coords &&
                    item.poi &&
                    item.poi.coords &&
                    prev.poi.coords.lat != null &&
                    prev.poi.coords.lng != null &&
                    item.poi.coords.lat != null &&
                    item.poi.coords.lng != null

                ) {

                    distance = calculateDistance(

                        prev.poi.coords.lat,
                        prev.poi.coords.lng,
                        item.poi.coords.lat,
                        item.poi.coords.lng

                    );

                }

            }

        }

        let imgBase64: string | undefined;

        if (options.includePhotos && item.poi?.imageUrl) {

            imgBase64 = await processImage(item.poi.imageUrl);

        }

        let qrBase64: string | undefined;

        if (

            options.includeQr &&
            item.poi &&
            item.poi.coords &&
            item.poi.coords.lat != null &&
            item.poi.coords.lng != null

        ) {

            qrBase64 = await generateQr(

                item.poi.coords.lat,
                item.poi.coords.lng,
                `${item.poi.name} ${item.poi.address || ''}`

            );

        }

        processedItems.push({
            ...item,
            notes: typeof item.notes === "string" ? item.notes : "",
            processedImage: imgBase64,
            qrCodeUrl: qrBase64,
            distanceFromPrev: distance
        });

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