import { useCallback } from 'react';
import { useUser } from '@/context/UserContext';
import { usePlatformControl } from '@/context/PlatformControlContext';
import { getAiRuntimeStatus } from '@/services/ai/aiRuntimeStatus';

/**
 * UI gate for AI actions — mirrors getAiRuntimeStatus (Centro di Controllo + ACC).
 * UI-agnostic: does not render toast/alert/banner; callers own presentation.
 */
export function useAiRuntimeGate() {
    const { user } = useUser();
    const { evaluationNowMs } = usePlatformControl();
    void evaluationNowMs;

    const status = getAiRuntimeStatus({
        userRole: user?.role ?? null,
        isAuthenticated: Boolean(user && user.role !== 'guest'),
    });

    const aiBlocked = !status.available;
    const blockTitle = status.title || 'AI non disponibile';
    const blockMessage =
        status.message || 'I servizi AI non sono disponibili al momento.';

    /** Returns false when AI is blocked; caller shows any user feedback. */
    const guardAiAction = useCallback((): boolean => {
        return !aiBlocked;
    }, [aiBlocked]);

    return {
        aiAvailable: status.available,
        aiBlocked,
        blockTitle,
        blockMessage,
        reason: status.reason,
        guardAiAction,
    };
}
