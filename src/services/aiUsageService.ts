import { supabase } from './supabaseClient';
import { getSetting, SETTINGS_KEYS } from './settingsService';
import { User } from '../types/users';
import { MarketingConfig, AiLimitsConfig } from '../types/models/Sponsor';
import { getStorageItem, setStorageItem } from './storageService';

interface AiQuota {
    count: number; // Totale Crediti Usati
    limit: number; // Limite Crediti (Commerciale)
    date: string;
    canProceed: boolean; 
    
    // Stats tecniche
    flashCount: number;
    proCount: number;
    costEstimate: number;
}

const getTodayString = () => new Date().toISOString().split('T')[0];
const GUEST_STORAGE_KEY = 'touring_guest_ai_usage';

// COSTI CREDITI (Ponderazione)
export const AI_COSTS = {
    flash: 1,
    pro: 5
};

// DEFAULT LIMITS (Crediti totali mensili di fallback)
const DEFAULT_LIMITS: AiLimitsConfig = {
    guest: 5,           // 5 Crediti (5 Flash o 1 Pro)
    registered: 30,     // 30 Crediti
    premium: 100,       // 100 Crediti
    premium_plus: 500,  // 500 Crediti (Traveler Pro+)
    sponsor: 200,       // 200 Crediti
    pro: 300,           // 300 Crediti
    shop: 500           // 500 Crediti (Alto volume)
};

// LIMITI TECNICI ANTI-ABUSO (Hard Cap numero richieste)
const TECH_HARD_CAP = 2000;

/**
 * Verifica se l'utente può eseguire una richiesta AI.
 * Legge i limiti dinamicamente dalla configurazione globale.
 */
export const checkAiQuota = async (user: User, model: 'flash' | 'pro' = 'flash'): Promise<AiQuota> => {
    const today = getTodayString();
    const requestCost = AI_COSTS[model];
    
    // 1. RECUPERA CONFIGURAZIONE LIMITI DALL'ADMIN
    let roleLimits = { ...DEFAULT_LIMITS };
    try {
         const settings = await getSetting<MarketingConfig>(SETTINGS_KEYS.MARKETING_PRICES);
         if (settings && settings.aiLimits) {
             roleLimits = { ...DEFAULT_LIMITS, ...settings.aiLimits };
         }
    } catch(e) { 
        console.warn("Failed to load dynamic limits, using defaults", e); 
    }

    // --- GESTIONE GUEST ---
    if (!user || user.role === 'guest') {
        const guestLimit = roleLimits.guest;
        
        let currentCredits = 0;
        const stored = getStorageItem<any>(GUEST_STORAGE_KEY, null);
        if (stored && stored.date === today) {
            // Per guest salviamo direttamente i crediti totali usati
            currentCredits = stored.count || 0; 
        }

        return { 
            count: currentCredits, 
            limit: guestLimit,
            date: today, 
            canProceed: (currentCredits + requestCost) <= guestLimit,
            
            flashCount: currentCredits, // Approssimazione per guest
            proCount: 0,
            costEstimate: requestCost
        };
    }

    // --- GESTIONE UTENTI REGISTRATI (SAFE DB CALL) ---
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('ai_daily_count, ai_flash_count, ai_pro_count, ai_last_date, role, extra_quota')
            .eq('id', user.id)
            .maybeSingle();

        if (error || !data) {
             console.warn("User profile sync failed, falling back to safe limits.");
             return { 
                count: 0, limit: roleLimits.registered, date: today, canProceed: true, 
                flashCount: 0, proCount: 0, costEstimate: requestCost 
            };
        }

        // 2. CALCOLO LIMITE BASE
        let userBaseLimit = roleLimits.registered;

        if (user.role === 'admin_all' || user.role === 'admin_limited') {
            userBaseLimit = 999999; 
        } else if (user.role === 'business') {
            userBaseLimit = roleLimits.shop; 
        } else {
             userBaseLimit = roleLimits.registered;
        }

        // 3. CALCOLO LIMITE TOTALE (Base + Extra)
        const extraQuota = data.extra_quota || 0;
        const totalUserLimit = userBaseLimit + extraQuota;

        // 4. CHECK RESET GIORNALIERO E CALCOLO CONSUMO
        const lastDate = data.ai_last_date;
        let flashUsage = data.ai_flash_count || 0;
        let proUsage = data.ai_pro_count || 0;

        if (lastDate !== today) {
            flashUsage = 0;
            proUsage = 0;
        }
        
        // CALCOLO PONDERATO: (Flash * 1) + (Pro * 5)
        const currentCreditsUsed = (flashUsage * AI_COSTS.flash) + (proUsage * AI_COSTS.pro);

        // 5. LOGICA DI BLOCCO
        // Può procedere se: (Usati + CostoNuova) <= LimiteTotale
        const canProceed = (currentCreditsUsed + requestCost) <= totalUserLimit;

        // Limite tecnico di sicurezza anti-loop
        const isTechnicalCapReached = (flashUsage + proUsage) >= TECH_HARD_CAP;

        return { 
            count: currentCreditsUsed, 
            limit: totalUserLimit, 
            date: today, 
            canProceed: canProceed && !isTechnicalCapReached,
            flashCount: flashUsage,
            proCount: proUsage,
            costEstimate: requestCost
        };

    } catch (e) {
        console.error("AI Quota Check Error (Critical)", e);
        return { count: 0, limit: roleLimits.registered, date: today, canProceed: true, flashCount: 0, proCount: 0, costEstimate: requestCost };
    }
};

