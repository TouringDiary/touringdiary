
import React from 'react';
import { AlertTriangle, Check, Clock } from 'lucide-react';
import { PointOfInterest } from '../../../types/index';
import { analyzeSchedule } from '../../../utils/scheduleUtils';

interface Props {
    poi: PointOfInterest;
    compact?: boolean;
}

export const ScheduleMatrix = ({ poi, compact = false }: Props) => {
    const analysis = analyzeSchedule(poi);
    const days = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

    return (
        <div className={`flex flex-col ${compact ? 'gap-1' : 'gap-2'}`}>
            {/* Header / Warning */}
            {!compact && (
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3"/> Copertura Settimanale
                    </span>
                    {analysis.isSuspicious && (
                        <span className="text-[9px] font-bold text-amber-500 bg-amber-900/20 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-2.5 h-2.5"/> {analysis.suspicionReason}
                        </span>
                    )}
                </div>
            )}

            {/* Matrix Row */}
            <div className="flex gap-0.5">
                {analysis.matrix.map((isOpen, idx) => (
                    <div 
                        key={idx}
                        className={`
                            flex-1 flex flex-col items-center justify-center rounded-md border
                            ${compact ? 'h-6' : 'h-8'}
                            ${isOpen 
                                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-500' 
                                : 'bg-slate-800/50 border-slate-700 text-slate-600'
                            }
                        `}
                        title={isOpen ? 'Aperto' : 'Chiuso'}
                    >
                        <span className="text-[8px] font-black uppercase">{days[idx]}</span>
                        {/* Dot indicator */}
                        <div className={`w-1 h-1 rounded-full mt-0.5 ${isOpen ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                    </div>
                ))}
            </div>

            {/* Text Summary */}
            {!compact && (
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[10px] text-slate-400 font-mono truncate">
                    {analysis.description}
                </div>
            )}
            
            {/* Compact Indicator for Suspicious */}
            {compact && analysis.isSuspicious && (
                 <div className="text-[8px] text-amber-500 font-bold truncate">
                    ⚠️ {analysis.suspicionReason}
                </div>
            )}
        </div>
    );
};
