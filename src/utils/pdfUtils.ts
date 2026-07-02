import QRCode from 'qrcode';
import { Itinerary, ItineraryItem } from '../types/index';
import { getCityDetails } from '../services/city/cityReadService';
import { getPoisByIds } from '../services/cityService';
import { getCategoryPlaceholdersAsync } from '../services/settingsService';
import { calculateDistance } from '../services/geo';
import {
  type PoiDisplayImageSource,
  resolvePoiDisplayImageSource,
  resolvePoiDisplayImageUrl,
} from '../domain/poi/resolvePoiDisplayImageUrl';
import { logPdfImagePipeline, summarizeProcessedImage } from './pdfImagePipelineLog';

/** ID catalogo con snapshot senza imageUrl — solo per resolve in export PDF. */
function getCatalogPoiIdsMissingImageUrl(items: ItineraryItem[]): string[] {
    return [
        ...new Set(
            items
                .filter((item) => !item.isCustom && item.poi?.id && !item.poi.imageUrl?.trim())
                .map((item) => item.poi.id),
        ),
    ];
}

/**
 * Risolve imageUrl dal catalogo per snapshot obsoleti.
 * Non muta gli ItineraryItem: usato solo durante prepareItineraryForPdf.
 */
async function resolveCatalogImageUrlsForPdf(
    poiIds: string[],
): Promise<Map<string, string>> {
    const byPoiId = new Map<string, string>();
    if (poiIds.length === 0) return byPoiId;

    const freshPois = await getPoisByIds(poiIds);
    for (const poi of freshPois) {
        const url = poi.imageUrl?.trim();
        if (url) {
            byPoiId.set(poi.id, url);
        }
    }

    return byPoiId;
}

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

interface PoiImageResolutionTrace {
    itemId: string;
    poiName?: string;
    poiId?: string;
    snapshotImageUrl?: string;
    catalogImageUrl?: string;
    imageUrlForPdf?: string;
    imageSource: PoiDisplayImageSource;
}

// --- CONFIGURAZIONE ---
const IMAGE_QUALITY = 0.7;
const MAX_IMAGE_WIDTH = 800;
const GOOGLE_MAPS_BASE = "https://www.google.com/maps/search/?api=1&query=";

const IMAGE_LOAD_TIMEOUT_MS = 30_000;

interface ProcessImageContext {
    poiName?: string;
    itemId?: string;
    heroCityName?: string;
    source: 'poi' | 'hero';
}

/**
 * Scarica un'immagine da URL, la ridimensiona e la converte in Base64.
 */
