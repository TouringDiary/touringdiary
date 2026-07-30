import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Briefcase, FileStack, Loader2, List, Plus, Trash2 } from 'lucide-react';
import type { Suitcase } from '@/types/suitcase';
import {
  fetchUserSuitcasesAsync,
  deleteSuitcaseAsync,
} from '@/services/suitcase/suitcaseCoreService';
import { fetchUserOwnedTemplatesAsync } from '@/services/suitcase/suitcaseTemplateService';
import { createSuitcaseWithAssociation } from '@/services/viaggio/resourceAssociationService';
import { useModal } from '@/context/ModalContext';
import { useItinerary } from '@/context/ItineraryContext';
import { showGlobalAlert } from '@/services/ui/toastService';
import { CreateSuitcaseModal } from './CreateSuitcaseModal';
import { SuitcaseDiariesModal } from './SuitcaseDiariesModal';
import { MySpaceSectionHeader } from './MySpaceSectionHeader';
import { SwipeToDelete } from '@/components/common/SwipeToDelete';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { useMyWorldStyles } from '@/hooks/useMyWorldStyles';
import { MYWORLD_STYLE_KEYS } from '@/data/system/myWorldSettingsCatalog';
import type { Itinerary } from '@/types/index';

interface Props {
  userId: string;
  onBeforeLeaveMySpace?: () => void;
}

/**
 * Root Valigia — Valigie e template affiancati (DOC 35 §9; id tecnico root `tools`).
 */
