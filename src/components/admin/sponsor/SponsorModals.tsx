import React from 'react';
import { PointOfInterest } from '../../../types';
import { DeleteConfirmationModal } from '../../common/DeleteConfirmationModal';
import { PartnerDetailModal } from '../PartnerDetailModal';
import { PoiDetailModal } from '../../modals/PoiDetailModal';
import { Sparkles, XCircle, AlertTriangle, CalendarPlus, Info } from 'lucide-react';
import { useSponsorModalLogic } from '../../../hooks/useSponsorModalLogic';
import { SponsorRequest } from '../../../types/index';

interface SponsorModalsProps {
    state: {
        activationData: any;
        rejectData: any;
        cancelData: any;
        previewPoi: PointOfInterest | null;
        partnerCrmIdentity: any;
        extensionData: any;
    };
    requests: SponsorRequest[];
    currentUser?: any;
    actions: {
        closeActivation: () => void;
        updateActivation: (data: any) => void;
        closeReject: () => void;
        updateReject: (data: any) => void;
        closeCancel: () => void;
        updateCancel: (reason: string) => void;
        closePreview: () => void;
        closeCrm: () => void;
        closeExtension: () => void;
        setExtensionDays: (days: number) => void;
        setExtensionDate: (date: string) => void;
    };
    onConfirmActivation: () => void;
    onConfirmReject: () => void;
    onConfirmCancel: () => void;
    onConfirmExtension: (excludeCritical: boolean) => void;
}

