import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAiRuntimeGate } from '@/hooks/useAiRuntimeGate';

/** Sticky notice when Centro di Controllo / emergenza ha disabilitato l'AI per questo ruolo. */
export const AdminAiRuntimeBanner: React.FC = () => {
    const { aiBlocked, blockTitle, blockMessage } = useAiRuntimeGate();
    if (!aiBlocked) return null;

    return (
        <div
            role="status"
            className="mx-4 md:mx-6 mt-4 rounded-xl border border-amber-500/40 bg-amber-950/40 px-4 py-3 flex items-start gap-3"
        >
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
                <p className="text-sm font-bold text-amber-200 uppercase tracking-wide">
                    {blockTitle}
                </p>
                <p className="text-xs text-amber-100/80 mt-1 leading-relaxed">{blockMessage}</p>
                <p className="text-[10px] text-amber-500/80 mt-2 uppercase tracking-wider font-bold">
                    Funzioni AI disabilitate dal Centro di Controllo
                </p>
            </div>
        </div>
    );
};
