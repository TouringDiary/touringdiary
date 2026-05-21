import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { setSessionItem } from '../services/storageService'; // IMPORT SAFE HELPER

export const useReferralTracking = () => {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // Esegui solo lato client
        if (typeof window === 'undefined') return;

        const params = new URLSearchParams(location.search);
        const refCode = params.get('ref');
        
        if (refCode) {
            // Normalizza e salva usando il wrapper sicuro
            const cleanCode = refCode.trim().toUpperCase();
            setSessionItem('pending_referral_code', cleanCode);
            console.log(`[Referral System] Codice invito catturato: ${cleanCode}`);
            
            // Pulisci l'URL per estetica tramite il router (Single Source of Truth)
            // Sostituisce il vecchio window.history.replaceState
            navigate(location.pathname, { replace: true });
        }
    }, [location.search, location.pathname, navigate]);
};
