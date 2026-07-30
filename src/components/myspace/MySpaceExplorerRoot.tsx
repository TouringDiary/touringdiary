import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Compass, Loader2, Trash2 } from 'lucide-react';
import {
  listVisitedCities,
  removeVisitedCity,
  syncVisitedCitiesFromUserViaggi,
  type UserVisitedCity,
} from '@/services/myspace/userVisitedCitiesService';
import {
  getCitiesMinimalByIds,
  type CityGeoMinimal,
} from '@/services/myspace/cityMinimalRead';
import { showGlobalAlert } from '@/services/ui/toastService';
import { MySpaceSectionHeader } from './MySpaceSectionHeader';

interface Props {
  userId: string;
}

/**
 * Root Esploratore — archivio personale città visitate (DOC 35 §8).
 * ≠ ricerca / Scopri / feed.
 */
export const MySpaceExplorerRoot: React.FC<Props> = ({ userId }) => {
  const [rows, setRows] = useState<UserVisitedCity[]>([]);
  const [citiesById, setCitiesById] = useState<Record<string, CityGeoMinimal>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const loadSeqRef = useRef(0);

  const reload = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    setLoading(true);
    try {
      await syncVisitedCitiesFromUserViaggi(userId);
      if (seq !== loadSeqRef.current) return;
      const list = await listVisitedCities(userId);
      if (seq !== loadSeqRef.current) return;
      setRows(list);
      const cities = await getCitiesMinimalByIds(list.map((r) => r.cityId));
      if (seq !== loadSeqRef.current) return;
      const map: Record<string, CityGeoMinimal> = {};
      for (const c of cities) map[c.id] = c;
      setCitiesById(map);
    } finally {
      if (seq === loadSeqRef.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleRemove = async (cityId: string) => {
    setBusyId(cityId);
    try {
      const ok = await removeVisitedCity(userId, cityId);
      if (!ok) {
        showGlobalAlert('Non è stato possibile rimuovere la città.');
        return;
      }
      await reload();
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div
        className="flex-1 min-h-0 flex items-center justify-center gap-2 text-slate-500 text-sm"
        data-testid="myspace-section-explorer"
        role="tabpanel"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Caricamento archivio...
      </div>
    );
  }

  return (
    <div
      className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-3"
      data-testid="myspace-section-explorer"
      role="tabpanel"
      aria-label="Esploratore"
    >
      <MySpaceSectionHeader
        icon={Compass}
        title="Esploratore"
        description="Archivio personale: le città dei tuoi Viaggi si aggiungono automaticamente. La rimozione è solo manuale — eliminare un Viaggio non cancella una città da qui."
        iconClassName="w-4 h-4 text-sky-400 shrink-0"
      />

      {rows.length === 0 ? (
        <p className="text-xs text-slate-500 py-6 text-center">
          Nessuna città visitata ancora. Apri o crea un Viaggio con destinazione.
        </p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {rows.map((row) => {
            const city = citiesById[row.cityId];
            const busy = busyId === row.cityId;
            const geo = [city?.nation, city?.adminRegion].filter(Boolean).join(' · ');
            return (
              <li
                key={row.cityId}
                className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5"
              >
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-white truncate">
                    {city?.name ?? row.cityId}
                  </span>
                  {geo ? (
                    <span className="block text-[11px] text-slate-500 truncate">{geo}</span>
                  ) : null}
                  <span className="block text-[10px] text-slate-600 mt-0.5">
                    {row.source === 'auto' ? 'Da Viaggio' : 'Manuale'} ·{' '}
                    {new Date(row.firstSeenAt).toLocaleDateString('it-IT')}
                  </span>
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleRemove(row.cityId)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-300 hover:bg-slate-800 disabled:opacity-50 shrink-0"
                  aria-label={`Rimuovi ${city?.name ?? 'città'} dall'archivio`}
                  title="Rimuovi dall’archivio"
                  data-testid={`explorer-remove-${row.cityId}`}
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
