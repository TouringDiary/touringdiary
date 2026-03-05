
import React from 'react';
import { PauseCircle, CheckCircle } from 'lucide-react';

interface AnalysisReport {
    isOpen: boolean;
    totalRequested: number;
    processed: number;
    success: number;
    errors: number;
    quotaExceeded: boolean;
}

interface ImportReportModalProps {
    report: AnalysisReport;
    onClose: () => void;
}

export const ImportReportModal = ({ report, onClose }: ImportReportModalProps) => {
    if (!report.isOpen) return null;

    return (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 relative flex flex-col items-center text-center">
                 <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 shadow-xl mb-4 ${report.quotaExceeded ? 'bg-amber-500/20 border-amber-500' : 'bg-emerald-500/20 border-emerald-500'}`}>
                     {report.quotaExceeded ? <PauseCircle className="w-10 h-10 text-amber-500"/> : <CheckCircle className="w-10 h-10 text-emerald-500"/>}
                 </div>
                 
                 <h3 className="text-2xl font-bold text-white mb-2">
                     {report.quotaExceeded ? 'Analisi Interrotta' : 'Analisi Completata'}
                 </h3>
                 
                 <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                     {report.quotaExceeded 
                        ? "Abbiamo rilevato il limite di quota dell'API Gemini Flash. Il processo è stato messo in pausa per evitare errori." 
                        : "L'intelligenza artificiale ha terminato la classificazione dei punti di interesse selezionati."}
                 </p>

                 <div className="grid grid-cols-2 gap-4 w-full mb-6">
                     <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Processati</span>
                         <div className="text-xl font-black text-white">{report.processed} <span className="text-sm text-slate-600">/ {report.totalRequested}</span></div>
                     </div>
                     <div className="bg-emerald-900/10 p-3 rounded-xl border border-emerald-500/20">
                         <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Successo</span>
                         <div className="text-xl font-black text-emerald-400">{report.success}</div>
                     </div>
                     {report.errors > 0 && (
                         <div className="bg-red-900/10 p-3 rounded-xl border border-red-500/20 col-span-2">
                             <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Errori / Falliti</span>
                             <div className="text-xl font-black text-red-400">{report.errors}</div>
                         </div>
                     )}
                 </div>

                 <button onClick={onClose} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold uppercase text-xs transition-colors">
                    Chiudi Report
                </button>
            </div>
        </div>
    );
};
