import React, { useEffect, useMemo, useState } from 'react';
import { useInteraction } from '../../../context/InteractionContext';
import { ModalManagerExternalProps } from '../ModalManagerTypes';
import { PointOfInterest, Review } from '@/types';
import { isCityInfoPreviewTab } from '@/types/cityPreview';
import { getDaysArray } from '@/utils/common';
import { getUserReviewForPoi } from '@/services/communityService';

// Lazy Imports
const PoiDetailModal = React.lazy(() => import('@/components/modals/PoiDetailModal').then(module => ({ default: module.PoiDetailModal })));
const ReviewModal = React.lazy(() => import('@/components/modals/ReviewModal').then(module => ({ default: module.ReviewModal })));
const AddToItineraryModal = React.lazy(() => import('@/components/modals/AddToItineraryModal').then(module => ({ default: module.AddToItineraryModal })));
const TimeConflictModal = React.lazy(() => import('@/components/modals/TimeConflictModal').then(module => ({ default: module.TimeConflictModal })));
const DuplicateResolutionModal = React.lazy(() => import('@/components/modals/DuplicateResolutionModal').then(module => ({ default: module.DuplicateResolutionModal })));
const CityInfoModal = React.lazy(() => import('@/components/modals/CityInfoModal').then(module => ({ default: module.CityInfoModal })));
const ProvinceModal = React.lazy(() => import('@/components/modals/ProvinceModal').then(module => ({ default: module.ProvinceModal })));
const LevelUpModal = React.lazy(() => import('@/components/modals/LevelUpModal').then(module => ({ default: module.LevelUpModal })));
const AiItineraryModal = React.lazy(() => import('@/components/modals/AiItineraryModal').then(module => ({ default: module.AiItineraryModal })));
const RoadbookModal = React.lazy(() => import('@/components/modals/RoadbookModal').then(module => ({ default: module.RoadbookModal })));
const SectionPreviewModal = React.lazy(() => import('@/components/modals/SectionPreviewModal').then(module => ({ default: module.SectionPreviewModal })));
const SuggestionModal = React.lazy(() => import('@/components/modals/SuggestionModal').then(module => ({ default: module.SuggestionModal })));
const UserUpgradeModal = React.lazy(() => import('@/components/modals/UserUpgradeModal').then(module => ({ default: module.default })));
const FullRankingsModal = React.lazy(() => import('@/components/modals/FullRankingsModal').then(module => ({ default: module.FullRankingsModal })));
const GlobalSectionView = React.lazy(() => import('@/components/modals/GlobalSectionView').then(module => ({ default: module.GlobalSectionView })));
const AroundMeWizard = React.lazy(() => import('@/components/modals/AroundMeWizard').then(module => ({ default: module.AroundMeWizard })));
const PoiClaimModal = React.lazy(() => import('@/components/modals/PoiClaimModal').then(module => ({ default: module.PoiClaimModal })));
const ExportModal = React.lazy(() => import('@/components/modals/ExportModal').then(module => ({ default: module.ExportModal })));
const EmptyDiaryModal = React.lazy(() => import('@/components/modals/EmptyDiaryModal').then(module => ({ default: module.EmptyDiaryModal })));
const ShareModal = React.lazy(() => import('@/components/modals/ShareModal').then(module => ({ default: module.ShareModal })));
const CollaborationShareModal = React.lazy(() =>
    import('@/components/collaboration/CollaborationShareModal').then((module) => ({
        default: module.CollaborationShareModal,
    }))
);
const BuyCreditsModal = React.lazy(() => import('@/components/modals/BuyCreditsModal').then(module => ({ default: module.BuyCreditsModal })));
const QuotaExceededModal = React.lazy(() => import('@/components/modals/QuotaExceededModal').then(module => ({ default: module.QuotaExceededModal })));

