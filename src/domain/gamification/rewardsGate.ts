/**
 * Gate centrale premi Gamification (freeze vs claim/unlock).
 *
 * XP e livelli NON sono governati da questo gate — restano sempre attivi.
 * Export PDF NON è un premio gamification (benefit sottoscrizione).
 *
 * Flag: `feature.gamification.rewards`
 * - ON  → premi sbloccabili / riscattabili
 * - OFF → freeze: XP continua, claim e unlock UI bloccati
 */
import { PLATFORM_FEATURE_FLAG_KEYS } from '@/constants/platformFeatureFlags';
import { evaluateCachedFeatureFlag } from '@/domain/platformControl/platformFlagCache';

/** Key Platform Control — unica fonte per helper e hook. */
export const GAMIFICATION_REWARDS_FLAG_KEY =
    PLATFORM_FEATURE_FLAG_KEYS.GAMIFICATION_REWARDS;

/**
 * Messaggio positivo mostrato quando l'utente guadagna XP durante il freeze.
 * Non è un errore: informa che i punti restano e i premi arriveranno.
 */
export const REWARDS_FREEZE_XP_NOTICE = {
    headline: '🔒 Premio disponibile prossimamente.',
    body:
        'Continua ad accumulare XP: quando la Gamification sarà attivata, potrai utilizzare automaticamente tutti i punti già guadagnati.',
} as const;

/**
 * True se i premi del catalogo gamification sono sbloccabili/riscattabili.
 * Usare ovunque (service + UI) — non duplicare controlli ad hoc.
 *
 * Fallback sicuro: se il flag non è in cache, `false` (freeze).
 */
export function areRewardsEnabled(): boolean {
    const result = evaluateCachedFeatureFlag(GAMIFICATION_REWARDS_FLAG_KEY, {
        userRole: null,
        isAuthenticated: false,
    });
    return result?.enabled === true;
}

/** Inverso esplicito per copy / branch UI. */
export function areRewardsFrozen(): boolean {
    return !areRewardsEnabled();
}
