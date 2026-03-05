
import React, { ReactNode } from 'react';

// Importazione dei singoli Provider
import { AiPlannerProvider } from './AiPlannerContext'; 
import { ItineraryProvider } from './ItineraryContext';
import { ModalProvider } from './ModalContext'; 
import { InteractionProvider } from './InteractionContext';
import { UserProvider } from './UserContext';
import { GpsProvider } from './GpsContext';
import { UIProvider } from './UIContext';
import { NavigationProvider } from './NavigationContext';
import { DiaryInteractionProvider } from './DiaryInteractionContext';

import { GlobalAlert } from '../components/common/GlobalAlert';

/**
 * AppProviders
 * Componente "Wrapper" unico che gestisce tutta la logica di stato globale.
 * 
 * ORDINE DI INIEZIONE (CRITICO):
 * 1. Base Logic (User, UI, AI) - Indipendenti o quasi
 * 2. Modal - UI Layer (Deve avvolgere GPS e Interaction che lo usano)
 * 3. Gps - Dipende da Modal (per errori)
 * 4. Interaction - Dipende da Modal (per auth/review) e User
 * 5. Navigation - Dipende da User (Manifest), Modal, Gps e AiPlanner (FIX CRASH)
 * 6. Itinerary - Dipende da User (Save/Load)
 * 7. DiaryInteraction - Dipende da Navigation e Itinerary
 */

export function AppProviders({ children }: { children?: ReactNode }) {
    return (
        <UserProvider>
            <UIProvider>
                <AiPlannerProvider>
                    <ModalProvider>
                        <GpsProvider>
                            <InteractionProvider>
                                <NavigationProvider>
                                    <ItineraryProvider>
                                        <DiaryInteractionProvider>
                                            <GlobalAlert />
                                            {children}
                                        </DiaryInteractionProvider>
                                    </ItineraryProvider>
                                </NavigationProvider>
                            </InteractionProvider>
                        </GpsProvider>
                    </ModalProvider>
                </AiPlannerProvider>
            </UIProvider>
        </UserProvider>
    );
};
