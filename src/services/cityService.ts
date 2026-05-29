
// CITY SERVICE BARREL FILE
// Questo file aggrega tutte le funzionalità dai nuovi sotto-servizi.
// Mantiene la compatibilità con i componenti esistenti.

export * from './city/cityCache';
export * from './city/poiService';
export * from './city/entitiesService';
export * from './city/cityReadService';
export * from './city/cityWriteService';
export * from './city/tourOperatorService';

// NUOVI EXPORT DOPO REFACTORING FASE 1
export * from './city/cityLifecycleService';
export {
    saveManifestItem,
    updateCityBadge,
    updateCityHomeOrder,
    evaluateAndUpdateCityStatus,
} from './city/cityUpdateService';
