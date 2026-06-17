import React from 'react';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { ItemDeleteConfirmationModal } from '../../suitcase/ItemDeleteConfirmationModal';
import { AssociationConfirmationModal } from '../../suitcase/AssociationConfirmationModal';
import { LinkSuitcaseModal } from '../../suitcase/LinkSuitcaseModal';
import { LinkModalVariant } from '@/utils/suitcaseAssociation';
import { BlacklistModal } from '../../suitcase/BlacklistModal';
import { SuitcaseItem } from '@/types/suitcase';

interface ModalsProps {
  modalState: any;
  itineraryId: string | null;
  actions: any;
  itemActions: any;
  handleConfirmAssociation: () => Promise<void>;
  handleSaveOnly: () => Promise<void>;
  handleCancelAssociation: () => void;
  isGuest?: boolean;
  isDiaryAssociable?: boolean;
  onLogin?: () => void;
  blacklistItems?: any[];
  isFetchingBlacklist?: boolean;
  linkModalOpen?: boolean;
  linkModalVariant?: LinkModalVariant;
  isAssociating?: boolean;
  defaultDiaryName?: string;
  defaultSuitcaseName?: string;
  onLinkModalConfirm?: (values: { diaryName?: string; suitcaseName?: string }) => void;
  onLinkModalCancel?: () => void;
  onConfirmWorkspacePause?: () => void;
  onCancelWorkspacePause?: () => void;
  isTemplateDraftSession?: boolean;
  onConfirmAssociateSaved?: () => void;
}

