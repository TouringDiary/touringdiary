
import { getStorageItem, setStorageItem } from './storageService';
import { supabase } from './supabaseClient';
import type { DatabaseRewardCatalog, DatabaseXpAction, DatabaseUserReward } from '../types/database';
import type { Database } from '../types/supabase';
import type { LevelInfo, Reward, RewardCategory, XpRule, UserReward } from '../types/index';
import { randomUUID } from '../utils/runtimeId';
import { areRewardsEnabled } from '../domain/gamification/rewardsGate';

export type { LevelInfo, Reward, RewardCategory, XpRule, UserReward };

/** Esito del riscatto premio — evita `null` semantico. */
export type ClaimRewardResult =
    | { success: true; reward: UserReward }
    | { success: false; reason: 'gamification_frozen' };

type GamificationLevelRow = Database['public']['Tables']['gamification_levels']['Row'];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Boundary riga livelli (API bootstrap o campi validati) → LevelInfo.
 * `description` obbligatoria nel dominio: se assente/null la riga viene scartata.
 */
function mapLevelFieldsToInfo(fields: {
    level: number;
    name: string;
    min_xp: number;
    icon: string;
    color: string;
    description: string | null;
}): LevelInfo | null {
    if (fields.description === null) return null;
    return {
        level: fields.level,
        name: fields.name,
        minXp: fields.min_xp,
        icon: fields.icon,
        color: fields.color,
        description: fields.description,
    };
}

function mapDbLevelToInfo(row: GamificationLevelRow): LevelInfo | null {
    return mapLevelFieldsToInfo(row);
}

/**
 * Valida un elemento del payload bootstrap `/api/bootstrap/levels`.
 * Accetta solo oggetti con i campi tipizzati attesi; altrimenti scarta.
 */
function tryParseBootstrapLevelItem(item: {
    level?: number;
    name?: string;
    min_xp?: number;
    icon?: string;
    color?: string;
    description?: string | null;
} | null | undefined): LevelInfo | null {
    if (item == null) return null;
    if (
        typeof item.level !== 'number' ||
        typeof item.name !== 'string' ||
        typeof item.min_xp !== 'number' ||
        typeof item.icon !== 'string' ||
        typeof item.color !== 'string'
    ) {
        return null;
    }
    if (item.description !== undefined && item.description !== null && typeof item.description !== 'string') {
        return null;
    }
    return mapLevelFieldsToInfo({
        level: item.level,
        name: item.name,
        min_xp: item.min_xp,
        icon: item.icon,
        color: item.color,
        description: typeof item.description === 'string' ? item.description : null,
    });
}

function isRewardCategory(value: string): value is RewardCategory {
    switch (value) {
        case 'food':
        case 'culture':
        case 'shopping':
        case 'general':
        case 'tech':
        case 'business':
            return true;
        default:
            return false;
    }
}

function isRewardType(value: string): value is Reward['type'] {
    return value === 'internal' || value === 'partner';
}

function isUserRewardStatus(value: string): value is UserReward['status'] {
    return value === 'active' || value === 'used';
}

/**
 * Boundary DB → dominio XpRule.
 * Campi opzionali: `null` DB ≡ assente → `undefined` (non inventa valori).
 */
function mapXpActionToRule(r: DatabaseXpAction): XpRule {
    const rule: XpRule = {
        key: r.action_key,
        label: r.label,
        xp: r.xp_amount,
    };
    if (r.icon !== null) rule.icon = r.icon;
    if (r.description !== null) rule.description = r.description;
    return rule;
}

/**
 * Boundary DB → dominio Reward.
 * Campi obbligatori nel dominio ma nullable nel typing Supabase: riga incompleta → scartata.
 */
function mapCatalogRowToReward(r: DatabaseRewardCatalog): Reward | null {
    if (
        r.description === null ||
        r.required_level === null ||
        r.icon === null ||
        r.type === null ||
        r.category === null
    ) {
        return null;
    }
    if (!isRewardType(r.type) || !isRewardCategory(r.category)) {
        return null;
    }

    const reward: Reward = {
        id: r.id,
        title: r.title,
        description: r.description,
        requiredLevel: r.required_level,
        icon: r.icon,
        type: r.type,
        category: r.category,
    };
    if (typeof r.active === 'boolean') {
        reward.active = r.active;
    }
    return reward;
}

/**
 * Boundary DB → dominio UserReward.
 * Chiavi e metadati obbligatori assenti/null → riga scartata (niente fallback inventati).
 */
