import { Info, Loader2, Search, Sparkles, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { HardDeleteMediaPhotoModal } from '@/components/admin/media/HardDeleteMediaPhotoModal';
import { SuspendMediaAssetModal } from '@/components/admin/media/SuspendMediaAssetModal';
import { WikimediaSourceLink } from '@/components/admin/media/WikimediaSourceLink';
import { PoiWikimediaProposalsModal } from '@/components/admin/wikimedia/PoiWikimediaProposalsModal';
import { WikimediaChecksInfoButton } from '@/components/admin/wikimedia/WikimediaChecksInfoButton';
import { WikimediaProposalCheckList } from '@/components/admin/wikimedia/WikimediaProposalCheckList';
import { WikimediaStorageDecisionModal } from '@/components/admin/wikimedia/WikimediaStorageDecisionModal';
import { WikimediaValidationModal } from '@/components/admin/wikimedia/WikimediaValidationModal';
import {
  buildWikimediaProposalChecks,
  wikimediaImportAvailability,
} from '@/components/admin/wikimedia/wikimediaProposalCheckPresentation';
import { AnchoredPopover } from '@/components/common/AnchoredPopover';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import {
  assignmentStatusLabel,
  IMAGE_ASSET_STATUS_LABELS,
  IMAGE_VERIFICATION_STEP_OUTCOME_LABELS,
} from '@/constants/governance';
import { useWikimediaEntityImport } from '../../../hooks/admin/useWikimediaEntityImport';
import { invalidateCityCache } from '../../../services/city/cityCache';
import {
  isPoiAdminBlockTarget,
  listPoiAssignedPhotos,
  type PoiAssignedPhoto,
  poiPhotoSection,
} from '../../../services/poi/poiAssignedMediaService';
import {
  loadPoiWikimediaAssetSummary,
  type PoiWikimediaAssetSummary,
} from '../../../services/poi/poiWikimediaAssetSummaryService';
import { updatePoiWikimediaPublicEnabled } from '../../../services/poi/poiWikimediaSettingsService';
import { buildCommonsFileDescriptionPageUrl } from '../../../services/wikimedia/commonsDownloadPipeline';
import type { PoiFormData } from '../../../types/write/poiForm';
import { samePublicStorageObject } from '../../../utils/storagePathFromPublicUrl';
import { AdminImageInput, CategoryPlaceholderStatus } from '../AdminImageInput';
import { usePoiModalSurface } from './usePoiModalSurface';

const ADMIN_BLOCK_TOOLTIP =
  'Blocca tutte le foto del POI, a livello globale in tutto il sito, ma mantiene attivo il placeholder degli elementi bloccati.';

function AdminBlockHelp() {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        title={ADMIN_BLOCK_TOOLTIP}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        aria-label={ADMIN_BLOCK_TOOLTIP}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        <Info className="h-4 w-4" aria-hidden />
      </button>
      <AnchoredPopover
        isOpen={open}
        onClose={() => setOpen(false)}
        anchorRef={anchorRef}
        align="left"
        role="tooltip"
        aria-label="Blocco foto Admin"
        className="w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-slate-600 bg-slate-950 px-3 py-2.5 text-sm leading-relaxed text-slate-200 shadow-xl"
      >
        <p id={panelId}>{ADMIN_BLOCK_TOOLTIP}</p>
      </AnchoredPopover>
    </>
  );
}