export const SuitcaseModals: React.FC<ModalsProps> = ({
  modalState,
  itineraryId,
  actions,
  itemActions,
  handleConfirmAssociation,
  handleSaveOnly,
  handleCancelAssociation,
  isGuest,
  isDiaryAssociable,
  onLogin,
  blacklistItems = [],
  isFetchingBlacklist = false,
  linkModalOpen = false,
  linkModalVariant = 'both',
  isAssociating = false,
  defaultDiaryName = '',
  defaultSuitcaseName = '',
  onLinkModalConfirm,
  onLinkModalCancel,
  onConfirmWorkspacePause,
  onCancelWorkspacePause,
  isTemplateDraftSession = false,
  onConfirmAssociateSaved,
}) => {
  useGlobalModalEscape(
    modalState.showPauseWorkspaceModal === true,
    () => onCancelWorkspacePause?.()
  );

  return (
    <>
      <DeleteConfirmationModal
        isOpen={modalState.suitcaseToAssociate !== null}
        title="Associare questa valigia al Diario?"
        message={
          'La valigia verrà spostata nella sezione Diario.\n\n' +
          'Se desideri riutilizzarla in futuro per più viaggi, è consigliabile trasformarla in un Template.'
        }
        confirmLabel="Associa al diario"
        cancelLabel="Annulla"
        variant="info"
        isDeleting={isAssociating}
        loadingLabel="Associazione..."
        onConfirm={() => onConfirmAssociateSaved?.()}
        onClose={() => {
          if (isAssociating) return;
          modalState.setSuitcaseToAssociate(null);
        }}
      />

      <DeleteConfirmationModal
        isOpen={modalState.showPauseWorkspaceModal}
        title="Mettere in pausa la valigia?"
        message={
          'La valigia verrà messa in pausa.\n\n' +
          'Potrai riprendere le modifiche successivamente da questo dispositivo.\n\n' +
          'Ti consigliamo di salvare la valigia prima di chiudere o cambiare la sessione per non perdere il lavoro svolto.'
        }
        confirmLabel="Metti in pausa"
        cancelLabel="Annulla"
        variant="info"
        onConfirm={() => onConfirmWorkspacePause?.()}
        onClose={() => onCancelWorkspacePause?.()}
      />

      <DeleteConfirmationModal
        isOpen={modalState.showDraftOverwriteModal}
        title="Sostituire la valigia in pausa?"
        message={'Hai già una valigia in pausa.\n\nVuoi eliminarla e crearne una nuova?'}
        confirmLabel="Sostituisci"
        variant="warning"
        onConfirm={actions.handleConfirmDraftOverwrite}
        onClose={() => {
          modalState.setShowDraftOverwriteModal(false);
          modalState.setDraftOverwriteIntent(null);
        }}
      />

      <DeleteConfirmationModal
        isOpen={modalState.suitcaseToDelete !== null || modalState.suitcaseToUnlink !== null}
        title={modalState.suitcaseToUnlink ? "Scollega dal diario?" : "Elimina Definitivamente"}
        message={modalState.suitcaseToUnlink
          ? "Sei sicuro di voler scollegare questa valigia dal diario di viaggio? Rimarrà comunque tra le tue valigie salvate."
          : "Sei sicuro di voler eliminare questa valigia? Verrà rimossa dal tuo profilo e non potrai più recuperarla."
        }
        confirmLabel={modalState.suitcaseToUnlink ? "Scollega" : "Elimina"}
        variant={modalState.suitcaseToUnlink ? "warning" : "danger"}
        onConfirm={modalState.suitcaseToUnlink ? actions.confirmUnlinkSuitcase : actions.confirmDeleteSuitcase}
        onClose={() => {
          modalState.setSuitcaseToDelete(null);
          modalState.setSuitcaseToUnlink(null);
        }}
        isDeleting={modalState.isDeleting}
      />

      <ItemDeleteConfirmationModal
        isOpen={modalState.itemToDelete !== null}
        itemName={modalState.itemToDelete?.name || ''}
        category={modalState.itemToDelete?.category || ''}
        isAiSuggestion={modalState.itemToDelete?.is_ai_suggestion}
        onClose={() => modalState.setItemToDelete(null)}
        onConfirm={async () => {
          if (modalState.itemToDelete) {
            await itemActions.handleDeleteItemConfirmed(modalState.itemToDelete);
            modalState.setItemToDelete(null);
          }
        }}
      />

      <DeleteConfirmationModal
        isOpen={modalState.categoryToDelete !== null}
        title="Elimina categoria?"
        message={
          modalState.categoryToDelete
            ? modalState.categoryToDelete.itemCount > 0
              ? `Vuoi eliminare la categoria '${modalState.categoryToDelete.name}'?\n\nVerranno rimossi ${modalState.categoryToDelete.itemCount} oggett${modalState.categoryToDelete.itemCount === 1 ? 'o' : 'i'}.`
              : `Vuoi eliminare la categoria '${modalState.categoryToDelete.name}'?\n\nLa sezione verrà rimossa dalla valigia.`
            : ''
        }
        confirmLabel="Elimina categoria"
        variant="danger"
        isDeleting={modalState.isDeleting}
        onConfirm={async () => {
          if (!modalState.categoryToDelete) return;
          modalState.setIsDeleting(true);
          try {
            await itemActions.handleDeleteCategoryConfirmed(modalState.categoryToDelete);
            modalState.setCategoryToDelete(null);
          } finally {
            modalState.setIsDeleting(false);
          }
        }}
        onClose={() => {
          if (modalState.isDeleting) return;
          modalState.setCategoryToDelete(null);
        }}
      />

      <LinkSuitcaseModal
        isOpen={linkModalOpen}
        variant={linkModalVariant}
        defaultDiaryName={defaultDiaryName}
        defaultSuitcaseName={defaultSuitcaseName}
        isSubmitting={isAssociating}
        onConfirm={(values) => onLinkModalConfirm?.(values)}
        onCancel={() => onLinkModalCancel?.()}
      />

      <AssociationConfirmationModal
        isOpen={modalState.showAssociationModal}
        title={
          isTemplateDraftSession
            ? 'Salva il template?'
            : itineraryId
              ? 'Associa al viaggio?'
              : 'Salva la valigia?'
        }
        message={
          isTemplateDraftSession
            ? 'Hai creato un nuovo template. Vuoi salvarlo tra i tuoi template personali?'
            : itineraryId
              ? 'Hai creato una nuova valigia. Vuoi associarla al diario di viaggio attualmente aperto?'
              : 'Hai creato una nuova valigia. Vuoi salvarla tra i tuoi elementi personali?'
        }
        hasActiveTrip={!!itineraryId}
        isTemplateDraft={isTemplateDraftSession}
        isLinking={isAssociating}
        onConfirm={handleConfirmAssociation}
        onClose={handleSaveOnly}
        onCancel={handleCancelAssociation}
        onDiscard={() => {
          actions.handleDiscardSuitcase();
          modalState.setShowAssociationModal(false);
        }}
        isGuest={isGuest}
        isDiaryAssociable={isDiaryAssociable}
        onLogin={onLogin}
      />

      <BlacklistModal
        isOpen={modalState.showBlacklistModal}
        onClose={() => modalState.setShowBlacklistModal(false)}
        items={blacklistItems}
        isFetching={isFetchingBlacklist}
        onRestore={itemActions.handleRestoreFromBlacklist}
        onRemove={itemActions.handleRemoveFromBlacklist}
      />
    </>
  );
};
