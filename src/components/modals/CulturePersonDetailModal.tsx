import { ArrowRight, ArrowUpLeft, CheckCircle, Clock, MapPin, Plus, Quote } from 'lucide-react';
import { type MouseEvent, useId } from 'react';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { getPrimarySpecific } from '@/domain/city/famousPersonCategories';
import type { FamousPerson, PointOfInterest } from '../../types/index';
import { openMap } from '../../utils/common';
import { renderCultureContent } from './cultureContentParser';
import { toSortableCategories } from './cultureCornerUtils';

interface CulturePersonDetailPanelProps {
  detailPerson: FamousPerson;
  /** Barra locale con titolo e ritorno; disabilitata quando il parent gestisce il back nell'header. */
  showToolbar?: boolean;
  onBack?: () => void;
  isPlaceInItinerary: (placeId: string) => boolean;
  onAddToItinerary: (poi: PointOfInterest) => void;
}

type RelatedPlace = NonNullable<FamousPerson['relatedPlaces']>[number];

/** Contenuto dettaglio personaggio — pensato per la faccia posteriore del flip 3D (stesso pattern POI recensioni). */
export const CulturePersonDetailPanel = ({
  detailPerson,
  showToolbar = false,
  onBack,
  isPlaceInItinerary,
  onAddToItinerary,
}: CulturePersonDetailPanelProps) => {
  const detailTitleId = useId();

  const handleAddPlace = (e: MouseEvent, place: RelatedPlace) => {
    e.stopPropagation();
    if (isPlaceInItinerary(place.id)) return;

    const poi: PointOfInterest = {
      id: place.id,
      name: place.name,
      description: place.notes ?? '',
      category: 'monument',
      coords: place.coords,
      address: place.address,
      visitDuration: place.visitDuration,
      priceLevel: place.priceLevel,
    };
    onAddToItinerary(poi);
  };

  const primary = getPrimarySpecific(toSortableCategories(detailPerson));

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0f1a] overflow-hidden">
      {showToolbar ? (
        <div className="shrink-0 p-4 border-b border-slate-800 flex justify-between items-center bg-[#0b0f1a]">
          <h3 className="font-bold text-white text-sm md:text-lg flex items-center gap-2 min-w-0 truncate">
            <Quote className="w-5 h-5 text-indigo-400 shrink-0" aria-hidden />
            <span className="truncate">{detailPerson.name}</span>
          </h3>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-2 min-h-11 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 shrink-0"
          >
            <ArrowUpLeft className="w-3.5 h-3.5 text-amber-500" aria-hidden />
            Torna alla galleria
          </button>
        </div>
      ) : null}

      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-[45%] lg:w-[40%] h-[40vh] md:h-full relative shrink-0">
          <ImageWithFallback
            src={detailPerson.imageUrl ?? undefined}
            alt=""
            className="w-full h-full object-cover grayscale brightness-75 contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f1a] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#0b0f1a]" />

          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
            <h2
              id={detailTitleId}
              className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-[0.9] tracking-tighter mb-4 shadow-black drop-shadow-2xl"
            >
              {detailPerson.name}
            </h2>
            <div className="flex flex-col gap-3 items-start">
              {primary ? (
                <div className="inline-block bg-amber-500 text-black text-sm font-black uppercase tracking-[0.2em] px-4 py-1.5 shadow-lg transform -skew-x-12">
                  {primary.label}
                </div>
              ) : null}
              {detailPerson.lifespanDisplay ? (
                <div className="text-slate-300 font-mono text-base md:text-lg font-bold tracking-widest pl-1 border-l-2 border-amber-500/50">
                  {detailPerson.lifespanDisplay}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-[#0b0f1a] relative">
          <div className="p-8 md:p-16 space-y-10 max-w-4xl mx-auto">
            {detailPerson.quote ? (
              <div className="relative pl-12 py-4 border-l-4 border-indigo-500 bg-indigo-900/10 rounded-r-xl pr-6 mt-6 md:mt-0">
                <Quote
                  className="absolute top-4 left-4 w-6 h-6 text-indigo-400 opacity-50"
                  aria-hidden
                />
                <p className="text-xl md:text-2xl font-serif italic text-indigo-100 leading-relaxed">
                  &quot;{detailPerson.quote}&quot;
                </p>
              </div>
            ) : null}

            <div className="space-y-6">
              {renderCultureContent(detailPerson.fullBio || detailPerson.bio)}
            </div>

            {detailPerson.careerStats && detailPerson.careerStats.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 py-8 border-y border-slate-800/50">
                {detailPerson.careerStats.map((stat) => (
                  <div
                    key={`${stat.label}:${stat.value}`}
                    className="bg-slate-900/50 p-3 md:p-4 rounded-2xl border border-slate-800 text-center hover:border-amber-500/30 transition-colors flex flex-col items-center justify-center min-h-[90px]"
                  >
                    <div className="text-lg md:text-xl lg:text-2xl font-black text-white font-display mb-1 break-words w-full leading-tight hyphens-auto">
                      {stat.value}
                    </div>
                    <div className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-snug">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {detailPerson.relatedPlaces && detailPerson.relatedPlaces.length > 0 ? (
              <div className="space-y-8 pt-8">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                  <h3 className="text-xl font-display font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-500" aria-hidden /> I Luoghi di{' '}
                    {detailPerson.name.split(' ')[0]}
                  </h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {detailPerson.relatedPlaces.map((place) => {
                    const isAdded = isPlaceInItinerary(place.id);
                    return (
                      <div
                        key={place.id}
                        className="group bg-[#0f172a] border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between hover:border-indigo-500/50 transition-all shadow-lg hover:shadow-indigo-900/10"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-900/30 rounded-lg text-indigo-400 shrink-0">
                              <MapPin className="w-5 h-5" aria-hidden />
                            </div>
                            <h4 className="font-bold text-white text-xl group-hover:text-indigo-400 transition-colors break-words">
                              {place.name}
                            </h4>
                          </div>

                          <button
                            type="button"
                            onClick={() => openMap(place.coords.lat, place.coords.lng)}
                            className="text-slate-400 text-sm hover:text-white hover:underline decoration-indigo-500 underline-offset-4 transition-all mb-3 flex items-center gap-2 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                          >
                            {place.address}{' '}
                            <ArrowRight className="w-3 h-3 opacity-50" aria-hidden />
                          </button>

                          {place.notes ? (
                            <p className="text-xs text-slate-400 italic border-l-2 border-slate-700 pl-3 leading-relaxed">
                              {place.notes}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex flex-col items-end gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-800/50">
                          <div className="flex items-center gap-3">
                            {place.priceLevel != null ? (
                              <div className="text-[10px] font-bold text-amber-500 tracking-widest bg-amber-900/10 px-2 py-1 rounded border border-amber-500/20">
                                {'€'.repeat(place.priceLevel)}
                              </div>
                            ) : null}
                            {place.visitDuration ? (
                              <div className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800 flex items-center gap-1">
                                <Clock className="w-3 h-3" aria-hidden /> {place.visitDuration}
                              </div>
                            ) : null}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleAddPlace(e, place)}
                            disabled={isAdded}
                            className={`flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg transition-all active:scale-95 w-full md:w-auto justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                              isAdded
                                ? 'bg-emerald-600 text-white cursor-default'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            }`}
                          >
                            {isAdded ? (
                              <CheckCircle className="w-4 h-4" aria-hidden />
                            ) : (
                              <Plus className="w-4 h-4" aria-hidden />
                            )}
                            {isAdded ? 'AGGIUNTO' : 'AGGIUNGI'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
