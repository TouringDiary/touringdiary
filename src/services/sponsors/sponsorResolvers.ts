import type { PlanType, RuntimeTier } from '../../constants/planTypes';
import { PLAN_TYPES, resolvePlanTier, resolveResourceType } from '../../constants/planTypes';
import type { Sponsor, SponsorRequest, ResolvedSponsor } from '../../types';
import type { PointOfInterest, PoiSubCategory } from '../../types';
import type { DatabaseJoinedSponsor, DatabaseJoinedSponsorRequest, Json } from '../../types/database';
import type { SponsorLifecycleStatus } from '../../types';
import {
    SPONSOR_STATUS_VALUES,
    PLAN_TYPE_VALUES,
    POI_SUBCATEGORY_VALUES,
    POI_CATEGORY_VALUES
} from '../../constants/governance';
import { sanitizeMediaStatus } from '../../utils/media';

/**
 * SELECT STRINGS PER JOIN RELAZIONALI (SUPABASE/POSTGREST)
 * Includiamo il join su plans per recuperare il tipo reale (gold/silver/etc) senza dipendere dalla colonna legacy 'tier'.
 */
export const SPONSOR_REQUEST_SELECT = `*,cities!city_id(*),pricing_versions!pricing_version_id(price,plans:plan_id(name,type))`;

/** Colonne ammesse in lettura pubblica vetrina (VT-SPONSOR-PUBLIC-READ / DL-032). */
export const SPONSOR_PUBLIC_VITRINE_COLUMNS =
    'id,city_id,company_name,contact_name,type,tier,status,start_date,end_date,plan,poi_category,poi_sub_category,poi_id,shop_id,guide_id,operator_id,address,pricing_version_id,request_id,created_at,updated_at';

const SPONSOR_PRICING_VERSION_JOIN =
    'pricing_versions!pricing_version_id(price,plans:plan_id(name,type))';

const SPONSOR_RESOURCE_JOIN_SELECT =
    'cities!city_id(*),pois!poi_id(name,description,image_url,image_status,coords_lat,coords_lng,category,sub_category,address,website,phone,opening_hours),shops!shop_id(name,slug,description,image_url,image_status,coords_lat,coords_lng,address,website,phone,opening_hours),city_guides!guide_id(name,slug,description,image_url,specialties,languages,phone,website),city_tour_operators!operator_id(name,slug,description,image_url,coords_lat,coords_lng,address,opening_hours)';

export const SPONSOR_PUBLIC_VITRINE_SELECT =
    `${SPONSOR_PUBLIC_VITRINE_COLUMNS},${SPONSOR_RESOURCE_JOIN_SELECT},${SPONSOR_PRICING_VERSION_JOIN}`;

/** Lista legacy attiva: colonne vetrina + tier da pricing_versions (senza join risorse). */
export const SPONSOR_PUBLIC_LEGACY_LIST_SELECT =
    `${SPONSOR_PUBLIC_VITRINE_COLUMNS},${SPONSOR_PRICING_VERSION_JOIN}`;

export const SPONSOR_CONTRACT_SELECT =
    `*,${SPONSOR_RESOURCE_JOIN_SELECT},${SPONSOR_PRICING_VERSION_JOIN},admin_notes,admin_notes_last_updated,request_id`;

/**
 * Determina la categoria POI canonica in base al tipo di piano.
 */
export const resolvePlanPoiCategory = (planType: PlanType): PointOfInterest['category'] => {
    switch (planType) {
        case PLAN_TYPES.DIGITAL_SHOWCASE:
            return 'shop';
        case PLAN_TYPES.TOUR_GUIDE:
        case PLAN_TYPES.TOUR_OPERATOR:
        case PLAN_TYPES.LOCAL_ACTIVITY:
        case PLAN_TYPES.REGIONAL_ACTIVITY:
            return 'discovery';
        default:
            return 'discovery';
    }
};

// --- NORMALIZATION MAPPERS (GOVERNANCE-DRIVEN) ---

type NullableString = string | null | undefined;

const toNullableString = (value: NullableString): string | null =>
    value === undefined ? null : value;

const toOptionalString = (value: NullableString): string | undefined => {
    const normalized = toNullableString(value);
    return normalized === null ? undefined : normalized;
};

type CityJoinRow = {
    name: string | null;
    continent: string | null;
    nation: string | null;
    admin_region: string | null;
    zone: string | null;
};

export type SponsorJoinedCityFields = {
    name: string;
    continent: string;
    nation: string;
    admin_region: string;
    zone: string;
};

