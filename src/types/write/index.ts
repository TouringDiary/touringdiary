/**
 * WRITE PAYLOADS — src/types/write/index.ts
 *
 * Questi tipi separano nettamente il dominio di lettura dal dominio di scrittura.
 *
 * REGOLA FONDAMENTALE:
 * - Il READ model (CityDetails, PointOfInterest) viene usato SOLO nel frontend.
 * - Questi payload vengono usati SOLO dai service layer di scrittura verso Supabase.
 * - Non c'è mai ambiguità tra read/write/update.
 *
 * PERCHÉ NON SI USANO DbCityUpdate / DbPoiUpdate:
 * - Il write path admin usa UPDATE/INSERT espliciti con payload completo tipizzato.
 * - DbCityUpdate = Update<'cities'> ha tutti i campi opzionali → insufficiente come contratto di scrittura editor.
 *
 * PERCHÉ NON SI USA Partial:
 * - Partial nasconde quali campi sono realmente inviati al DB.
 * - Ogni campo presente in questo payload è esplicitamente intenzionale.
 */

import type { Json } from '../supabase';
import type { MediaStatus } from '../models/Media';
import type { 
    CitySummary, 
    PointOfInterest, 
    BadgeType, 
    PoiCategory, 
    PoiSubCategory,
    SponsorTier,
    Sponsor,
    SponsorLifecycleStatus,
    SponsorRequest,
    ShopCategory,
    ShopPartner,
    ShopProduct
} from '../index';

// ─────────────────────────────────────────────────────────────────────────────
// CITY WRITE PAYLOAD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CityUpsertPayload: contratto esplicito di scrittura città (read model → DB row).
 *
 * Usato da: cityPayloadMapper.buildCityWritePayload() → admin PATCH /cities/:id/details
 *
 * CAMPI OBBLIGATORI:
 * - id, name
 *
 * CAMPI MEDIA (Persistenza DB-Driven):
 * - image_status: stato semantico dell'immagine ('real', 'placeholder', 'missing')
 * - hero_status: stato semantico della hero ('real', 'placeholder', 'missing')
 * NOTA: MediaStatus rimane la source of truth ufficiale nel dominio applicativo.
 */
export interface CityUpsertPayload {
    // Identità (obbligatori per upsert)
    id: string;
    name: string;

    // Geo
    continent: string | null;
    nation: string | null;
    admin_region: string | null;
    zone: string | null;
    coords_lat: number | null;
    coords_lng: number | null;

    // Descrittivo
    description: string | null;
    slug: string | null;
    status: CitySummary['status'] | null;

    // Media — Source of Truth
    image_url: string | null;
    image_status: MediaStatus;
    image_credit: string | null;
    image_license: string | null;
    hero_image: string | null;
    hero_status: MediaStatus;

    // Metriche
    rating: number | null;
    visitors: number | null;
    is_featured: boolean | null;
    special_badge: BadgeType | null;
    home_order: number | null;

    // Editoriale
    subtitle: string | null;
    history_snippet: string | null;
    history_full: string | null;
    official_website: string | null;

    // JSON (tipi opachi, tipizzati come Json per Supabase)
    patron_details: Json | null;
    ratings: Json | null;
    gallery: Json | null;
    generation_logs: Json | null;

    // Timestamps
    updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// POI WRITE PAYLOAD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PoiUpsertPayload: contratto esplicito per supabase.from('pois').upsert().
 *
 * Responsabilità: persistenza completa di un PointOfInterest nel DB.
 * Usato da: poiWrite.saveSinglePoi()
 *
 * CAMPO MEDIA (Persistenza):
 * - image_status: stato semantico dell'immagine ('real', 'placeholder', 'missing')
 */
export interface PoiUpsertPayload {
    // Identità (obbligatori per upsert)
    id: string;
    name: string;
    city_id: string;
    category: PoiCategory;
    sub_category: PoiSubCategory | null;
    description: string;
    address: string | null;

    // Media — Source of Truth
    image_url: string;
    image_status: MediaStatus;
    image_credit: string | null;
    image_license: string | null;

    // Coordinate
    coords_lat: number;
    coords_lng: number;

    // Metriche
    rating: number;
    votes: number;
    status: PointOfInterest['status'];

