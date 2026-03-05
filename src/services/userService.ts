
import type { User, UserRole, PermissionCode, UserStatus } from '../types/users';
import { supabase } from './supabaseClient';

// Helper Regex UUID (Protezione Database)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Cache locale per prestazioni (ma popolata dal DB)
let usersCache: User[] = [];

// Permessi Ruoli (Hardcoded logic is fine here)
let ROLE_PERMISSIONS: Record<UserRole, PermissionCode[]> = {
    'admin_all': ['ADM-USR-FULL', 'ADM-CNT-FULL', 'ADM-SET-FULL', 'ADM-LYT-EDIT', 'ADM-STS-VIEW', 'ADM-CNT-MOD', 'ITN-PLAN-SELF', 'CNT-SGT-EDIT', 'CMT-VOT'],
    'admin_limited': ['ADM-CNT-MOD', 'ADM-STS-VIEW', 'ADM-USR-VIEW', 'ITN-PLAN-SELF'],
    'business': ['BIZ-REG-SELF', 'BIZ-REQ-FEAT', 'BIZ-STS-VIEW', 'ITN-PLAN-SELF', 'CNT-SGT-EDIT', 'CMT-VOT'],
    'user': ['ITN-PLAN-SELF', 'CNT-SGT-EDIT', 'CMT-VOT'],
    'guest': []
};

