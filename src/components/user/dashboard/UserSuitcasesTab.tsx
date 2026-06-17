import React, { useEffect, useState } from 'react';

import { Briefcase, Copy, Edit2, Trash2, Loader2 } from 'lucide-react';

import { useUserTemplates, deleteSuitcase } from '@/hooks/useSuitcaseSystem';

import { duplicateSuitcaseEntityAsync } from '@/services/suitcaseService';

import { createWorkspaceFromConfiguration } from '@/hooks/suitcase/createWorkspaceFromConfiguration';

import { isUserTemplate } from '@/utils/suitcaseDomain';

import { User } from '@/types';

import { Suitcase, DraftWorkspaceKind } from '@/types/suitcase';

import { useModal } from '@/context/ModalContext';

import { DeleteConfirmationModal } from '../../common/DeleteConfirmationModal';

import {

  CategorySetupConfigurationModal,

  CategorySetupConfigurationResult,

} from '../../features/diary/packing_list/suitcase/CategorySetupConfigurationModal';



interface Props {

  user: User;

}



export const UserSuitcasesTab: React.FC<Props> = ({ user }) => {

  const { templates: allUserSuitcases, isLoading, fetchTemplates } = useUserTemplates(user.id);

  const templates = allUserSuitcases

    .filter(isUserTemplate)

    .sort(

      (a, b) =>

        new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime()

    );

  const { openModal } = useModal();

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [showCategorySetupModal, setShowCategorySetupModal] = useState(false);

  const [isCreating, setIsCreating] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);



  useEffect(() => {

    fetchTemplates();

  }, [fetchTemplates]);



  const handleEdit = (templateId: string) => {

    openModal('packingList', { suitcaseId: templateId });

  };



  const handleDuplicate = async (template: Suitcase) => {

    setDuplicatingId(template.id);

    try {

      const baseTitle = template.title.replace(/ \(Copia\)$/i, '');

      const newId = await duplicateSuitcaseEntityAsync(

        template.id,

        user.id,

        `${baseTitle} (Copia)`

      );

      if (newId) {

        fetchTemplates();

      }

    } catch (e) {

      console.error('Errore durante la duplicazione:', e);

    } finally {

      setDuplicatingId(null);

    }

  };



  const handleDelete = async () => {

    if (!deletingId) return;

    setIsDeleting(true);

    try {

      await deleteSuitcase(deletingId);

      setDeletingId(null);

      fetchTemplates();

    } catch (e) {

      console.error("Errore durante l'eliminazione:", e);

    } finally {

      setIsDeleting(false);

    }

  };



  const handleOpenCreateModal = () => {

    setShowCategorySetupModal(true);

  };



  const handleCancelCategorySetup = () => {

    setShowCategorySetupModal(false);

  };



  const handleConfirmCategorySetup = async (result: CategorySetupConfigurationResult) => {

    setIsCreating(true);

    try {

      const workspaceKind: DraftWorkspaceKind = 'user_template';

      const created = await createWorkspaceFromConfiguration({

        userId: user.id,

        title: 'Nuovo Template',

        icon: '🧳',

        workspaceKind,

        categorySetup: result.categorySetup,

        customCategories: result.customCategories,

        persistToDatabase: true,

      });



      if (created?.id) {

        setShowCategorySetupModal(false);

        fetchTemplates();

        handleEdit(created.id);

      }

    } catch (e) {

      console.error("Errore durante la creazione:", e);

    } finally {

      setIsCreating(false);

    }

  };



  if (isLoading) {

    return (

      <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">

        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />

        <p>Caricamento modelli...</p>

      </div>

    );

  }



  return (

    <div className="space-y-6 animate-in fade-in duration-300">

      <div className="flex justify-between items-center">

        <div className="flex items-center gap-3">

          <div className="p-2 bg-indigo-900/30 rounded-lg">

            <Briefcase className="w-6 h-6 text-indigo-400" />

          </div>

          <div>

            <h2 className="text-xl font-bold text-white tracking-wide">I miei Template</h2>

            <p className="text-sm text-slate-400">Gestisci i tuoi template personali e riutilizzali.</p>

          </div>

        </div>

        <button 

          onClick={handleOpenCreateModal}

          disabled={isCreating}

          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold py-2 px-4 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all flex items-center gap-2 disabled:opacity-50"

        >

          {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : '+ Nuovo Template'}

        </button>

      </div>



      {templates.length === 0 ? (

        <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800">

          <div className="text-4xl mb-4">🧳</div>

          <h3 className="text-lg font-bold text-white mb-2">Nessun modello salvato</h3>

          <p className="text-slate-400 text-sm max-w-sm mx-auto">

            Puoi salvare le tue valigie preferite dal Diario di Viaggio e ritrovarle qui per i prossimi viaggi.

          </p>

        </div>

      ) : (

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {templates.map(template => (

            <div key={template.id} className="group relative p-5 bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-800 hover:border-indigo-500/50 shadow-lg transition-all overflow-hidden flex flex-col">

              

              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl pointer-events-none transform translate-x-4 -translate-y-4">

                {template.icon}

              </div>



              <div className="flex items-center gap-3 mb-4 relative z-floating-panel">

                <span className="text-3xl drop-shadow-md">{template.icon}</span>

                <h3 className="text-lg font-bold text-white leading-tight">{template.title}</h3>

              </div>

              

              <div className="text-sm text-slate-400 mb-6 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50 self-start">

                {template.suitcase_items?.length || 0} oggetti configurati

              </div>

              

              <div className="mt-auto pt-4 border-t border-slate-800 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">

                <button 

                  onClick={() => handleEdit(template.id)}

                  className="flex-1 flex items-center justify-center gap-2 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-300 transition-colors"

                >

                  <Edit2 className="w-3.5 h-3.5" /> Modifica

                </button>

                <button 

                  onClick={() => handleDuplicate(template)}

                  disabled={duplicatingId === template.id}

                  className="p-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-600 disabled:opacity-50" 

                  title="Duplica"

                >

                  {duplicatingId === template.id ? (

                    <Loader2 className="w-4 h-4 animate-spin" />

                  ) : (

                    <Copy className="w-4 h-4" />

                  )}

                </button>

                <button 

                  onClick={() => setDeletingId(template.id)}

                  className="p-1.5 px-2 bg-slate-800 hover:bg-red-900/30 rounded-lg text-slate-400 hover:text-red-400 transition-colors border border-transparent hover:border-red-900/50" 

                  title="Elimina"

                >

                  <Trash2 className="w-4 h-4" />

                </button>

              </div>

            </div>

          ))}

        </div>

      )}



      <CategorySetupConfigurationModal

        isOpen={showCategorySetupModal}

        title="Nuovo Template"

        isSubmitting={isCreating}

        onConfirm={handleConfirmCategorySetup}

        onClose={handleCancelCategorySetup}

      />



      <DeleteConfirmationModal 

        isOpen={!!deletingId}

        onClose={() => setDeletingId(null)}

        onConfirm={handleDelete}

        title="Elimina Modello"

        message="Sei sicuro di voler eliminare questo modello di valigia? L'azione non è reversibile."

        isDeleting={isDeleting}

      />

    </div>

  );

};

