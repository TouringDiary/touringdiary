
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
export const getSponsorStats = async (): Promise<SponsorStats | any> => {
    const [reqStats, sponsorStats] = await Promise.all([
        supabase.from('sponsor_requests').select('status'),
        supabase.from('sponsors').select('status')
    ]);

    const counts: any = {
        pending: 0,
        waiting: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
        converted: 0,
        unreadMessages: 0 // Stub per ora
    };

    if (reqStats.data) {
        reqStats.data.forEach(r => {
            const statusKey = r.status === 'waiting_payment' ? 'waiting' : r.status;
            if (counts[statusKey] !== undefined) counts[statusKey]++;
        });
    }

    if (sponsorStats.data) {
        sponsorStats.data.forEach(s => {
            // NOTE: waiting_payment should NOT exist in sponsors table based on current routing,
            // but we ensure only approved/cancelled/rejected are counted here if they exist.
            const statusKey = s.status;
            if (counts[statusKey] !== undefined) counts[statusKey]++;
        });
    }

    return counts;
};
