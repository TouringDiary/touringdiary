import { AlertTriangle, ArrowUpDown, CheckCircle, ExternalLink, Star, Trash2 } from 'lucide-react';
import type { ReviewRatingAlert } from '../../../services/communityService';
import type { PointOfInterest, Review } from '../../../types/index';
import { StarRating } from '../../common/StarRating';
import type { ResolvedTarget } from './itineraryManagerGeo';

export type HistorySort = 'date_desc' | 'date_asc' | 'author' | 'poi' | 'rating';

const HISTORY_SORT_VALUES: readonly HistorySort[] = [
  'date_desc',
  'date_asc',
  'author',
  'poi',
  'rating',
];

function isHistorySort(value: string): value is HistorySort {
  for (const candidate of HISTORY_SORT_VALUES) {
    if (candidate === value) return true;
  }
  return false;
}

function parseHistorySort(value: string): HistorySort | null {
  return isHistorySort(value) ? value : null;
}

export type DisplayedAlertRow = {
  alert: ReviewRatingAlert;
  target: ResolvedTarget | undefined;
  canOpen: boolean;
  evidence: Review | null;
};

export type DisplayedHistoryRow = {
  review: Review;
  target: ResolvedTarget;
};

function HistoryRowActions({
  canOpen,
  poiId,
  review,
  onOpenPoi,
  onDeleteRequest,
}: {
  canOpen: boolean;
  poiId: string | undefined;
  review: Review;
  onOpenPoi: (poiId: string, view: 'details' | 'reviews') => void;
  onDeleteRequest: (id: string, type: 'review', name: string) => void;
}) {
  return (
    <div className="flex gap-1 justify-end">
      {canOpen && poiId ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenPoi(poiId, 'details');
          }}
          className="p-2 min-h-[44px] min-w-[44px] hover:bg-indigo-900/30 rounded text-slate-400 hover:text-indigo-300 flex items-center justify-center"
          title="Apri POI"
          aria-label={`Apri POI della recensione di ${review.author}`}
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      ) : null}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDeleteRequest(review.id, 'review', `Recensione di ${review.author}`);
        }}
        className="p-2 min-h-[44px] min-w-[44px] hover:bg-red-900/20 rounded text-slate-500 hover:text-red-500 flex items-center justify-center"
        title="Rimuovi"
        aria-label={`Rimuovi recensione di ${review.author}`}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ItineraryManagerReviews({
  reviewsTab,
  displayedAlerts,
  displayedHistory,
  totalOpenAlerts,
  geoFilterActive,
  reviewSearch,
  onReviewSearchChange,
  historySort,
  onHistorySortChange,
  poiById,
  onOpenPoi,
  onAcknowledgeAlert,
  onSelectReview,
  onDeleteRequest,
}: {
  reviewsTab: 'alerts' | 'history';
  displayedAlerts: DisplayedAlertRow[];
  displayedHistory: DisplayedHistoryRow[];
  totalOpenAlerts: number;
  geoFilterActive: boolean;
  reviewSearch: string;
  onReviewSearchChange: (value: string) => void;
  historySort: HistorySort;
  onHistorySortChange: (value: HistorySort) => void;
  poiById: Map<string, PointOfInterest>;
  onOpenPoi: (poiId: string, view: 'details' | 'reviews') => void;
  onAcknowledgeAlert: (alertId: string) => void;
  onSelectReview: (review: Review) => void;
  onDeleteRequest: (id: string, type: 'review', name: string) => void;
}) {
  if (reviewsTab === 'alerts') {
    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-3">
        {displayedAlerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3 border border-dashed border-slate-800 rounded-xl py-16">
            <CheckCircle className="w-10 h-10 text-emerald-600/60" />
            <p className="text-sm font-bold uppercase tracking-wide">
              {totalOpenAlerts === 0
                ? 'Nessuna segnalazione aperta'
                : geoFilterActive
                  ? 'Nessuna segnalazione nell’area selezionata'
                  : 'Nessuna segnalazione aperta'}
            </p>
            <p className="text-xs text-slate-600 max-w-sm text-center">
              {totalOpenAlerts === 0
                ? 'Quando la media recensioni di un POI scende sotto la soglia del Centro di Controllo, appare qui.'
                : 'Prova a rimuovere o allargare i filtri geografici.'}
            </p>
          </div>
        ) : (
          displayedAlerts.map(({ alert, target, canOpen, evidence }) => {
            const name = target?.name || alert.poiId;
            const breadcrumb = target?.geo?.breadcrumb;
            const criteriaEntries = evidence?.criteria ? Object.entries(evidence.criteria) : [];
            return (
              <div
                key={alert.id}
                className="bg-slate-950 border border-amber-500/30 rounded-xl p-4 flex flex-col gap-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex-1 min-w-0 space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                          Sotto soglia
                        </span>
                      </div>
                      <h4
                        className="text-white font-bold text-lg sm:text-xl leading-tight"
                        title={alert.poiId}
                      >
                        {name}
                      </h4>
                      {breadcrumb ? (
                        <p className="text-xs sm:text-sm text-slate-400 mt-1">{breadcrumb}</p>
                      ) : (
                        <p className="text-[10px] text-slate-600 mt-1 font-mono truncate">
                          {alert.poiId}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <StarRating value={alert.averageRating} size="w-3.5 h-3.5" />
                        <strong className="text-amber-400">
                          Media {alert.averageRating.toFixed(1)}
                        </strong>
                        <span className="text-slate-600">/ soglia {alert.threshold}</span>
                      </span>
                      <span>{alert.reviewsCount} recensioni</span>
                      <span className="font-mono text-slate-500">
                        {new Date(alert.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-amber-200/80">
                      Motivo: media {alert.averageRating.toFixed(1)} sotto soglia {alert.threshold}
                    </p>

                    {evidence ? (
                      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 sm:p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-0.5">
                              Recensione evidenza
                            </span>
                            <p className="text-sm font-bold text-white truncate">
                              {evidence.author}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <StarRating value={evidence.rating} size="w-3.5 h-3.5" />
                            <span className="text-amber-400 font-bold text-sm">
                              {evidence.rating}
                            </span>
                          </div>
                        </div>
                        {evidence.text?.trim() ? (
                          <p className="text-sm text-slate-300 italic leading-relaxed line-clamp-3">
                            &quot;{evidence.text}&quot;
                          </p>
                        ) : (
                          <p className="text-xs text-slate-600">Nessun testo nella recensione.</p>
                        )}
                        {criteriaEntries.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-800">
                            {criteriaEntries.map(([key, val]) => (
                              <div
                                key={key}
                                className="rounded-lg bg-slate-800/80 px-2 py-2 text-center min-w-0"
                              >
                                <span className="text-[9px] text-slate-400 uppercase font-bold block truncate mb-0.5">
                                  {key}
                                </span>
                                <span className="text-amber-500 font-bold text-sm">{val}</span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600 border border-dashed border-slate-800 rounded-xl px-3 py-2">
                        Nessuna recensione collegata disponibile per il dettaglio criteri.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 w-full sm:w-auto lg:w-44">
                    <button
                      type="button"
                      disabled={!canOpen}
                      onClick={() => onOpenPoi(alert.poiId, 'details')}
                      className="px-4 py-2.5 min-h-[44px] rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white text-[10px] font-bold uppercase border border-indigo-500/40 flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Apri POI
                    </button>
                    <button
                      type="button"
                      disabled={!canOpen}
                      onClick={() => onOpenPoi(alert.poiId, 'reviews')}
                      className="px-4 py-2.5 min-h-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-white text-[10px] font-bold uppercase border border-slate-700 flex items-center justify-center gap-2"
                    >
                      <Star className="w-3.5 h-3.5" /> Visualizza recensioni
                    </button>
                    <button
                      type="button"
                      onClick={() => void onAcknowledgeAlert(alert.id)}
                      className="px-4 py-2.5 min-h-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold uppercase border border-slate-700"
                    >
                      Segna come vista
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col min-h-0">
      <div className="shrink-0 p-3 border-b border-slate-800 flex flex-wrap gap-2 items-center">
        <input
          type="search"
          value={reviewSearch}
          onChange={(e) => onReviewSearchChange(e.target.value)}
          placeholder="Cerca autore, POI, area, testo…"
          className="flex-1 min-w-[180px] min-h-[44px] bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
        />
        <label className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500 min-h-[44px]">
          <ArrowUpDown className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <span className="sr-only">Ordina storico</span>
          <select
            value={historySort}
            onChange={(e) => {
              const next = parseHistorySort(e.target.value);
              if (next) onHistorySortChange(next);
            }}
            className="min-h-[44px] bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white"
          >
            <option value="date_desc">Data (recente)</option>
            <option value="date_asc">Data (vecchia)</option>
            <option value="author">Utente</option>
            <option value="poi">POI</option>
            <option value="rating">Valutazione</option>
          </select>
        </label>
      </div>

      {/* Mobile / tablet: card list — evita overflow orizzontale della tabella densa */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 md:hidden">
        {displayedHistory.map(({ review, target }) => {
          const poiId = review.poiId;
          const canOpen = Boolean(poiId && poiById.has(poiId));
          return (
            <article
              key={review.id}
              className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3"
            >
              <button
                type="button"
                onClick={() => onSelectReview(review)}
                className="w-full text-left space-y-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                aria-label={`Apri dettaglio recensione di ${review.author}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm truncate">{review.author}</p>
                    <p className="font-bold text-slate-200 text-sm truncate mt-0.5">
                      {target.name}
                    </p>
                    {target.geo?.breadcrumb ? (
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {target.geo.breadcrumb}
                      </p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold text-amber-500 text-sm">{review.rating}</p>
                    <p className="font-mono text-[10px] text-slate-500 mt-1">
                      {new Date(review.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 italic line-clamp-2">
                  &quot;{review.text}&quot;
                </p>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-slate-500">
                  <div>
                    <dt className="uppercase font-bold tracking-wide">Continente</dt>
                    <dd>{target.geo?.continent || '—'}</dd>
                  </div>
                  <div>
                    <dt className="uppercase font-bold tracking-wide">Nazione</dt>
                    <dd>{target.geo?.nation || '—'}</dd>
                  </div>
                  <div>
                    <dt className="uppercase font-bold tracking-wide">Regione</dt>
                    <dd>{target.geo?.region || '—'}</dd>
                  </div>
                  <div>
                    <dt className="uppercase font-bold tracking-wide">Zona</dt>
                    <dd>{target.geo?.zone || '—'}</dd>
                  </div>
                  <div>
                    <dt className="uppercase font-bold tracking-wide">Città</dt>
                    <dd>{target.geo?.city || '—'}</dd>
                  </div>
                  <div>
                    <dt className="uppercase font-bold tracking-wide">Modificata</dt>
                    <dd>
                      {review.updatedAt ? new Date(review.updatedAt).toLocaleDateString() : '—'}
                    </dd>
                  </div>
                </dl>
              </button>
              <div className="flex justify-end border-t border-slate-800 pt-2">
                <HistoryRowActions
                  canOpen={canOpen}
                  poiId={poiId}
                  review={review}
                  onOpenPoi={onOpenPoi}
                  onDeleteRequest={onDeleteRequest}
                />
              </div>
            </article>
          );
        })}
      </div>

      {/* Desktop: tabella densa con scroll orizzontale */}
      <div className="hidden md:block flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1100px] table-auto">
          <thead className="sticky top-0 z-local-sticky bg-[#0f172a] shadow-sm">
            <tr className="text-slate-400 text-[10px] uppercase tracking-wider font-bold border-b border-slate-800">
              <th className="px-3 py-3 whitespace-nowrap min-w-[7rem]">Utente</th>
              <th className="px-3 py-3 whitespace-nowrap min-w-[12rem]">POI / Target</th>
              <th className="px-3 py-3 whitespace-nowrap min-w-[5rem]">Continente</th>
              <th className="px-3 py-3 whitespace-nowrap min-w-[5rem]">Nazione</th>
              <th className="px-3 py-3 whitespace-nowrap min-w-[5rem]">Regione</th>
              <th className="px-3 py-3 whitespace-nowrap min-w-[5rem]">Zona</th>
              <th className="px-3 py-3 whitespace-nowrap min-w-[5rem]">Città</th>
              <th className="px-3 py-3 min-w-[8rem]">Snippet</th>
              <th className="px-2 py-3 text-center whitespace-nowrap">Voto</th>
              <th className="px-3 py-3 whitespace-nowrap text-center">Data</th>
              <th className="px-3 py-3 whitespace-nowrap text-center">Modificata</th>
              <th className="px-3 py-3 whitespace-nowrap text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 bg-slate-900">
            {displayedHistory.map(({ review, target }) => {
              const poiId = review.poiId;
              const canOpen = Boolean(poiId && poiById.has(poiId));
              return (
                <tr
                  key={review.id}
                  tabIndex={0}
                  aria-label={`Apri dettaglio recensione di ${review.author}`}
                  onClick={() => onSelectReview(review)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectReview(review);
                    }
                  }}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-indigo-500"
                >
                  <td className="px-3 py-3 font-bold text-white text-sm max-w-[9rem] truncate">
                    {review.author}
                  </td>
                  <td className="px-3 py-3 max-w-[16rem]" title={target.technicalId || undefined}>
                    <div className="font-bold text-white text-sm truncate">{target.name}</div>
                    {target.geo?.breadcrumb ? (
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        {target.geo.breadcrumb}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-[11px] text-slate-400 whitespace-nowrap">
                    {target.geo?.continent || '—'}
                  </td>
                  <td className="px-3 py-3 text-[11px] text-slate-400 whitespace-nowrap">
                    {target.geo?.nation || '—'}
                  </td>
                  <td className="px-3 py-3 text-[11px] text-slate-400 whitespace-nowrap">
                    {target.geo?.region || '—'}
                  </td>
                  <td className="px-3 py-3 text-[11px] text-slate-400 whitespace-nowrap">
                    {target.geo?.zone || '—'}
                  </td>
                  <td className="px-3 py-3 text-[11px] text-slate-400 whitespace-nowrap">
                    {target.geo?.city || '—'}
                  </td>
                  <td className="px-3 py-3 max-w-[14rem]">
                    <p className="text-xs text-slate-400 italic truncate">
                      &quot;{review.text}&quot;
                    </p>
                  </td>
                  <td className="px-2 py-3 text-center font-bold text-amber-500 text-xs">
                    {review.rating}
                  </td>
                  <td className="px-3 py-3 text-center font-mono text-[10px] text-slate-500 whitespace-nowrap">
                    {new Date(review.date).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-3 text-center font-mono text-[10px] text-slate-500 whitespace-nowrap">
                    {review.updatedAt ? new Date(review.updatedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="opacity-80 group-hover:opacity-100 transition-opacity">
                      <HistoryRowActions
                        canOpen={canOpen}
                        poiId={poiId}
                        review={review}
                        onOpenPoi={onOpenPoi}
                        onDeleteRequest={onDeleteRequest}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
