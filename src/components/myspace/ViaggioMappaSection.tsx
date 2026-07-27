import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import type { ViaggioMapPin } from '@/types/models/ViaggioMappa';
import { listViaggioMapPins } from '@/services/viaggio/viaggioMappaService';

interface Props {
  viaggioId: string;
}

function openExternalMap(pin: ViaggioMapPin): void {
  const q = encodeURIComponent(`${pin.lat},${pin.lng}`);
  window.open(`https://www.google.com/maps?q=${q}`, '_blank', 'noopener,noreferrer');
}

/**
 * View Mappa — unione geolocalizzata del patrimonio Viaggio (DOC 37 §9).
 * Non è Resource CRUD; aggrega POI Diari + Ricordi con GPS.
 */
export const ViaggioMappaSection: React.FC<Props> = ({ viaggioId }) => {
  const [pins, setPins] = useState<ViaggioMapPin[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listViaggioMapPins(viaggioId);
      if (!mountedRef.current) return;
      setPins(list);
      setSelectedId((prev) => (prev && list.some((p) => p.id === prev) ? prev : list[0]?.id ?? null));
    } catch (e) {
      console.error('[ViaggioMappaSection] reload failed', e);
      if (!mountedRef.current) return;
      setError('Non è stato possibile costruire la mappa del Viaggio.');
      setPins([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [viaggioId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const selected = pins.find((p) => p.id === selectedId) ?? null;

  const diaryPins = pins.filter((p) => p.source === 'diary_poi');
  const mediaPins = pins.filter((p) => p.source === 'ricordo_media');

  return (
    <div
      data-testid="viaggio-section-mappa"
      data-stereotype="View"
      className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 md:p-6"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-white">Mappa</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            View · unione geolocalizzata (POI Diari + Ricordi GPS)
          </p>
        </div>
        <MapPin className="w-5 h-5 text-slate-600 shrink-0" aria-hidden />
      </div>

      {error && (
        <p className="text-sm text-rose-400 mb-4" role="alert">
          {error}
        </p>
      )}

      {loading && <p className="text-sm text-slate-500">Caricamento…</p>}

      {!loading && pins.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-10">
          Nessun elemento geolocalizzato in questo Viaggio.
        </p>
      )}

      {!loading && pins.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <section>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                POI dai Diari ({diaryPins.length})
              </h4>
              <ul className="space-y-1" data-testid="mappa-diary-pins">
                {diaryPins.map((pin) => (
                  <li key={pin.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(pin.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition-colors ${
                        selectedId === pin.id
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
                          : 'border-slate-800 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <span className="font-semibold block truncate">{pin.label}</span>
                      <span className="text-[10px] text-slate-500 truncate block">
                        {pin.diaryName || 'Diario'}
                        {pin.address ? ` · ${pin.address}` : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Ricordi con GPS ({mediaPins.length})
              </h4>
              <ul className="space-y-1" data-testid="mappa-media-pins">
                {mediaPins.length === 0 && (
                  <li className="text-xs text-slate-600 px-1">Nessun media geolocalizzato.</li>
                )}
                {mediaPins.map((pin) => (
                  <li key={pin.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(pin.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition-colors ${
                        selectedId === pin.id
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
                          : 'border-slate-800 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <span className="font-semibold block truncate">{pin.label}</span>
                      <span className="text-[10px] text-slate-500">{pin.dayKey}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div
            className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 min-h-[14rem]"
            data-testid="mappa-pin-detail"
          >
            {selected ? (
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {selected.source === 'diary_poi' ? 'POI Diario' : 'Ricordo'}
                </p>
                <h4 className="text-lg font-bold text-white">{selected.label}</h4>
                <p className="text-xs text-slate-400 font-mono">
                  {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}
                </p>
                {selected.address && (
                  <p className="text-sm text-slate-300">{selected.address}</p>
                )}
                {selected.diaryName && (
                  <p className="text-xs text-slate-500">Diario: {selected.diaryName}</p>
                )}
                <button
                  type="button"
                  onClick={() => openExternalMap(selected)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-500/40 hover:bg-amber-500/10"
                >
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden />
                  Apri in Maps
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Seleziona un pin.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
