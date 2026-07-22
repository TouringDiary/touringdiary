import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useFeatureFlag } from '@/context/PlatformControlContext';
import { useSystemMessage } from '@/hooks/useSystemMessage';
import { PLATFORM_MESSAGE_TEMPLATE_KEYS } from '@/constants/platformFeatureFlags';

interface Props {
    flagKey: string;
    /** Message key if the flag evaluation has no `messageKey`. */
    defaultMessageKey?: string;
    className?: string;
}

/**
 * Amber paused banner (same visual language as AiRuntimeBanner).
 * Copy comes only from Centro di Controllo Message Templates via useSystemMessage.
 */
export const FeatureFlagPausedBanner: React.FC<Props> = ({
    flagKey,
    defaultMessageKey = PLATFORM_MESSAGE_TEMPLATE_KEYS.MODERATION_PHOTOS_PAUSED,
    className = '',
}) => {
    const flag = useFeatureFlag(flagKey);
    const messageKey = flag?.messageKey || defaultMessageKey;
    const { getText, loading } = useSystemMessage(messageKey);

    // Fail-closed: mostra avviso se non esplicitamente enabled (CC SoT).
    if (flag?.enabled === true) return null;
    if (loading) return null;

    const { title, body } = getText();
    const message = body || title;
    if (!message) return null;

    const showTitleAndBody = Boolean(title && body && title !== body);

    return (
        <div
            className={`p-3 rounded-xl border text-xs font-bold flex items-start gap-2 bg-amber-950/40 border-amber-500/50 text-amber-200 ${className}`}
            role="status"
        >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="min-w-0">
                {showTitleAndBody ? (
                    <>
                        <p className="text-sm font-bold uppercase tracking-wide">{title}</p>
                        <p className="text-xs font-bold mt-0.5 opacity-90 leading-relaxed">{body}</p>
                    </>
                ) : (
                    <span>{message}</span>
                )}
            </div>
        </div>
    );
};
