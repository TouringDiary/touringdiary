
import { DatabasePoi } from '../../../types/database';
import {
    PointOfInterest,
    PoiCategory,
    PoiSubCategory,
    OpeningHours,
    AffiliateLinks,
    LinkMetadata,
    ContactInfo,
    EMPTY_AFFILIATE_LINKS,
    EMPTY_OPENING_HOURS,
    AiReliability,
    TourismInterest
} from '../../../types/index';
import { SponsorTier, SPONSOR_TIER_VALUES } from '../../../constants/planTypes';
import { parseMediaAsset } from '../parsers/media/parseMediaAsset';
import {
    AI_RELIABILITY_VALUES,
    TOURISM_INTEREST_VALUES
} from '../../../constants/governance';

// --- HELPER DURATA DEFAULT ---
export const getDefaultDuration = (category: string, subCategory?: string | null): string => {
    const sub = (subCategory || '').toLowerCase();

    // Cibo
    if (category === 'food') {
        if (sub.includes('street') || sub.includes('gelato') || sub.includes('bar')) return '30 min';
        return '1h 30min'; // Ristoranti
    }
    // Monumenti
    if (category === 'monument') {
        if (sub.includes('square') || sub.includes('piazza') || sub.includes('view')) return '30 min';
        if (sub.includes('museum') || sub.includes('archaeol') || sub.includes('castello')) return '2h';
        if (sub.includes('church')) return '45 min';
        return '1h';
    }
    // Natura
    if (category === 'nature') {
        if (sub.includes('beach')) return '3h';
        if (sub.includes('park')) return '1h';
        return '1h';
    }
    // Shopping
    if (category === 'shop') return '45 min';

    // Default generico
    return '1h';
};

// Helper per determinare resourceType
const inferResourceType = (cat: string, sub: string | null): 'guide' | 'operator' | 'service' | undefined => {
    const s = (sub || '').toLowerCase();

    if (s.includes('tour_operator') || s.includes('agency')) return 'operator';
    if (s.includes('guide')) return 'guide';

    // Servizi Utili
    if (['pharmacy', 'hospital', 'police', 'fire', 'transport', 'taxi', 'bus', 'train', 'metro', 'airport', 'ferry', 'maritime', 'parking', 'atm', 'bank'].some(k => s.includes(k))) {
        return 'service';
    }

    return undefined;
};

const isAiReliability = (value: unknown): value is AiReliability =>
    typeof value === 'string' &&
    (AI_RELIABILITY_VALUES as readonly string[]).includes(value);

const isTourismInterest = (value: unknown): value is TourismInterest =>
    typeof value === 'string' &&
    (TOURISM_INTEREST_VALUES as readonly string[]).includes(value);

const isSponsorTier = (value: unknown): value is SponsorTier =>
    typeof value === 'string' &&
    (SPONSOR_TIER_VALUES as readonly string[]).includes(value);

// --- MAPPING HELPERS (Strict Typing) ---
export const mapDbPoiToApp = (db: DatabasePoi): PointOfInterest => {
    try {
        const cat = (db.category as PoiCategory) || 'monument';
        const subCat = (db.sub_category as PoiSubCategory | null) || null;

        // Mappatura contatto (Base: Colonne native website/phone, estensione via contact_info JSON)
        const dbContact = db.contact_info as Record<string, any> | null;
        const contactInfo: ContactInfo = {
            website: db.website || null,
            phone: db.phone || null,
            email: dbContact?.email || null,
            whatsapp: dbContact?.whatsapp || null
        };
        const affiliate = (db.affiliate as unknown as AffiliateLinks) || EMPTY_AFFILIATE_LINKS;
        const imageAsset = parseMediaAsset(db.image_url, db.image_status, db.image_credit, db.image_license);

        return {
            id: db.id,
            cityId: db.city_id,
            name: db.name || 'Senza Nome',
            category: cat,
            subCategory: subCat,
            description: db.description || '',
            imageUrl: imageAsset.url,
            // Media Governance (DB-Driven)
            image_status: imageAsset.mediaStatus,
            imageCredit: imageAsset.credit,
            imageLicense: imageAsset.license,
            imageAsset,

            coords: { lat: db.coords_lat || 0, lng: db.coords_lng || 0 },
            address: db.address || '',
            rating: db.rating || 0,
            votes: db.votes || 0,
            status: (db.status as PointOfInterest['status']) || 'published',
            dateAdded: db.date_added,

            visitDuration: db.visit_duration || getDefaultDuration(db.category, db.sub_category),

            priceLevel: (db.price_level as 1 | 2 | 3 | 4) || null,

            // Safe JSON casting
            openingHours: (db.opening_hours as unknown as OpeningHours) || EMPTY_OPENING_HOURS,

            isSponsored: db.is_sponsored || false,
            tier: isSponsorTier(db.tier) ? db.tier : null,

            affiliate: affiliate,

            showcaseExpiry: db.showcase_expiry,

            aiReliability: isAiReliability(db.ai_reliability)
                ? db.ai_reliability
                : null,
            tourismInterest: isTourismInterest(db.tourism_interest)
                ? db.tourism_interest
                : null,
            // Metadata
            createdAt: db.created_at,
            createdBy: db.created_by,
            updatedAt: db.updated_at,
            updatedBy: db.updated_by,
            lastVerified: db.last_verified || db.updated_at,

            // Link Metadata (Safe JSON casting)
            linkMetadata: (db.link_metadata as unknown as Record<string, LinkMetadata>) || null,

            // --- CAMPI AGGIUNTIVI (HARDENING) ---
            reviews: null, // Le recensioni vengono caricate separatamente se necessario
            gallery: [],   // La galleria POI non è ancora gestita a livello di riga singola
            fullDescription: undefined,
            tips: undefined,
            tags: [],
            suggestedBy: db.suggested_by || undefined,
            vatNumber: undefined,
            listExpiry: undefined,
            specialtyProduct: undefined,
            distance: undefined,

            // --- DIARY 2.0 ---
            resourceType: inferResourceType(cat, subCat),
            contactInfo: contactInfo
        };
    } catch (e) {
        console.error("CRITICAL: Error mapping POI:", db.id, e);
        // NON ritorniamo più un fallback safe per non mascherare problemi di integrità.
        // Il chiamante gestirà l'errore a livello di UI (es. ErrorBoundary)
        throw new Error(`POI Mapping Failed for ID ${db.id}: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
};
