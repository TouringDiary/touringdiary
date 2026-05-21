import React from 'react';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { ItemDeleteConfirmationModal } from '../../suitcase/ItemDeleteConfirmationModal';
import { AssociationConfirmationModal } from '../../suitcase/AssociationConfirmationModal';
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
  isDiaryFull?: boolean;
  onLogin?: () => void;
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
  isDiaryFull,
  onLogin
}) => {
  return (
    <>
      <DeleteConfirmationModal
        isOpen={modalState.suitcaseToDelete !== null || modalState.suitcaseToUnlink !== null}
        title={modalState.suitcaseToUnlink ? "Rimuovi dal viaggio" : "Elimina Definitivamente"}
        message={modalState.suitcaseToUnlink
          ? "Sei sicuro di voler rimuovere questa valigia dal viaggio attuale? Rimarrà comunque tra le tue valigie salvate."
          : "Sei sicuro di voler eliminare questa valigia? Verrà rimossa dal tuo profilo e non potrai più recuperarla."
        }
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
        onClose={() => modalState.setItemToDelete(null)}
        onConfirm={async () => {
          if (modalState.itemToDelete) {
            await itemActions.handleDeleteItemConfirmed(modalState.itemToDelete);
            modalState.setItemToDelete(null);
          }
        }}
      />

      <AssociationConfirmationModal
        isOpen={modalState.showAssociationModal}
        title={itineraryId ? "Associa al viaggio?" : "Salva la valigia?"}
        message={itineraryId 
          ? "Hai creato una nuova valigia. Vuoi associarla al diario di viaggio attualmente aperto?"
          : "Hai creato una nuova valigia. Vuoi salvarla tra i tuoi elementi personali?"
        }
        hasActiveTrip={!!itineraryId}
        isLinking={modalState.isLinking}
        onConfirm={handleConfirmAssociation}
        onClose={handleSaveOnly}
        onCancel={handleCancelAssociation}
        onDiscard={() => {
          actions.handleDiscardSuitcase();
          modalState.setShowAssociationModal(false);
        }}
        isGuest={isGuest}
        isDiaryFull={isDiaryFull}
        onLogin={onLogin}
      />
    </>
  );
};
