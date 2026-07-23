import React from 'react';
import { REWARDS_FREEZE_XP_NOTICE } from '@/domain/gamification/rewardsGate';

type Props = {
    /** `compact` per toast / card strette; `banner` per sezioni profilo. */
    variant?: 'compact' | 'banner';
    className?: string;
};

/**
 * Avviso positivo durante il freeze premi — non usare stili “errore”.
 */
export const RewardsFreezeNotice: React.FC<Props> = ({
    variant = 'banner',
    className = '',
}) => {
    if (variant === 'compact') {
        return (
            <div
                className={`rounded-xl border border-indigo-500/30 bg-indigo-950/40 px-3 py-2 text-left ${className}`}
                role="status"
            >
                <p className="text-xs font-bold text-indigo-200 leading-snug">
                    {REWARDS_FREEZE_XP_NOTICE.headline}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {REWARDS_FREEZE_XP_NOTICE.body}
                </p>
            </div>
        );
    }

    return (
        <div
            className={`rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/50 to-slate-900 p-4 ${className}`}
            role="status"
        >
            <p className="text-sm font-bold text-indigo-100">
                {REWARDS_FREEZE_XP_NOTICE.headline}
            </p>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {REWARDS_FREEZE_XP_NOTICE.body}
            </p>
        </div>
    );
};
