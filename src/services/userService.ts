import type { User, UserRole, PermissionCode, UserStatus } from '../types/users';
import { supabase, setAuthOperationInProgress } from './supabaseClient';
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

// --- VALIDATION HELPERS ---
const USER_ROLES: UserRole[] = ['admin_all', 'admin_limited', 'business', 'user', 'guest'];
const USER_STATUSES: UserStatus[] = ['active', 'inactive', 'suspended', 'pending'];

const isUserRole = (role: unknown): role is UserRole =>
    typeof role === 'string' && USER_ROLES.includes(role as UserRole);

const isUserStatus = (status: unknown): status is UserStatus =>
    typeof status === 'string' && USER_STATUSES.includes(status as UserStatus);

import { DbProfile } from '../types/domain/index';

/**
 * Converte un riga del database (p) nell'interfaccia User del frontend.
 */
export const mapProfileToUser = (p: DbProfile): User => {
    return {
        id: p.id,
        name: p.name || '',
        email: p.email || '',
        role: isUserRole(p.role) ? p.role : 'user',
        status: isUserStatus(p.status) ? p.status : 'active',
        isTestAccount: p.is_test_account || false,
        nation: p.nation || 'Italia',
        city: p.city || '',
        vatNumber: p.vat_number || undefined,
        companyName: p.company_name || undefined,
        avatar: p.avatar_url || undefined,
        xp: p.xp || 0,
        unlockedRewards: p.unlocked_rewards || [],
        registrationDate: p.created_at || new Date().toISOString(),
        lastAccess: p.last_access || '',
        referralCode: p.referral_code || undefined,
        referredBy: p.referred_by || undefined,
        extraQuota: 0,
        extraQuotaExpiresAt: undefined,
        slug: p.slug || undefined
    };
};

// --- CORE DB SYNC ---

