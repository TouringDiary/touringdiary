import React from 'react';
import { UserProvider } from './UserContext';
import { BusinessProvider } from './BusinessContext';
import { UIProvider } from './UIContext';
import { ModalProvider } from './ModalContext';
import { ItineraryProvider } from './ItineraryContext';
import { NavigationProvider } from './NavigationContext';
import { GpsProvider } from './GpsContext';
import { InteractionProvider } from './InteractionContext';
import { ConfigProvider } from './ConfigContext';
import { PlatformControlProvider } from './PlatformControlContext';
import { DiaryInteractionProvider } from './DiaryInteractionContext';
import { AiPlannerProvider } from './AiPlannerContext';

import GlobalErrorBoundary from '../components/common/GlobalErrorBoundary';
import { AppCoordinator } from '../components/layout/AppCoordinator';

interface AppProvidersProps {
    children?: React.ReactNode;
}

/**
 * AppProviders
 * Componente "Wrapper" unico che gestisce tutta la logica di stato globale.
 * 
 * ORDINE DI INIEZIONE (CRITICO):
 * UserProvider deve essere il wrapper più esterno.
 * PlatformControlProvider subito sotto UserProvider (useFeatureFlag in BusinessProvider/useAppRouter).
 * GlobalErrorBoundary sotto ConfigProvider (DeleteConfirmationModal richiede useConfig).
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
    return (
        <UserProvider>
            <PlatformControlProvider>
                <BusinessProvider>
                    <ConfigProvider>
                        <GlobalErrorBoundary variant="application">
                            <UIProvider>
                                <AiPlannerProvider>
                                    <ModalProvider>
                                        <GpsProvider>
                                            <NavigationProvider>
                                                <InteractionProvider>
                                                    <ItineraryProvider>
                                                        <DiaryInteractionProvider>
                                                            <AppCoordinator />
                                                            {children}
                                                        </DiaryInteractionProvider>
                                                    </ItineraryProvider>
                                                </InteractionProvider>
                                            </NavigationProvider>
                                        </GpsProvider>
                                    </ModalProvider>
                                </AiPlannerProvider>
                            </UIProvider>
                        </GlobalErrorBoundary>
                    </ConfigProvider>
                </BusinessProvider>
            </PlatformControlProvider>
        </UserProvider>
    );
};
