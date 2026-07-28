import React from 'react';
import { createPortal } from 'react-dom';
import { Map } from 'lucide-react';
import type { CitySummary } from '@/types';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_MODAL } from '@/constants/zIndex';
import { cityHeaderImageUrl } from '@/myspace/resolveCityPresentation';

interface Props {
  cities: CitySummary[];
  onSelect: (cityId: string) => void;
  onClose: () => void;
}

/**
 * Selettore città per navigazione da catalogo MySpace (multi-città).
 * Lista chiusa di CitySummary già risolte dal manifest — nessuna ricerca libera.
 */
export const MySpaceCityPickModal: React.FC<Props> = ({ cities, onSelect, onClose }) =>
  createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      style={{ zIndex: Z_MODAL }}
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="myspace-city-pick-title"
        className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800">
          <h2 id="myspace-city-pick-title" className="text-sm font-bold text-white">
            Scegli la città
          </h2>
          <CloseButton onClose={onClose} variant="primary" size="sm" />
        </div>
        <ul className="max-h-72 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {cities.map((city) => {
            const img = cityHeaderImageUrl(city);
            return (
              <li key={city.id}>
                <button
                  type="button"
                  onClick={() => onSelect(city.id)}
                  className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-slate-800/80 transition-colors"
                >
                  <span className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
                    {img ? (
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center">
                        <Map className="w-4 h-4 text-slate-600" aria-hidden />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 text-sm font-semibold text-white truncate">
                    {city.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    document.body,
  );
