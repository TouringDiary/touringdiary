
import React, { useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { AppShell } from './AppShell';
import { NewsTicker } from './NewsTicker';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNavBar } from './MobileNavBar';
import { AppRouter } from './AppRouter';
import { ModalManager } from './ModalManager';
import { OnboardingWizard } from './OnboardingWizard';
import { useControlledSlidePanel } from '@/hooks/ui/useControlledSlidePanel';
import { useMobileDiaryOverlayGeometry } from '@/hooks/ui/useMobileDiaryOverlayGeometry';
import { SLIDE_PANEL_TRANSITION_CLASS, slidePanelEaseClass, slidePanelTransformClass } from '@/constants/slidePanelMotion';

// CONTEXT CONSUMER
import { useUser } from '@/context/UserContext';
import { useUI } from '@/context/UIContext';
import { useModal } from '@/context/ModalContext';
import { useNavigation } from '@/context/useNavigation';
import { useDiaryInteractionsContext } from '@/context/useDiaryInteractionsContext';
import { useFeatureFlag } from '@/context/PlatformControlContext';
import { PLATFORM_FEATURE_FLAG_KEYS } from '@/constants/platformFeatureFlags';
import { useOpenMyWorld } from '@/hooks/useOpenMyWorld';
import { isMyWorldFamilyModal } from '@/myworld/myWorldSession';

export interface MainLayoutProps {
    helpFlash?: boolean;
    onCompleteOnboarding: () => void;
}

const MOBILE_SECTION_WORKSPACE = 'workspace';
const MOBILE_SECTION_COMMUNITY = 'community';
const MOBILE_SECTION_AROUND_ME = 'around_me';
const MOBILE_SECTION_RANKINGS = 'rankings';
const MOBILE_SECTION_SPONSORS = 'sponsors';

