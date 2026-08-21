import { Bell, LayoutList, Loader2, Map as MapIcon, MessageSquare, Star } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { CountBadge } from '@/components/ui/CountBadge';
import { useUser } from '@/context/UserContext';
import {
  acknowledgeReviewRatingAlert,
  deletePremadeItinerary,
  deleteReviewAsAdmin,
} from '../../services/communityService';
import type { PointOfInterest, Review } from '../../types/index';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { PoiDetailModal } from '../modals/PoiDetailModal';
import { AdminItineraryEditor } from './AdminItineraryEditor';
import { GeoCascadingFilters, type GeoSelection } from './cities/GeoCascadingFilters';
import { AdminPageHeader } from './common/AdminPageHeader';
import { ItineraryManagerItineraries } from './itineraryManager/ItineraryManagerItineraries';
import { ItineraryManagerReviewDetail } from './itineraryManager/ItineraryManagerReviewDetail';
import {
  type HistorySort,
  ItineraryManagerReviews,
} from './itineraryManager/ItineraryManagerReviews';
import {
  EMPTY_GEO_SELECTION,
  type GeoFilterSnapshot,
  hasActiveGeoFilter,
  pickAlertEvidenceReview,
  type ResolvedTarget,
  resolveReviewTarget,
  targetMatchesGeoFilter,
} from './itineraryManager/itineraryManagerGeo';
import { useItineraryManagerData } from './itineraryManager/useItineraryManagerData';

type PrimaryTab = 'itineraries' | 'reviews';
type ReviewsTab = 'alerts' | 'history';
type PoiModalView = 'details' | 'reviews';

export const ItineraryManager = () => {
  const { user } = useUser();
  const [primaryTab, setPrimaryTab] = useState<PrimaryTab>('itineraries');
  const [reviewsTab, setReviewsTab] = useState<ReviewsTab>('alerts');
  const [itineraryStatus] = useState<'published' | 'draft'>('published');
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
  const [previewPoi, setPreviewPoi] = useState<PointOfInterest | null>(null);
  const [poiInitialView, setPoiInitialView] = useState<PoiModalView>('details');

  const isDeletingRef = useRef(false);

  const {
    reviews,
    alerts,
    allOptions,
    enrichment,
    isInitialLoading,
    refreshReviewsAlertsAndEnrichment,
    refreshData,
  } = useItineraryManagerData(editingItineraryId);

  const geoFilters: GeoFilterSnapshot = useMemo(
    () => ({
      continent: geoSelection.continent,
      nation: geoSelection.nation,
      adminRegion: geoSelection.region,
      zone: geoSelection.zone,
      cityName: geoSelection.city,
    }),
    [geoSelection],
  );

  const handleEdit = (id: string) => setEditingItineraryId(id);
  const handleDeleteRequest = (id: string, type: 'itinerary' | 'review', name: string) =>
    setDeleteTarget({ id, type, name });

  const confirmDelete = async () => {
    if (!deleteTarget || isDeletingRef.current) return;
    isDeletingRef.current = true;
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
      isDeletingRef.current = false;
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
    [enrichment.poiById],
  );

  const geoFilterActive = hasActiveGeoFilter(geoFilters);
  const applyGeoFilter = geoFilterActive && !enrichment.manifestLoadError;
  const geoFilterBlocked = geoFilterActive && enrichment.manifestLoadError;

  /** Itinerari: stesso modello geo del manifesto (client-side), non main_city/zone sporchi dal DB. */
  const displayedItineraries = useMemo(() => {
    return allOptions.filter((it) => {
      if (it.status !== itineraryStatus) return false;
      if (!applyGeoFilter) return true;
      const target = enrichment.byItineraryId.get(it.id);
      return targetMatchesGeoFilter(target, geoFilters);
    });
  }, [allOptions, itineraryStatus, enrichment.byItineraryId, geoFilters, applyGeoFilter]);

  const displayedAlerts = useMemo(() => {
    return alerts
      .map((alert) => ({
        alert,
        target: enrichment.byPoiId.get(alert.poiId),
        canOpen: enrichment.poiById.has(alert.poiId),
        evidence: pickAlertEvidenceReview(alert.poiId, reviews),
      }))
      .filter(({ target }) => !applyGeoFilter || targetMatchesGeoFilter(target, geoFilters));
  }, [alerts, reviews, enrichment.byPoiId, enrichment.poiById, geoFilters, applyGeoFilter]);

  const displayedHistory = useMemo(() => {
    type HistoryRow = { review: Review; target: ResolvedTarget };
    let rows: HistoryRow[] = reviews.map((review) => ({
      review,
      target: resolveReviewTarget(review, enrichment),
    }));

    rows = rows.filter((row) => !applyGeoFilter || targetMatchesGeoFilter(row.target, geoFilters));

    if (reviewSearch.trim()) {
      const lower = reviewSearch.toLowerCase();
      rows = rows.filter(({ review: r, target }) => {
        return (
          r.author.toLowerCase().includes(lower) ||
          target.name.toLowerCase().includes(lower) ||
          (target.geo?.breadcrumb || '').toLowerCase().includes(lower) ||
          r.poiId?.toLowerCase().includes(lower) ||
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
        default:
          return new Date(b.review.date).getTime() - new Date(a.review.date).getTime();
      }
    });
    return rows;
  }, [reviews, reviewSearch, historySort, enrichment, geoFilters, applyGeoFilter]);

  const selectedReviewTarget = useMemo(
    () => (selectedReview ? resolveReviewTarget(selectedReview, enrichment) : null),
    [selectedReview, enrichment],
  );

  const openAlertsCount = displayedAlerts.length;
  const totalOpenAlerts = alerts.length;

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
        <ItineraryManagerReviewDetail
          review={selectedReview}
          target={selectedReviewTarget}
          canOpenPoi={Boolean(selectedReview.poiId && enrichment.poiById.has(selectedReview.poiId))}
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
          deleteTarget?.type === 'review' ? 'Rimuovere la recensione?' : "Eliminare l'itinerario?"
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

      <div className="shrink-0 space-y-2">
        <GeoCascadingFilters
          cities={enrichment.cityManifest}
          value={geoSelection}
          onChange={setGeoSelection}
          density="compact"
        />
        {geoFilterBlocked ? (
          <p className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            Manifesto geografico non disponibile: il filtro selezionato non è applicato per evitare
            risultati errati. Riprova aggiornando la pagina.
          </p>
        ) : null}
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
          <ItineraryManagerItineraries
            items={displayedItineraries}
            geoFilterActive={geoFilterActive}
            onEdit={handleEdit}
          />
        ) : (
          <ItineraryManagerReviews
            reviewsTab={reviewsTab}
            displayedAlerts={displayedAlerts}
            displayedHistory={displayedHistory}
            totalOpenAlerts={totalOpenAlerts}
            geoFilterActive={geoFilterActive}
            reviewSearch={reviewSearch}
            onReviewSearchChange={setReviewSearch}
            historySort={historySort}
            onHistorySortChange={setHistorySort}
            poiById={enrichment.poiById}
            onOpenPoi={openPoiModal}
            onAcknowledgeAlert={(alertId) => void handleAcknowledgeAlert(alertId)}
            onSelectReview={setSelectedReview}
            onDeleteRequest={handleDeleteRequest}
          />
        )}
      </div>
    </div>
  );
};
