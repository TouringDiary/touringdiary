import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Map as MapIcon,
    MessageSquare,
    Trash2,
    LayoutList,
    AlertTriangle,
    Loader2,
    Bell,
    CheckCircle,
    ArrowUpDown,
    ExternalLink,
    Star,
} from 'lucide-react';
import {
    getAllPremadeItinerariesAsync,
    getUnifiedReviews,
    deletePremadeItinerary,
    deleteReviewAsAdmin,
    getOpenReviewRatingAlerts,
    acknowledgeReviewRatingAlert,
    type ReviewRatingAlert,
} from '../../services/communityService';
import { getPoisByIds, getFullManifestAsync } from '../../services/cityService';
import { Review, PremadeItinerary, PointOfInterest } from '../../types/index';
import type { CitySummary } from '../../types/models/City';
import { StarRating } from '../common/StarRating';
import { AdminItineraryEditor } from './AdminItineraryEditor';
import {
    GeoCascadingFilters,
    type GeoSelection,
} from './cities/GeoCascadingFilters';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { AdminPageHeader } from './common/AdminPageHeader';
import { CountBadge } from '@/components/ui/CountBadge';
import { useUser } from '@/context/UserContext';
import { PoiDetailModal } from '../modals/PoiDetailModal';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';

/** Stub da mapDbReview: non sono nomi leggibili del target. */
const PLACEHOLDER_TARGET_NAMES = new Set(['POI', 'Itinerario']);

const EMPTY_GEO_SELECTION: GeoSelection = {
    continent: '',
    nation: '',
    region: '',
    zone: '',
    city: '',
};

type ResolvedGeo = {
    continent: string;
    nation: string;
    region: string;
    zone: string;
    city: string;
    breadcrumb: string;
};

type ResolvedTarget = {
    name: string;
    geo: ResolvedGeo | null;
    technicalId: string;
    kind: 'poi' | 'itinerary';
};

/**
 * Cache locale unica (load-time): SoT geo = CitySummary del manifesto.
 * Non usare mai PremadeItinerary.mainCity/zone grezzi come option dei filtri.
 */
type EnrichmentCache = {
    poiById: Map<string, PointOfInterest>;
    byPoiId: Map<string, ResolvedTarget>;
    byItineraryId: Map<string, ResolvedTarget>;
    cityManifest: CitySummary[];
    cityById: Map<string, CitySummary>;
};

const EMPTY_ENRICHMENT: EnrichmentCache = {
    poiById: new Map(),
    byPoiId: new Map(),
    byItineraryId: new Map(),
    cityManifest: [],
    cityById: new Map(),
};

type GeoFilterSnapshot = {
    continent: string;
    nation: string;
    adminRegion: string;
    zone: string;
    cityName: string;
};

function buildBreadcrumb(parts: Array<string | undefined | null>): string {
    const cleaned = parts.map((p) => (p || '').trim()).filter(Boolean);
    return cleaned.filter((item, pos, arr) => !pos || item !== arr[pos - 1]).join(' • ');
}

function geoFromCity(city: CitySummary): ResolvedGeo {
    const continent = city.continent || '';
    const nation = city.nation || '';
    const region = city.adminRegion || '';
    const zone = city.zone || '';
    const cityName = city.name || '';
    return {
        continent,
        nation,
        region,
        zone,
        city: cityName,
        breadcrumb: buildBreadcrumb([cityName, zone, region, nation]),
    };
}

/** Risolve una città dal manifesto: id, slug o nome (mai lasciare slug in UI). */
function resolveCityFromToken(
    token: string | undefined | null,
    cityById: Map<string, CitySummary>,
    manifest: CitySummary[]
): CitySummary | undefined {
    const raw = (token || '').trim();
    if (!raw) return undefined;
    const byId = cityById.get(raw);
    if (byId) return byId;
    const lower = raw.toLowerCase();
    return manifest.find(
        (c) =>
            c.id === raw ||
            c.slug === raw ||
            c.slug?.toLowerCase() === lower ||
            c.name === raw ||
            c.name.toLowerCase() === lower
    );
}

/**
 * Geo itinerario: preferisci cityId negli items → CitySummary.
 * I campi region/zone/mainCity su itineraries possono essere sporchi (zone=Campania, main_city=city_*).
 */
function resolveItineraryCity(
    it: PremadeItinerary,
    cityById: Map<string, CitySummary>,
    manifest: CitySummary[]
): CitySummary | undefined {
    for (const item of it.items || []) {
        const hit = resolveCityFromToken(item.cityId, cityById, manifest);
        if (hit) return hit;
    }
    return resolveCityFromToken(it.mainCity, cityById, manifest);
}

