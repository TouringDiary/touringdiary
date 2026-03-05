
import { getStorageItem } from '../services/storageService';

// Chiave di salvataggio nel database locale del browser
const AFFILIATE_STORAGE_KEY = 'touring_affiliate_config';

type PartnerType = 'booking' | 'tripadvisor' | 'getyourguide' | 'website' | 'thefork' | 'michelin' | 'airbnb' | 'skyscanner' | 'ferryscanner';

/**
 * Recupera la configurazione attuale (salvata dall'Admin o default).
 */
const getAffiliateConfig = () => {
    // Prova a leggere i codici salvati dall'Admin Panel
    const stored = getStorageItem<Record<string, string>>(AFFILIATE_STORAGE_KEY, {});
    
    return {
        booking: {
            partnerId: stored.booking || '1234567', // Fallback se non impostato
            paramName: 'aid'
        },
        thefork: {
            partnerId: stored.thefork || '98765',
            paramName: 'affiliate_id' 
        },
        getyourguide: {
            partnerId: stored.getyourguide || 'touringdiary',
            paramName: 'partner_id'
        },
        tripadvisor: {
            partnerId: stored.tripadvisor || '445566',
            paramName: 'm'
        },
        michelin: {
            partnerId: stored.michelin || '',
            paramName: ''
        },
        airbnb: {
            partnerId: stored.airbnb || '', // Solitamente deep link o tracking code specifico
            paramName: 'af' 
        },
        skyscanner: {
            partnerId: stored.skyscanner || '',
            paramName: 'associateid'
        },
        ferryscanner: {
            partnerId: stored.ferryscanner || '',
            paramName: 'aff_id'
        }
    };
};

/**
 * Prende un URL pulito e aggiunge automaticamente i parametri di tracciamento
 * usando i codici configurati nel pannello Admin.
 */
export const enrichAffiliateUrl = (url: string, type: PartnerType): string => {
    if (!url) return '';
    if (type === 'website') return url; // I siti ufficiali non hanno affiliazione

    try {
        const urlObj = new URL(url);
        const config = getAffiliateConfig()[type as keyof ReturnType<typeof getAffiliateConfig>];

        if (config && config.partnerId && config.paramName) {
            // Controlla se il parametro esiste già per evitare duplicati
            if (!urlObj.searchParams.has(config.paramName)) {
                urlObj.searchParams.append(config.paramName, config.partnerId);
                
                // Parametri di tracciamento analytics (UTM)
                if (!urlObj.searchParams.has('utm_source')) {
                    urlObj.searchParams.append('utm_source', 'touring_diary_app');
                    urlObj.searchParams.append('utm_medium', 'referral');
                    urlObj.searchParams.append('utm_campaign', 'poi_click');
                }
            }
        }

        return urlObj.toString();
    } catch (e) {
        // Se l'URL non è valido, ritorna l'originale senza rompere l'app
        console.warn('Invalid URL for affiliate enrichment:', url);
        return url;
    }
};
