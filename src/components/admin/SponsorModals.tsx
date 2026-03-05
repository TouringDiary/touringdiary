import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, XCircle, Ban, Gift, ArrowRight, AlertTriangle, Users, Store, AlertCircle } from 'lucide-react';
import { PoiDetailModal } from '../modals/PoiDetailModal';
import { PartnerDetailModal } from './PartnerDetailModal';
import { useSponsorModals } from '../../hooks/useSponsorModals';
import { getSponsorRating } from '../../services/sponsorService';
import { SponsorRequest, User } from '../../types/index';
import { getGuestUser } from '../../services/userService';

interface SponsorModalsProps {
    state: ReturnType<typeof useSponsorModals>['state'];
    actions: ReturnType<typeof useSponsorModals>['actions'];
    onConfirmActivation: () => void;
    onConfirmReject: () => void;
    onConfirmCancel: () => void;
    onConfirmExtension: (excludeCritical?: boolean) => void;
    onDataChange?: () => void;
    sponsorsList: SponsorRequest[]; // NEW PROP
    user?: User; // ADDED USER PROP
}

export const SponsorModals = ({ state, actions, onConfirmActivation, onConfirmReject, onConfirmCancel, onConfirmExtension, onDataChange, sponsorsList, user }: SponsorModalsProps) => {
    const { activationData, rejectData, cancelData, previewPoi, partnerCrmVat, extensionData } = state;
    
    // Local Error State for Activation Modal
    const [activationError, setActivationError] = useState<string | null>(null);

    // ESC Key Handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (activationData) actions.closeActivation();
                if (rejectData) actions.closeReject();
                if (cancelData) actions.closeCancel();
                if (extensionData.isOpen) actions.closeExtension();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [activationData, rejectData, cancelData, extensionData, actions]);

    // Clear error when modal closes or data changes
    useEffect(() => {
        if (!activationData) setActivationError(null);
    }, [activationData]);

    // Handle Activation Click with Validation
    const handleActivationClick = () => {
        setActivationError(null);
        if (!activationData) return;
        
        if (!activationData.amount || activationData.amount <= 0) {
            setActivationError("L'importo deve essere maggiore di zero.");
            return;
        }
        if (!activationData.invoiceNumber || activationData.invoiceNumber.trim().length < 2) {
             setActivationError("Il numero fattura è obbligatorio.");
             return;
        }
        
        onConfirmActivation();
    };

    // Check for Critical Partners (Low Rating < 3.0) when in mass extension mode
    const criticalPartnersCount = useMemo(() => {
        if (!extensionData.isOpen || extensionData.mode !== 'mass') return 0;
        const active = sponsorsList.filter(s => s.status === 'approved' && s.endDate);
        const critical = active.filter(s => {
            const rating = getSponsorRating(s.id);
            return rating !== null && rating < 3.0;
        });
        return critical.length;
    }, [extensionData.isOpen, extensionData.mode, sponsorsList]);

    // Helper to check if current activation is for a shop
    const isActivationShop = useMemo(() => {
        if (!activationData?.id) return false;
        // Use the passed props list instead of getSponsors() which might be out of sync
        const sponsor = sponsorsList.find(s => s.id === activationData.id);
        return sponsor?.type === 'shop' || sponsor?.poiCategory === 'shop';
    }, [activationData, sponsorsList]);

    return (
        <>
            {/* PREVIEW POI */}
            {previewPoi && (
                <PoiDetailModal 
                    poi={previewPoi} 
                    onClose={actions.closePreview} 
                    onToggleItinerary={() => {}} 
                    isInItinerary={false} 
                    onOpenReview={() => {}} 
                    /* Fix: removed redundant hasVoted prop */
                    userLocation={null} 
                    user={user || getGuestUser()}
                    onOpenAuth={() => {}}
                />
            )}

            {/* CRM MODAL */}
            {partnerCrmVat && (
                <PartnerDetailModal vatNumber={partnerCrmVat} onClose={actions.closeCrm} onUpdate={onDataChange} />
            )}

            {/* ACTIVATION MODAL */}
            {activationData && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 rounded-xl border border-emerald-500/50 p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <CheckCircle className="w-6 h-6 text-emerald-500"/> Attivazione Sponsor
                        </h3>
                        
                        {isActivationShop && (
                            <div className="bg-amber-900/20 border border-amber-500/30 p-3 rounded-lg mb-4 flex gap-3 items-start">
                                <Store className="w-5 h-5 text-amber-500 shrink-0 mt-0.5"/>
                                <div>
                                    <h4 className="text-xs font-bold text-amber-400 uppercase mb-0.5">Modalità Tempo Congelato</h4>
                                    <p className="text-[10px] text-amber-100/80 leading-snug">
                                        Trattandosi di una <strong>Bottega</strong>, il periodo di abbonamento e la visibilità pubblica partiranno <u>automaticamente</u> solo quando il cliente caricherà il <strong>primo prodotto</strong>.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Data Inizio {isActivationShop ? '(Sospesa)' : ''}</label>
                                <input 
                                    type="date" 
                                    value={isActivationShop ? '' : activationData.startDate} 
                                    onChange={e => !isActivationShop && actions.updateActivation({ startDate: e.target.value })} 
                                    className={`w-full bg-slate-950 border border-slate-700 rounded p-2 text-white ${isActivationShop ? 'opacity-50 cursor-not-allowed bg-slate-900' : ''}`} 
                                    disabled={isActivationShop}
                                />
                                {isActivationShop && <p className="text-[9px] text-slate-500 mt-1 italic">La data reale sarà impostata al primo upload prodotti.</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Durata</label>
                                    <select value={activationData.duration} onChange={e => actions.updateActivation({ duration: e.target.value as any })} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white">
                                        <option value="1_month">1 Mese</option>
                                        <option value="3_months">3 Mesi</option>
                                        <option value="6_months">6 Mesi</option>
                                        <option value="12_months">12 Mesi</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Importo (€)</label>
                                    <input type="number" value={activationData.amount} onChange={e => actions.updateActivation({ amount: parseFloat(e.target.value) })} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"/>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Numero Fattura</label>
                                <input type="text" value={activationData.invoiceNumber} onChange={e => actions.updateActivation({ invoiceNumber: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" placeholder="Fatt. N..."/>
                            </div>
                            
                            {/* ERROR BANNER */}
                            {activationError && (
                                <div className="bg-red-900/20 border border-red-500/50 p-2 rounded flex items-center gap-2 animate-pulse">
                                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0"/>
                                    <span className="text-xs text-red-200 font-bold">{activationError}</span>
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <button onClick={actions.closeActivation} className="flex-1 py-2 bg-slate-800 text-slate-300 rounded hover:bg-slate-700">Annulla</button>
                                <button onClick={handleActivationClick} className="flex-1 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500 font-bold">Conferma {isActivationShop ? '& Abilita' : '& Attiva'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* REJECTION MODAL */}
            {rejectData && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 rounded-xl border border-red-500/50 p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <XCircle className="w-6 h-6 text-red-500"/> Rifiuta Richiesta
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Motivazione (per il cliente)</label>
                                <select value={rejectData.reason} onChange={e => actions.updateReject({ reason: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white mb-2">
                                    <option value="">Seleziona...</option>
                                    <option value="Dati incompleti o non veritieri">Dati incompleti o non veritieri</option>
                                    <option value="Attività fuori target">Attività fuori target</option>
                                    <option value="Immagini non conformi">Immagini non conformi</option>
                                    <option value="Altro">Altro</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Note Interne (Admin)</label>
                                <textarea value={rejectData.notes} onChange={e => actions.updateReject({ notes: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white h-24" placeholder="Note visibili solo agli admin..."></textarea>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button onClick={actions.closeReject} className="flex-1 py-2 bg-slate-800 text-slate-300 rounded hover:bg-slate-700">Annulla</button>
                                <button onClick={onConfirmReject} disabled={!rejectData.reason} className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-500 font-bold disabled:opacity-50">Conferma Rifiuto</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CANCELLATION MODAL */}
            {cancelData && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 rounded-xl border border-red-500/50 p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Ban className="w-6 h-6 text-red-500"/> Termina Contratto
                        </h3>
                        <div className="bg-red-900/10 border border-red-500/20 p-3 rounded mb-4 text-xs text-red-200">
                            Attenzione: L'annullamento è immediato e rimuoverà lo sponsor da tutte le liste attive.
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Motivazione (Obbligatoria)</label>
                                <textarea 
                                    value={cancelData.reason} 
                                    onChange={e => actions.updateCancel(e.target.value)} 
                                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white h-24" 
                                    placeholder="Es. Mancato pagamento, Richiesta partner..."
                                ></textarea>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button onClick={actions.closeCancel} className="flex-1 py-2 bg-slate-800 text-slate-300 rounded hover:bg-slate-700">Annulla</button>
                                <button onClick={onConfirmCancel} disabled={!cancelData.reason.trim()} className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-500 font-bold disabled:opacity-50">Conferma Chiusura</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* EXTENSION MODAL */}
            {extensionData.isOpen && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 rounded-xl border border-indigo-500/50 p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Gift className="w-6 h-6 text-indigo-500"/> {extensionData.mode === 'single' ? 'Estensione Singola' : 'Estensione Massiva'}
                        </h3>
                        
                        {extensionData.mode === 'single' ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 bg-slate-800/50 p-3 rounded border border-slate-700 mb-2">
                                    <div>
                                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Scadenza Attuale</span>
                                        <span className="text-xs text-slate-300 font-mono decoration-slate-500 decoration-1 line-through">{extensionData.currentExpirationDate}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ArrowRight className="w-4 h-4 text-slate-600"/>
                                        <div>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase block">Nuova Scadenza</span>
                                            <span className={`text-sm font-bold font-mono ${extensionData.days < 0 ? 'text-amber-500' : 'text-emerald-400'}`}>
                                                {extensionData.newExpirationDate}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Giorni +/-</label>
                                        <input type="number" value={extensionData.days} onChange={e => actions.setExtensionDays(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-bold"/>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Seleziona Data</label>
                                        <input type="date" value={extensionData.newExpirationDate} onChange={e => actions.setExtensionDate(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-bold"/>
                                    </div>
                                </div>

                                {extensionData.days < 0 && (
                                    <div className="flex items-center gap-2 text-[10px] text-amber-500 bg-amber-900/20 p-2 rounded border border-amber-500/30">
                                        <AlertTriangle className="w-4 h-4 shrink-0"/>
                                        Attenzione: Stai anticipando la scadenza di {Math.abs(extensionData.days)} giorni.
                                    </div>
                                )}
                                
                                <div className="flex gap-2 pt-6">
                                    <button onClick={actions.closeExtension} className="flex-1 py-2 bg-slate-800 text-slate-300 rounded hover:bg-slate-700">Annulla</button>
                                    <button onClick={() => onConfirmExtension()} className="flex-1 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 font-bold">
                                        Applica Modifica
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // MASS EXTENSION VIEW
                            <div className="space-y-4">
                                <p className="text-sm text-slate-400">
                                    Aggiungi giorni extra agli sponsor attivi come compensazione o bonus.
                                </p>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Giorni da aggiungere</label>
                                    <input type="number" value={extensionData.days} onChange={e => actions.setExtensionDays(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-bold text-center text-lg"/>
                                </div>

                                {/* CRITICAL PARTNERS WARNING */}
                                {criticalPartnersCount > 0 && (
                                    <div className="bg-amber-900/20 border border-amber-500/30 p-3 rounded-lg animate-in slide-in-from-top-2">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0"/>
                                            <div>
                                                <h4 className="text-amber-400 font-bold text-xs uppercase mb-1">Qualità Critica Rilevata</h4>
                                                <p className="text-xs text-amber-100/80 leading-snug">
                                                    Ci sono <strong>{criticalPartnersCount}</strong> partner attivi con rating inferiore a 3.0.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col gap-2 pt-4">
                                    {criticalPartnersCount > 0 ? (
                                        <>
                                            <button onClick={() => onConfirmExtension(true)} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg">
                                                <CheckCircle className="w-4 h-4"/> Escludi Critici (Sicuro)
                                            </button>
                                            <button onClick={() => onConfirmExtension(false)} className="w-full py-2 bg-slate-800 hover:bg-amber-900/30 text-slate-300 hover:text-amber-400 rounded-lg text-xs font-bold border border-slate-700 hover:border-amber-500/30">
                                                Estendi a TUTTI (Inclusi Critici)
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => onConfirmExtension(false)} className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-bold shadow-lg">
                                            Applica a Tutti
                                        </button>
                                    )}
                                    <button onClick={actions.closeExtension} className="w-full py-2 text-slate-500 hover:text-white text-xs font-bold uppercase mt-1">Annulla</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};