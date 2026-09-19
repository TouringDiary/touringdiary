import {
  Award,
  Camera,
  CheckSquare,
  ChevronRight,
  Loader2,
  Square,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { CountBadge } from '@/components/ui/CountBadge';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_MODAL, Z_OVERLAY } from '@/constants/zIndex';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import {
  deleteCityPatronGalleryPhoto,
  listCityPatronGallery,
} from '@/services/patron/cityPatronGalleryService';
import {
  approvePatronPhotoSuggestionItems,
  listPatronPhotoSuggestionsForAdmin,
  markPatronPhotoSuggestionInReview,
  rejectPatronPhotoSuggestion,
} from '@/services/patron/patronPhotoSuggestionService';
import type {
  CityPatronGalleryPhoto,
  PatronPhotoSuggestion,
  PatronPhotoSuggestionStatus,
} from '@/types/models/patronGallery';
import { AdminPageHeader } from './common/AdminPageHeader';

type SuggestionFilter = PatronPhotoSuggestionStatus | 'all';

/** Tab trap locale sul dialog (stesso pattern di ItineraryManagerReviewDetail / CategoryMobileDialog). */
function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
}

const SUGGESTION_STATUS_LABELS: Record<PatronPhotoSuggestionStatus, string> = {
  pending: 'Da gestire',
  in_review: 'In revisione',
  accepted: 'Accettata',
  rejected: 'Rifiutata',
};

const suggestionBadgeClass = (status: PatronPhotoSuggestionStatus): string => {
  if (status === 'pending') return 'bg-amber-600/20 text-amber-400';
  if (status === 'in_review') return 'bg-indigo-600/20 text-indigo-300';
  if (status === 'accepted') return 'bg-emerald-600/20 text-emerald-400';
  return 'bg-slate-700 text-slate-400';
};

/** Focus ring dialog — stesso token dei modali Foundation admin (ItineraryManagerReviewDetail). */
const MODAL_DIALOG_FOCUS =
  'outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900';

export type AdminPatronEmbeddedSection = 'photo_suggestions' | 'person_suggestions';

type AdminPatronSaintManagerProps = {
  embeddedSection?: AdminPatronEmbeddedSection;
};