export const MySpaceToolsRoot: React.FC<Props> = ({ userId, onBeforeLeaveMySpace }) => {
  const { openModal, closeModal } = useModal();
  const { loadProject } = useItinerary();
  const panelClass = useMyWorldStyles(MYWORLD_STYLE_KEYS.sectionPanel);
  const panelHeaderClass = useMyWorldStyles(MYWORLD_STYLE_KEYS.panelHeader);
  const chromeBtnClass = useMyWorldStyles(MYWORLD_STYLE_KEYS.chromeBtn);
  const listTitleClass = useMyWorldStyles(MYWORLD_STYLE_KEYS.listTitle);
  const listMetaClass = useMyWorldStyles(MYWORLD_STYLE_KEYS.listMeta);
  const listRowClass = useMyWorldStyles(MYWORLD_STYLE_KEYS.listRow);

  const [suitcases, setSuitcases] = useState<Suitcase[]>([]);
  const [templates, setTemplates] = useState<Suitcase[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyOp, setBusyOp] = useState<'create-suitcase' | null>(null);
  const [createSuitcaseOpen, setCreateSuitcaseOpen] = useState(false);
  const [diariesModal, setDiariesModal] = useState<{ id: string; title: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Suitcase | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const loadSeqRef = useRef(0);

  const reload = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    setLoading(true);
    try {
      const [owned, ownedTemplates] = await Promise.all([
        fetchUserSuitcasesAsync(userId),
        fetchUserOwnedTemplatesAsync(userId),
      ]);
      if (seq !== loadSeqRef.current) return;
      const permanent = owned.filter((s) => !s.is_user_template);
      setSuitcases(permanent);
      setTemplates(ownedTemplates);
    } catch (e) {
      console.error('[MySpaceToolsRoot] load failed', e);
      showGlobalAlert('Non è stato possibile caricare le valigie.');
      if (seq === loadSeqRef.current) {
        setSuitcases([]);
        setTemplates([]);
      }
    } finally {
      if (seq === loadSeqRef.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const openPacking = useCallback(
    (opts?: { suitcaseId?: string | null; initialAction?: 'create-suitcase' | 'create-template' }) => {
      onBeforeLeaveMySpace?.();
      openModal('packingList', {
        itineraryId: null,
        suitcaseId: opts?.suitcaseId ?? null,
        initialAction: opts?.initialAction ?? null,
        returnTo: 'mySpace',
      });
    },
    [openModal, onBeforeLeaveMySpace],
  );

  const handleCreateSuitcase = async ({
    input,
  }: {
    input: Parameters<typeof createSuitcaseWithAssociation>[0];
  }) => {
    if (busyOp === 'create-suitcase') return;
    setBusyOp('create-suitcase');
    try {
      const { suitcaseId } = await createSuitcaseWithAssociation(input);
      setCreateSuitcaseOpen(false);
      await reload();
      openPacking({ suitcaseId });
    } catch (e) {
      console.error('[MySpaceToolsRoot] create suitcase failed', e);
      showGlobalAlert('Creazione valigia non riuscita.');
    } finally {
      setBusyOp(null);
    }
  };

  const handleOpenDiaryFromSuitcase = (diary: Itinerary) => {
    setDiariesModal(null);
    onBeforeLeaveMySpace?.();
    loadProject(diary);
    closeModal();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteSuitcaseAsync(deleteTarget.id);
      setDeleteTarget(null);
      await reload();
    } catch (e) {
      console.error('[MySpaceToolsRoot] delete suitcase failed', e);
      showGlobalAlert('Eliminazione valigia non riuscita.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div
        className="flex-1 min-h-0 flex items-center justify-center gap-2 text-slate-500 text-sm"
        data-testid="myspace-section-tools"
        role="tabpanel"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Caricamento valigie...
      </div>
    );
  }

  return (
    <div
      className="flex-1 min-h-0 overflow-hidden flex flex-col p-3 sm:p-4"
      data-testid="myspace-section-tools"
      role="tabpanel"
      aria-label="Valigia"
    >
      <MySpaceSectionHeader
        icon={Briefcase}
        title="Valigia"
        description="Le tue valigie e i template, pronti da aprire quando ti servono."
      />

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-3">
        <section className={panelClass} data-testid="myspace-tools-suitcases-panel">
          <div className={panelHeaderClass}>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-300" aria-hidden />
              Valigie ({suitcases.length})
            </h2>
            <button
              type="button"
              onClick={() => setCreateSuitcaseOpen(true)}
              disabled={busyOp === 'create-suitcase'}
              className={chromeBtnClass}
              data-testid="myspace-tools-create-suitcase"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden />
              Nuova
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar p-2">
            {suitcases.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Nessuna valigia permanente.</p>
            ) : (
              <ul className="space-y-2">
                {suitcases.map((s) => {
                  const rowContent = (
                    <div className={listRowClass}>
                      <button
                        type="button"
                        onClick={() => openPacking({ suitcaseId: s.id })}
                        className="flex-1 min-w-0 text-left px-3 py-2.5 hover:bg-slate-900 transition-colors"
                        data-testid={`myspace-tools-suitcase-${s.id}`}
                      >
                        <span className={listTitleClass}>{s.title || 'Valigia'}</span>
                        <span className={listMetaClass}>Apri valigia</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiariesModal({ id: s.id, title: s.title || 'Valigia' })}
                        className="shrink-0 px-2.5 border-l border-slate-800 text-slate-400 hover:text-indigo-300 hover:bg-slate-800/60 transition-colors"
                        aria-label={`Diari collegati a ${s.title || 'Valigia'}`}
                        title="Diari collegati"
                        data-testid={`myspace-tools-suitcase-diaries-${s.id}`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(s);
                        }}
                        className="hidden lg:inline-flex self-center shrink-0 p-1.5 mr-1 rounded-lg text-slate-500 hover:text-rose-300 hover:bg-slate-800/80"
                        aria-label={`Elimina ${s.title || 'valigia'}`}
                        title="Elimina valigia"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );

                  return (
                    <li key={s.id}>
                      <SwipeToDelete
                        onDelete={() => setDeleteTarget(s)}
                        className="rounded-xl"
                        revealClassName="inset-y-[10%] rounded-xl"
                      >
                        {rowContent}
                      </SwipeToDelete>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section className={panelClass} data-testid="myspace-tools-templates-panel">
          <div className={panelHeaderClass}>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileStack className="w-4 h-4 text-violet-300" aria-hidden />
              Template ({templates.length})
            </h2>
            <button
              type="button"
              onClick={() => openPacking({ initialAction: 'create-template' })}
              className={chromeBtnClass}
              data-testid="myspace-tools-create-template"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden />
              Nuovo
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar p-2">
            {templates.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Nessun template personale.</p>
            ) : (
              <ul className="space-y-2">
                {templates.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => openPacking({ suitcaseId: t.id })}
                      className={`w-full text-left ${listRowClass} px-3 py-2.5 hover:border-violet-500/40 hover:bg-slate-900 transition-colors`}
                      data-testid={`myspace-tools-template-${t.id}`}
                    >
                      <span className={listTitleClass}>{t.title || 'Template'}</span>
                      <span className={listMetaClass}>Apri template</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <CreateSuitcaseModal
        isOpen={createSuitcaseOpen}
        onClose={() => busyOp !== 'create-suitcase' && setCreateSuitcaseOpen(false)}
        onConfirm={handleCreateSuitcase}
        userId={userId}
        context="tools"
        busy={busyOp === 'create-suitcase'}
      />

      {diariesModal && (
        <SuitcaseDiariesModal
          suitcaseId={diariesModal.id}
          suitcaseTitle={diariesModal.title}
          onClose={() => setDiariesModal(null)}
          onOpenDiary={handleOpenDiaryFromSuitcase}
        />
      )}

      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
        title="Elimina Valigia"
        message={`Vuoi eliminare definitivamente «${deleteTarget?.title || 'Valigia'}»? L'operazione non è reversibile.`}
        isDeleting={isDeleting}
        confirmLabel="Elimina"
      />
    </div>
  );
};
