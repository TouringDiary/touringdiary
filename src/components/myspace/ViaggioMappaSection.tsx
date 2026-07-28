import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import type { ViaggioMapPin } from '@/types/models/ViaggioMappa';
import { listViaggioMapPins } from '@/services/viaggio/viaggioMappaService';
import { useModal } from '@/context/ModalContext';
import { ViaggioMappaGoogleEmbed, getGoogleMapsApiKey } from './ViaggioMappaGoogleEmbed';

interface Props {
  viaggioId: string;
}

/**
 * View Mappa — unione geolocalizzata + Maps embedded + clustering (DOC 37 §9).
 * Pin diary → pagina POI completa; pin ricordo → dettaglio (non POI).
 */
export const ViaggioMappaSection: React.FC<Props> = ({ viaggioId }) => {
  const { openModal } = useModal();
  const [pins, setPins] = useState<ViaggioMapPin[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const hasMapsKey = Boolean(getGoogleMapsApiKey());

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

  const selected = useMemo(
    () => pins.find((p) => p.id === selectedId) ?? null,
    [pins, selectedId],
  );

  // Due filter distinti: N tipicamente piccolo (pin di un singolo Viaggio).
  // Una sola scansione non porta guadagno misurabile; si lasciano due filter chiari.
  const diaryPins = useMemo(
    () => pins.filter((p) => p.source === 'diary_poi'),
    [pins],
  );
  const mediaPins = useMemo(
    () => pins.filter((p) => p.source === 'ricordo_media'),
    [pins],
  );

  const handleSelect = useCallback((pin: ViaggioMapPin) => {
    setSelectedId(pin.id);
  }, []);

  const openPoiFullPage = (pin: ViaggioMapPin) => {
    if (pin.source !== 'diary_poi' || !pin.poi) {
      setError('Questo pin non è collegato a un POI del catalogo.');
      return;
    }
    // returnTo mySpace: chiusura POI riapre MySpace; path Viaggio/Mappa
    // ripristinato da mySpaceNavMemory (sessionStorage) al remount della shell.
    openModal('poiDetail', {
      poi: pin.poi,
      returnTo: 'mySpace',
    });
  };

  const openExternalMap = (pin: ViaggioMapPin): void => {
    const q = encodeURIComponent(`${pin.lat},${pin.lng}`);
    window.open(`https://www.google.com/maps?q=${q}`, '_blank', 'noopener,noreferrer');
  };

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
            View · Google Maps + clustering · pin POI → pagina completa
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
        <div className="space-y-4">
          <ViaggioMappaGoogleEmbed pins={pins} selectedId={selectedId} onSelect={handleSelect} />

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
                        onClick={() => handleSelect(pin)}
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
                        onClick={() => handleSelect(pin)}
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
                  {selected.source === 'diary_poi' && selected.poi && (
                    <button
                      type="button"
                      onClick={() => openPoiFullPage(selected)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-500/40 hover:bg-amber-500/10"
                      data-testid="mappa-open-poi"
                    >
                      Apri pagina POI
                    </button>
                  )}
                  {selected.source === 'ricordo_media' && (
                    <p className="text-xs text-slate-500">
                      Pin Ricordo: dettaglio media (non è un POI del catalogo).
                    </p>
                  )}
                  {!hasMapsKey && (
                    <button
                      type="button"
                      onClick={() => openExternalMap(selected)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-300 border border-slate-700 hover:bg-slate-900"
                    >
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden />
                      Apri in Maps (esterno)
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Seleziona un pin.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