const processImage = async (
    url: string,
    context: ProcessImageContext,
): Promise<string | undefined> => {
    const startedAt = performance.now();
    const baseLog = {
        poiName: context.poiName,
        itemId: context.itemId,
        heroCityName: context.heroCityName,
        imageUrl: url,
        extra: { source: context.source },
    };

    if (!url) {
        logPdfImagePipeline({
            stage: 'processImage:skip-empty',
            ...baseLog,
            processStarted: false,
            processCompleted: true,
            renderBlockedReason: 'URL vuoto',
        });
        return undefined;
    }

    if (url.startsWith('data:')) {
        const summary = summarizeProcessedImage(url);
        logPdfImagePipeline({
            stage: 'processImage:skip-data-url',
            ...baseLog,
            processStarted: false,
            processCompleted: true,
            ...summary,
        });
        return url;
    }

    logPdfImagePipeline({
        stage: 'processImage:start',
        ...baseLog,
        processStarted: true,
    });

    return new Promise((resolve) => {
        let settled = false;

        const finish = (
            result: string | undefined,
            stage: Parameters<typeof logPdfImagePipeline>[0]['stage'],
            details: Partial<Parameters<typeof logPdfImagePipeline>[0]> = {},
        ) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeoutId);

            logPdfImagePipeline({
                stage,
                ...baseLog,
                processStarted: true,
                processCompleted: true,
                durationMs: Math.round(performance.now() - startedAt),
                ...summarizeProcessedImage(result),
                ...details,
            });
            resolve(result);
        };

        const timeoutId = window.setTimeout(() => {
            finish(undefined, 'processImage:timeout', {
                errorMessage: `Nessun onload/onerror entro ${IMAGE_LOAD_TIMEOUT_MS}ms`,
            });
        }, IMAGE_LOAD_TIMEOUT_MS);

        const img = new Image();
        img.crossOrigin = 'Anonymous';

        img.onload = () => {
            logPdfImagePipeline({
                stage: 'processImage:loaded',
                ...baseLog,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                durationMs: Math.round(performance.now() - startedAt),
            });

            const canvas = document.createElement('canvas');

            let width = img.naturalWidth;
            let height = img.naturalHeight;

            if (width === 0 || height === 0) {
                finish(undefined, 'processImage:img-onerror', {
                    errorMessage: 'Immagine caricata con dimensioni 0x0',
                    naturalWidth: width,
                    naturalHeight: height,
                });
                return;
            }

            if (width > MAX_IMAGE_WIDTH) {
                height = Math.round(height * (MAX_IMAGE_WIDTH / width));
                width = MAX_IMAGE_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');

            if (!ctx) {
                finish(undefined, 'processImage:no-canvas-context', {
                    errorMessage: 'canvas.getContext("2d") ha restituito null',
                });
                return;
            }

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);

            try {
                ctx.drawImage(img, 0, 0, width, height);
            } catch (error) {
                const err = error as Error;
                finish(undefined, 'processImage:canvas-security-error', {
                    errorName: err.name,
                    errorMessage: err.message,
                    errorStack: err.stack,
                    outputWidth: width,
                    outputHeight: height,
                });
                return;
            }

            try {
                const dataUrl = canvas.toDataURL('image/jpeg', IMAGE_QUALITY);
                finish(dataUrl, 'processImage:success', {
                    outputWidth: width,
                    outputHeight: height,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight,
                });
            } catch (error) {
                const err = error as Error;
                finish(undefined, 'processImage:canvas-security-error', {
                    errorName: err.name,
                    errorMessage: err.message,
                    errorStack: err.stack,
                    outputWidth: width,
                    outputHeight: height,
                    extra: { phase: 'canvas.toDataURL' },
                });
            }
        };

        img.onerror = (event: string | Event) => {
            const eventType = typeof event === 'string' ? 'string' : event.type;
            finish(undefined, 'processImage:img-onerror', {
                errorMessage: 'img.onerror — immagine non caricata (rete, 404, CORS preflight, URL errato, redirect bloccato, ecc.)',
                extra: { eventType },
            });
        };

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
    coverImageUrl: string | undefined,
    options: { includePhotos: boolean, includeQr: boolean },
    onProgress: (percent: number) => void

): Promise<PreparedItinerary> => {

    const sortedItems = [...sourceItinerary.items].sort((a, b) => {

        if (a.dayIndex !== b.dayIndex)
            return a.dayIndex - b.dayIndex;

        return a.timeSlotStr.localeCompare(b.timeSlotStr);

    });

    const itemsWithImageUrl = sortedItems.filter((item) => Boolean(item.poi?.imageUrl));
    logPdfImagePipeline({
        stage: 'prepare:input',
        includePhotos: options.includePhotos,
        extra: {
            totalItems: sortedItems.length,
            itemsWithImageUrl: itemsWithImageUrl.length,
            itemsWithImageUrlSample: itemsWithImageUrl.slice(0, 5).map((item) => ({
                itemId: item.id,
                poiName: item.poi?.name,
                imageUrl: item.poi?.imageUrl,
            })),
            coverImageUrlParam: coverImageUrl,
            note: 'coverImageUrl non è usato nella preparazione: la copertina usa citiesInfo.heroImageBase64',
        },
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

            const cityDetails = await getCityDetails(cityId, undefined, { peopleAudience: 'public' });

            if (cityDetails) {

                let heroBase64: string | undefined;

                if (options.includePhotos && cityDetails.details.heroImage) {

                    logPdfImagePipeline({
                        stage: 'prepare:hero-start',
                        heroCityName: cityDetails.name,
                        imageUrl: cityDetails.details.heroImage,
                        includePhotos: options.includePhotos,
                    });

                    heroBase64 = await processImage(
                        cityDetails.details.heroImage,
                        { source: 'hero', heroCityName: cityDetails.name },
                    );

                    logPdfImagePipeline({
                        stage: 'prepare:hero-done',
                        heroCityName: cityDetails.name,
                        imageUrl: cityDetails.details.heroImage,
                        ...summarizeProcessedImage(heroBase64),
                        renderBlockedReason: heroBase64 ? undefined : 'heroImageBase64 undefined dopo processImage',
                    });

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

    // FALLBACKS
    if (citiesInfo.length === 0) {
        citiesInfo.push({
            id: 'fallback-city',
            name: sourceItinerary.name.split(' a ')[1] || 'Tua Destinazione',
        });
    }

    const formattedCityList = citiesInfo.map(c => c.name).join(', ') || 'Viaggio in Italia';

    onProgress(20);

    const catalogPoiIdsMissingImage = options.includePhotos
        ? getCatalogPoiIdsMissingImageUrl(sortedItems)
        : [];
    const catalogImageUrlByPoiId = await resolveCatalogImageUrlsForPdf(
        catalogPoiIdsMissingImage,
    );

    const categoryPlaceholders = await getCategoryPlaceholdersAsync();

    if (options.includePhotos && catalogPoiIdsMissingImage.length > 0) {
        logPdfImagePipeline({
            stage: 'prepare:input',
            includePhotos: options.includePhotos,
            extra: {
                catalogImageBatchRequested: catalogPoiIdsMissingImage.length,
                catalogImageBatchResolved: catalogImageUrlByPoiId.size,
                catalogImageResolvedSample: [...catalogImageUrlByPoiId.entries()]
                    .slice(0, 5)
                    .map(([poiId, imageUrl]) => ({ poiId, imageUrlPrefix: imageUrl.slice(0, 48) })),
            },
        });
    }

    const totalItems = sortedItems.length;

    const processedItems: PreparedItineraryItem[] = [];
    const poiImageResolutionTraceByItemId = new Map<string, PoiImageResolutionTrace>();

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

        const poiName = item.poi?.name;
        const snapshotImageUrl = item.poi?.imageUrl?.trim() || '';
        const catalogImageUrl = !snapshotImageUrl && item.poi?.id
            ? catalogImageUrlByPoiId.get(item.poi.id)
            : undefined;
        const resolveParams = {
            imageUrl: snapshotImageUrl || undefined,
            catalogImageUrl,
            category: item.poi?.category ?? 'discovery',
            categoryPlaceholders,
        };
        const imageUrlForPdf = resolvePoiDisplayImageUrl(resolveParams);
        const imageSource = resolvePoiDisplayImageSource(resolveParams);

        logPdfImagePipeline({
            stage: 'prepare:poi-start',
            itemId: item.id,
            poiName,
            imageUrl: imageUrlForPdf,
            includePhotos: options.includePhotos,
            hasImageUrl: Boolean(imageUrlForPdf),
            isResource: item.isResource,
            processStarted: Boolean(options.includePhotos && imageUrlForPdf),
            renderBlockedReason: !options.includePhotos
                ? 'includePhotos=false'
                : !imageUrlForPdf
                    ? item.poi?.id
                        ? 'snapshot, catalogo e placeholder categoria assenti'
                        : 'item.poi.imageUrl assente'
                    : undefined,
            extra: {
                snapshotImageUrl: snapshotImageUrl || undefined,
                catalogImageUrl: catalogImageUrl || undefined,
                imageSource,
                catalogPoiId: item.poi?.id,
            },
        });

        if (options.includePhotos && imageUrlForPdf) {

            imgBase64 = await processImage(imageUrlForPdf, {
                source: 'poi',
                itemId: item.id,
                poiName,
            });

        }

        logPdfImagePipeline({
            stage: 'prepare:poi-done',
            itemId: item.id,
            poiName,
            imageUrl: imageUrlForPdf,
            includePhotos: options.includePhotos,
            ...summarizeProcessedImage(imgBase64),
            renderBlockedReason: imgBase64 ? undefined : 'processedImage undefined dopo processImage',
            extra: {
                processedImagePresentAfterPrepare: Boolean(imgBase64),
                imageSource,
            },
        });

        poiImageResolutionTraceByItemId.set(item.id, {
            itemId: item.id,
            poiName,
            poiId: item.poi?.id,
            snapshotImageUrl: snapshotImageUrl || undefined,
            catalogImageUrl: catalogImageUrl || undefined,
            imageUrlForPdf,
            imageSource,
        });

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

    const prepared: PreparedItinerary = {

        ...sourceItinerary,
        items: processedItems,
        citiesInfo,
        formattedCityList

    };

    const withProcessedImage = prepared.items.filter((item) => Boolean(item.processedImage));
    const poiRenderTrace = prepared.items
        .filter((item) => !item.isResource)
        .map((item) => {
            const trace = poiImageResolutionTraceByItemId.get(item.id);

            return {
                itemId: item.id,
                poiName: trace?.poiName ?? item.poi?.name,
                poiId: trace?.poiId ?? item.poi?.id,
                snapshotImageUrl: trace?.snapshotImageUrl,
                catalogImageUrl: trace?.catalogImageUrl,
                imageUrlForPdf: trace?.imageUrlForPdf,
                imageSource: trace?.imageSource ?? 'none',
                ...summarizeProcessedImage(item.processedImage),
                processedImagePresent: Boolean(item.processedImage),
            };
        })
        .filter((row) => row.imageUrlForPdf || row.processedImagePresent);

    logPdfImagePipeline({
        stage: 'prepare:output',
        includePhotos: options.includePhotos,
        extra: {
            totalItems: prepared.items.length,
            itemsWithProcessedImage: withProcessedImage.length,
            poiRenderTrace,
            itemsMissingProcessedImage: prepared.items
                .filter((item) => {
                    const trace = poiImageResolutionTraceByItemId.get(item.id);
                    return Boolean(trace?.imageUrlForPdf) && !item.processedImage;
                })
                .map((item) => ({
                    itemId: item.id,
                    poiName: item.poi?.name,
                    imageUrl: poiImageResolutionTraceByItemId.get(item.id)?.imageUrlForPdf ?? '',
                })),
            heroImagesPrepared: citiesInfo
                .filter((city) => Boolean(city.heroImageBase64))
                .map((city) => ({
                    cityId: city.id,
                    cityName: city.name,
                    heroImageLength: city.heroImageBase64?.length,
                })),
        },
    });

    return prepared;

};