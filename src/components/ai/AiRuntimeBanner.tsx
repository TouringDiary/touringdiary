import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { AiRuntimeStatus } from '@/services/ai/aiRuntimeStatus';

interface Props {
    status: AiRuntimeStatus;
    className?: string;
    /** Compact single-line banner for tight header rows. */
    variant?: 'default' | 'inline';
}

export const AiRuntimeBanner = ({ status, className = '', variant = 'default' }: Props) => {
    if (status.available) return null;

    const isEmergency = status.reason === 'EMERGENCY_STOP';
    const isInline = variant === 'inline';

    return (
        <div
            className={`${
                isInline
                    ? 'p-1.5 py-1 text-[10px] leading-tight items-center'
                    : 'p-3 text-xs items-start'
            } rounded-xl border font-bold flex gap-2 ${
                isEmergency
                    ? 'bg-red-950/40 border-red-500/50 text-red-300'
                    : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
            } ${className}`}
            role="status"
        >
            <AlertTriangle
                className={`${
                    isInline ? 'w-3.5 h-3.5' : 'w-4 h-4 mt-0.5'
                } shrink-0`}
            />
            <span className={`min-w-0 ${isInline ? 'truncate' : ''}`}>{status.message}</span>
        </div>
    );
};
