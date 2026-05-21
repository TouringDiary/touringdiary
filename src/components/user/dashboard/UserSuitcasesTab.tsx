import React, { useEffect, useState } from 'react';
import { Briefcase, Copy, Edit2, Trash2, Loader2 } from 'lucide-react';
import { useUserTemplates, useCloneSuitcase, useCreateSuitcase, deleteSuitcase } from '@/hooks/useSuitcaseSystem';
import { User } from '@/types';
import { Suitcase } from '@/types/suitcase';
import { useModal } from '@/context/ModalContext';
import { DeleteConfirmationModal } from '../../common/DeleteConfirmationModal';

interface Props {
  user: User;
}

export const UserSuitcasesTab: React.FC<Props> = ({ user }) => {
  const { templates, isLoading, fetchTemplates } = useUserTemplates(user.id);
  const { openModal } = useModal();
  const { cloneSuitcase, isCloning } = useCloneSuitcase();
  const { createSuitcase, isCreating } = useCreateSuitcase();
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // FIX: fetch on mount — previously fetchTemplates was never called,
  // causing the tab to show empty until a manual trigger occurred.
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // ACTIONS
  const handleEdit = (templateId: string) => {
    openModal('packingList', { suitcaseId: templateId });
  };

  const handleDuplicate = async (template: Suitcase) => {
    try {
      const newId = await cloneSuitcase(template.id, null, user.id, `${template.title} (Copia)`);
      if (newId) {
        fetchTemplates();
        // Opzionale: apri subito l'editor per la copia
        // handleEdit(newId);
      }
    } catch (e) {
      console.error("Errore durante la duplicazione:", e);
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

  const handleCreateNew = async () => {
    try {
      const newSc = await createSuitcase(null, user.id, "Nuovo Modello", "🧳");
      if (newSc && newSc.id) {
        fetchTemplates();
        handleEdit(newSc.id); // Apri subito l'editor
      }
    } catch (e) {
      console.error("Errore durante la creazione:", e);
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
            <h2 className="text-xl font-bold text-white tracking-wide">Le mie Valigie</h2>
            <p className="text-sm text-slate-400">Gestisci i tuoi modelli di viaggio e riutilizzali.</p>
          </div>
        </div>
        <button 
          onClick={handleCreateNew}
          disabled={isCreating}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold py-2 px-4 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : '+ Nuovo Modello'}
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
                  disabled={isCloning}
                  className="p-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-600 disabled:opacity-50" 
                  title="Duplica"
                >
                  {isCloning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
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

      {/* CONFIRMATION MODAL */}
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
