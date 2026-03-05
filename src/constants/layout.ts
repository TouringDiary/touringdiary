
/**
 * LAYOUT CONSTANTS (Single Source of Truth)
 * 
 * Questo file centralizza tutte le misure critiche dell'applicazione.
 * Usare queste costanti nel codice TS/JS invece di valori hardcoded.
 */

export const LAYOUT = {
    // --- DIMENSIONI ORIZZONTALI ---
    // Larghezza fissa della sidebar destra su Desktop (Standard LG)
    SIDEBAR_WIDTH: '30rem', // ~480px (Corrisponde a w-sidebar in tailwind config)
    
    // Larghezza espansa per monitor grandi (XL+)
    // MODIFICATO: 35rem (~560px) in base alla richiesta proporzionale
    SIDEBAR_WIDTH_WIDE: '35rem', // ~560px (Corrisponde a w-sidebar-wide in tailwind config)
    
    // --- DIMENSIONI VERTICALI ---
    // Altezza Header fisso in alto
    HEADER_HEIGHT: '4rem', // 64px (h-16)
    HEADER_HEIGHT_MOBILE: '3.5rem', // 56px (h-14)
    
    // Altezza Navbar Mobile in basso
    MOBILE_NAV_HEIGHT: '4rem', // 64px (h-16)

    // --- BREAKPOINTS (Matching Tailwind) ---
    BREAKPOINTS: {
        MD: 768,
        LG: 1024,
        XL: 1280,
        '2XL': 1536
    },

    // --- Z-INDEX LAYERS (Gerarchia di sovrapposizione) ---
    Z: {
        BASE: 0,
        MAP_CONTROLS: 10,
        HEADER: 1000,
        NAVBAR_MOBILE: 1100,
        
        // Sidebar e Pannelli laterali
        SIDEBAR: 100, 
        
        // Overlay a tutto schermo (livello intermedio)
        OVERLAY_BACKDROP: 2000,
        
        // Modali e Finestre di dialogo
        MODAL: 3000,
        MODAL_OVERLAY: 3500, // Popover dentro i modali (es. DatePicker)
        
        // Elementi critici (Toast, Errori, Loading)
        TOAST: 5000,
        LOADER: 9000,
        ERROR_BOUNDARY: 99999
    }
} as const;