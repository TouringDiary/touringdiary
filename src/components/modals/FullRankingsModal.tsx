import { ArrowUpDown, ChevronDown, ChevronUp, Info, Loader2, Trophy } from 'lucide-react';

import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_MODAL, Z_OVERLAY } from '@/constants/zIndex';
import { useModal } from '@/context/ModalContext';
import { useDynamicStyles } from '@/hooks/useDynamicStyles';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { type SortKey, useRankingsLogic } from '../../hooks/useRankingsLogic';
import type { CitySummary, PhotoSubmission, PointOfInterest } from '../../types/index';
import { GalleryLightbox, type LightboxData } from '../city/gallery/GalleryLightbox';
import { PaginationControls } from '../common/PaginationControls';
// Sub-Components
import { CityRow } from '../rankings/CityRow';
import { PhotoGrid } from '../rankings/PhotoGrid';
import { PoiList } from '../rankings/PoiList';
import { ALGO_CONFIG, RankingFilters } from '../rankings/RankingFilters';

/**
 * Elemento di `processedData`: union già tipizzata da useRankingsLogic
 * (città da getRankedCities, foto/POI da getTopCommunityPhotos / getTopCommunityPois).
 * I guard sotto discriminano questa union; non parsano `unknown`.
 */
type RankingsProcessedItem = ReturnType<typeof useRankingsLogic>['processedData'][number];

/** Costituente città della union — contratto CityRow / getRankedCities. */
type RankedCity = Extract<RankingsProcessedItem, CitySummary>;
/** Costituente foto della union — contratto PhotoGrid / getTopCommunityPhotos. */
type RankedPhoto = Extract<RankingsProcessedItem, PhotoSubmission>;
/** Costituente POI della union — contratto PoiList / onOpenPoi / getTopCommunityPois. */
type RankedPoi = Extract<RankingsProcessedItem, PointOfInterest>;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Discriminant foto nella union: solo PhotoSubmission ha `url` + `locationName`.
 * id/user sono i campi stringa che PhotoGrid e il lightbox usano realmente.
 */
function isRankedPhoto(item: RankingsProcessedItem): item is RankedPhoto {
  return (
    'url' in item &&
    typeof item.url === 'string' &&
    'locationName' in item &&
    typeof item.locationName === 'string' &&
    typeof item.id === 'string' &&
    typeof item.user === 'string'
  );
}

/**
 * Discriminant città nella union: solo CitySummary ha visitors + geo di riga (zone/nazione).
 * I campi controllati sono quelli che CityRow legge (rating.toFixed, imageUrl, …).
 * slug/continent/status/isFeatured/description/coords non discriminano e non servono alla riga.
 */
function isRankedCity(item: RankingsProcessedItem): item is RankedCity {
  if (isRankedPhoto(item)) return false;
  return (
    typeof item.id === 'string' &&
    'name' in item &&
    typeof item.name === 'string' &&
    'imageUrl' in item &&
    typeof item.imageUrl === 'string' &&
    'zone' in item &&
    typeof item.zone === 'string' &&
    'adminRegion' in item &&
    typeof item.adminRegion === 'string' &&
    'nation' in item &&
    typeof item.nation === 'string' &&
    'rating' in item &&
    isFiniteNumber(item.rating) &&
    'visitors' in item &&
    isFiniteNumber(item.visitors)
  );
}

/**
 * Discriminant POI: ciò che resta dopo foto/città, con id/name/description/category.
 * `category` come stringa distingue il costituente PointOfInterest (le città non ce l'hanno);
 * il tipo category del costituente resta PoiCategory, non viene allargato.
 */
function isRankedPoi(item: RankingsProcessedItem): item is RankedPoi {
  if (isRankedPhoto(item) || isRankedCity(item)) return false;
  return (
    typeof item.id === 'string' &&
    'name' in item &&
    typeof item.name === 'string' &&
    'description' in item &&
    typeof item.description === 'string' &&
    'category' in item &&
    typeof item.category === 'string'
  );
}

const rankedPhotoToLightbox = (photo: RankedPhoto): LightboxData => ({
  id: photo.id,
  url: photo.url,
  user: photo.user,
  likes: photo.likes,
  likedByUser: photo.likedByUser,
  caption: photo.description,
  date: photo.date,
});

/** City cover as single image — no invented photo likes/date metadata. */
const cityCoverToLightbox = (city: RankedCity): LightboxData | null => {
  if (!city.imageUrl) return null;
  return {
    id: city.id,
    url: city.imageUrl,
    user: city.name,
  };
};

interface Props {
  onClose: () => void;
  onNavigateToCity?: (cityId: string) => void;
  onOpenPoi?: (poi: PointOfInterest) => void;
  isOpen?: boolean;
}

