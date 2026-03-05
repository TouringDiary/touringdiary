
/**
 * GEO CONFIGURATION (Single Source of Truth)
 * Centralizza le coordinate e i nomi di default per l'intera applicazione.
 * Modificare questo file per cambiare la regione target del progetto (es. Toscana, Sicilia).
 */

export const GEO_CONFIG = {
    // Coordinate Centrali (Default: Napoli)
    DEFAULT_CENTER: {
        lat: 40.8518,
        lng: 14.2681
    },

    // Gerarchia Geografica Default
    DEFAULT_CONTINENT: 'Europa',
    DEFAULT_NATION: 'Italia',
    DEFAULT_REGION: 'Campania',
    DEFAULT_ZONE: 'Napoli & Area Vesuviana',
    DEFAULT_CITY_NAME: 'Napoli',

    // Configurazione Mappa / Ricerca
    SEARCH_RADIUS_DEFAULT: 25, // km
    SEARCH_RADIUS_MAX: 100, // km
};
