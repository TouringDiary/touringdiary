import { ChevronLeft, ChevronRight, Grid, Heart, List } from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_MODAL, Z_MODAL_NESTED, Z_OVERLAY } from '@/constants/zIndex';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { useInteraction } from '../../context/InteractionContext';
import { useCityData } from '../../hooks/useCityData';
import type { PhotoSubmission } from '../../types/index';
import { PreviewGallery } from './sectionPreview/PreviewGallery';
import { PreviewHero } from './sectionPreview/PreviewHero';
import { PreviewRatings } from './sectionPreview/PreviewRatings';
// Sub-components
import {
  type CategoryConfig,
  type PreviewListItem,
  PreviewSidebar,
} from './sectionPreview/PreviewSidebar';

interface SectionPreviewModalProps {
  onClose: () => void;
  cities: PreviewListItem[];
  title: string;
  icon?: React.ReactNode;
  onCitySelect: (id: string) => void;
  initialSelectedId?: string | null;
  categories?: CategoryConfig[];
  isOpen?: boolean;
}

/** Discriminante locale: le città in lista espongono sempre `visitors` numerico. */
const isCityListItem = (item: PreviewListItem): boolean => typeof item.visitors === 'number';

export const SectionPreviewModal = ({
  onClose,
  cities,
  title,
  icon,
  initialSelectedId,
  onCitySelect,
  categories,
  isOpen = true,
}: SectionPreviewModalProps) => {
  const [selectedCityId, setSelectedCityId] = useState<string | null>(initialSelectedId || null);
  const [lightboxData, setLightboxData] = useState<PhotoSubmission | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryConfig | null>(
    categories ? categories[0] : null,
  );
  const [showMobileList, setShowMobileList] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  const { getPhotoStatus, togglePhotoHeart, isGuest } = useInteraction();

  const filteredItemsByTab = useMemo(() => {
    if (!categories || !activeCategory) return cities;
    return cities.filter((c) => c.specialBadge === activeCategory.badge);
  }, [cities, categories, activeCategory]);

  useEffect(() => {
    if (!isOpen) return;
    if (filteredItemsByTab.length > 0) {
      const currentInList = filteredItemsByTab.find((c) => c.id === selectedCityId);
      if (!currentInList) {
        setSelectedCityId(filteredItemsByTab[0].id);
      }
    }
  }, [isOpen, filteredItemsByTab, selectedCityId]);

  const selectedItem = filteredItemsByTab.find((c) => c.id === selectedCityId);
  const isCityObject = !!selectedItem && isCityListItem(selectedItem);

  const { city: hookCity, loading } = useCityData(isOpen && isCityObject ? selectedCityId : null);

  // ESC gerarchico: lightbox prima, poi modale
  useGlobalModalEscape(isOpen, () => {
    if (lightboxData) {
      setLightboxData(null);
    } else {
      onClose();
    }
  });

  if (!isOpen) return null;

  const handleItemSelectWrapper = (id: string) => {
    setSelectedCityId(id);
    setShowMobileList(false);
  };

  const handleSwitchTab = (direction: 'prev' | 'next') => {
    if (!categories || !activeCategory) return;
    const currentIndex = categories.findIndex((c) => c.id === activeCategory.id);
    if (currentIndex === -1) return;

    let newIndex: number;
    if (direction === 'prev') {
      newIndex = (currentIndex - 1 + categories.length) % categories.length;
    } else {
      newIndex = (currentIndex + 1) % categories.length;
    }

    const newCat = categories[newIndex];
    setActiveCategory(newCat);

    if (tabsRef.current) {
      const tabButtons = tabsRef.current.querySelectorAll('button');
      const targetBtn = tabButtons[newIndex];
      if (targetBtn) {
        targetBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  };

  return createPortal(
    <div
      className="td-modal-overlay flex items-center justify-center p-0 md:p-4 animate-in fade-in"
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
      <div
        className="relative bg-[#020617] w-full max-w-7xl h-full rounded-none md:rounded-xl border-x-0 md:border border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 pointer-events-auto"
        style={{ zIndex: Z_MODAL }}
      >
        {/* 1. HEADER */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-slate-800 bg-[#0f172a] shrink-0 relative">
          <div className="flex items-center gap-3">
            <div
              className={`p-1.5 rounded-lg border border-slate-800 ${activeCategory ? 'bg-slate-900' : 'bg-slate-900 text-amber-500'}`}
            >
              <div className={activeCategory ? activeCategory.color : ''}>
                {icon || <Grid className="w-4 h-4" />}
              </div>
            </div>
            <h2
              className={`text-sm md:text-lg font-display font-bold uppercase tracking-wide ${activeCategory ? activeCategory.color : 'text-white'}`}
            >
              {activeCategory ? activeCategory.label : title}
            </h2>
            <span className="bg-slate-800 text-slate-400 text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-700">
              {filteredItemsByTab.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMobileList(!showMobileList)}
              className="md:hidden p-2 bg-slate-800 text-slate-300 rounded-full hover:bg-slate-700 transition-colors border border-slate-700"
              title="Lista Elementi"
            >
              <List className="w-4 h-4" />
            </button>

            <CloseButton onClose={onClose} variant="primary" />
          </div>
        </div>

        {/* 2. CATEGORY TABS */}
        {categories && (
          <div className="bg-[#020617] shrink-0 relative flex flex-col">
            <div className="px-4 md:px-6 pt-1 overflow-x-auto no-scrollbar" ref={tabsRef}>
              <div className="flex gap-8 min-w-max">
                {categories.map((cat) => {
                  const isActive = activeCategory?.id === cat.id;

                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setActiveCategory(cat)}
                      className={`
                                                relative flex-shrink-0 py-2 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] transition-colors group
                                                ${isActive ? 'text-orange-500' : 'text-yellow-400 hover:text-orange-500'}
                                            `}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-4 pb-2 pt-1 border-b border-slate-800 bg-[#020617] relative">
              <button
                type="button"
                onClick={() => handleSwitchTab('prev')}
                aria-label="Categoria precedente"
                className="text-amber-500 hover:text-amber-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" aria-hidden />
              </button>

              <div className="flex items-center">
                {categories.map((cat) => {
                  const isActive = activeCategory?.id === cat.id;
                  const bgClass = cat.color.replace('text-', 'bg-');

                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setActiveCategory(cat)}
                      aria-label={cat.label}
                      aria-current={isActive ? 'true' : undefined}
                      title={cat.label}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <span
                        className={`
                          block transition-all duration-300 rounded-full
                          ${
                            isActive
                              ? `w-4 h-2 ${bgClass} shadow-[0_0_8px_currentColor]`
                              : 'w-2 h-2 bg-slate-700'
                          }
                        `}
                      />
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => handleSwitchTab('next')}
                aria-label="Categoria successiva"
                className="text-amber-500 hover:text-amber-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5" aria-hidden />
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden relative">
          <div
            className={`
                        absolute inset-0 bg-[#020617] transition-transform duration-300 md:relative md:translate-x-0 md:w-80 border-r border-slate-800 flex flex-col
                        ${showMobileList ? 'translate-x-0' : '-translate-x-full md:transform-none'}
                    `}
          >
            <div className="md:hidden p-4 border-b border-slate-800 flex justify-between items-center bg-[#0f172a]">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Seleziona
              </span>
              <CloseButton onClose={() => setShowMobileList(false)} variant="primary" />
            </div>
            <PreviewSidebar
              cities={filteredItemsByTab}
              selectedCityId={selectedCityId}
              onSelectCity={handleItemSelectWrapper}
              activeCategory={activeCategory}
              className="flex-1"
            />
          </div>

          <div className="flex-1 overflow-y-auto md:overflow-hidden bg-slate-950 relative custom-scrollbar">
            {loading && isCityObject ? (
              <div className="flex items-center justify-center h-full">
                <div
                  className={`w-10 h-10 border-2 border-slate-700 rounded-full animate-spin ${activeCategory ? activeCategory.color.replace('text-', 'border-t-') : 'border-t-amber-500'}`}
                ></div>
              </div>
            ) : isCityObject && hookCity ? (
              <div className="animate-in fade-in duration-500 flex flex-col min-h-full md:h-full pb-32 md:pb-0">
                <PreviewHero
                  city={hookCity}
                  onExplore={onCitySelect}
                  className="h-[220px] md:h-[35%] min-h-[220px] shrink-0"
                />

                <div className="px-4 md:px-8 mt-2 md:mt-0 relative flex flex-col justify-start gap-2 shrink-0 md:flex-1 md:min-h-0 md:overflow-hidden pt-4 pb-4">
                  <PreviewRatings city={hookCity} />
                </div>

                <PreviewGallery
                  city={hookCity}
                  onOpenLightbox={setLightboxData}
                  activeCategoryColor={activeCategory ? activeCategory.color : ''}
                  className="h-[220px] md:h-[28%] min-h-[220px] mt-auto shrink-0 bg-slate-950 border-t border-slate-800"
                />
              </div>
            ) : selectedItem ? (
              <div className="animate-in fade-in duration-500 flex flex-col min-h-full md:h-full pb-32 md:pb-0">
                {/* Non-città: PreviewListItem ≠ CityDetails — anteprima locale senza cast */}
                <div className="h-[220px] md:h-[35%] min-h-[220px] shrink-0 relative bg-slate-900 border-b border-slate-800 flex flex-col justify-end p-6 md:p-8">
                  <h1 className="text-2xl md:text-4xl font-display font-bold text-white leading-tight">
                    {selectedItem.name}
                  </h1>
                  {(selectedItem.role || selectedItem.category || selectedItem.type) && (
                    <p className="text-slate-400 text-sm mt-2 uppercase tracking-widest font-bold">
                      {selectedItem.role || selectedItem.category || selectedItem.type}
                    </p>
                  )}
                  {selectedItem.zone && (
                    <p className="text-slate-500 text-xs mt-1">{selectedItem.zone}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => onCitySelect(selectedItem.id)}
                    className="mt-4 self-start bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg text-[10px] uppercase tracking-wider"
                  >
                    Dettagli
                  </button>
                </div>
                <div className="px-4 md:px-8 mt-2 md:mt-0 relative flex flex-col justify-start gap-2 shrink-0 md:flex-1 md:min-h-0 md:overflow-hidden pt-4 pb-4">
                  <PreviewRatings city={selectedItem} />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                Seleziona un elemento per visualizzare l'anteprima
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LIGHTBOX — backdrop button sibling (stesso pattern A1 della modale) */}
      {lightboxData &&
        (() => {
          const { isLiked, count, isLoading } = getPhotoStatus({
            id: lightboxData.id,
            likes: lightboxData.likes,
            likedByUser: lightboxData.likedByUser,
          });

          return (
            <div
              className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-300 pointer-events-auto"
              style={{ zIndex: Z_MODAL_NESTED }}
              role="presentation"
            >
              <button
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                className="absolute inset-0 h-full w-full cursor-default border-0 bg-transparent p-0"
                onClick={() => setLightboxData(null)}
              />
              <div
                className="relative w-full h-full flex items-center justify-center p-4 pointer-events-none"
                style={{ zIndex: Z_MODAL_NESTED }}
              >
                <img
                  src={lightboxData.url}
                  alt="Fullscreen"
                  className="max-w-full max-h-[85vh] rounded shadow-2xl object-contain pointer-events-auto"
                />

                <CloseButton
                  onClose={() => setLightboxData(null)}
                  variant="primary"
                  position="absolute"
                  className="top-6 right-6 pointer-events-auto"
                />

                <div
                  className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 flex items-center gap-6 shadow-2xl pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs border border-indigo-400">
                      {lightboxData.user.charAt(0)}
                    </div>
                    <span className="text-white font-bold text-sm shadow-black drop-shadow-md">
                      {lightboxData.user}
                    </span>
                  </div>

                  {lightboxData.description && (
                    <span className="hidden md:block text-slate-300 text-xs italic border-l border-white/20 pl-4 max-w-[200px] truncate">
                      {lightboxData.description}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isGuest) togglePhotoHeart(lightboxData.id);
                    }}
                    disabled={isLoading}
                    aria-label={isLiked ? 'Rimuovi mi piace' : 'Metti mi piace'}
                    className={`min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 font-bold border-l border-white/20 pl-4 transition-colors ${isLiked ? 'text-rose-500' : 'text-white hover:text-rose-400'}`}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} aria-hidden />
                    {count}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>,
    document.body,
  );
};
