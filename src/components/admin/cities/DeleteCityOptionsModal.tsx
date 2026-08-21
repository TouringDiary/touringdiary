import { AlertTriangle, Image, Info, MapPin, ShoppingCart, Trash2, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CityDeleteOptions } from '../../../types/index';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: CityDeleteOptions) => void;
  cityName: string;
}

const DEFAULT_OPTIONS: CityDeleteOptions = {
  keepUserPhotos: true,
  keepShops: true,
  keepPeople: true,
  keepPOIs: false,
};

export const DeleteCityOptionsModal = ({ isOpen, onClose, onConfirm, cityName }: Props) => {
  const [options, setOptions] = useState<CityDeleteOptions>(DEFAULT_OPTIONS);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setOptions(DEFAULT_OPTIONS);
    setIsConfirming(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleOption = (key: keyof CityDeleteOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-admin-modal flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 w-full max-w-lg max-h-[calc(100dvh-2rem)] rounded-2xl border border-red-500/30 shadow-2xl flex flex-col overflow-hidden relative">
        {/* HEADER */}
        <div className="p-6 border-b border-slate-800 bg-red-950/10 flex justify-between items-start shrink-0">
          <div className="flex gap-4 min-w-0">
            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/30 text-red-500 shrink-0">
              <Trash2 className="w-8 h-8" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-bold text-white font-display uppercase tracking-wide">
                Elimina {cityName}
              </h3>
              <p className="text-xs text-red-300 font-medium mt-1">
                Questa azione rimuoverà la città dal database.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="text-slate-400 hover:text-white transition-colors shrink-0 p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-6 overflow-y-auto min-h-0 flex-1">
          <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-xl flex gap-3">
            <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-200 leading-relaxed">
              <strong>Nota Dati Staging (OSM):</strong> Gli elementi presenti nell'area di
              Importazione (Staging) non vengono cancellati ma <strong>diventano orfani</strong>.
              Potrai recuperarli e riassegnarli se ricrei la città con lo stesso nome.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Cosa vuoi SALVARE?
            </h4>

            {/* OPTION: PHOTOS */}
            <button
              type="button"
              onClick={() => toggleOption('keepUserPhotos')}
              aria-pressed={options.keepUserPhotos}
              className={`w-full text-left p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 group ${options.keepUserPhotos ? 'bg-emerald-900/10 border-emerald-500/50' : 'bg-slate-950 border-slate-800 hover:border-red-500/30'}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${options.keepUserPhotos ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-500'}`}
                >
                  <Image className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div
                    className={`text-sm font-bold ${options.keepUserPhotos ? 'text-white' : 'text-slate-400'}`}
                  >
                    Foto Community & Media
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Upload utenti, Live Snaps, Galleria
                  </div>
                </div>
              </div>
              <div
                className={`text-[10px] font-black uppercase px-2 py-1 rounded shrink-0 ${options.keepUserPhotos ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-500'}`}
              >
                {options.keepUserPhotos ? 'MANTIENI' : 'CANCELLA'}
              </div>
            </button>

            {/* OPTION: SHOPS */}
            <button
              type="button"
              onClick={() => toggleOption('keepShops')}
              aria-pressed={options.keepShops}
              className={`w-full text-left p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 group ${options.keepShops ? 'bg-emerald-900/10 border-emerald-500/50' : 'bg-slate-950 border-slate-800 hover:border-red-500/30'}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${options.keepShops ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-500'}`}
                >
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div
                    className={`text-sm font-bold ${options.keepShops ? 'text-white' : 'text-slate-400'}`}
                  >
                    Negozi & Partner
                  </div>
                  <div className="text-[10px] text-slate-500">Botteghe, Prodotti, Sponsor</div>
                </div>
              </div>
              <div
                className={`text-[10px] font-black uppercase px-2 py-1 rounded shrink-0 ${options.keepShops ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-500'}`}
              >
                {options.keepShops ? 'MANTIENI' : 'CANCELLA'}
              </div>
            </button>

            {/* OPTION: PEOPLE */}
            <button
              type="button"
              onClick={() => toggleOption('keepPeople')}
              aria-pressed={options.keepPeople}
              className={`w-full text-left p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 group ${options.keepPeople ? 'bg-emerald-900/10 border-emerald-500/50' : 'bg-slate-950 border-slate-800 hover:border-red-500/30'}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${options.keepPeople ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-500'}`}
                >
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div
                    className={`text-sm font-bold ${options.keepPeople ? 'text-white' : 'text-slate-400'}`}
                  >
                    Personaggi Famosi
                  </div>
                  <div className="text-[10px] text-slate-500">Biografie, Ritratti AI</div>
                </div>
              </div>
              <div
                className={`text-[10px] font-black uppercase px-2 py-1 rounded shrink-0 ${options.keepPeople ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-500'}`}
              >
                {options.keepPeople ? 'MANTIENI' : 'CANCELLA'}
              </div>
            </button>

            {/* OPTION: POI (DANGEROUS) */}
            <button
              type="button"
              onClick={() => toggleOption('keepPOIs')}
              aria-pressed={options.keepPOIs}
              className={`w-full text-left p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 group ${options.keepPOIs ? 'bg-amber-900/10 border-amber-500/50' : 'bg-slate-950 border-slate-800 hover:border-red-500/30'}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${options.keepPOIs ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-900 text-slate-500'}`}
                >
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div
                    className={`text-sm font-bold ${options.keepPOIs ? 'text-white' : 'text-slate-400'}`}
                  >
                    Punti di Interesse Reali
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Monumenti, Ristoranti (Tabella POI live)
                  </div>
                </div>
              </div>
              <div
                className={`text-[10px] font-black uppercase px-2 py-1 rounded shrink-0 ${options.keepPOIs ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-500'}`}
              >
                {options.keepPOIs ? 'MANTIENI' : 'CANCELLA'}
              </div>
            </button>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-3 rounded-xl font-bold uppercase text-xs text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            Annulla
          </button>
          {!isConfirming ? (
            <button
              type="button"
              onClick={() => setIsConfirming(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold uppercase text-xs text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/20 transition-all active:scale-95"
            >
              Procedi con Eliminazione
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onConfirm(options)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-black uppercase text-xs text-white bg-red-600 hover:bg-red-500 shadow-lg animate-pulse flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" /> Conferma Definitiva
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
