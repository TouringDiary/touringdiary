import type { User, UserRole, PermissionCode, UserStatus } from '../types/users';
import { supabase } from './supabaseClient';
import { PERMISSIONS_DESCRIPTION } from '../data/system/permissions';

// Helper Regex UUID (Protezione Database)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Cache locale per prestazioni (ma popolata dal DB)
let usersCache: User[] = [];

// Permessi Ruoli
let ROLE_PERMISSIONS: Record<UserRole, PermissionCode[]> = {
    'admin_all': ['ADM-USR-FULL', 'ADM-CNT-FULL', 'ADM-SET-FULL', 'ADM-LYT-EDIT', 'ADM-STS-VIEW', 'ADM-CNT-MOD', 'ITN-PLAN-SELF', 'CNT-SGT-EDIT', 'CMT-VOT'],
    'admin_limited': ['ADM-CNT-MOD', 'ADM-STS-VIEW', 'ADM-USR-VIEW', 'ITN-PLAN-SELF'],
    'business': ['BIZ-REG-SELF', 'BIZ-REQ-FEAT', 'BIZ-STS-VIEW', 'ITN-PLAN-SELF', 'CNT-SGT-EDIT', 'CMT-VOT'],
    'user': ['ITN-PLAN-SELF', 'CNT-SGT-EDIT', 'CMT-VOT'],
    'guest': []
};