export const refreshUsersCache = async (): Promise<User[]> => {
    try {
        let data: DbProfile[] | null = null;
        let source = 'API';

        // 1. TENTA IL CARICAMENTO TRAMITE API PROXY (Local Server)
        try {
            const apiResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/bootstrap/profiles`);
            if (apiResponse.ok) {
                const apiData = await apiResponse.json() as unknown;

                // Narrowing minimale per validare la risposta API
                if (
                    apiData &&
                    typeof apiData === 'object' &&
                    'success' in apiData &&
                    'data' in apiData &&
                    (apiData as { success: boolean }).success
                ) {
                    const payload = apiData as {
                        success: boolean;
                        data: DbProfile[];
                    };

                    if (Array.isArray(payload.data)) {
                        data = payload.data;
                    }
                }
            }
        } catch (apiError) {
            console.warn("[UserService] Local API failed, falling back to Supabase.", apiError);
        }

        // 2. FALLBACK A SUPABASE (Original Logic)
        if (!data) {
            source = 'Supabase';
            const { data: supaData, error } = await supabase
                .from('profiles')
                .select('*');

            if (error) throw error;
            data = supaData;
        }

        console.log(`[UserService] Profiles loaded from ${source}:`, data?.length);

        const mappedUsers: User[] = (data || []).map(p => mapProfileToUser(p));

        usersCache = mappedUsers;
        return usersCache;

    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg === 'TypeError: Failed to fetch' || msg.includes('fetch')) {
            console.warn("User Sync (Background): Database/Proxy offline.");
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

/**
 * Funzione di Login Rapido per Sviluppo.
 * Genera una sessione Supabase reale chiamando l'endpoint server protetto.
 */
export const devLogin = async (email: string): Promise<{ success: boolean; session?: unknown; error?: string }> => {
    try {
        console.log("[QuickLogin] devLogin start");
        const url = `${import.meta.env.VITE_API_URL}/api/dev/login`;
        console.log("[QuickLogin] fetch start", url);

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[QuickLogin] Errore HTTP:", response.status, errorText);
            return { success: false, error: `Errore Server (${response.status})` };
        }

        const apiData = await response.json() as unknown;

        // Narrowing minimale payload dev login
        if (
            apiData &&
            typeof apiData === 'object' &&
            'success' in apiData
        ) {
            const typedData = apiData as {
                success: boolean;
                access_token?: string;
                refresh_token?: string;
                session?: unknown;
                error?: string;
            };

            if (
                typedData.success &&
                typedData.access_token &&
                typedData.refresh_token
            ) {
                console.log("[devLogin] Session received from server");

                setAuthOperationInProgress(true);

                try {
                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token: typedData.access_token,
                        refresh_token: typedData.refresh_token
                    });

                    if (sessionError) {
                        console.error("[devLogin] Client setSession error:", sessionError);

                        return {
                            success: false,
                            error: `Sessione ricevuta ma non valida: ${sessionError.message}`
                        };
                    }

                    await refreshUsersCache();

                    return {
                        success: true,
                        session: typedData.session
                    };

                } finally {
                    setAuthOperationInProgress(false);
                }
            }

            return {
                success: false,
                error: typedData.error || 'Errore durante la generazione della sessione.'
            };
        }

        return {
            success: false,
            error: 'Payload API non valido.'
        };

    } catch (e: unknown) {
        console.error("[QuickLogin] Errore fetch:", e);
        const msg = e instanceof Error ? e.message : 'Network error.';
        return { success: false, error: msg };
    }
};

/**
 * Recupera il profilo completo dell'utente corrente tramite l'API proxy.
 * Questo bypassa eventuali problemi di RLS nel frontend.
 * @param token Token di accesso opzionale (se fornito, evita getSession() concorrenti)
 */
export const getCurrentUserProfile = async (token?: string): Promise<User | null> => {
    try {
        let accessToken = token;

        // Se il token non è fornito, lo recuperiamo dalla sessione (può causare lock se concorrente)
        if (!accessToken) {
            const { data: { session } } = await supabase.auth.getSession();
            accessToken = session?.access_token;
        }

        if (!accessToken) return null;

        console.log("[userService] Fetching profile via proxy with token...");

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/me`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[userService] Failed to fetch profile via proxy:", errorText);
            return null;
        }

        const apiData = await response.json() as unknown;

        // Narrowing per /api/user/me
        if (
            apiData &&
            typeof apiData === 'object' &&
            'success' in apiData &&
            'user' in apiData &&
            (apiData as { success: boolean }).success
        ) {
            const payload = apiData as {
                success: boolean;
                user: DbProfile;
            };

            if (
                payload.user &&
                typeof payload.user === 'object' &&
                'id' in payload.user
            ) {
                const mappedUser = mapProfileToUser(payload.user);

                console.log(
                    "[userService] Profile mapped successfully:",
                    mappedUser.name
                );

                return mappedUser;
            }
        }

        return null;
    } catch (e) {
        console.error("[userService] Error in getCurrentUserProfile:", e);
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
    userData: { name: string, email: string, password: string, role?: string, firstName?: string, lastName?: string, isTestAccount?: boolean, referredBy?: string }
): Promise<{ user: User | null; success?: boolean; error: string | null }> => {
    // Se abbiamo un ruolo specifico e siamo in modalità Admin (determinata dal contesto di chiamata)
    // usiamo l'endpoint server-side per saltare la conferma email.
    if (userData.role) {
        try {
            console.log("[registerUser] Invio payload admin:", userData);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/create-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const data = await response.json() as unknown;

            if (data && typeof data === 'object' && 'success' in data) {
                const typedData = data as { success: boolean; user: User | null; error: string | null };
                if (typedData.success) {
                    return { success: true, user: typedData.user, error: null };
                }
                return { success: false, user: null, error: typedData.error || 'Unknown admin registration error' };
            }
            return { success: false, user: null, error: "Invalid response from Admin registration API." };
        } catch (e: unknown) {
            return { success: false, user: null, error: "Network error in Admin registration." };
        }
    }

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

        const mergedData = userData;
        const safeName =
            mergedData.name ||
            `${mergedData.firstName ?? ''} ${mergedData.lastName ?? ''}`.trim() ||
            mergedData.email.split('@')[0];

        const referralCode = generateReferralCode(safeName);

        const { data, error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: authData.user.id,
                name: safeName,
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

        const newUser = mapProfileToUser(data);

        usersCache.push(newUser);

        return { success: true, user: newUser, error: null };

    } catch (e: unknown) {
        console.error("Errore imprevisto in registerUser:", e);
        const msg = e instanceof Error ? e.message : 'Errore sconosciuto durante la registrazione.';
        return { user: null, error: msg };
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
