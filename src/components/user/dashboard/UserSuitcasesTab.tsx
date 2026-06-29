import React, { useEffect, useState } from 'react';
import { Briefcase, LayoutTemplate, Calendar, PencilLine, Pencil, Copy, Trash2, Loader2 } from 'lucide-react';
import { useUserTemplates, deleteSuitcase } from '@/hooks/useSuitcaseSystem';
import { duplicateSuitcaseEntityAsync } from '@/services/suitcaseService';
import { isUserTemplate, isValigia } from '@/utils/suitcaseDomain';
import { formatItalianDateTime } from '@/utils/dateFormatters';
import { User } from '@/types';
import { Suitcase } from '@/types/suitcase';
import { useModal } from '@/context/ModalContext';
import { DeleteConfirmationModal } from '../../common/DeleteConfirmationModal';
import { SwipeToDelete } from '../../common/SwipeToDelete';
import {
  DashboardActionGroup,
  IconActionButton,
  ICON_ACTION_SLATE_CLASS,
  ICON_ACTION_INDIGO_CLASS,
  ICON_ACTION_DANGER_CLASS,
} from '../../features/diary/packing_list/suitcase/DashboardActionGroup';

interface Props {
  user: User;
}

type SuitcaseTab = 'valigie' | 'template';

const sortByUpdated = (a: Suitcase, b: Suitcase) =>
  new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime();

