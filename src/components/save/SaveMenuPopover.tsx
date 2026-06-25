import React, { useState, useRef } from 'react';
import { Save, FilePlus2 } from 'lucide-react';
import { AnchoredPopover } from '@/components/common/AnchoredPopover';

interface SaveMenuPopoverProps {
  isGuest: boolean;
  autosaveEnabled: boolean;
  canUseAutosave: boolean;
  onSave: () => void;
  onSaveAs: () => void;
  onAutosaveToggle: (enabled: boolean) => void;
  onGuestAction: () => void;
  disabled?: boolean;
  className?: string;
}

export const SaveMenuPopover: React.FC<SaveMenuPopoverProps> = ({
  isGuest,
  autosaveEnabled,
  canUseAutosave,
  onSave,
  onSaveAs,
  onAutosaveToggle,
  onGuestAction,
  disabled = false,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const handleSave = () => {
    setOpen(false);
    if (isGuest) {
      onGuestAction();
      return;
    }
    onSave();
  };

  const handleSaveAs = () => {
    setOpen(false);
    if (isGuest) {
      onGuestAction();
      return;
    }
    onSaveAs();
  };

  return (
    <div ref={anchorRef} className={className}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-full transition-colors ${
          open ? 'bg-slate-800 text-white' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Salva"
        aria-label="Menu salvataggio"
      >
        <Save className="w-[16.5px] h-[16.5px]" />
      </button>
      <AnchoredPopover
        isOpen={open}
        onClose={() => setOpen(false)}
        anchorRef={anchorRef}
        align="right"
        className="w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden origin-top-right"
      >
        <button
          type="button"
          onClick={handleSave}
          className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 flex items-center gap-2"
        >
          <Save className="w-3 h-3 text-emerald-500" /> Salva
        </button>
        <button
          type="button"
          onClick={handleSaveAs}
          className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 flex items-center gap-2 border-t border-slate-700"
        >
          <FilePlus2 className="w-3 h-3 text-amber-500" /> Salva con nome
        </button>
        {!isGuest && (
          <>
            <div className="border-t border-slate-700" />
            <label className="flex items-center justify-between px-3 py-2.5 text-xs font-bold text-white hover:bg-slate-700 cursor-pointer gap-3">
              <span className="text-slate-300">Auto-save</span>
              <button
                type="button"
                role="switch"
                aria-checked={canUseAutosave && autosaveEnabled}
                disabled={!canUseAutosave}
                onClick={() => {
                  if (!canUseAutosave) return;
                  onAutosaveToggle(!autosaveEnabled);
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
                  !canUseAutosave
                    ? 'bg-slate-700 opacity-50 cursor-not-allowed'
                    : autosaveEnabled
                      ? 'bg-emerald-500'
                      : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform mt-0.5 ${
                    autosaveEnabled && canUseAutosave ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>
            {!canUseAutosave && (
              <p className="px-3 pb-2 text-[10px] text-slate-500 leading-snug">
                Disponibile dopo il primo salvataggio
              </p>
            )}
          </>
        )}
      </AnchoredPopover>
    </div>
  );
};
