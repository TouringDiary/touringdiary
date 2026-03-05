
import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Clock, Eye, EyeOff, Send, Info, StickyNote, Save, AlertCircle, ShoppingBag, CheckCircle, Loader2 } from 'lucide-react';
import { SponsorRequest, PartnerLog, ShopPartner } from '../../types/index';
// UPDATE: Importa le funzioni async
import { getPartnerHistoryAsync, addPartnerLogAsync, markPartnerLogsAsRead, togglePartnerLogReadStatus, updateSponsorInternalNotes } from '../../services/sponsorService';
import { getShopByVat } from '../../services/shopService';
import { BusinessShopManager } from '../user/BusinessShopManager';
import { useSystemMessage } from '../../hooks/useSystemMessage';
// NEW IMPORTS FOR NOTIFICATION
import { getUserIdByEmail } from '../../services/userService';
import { addNotification } from '../../services/notificationService';

interface PartnerDetailModalProps {
    vatNumber: string;
    onClose: () => void;
    onUpdate?: () => void;
}

export const PartnerDetailModal = ({ vatNumber, onClose, onUpdate }: PartnerDetailModalProps) => {
    const [history, setHistory] = useState<SponsorRequest[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    
    const [internalNote, setInternalNote] = useState('');
    const [originalNote, setOriginalNote] = useState('');
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [activeView, setActiveView] = useState<'crm' | 'shop'>('shop'); // FIX: Default to CRM, but shop logic below handles view switch
    const [currentShop, setCurrentShop] = useState<ShopPartner | null>(null);
    
    const [localAlert, setLocalAlert] = useState<{ title: string, message: string, type: 'info' | 'warning' } | null>(null);

    const { getText: getShopMissingMsg } = useSystemMessage('admin_shop_not_found');

    const chatContainerRef = useRef<HTMLDivElement>(null);

    // FUNZIONE DI CARICAMENTO ASINCRONA
    const loadData = async () => {
        setIsLoadingHistory(true);
        try {
            const h = await getPartnerHistoryAsync(vatNumber);
            setHistory(h);
            if (h.length > 0) {
                // Imposta note interne dal record più recente se non modificate
                if (!isDirty) {
                    const note = h[0].adminNotes || '';
                    setInternalNote(note);
                    setOriginalNote(note);
                }
            }
        } catch (e) {
            console.error("Failed to load partner history", e);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    useEffect(() => {
        setActiveView('crm'); // Reset view on open
        loadData();
        markPartnerLogsAsRead(vatNumber);
        if (onUpdate) onUpdate();
    }, [vatNumber]);

    useEffect(() => { setIsDirty(internalNote !== originalNote); }, [internalNote, originalNote]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [history]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (localAlert) setLocalAlert(null);
                else if (showUnsavedModal) setShowUnsavedModal(false);
                else handleCloseAttempt();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showUnsavedModal, isDirty, localAlert]);

    const handleCloseAttempt = () => {
        if (isDirty) setShowUnsavedModal(true);
        else onClose();
    };

    const activeRequest = history[0]; 
    const logs = activeRequest?.partnerLogs || [];
    const totalSpent = history.reduce((sum, r) => sum + (r.amount || 0), 0);
    const rejectedCount = history.filter(r => r.status === 'rejected').length;
    const activeCount = history.filter(r => r.status === 'approved' || r.status === 'expired').length;
    
    let reputationColor = 'text-emerald-500';
    let reputationLabel = 'Affidabile';
    if (rejectedCount > 0 && rejectedCount > activeCount) { reputationColor = 'text-red-500'; reputationLabel = 'A Rischio'; }
    else if (rejectedCount > 0) { reputationColor = 'text-amber-500'; reputationLabel = 'Attenzione'; }

    // INVIO MESSAGGIO ASINCRONO CON NOTIFICA
    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
        setIsSending(true);
        try {
            // 1. Salva log nel CRM
            const log: PartnerLog = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                type: 'message',
                direction: 'outbound',
                message: newMessage
            };
            
            await addPartnerLogAsync(vatNumber, log);

            // 2. Invia Notifica Utente (se collegato)
            const targetUserId = await getUserIdByEmail(activeRequest.email);
            if (targetUserId) {
                await addNotification(
                    targetUserId,
                    'info',
                    'Nuovo Messaggio Staff',
                    `Hai ricevuto una comunicazione relativa a "${activeRequest.companyName}".\n${newMessage.substring(0, 50)}${newMessage.length > 50 ? '...' : ''}`,
                    // FIX: Deep link corretto per aprire la tab messaggi
                    { section: 'profile', tab: 'messages' } 
                );
            }
            
            setNewMessage('');
            await loadData(); // Ricarica storico per vedere il nuovo messaggio
            if (onUpdate) onUpdate();
        } catch (e) {
            alert("Errore invio messaggio");
            console.error(e);
        } finally {
            setIsSending(false);
        }
    };

    const handleSaveInternalNote = () => {
        if (!activeRequest) return;
        setIsSavingNote(true);
        // Usa setTimeout per simulare o trasforma anche questa in async reale se serve
        // Per coerenza con gli altri service, qui manteniamo la logica 'fire & forget' ottimistica o update locale
        updateSponsorInternalNotes(activeRequest.id, internalNote);
        
        setTimeout(() => {
            setIsSavingNote(false);
            setOriginalNote(internalNote);
            setIsDirty(false);
            // Non serve ricaricare tutto per una nota locale se non blocca
        }, 500);
    };

    const handleOpenShopManager = async () => {
        let shop = await getShopByVat(vatNumber);
        
        if (shop) {
            setCurrentShop(shop);
            setActiveView('shop');
        } else {
            const isShopContract = activeRequest?.type === 'shop' || activeRequest?.poiCategory === 'shop';
            
            if (isShopContract) {
                setLocalAlert({
                    type: 'warning',
                    title: 'Bottega Non Configurata',
                    message: "Questo partner ha un contratto 'Bottega' attivo, ma non ha ancora configurato la sua vetrina.\n\nIl cliente deve accedere alla sua area riservata > 'La mia Bottega' e inserire i prodotti per la prima volta."
                });
            } else {
                const msg = getShopMissingMsg();
                setLocalAlert({
                    type: 'info',
                    title: msg.title || 'Nessuna Bottega Attiva',
                    message: msg.body || "Funzionalità non attiva per questo tipo di contratto."
                });
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
            {activeView === 'shop' && currentShop ? (
                <div className="bg-slate-900 w-full max-w-6xl h-[95vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col animate-in zoom-in-95 overflow-hidden relative">
                    <BusinessShopManager 
                        shop={currentShop} 
                        onUpdate={() => {}} 
                        onBack={() => setActiveView('crm')}
                    />
                </div>
            ) : (
                <div className="bg-slate-900 w-full max-w-6xl h-[90vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col animate-in zoom-in-95 overflow-hidden relative">
                    
                    {localAlert && (
                         <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                            <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 flex flex-col items-center text-center">
                                <div className={`p-4 rounded-full mb-4 ${localAlert.type === 'warning' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                    {localAlert.type === 'warning' ? <AlertCircle className="w-8 h-8"/> : <Info className="w-8 h-8"/>}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{localAlert.title}</h3>
                                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line mb-6">{localAlert.message}</p>
                                <button onClick={() => setLocalAlert(null)} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold uppercase transition-colors border border-slate-700">
                                    Ho Capito
                                </button>
                            </div>
                        </div>
                    )}

                    {showUnsavedModal && (
                        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                            <div className="bg-slate-900 border border-red-500/50 p-6 rounded-xl shadow-2xl max-w-sm w-full animate-in zoom-in-95">
                                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><AlertCircle className="w-6 h-6 text-red-500"/> Modifiche non salvate</h3>
                                <p className="text-slate-300 text-sm mb-6">Hai modificato le note interne senza salvare. Se esci ora, le modifiche andranno perse.</p>
                                <div className="flex gap-3">
                                    <button onClick={onClose} className="flex-1 bg-red-900/20 hover:bg-red-900/40 text-red-400 font-bold py-2 rounded-lg transition-colors border border-red-900/30">Abbandona</button>
                                    <button onClick={() => { handleSaveInternalNote(); setShowUnsavedModal(false); }} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg transition-colors">Salva e Resta</button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-start p-6 border-b border-slate-800 bg-slate-950">
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <h2 className="text-3xl font-bold text-white">{activeRequest?.companyName || 'Partner'}</h2>
                                <span className={`text-xs uppercase font-bold px-3 py-1 rounded border ${reputationColor === 'text-red-500' ? 'bg-red-900/20 border-red-500/50' : reputationColor === 'text-amber-500' ? 'bg-amber-900/20 border-amber-500/50' : 'bg-emerald-900/20 border-emerald-500/50'} ${reputationColor}`}>{reputationLabel}</span>
                            </div>
                            <div className="text-sm text-slate-400 font-mono flex items-center gap-6"><span>P.IVA: {vatNumber}</span><span>Email: {activeRequest?.email}</span></div>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={handleOpenShopManager}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-bold text-xs uppercase flex items-center gap-2 shadow-lg transition-all border border-indigo-400"
                            >
                                <ShoppingBag className="w-4 h-4"/> SHOPPING - NEGOZIO
                            </button>
                            <button onClick={handleCloseAttempt} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg">
                                <X className="w-6 h-6"/>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                        <div className="w-full md:w-1/3 border-r border-slate-800 flex flex-col overflow-hidden bg-slate-900">
                            <div className="p-5 border-b border-slate-800 bg-amber-900/5">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-amber-500 text-sm uppercase flex items-center gap-2"><StickyNote className="w-4 h-4"/> Note Amministrative (Private)</h3>
                                    <button onClick={handleSaveInternalNote} className={`text-xs px-4 py-1.5 rounded flex items-center gap-1 border transition-all font-bold ${isDirty ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-lg scale-105' : 'bg-slate-800 text-slate-400 border-slate-700'}`} disabled={isSavingNote}>
                                        <Save className="w-3 h-3"/> {isSavingNote ? 'Salvataggio...' : (isDirty ? 'SALVA ORA' : 'Salva')}
                                    </button>
                                </div>
                                <textarea value={internalNote} onChange={(e) => setInternalNote(e.target.value)} className={`w-full bg-slate-800/50 border rounded-lg p-3 text-sm text-slate-300 focus:outline-none resize-none h-32 mb-1 leading-relaxed transition-all ${isDirty ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' : 'border-slate-700 focus:border-amber-500'}`} placeholder="Note interne visibili solo agli admin..."/>
                                {activeRequest?.adminNotesLastUpdated && <div className="text-[10px] text-slate-500 text-right font-mono italic select-none">— [Aggiornato: {activeRequest.adminNotesLastUpdated}]</div>}
                            </div>
                            <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                                <h3 className="font-bold text-white flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-blue-500"/> Storico Contratti</h3>
                                <div className="text-sm font-mono text-emerald-400 font-bold">Tot. Speso: €{totalSpent}</div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                                {isLoadingHistory ? (
                                     <div className="flex flex-col items-center py-10 text-slate-500 gap-2">
                                         <Loader2 className="w-6 h-6 animate-spin text-indigo-500"/>
                                         <span className="text-xs uppercase font-bold">Caricamento Storico...</span>
                                     </div>
                                ) : history.map(req => (
                                    <div key={req.id} className="bg-slate-950 p-4 rounded-lg border border-slate-800 hover:border-slate-600 transition-colors cursor-pointer group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2.5 h-2.5 rounded-full ${req.status === 'approved' ? 'bg-emerald-500' : req.status === 'rejected' ? 'bg-red-500' : req.status === 'cancelled' ? 'bg-slate-500' : 'bg-amber-500'}`}></span>
                                                <span className="text-sm font-bold text-white uppercase group-hover:text-blue-400 transition-colors">{req.status.replace('_', ' ')}</span>
                                            </div>
                                            <span className="text-xs text-slate-500 font-mono">{new Date(req.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-slate-400 mt-2">
                                            <span className="font-medium text-slate-300">{req.cityId} • {req.tier}</span>
                                            {req.amount && <span className="text-white font-bold">€{req.amount}</span>}
                                        </div>
                                        {/* SHOW START/END DATE IF APPROVED - FORMATO MIGLIORATO */}
                                        {(req.status === 'approved' || req.status === 'expired') && req.startDate && (
                                            <div className="mt-2 text-[10px] font-medium text-indigo-200 bg-indigo-900/20 px-2 py-1.5 rounded border border-indigo-500/20 flex flex-col gap-0.5">
                                                <div className="flex justify-between"><span>DAL:</span> <span className="text-white font-mono">{new Date(req.startDate).toLocaleDateString('it-IT')}</span></div>
                                                <div className="flex justify-between"><span>AL:</span> <span className="text-white font-mono">{req.endDate ? new Date(req.endDate).toLocaleDateString('it-IT') : 'Indefinito'}</span></div>
                                            </div>
                                        )}
                                        {req.invoiceNumber && <div className="mt-2 text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded w-fit">Fatt. {req.invoiceNumber}</div>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="w-full md:w-2/3 flex flex-col bg-slate-950">
                            <div className="p-5 border-b border-slate-800 bg-slate-900/50">
                                <h3 className="font-bold text-white flex items-center gap-2 text-lg"><MessageSquare className="w-5 h-5 text-amber-500"/> Messaggi & Log</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-[#0b1120]" ref={chatContainerRef}>
                                {logs.length === 0 && <div className="text-center text-slate-600 text-sm italic mt-8">Nessuna conversazione registrata.</div>}
                                {[...logs].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((log, i) => (
                                    <div key={i} className={`flex w-full ${log.direction === 'outbound' ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[85%] rounded-2xl p-5 shadow-sm text-base relative group 
                                            ${log.direction === 'outbound' && log.type !== 'alert' 
                                                ? 'bg-emerald-600 text-white rounded-bl-none' // Admin: Sinistra (Start) + Verde
                                                : log.type === 'system' 
                                                    ? 'bg-slate-800 text-slate-400 text-sm border border-slate-700 italic text-center mx-auto px-6 py-2 rounded-full' 
                                                    : 'bg-blue-600 text-white rounded-br-none border border-blue-500' // User: Destra (End) + Blu
                                            }`
                                        }>
                                            <p className="whitespace-pre-line leading-relaxed">{log.message}</p>
                                            <div className={`flex justify-between items-center mt-2 pt-2 ${log.direction === 'inbound' ? 'border-t border-blue-500/50' : 'border-t border-emerald-500/50'}`}>
                                                <span className={`text-[10px] text-white/70`}>{new Date(log.date).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-5 border-t border-slate-800 bg-slate-900">
                                <div className="flex gap-3">
                                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Scrivi una risposta al partner..." className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-5 py-4 text-base text-white focus:border-blue-500 focus:outline-none" onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}/>
                                    <button onClick={handleSendMessage} disabled={isSending} className="px-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl transition-colors shadow-lg flex items-center justify-center min-w-[60px]">
                                        {isSending ? <Loader2 className="w-6 h-6 animate-spin"/> : <Send className="w-6 h-6"/>}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5"><Info className="w-3.5 h-3.5"/> I messaggi inviati qui generano una notifica all'utente.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
