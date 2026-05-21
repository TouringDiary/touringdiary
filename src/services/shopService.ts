
import { ShopPartner, ShopCategory, ShopProduct, Review } from '../types';
import { PointOfInterest } from '../types/models/City';
import { DatabaseShop, DatabaseShopInsert, DatabaseShopProduct, DatabaseShopProductInsert, DatabaseSponsor, Json } from '@/types/database';
import { supabase } from './supabaseClient';
import { startShopSubscription } from './sponsorService';

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

export const calculateShopRank = (shop: ShopPartner): number => {
    const rating = shop.rating || 0;
    const reviews = shop.reviewsCount || 0;
    const likes = shop.likes || 0;
    return likes + (rating * reviews);
};

// --- WRITE OPERATIONS ---

export const saveShop = async (shop: ShopPartner): Promise<void> => {
    try {
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
        await supabase.from('shops').upsert(dbShop);

        // Sync Sponsor Table
        if (shop.vatNumber) {
            const updatePayload: Partial<DatabaseSponsor> = { 
                company_name: shop.name, 
                address: shop.address 
            };
            if (shop.ownerId) updatePayload.owner_id = shop.ownerId;

            let sponsorQuery = supabase.from('sponsors')
                .update(updatePayload)
                .eq('vat_number', shop.vatNumber);
            
            // SECURITY HARDENING: Bind sync to UUID identity if available
            if (shop.ownerId) {
                sponsorQuery = sponsorQuery.eq('owner_id', shop.ownerId);
            }

            await sponsorQuery;
        }
    } catch (e) {
        console.error("Save Shop Error:", e);
        throw e;
    }
};

export const deleteShop = async (shopId: string): Promise<void> => {
    try {
        const { error } = await supabase.from('shops').delete().eq('id', shopId);
        if (error) throw error;
    } catch(e) { 
        console.error("Delete Shop Error:", e); 
        throw e;
    }
};

export const saveProduct = async (shopId: string, product: ShopProduct): Promise<void> => {
    try {
        const dbProduct: DatabaseShopProductInsert = {
            id: product.id,
            shop_id: shopId,
            name: product.name,
            description: product.description,
            image_url: product.imageUrl,
            price: product.price,
            status: product.status,
            shipping_mode: product.shippingMode
        };
        await supabase.from('shop_products').upsert(dbProduct);
        
        // Subscription Trigger: Resolve Sponsor and Tier from Business Source of Truth
        const { data: sponsor, error: _sponsorError } = await supabase
            .from('sponsors')
            .select('id, tier')
            .eq('shop_id', shopId)
            .maybeSingle();

        if (sponsor) {
            // Map business tier ('gold'|'silver'|'standard') to trigger tier ('standard'|'premium')
            const tier: 'standard' | 'premium' = (sponsor.tier === 'gold') ? 'premium' : 'standard';
            await startShopSubscription(sponsor.id, tier);
        }
    } catch(e) { 
        console.error("Save Product Error:", e);
        throw e;
    }
};

export const deleteShopProduct = async (productId: string): Promise<void> => {
    try {
        const { error } = await supabase.from('shop_products').delete().eq('id', productId);
        if (error) throw error;
    } catch(e) {
        console.error("Delete Product Error:", e);
        throw e;
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

const normalizeReviews = (data: Json): Review[] => {
    if (!Array.isArray(data)) return [];
    return (data as unknown as any[]).filter(item => 
        item && 
        typeof item === 'object' &&
        typeof (item as any).id === 'string' &&
        typeof (item as any).author === 'string' &&
        typeof (item as any).rating === 'number'
    ) as unknown as Review[];
};

const mapDatabaseShopsToApp = (dbShops: (DatabaseShop & { shop_products: DatabaseShopProduct[] })[]): ShopPartner[] => {
    return dbShops.map(db => ({
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
        products: (db.shop_products || []).map((p: DatabaseShopProduct) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            imageUrl: p.image_url,
            price: Number(p.price),
            status: normalizeProductStatus(p.status),
            shippingMode: normalizeShippingMode(p.shipping_mode)
        })),
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
};
