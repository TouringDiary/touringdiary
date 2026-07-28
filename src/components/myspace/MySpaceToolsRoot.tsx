import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Briefcase, Copy, FileStack, Loader2, Plus } from 'lucide-react';
import type { Itinerary } from '@/types/index';
import type { Suitcase } from '@/types/suitcase';
import { fetchUserSuitcasesAsync } from '@/services/suitcase/suitcaseCoreService';
import { fetchUserOwnedTemplatesAsync } from '@/services/suitcase/suitcaseTemplateService';
import {
  listAllPersonalDiaries,
  createDiaryWithAssociation,
  createSuitcaseWithAssociation,
} from '@/services/viaggio/resourceAssociationService';
import { duplicatePersonalDiary } from '@/services/collaboration/personalShareService';
import { useModal } from '@/context/ModalContext';
import { useItinerary } from '@/context/ItineraryContext';
import { showGlobalAlert } from '@/services/ui/toastService';
import { CreateDiaryModal } from './CreateDiaryModal';
import { CreateSuitcaseModal } from './CreateSuitcaseModal';

interface Props {
  userId: string;
  onBeforeLeaveMySpace?: () => void;
}

/**
 * Root Strumenti — Diari, valigie e template autonomi (DOC 35 §9), indipendenti dai Viaggi.
 */
