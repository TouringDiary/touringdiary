
// STRUTTURE DATI DI FALLBACK
// I dati reali vengono caricati dal DB tramite settingsService.
// Questo file serve solo per garantire la stabilità in caso di DB offline.

export const FALLBACK_CONTINENTS = [
    { value: 'europa', label: 'Europa', disabled: false },
];
export const FALLBACK_NATIONS = [
    { value: 'italia', label: 'Italia', disabled: false },
];
export const FALLBACK_REGIONS = [
    { value: 'campania', label: 'Campania', disabled: false },
];

// Fallback minimo (sarà sovrascritto dal DB)
export const FALLBACK_CATEGORIES = [
    { label: 'Natura', value: 'Natura' },
    { label: 'Cultura', value: 'Cultura' },
];
