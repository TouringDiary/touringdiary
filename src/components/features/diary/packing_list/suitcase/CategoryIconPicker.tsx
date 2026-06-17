import React from 'react';
import { Trash2 } from 'lucide-react';
import { CATEGORY_ICON_REGISTRY } from './SuitcaseUtils';

interface CategoryIconPickerProps {
  onSelect: (key: string) => void;
  onClose: () => void;
  className?: string;
}

export const CategoryIconPicker: React.FC<CategoryIconPickerProps> = ({
  onSelect,
  onClose,
  className = '',
}) => {
  return (
    <div
      className={`bg-slate-900 border border-indigo-500/25 rounded-2xl shadow-xl shadow-black/40 p-4 scrollbar-hide ${className}`}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-[10px] font-black uppercase text-indigo-400">Scegli Icona</span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-full text-slate-400"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-5 gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
        {Object.entries(CATEGORY_ICON_REGISTRY).map(([key, icon]: [string, React.ReactElement]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              onSelect(key);
              onClose();
            }}
            className="p-2 rounded-lg bg-white/5 border border-white/5 hover:border-indigo-500/50 flex items-center justify-center text-slate-300 hover:text-indigo-400 transition-all hover:scale-110"
          >
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
              className: 'w-4 h-4',
            })}
          </button>
        ))}
      </div>
    </div>
  );
};