function geoFromItineraryFallback(it: PremadeItinerary): ResolvedGeo | null {
    const region = (it.region || '').trim();
    let zone = (it.zone || '').trim();
    // Leak tipico publish: zone defaultata a admin region
    if (zone && region && zone === region) zone = '';
    const city = (it.mainCity || '').trim();
    // Scarta token tecnici tipo city_* / slug grezzi
    const cityLooksTechnical =
        !city ||
        city.startsWith('city_') ||
        city.includes('_') ||
        city === region ||
        city === zone;
    if (!region && !zone && cityLooksTechnical) return null;
    return {
        continent: it.continent || '',
        nation: it.nation || '',
        region,
        zone,
        city: cityLooksTechnical ? '' : city,
        breadcrumb: buildBreadcrumb([
            cityLooksTechnical ? '' : city,
            zone,
            region,
            it.nation,
        ]),
    };
}

function hasActiveGeoFilter(f: GeoFilterSnapshot): boolean {
    return Boolean(f.continent || f.nation || f.adminRegion || f.zone || f.cityName);
}

function matchesGeoFilter(geo: ResolvedGeo | null | undefined, f: GeoFilterSnapshot): boolean {
    if (!hasActiveGeoFilter(f)) return true;
    if (!geo) return false;
    if (f.continent && geo.continent !== f.continent) return false;
    if (f.nation && geo.nation !== f.nation) return false;
    if (f.adminRegion && geo.region !== f.adminRegion) return false;
    if (f.zone && geo.zone !== f.zone) return false;
    if (f.cityName && geo.city !== f.cityName) return false;
    return true;
}

/** Recensione più utile in moderazione: voto più basso (a parità, più recente). */
function pickAlertEvidenceReview(poiId: string, reviews: Review[]): Review | null {
    const forPoi = reviews.filter((r) => r.poiId === poiId);
    if (forPoi.length === 0) return null;
    return [...forPoi].sort((a, b) => {
        if (a.rating !== b.rating) return a.rating - b.rating;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    })[0];
}

async function buildEnrichmentCache(
    poiIds: string[],
    itineraries: PremadeItinerary[]
): Promise<EnrichmentCache> {
    const uniquePoiIds = Array.from(new Set(poiIds.filter(Boolean)));
    const [pois, manifest] = await Promise.all([
        uniquePoiIds.length > 0 ? getPoisByIds(uniquePoiIds) : Promise.resolve([] as PointOfInterest[]),
        getFullManifestAsync().catch(() => [] as CitySummary[]),
    ]);

    const cityById = new Map<string, CitySummary>();
    for (const city of manifest) {
        if (city.id) cityById.set(city.id, city);
    }

    const poiById = new Map<string, PointOfInterest>();
    const byPoiId = new Map<string, ResolvedTarget>();
    for (const poi of pois) {
        poiById.set(poi.id, poi);
        const city = poi.cityId ? cityById.get(poi.cityId) : undefined;
        const geo = city ? geoFromCity(city) : null;
        byPoiId.set(poi.id, {
            name: poi.name || poi.id,
            geo,
            technicalId: poi.id,
            kind: 'poi',
        });
    }

    for (const id of uniquePoiIds) {
        if (!byPoiId.has(id)) {
            byPoiId.set(id, {
                name: id,
                geo: null,
                technicalId: id,
                kind: 'poi',
            });
        }
    }

    const byItineraryId = new Map<string, ResolvedTarget>();
    for (const it of itineraries) {
        if (!it.id) continue;
        const city = resolveItineraryCity(it, cityById, manifest);
        const geo = city ? geoFromCity(city) : geoFromItineraryFallback(it);
        byItineraryId.set(it.id, {
            name: it.title || it.id,
            geo,
            technicalId: it.id,
            kind: 'itinerary',
        });
    }

    return { poiById, byPoiId, byItineraryId, cityManifest: manifest, cityById };
}

function resolveReviewTarget(
    review: Review,
    cache: EnrichmentCache
): ResolvedTarget {
    if (review.poiId) {
        const fromCache = cache.byPoiId.get(review.poiId);
        if (fromCache) return fromCache;
        const readable = review.poiName?.trim();
        return {
            name:
                readable && !PLACEHOLDER_TARGET_NAMES.has(readable)
                    ? readable
                    : review.poiId,
            geo: null,
            technicalId: review.poiId,
            kind: 'poi',
        };
    }
    if (review.itineraryId) {
        const fromCache = cache.byItineraryId.get(review.itineraryId);
        if (fromCache) return fromCache;
        return {
            name: review.itineraryId,
            geo: null,
            technicalId: review.itineraryId,
            kind: 'itinerary',
        };
    }
    return {
        name: '—',
        geo: null,
        technicalId: '',
        kind: 'poi',
    };
}

