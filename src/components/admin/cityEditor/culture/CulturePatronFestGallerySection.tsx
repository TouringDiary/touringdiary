import { ArrowDown, ArrowUp, Crop, ImagePlus, Loader2, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { useCityPatronGallery } from '@/hooks/patron/useCityPatronGallery';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { deletePublicMediaByStoragePath, uploadPublicMediaDetailed } from '@/services/mediaService';
import {
  addCityPatronGalleryPhoto,
  deleteCityPatronGalleryPhoto,
  reorderCityPatronGallery,
  updateCityPatronGalleryPhotoUrl,
} from '@/services/patron/cityPatronGalleryService';
import type { CityDetails } from '@/types/index';
import type { CityPatronGalleryPhoto } from '@/types/models/patronGallery';
import { compressImageHighQuality, dataURLtoFile } from '@/utils/common';
import { AdminPhotoInspector } from '../../AdminPhotoInspector';

type CulturePatronFestGallerySectionProps = {
  city: CityDetails;
};

export const CulturePatronFestGallerySection: React.FC<CulturePatronFestGallerySectionProps> = ({
  city,
}) => {
  const captionFieldId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [captionDraft, setCaptionDraft] = useState('');
  const [festEdit, setFestEdit] = useState<CityPatronGalleryPhoto | null>(null);
  const [photoPendingDelete, setPhotoPendingDelete] = useState<CityPatronGalleryPhoto | null>(null);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const { photos, isLoading, reload } = useCityPatronGallery(city.id);

  useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(pendingFile);
    setPreviewUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [pendingFile]);

  const clearPendingAdd = useCallback(() => {
    if (isUploading) return;
    setPendingFile(null);
    setCaptionDraft('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [isUploading]);

  useGlobalModalEscape(pendingFile !== null && !isUploading, clearPendingAdd);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCaptionDraft('');
    setPendingFile(file);
  };

  const handleConfirmAddPhoto = async () => {
    if (!pendingFile) return;
    setIsUploading(true);
    try {
      const compressedBase64 = await compressImageHighQuality(pendingFile);
      const compressedFile = dataURLtoFile(compressedBase64, pendingFile.name);
      const added = await addCityPatronGalleryPhoto(city.id, compressedFile, captionDraft);
      if (!added) {
        alert('Errore upload. Verifica la connessione.');
        return;
      }
      setPendingFile(null);
      setCaptionDraft('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await reload();
    } catch {
      alert('Errore durante il caricamento o il salvataggio della foto.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!photoPendingDelete || isDeletingPhoto) return;
    setIsDeletingPhoto(true);
    try {
      await deleteCityPatronGalleryPhoto(photoPendingDelete.id);
      setPhotoPendingDelete(null);
      await reload();
    } catch {
      alert("Errore durante l'eliminazione.");
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  const handleMove = useCallback(
    async (index: number, direction: -1 | 1) => {
      const target = index + direction;
      if (target < 0 || target >= photos.length) return;
      const next = [...photos];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      try {
        await reorderCityPatronGallery(
          city.id,
          next.map((p) => p.id),
        );
        await reload();
      } catch {
        alert('Errore durante il riordino.');
      }
    },
    [city.id, photos, reload],
  );

  const handleFestInspectorSave = async (data: { image: string }) => {
    if (!festEdit) return;
    const previousStoragePath = festEdit.storagePath;
    try {
      const file = dataURLtoFile(data.image, `patron_gallery_${festEdit.id}.jpg`);
      const folder = `city_patron_gallery/${city.id}`;
      const uploaded = await uploadPublicMediaDetailed(file, folder);
      if (!uploaded) {
        alert('Errore upload immagine modificata.');
        return;
      }
      try {
        await updateCityPatronGalleryPhotoUrl(
          festEdit.id,
          uploaded.publicUrl,
          uploaded.storagePath,
        );
      } catch {
        await deletePublicMediaByStoragePath(uploaded.storagePath);
        alert('Errore salvataggio immagine.');
        return;
      }
      // DB SoT → Storage: dopo UPDATE riuscito, cleanup del path precedente non può essere silenzioso.
      if (previousStoragePath && previousStoragePath !== uploaded.storagePath) {
        const removed = await deletePublicMediaByStoragePath(previousStoragePath);
        if (!removed) {
          throw new Error(
            `Immagine aggiornata nel database, ma rimozione Storage del file precedente non riuscita (${previousStoragePath}).`,
          );
        }
      }
      setFestEdit(null);
      await reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Errore salvataggio immagine.');
    }
  };

  return (
    <section className="border-t border-slate-800 pt-8 mt-8">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
        Foto Patrono e Festa Patronale
      </h4>
      <p className="text-xs text-slate-400 leading-relaxed mb-6 border-l-2 border-slate-700 pl-3 max-w-3xl">
        Gallery dedicata al Patrono e alla festa patronale, salvata in{' '}
        <span className="text-slate-300">city_patron_gallery</span>. Non compare nella Galleria
        Fotografica generale della città.
      </p>

      {isLoading ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm py-6">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          Caricamento gallery…
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="aspect-square relative group rounded-xl overflow-hidden border border-slate-700 shadow-md"
            >
              <img
                src={photo.imageUrl}
                className="w-full h-full object-cover"
                alt={photo.caption ?? `Foto Patrono ${index + 1}`}
              />

              <div className="absolute inset-0 bg-black/60 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleMove(index, -1)}
                    disabled={index === 0}
                    className="bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white p-2 min-h-11 min-w-11 inline-flex items-center justify-center rounded-full"
                    aria-label={`Sposta foto ${index + 1} indietro`}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, 1)}
                    disabled={index === photos.length - 1}
                    className="bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white p-2 min-h-11 min-w-11 inline-flex items-center justify-center rounded-full"
                    aria-label={`Sposta foto ${index + 1} avanti`}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFestEdit(photo)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 min-h-11 min-w-11 inline-flex items-center justify-center rounded-full shadow-lg"
                    title="Modifica / Ritaglia"
                    aria-label={`Modifica foto ${index + 1}`}
                  >
                    <Crop className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoPendingDelete(photo)}
                    disabled={isUploading || isDeletingPhoto}
                    className="bg-red-600 hover:bg-red-500 text-white p-2 min-h-11 min-w-11 inline-flex items-center justify-center rounded-full shadow-lg disabled:opacity-50"
                    title="Elimina Foto"
                    aria-label={`Elimina foto ${index + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            disabled={isUploading || pendingFile !== null}
            className="aspect-square rounded-xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 hover:text-white cursor-pointer transition-colors bg-slate-950/50 hover:bg-slate-900 hover:border-indigo-500 disabled:opacity-50"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Aggiungi foto Patrono o Festa Patronale"
          >
            {isUploading ? (
              <Loader2 className="w-8 h-8 mb-1 animate-spin" />
            ) : (
              <Plus className="w-8 h-8 mb-1" />
            )}
            <span className="text-[10px] font-bold uppercase">Aggiungi</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelected}
          />
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={photoPendingDelete !== null}
        onClose={() => {
          if (!isDeletingPhoto) setPhotoPendingDelete(null);
        }}
        onConfirm={() => void handleDeletePhoto()}
        variant="danger"
        title="Eliminare foto gallery?"
        message={
          photoPendingDelete
            ? `Stai per rimuovere definitivamente questa foto dalla gallery ufficiale Patrono/Festa${
                photoPendingDelete.caption ? ` («${photoPendingDelete.caption}»).` : '.'
              } Verranno eliminati il riferimento in database e il file Storage.`
            : 'Stai per rimuovere definitivamente questa foto dalla gallery ufficiale.'
        }
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        isDeleting={isDeletingPhoto}
        loadingLabel="Eliminazione…"
      />

      <DeleteConfirmationModal
        isOpen={pendingFile !== null}
        onClose={clearPendingAdd}
        onConfirm={() => void handleConfirmAddPhoto()}
        variant="info"
        title="Aggiungi foto Patrono"
        message="Verifica l’anteprima e, se serve, aggiungi una didascalia opzionale prima del salvataggio."
        confirmLabel="Carica foto"
        cancelLabel="Annulla"
        isDeleting={isUploading}
        loadingLabel="Caricamento…"
        icon={<ImagePlus className="w-8 h-8" />}
      >
        <div className="mt-4 w-full space-y-3 text-left">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Anteprima foto da caricare"
              className="w-full max-h-48 object-contain rounded-lg border border-slate-700 bg-black"
            />
          ) : null}
          <div>
            <label
              htmlFor={captionFieldId}
              className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2"
            >
              Didascalia (opzionale)
            </label>
            <textarea
              id={captionFieldId}
              value={captionDraft}
              onChange={(e) => setCaptionDraft(e.target.value)}
              rows={3}
              disabled={isUploading}
              placeholder="Es. Processione del 15 agosto, Piazza Duomo…"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white resize-y min-h-[44px] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
            />
          </div>
        </div>
      </DeleteConfirmationModal>

      {festEdit && (
        <AdminPhotoInspector
          isOpen={true}
          imageUrl={festEdit.imageUrl}
          mode="hero"
          onClose={() => setFestEdit(null)}
          onSave={handleFestInspectorSave}
        />
      )}
    </section>
  );
};
