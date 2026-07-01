import React, { useRef, useState } from 'react';
import {
  MoreVertical,
  Edit2,
  Save,
  FilePlus2,
  Trash2,
  Link2,
  Layout,
  CloudOff,
  Sparkles,
  Ban,
} from 'lucide-react';
import { AnchoredPopover } from '@/components/common/AnchoredPopover';
import { CountBadge } from '@/components/ui/CountBadge';
import type { DocumentSavePhase } from '@/domain/save/documentSaveTypes';

interface SuitcaseActionMenuProps {
  // Documento — le azioni opzionali vengono mostrate solo quando la relativa callback è disponibile.
  onRename: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onAutosaveToggle?: (enabled: boolean) => void;
  autosaveEnabled: boolean;
  canUseAutosave: boolean;
  savePhase: DocumentSavePhase;
  isGuest: boolean;
  onGuestSaveAction?: () => void;
  onDelete: () => void;
  // Diario
  isLinkedToItinerary: boolean;
  isAssociable: boolean;
  isDiaryAssociable: boolean;
  onLink?: () => void;
  onUnlink: () => void;
  // Suggerimenti
  onOpenAiModal?: () => void;
  onOpenBlacklist?: () => void;
  blacklistCount: number;
  isSeedingAi: boolean;
  isBlacklistFlashing: boolean;
  className?: string;
}

const SECTION_LABEL_CLASS =
  'px-3 pt-2 pb-1 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500';
const ITEM_CLASS =
  'w-full text-left px-3 py-2.5 text-xs font-bold text-slate-100 hover:bg-slate-700/70 flex items-center gap-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

/** Sezione del menu: separatore (tranne la prima) + etichetta + contenuto. */
const MenuSection: React.FC<{ label: string; divider?: boolean; children: React.ReactNode }> = ({
  label,
  divider = true,
  children,
}) => (
  <>
    {divider && <div className="border-t border-slate-700/70 mt-1" />}
    <div className={SECTION_LABEL_CLASS}>{label}</div>
    {children}
  </>
);

/**
 * Menu "Azione" unico per mobile/tablet (< lg) in modalità editor: consolida le azioni che su
 * schermo grande vivono nell'header (rinomina/salva/elimina/sync) e nella toolbar (suggerimenti),
 * lasciando Undo/Redo sempre visibili fuori dal menu. Riusa AnchoredPopover (role="menu").
 *
 * La Modalità (Visualizza/Modifica) resta volutamente come toggle nella toolbar: dev'essere
 * raggiungibile anche in viewer, dove questo menu non è presente.
 */
