import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Map, Calendar, Plus } from 'lucide-react';
import type { Viaggio } from '@/types/models/Viaggio';
import { createEmptyViaggio, listViaggiByUser } from '@/services/viaggio/viaggioService';

interface Props {
  userId: string;
  onOpenViaggio: (viaggioId: string) => void;
}

function formatPeriod(v: Viaggio): string {
  if (v.periodStart && v.periodEnd) return `${v.periodStart} → ${v.periodEnd}`;
  if (v.periodStart) return v.periodStart;
  if (v.periodEnd) return v.periodEnd;
  return 'Periodo non impostato';
}

/**
 * Catalogo MySpace «I miei Viaggi» — elenca Aggregate Root Viaggio (non Diari).
 * Dual-entry Account (`UserTripsTab`) resta sui Diari.
 */
export const MySpaceTripsCatalog: React.FC<Props> = ({ userId, onOpenViaggio }) => {
  const [items, setItems] = useState<Viaggio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadViaggi = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listViaggiByUser(userId);
      if (!mountedRef.current) return;
      setItems(rows);
    } catch (e) {
      console.error('[MySpaceTripsCatalog] listViaggiByUser failed', e);
      if (!mountedRef.current) return;
      setError('Non è stato possibile caricare i viaggi.');
      setItems([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadViaggi();
  }, [loadViaggi]);

  const handleCreateEmpty = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const created = await createEmptyViaggio(userId, 'Nuovo viaggio');
      onOpenViaggio(created.id);
      // Refresh catalogo accessorio: non blocca l'apertura se fallisce / unmount.
      void loadViaggi();
    } catch (e) {
      console.error('[MySpaceTripsCatalog] createEmptyViaggio failed', e);
      setError('Creazione viaggio non riuscita.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      id="myspace-root-panel-trips"
      role="tabpanel"
      aria-labelledby="myspace-root-tab-trips"
      data-testid="myspace-trips-catalog"
      className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 md:p-6"
    >
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg md:text-xl font-black text-white tracking-tight">I miei Viaggi</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {loading ? 'Caricamento…' : `${items.length} viaggi`}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreateEmpty}
          disabled={creating || loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-500/40 hover:bg-amber-500/10 disabled:opacity-50 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden />
          Nuovo
        </button>
      </div>

      {error && (
        <p className="text-sm text-rose-400 mb-4" role="alert">
          {error}
        </p>
      )}

      {!loading && items.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4">
          <Map className="w-10 h-10 text-slate-700 mb-3 opacity-60" aria-hidden />
          <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
            Qui troverai i tuoi viaggi. Puoi crearne uno vuoto quando sei pronto.
          </p>
        </div>
      )}

      <ul className="space-y-3">
        {items.map((v) => (
          <li key={v.id}>
            <button
              type="button"
              onClick={() => onOpenViaggio(v.id)}
              className="w-full text-left group flex gap-3 p-3 md:p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-amber-500/40 transition-colors"
              data-testid={`myspace-viaggio-card-${v.id}`}
            >
              <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-lg overflow-hidden bg-slate-800 border border-slate-700/80">
                {v.coverImage ? (
                  <img
                    src={v.coverImage}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Map className="w-6 h-6 text-slate-600" aria-hidden />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                  {v.title || 'Viaggio'}
                </h3>
                {v.destination && (
                  <p className="text-xs text-slate-400 truncate mt-0.5">{v.destination}</p>
                )}
                <p className="text-[11px] text-slate-500 mt-2 inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" aria-hidden />
                  {formatPeriod(v)}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