const ReviewDetailOverlay = ({
    review,
    target,
    canOpenPoi,
    onClose,
    onOpenPoi,
    onOpenReviews,
}: {
    review: Review;
    target: ResolvedTarget;
    canOpenPoi: boolean;
    onClose: () => void;
    onOpenPoi: () => void;
    onOpenReviews: () => void;
}) => {
    const isMobile = useMobileDetect();
    const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
    const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
    const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
    const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
    const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
    const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);

    useGlobalModalEscape(true, onClose);

    return createPortal(
        <div
            className={`td-modal-overlay ${overlayShell} !items-center !top-0`}
            onClick={onClose}
            style={{ zIndex: Z_OVERLAY }}
        >
            <div
                className={`${containerShell} max-w-lg outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900`}
                style={{ zIndex: Z_MODAL }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-review-detail-title"
                aria-describedby="admin-review-detail-desc"
            >
                <CloseButton
                    onClose={onClose}
                    variant="primary"
                    position="absolute"
                    withEscape={false}
                    className={`${closeOffsetShell} z-local-overlay`}
                />
                <div className={`${bodyShell} flex flex-col gap-5 sm:gap-6`}>
                    <div className="flex items-center gap-3 sm:gap-4 pr-10">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center font-bold text-xl sm:text-2xl text-slate-400 shadow-lg">
                            {review.author.charAt(0)}
                        </div>
                        <div className="min-w-0">
                            <h3 id="admin-review-detail-title" className={`${modalTitleShell} truncate`}>
                                {review.author}
                            </h3>
                            <p className={modalSubtitleShell}>Recensore Community</p>
                        </div>
                    </div>

                    <div className="p-3 sm:p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                        <div className="flex justify-between items-center gap-2 mb-2">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                {target.kind === 'itinerary' ? 'ITINERARIO' : 'POI / LUOGO'}
                            </span>
                            <StarRating value={review.rating} size="w-4 h-4" />
                        </div>
                        <h4
                            className="text-base sm:text-lg font-bold text-white mb-1 break-words"
                            title={target.technicalId || undefined}
                        >
                            {target.name}
                        </h4>
                        {target.geo?.breadcrumb ? (
                            <p className="text-xs text-slate-400 break-words">{target.geo.breadcrumb}</p>
                        ) : null}
                    </div>

                    <div id="admin-review-detail-desc">
                        <p className="text-slate-300 italic text-base sm:text-lg leading-relaxed break-words">
                            &quot;{review.text}&quot;
                        </p>
                    </div>

                    {review.criteria && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border-t border-slate-800 pt-4">
                            {Object.entries(review.criteria).map(([key, val]) => (
                                <div key={key} className="text-center bg-slate-800/80 p-2 rounded-lg min-w-0">
                                    <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1 truncate">
                                        {key}
                                    </span>
                                    <span className="text-amber-500 font-bold">{val}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs border-t border-slate-800 pt-4">
                        <div>
                            <span className="text-slate-500 uppercase font-bold block mb-1">
                                Pubblicata il
                            </span>
                            <span className="text-white font-mono">
                                {new Date(review.date).toLocaleString()}
                            </span>
                        </div>
                        <div className="sm:text-right">
                            <span className="text-slate-500 uppercase font-bold block mb-1">
                                Modificata
                            </span>
                            <span className="text-white font-mono">
                                {review.updatedAt
                                    ? new Date(review.updatedAt).toLocaleString()
                                    : '—'}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-colors"
                        >
                            Chiudi
                        </button>
                        {canOpenPoi && (
                            <>
                                <button
                                    type="button"
                                    onClick={onOpenReviews}
                                    className="flex-1 py-3 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] transition-colors flex items-center justify-center gap-2 border border-slate-700"
                                >
                                    <Star className="w-4 h-4" /> Recensioni
                                </button>
                                <button
                                    type="button"
                                    onClick={onOpenPoi}
                                    className="flex-1 py-3 min-h-[44px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] transition-colors flex items-center justify-center gap-2"
                                >
                                    <ExternalLink className="w-4 h-4" /> Apri POI
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

type PrimaryTab = 'itineraries' | 'reviews';
type ReviewsTab = 'alerts' | 'history';
type HistorySort = 'date_desc' | 'date_asc' | 'author' | 'poi' | 'rating';
type PoiModalView = 'details' | 'reviews';

export const ItineraryManager = () => {
    const { user } = useUser();
    const [primaryTab, setPrimaryTab] = useState<PrimaryTab>('itineraries');
    const [reviewsTab, setReviewsTab] = useState<ReviewsTab>('alerts');
    const [itineraryStatus] = useState<'published' | 'draft'>('published');
    const [reviews, setReviews] = useState<Review[]>([]);
    const [alerts, setAlerts] = useState<ReviewRatingAlert[]>([]);
    const [editingItineraryId, setEditingItineraryId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{
        id: string;
        type: 'itinerary' | 'review';
        name: string;
    } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const [geoSelection, setGeoSelection] = useState<GeoSelection>(EMPTY_GEO_SELECTION);
    const [reviewSearch, setReviewSearch] = useState('');
    const [historySort, setHistorySort] = useState<HistorySort>('date_desc');
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [allOptions, setAllOptions] = useState<PremadeItinerary[]>([]);
    const [enrichment, setEnrichment] = useState<EnrichmentCache>(EMPTY_ENRICHMENT);
    const [previewPoi, setPreviewPoi] = useState<PointOfInterest | null>(null);
    const [poiInitialView, setPoiInitialView] = useState<PoiModalView>('details');

    const enrichmentGenRef = useRef(0);
    const allOptionsRef = useRef<PremadeItinerary[]>([]);
    allOptionsRef.current = allOptions;

    const geoFilters: GeoFilterSnapshot = useMemo(
        () => ({
            continent: geoSelection.continent,
            nation: geoSelection.nation,
            adminRegion: geoSelection.region,
            zone: geoSelection.zone,
            cityName: geoSelection.city,
        }),
        [geoSelection]
    );

    /** Una sola passata di enrichment al load / refresh sorgenti (non in render). */
    const refreshReviewsAlertsAndEnrichment = useCallback(async () => {
        const gen = ++enrichmentGenRef.current;
        let catalog = allOptionsRef.current;
        const needCatalog = catalog.length === 0;

        const [allReviews, openAlerts, fetchedCatalog] = await Promise.all([
            getUnifiedReviews(),
            getOpenReviewRatingAlerts().catch(() => [] as ReviewRatingAlert[]),
            needCatalog ? getAllPremadeItinerariesAsync() : Promise.resolve(catalog),
        ]);

        if (gen !== enrichmentGenRef.current) return;

        if (needCatalog && fetchedCatalog.length > 0) {
            catalog = fetchedCatalog;
            setAllOptions(fetchedCatalog);
        }

        const sortedReviews = allReviews.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setReviews(sortedReviews);
        setAlerts(openAlerts);

        const poiIds = [
            ...openAlerts.map((a) => a.poiId),
            ...sortedReviews.map((r) => r.poiId).filter((id): id is string => Boolean(id)),
        ];
        const cache = await buildEnrichmentCache(poiIds, catalog);
        if (gen !== enrichmentGenRef.current) return;
        setEnrichment(cache);
    }, []);

    const refreshData = useCallback(async () => {
        setIsInitialLoading(true);
        try {
            await refreshReviewsAlertsAndEnrichment();
        } finally {
            setIsInitialLoading(false);
        }
    }, [refreshReviewsAlertsAndEnrichment]);

    // Reviews + alerts + enrichment + catalogo itinerari: mount e ritorno da editor — NON sui filtri geo
    useEffect(() => {
        if (editingItineraryId) return;
        let cancelled = false;
        (async () => {
            setIsInitialLoading(true);
            try {
                await refreshReviewsAlertsAndEnrichment();
            } finally {
                if (!cancelled) setIsInitialLoading(false);
            }
        })();
        return () => {
            cancelled = true;
            enrichmentGenRef.current += 1;
        };
    }, [editingItineraryId, refreshReviewsAlertsAndEnrichment]);

    const handleEdit = (id: string) => setEditingItineraryId(id);
    const handleDeleteRequest = (id: string, type: 'itinerary' | 'review', name: string) =>
        setDeleteTarget({ id, type, name });

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            if (deleteTarget.type === 'itinerary') await deletePremadeItinerary(deleteTarget.id);
            else await deleteReviewAsAdmin(deleteTarget.id);
            await refreshData();
            setDeleteTarget(null);
            setSelectedReview(null);
        } catch {
            alert('Errore cancellazione.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleAcknowledgeAlert = async (alertId: string) => {
        if (!user?.id) return;
        try {
            await acknowledgeReviewRatingAlert(alertId, user.id);
            await refreshReviewsAlertsAndEnrichment();
        } catch {
            alert('Impossibile aggiornare la segnalazione.');
        }
    };

    const openPoiModal = useCallback(
        (poiId: string, view: PoiModalView) => {
            const poi = enrichment.poiById.get(poiId);
            if (!poi) return;
            setSelectedReview(null);
            setPoiInitialView(view);
            setPreviewPoi(poi);
        },
        [enrichment.poiById]
    );

    /** Itinerari: stesso modello geo del manifesto (client-side), non main_city/zone sporchi dal DB. */
    const displayedItineraries = useMemo(() => {
        return allOptions.filter((it) => {
            if (it.status !== itineraryStatus) return false;
            const geo = enrichment.byItineraryId.get(it.id)?.geo;
            return matchesGeoFilter(geo, geoFilters);
        });
    }, [allOptions, itineraryStatus, enrichment.byItineraryId, geoFilters]);

    const displayedAlerts = useMemo(() => {
        return alerts
            .map((alert) => ({
                alert,
                target: enrichment.byPoiId.get(alert.poiId),
                canOpen: enrichment.poiById.has(alert.poiId),
                evidence: pickAlertEvidenceReview(alert.poiId, reviews),
            }))
            .filter(({ target }) => matchesGeoFilter(target?.geo, geoFilters));
    }, [alerts, reviews, enrichment.byPoiId, enrichment.poiById, geoFilters]);

    const displayedHistory = useMemo(() => {
        type HistoryRow = { review: Review; target: ResolvedTarget };
        let rows: HistoryRow[] = reviews.map((review) => ({
            review,
            target: resolveReviewTarget(review, enrichment),
        }));

        rows = rows.filter((row) => matchesGeoFilter(row.target.geo, geoFilters));

        if (reviewSearch.trim()) {
            const lower = reviewSearch.toLowerCase();
            rows = rows.filter(({ review: r, target }) => {
                return (
                    r.author.toLowerCase().includes(lower) ||
                    target.name.toLowerCase().includes(lower) ||
                    (target.geo?.breadcrumb || '').toLowerCase().includes(lower) ||
                    (r.poiId && r.poiId.toLowerCase().includes(lower)) ||
                    r.text.toLowerCase().includes(lower)
                );
            });
        }

        rows.sort((a, b) => {
            switch (historySort) {
                case 'date_asc':
                    return new Date(a.review.date).getTime() - new Date(b.review.date).getTime();
                case 'author':
                    return a.review.author.localeCompare(b.review.author);
                case 'poi':
                    return a.target.name.localeCompare(b.target.name);
                case 'rating':
                    return b.review.rating - a.review.rating;
                case 'date_desc':
                default:
                    return new Date(b.review.date).getTime() - new Date(a.review.date).getTime();
            }
        });
        return rows;
    }, [reviews, reviewSearch, historySort, enrichment, geoFilters]);

    const selectedReviewTarget = useMemo(
        () => (selectedReview ? resolveReviewTarget(selectedReview, enrichment) : null),
        [selectedReview, enrichment]
    );

    const openAlertsCount = displayedAlerts.length;
    const totalOpenAlerts = alerts.length;
    const geoFilterActive = hasActiveGeoFilter(geoFilters);

    if (editingItineraryId)
        return (
            <AdminItineraryEditor
                itineraryId={editingItineraryId}
                onBack={() => setEditingItineraryId(null)}
            />
        );

    return (
        <div className="space-y-4 flex flex-col h-full animate-in fade-in relative">
            {selectedReview && selectedReviewTarget && (
                <ReviewDetailOverlay
                    review={selectedReview}
                    target={selectedReviewTarget}
                    canOpenPoi={Boolean(
                        selectedReview.poiId && enrichment.poiById.has(selectedReview.poiId)
                    )}
                    onClose={() => setSelectedReview(null)}
                    onOpenPoi={() => selectedReview.poiId && openPoiModal(selectedReview.poiId, 'details')}
                    onOpenReviews={() =>
                        selectedReview.poiId && openPoiModal(selectedReview.poiId, 'reviews')
                    }
                />
            )}
            {previewPoi && user && (
                <PoiDetailModal
                    key={`${previewPoi.id}-${poiInitialView}`}
                    poi={previewPoi}
                    onClose={() => setPreviewPoi(null)}
                    onToggleItinerary={() => {}}
                    isInItinerary={false}
                    onOpenReview={() => {}}
                    userLocation={null}
                    onOpenAuth={() => {}}
                    user={user}
                    initialView={poiInitialView}
                />
            )}
            <DeleteConfirmationModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => void confirmDelete()}
                isDeleting={isDeleting}
                title={
                    deleteTarget?.type === 'review'
                        ? 'Rimuovere la recensione?'
                        : "Eliminare l'itinerario?"
                }
                message={
                    deleteTarget?.type === 'review'
                        ? `La recensione verrà rimossa.\n"${deleteTarget?.name ?? ''}"`
                        : `Stai per cancellare:\n"${deleteTarget?.name ?? ''}".`
                }
                confirmLabel={deleteTarget?.type === 'review' ? 'Rimuovi' : 'Elimina'}
                variant="danger"
            />

            <AdminPageHeader
                icon={MapIcon}
                title="Itinerari & Recensioni"
                subtitle="Itinerari community, segnalazioni rating e storico recensioni"
                accent="amber"
                badge={
                    totalOpenAlerts > 0 ? (
                        <span className="inline-flex items-center gap-1.5 bg-rose-600 text-white text-xs px-2 py-1 rounded-full shadow-lg animate-pulse font-normal uppercase tracking-wide">
                            <CountBadge
                                count={totalOpenAlerts}
                                size="sm"
                                variant="white"
                                className="bg-white/20 text-white border-0 min-w-[18px]"
                            />
                            SEGNALAZIONI
                        </span>
                    ) : undefined
                }
            />

            <div className="shrink-0">
                <GeoCascadingFilters
                    cities={enrichment.cityManifest}
                    value={geoSelection}
                    onChange={setGeoSelection}
                    density="compact"
                />
            </div>

            {/* Livello 1 — dominio */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0 gap-1">
                <button
                    type="button"
                    onClick={() => setPrimaryTab('itineraries')}
                    className={`flex-1 min-w-[7rem] py-3 rounded-lg text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${primaryTab === 'itineraries' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                >
                    <LayoutList className="w-4 h-4" /> ITINERARI
                </button>
                <button
                    type="button"
                    onClick={() => setPrimaryTab('reviews')}
                    className={`flex-1 min-w-[7rem] py-3 rounded-lg text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${primaryTab === 'reviews' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                >
                    <MessageSquare className="w-4 h-4" /> RECENSIONI
                    {totalOpenAlerts > 0 && (
                        <CountBadge count={totalOpenAlerts} size="sm" variant="white-black" shape="pill" />
                    )}
                </button>
            </div>

            {/* Livello 2 — sotto-dominio Recensioni */}
            {primaryTab === 'reviews' && (
                <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 shrink-0 gap-1 animate-in fade-in">
                    <button
                        type="button"
                        onClick={() => setReviewsTab('alerts')}
                        className={`flex-1 min-w-[7rem] py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${reviewsTab === 'alerts' ? 'bg-amber-600/90 text-white shadow-md' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                    >
                        <Bell className="w-3.5 h-3.5" /> SEGNALAZIONI
                        {openAlertsCount > 0 && (
                            <CountBadge count={openAlertsCount} size="sm" variant="white-black" shape="pill" />
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setReviewsTab('history')}
                        className={`flex-1 min-w-[7rem] py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${reviewsTab === 'history' ? 'bg-amber-600/90 text-white shadow-md' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                    >
                        <Star className="w-3.5 h-3.5" /> STORICO
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl">
                {isInitialLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                ) : primaryTab === 'itineraries' ? (
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                        {displayedItineraries.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3 border border-dashed border-slate-800 rounded-xl py-16">
                                <MapIcon className="w-10 h-10 text-slate-600" />
                                <p className="text-sm font-bold uppercase tracking-wide">
                                    {geoFilterActive
                                        ? 'Nessun itinerario nell’area selezionata'
                                        : 'Nessun itinerario'}
                                </p>
                                {geoFilterActive ? (
                                    <p className="text-xs text-slate-600 max-w-sm text-center">
                                        Prova a rimuovere o allargare i filtri geografici.
                                    </p>
                                ) : null}
                            </div>
                        ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {displayedItineraries.map((it) => (
                                <div
                                    key={it.id}
                                    className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden group hover:border-slate-600 transition-all shadow-lg flex flex-col h-full relative"
                                >
                                    <div className="h-48 relative shrink-0">
                                        <ImageWithFallback
                                            src={it.coverImage}
                                            alt={it.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                                    </div>
                                    <div className="p-5 flex flex-col flex-1">
                                        <h4 className="font-bold text-white text-xl leading-tight mb-2 line-clamp-2">
                                            {it.title}
                                        </h4>
                                        <div className="flex justify-between items-center pt-4 border-t border-slate-800 mt-auto">
                                            <button
                                                onClick={() => handleEdit(it.id)}
                                                className="flex-1 py-2 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold text-xs uppercase border border-slate-700"
                                            >
                                                Modifica
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        )}
                    </div>
                ) : primaryTab === 'reviews' && reviewsTab === 'alerts' ? (
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-3">
                        {displayedAlerts.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3 border border-dashed border-slate-800 rounded-xl py-16">
                                <CheckCircle className="w-10 h-10 text-emerald-600/60" />
                                <p className="text-sm font-bold uppercase tracking-wide">
                                    {totalOpenAlerts === 0
                                        ? 'Nessuna segnalazione aperta'
                                        : geoFilterActive
                                          ? 'Nessuna segnalazione nell’area selezionata'
                                          : 'Nessuna segnalazione aperta'}
                                </p>
                                <p className="text-xs text-slate-600 max-w-sm text-center">
                                    {totalOpenAlerts === 0
                                        ? 'Quando la media recensioni di un POI scende sotto la soglia del Centro di Controllo, appare qui.'
                                        : 'Prova a rimuovere o allargare i filtri geografici.'}
                                </p>
                            </div>
                        ) : (
                            displayedAlerts.map(({ alert, target, canOpen, evidence }) => {
                                const name = target?.name || alert.poiId;
                                const breadcrumb = target?.geo?.breadcrumb;
                                const criteriaEntries = evidence?.criteria
                                    ? Object.entries(evidence.criteria)
                                    : [];
                                return (
                                    <div
                                        key={alert.id}
                                        className="bg-slate-950 border border-amber-500/30 rounded-xl p-4 flex flex-col gap-4"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                                            <div className="flex-1 min-w-0 space-y-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                                                            Sotto soglia
                                                        </span>
                                                    </div>
                                                    <h4
                                                        className="text-white font-bold text-lg sm:text-xl leading-tight"
                                                        title={alert.poiId}
                                                    >
                                                        {name}
                                                    </h4>
                                                    {breadcrumb ? (
                                                        <p className="text-xs sm:text-sm text-slate-400 mt-1">
                                                            {breadcrumb}
                                                        </p>
                                                    ) : (
                                                        <p className="text-[10px] text-slate-600 mt-1 font-mono truncate">
                                                            {alert.poiId}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <StarRating
                                                            value={alert.averageRating}
                                                            size="w-3.5 h-3.5"
                                                        />
                                                        <strong className="text-amber-400">
                                                            Media {alert.averageRating.toFixed(1)}
                                                        </strong>
                                                        <span className="text-slate-600">
                                                            / soglia {alert.threshold}
                                                        </span>
                                                    </span>
                                                    <span>{alert.reviewsCount} recensioni</span>
                                                    <span className="font-mono text-slate-500">
                                                        {new Date(alert.createdAt).toLocaleString()}
                                                    </span>
                                                </div>

                                                <p className="text-xs text-amber-200/80">
                                                    Motivo: media {alert.averageRating.toFixed(1)} sotto
                                                    soglia {alert.threshold}
                                                </p>

                                                {evidence ? (
                                                    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 sm:p-4 space-y-3">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <div className="min-w-0">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-0.5">
                                                                    Recensione evidenza
                                                                </span>
                                                                <p className="text-sm font-bold text-white truncate">
                                                                    {evidence.author}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <StarRating
                                                                    value={evidence.rating}
                                                                    size="w-3.5 h-3.5"
                                                                />
                                                                <span className="text-amber-400 font-bold text-sm">
                                                                    {evidence.rating}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {evidence.text?.trim() ? (
                                                            <p className="text-sm text-slate-300 italic leading-relaxed line-clamp-3">
                                                                &quot;{evidence.text}&quot;
                                                            </p>
                                                        ) : (
                                                            <p className="text-xs text-slate-600">
                                                                Nessun testo nella recensione.
                                                            </p>
                                                        )}
                                                        {criteriaEntries.length > 0 ? (
                                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-800">
                                                                {criteriaEntries.map(([key, val]) => (
                                                                    <div
                                                                        key={key}
                                                                        className="rounded-lg bg-slate-800/80 px-2 py-2 text-center min-w-0"
                                                                    >
                                                                        <span className="text-[9px] text-slate-400 uppercase font-bold block truncate mb-0.5">
                                                                            {key}
                                                                        </span>
                                                                        <span className="text-amber-500 font-bold text-sm">
                                                                            {val}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-slate-600 border border-dashed border-slate-800 rounded-xl px-3 py-2">
                                                        Nessuna recensione collegata disponibile per il
                                                        dettaglio criteri.
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 w-full sm:w-auto lg:w-44">
                                                <button
                                                    type="button"
                                                    disabled={!canOpen}
                                                    onClick={() => openPoiModal(alert.poiId, 'details')}
                                                    className="px-4 py-2.5 min-h-[44px] rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white text-[10px] font-bold uppercase border border-indigo-500/40 flex items-center justify-center gap-2"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" /> Apri POI
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={!canOpen}
                                                    onClick={() => openPoiModal(alert.poiId, 'reviews')}
                                                    className="px-4 py-2.5 min-h-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-white text-[10px] font-bold uppercase border border-slate-700 flex items-center justify-center gap-2"
                                                >
                                                    <Star className="w-3.5 h-3.5" /> Visualizza recensioni
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void handleAcknowledgeAlert(alert.id)}
                                                    className="px-4 py-2.5 min-h-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold uppercase border border-slate-700"
                                                >
                                                    Segna come vista
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                        <div className="shrink-0 p-3 border-b border-slate-800 flex flex-wrap gap-2 items-center">
                            <input
                                type="search"
                                value={reviewSearch}
                                onChange={(e) => setReviewSearch(e.target.value)}
                                placeholder="Cerca autore, POI, area, testo…"
                                className="flex-1 min-w-[180px] bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                            />
                            <label className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500">
                                <ArrowUpDown className="w-3.5 h-3.5" />
                                <select
                                    value={historySort}
                                    onChange={(e) => setHistorySort(e.target.value as HistorySort)}
                                    className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white"
                                >
                                    <option value="date_desc">Data (recente)</option>
                                    <option value="date_asc">Data (vecchia)</option>
                                    <option value="author">Utente</option>
                                    <option value="poi">POI</option>
                                    <option value="rating">Valutazione</option>
                                </select>
                            </label>
                        </div>
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse min-w-[1100px] table-auto">
                                <thead className="sticky top-0 z-local-sticky bg-[#0f172a] shadow-sm">
                                    <tr className="text-slate-400 text-[10px] uppercase tracking-wider font-bold border-b border-slate-800">
                                        <th className="px-3 py-3 whitespace-nowrap min-w-[7rem]">Utente</th>
                                        <th className="px-3 py-3 whitespace-nowrap min-w-[12rem]">POI / Target</th>
                                        <th className="px-3 py-3 whitespace-nowrap min-w-[5rem]">Continente</th>
                                        <th className="px-3 py-3 whitespace-nowrap min-w-[5rem]">Nazione</th>
                                        <th className="px-3 py-3 whitespace-nowrap min-w-[5rem]">Regione</th>
                                        <th className="px-3 py-3 whitespace-nowrap min-w-[5rem]">Zona</th>
                                        <th className="px-3 py-3 whitespace-nowrap min-w-[5rem]">Città</th>
                                        <th className="px-3 py-3 min-w-[8rem]">Snippet</th>
                                        <th className="px-2 py-3 text-center whitespace-nowrap">Voto</th>
                                        <th className="px-3 py-3 whitespace-nowrap text-center">Data</th>
                                        <th className="px-3 py-3 whitespace-nowrap text-center">Modificata</th>
                                        <th className="px-3 py-3 whitespace-nowrap text-right">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50 bg-slate-900">
                                    {displayedHistory.map(({ review, target }) => {
                                        const canOpen =
                                            Boolean(review.poiId) && enrichment.poiById.has(review.poiId!);
                                        return (
                                            <tr
                                                key={review.id}
                                                onClick={() => setSelectedReview(review)}
                                                className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                                            >
                                                <td className="px-3 py-3 font-bold text-white text-sm max-w-[9rem] truncate">
                                                    {review.author}
                                                </td>
                                                <td
                                                    className="px-3 py-3 max-w-[16rem]"
                                                    title={target.technicalId || undefined}
                                                >
                                                    <div className="font-bold text-white text-sm truncate">
                                                        {target.name}
                                                    </div>
                                                    {target.geo?.breadcrumb ? (
                                                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                                            {target.geo.breadcrumb}
                                                        </div>
                                                    ) : null}
                                                </td>
                                                <td className="px-3 py-3 text-[11px] text-slate-400 whitespace-nowrap">
                                                    {target.geo?.continent || '—'}
                                                </td>
                                                <td className="px-3 py-3 text-[11px] text-slate-400 whitespace-nowrap">
                                                    {target.geo?.nation || '—'}
                                                </td>
                                                <td className="px-3 py-3 text-[11px] text-slate-400 whitespace-nowrap">
                                                    {target.geo?.region || '—'}
                                                </td>
                                                <td className="px-3 py-3 text-[11px] text-slate-400 whitespace-nowrap">
                                                    {target.geo?.zone || '—'}
                                                </td>
                                                <td className="px-3 py-3 text-[11px] text-slate-400 whitespace-nowrap">
                                                    {target.geo?.city || '—'}
                                                </td>
                                                <td className="px-3 py-3 max-w-[14rem]">
                                                    <p className="text-xs text-slate-400 italic truncate">
                                                        &quot;{review.text}&quot;
                                                    </p>
                                                </td>
                                                <td className="px-2 py-3 text-center font-bold text-amber-500 text-xs">
                                                    {review.rating}
                                                </td>
                                                <td className="px-3 py-3 text-center font-mono text-[10px] text-slate-500 whitespace-nowrap">
                                                    {new Date(review.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-3 py-3 text-center font-mono text-[10px] text-slate-500 whitespace-nowrap">
                                                    {review.updatedAt
                                                        ? new Date(review.updatedAt).toLocaleDateString()
                                                        : '—'}
                                                </td>
                                                <td className="px-3 py-3 text-right">
                                                    <div
                                                        className="flex gap-1 justify-end opacity-80 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {canOpen && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openPoiModal(review.poiId!, 'details')
                                                                }
                                                                className="p-2 min-h-[40px] min-w-[40px] hover:bg-indigo-900/30 rounded text-slate-400 hover:text-indigo-300 flex items-center justify-center"
                                                                title="Apri POI"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDeleteRequest(
                                                                    review.id,
                                                                    'review',
                                                                    `Recensione di ${review.author}`
                                                                )
                                                            }
                                                            className="p-2 min-h-[40px] min-w-[40px] hover:bg-red-900/20 rounded text-slate-500 hover:text-red-500 flex items-center justify-center"
                                                            title="Rimuovi"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
