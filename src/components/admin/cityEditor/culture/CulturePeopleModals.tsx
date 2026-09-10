import { AlertTriangle, CheckCircle, Loader2, Sparkles, Trash2, Wand2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef } from 'react';
import {
  type FamousPersonPublishGap,
  getFamousPersonFieldLabel,
} from '@/domain/city/famousPersonCompleteness';
import type { FamousPerson } from '@/types/index';
import { DeleteConfirmationModal } from '../../../common/DeleteConfirmationModal';

interface CulturePeopleModalsProps {
  successModal: { isOpen: boolean; message: string };
  setSuccessModal: (val: { isOpen: boolean; message: string }) => void;
  deleteTarget: { id: string; name: string } | null;
  setDeleteTarget: (val: { id: string; name: string } | null) => void;
  confirmDelete: () => Promise<void>;
  isDeleting: boolean;
  refineTarget: FamousPerson | null;
  setRefineTarget: (val: FamousPerson | null) => void;
  confirmRefine: () => Promise<void>;
  publishBlock: {
    person: FamousPerson;
    missingFields: FamousPersonPublishGap[];
    otherIncompleteCount?: number;
  } | null;
  setPublishBlock: (
    val: {
      person: FamousPerson;
      missingFields: FamousPersonPublishGap[];
      otherIncompleteCount?: number;
    } | null,
  ) => void;
  setExpandedPersonId: (id: string | null) => void;
  fieldGenerating: { personId: string; field: string } | null;
  aiBlocked: boolean;
  blockMessage?: string;
  handleGenerateMissingField: (field: FamousPersonPublishGap) => Promise<void>;
  showBulkFixConfirm: boolean;
  setShowBulkFixConfirm: (val: boolean) => void;
  confirmBulkFix: () => Promise<void>;
  isSelectionActive: boolean;
  selectedCount: number;
  peopleListCount: number;
}

function getPersistedPersonId(person: FamousPerson): string | null {
  const { id } = person;
  return typeof id === 'string' && id.trim().length > 0 ? id : null;
}