/**
 * Incrementa il contatore di utilizzo.
 * Scrive sul DB nei campi specifici (flash/pro) per mantenere lo storico pulito.
 */
export const incrementAiUsage = async (user: User, amount: number = 1, model: 'flash' | 'pro' = 'flash'): Promise<void> => {
    const today = getTodayString();
    const cost = amount * AI_COSTS[model];

    // Guest: Local Storage (Salva solo crediti totali)
    if (!user || user.role === 'guest') {
        const stored = getStorageItem<any>(GUEST_STORAGE_KEY, null);
        let currentCredits = 0;
        if (stored && stored.date === today) currentCredits = stored.count || 0;
        
        setStorageItem(GUEST_STORAGE_KEY, { date: today, count: currentCredits + cost });
        return;
    }

    // User: Logica Consumo Intelligente (DB)
    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('ai_flash_count, ai_pro_count, ai_last_date, extra_quota')
            .eq('id', user.id)
            .maybeSingle();
            
        if (!profile) return;
        
        // Reset check
        let currentFlash = profile.ai_flash_count || 0;
        let currentPro = profile.ai_pro_count || 0;
        
        if (profile.ai_last_date !== today) {
            currentFlash = 0;
            currentPro = 0;
        }
        
        // Aggiorna i contatori specifici
        const updatePayload: any = { ai_last_date: today };
        
        if (model === 'flash') {
            updatePayload.ai_flash_count = currentFlash + amount;
            // Mantieni il pro invariato (o resettato se cambio giorno)
            if (profile.ai_last_date !== today) updatePayload.ai_pro_count = 0;
        } else {
            updatePayload.ai_pro_count = currentPro + amount;
            if (profile.ai_last_date !== today) updatePayload.ai_flash_count = 0;
        }
        
        // NOTA: Non decrementiamo extra_quota qui.
        // L'extra quota aumenta il "tetto massimo" (Cap), non è un borsellino a scalare diretto.
        // Questo permette all'utente di mantenere il bonus per sempre (fino a che non lo usa in un dato giorno).
        // Se volessimo consumarlo, dovremmo fare logica più complessa.
        // Per ora: Extra Quota = Aumento del Limite Giornaliero.

        await supabase.from('profiles').update(updatePayload).eq('id', user.id);
        
    } catch (e) {
        console.error("AI Increment Error (Silent Fail)", e);
    }
};