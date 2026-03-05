
import React, { useState, useEffect } from 'react';
import { Globe, LayoutList, Map as MapIcon, Wand2, Database, Microscope, Book, Trash2 } from 'lucide-react';
import { User } from '../../types/users';
import { useCityList } from '../../hooks/useCityList';
import { CitiesListTab } from './cities/CitiesListTab';
import { StrategicMapTab } from './cities/StrategicMapTab';
import { CityGeneratorModal } from './cities/CityGeneratorModal';
import { ProcessLogModal } from './cities/ProcessLogModal';
import { useCityGenerator } from '../../hooks/useCityGenerator';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';
import { CitySummary } from '../../types/index';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { ObservatoryLayout } from './observatory/ObservatoryLayout';
import { AdminGuideModal } from './common/AdminGuideModal'; // FIX: Correct relative path
import { useAdminStyles } from '../../hooks/useAdminStyles';

const AdminToast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
    <div className={`fixed top-6 right-6 z-[2000] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 border ${type === 'success' ? 'bg-emerald-600 border-emerald-400' : 'bg-red-600 border-red-400'} text-white max-w-md`}>
        {type === 'success' ? <CheckCircle className="w-6 h-6 shrink-0"/> : <AlertTriangle className="w-6 h-6 shrink-0"/>}
        <div className="font-bold text-sm">{message}</div>
        <button onClick={onClose} className="ml-4 hover:bg-white/20 p-1 rounded-full"><X className="w-4 h-4"/></button>
    </div>
);

interface CitiesManagerProps {
    onEdit: (id: string) => void;
    currentUser?: User; 
}

const getCityDisplayStatus = (city: CitySummary) => {
    if (city.status === 'published') return 'Online';
    if (city.status === 'restored') return 'Ripristinato';
    if (city.hasGeneratedContent) return 'Bozza';
    return 'Mancante';
};

