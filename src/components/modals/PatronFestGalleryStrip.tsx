import { Camera, ChevronLeft, ChevronRight, Flag, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { GalleryLightbox, type LightboxData } from '@/components/city/gallery/GalleryLightbox';
import { DraggableSlider, type DraggableSliderHandle } from '@/components/common/DraggableSlider';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import type { CityPatronGalleryPhoto } from '@/types/models/patronGallery';

type PatronFestGalleryStripProps = {
  photos: CityPatronGalleryPhoto[];
  patronName: string;
  cityName: string;
  isLoading?: boolean;
  onSuggestPhoto?: () => void;
  onReportAbuse?: (photo: CityPatronGalleryPhoto) => void;
  /** Notifica apertura lightbox (PatronSaintModal disabilita ESC mentre è aperto). */
  onLightboxOpenChange?: (open: boolean) => void;
};

/** Oltre ~5 thumb (w-28/w-32) tipicamente serve scroll sul modale Patrono. */
const GALLERY_ARROW_MIN_PHOTOS = 6;

const toLightboxData = (
  photo: CityPatronGalleryPhoto,
  patronName: string,
  cityName: string,
): LightboxData => ({
  id: photo.id,
  url: photo.imageUrl,
  user: patronName || cityName,
  caption: photo.caption ?? undefined,
});

export const PatronFestGalleryStrip = ({
  photos,
  patronName,
  cityName,
  isLoading = false,
  onSuggestPhoto,
  onReportAbuse,
  onLightboxOpenChange,
}: PatronFestGalleryStripProps) => {
  const sliderRef = useRef<DraggableSliderHandle>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<CityPatronGalleryPhoto | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const isEmpty = photos.length === 0;
  const showScrollArrows = photos.length >= GALLERY_ARROW_MIN_PHOTOS;

  useEffect(() => {
    onLightboxOpenChange?.(isLightboxOpen);
  }, [isLightboxOpen, onLightboxOpenChange]);

  const selectedIndex = useMemo(() => {
    if (!selectedPhoto) return -1;
    return photos.findIndex((photo) => photo.id === selectedPhoto.id);
  }, [photos, selectedPhoto]);

  const lightboxData =
    isLightboxOpen && selectedPhoto ? toLightboxData(selectedPhoto, patronName, cityName) : null;

  const lightboxThumbnails = useMemo(
    () => photos.map((photo) => ({ id: photo.id, url: photo.imageUrl })),
    [photos],
  );

  const openPhoto = (photo: CityPatronGalleryPhoto) => {
    setSelectedPhoto(photo);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const goToIndex = (index: number) => {
    const next = photos[index];
    if (!next) return;
    setSelectedPhoto(next);
  };

  const handleReportClick = () => {
    if (!selectedPhoto || !onReportAbuse) return;
    setIsLightboxOpen(false);
    onReportAbuse(selectedPhoto);
  };

  const scrollGallery = (direction: 'left' | 'right') => {
    sliderRef.current?.scroll(direction);
  };

  return (
    <section aria-labelledby="patron-gallery-heading" className="pt-4 border-t border-slate-800">
      <h3
        id="patron-gallery-heading"
        className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3"
      >
        Galleria fotografica
      </h3>

      {isLoading ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          Caricamento…
        </div>
      ) : isEmpty ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-5 text-center space-y-3">
          <p className="text-sm text-slate-400 leading-relaxed">
            Non ci sono ancora foto del Patrono o della Festa Patronale.
            <br />
            Hai delle foto da condividere? Suggeriscile alla community.
          </p>
          {onSuggestPhoto ? (
            <button
              type="button"
              onClick={onSuggestPhoto}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold uppercase tracking-wider transition-colors min-h-[44px]"
            >
              <Camera className="w-4 h-4" aria-hidden />
              Suggerisci foto
            </button>
          ) : null}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 min-w-0">
          {showScrollArrows ? (
            <button
              type="button"
              onClick={() => scrollGallery('left')}
              aria-label="Scorri gallery a sinistra"
              className="shrink-0 inline-flex items-center justify-center min-h-11 min-w-11 p-0 bg-slate-900 border border-slate-700 rounded-lg hover:border-amber-500 text-slate-400 hover:text-white transition-colors touch-manipulation"
            >
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden />
            </button>
          ) : null}

          <div className="flex-1 min-w-0">
            {/* Stesse thumb w-28/h-28 md:w-32/h-32 — solo ref + frecce laterali (pattern GalleryGrid / PreviewGallery). */}
            <DraggableSlider ref={sliderRef} className="pb-1 min-w-0">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  className={`snap-start flex-shrink-0 w-28 h-28 md:w-32 md:h-32 rounded-xl overflow-hidden border shadow-lg mr-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    selectedPhoto?.id === photo.id
                      ? 'border-amber-500 ring-2 ring-amber-500/50'
                      : 'border-slate-700'
                  }`}
                  onClick={() => openPhoto(photo)}
                  aria-label={`Apri foto ${index + 1} di ${patronName}`}
                  aria-pressed={selectedPhoto?.id === photo.id}
                >
                  <ImageWithFallback
                    src={photo.imageUrl}
                    alt={photo.caption ?? `${patronName} — galleria ${cityName}`}
                    className="w-full h-full object-cover"
                    size="small"
                  />
                </button>
              ))}
            </DraggableSlider>
          </div>

          {showScrollArrows ? (
            <button
              type="button"
              onClick={() => scrollGallery('right')}
              aria-label="Scorri gallery a destra"
              className="shrink-0 inline-flex items-center justify-center min-h-11 min-w-11 p-0 bg-slate-900 border border-slate-700 rounded-lg hover:border-amber-500 text-slate-400 hover:text-white transition-colors touch-manipulation"
            >
              <ChevronRight className="w-3.5 h-3.5" aria-hidden />
            </button>
          ) : null}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-3">
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Le immagini sono fornite dagli utenti, che dichiarano di detenerne i diritti o le
          necessarie autorizzazioni per il loro utilizzo. TouringDiary non garantisce la titolarità
          dei diritti, per eventuali violazioni, utilizza &quot;Segnala abuso&quot;.
        </p>
        <div className="flex flex-wrap gap-3 items-center">
          {!isEmpty && onSuggestPhoto ? (
            <button
              type="button"
              onClick={onSuggestPhoto}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-500/90 hover:text-amber-400 transition-colors min-h-[44px]"
            >
              <Camera className="w-3.5 h-3.5" aria-hidden />
              Suggerisci foto
            </button>
          ) : null}
          {!isEmpty && onReportAbuse ? (
            <button
              type="button"
              onClick={handleReportClick}
              disabled={!selectedPhoto}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-amber-400 transition-colors min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-slate-400"
              title={
                selectedPhoto
                  ? 'Segnala abuso sulla foto selezionata'
                  : 'Seleziona una foto per segnalare un abuso'
              }
            >
              <Flag className="w-3.5 h-3.5" aria-hidden />
              Segnala abuso
            </button>
          ) : null}
        </div>
      </div>

      {lightboxData ? (
        <GalleryLightbox
          data={lightboxData}
          onClose={closeLightbox}
          onNext={() => {
            if (selectedIndex < 0 || selectedIndex >= photos.length - 1) return;
            goToIndex(selectedIndex + 1);
          }}
          onPrev={() => {
            if (selectedIndex <= 0) return;
            goToIndex(selectedIndex - 1);
          }}
          hasNext={selectedIndex >= 0 && selectedIndex < photos.length - 1}
          hasPrev={selectedIndex > 0}
          allPhotos={lightboxThumbnails}
          currentIndex={selectedIndex >= 0 ? selectedIndex : 0}
          onGoToPhoto={goToIndex}
        />
      ) : null}
    </section>
  );
};
