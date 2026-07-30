
import { ShopPartner, ShopCategory, ShopProduct, Review } from '../types';
import { PointOfInterest } from '../types/models/City';
import { DatabaseShop, DatabaseShopInsert, DatabaseShopProduct, DatabaseShopProductInsert, Json } from '@/types/database';
import { supabase } from './supabaseClient';

// --- READ OPERATIONS ---

export const getAllShops = async (): Promise<ShopPartner[]> => {
    try {
        const { data, error } = await supabase
            .from('shops')
            .select(`*, shop_products (*)`);

        if (error) throw error;
        return mapDatabaseShopsToApp(data || []);
    } catch (e) {
        console.error("DB Error Shops:", e);
        return [];
    }
};

export const getShopByVat = async (vat: string): Promise<ShopPartner | undefined> => {
    const { data } = await supabase
        .from('shops')
        .select(`*, shop_products (*)`)
        .eq('vat_number', vat)
        .maybeSingle();

    if (data) return mapDatabaseShopsToApp([data])[0];
    return undefined;
};

export const getShopById = async (id: string): Promise<ShopPartner | undefined> => {
    const { data, error } = await supabase
        .from('shops')
        .select(`*, shop_products (*)`)
        .eq('id', id)
        .maybeSingle();

    if (error) {
        console.error("[ShopService] Error fetching shop by id:", error);
        return undefined;
    }

    if (data) return mapDatabaseShopsToApp([data])[0];
    return undefined;
};

export const getShopByOwner = async (ownerId: string): Promise<ShopPartner | undefined> => {
    // SECURITY HARDENING: Rimosso maybeSingle() per evitare crash PGRST116 (Multi-business support)
    const { data, error } = await supabase
        .from('shops')
        .select(`*, shop_products (*)`)
        .eq('owner_id', ownerId)
        .limit(1);

    if (error) {
        console.error("[ShopService] Error fetching shop by owner:", error);
        return undefined;
    }

    if (data && data.length > 0) {
        return mapDatabaseShopsToApp(data)[0];
    }
    return undefined;
};

export const getShopsByFilter = async (cityId: string, category?: ShopCategory): Promise<ShopPartner[]> => {
    let query = supabase
        .from('shops')
        .select(`*, shop_products (*)`)
        .eq('city_id', cityId);

    if (category) {
        query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) {
        console.error("Filter Shops Error:", error);
        return [];
    }

    let results = mapDatabaseShopsToApp(data || []);

    // VISIBILITY RULE: Bottega must have at least 1 visible product
    results = results.filter(shop => shop.products && shop.products.length > 0);

    // SORTING
    return results.sort((a, b) => {
        if (a.badge === 'gold' && b.badge !== 'gold') return -1;
        if (a.badge !== 'gold' && b.badge === 'gold') return 1;
        if (a.level === 'premium' && b.level !== 'premium') return -1;
        if (a.level !== 'premium' && b.level === 'premium') return 1;
        return calculateShopRank(b) - calculateShopRank(a);
    });
};

/** Batch: negozi digitali per più città (Around Me). Stessa visibilità/ordinamento di getShopsByFilter. */
export const getShopsByCityIds = async (
    cityIds: string[],
    category?: ShopCategory,
): Promise<ShopPartner[]> => {
    if (cityIds.length === 0) return [];

    let query = supabase
        .from('shops')
        .select(`*, shop_products (*)`)
        .in('city_id', cityIds);

    if (category) {
        query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) {
        console.error('Filter Shops By City Ids Error:', error);
        return [];
    }

    let results = mapDatabaseShopsToApp(data || []);
    results = results.filter((shop) => shop.products && shop.products.length > 0);

    return results.sort((a, b) => {
        if (a.badge === 'gold' && b.badge !== 'gold') return -1;
        if (a.badge !== 'gold' && b.badge === 'gold') return 1;
        if (a.level === 'premium' && b.level !== 'premium') return -1;
        if (a.level !== 'premium' && b.level === 'premium') return 1;
        return calculateShopRank(b) - calculateShopRank(a);
    });
};

export const calculateShopRank = (shop: ShopPartner): number => {
    const rating = shop.rating || 0;
    const reviews = shop.reviewsCount || 0;
    const likes = shop.likes || 0;
    return likes + (rating * reviews);
};

// --- WRITE OPERATIONS ---

