import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Suitcase } from '@/types/suitcase';

interface TemplateSelectorProps {
  masters: Suitcase[];
  selectedMasterId: string | null;
  onSelectMaster: (id: string) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  masters,
  selectedMasterId,
  onSelectMaster
}) => {
  return (
    <aside className="w-80 shrink-0 bg-slate-900/50 border-r border-slate-800 lg:overflow-y-auto p-4 space-y-2">
      <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-600 px-2 mb-4">Seleziona Template</h2>
      {masters.map(m => (
        <button
          key={m.id}
          onClick={() => onSelectMaster(m.id)}
          className={`w-full px-3 py-3 rounded-xl flex items-center gap-3 transition-all ${selectedMasterId === m.id
              ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
              : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
        >
          <span className="text-xl shrink-0">{m.icon}</span>
          <span className="text-sm font-bold truncate flex-1 text-left">{m.title}</span>
          <ChevronRight className={`w-4 h-4 ${selectedMasterId === m.id ? 'translate-x-1' : 'opacity-0'}`} />
        </button>
      ))}
    </aside>
  );
};
