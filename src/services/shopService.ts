
import { ShopPartner, ShopCategory, ShopProduct } from '../types';
import { DatabaseShop, DatabaseShopProduct } from '../types/database';
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
    const { data, error } = await supabase
        .from('shops')
        .select(`*, shop_products (*)`)
        .eq('vat_number', vat)
        .maybeSingle();

    if (data) return mapDatabaseShopsToApp([data])[0];
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
        const dbShop: DatabaseShop = {
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
            reviews: shop.reviews as any, 
            updated_at: new Date().toISOString()
        };
        await supabase.from('shops').upsert(dbShop);

        // Sync Sponsor Table
        if (shop.vatNumber) {
            await supabase.from('sponsors')
                .update({ company_name: shop.name, address: shop.address })
                .eq('vat_number', shop.vatNumber);
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
        const dbProduct: DatabaseShopProduct = {
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
        
        // Subscription Trigger
        const { data: s } = await supabase.from('shops').select('vat_number').eq('id', shopId).maybeSingle();
        if (s && s.vat_number) {
            await startShopSubscription(s.vat_number);
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

const mapDatabaseShopsToApp = (dbShops: any[]): ShopPartner[] => {
    return dbShops.map(db => ({
        id: db.id,
        name: db.name || 'Senza Nome',
        cityId: db.city_id,
        category: db.category,
        level: db.level || 'base',
        badge: db.badge || 'registered',
        imageUrl: db.image_url || '',
        gallery: db.gallery || [],
        foundedYear: db.founded_year,
        shortBio: db.short_bio || '',
        description: db.description || '',
        products: (db.shop_products || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            imageUrl: p.image_url,
            price: Number(p.price),
            status: p.status,
            shippingMode: p.shipping_mode
        })),
        likes: Number(db.likes) || 0,
        rating: Number(db.rating) || 0,
        reviewsCount: Number(db.reviews_count) || 0,
        reviews: db.reviews || [],
        vatNumber: db.vat_number,
        address: db.address || '',
        coords: { lat: db.coords_lat || 0, lng: db.coords_lng || 0 },
        phone: db.phone || '',
        email: db.email || '',
        website: db.website,
        shippingInfo: db.shipping_info,
        paymentInfo: db.payment_info,
        aiCredits: Number(db.ai_credits) || 0,
        isTipico: db.is_tipico
    }));
};
