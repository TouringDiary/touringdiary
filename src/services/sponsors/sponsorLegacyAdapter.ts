import type { PoiCategory } from '../../types';
import type { SponsorRequest } from '../../types/models/Sponsor';
import type { SponsorLifecycleStatus } from '../../types/shared/SponsorStatus';
import type { PlanType, SponsorTier } from '../../constants/planTypes';
import { PLAN_TYPES, resolvePlanTier } from '../../constants/planTypes';
import { POI_CATEGORY_VALUES, PLAN_TYPE_VALUES, SPONSOR_STATUS_VALUES } from '../../constants/governance';
import { SPONSOR_PUBLIC_LEGACY_LIST_SELECT } from './sponsorResolvers';
import { supabase } from '../supabaseClient';

type SponsorPricingPlanJoin = {
    type: string | null;
    name?: string | null;
};

type SponsorPricingVersionJoin = {
    price?: number | null;
    plans?: SponsorPricingPlanJoin | SponsorPricingPlanJoin[] | null;
};

/** Riga minima lista sponsor attivi (API bootstrap o Supabase vetrina). */
type SponsorPublicListRow = {
    id: string;
    company_name: string | null;
    vat_number?: string | null;
    address: string | null;
    city_id: string | null;
    status: string | null;
    tier: string | null;
    type: string | null;
    poi_category: string | null;
    start_date: string | null;
    end_date: string | null;
    pricing_versions?: SponsorPricingVersionJoin | SponsorPricingVersionJoin[] | null;
};

interface BootstrapSponsorsPayload {
    success: boolean;
    data?: SponsorPublicListRow[];
}

const firstJoinItem = <T,>(value: T | T[] | null | undefined): T | undefined => {
    if (value == null) return undefined;
    return Array.isArray(value) ? value[0] : value;
};

const resolvePlanTypeFromPricingJoin = (
    pricingVersions: SponsorPublicListRow['pricing_versions']
): string | null => {
    const version = firstJoinItem(pricingVersions);
    const plan = firstJoinItem(version?.plans ?? null);
    return plan?.type ?? null;
};

const isSponsorLifecycleStatus = (value: string): value is SponsorLifecycleStatus =>
    (SPONSOR_STATUS_VALUES as readonly string[]).includes(value);

const normalizeLegacyStatus = (status: string | null): SponsorLifecycleStatus => {
    if (status && isSponsorLifecycleStatus(status)) return status;
    return 'pending';
};

const isPlanType = (value: string): value is PlanType =>
    (PLAN_TYPE_VALUES as readonly string[]).includes(value);

const normalizeLegacyPlanType = (type: string | null): PlanType => {
    if (type && isPlanType(type)) return type;
    return PLAN_TYPES.LOCAL_ACTIVITY;
};

const isPoiCategory = (value: string): value is PoiCategory =>
    (POI_CATEGORY_VALUES as readonly string[]).includes(value);

const normalizeLegacyPoiCategory = (category: string | null): PoiCategory | undefined => {
    if (category && isPoiCategory(category)) return category;
    return undefined;
};

const isActiveSponsorRow = (row: SponsorPublicListRow, today: string): boolean =>
    row.status === 'approved'
    && (!row.start_date || row.start_date <= today)
    && (!row.end_date || row.end_date >= today);

const isBootstrapSponsorsPayload = (value: unknown): value is BootstrapSponsorsPayload =>
    typeof value === 'object' && value !== null && 'success' in value;

const mapPublicListRowToSponsorRequest = (row: SponsorPublicListRow): SponsorRequest => {
    const planType = resolvePlanTypeFromPricingJoin(row.pricing_versions);
    const tier: SponsorTier = resolvePlanTier(planType ?? row.tier);

    return {
        id: row.id,
        cityId: row.city_id ?? '',
        contactName: '',
        companyName: row.company_name ?? '',
        vatNumber: row.vat_number ?? undefined,
        email: '',
        phone: '',
        address: row.address ?? undefined,
        status: normalizeLegacyStatus(row.status),
        date: row.start_date ?? row.end_date ?? '',
        type: normalizeLegacyPlanType(row.type),
        poiCategory: normalizeLegacyPoiCategory(row.poi_category),
        tier,
        startDate: row.start_date ?? undefined,
        endDate: row.end_date ?? undefined,
    };
};

/**
 * Recupera gli sponsor attivi (legacy compat).
 * Tenta di caricare da API proxy con fallback su Supabase.
 */
export const getSponsorsAsync = async (): Promise<SponsorRequest[]> => {
    try {
        const today = new Date().toISOString().split('T')[0];
        let rows: SponsorPublicListRow[] | null = null;

        try {
            const apiResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/bootstrap/sponsors`);
            if (apiResponse.ok) {
                const apiData: unknown = await apiResponse.json();
                if (isBootstrapSponsorsPayload(apiData) && apiData.success && apiData.data) {
                    rows = apiData.data.filter((row) => isActiveSponsorRow(row, today));
                }
            }
        } catch {
            console.warn('[SponsorService] getSponsorsAsync API fallback to Supabase');
        }

        const source: 'API' | 'Supabase' = rows === null ? 'Supabase' : 'API';

        if (rows === null) {
            const { data: supaData, error } = await supabase
                .from('sponsors')
                .select(SPONSOR_PUBLIC_LEGACY_LIST_SELECT)
                .eq('status', 'approved')
                .or(`start_date.is.null,start_date.lte.${today}`)
                .or(`end_date.is.null,end_date.gte.${today}`);

            if (error) throw error;
            rows = (supaData ?? []) as SponsorPublicListRow[];
        }

        const activeRows = rows ?? [];

        if (import.meta.env.DEV) {
            console.log(`[SponsorService] Active sponsors loaded from ${source}:`, activeRows.length);
        }

        return activeRows.map(mapPublicListRowToSponsorRequest);
    } catch (e) {
        console.error('Error in getSponsorsAsync:', e);
        return [];
    }
};