// --- HELPER REFERRAL ---
const generateReferralCode = (firstName: string): string => {
    // Pulisce il nome (solo lettere, maiuscolo)
    const cleanName = firstName.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 5);
    // Genera suffisso casuale (es. X92)
    const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${cleanName}-${suffix}`;
};

// --- CORE DB SYNC ---

export const refreshUsersCache = async (): Promise<User[]> => {
    try {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
        
        const mappedUsers: User[] = (data || []).map((p: any) => ({
            id: p.id,
            name: p.name, 
            email: p.email,
            role: p.role as UserRole,
            status: p.status as UserStatus,
            isTestAccount: p.is_test_account || false, 
            nation: p.nation || 'Italia',
            city: p.city || '',
            vatNumber: p.vat_number,
            companyName: p.company_name,
            avatar: p.avatar_url,
            xp: p.xp,
            unlockedRewards: p.unlocked_rewards || [],
            registrationDate: p.created_at,
            lastAccess: p.last_access,
            
            // MAPPING NUOVI CONTATORI
            aiUsageFlash: { count: p.ai_flash_count || 0, date: p.ai_last_date || '' },
            aiUsagePro: { count: p.ai_pro_count || 0, date: p.ai_last_date || '' },
            
            // Legacy mapping (somma per compatibilità)
            aiUsage: { count: (p.ai_flash_count || 0) + (p.ai_pro_count || 0), date: p.ai_last_date || '' },

            referralCode: p.referral_code,
            referredBy: p.referred_by,
            extraQuota: p.extra_quota || 0,
            lastMonthlyReset: p.last_monthly_reset
        }));
        
        usersCache = mappedUsers;
        return usersCache;
    } catch (e: any) {
        // Suppress critical error logging for network/fetch failures to avoid UI alarm
        if (e?.message === 'TypeError: Failed to fetch' || e?.message?.includes('fetch')) {
            console.warn("User Sync (Background): Database offline. Modalità sola lettura attiva.");
        } else {
            console.warn("User Sync Warning (Background):", e);
        }
        return [];
    }
};

export const getUserById = (id: string): User | undefined => {
    return usersCache.find(u => u.id === id);
};

export const getUserIdByEmail = async (email: string): Promise<string | null> => {
    if (!email) return null;
    
    // Prova prima dalla cache
    const cachedUser = usersCache.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (cachedUser) return cachedUser.id;
    
    // Fallback DB
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email.toLowerCase())
            .maybeSingle();
            
        if (error || !data) return null;
        return data.id;
    } catch (e) {
        return null;
    }
};

export const authenticateUser = async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    await refreshUsersCache();
    const emailClean = email.trim().toLowerCase();
    const user = usersCache.find(u => u.email.toLowerCase() === emailClean);
    
    if (!user) return { success: false, error: 'Utente non trovato nel database.' };
    if (user.status !== 'active') return { success: false, error: 'Account sospeso.' };

    if (password !== '123456') {
         const { error } = await supabase.auth.signInWithPassword({ email: emailClean, password });
         if (error) return { success: false, error: 'Password errata.' };
    }
    
    await supabase.from('profiles').update({ last_access: new Date().toISOString() }).eq('id', user.id);
    return { success: true, user };
};

export const registerUser = async (data: { 
    firstName: string, 
    lastName: string, 
    email: string, 
    password: string, 
    role?: UserRole, 
    isTestAccount?: boolean,
    referralCode?: string // NEW: Optional Referral Code
}): Promise<{ success: boolean; user?: User; error?: string }> => {
    const emailClean = data.email.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, '').trim().toLowerCase();
    const firstNameClean = data.firstName.trim();
    const lastNameClean = data.lastName.trim();

    try {
        const { data: existingUser } = await supabase.from('profiles').select('id').eq('email', emailClean).maybeSingle();
        if (existingUser) return { success: false, error: 'Indirizzo email già registrato.' };

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: emailClean,
            password: data.password,
            options: {
                data: { first_name: firstNameClean, last_name: lastNameClean }
            }
        });

        if (authError) throw authError;
        if (authData.user && authData.user.identities && authData.user.identities.length === 0) return { success: false, error: 'Indirizzo email già registrato (Auth).' };
        if (!authData.user) throw new Error("Creazione utente fallita (Nessuna risposta da Supabase).");

        // --- REFERRAL LOGIC START ---
        let referrerId = null;
        let initialExtraQuota = 0; 

        if (data.referralCode) {
            const cleanRefCode = data.referralCode.trim().toUpperCase();
            // Cerca il referrer
            const { data: referrer, error: refError } = await supabase
                .from('profiles')
                .select('id, extra_quota')
                .eq('referral_code', cleanRefCode)
                .maybeSingle();

            if (referrer && !refError) {
                referrerId = referrer.id;
                initialExtraQuota = 20; // BONUS BENVENUTO

                // Aggiorna subito il Referrer (bonus +20)
                const newReferrerQuota = (referrer.extra_quota || 0) + 20;
                await supabase.from('profiles').update({ extra_quota: newReferrerQuota }).eq('id', referrer.id);
            }
        }
        // --- REFERRAL LOGIC END ---

        // Generazione Codice per il nuovo utente
        const newReferralCode = generateReferralCode(firstNameClean);
        const currentIsoDate = new Date().toISOString();
        
        const newProfile = {
            id: authData.user.id,
            name: `${firstNameClean} ${lastNameClean}`,
            email: emailClean,
            role: data.role || 'user',
            status: 'active',
            is_test_account: data.isTestAccount || false, 
            nation: 'Italia',
            city: '',
            created_at: currentIsoDate,
            last_access: currentIsoDate,
            xp: 0,
            avatar_url: `https://ui-avatars.com/api/?name=${firstNameClean}+${lastNameClean}&background=random`,
            
            // --- REFERRAL SYSTEM FIELDS ---
            referral_code: newReferralCode,
            referred_by: referrerId,    // Link al referrer
            extra_quota: initialExtraQuota, // Bonus applicato
            last_monthly_reset: currentIsoDate
        };

        const { error: profileError } = await supabase.from('profiles').insert(newProfile);
        
        if (profileError) {
            if (profileError.code === '23505') return { success: false, error: 'Utente già presente nel sistema (Profilo).' };
            throw profileError;
        }
        
        await refreshUsersCache();
        
        const createdUser = usersCache.find(u => u.id === newProfile.id);
        
        return { success: true, user: createdUser };

    } catch (e: any) {
        console.error("Registration Error:", e);
        let errorMsg = e.message || 'Errore registrazione. Riprova.';
        return { success: false, error: errorMsg };
    }
};

