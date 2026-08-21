import { Bot, Crop, Loader2, Lock, Monitor, Save, Share2, Trash2, Upload } from 'lucide-react';
import type React from 'react';
import { GLOBAL_ASSET_DEFAULTS } from './constants';
import type { AssetUploadTarget, DeleteAssetTarget } from './types';

type FunctionalAssetsSectionProps = {
  authBg: string;
  socialBg: string;
  aiBg: string;
  isSavingExtra: boolean;
  authInputRef: React.RefObject<HTMLInputElement | null>;
  socialInputRef: React.RefObject<HTMLInputElement | null>;
  aiBgInputRef: React.RefObject<HTMLInputElement | null>;
  handleRemoveAssetRequest: (target: DeleteAssetTarget) => void;
  handleFileUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    target: AssetUploadTarget,
    phCat?: string,
  ) => void;
  openEditor: (url: string, target: AssetUploadTarget, cat?: string) => void;
  handleSaveExtraAssets: () => void;
};

export const FunctionalAssetsSection = ({
  authBg,
  socialBg,
  aiBg,
  isSavingExtra,
  authInputRef,
  socialInputRef,
  aiBgInputRef,
  handleRemoveAssetRequest,
  handleFileUpload,
  openEditor,
  handleSaveExtraAssets,
}: FunctionalAssetsSectionProps) => (
  <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg mt-8">
    <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
      <div>
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Monitor className="w-5 h-5 text-indigo-500" /> Asset Funzionali
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Immagini di sistema per login, condivisione e AI.
        </p>
      </div>
      <button
        type="button"
        onClick={handleSaveExtraAssets}
        disabled={isSavingExtra}
        className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold uppercase text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95"
      >
        {isSavingExtra ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}{' '}
        Salva Asset
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-900/20 rounded-lg text-indigo-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Background Login</h4>
              <p className="text-[10px] text-slate-500 uppercase">Schermata Auth</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleRemoveAssetRequest('auth')}
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="aspect-video bg-black rounded-lg overflow-hidden relative group border border-slate-700">
          <img
            src={authBg || GLOBAL_ASSET_DEFAULTS.auth_bg}
            className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
            alt="Auth BG"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity gap-2">
            <button
              type="button"
              onClick={() => authInputRef.current?.click()}
              className="p-2 bg-white text-slate-900 rounded-full shadow-lg hover:scale-110 transition-transform"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => openEditor(authBg || GLOBAL_ASSET_DEFAULTS.auth_bg, 'auth')}
              className="p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
            >
              <Crop className="w-4 h-4" />
            </button>
          </div>
          <input
            ref={authInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, 'auth')}
          />
        </div>
      </div>

      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-pink-900/20 rounded-lg text-pink-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Social Canvas Default</h4>
              <p className="text-[10px] text-slate-500 uppercase">Viral Kit</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleRemoveAssetRequest('social')}
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="aspect-[3/4] bg-black rounded-lg overflow-hidden relative group border border-slate-700 max-w-[150px] mx-auto">
          <img
            src={socialBg || GLOBAL_ASSET_DEFAULTS.social_bg}
            className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
            alt="Social BG"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity gap-2">
            <button
              type="button"
              onClick={() => socialInputRef.current?.click()}
              className="p-2 bg-white text-slate-900 rounded-full shadow-lg hover:scale-110 transition-transform"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => openEditor(socialBg || GLOBAL_ASSET_DEFAULTS.social_bg, 'social')}
              className="p-2 bg-pink-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
            >
              <Crop className="w-4 h-4" />
            </button>
          </div>
          <input
            ref={socialInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, 'social')}
          />
        </div>
      </div>

      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col gap-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-900/20 rounded-lg text-purple-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Box AI Consultant</h4>
              <p className="text-[10px] text-slate-500 uppercase">Home Page</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleRemoveAssetRequest('ai_bg')}
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="aspect-video bg-black rounded-lg overflow-hidden relative group border border-slate-700">
          {aiBg ? (
            <img
              src={aiBg}
              className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
              alt="AI BG"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-500 text-xs font-bold uppercase tracking-widest border-2 border-dashed border-slate-700">
              Nessuna Foto (Stile Sito)
            </div>
          )}

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity gap-2">
            <button
              type="button"
              onClick={() => aiBgInputRef.current?.click()}
              className="p-2 bg-white text-slate-900 rounded-full shadow-lg hover:scale-110 transition-transform"
            >
              <Upload className="w-4 h-4" />
            </button>
            {aiBg && (
              <button
                type="button"
                onClick={() => openEditor(aiBg, 'ai_bg')}
                className="p-2 bg-purple-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
              >
                <Crop className="w-4 h-4" />
              </button>
            )}
          </div>
          <input
            ref={aiBgInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, 'ai_bg')}
          />
        </div>
      </div>
    </div>
  </div>
);
