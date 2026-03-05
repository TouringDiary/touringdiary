
import React, { useRef, useEffect } from 'react';
import { X, Loader2, Terminal, Timer, CheckCircle, AlertTriangle, Activity, Database, History, Trash2 } from 'lucide-react';
import { StepReport } from '../../../hooks/useCityGenerator';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onClearSession?: () => void; // NEW
    isProcessing: boolean;
    isRecovered?: boolean; // NEW
    logs: string[];
    reports: StepReport[];
    cityName?: string;
}

const formatMsToTime = (ms: number) => {
    if (!ms) return '-';
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    const secStr = Number(seconds) < 10 ? `0${seconds}` : seconds;
    
    if (minutes > 0) return `${minutes}m ${secStr}s`;
    return `${seconds}s`;
};

export const ProcessLogModal = ({ isOpen, onClose, onClearSession, isProcessing, isRecovered, logs, reports, cityName }: Props) => {
    const logEndRef = useRef<HTMLDivElement>(null);
    const tableEndRef = useRef<HTMLTableRowElement>(null);

    useEffect(() => {
        if (isOpen) {
            if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            if (tableEndRef.current) tableEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [logs.length, reports.length, isOpen]);

    if (!isOpen) return null;

    const totalTimeMs = reports.reduce((acc, curr) => acc + (curr.durationMs || 0), 0);
    const totalTimeFormatted = formatMsToTime(totalTimeMs);
    const successCount = reports.filter(r => r.status === 'success').length;
    const totalSteps = reports.length;
    const progressPercent = totalSteps > 0 ? Math.round((successCount / totalSteps) * 100) : 0;

    return (
        <div className="fixed inset-0 z-[3000] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-slate-900 w-full max-w-[95vw] h-[90vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/10">
                
                {/* HEADER */}
                <div className={`p-4 border-b ${isRecovered ? 'border-amber-500/50 bg-amber-950/20' : isProcessing ? 'border-blue-500/30 bg-blue-950/10' : 'border-emerald-500/30 bg-emerald-950/10'} flex justify-between items-center shrink-0 transition-colors duration-500`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${isRecovered ? 'bg-amber-500/20 text-amber-500' : isProcessing ? 'bg-blue-500/20 text-blue-500 animate-pulse' : 'bg-emerald-500/20 text-emerald-500'}`}>
                            {isRecovered ? <History className="w-6 h-6"/> : isProcessing ? <Activity className="w-6 h-6"/> : <CheckCircle className="w-6 h-6"/>}
                        </div>
                        <div>
                            <h3 className="font-black text-white text-lg uppercase tracking-wider flex items-center gap-2">
                                {isRecovered ? 'Sessione Ripristinata' : isProcessing ? 'Generazione in Corso' : 'Processo Completato'}
                                {isProcessing && <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">{progressPercent}%</span>}
                            </h3>
                            <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
                                Target: <span className="text-white font-bold">{cityName || 'Sconosciuto'}</span>
                                <span className="text-slate-600">|</span>
                                {isRecovered ? 'Processo Interrotto' : `Tempo Parziale: ${totalTimeFormatted}`}
                            </p>
                        </div>
                    </div>
                    {!isProcessing && (
                        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                            <X className="w-6 h-6"/>
                        </button>
                    )}
                </div>
                
                {/* ALERT RECOVERY */}
                {isRecovered && (
                    <div className="bg-amber-500/10 border-b border-amber-500/20 p-2 px-4 flex items-center justify-between text-xs text-amber-200">
                        <div className="flex items-center gap-2">
                             <AlertTriangle className="w-4 h-4"/>
                             <span>È stata rilevata una sessione precedente interrotta. I log mostrano lo stato al momento dell'interruzione.</span>
                        </div>
                        {onClearSession && (
                            <button onClick={onClearSession} className="text-[10px] font-bold uppercase bg-amber-900/30 hover:bg-amber-900/50 px-3 py-1 rounded border border-amber-500/30 flex items-center gap-1 transition-colors">
                                <Trash2 className="w-3 h-3"/> Scarta Sessione
                            </button>
                        )}
                    </div>
                )}
                
                {/* SPLIT VIEW CONTENT */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                        
                    {/* LEFT: CONSOLE (RAW) */}
                    <div className="flex-[1.4] bg-[#050505] p-0 flex flex-col border-r border-slate-800 min-w-[300px]">
                        <div className="bg-slate-900/50 p-2 border-b border-slate-800 flex justify-between items-center">
                            <h4 className="text-slate-500 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                                <Terminal className="w-3 h-3"/> Console Output
                            </h4>
                            <span className="text-[10px] text-slate-600 font-mono">{logs.length} linee</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-1.5 scroll-smooth">
                            {logs.map((log, i) => (
                                <div key={i} className={`pb-1 border-b border-white/5 break-all ${log.includes('ERRORE') ? 'text-red-400 bg-red-900/10 p-1 rounded' : log.includes('✅') ? 'text-emerald-400' : log.includes('⏳') ? 'text-blue-400' : 'text-slate-300'}`}>
                                    <span className="opacity-30 mr-2 select-none">{i+1}</span>
                                    {log}
                                </div>
                            ))}
                            <div ref={logEndRef} className="h-4" />
                        </div>
                    </div>

                    {/* RIGHT: STRUCTURED TABLE */}
                    <div className="flex-1 bg-slate-900 flex flex-col min-w-[350px]">
                         <div className="bg-slate-900 p-2 border-b border-slate-800 flex justify-between items-center">
                            <h4 className="text-slate-400 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                                <Timer className="w-3 h-3 text-indigo-400"/> Report Strutturato
                            </h4>
                            <span className="text-[10px] text-indigo-400 font-bold bg-indigo-900/20 px-2 py-0.5 rounded border border-indigo-500/20">
                                {successCount} / {totalSteps} Step
                            </span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-0 custom-scrollbar scroll-smooth relative">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-950 text-slate-500 text-[9px] uppercase font-bold sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="p-3 border-b border-slate-800">Step Operativo</th>
                                        <th className="p-3 border-b border-slate-800 text-center">Stato</th>
                                        <th className="p-3 border-b border-slate-800 text-center">Elementi</th>
                                        <th className="p-3 border-b border-slate-800 text-right">Durata</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50 text-xs">
                                    {reports.map((rep, idx) => (
                                        <tr key={idx} className={`transition-all duration-500 ${rep.status === 'processing' ? 'bg-blue-900/10' : rep.status === 'success' ? 'bg-emerald-900/5' : rep.status === 'error' ? 'bg-red-900/10' : ''}`}>
                                            <td className="p-3 text-slate-300 font-medium flex items-center gap-2 border-l-2 border-transparent" style={{ borderLeftColor: rep.status === 'processing' ? '#3b82f6' : rep.status === 'success' ? '#10b981' : rep.status === 'error' ? '#ef4444' : 'transparent' }}>
                                                {rep.step}
                                                {rep.status === 'processing' && <Loader2 className="w-3 h-3 animate-spin text-blue-500 ml-auto"/>}
                                            </td>
                                            <td className="p-3 text-center">
                                                {rep.status === 'success' && <span className="text-emerald-500 bg-emerald-900/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Fatto</span>}
                                                {rep.status === 'error' && <span className="text-red-500 bg-red-900/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase" title={rep.details}>Errore</span>}
                                                {rep.status === 'pending' && <span className="text-slate-600 text-[10px] uppercase font-bold opacity-50">In Coda</span>}
                                                {rep.status === 'processing' && <span className="text-blue-500 text-[9px] uppercase font-bold animate-pulse">Eseguo...</span>}
                                            </td>
                                            <td className="p-3 text-center font-mono text-white">
                                                {rep.status === 'success' ? (
                                                    rep.details ? (
                                                        <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded">{rep.details}</span>
                                                    ) : (
                                                        rep.itemsCount > 0 ? <span className="font-bold">{rep.itemsCount}</span> : '-'
                                                    )
                                                ) : ''}
                                            </td>
                                            <td className="p-3 text-right font-mono text-slate-400">
                                                {rep.durationMs > 0 ? formatMsToTime(rep.durationMs) : ''}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-950/50 font-bold border-t-2 border-slate-800">
                                        <td className="p-3 text-right text-slate-300 uppercase tracking-widest" colSpan={3}>TEMPO TOTALE:</td>
                                        <td className="p-3 text-right text-emerald-400 font-mono text-sm">{totalTimeFormatted}</td>
                                    </tr>
                                    <tr ref={tableEndRef}></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                {/* FOOTER ACTIONS */}
                <div className={`p-4 border-t ${isRecovered ? 'border-amber-500/30 bg-amber-950/10' : isProcessing ? 'border-blue-500/30 bg-blue-950/10' : 'border-slate-800 bg-slate-900'} text-center shrink-0 transition-colors duration-500`}>
                    {isProcessing ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-2">
                            <div className="flex items-center gap-3 text-blue-400 font-bold uppercase tracking-widest text-sm animate-pulse">
                                <Loader2 className="w-5 h-5 animate-spin"/>
                                Lavoro in corso... Non chiudere la finestra
                            </div>
                            <div className="w-full max-w-md h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
                                    style={{ width: `${Math.max(5, progressPercent)}%` }}
                                ></div>
                            </div>
                            <p className="text-[10px] text-slate-500">I log verranno salvati automaticamente nel database a fine processo.</p>
                        </div>
                    ) : (
                        <div className="flex justify-between items-center animate-in slide-in-from-bottom-4">
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Database className="w-4 h-4 text-emerald-500"/>
                                Log salvati localmente & DB.
                            </div>
                            <button 
                                onClick={onClose} 
                                className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/30 hover:scale-105 active:scale-95 flex items-center gap-2"
                            >
                                <CheckCircle className="w-5 h-5"/> {isRecovered ? 'Chiudi Recupero' : 'Chiudi Report & Aggiorna'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
