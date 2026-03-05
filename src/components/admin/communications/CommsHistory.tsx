
import React from 'react';
import { AdminMessageLog } from '../../../services/communicationService';
import { CheckCircle, Loader2, Mail, Bell, AlertTriangle } from 'lucide-react';

interface CommsHistoryProps {
    logs: AdminMessageLog[];
}

export const CommsHistory = ({ logs }: CommsHistoryProps) => {
    if (logs.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 italic bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-800 m-6">
                <Mail className="w-12 h-12 mb-4 opacity-20"/>
                <p>Nessun messaggio inviato nello storico.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950/80 backdrop-blur-md text-slate-500 text-[10px] uppercase font-bold sticky top-0 z-10 border-b border-slate-800 shadow-sm">
                    <tr>
                        <th className="p-4 w-40">Data</th>
                        <th className="p-4 w-32">Tipo</th>
                        <th className="p-4 w-48">Destinatari</th>
                        <th className="p-4">Oggetto</th>
                        <th className="p-4 w-24 text-center">Stato</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                    {logs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-800/30 transition-colors group">
                            <td className="p-4 font-mono text-xs text-slate-400">{new Date(log.date).toLocaleString()}</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wide flex items-center gap-1.5 w-fit ${
                                    log.type === 'email' ? 'bg-blue-900/30 text-blue-400 border border-blue-500/20' : 
                                    log.type === 'system_alert' ? 'bg-amber-900/30 text-amber-400 border border-amber-500/20' : 
                                    'bg-indigo-900/30 text-indigo-400 border border-indigo-500/20'
                                }`}>
                                    {log.type === 'email' ? <Mail className="w-3 h-3"/> : log.type === 'system_alert' ? <AlertTriangle className="w-3 h-3"/> : <Bell className="w-3 h-3"/>}
                                    {log.type.replace('_', ' ')}
                                </span>
                            </td>
                            <td className="p-4">
                                <span className="text-xs font-bold text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                                    {log.targetGroup.replace('_', ' ').toUpperCase()}
                                </span>
                            </td>
                            <td className="p-4 font-bold text-white">{log.subject}</td>
                            <td className="p-4 text-center">
                                {log.status === 'sent' ? (
                                    <span className="text-emerald-500 flex justify-center bg-emerald-900/10 p-1.5 rounded-full mx-auto w-fit"><CheckCircle className="w-4 h-4"/></span>
                                ) : (
                                    <span className="text-slate-500 flex justify-center"><Loader2 className="w-4 h-4 animate-spin"/></span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
