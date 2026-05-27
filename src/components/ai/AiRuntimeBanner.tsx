import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { AiRuntimeStatus } from '@/services/ai/aiRuntimeStatus';

interface Props {
    status: AiRuntimeStatus;
    className?: string;
}

export const AiRuntimeBanner = ({ status, className = '' }: Props) => {
    if (status.available) return null;

    const isEmergency = status.reason === 'EMERGENCY_STOP';

    return (
        <div
            className={`p-3 rounded-xl border text-xs font-bold flex items-start gap-2 ${
                isEmergency
                    ? 'bg-red-950/40 border-red-500/50 text-red-300'
                    : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
            } ${className}`}
            role="status"
        >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{status.message}</span>
        </div>
    );
};
