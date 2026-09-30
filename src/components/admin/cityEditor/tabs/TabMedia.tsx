import {
  Crop,
  ImageIcon,
  LayoutTemplate,
  Loader2,
  Plus,
  RefreshCw,
  Square,
  Trash2,
} from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useId, useState } from 'react';
import { WikidataConfirmModal } from '@/components/admin/wikimedia/WikidataConfirmModal';
import { useCityEditor } from '@/context/CityEditorContext';
import { useAiRuntimeGate } from '@/hooks/useAiRuntimeGate';
import {
  importConfirmedCityHeroWikimedia,
  lookupCityHeroWikimediaProposal,
} from '@/services/city/cityRealImageDiscoveryService';
import { updateCityWikimediaHeroPublicEnabled } from '@/services/city/cityWikimediaSettingsService';
import type { WikidataP18Proposal } from '@/services/wikimedia/wikidataLookupService';
import type { CityDetails, MediaStatus } from '@/types';
import { generateCitySection } from '../../../../services/ai';
import {
  addCityPhotographicGalleryImageFromUrl,
  type CityPhotographicGalleryItem,
  listCityPhotographicGalleryItems,
  removeCityPhotographicGalleryByAssignmentId,
  replaceCityPhotographicGalleryByAssignmentId,
} from '../../../../services/city/cityPhotographicGalleryService';
import { appendGenerationLogs } from '../../../../services/city/parsers/content/parseLogs';
import { saveCityDetails } from '../../../../services/cityService';
import { mediaAssetUrl } from '../../../../utils/media';
import { CityCard } from '../../../city/CityCard';
import { DeleteConfirmationModal } from '../../../common/DeleteConfirmationModal';
import { AdminImageInput } from '../../AdminImageInput';
import { AdminPhotoInspector } from '../../AdminPhotoInspector';

