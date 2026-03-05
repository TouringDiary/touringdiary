
import { useState, useEffect, useMemo } from 'react';
import { useModal } from '../context/ModalContext';
import { useItinerary } from '../context/ItineraryContext'; // Importato per verificare items
import { JourneyPhase } from '../types/index';

/**
 * useJourneyPhase
 * 
 * Determina in quale fase del "Viaggio dell'Eroe" si trova l'utente.
 * 
 * 1. SCOPERTA: Home page, ricerca, esplorazione libera (Default).
 * 2. SELEZIONE: Dettaglio città aperto (SOLO se diario vuoto).
 * 3. PIANIFICA: Diario aperto, Planner, o **SE IL DIARIO HA TAPPE**.
 * 4. LIVE: Around Me, GPS (Alta Priorità).
 * 5. RICORDA: Social, Profilo, Recensioni.
 */
export const useJourneyPhase = (activeCityId: string | null): JourneyPhase => {
    const { activeModal } = useModal();
    const { itinerary } = useItinerary();
    
    // Calcolo della fase corrente basato su priorità
    const currentPhase = useMemo((): JourneyPhase => {
        
        // PRIORITÀ 1: MODALI "LIVE" (On the road) e "RICORDA" (Post)
        // Questi sovrascrivono tutto perché sono azioni specifiche.

        // Fase LIVE (VIVI)
        if (activeModal === 'aroundMe' || activeModal === 'gpsAlert' || activeModal === 'gpsError') {
            return 'LIVE';
        }
        
        // Fase RICORDA (Post-experience / Social)
        if (activeModal === 'gallery' || activeModal === 'review' || activeModal === 'reviewSuccess' || activeModal === 'share' || activeModal === 'userDashboard') {
            return 'RICORDA';
        }
        
        // PRIORITÀ 2: STATO DIARIO (PIANIFICA STICKY)
        // Se l'utente ha iniziato a riempire il diario, è ufficialmente in fase di Pianificazione.
        // Questo impedisce il "flickering" tra Selezione e Pianifica.
        const hasItems = itinerary.items && itinerary.items.length > 0;
        
        // Modali espliciti di pianificazione
        if (activeModal === 'aiPlanner' || activeModal === 'roadbook' || activeModal === 'itineraries' || activeModal === 'add' || activeModal === 'removeSelection' || activeModal === 'duplicate' || activeModal === 'conflict') {
            return 'PIANIFICA';
        }

        // Se il diario ha elementi, restiamo su PIANIFICA anche mentre navighiamo le città
        if (hasItems) {
            return 'PIANIFICA';
        }

        // PRIORITÀ 3: NAVIGAZIONE (SELEZIONE vs SCOPERTA)
        // Solo se il diario è vuoto, distinguiamo tra "Home" (Scoperta) e "Città" (Selezione)
        
        // Fase SELEZIONE (Dettaglio specifico aperto, ma diario ancora vuoto)
        if (activeCityId || activeModal === 'poiDetail' || activeModal === 'cityInfo' || activeModal === 'province' || activeModal === 'culture' || activeModal === 'patron' || activeModal === 'history' || activeModal === 'fullRankings' || activeModal === 'preview') {
            return 'SELEZIONE';
        }
        
        // Default: Home Page / Landing
        return 'SCOPERTA';
        
    }, [activeModal, activeCityId, itinerary.items]);

    return currentPhase;
};