export const CitiesManager = ({ onEdit, currentUser }: CitiesManagerProps) => {
    const list = useCityList();
    const { styles } = useAdminStyles();
    
    // GENERATOR HOOK
    const generator = useCityGenerator(list.forceReload);
    
    const [showAiModal, setShowAiModal] = useState(false);
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [showGuideModal, setShowGuideModal] = useState(false);
    const [processingCityName, setProcessingCityName] = useState('');
    const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);
    const [conflictData, setConflictData] = useState<{ existingCity: CitySummary, newName: string, poiCount: number, messageTitle: string, messageBody: string, confirmLabel: string } | null>(null);

    const [activeTab, setActiveTab] = useState<'map' | 'list' | 'observatory'>('map');

    const [showClearSessionModal, setShowClearSessionModal] = useState(false);

    // --- RECOVERY LOGIC ---
    useEffect(() => {
        if (generator.isRecovered) {
             setProcessingCityName("Sessione Recuperata");
             setShowProcessModal(true);
        }
    }, [generator.isRecovered]);

    const handleClearSessionRequest = () => {
        setShowClearSessionModal(true);
    };

    const confirmClearSession = () => {
        generator.clearSession();
        setShowProcessModal(false);
        setShowClearSessionModal(false);
    };

    const handleCloseProcessModal = () => {
        if (generator.isRecovered) {
             generator.clearSession();
        }
        setShowProcessModal(false);
        list.forceReload();
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const handleMagicAddRequest = async (name: string, poiCount: number) => {
        const existing = list.effectiveCities.find((c: CitySummary) => c.name.toLowerCase() === name.toLowerCase());
        
        if (existing) {
            const displayStatus = getCityDisplayStatus(existing);
            let title = "Città già presente";
            let body = "";
            let btnLabel = "Procedi";

            if (displayStatus === 'Online') {
                alert(`La città "${existing.name}" è già ONLINE. Non puoi rigenerarla da qui. Usa la modifica manuale.`);
                return;
            }

            if (displayStatus === 'Mancante') {
                title = "Popolare Città Mancante?";
                body = `La città "${existing.name}" esiste come **Scheletro Vuoto** (Stato: Mancante).\n\nVuoi avviare l'IA per generare **TUTTI** i contenuti (Storia, Rating, POI, Foto) partendo da zero?`;
                btnLabel = "Sì, Genera Tutto";
            } else if (displayStatus === 'Bozza') {
                title = "Integrare Bozza?";
                body = `La città "${existing.name}" è una **Bozza** con contenuti esistenti.\n\nVuoi avviare un **Merge Intelligente**? L'IA cercherà SOLO nuovi POI mancanti e aggiornerà i servizi, SENZA sovrascrivere la storia o i rating attuali.`;
                btnLabel = "Sì, Integra Dati";
            } else if (displayStatus === 'Ripristinato') {
                title = "Riattivare Città?";
                body = `La città "${existing.name}" era stata cancellata ed è in stato **Ripristinato**.\n\nVuoi trattarla come una bozza e cercare aggiornamenti?`;
                btnLabel = "Sì, Aggiorna";
            }

            setConflictData({ 
                existingCity: existing, 
                newName: name, 
                poiCount,
                messageTitle: title,
                messageBody: body,
                confirmLabel: btnLabel
            });
            setShowAiModal(false);
            return;
        }

        startGeneration(name, poiCount);
    };

    const confirmMergeGeneration = () => {
        if (!conflictData) return;
        startGeneration(conflictData.newName, conflictData.poiCount, conflictData.existingCity.id);
        setConflictData(null);
    };

    const startGeneration = async (name: string, poiCount: number, existingId?: string) => {
        setProcessingCityName(name); 
        setShowAiModal(false);
        setShowProcessModal(true);
        await generator.executeMagicAdd(name, poiCount, currentUser, existingId);
    };

    if (list.isInitialLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-500">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-bold uppercase tracking-widest text-xs">Caricamento Territorio...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in flex flex-col h-full max-w-full overflow-hidden relative">
            
            {toast && <AdminToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <DeleteConfirmationModal
                isOpen={!!conflictData}
                onClose={() => setConflictData(null)}
                onConfirm={confirmMergeGeneration}
                title={conflictData?.messageTitle || "Conferma"}
                message={conflictData?.messageBody || ""}
                confirmLabel={conflictData?.confirmLabel || "Procedi"}
                cancelLabel="Annulla"
                variant="info"
                icon={<Wand2 className="w-8 h-8 text-indigo-400 animate-pulse"/>}
            />

            <DeleteConfirmationModal
                isOpen={showClearSessionModal}
                onClose={() => setShowClearSessionModal(false)}
                onConfirm={confirmClearSession}
                title="Cancellare Log Sessione?"
                message="Vuoi cancellare definitivamente i log della sessione interrotta?"
                confirmLabel="Sì, Cancella"
                cancelLabel="Annulla"
                variant="danger"
                icon={<Trash2 className="w-8 h-8 text-red-500"/>}
            />

            {showAiModal && <CityGeneratorModal onClose={() => setShowAiModal(false)} onGenerate={handleMagicAddRequest} isGenerating={generator.isProcessing} />}
            
            {showProcessModal && (
                <ProcessLogModal 
                    isOpen={true} 
                    onClose={handleCloseProcessModal}
                    onClearSession={generator.isRecovered ? handleClearSessionRequest : undefined}
                    isProcessing={generator.isProcessing} 
                    isRecovered={generator.isRecovered}
                    logs={generator.processLog} 
                    reports={generator.stepReports}
                    cityName={processingCityName} 
                />
            )}
            
            {showGuideModal && (
                <AdminGuideModal 
                    guideKey="admin_manual_cities" 
                    onClose={() => setShowGuideModal(false)} 
                />
            )}

            {/* HEADER CLEAN DESIGN */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 mb-2">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-600 rounded-xl shadow-lg"><Globe className="w-8 h-8 text-white" /></div>
                    <div>
                        <h2 className={styles.admin_page_title}>Manager POI - DB</h2>
                        <p className={styles.admin_page_subtitle}>Gestione Territoriale e Contenuti</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowGuideModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg transition-all border border-blue-500"
                    >
                        <Book className="w-4 h-4"/> Manuale
                    </button>

                    <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800 shadow-md overflow-x-auto max-w-full">
                         <button 
                            onClick={() => setActiveTab('map')} 
                            className={`px-4 md:px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'map' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                        >
                            <MapIcon className="w-4 h-4"/> Aree Geografiche
                        </button>
                        <button 
                            onClick={() => setActiveTab('list')} 
                            className={`px-4 md:px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'list' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                        >
                            <LayoutList className="w-4 h-4"/> Edit City
                        </button>
                        <button 
                            onClick={() => setActiveTab('observatory')} 
                            className={`px-4 md:px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'observatory' ? 'bg-fuchsia-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                        >
                            <Microscope className="w-4 h-4"/> Osservatorio Dati
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 relative">
                {activeTab === 'map' ? (
                    <StrategicMapTab 
                        allCities={list.effectiveCities} 
                        onSelectCity={onEdit}
                        onMagicGenerate={handleMagicAddRequest}
                        onDataChange={list.forceReload} 
                    />
                ) : activeTab === 'list' ? (
                    <CitiesListTab 
                        list={list} 
                        onEdit={onEdit} 
                        currentUser={currentUser}
                    />
                ) : (
                    <ObservatoryLayout />
                )}
            </div>
        </div>
    );
};
