import React from 'react';
import { SponsorRequest, SponsorTier, SponsorStatus } from '../../../types';
import { DeleteConfirmationModal } from '../../common/DeleteConfirmationModal';
import { Sparkles, XCircle, AlertTriangle, CalendarPlus, CheckCircle, RotateCcw } from 'lucide-react';

interface ActivationData {
    id: string;
    name: string;
    pricingId: string;
    amount: number;
}

interface RejectData {
    id: string;
    name: string;
    reason: string;
}

interface CancelData {
    id: string;
    name: string;
    reason: string;
}

interface ExtensionData {
    isOpen: boolean;
    mode: 'single' | 'mass';
    sponsorId?: string;
    currentExpirationDate?: string;
    days: number;
}

interface SponsorModalsProps {
    activationData: ActivationData | null;
    rejectData: RejectData | null;
    cancelData: CancelData | null;
    approvalData: { id: string, name: string } | null;
    resetData: { id: string, name: string } | null;
    extensionData: ExtensionData;
    actions: {
        closeActivation: () => void;
        closeReject: () => void;
        updateRejectReason: (reason: string) => void;
        closeCancel: () => void;
        updateCancelReason: (reason: string) => void;
        closeApproval: () => void;
        closeReset: () => void;
        closeExtension: () => void;
        setExtensionDays: (days: number) => void;
    };
    onConfirmActivation: (id: string, pricingId: string, amount: number) => void;
    onConfirmReject: (id: string, reason: string) => void;
    onConfirmCancel: (id: string, reason: string) => void;
    onConfirmApproval: (id: string) => void;
    onConfirmReset: (id: string) => void;
    onConfirmExtension: (data: ExtensionData) => void;
}

export const SponsorModals: React.FC<SponsorModalsProps> = ({
    activationData,
    rejectData,
    cancelData,
    approvalData,
    resetData,
    extensionData,
    actions,
    onConfirmActivation,
    onConfirmReject,
    onConfirmCancel,
    onConfirmApproval,
    onConfirmReset,
    onConfirmExtension,
}) => {
    return (
        <>
            {/* 1. Activation Modal */}
            <DeleteConfirmationModal
                isOpen={!!activationData}
                onClose={actions.closeActivation}
                onConfirm={() => onConfirmActivation(activationData!.id, activationData!.pricingId, activationData!.amount)}
                title="Registra Incasso e Attiva Sponsor"
                message={`Stai per attivare la sponsorizzazione per ${activationData?.name}. Il piano, la durata e le date verranno impostate automaticamente. L'azione è irreversibile.`}
                confirmText="Conferma e Attiva"
                isDeleting={false}
                icon={<Sparkles className="w-8 h-8 text-emerald-500" />}
            />

            {/* 2. Rejection Modal */}
            <DeleteConfirmationModal
                isOpen={!!rejectData}
                onClose={actions.closeReject}
                onConfirm={() => onConfirmReject(rejectData!.id, rejectData!.reason)}
                title="Rifiuta Richiesta Sponsor"
                message={`Stai per rifiutare la richiesta di ${rejectData?.name}. Inserisci una motivazione per uso interno (opzionale).`}
                confirmText="Conferma Rifiuto"
                isDeleting={false}
                icon={<XCircle className="w-8 h-8 text-red-500" />}
            >
                <textarea
                    value={rejectData?.reason}
                    onChange={(e) => actions.updateRejectReason(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-sm mt-4 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    placeholder="Motivazione del rifiuto..."
                />
            </DeleteConfirmationModal>

            {/* 3. Cancellation Modal */}
            <DeleteConfirmationModal
                isOpen={!!cancelData}
                onClose={actions.closeCancel}
                onConfirm={() => onConfirmCancel(cancelData!.id, cancelData!.reason)}
                title="Annulla Sponsorizzazione"
                message={`Stai per annullare la sponsorizzazione attiva di ${cancelData?.name}. L'azione è irreversibile e lo sponsor non sarà più visibile.`}
                confirmText="Conferma Annullamento"
                isDeleting={false}
                icon={<AlertTriangle className="w-8 h-8 text-amber-500" />}
            >
                <textarea
                    value={cancelData?.reason}
                    onChange={(e) => actions.updateCancelReason(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-sm mt-4 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    placeholder="Motivazione dell'annullamento..."
                />
            </DeleteConfirmationModal>

            {/* 4. Approval Modal (senza attivazione) */}
            <DeleteConfirmationModal
                isOpen={!!approvalData}
                onClose={actions.closeApproval}
                onConfirm={() => onConfirmApproval(approvalData!.id)}
                title="Approva Richiesta (Senza Attivazione)"
                message={`Approva la richiesta per ${approvalData?.name} senza attivare la subscription. Lo stato diventerà 'approved' e potrà essere attivato in seguito (es. tramite bottega).`}
                confirmText="Sì, Approva"
                isDeleting={false}
                icon={<CheckCircle className="w-8 h-8 text-blue-500" />}
            />

            {/* 5. Reset Modal */}
            <DeleteConfirmationModal
                isOpen={!!resetData}
                onClose={actions.closeReset}
                onConfirm={() => onConfirmReset(resetData!.id)}
                title="Resetta a 'In Attesa'"
                message={`Resetta lo stato di ${resetData?.name} a 'pending' (in attesa). Utile per correggere errori di approvazione o rifiuto.`}
                confirmText="Sì, Resetta Stato"
                isDeleting={false}
                icon={<RotateCcw className="w-8 h-8 text-slate-500" />}
            />

            {/* 6. Extension Modal */}
            <DeleteConfirmationModal
                isOpen={extensionData?.isOpen || false}
                onClose={actions.closeExtension}
                onConfirm={() => extensionData && onConfirmExtension(extensionData)}
                title={extensionData?.mode === 'mass' ? 'Estensione Massiva Scadenze' : 'Estendi Scadenza Sponsor'}
                message={extensionData?.mode === 'single' ? `Sponsor: ${extensionData?.sponsorId}. Scadenza attuale: ${extensionData?.currentExpirationDate}` : 'Aggiungi giorni a tutti gli sponsor attivi. Utile per regali o compensazioni.'}
                confirmText="Conferma Estensione"
                isDeleting={false}
                icon={<CalendarPlus className="w-8 h-8 text-indigo-500" />}
            >
                <div className="mt-4">
                    <label className="text-xs font-bold text-slate-400 block mb-1">Giorni da Aggiungere</label>
                    <input
                        type="number"
                        value={extensionData?.days || 0}
                        onChange={(e) => actions.setExtensionDays(parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-2xl font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                </div>
            </DeleteConfirmationModal>
        </>
    );
};