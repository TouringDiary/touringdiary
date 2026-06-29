import { CitySummary } from '@/types';

/**
 * Id "placeholder" generati automaticamente (es. "City 1", "City2") che non devono
 * mai comparire nella UI del Diario. I nomi reali (es. "City Center") NON vengono filtrati.
 *
 * Unica definizione semantica di "placeholder City" condivisa nella feature Diario.
 */
export const isPlaceholderCityId = (id: string): boolean => /City\s*\d+/i.test(id);

/**
 * Nome città leggibile per la UI del Diario (label giorno, header timeline, tooltip).
 * Restituisce stringa vuota per id non validi o placeholder.
 *
 * Helper condiviso da DiaryTimeline e DiaryDay per evitare duplicazioni della stessa logica.
 */
export const getCityDisplayName = (id: string, cityManifest?: CitySummary[]): string => {
    if (!id || typeof id !== 'string' || id === 'unknown' || id === 'custom') return '';
    if (isPlaceholderCityId(id)) return '';
    if (cityManifest) {
        const found = cityManifest.find(c => String(c.id) === String(id));
        if (found) return found.name;
    }
    return id.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};