export const saveShop = async (shop: ShopPartner): Promise<void> => {
    const dbShop: DatabaseShopInsert = {
        id: shop.id,
        city_id: shop.cityId,
        name: shop.name,
        category: shop.category,
        level: shop.level,
        badge: shop.badge,
        image_url: shop.imageUrl,
        gallery: shop.gallery,
        founded_year: shop.foundedYear,
        short_bio: shop.shortBio,
        description: shop.description,
        vat_number: shop.vatNumber,
        address: shop.address,
        coords_lat: shop.coords.lat,
        coords_lng: shop.coords.lng,
        phone: shop.phone,
        email: shop.email,
        website: shop.website,
        shipping_info: shop.shippingInfo,
        payment_info: shop.paymentInfo,
        ai_credits: shop.aiCredits,
        is_tipico: shop.isTipico || false,
        likes: shop.likes,
        rating: shop.rating,
        reviews_count: shop.reviewsCount,
        reviews: shop.reviews as unknown as Json, // Safe cast to recursive Json type
        owner_id: shop.ownerId, // NEW: Supporto owner_id tipizzato
        slug: shop.slug || null,
        updated_at: new Date().toISOString()
    };
    const { error: upsertShopError } = await supabase.from('shops').upsert(dbShop);
    if (upsertShopError) {
        console.error('[ShopService] saveShop upsert failed:', upsertShopError.message);
        throw upsertShopError;
    }

    if (shop.id) {
        const { error: syncError } = await supabase.rpc('sync_sponsor_profile_from_shop', {
            p_shop_id: shop.id,
            p_refresh_subscription: false,
        });
        if (syncError) {
            console.error('[ShopService] sync_sponsor_profile_from_shop failed:', syncError.message);
            throw syncError;
        }
    }
};

export const deleteShop = async (shopId: string): Promise<void> => {
    const { error } = await supabase.from('shops').delete().eq('id', shopId);
    if (error) {
        console.error('[ShopService] deleteShop failed:', error.message);
        throw error;
    }
};

export const saveProduct = async (shopId: string, product: ShopProduct): Promise<void> => {
    assertShopProductInvariants(product);
    const dbProduct: DatabaseShopProductInsert = {
        id: product.id,
        shop_id: shopId,
        name: product.name.trim(),
        description: product.description.trim(),
        image_url: product.imageUrl.trim(),
        price: product.price,
        status: product.status,
        shipping_mode: product.shippingMode
    };
    const { error: upsertProductError } = await supabase.from('shop_products').upsert(dbProduct);
    if (upsertProductError) {
        console.error('[ShopService] saveProduct upsert failed:', upsertProductError.message);
        throw upsertProductError;
    }

    const { data: sponsor, error: sponsorError } = await supabase
        .from('sponsors')
        .select('id, tier')
        .eq('shop_id', shopId)
        .maybeSingle();

    if (sponsorError) {
        console.error('[ShopService] sponsor lookup failed:', sponsorError.message);
        throw sponsorError;
    }

    if (sponsor) {
        const tier: 'standard' | 'premium' = sponsor.tier === 'gold' ? 'premium' : 'standard';
        const { error: syncError } = await supabase.rpc('sync_sponsor_profile_from_shop', {
            p_shop_id: shopId,
            p_refresh_subscription: true,
            p_subscription_tier: tier,
        });
        if (syncError) {
            console.error('[ShopService] sync_sponsor_profile_from_shop failed:', syncError.message);
            throw syncError;
        }
    }
};

export const deleteShopProduct = async (productId: string): Promise<void> => {
    const { error } = await supabase.from('shop_products').delete().eq('id', productId);
    if (error) {
        console.error('[ShopService] deleteShopProduct failed:', error.message);
        throw error;
    }
};

// --- DOMAIN NORMALIZATION MAPPERS (Type-Safe Enums) ---

const normalizePoiCategory = (cat: string | null): PointOfInterest['category'] => {
    const valid: PointOfInterest['category'][] = ['monument' , 'food' , 'hotel' , 'nature' , 'discovery' , 'leisure' , 'shop' , 'all'];
    return valid.includes(cat as PointOfInterest['category']) ? (cat as PointOfInterest['category']) : 'discovery';
};

const normalizeShopCategory = (cat: string | null): ShopPartner['category'] => {
    const valid: ShopPartner['category'][] = ['gusto', 'cantina', 'artigianato', 'moda'];
    if (cat && valid.includes(cat as ShopPartner['category'])) {
        return cat as ShopPartner['category'];
    }
    // Mapping silente per categorie legacy o sub-categorie comuni
    if (cat?.toLowerCase() === 'pasticceria') return 'gusto';
    
    if (cat) console.warn(`[ShopService] Invalid category detected: ${cat}. Falling back to 'gusto'.`);
    return 'gusto';
};

const normalizeShopLevel = (level: string | null): ShopPartner['level'] => {
    return (level === 'base' || level === 'premium') ? level : 'base';
};

