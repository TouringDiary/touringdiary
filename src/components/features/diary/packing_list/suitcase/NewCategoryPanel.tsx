import React, { useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { AnchoredPopover } from '@/components/common/AnchoredPopover';
import { ItemCategoryIcon } from './SuitcaseUtils';
import { CategoryIconPicker } from './CategoryIconPicker';

interface NewCategoryPanelProps {
  newCatName: string;
  onNameChange: (value: string) => void;
  newCatIcon: string;
  showIconPicker: boolean;
  onToggleIconPicker: () => void;
  onSelectIcon: (key: string) => void;
  onCloseIconPicker: () => void;
  onCancel: () => void;
  onSave: () => void;
}

export const NewCategoryPanel: React.FC<NewCategoryPanelProps> = ({
  newCatName,
  onNameChange,
  newCatIcon,
  showIconPicker,
  onToggleIconPicker,
  onSelectIcon,
  onCloseIconPicker,
  onCancel,
  onSave,
}) => {
  const iconTriggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="bg-slate-900/60 rounded-3xl border border-indigo-500/30 p-8 flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in-95 duration-300 shadow-2xl shadow-indigo-500/10">
      <div className="max-w-[400px] w-full space-y-6">
        <div className="text-center">
          <h5 className="text-[11px] uppercase font-black text-indigo-400 tracking-widest mb-1">Nuova Categoria</h5>
          <p className="text-[10px] text-slate-500">Organizza i tuoi oggetti in una nuova sezione dedicata</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Nome Sezione</label>
            <input
              autoFocus
              value={newCatName}
              onChange={(e) => onNameChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSave()}
              placeholder="Es. Fotografia, Accessori..."
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-5 py-3 text-sm text-white focus:border-indigo-500/50 focus:outline-none placeholder:text-slate-700"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Icona Sezione</label>
            <button
              ref={iconTriggerRef}
              onClick={(e) => {
                e.stopPropagation();
                onToggleIconPicker();
              }}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-5 py-3 flex items-center justify-between hover:bg-slate-900 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/10">
                  <ItemCategoryIcon category="custom" iconKey={newCatIcon} className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-300 tracking-wide">{newCatIcon}</span>
              </div>
              <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${showIconPicker ? 'rotate-90' : ''}`} />
            </button>

            <AnchoredPopover
              isOpen={showIconPicker}
              onClose={onCloseIconPicker}
              anchorRef={iconTriggerRef}
              align="left"
              className="w-[min(400px,calc(100vw-24px))]"
            >
              <CategoryIconPicker onSelect={onSelectIcon} onClose={onCloseIconPicker} />
            </AnchoredPopover>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            onClick={onCancel}
            className="flex-1 py-4 rounded-xl bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={onSave}
            className="flex-[2] py-4 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
          >
            Salva Categoria
          </button>
        </div>
      </div>
    </div>
  );
};
