import { Award, Crop, Loader2, Save } from 'lucide-react';
import type React from 'react';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import type { AssetUploadTarget } from './types';

type PatronSectionProps = {
  patronImage: string;
  isSavingPatron: boolean;
  patronInputRef: React.RefObject<HTMLInputElement | null>;
  openEditor: (url: string, target: AssetUploadTarget, cat?: string) => void;
  handleResetPatronGlobal: () => void;
  handleFileUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    target: AssetUploadTarget,
    phCat?: string,
  ) => void;
  handleSavePatron: () => void;
};

export const PatronSection = ({
  patronImage,
  isSavingPatron,
  patronInputRef,
  openEditor,
  handleResetPatronGlobal,
  handleFileUpload,
  handleSavePatron,
}: PatronSectionProps) => (
  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col gap-4">
    <div className="flex items-center gap-3 mb-2 justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-900/20 rounded-lg text-amber-500">
          <Award className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Patrono Master</h3>
          <p className="text-xs text-slate-400">Default per città senza foto propria</p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleResetPatronGlobal}
        className="text-[10px] text-slate-500 hover:text-red-400 underline"
      >
        Reset
      </button>
    </div>

    <div className="flex items-center gap-6">
      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-700 shadow-xl shrink-0">
        <ImageWithFallback
          src={patronImage || undefined}
          alt="Patrono Master"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex flex-col gap-2 w-full">
        <button
          type="button"
          onClick={() => patronInputRef.current?.click()}
          className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase rounded-lg border border-slate-600 transition-colors"
        >
          Carica File
        </button>
        <input
          ref={patronInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileUpload(e, 'patron')}
        />
        <button
          type="button"
          onClick={() => openEditor(patronImage, 'patron')}
          disabled={!patronImage}
          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase rounded-lg border border-indigo-500/40 transition-colors flex items-center justify-center gap-2"
          aria-label="Modifica Patrono Master"
        >
          <Crop className="w-3 h-3" />
          Modifica
        </button>
        <button
          type="button"
          onClick={handleSavePatron}
          disabled={isSavingPatron}
          className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold uppercase rounded-lg shadow-lg transition-colors flex items-center justify-center gap-2"
        >
          {isSavingPatron ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Save className="w-3 h-3" />
          )}{' '}
          Salva
        </button>
      </div>
    </div>
  </div>
);
