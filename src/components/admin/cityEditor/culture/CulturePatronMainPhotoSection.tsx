import { Crop, Trash2, Upload } from 'lucide-react';
import type React from 'react';
import { type ComponentProps, useRef, useState } from 'react';
import {
  getPatronCitySpecificImageUrl,
  isPatronUsingMasterFallback,
  PATRON_MAIN_PHOTO_ASPECT_RATIO,
  resolvePatronDisplayImageUrl,
} from '@/domain/patron/resolvePatronDisplayImageUrl';
import { usePatronMasterImageUrl } from '@/hooks/usePatronMasterImageUrl';
import { uploadPublicMedia } from '@/services/mediaService';
import type { CityDetails } from '@/types/index';
import { compressImageHighQuality, dataURLtoFile } from '@/utils/common';
import { ImageWithFallback } from '../../../common/ImageWithFallback';
import { AdminImageInput } from '../../AdminImageInput';
import { AdminPhotoInspector } from '../../AdminPhotoInspector';

type CulturePatronMainPhotoSectionProps = {
  city: CityDetails;
  updatePatronDetails: (
    patch: Partial<NonNullable<CityDetails['details']['patronDetails']>>,
  ) => void;
};

type AdminImageInputChange = Parameters<ComponentProps<typeof AdminImageInput>['onChange']>[0];

export const CulturePatronMainPhotoSection: React.FC<CulturePatronMainPhotoSectionProps> = ({
  city,
  updatePatronDetails,
}) => {
  const masterPatronUrl = usePatronMasterImageUrl();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const citySpecificUrl = getPatronCitySpecificImageUrl(city.details.patronDetails);
  const displayUrl = resolvePatronDisplayImageUrl(city.details.patronDetails, masterPatronUrl);
  const usingMasterPreview = isPatronUsingMasterFallback(city.details.patronDetails);
  const patronLabel = city.details.patronDetails?.name || city.details.patron || 'Santo Patrono';

  // AdminImageInput include imageCredit/imageLicense nel callback generico;
  // PatronDetails persiste solo imageUrl + image_status.
  const handlePhotoUpload = (data: AdminImageInputChange) => {
    updatePatronDetails({
      imageUrl: data.imageUrl,
      image_status: data.image_status,
    });
  };

  const handleRemovePhoto = () => {
    updatePatronDetails({
      imageUrl: '',
      image_status: 'missing',
    });
  };

  const handleInspectorSave = (data: { image: string }) => {
    updatePatronDetails({
      imageUrl: data.image,
      image_status: data.image ? 'real' : 'missing',
    });
    setIsInspectorOpen(false);
  };

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const compressedBase64 = await compressImageHighQuality(file);
      const compressedFile = dataURLtoFile(compressedBase64, file.name);
      const publicUrl = await uploadPublicMedia(compressedFile, 'admin_uploads');
      if (publicUrl) {
        updatePatronDetails({
          imageUrl: publicUrl,
          image_status: 'real',
        });
      } else {
        alert('Errore upload. Verifica la connessione.');
      }
    } catch {
      alert('Errore elaborazione immagine.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <section className="border-t border-slate-800 pt-8 mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Foto Patrono</h4>
        {usingMasterPreview && masterPatronUrl && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500/80 bg-amber-950/30 border border-amber-500/20 px-2 py-1 rounded-md">
            Anteprima Patrono Master
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-xl overflow-hidden border-2 border-slate-700 bg-black shadow-lg max-w-3xl">
          {displayUrl ? (
            <ImageWithFallback
              src={displayUrl}
              alt={patronLabel}
              objectFit="cover"
              className="absolute inset-0 h-full w-full"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-xs font-bold uppercase text-center px-4">
              Nessuna immagine — imposta il Patrono Master in Asset Globali
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold uppercase border border-slate-600 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            {isUploading ? 'Caricamento…' : 'Carica'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleQuickUpload}
          />
          <button
            type="button"
            onClick={() => setIsInspectorOpen(true)}
            disabled={!citySpecificUrl}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold uppercase shadow-lg"
            aria-label="Modifica e ritaglia foto specifica patrono"
          >
            <Crop className="w-3.5 h-3.5" /> Modifica
          </button>
          <button
            type="button"
            onClick={handleRemovePhoto}
            disabled={!citySpecificUrl}
            className="text-xs bg-red-900/20 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-red-400 hover:text-white border border-red-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold uppercase transition-colors"
            aria-label="Rimuovi foto specifica patrono"
          >
            <Trash2 className="w-3.5 h-3.5" /> Rimuovi
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed border-l-2 border-slate-700 pl-3 max-w-3xl">
          Foto grande nel modale utente. Se assente, viene mostrato il Patrono Master (Asset
          Globali) — senza salvarlo nel database città.
        </p>

        <div className="max-w-3xl">
          <AdminImageInput
            imageUrl={citySpecificUrl}
            onChange={handlePhotoUpload}
            qualityMode="high"
          />
        </div>
      </div>

      {isInspectorOpen && citySpecificUrl ? (
        <AdminPhotoInspector
          isOpen={true}
          imageUrl={citySpecificUrl}
          mode="hero"
          viewportGuide={{
            // SoT: stesso crop di PatronSaintModal (desktop 21:9 export; mobile 16:9 nested object-cover)
            primaryAspect: PATRON_MAIN_PHOTO_ASPECT_RATIO.desktop,
            secondaryAspect: PATRON_MAIN_PHOTO_ASPECT_RATIO.mobile,
            primaryLabel: 'UI pubblica · desktop 21:9 (export)',
            secondaryLabel: 'Mobile 16:9 (object-cover)',
          }}
          onClose={() => setIsInspectorOpen(false)}
          onSave={handleInspectorSave}
        />
      ) : null}
    </section>
  );
};
