import { Loader2, Wand2 } from 'lucide-react';

import { useState } from 'react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_ADMIN_MODAL } from '@/constants/zIndex';
import { GEO_CONFIG } from '../../../constants/geoConfig';

interface Props {
  onClose: () => void;
  onGenerate: (name: string, poiCount: number) => void;
  isGenerating: boolean;
}

export const CityGeneratorModal = ({ onClose, onGenerate, isGenerating }: Props) => {
  const [name, setName] = useState('');
  const [poiCount, setPoiCount] = useState(10);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onGenerate(name, poiCount);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
      style={{ zIndex: Z_ADMIN_MODAL }}
    >
      <div className="bg-slate-900 border border-indigo-500/50 p-6 rounded-2xl w-full max-w-md shadow-2xl relative animate-in zoom-in-95">
        <CloseButton
          onClose={onClose}
          variant="primary"
          position="absolute"
          className="top-4 right-4"
        />

        <div className="flex flex-col items-center text-center gap-4 mb-6">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center border-2 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <Wand2 className="w-8 h-8 text-indigo-500 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2 font-display">Nuova Città AI</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              L'intelligenza artificiale genererà automaticamente storia, statistiche, patrono e
              Punti di Interesse in modalità sequenziale stabile.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="fld-admin-cities-citygeneratormodal-tsx-l51"
              className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1"
            >
              Nome Città
            </label>
            <input
              id="fld-admin-cities-citygeneratormodal-tsx-l51"
              autoFocus
              type="text"
              placeholder={`Es. ${GEO_CONFIG.DEFAULT_CITY_NAME}...`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none font-bold"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div>
            <label
              htmlFor="fld-admin-cities-citygeneratormodal-tsx-l66"
              className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1"
            >
              POI per Categoria
            </label>
            <select
              id="fld-admin-cities-citygeneratormodal-tsx-l66"
              value={poiCount}
              onChange={(e) => setPoiCount(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none"
            >
              <option value={5}>5 (Veloce)</option>
              <option value={10}>10 (Standard)</option>
              <option value={15}>15 (Completo)</option>
              <option value={20}>20 (Massivo)</option>
            </select>
            <p className="text-[9px] text-slate-500 mt-1 italic">
              Verranno generate 6 categorie (Totale: {poiCount * 6} POI)
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-colors"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!name.trim() || isGenerating}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}{' '}
              Genera Tutto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
