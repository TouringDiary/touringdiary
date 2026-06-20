import React from 'react';
import { Trash2 } from 'lucide-react';
import { CATEGORY_ICON_REGISTRY } from './SuitcaseUtils';

interface CategoryIconPickerProps {
  onSelect: (key: string) => void;
  onClose: () => void;
}

export const CategoryIconPicker: React.FC<CategoryIconPickerProps> = ({ onSelect, onClose }) => (
  <div className="bg-slate-950 border border-white/10 rounded-3xl p-4 scrollbar-hide shadow-2xl shadow-black/40">
    <div className="flex items-center justify-between mb-3 px-1">
      <span className="text-[10px] font-black uppercase text-indigo-400">Scegli Icona</span>
      <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-slate-400">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
    <div className="grid grid-cols-5 gap-2 h-[220px] overflow-y-auto pr-1 custom-scrollbar">
      {Object.entries(CATEGORY_ICON_REGISTRY).map(([key, icon]: [string, React.ReactElement]) => (
        <button
          key={key}
          onClick={() => {
            onSelect(key);
            onClose();
          }}
          className="p-2 rounded-lg bg-slate-800/95 border border-white/10 hover:border-indigo-500/50 hover:bg-slate-700 flex items-center justify-center text-slate-200 hover:text-indigo-400 transition-all hover:scale-110"
        >
          {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-4 h-4' })}
        </button>
      ))}
    </div>
  </div>
);