function PoiSourcePhotos({
  photos,
  empty,
  canDelete,
  onDelete,
  sectionLabel,
  listStatus,
}: {
  photos: PoiAssignedPhoto[];
  empty: string;
  canDelete: boolean;
  onDelete: (photo: PoiAssignedPhoto) => void;
  sectionLabel: string;
  listStatus: 'loading' | 'error' | 'ready';
}) {
  if (listStatus === 'loading') {
    return <p className="text-sm text-slate-400">Lettura foto...</p>;
  }
  if (listStatus === 'error') {
    return null;
  }
  if (photos.length === 0) {
    return <p className="text-sm text-slate-400">{empty}</p>;
  }
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {photos.map((photo, index) => (
        <li
          key={photo.assignmentId}
          className="relative overflow-hidden rounded-xl border border-white/10 bg-black/20"
        >
          {canDelete ? (
            <button
              type="button"
              onClick={() => onDelete(photo)}
              aria-label={`Cancella foto ${sectionLabel}, ${assignmentStatusLabel(photo.assignmentStatus)}, ${index + 1} di ${photos.length}`}
              title={`Cancella foto ${sectionLabel}`}
              className="absolute right-2 top-2 z-10 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-rose-500/60 bg-black/70 text-rose-100 hover:bg-rose-900/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
          {photo.previewUrl ? (
            <ImageWithFallback
              src={photo.previewUrl}
              alt=""
              className="aspect-video w-full object-cover"
            />
          ) : (
            <p className="px-3 py-6 text-center text-xs text-slate-500">Anteprima assente</p>
          )}
          <div className="space-y-2 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-300">
              {assignmentStatusLabel(photo.assignmentStatus)}
            </p>
            {photo.adminBlocked ? (
              <p className="text-sm text-amber-200" role="status">
                Foto bloccata globalmente dall'Admin. Il blocco è sul file e vale in tutto il sito.
                Questo POI non è sospeso e l'utilizzo non è stato cambiato.
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

interface PoiMediaTabProps {
  formData: PoiFormData;
  cityName?: string;
  canHardDeletePhotos?: boolean;
  updateField: <K extends keyof PoiFormData>(field: K, value: PoiFormData[K]) => void;
  releaseAdminImageUrl: (imageUrl: string) => void;
  setIsImageValid: (isValid: boolean) => void;
}

export const PoiMediaTab = ({
  formData,
  cityName,
  canHardDeletePhotos = false,
  updateField,
  releaseAdminImageUrl,
  setIsImageValid,
}: PoiMediaTabProps) => {
  const { cardSurface, sectionTitle, sectionDescription, cardLabel, bodyText } =
    usePoiModalSurface();
  const toggleId = useId();
  const helpId = useId();
  const blockToggleId = useId();
  const blockHelpId = useId();
  const partialBlockStatusId = useId();
  const blockInputRef = useRef<HTMLInputElement>(null);
  const [wikimediaPublicEnabled, setWikimediaPublicEnabled] = useState(
    formData.wikimediaPublicEnabled ?? false,
  );
  const [toggleSaving, setToggleSaving] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const cityId = formData.cityId?.trim() ?? '';
  const poiId = formData.id?.trim() ?? '';
  const poiIdentityRef = useRef(poiId);
  poiIdentityRef.current = poiId;
  const deleteSessionPoiIdRef = useRef<string | null>(null);
  const summaryLoadGenerationRef = useRef(0);

  const [detailQid, setDetailQid] = useState<string | null>(null);
  const [commonsSourceUrl, setCommonsSourceUrl] = useState<string | null>(null);
  const [summary, setSummary] = useState<PoiWikimediaAssetSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryReload, setSummaryReload] = useState(0);
  const [validationOpen, setValidationOpen] = useState(false);
  const [assignedPhotos, setAssignedPhotos] = useState<PoiAssignedPhoto[]>([]);
  const [assignedLoading, setAssignedLoading] = useState(false);
  const [assignedError, setAssignedError] = useState<string | null>(null);
  const [blockIntent, setBlockIntent] = useState<'poi-sources' | 'wikimedia' | null>(null);
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null);
  const wikimedia = useWikimediaEntityImport(poiId, cityId, cityName);

  useEffect(() => {
    setWikimediaPublicEnabled(formData.wikimediaPublicEnabled ?? false);
  }, [formData.wikimediaPublicEnabled]);

  useEffect(() => {
    setCommonsSourceUrl(null);
    setDetailQid(null);
    setDeleteAssetId(null);
    setBlockIntent(null);
    setValidationOpen(false);
    setToggleSaving(false);
    setToggleError(null);
    wikimedia.reset();
    if (!poiId) return;
  }, [poiId, wikimedia.reset]);

  useEffect(() => {
    const refreshGeneration = summaryReload;
    summaryLoadGenerationRef.current = refreshGeneration;
    if (!poiId || !cityId) {
      setSummary(null);
      setSummaryError(null);
      setSummaryLoading(false);
      setAssignedPhotos([]);
      setAssignedLoading(false);
      setAssignedError(null);
      return;
    }
    let cancelled = false;
    const responseIsCurrent = () =>
      !cancelled && summaryLoadGenerationRef.current === refreshGeneration;
    setSummary(null);
    setAssignedPhotos([]);
    setSummaryLoading(true);
    setAssignedLoading(true);
    setSummaryError(null);
    setAssignedError(null);
    void loadPoiWikimediaAssetSummary(poiId, cityId)
      .then((next) => {
        if (responseIsCurrent()) setSummary(next);
      })
      .catch((err: unknown) => {
        if (!responseIsCurrent()) return;
        setSummary(null);
        setSummaryError(
          err instanceof Error ? err.message : 'Lettura stato Wikimedia non riuscita.',
        );
      })
      .finally(() => {
        if (responseIsCurrent()) setSummaryLoading(false);
      });
    void listPoiAssignedPhotos(poiId, cityId)
      .then((photos) => {
        if (!responseIsCurrent()) return;
        setAssignedPhotos(photos);
        setAssignedError(null);
        setAssignedLoading(false);
      })
      .catch((err: unknown) => {
        if (!responseIsCurrent()) return;
        setAssignedPhotos([]);
        setAssignedLoading(false);
        setAssignedError(err instanceof Error ? err.message : 'Lettura foto del POI fallita.');
      });
    return () => {
      cancelled = true;
    };
  }, [poiId, cityId, summaryReload]);

  const photosOf = (section: 'sponsor' | 'admin' | 'wikimedia' | 'community' | 'ai') =>
    assignedPhotos.filter((photo) => poiPhotoSection(photo) === section);
  const photoListStatus = assignedLoading ? 'loading' : assignedError ? 'error' : 'ready';

  const blockableIds = [
    ...new Set([
      ...assignedPhotos.filter(isPoiAdminBlockTarget).map((photo) => photo.assetId),
      ...(summary?.linked?.assetId ? [summary.linked.assetId] : []),
    ]),
  ];
  const blockedIds = new Set(
    assignedPhotos.filter((photo) => photo.adminBlocked).map((photo) => photo.assetId),
  );
  if (summary?.linked?.adminBlocked && summary.linked.assetId) {
    blockedIds.add(summary.linked.assetId);
  }
  const blockReadIncomplete = assignedError !== null;
  const blockedCount = blockableIds.filter((id) => blockedIds.has(id)).length;
  const allSourcesBlocked =
    !assignedLoading &&
    !blockReadIncomplete &&
    blockableIds.length > 0 &&
    blockedCount === blockableIds.length;
  const partialSourcesBlocked =
    !assignedLoading && !blockReadIncomplete && blockedCount > 0 && !allSourcesBlocked;
  const blockControlDisabled = assignedLoading || blockReadIncomplete || blockableIds.length === 0;
  const wikimediaAssetIds = summary?.linked?.assetId ? [summary.linked.assetId] : [];

  useEffect(() => {
    const input = blockInputRef.current;
    if (!input) return;
    input.indeterminate = partialSourcesBlocked;
  }, [partialSourcesBlocked]);

  const persistToggle = useCallback(
    async (next: boolean) => {
      const targetPoiId = poiId;
      const targetCityId = cityId;
      if (!targetPoiId || !targetCityId) {
        setToggleError('Salva il POI prima di modificare il toggle Wikimedia.');
        return;
      }
      setToggleSaving(true);
      setToggleError(null);
      try {
        await updatePoiWikimediaPublicEnabled(targetPoiId, targetCityId, next);
        if (poiIdentityRef.current !== targetPoiId) return;
        setWikimediaPublicEnabled(next);
        updateField('wikimediaPublicEnabled', next);
      } catch (err) {
        if (poiIdentityRef.current !== targetPoiId) return;
        setToggleError(err instanceof Error ? err.message : 'Aggiornamento toggle fallito.');
      } finally {
        if (poiIdentityRef.current === targetPoiId) setToggleSaving(false);
      }
    },
    [cityId, poiId, updateField],
  );

  const openWikimediaApi = async () => {
    setDetailQid(null);
    await wikimedia.discover();
  };

  const dismissRecoveredProposal = (qid: string) => {
    wikimedia.dismissProposal(qid);
    setDetailQid((current) => (current === qid ? null : current));
  };

  const openPhotoDelete = (assetId: string) => {
    deleteSessionPoiIdRef.current = poiId;
    setDeleteAssetId(assetId);
  };

  const handleConfirmImport = async (
    proposal: import('../../../services/wikimedia/wikidataLookupService').WikidataP18Proposal,
  ) => {
    const targetPoiId = poiId;
    const outcome = await wikimedia.importProposal(proposal);
    if (outcome.ok !== true || poiIdentityRef.current !== targetPoiId) return;
    const title = proposal.commonsFileTitle.trim();
    setCommonsSourceUrl(title ? buildCommonsFileDescriptionPageUrl(title) : null);
    setDetailQid(null);
    setSummaryReload((current) => current + 1);
  };

  return (
    <div className="min-w-0 w-full space-y-6 pb-8">
      <section
        className="rounded-2xl border border-rose-900/60 bg-rose-950/30 p-4"
        aria-labelledby="poi-admin-photo-block"
      >
        <div className="flex items-start justify-between gap-3">
          <h3
            id="poi-admin-photo-block"
            className="min-w-0 text-sm font-bold uppercase text-rose-100"
          >
            Blocco foto Admin
          </h3>
          <div className="flex shrink-0 items-center gap-1">
            <div
              className={`relative inline-flex h-11 w-16 shrink-0 ${
                blockControlDisabled ? 'opacity-50' : ''
              }`}
            >
              <input
                ref={blockInputRef}
                id={blockToggleId}
                type="checkbox"
                checked={allSourcesBlocked}
                aria-label="Blocco foto Admin"
                aria-describedby={
                  partialSourcesBlocked ? `${blockHelpId} ${partialBlockStatusId}` : blockHelpId
                }
                disabled={blockControlDisabled}
                onChange={() => {
                  if (blockReadIncomplete || assignedLoading) return;
                  setBlockIntent('poi-sources');
                }}
                className="absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed"
              />
              <span
                aria-hidden
                className={`pointer-events-none absolute left-1/2 top-1/2 h-6 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors ${
                  allSourcesBlocked ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
              />
              <span
                aria-hidden
                className={`pointer-events-none absolute left-1/2 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow transition-transform ${
                  allSourcesBlocked ? 'translate-x-0' : '-translate-x-5'
                }`}
              />
            </div>
            <AdminBlockHelp />
          </div>
        </div>
        <p id={blockHelpId} className={`${sectionDescription} mt-1`}>
          Azione generale sulle foto di questo POI. Blocca i file Sponsor, Admin, Wikimedia,
          Community e AI in tutto il sito. Il placeholder resta attivo. Gli utilizzi non diventano
          sospesi.
        </p>
        {assignedLoading ? (
          <p className="mt-2 text-sm text-slate-400">Lettura foto del POI...</p>
        ) : null}
        {!assignedLoading && !blockReadIncomplete && blockableIds.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">
            Nessuna foto archiviata da bloccare per questo POI.
          </p>
        ) : null}
        {partialSourcesBlocked ? (
          <p id={partialBlockStatusId} className="mt-2 text-sm text-amber-200" role="status">
            Blocco parziale: alcune foto di questo POI sono bloccate, altre no.
          </p>
        ) : null}
        {assignedError ? (
          <p className="mt-2 text-sm text-red-300" role="alert">
            {assignedError} Il blocco generale non è disponibile finché l'elenco foto non è stato
            letto.
          </p>
        ) : null}
      </section>

      <section className={`${cardSurface} min-w-0`} aria-labelledby="poi-media-sponsor">
        <h3 id="poi-media-sponsor" className={sectionTitle}>
          Sponsor
        </h3>
        <p className={`${sectionDescription} mt-1`}>
          Foto sponsor collegate a questo POI tramite assignment.
        </p>
        <div className="mt-3">
          <PoiSourcePhotos
            photos={photosOf('sponsor')}
            empty="Nessuna foto sponsor collegata a questo POI."
            canDelete={canHardDeletePhotos}
            sectionLabel="Sponsor"
            listStatus={photoListStatus}
            onDelete={(photo) => openPhotoDelete(photo.assetId)}
          />
        </div>
      </section>

      <section className={`${cardSurface} min-w-0`} aria-labelledby="poi-media-admin">
        <h3 id="poi-media-admin" className={sectionTitle}>
          Immagini Admin
        </h3>
        <div className="mt-3">
          <AdminImageInput
            shellClassName="min-w-0 overflow-hidden"
            imageUrl={formData.imageUrl}
            imageCredit={formData.imageCredit || undefined}
            imageLicense={formData.imageLicense === '' ? undefined : formData.imageLicense}
            showInlinePlaceholder={false}
            onChange={(data) => {
              updateField('imageUrl', data.imageUrl);
              updateField('image_status', data.image_status);
              updateField('imageCredit', data.imageCredit);
              updateField('imageLicense', data.imageLicense);
            }}
            onValidityChange={setIsImageValid}
            category={formData.category}
          />
          <PoiSourcePhotos
            photos={photosOf('admin')}
            empty="Nessuna foto admin archiviata per questo POI."
            canDelete={canHardDeletePhotos}
            sectionLabel="Admin"
            listStatus={photoListStatus}
            onDelete={(photo) => openPhotoDelete(photo.assetId)}
          />
        </div>
      </section>

      <div className={`${cardSurface} min-w-0`}>
        <h3 className={sectionTitle}>Wikimedia</h3>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <label htmlFor={toggleId} className={cardLabel}>
              Wikimedia Pubblico
            </label>
            <p id={helpId} className={`${sectionDescription} mt-1`}>
              Toggle OFF → la foto Wikimedia non entra nella cascata D-22.
              <br />
              Toggle ON → un asset Wikimedia già presente e utilizzabile può entrare nella cascata
              D-22.
            </p>
          </div>
          <button
            id={toggleId}
            type="button"
            role="switch"
            aria-checked={wikimediaPublicEnabled}
            aria-busy={toggleSaving}
            aria-label="Wikimedia Pubblico"
            aria-describedby={helpId}
            disabled={toggleSaving}
            onClick={() => void persistToggle(!wikimediaPublicEnabled)}
            className="relative inline-flex h-11 w-16 shrink-0 items-center justify-center touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50"
          >
            <span
              className={`pointer-events-none absolute left-1/2 top-1/2 h-6 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors ${
                wikimediaPublicEnabled ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            />
            <span
              className={`pointer-events-none absolute left-1/2 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow transition-transform ${
                wikimediaPublicEnabled ? 'translate-x-0' : '-translate-x-5'
              }`}
            />
            {toggleSaving ? (
              <Loader2 className="relative z-local-raised h-3.5 w-3.5 animate-spin text-white" />
            ) : null}
          </button>
        </div>
        {toggleError ? (
          <p className="mt-2 text-sm text-red-300" role="alert">
            {toggleError}
          </p>
        ) : null}
        <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {summaryLoading ? <p className={bodyText}>Lettura stato Wikimedia...</p> : null}
            {summaryError ? (
              <p className="text-sm text-red-300" role="alert">
                {summaryError}
              </p>
            ) : null}
            {!summaryLoading && !summaryError && summary && !summary.linked ? (
              <p className={bodyText}>Nessun asset Wikimedia collegato a questo POI.</p>
            ) : null}
            {summary?.linked ? <p className={cardLabel}>Wikimedia corrente più recente</p> : null}
          </div>
          <button
            type="button"
            onClick={() => void openWikimediaApi()}
            disabled={wikimedia.loading}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 self-start rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white transition-all hover:bg-indigo-500 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 sm:self-center"
          >
            {wikimedia.loading ? (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            ) : (
              <Search className="h-3 w-3" aria-hidden />
            )}
            API WIKIMEDIA
          </button>
          <button
            type="button"
            disabled={!summary?.linked}
            onClick={() => setValidationOpen(true)}
            className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-slate-600 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50"
          >
            Valida Wikimedia
          </button>
          <button
            type="button"
            disabled={!summary?.linked}
            onClick={() => setBlockIntent('wikimedia')}
            className="inline-flex min-h-11 shrink-0 items-center rounded-lg bg-rose-700 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50"
          >
            {summary?.linked?.adminBlocked
              ? 'Rimuovi blocco foto Wikimedia mostrata'
              : 'Blocca foto Wikimedia mostrata'}
          </button>
        </div>

        <div className="space-y-4 pt-2">
          {summary?.linked ? (
            <div className="flex flex-col sm:flex-row gap-4 min-w-0">
              <div className="relative w-full shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black sm:w-36">
                {canHardDeletePhotos && summary.linked.assetId ? (
                  <button
                    type="button"
                    onClick={() => {
                      const assetId = summary.linked?.assetId;
                      if (assetId) openPhotoDelete(assetId);
                    }}
                    aria-label="Cancella foto Wikimedia collegata"
                    title="Cancella foto Wikimedia collegata"
                    className="absolute right-2 top-2 z-10 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-rose-500/60 bg-black/70 text-rose-100 hover:bg-rose-900/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                ) : null}
                {summary.linked.previewUrl ? (
                  <ImageWithFallback
                    src={summary.linked.previewUrl}
                    alt=""
                    className="aspect-square h-full w-full object-cover"
                  />
                ) : (
                  <p className="px-3 py-6 text-center text-xs text-slate-500">Anteprima assente</p>
                )}
              </div>
              <div className="min-w-0 space-y-1">
                {summary.linked.adminBlocked ? (
                  <p className="text-sm text-amber-200" role="status">
                    Foto bloccata globalmente dall'Admin. Il blocco è sul file e vale in tutto il
                    sito. Questo POI non è sospeso e l'utilizzo non è stato cambiato.
                  </p>
                ) : null}
                <p className={bodyText}>
                  Utilizzo: {assignmentStatusLabel(summary.linked.assignmentStatus)}
                </p>
                <p className={bodyText}>
                  Stato funzionale: {summary.linked.functionalStatus ?? '—'}
                  {summary.linked.assetStatus
                    ? ` · tecnico ${IMAGE_ASSET_STATUS_LABELS[summary.linked.assetStatus]}`
                    : ''}
                </p>
                <p className={bodyText}>
                  {summary.linked.publicUsable
                    ? 'File e utilizzo pubblicabili, con URL pubblico dello storage. Wikimedia Pubblico resta necessario per D-22; questo riepilogo non sceglie la foto della cascata.'
                    : 'Non pubblicabile come file e utilizzo.'}
                </p>
                {summary.linked.overallOutcome ? (
                  <p className={bodyText}>
                    Esito verifica:{' '}
                    {IMAGE_VERIFICATION_STEP_OUTCOME_LABELS[summary.linked.overallOutcome]}
                  </p>
                ) : null}
                {summary.linked.licenseCode ? (
                  <p className={bodyText}>Licenza: {summary.linked.licenseCode}</p>
                ) : null}
                {summary.linked.aiSummary ? (
                  <p className={bodyText}>{summary.linked.aiSummary}</p>
                ) : null}
                {summary.linked.reasons.length > 0 ? (
                  <ul className={`${bodyText} list-disc pl-4`}>
                    {summary.linked.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                ) : null}
                {!summary.linked.publicUsable &&
                summary.linked.reasons.length === 0 &&
                !summary.linked.aiSummary ? (
                  <p className={bodyText}>Nessun motivo di rifiuto è registrato su questo asset.</p>
                ) : null}
                {summary.otherCurrentCount > 0 ? (
                  <p className={bodyText}>
                    Altri utilizzi Wikimedia correnti: {summary.otherCurrentCount}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {wikimedia.discovery ? (
            <section className="space-y-3 border-t border-white/10 pt-4">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <h4 className={cardLabel}>Foto recuperate da Wikimedia</h4>
                  <WikimediaChecksInfoButton />
                </div>
                <p className={`${sectionDescription} mt-1`}>
                  Proposte della ricerca corrente. Restano in questo tab finché non le elimini o
                  cambi POI. Non sono un asset collegato.
                </p>
              </div>
              {wikimedia.discovery.proposals.length === 0 ? (
                <p className={bodyText}>Nessuna proposta nel risultato corrente.</p>
              ) : (
                wikimedia.discovery.proposals.map((row) => {
                  const availability = wikimediaImportAvailability(row);
                  const sessionImport = wikimedia.sessionImportMessages[row.candidate.qid];
                  const fileProposal = row.proposal;
                  return (
                    <article
                      key={row.candidate.qid}
                      className="grid min-w-0 grid-cols-1 gap-4 rounded-xl border border-white/10 p-4 md:grid-cols-[11rem_minmax(0,1fr)] md:items-start md:gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]"
                    >
                      <div className="flex w-full max-w-44 flex-col gap-3 justify-self-center md:max-w-none">
                        <div className="aspect-square w-full overflow-hidden rounded-xl border border-white/10 bg-black">
                          {fileProposal?.commonsFileUrl ? (
                            <ImageWithFallback
                              src={fileProposal.commonsFileUrl}
                              alt={row.candidate.label.trim() || ''}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-slate-600">
                              Anteprima assente
                            </div>
                          )}
                        </div>
                        <WikimediaSourceLink
                          sourceUrl={row.license?.sourcePageUrl}
                          label="Vedi foto su Wikimedia Commons"
                          className="max-w-full flex-wrap text-left"
                        />
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailQid(row.candidate.qid)}
                            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-600 px-4 text-xs font-bold uppercase tracking-wide text-slate-100 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                          >
                            Dettagli
                          </button>
                          <button
                            type="button"
                            disabled={
                              wikimedia.processing || !availability.enabled || !fileProposal
                            }
                            onClick={() => fileProposal && void handleConfirmImport(fileProposal)}
                            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-indigo-600 px-4 text-xs font-bold uppercase tracking-wide text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:bg-slate-800 disabled:text-slate-500"
                          >
                            {wikimedia.processing ? (
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            ) : (
                              'Importa'
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => dismissRecoveredProposal(row.candidate.qid)}
                            disabled={wikimedia.processing}
                            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-red-900/50 px-4 text-xs font-bold uppercase tracking-wide text-red-300 hover:bg-red-950/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:opacity-50"
                          >
                            Elimina
                          </button>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 space-y-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            Proposta recuperata
                          </p>
                          <p className="font-bold text-white">{row.candidate.label}</p>
                          <p className="font-mono text-xs text-indigo-300">{row.candidate.qid}</p>
                        </div>
                        <WikimediaProposalCheckList
                          checks={buildWikimediaProposalChecks(row)}
                          showRationale
                          readable
                        />
                        <p className={bodyText}>{availability.reason}</p>
                        {sessionImport ? (
                          <p className={bodyText}>
                            Importata in questa sessione: {sessionImport} Lo stato verificato o
                            utilizzabile, se esiste, è solo quello dell'asset collegato.
                          </p>
                        ) : null}
                      </div>
                    </article>
                  );
                })
              )}
            </section>
          ) : null}

          {wikimedia.error ? (
            <p className="text-sm text-red-300" role="alert">
              {wikimedia.error}
            </p>
          ) : null}

          {wikimedia.importMessage ? (
            <p className="text-sm text-slate-200" role="status">
              {wikimedia.importMessage}
            </p>
          ) : null}

          {summary?.linked?.sourceUrl || commonsSourceUrl ? (
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-amber-500" aria-hidden />
              <WikimediaSourceLink sourceUrl={summary?.linked?.sourceUrl || commonsSourceUrl} />
            </div>
          ) : null}
          {photosOf('wikimedia').some(
            (photo) => photo.assignmentId !== summary?.linked?.assignmentId,
          ) ? (
            <PoiSourcePhotos
              photos={photosOf('wikimedia').filter(
                (photo) => photo.assignmentId !== summary?.linked?.assignmentId,
              )}
              empty=""
              canDelete={canHardDeletePhotos}
              sectionLabel="Wikimedia"
              listStatus={photoListStatus}
              onDelete={(photo) => openPhotoDelete(photo.assetId)}
            />
          ) : null}
        </div>
      </div>

      <section className={`${cardSurface} min-w-0`} aria-labelledby="poi-media-community">
        <h3 id="poi-media-community" className={sectionTitle}>
          Community
        </h3>
        <p className={`${sectionDescription} mt-1`}>
          Foto community collegate a questo POI. La galleria della città non ha un collegamento
          diretto al POI: compare qui solo un assignment di origine community.
        </p>
        <div className="mt-3">
          <PoiSourcePhotos
            photos={photosOf('community')}
            empty="Nessuna foto community collegata a questo POI."
            canDelete={canHardDeletePhotos}
            sectionLabel="Community"
            listStatus={photoListStatus}
            onDelete={(photo) => openPhotoDelete(photo.assetId)}
          />
        </div>
      </section>

      <section className={`${cardSurface} min-w-0`} aria-labelledby="poi-media-ai">
        <h3 id="poi-media-ai" className={sectionTitle}>
          AI
        </h3>
        <p className={`${sectionDescription} mt-1`}>
          Foto AI già associate a questo POI. Restano nel flusso di verifica AI esistente. Wikimedia
          non entra in quel flusso.
        </p>
        <div className="mt-3">
          <PoiSourcePhotos
            photos={photosOf('ai')}
            empty="Nessuna foto AI collegata a questo POI."
            canDelete={canHardDeletePhotos}
            sectionLabel="AI"
            listStatus={photoListStatus}
            onDelete={(photo) => openPhotoDelete(photo.assetId)}
          />
        </div>
      </section>

      <section className={`${cardSurface} min-w-0`} aria-labelledby="poi-media-placeholder">
        <h3 id="poi-media-placeholder" className={sectionTitle}>
          Placeholder
        </h3>
        <p className={`${sectionDescription} mt-1`}>
          Fonte di riserva della categoria. Resta disponibile anche quando il blocco foto Admin
          esclude le altre foto del POI.
        </p>
        <div className="mt-3">
          <CategoryPlaceholderStatus category={formData.category} />
        </div>
      </section>

      <WikimediaStorageDecisionModal
        decision={wikimedia.storageDecision}
        isProcessing={wikimedia.processing}
        errorMessage={wikimedia.storageDecision ? wikimedia.error : null}
        onClose={wikimedia.dismissStorageDecision}
        onReuse={() => {
          const targetPoiId = poiId;
          void (async () => {
            const outcome = await wikimedia.resolveStorageDecision('reuse_existing');
            if (outcome?.ok !== true || poiIdentityRef.current !== targetPoiId) return;
            setSummaryReload((current) => current + 1);
          })();
        }}
        onImportNew={() => {
          const targetPoiId = poiId;
          void (async () => {
            const outcome = await wikimedia.resolveStorageDecision('import_new');
            if (outcome?.ok !== true || poiIdentityRef.current !== targetPoiId) return;
            setSummaryReload((current) => current + 1);
          })();
        }}
      />

      <WikimediaValidationModal
        isOpen={validationOpen}
        mediaAssetId={summary?.linked?.assetId ?? null}
        previewUrl={summary?.linked?.previewUrl ?? null}
        sourceUrl={summary?.linked?.sourceUrl ?? null}
        sourceRef={summary?.linked?.sourceRef ?? null}
        functionalStatus={summary?.linked?.functionalStatus ?? null}
        technicalStatus={
          summary?.linked?.assetStatus
            ? IMAGE_ASSET_STATUS_LABELS[summary.linked.assetStatus]
            : null
        }
        onClose={() => setValidationOpen(false)}
        onValidated={() => setSummaryReload((current) => current + 1)}
      />
      <HardDeleteMediaPhotoModal
        isOpen={deleteAssetId !== null}
        mediaAssetId={deleteAssetId}
        onClose={() => setDeleteAssetId(null)}
        onDatabaseDeleted={(scope) => {
          if (poiIdentityRef.current !== deleteSessionPoiIdRef.current) return;
          const assetId = deleteAssetId;
          const currentUrl = formData.imageUrl.trim();
          const removed = assignedPhotos.filter((photo) => {
            if (!assetId || photo.assetId !== assetId) return false;
            return scope.assignmentId === null || photo.assignmentId === scope.assignmentId;
          });
          const remaining = assignedPhotos.filter(
            (photo) => !removed.some((gone) => gone.assignmentId === photo.assignmentId),
          );
          const removedMatchesForm = removed.some((photo) =>
            samePublicStorageObject(photo.previewUrl, currentUrl),
          );
          const remainingMatchesForm = remaining.some((photo) =>
            samePublicStorageObject(photo.previewUrl, currentUrl),
          );
          if (currentUrl && removedMatchesForm && !remainingMatchesForm) {
            releaseAdminImageUrl(currentUrl);
          }
          if (assetId) {
            setAssignedPhotos(remaining);
          }
          setSummaryReload((current) => current + 1);
          if (cityId) invalidateCityCache(cityId);
          window.dispatchEvent(
            new CustomEvent('refresh-city-data', {
              detail: { cityId: cityId || undefined },
            }),
          );
        }}
      />
      <SuspendMediaAssetModal
        isOpen={blockIntent !== null}
        intent={blockIntent ?? 'poi-sources'}
        mediaAssetIds={blockIntent === 'wikimedia' ? wikimediaAssetIds : blockableIds}
        onClose={() => setBlockIntent(null)}
        onSuspended={() => setSummaryReload((current) => current + 1)}
      />
      <PoiWikimediaProposalsModal
        isOpen={detailQid !== null}
        subjectLabel={formData.name || 'POI'}
        proposal={
          wikimedia.discovery?.proposals.find((row) => row.candidate.qid === detailQid) ?? null
        }
        isProcessing={wikimedia.processing}
        onClose={() => setDetailQid(null)}
        onConfirm={(proposal) => void handleConfirmImport(proposal)}
        onDismiss={dismissRecoveredProposal}
      />
    </div>
  );
};
