import { Crop, Image as ImageIcon, Loader2, Save, Trash2, Upload } from 'lucide-react';
import type React from 'react';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { SafeArtPanel } from '../design/SafeArtPanel';
import { GLOBAL_ASSET_DEFAULTS } from './constants';
import type { AssetUploadTarget } from './types';

type HeroSectionProps = {
  mode: 'upload' | 'generate';
  setMode: (mode: 'upload' | 'generate') => void;
  previewImage: string | null;
  isSavingHero: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  openEditor: (url: string, target: AssetUploadTarget, cat?: string) => void;
  handleRemoveHeroRequest: () => void;
  handleFileUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    target: AssetUploadTarget,
    phCat?: string,
  ) => void;
  handleSafeArtSuccess: (url: string) => void;
  showToast: (message: string, type: 'success' | 'error') => void;
  handleSaveHero: () => void;
};

export const HeroSection = ({
  mode,
  setMode,
  previewImage,
  isSavingHero,
  fileInputRef,
  openEditor,
  handleRemoveHeroRequest,
  handleFileUpload,
  handleSafeArtSuccess,
  showToast,
  handleSaveHero,
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
        >
          <Crop className="w-4 h-4" /> <span className="hidden lg:inline">Ritaglia / Effetti</span>
        </button>
        <button
          type="button"
          onClick={handleRemoveHeroRequest}
          className="bg-red-600 hover:bg-red-500 text-white p-2.5 sm:p-2 rounded-lg shadow-lg border border-white/20 transition-colors shrink-0 touch-manipulation"
          title="Rimuovi Immagine"
        >
          <Trash2 className="w-4 h-4" />
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

    <button
      type="button"
      onClick={handleSaveHero}
      disabled={isSavingHero}
      className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white py-4 rounded-xl font-bold text-base shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 mt-4"
    >
      {isSavingHero ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
      Applica Header (DB)
    </button>
  </div>
);
