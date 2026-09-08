import { Camera, ChevronRight, Flag, Loader2, UserPlus, Users } from 'lucide-react';
import {
  type MutableRefObject,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { CountBadge } from '@/components/ui/CountBadge';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_MODAL, Z_OVERLAY } from '@/constants/zIndex';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import {
  blockFamousPersonPhotoReportAndClearOfficialPhoto,
  listFamousPersonPhotoReportsForAdmin,
  markFamousPersonPhotoReportInReview,
  rejectFamousPersonPhotoReport,
} from '@/services/famousPerson/famousPersonPhotoReportService';
import {
  acceptFamousPersonPhotoSuggestion,
  listFamousPersonPhotoSuggestionsForAdmin,
  markFamousPersonPhotoSuggestionInReview,
  rejectFamousPersonPhotoSuggestion,
} from '@/services/famousPerson/famousPersonPhotoSuggestionService';
import {
  acceptFamousPersonSuggestion,
  listFamousPersonSuggestionsForAdmin,
  markFamousPersonSuggestionInReview,
  rejectFamousPersonSuggestion,
  setAcceptedFamousPersonEditorialStatus,
} from '@/services/famousPerson/famousPersonSuggestionService';
import {
  FAMOUS_PERSON_MODERATION_STATUS_LABELS,
  FAMOUS_PERSON_PHOTO_REPORT_REASON_LABELS,
  FAMOUS_PERSON_PHOTO_REPORT_STATUS_LABELS,
  type FamousPersonModerationStatus,
  type FamousPersonPhotoReport,
  type FamousPersonPhotoReportStatus,
  type FamousPersonPhotoSuggestion,
  type FamousPersonSuggestion,
} from '@/types/models/famousPersonCommunity';
import { AdminFamousPeopleCategoriesManager } from './AdminFamousPeopleCategoriesManager';
import { AdminPageHeader } from './common/AdminPageHeader';

type AdminTab = 'categories' | 'person_suggestions' | 'photo_suggestions' | 'reports';
type SuggestionFilter = FamousPersonModerationStatus | 'all';
type ReportFilter = FamousPersonPhotoReportStatus | 'all';

/** Tab trap locale sul dialog (stesso pattern di AdminPatronSaintManager). */
function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
}