export const MySpaceToolsRoot: React.FC<Props> = ({ userId, onBeforeLeaveMySpace }) => {
  const { openModal, closeModal } = useModal();
  const { loadProject } = useItinerary();
  const [diaries, setDiaries] = useState<Itinerary[]>([]);
  const [suitcases, setSuitcases] = useState<Suitcase[]>([]);
  const [templates, setTemplates] = useState<Suitcase[]>([]);
  const [loading, setLoading] = useState(true);
  /** Operazione in corso: azioni indipendenti non si bloccano a vicenda. */
  const [busyOp, setBusyOp] = useState<'create-diary' | 'create-suitcase' | `duplicate:${string}` | null>(
    null,
  );
  const [createDiaryOpen, setCreateDiaryOpen] = useState(false);
  const [createSuitcaseOpen, setCreateSuitcaseOpen] = useState(false);
  const loadSeqRef = useRef(0);

  const reload = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    setLoading(true);
    try {
      const [ownedDiaries, owned, ownedTemplates] = await Promise.all([
        listAllPersonalDiaries(userId),
        fetchUserSuitcasesAsync(userId),
        fetchUserOwnedTemplatesAsync(userId),
      ]);
      if (seq !== loadSeqRef.current) return;
      setDiaries(ownedDiaries);
      const permanent = owned.filter((s) => !s.is_user_template);
      setSuitcases(permanent);
      setTemplates(ownedTemplates);
    } catch (e) {
      console.error('[MySpaceToolsRoot] load failed', e);
      showGlobalAlert('Non è stato possibile caricare gli strumenti.');
      if (seq === loadSeqRef.current) {
        setDiaries([]);
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

  const openDiary = useCallback(
    (diary: Itinerary) => {
      onBeforeLeaveMySpace?.();
      loadProject(diary);
      closeModal();
    },
    [closeModal, loadProject, onBeforeLeaveMySpace],
  );

  const handleCreateDiary = async ({
    input,
  }: {
    input: Parameters<typeof createDiaryWithAssociation>[0];
  }) => {
    if (busyOp === 'create-diary') return;
    setBusyOp('create-diary');
    try {
      const created = await createDiaryWithAssociation(input);
      setCreateDiaryOpen(false);
      await reload();
      openDiary(created);
    } catch (e) {
      console.error('[MySpaceToolsRoot] create diary failed', e);
      showGlobalAlert('Creazione diario non riuscita.');
    } finally {
      setBusyOp(null);
    }
  };

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

  const handleDuplicateDiary = async (diaryId: string) => {
    const op = `duplicate:${diaryId}` as const;
    if (busyOp === op) return;
    setBusyOp(op);
    try {
      const dup = await duplicatePersonalDiary(diaryId, userId);
      if (dup.success === false) throw new Error(dup.error);
      await reload();
    } catch (e) {
      console.error('[MySpaceToolsRoot] duplicate diary failed', e);
      showGlobalAlert('Duplicazione diario non riuscita.');
    } finally {
      setBusyOp(null);
    }
  };

  const diaryCount = useMemo(() => diaries.length, [diaries]);
  const suitcaseCount = useMemo(() => suitcases.length, [suitcases]);
  const templateCount = useMemo(() => templates.length, [templates]);

  if (loading) {
    return (
      <div
        className="flex-1 min-h-0 flex items-center justify-center gap-2 text-slate-500 text-sm"
        data-testid="myspace-section-tools"
        role="tabpanel"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Caricamento strumenti...
      </div>
    );
  }

  return (
    <div
      className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-6"
      data-testid="myspace-section-tools"
      role="tabpanel"
      aria-label="Strumenti"
    >
      <p className="text-[11px] text-slate-500">
        Diari, valigie e template permanenti — apri lo strumento direttamente da qui.
      </p>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-300" aria-hidden />
            Diari ({diaryCount})
          </h2>
          <button
            type="button"
            onClick={() => setCreateDiaryOpen(true)}
            disabled={busyOp === 'create-diary'}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50"
            data-testid="myspace-tools-create-diary"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden />
            Nuovo
          </button>
        </div>
        {diaries.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">Nessun diario personale.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {diaries.map((d) => (
              <li key={d.id} className="relative">
                <button
                  type="button"
                  onClick={() => openDiary(d)}
                  className="w-full text-left rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5 hover:border-amber-500/40 hover:bg-slate-900 transition-colors pr-10"
                  data-testid={`myspace-tools-diary-${d.id}`}
                >
                  <span className="block text-sm font-semibold text-white truncate">
                    {d.name || 'Diario'}
                  </span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">Apri strumento</span>
                </button>
                {d.id && (
                  <button
                    type="button"
                    disabled={busyOp === `duplicate:${d.id}`}
                    onClick={() => void handleDuplicateDiary(d.id!)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg text-slate-500 hover:text-indigo-300 hover:bg-slate-800 disabled:opacity-50"
                    aria-label="Duplica diario"
                    title="Duplica"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-300" aria-hidden />
            Valigie ({suitcaseCount})
          </h2>
          <button
            type="button"
            onClick={() => setCreateSuitcaseOpen(true)}
            disabled={busyOp === 'create-suitcase'}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50"
            data-testid="myspace-tools-create-suitcase"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden />
            Nuova
          </button>
        </div>
        {suitcases.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">Nessuna valigia permanente.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {suitcases.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => openPacking({ suitcaseId: s.id })}
                  className="w-full text-left rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5 hover:border-indigo-500/40 hover:bg-slate-900 transition-colors"
                  data-testid={`myspace-tools-suitcase-${s.id}`}
                >
                  <span className="block text-sm font-semibold text-white truncate">
                    {s.title || 'Valigia'}
                  </span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">Apri strumento</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FileStack className="w-4 h-4 text-violet-300" aria-hidden />
            Template ({templateCount})
          </h2>
          <button
            type="button"
            onClick={() => openPacking({ initialAction: 'create-template' })}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-800"
            data-testid="myspace-tools-create-template"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden />
            Nuovo
          </button>
        </div>
        {templates.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">Nessun template personale.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {templates.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => openPacking({ suitcaseId: t.id })}
                  className="w-full text-left rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5 hover:border-violet-500/40 hover:bg-slate-900 transition-colors"
                  data-testid={`myspace-tools-template-${t.id}`}
                >
                  <span className="block text-sm font-semibold text-white truncate">
                    {t.title || 'Template'}
                  </span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">Apri template</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <CreateDiaryModal
        isOpen={createDiaryOpen}
        onClose={() => busyOp !== 'create-diary' && setCreateDiaryOpen(false)}
        onConfirm={handleCreateDiary}
        userId={userId}
        context="tools"
        busy={busyOp === 'create-diary'}
      />

      <CreateSuitcaseModal
        isOpen={createSuitcaseOpen}
        onClose={() => busyOp !== 'create-suitcase' && setCreateSuitcaseOpen(false)}
        onConfirm={handleCreateSuitcase}
        userId={userId}
        context="tools"
        busy={busyOp === 'create-suitcase'}
      />
    </div>
  );
};
