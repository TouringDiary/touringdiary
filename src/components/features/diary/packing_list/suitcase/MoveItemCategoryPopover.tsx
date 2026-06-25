import React, { useRef, useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { AnchoredPopover } from '@/components/common/AnchoredPopover';
import { ItemCategoryIcon } from './SuitcaseUtils';
import type { DisplayCategory } from '@/domain/packing/categorySetup';

interface MoveItemCategoryPopoverProps {
  targets: DisplayCategory[];
  onSelect: (categoryName: string) => void;
  disabled?: boolean;
}

export const MoveItemCategoryPopover: React.FC<MoveItemCategoryPopoverProps> = ({
  targets,
  onSelect,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  if (targets.length === 0) return null;

  const handleSelect = (categoryName: string) => {
    onSelect(categoryName);
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((open) => !open);
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Sposta in altra categoria"
        title="Sposta in..."
        className="shrink-0 flex items-center justify-center min-w-[36px] min-h-[36px] w-9 h-9 md:w-8 md:h-8 p-1.5 rounded-lg bg-white/5 hover:bg-sky-500/10 text-slate-400 hover:text-sky-300 transition-all touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ArrowRightLeft className="w-4 h-4" />
      </button>

      <AnchoredPopover
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        anchorRef={triggerRef}
        align="right"
        role="listbox"
        aria-label="Categorie destinazione"
        className="min-w-[10rem] max-h-[min(16rem,50vh)] overflow-y-auto rounded-xl border border-white/10 bg-slate-950/98 backdrop-blur-md shadow-2xl shadow-black/40 py-1 pointer-events-auto"
      >
        <div className="px-3 py-1.5 border-b border-white/5">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
            Sposta in...
          </span>
        </div>
        {targets.map((category) => (
          <button
            key={category.id}
            type="button"
            role="option"
            onClick={(e) => {
              e.stopPropagation();
              handleSelect(category.name);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            <ItemCategoryIcon
              category={category.name}
              iconKey={category.icon_key}
              className="w-3.5 h-3.5 shrink-0 text-slate-400"
            />
            <span className="text-sm font-medium truncate">{category.name}</span>
          </button>
        ))}
      </AnchoredPopover>
    </>
  );
};
