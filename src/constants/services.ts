
import { Plane, Train, Bus, Car, Anchor, Box, Siren, Stethoscope, Plus, Banknote, Key } from 'lucide-react';
import { getCachedSetting, SETTINGS_KEYS } from '../services/settingsService';

// ICON MAP STATIC (Mapping ID -> Componente Codice)
// Le icone rimangono hardcoded perché sono componenti React, non dati serializzabili
const ICON_MAP: Record<string, any> = {
    'airport': Plane,
    'train': Train,
    'bus': Bus,
    'taxi': Car,
    'rental': Key,
    'maritime': Anchor,
    'bank': Banknote,
    'pharmacy': Stethoscope,
    'emergency': Siren,
    'other': Box
};

export interface ServiceCategoryDef {
    id: string;
    label: string;
    emoji: string;
    color: string;
    icon: any; 
}

// Funzione Helper per ottenere la configurazione unita dal DB
export const getServicesConfig = (): ServiceCategoryDef[] => {
    const config = getCachedSetting<any[]>(SETTINGS_KEYS.SERVICES_CONFIG);
    if (!config || config.length === 0) return [];
    
    return config.map(c => ({
        ...c,
        icon: ICON_MAP[c.id] || Box 
    }));
};

// EXPORT DINAMICI (Leggono dalla cache sincronizzata all'avvio)
export const SERVICES_CATEGORIES = getServicesConfig(); // Fallback array vuoto se cache non pronta
export const SERVICE_BOXES = SERVICES_CATEGORIES;

// Mappatura Tipi Servizi (Ora recuperata dal DB)
export const getServiceTypeMapping = () => {
    return getCachedSetting<Record<string, { label: string, types: { val: string, label: string }[] }>>(SETTINGS_KEYS.SERVICES_TYPE_MAPPING) || {};
};

// Export per retrocompatibilità (usa getter dinamico)
export const SERVICE_TYPE_MAPPING = getServiceTypeMapping();

export const getBoxIdForType = (type: string): string => {
    const t = (type || '').toLowerCase().trim();
    const mapping = getServiceTypeMapping();

    for (const [boxId, group] of Object.entries(mapping)) {
        if (group.types.some(sub => sub.val === t)) return boxId;
    }
    
    // Heuristics di fallback (se il DB non ha mappato tutto)
    if (t.includes('tour') || t.includes('agency') || t.includes('agenzia')) return 'tour_operator';
    if (t.includes('aerop') || t.includes('airport')) return 'airport';
    if (t.includes('train') || t.includes('tren') || t.includes('stazione')) return 'train';
    if (t.includes('bus') || t.includes('pullman')) return 'bus';
    if (t.includes('taxi') || t.includes('ncc') || t.includes('sharing')) return 'taxi';
    if (t.includes('noleggio') || t.includes('rent') || t.includes('auto')) return 'rental'; 
    if (t.includes('porto') || t.includes('traghetto') || t.includes('aliscafo') || t.includes('nave')) return 'maritime';
    if (t.includes('ospedale') || t.includes('polizia') || t.includes('soccorso') || t.includes('guardia') || t.includes('police')) return 'emergency';
    if (t.includes('farmacia')) return 'pharmacy';
    if (t.includes('banca') || t.includes('bank') || t.includes('atm') || t.includes('bancomat')) return 'bank';
    
    return 'other';
};