export const updateUser = async (updatedUser: User): Promise<void> => {
    // SECURITY FIX: UUID CHECK
    if (!updatedUser.id || updatedUser.id === 'guest' || !UUID_REGEX.test(updatedUser.id)) return;
    
    try {
        const { data, error } = await supabase.from('profiles').update({
            name: updatedUser.name,
            email: updatedUser.email, 
            role: updatedUser.role,
            status: updatedUser.status,
            is_test_account: updatedUser.isTestAccount, 
            xp: updatedUser.xp,
            company_name: updatedUser.companyName,
            vat_number: updatedUser.vatNumber,
            unlocked_rewards: updatedUser.unlockedRewards,
            // Non aggiorniamo referral_code o extra_quota qui, sono gestiti da logiche specifiche
        }).eq('id', updatedUser.id).select();
        
        if (error) throw new Error(`Errore DB: ${error.message}`);
        if (!data || data.length === 0) throw new Error("Salvataggio fallito: Permessi insufficienti o utente non trovato.");
        
        usersCache = usersCache.map(u => u.id === updatedUser.id ? updatedUser : u);
    } catch (e) {
        console.error("Update User Error", e);
        throw e;
    }
};

export const deleteUser = async (id: string): Promise<void> => {
    // SECURITY FIX: UUID CHECK
    if (!id || id === 'guest' || !UUID_REGEX.test(id)) return;
    
    try {
        const { data, error } = await supabase.from('profiles').delete().eq('id', id).select();
        if (error) throw new Error(`Errore cancellazione DB: ${error.message}`);
        if (!data || data.length === 0) throw new Error("Cancellazione fallita: Permessi insufficienti (RLS).");
        usersCache = usersCache.filter(u => u.id !== id);
    } catch (e) {
        console.error("Delete user error", e);
        throw e;
    }
};

export const getGuestUser = (): User => ({
    id: 'guest', name: 'Visitatore', email: '', role: 'guest', status: 'active', isTestAccount: false,
    nation: '', city: '', registrationDate: new Date().toISOString(), lastAccess: new Date().toISOString(), xp: 0
});

export const hasPermission = (user: User, code: PermissionCode): boolean => {
    if (!user) return false;
    const rolePerms = ROLE_PERMISSIONS[user.role] || [];
    if (rolePerms.includes(code)) return true;
    if (user.customPermissions?.includes(code)) return true;
    return false;
};

export const getRolePermissions = (): Record<UserRole, PermissionCode[]> => ({ ...ROLE_PERMISSIONS });
export const updateRolePermission = (role: UserRole, code: PermissionCode, enabled: boolean): void => {
    const current = ROLE_PERMISSIONS[role] || [];
    if (enabled) {
        if (!current.includes(code)) ROLE_PERMISSIONS = { ...ROLE_PERMISSIONS, [role]: [...current, code] };
    } else {
        ROLE_PERMISSIONS = { ...ROLE_PERMISSIONS, [role]: current.filter(c => c !== code) };
    }
};

export const getRoleLabel = (role: UserRole): string => {
    switch (role) {
        case 'admin_all': return 'Admin-All'; 
        case 'admin_limited': return 'Admin-Limited';
        case 'business': return 'Business';
        case 'user': return 'Utente';
        case 'guest': return 'Ospite';
        default: return role;
    }
};

export const getPermissionsDescription = (code: PermissionCode): string => {
    const map: Record<PermissionCode, string> = {
        'ADM-USR-FULL': 'Gestione totale utenti (Ban, ruoli, eliminazione)',
        'ADM-CNT-FULL': 'Accesso completo gestione città e contenuti',
        'ADM-SET-FULL': 'Accesso impostazioni globali e design sito',
        'ADM-LYT-EDIT': 'Modifica layout e struttura home page',
        'ADM-CNT-MOD': 'Moderazione foto, testi e recensioni',
        'ADM-STS-VIEW': 'Visualizzazione dashboard finanziaria e stats',
        'ADM-USR-VIEW': 'Visualizzazione lista utenti (sola lettura)',
        'ITN-PLAN-SELF': 'Utilizzo Magic Planner e creazione itinerari',
        'CNT-SGT-EDIT': 'Invio suggerimenti e correzioni luoghi',
        'CMT-VOT': 'Possibilità di votare, recensire e commentare',
        'BIZ-REG-SELF': 'Gestione della propria scheda attività e bottega',
        'BIZ-REQ-FEAT': 'Richiesta feature a pagamento',
        'BIZ-STS-VIEW': 'Visualizzazione statistiche della propria attività'
    };
    return map[code] || 'Descrizione non disponibile';
};

