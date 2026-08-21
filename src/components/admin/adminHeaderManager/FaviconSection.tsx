import { Crop, Image as ImageIcon, Loader2, Save, Trash2, Upload } from 'lucide-react';
import type React from 'react';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import type { AssetUploadTarget, DeleteAssetTarget } from './types';

type FaviconSectionProps = {
  faviconImage: string;
  isSavingFavicon: boolean;
  faviconInputRef: React.RefObject<HTMLInputElement | null>;
  handleSaveFavicon: () => void;
  handleRemoveAssetRequest: (target: DeleteAssetTarget) => void;
  handleFileUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    target: AssetUploadTarget,
    phCat?: string,
  ) => void;
  openEditor: (url: string, target: AssetUploadTarget, cat?: string) => void;
};

export const FaviconSection = ({
  faviconImage,
  isSavingFavicon,
  faviconInputRef,
  handleSaveFavicon,
  handleRemoveAssetRequest,
  handleFileUpload,
  openEditor,
}: FaviconSectionProps) => (
  <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg mt-8">
    <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
      <div>
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-amber-500" /> Favicon
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Icona browser esposta su <span className="text-slate-300 font-mono">/favicon.ico</span>{' '}
          (sempre HTTP 200).
        </p>
      </div>
      <button
        type="button"
        onClick={handleSaveFavicon}
        disabled={isSavingFavicon}
        className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold uppercase text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95"
      >
        {isSavingFavicon ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}{' '}
        Salva Favicon
      </button>
    </div>

    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-6 items-start max-w-xl w-full">
      <div className="flex items-center justify-between w-full md:w-auto mb-1 md:hidden">
        <span className="font-bold text-white text-sm">Anteprima</span>
        <button
          type="button"
          onClick={() => handleRemoveAssetRequest('favicon')}
          disabled={!faviconImage}
          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded transition-colors disabled:opacity-40 disabled:pointer-events-none"
          aria-label="Elimina favicon"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="w-24 h-24 bg-black rounded-lg overflow-hidden relative group border border-slate-700 shrink-0">
        {faviconImage ? (
          <ImageWithFallback
            src={faviconImage}
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            alt="Favicon attuale"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-wider text-center px-2 border-2 border-dashed border-slate-700">
            Default server
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity gap-2">
          <button
            type="button"
            onClick={() => faviconInputRef.current?.click()}
            className="p-2 bg-white text-slate-900 rounded-full shadow-lg hover:scale-110 transition-transform"
            aria-label="Carica favicon"
          >
            <Upload className="w-4 h-4" />
          </button>
          {faviconImage && (
            <button
              type="button"
              onClick={() => openEditor(faviconImage, 'favicon')}
              className="p-2 bg-amber-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
              aria-label="Modifica favicon"
            >
              <Crop className="w-4 h-4" />
            </button>
          )}
        </div>
        <input
          ref={faviconInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => handleFileUpload(e, 'favicon')}
        />
      </div>
      <div className="flex flex-col gap-3 flex-1 min-w-0">
        <div className="hidden md:flex items-center justify-between">
          <div>
            <h4 className="font-bold text-white text-sm">Favicon piattaforma</h4>
            <p className="text-[10px] text-slate-500 uppercase">PNG / JPG / WebP consigliati</p>
          </div>
          <button
            type="button"
            onClick={() => handleRemoveAssetRequest('favicon')}
            disabled={!faviconImage}
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded transition-colors disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Elimina favicon"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Upload o ritaglio con lo stesso editor Admin degli altri Asset Globali. Dopo il
          salvataggio il browser riceve l&apos;icona da{' '}
          <span className="font-mono text-slate-300">/favicon.ico</span>.
        </p>
        <button
          type="button"
          onClick={() => faviconInputRef.current?.click()}
          className="py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase rounded-lg border border-slate-600 transition-colors"
        >
          Carica / Sostituisci
        </button>
      </div>
    </div>
  </div>
);