/** Highlight section for mobile bottom nav — same precedence as pre-extract inline chain. */
function resolveMobileActiveSection(input: {
    activeModal: string | null;
    modalSection?: string;
    hasVirtualCity: boolean;
}): string | null {
    const { activeModal, modalSection, hasVirtualCity } = input;
    if (isMyWorldFamilyModal(activeModal)) return MOBILE_SECTION_WORKSPACE;
    if (activeModal === 'global' && modalSection === MOBILE_SECTION_COMMUNITY) return MOBILE_SECTION_COMMUNITY;
    if (hasVirtualCity || activeModal === 'aroundMe') return MOBILE_SECTION_AROUND_ME;
    if (activeModal === 'fullRankings') return MOBILE_SECTION_RANKINGS;
    if (activeModal === 'global' && modalSection === MOBILE_SECTION_SPONSORS) return MOBILE_SECTION_SPONSORS;
    return null;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ helpFlash, onCompleteOnboarding }) => {
    
    const { connectionError, showOnboarding } = useUser(); 
    const onboardingFlag = useFeatureFlag(PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_ONBOARDING);
    const onboardingEnabled = onboardingFlag?.enabled ?? true;
    const { isMobile, isSidebarOpen, setIsSidebarOpen, isUiVisible, setIsUiVisible, mobileShowWeather, mobileDiaryFullScreen, setMobileDiaryFullScreen } = useUI();
    const { activeModal, openModal, closeModal, modalProps } = useModal();
    const { goBack, goHome, setViewMode, activeCityId, activeShopId, virtualCity, navigateToCity, handleNavigateGlobal } = useNavigation();
    const openMyWorld = useOpenMyWorld();
    
    const { handleSmartDrop } = useDiaryInteractionsContext();

    // Shop overlay: auto-close sidebar while Shop is open; reopen on desktop when leaving.
    // Lives here (not in useAppUI): activeShopId belongs to Navigation, below UIProvider.
    useEffect(() => {
        if (activeShopId) {
            setIsSidebarOpen(false);
        } else if (!isMobile) {
            setIsSidebarOpen(true);
        }
    }, [activeShopId, isMobile, setIsSidebarOpen]);

    const diaryShell = useControlledSlidePanel(mobileDiaryFullScreen);
    const usesVisualViewportGeometry = useMobileDiaryOverlayGeometry(
        diaryShell.panelRef,
        isMobile && diaryShell.shouldRender,
    );

    const mobileActiveSection = resolveMobileActiveSection({
        activeModal,
        modalSection: modalProps?.section,
        hasVirtualCity: !!virtualCity,
    });

    const isMyWorldFamilyOpen = isMyWorldFamilyModal(activeModal);

    useEffect(() => {
        if (isMyWorldFamilyOpen && !isUiVisible) {
            setIsUiVisible(true);
        }
    }, [isMyWorldFamilyOpen, isUiVisible, setIsUiVisible]);

    const toggleMyWorldPanel = () => {
        if (isMyWorldFamilyOpen) {
            closeModal();
            return;
        }
        openMyWorld();
    };

    return (
        <>
            {showOnboarding && onboardingEnabled && (
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
                    // Mobile: AppShell aside is CSS-hidden (`hidden lg:flex`). Mounting Sidebar
                    // there duplicates TravelDiary/sponsor work when diary/weather overlays own
                    // their own Sidebar. Skip AppShell Sidebar only while those overlays render
                    // (safe dedup). Keep it when Valigia/companion may need the hidden mount.
                    isMobile && (diaryShell.shouldRender || mobileShowWeather) ? (
                        <div id="tour-sidebar" className="h-full" aria-hidden />
                    ) : (
                        <div id="tour-sidebar" className="h-full">
                            <Sidebar 
                                onViewPoiDetail={(poi) => openModal('poiDetail', { poi })} 
                                onDayDrop={handleSmartDrop}
                                onOpenFullRankings={() => openModal('fullRankings')} 
                                onOpenSponsor={() => openModal('sponsor', { sponsorTier: 'gold' })} 
                                onOpenGlobal={(section) => handleNavigateGlobal(section)} 
                                onPrint={() => window.print()} 
                                onCityClick={(id) => { closeModal(); navigateToCity(id); }} 
                                activeCityId={activeCityId}
                                onAddToItinerary={(poi) => openModal('add', { poi })}
                                onOpenAiPlanner={() => openModal('aiPlanner')}
                                onOpenRoadbook={() => openModal('roadbook')}
                                isWorkspacePanelOpen={isMyWorldFamilyOpen}
                                onToggleWorkspacePanel={toggleMyWorldPanel}
                            />
                        </div>
                    )
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
                {/*
                  * isolate: confina il contenuto di pagina (Home/Città) in un proprio
                  * stacking context. Così qualunque z-index interno (anche tier alti
                  * legacy) resta capato sotto la fascia focus (Diario 9100 / Valigia 9300),
                  * che sono portalati/fratelli nel body. Nessun elemento di pagina può
                  * più emergere sopra i workspace. ModalManager è fratello di AppShell
                  * (fuori da FocusIdleBoundary) e mantiene la fascia consumer 11000+.
                  */}
                <div 
                    className={`
                        isolate w-full h-full flex flex-col overflow-hidden relative
                        transition-[padding] duration-300 ease-in-out
                        px-4 pb-16 lg:pb-0 ${isSidebarOpen ? 'md:px-0' : 'md:px-8 lg:px-16'}
                    `}
                >
                    <AppRouter />
                </div>
            </AppShell>

            {/*
              * ModalManager fuori da AppShell / FocusIdleBoundary: i workspace congelano
              * baseContent, ma i modal classici devono montare/smontare subito al cambio
              * di activeModal (idle path interno + remount Classic).
              */}
            <ModalManager />
            
            {diaryShell.shouldRender && (
                <div
                    id="tour-mobile-diary-overlay"
                    ref={diaryShell.panelRef}
                    className={`
                        fixed top-[var(--header-height)] left-0 right-0 bottom-0 z-focus-companion bg-slate-950 flex flex-col overflow-hidden
                        ${usesVisualViewportGeometry ? '' : 'h-[calc(100dvh-var(--header-height))] max-h-[calc(100dvh-var(--header-height))]'}
                        ${SLIDE_PANEL_TRANSITION_CLASS}
                        ${slidePanelTransformClass(diaryShell.isPanelRaised)}
                        ${slidePanelEaseClass(diaryShell.isClosing)}
                    `}
                >
                    <Sidebar 
                        onViewPoiDetail={(poi) => openModal('poiDetail', { poi })} 
                        onDayDrop={handleSmartDrop}
                        onOpenFullRankings={() => openModal('fullRankings')} 
                        onOpenSponsor={() => openModal('sponsor', { sponsorTier: 'gold' })} 
                        onOpenGlobal={(section) => openModal('global', { section })} 
                        onPrint={() => window.print()} 
                        onCityClick={(id) => { closeModal(); navigateToCity(id); }} 
                        activeCityId={activeCityId}
                        onAddToItinerary={(poi) => openModal('add', { poi })}
                        onOpenAiPlanner={() => openModal('aiPlanner')}
                        onOpenRoadbook={() => openModal('roadbook')}
                        keepDiaryMountedDuringTransition={diaryShell.shouldRender}
                    />
                </div>
            )}

            {mobileShowWeather && (
                <div 
                    id="weather-overlay"
                    className="fixed top-[var(--header-height)] left-0 right-0 bottom-0 z-focus-companion bg-slate-950"
                >
                    <Sidebar 
                        onViewPoiDetail={(poi) => openModal('poiDetail', { poi })} 
                        onDayDrop={handleSmartDrop}
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