export const FullRankingsModal = ({
  onClose,
  onNavigateToCity,
  onOpenPoi,
  isOpen = true,
}: Props) => {
  const { openModal } = useModal();
  // USE HOOK
  const {
    mainTab,
    setMainTab,
    cityAlgo,
    setCityAlgo,
    sortKey,
    sortDir,
    search,
    setSearch,
    selectedZone,
    setSelectedZone,
    availableZones,
    loading,
    processedData,
    handleSort,
    // Pagination Props
    page,
    pageSize,
    totalItems,
    nextPage,
    prevPage,
  } = useRankingsLogic();

  const filterSectionLabel10Style = useDynamicStyles('filter_section_title', true);

  // Index into `lightboxPhotos` (photographic collection only — never raw processedData).
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [lightboxPhotos, setLightboxPhotos] = useState<LightboxData[]>([]);

  // ESC Key Management
  useGlobalModalEscape(isOpen, onClose);

  const rankedCities = useMemo((): RankedCity[] => {
    if (mainTab !== 'cities') return [];
    const out: RankedCity[] = [];
    for (const item of processedData) {
      if (isRankedCity(item)) out.push(item);
    }
    return out;
  }, [mainTab, processedData]);
  const rankedPhotos = useMemo((): RankedPhoto[] => {
    if (mainTab !== 'gallery') return [];
    const out: RankedPhoto[] = [];
    for (const item of processedData) {
      if (isRankedPhoto(item)) out.push(item);
    }
    return out;
  }, [mainTab, processedData]);
  const rankedPois = useMemo((): RankedPoi[] => {
    if (mainTab !== 'pois') return [];
    const out: RankedPoi[] = [];
    for (const item of processedData) {
      if (isRankedPoi(item)) out.push(item);
    }
    return out;
  }, [mainTab, processedData]);

  const visibleCount =
    mainTab === 'cities'
      ? rankedCities.length
      : mainTab === 'gallery'
        ? rankedPhotos.length
        : rankedPois.length;

  const lightboxData =
    activePhotoIndex !== null && lightboxPhotos[activePhotoIndex]
      ? lightboxPhotos[activePhotoIndex]
      : null;

  const openGalleryPhoto = (url: string) => {
    const collection = rankedPhotos.map(rankedPhotoToLightbox);
    const idx = collection.findIndex((p) => p.url === url);
    if (idx === -1) return;
    setLightboxPhotos(collection);
    setActivePhotoIndex(idx);
  };

  /** City cover zoom: single-item session so next/prev never walk cities/POIs. */
  const openCityCover = (url: string) => {
    const city = rankedCities.find((item) => item.imageUrl === url);
    if (!city) return;
    const entry = cityCoverToLightbox(city);
    if (!entry) return;
    setLightboxPhotos([entry]);
    setActivePhotoIndex(0);
  };

  const closeLightbox = () => {
    setActivePhotoIndex(null);
    setLightboxPhotos([]);
  };

  if (!isOpen) return null;

  const SortIcon = ({ col }: { col: SortKey }) => {
    // Se siamo su cities, il sort è disabilitato (server-side fisso su algo)
    if (mainTab === 'cities') return null;
    if (sortKey !== col)
      return <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-50" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-amber-500" />
    ) : (
      <ChevronDown className="w-3 h-3 text-amber-500" />
    );
  };

  return createPortal(
    <div
      className="td-modal-overlay bg-black/95 backdrop-blur-md flex items-center justify-center p-0 md:p-4 pointer-events-auto animate-in fade-in"
      style={{ zIndex: Z_OVERLAY }}
      role="presentation"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full cursor-default border-0 bg-transparent p-0"
        onClick={onClose}
      />
      {/* GALLERY LIGHTBOX */}
      {lightboxData && (
        <GalleryLightbox
          data={lightboxData}
          onClose={closeLightbox}
          onNext={() =>
            setActivePhotoIndex((i) => (i !== null && i < lightboxPhotos.length - 1 ? i + 1 : i))
          }
          onPrev={() => setActivePhotoIndex((i) => (i !== null && i > 0 ? i - 1 : i))}
          hasNext={activePhotoIndex !== null && activePhotoIndex < lightboxPhotos.length - 1}
          hasPrev={activePhotoIndex !== null && activePhotoIndex > 0}
          allPhotos={lightboxPhotos}
          currentIndex={activePhotoIndex ?? 0}
          onGoToPhoto={setActivePhotoIndex}
        />
      )}

      <div
        className="relative bg-[#020617] w-full max-w-6xl h-full md:h-[90vh] md:rounded-3xl border-0 md:border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 pointer-events-auto"
        style={{ zIndex: Z_MODAL }}
      >
        {/* HEADER & FILTERS */}
        <div className="flex flex-col p-6 border-b border-slate-800 bg-[#0f172a] shrink-0 gap-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-600 rounded-xl shadow-lg shadow-amber-900/20 text-white">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-white uppercase tracking-wide leading-none">
                  Classifiche
                </h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                  Il meglio della Campania
                </p>
              </div>
            </div>
            <CloseButton onClose={onClose} variant="primary" />
          </div>

          <RankingFilters
            mainTab={mainTab}
            setMainTab={setMainTab}
            cityAlgo={cityAlgo}
            setCityAlgo={setCityAlgo}
            search={search}
            setSearch={setSearch}
            selectedZone={selectedZone}
            setSelectedZone={setSelectedZone}
            availableZones={availableZones}
            onClose={onClose}
          />
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-[#020617] relative flex flex-col">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                  Calcolo classifiche...
                </p>
              </div>
            </div>
          ) : (
            <>
              {mainTab === 'cities' && (
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left border-collapse">
                    <thead className="bg-[#0f172a] sticky top-0 z-floating-panel shadow-sm border-b border-slate-800">
                      <tr className={filterSectionLabel10Style}>
                        <th scope="col" className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleSort('rank')}
                            className="inline-flex min-h-[44px] items-center justify-center gap-1 px-2 rounded-lg hover:text-white group"
                          >
                            Rank <SortIcon col="rank" />
                          </button>
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Foto
                        </th>
                        <th scope="col" className="px-2 py-2">
                          <button
                            type="button"
                            onClick={() => handleSort('name')}
                            className="inline-flex min-h-[44px] items-center gap-1 px-2 rounded-lg hover:text-white group"
                          >
                            Città <SortIcon col="name" />
                          </button>
                        </th>
                        <th scope="col" className="px-2 py-2">
                          <button
                            type="button"
                            onClick={() => handleSort('zone')}
                            className="inline-flex min-h-[44px] items-center gap-1 px-2 rounded-lg hover:text-white group"
                          >
                            Zona <SortIcon col="zone" />
                          </button>
                        </th>
                        <th scope="col" className="px-4 py-3 hidden md:table-cell">
                          Contesto
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Badge
                        </th>
                        <th scope="col" className="px-2 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleSort('visitors')}
                            className="inline-flex min-h-[44px] w-full items-center justify-end gap-1 px-2 rounded-lg hover:text-white group"
                          >
                            Visitatori <SortIcon col="visitors" />
                          </button>
                        </th>
                        <th scope="col" className="px-2 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleSort('rating')}
                            className="inline-flex min-h-[44px] w-full items-center justify-end gap-1 px-2 rounded-lg hover:text-white group"
                          >
                            Rating <SortIcon col="rating" />
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {rankedCities.map((city, idx: number) => (
                        <CityRow
                          key={city.id}
                          item={city}
                          originalRank={city.originalRank ?? idx + 1}
                          type={cityAlgo}
                          onNavigate={() => {
                            onClose();
                            if (onNavigateToCity) onNavigateToCity(city.id);
                          }}
                          onZoom={openCityCover}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {mainTab === 'gallery' && (
                <PhotoGrid
                  photos={rankedPhotos}
                  onClick={openGalleryPhoto}
                  onOpenAuth={() => openModal('auth')}
                />
              )}

              {mainTab === 'pois' && (
                <PoiList
                  pois={rankedPois}
                  onClick={(poi) => {
                    if (onOpenPoi) onOpenPoi(poi);
                  }}
                />
              )}

              {visibleCount === 0 && (
                <div className="text-center py-20 text-slate-500 italic bg-slate-900/30 m-6 rounded-3xl border border-slate-800 border-dashed">
                  Nessun risultato trovato per la ricerca "{search}"{' '}
                  {selectedZone ? `in zona "${selectedZone}"` : ''}.
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER INFO - SOLO PER CITTÀ PAGINATE */}
        {mainTab === 'cities' && (
          <div className="bg-[#0f172a] border-t border-slate-800 p-4 shrink-0 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3 w-full md:w-auto">
              <div className="p-2 bg-slate-800 rounded-full text-slate-400 shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-[10px] font-black uppercase text-slate-300 tracking-widest mb-1">
                  Modalità Calcolo: {ALGO_CONFIG[cityAlgo].label}
                </h5>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                  {ALGO_CONFIG[cityAlgo].desc}
                </p>
              </div>
            </div>

            {/* PAGINAZIONE */}
            <div className="w-full md:w-auto flex justify-center">
              <PaginationControls
                currentPage={page}
                maxPage={Math.ceil(totalItems / pageSize)}
                onNext={nextPage}
                onPrev={prevPage}
                totalItems={totalItems}
              />
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