const normalizeShopBadge = (badge: string | null): ShopPartner['badge'] => {
    return (badge === 'registered' || badge === 'gold') ? badge : 'registered';
};

const normalizeProductStatus = (status: string | null): ShopProduct['status'] => {
    return (status === 'active' || status === 'inactive') ? status : 'inactive';
};

const normalizeShippingMode = (mode: string | null): ShopProduct['shippingMode'] => {
    const valid: ShopProduct['shippingMode'][] = ['pickup', 'ship', 'both'];
    return valid.includes(mode as ShopProduct['shippingMode']) ? (mode as ShopProduct['shippingMode']) : 'pickup';
};

/**
 * Invarianti Negozio Digitale (nome, descrizione, immagine, prezzo > 0).
 * Nessun backfill inventato: prodotti incompleti restano fuori dal dominio app.
 * Usa variabili locali ristrette (niente type-predicate) per restare corretto
 * anche quando strictNullChecks non è attivo nel tsconfig app.
 */
const assertShopProductInvariants = (product: ShopProduct): void => {
    if (!product.name?.trim()) {
        throw new Error('[ShopService] Product name is required.');
    }
    if (!product.description?.trim()) {
        throw new Error('[ShopService] Product description is required.');
    }
    if (!product.imageUrl?.trim()) {
        throw new Error('[ShopService] Product image is required.');
    }
    if (!(product.price > 0)) {
        throw new Error('[ShopService] Product price must be greater than 0.');
    }
};

const mapDatabaseProductToApp = (p: DatabaseShopProduct): ShopProduct | null => {
    const name = typeof p.name === 'string' ? p.name.trim() : '';
    const description = typeof p.description === 'string' ? p.description.trim() : '';
    const imageUrl = typeof p.image_url === 'string' ? p.image_url.trim() : '';
    const price = p.price == null ? NaN : Number(p.price);

    if (!name || !description || !imageUrl || !(price > 0)) {
        return null;
    }

    return {
        id: p.id,
        name,
        description,
        imageUrl,
        price,
        status: normalizeProductStatus(p.status),
        shippingMode: normalizeShippingMode(p.shipping_mode)
    };
};

const normalizeReviews = (data: Json): Review[] => {
    if (!Array.isArray(data)) return [];
    const reviews: Review[] = [];
    for (const item of data) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
        const row = item as Record<string, unknown>;
        if (
            typeof row.id !== 'string' ||
            typeof row.author !== 'string' ||
            typeof row.rating !== 'number'
        ) {
            continue;
        }
        reviews.push(row as unknown as Review);
    }
    return reviews;
};

const mapDatabaseShopsToApp = (dbShops: (DatabaseShop & { shop_products: DatabaseShopProduct[] })[]): ShopPartner[] => {
    const result = dbShops.map(db => ({
        id: db.id,
        name: db.name || 'Senza Nome',
        cityId: db.city_id,
        category: normalizeShopCategory(db.category),
        level: normalizeShopLevel(db.level),
        badge: normalizeShopBadge(db.badge),
        imageUrl: db.image_url || '',
        gallery: db.gallery || [],
        foundedYear: db.founded_year,
        shortBio: db.short_bio || '',
        description: db.description || '',
        products: (db.shop_products || [])
            .map(mapDatabaseProductToApp)
            .filter((p): p is ShopProduct => p !== null),
        likes: Number(db.likes) || 0,
        rating: Number(db.rating) || 0,
        reviewsCount: Number(db.reviews_count) || 0,
        reviews: normalizeReviews(db.reviews),
        vatNumber: db.vat_number,
        address: db.address || '',
        coords: { lat: db.coords_lat || 0, lng: db.coords_lng || 0 },
        phone: db.phone || '',
        email: db.email || '',
        website: db.website,
        shippingInfo: db.shipping_info,
        paymentInfo: db.payment_info,
        aiCredits: Number(db.ai_credits) || 0,
        isTipico: db.is_tipico,
        ownerId: db.owner_id,
        slug: db.slug || undefined
    }));
    const rawProductCount = dbShops.reduce((n, db) => n + (db.shop_products || []).length, 0);
    const mappedProductCount = result.reduce((n, shop) => n + shop.products.length, 0);
    const skippedIncompleteProducts = rawProductCount - mappedProductCount;
    if (skippedIncompleteProducts > 0 && import.meta.env.DEV) {
        console.warn(
            `[ShopService] Skipped ${skippedIncompleteProducts} incomplete shop_product row(s) (missing name/description/image/price).`,
        );
    }
    return result;
};
