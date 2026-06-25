
import React from 'react';
import { WifiOff } from 'lucide-react';
import { AppShell } from './AppShell';
import { NewsTicker } from './NewsTicker';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNavBar } from './MobileNavBar';
import { AppRouter } from './AppRouter';
import { ModalManager } from './ModalManager';
import { OnboardingWizard } from './OnboardingWizard';

// CONTEXT CONSUMER
import { useUser } from '@/context/UserContext';
import { useUI } from '@/context/UIContext';
import { useModal } from '@/context/ModalContext';
import { useNavigation } from '@/context/useNavigation';
import { useDiaryInteractionsContext } from '@/context/useDiaryInteractionsContext'; // NEW IMPORT

export interface MainLayoutProps {
    helpFlash?: boolean;
    onCompleteOnboarding: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ helpFlash, onCompleteOnboarding }) => {
    
    const { connectionError, showOnboarding } = useUser(); 
    const { isMobile, isSidebarOpen, isUiVisible, setIsUiVisible, mobileShowWeather, mobileDiaryFullScreen, setMobileDiaryFullScreen } = useUI();
    const { activeModal, openModal, closeModal, modalProps } = useModal(); // FIX: Destructured modalProps correctly
    const { activeStaticPage, goBack, goHome, setViewMode, activeCityId, virtualCity, navigateToCity, handleNavigateGlobal } = useNavigation();
    
    // RECUPERO LOGICA DIARIO
    const { handleSmartDrop } = useDiaryInteractionsContext();

    // Mobile Nav Active State Calculation
    let mobileActiveSection = null;
    if (activeModal === 'itineraries') mobileActiveSection = 'itineraries';
    else if (activeModal === 'global' && modalProps?.section === 'community') mobileActiveSection = 'community';
    else if (virtualCity || activeModal === 'aroundMe') mobileActiveSection = 'around_me'; 
    else if (activeModal === 'fullRankings') mobileActiveSection = 'rankings';
    else if (activeModal === 'global' && modalProps?.section === 'sponsors') mobileActiveSection = 'sponsors';

    return (
        <>
            {showOnboarding && (
                <OnboardingWizard 
                    onComplete={onCompleteOnboarding} 
                    onSkip={onCompleteOnboarding} 
                    isMobile={isMobile} 
                />
            )}

            <AppShell
                isSidebarOpen={isSidebarOpen}
                isUiVisible={isUiVisible}
                newsTicker={<NewsTicker isVisible={isUiVisible} />}
                
                header={
                    <>
                        {connectionError && (
                            <div className="bg-red-600 text-white text-xs font-bold text-center py-2 flex items-center justify-center gap-2 animate-pulse sticky top-0 z-dropdown">
                                <WifiOff className="w-4 h-4"/> ATTENZIONE: Connessione al database instabile.
                            </div>
                        )}
                        <Header 
                            onBack={goBack}
                            onGoHome={goHome} 
                            showBack={!!activeCityId || !!virtualCity || activeModal === 'static'} 
                            onAdmin={() => setViewMode('admin')} 
                            onOpenStaticPage={(p) => { openModal('static', { page: p }); }} 
                            activeCityId={activeCityId}
                            flashHelp={helpFlash}
                        />
                    </>
                }

                sidebar={
                    <div id="tour-sidebar" className="h-full">
                        <Sidebar 
                            onViewPoiDetail={(poi) => openModal('poiDetail', { poi })} 
                            onDayDrop={handleSmartDrop} // FIXED: Passed the real handler
                            onOpenFullRankings={() => openModal('fullRankings')} 
                            onOpenSponsor={() => openModal('sponsor', { sponsorTier: 'gold' })} 
                            onOpenGlobal={(section) => openModal('global', { section })} 
                            onPrint={() => window.print()} 
                            onCityClick={(id) => { closeModal(); navigateToCity(id); }} 
                            activeCityId={activeCityId}
                            onAddToItinerary={(poi) => openModal('add', { poi })}
                            onOpenAiPlanner={() => openModal('aiPlanner')}
                            onOpenRoadbook={() => openModal('roadbook')}
                        />
                    </div>
                }

                mobileNav={
                    !mobileDiaryFullScreen ? (
                        <MobileNavBar 
                            activeSection={mobileActiveSection}
                            onOpenDiary={() => setMobileDiaryFullScreen(true)}
                            onOpenGlobal={(section) => handleNavigateGlobal(section)}
                            onOpenRankings={() => openModal('fullRankings')}
                            isVisible={isUiVisible}
                            onExpandUi={() => setIsUiVisible(true)}
                        />
                    ) : undefined
                }
            >
                <div 
                    className={`
                        w-full h-full flex flex-col overflow-hidden relative
                        transition-[padding] duration-300 ease-in-out
                        px-4 ${isSidebarOpen ? 'md:px-0' : 'md:px-8 lg:px-16'}
                    `}
                >
                    <AppRouter />
                </div>

                <ModalManager />
            </AppShell>
            
            {(mobileDiaryFullScreen || mobileShowWeather) && (
                <div 
                    id={mobileDiaryFullScreen ? "tour-mobile-diary-overlay" : "weather-overlay"}
                    className={
                        mobileDiaryFullScreen
                            ? "fixed top-[var(--header-height)] left-0 right-0 z-modal bg-slate-950 flex flex-col overflow-hidden h-[calc(100dvh-var(--header-height))] max-h-[calc(100dvh-var(--header-height))] animate-in slide-in-from-bottom-5"
                            : "fixed top-[var(--header-height)] left-0 right-0 bottom-0 z-modal bg-slate-950"
                    }
                >
                    <Sidebar 
                        onViewPoiDetail={(poi) => openModal('poiDetail', { poi })} 
                        onDayDrop={handleSmartDrop} // FIXED: Passed here too for mobile overlay
                        onOpenFullRankings={() => openModal('fullRankings')} 
                        onOpenSponsor={() => openModal('sponsor', { sponsorTier: 'gold' })} 
                        onOpenGlobal={(section) => openModal('global', { section })} 
                        onPrint={() => window.print()} 
                        onCityClick={(id) => { closeModal(); navigateToCity(id); }} 
                        activeCityId={activeCityId}
                        onAddToItinerary={(poi) => openModal('add', { poi })}
                        onOpenAiPlanner={() => openModal('aiPlanner')}
                        onOpenRoadbook={() => openModal('roadbook')}
                    />
                </div>
            )}
        </>
    );
};