interface FeatureModalsProps extends ModalManagerExternalProps {
    activeModal: string | null;
    /**
     * Payload eterogeneo per-modale.
     * Sorgente: ModalContext (dynamic-typed). Campi diversi alimentano prop con union obbligatorie
     * (es. GlobalSectionView.section, CollaborationShareModal.entryMode, conflict/duplicate nesting).
     * Tipizzare come Record<string, unknown> / unknown richiederebbe narrowing locale su decine di
     * accessi senza un ModalPayloadMap condiviso → più complesso e fragile dell’attuale.
     * Typing stretto rinviato finché non esiste un payload map per-modale.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- vedi commento sopra
    modalProps: any;
    closeModal: () => void;
    openModal: (type: string, props?: Record<string, unknown>) => void;
    onAroundMeTrigger: (config: { type: 'gps' | 'manual', cityId?: string, radius: number }) => void;
}

export const FeatureModals = (props: FeatureModalsProps) => {
    const { activeModal, modalProps, closeModal, openModal, user, itinerary, onToggleItinerary } = props;
    const { submitReview } = useInteraction();
    const [existingPoiReview, setExistingPoiReview] = useState<Review | null>(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            if (activeModal !== 'review' || !modalProps.poi?.id || !user?.id || user.role === 'guest') {
                setExistingPoiReview(null);
                return;
            }
            try {
                const existing = await getUserReviewForPoi(modalProps.poi.id, user.id);
                if (!cancelled) setExistingPoiReview(existing);
            } catch {
                if (!cancelled) setExistingPoiReview(null);
            }
        };
        void load();
        return () => {
            cancelled = true;
        };
    }, [activeModal, modalProps.poi?.id, user?.id, user?.role]);

    const diaryDays = useMemo(() => {
        if (itinerary.startDate === null || itinerary.endDate === null) return [];
        return getDaysArray(itinerary.startDate, itinerary.endDate);
    }, [itinerary.startDate, itinerary.endDate]);

    const suggestionCityId =
        typeof modalProps.cityId === 'string' && modalProps.cityId
            ? modalProps.cityId
            : props.activeCityId;
    const suggestionCityName =
        typeof modalProps.cityName === 'string' && modalProps.cityName
            ? modalProps.cityName
            : props.activeCitySummary?.name;

    const handleOpenReview = (poi: PointOfInterest) => {
        if (!user || user.role === 'guest') {
            openModal('auth', { 
                returnTo: 'poiDetail', 
                returnProps: { poi, initialView: 'reviews' } 
            }); 
            return; 
        }
        openModal('review', { poi });
    };

    const handleOpenPoiDetailFromRanking = (poi: PointOfInterest) => {
        closeModal();
        openModal('poiDetail', { poi });
    };

    const shouldRender =
        activeModal !== null ||
        props.activePreview?.isOpen === true;

    if (!shouldRender) return null;

    return (
        <>
            {/* --- ITINERARY & PLANNER --- */}
            {/* --- USER DASHBOARD & GAMIFICATION --- */}
            {activeModal === 'levelUp' && (
                <LevelUpModal isOpen={true} onClose={() => { closeModal(); props.onCloseLevelUp(); }} xp={user.xp || 0} onOpenRewards={() => { closeModal(); props.onNavigateGlobal('rewards'); }} />
            )}
            {activeModal === 'upgrade' && (
                <UserUpgradeModal isOpen={true} onClose={closeModal} />
            )}

            {/* --- ITINERARY & PLANNER --- */}
            {activeModal === 'aiPlanner' && (
                <AiItineraryModal isOpen={true} onClose={closeModal} defaultCity={props.activeCitySummary?.name || ''} user={user} />
            )}
            {activeModal === 'roadbook' && (
                <RoadbookModal isOpen={true} onClose={closeModal} />
            )}
            {activeModal === 'exportOptions' && (
                <ExportModal isOpen={true} onClose={closeModal} />
            )}
            {activeModal === 'emptyDiary' && (
                <EmptyDiaryModal isOpen={true} onClose={closeModal} onOpenAuth={() => openModal('auth')} user={user} />
            )}
            {activeModal === 'add' && modalProps.poi && (
                <AddToItineraryModal isOpen={true} onClose={closeModal} onConfirm={(day, time) => { props.onConfirmAdd(modalProps.poi, day, time); }} onRemove={(id) => { props.onRemoveItem(id); }} poi={modalProps.poi} startDate={itinerary.startDate} endDate={itinerary.endDate} existingItems={itinerary.items} onDateSet={props.onSetItineraryDates} />
            )}
            {activeModal === 'conflict' && modalProps.conflict && (
                <TimeConflictModal isOpen={true} onClose={closeModal} item={modalProps.conflict.item} targetDayIndex={modalProps.conflict.targetDayIndex} conflictingItem={modalProps.conflict.conflictingItem} allItems={itinerary.items} onConfirm={(newTime) => props.onResolveConflict(modalProps.conflict.item, modalProps.conflict.targetDayIndex, modalProps.conflict.conflictingItem, 'changeTime', newTime)} onSwap={(itemTime, conflictTime) => props.onResolveConflict(modalProps.conflict.item, modalProps.conflict.targetDayIndex, modalProps.conflict.conflictingItem, 'swap', undefined, { itemTime, conflictTime })} />
            )}
            {activeModal === 'duplicate' && modalProps.duplicate && (
                <DuplicateResolutionModal isOpen={true} onClose={closeModal} newItemPoi={modalProps.duplicate.poi} existingItem={modalProps.duplicate.existingItem} targetDayIndex={modalProps.duplicate.dayIndex} targetTime={modalProps.duplicate.timeSlotStr} days={diaryDays} onAddDuplicate={(dayIndex: number) => props.onResolveDuplicate(modalProps.duplicate.poi, dayIndex, modalProps.duplicate.timeSlotStr, modalProps.duplicate.existingItem, 'add')} onReplace={(dayIndex: number) => props.onResolveDuplicate(modalProps.duplicate.poi, dayIndex, modalProps.duplicate.timeSlotStr, modalProps.duplicate.existingItem, 'replace')} />
            )}

            {/* --- POI & REVIEWS (UNIFIED MODAL) --- */}
            {activeModal === 'review' && modalProps.poi && (
                <ReviewModal
                    isOpen={true}
                    onClose={closeModal}
                    poi={modalProps.poi}
                    existingReview={existingPoiReview}
                    onSubmit={(rating, criteria, comment) =>
                        submitReview(modalProps.poi, rating, criteria, comment, user)
                    }
                    onSubmitSuccess={() => openModal('reviewSuccess')}
                />
            )}
            
            {activeModal === 'poiDetail' && modalProps.poi && (
                <PoiDetailModal 
                    poi={modalProps.poi} 
                    onClose={() => {
                        if (typeof modalProps.returnTo === 'string' && modalProps.returnTo) {
                            openModal(modalProps.returnTo, modalProps.returnProps);
                            return;
                        }
                        closeModal();
                    }} 
                    onToggleItinerary={() => onToggleItinerary(modalProps.poi)} 
                    isInItinerary={itinerary.items.some((i) => i.poi.id === modalProps.poi.id)} 
                    onOpenReview={() => handleOpenReview(modalProps.poi)} 
                    userLocation={props.userLocation} 
                    onSuggestEdit={(name) => { closeModal(); openModal('claim', { poi: modalProps.poi }); }} 
                    onOpenShop={props.onOpenShop} 
                    user={user} 
                    onOpenAuth={() => openModal('auth', { returnTo: 'poiDetail', returnProps: { poi: modalProps.poi, returnTo: modalProps.returnTo, returnProps: modalProps.returnProps } })} 
                    initialView={modalProps.initialView} 
                />
            )}
            
            {activeModal === 'claim' && modalProps.poi && (
                <PoiClaimModal isOpen={true} onClose={closeModal} poi={modalProps.poi} user={user} />
            )}
            
            {/* --- SOCIAL & DISCOVERY --- */}
            {activeModal === 'share' && (
                <ShareModal isOpen={true} onClose={closeModal} title={modalProps.title} text={modalProps.text} url={modalProps.url} />
            )}
            {activeModal === 'collaborationShare' &&
                (modalProps.entryMode === 'create_workspace' ||
                    modalProps.entryMode === 'workspace_from_viaggio' ||
                    modalProps.entryMode === 'add_element_to_workspace' ||
                    (modalProps.kind && modalProps.resourceId)) && (
                <CollaborationShareModal
                    isOpen={true}
                    onClose={closeModal}
                    user={user}
                    entryMode={modalProps.entryMode}
                    kind={modalProps.kind}
                    resourceId={modalProps.resourceId}
                    resourceTitle={modalProps.resourceTitle ?? ''}
                    preselectedDiaryId={modalProps.preselectedDiaryId}
                    preselectedDiaryTitle={modalProps.preselectedDiaryTitle}
                    workspaceId={modalProps.workspaceId}
                    viaggioId={modalProps.viaggioId}
                    viaggioTitle={modalProps.viaggioTitle}
                />
            )}
            {activeModal === 'global' && (
                <GlobalSectionView isOpen={true} section={modalProps.section} initialTab={modalProps.tab} initialSelectedPostId={modalProps.id} onClose={closeModal} user={user} onUserUpdate={props.onUserUpdate} onOpenAuth={() => openModal('auth', { returnTo: 'global', returnProps: modalProps })} />
            )}
            {activeModal === 'suggestion' && suggestionCityId && suggestionCityName && (
                <SuggestionModal
                    isOpen={true}
                    onClose={() => {
                        if (typeof modalProps.returnTo === 'string' && modalProps.returnTo) {
                            openModal(modalProps.returnTo, modalProps.returnProps);
                        } else {
                            closeModal();
                        }
                    }}
                    cityId={suggestionCityId}
                    cityName={suggestionCityName}
                    user={user}
                    onOpenAuth={() => openModal('auth', { returnTo: 'suggestion', returnProps: modalProps })}
                    initialType={modalProps.type}
                    prefilledName={modalProps.prefilledName}
                    existingPois={modalProps.existingPois ?? props.visibleAllPois}
                    isServiceContext={Boolean(modalProps.isServiceContext)}
                />
            )}
            {activeModal === 'aroundMe' && (
                <AroundMeWizard isOpen={true} onClose={closeModal} cityManifest={props.cityManifest} onConfirm={(config) => { props.onAroundMeTrigger(config); closeModal(); }} />
            )}
            {activeModal === 'fullRankings' && (
                <FullRankingsModal 
                    isOpen={true}
                    onClose={closeModal}
                    onNavigateToCity={(cityId) => { closeModal(); props.onNavigateToCity(cityId); }}
                    onOpenPoi={handleOpenPoiDetailFromRanking}
                />
            )}
            {props.activePreview?.isOpen === true && (
                <SectionPreviewModal isOpen={true} cities={props.activePreview.cities} title={props.activePreview.title} icon={props.activePreview.icon} categories={props.activePreview.categories} initialSelectedId={props.activePreview.selectedId || props.activeCityId} onClose={props.onClosePreview} onCitySelect={props.onNavigateToCity} />
            )}

            {/* --- CITY INFO TABS --- */}
            {activeModal !== null &&
                isCityInfoPreviewTab(activeModal) &&
                props.activeCityDetails && (
                 <CityInfoModal isOpen={true} onClose={closeModal} city={props.activeCityDetails} initialTab={activeModal} onAddToItinerary={onToggleItinerary} user={user} onOpenAuth={() => openModal('auth', { returnTo: activeModal, returnProps: { city: props.activeCityDetails } })} onSuggestEdit={(name) => { closeModal(); openModal('claim', { poi: { name, id: 'temp', category: 'discovery' } }); }} />
            )}
            {activeModal === 'province' && props.activeCityDetails && (
                <ProvinceModal isOpen={true} onClose={closeModal} currentCity={props.activeCityDetails} onSelectCity={(id) => props.onNavigateToCity(id)} liveManifest={props.cityManifest} onToggleMerge={(isActive, radius) => {}} />
            )}

            {/* --- AI QUOTA & CREDITS (v4) --- */}
            {activeModal === 'buyCredits' && (
                <BuyCreditsModal isOpen={true} onClose={closeModal} />
            )}
            {activeModal === 'quotaExceeded' && (
                <QuotaExceededModal 
                    isOpen={true} 
                    onClose={closeModal} 
                    onBuyCredits={() => openModal('buyCredits')} 
                    reason={modalProps.reason} 
                />
            )}
        </>
    );
};