export const SuitcaseActionMenu: React.FC<SuitcaseActionMenuProps> = ({
  onRename,
  onSave,
  onSaveAs,
  onAutosaveToggle,
  autosaveEnabled,
  canUseAutosave,
  savePhase,
  isGuest,
  onGuestSaveAction,
  onDelete,
  isLinkedToItinerary,
  isAssociable,
  isDiaryAssociable,
  onLink,
  onUnlink,
  onOpenAiModal,
  onOpenBlacklist,
  blacklistCount,
  isSeedingAi,
  isBlacklistFlashing,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const run = (fn?: () => void) => {
    setOpen(false);
    fn?.();
  };

  // Sorgente di verità unica: per i guest il salvataggio è sostituito dall'azione di login.
  // Rendering (canSave/canSaveAs) ed esecuzione (handleSave/handleSaveAs) usano la stessa callback.
  const effectiveSave = isGuest ? onGuestSaveAction : onSave;
  const effectiveSaveAs = isGuest ? onGuestSaveAction : onSaveAs;
  const canSave = !!effectiveSave;
  const canSaveAs = !!effectiveSaveAs;
  const hasSuggestions = !!onOpenAiModal || !!onOpenBlacklist;

  const handleSave = () => run(effectiveSave);
  const handleSaveAs = () => run(effectiveSaveAs);

  const saveStatusLabel =
    savePhase === 'saving'
      ? 'Salvataggio…'
      : savePhase === 'error'
        ? 'Errore di salvataggio'
        : savePhase === 'synced'
          ? 'Salvato'
          : null;

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Azione"
        title="Azione"
        className={`p-2 md:p-2.5 rounded-xl border transition-all shadow-lg ${
          open
            ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
            : isBlacklistFlashing
              ? 'bg-amber-500/20 border-amber-400/50 text-amber-300 animate-pulse ring-2 ring-amber-300/60 motion-reduce:animate-none'
              : 'bg-slate-800/50 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/15'
        } ${className}`}
      >
        <MoreVertical className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      <AnchoredPopover
        isOpen={open}
        onClose={() => setOpen(false)}
        anchorRef={anchorRef}
        align="right"
        role="menu"
        className="w-56 max-w-[80vw] bg-slate-800 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 overflow-hidden py-1 pointer-events-auto"
      >
        <MenuSection label="Documento" divider={false}>
        <button type="button" role="menuitem" className={ITEM_CLASS} onClick={() => run(onRename)}>
          <Edit2 className="w-4 h-4 text-indigo-400 shrink-0" aria-hidden /> Rinomina
        </button>
        {canSave && (
        <button
          type="button"
          role="menuitem"
          className={ITEM_CLASS}
          disabled={savePhase === 'saving'}
          onClick={handleSave}
        >
          <Save className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden />
          <span className="flex-1">Salva</span>
          {saveStatusLabel && (
            <span
              className={`text-[9px] font-bold uppercase tracking-wide ${
                savePhase === 'error' ? 'text-rose-400' : 'text-slate-400'
              }`}
            >
              {saveStatusLabel}
            </span>
          )}
        </button>
        )}
        {canSaveAs && (
        <button type="button" role="menuitem" className={ITEM_CLASS} onClick={handleSaveAs}>
          <FilePlus2 className="w-4 h-4 text-amber-500 shrink-0" aria-hidden /> Salva con nome
        </button>
        )}
        {!isGuest && onAutosaveToggle && (
          <label className="flex items-center justify-between px-3 py-2.5 text-xs font-bold text-slate-100 hover:bg-slate-700/70 cursor-pointer gap-3">
            <span className="text-slate-300">Auto-save</span>
            <button
              type="button"
              role="switch"
              aria-checked={canUseAutosave && autosaveEnabled}
              disabled={!canUseAutosave}
              onClick={() => canUseAutosave && onAutosaveToggle?.(!autosaveEnabled)}
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
        )}
        <button
          type="button"
          role="menuitem"
          className={`${ITEM_CLASS} text-rose-300 hover:bg-rose-500/10 hover:text-rose-200`}
          onClick={() => run(onDelete)}
        >
          <Trash2 className="w-4 h-4 shrink-0" aria-hidden /> Elimina
        </button>
        </MenuSection>

        <MenuSection label="Diario">
        {isLinkedToItinerary ? (
          <button type="button" role="menuitem" className={ITEM_CLASS} onClick={() => run(onUnlink)}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ml-1 mr-0.5 animate-pulse motion-reduce:animate-none" aria-hidden />
            Sincronizzato · Scollega
          </button>
        ) : onLink && isAssociable ? (
          <button
            type="button"
            role="menuitem"
            className={ITEM_CLASS}
            disabled={!isDiaryAssociable}
            onClick={() => run(onLink)}
          >
            <Link2 className="w-4 h-4 text-indigo-400 shrink-0" aria-hidden />
            {isDiaryAssociable ? 'Collega al diario' : 'Collega (completa date e tappe)'}
          </button>
        ) : !isAssociable ? (
          <div className={`${ITEM_CLASS} text-slate-500`}>
            <Layout className="w-4 h-4 shrink-0" aria-hidden /> Template · non associabile
          </div>
        ) : (
          <div className={`${ITEM_CLASS} text-slate-500`}>
            <CloudOff className="w-4 h-4 shrink-0" aria-hidden /> Offline
          </div>
        )}
        </MenuSection>

        {hasSuggestions && (
        <MenuSection label="Suggerimenti">
        {onOpenAiModal && (
        <button
          type="button"
          role="menuitem"
          className={ITEM_CLASS}
          disabled={isSeedingAi}
          onClick={() => run(onOpenAiModal)}
        >
          <Sparkles
            className={`w-4 h-4 text-amber-400 shrink-0 ${isSeedingAi ? 'animate-spin' : ''}`}
            aria-hidden
          />
          {isSeedingAi ? 'Generazione…' : 'Richiedi suggerimenti'}
        </button>
        )}
        {onOpenBlacklist && (
        <button type="button" role="menuitem" className={ITEM_CLASS} onClick={() => run(onOpenBlacklist)}>
          <Ban className="w-4 h-4 text-slate-400 shrink-0" aria-hidden />
          <span className="flex-1">Suggerimenti rifiutati</span>
          {blacklistCount > 0 && (
            <CountBadge count={blacklistCount} max={99} size="sm" variant="indigo" position="inline" aria-hidden />
          )}
        </button>
        )}
        </MenuSection>
        )}
      </AnchoredPopover>
    </>
  );
};