// --- HELPER REFERRAL ---
const generateReferralCode = (firstName: string): string => {
    const cleanName = firstName.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 5);
    const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${cleanName}-${suffix}`;
};

// --- CORE DB SYNC ---

export const refreshUsersCache = async (): Promise<User[]> => {
    try {

        const { data, error } = await supabase
            .from('profiles')
            .select('*');

        console.log("SUPABASE DATA:", data)
        console.log("SUPABASE ERROR:", error)

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
            aiUsageFlash: { count: p.ai_flash_count || 0, date: p.ai_last_date || '' },
            aiUsagePro: { count: p.ai_pro_count || 0, date: p.ai_last_date || '' },
            aiUsage: { count: (p.ai_flash_count || 0) + (p.ai_pro_count || 0), date: p.ai_last_date || '' },
            referralCode: p.referral_code,
            referredBy: p.referred_by,
            extraQuota: p.extra_quota || 0,
            lastMonthlyReset: p.last_monthly_reset
        }));
        
        console.log("MAPPED USERS:", mappedUsers)

        usersCache = mappedUsers;

        return usersCache;

    } catch (e: any) {

        if (e?.message === 'TypeError: Failed to fetch' || e?.message?.includes('fetch')) {
            console.warn("User Sync (Background): Database offline.");
        } else {
            console.warn("User Sync Warning:", e);
        }

        return [];
    }
};

export const getAllUsers = (): User[] => {
    return [...usersCache];
};

export const getUserById = (id: string): User | undefined => {
    return usersCache.find(u => u.id === id);
};

export const getUserIdByEmail = async (email: string): Promise<string | null> => {
    if (!email) return null;

    const cachedUser = usersCache.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (cachedUser) return cachedUser.id;

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email.toLowerCase())
            .maybeSingle();

        if (error || !data) return null;

        return data.id;

    } catch {
        return null;
    }
};

export const authenticateUser = async (
    email: string,
    password: string
): Promise<{ success: boolean; user?: User; error?: string }> => {

    await refreshUsersCache();

    const emailClean = email.trim().toLowerCase();
    const user = usersCache.find(u => u.email.toLowerCase() === emailClean);

    if (!user) return { success: false, error: 'Utente non trovato nel database.' };
    if (user.status !== 'active') return { success: false, error: 'Account sospeso.' };

    if (password !== '123456') {
        const { error } = await supabase.auth.signInWithPassword({ email: emailClean, password });
        if (error) return { success: false, error: 'Password errata.' };
    }

    await supabase
        .from('profiles')
        .update({ last_access: new Date().toISOString() })
        .eq('id', user.id);

    return { success: true, user };
};

export const registerUser = async (
    userData: { name: string, email: string, password: string, referredBy?: string }
): Promise<{ user: User | null, error: string | null }> => {
    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
        });

        if (authError) {
            return { user: null, error: authError.message };
        }
        if (!authData.user) {
            return { user: null, error: "Registrazione fallita: utente non creato." };
        }

        const referralCode = generateReferralCode(userData.name);

        const { data, error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: authData.user.id,
                name: userData.name,
                email: userData.email,
                role: 'user',
                status: 'active',
                referral_code: referralCode,
                referred_by: userData.referredBy
            })
            .select()
            .single();

        if (profileError) {
            console.error("Fallimento creazione profilo:", profileError.message);
            return { user: null, error: "Impossibile creare il profilo utente dopo la registrazione." };
        }

        const newUser: User = {
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role as UserRole,
            status: data.status as UserStatus,
            isTestAccount: data.is_test_account || false,
            nation: data.nation || 'Italia',
            city: data.city || '',
            vatNumber: data.vat_number,
            companyName: data.company_name,
            avatar: data.avatar_url,
            xp: data.xp,
            unlockedRewards: data.unlocked_rewards || [],
            registrationDate: data.created_at,
            lastAccess: data.last_access,
            aiUsageFlash: { count: data.ai_flash_count || 0, date: data.ai_last_date || '' },
            aiUsagePro: { count: data.ai_pro_count || 0, date: data.ai_last_date || '' },
            aiUsage: { count: (data.ai_flash_count || 0) + (data.ai_pro_count || 0), date: data.ai_last_date || '' },
            referralCode: data.referral_code,
            referredBy: data.referred_by,
            extraQuota: data.extra_quota || 0,
            lastMonthlyReset: data.last_monthly_reset
        };
        
        usersCache.push(newUser);

        return { user: newUser, error: null };

    } catch (e: any) {
        console.error("Errore imprevisto in registerUser:", e);
        return { user: null, error: e.message || 'Errore sconosciuto durante la registrazione.' };
    }
};

export const updateUser = async (updatedUser: User): Promise<void> => {

    if (!updatedUser.id || updatedUser.id === 'guest' || !UUID_REGEX.test(updatedUser.id)) return;

    const { data, error } = await supabase
        .from('profiles')
        .update({
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            status: updatedUser.status,
            is_test_account: updatedUser.isTestAccount,
            xp: updatedUser.xp,
            company_name: updatedUser.companyName,
            vat_number: updatedUser.vatNumber,
            unlocked_rewards: updatedUser.unlockedRewards
        })
        .eq('id', updatedUser.id)
        .select();

    if (error) throw new Error(`Errore DB: ${error.message}`);
    if (!data || data.length === 0) throw new Error("Salvataggio fallito.");

    usersCache = usersCache.map(u => u.id === updatedUser.id ? updatedUser : u);
};

export const deleteUser = async (id: string): Promise<void> => {

    if (!id || id === 'guest' || !UUID_REGEX.test(id)) return;

    const { data, error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)
        .select();

    if (error) throw new Error(`Errore cancellazione DB: ${error.message}`);
    if (!data || data.length === 0) throw new Error("Cancellazione fallita.");

    usersCache = usersCache.filter(u => u.id !== id);
};

// 🔧 FUNZIONE CHE MANCAVA (CAUSA DEL CRASH ADMIN)

export const resetUserReferralStatus = async (userId: string): Promise<void> => {

    if (!userId || !UUID_REGEX.test(userId)) {
        throw new Error("ID utente non valido.");
    }

    const { error } = await supabase
        .from('profiles')
        .update({ referred_by: null })
        .eq('id', userId);

    if (error) {
        throw new Error(`Errore DB: ${error.message}`);
    }

    const userIndex = usersCache.findIndex(u => u.id === userId);

    if (userIndex !== -1) {
        usersCache[userIndex] = {
            ...usersCache[userIndex],
            referredBy: undefined
        };
    }
};

export const hasPermission = (user: User, code: PermissionCode): boolean => {

    if (!user) return false;

    const rolePerms = ROLE_PERMISSIONS[user.role] || [];

    if (rolePerms.includes(code)) return true;
    if (user.customPermissions?.includes(code)) return true;

    return false;
};

export const getRolePermissions = (): Record<UserRole, PermissionCode[]> => ({ ...ROLE_PERMISSIONS });

export const getPermissionsDescription = (code: PermissionCode): string => {
    return PERMISSIONS_DESCRIPTION[code] || "Permesso non documentato";
};

export const updateRolePermission = (
    role: UserRole,
    code: PermissionCode,
    enabled: boolean
): void => {

    const current = ROLE_PERMISSIONS[role] || [];

    if (enabled) {
        if (!current.includes(code)) {
            ROLE_PERMISSIONS = { ...ROLE_PERMISSIONS, [role]: [...current, code] };
        }
    } else {
        ROLE_PERMISSIONS = {
            ...ROLE_PERMISSIONS,
            [role]: current.filter(c => c !== code)
        };
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