export const SponsorModals: React.FC<SponsorModalsProps> = ({
    state,
    requests,
    actions,
    onConfirmActivation,
    onConfirmReject,
    onConfirmCancel,
    onConfirmExtension,
    currentUser,
}) => {
    const { activationData, rejectData, cancelData, previewPoi, partnerCrmIdentity, extensionData } = state;

    // Inietta la logica derivata
    const logic = useSponsorModalLogic(state, requests);

    return (
        <>
            {/* 0. CRM / Chat Modal */}
            {partnerCrmIdentity && (
                <PartnerDetailModal
                    profileId={partnerCrmIdentity.profileId}
                    requestId={partnerCrmIdentity.requestId}
                    vatNumber={partnerCrmIdentity.vat}
                    onClose={actions.closeCrm}
                />
            )}

            {/* 0.1 Preview Modal */}
            {previewPoi && (
                <PoiDetailModal
                    poi={previewPoi}
                    onClose={actions.closePreview}
                    onToggleItinerary={() => { }}
                    isInItinerary={false}
                    onOpenReview={() => { }}
                    userLocation={null}
                    onOpenAuth={() => { }}
                    user={currentUser}
                />
            )}

            {/* 1. Activation Modal */}
            <DeleteConfirmationModal
                isOpen={!!activationData}
                onClose={actions.closeActivation}
                onConfirm={onConfirmActivation}
                title="Registra Incasso e Attiva Sponsor"
                message={`Stai per attivare la sponsorizzazione per ${logic.activation.targetRequest?.companyName || 'questo partner'}.`}
                confirmLabel="Conferma e Attiva"
                isDeleting={false}
                confirmDisabled={!logic.activation.canSubmit}
                icon={<Sparkles className="w-8 h-8 text-emerald-500" />}
            >
                <div className="space-y-4 pt-4 text-left w-full">
                    {logic.activation.isShop && (
                        <div className="bg-amber-900/20 border border-amber-500/30 p-3 rounded-xl flex items-start gap-3">
                            <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="text-xs text-amber-200">
                                <strong>Bottega / Shop:</strong> Il tempo del contratto è "congelato". La sponsorizzazione inizierà ufficialmente solo quando la bottega avrà caricato il suo primo prodotto attivo nel catalogo.
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 block mb-1 uppercase">Importo Incassato (€)</label>
                            <input
                                type="number"
                                value={activationData?.amount || ''}
                                onChange={(e) => actions.updateActivation({ amount: parseFloat(e.target.value) })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="Es: 150"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 block mb-1 uppercase">Numero Fattura</label>
                            <input
                                type="text"
                                value={activationData?.invoiceNumber || ''}
                                onChange={(e) => actions.updateActivation({ invoiceNumber: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="Fattura o Ricevuta"
                            />
                        </div>
                    </div>

                    {logic.activation.error && (
                        <div className="text-xs font-bold text-red-400 text-center animate-in fade-in slide-in-from-bottom-2">
                            {logic.activation.error}
                        </div>
                    )}
                </div>
            </DeleteConfirmationModal>

            {/* 2. Rejection Modal */}
            <DeleteConfirmationModal
                isOpen={!!rejectData}
                onClose={actions.closeReject}
                onConfirm={onConfirmReject}
                title="Rifiuta Richiesta Sponsor"
                message={`Stai per rifiutare la richiesta. Seleziona una motivazione e aggiungi note opzionali.`}
                confirmLabel="Conferma Rifiuto"
                confirmDisabled={!logic.reject.canSubmit}
                isDeleting={false}
                icon={<XCircle className="w-8 h-8 text-red-500" />}
            >
                <div className="space-y-4 pt-4 text-left w-full">
                    <div>
                        <label className="text-xs font-bold text-slate-400 block mb-1 uppercase">Motivazione Rapida (Obbligatoria)</label>
                        <select
                            value={rejectData?.reason || ''}
                            onChange={(e) => actions.updateReject({ reason: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-red-500 outline-none"
                        >
                            <option value="" disabled>-- Seleziona motivo --</option>
                            <option value="Dati incompleti o non verificabili">Dati incompleti o non verificabili</option>
                            <option value="Attività fuori target per Touring Diary">Attività fuori target per Touring Diary</option>
                            <option value="Violazione delle policy commerciali">Violazione delle policy commerciali</option>
                            <option value="Mancato pagamento">Mancato pagamento nei termini stabiliti</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 block mb-1 uppercase">Note Aggiuntive (Interne)</label>
                        <textarea
                            value={rejectData?.notes || ''}
                            onChange={(e) => actions.updateReject({ notes: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-slate-500 outline-none"
                            placeholder="Note extra libere..."
                        />
                    </div>
                </div>
            </DeleteConfirmationModal>

            {/* 3. Cancellation Modal */}
            <DeleteConfirmationModal
                isOpen={!!cancelData}
                onClose={actions.closeCancel}
                onConfirm={onConfirmCancel}
                title="Sospendi / Annulla Sponsor"
                message={`Stai per annullare la sponsorizzazione attiva. Lo sponsor non sarà più visibile.`}
                confirmLabel="Conferma Annullamento"
                confirmDisabled={!logic.cancel.canSubmit}
                isDeleting={true}
                variant="danger"
                icon={<AlertTriangle className="w-8 h-8 text-red-500" />}
            >
                <div className="pt-4 text-left w-full">
                    <label className="text-xs font-bold text-slate-400 block mb-1 uppercase">Motivazione Annullamento</label>
                    <textarea
                        value={cancelData?.reason || ''}
                        onChange={(e) => actions.updateCancel(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-red-500 outline-none"
                        placeholder="Motivazione obbligatoria per storico..."
                    />
                </div>
            </DeleteConfirmationModal>

            {/* 6. Extension Modal */}
            <DeleteConfirmationModal
                isOpen={extensionData?.isOpen || false}
                onClose={actions.closeExtension}
                onConfirm={() => onConfirmExtension(false)}
                title={extensionData?.mode === 'mass' ? 'Estensione Massiva' : 'Estendi Scadenza'}
                message={extensionData?.mode === 'single' ? `Estensione per sponsor ID: ${extensionData?.id}.` : 'Aggiungi giorni a tutti gli sponsor attivi.'}
                confirmLabel="Conferma Estensione"
                variant="info"
                isDeleting={false}
                icon={<CalendarPlus className="w-8 h-8 text-white text-indigo-500" />}
            >
                <div className="mt-4 space-y-4 text-left w-full">
                    {extensionData?.mode === 'mass' && logic.extension.criticalPartnersCount > 0 && (
                        <div className="p-4 bg-rose-900/30 border border-rose-500/30 rounded-xl">
                            <h4 className="text-rose-400 font-bold text-sm mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Attenzione Qualità
                            </h4>
                            <p className="text-xs text-rose-200/70 mb-4">
                                Rilevati <strong className="text-white">{logic.extension.criticalPartnersCount}</strong> sponsor con rating molto basso. Vuoi escluderli dall'estensione gratuita?
                            </p>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onConfirmExtension(true);
                                }}
                                className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase rounded-lg transition-colors shadow-lg shadow-rose-900/50"
                            >
                                Escludi Critici ed Estendi
                            </button>
                            <div className="text-center mt-3 text-[10px] text-slate-500">
                                Oppure usa il pulsante standard in basso per estendere a tutti indiscriminatamente.
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-bold text-slate-400 block mb-1 uppercase">Giorni da aggiungere</label>
                        <div className="flex gap-2">
                            {[7, 30, 90, 365].map(d => (
                                <button
                                    key={d}
                                    onClick={() => actions.setExtensionDays(d)}
                                    className={`flex-1 py-1 rounded border text-[10px] font-bold transition-colors ${extensionData.days === d ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                                >
                                    +{d}d
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <input
                            type="number"
                            value={extensionData?.days || 0}
                            onChange={(e) => actions.setExtensionDays(parseInt(e.target.value, 10) || 0)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-2xl font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div className="p-3 bg-indigo-900/20 border border-indigo-500/20 rounded-lg">
                        <div className="flex justify-between text-[10px] font-bold text-indigo-300 uppercase">
                            <span>Nuova Scadenza:</span>
                            <span>{extensionData.newExpirationDate || 'Seleziona giorni'}</span>
                        </div>
                    </div>
                </div>
            </DeleteConfirmationModal>
        </>
    );
};