export const AdminPatronSaintManager = ({ embeddedSection }: AdminPatronSaintManagerProps = {}) => {
  const suggestionAdminNotesFieldId = useId();
  const suggestionDialogRef = useRef<HTMLDivElement>(null);
  const suggestionOpenerRef = useRef<HTMLElement | null>(null);

  const isMobile = useMobileDetect();
  const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
  const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
  const headerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalHeader);
  const headerIconBox = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalHeaderIconBox);
  const headerIconGlyph = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalHeaderIconGlyph);
  const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
  const footerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalFooter);
  const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
  const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
  const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);
  const needsSuggestionsData =
    embeddedSection === 'photo_suggestions' || embeddedSection === undefined;
  const [suggestions, setSuggestions] = useState<PatronPhotoSuggestion[]>([]);
  const [suggestionFilter, setSuggestionFilter] = useState<SuggestionFilter>('pending');
  const [selectedSuggestion, setSelectedSuggestion] = useState<PatronPhotoSuggestion | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [captionsByItemId, setCaptionsByItemId] = useState<Record<string, string>>({});
  const [adminNotesDraft, setAdminNotesDraft] = useState('');
  const [isLoading, setIsLoading] = useState(needsSuggestionsData);
  const [isActing, setIsActing] = useState(false);
  const [officialGallery, setOfficialGallery] = useState<CityPatronGalleryPhoto[]>([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);
  const [photoPendingDelete, setPhotoPendingDelete] = useState<CityPatronGalleryPhoto | null>(null);
  const [isDeletingGalleryPhoto, setIsDeletingGalleryPhoto] = useState(false);
  /** Invalida risposte gallery obsolete quando cambia città / chiusura dettaglio. */
  const galleryRequestIdRef = useRef(0);

  const activeCityId = selectedSuggestion?.cityId ?? null;
  const activeCityName = selectedSuggestion?.cityName ?? '';

  const loadData = useCallback(async (): Promise<{
    suggestions: PatronPhotoSuggestion[];
  } | null> => {
    if (!needsSuggestionsData) return null;
    setIsLoading(true);
    try {
      const sug = await listPatronPhotoSuggestionsForAdmin();
      setSuggestions(sug);
      return { suggestions: sug };
    } catch {
      alert('Errore caricamento dati Santo Patrono.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [needsSuggestionsData]);

  /** Allinea gli snapshot di dettaglio aperto alle liste fresche (o chiude se assenti). */
  const syncOpenDetailSnapshots = useCallback(
    (fresh: { suggestions: PatronPhotoSuggestion[] }) => {
      setSelectedSuggestion((prev) => {
        if (!prev) return null;
        return fresh.suggestions.find((s) => s.id === prev.id) ?? null;
      });
    },
    [],
  );

  useEffect(() => {
    if (needsSuggestionsData) {
      void loadData();
    }
  }, [needsSuggestionsData, loadData]);

  const loadOfficialGallery = useCallback(async (cityId: string) => {
    const requestId = ++galleryRequestIdRef.current;
    setIsGalleryLoading(true);
    try {
      const photos = await listCityPatronGallery(cityId);
      if (requestId !== galleryRequestIdRef.current) return;
      setOfficialGallery(photos);
    } catch {
      if (requestId !== galleryRequestIdRef.current) return;
      setOfficialGallery([]);
      alert('Errore caricamento gallery ufficiale Patrono.');
    } finally {
      if (requestId === galleryRequestIdRef.current) {
        setIsGalleryLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!activeCityId) {
      galleryRequestIdRef.current += 1;
      setOfficialGallery([]);
      setPhotoPendingDelete(null);
      setIsGalleryLoading(false);
      return;
    }
    void loadOfficialGallery(activeCityId);
  }, [activeCityId, loadOfficialGallery]);

  const filteredSuggestions = useMemo(
    () => suggestions.filter((s) => suggestionFilter === 'all' || s.status === suggestionFilter),
    [suggestions, suggestionFilter],
  );

  const pendingSuggestions = suggestions.filter((s) => s.status === 'pending').length;

  const openSuggestion = (item: PatronPhotoSuggestion) => {
    suggestionOpenerRef.current = (document.activeElement as HTMLElement | null) ?? null;
    setPhotoPendingDelete(null);
    setSelectedSuggestion(item);
    setSelectedItemIds(new Set(item.items.filter((i) => i.status === 'pending').map((i) => i.id)));
    setCaptionsByItemId({});
    setAdminNotesDraft(item.adminNotes ?? '');
  };

  const closeSuggestion = () => {
    setSelectedSuggestion(null);
    setSelectedItemIds(new Set());
    setCaptionsByItemId({});
    setAdminNotesDraft('');
    setPhotoPendingDelete(null);
  };

  // Pattern consolidato (LIFO ESC). Conferma eliminazione gallery ha priorità.
  useGlobalModalEscape(selectedSuggestion !== null && photoPendingDelete === null, closeSuggestion);

  // Focus iniziale, restore opener, tab-trap locale (coerente con aria-modal; nessuna utility shared).
  useEffect(() => {
    if (!selectedSuggestion) return;
    const dialog = suggestionDialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusRaf = requestAnimationFrame(() => {
      dialog?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = getFocusableElements(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog?.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(focusRaf);
      dialog?.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      suggestionOpenerRef.current?.focus?.();
      suggestionOpenerRef.current = null;
    };
  }, [selectedSuggestion]);

  const toggleItem = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canModerateSuggestion =
    selectedSuggestion?.status === 'pending' || selectedSuggestion?.status === 'in_review';

  const handleMarkSuggestionInReview = async () => {
    if (selectedSuggestion?.status !== 'pending') return;
    setIsActing(true);
    try {
      await markPatronPhotoSuggestionInReview(selectedSuggestion.id);
      closeSuggestion();
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Errore passaggio In revisione.');
    } finally {
      setIsActing(false);
    }
  };

  const handleAcceptSuggestion = async () => {
    if (!selectedSuggestion || !canModerateSuggestion) return;
    setIsActing(true);
    try {
      await approvePatronPhotoSuggestionItems(selectedSuggestion.id, [...selectedItemIds], {
        adminNotes: adminNotesDraft,
        captionsByItemId,
      });
      closeSuggestion();
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Errore accettazione.');
    } finally {
      setIsActing(false);
    }
  };

  const handleRejectSuggestion = async () => {
    if (!selectedSuggestion || !canModerateSuggestion) return;
    if (!window.confirm('Rifiutare questa segnalazione? Tutte le foto pending verranno rifiutate.'))
      return;
    setIsActing(true);
    try {
      await rejectPatronPhotoSuggestion(selectedSuggestion.id, adminNotesDraft);
      closeSuggestion();
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Errore rifiuto segnalazione.');
    } finally {
      setIsActing(false);
    }
  };

  const handleConfirmDeleteOfficialPhoto = async () => {
    if (!photoPendingDelete || !activeCityId || isDeletingGalleryPhoto) return;
    const deletedGalleryPhotoId = photoPendingDelete.id;
    setIsDeletingGalleryPhoto(true);
    try {
      await deleteCityPatronGalleryPhoto(deletedGalleryPhotoId);
      setPhotoPendingDelete(null);
      await loadOfficialGallery(activeCityId);
      const fresh = await loadData();
      if (fresh) {
        syncOpenDetailSnapshots(fresh);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Errore durante l'eliminazione della foto.");
    } finally {
      setIsDeletingGalleryPhoto(false);
    }
  };

  const officialGallerySection = activeCityId ? (
    <section className="space-y-2" aria-labelledby="official-patron-gallery-heading">
      <h4
        id="official-patron-gallery-heading"
        className="text-[10px] font-bold uppercase tracking-widest text-slate-500"
      >
        Gallery ufficiale — {activeCityName}
      </h4>
      <p className="text-[11px] text-slate-500">
        Foto già pubblicate in <span className="text-slate-400">city_patron_gallery</span>. La
        rimozione usa lo stesso service del Manager città.
      </p>
      {isGalleryLoading ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          Caricamento gallery…
        </div>
      ) : officialGallery.length === 0 ? (
        <p className="text-sm text-slate-500 italic">Nessuna foto in gallery ufficiale.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 min-w-0">
          {officialGallery.map((photo, index) => (
            <div
              key={photo.id}
              className="relative aspect-square rounded-lg overflow-hidden border border-slate-700 bg-slate-950"
            >
              <img
                src={photo.imageUrl}
                alt={photo.caption ?? `Foto gallery ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setPhotoPendingDelete(photo)}
                disabled={isActing || isDeletingGalleryPhoto}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white p-2 min-h-11 min-w-11 inline-flex items-center justify-center rounded-full shadow-lg disabled:opacity-50"
                aria-label={`Elimina foto gallery ${index + 1}`}
                title="Elimina dalla gallery ufficiale"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  ) : null;

  const showSuggestions = embeddedSection
    ? embeddedSection === 'photo_suggestions'
    : true;

  return (
    <div className="space-y-6 animate-in fade-in flex flex-col h-full">
      {!embeddedSection ? (
        <>
          <AdminPageHeader
            icon={Award}
            title="Santo Patrono"
            subtitle="Gallery Patrono — suggerimenti foto e segnalazioni abuso sono in Segnalazioni"
            accent="amber"
            badge={
              pendingSuggestions > 0 ? (
                <CountBadge count={pendingSuggestions} variant="rose" pulse />
              ) : undefined
            }
          />

          <div className="flex gap-2 border-b border-slate-800 pb-1">
            <span className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg bg-amber-600 text-white min-h-[44px] inline-flex items-center">
              Segnalazioni foto
              {pendingSuggestions > 0 ? (
                <span className="ml-2 text-[10px] bg-rose-600 px-1.5 py-0.5 rounded-full">
                  {pendingSuggestions}
                </span>
              ) : null}
            </span>
          </div>
        </>
      ) : null}

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          Caricamento…
        </div>
      ) : showSuggestions ? (
        <>
          <div className="flex flex-wrap gap-2">
            {(['pending', 'in_review', 'accepted', 'rejected', 'all'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setSuggestionFilter(f)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border min-h-[36px] ${suggestionFilter === f ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 text-slate-400 hover:text-white'}`}
              >
                {f === 'all' ? 'Tutte' : SUGGESTION_STATUS_LABELS[f]}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredSuggestions.length === 0 ? (
              <p className="text-slate-500 text-sm italic py-8 text-center">
                Nessuna segnalazione.
              </p>
            ) : (
              filteredSuggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => openSuggestion(s)}
                  className="w-full text-left p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-indigo-500/50 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${suggestionBadgeClass(s.status)}`}
                      >
                        {SUGGESTION_STATUS_LABELS[s.status]}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(s.createdAt).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                    <p className="text-white font-bold truncate">
                      {s.cityName} · {s.patronName}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {s.userName} · {s.items.length} foto
                      {s.notes ? ` · ${s.notes}` : ''}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 shrink-0" />
                </button>
              ))
            )}
          </div>
        </>
      ) : null}

      {selectedSuggestion
        ? createPortal(
            <div
              className={`td-modal-overlay ${overlayShell} !items-center !top-0`}
              style={{ zIndex: Z_OVERLAY }}
              role="presentation"
            >
              <button
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                className="absolute inset-0 h-full w-full cursor-default border-0 bg-transparent p-0"
                onClick={closeSuggestion}
              />
              <div
                ref={suggestionDialogRef}
                tabIndex={-1}
                className={`${containerShell} max-w-2xl ${MODAL_DIALOG_FOCUS}`}
                style={{ zIndex: Z_MODAL }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="patron-suggestion-detail-title"
                aria-describedby="patron-suggestion-detail-desc"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <CloseButton
                  onClose={closeSuggestion}
                  variant="primary"
                  size="md"
                  position="static"
                  withEscape={false}
                  title="Chiudi dettaglio"
                  className={`absolute ${closeOffsetShell} z-local-overlay`}
                />

                <header className={headerShell}>
                  <div className="flex items-center gap-3 sm:gap-4 pr-10 min-w-0">
                    <div className={headerIconBox}>
                      <Camera className={headerIconGlyph || 'w-6 h-6'} aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <h3
                        id="patron-suggestion-detail-title"
                        className={`${modalTitleShell} mb-0.5`}
                      >
                        Segnalazione foto
                      </h3>
                      <p
                        id="patron-suggestion-detail-desc"
                        className={`${modalSubtitleShell} truncate`}
                      >
                        {selectedSuggestion.userName} · {selectedSuggestion.cityName} ·{' '}
                        {selectedSuggestion.patronName}
                      </p>
                      <span
                        className={`inline-block mt-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded ${suggestionBadgeClass(selectedSuggestion.status)}`}
                      >
                        {SUGGESTION_STATUS_LABELS[selectedSuggestion.status]}
                      </span>
                    </div>
                  </div>
                </header>

                <div className={`${bodyShell} min-h-0 space-y-4`}>
                  <section className="space-y-1" aria-labelledby="suggestion-user-notes-heading">
                    <h4
                      id="suggestion-user-notes-heading"
                      className="text-[10px] font-bold uppercase tracking-widest text-slate-500"
                    >
                      Note dell&apos;utente
                    </h4>
                    {selectedSuggestion.notes ? (
                      <p className="text-sm text-slate-300 bg-slate-950 rounded-lg p-3 border border-slate-800">
                        {selectedSuggestion.notes}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-500 italic">
                        Nessuna nota inviata dall&apos;utente.
                      </p>
                    )}
                  </section>

                  {(selectedSuggestion.adminNotes || canModerateSuggestion) && (
                    <section className="space-y-2" aria-labelledby="suggestion-admin-notes-heading">
                      <h4
                        id="suggestion-admin-notes-heading"
                        className="text-[10px] font-bold uppercase tracking-widest text-slate-500"
                      >
                        Note admin
                      </h4>
                      {canModerateSuggestion ? (
                        <>
                          <label htmlFor={suggestionAdminNotesFieldId} className="sr-only">
                            Note admin di moderazione
                          </label>
                          <textarea
                            id={suggestionAdminNotesFieldId}
                            value={adminNotesDraft}
                            onChange={(e) => setAdminNotesDraft(e.target.value)}
                            rows={3}
                            disabled={isActing}
                            placeholder="Annotazione di moderazione (accettazione o rifiuto)…"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white resize-y min-h-[44px] focus:border-amber-500 focus:outline-none disabled:opacity-50"
                          />
                          <p className="text-[11px] text-slate-500">
                            Persistite in <span className="text-slate-400">admin_notes</span> sia in
                            accettazione sia in rifiuto. Non sovrascrivono le note utente.
                          </p>
                        </>
                      ) : selectedSuggestion.adminNotes ? (
                        <p className="text-sm text-slate-300 bg-slate-950 rounded-lg p-3 border border-slate-800">
                          {selectedSuggestion.adminNotes}
                        </p>
                      ) : null}
                    </section>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedSuggestion.items.map((item) => {
                      const selected = selectedItemIds.has(item.id);
                      const isPendingItem = item.status === 'pending';
                      return (
                        <div
                          key={item.id}
                          className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950/40"
                        >
                          <div className="relative aspect-square">
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            {canModerateSuggestion && isPendingItem ? (
                              <button
                                type="button"
                                onClick={() => toggleItem(item.id)}
                                className="absolute top-2 left-2 bg-black/70 rounded p-1 text-white min-h-11 min-w-11 inline-flex items-center justify-center"
                                aria-label={
                                  selected
                                    ? 'Deseleziona foto per accettazione'
                                    : 'Seleziona foto per accettazione'
                                }
                              >
                                {selected ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                            ) : (
                              <span className="absolute top-2 left-2 text-[9px] font-bold uppercase bg-black/70 px-1.5 py-0.5 rounded text-slate-300">
                                {item.status === 'approved'
                                  ? 'Accettata'
                                  : item.status === 'rejected'
                                    ? 'Rifiutata'
                                    : 'Da gestire'}
                              </span>
                            )}
                          </div>
                          {canModerateSuggestion && selected && isPendingItem ? (
                            <div className="p-2 border-t border-slate-800">
                              <label
                                htmlFor={`caption-${item.id}`}
                                className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1"
                              >
                                Didascalia (opzionale)
                              </label>
                              <textarea
                                id={`caption-${item.id}`}
                                value={captionsByItemId[item.id] ?? ''}
                                onChange={(e) =>
                                  setCaptionsByItemId((prev) => ({
                                    ...prev,
                                    [item.id]: e.target.value,
                                  }))
                                }
                                rows={2}
                                disabled={isActing}
                                placeholder="Didascalia in gallery ufficiale…"
                                className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-white resize-y min-h-[40px] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50"
                              />
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  {officialGallerySection}
                </div>

                {canModerateSuggestion ? (
                  <footer className={footerShell}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap w-full">
                      {selectedSuggestion.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => void handleMarkSuggestionInReview()}
                          disabled={isActing}
                          className="flex-1 py-3 min-h-[44px] rounded-xl border border-indigo-700 text-indigo-300 hover:bg-indigo-950/40 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                        >
                          Metti in revisione
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void handleRejectSuggestion()}
                        disabled={isActing}
                        className="flex-1 py-3 min-h-[44px] rounded-xl border border-red-800 text-red-400 hover:bg-red-950/50 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                      >
                        Rifiuta
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleAcceptSuggestion()}
                        disabled={isActing || selectedItemIds.size === 0}
                        className="flex-1 py-3 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest"
                      >
                        {isActing ? 'Elaborazione…' : `Approva foto (${selectedItemIds.size})`}
                      </button>
                    </div>
                  </footer>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}

      <DeleteConfirmationModal
        isOpen={photoPendingDelete !== null}
        onClose={() => {
          if (!isDeletingGalleryPhoto) setPhotoPendingDelete(null);
        }}
        onConfirm={() => void handleConfirmDeleteOfficialPhoto()}
        variant="danger"
        title="Eliminare foto gallery?"
        message={
          photoPendingDelete
            ? `Stai per rimuovere definitivamente questa foto dalla gallery ufficiale Patrono/Festa di ${activeCityName}${
                photoPendingDelete.caption ? ` («${photoPendingDelete.caption}»).` : '.'
              } Verranno eliminati il riferimento in database e il file Storage.`
            : 'Stai per rimuovere definitivamente questa foto dalla gallery ufficiale.'
        }
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        isDeleting={isDeletingGalleryPhoto}
        loadingLabel="Eliminazione…"
      />
    </div>
  );
};
