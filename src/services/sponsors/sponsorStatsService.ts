
import { supabase } from '../supabaseClient';
import type { SponsorStats } from '../../types/models/Sponsor';

/**
 * Recupera i tier effettivamente presenti nel database per popolare il filtro.
 */
export const getSponsorTiers = async () => {
    // Invece di leggere dalla colonna legacy tier, leggiamo dai piani collegati via pricing_versions
    const { data, error } = await supabase
        .from('sponsors')
        .select(`
            pricing_versions!pricing_version_id (
                plans:plan_id (
                    type
                )
            )
        `)
        .not('pricing_version_id', 'is', null);

    if (error) {
        console.warn("[SponsorService] Falling back to default tiers due to error:", error.message);
        return ['LOCAL_ACTIVITY', 'REGIONAL_ACTIVITY', 'DIGITAL_SHOWCASE'];
    }
    
    // Estrazione dei tipi unici dai risultati nidificati
    const types = data
        .map(d => {
            const pv = (Array.isArray(d.pricing_versions) ? d.pricing_versions[0] : d.pricing_versions) as any;
            const plan = (pv && Array.isArray(pv.plans) ? pv.plans[0] : (pv?.plans)) as { type?: string } | null;
            return plan?.type;
        })
        .filter(Boolean);

    const unique = Array.from(new Set(types)).sort() as string[];
    return unique.length > 0 ? unique : ['LOCAL_ACTIVITY', 'REGIONAL_ACTIVITY', 'DIGITAL_SHOWCASE'];
};

/**
 * Calcola le statistiche aggregate analizzando entrambe le tabelle (richieste e contratti).
 */
export const getSponsorStats = async (): Promise<SponsorStats> => {
    const today = new Date().toISOString().split('T')[0];

    const [reqStats, sponsorStats] = await Promise.all([
        supabase.from('sponsor_requests').select('status'),
        supabase.from('sponsors').select('status, end_date, city_id'),
    ]);

    const counts: SponsorStats = {
        pending: 0,
        waiting: 0,
        approved: 0,
        disconnected: 0,
        expired: 0,
        rejected: 0,
        cancelled: 0,
        converted: 0,
        unreadMessages: 0,
    };

    if (reqStats.data) {
        reqStats.data.forEach(r => {
            const statusKey = r.status === 'waiting_payment' ? 'waiting' : r.status;
            if (statusKey === 'pending') counts.pending++;
            else if (statusKey === 'waiting') counts.waiting++;
            else if (statusKey === 'rejected') counts.rejected++;
            else if (statusKey === 'converted') counts.converted++;
        });
    }

    if (sponsorStats.data) {
        sponsorStats.data.forEach(s => {
            if (s.status === 'approved') {
                if (!s.city_id) {
                    counts.disconnected++;
                } else if (s.end_date && s.end_date < today) {
                    counts.expired++;
                } else {
                    counts.approved++;
                }
            } else if (s.status === 'cancelled') {
                counts.cancelled++;
            }
        });
    }

    return counts;
};
