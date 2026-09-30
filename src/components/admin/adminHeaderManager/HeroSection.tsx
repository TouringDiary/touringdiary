import { Crop, Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import type React from 'react';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { SafeArtPanel } from '../design/SafeArtPanel';
import { GLOBAL_ASSET_DEFAULTS } from './constants';
import type { AssetUploadTarget } from './types';

type HeroSectionProps = {
  mode: 'upload' | 'generate';
  setMode: (mode: 'upload' | 'generate') => void;
  previewImage: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  openEditor: (url: string, target: AssetUploadTarget, cat?: string) => void;
  handleRemoveHeroRequest: () => void;
  handleFileUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    target: AssetUploadTarget,
    phCat?: string,
  ) => void;
  handleSafeArtSuccess: (url: string) => void;
  showToast: (message: string, type: 'success' | 'error') => void;
};

export const HeroSection = ({
  mode,
  setMode,
  previewImage,
  fileInputRef,
  openEditor,
  handleRemoveHeroRequest,
  handleFileUpload,
  handleSafeArtSuccess,
  showToast,
}: HeroSectionProps) => (
  <div className="flex flex-col gap-6">
    <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
      <button
        type="button"
        onClick={() => setMode('upload')}
        className={`flex-1 py-2 text-xs font-bold uppercase rounded-md flex items-center justify-center gap-2 transition-all ${mode === 'upload' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
      >
        <Upload className="w-4 h-4" /> Carica / URL
      </button>
      <button
        type="button"
        onClick={() => setMode('generate')}
        className={`flex-1 py-2 text-xs font-bold uppercase rounded-md flex items-center justify-center gap-2 transition-all ${mode === 'generate' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
      >
        <ImageIcon className="w-4 h-4" /> Safe-Art Gen
      </button>
    </div>

    <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-slate-700 bg-black group shadow-lg">
      <ImageWithFallback
        src={previewImage || GLOBAL_ASSET_DEFAULTS.hero}
        alt="Hero"
        className="w-full h-full object-cover opacity-60 grayscale-[30%] group-hover:grayscale-[10%] transition-all duration-1000"
        priority={true}
      />
      <div className="absolute top-2 right-2 flex flex-nowrap items-center gap-2.5 sm:gap-2 shrink-0">
        <button
          type="button"
          onClick={() => openEditor(previewImage || GLOBAL_ASSET_DEFAULTS.hero, 'hero')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2.5 sm:py-2 rounded-lg shadow-lg border border-white/20 transition-colors flex items-center gap-2 text-[10px] font-bold uppercase shrink-0 touch-manipulation"
          title="Modifica e Ritaglia"
          aria-label="Ritaglia o applica effetti all'immagine hero"
        >
          <Crop className="w-4 h-4" aria-hidden="true" />{' '}
          <span className="hidden lg:inline">Ritaglia / Effetti</span>
        </button>
        <button
          type="button"
          onClick={handleRemoveHeroRequest}
          className="bg-red-600 hover:bg-red-500 text-white p-2.5 sm:p-2 rounded-lg shadow-lg border border-white/20 transition-colors shrink-0 touch-manipulation"
          title="Rimuovi Immagine"
          aria-label="Rimuovi immagine hero"
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>

    {mode === 'upload' ? (
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold text-sm border border-slate-700 transition-colors flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" /> Carica File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileUpload(e, 'hero')}
        />
      </div>
    ) : (
      <SafeArtPanel
        onImageGenerated={handleSafeArtSuccess}
        onError={(msg) => showToast(msg, 'error')}
      />
    )}

    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
      L&apos;header globale viene salvato automaticamente in Asset Globali dopo upload, ritaglio o
      Safe-Art (INT-APPLY-HEADER-DECOM-01).
    </p>
  </div>
);