export const TabMedia = () => {
  const { city, updateField, updateDetailField, reloadCurrentCity } = useCityEditor();
  const { aiBlocked, blockMessage, guardAiAction } = useAiRuntimeGate();
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  const [imageToEdit, setImageToEdit] = useState<{
    url: string;
    galleryAssignmentId: string | null;
  }>({
    url: '',
    galleryAssignmentId: null,
  });
  const [editingTarget, setEditingTarget] = useState<'hero' | 'card' | 'gallery'>('hero');

  const [generating, setGenerating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'hero' | 'card' | 'gallery';
    galleryAssignmentId?: string;
  } | null>(null);
  const [showConfirmRegen, setShowConfirmRegen] = useState(false);
  const [wmHeroEnabled, setWmHeroEnabled] = useState(city?.wikimediaHeroPublicEnabled === true);
  const [wmBusy, setWmBusy] = useState(false);
  const [wmMessage, setWmMessage] = useState<string | null>(null);
  const [wmModalOpen, setWmModalOpen] = useState(false);
  const [wmModalProposal, setWmModalProposal] = useState<WikidataP18Proposal | null>(null);
  const [wmModalProcessing, setWmModalProcessing] = useState(false);
  const [mediaFeedback, setMediaFeedback] = useState<{
    kind: 'error' | 'success' | 'info';
    text: string;
  } | null>(null);
  const [galleryItems, setGalleryItems] = useState<CityPhotographicGalleryItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryBusy, setGalleryBusy] = useState(false);
  const [addGalleryOpen, setAddGalleryOpen] = useState(false);
  const [addGalleryUrlDraft, setAddGalleryUrlDraft] = useState('');
  const wmToggleId = useId();
  const addGalleryUrlInputId = useId();

  const reloadPhotographicGallery = useCallback(async () => {
    if (!city?.id) {
      setGalleryItems([]);
      return;
    }
    setGalleryLoading(true);
    try {
      const items = await listCityPhotographicGalleryItems(city.id);
      setGalleryItems(items);
    } catch (err) {
      setMediaFeedback({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Caricamento galleria MF4 fallito.',
      });
    } finally {
      setGalleryLoading(false);
    }
  }, [city?.id]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: realign toggle when city identity changes
  useEffect(() => {
    setWmHeroEnabled(city?.wikimediaHeroPublicEnabled === true);
  }, [city?.id, city?.wikimediaHeroPublicEnabled]);

  useEffect(() => {
    void reloadPhotographicGallery();
  }, [reloadPhotographicGallery]);

  if (!city) return null;

  const handleDeleteRequest = (type: 'hero' | 'card' | 'gallery', galleryAssignmentId?: string) => {
    if (type === 'hero' && !city.details.heroImage) return;
    if (type === 'card' && !city.imageUrl) return;
    if (type === 'gallery' && !galleryAssignmentId?.trim()) return;
    setDeleteTarget({ type, galleryAssignmentId });
  };

  const confirmDelete = () => {
    if (!deleteTarget || galleryBusy) return;
    if (deleteTarget.type === 'hero') {
      clearHeroState();
      setDeleteTarget(null);
      return;
    }
    if (deleteTarget.type === 'card') {
      updateCardState('', 'missing');
      setDeleteTarget(null);
      return;
    }
    if (deleteTarget.type === 'gallery' && deleteTarget.galleryAssignmentId) {
      void (async () => {
        setGalleryBusy(true);
        try {
          await removeCityPhotographicGalleryByAssignmentId(
            city.id,
            deleteTarget.galleryAssignmentId ?? '',
          );
          await reloadPhotographicGallery();
          setMediaFeedback({ kind: 'success', text: 'Foto rimossa dalla galleria (MF4).' });
        } catch (err) {
          setMediaFeedback({
            kind: 'error',
            text: err instanceof Error ? err.message : 'Eliminazione galleria fallita.',
          });
        } finally {
          setGalleryBusy(false);
          setDeleteTarget(null);
        }
      })();
      return;
    }
    setDeleteTarget(null);
  };

  const handleRegeneratePage = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!guardAiAction()) return;

    if (!city.name) {
      setMediaFeedback({ kind: 'error', text: 'Inserisci il nome della città!' });
      return;
    }
    setShowConfirmRegen(true);
  };

  const executeRegeneratePage = async () => {
    if (!guardAiAction()) {
      setShowConfirmRegen(false);
      return;
    }
    setShowConfirmRegen(false);
    setGenerating(true);
    try {
      // Nessun generatore Hero automatico nel codebase: aggiorniamo solo i metadati reali
      // da generateCitySection('general'). Non inventiamo URL e non svuotiamo la gallery.
      const data = await generateCitySection(city.name, 'general');
      const newDetails = { ...city.details };

      if (data.officialWebsite) newDetails.officialWebsite = data.officialWebsite;

      const newLog = `[${new Date().toISOString()}] ✅ Fine: Aggiornamento metadati Media (Hero invariata — nessun generatore automatico)`;
      newDetails.generationLogs = appendGenerationLogs(newDetails.generationLogs, [newLog]);

      const updatedCity: CityDetails = {
        ...city,
        details: newDetails,
      };

      await saveCityDetails(updatedCity);
      await reloadCurrentCity();

      setMediaFeedback({
        kind: 'success',
        text: 'Metadati Media aggiornati. Hero e galleria invariate (nessun generatore Hero automatico).',
      });
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : 'Errore tecnico durante la rigenerazione.';
      setMediaFeedback({ kind: 'error', text: `Errore rigenerazione: ${msg}` });
    } finally {
      setGenerating(false);
    }
  };

  const clearHeroState = () => {
    updateField('heroImage', '');
    updateField('hero_status', 'missing');
    updateDetailField('heroImage', '');
    updateDetailField('hero_status', 'missing');
    updateField('imageCredit', '');
    updateField('imageLicense', undefined);
  };

  const updateHeroState = (
    url: string,
    credit: string,
    license: CityDetails['imageLicense'],
    status: MediaStatus,
  ) => {
    updateField('heroImage', url);
    updateField('hero_status', status);
    updateDetailField('heroImage', url);
    updateDetailField('hero_status', status);
    updateField('imageCredit', credit);
    updateField('imageLicense', license);
  };

  const updateCardState = (url: string, status: MediaStatus) => {
    // Sincronizzazione Card (Lista/Preview) - Indipendente dalla Hero
    updateField('imageUrl', url);
    updateField('image_status', status);
  };

  const handleHeroUpload = (data: {
    imageUrl: string;
    imageCredit: string;
    imageLicense: 'own' | 'cc' | 'public' | 'copyright';
    fileName?: string;
    image_status: MediaStatus;
  }) => {
    updateHeroState(data.imageUrl, data.imageCredit, data.imageLicense, data.image_status);
  };

  const handleCardUpload = (data: { imageUrl: string; image_status: MediaStatus }) => {
    updateCardState(data.imageUrl, data.image_status);
  };

  const handleInspectorSave = (data: { image: string }) => {
    if (editingTarget === 'hero') {
      updateHeroState(
        data.image,
        city.imageCredit ?? '',
        city.imageLicense,
        data.image ? 'real' : 'missing',
      );
    } else if (editingTarget === 'card') {
      updateCardState(data.image, data.image ? 'real' : 'missing');
    } else if (editingTarget === 'gallery' && imageToEdit.galleryAssignmentId && data.image) {
      void (async () => {
        setGalleryBusy(true);
        try {
          await replaceCityPhotographicGalleryByAssignmentId(
            city.id,
            imageToEdit.galleryAssignmentId ?? '',
            data.image,
          );
          await reloadPhotographicGallery();
          setMediaFeedback({ kind: 'success', text: 'Galleria aggiornata (MF4).' });
        } catch (err) {
          setMediaFeedback({
            kind: 'error',
            text: err instanceof Error ? err.message : 'Aggiornamento galleria fallito.',
          });
        } finally {
          setGalleryBusy(false);
        }
      })();
    }
    setIsInspectorOpen(false);
  };

  const openInspector = (
    url: string,
    target: 'hero' | 'card' | 'gallery',
    galleryAssignmentId: string | null = null,
  ) => {
    if (!url) return;
    setImageToEdit({ url, galleryAssignmentId });
    setEditingTarget(target);
    setIsInspectorOpen(true);
  };

  const openAddGalleryModal = () => {
    if (galleryBusy) return;
    setAddGalleryUrlDraft('');
    setAddGalleryOpen(true);
  };

  const confirmAddGallery = () => {
    const url = addGalleryUrlDraft.trim();
    if (!url || galleryBusy) return;
    if (url === city.details.heroImage) {
      setMediaFeedback({
        kind: 'info',
        text: 'Questa immagine è già la Copertina: non serve aggiungerla alla galleria.',
      });
      setAddGalleryOpen(false);
      return;
    }
    void (async () => {
      setGalleryBusy(true);
      try {
        await addCityPhotographicGalleryImageFromUrl(city.id, url);
        await reloadPhotographicGallery();
        setMediaFeedback({ kind: 'success', text: 'Immagine aggiunta alla galleria (MF4).' });
        setAddGalleryOpen(false);
        setAddGalleryUrlDraft('');
      } catch (err) {
        setMediaFeedback({
          kind: 'error',
          text: err instanceof Error ? err.message : 'Aggiunta galleria fallita.',
        });
      } finally {
        setGalleryBusy(false);
      }
    })();
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in relative">
      {mediaFeedback ? (
        <p
          className={`text-sm rounded-md px-3 py-2 ${
            mediaFeedback.kind === 'error'
              ? 'text-destructive bg-destructive/10'
              : mediaFeedback.kind === 'success'
                ? 'text-foreground bg-muted'
                : 'text-muted-foreground bg-muted/50'
          }`}
          role={mediaFeedback.kind === 'error' ? 'alert' : 'status'}
        >
          {mediaFeedback.text}
        </p>
      ) : null}
      <DeleteConfirmationModal
        isOpen={addGalleryOpen}
        onClose={() => {
          if (!galleryBusy) setAddGalleryOpen(false);
        }}
        onConfirm={confirmAddGallery}
        title="Aggiungi immagine alla galleria"
        message="URL pubblico dell'immagine (es. HTTPS). Validazione e persistenza MF4 nel servizio."
        confirmLabel="Aggiungi"
        variant="info"
        isDeleting={galleryBusy}
        confirmDisabled={!addGalleryUrlDraft.trim() || galleryBusy}
        loadingLabel="Caricamento…"
      >
        <label htmlFor={addGalleryUrlInputId} className="sr-only">
          URL immagine galleria
        </label>
        <input
          id={addGalleryUrlInputId}
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder="https://…"
          value={addGalleryUrlDraft}
          onChange={(e) => setAddGalleryUrlDraft(e.target.value)}
          disabled={galleryBusy}
          className="mt-3 w-full min-h-11 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
        />
      </DeleteConfirmationModal>
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => {
          if (!galleryBusy) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title={
          deleteTarget?.type === 'hero'
            ? 'Rimuovere Copertina?'
            : deleteTarget?.type === 'card'
              ? 'Rimuovere Card?'
              : 'Eliminare Foto?'
        }
        message={
          deleteTarget?.type === 'hero'
            ? "Rimuovi l'immagine principale della pagina."
            : deleteTarget?.type === 'card'
              ? "Rimuovi l'immagine per le liste e le card."
              : 'Elimina questa foto dalla galleria.'
        }
        isDeleting={deleteTarget?.type === 'gallery' && galleryBusy}
        confirmDisabled={deleteTarget?.type === 'gallery' && galleryBusy}
      />
      <DeleteConfirmationModal
        isOpen={showConfirmRegen}
        onClose={() => setShowConfirmRegen(false)}
        onConfirm={executeRegeneratePage}
        title="Aggiorna metadati Media"
        message="Verranno aggiornati i metadati disponibili via AI (es. sito ufficiale).\nHero e galleria NON verranno cancellate né sostituite con immagini inventate (non esiste un generatore Hero automatico)."
        confirmLabel="Aggiorna"
      />

      <div className="flex justify-stretch sm:justify-end border-b border-slate-800 pb-4">
        <button
          type="button"
          onClick={handleRegeneratePage}
          disabled={generating || aiBlocked}
          title={aiBlocked ? blockMessage : undefined}
          className="w-full sm:w-auto justify-center bg-rose-600 hover:bg-rose-500 text-white px-4 sm:px-6 py-3 min-h-11 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-xs tracking-widest border border-rose-500"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {aiBlocked ? 'AI DISABILITATA' : 'AGGIORNA METADATI'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-4 md:p-8 rounded-2xl border border-slate-800 shadow-xl flex flex-col h-full">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6 border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 min-w-0">
              <LayoutTemplate className="w-5 h-5 text-indigo-500 shrink-0" /> Copertina Hero
            </h3>
            <div className="flex flex-wrap gap-2 shrink-0">
              {city.details.heroImage && (
                <button
                  type="button"
                  onClick={() => handleDeleteRequest('hero')}
                  className="text-xs bg-red-900/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 px-3 py-2 min-h-11 rounded-lg flex items-center gap-2 font-bold uppercase transition-colors"
                  aria-label="Rimuovi Copertina Hero"
                  title="Rimuovi Copertina"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => openInspector(city.details.heroImage, 'hero')}
                disabled={!city.details.heroImage}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 min-h-11 rounded-lg flex items-center gap-2 font-bold uppercase shadow-lg"
                aria-label="Ritaglia Copertina Hero"
                title="Ritaglia Copertina"
              >
                <Crop className="w-3.5 h-3.5" /> Ritaglia
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-between gap-4">
            <div className="bg-black/40 rounded-xl overflow-hidden aspect-[21/9] border-2 border-dashed border-slate-700 relative group">
              {city.details.heroImage ? (
                <img
                  src={city.details.heroImage}
                  className="w-full h-full object-cover"
                  alt="Hero"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-xs font-bold uppercase">
                  Nessuna Immagine
                </div>
              )}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">
                Carica Master (Sorgente)
              </h4>
              <AdminImageInput
                imageUrl={city.details.heroImage}
                imageCredit={city.imageCredit}
                imageLicense={city.imageLicense}
                qualityMode="high"
                onChange={handleHeroUpload}
              />
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-4 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">
                  Wikimedia Hero (D-22)
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500" aria-live="polite">
                    {wmHeroEnabled ? 'ON' : 'OFF'}
                  </span>
                  <button
                    id={wmToggleId}
                    type="button"
                    role="switch"
                    aria-checked={wmHeroEnabled}
                    aria-label="Abilita Wikimedia nel read Hero pubblico"
                    disabled={wmBusy}
                    onClick={async () => {
                      setWmBusy(true);
                      setWmMessage(null);
                      try {
                        const next = !wmHeroEnabled;
                        await updateCityWikimediaHeroPublicEnabled(city.id, next);
                        setWmHeroEnabled(next);
                        updateField('wikimediaHeroPublicEnabled', next);
                      } catch (err) {
                        setWmMessage(err instanceof Error ? err.message : 'Toggle fallito.');
                      } finally {
                        setWmBusy(false);
                      }
                    }}
                    className={`relative inline-flex h-8 w-14 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
                      wmHeroEnabled ? 'bg-indigo-600' : 'bg-slate-600'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow transition ${
                        wmHeroEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
              <button
                type="button"
                disabled={wmBusy}
                onClick={async () => {
                  setWmBusy(true);
                  setWmMessage(null);
                  try {
                    const result = await lookupCityHeroWikimediaProposal(city.id, city.name);
                    if (result.status === 'lookup' && result.lookup.status === 'proposal') {
                      setWmModalProposal(result.lookup.proposal);
                      setWmModalOpen(true);
                      return;
                    }
                    if (result.status === 'failed') {
                      setWmMessage(result.message);
                    } else if (result.status === 'lookup') {
                      setWmMessage(result.message);
                    } else if (result.status === 'skipped') {
                      setWmMessage(result.reason);
                    }
                  } catch (err) {
                    setWmMessage(
                      err instanceof Error ? err.message : 'Lookup Wikimedia Hero fallito.',
                    );
                  } finally {
                    setWmBusy(false);
                  }
                }}
                className="w-full min-h-11 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wide disabled:opacity-50"
              >
                API WIKIMEDIA (Hero)
              </button>
              {wmMessage ? (
                <p className="text-xs text-slate-400" role="status">
                  {wmMessage}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-4 md:p-8 rounded-2xl border border-slate-800 shadow-xl flex flex-col h-full">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6 border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 min-w-0">
              <Square className="w-5 h-5 text-emerald-500 shrink-0" /> Card Anteprima
            </h3>
            <div className="flex flex-wrap gap-2 shrink-0">
              {city.imageUrl && (
                <button
                  type="button"
                  onClick={() => handleDeleteRequest('card')}
                  className="text-xs bg-red-900/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 px-3 py-2 min-h-11 rounded-lg flex items-center gap-2 font-bold uppercase transition-colors"
                  aria-label="Rimuovi Card Anteprima"
                  title="Rimuovi Card"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => openInspector(city.imageUrl, 'card')}
                disabled={!city.imageUrl}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 min-h-11 rounded-lg flex items-center gap-2 font-bold uppercase shadow-lg"
                aria-label="Ritaglia Card Anteprima"
                title="Ritaglia Card"
              >
                <Crop className="w-3.5 h-3.5" /> Ritaglia
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row gap-6 items-start mb-6">
              <div className="shrink-0">
                <CityCard
                  city={city}
                  onClick={() => {}}
                  userLocation={null}
                  className="w-[160px] h-[240px] pointer-events-none shadow-2xl"
                />
              </div>

              <div className="flex-1 py-2">
                <div className="text-xs text-slate-400 leading-relaxed italic border-l-2 border-slate-700 pl-3">
                  <p className="mb-2 text-white font-bold not-italic">Info Miniatura:</p>
                  <p className="mb-2">Questa immagine appare nelle liste e in Home Page.</p>
                  <p>Puoi caricarne una specifica qui sotto oppure ritagliare quella della Hero.</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">
                Carica Specifica (Opzionale)
              </h4>
              <AdminImageInput
                imageUrl={city.imageUrl}
                onChange={handleCardUpload}
                qualityMode="standard"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-4 md:p-8 rounded-2xl border border-slate-800 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-6 border-b border-slate-800 pb-2 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-indigo-500" /> Galleria Fotografica
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {galleryLoading ? (
            <p className="col-span-full text-sm text-muted-foreground">Caricamento galleria…</p>
          ) : null}
          {galleryItems.map((asset, i) => {
            const galleryAssetUrl = mediaAssetUrl(asset);
            return (
              <div
                key={asset.assignmentId}
                className="aspect-square relative group rounded-xl overflow-hidden border border-slate-700 shadow-md"
              >
                <img
                  src={galleryAssetUrl}
                  className="w-full h-full object-cover"
                  alt={`Foto galleria ${i + 1}`}
                />

                <div className="absolute inset-0 bg-black/60 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => openInspector(galleryAssetUrl, 'gallery', asset.assignmentId)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 min-h-11 min-w-11 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
                    title="Modifica / Ritaglia"
                    aria-label={`Ritaglia foto galleria ${i + 1}`}
                  >
                    <Crop className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteRequest('gallery', asset.assignmentId)}
                    className="bg-red-600 hover:bg-red-500 text-white p-2.5 min-h-11 min-w-11 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
                    title="Elimina Foto"
                    aria-label={`Elimina foto galleria ${i + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          <button
            type="button"
            className="aspect-square rounded-xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 hover:text-white cursor-pointer transition-colors bg-slate-950/50 hover:bg-slate-900 hover:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={openAddGalleryModal}
            disabled={galleryBusy}
            aria-label="Aggiungi immagine alla galleria fotografica"
          >
            <Plus className="w-8 h-8 mb-1" />
            <span className="text-[10px] font-bold uppercase">Aggiungi</span>
          </button>
        </div>
      </div>

      {wmModalOpen && wmModalProposal ? (
        <WikidataConfirmModal
          isOpen={wmModalOpen}
          subjectLabel={city.name}
          proposal={wmModalProposal}
          isProcessing={wmModalProcessing}
          onClose={() => {
            setWmModalOpen(false);
            setWmModalProposal(null);
          }}
          onSkip={() => {
            setWmModalOpen(false);
            setWmModalProposal(null);
          }}
          onConfirm={async (proposal) => {
            setWmModalProcessing(true);
            setWmMessage(null);
            try {
              const imported = await importConfirmedCityHeroWikimedia(
                city.id,
                city.name,
                proposal,
                {
                  activation: 'manual_api',
                  adminConfirmed: true,
                },
              );
              if (imported.status === 'imported') {
                setWmMessage(imported.message);
                setWmModalOpen(false);
                setWmModalProposal(null);
                await reloadCurrentCity();
              } else if (imported.status === 'failed') {
                setWmMessage(imported.message);
              } else if (imported.status === 'skipped') {
                setWmMessage(imported.reason);
              } else if (imported.status === 'lookup') {
                setWmMessage(imported.message);
              }
            } catch (err) {
              setWmMessage(err instanceof Error ? err.message : 'Import Wikimedia Hero fallito.');
            } finally {
              setWmModalProcessing(false);
            }
          }}
        />
      ) : null}

      {isInspectorOpen && (
        <AdminPhotoInspector
          isOpen={true}
          imageUrl={imageToEdit.url}
          mode={editingTarget}
          viewportGuide={
            editingTarget === 'gallery'
              ? { primaryAspect: 1, primaryLabel: 'Galleria 1:1 (export)' }
              : undefined
          }
          initialData={{
            locationName: city.name,
            user: 'Admin',
            description:
              editingTarget === 'gallery'
                ? 'Ottimizzazione immagine Galleria'
                : editingTarget === 'card'
                  ? 'Ottimizzazione Card Verticale'
                  : 'Ottimizzazione Copertina',
          }}
          onClose={() => setIsInspectorOpen(false)}
          onSave={handleInspectorSave}
        />
      )}
    </div>
  );
};
