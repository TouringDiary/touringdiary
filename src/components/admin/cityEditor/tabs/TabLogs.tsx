
import React, { useMemo } from 'react';
import { Terminal, CheckCircle, AlertTriangle, Timer, ShieldAlert } from 'lucide-react';
import { useCityEditor } from '@/context/CityEditorContext';
import { ProcessLogModal } from '../../../cities/ProcessLogModal';

// Helper parser locale
const parseLogsToReport = (logs: string[]) => {
    const report: any[] = [];
    
    logs.forEach(log => {
        let message = log.replace(/^\[.*?\]\s*/, '').trim();
        
        const endMatch = message.match(/✅ Fine: (.*?) \(.*?\) in ([\d\.]+)s/);
        const errorMatch = message.match(/❌ Errore (.*?) \(in ([\d\.]+)s\):/);
        const oldEndMatch = message.includes('✅ Fine:') && !endMatch;
        const overrideMatch = message.includes('[MANUAL_OVERRIDE_HAS_CONTENT]');

        if (endMatch) {
            const stepName = endMatch[1].trim();
            const durationSec = parseFloat(endMatch[2]);
            
            report.push({ 
                step: stepName, 
                status: 'success', 
                duration: `${durationSec}s`, 
                durationMs: durationSec * 1000 
            });
        } else if (errorMatch) {
            const stepName = errorMatch[1].trim();
            const durationSec = parseFloat(errorMatch[2]);
            
            report.push({ 
                step: stepName, 
                status: 'error', 
                duration: `${durationSec}s`, 
                durationMs: durationSec * 1000 
            });
        } else if (oldEndMatch) {
             const stepName = message.replace('✅ Fine:', '').trim();
             report.push({ step: stepName, status: 'success', duration: 'N/D', durationMs: 0 });
        } else if (overrideMatch) {
             report.push({ step: 'Forzatura Manuale Contenuti', status: 'success', duration: 'N/D', durationMs: 0 });
        }
    });
    return report;
};

export const TabLogs = () => {
    const { city, updateDetailField } = useCityEditor();

    const reportData = useMemo(() => {
        return city?.details?.generationLogs ? parseLogsToReport(city.details.generationLogs) : [];
    }, [city?.details?.generationLogs]);

    const totalTimeStr = useMemo(() => {
        const totalMs = reportData.reduce((acc, curr) => acc + (curr.durationMs || 0), 0);
        const totalSec = Math.floor(totalMs / 1000);
        const totalMin = Math.floor(totalSec / 60);
        return totalMin > 0 ? `${totalMin}m ${totalSec % 60}s` : `${totalSec}s`;
    }, [reportData]);

    const hasManualOverride = useMemo(() => {
        return city?.details?.generationLogs?.some(log => log.includes('[MANUAL_OVERRIDE_HAS_CONTENT]')) || false;
    }, [city?.details?.generationLogs]);

    const toggleManualOverride = () => {
        if (!city) return;
        const currentLogs = city.details.generationLogs || [];
        let newLogs = [...currentLogs];
        
        if (hasManualOverride) {
            newLogs = newLogs.filter(log => !log.includes('[MANUAL_OVERRIDE_HAS_CONTENT]'));
        } else {
            newLogs.push(`[${new Date().toISOString()}] ✅ [MANUAL_OVERRIDE_HAS_CONTENT] Forzatura manuale stato MANCANTE -> ONLINE`);
        }
        updateDetailField('generationLogs', newLogs);
    };

    if (!city) return null;

    return (
        <div className="bg-[#0f172a] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden h-[600px] flex flex-col animate-in fade-in">
            <div className="p-4 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between shrink-0">
                 <div className="flex items-center gap-3">
                     <div className="p-2 bg-indigo-600 rounded-lg"><Terminal className="w-5 h-5 text-white"/></div>
                     <h3 className="text-xl font-bold text-white font-display">Log Generazione AI</h3>
                 </div>
                 
                 <div className="flex items-center gap-3 bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800">
                     <ShieldAlert className={`w-5 h-5 ${hasManualOverride ? 'text-emerald-500' : 'text-slate-500'}`} />
                     <div>
                         <label className="flex items-center gap-2 cursor-pointer">
                             <input 
                                 type="checkbox" 
                                 checked={hasManualOverride}
                                 onChange={toggleManualOverride}
                                 className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 bg-slate-800"
                             />
                             <span className="text-sm font-bold text-slate-300">Forza Contenuti Generati</span>
                         </label>
                         <p className="text-[10px] text-slate-500 mt-0.5">Usa se i log si sono persi ma le pagine sono piene.</p>
                     </div>
                 </div>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* LEFT: CONSOLE (RAW) */}
                <div className="flex-1 bg-black p-4 overflow-y-auto font-mono text-[10px] text-slate-400 space-y-1 md:border-r border-slate-800 min-w-[300px] custom-scrollbar">
                     <h4 className="text-slate-500 font-bold uppercase mb-2 border-b border-slate-900 pb-1 sticky top-0 bg-black">Console Output</h4>
                     {city.details.generationLogs && city.details.generationLogs.length > 0 ? (
                         city.details.generationLogs.map((log, i) => (
                             <div key={i} className={`${log.includes('ERRORE') ? 'text-red-400' : log.includes('✅') ? 'text-emerald-400' : log.includes('FATTO') || log.includes('COMPLETATO') || log.includes('RECAP') ? 'text-green-300 font-bold' : 'text-slate-300'} border-b border-slate-900/50 pb-0.5 break-all`}>
                                 {log}
                             </div>
                         ))
                     ) : (
                         <div className="text-slate-600 italic">Nessun log registrato.</div>
                     )}
                </div>

                {/* RIGHT: TABLE (PARSED) */}
                <div className="flex-[1.5] bg-slate-900 overflow-y-auto p-4 custom-scrollbar">
                    <h4 className="text-slate-300 font-bold uppercase text-xs mb-4 flex items-center gap-2 sticky top-0 bg-slate-900 pb-2 border-b border-slate-800 z-10">
                        <Timer className="w-4 h-4 text-indigo-400"/> Analisi Performance
                    </h4>
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-950 text-slate-500 text-[9px] uppercase font-bold sticky top-8 z-10">
                            <tr>
                                <th className="p-3 border-b border-slate-800">Step Operativo</th>
                                <th className="p-3 border-b border-slate-800 text-center">Stato</th>
                                <th className="p-3 border-b border-slate-800 text-right">Durata</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-xs">
                            {reportData.map((rep, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="p-3 text-slate-300 font-medium truncate max-w-[200px]">{rep.step}</td>
                                    <td className="p-3 text-center">
                                        {rep.status === 'success' ? <span className="text-emerald-500 flex justify-center"><CheckCircle className="w-4 h-4"/></span> : <span className="text-red-500 flex justify-center"><AlertTriangle className="w-4 h-4"/></span>}
                                    </td>
                                    <td className="p-3 text-right font-mono text-slate-400">{rep.duration}</td>
                                </tr>
                            ))}
                            {reportData.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-slate-600">Nessun dato.</td></tr>}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-950/80 font-bold text-xs border-t-2 border-slate-800">
                                <td className="p-4 text-right text-slate-300 uppercase tracking-widest" colSpan={2}>TEMPO TOTALE GENERAZIONE:</td>
                                <td className="p-4 text-right text-emerald-400 font-mono text-sm">
                                    {totalTimeStr}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};
