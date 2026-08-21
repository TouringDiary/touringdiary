import type React from 'react';
import GlobalErrorBoundary from '../components/common/GlobalErrorBoundary';
import { AppCoordinator } from '../components/layout/AppCoordinator';
import { AiPlannerProvider } from './AiPlannerContext';
import { ConfigProvider } from './ConfigContext';
import { DiaryInteractionProvider } from './DiaryInteractionContext';
import { DiaryUndoBridgeProvider } from './DiaryUndoBridgeContext';
import { GpsProvider } from './GpsContext';
import { InteractionProvider } from './InteractionContext';
import { ItineraryProvider } from './ItineraryContext';
import { ModalProvider } from './ModalContext';
import { NavigationProvider } from './NavigationContext';
import { PlatformControlProvider } from './PlatformControlContext';
import { UIProvider } from './UIContext';
import { UserProvider } from './UserContext';

interface AppProvidersProps {
  children?: React.ReactNode;
}

/**
 * AppProviders
 * Componente "Wrapper" unico che gestisce tutta la logica di stato globale.
 *
 * ORDINE DI INIEZIONE (CRITICO):
 * UserProvider deve essere il wrapper più esterno.
 * PlatformControlProvider subito sotto UserProvider (useFeatureFlag / useAppRouter).
 * GlobalErrorBoundary sotto ConfigProvider (DeleteConfirmationModal richiede useConfig).
 *
 * BusinessProvider: NON globale — montato solo con UserDashboard
 * (`src/components/user/UserDashboard.tsx`). Consumer: UserDashboard / UserSidebar / useUserDashboardData.
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <UserProvider>
      <PlatformControlProvider>
        <ConfigProvider>
          <GlobalErrorBoundary variant="application">
            <UIProvider>
              <AiPlannerProvider>
                <ModalProvider>
                  <GpsProvider>
                    <NavigationProvider>
                      <InteractionProvider>
                        <ItineraryProvider>
                          <DiaryUndoBridgeProvider>
                            <DiaryInteractionProvider>
                              <AppCoordinator />
                              {children}
                            </DiaryInteractionProvider>
                          </DiaryUndoBridgeProvider>
                        </ItineraryProvider>
                      </InteractionProvider>
                    </NavigationProvider>
                  </GpsProvider>
                </ModalProvider>
              </AiPlannerProvider>
            </UIProvider>
          </GlobalErrorBoundary>
        </ConfigProvider>
      </PlatformControlProvider>
    </UserProvider>
  );
};
