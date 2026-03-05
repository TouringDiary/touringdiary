
import { useEffect } from 'react';
import { setSessionItem } from '../services/storageService'; // IMPORT SAFE HELPER

export const useReferralTracking = () => {
    useEffect(() => {
        // Esegui solo lato client
        if (typeof window === 'undefined') return;

        const params = new URLSearchParams(window.location.search);
        const refCode = params.get('ref');
        
        if (refCode) {
            // Normalizza e salva usando il wrapper sicuro
            const cleanCode = refCode.trim().toUpperCase();
            setSessionItem('pending_referral_code', cleanCode);
            console.log(`[Referral System] Codice invito catturato: ${cleanCode}`);
            
            // Pulisci l'URL per estetica (rimuove query params senza ricaricare)
            try {
                if (window.location.protocol === 'blob:' || window.location.protocol === 'about:') return;
                
                const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.replaceState({ path: newUrl }, '', newUrl);
            } catch (e) {
                // Ignora errori di sicurezza su replaceState
            }
        }
    }, []);
};