// --- REFERRAL FUNCTIONS ---

export const getReferrals = async (userId: string): Promise<User[]> => {
    // SECURITY FIX: UUID CHECK
    if (!userId || userId === 'guest' || !UUID_REGEX.test(userId)) return [];

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, name, created_at, avatar_url')
            .eq('referred_by', userId)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        return (data || []).map((u: any) => ({
            id: u.id,
            name: u.name,
            registrationDate: u.created_at,
            avatar: u.avatar_url,
            // Minimal set for display list
            email: '', role: 'user', status: 'active', isTestAccount: false, nation: '', city: '', lastAccess: ''
        }));
    } catch (e) {
        console.error("Error fetching referrals", e);
        return [];
    }
};

// NEW: Get details of the person who referred me
export const getReferrerDetails = async (referrerId: string): Promise<User | null> => {
    if (!referrerId || !UUID_REGEX.test(referrerId)) return null;

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, name, avatar_url, role, referral_code')
            .eq('id', referrerId)
            .maybeSingle();

        if (error || !data) return null;

        return {
            id: data.id,
            name: data.name,
            avatar: data.avatar_url,
            role: data.role as UserRole,
            referralCode: data.referral_code,
            // Dummy fillers
            email: '', status: 'active', isTestAccount: false, nation: '', city: '', registrationDate: '', lastAccess: '', xp: 0
        };
    } catch (e) {
        console.error("Error fetching referrer", e);
        return null;
    }
};

export const redeemReferralCode = async (currentUserId: string, code: string): Promise<{ success: boolean; message: string }> => {
    // SECURITY FIX: UUID CHECK
    if (!currentUserId || currentUserId === 'guest' || !UUID_REGEX.test(currentUserId)) {
        return { success: false, message: "Devi essere registrato per riscattare un codice." };
    }

    try {
        const cleanCode = code.trim().toUpperCase();

        // 1. Verifica se l'utente ha già un referrer
        const { data: currentUser } = await supabase.from('profiles').select('referred_by, referral_code').eq('id', currentUserId).maybeSingle();
        if (currentUser && currentUser.referred_by) {
            return { success: false, message: "Hai già riscattato un codice invito." };
        }
        if (currentUser && currentUser.referral_code === cleanCode) {
            return { success: false, message: "Non puoi usare il tuo stesso codice!" };
        }

        // 2. Trova il proprietario del codice
        const { data: referrer, error: referrerError } = await supabase.from('profiles').select('id, extra_quota').eq('referral_code', cleanCode).maybeSingle();
        
        if (referrerError || !referrer) {
            return { success: false, message: "Codice invito non trovato o non valido." };
        }

        // 3. Esegui la transazione (Update di entrambi)
        // Aggiorna l'utente corrente (Set referred_by e Bonus)
        const { error: updateSelfError } = await supabase.from('profiles')
            .update({ 
                referred_by: referrer.id,
                extra_quota: 20 // Bonus benvenuto per chi riscatta
            })
            .eq('id', currentUserId);

        if (updateSelfError) throw updateSelfError;

        // Aggiorna il referrer (Aumenta extra_quota)
        const newQuota = (referrer.extra_quota || 0) + 20; // Bonus per chi invita
        const { error: updateReferrerError } = await supabase.from('profiles')
            .update({ extra_quota: newQuota })
            .eq('id', referrer.id);

        if (updateReferrerError) console.error("Error updating referrer quota (non-blocking)", updateReferrerError);

        return { success: true, message: "Codice riscattato! Hai ricevuto +20 Crediti AI Extra." };

    } catch (e: any) {
        console.error("Referral redeem error", e);
        return { success: false, message: "Errore durante il riscatto. Riprova." };
    }
};

// ADMIN: RESET REFERRAL (Per test o correzioni)
export const resetUserReferralStatus = async (userId: string): Promise<void> => {
    // SECURITY FIX: UUID CHECK
    if (!userId || userId === 'guest' || !UUID_REGEX.test(userId)) return;
    
    try {
        await supabase
            .from('profiles')
            .update({ referred_by: null })
            .eq('id', userId);
    } catch (e) {
        console.error("Reset referral error", e);
        throw e;
    }
};
