import { Loader2, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useId, useState } from 'react';
import { WikimediaSourceLink } from '@/components/admin/media/WikimediaSourceLink';
import { PoiWikimediaProposalsModal } from '@/components/admin/wikimedia/PoiWikimediaProposalsModal';
import { useWikimediaEntityImport } from '../../../hooks/admin/useWikimediaEntityImport';
import { updatePoiWikimediaPublicEnabled } from '../../../services/poi/poiWikimediaSettingsService';
import { buildCommonsFileDescriptionPageUrl } from '../../../services/wikimedia/commonsDownloadPipeline';
import type { PoiFormData } from '../../../types/write/poiForm';
import { AdminImageInput } from '../AdminImageInput';

interface PoiMediaTabProps {
  formData: PoiFormData;
  cityName?: string;
  updateField: <K extends keyof PoiFormData>(field: K, value: PoiFormData[K]) => void;
  setIsImageValid: (isValid: boolean) => void;
}

export const PoiMediaTab = ({
  formData,
  cityName,
  updateField,
  setIsImageValid,
}: PoiMediaTabProps) => {
  const toggleId = useId();
  const [wikimediaPublicEnabled, setWikimediaPublicEnabled] = useState(
    formData.wikimediaPublicEnabled ?? false,
  );
  const [toggleSaving, setToggleSaving] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const cityId = formData.cityId?.trim() ?? '';
  const poiId = formData.id?.trim() ?? '';

  const [modalOpen, setModalOpen] = useState(false);
  const [commonsSourceUrl, setCommonsSourceUrl] = useState<string | null>(null);
  const wikimedia = useWikimediaEntityImport(poiId, cityId, cityName);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset stato Wikimedia al cambio identità POI (poiId)
  useEffect(() => {
    setWikimediaPublicEnabled(formData.wikimediaPublicEnabled ?? false);
    setCommonsSourceUrl(null);
    wikimedia.reset();
  }, [poiId, formData.wikimediaPublicEnabled]);

  const persistToggle = useCallback(
    async (next: boolean) => {
      if (!poiId || !cityId) {
        setToggleError('Salva il POI prima di modificare il toggle Wikimedia.');
        return;
      }
      setToggleSaving(true);
      setToggleError(null);
      try {
        await updatePoiWikimediaPublicEnabled(poiId, cityId, next);
        setWikimediaPublicEnabled(next);
        updateField('wikimediaPublicEnabled', next);
      } catch (err) {
        setToggleError(err instanceof Error ? err.message : 'Aggiornamento toggle fallito.');
      } finally {
        setToggleSaving(false);
      }
    },
    [cityId, poiId, updateField],
  );

  const openWikimediaApi = async () => {
    const result = await wikimedia.discover();
    if (!result) return;
    if (result.proposals.length > 0) {
      setModalOpen(true);
    }
  };

  const handleConfirmImport = async (
    proposal: import('../../../services/wikimedia/wikidataLookupService').WikidataP18Proposal,
  ) => {
    const outcome = await wikimedia.importProposal(proposal);
    if (!outcome.ok) return;
    const title = proposal.commonsFileTitle.trim();
    setCommonsSourceUrl(title ? buildCommonsFileDescriptionPageUrl(title) : null);
    setModalOpen(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      <AdminImageInput
        imageUrl={formData.imageUrl}
        imageCredit={formData.imageCredit || undefined}
        imageLicense={formData.imageLicense === '' ? undefined : formData.imageLicense}
        onChange={(data) => {
          updateField('imageUrl', data.imageUrl);
          updateField('image_status', data.image_status);
          updateField('imageCredit', data.imageCredit);
          updateField('imageLicense', data.imageLicense);
        }}
        onValidityChange={setIsImageValid}
        category={formData.category}
      />

      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Wikimedia (POI)</h3>
            <p className="text-xs text-muted-foreground mt-1">
              In sistema ≠ pubblico: con toggle OFF la foto Wikimedia non entra nella cascata D-22.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void openWikimediaApi()}
            disabled={wikimedia.loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {wikimedia.loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            API WIKIMEDIA
          </button>
        </div>

        {wikimedia.error ? (
          <p className="text-sm text-destructive" role="alert">
            {wikimedia.error}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-border pt-4">
          <label htmlFor={toggleId} className="text-sm font-medium">
            Wikimedia pubblico (D-22)
          </label>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground" aria-live="polite">
              {wikimediaPublicEnabled ? 'ON' : 'OFF'}
            </span>
            <button
              id={toggleId}
              type="button"
              role="switch"
              aria-checked={wikimediaPublicEnabled}
              aria-label="Abilita Wikimedia nel read pubblico D-22"
              disabled={toggleSaving}
              onClick={() => void persistToggle(!wikimediaPublicEnabled)}
              className={`relative inline-flex h-8 w-14 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                wikimediaPublicEnabled ? 'bg-primary' : 'bg-muted-foreground/40'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-background shadow transition ${
                  wikimediaPublicEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
        {toggleError ? (
          <p className="text-sm text-destructive" role="alert">
            {toggleError}
          </p>
        ) : null}

        {wikimedia.importMessage ? (
          <p className="text-sm text-foreground" role="status">
            {wikimedia.importMessage}
          </p>
        ) : null}

        {commonsSourceUrl ? (
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-muted-foreground" aria-hidden />
            <WikimediaSourceLink sourceUrl={commonsSourceUrl} />
          </div>
        ) : null}
      </div>

      <PoiWikimediaProposalsModal
        isOpen={modalOpen}
        subjectLabel={formData.name || 'POI'}
        proposals={wikimedia.discovery?.proposals ?? []}
        isProcessing={wikimedia.processing}
        errorMessage={wikimedia.error}
        onClose={() => {
          setModalOpen(false);
        }}
        onConfirm={(proposal) => void handleConfirmImport(proposal)}
      />
    </div>
  );
};