    // Visita
    visit_duration: string | null;
    price_level: number | null;

    // Monetizzazione
    is_sponsored: boolean;
    tier: SponsorTier | null;
    showcase_expiry: string | null;

    // AI & Qualità
    ai_reliability: PointOfInterest['aiReliability'] | null;
    tourism_interest: PointOfInterest['tourismInterest'] | null;
    last_verified: string | null;

    // JSON (tipi opachi)
    opening_hours: Json | null;
    affiliate: Json | null;
    link_metadata: Json | null;

    // Timestamps & Audit
    date_added: string;
    created_at: string;
    created_by: string;
    updated_at: string;
    updated_by: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SPONSOR WRITE PAYLOADS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SponsorUpsertPayload: contratto per supabase.from('sponsors').upsert().
 * 
 * ARCHITECTURAL NOTE: Sponsor Taxonomy
 * Il campo 'type' utilizza attualmente la governance del dominio frontend (Sponsor['type']).
 * Questa scelta rappresenta il consolidamento attuale del dominio applicativo.
 * Una futura audit del CRM/Marketing potrebbe richiedere una separazione tra:
 * 1. Business Domain Type (Es: 'activity', 'guide')
 * 2. Commercial Plan Type (Es: 'vincitore', 'gold_plus')
 * 3. Database Enum Taxonomy
 * Fino a tale audit, Sponsor['type'] rimane la source-of-truth per i write payloads.
 */
export interface SponsorUpsertPayload {
    id?: string;
    city_id: string;
    contact_name: string;
    company_name: string;
    vat_number: string | null;
    email: string;
    phone: string;
    address: string | null;
    status: SponsorLifecycleStatus;
    tier: SponsorTier;
    type: Sponsor['type'];
    start_date: string;
    end_date: string;
    amount: number;
    owner_id?: string;
    profile_id?: string;
    poi_id?: string;
    shop_id?: string;
    guide_id?: string;
    operator_id?: string;
    request_id?: string;
    admin_notes?: string;
    updated_at: string;
}

/**
 * SponsorRequestUpsertPayload: contratto per supabase.from('sponsor_requests').upsert().
 * 
 * ARCHITECTURAL NOTE: Sponsor Taxonomy
 * Vedere nota in SponsorUpsertPayload. Sponsor['type'] riflette la tassonomia 
 * frontend attuale in attesa di consolidamento CRM definitivo.
 */
export interface SponsorRequestUpsertPayload {
    id?: string;
    city_id: string;
    requester_name: string;
    company_name: string;
    vat_number: string | null;
    requester_email: string;
    requester_phone: string;
    address: string | null;
    status: SponsorLifecycleStatus;
    type: Sponsor['type'];
    tier: SponsorTier;
    amount: number;
    pricing_version_id: string;
    profile_id?: string;
    owner_id?: string;
    message?: string | null;
    image_url?: string | null;
    image_status?: MediaStatus;
    coords_lat?: number | null;
    coords_lng?: number | null;
    description?: string | null;
    languages?: string[] | null;
    specialties?: string[] | null;
    license_number?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SHOP & PRODUCT WRITE PAYLOADS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ShopUpsertPayload: contratto per supabase.from('shops').upsert().
 */
export interface ShopUpsertPayload {
    id: string;
    city_id: string;
    name: string;
    category: ShopCategory;
    level: ShopPartner['level'];
    badge: ShopPartner['badge'];
    image_url: string;
    gallery: string[];
    founded_year: number | null;
    short_bio: string | null;
    description: string | null;
    vat_number: string;
    address: string;
    coords_lat: number;
    coords_lng: number;
    phone: string;
    email: string;
    website?: string | null;
    shipping_info?: string | null;
    payment_info?: string | null;
    ai_credits: number;
    is_tipico: boolean;
    likes: number;
    rating: number;
    reviews_count: number;
    reviews: Json;
    owner_id?: string | null;
    slug: string | null;
    updated_at: string;
}

/**
 * ShopProductUpsertPayload: contratto per supabase.from('shop_products').upsert().
 */
export interface ShopProductUpsertPayload {
    id: string;
    shop_id: string;
    name: string;
    description: string;
    image_url: string;
    price: number;
    status: ShopProduct['status'];
    shipping_mode: ShopProduct['shippingMode'];
}
