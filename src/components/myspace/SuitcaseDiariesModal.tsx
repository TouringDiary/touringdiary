import { BookOpen, Loader2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_MODAL } from '@/constants/zIndex';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { listDiariesBySuitcaseId } from '@/services/suitcase/suitcaseDiaryReadService';
import type { Itinerary } from '@/types/index';

interface Props {
  suitcaseId: string;
  suitcaseTitle: string;
  onClose: () => void;
  onOpenDiary: (diary: Itinerary) => void;
}

/**
 * Elenco diari associati a una valigia (root Valigia MySpace).
 */
export const SuitcaseDiariesModal: React.FC<Props> = ({
  suitcaseId,
  suitcaseTitle,
  onClose,
  onOpenDiary,
}) => {
  const [diaries, setDiaries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useGlobalModalEscape(true, onClose);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const rows = await listDiariesBySuitcaseId(suitcaseId);
        if (!cancelled) setDiaries(rows);
      } catch {
        if (!cancelled) {
          setDiaries([]);
          setLoadError('Impossibile caricare i diari collegati.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [suitcaseId]);

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      style={{ zIndex: Z_MODAL }}
      role="presentation"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="suitcase-diaries-title"
        className="relative w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800">
          <div className="min-w-0">
            <h2 id="suitcase-diaries-title" className="text-sm font-bold text-white truncate">
              Diari collegati
            </h2>
            <p className="text-[10px] text-slate-500 truncate">{suitcaseTitle}</p>
          </div>
          <CloseButton onClose={onClose} variant="primary" size="sm" withEscape={false} />
        </div>

        <div className="max-h-72 overflow-y-auto custom-scrollbar p-2">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-slate-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Caricamento…
            </div>
          ) : loadError ? (
            <p className="text-xs text-rose-400 text-center py-8 px-4 leading-relaxed">
              {loadError}
            </p>
          ) : diaries.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8 px-4 leading-relaxed">
              Nessun diario associato a questa valigia.
            </p>
          ) : (
            <ul className="space-y-1">
              {diaries.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => onOpenDiary(d)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-slate-800/80 transition-colors min-h-[44px]"
                  >
                    <BookOpen className="w-4 h-4 text-amber-300 shrink-0" aria-hidden />
                    <span className="min-w-0 text-sm font-semibold text-white truncate">
                      {d.name || 'Diario'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
