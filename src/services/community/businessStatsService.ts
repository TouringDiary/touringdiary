import { supabase } from '../supabaseClient';

export const getBusinessStats = async (shopId: string) => {
    if (!shopId) {
        return { views: 0, favorites: 0, interactions: 0, totalProducts: 0, activeProducts: 0, rating: 0, reviewsCount: 0 };
    }

    try {
        // FETCH PARALLELO DELLE METRICHE REALI (UUID-SAFE)
        const [productsRes, shopRes] = await Promise.all([
            supabase.from('shop_products').select('id, status', { count: 'exact' }).eq('shop_id', shopId),
            supabase.from('shops').select('rating, reviews_count').eq('id', shopId).single()
        ]);

        const totalProducts = productsRes.count || 0;
        const activeProducts = (productsRes.data || []).filter(p => p.status === 'active').length;
        
        return {
            views: 0, // Placeholder (Requires analytics engine)
            favorites: 0, // Placeholder (Requires interaction engine)
            interactions: 0, // Placeholder
            totalProducts,
            activeProducts,
            rating: shopRes.data?.rating || 0,
            reviewsCount: shopRes.data?.reviews_count || 0
        };
    } catch (e) {
        console.error("[CommunityService] Error fetching real business stats:", e);
        return { views: 0, favorites: 0, interactions: 0, totalProducts: 0, activeProducts: 0, rating: 0, reviewsCount: 0 };
    }
};
