import { Z_ERROR_BOUNDARY, Z_TOAST, Z_OVERLAY_BACKDROP, Z_MODAL_NESTED, Z_MODAL, Z_DROPDOWN, Z_FLOATING_PANEL } from '@/constants/zIndex';


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
        MAP_CONTROLS: Z_FLOATING_PANEL,
        HEADER: Z_DROPDOWN,
        NAVBAR_MOBILE: Z_DROPDOWN,
        SIDEBAR: Z_DROPDOWN,
        
        // Overlay a tutto schermo
        OVERLAY_BACKDROP: Z_OVERLAY_BACKDROP,
        
        // Modali e Finestre di dialogo
        MODAL: Z_MODAL,
        MODAL_OVERLAY: Z_MODAL_NESTED,
        
        // Elementi critici
        TOAST: Z_TOAST,
        LOADER: Z_TOAST,
        ERROR_BOUNDARY: Z_ERROR_BOUNDARY
    }
} as const;


