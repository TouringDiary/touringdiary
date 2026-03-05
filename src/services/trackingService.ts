
import { getStorageItem, setStorageItem } from './storageService';

const TRACKING_KEY = 'touring_affiliate_stats';

export interface AffiliateClick {
    poiId: string;
    poiName: string;
    partner: 'booking' | 'tripadvisor' | 'getyourguide' | 'website';
    timestamp: string;
    cityId?: string;
}

export const trackAffiliateClick = (poiId: string, poiName: string, partner: 'booking' | 'tripadvisor' | 'getyourguide' | 'website', cityId?: string) => {
    // 1. Get current stats
    const currentStats = getStorageItem<AffiliateClick[]>(TRACKING_KEY, []);
    
    // 2. Create new event
    const newEvent: AffiliateClick = {
        poiId,
        poiName,
        partner,
        timestamp: new Date().toISOString(),
        cityId
    };

    // 3. Save
    const updatedStats = [...currentStats, newEvent];
    setStorageItem(TRACKING_KEY, updatedStats);

    console.log(`[Tracking] Click registrato: ${partner} su ${poiName}`);
};

export const getAffiliateStats = (): AffiliateClick[] => {
    return getStorageItem<AffiliateClick[]>(TRACKING_KEY, []);
};

export const getAffiliateStatsByPartner = () => {
    const stats = getAffiliateStats();
    const result = {
        booking: 0,
        tripadvisor: 0,
        getyourguide: 0,
        website: 0,
        total: 0
    };

    stats.forEach(s => {
        if (result[s.partner] !== undefined) {
            result[s.partner]++;
            result.total++;
        }
    });

    return result;
};

export const getTopConvertingPois = (limit: number = 5) => {
    const stats = getAffiliateStats();
    const counts: Record<string, { name: string, count: number }> = {};

    stats.forEach(s => {
        if (!counts[s.poiId]) {
            counts[s.poiId] = { name: s.poiName, count: 0 };
        }
        counts[s.poiId].count++;
    });

    return Object.values(counts)
        .sort((a,b) => b.count - a.count)
        .slice(0, limit);
};