/** Input mapper: riga piena o proiezione vetrina da PostgREST. */
export type SponsorMapperInput = Partial<Omit<DatabaseJoinedSponsor, 'cities'>> & {
    id: string;
    cities?: CityJoinRow | SponsorJoinedCityFields | null;
};

/** Normalizza il join `cities` restituito da PostgREST (campi nullable) per DatabaseJoinedSponsor. */
export const normalizeSponsorCityJoin = (
    cities: CityJoinRow | SponsorJoinedCityFields | null | undefined
): SponsorJoinedCityFields | null => {
    if (!cities) return null;
    return {
        name: cities.name ?? '',
        continent: cities.continent ?? '',
        nation: cities.nation ?? '',
        admin_region: cities.admin_region ?? '',
        zone: cities.zone ?? '',
    };
};

/** Allinea una riga join Supabase al contratto mapper senza cast. */
export const normalizeJoinedSponsorRow = (row: SponsorMapperInput): SponsorMapperInput => ({
    ...row,
    cities: normalizeSponsorCityJoin(row.cities),
});

const isSponsorExpired = (status: NullableString, endDate: NullableString): boolean => {
    if (status !== 'approved' || !endDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return endDate < today;
};

const normalizeSponsorStatus = (status: NullableString): SponsorLifecycleStatus => {
    const normalized = toNullableString(status);
    const valid = SPONSOR_STATUS_VALUES as readonly string[];
    return (normalized && valid.includes(normalized)) ? (normalized as SponsorLifecycleStatus) : 'pending';
};

const normalizeSponsorType = (type: NullableString): PlanType => {
    const normalized = toNullableString(type);
    const valid = PLAN_TYPE_VALUES as readonly string[];

    return (
        normalized && valid.includes(normalized)
            ? (normalized as PlanType)
            : PLAN_TYPES.LOCAL_ACTIVITY
    );
};

const resolveSponsorTier = (tier: NullableString): RuntimeTier => {
    return resolvePlanTier(toNullableString(tier));
};

const normalizePoiCategory = (cat: NullableString): PointOfInterest['category'] => {
    const normalized = toNullableString(cat);
    const valid = POI_CATEGORY_VALUES as readonly string[];
    return (normalized && valid.includes(normalized)) ? (normalized as PointOfInterest['category']) : 'discovery';
};

const normalizePoiSubCategory = (sub: NullableString): PoiSubCategory | undefined => {
    const normalized = toNullableString(sub);
    if (!normalized) return undefined;
    const valid = POI_SUBCATEGORY_VALUES as readonly string[];
    return (valid.includes(normalized)) ? (normalized as PoiSubCategory) : undefined;
};

/**
 * Mappa un record della tabella 'sponsors' nel formato 'Sponsor' richiesto dall'App.
 */
export const mapDbSponsorToApp = (dbSponsor: SponsorMapperInput): Sponsor => {
    const isExpired = isSponsorExpired(dbSponsor.status, dbSponsor.end_date);

    return {
        id: dbSponsor.id,
        cityId: dbSponsor.city_id || '',
        contactName: dbSponsor.contact_name || '',
        companyName: dbSponsor.company_name || '',
        vatNumber: dbSponsor.vat_number || '',
        email: dbSponsor.email || '',
        phone: dbSponsor.phone || '',
        address: dbSponsor.address || '',
        status: normalizeSponsorStatus(dbSponsor.status),

        // MAPPING TIER DINAMICO via pricing_versions (Governance aligned)
        tier: resolveSponsorTier(dbSponsor.pricing_versions?.plans?.type || dbSponsor.tier),

        type: normalizeSponsorType(dbSponsor.type),

        startDate: dbSponsor.start_date || '',
        endDate: dbSponsor.end_date || '',
        amount: Number(dbSponsor.amount) || 0,
        isExpired,

        // Resource Linking (FK)
        poiId: dbSponsor.poi_id || undefined,
        shopId: dbSponsor.shop_id || undefined,
        guideId: dbSponsor.guide_id || undefined,
        operatorId: dbSponsor.operator_id || undefined,
        requestId: dbSponsor.request_id || undefined,

        ownerId: dbSponsor.owner_id || undefined,
        profileId: dbSponsor.profile_id || dbSponsor.owner_id || undefined,

        // Internal Notes
        adminNotes: dbSponsor.admin_notes || undefined,
        adminNotesLastUpdated: dbSponsor.admin_notes_last_updated || undefined,

        // Geographic Identity (Resolved via Join)
        continent: toOptionalString(dbSponsor.cities?.continent),
        country: toOptionalString(dbSponsor.cities?.nation),
        region: toOptionalString(dbSponsor.cities?.admin_region),
        touristZone: toOptionalString(dbSponsor.cities?.zone),
        city: toOptionalString(dbSponsor.cities?.name),

        // DUAL-KEY SLUG RESOLUTION
        slug: dbSponsor.shops?.slug || dbSponsor.city_guides?.slug || dbSponsor.city_tour_operators?.slug || undefined
    };
};

/**
 * Mappa il risultato di una query JOIN di Supabase in un oggetto ResolvedSponsor.
 */
export const mapResolvedSponsor = (dbRow: SponsorMapperInput): ResolvedSponsor => {
    const sponsor = mapDbSponsorToApp(dbRow);
    let resolvedData: ResolvedSponsor['resolvedData'] = undefined;

    if (dbRow.pois) {
        resolvedData = {
            name: dbRow.pois.name || '',
            description: dbRow.pois.description || '',
            imageUrl: dbRow.pois.image_url || '',
            image_status: sanitizeMediaStatus(dbRow.pois.image_status),
            coords: { lat: Number(dbRow.pois.coords_lat) || 0, lng: Number(dbRow.pois.coords_lng) || 0 },
            category: normalizePoiCategory(dbRow.pois.category),
            subCategory: normalizePoiSubCategory(dbRow.pois.sub_category),
            address: dbRow.pois.address || '',
            slug: undefined
        };
    } else if (dbRow.shops) {
        resolvedData = {
            name: dbRow.shops.name || '',
            description: dbRow.shops.description || '',
            imageUrl: dbRow.shops.image_url || '',
            image_status: sanitizeMediaStatus(dbRow.shops.image_status),
            coords: { lat: Number(dbRow.shops.coords_lat) || 0, lng: Number(dbRow.shops.coords_lng) || 0 },
            address: dbRow.shops.address || '',
            slug: dbRow.shops.slug || undefined
        };
    } else if (dbRow.city_guides) {
        // GUIDA TURISTICA: Entità volutamente "lightweight" con gestione semplificata dell'immagine.
        // NON appartiene alla media governance complessa (zero colonne image_status/license/credit).
        // Se image_url è presente è considerata 'real', altrimenti 'missing' per placeholder automatico.
        resolvedData = {
            name: dbRow.city_guides.name || '',
            description: dbRow.city_guides.description || '',
            imageUrl: dbRow.city_guides.image_url || '',
            image_status: dbRow.city_guides.image_url ? 'real' : 'missing',
            coords: { lat: 0, lng: 0 },
            specialties: dbRow.city_guides.specialties || [],
            languages: dbRow.city_guides.languages || [],
            address: '',
            slug: dbRow.city_guides.slug || undefined
        };
    } else if (dbRow.city_tour_operators) {
        // TOUR OPERATOR: Entità volutamente "lightweight" con gestione semplificata dell'immagine.
        // NON appartiene alla media governance complessa (zero colonne image_status/license/credit).
        // Se image_url è presente è considerata 'real', altrimenti 'missing' per placeholder automatico.
        resolvedData = {
            name: dbRow.city_tour_operators.name || '',
            description: dbRow.city_tour_operators.description || '',
            imageUrl: dbRow.city_tour_operators.image_url || '',
            image_status: dbRow.city_tour_operators.image_url ? 'real' : 'missing',
            coords: { lat: Number(dbRow.city_tour_operators.coords_lat) || 0, lng: Number(dbRow.city_tour_operators.coords_lng) || 0 },
            address: dbRow.city_tour_operators.address || '',
            slug: dbRow.city_tour_operators.slug || undefined
        };
    }

    return { ...sponsor, resolvedData };
};

export const isResolvedSponsor = (sponsor: Sponsor | ResolvedSponsor): sponsor is ResolvedSponsor => {
    return (sponsor as ResolvedSponsor).resolvedData !== undefined;
};

/**
 * Converte uno Sponsor (contrattuale) o un ResolvedSponsor (con JOIN) in un PointOfInterest
 * pronto per il rendering sulla mappa o nel diario.
 */
export const convertSponsorToPoi = (sponsor: Sponsor | ResolvedSponsor): PointOfInterest => {
    const resolved = isResolvedSponsor(sponsor) ? sponsor.resolvedData : undefined;

    return {
        id: `sponsor-${sponsor.id}`,
        name: resolved?.name || sponsor.companyName,
        description: resolved?.description || `Visita ${sponsor.companyName}, un partner consigliato da Touring-Diary.`,
        imageUrl: resolved?.imageUrl || '',
        image_status: resolved?.image_status ?? 'missing',
        category: resolved?.category || resolvePlanPoiCategory(sponsor.type),
        coords: resolved?.coords || { lat: 0, lng: 0 },
        rating: 0,
        votes: 0,

        address: resolved?.address || sponsor.address,
        cityId: sponsor.cityId,
        isSponsored: true,
        tier: sponsor.tier,
        planType: sponsor.type,
        resourceType: resolveResourceType(sponsor.type),

        // Campi di Conformità (Contratto PointOfInterest)
        openingHours: null,
        reviews: [],
        affiliate: null,
        linkMetadata: null,
        contactInfo: null
    };
};

/**
 * Mappa una richiesta di sponsorizzazione dal DB al formato per l'UI admin.
 */
export const mapDbSponsorRequestToApp = (dbRequest: DatabaseJoinedSponsorRequest): SponsorRequest => {
    const isExpired = isSponsorExpired(dbRequest.status, dbRequest.end_date);
    const pricingPlanType = dbRequest.pricing_versions?.plans?.type;

    return {
        id: dbRequest.id,
        cityId: dbRequest.city_id || '',
        contactName: dbRequest.requester_name || '',
        companyName: dbRequest.company_name || '',
        vatNumber: dbRequest.vat_number || undefined,
        requesterPhone: dbRequest.requester_phone || undefined,
        email: dbRequest.requester_email || dbRequest.email || '',
        phone: dbRequest.requester_phone || dbRequest.phone || '',
        address: dbRequest.address || undefined,
        status: normalizeSponsorStatus(dbRequest.status),
        type: normalizeSponsorType(dbRequest.type),
        poiSubCategory: normalizePoiSubCategory(dbRequest.poi_sub_category),
        imageUrl: dbRequest.image_url || undefined,
        image_status: sanitizeMediaStatus(dbRequest.image_status),
        coordsLat: Number(dbRequest.coords_lat) || undefined,
        coordsLng: Number(dbRequest.coords_lng) || undefined,
        description: dbRequest.description || undefined,
        languages: dbRequest.languages || undefined,
        specialties: dbRequest.specialties || undefined,
        licenseNumber: dbRequest.license_number || undefined,
        message: dbRequest.message || undefined,
        rejectionReason: dbRequest.rejection_reason || undefined,
        date: dbRequest.created_at,
        pricingVersionId: dbRequest.pricing_version_id || undefined,
        profileId: dbRequest.profile_id || undefined,
        ownerId: dbRequest.owner_id || undefined,
        amount: Number(dbRequest.amount ?? dbRequest.pricing_versions?.price) || 0,
        tier: resolveSponsorTier(pricingPlanType ?? dbRequest.tier),
        startDate: dbRequest.start_date || '',
        endDate: dbRequest.end_date || '',
        isExpired,
        continent: dbRequest.cities?.continent,
        country: dbRequest.cities?.nation,
        region: dbRequest.cities?.admin_region,
        touristZone: dbRequest.cities?.zone,
        city: dbRequest.cities?.name
    };
};

/**
 * Mappa un record della tabella 'sponsors' nel formato 'SponsorRequest' richiesto dall'Admin UI.
 */
export const mapDbSponsorToRequestApp = (dbSponsor: SponsorMapperInput): SponsorRequest => {
    const isExpired = isSponsorExpired(dbSponsor.status, dbSponsor.end_date);

    return {
        id: dbSponsor.id,
        cityId: dbSponsor.city_id || '',
        contactName: dbSponsor.contact_name || '',
        companyName: dbSponsor.company_name || '',
        vatNumber: dbSponsor.vat_number || '',
        email: dbSponsor.email || '',
        phone: dbSponsor.phone || '',
        address: dbSponsor.address || '',
        status: normalizeSponsorStatus(dbSponsor.status),
        type: normalizeSponsorType(dbSponsor.type),
        tier: resolveSponsorTier(dbSponsor.pricing_versions?.plans?.type || dbSponsor.tier),
        startDate: dbSponsor.start_date || '',
        endDate: dbSponsor.end_date || '',
        amount: Number(dbSponsor.amount) || 0,
        isExpired,
        date: dbSponsor.created_at || '',
        poiId: dbSponsor.poi_id || undefined,
        shopId: dbSponsor.shop_id || undefined,
        guideId: dbSponsor.guide_id || undefined,
        operatorId: dbSponsor.operator_id || undefined,
        requestId: dbSponsor.request_id || undefined,
        adminNotes: dbSponsor.admin_notes || undefined,
        adminNotesLastUpdated: dbSponsor.admin_notes_last_updated || undefined,
        continent: toOptionalString(dbSponsor.cities?.continent),
        country: toOptionalString(dbSponsor.cities?.nation),
        region: toOptionalString(dbSponsor.cities?.admin_region),
        touristZone: toOptionalString(dbSponsor.cities?.zone),
        city: toOptionalString(dbSponsor.cities?.name)
    };
};
