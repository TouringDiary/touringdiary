import { AlertTriangle, Image, Info, MapPin, ShoppingCart, Trash2, Users, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useGlobalModalEscape } from '../../../hooks/useGlobalModalEscape';
import type { CityDeleteOptions } from '../../../types/index';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: CityDeleteOptions) => void;
  cityName: string;
}

const DEFAULT_OPTIONS = {
  keepUserPhotos: true,
  keepPOIs: false,
};

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
}

export const DeleteCityOptionsModal = ({ isOpen, onClose, onConfirm, cityName }: Props) => {
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [isConfirming, setIsConfirming] = useState(false);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useGlobalModalEscape(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;
    setOptions(DEFAULT_OPTIONS);
    setIsConfirming(false);
  }, [isOpen]);

  // 1. Focus capture and initial focus
  useEffect(() => {
    if (!isOpen) return;

    const activeEl = document.activeElement;
    if (activeEl instanceof HTMLElement) {
      openerRef.current = activeEl;
    } else {
      openerRef.current = null;
    }

    const dialog = dialogRef.current;
    const focusRaf = requestAnimationFrame(() => {
      if (dialog) {
        const focusable = getFocusableElements(dialog);
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          dialog.focus();
        }
      }
    });

    return () => {
      cancelAnimationFrame(focusRaf);
    };
  }, [isOpen]);

  // 2. Focus Trap
  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const focusable = getFocusableElements(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeEl = document.activeElement;
      if (event.shiftKey && (activeEl === first || activeEl === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeEl === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof Node) || dialog.contains(target)) return;
      const focusable = getFocusableElements(dialog);
      (focusable[0] ?? dialog).focus();
    };

    dialog.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      dialog.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, [isOpen]);

  // 3. Focus Restore
  useEffect(() => {
    if (!isOpen) {
      const opener = openerRef.current;
      openerRef.current = null;
      if (
        opener instanceof HTMLElement &&
        document.contains(opener) &&
        typeof opener.focus === 'function' &&
        !opener.hasAttribute('disabled')
      ) {
        opener.focus();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleOption = (key: keyof typeof DEFAULT_OPTIONS) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-admin-modal flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="bg-slate-900 w-full max-w-lg max-h-[calc(100dvh-2rem)] rounded-2xl border border-red-500/30 shadow-2xl flex flex-col overflow-hidden relative outline-none"
      >
        {/* HEADER */}
        <div className="p-6 border-b border-slate-800 bg-red-950/10 flex justify-between items-start shrink-0">
          <div className="flex gap-4 min-w-0">
            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/30 text-red-500 shrink-0">
              <Trash2 className="w-8 h-8" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3
                id={titleId}
                className="text-xl font-bold text-white font-display uppercase tracking-wide"
              >
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
            className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0 min-h-11 min-w-11 flex items-center justify-center"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-6 overflow-y-auto min-h-0 flex-1">
          <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-xl flex gap-3">
            <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" aria-hidden="true" />
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

            {/* OPTION: SHOPS — always deleted (city_id NOT NULL, ON DELETE NO ACTION) */}
            <div
              className="w-full text-left p-4 rounded-xl border bg-slate-950 border-slate-800 flex items-center justify-between gap-3 opacity-90"
              role="note"
              aria-label="Negozi e prodotti sempre eliminati con la città"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg shrink-0 bg-slate-900 text-slate-500">
                  <ShoppingCart className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-400">Negozi & Prodotti</div>
                  <div className="text-[10px] text-slate-500">
                    Botteghe e prodotti fisici (non scollegabili, sempre eliminati se la città viene
                    rimossa).
                  </div>
                </div>
              </div>
              <div className="text-[10px] font-black uppercase px-2 py-1 rounded shrink-0 bg-slate-800 text-slate-500">
                SEMPRE CANCELLA
              </div>
            </div>

            {/* OPTION: PEOPLE — always deleted (cityId obbligatorio, no orphan) */}
            <div
              className="w-full text-left p-4 rounded-xl border bg-slate-950 border-slate-800 flex items-center justify-between gap-3 opacity-90"
              role="note"
              aria-label="Personaggi famosi sempre eliminati con la città"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg shrink-0 bg-slate-900 text-slate-500">
                  <Users className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-400">Personaggi Famosi</div>
                  <div className="text-[10px] text-slate-500">
                    I personaggi famosi vengono sempre eliminati con la città (cityId obbligatorio).
                  </div>
                </div>
              </div>
              <div className="text-[10px] font-black uppercase px-2 py-1 rounded shrink-0 bg-slate-800 text-slate-500">
                SEMPRE CANCELLA
              </div>
            </div>

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
                  <MapPin className="w-5 h-5" aria-hidden="true" />
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
              <AlertTriangle className="w-4 h-4" aria-hidden="true" /> Conferma Definitiva
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
