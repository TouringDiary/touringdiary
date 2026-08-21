import { Map as MapIcon } from 'lucide-react';
import type { PremadeItinerary } from '../../../types/index';
import { ImageWithFallback } from '../../common/ImageWithFallback';

export function ItineraryManagerItineraries({
  items,
  geoFilterActive,
  onEdit,
}: {
  items: PremadeItinerary[];
  geoFilterActive: boolean;
  onEdit: (id: string) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
      {items.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3 border border-dashed border-slate-800 rounded-xl py-16">
          <MapIcon className="w-10 h-10 text-slate-600" />
          <p className="text-sm font-bold uppercase tracking-wide">
            {geoFilterActive ? 'Nessun itinerario nell’area selezionata' : 'Nessun itinerario'}
          </p>
          {geoFilterActive ? (
            <p className="text-xs text-slate-600 max-w-sm text-center">
              Prova a rimuovere o allargare i filtri geografici.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((it) => (
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
                    type="button"
                    onClick={() => onEdit(it.id)}
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
  );
}
