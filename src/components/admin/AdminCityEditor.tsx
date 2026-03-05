
import React, { useMemo, useState } from 'react';
import { ArrowLeft, FileText, BarChart3, ImageIcon, MapPin, Eye, EyeOff, BookOpen, Info, Loader2, CheckCircle, AlertTriangle, X, Terminal, Save } from 'lucide-react';
import { User } from '../../types/users';
import { CityEditorProvider, useCityEditor } from '../../context/CityEditorContext';
import { useAdminCityEditorLogic } from '../../hooks/admin/useAdminCityEditorLogic';
import { useSystemMessage } from '../../hooks/useSystemMessage';

// --- NEW ATOMIC TABS ---
import { TabGeneral } from './cityEditor/tabs/TabGeneral';
import { TabRatings } from './cityEditor/tabs/TabRatings';
import { TabCulture } from './cityEditor/tabs/TabCulture';
import { TabServices } from './cityEditor/tabs/TabServices';
import { TabMedia } from './cityEditor/tabs/TabMedia';
import { TabPois } from './cityEditor/tabs/TabPois';
import { TabLogs } from './cityEditor/tabs/TabLogs';

// Modali per Anteprima
import { SectionPreviewModal } from '../modals/SectionPreviewModal';
import { PreviewRatings } from '../modals/sectionPreview/PreviewRatings';
import { HistoryModal } from '../modals/HistoryModal';
import { PatronSaintModal } from '../modals/PatronSaintModal';
import { CityInfoModal } from '../modals/CityInfoModal'; // IMPORTATO MODALE PUBBLICO

// --- COMPONENTI UI LOCALI ---

const AdminToast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
    <div className={`fixed top-6 right-6 z-[9999] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 border ${type === 'success' ? 'bg-emerald-600 border-emerald-400' : 'bg-red-600 border-red-400'} text-white`}>
        {type === 'success' ? <CheckCircle className="w-6 h-6 shrink-0"/> : <AlertTriangle className="w-6 h-6 shrink-0"/>}
        <div className="font-bold text-sm">{message}</div>
        <button onClick={onClose} className="ml-4 hover:bg-white/20 p-1 rounded-full"><X className="w-4 h-4"/></button>
    </div>
);

// --- CONTENUTO INTERNO (ORCHESTRATORE) ---

