
export type UserRole = 'admin_all' | 'admin_limited' | 'business' | 'user' | 'guest';

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

// Codici Permessi (ACL)
export type PermissionCode = 
    // ADMIN ALL (Super Admin)
    | 'ADM-USR-FULL'  // Gestione completa utenti (Ban, Ruoli)
    | 'ADM-CNT-FULL'  // Gestione completa contenuti
    | 'ADM-SET-FULL'  // Impostazioni globali
    | 'ADM-LYT-EDIT'  // Modifica layout
    // ADMIN LIMITED (Moderatori)
    | 'ADM-CNT-MOD'   // Moderazione foto/testi
    | 'ADM-STS-VIEW'  // View Statistiche
    | 'ADM-USR-VIEW'  // View Utenti (No edit)
    // USER (Turista)
    | 'ITN-PLAN-SELF' // Pianificazione itinerari
    | 'CNT-SGT-EDIT'  // Suggerimento correzioni contenuti
    | 'CMT-VOT'       // Voto e Recensioni
    // BUSINESS (Partner)
    | 'BIZ-REG-SELF'  // Gestione propria scheda
    | 'BIZ-REQ-FEAT'  // Richiesta feature a pagamento
    | 'BIZ-STS-VIEW'; // Statistiche proprie performance

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    isTestAccount: boolean; // NEW: Flag Collaudo/Produzione
    
    // Geo Info
    nation: string;
    city: string;
    
    // Metadata
    registrationDate: string; // ISO Date
    lastAccess: string;       // ISO Date
    avatar?: string;
    
    // Stats (Added for Admin View)
    // Deprecato: usa aiUsageFlash e aiUsagePro
    aiUsage?: { count: number, date: string }; 
    
    // NEW: Detailed usage
    aiUsageFlash?: { count: number, date: string };
    aiUsagePro?: { count: number, date: string };

    // Auth Simulation (Frontend Only)
    password?: string; 
    
    // Business Specific
    vatNumber?: string;       
    companyName?: string;

    // Explicit Permissions (Override opzionale)
    customPermissions?: PermissionCode[];

    // --- GAMIFICATION ---
    xp?: number; 
    unlockedRewards?: string[];

    // --- REFERRAL & QUOTA (STEP 1) ---
    referralCode?: string;
    referredBy?: string;
    extraQuota?: number;
    lastMonthlyReset?: string;
}
