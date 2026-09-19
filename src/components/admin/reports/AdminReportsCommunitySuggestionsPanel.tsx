import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SuggestionReviewModal } from '@/components/modals/SuggestionReviewModal';
import { getAllSuggestionsAsync } from '@/services/communityService';
import type { SuggestionRequest, SuggestionType } from '@/types/index';

type AdminReportsCommunitySuggestionsPanelProps = {
  types: SuggestionType[];
  emptyMessage: string;
};

const STATUS_LABELS: Record<SuggestionRequest['status'], string> = {
  pending: 'Nuovo',
  processing: 'In verifica',
  approved: 'OK',
  rejected: 'KO',
};

export const AdminReportsCommunitySuggestionsPanel = ({
  types,
  emptyMessage,
}: AdminReportsCommunitySuggestionsPanelProps) => {
  const [items, setItems] = useState<SuggestionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SuggestionRequest | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const all = await getAllSuggestionsAsync();
      setItems(all.filter((s) => types.includes(s.type)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore caricamento suggerimenti.');
    } finally {
      setIsLoading(false);
    }
  }, [types]);

  useEffect(() => {
    void load();
  }, [load]);

  const pendingCount = useMemo(() => items.filter((s) => s.status === 'pending').length, [items]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" aria-hidden />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingCount > 0 ? (
        <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">
          {pendingCount} in attesa
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-rose-400" role="alert">
          {error}
        </p>
      ) : null}

      {selected ? (
        <SuggestionReviewModal
          isOpen
          suggestion={selected}
          onClose={() => setSelected(null)}
          onUpdate={() => {
            setSelected(null);
            void load();
          }}
        />
      ) : null}

      {items.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">{emptyMessage}</p>
      ) : (
        <ul className="divide-y divide-slate-800 rounded-xl border border-slate-800 overflow-hidden">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="w-full text-left px-4 py-3 hover:bg-slate-800/60 transition-colors"
                onClick={() => setSelected(item)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-white truncate">
                    {item.details.title} · {item.cityName}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-rose-400 shrink-0">
                    {STATUS_LABELS[item.status]}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {item.type} · {item.userName} · {new Date(item.date).toLocaleString('it-IT')}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