const EditorOrchestrator = ({ onBack, currentUser }: { onBack: () => void, currentUser: User }) => {
    // Logica di gestione stato centralizzata nell'hook
    const { 
        city, isLoading, isSaving, previewRequest, isDirty,
        activeTab, setActiveTab,
        showNoLogsWarning, setShowNoLogsWarning,
        toast, closeToast,
        handleSaveRequest, clearPreviewRequest
    } = useAdminCityEditorLogic();

    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    
    // FETCH TESTI SISTEMA PER MODALE UNSAVED
    const { getText: getUnsavedMsg } = useSystemMessage('city_unsaved_changes');
    const { getText: getNoLogsMsg } = useSystemMessage('city_publish_no_logs_warning');
    const unsavedMsg = getUnsavedMsg();
    const noLogsMsg = getNoLogsMsg();

    const handleBackClick = () => {
        if (isDirty) {
            setShowUnsavedModal(true);
        } else {
            onBack();
        }
    };

    const confirmExitWithoutSave = () => {
        setShowUnsavedModal(false);
        onBack();
    };

    // Costruisce una versione "live" dell'oggetto city combinando lo stato DB con eventuali dati non salvati (es. liste in preview)
    const previewCity = useMemo(() => {
        if (!city) return null;
        
        // Se la request ha items specifici (es. la lista guide aggiornata),
        // creiamo un override dei dettagli per il modale
        if (previewRequest.items && previewRequest.items.length > 0) {
             const type = previewRequest.type;
             const overrides: any = {};
             
             if (type === 'guides') overrides.guides = previewRequest.items;
             if (type === 'events') overrides.events = previewRequest.items;
             
             if (type === 'services' || type === 'tour_operators') {
                 overrides.services = previewRequest.items;
             }

             return {
                 ...city,
                 details: {
                     ...city.details,
                     ...overrides
                 }
             };
        }
        return city;
    }, [city, previewRequest]);

    if (isLoading) return <div className="flex items-center justify-center h-screen bg-slate-950"><Loader2 className="animate-spin h-12 w-12 text-indigo-500" /></div>;
    if (!city) return <div className="text-white p-8">Errore caricamento dati città.</div>;
    
    // Determina il contenuto da passare al modale storia in base al tipo di preview richiesto
    const historyPreviewContent = previewRequest.type === 'snippet' 
        ? city.details.historySnippet 
        : city.details.historyFull;

    return (
        <div className="bg-slate-950 min-h-screen pb-20 animate-in fade-in relative">
            
            {/* TOAST NOTIFICATIONS */}
            {toast && <AdminToast message={toast.message} type={toast.type} onClose={closeToast} />}
            
            {/* --- MODALE MODIFICHE NON SALVATE --- */}
            {showUnsavedModal && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-amber-500/50 p-8 rounded-2xl w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 text-center">
                        <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center border-2 border-amber-500 mx-auto mb-6 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                            <AlertTriangle className="w-8 h-8 text-amber-500 animate-pulse"/>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{unsavedMsg.title || 'Modifiche non salvate'}</h3>
                        <p className="text-sm text-slate-300 mb-6 leading-relaxed whitespace-pre-line">
                            {unsavedMsg.body || 'Hai modifiche non salvate. Se esci, andranno perse.'}
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowUnsavedModal(false)} 
                                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs uppercase transition-colors"
                            >
                                Annulla
                            </button>
                            <button 
                                onClick={confirmExitWithoutSave} 
                                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs uppercase shadow-lg transition-colors flex items-center justify-center gap-2"
                            >
                                Esci senza salvare
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODALE AVVISO NO LOGS --- */}
            {showNoLogsWarning && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-amber-500/50 p-8 rounded-2xl w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 text-center">
                        <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center border-2 border-amber-500 mx-auto mb-6 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                            <AlertTriangle className="w-8 h-8 text-amber-500 animate-pulse"/>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{noLogsMsg.title || 'Attenzione: Log AI Mancanti'}</h3>
                        <p className="text-sm text-slate-300 mb-6 leading-relaxed whitespace-pre-line">
                            {noLogsMsg.body || 'Stai per pubblicare una città che non ha log di generazione AI. Se sei sicuro che i contenuti siano presenti, puoi forzare la pubblicazione o usare il flag "Forza Contenuti Generati" nel tab Log AI.'}
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowNoLogsWarning(false)} 
                                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs uppercase transition-colors"
                            >
                                Annulla
                            </button>
                            <button 
                                onClick={() => { setShowNoLogsWarning(false); handleSaveRequest('published', true); }} 
                                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase shadow-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4"/> Pubblica Comunque
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- ANTEPRIME MODALI --- */}
            
            {previewRequest.type === 'ratings' && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
                    <div className="relative bg-slate-900 w-full max-w-4xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-[#0f172a]">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-emerald-500"/> Anteprima Valutazioni
                            </h3>
                            <button onClick={clearPreviewRequest} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
                        </div>
                        <div className="p-6 md:p-8 bg-[#020617]">
                             <PreviewRatings city={city} />
                        </div>
                        <div className="p-4 border-t border-slate-800 bg-slate-950 text-center">
                            <button onClick={clearPreviewRequest} className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg font-bold text-xs uppercase transition-colors">Chiudi Anteprima</button>
                        </div>
                    </div>
                </div>
            )}

            {(previewRequest.type === 'history' || previewRequest.type === 'snippet') && (
                <HistoryModal 
                    isOpen={true} 
                    onClose={clearPreviewRequest} 
                    city={city} 
                    customText={historyPreviewContent} 
                />
            )}

            {previewRequest.type === 'patron' && (
                 <PatronSaintModal 
                    isOpen={true}
                    onClose={clearPreviewRequest}
                    city={city}
                />
            )}
            
            {/* ANTEPRIME TAB INFORMATIVI (USANO IL VERO MODALE UTENTE) */}
            {['guides', 'events', 'services', 'tour_operators'].includes(previewRequest.type) && previewCity && (
                <CityInfoModal 
                    isOpen={true}
                    onClose={clearPreviewRequest}
                    city={previewCity} // Passiamo l'oggetto con i dati "live"
                    initialTab={previewRequest.type as any}
                    onAddToItinerary={() => alert("Funzione 'Aggiungi al diario' disabilitata in anteprima admin.")}
                    user={currentUser}
                    onOpenAuth={() => {}}
                />
            )}

            {(previewRequest.type === 'card' || previewRequest.type === 'list') && (
                <SectionPreviewModal 
                    onClose={clearPreviewRequest}
                    cities={previewRequest.items || [city]}
                    title={previewRequest.title || 'Anteprima'}
                    onCitySelect={() => {}} 
                    initialSelectedId={city.id}
                />
            )}

            {/* --- HEADER FISSO (NAVIGATION & ACTIONS) --- */}
            <div className="border-b border-slate-800 p-4 md:p-6 bg-slate-900/95 backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center sticky top-0 z-50 shadow-lg gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                    <button onClick={handleBackClick} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors border border-slate-700"><ArrowLeft className="w-6 h-6" /></button>
                    <div className="text-right md:text-left">
                        <div className="flex items-center gap-2">
                             <h2 className="text-2xl font-display font-bold text-white leading-none">{city.name}</h2>
                             {isDirty && <span className="text-[10px] bg-amber-500/20 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded font-bold uppercase animate-pulse">Modificato</span>}
                        </div>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1 block">{city.zone}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button onClick={() => handleSaveRequest()} disabled={isSaving} className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg transition-all border border-indigo-500 flex items-center justify-center gap-2 whitespace-nowrap">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} 
                        {isSaving ? '...' : 'Salva Modifiche'}
                    </button>
                    
                    <button onClick={() => handleSaveRequest('draft')} disabled={isSaving} className="flex-1 md:flex-none bg-amber-900/20 hover:bg-amber-900/40 text-amber-500 hover:text-amber-400 border border-amber-500/30 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap"><EyeOff className="w-4 h-4"/> Bozza</button>
                    
                    <button onClick={() => handleSaveRequest('published')} disabled={isSaving} className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl transition-all border border-emerald-500 flex items-center justify-center gap-2 whitespace-nowrap"><CheckCircle className="w-4 h-4"/> Pubblica Ora</button>
                </div>
            </div>

            {/* --- TABS NAVIGATION --- */}
            <div className="px-4 md:px-6 mt-4 md:mt-8">
                <div className="w-full overflow-x-auto pb-2 no-scrollbar">
                    <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800 inline-flex shadow-inner min-w-max gap-1">
                        {[
                            { id: 'general', label: 'Generali', icon: FileText },
                            { id: 'ratings', label: 'Valutazioni', icon: BarChart3 },
                            { id: 'culture', label: 'Storia', icon: BookOpen },
                            { id: 'info', label: 'Info & Guide', icon: Info },
                            { id: 'media', label: 'Media', icon: ImageIcon },
                            { id: 'pois', label: 'Punti Interesse', icon: MapPin },
                            { id: 'logs', label: 'Log AI', icon: Terminal },
                        ].map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 md:px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}><tab.icon className="w-4 h-4"/> {tab.label}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- CONTENT SWITCHER --- */}
            <div className="p-4 md:p-6 max-w-7xl mx-auto">
                {activeTab === 'general' && <TabGeneral />}
                {activeTab === 'ratings' && <TabRatings />}
                {activeTab === 'culture' && <TabCulture currentUser={currentUser} />}
                {activeTab === 'info' && <TabServices currentUser={currentUser} />}
                {activeTab === 'media' && <TabMedia />}
                {activeTab === 'pois' && <TabPois currentUser={currentUser} />}
                {activeTab === 'logs' && <TabLogs />}
            </div>
        </div>
    );
};

export const AdminCityEditor = ({ cityId, onBack, currentUser }: { cityId: string, onBack: () => void, currentUser: User }) => {
    return (
        <CityEditorProvider cityId={cityId}>
            <EditorOrchestrator onBack={onBack} currentUser={currentUser} />
        </CityEditorProvider>
    );
};