export const UserSuitcasesTab: React.FC<Props> = ({ user }) => {
  const { templates: allUserSuitcases, isLoading, fetchTemplates } = useUserTemplates(user.id);
  const { openModal } = useModal();

  const [activeTab, setActiveTab] = useState<SuitcaseTab>('valigie');

  // `filter` restituisce sempre un nuovo array, quindi `sort` opera su una copia
  // e non muta mai `allUserSuitcases` (array condiviso dell'hook).
  const valigie = allUserSuitcases.filter(isValigia).sort(sortByUpdated);
  const templates = allUserSuitcases.filter(isUserTemplate).sort(sortByUpdated);

  const [deletingEntity, setDeletingEntity] = useState<{ id: string; title: string; isTemplate: boolean } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Riusa la pipeline esistente: apre l'editor della valigia/template.
  const handleEdit = (id: string) => {
    openModal('packingList', { suitcaseId: id });
  };

  // Riusa la pipeline della Dashboard Valigia (nessuna logica nuova): avvio creazione all'apertura.
  const handleCreateSuitcase = () => {
    openModal('packingList', { initialAction: 'create-suitcase' });
  };

  const handleCreateTemplate = () => {
    openModal('packingList', { initialAction: 'create-template' });
  };

  const handleDuplicate = async (entity: Suitcase) => {
    setDuplicatingId(entity.id);
    try {
      const baseTitle = entity.title.replace(/ \(Copia\)$/i, '');
      const newId = await duplicateSuitcaseEntityAsync(entity.id, user.id, `${baseTitle} (Copia)`);
      if (newId) await fetchTemplates();
    } catch (e) {
      console.error('Errore durante la duplicazione:', e);
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingEntity) return;
    setIsDeleting(true);
    try {
      await deleteSuitcase(deletingEntity.id);
      setDeletingEntity(null);
      await fetchTemplates();
    } catch (e) {
      console.error("Errore durante l'eliminazione:", e);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderEntityCard = (entity: Suitcase) => {
    const isTemplate = isUserTemplate(entity);
    const titleHover = isTemplate ? 'group-hover:text-indigo-400' : 'group-hover:text-amber-400';
    const accentBorder = isTemplate ? 'hover:border-indigo-500/40' : 'hover:border-amber-500/40';
    const editTooltip = isTemplate ? 'Modifica Template' : 'Modifica Valigia';
    const duplicateTooltip = isTemplate ? 'Duplica Template' : 'Duplica Valigia';
    const deleteTooltip = isTemplate ? 'Elimina Template' : 'Elimina Valigia';

    return (
      // Mobile/tablet (< lg): swipe verso sinistra per eliminare (apre la conferma esistente).
      // Desktop: passthrough, l'eliminazione resta sul pulsante cestino.
      <SwipeToDelete
        key={entity.id}
        className="rounded-2xl"
        onDelete={() => setDeletingEntity({ id: entity.id, title: entity.title, isTemplate })}
      >
        <div
          className={`group flex flex-col sm:flex-row sm:items-center gap-2.5 lg:gap-4 p-3 lg:p-5 bg-slate-900/80 rounded-2xl border border-slate-800 ${accentBorder} transition-all`}
        >
          {/* INFO */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 lg:mb-3">
              <span className="text-2xl drop-shadow-md shrink-0">{entity.icon}</span>
              <h3 className={`text-lg font-bold text-white leading-tight truncate ${titleHover} transition-colors`}>
                {entity.title}
              </h3>
            </div>

            {/* Date incolonnate: icona (con tooltip) | valore */}
            <div className="grid grid-cols-[auto_auto] items-center gap-x-2.5 gap-y-1 lg:gap-y-1.5 w-fit pl-0.5">
              <span title="Data Creazione" className="flex items-center" aria-label="Data Creazione">
                <Calendar className="w-3.5 h-3.5 text-slate-500" aria-hidden />
              </span>
              <span className="text-xs text-slate-300 font-medium tabular-nums">
                {entity.created_at ? formatItalianDateTime(entity.created_at) : '—'}
              </span>

              <span title="Data Modifica" className="flex items-center" aria-label="Data Modifica">
                <PencilLine className="w-3.5 h-3.5 text-slate-500" aria-hidden />
              </span>
              <span className="text-xs text-slate-300 font-medium tabular-nums">
                {entity.updated_at ? formatItalianDateTime(entity.updated_at) : '—'}
              </span>
            </div>
          </div>

          {/* AZIONI (sinistra → destra: Modifica, Duplica, Elimina) */}
          <div className="flex items-center justify-end gap-2 shrink-0">
            <IconActionButton
              label={editTooltip}
              icon={Pencil}
              className={ICON_ACTION_SLATE_CLASS}
              onClick={() => handleEdit(entity.id)}
            />
            <IconActionButton
              label={duplicateTooltip}
              icon={Copy}
              className={ICON_ACTION_INDIGO_CLASS}
              loading={duplicatingId === entity.id}
              onClick={() => handleDuplicate(entity)}
            />
            {/* Cestino solo desktop (>= lg): su mobile/tablet si usa lo swipe */}
            <div className="hidden lg:block">
              <IconActionButton
                label={deleteTooltip}
                icon={Trash2}
                className={ICON_ACTION_DANGER_CLASS}
                onClick={() => setDeletingEntity({ id: entity.id, title: entity.title, isTemplate })}
              />
            </div>
          </div>
        </div>
      </SwipeToDelete>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p>Caricamento valigie...</p>
      </div>
    );
  }

  const list = activeTab === 'valigie' ? valigie : templates;
  const emptyState =
    activeTab === 'valigie'
      ? {
          icon: '🎒',
          text: 'Non hai ancora valigie personali. Crea la tua prima valigia per organizzare cosa portare in viaggio.',
        }
      : {
          icon: '🧳',
          text: 'Nessun template salvato. Crea un template riutilizzabile per velocizzare la preparazione dei prossimi viaggi.',
        };

  const tabBtnClass = (tab: SuitcaseTab) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
      activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER + CREATE BUTTONS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Le mie Valigie</h2>
            <p className="text-sm text-slate-400">Gestisci le tue valigie e i tuoi template di viaggio.</p>
          </div>
        </div>
        {/* Pulsanti di creazione: riuso diretto del componente della Dashboard Valigia */}
        <DashboardActionGroup
          isCreating={false}
          onCreateSuitcase={handleCreateSuitcase}
          onCreateTemplate={handleCreateTemplate}
        />
      </div>

      {/* TABS: VALIGIE / TEMPLATE */}
      <div className="inline-flex items-center gap-1 p-1 bg-slate-900/70 border border-slate-800 rounded-xl">
        <button onClick={() => setActiveTab('valigie')} className={tabBtnClass('valigie')}>
          <Briefcase className="w-4 h-4" /> Valigie
          <span className="text-[10px] opacity-70">({valigie.length})</span>
        </button>
        <button onClick={() => setActiveTab('template')} className={tabBtnClass('template')}>
          <LayoutTemplate className="w-4 h-4" /> Template
          <span className="text-[10px] opacity-70">({templates.length})</span>
        </button>
      </div>

      {/* LISTA TAB ATTIVA */}
      {list.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800 border-dashed">
          <div className="text-3xl mb-2">{emptyState.icon}</div>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">{emptyState.text}</p>
        </div>
      ) : (
        <div className="space-y-3 animate-in fade-in duration-200">{list.map(renderEntityCard)}</div>
      )}

      <DeleteConfirmationModal
        isOpen={!!deletingEntity}
        onClose={() => setDeletingEntity(null)}
        onConfirm={handleConfirmDelete}
        title={deletingEntity?.isTemplate ? 'Elimina Template' : 'Elimina Valigia'}
        message={`Sei sicuro di voler eliminare "${deletingEntity?.title}"? L'azione non è reversibile.`}
        isDeleting={isDeleting}
        variant="danger"
      />
    </div>
  );
};
