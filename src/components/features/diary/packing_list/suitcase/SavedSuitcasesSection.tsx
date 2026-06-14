import React from 'react';
import { SuitcaseCard } from './SuitcaseCard';
import { Suitcase } from '@/types/suitcase';

import { TemplatePreview } from './TemplatePreview';

interface SavedSuitcasesSectionProps {
  savedSuitcases: Suitcase[];
  isLoading: boolean;
  onOpenSuitcase: (id: string) => void;
  onLinkSuitcase: (id: string) => void;
  onDeleteSuitcase: (id: string) => void;
  currentUser?: any;
  hoveredItemId: string | null;
  onHover: (id: string | null) => void;
  onAddCategory: (id: string) => void;
}

export const SavedSuitcasesSection: React.FC<SavedSuitcasesSectionProps> = ({
  savedSuitcases,
  isLoading,
  onOpenSuitcase,
  onLinkSuitcase,
  onDeleteSuitcase,
  currentUser,
  hoveredItemId,
  onHover,
  onAddCategory
}) => {
  const hoveredSuitcase = savedSuitcases.find(s => s.id === hoveredItemId) || savedSuitcases[0] || null;

  return (
    <div>
      
      {isLoading && (
        <div className="text-center py-8">
          <p className="text-xs text-slate-500">Caricamento...</p>
        </div>
      )}

      {!isLoading && savedSuitcases.length === 0 && (
        <div className="text-center py-8 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
          <p className="text-xs text-slate-500">Nessuna valigia salvata trovata.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start relative max-w-[1280px] mx-auto w-full px-4 lg:px-0">
        {/* Lista valigie */}
        <div className="flex flex-col gap-3">
          {savedSuitcases.map(s => (
            <SuitcaseCard 
              key={s.id} 
              suitcase={s} 
              isActive={hoveredItemId === s.id}
              onClick={onOpenSuitcase} 
              onLink={onLinkSuitcase}
              onDelete={onDeleteSuitcase}
              onMouseEnter={() => onHover(s.id)}
              currentUser={currentUser}
            />
          ))}
        </div>

        {/* Preview dinamica */}
        <div aria-live="polite" aria-atomic="true" className="block animate-in fade-in slide-in-from-bottom-4 duration-500">
          <TemplatePreview template={hoveredSuitcase} sourceTab="saved" onAddCategory={onAddCategory} />
        </div>
      </div>
    </div>
  );
};