export const CulturePeopleModals: React.FC<CulturePeopleModalsProps> = ({
  successModal,
  setSuccessModal,
  deleteTarget,
  setDeleteTarget,
  confirmDelete,
  isDeleting,
  refineTarget,
  setRefineTarget,
  confirmRefine,
  publishBlock,
  setPublishBlock,
  setExpandedPersonId,
  fieldGenerating,
  aiBlocked,
  blockMessage,
  handleGenerateMissingField,
  showBulkFixConfirm,
  setShowBulkFixConfirm,
  confirmBulkFix,
  isSelectionActive,
  selectedCount,
  peopleListCount,
}) => {
  const successTitleId = 'success-modal-title';
  const successCloseBtnRef = useRef<HTMLButtonElement>(null);
  const successOpenerRef = useRef<HTMLElement | null>(null);
  const successModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!successModal.isOpen) return;

    const active = document.activeElement;
    if (active instanceof HTMLElement) {
      successOpenerRef.current = active;
    } else {
      successOpenerRef.current = null;
    }

    const focusRaf = requestAnimationFrame(() => {
      successCloseBtnRef.current?.focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSuccessModal({ isOpen: false, message: '' });
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        successCloseBtnRef.current?.focus();
      }
    };

    const container = successModalRef.current;
    container?.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(focusRaf);
      container?.removeEventListener('keydown', handleKeyDown);
      const opener = successOpenerRef.current;
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) {
        opener.focus();
      }
    };
  }, [successModal.isOpen, setSuccessModal]);

  return (
    <>
      {successModal.isOpen && (
        <div
          ref={successModalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={successTitleId}
          className="fixed inset-0 z-admin-modal flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-slate-900 border border-emerald-500/50 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 max-w-sm w-full text-center">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <div>
              <h3 id={successTitleId} className="text-xl font-bold text-white mb-2">
                Ottimo Lavoro!
              </h3>
              <p className="text-slate-400 text-sm">{successModal.message}</p>
            </div>
            <button
              ref={successCloseBtnRef}
              type="button"
              onClick={() => setSuccessModal({ isOpen: false, message: '' })}
              className="mt-4 w-full py-3 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold uppercase text-xs transition-colors border border-slate-700 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirmationModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="Eliminare Personaggio?"
          message={`Stai per eliminare definitivamente "${deleteTarget.name}". L'azione è irreversibile.`}
          isDeleting={isDeleting}
          icon={<Trash2 className="w-8 h-8" />}
        />
      )}

      <DeleteConfirmationModal
        isOpen={!!refineTarget}
        onClose={() => setRefineTarget(null)}
        onConfirm={confirmRefine}
        title="Bonifica Dati & Luoghi?"
        message={`Vuoi riscrivere i dati di "${refineTarget?.name}" tramite AI Pro?\n\nInclude la ricerca di nuovi luoghi correlati e la ricerca dell'immagine.`}
        confirmLabel="Sì, Bonifica Tutto"
        cancelLabel="Annulla"
        variant="info"
        icon={<Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />}
      />

      <DeleteConfirmationModal
        isOpen={!!publishBlock}
        onClose={() => setPublishBlock(null)}
        onConfirm={() => {
          if (publishBlock) {
            const id = getPersistedPersonId(publishBlock.person);
            if (id) setExpandedPersonId(id);
          }
          setPublishBlock(null);
        }}
        title="Personaggio non pubblicabile"
        message={
          publishBlock
            ? `Mancano i seguenti dati per ${publishBlock.person.name}:\n\n${publishBlock.missingFields
                .map((f) => `• ${getFamousPersonFieldLabel(f)}`)
                .join('\n')}${
                publishBlock.otherIncompleteCount
                  ? `\n\n(+ ${publishBlock.otherIncompleteCount} altri personaggi selezionati non pubblicabili)`
                  : ''
              }\n\nCompleta i dati prima di pubblicare il personaggio.`
            : ''
        }
        confirmLabel="Completa ora"
        cancelLabel="Chiudi"
        variant="warning"
        icon={<AlertTriangle className="w-8 h-8 text-amber-400" />}
      >
        {publishBlock && (
          <div className="mt-4 w-full space-y-2 text-left" aria-live="polite">
            {publishBlock.missingFields.map((field) => {
              const isBusy =
                fieldGenerating?.personId === publishBlock.person.id &&
                (fieldGenerating.field === field ||
                  (field === 'dates' && fieldGenerating.field === 'dates'));
              const label =
                field === 'categories'
                  ? 'Apri editor categorie'
                  : field === 'dates'
                    ? 'Recupera date con AI'
                    : `Genera ${getFamousPersonFieldLabel(field)} con AI`;
              return (
                <button
                  key={field}
                  type="button"
                  disabled={aiBlocked || isBusy}
                  title={aiBlocked ? blockMessage : undefined}
                  onClick={() => handleGenerateMissingField(field)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 hover:border-indigo-500 disabled:opacity-50"
                >
                  <span>{label}</span>
                  {isBusy ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </DeleteConfirmationModal>

      <DeleteConfirmationModal
        isOpen={showBulkFixConfirm}
        onClose={() => setShowBulkFixConfirm(false)}
        onConfirm={confirmBulkFix}
        title={
          isSelectionActive ? `Bonifica ${selectedCount} Selezionati?` : 'Bonifica Intera Lista?'
        }
        message={
          isSelectionActive
            ? `Stai per avviare la bonifica per ${selectedCount} personaggi selezionati.\n\nL'operazione rigenererà dati e immagini mancanti.`
            : `Stai per avviare la bonifica automatica per TUTTI i ${peopleListCount} personaggi.\n\nL'operazione:\n1. Riscriverà bio e date\n2. Cercherà luoghi correlati\n3. CERCHERÀ LE FOTO NELLO STORAGE O LE GENERERÀ (richiede tempo e quota AI).`
        }
        confirmLabel={isSelectionActive ? 'Sì, Bonifica Selezione' : 'Sì, Procedi su Tutti'}
        cancelLabel="Annulla"
        variant="info"
        icon={<Wand2 className="w-8 h-8 text-purple-400 animate-pulse" />}
      />
    </>
  );
};