function mapUserRewardRow(r: DatabaseUserReward): UserReward | null {
    if (
        r.reward_id === null ||
        r.user_id === null ||
        r.date_claimed === null ||
        r.status === null ||
        r.reward_title === null ||
        r.reward_category === null
    ) {
        return null;
    }
    if (!isUserRewardStatus(r.status) || !isRewardCategory(r.reward_category)) {
        return null;
    }

    return {
        instanceId: r.instance_id,
        rewardId: r.reward_id,
        userId: r.user_id,
        code: r.code,
        title: r.reward_title,
        dateClaimed: r.date_claimed,
        status: r.status,
        category: r.reward_category,
    };
}

// CACHE LOCALE LIVELLI
let levelsCache: LevelInfo[] = [];

// Fallback strutturale MINIMO (Necessario se il DB è offline o vuoto per evitare crash)
// NON è "dati" veri e propri, ma la struttura base del sistema.
export const LEVELS: LevelInfo[] = [
    { level: 1, name: 'Turista', minXp: 0, icon: '🎒', color: 'text-slate-400', description: 'Inizio' },
    { level: 2, name: 'Esploratore', minXp: 100, icon: '🧭', color: 'text-emerald-400', description: 'Step 2' },
    { level: 3, name: 'Veterano', minXp: 500, icon: '🥉', color: 'text-amber-600', description: 'Step 3' },
    { level: 4, name: 'Esperto', minXp: 1500, icon: '🥈', color: 'text-slate-300', description: 'Step 4' },
    { level: 5, name: 'Leggenda', minXp: 3000, icon: '👑', color: 'text-amber-400', description: 'Max' },
];

/**
 * Carica i livelli dal database (o usa cache/fallback).
 * Dovrebbe essere chiamata all'avvio dell'app.
 */
