import React from 'react';
import { Globe } from 'lucide-react';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';

const PUBLISH_TITLE = 'Pubblica nella Community';

const PUBLISH_MESSAGE =
  'Stai per pubblicare questo itinerario nella Community di TouringDiary. Dopo la pubblicazione sarà visibile agli altri utenti.\n\n' +
  'Al momento della pubblicazione riceverai i punti previsti dal sistema. Per questo motivo l\'operazione è definitiva: non potrai annullarla dall\'app.\n\n' +
  'Il team TouringDiary può verificare gli itinerari pubblicati. Se un contenuto non rispetta le linee guida della piattaforma — ad esempio creato esclusivamente per ottenere punti, incompleto, non coerente o inappropriato — potremo rimuoverlo dalla Community e, se necessario, revocare i punti assegnati.';

export interface PublishCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPublishing?: boolean;
}

export const PublishCommunityModal: React.FC<PublishCommunityModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isPublishing = false,
}) => (
  <DeleteConfirmationModal
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title={PUBLISH_TITLE}
    message={PUBLISH_MESSAGE}
    isDeleting={isPublishing}
    confirmLabel="Pubblica definitivamente"
    cancelLabel="Annulla"
    variant="warning"
    confirmClassName="bg-emerald-600 hover:bg-emerald-500"
    loadingLabel="Pubblicazione..."
    icon={<Globe className="w-8 h-8 text-emerald-400" />}
  />
);
