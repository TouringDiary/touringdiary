
import type { User } from '../types/users';
import { getStorageItem, setStorageItem } from './storageService';
import { supabase } from './supabaseClient';
import type { DatabaseRewardCatalog, DatabaseXpAction, DatabaseUserReward } from '../types/database';
import type { LevelInfo, Reward, RewardCategory, XpRule, UserReward } from '../types/index';

export type { LevelInfo, Reward, RewardCategory, XpRule, UserReward };

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
        // Supponiamo esista una tabella 'gamification_levels'. 
        // Se non esiste, questo catch catturerà l'errore e userà il fallback.
        const { data, error } = await supabase.from('gamification_levels').select('*').order('level', { ascending: true });
        
        if (error || !data || data.length === 0) {
            levelsCache = LEVELS;
        } else {
             levelsCache = data.map((l: any) => ({
                 level: l.level,
                 name: l.name,
                 minXp: l.min_xp,
                 icon: l.icon,
                 color: l.color,
                 description: l.description
             }));
        }
    } catch (e) {
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
        
        return (data as DatabaseXpAction[]).map(r => ({
            key: r.action_key,
            label: r.label,
            xp: r.xp_amount,
            icon: r.icon,
            description: r.description
        }));
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
        
        return (data as DatabaseRewardCatalog[]).map(r => ({
            id: r.id,
            title: r.title,
            description: r.description,
            requiredLevel: r.required_level,
            icon: r.icon,
            type: r.type as any,
            category: r.category as RewardCategory,
            active: r.active
        }));
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

        return (data as DatabaseUserReward[]).map(r => ({
            instanceId: r.instance_id,
            rewardId: r.reward_id,
            userId: r.user_id,
            code: r.code,
            title: r.reward_title || 'Premio',
            dateClaimed: r.date_claimed,
            status: r.status as any,
            category: (r.reward_category as RewardCategory) || 'general'
        }));
    } catch(e) {
        return [];
    }
};

export const claimReward = (userId: string, userName: string, reward: Reward): UserReward => {
    const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `TD-${reward.category.substring(0,3).toUpperCase()}-${uniqueSuffix}`;
    const instanceId = crypto.randomUUID();
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

    return newReward;
};

export const markRewardAsUsed = (instanceId: string): void => {
    supabase.from('user_rewards')
        .update({ status: 'used', date_used: new Date().toISOString() })
        .eq('instance_id', instanceId)
        .then(({ error }) => {
            if(error) console.error("Mark used DB error:", error);
        });
};
