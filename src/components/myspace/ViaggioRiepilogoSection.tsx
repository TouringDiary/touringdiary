import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import type {
  ViaggioRiepilogoAnnotations,
  ViaggioRiepilogoComputed,
} from '@/types/models/ViaggioRiepilogo';
import {
  computeViaggioRiepilogo,
  getViaggioRiepilogoAnnotations,
  upsertViaggioRiepilogoAnnotations,
} from '@/services/viaggio/viaggioRiepilogoService';

interface Props {
  viaggioId: string;
  userId: string;
}

/**
 * View Riepilogo — aggregato calcolato + annotazioni leggere (DOC 37 §10).
 * Non è Resource CRUD peer delle altre sezioni.
 */
export const ViaggioRiepilogoSection: React.FC<Props> = ({ viaggioId, userId }) => {
  const [computed, setComputed] = useState<ViaggioRiepilogoComputed | null>(null);
  const [annotations, setAnnotations] = useState<ViaggioRiepilogoAnnotations | null>(null);
  const [preferredPlace, setPreferredPlace] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
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
      const [agg, ann] = await Promise.all([
        computeViaggioRiepilogo(viaggioId),
        getViaggioRiepilogoAnnotations(viaggioId),
      ]);
      if (!mountedRef.current) return;
      setComputed(agg);
      setAnnotations(ann);
      setPreferredPlace(ann?.general.preferredPlace ?? '');
      setNotes(ann?.general.notes ?? '');
    } catch (e) {
      console.error('[ViaggioRiepilogoSection] reload failed', e);
      if (!mountedRef.current) return;
      setError('Non è stato possibile calcolare il riepilogo.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [viaggioId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleSaveAnnotations = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const saved = await upsertViaggioRiepilogoAnnotations({
        viaggioId,
        userId,
        general: {
          preferredPlace: preferredPlace.trim() || undefined,
          notes: notes.trim() || undefined,
        },
        byDay: annotations?.byDay ?? {},
      });
      if (!mountedRef.current) return;
      setAnnotations(saved);
      setPreferredPlace(saved.general.preferredPlace ?? '');
      setNotes(saved.general.notes ?? '');
    } catch (e) {
      console.error('[ViaggioRiepilogoSection] save failed', e);
      setError('Salvataggio annotazioni non riuscito.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      data-testid="viaggio-section-riepilogo"
      data-stereotype="View"
      className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 md:p-6"
    >
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-white">Riepilogo</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            View calcolata · annotazioni leggere (non Resource CRUD)
          </p>
        </div>
        <BarChart3 className="w-5 h-5 text-slate-600 shrink-0" aria-hidden />
      </div>

      {error && (
        <p className="text-sm text-rose-400 mb-4" role="alert">
          {error}
        </p>
      )}

      {loading && <p className="text-sm text-slate-500">Caricamento…</p>}

      {!loading && computed && (
        <div className="space-y-6">
          <section
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
            data-testid="riepilogo-computed"
          >
            {[
              { label: 'Diari', value: String(computed.diaryCount) },
              { label: 'POI', value: String(computed.poiCount) },
              { label: 'Città', value: String(computed.cityIds.length) },
              { label: 'Pin mappa', value: String(computed.mapPinCount) },
              { label: 'Ricordi media', value: String(computed.ricordiMediaCount) },
              { label: 'Note Ricordi', value: String(computed.ricordiNoteCount) },
              { label: 'Allegati', value: String(computed.attachmentCount) },
              {
                label: 'Giorni periodo',
                value: computed.periodDayCount != null ? String(computed.periodDayCount) : '—',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-3"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {stat.label}
                </p>
                <p className="text-xl font-black text-white mt-1">{stat.value}</p>
              </div>
            ))}
          </section>

          <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 space-y-2">
            <p className="text-sm text-slate-200 font-semibold">{computed.title}</p>
            {computed.destination && (
              <p className="text-xs text-slate-400">{computed.destination}</p>
            )}
            <p className="text-xs text-slate-500">
              Periodo:{' '}
              {computed.periodStart && computed.periodEnd
                ? `${computed.periodStart} → ${computed.periodEnd}`
                : 'non impostato'}
            </p>
            {computed.categories.length > 0 && (
              <p className="text-xs text-slate-500">
                Categorie: {computed.categories.slice(0, 12).join(', ')}
              </p>
            )}
          </section>

          <section className="space-y-3" data-testid="riepilogo-annotations">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Annotazioni (View)
            </h4>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Luogo preferito
              </label>
              <input
                value={preferredPlace}
                onChange={(e) => setPreferredPlace(e.target.value)}
                className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 px-3 py-2"
                placeholder="Es. piazza del Duomo"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Note
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 p-3"
                placeholder="Annotazioni leggere sul riepilogo…"
              />
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSaveAnnotations()}
              className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-500/40 hover:bg-amber-500/10 disabled:opacity-50"
            >
              Salva annotazioni
            </button>
          </section>
        </div>
      )}
    </div>
  );
};
