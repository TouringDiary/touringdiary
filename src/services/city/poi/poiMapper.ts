
import { DatabasePoi } from '../../../types/database';
import { PointOfInterest, PoiCategory, SponsorTier, OpeningHours, AffiliateLinks, LinkMetadata } from '../../../types/index';

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
const inferResourceType = (cat: string, sub: string): 'guide' | 'operator' | 'service' | undefined => {
    const s = (sub || '').toLowerCase();
    
    if (s.includes('tour_operator') || s.includes('agency')) return 'operator';
    if (s.includes('guide')) return 'guide';
    
    // Servizi Utili
    if (['pharmacy', 'hospital', 'police', 'fire', 'transport', 'taxi', 'bus', 'train', 'metro', 'airport', 'ferry', 'maritime', 'parking', 'atm', 'bank'].some(k => s.includes(k))) {
        return 'service';
    }
    
    return undefined;
};

// --- MAPPING HELPERS (Strict Typing) ---
export const mapDbPoiToApp = (db: DatabasePoi): PointOfInterest => {
    try {
        const cat = (db.category as PoiCategory) || 'monument';
        const subCat = db.sub_category as string || '';
        
        // Mappatura contatto (Base: Affiliate links come website, resto non disponibile nel DB Poi Raw)
        // In futuro, se aggiungiamo colonne phone/email a 'pois', le mapperemo qui.
        const affiliate = (db.affiliate as unknown as AffiliateLinks) || {};
        const contactInfo = {
            website: affiliate.website || undefined
        };

        return {
            id: db.id,
            cityId: db.city_id,
            name: db.name || 'Senza Nome',
            category: cat, 
            subCategory: subCat as any, 
            description: db.description || '',
            imageUrl: db.image_url || '',
            coords: { lat: db.coords_lat || 0, lng: db.coords_lng || 0 },
            address: db.address || '',
            rating: db.rating || 0,
            votes: db.votes || 0,
            status: (db.status as 'published' | 'draft' | 'needs_check') || 'published',
            dateAdded: db.date_added, 
            
            visitDuration: db.visit_duration || getDefaultDuration(db.category, db.sub_category),
            
            priceLevel: (db.price_level as 1|2|3|4) || 2,
            
            // Safe JSON casting
            openingHours: (db.opening_hours as unknown as OpeningHours) || undefined,
            
            isSponsored: db.is_sponsored || false,
            tier: (db.tier as SponsorTier) || undefined, 
            
            // Safe JSON casting
            affiliate: affiliate,
            
            showcaseExpiry: db.showcase_expiry,
            
            aiReliability: (db.ai_reliability as 'high' | 'medium' | 'low') || null,
            tourismInterest: (db.tourism_interest as 'high' | 'medium' | 'low') || undefined, 
            
            // Metadata
            createdAt: db.created_at,
            createdBy: db.created_by,
            updatedAt: db.updated_at,
            updatedBy: db.updated_by,
            lastVerified: db.last_verified || db.updated_at, 
            
            // Link Metadata (Safe JSON casting)
            linkMetadata: (db.link_metadata as unknown as Record<string, LinkMetadata>) || {},

            // --- DIARY 2.0 ---
            resourceType: inferResourceType(cat, subCat),
            contactInfo: contactInfo
        };
    } catch (e) {
        console.error("Error mapping POI:", db.id, e);
        // Return a safe fallback to prevent list crash
        return {
            id: db.id, name: "Errore Dati", category: 'discovery', description: "Errore caricamento dati",
            imageUrl: '', coords: {lat:0,lng:0}, rating:0, votes:0, address:''
        };
    }
};