/** Local focus-trap for one dialog; ESC, focus restore, and scroll lock managed globally. */
function useDialogFocusTrap(
  active: boolean,
  dialogRef: RefObject<HTMLDivElement | null>,
): void {
  useEffect(() => {
    if (!active) return;
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
      const activeEl = document.activeElement;
      if (event.shiftKey && (activeEl === first || activeEl === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeEl === last) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog?.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(focusRaf);
      dialog?.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, dialogRef]);
}

const suggestionBadgeClass = (status: FamousPersonModerationStatus): string => {
  if (status === 'pending') return 'bg-amber-600/20 text-amber-400';
  if (status === 'in_review') return 'bg-indigo-600/20 text-indigo-300';
  if (status === 'accepted') return 'bg-emerald-600/20 text-emerald-400';
  return 'bg-slate-700 text-slate-400';
};

const reportBadgeClass = (status: FamousPersonPhotoReportStatus): string => {
  if (status === 'pending') return 'bg-amber-600/20 text-amber-400';
  if (status === 'in_review') return 'bg-indigo-600/20 text-indigo-300';
  if (status === 'photo_blocked') return 'bg-rose-700/30 text-rose-300';
  return 'bg-slate-700 text-slate-400';
};

const MODAL_DIALOG_FOCUS =
  'outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900';

const TAB_BUTTON_BASE =
  'px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors min-h-[44px]';

export const AdminFamousPeopleManager = () => {
  const personAdminNotesFieldId = useId();
  const photoAdminNotesFieldId = useId();
  const reportAdminNotesFieldId = useId();
  const personDialogTitleId = useId();
  const personDialogDescId = useId();
  const photoDialogTitleId = useId();
  const photoDialogDescId = useId();
  const reportDialogTitleId = useId();
  const reportDialogDescId = useId();

  const personDialogRef = useRef<HTMLDivElement>(null);
  const photoDialogRef = useRef<HTMLDivElement>(null);
  const reportDialogRef = useRef<HTMLDivElement>(null);
  const globalOpenerRef = useRef<HTMLElement | null>(null);

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

  const [tab, setTab] = useState<AdminTab>('categories');
  const [personSuggestions, setPersonSuggestions] = useState<FamousPersonSuggestion[]>([]);
  const [photoSuggestions, setPhotoSuggestions] = useState<FamousPersonPhotoSuggestion[]>([]);
  const [reports, setReports] = useState<FamousPersonPhotoReport[]>([]);
  const [personFilter, setPersonFilter] = useState<SuggestionFilter>('pending');
  const [photoFilter, setPhotoFilter] = useState<SuggestionFilter>('pending');
  const [reportFilter, setReportFilter] = useState<ReportFilter>('pending');
  const [selectedPerson, setSelectedPerson] = useState<FamousPersonSuggestion | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<FamousPersonPhotoSuggestion | null>(null);
  const [selectedReport, setSelectedReport] = useState<FamousPersonPhotoReport | null>(null);
  const [personAdminNotesDraft, setPersonAdminNotesDraft] = useState('');
  const [photoAdminNotesDraft, setPhotoAdminNotesDraft] = useState('');
  const [reportAdminNotesDraft, setReportAdminNotesDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);

  const loadData = useCallback(async (): Promise<{
    personSuggestions: FamousPersonSuggestion[];
    photoSuggestions: FamousPersonPhotoSuggestion[];
    reports: FamousPersonPhotoReport[];
  } | null> => {
    setIsLoading(true);
    try {
      const [persons, photos, reps] = await Promise.all([
        listFamousPersonSuggestionsForAdmin(),
        listFamousPersonPhotoSuggestionsForAdmin(),
        listFamousPersonPhotoReportsForAdmin(),
      ]);
      setPersonSuggestions(persons);
      setPhotoSuggestions(photos);
      setReports(reps);
      return { personSuggestions: persons, photoSuggestions: photos, reports: reps };
    } catch {
      alert('Errore caricamento dati Personaggi Famosi.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncOpenDetailSnapshots = useCallback(
    (fresh: {
      personSuggestions: FamousPersonSuggestion[];
      photoSuggestions: FamousPersonPhotoSuggestion[];
      reports: FamousPersonPhotoReport[];
    }) => {
      setSelectedPerson((prev) => {
        if (!prev) return null;
        return fresh.personSuggestions.find((s) => s.id === prev.id) ?? null;
      });
      setSelectedPhoto((prev) => {
        if (!prev) return null;
        return fresh.photoSuggestions.find((s) => s.id === prev.id) ?? null;
      });
      setSelectedReport((prev) => {
        if (!prev) return null;
        return fresh.reports.find((r) => r.id === prev.id) ?? null;
      });
    },
    [],
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredPersonSuggestions = useMemo(
    () => personSuggestions.filter((s) => personFilter === 'all' || s.status === personFilter),
    [personSuggestions, personFilter],
  );

  const filteredPhotoSuggestions = useMemo(
    () => photoSuggestions.filter((s) => photoFilter === 'all' || s.status === photoFilter),
    [photoSuggestions, photoFilter],
  );

  const filteredReports = useMemo(
    () => reports.filter((r) => reportFilter === 'all' || r.status === reportFilter),
    [reports, reportFilter],
  );

  const pendingPersons = personSuggestions.filter((s) => s.status === 'pending').length;
  const pendingPhotos = photoSuggestions.filter((s) => s.status === 'pending').length;
  const pendingReports = reports.filter((r) => r.status === 'pending').length;
  const totalPending = pendingPersons + pendingPhotos + pendingReports;

  const closePerson = () => {
    setSelectedPerson(null);
    setPersonAdminNotesDraft('');
  };

  const closePhoto = () => {
    setSelectedPhoto(null);
    setPhotoAdminNotesDraft('');
  };

  const closeReport = () => {
    setSelectedReport(null);
    setReportAdminNotesDraft('');
  };

  const openPerson = (item: FamousPersonSuggestion) => {
    if (!globalOpenerRef.current) {
      globalOpenerRef.current = (document.activeElement as HTMLElement | null) ?? null;
    }
    closePhoto();
    closeReport();
    setSelectedPerson(item);
    setPersonAdminNotesDraft(item.adminNotes ?? '');
  };

  const openPhoto = (item: FamousPersonPhotoSuggestion) => {
    if (!globalOpenerRef.current) {
      globalOpenerRef.current = (document.activeElement as HTMLElement | null) ?? null;
    }
    closePerson();
    closeReport();
    setSelectedPhoto(item);
    setPhotoAdminNotesDraft(item.adminNotes ?? '');
  };

  const openReport = (report: FamousPersonPhotoReport) => {
    if (!globalOpenerRef.current) {
      globalOpenerRef.current = (document.activeElement as HTMLElement | null) ?? null;
    }
    closePerson();
    closePhoto();
    setSelectedReport(report);
    setReportAdminNotesDraft(report.adminNotes ?? '');
  };

  const anyActive = selectedPerson !== null || selectedPhoto !== null || selectedReport !== null;

  useEffect(() => {
    if (anyActive) {
      if (!globalOpenerRef.current) {
        globalOpenerRef.current = (document.activeElement as HTMLElement | null) ?? null;
      }
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previousOverflow;
        const opener = globalOpenerRef.current;
        globalOpenerRef.current = null;
        if (opener && typeof opener.focus === 'function' && document.contains(opener)) {
          opener.focus();
        }
      };
    }
  }, [anyActive]);

  useGlobalModalEscape(selectedPerson !== null, closePerson);
  useGlobalModalEscape(selectedPhoto !== null, closePhoto);
  useGlobalModalEscape(selectedReport !== null, closeReport);

  useDialogFocusTrap(selectedPerson !== null, personDialogRef);
  useDialogFocusTrap(selectedPhoto !== null, photoDialogRef);
  useDialogFocusTrap(selectedReport !== null, reportDialogRef);

  const canModeratePerson =
    selectedPerson?.status === 'pending' || selectedPerson?.status === 'in_review';
  const canModeratePhoto =
    selectedPhoto?.status === 'pending' || selectedPhoto?.status === 'in_review';
  const canModerateReport =
    selectedReport?.status === 'pending' || selectedReport?.status === 'in_review';

  const handleMarkPersonInReview = async () => {
    if (selectedPerson?.status !== 'pending') return;
    setIsActing(true);
    try {
      await markFamousPersonSuggestionInReview(selectedPerson.id);
      closePerson();
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Errore passaggio In revisione.');
    } finally {
      setIsActing(false);
    }
  };

  const handleAcceptPerson = async () => {
    if (!selectedPerson || !canModeratePerson) return;
    setIsActing(true);
    try {
      await acceptFamousPersonSuggestion(selectedPerson.id, personAdminNotesDraft);
      closePerson();
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Errore accettazione personaggio.');
    } finally {
      setIsActing(false);
    }
  };

  const handleRejectPerson = async () => {
    if (!selectedPerson || !canModeratePerson) return;
    if (!window.confirm('Rifiutare questo suggerimento personaggio?')) return;
    setIsActing(true);
    try {
      await rejectFamousPersonSuggestion(selectedPerson.id, personAdminNotesDraft);
      closePerson();
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Errore rifiuto suggerimento.');
    } finally {
      setIsActing(false);
    }
  };

  const handleSetEditorialStatus = async (nextStatus: 'draft' | 'published') => {
    if (selectedPerson?.status !== 'accepted') return;
    setIsActing(true);
    try {
      await setAcceptedFamousPersonEditorialStatus(selectedPerson.id, nextStatus);
      const fresh = await loadData();
      if (fresh) syncOpenDetailSnapshots(fresh);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Errore aggiornamento stato editoriale.');
    } finally {
      setIsActing(false);
    }
  };

  const handleMarkPhotoInReview = async () => {
    if (selectedPhoto?.status !== 'pending') return;
    setIsActing(true);
    try {
      await markFamousPersonPhotoSuggestionInReview(selectedPhoto.id);
      closePhoto();
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Errore passaggio In revisione.');
    } finally {
      setIsActing(false);
    }
  };

  const handleAcceptPhoto = async () => {
    if (!selectedPhoto || !canModeratePhoto) return;
    setIsActing(true);
    try {
      await acceptFamousPersonPhotoSuggestion(selectedPhoto.id, photoAdminNotesDraft);
      closePhoto();
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Errore accettazione foto.');
    } finally {
      setIsActing(false);
    }
  };

  const handleRejectPhoto = async () => {
    if (!selectedPhoto || !canModeratePhoto) return;
    if (!window.confirm('Rifiutare questo suggerimento foto?')) return;
    setIsActing(true);
    try {
      await rejectFamousPersonPhotoSuggestion(selectedPhoto.id, photoAdminNotesDraft);
      closePhoto();
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Errore rifiuto suggerimento foto.');
    } finally {
      setIsActing(false);
    }
  };

  const handleMarkReportInReview = async () => {
    if (selectedReport?.status !== 'pending') return;
    setIsActing(true);
    try {
      await markFamousPersonPhotoReportInReview(selectedReport.id);
      closeReport();
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Errore passaggio In revisione.');
    } finally {
      setIsActing(false);
    }
  };

  const handleRejectReport = async () => {
    if (!selectedReport || !canModerateReport) return;
    if (!window.confirm('Rifiutare la segnalazione? La foto ufficiale resterà sul personaggio.'))
      return;
    setIsActing(true);
    try {
      await rejectFamousPersonPhotoReport(selectedReport.id, reportAdminNotesDraft);
      closeReport();
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Errore rifiuto segnalazione abuso.');
    } finally {
      setIsActing(false);
    }
  };

  const handleBlockPhotoFromReport = async () => {
    if (!selectedReport?.personId || !canModerateReport) return;
    if (
      !window.confirm(
        'Bloccare la foto: verrà rimossa dal personaggio ufficiale e la segnalazione sarà chiusa come «Foto bloccata».',
      )
    )
      return;
    setIsActing(true);
    try {
      await blockFamousPersonPhotoReportAndClearOfficialPhoto(
        selectedReport.id,
        selectedReport.personId,
        reportAdminNotesDraft,
      );
      closeReport();
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Errore blocco fotografia.');
    } finally {
      setIsActing(false);
    }
  };

  const renderSuggestionFilters = (
    filter: SuggestionFilter,
    setFilter: (f: SuggestionFilter) => void,
  ) => (
    <div className="flex flex-wrap gap-2">
      {(['pending', 'in_review', 'accepted', 'rejected', 'all'] as const).map((f) => (
        <button
          key={f}
          type="button"
          onClick={() => setFilter(f)}
          className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border min-h-[36px] ${filter === f ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 text-slate-400 hover:text-white'}`}
        >
          {f === 'all' ? 'Tutte' : FAMOUS_PERSON_MODERATION_STATUS_LABELS[f]}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in flex flex-col h-full">
      <AdminPageHeader
        icon={Users}
        title="Personaggi Famosi"
        subtitle="Categorie, suggerimenti personaggio/foto e segnalazioni abuso"
        accent="indigo"
        badge={
          totalPending > 0 ? <CountBadge count={totalPending} variant="rose" pulse /> : undefined
        }
      />

      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-1">
        <button
          type="button"
          onClick={() => setTab('categories')}
          className={`${TAB_BUTTON_BASE} ${tab === 'categories' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Categorie Personaggi
        </button>
        <button
          type="button"
          onClick={() => setTab('person_suggestions')}
          className={`${TAB_BUTTON_BASE} ${tab === 'person_suggestions' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Suggerimento Personaggio
          {pendingPersons > 0 ? (
            <span className="ml-2 text-[10px] bg-rose-600 px-1.5 py-0.5 rounded-full">
              {pendingPersons}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => setTab('photo_suggestions')}
          className={`${TAB_BUTTON_BASE} ${tab === 'photo_suggestions' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Suggerimento Foto
          {pendingPhotos > 0 ? (
            <span className="ml-2 text-[10px] bg-rose-600 px-1.5 py-0.5 rounded-full">
              {pendingPhotos}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => setTab('reports')}
          className={`${TAB_BUTTON_BASE} ${tab === 'reports' ? 'bg-rose-700 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Segnalazione Abuso
          {pendingReports > 0 ? (
            <span className="ml-2 text-[10px] bg-rose-600 px-1.5 py-0.5 rounded-full">
              {pendingReports}
            </span>
          ) : null}
        </button>
      </div>

      {tab === 'categories' ? (
        <AdminFamousPeopleCategoriesManager embedded />
      ) : isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          Caricamento…
        </div>
      ) : tab === 'person_suggestions' ? (
        <>
          {renderSuggestionFilters(personFilter, setPersonFilter)}
          <div className="space-y-2">
            {filteredPersonSuggestions.length === 0 ? (
              <p className="text-slate-500 text-sm italic py-8 text-center">
                Nessun suggerimento personaggio.
              </p>
            ) : (
              filteredPersonSuggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => openPerson(s)}
                  className="w-full text-left p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-indigo-500/50 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${suggestionBadgeClass(s.status)}`}
                      >
                        {FAMOUS_PERSON_MODERATION_STATUS_LABELS[s.status]}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(s.createdAt).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                    <p className="text-white font-bold truncate">
                      {s.suggestedName} · {s.cityName}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {s.userName} · {s.notes}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 shrink-0" />
                </button>
              ))
            )}
          </div>
        </>
      ) : tab === 'photo_suggestions' ? (
        <>
          {renderSuggestionFilters(photoFilter, setPhotoFilter)}
          <div className="space-y-2">
            {filteredPhotoSuggestions.length === 0 ? (
              <p className="text-slate-500 text-sm italic py-8 text-center">
                Nessun suggerimento foto.
              </p>
            ) : (
              filteredPhotoSuggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => openPhoto(s)}
                  className="w-full text-left p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-indigo-500/50 transition-colors flex items-center gap-4"
                >
                  <img
                    src={s.imageUrl}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover border border-slate-700 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${suggestionBadgeClass(s.status)}`}
                      >
                        {FAMOUS_PERSON_MODERATION_STATUS_LABELS[s.status]}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(s.createdAt).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                    <p className="text-white font-bold truncate">
                      {s.personName} · {s.cityName}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {s.userName}
                      {s.notes ? ` · ${s.notes}` : ''}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 shrink-0" />
                </button>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {(['pending', 'in_review', 'photo_blocked', 'rejected', 'all'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setReportFilter(f)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border min-h-[36px] ${reportFilter === f ? 'bg-rose-700 border-rose-600 text-white' : 'border-slate-700 text-slate-400 hover:text-white'}`}
              >
                {f === 'all' ? 'Tutte' : FAMOUS_PERSON_PHOTO_REPORT_STATUS_LABELS[f]}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredReports.length === 0 ? (
              <p className="text-slate-500 text-sm italic py-8 text-center">
                Nessuna segnalazione abuso.
              </p>
            ) : (
              filteredReports.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => openReport(r)}
                  className="w-full text-left p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-rose-500/50 transition-colors flex items-center gap-4"
                >
                  {r.personImageUrl || r.currentOfficialImageUrl ? (
                    <img
                      src={r.currentOfficialImageUrl ?? r.personImageUrl}
                      alt="Foto segnalata"
                      className="w-14 h-14 rounded-lg object-cover border border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-slate-800 shrink-0 flex items-center justify-center">
                      <Flag className="w-5 h-5 text-slate-600" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${reportBadgeClass(r.status)}`}
                      >
                        {FAMOUS_PERSON_PHOTO_REPORT_STATUS_LABELS[r.status]}
                      </span>
                    </div>
                    <p className="text-white font-bold truncate">
                      {r.cityName} · {r.personName}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {r.reporterUserName ?? 'Utente'} ·{' '}
                      {FAMOUS_PERSON_PHOTO_REPORT_REASON_LABELS[r.reason]}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 shrink-0" />
                </button>
              ))
            )}
          </div>
        </>
      )}

      {selectedPerson
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
                onClick={closePerson}
              />
              <div
                ref={personDialogRef}
                tabIndex={-1}
                className={`${containerShell} max-w-lg ${MODAL_DIALOG_FOCUS}`}
                style={{ zIndex: Z_MODAL }}
                role="dialog"
                aria-modal="true"
                aria-labelledby={personDialogTitleId}
                aria-describedby={personDialogDescId}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <CloseButton
                  onClose={closePerson}
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
                      <UserPlus className={headerIconGlyph || 'w-6 h-6'} aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <h3 id={personDialogTitleId} className={`${modalTitleShell} mb-0.5`}>
                        Suggerimento personaggio
                      </h3>
                      <p id={personDialogDescId} className={`${modalSubtitleShell} truncate`}>
                        {selectedPerson.userName} · {selectedPerson.cityName}
                      </p>
                      <span
                        className={`inline-block mt-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded ${suggestionBadgeClass(selectedPerson.status)}`}
                      >
                        {FAMOUS_PERSON_MODERATION_STATUS_LABELS[selectedPerson.status]}
                      </span>
                    </div>
                  </div>
                </header>

                <div className={`${bodyShell} min-h-0 space-y-4`}>
                  <dl className="text-sm space-y-2">
                    <div>
                      <dt className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                        Nome suggerito
                      </dt>
                      <dd className="text-white font-bold">{selectedPerson.suggestedName}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                        Città
                      </dt>
                      <dd className="text-white">{selectedPerson.cityName}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                        Utente
                      </dt>
                      <dd className="text-white">{selectedPerson.userName}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                        Data
                      </dt>
                      <dd className="text-white">
                        {new Date(selectedPerson.createdAt).toLocaleString('it-IT')}
                      </dd>
                    </div>
                  </dl>

                  <section className="space-y-1" aria-labelledby="person-user-notes-heading">
                    <h4
                      id="person-user-notes-heading"
                      className="text-[10px] font-bold uppercase tracking-widest text-slate-500"
                    >
                      Note dell&apos;utente (obbligatorie)
                    </h4>
                    <p className="text-sm text-slate-300 bg-slate-950 rounded-lg p-3 border border-slate-800">
                      {selectedPerson.notes}
                    </p>
                  </section>

                  {(selectedPerson.adminNotes || canModeratePerson) && (
                    <section className="space-y-2" aria-labelledby="person-admin-notes-heading">
                      <h4
                        id="person-admin-notes-heading"
                        className="text-[10px] font-bold uppercase tracking-widest text-slate-500"
                      >
                        Note admin
                      </h4>
                      {canModeratePerson ? (
                        <>
                          <label htmlFor={personAdminNotesFieldId} className="sr-only">
                            Note admin di moderazione
                          </label>
                          <textarea
                            id={personAdminNotesFieldId}
                            value={personAdminNotesDraft}
                            onChange={(e) => setPersonAdminNotesDraft(e.target.value)}
                            rows={3}
                            disabled={isActing}
                            placeholder="Annotazione di moderazione (accettazione o rifiuto)…"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white resize-y min-h-[44px] focus:border-amber-500 focus:outline-none disabled:opacity-50"
                          />
                        </>
                      ) : selectedPerson.adminNotes ? (
                        <p className="text-sm text-slate-300 bg-slate-950 rounded-lg p-3 border border-slate-800">
                          {selectedPerson.adminNotes}
                        </p>
                      ) : null}
                    </section>
                  )}

                  {selectedPerson.status === 'accepted' && selectedPerson.acceptedPersonId ? (
                    <section className="space-y-2" aria-labelledby="person-editorial-heading">
                      <h4
                        id="person-editorial-heading"
                        className="text-[10px] font-bold uppercase tracking-widest text-slate-500"
                      >
                        Stato editoriale personaggio
                      </h4>
                      <p className="text-sm text-slate-300">
                        Attuale:{' '}
                        <span className="font-bold text-white uppercase">
                          {selectedPerson.acceptedPersonStatus ?? '—'}
                        </span>
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => void handleSetEditorialStatus('draft')}
                          disabled={isActing || selectedPerson.acceptedPersonStatus === 'draft'}
                          className="flex-1 py-3 min-h-[44px] rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                        >
                          Imposta DRAFT
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleSetEditorialStatus('published')}
                          disabled={isActing || selectedPerson.acceptedPersonStatus === 'published'}
                          className="flex-1 py-3 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                        >
                          Imposta PUBBLICATO
                        </button>
                      </div>
                    </section>
                  ) : null}
                </div>

                {canModeratePerson ? (
                  <footer className={footerShell}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap w-full">
                      {selectedPerson.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => void handleMarkPersonInReview()}
                          disabled={isActing}
                          className="flex-1 py-3 min-h-[44px] rounded-xl border border-indigo-700 text-indigo-300 hover:bg-indigo-950/40 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                        >
                          Metti in revisione
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void handleRejectPerson()}
                        disabled={isActing}
                        className="flex-1 py-3 min-h-[44px] rounded-xl border border-red-800 text-red-400 hover:bg-red-950/50 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                      >
                        Rifiuta
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleAcceptPerson()}
                        disabled={isActing}
                        className="flex-1 py-3 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest"
                      >
                        {isActing ? 'Elaborazione…' : 'Accetta (crea DRAFT)'}
                      </button>
                    </div>
                  </footer>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}

      {selectedPhoto
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
                onClick={closePhoto}
              />
              <div
                ref={photoDialogRef}
                tabIndex={-1}
                className={`${containerShell} max-w-lg ${MODAL_DIALOG_FOCUS}`}
                style={{ zIndex: Z_MODAL }}
                role="dialog"
                aria-modal="true"
                aria-labelledby={photoDialogTitleId}
                aria-describedby={photoDialogDescId}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <CloseButton
                  onClose={closePhoto}
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
                      <h3 id={photoDialogTitleId} className={`${modalTitleShell} mb-0.5`}>
                        Suggerimento foto
                      </h3>
                      <p id={photoDialogDescId} className={`${modalSubtitleShell} truncate`}>
                        {selectedPhoto.userName} · {selectedPhoto.cityName} ·{' '}
                        {selectedPhoto.personName}
                      </p>
                      <span
                        className={`inline-block mt-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded ${suggestionBadgeClass(selectedPhoto.status)}`}
                      >
                        {FAMOUS_PERSON_MODERATION_STATUS_LABELS[selectedPhoto.status]}
                      </span>
                    </div>
                  </div>
                </header>

                <div className={`${bodyShell} min-h-0 space-y-4`}>
                  <img
                    src={selectedPhoto.imageUrl}
                    alt={`Foto suggerita per ${selectedPhoto.personName}`}
                    className="w-full max-h-64 object-contain rounded-lg border border-slate-700 bg-black"
                  />

                  <dl className="text-sm space-y-2">
                    <div>
                      <dt className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                        Personaggio
                      </dt>
                      <dd className="text-white">{selectedPhoto.personName}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                        Città
                      </dt>
                      <dd className="text-white">{selectedPhoto.cityName}</dd>
                    </div>
                  </dl>

                  <section className="space-y-1" aria-labelledby="photo-user-notes-heading">
                    <h4
                      id="photo-user-notes-heading"
                      className="text-[10px] font-bold uppercase tracking-widest text-slate-500"
                    >
                      Note dell&apos;utente
                    </h4>
                    {selectedPhoto.notes ? (
                      <p className="text-sm text-slate-300 bg-slate-950 rounded-lg p-3 border border-slate-800">
                        {selectedPhoto.notes}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-500 italic">
                        Nessuna nota inviata dall&apos;utente.
                      </p>
                    )}
                  </section>

                  {(selectedPhoto.adminNotes || canModeratePhoto) && (
                    <section className="space-y-2" aria-labelledby="photo-admin-notes-heading">
                      <h4
                        id="photo-admin-notes-heading"
                        className="text-[10px] font-bold uppercase tracking-widest text-slate-500"
                      >
                        Note admin
                      </h4>
                      {canModeratePhoto ? (
                        <>
                          <label htmlFor={photoAdminNotesFieldId} className="sr-only">
                            Note admin di moderazione
                          </label>
                          <textarea
                            id={photoAdminNotesFieldId}
                            value={photoAdminNotesDraft}
                            onChange={(e) => setPhotoAdminNotesDraft(e.target.value)}
                            rows={3}
                            disabled={isActing}
                            placeholder="Annotazione di moderazione (accettazione o rifiuto)…"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white resize-y min-h-[44px] focus:border-amber-500 focus:outline-none disabled:opacity-50"
                          />
                        </>
                      ) : selectedPhoto.adminNotes ? (
                        <p className="text-sm text-slate-300 bg-slate-950 rounded-lg p-3 border border-slate-800">
                          {selectedPhoto.adminNotes}
                        </p>
                      ) : null}
                    </section>
                  )}
                </div>

                {canModeratePhoto ? (
                  <footer className={footerShell}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap w-full">
                      {selectedPhoto.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => void handleMarkPhotoInReview()}
                          disabled={isActing}
                          className="flex-1 py-3 min-h-[44px] rounded-xl border border-indigo-700 text-indigo-300 hover:bg-indigo-950/40 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                        >
                          Metti in revisione
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void handleRejectPhoto()}
                        disabled={isActing}
                        className="flex-1 py-3 min-h-[44px] rounded-xl border border-red-800 text-red-400 hover:bg-red-950/50 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                      >
                        Rifiuta
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleAcceptPhoto()}
                        disabled={isActing}
                        className="flex-1 py-3 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest"
                      >
                        {isActing ? 'Elaborazione…' : 'Accetta foto'}
                      </button>
                    </div>
                  </footer>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}

      {selectedReport
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
                onClick={closeReport}
              />
              <div
                ref={reportDialogRef}
                tabIndex={-1}
                className={`${containerShell} max-w-lg ${MODAL_DIALOG_FOCUS}`}
                style={{ zIndex: Z_MODAL }}
                role="dialog"
                aria-modal="true"
                aria-labelledby={reportDialogTitleId}
                aria-describedby={reportDialogDescId}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <CloseButton
                  onClose={closeReport}
                  variant="primary"
                  size="md"
                  position="static"
                  withEscape={false}
                  title="Chiudi dettaglio"
                  className={`absolute ${closeOffsetShell} z-local-overlay`}
                />

                <header className={headerShell}>
                  <div className="flex items-center gap-3 sm:gap-4 pr-10 min-w-0">
                    <div
                      className={`${headerIconBox} !bg-rose-500/10 !text-rose-400 !border-rose-500/20`}
                    >
                      <Flag className={headerIconGlyph || 'w-6 h-6'} aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <h3 id={reportDialogTitleId} className={`${modalTitleShell} mb-0.5`}>
                        Segnalazione abuso
                      </h3>
                      <p id={reportDialogDescId} className={`${modalSubtitleShell} truncate`}>
                        {selectedReport.cityName} · {selectedReport.personName}
                      </p>
                      <span
                        className={`inline-block mt-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded ${reportBadgeClass(selectedReport.status)}`}
                      >
                        {FAMOUS_PERSON_PHOTO_REPORT_STATUS_LABELS[selectedReport.status]}
                      </span>
                    </div>
                  </div>
                </header>

                <div className={`${bodyShell} min-h-0 space-y-4`}>
                  {(selectedReport.currentOfficialImageUrl ?? selectedReport.personImageUrl) ? (
                    <img
                      src={selectedReport.currentOfficialImageUrl ?? selectedReport.personImageUrl}
                      alt="Foto segnalata"
                      className="w-full max-h-48 object-contain rounded-lg border border-slate-700 bg-black"
                    />
                  ) : null}
                  <dl className="text-sm space-y-2">
                    <div>
                      <dt className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                        Città
                      </dt>
                      <dd className="text-white">{selectedReport.cityName}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                        Personaggio
                      </dt>
                      <dd className="text-white">{selectedReport.personName}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                        Segnalante
                      </dt>
                      <dd className="text-white">{selectedReport.reporterUserName ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                        Motivo
                      </dt>
                      <dd className="text-white">
                        {FAMOUS_PERSON_PHOTO_REPORT_REASON_LABELS[selectedReport.reason]}
                      </dd>
                    </div>
                    {selectedReport.notes ? (
                      <div>
                        <dt className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                          Note
                        </dt>
                        <dd className="text-slate-300">{selectedReport.notes}</dd>
                      </div>
                    ) : null}
                  </dl>

                  {(selectedReport.adminNotes || canModerateReport) && (
                    <section className="space-y-2" aria-labelledby="report-admin-notes-heading">
                      <h4
                        id="report-admin-notes-heading"
                        className="text-[10px] font-bold uppercase tracking-widest text-slate-500"
                      >
                        Note admin
                      </h4>
                      {canModerateReport ? (
                        <>
                          <label htmlFor={reportAdminNotesFieldId} className="sr-only">
                            Note admin (es. motivo del rifiuto o del blocco foto)
                          </label>
                          <textarea
                            id={reportAdminNotesFieldId}
                            value={reportAdminNotesDraft}
                            onChange={(e) => setReportAdminNotesDraft(e.target.value)}
                            rows={3}
                            disabled={isActing}
                            placeholder="Es. motivo del rifiuto o annotazioni sul blocco foto…"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white resize-y min-h-[44px] focus:border-amber-500 focus:outline-none disabled:opacity-50"
                          />
                        </>
                      ) : selectedReport.adminNotes ? (
                        <p className="text-sm text-slate-300 bg-slate-950 rounded-lg p-3 border border-slate-800">
                          {selectedReport.adminNotes}
                        </p>
                      ) : null}
                    </section>
                  )}
                </div>

                {canModerateReport ? (
                  <footer className={footerShell}>
                    <div className="flex flex-col gap-2 w-full">
                      {selectedReport.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => void handleMarkReportInReview()}
                          disabled={isActing}
                          className="w-full py-3 min-h-[44px] rounded-xl border border-indigo-700 text-indigo-300 hover:bg-indigo-950/40 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                        >
                          Metti in revisione
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void handleBlockPhotoFromReport()}
                        disabled={isActing || !selectedReport.personId}
                        className="w-full py-3 min-h-[44px] rounded-xl bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase tracking-widest"
                      >
                        Blocca foto
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRejectReport()}
                        disabled={isActing}
                        className="w-full py-3 min-h-[44px] rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                      >
                        Rifiuta segnalazione
                      </button>
                    </div>
                  </footer>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
};
