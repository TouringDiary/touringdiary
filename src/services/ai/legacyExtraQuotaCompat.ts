import { supabase } from '../supabaseClient';
import type { Database } from '../../types/supabase';

/**
 * Admin user list helpers with wallet BONUS display (source = bonus).
 * Replaces profiles.extra_quota legacy reads.
 */

export type AdminUserSortBy = 'registrationDate' | 'bonusTotal' | 'expiresSoon';

export interface AdminProfileQuotaRow {
    id: string;
    name: string | null;
    email: string | null;
    role: string | null;
    created_at: string | null;
    /** Sum of active wallet bonus credits (flash + pro) */
    bonus_total: number;
    bonus_flash: number;
    bonus_pro: number;
    /** Earliest expires_at among active bonus wallet rows */
    bonus_expires_at: string | null;
}

type ProfileAdminRow = Pick<
    Database['public']['Tables']['profiles']['Row'],
    'id' | 'name' | 'email' | 'role' | 'created_at'
>;

type WalletBonusRow = Pick<
    Database['public']['Tables']['user_ai_credits']['Row'],
    'user_id' | 'flash_remaining' | 'pro_remaining' | 'expires_at'
>;

interface WalletBonusSummary {
    flash: number;
    pro: number;
    earliestExpiry: string | null;
}

async function fetchWalletBonusSummary(
    userIds: string[]
): Promise<Map<string, WalletBonusSummary>> {
    const summary = new Map<string, WalletBonusSummary>();
    if (userIds.length === 0) return summary;

    const { data, error } = await supabase
        .from('user_ai_credits')
        .select('user_id, flash_remaining, pro_remaining, expires_at')
        .in('user_id', userIds)
        .eq('source', 'bonus')
        .gt('expires_at', new Date().toISOString());

    if (error) {
        console.warn('[fetchAdminUsersPaged] Wallet bonus enrichment failed:', error.message);
        return summary;
    }

    for (const row of (data ?? []) as WalletBonusRow[]) {
        if (!row.user_id) continue;
        const current = summary.get(row.user_id) ?? { flash: 0, pro: 0, earliestExpiry: null };
        current.flash += row.flash_remaining ?? 0;
        current.pro += row.pro_remaining ?? 0;
        if (
            row.expires_at &&
            (!current.earliestExpiry || row.expires_at < current.earliestExpiry)
        ) {
            current.earliestExpiry = row.expires_at;
        }
        summary.set(row.user_id, current);
    }

    return summary;
}

function mapProfileRow(row: ProfileAdminRow, bonus: WalletBonusSummary | undefined): AdminProfileQuotaRow {
    const bonusFlash = bonus?.flash ?? 0;
    const bonusPro = bonus?.pro ?? 0;
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        created_at: row.created_at,
        bonus_flash: bonusFlash,
        bonus_pro: bonusPro,
        bonus_total: bonusFlash + bonusPro,
        bonus_expires_at: bonus?.earliestExpiry ?? null,
    };
}

function sortAdminUsers(rows: AdminProfileQuotaRow[], sortBy: AdminUserSortBy): AdminProfileQuotaRow[] {
    const sorted = [...rows];
    if (sortBy === 'bonusTotal') {
        sorted.sort((a, b) => b.bonus_total - a.bonus_total);
    } else if (sortBy === 'expiresSoon') {
        sorted.sort((a, b) => {
            if (!a.bonus_expires_at && !b.bonus_expires_at) return 0;
            if (!a.bonus_expires_at) return 1;
            if (!b.bonus_expires_at) return -1;
            return a.bonus_expires_at.localeCompare(b.bonus_expires_at);
        });
    }
    return sorted;
}

/**
 * Paged admin user list with wallet BONUS totals for display/sort.
 */
export async function fetchAdminUsersPaged(
    sortBy: AdminUserSortBy = 'registrationDate',
    searchTerm: string = ''
): Promise<AdminProfileQuotaRow[]> {
    let query = supabase
        .from('profiles')
        .select('id, name, email, role, created_at');

    if (searchTerm) {
        query = query.ilike('email', `%${searchTerm}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(50);
    if (error) throw error;

    const profiles = (data ?? []) as ProfileAdminRow[];
    const bonusMap = await fetchWalletBonusSummary(profiles.map((p) => p.id));
    const rows = profiles.map((p) => mapProfileRow(p, bonusMap.get(p.id)));

    return sortBy === 'registrationDate' ? rows : sortAdminUsers(rows, sortBy);
}

/**
 * Email search for admin bonus grant panel.
 */
export async function searchAdminUsersByEmail(email: string): Promise<AdminProfileQuotaRow[]> {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, role, created_at')
        .ilike('email', `%${email}%`)
        .limit(5);

    if (error) throw error;

    const profiles = (data ?? []) as ProfileAdminRow[];
    const bonusMap = await fetchWalletBonusSummary(profiles.map((p) => p.id));
    return profiles.map((p) => mapProfileRow(p, bonusMap.get(p.id)));
}
