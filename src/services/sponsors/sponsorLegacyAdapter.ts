
import type { SponsorRequest } from '../../types/models/Sponsor';
import { supabase } from '../supabaseClient';

/**
 * Recupera gli sponsor attivi (legacy compat).
 * Tenta di caricare da API proxy con fallback su Supabase.
 */
export const getSponsorsAsync = async (): Promise<SponsorRequest[]> => {
    try {
        const today = new Date().toISOString().split('T')[0];
        let data: any[] | null = null;
        let source = 'API';

        // Tenta API proxy
        try {
            const apiResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/bootstrap/sponsors`);
            if (apiResponse.ok) {
                const apiData = await apiResponse.json();
                if (apiData.success) {
                    data = (apiData.data || []).filter((s: any) =>
                        s.status === 'approved' &&
                        (!s.start_date || s.start_date <= today) &&
                        (!s.end_date || s.end_date >= today)
                    );
                }
            }
        } catch (e) {
            console.warn("[SponsorService] getSponsorsAsync API fallback to Supabase");
        }

        // Fallback Supabase
        if (!data) {
            source = 'Supabase';
            const { data: supaData, error } = await supabase
                .from('sponsors')
                .select(`
                    *,
                    pricing_versions!pricing_version_id (
                        plans:plan_id (
                            type
                        )
                    )
                `)
                .eq('status', 'approved')
                .or(`start_date.is.null,start_date.lte.${today}`)
                .or(`end_date.is.null,end_date.gte.${today}`);

            if (error) throw error;
            data = supaData;
        }

        console.log(`[SponsorService] Active sponsors loaded from ${source}:`, data?.length);

        // Mappatura al formato SponsorRequest richiesto dalla UI (legacy compat)
        return (data || []).map(s => {
            const pv = Array.isArray(s.pricing_versions) ? s.pricing_versions[0] : s.pricing_versions;
            const plan = pv && Array.isArray(pv.plans) ? pv.plans[0] : (pv?.plans);
            
            return {
                id: s.id,
                companyName: s.company_name,
                vatNumber: s.vat_number,
                address: s.address,
                cityId: s.city_id,
                status: s.status,
                tier: plan?.type || s.tier, // Fallback su colonna legacy per vecchi records
                poiCategory: s.poi_category,
                startDate: s.start_date,
                endDate: s.end_date
            };
        }) as SponsorRequest[];

    } catch (e) {
        console.error("Error in getSponsorsAsync:", e);
        return [];
    }
};