export const fetchLevelsAsync = async (): Promise<LevelInfo[]> => {
    if (levelsCache.length > 0) return levelsCache;
    
    try {
        let levels: LevelInfo[] | null = null;
        let source = 'API';

        // 1. TENTA IL CARICAMENTO TRAMITE API PROXY
        try {
            const apiResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/bootstrap/levels`);
            if (apiResponse.ok) {
                const apiData = await apiResponse.json();
                if (
                    typeof apiData === 'object' &&
                    apiData !== null &&
                    apiData.success === true &&
                    Array.isArray(apiData.data)
                ) {
                    const mapped: LevelInfo[] = [];
                    for (const item of apiData.data) {
                        const info = tryParseBootstrapLevelItem(item);
                        if (info) mapped.push(info);
                    }
                    if (mapped.length > 0) {
                        levels = mapped;
                    }
                }
            }
        } catch (apiError) {
            console.warn("[GamificationService] Local API failed, falling back to Supabase.", apiError);
        }

        // 2. FALLBACK A SUPABASE
        if (!levels) {
            source = 'Supabase';
            const { data: supaData, error } = await supabase
                .from('gamification_levels')
                .select('*')
                .order('level', { ascending: true });
            
            if (error) throw error;

            if (supaData && supaData.length > 0) {
                const mapped: LevelInfo[] = [];
                for (const row of supaData) {
                    const info = mapDbLevelToInfo(row);
                    if (info) mapped.push(info);
                }
                if (mapped.length > 0) {
                    levels = mapped;
                }
            }
        }

        console.log(`[GamificationService] Levels loaded from ${source}:`, levels?.length);

        levelsCache = levels && levels.length > 0 ? levels : LEVELS;
    } catch (e) {
        console.error("[GamificationService] Error loading levels:", e);
        levelsCache = LEVELS;
    }
    return levelsCache;
};

// Funzione sincrona per UI (richiede che fetchLevelsAsync sia stato chiamato prima, o usa fallback)
export const getCurrentLevel = (xp: number = 0): LevelInfo => {
    const levelsToCheck = levelsCache.length > 0 ? levelsCache : LEVELS;
    const level = [...levelsToCheck].reverse().find(l => xp >= l.minXp);
    return level || levelsToCheck[0];
};

export const getNextLevelProgress = (xp: number = 0) => {
    const levelsToCheck = levelsCache.length > 0 ? levelsCache : LEVELS;
    const current = getCurrentLevel(xp);
    const nextIndex = levelsToCheck.findIndex(l => l.level === current.level + 1);
    
    if (nextIndex === -1) {
        return { nextLevel: null, xpToNext: 0, progressPercent: 100, currentLevelXp: xp - current.minXp };
    }

    const nextLevel = levelsToCheck[nextIndex];
    const xpNeededForStep = nextLevel.minXp - current.minXp; 
    const xpGainedInStep = xp - current.minXp; 
    const progressPercent = Math.min(100, Math.max(0, (xpGainedInStep / xpNeededForStep) * 100));

    return {
        nextLevel,
        xpToNext: nextLevel.minXp - xp,
        progressPercent,
        currentLevelXp: xpGainedInStep
    };
};

// --- ADMIN MANAGEMENT (WRITE) ---

export const saveXpRule = async (rule: XpRule): Promise<void> => {
    const { error } = await supabase.from('xp_actions').upsert({
        action_key: rule.key,
        label: rule.label,
        xp_amount: rule.xp,
        icon: rule.icon,
        description: rule.description,
        updated_at: new Date().toISOString()
    });
    if(error) throw error;
};

export const saveReward = async (reward: Reward): Promise<void> => {
    const { error } = await supabase.from('rewards_catalog').upsert({
        id: reward.id,
        title: reward.title,
        description: reward.description,
        required_level: reward.requiredLevel,
        icon: reward.icon,
        type: reward.type,
        category: reward.category,
        active: reward.active !== false
    });
    if(error) throw error;
};

export const deleteReward = async (id: string): Promise<void> => {
    const { error } = await supabase.from('rewards_catalog').delete().eq('id', id);
    if(error) throw error;
};

// --- DATA FETCHING (READ) ---

export const getXpRulesAsync = async (): Promise<XpRule[]> => {
    try {
        const { data, error } = await supabase.from('xp_actions').select('*');
        if (error) throw error;
        if (!data) return [];

        return data.map(mapXpActionToRule);
    } catch (e) {
        console.error("Error fetching XP Rules:", e);
        return [];
    }
};

export const getRewardsAsync = async (): Promise<Reward[]> => {
    try {
        const { data, error } = await supabase
            .from('rewards_catalog')
            .select('*')
            .order('required_level', { ascending: true });
            
        if (error) throw error;
        if (!data) return [];

        const rewards: Reward[] = [];
        for (const row of data) {
            const mapped = mapCatalogRowToReward(row);
            if (mapped) rewards.push(mapped);
        }
        return rewards;
    } catch (e) {
        console.error("Fetch Rewards Error", e);
        return [];
    }
};

// --- WALLET & CLAIMING (USER) ---

export const getClaimedRewards = (userId: string): UserReward[] => {
    const localKey = `user_rewards_cache_${userId}`;
    const local = getStorageItem<UserReward[]>(localKey, []);

    syncUserRewards(userId).then(fresh => {
        if(fresh.length !== local.length || JSON.stringify(fresh) !== JSON.stringify(local)) {
            setStorageItem(localKey, fresh);
        }
    });

    return local; 
};

const syncUserRewards = async (userId: string): Promise<UserReward[]> => {
    if(!userId || userId === 'guest' || !UUID_REGEX.test(userId)) return [];
    try {
        const { data, error } = await supabase
            .from('user_rewards')
            .select('*')
            .eq('user_id', userId)
            .order('date_claimed', { ascending: false });

        if(error) throw error;
        if (!data) return [];

        const rewards: UserReward[] = [];
        for (const row of data) {
            const mapped = mapUserRewardRow(row);
            if (mapped) rewards.push(mapped);
        }
        return rewards;
    } catch(e) {
        return [];
    }
};

/**
 * Riscatta un premio del catalogo.
 * Gate centrale: se `areRewardsEnabled()` è false (freeze), non scrive nulla.
 */
export const claimReward = (userId: string, reward: Reward): ClaimRewardResult => {
    if (!areRewardsEnabled()) {
        console.info('[GamificationService] claimReward blocked — rewards frozen (feature.gamification.rewards OFF)');
        // Esito esplicito: solo freeze flag `feature.gamification.rewards` OFF — non è un errore di salvataggio.
        return { success: false, reason: 'gamification_frozen' };
    }

    const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `TD-${reward.category.substring(0,3).toUpperCase()}-${uniqueSuffix}`;
    const instanceId = randomUUID();
    const dateClaimed = new Date().toISOString();

    const newReward: UserReward = {
        instanceId,
        rewardId: reward.id,
        userId: userId,
        code: code,
        title: reward.title,
        dateClaimed,
        status: 'active',
        category: reward.category
    };

    const localKey = `user_rewards_cache_${userId}`;
    const current = getStorageItem<UserReward[]>(localKey, []);
    setStorageItem(localKey, [newReward, ...current]);

    if (userId !== 'guest') {
        supabase.from('user_rewards').insert({
            instance_id: instanceId,
            user_id: userId,
            reward_id: reward.id,
            code: code,
            status: 'active',
            reward_title: reward.title,
            reward_category: reward.category,
            date_claimed: dateClaimed
        }).then(({ error }) => {
            if(error) console.error("Claim reward DB error:", error);
        });
    }

    return { success: true, reward: newReward };
};

export const markRewardAsUsed = (instanceId: string): void => {
    supabase.from('user_rewards')
        .update({ status: 'used', date_used: new Date().toISOString() })
        .eq('instance_id', instanceId)
        .then(({ error }) => {
            if(error) console.error("Mark used DB error:", error);
        });
};
