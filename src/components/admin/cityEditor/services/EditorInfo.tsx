
import React, { useState } from 'react';
import { Loader2, RefreshCw, CheckCircle, Bot, Sparkles, Database, X } from 'lucide-react';
import { useCityEditor } from '@/context/CityEditorContext';
import { DeleteConfirmationModal } from '../../../common/DeleteConfirmationModal';
import { useSystemMessage } from '../../../../hooks/useSystemMessage'; 
import { User } from '../../../../types/users';
import { AdminTaxonomyManager } from '../../AdminTaxonomyManager'; 
import { ProcessLogModal } from '../../cities/ProcessLogModal';

// HOOK LOGICO ESTRATTO
import { useServiceRegeneration } from '../../../../hooks/admin/useServiceRegeneration';

// SUB-COMPONENTS
import { ServiceGuides } from './ServiceGuides';
import { ServiceEvents } from './ServiceEvents';
import { ServiceOperators } from './ServiceOperators';
import { ServiceGeneric } from './ServiceGeneric';

interface EditorInfoProps {
    currentUser: User;
    onOpenTaxonomy: () => void;
}

export const EditorInfo = ({ currentUser, onOpenTaxonomy }: EditorInfoProps) => {
    const { city } = useCityEditor();
    
    // STATE FOR TAXONOMY MODAL (Local UI State)
    const [isTaxonomyOpen, setIsTaxonomyOpen] = useState(false);

    // SYSTEM MESSAGE HOOK (DB TEXT ONLY)
    const { getText: getRegenMessage } = useSystemMessage('city_regen_merge');
    const regenMsg = getRegenMessage();

    // USE CUSTOM HOOK FOR REGENERATION LOGIC
    const {
        isProcessing,
        showConfirmRegen,
        setShowConfirmRegen,
        processLog,
        stepReports,
        handleRegenerateClick,
        executeRegeneration,
        closeProcessLog
    } = useServiceRegeneration(currentUser);

    if (!city) return null;

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in relative">
             
             {/* MODALE LOG PROCESSO (Avanzamento) */}
             <ProcessLogModal 
                isOpen={isProcessing || (stepReports.length > 0 && !showConfirmRegen && stepReports.some(s => s.status === 'success' || s.status === 'error'))}
                onClose={closeProcessLog}
                isProcessing={isProcessing}
                logs={processLog}
                reports={stepReports}
                cityName={city.name}
             />

             {/* MODALE TASSONOMIA (OVERLAY) */}
             {isTaxonomyOpen && (
                <div className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-sm flex flex-col animate-in fade-in">
                     <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#0f172a] shrink-0">
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-indigo-600 rounded-lg"><Database className="w-5 h-5 text-white"/></div>
                             <h2 className="text-lg font-bold text-white uppercase tracking-wide">Gestione Tassonomia</h2>
                         </div>
                         {/* TASTO CHIUSURA STANDARD ROSSO */}
                         <button onClick={() => setIsTaxonomyOpen(false)} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg">
                            <X className="w-6 h-6"/>
                        </button>
                     </div>
                     <div className="flex-1 overflow-hidden">
                         <AdminTaxonomyManager />
                     </div>
                </div>
            )}

             {/* CONFIRMATION MODAL - NO FALLBACKS */}
             {showConfirmRegen && (
                <DeleteConfirmationModal 
                    isOpen={true}
                    onClose={() => setShowConfirmRegen(false)}
                    onConfirm={executeRegeneration}
                    // REQUIRING DB DATA TO DISPLAY TEXT
                    title={regenMsg.title} 
                    // Replace literal \n\n with actual newlines if present (React handles \n mostly fine in whitespace-pre-line)
                    message={regenMsg.body ? regenMsg.body.replace(/\\n/g, '\n') : 'Procedere con la rigenerazione?'} 
                    confirmLabel="Procedi con Merge"
                    cancelLabel="Annulla"
                    variant="info"
                    icon={<RefreshCw className="w-8 h-8"/>}
                />
             )}

             {/* BARRA AI ASSISTANT / GESTIONE INTELLIGENTE */}
             <div className="flex flex-col xl:flex-row justify-between items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-indigo-500/20 shadow-lg">
                 <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
                    <div className="flex items-center gap-2 bg-indigo-900/10 px-4 py-2 rounded-xl border border-indigo-500/30">
                         <div className="p-1.5 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-900/40">
                             <Bot className="w-4 h-4 text-white"/>
                         </div>
                         <div>
                             <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">AI Assistant</span>
                             <span className="text-xs text-white font-bold">Gestione Intelligente</span>
                         </div>
                    </div>
                    
                    <div className="hidden md:block w-px h-8 bg-slate-800 mx-2"></div>
                    
                    <p className="text-[10px] text-slate-400 max-w-lg leading-tight hidden md:block">
                        L'IA analizza guide, eventi e servizi, unisce i dati duplicati e riempie le informazioni mancanti.
                    </p>
                 </div>

                 <div className="flex gap-2 w-full xl:w-auto justify-end">
                     {/* TASTO TASSONOMIA */}
                     <button onClick={() => setIsTaxonomyOpen(true)} className="bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white px-3 py-2.5 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 border border-slate-700 transition-colors">
                         <Database className="w-3.5 h-3.5"/> Tassonomia
                     </button>

                     <button 
                        onClick={handleRegenerateClick} 
                        disabled={isProcessing}
                        className={`
                            px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all active:scale-95 border
                            ${isProcessing ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500'}
                        `}
                    >
                        {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Sparkles className="w-3.5 h-3.5"/>}
                        {isProcessing ? 'ELABORAZIONE...' : 'RIGENERA PAGINA (MERGE & FIX)'}
                    </button>
                 </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <ServiceGuides />
                <ServiceEvents />
            </div>

            <ServiceOperators />
            <ServiceGeneric />
        </div>
    );
};
