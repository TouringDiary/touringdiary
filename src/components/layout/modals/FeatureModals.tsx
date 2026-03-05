
import React from 'react';
import { useInteraction } from '../../../context/InteractionContext';
import { ModalManagerExternalProps } from '../ModalManagerTypes';
import { PointOfInterest } from '../../../types/index';

// Lazy Imports
const PoiDetailModal = React.lazy(() => import('../../modals/PoiDetailModal').then(module => ({ default: module.PoiDetailModal })));
// Removed BusinessCardModal as it is now integrated into PoiDetailModal
const ReviewModal = React.lazy(() => import('../../modals/ReviewModal').then(module => ({ default: module.ReviewModal })));
const AddToItineraryModal = React.lazy(() => import('../../modals/AddToItineraryModal').then(module => ({ default: module.AddToItineraryModal })));
const TimeConflictModal = React.lazy(() => import('../../modals/TimeConflictModal').then(module => ({ default: module.TimeConflictModal })));
const DuplicateResolutionModal = React.lazy(() => import('../../modals/DuplicateResolutionModal').then(module => ({ default: module.DuplicateResolutionModal })));
const RemoveItemModal = React.lazy(() => import('../../modals/RemoveItemModal').then(module => ({ default: module.RemoveItemModal })));
const CityInfoModal = React.lazy(() => import('../../modals/CityInfoModal').then(module => ({ default: module.CityInfoModal })));
const ProvinceModal = React.lazy(() => import('../../modals/ProvinceModal').then(module => ({ default: module.ProvinceModal })));
const LevelUpModal = React.lazy(() => import('../../modals/LevelUpModal').then(module => ({ default: module.LevelUpModal })));
const UserDashboard = React.lazy(() => import('../../user/UserDashboard').then(module => ({ default: module.UserDashboard })));
const AiItineraryModal = React.lazy(() => import('../../modals/AiItineraryModal').then(module => ({ default: module.AiItineraryModal })));
const RoadbookModal = React.lazy(() => import('../../modals/RoadbookModal').then(module => ({ default: module.RoadbookModal })));
const SectionPreviewModal = React.lazy(() => import('../../modals/SectionPreviewModal').then(module => ({ default: module.SectionPreviewModal })));
const SuggestionModal = React.lazy(() => import('../../modals/SuggestionModal').then(module => ({ default: module.SuggestionModal })));
const ItinerariesModal = React.lazy(() => import('../../modals/ItinerariesModal').then(module => ({ default: module.ItinerariesModal })));
const UserUpgradeModal = React.lazy(() => import('../../modals/UserUpgradeModal').then(module => ({ default: module.UserUpgradeModal })));
const FullRankingsModal = React.lazy(() => import('../../modals/FullRankingsModal').then(module => ({ default: module.FullRankingsModal })));
const GlobalSectionView = React.lazy(() => import('../../modals/GlobalSectionView').then(module => ({ default: module.GlobalSectionView })));
const AroundMeWizard = React.lazy(() => import('../../modals/AroundMeWizard').then(module => ({ default: module.AroundMeWizard })));
const PoiClaimModal = React.lazy(() => import('../../modals/PoiClaimModal').then(module => ({ default: module.PoiClaimModal })));
const ExportModal = React.lazy(() => import('../../modals/ExportModal').then(module => ({ default: module.ExportModal })));
const EmptyDiaryModal = React.lazy(() => import('../../modals/EmptyDiaryModal').then(module => ({ default: module.EmptyDiaryModal })));
const ShareModal = React.lazy(() => import('../../modals/ShareModal').then(module => ({ default: module.ShareModal })));

interface FeatureModalsProps extends ModalManagerExternalProps {
    activeModal: string | null;
    modalProps: any;
    closeModal: () => void;
    openModal: (type: string, props?: any) => void;
    onAroundMeTrigger: (config: { type: 'gps' | 'manual', cityId?: string, radius: number }) => void;
}

export const FeatureModals = (props: FeatureModalsProps) => {
    const { activeModal, modalProps, closeModal, openModal, user, itinerary } = props;
    const { submitReview } = useInteraction();

    const handleToggleItinerary = (poi: PointOfInterest) => {
        const exists = itinerary.items.some((i: any) => i.poi.id === poi.id);
        if(exists) { 
            const items = itinerary.items.filter((i: any) => i.poi.id === poi.id); 
            if (items.length === 1) props.onRemoveItem(items[0].id);
            else openModal('removeSelection', { items }); 
        } else { 
            openModal('add', { poi }); 
        }
    };

    const handleOpenReview = (poi: PointOfInterest) => {
        if (user.role === 'guest') { 
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

    if (!activeModal) return null;

    return (
        <>
            {/* --- USER DASHBOARD & GAMIFICATION --- */}
            {activeModal === 'userDashboard' && (
                <UserDashboard isOpen={true} onClose={closeModal} user={user} onNavigate={props.onNavigateGlobal} initialTab={modalProps.tab} onLogout={props.onLogout} />
            )}
            {activeModal === 'levelUp' && (
                <LevelUpModal isOpen={true} onClose={() => { closeModal(); props.onCloseLevelUp(); }} xp={user.xp || 0} onOpenRewards={() => { closeModal(); props.onNavigateGlobal('rewards'); }} />
            )}
            {activeModal === 'upgrade' && (
                <UserUpgradeModal isOpen={true} onClose={closeModal} user={user} onSuccess={() => { closeModal(); }} />
            )}

            {/* --- ITINERARY & PLANNER --- */}
            {activeModal === 'aiPlanner' && (
                <AiItineraryModal isOpen={true} onClose={closeModal} defaultCity={props.activeCitySummary?.name || ''} user={user} />
            )}
            {activeModal === 'roadbook' && (
                <RoadbookModal isOpen={true} onClose={closeModal} itinerary={itinerary} activeCityName={props.activeCitySummary?.name || 'Campania'} />
            )}
            {activeModal === 'exportOptions' && (
                <ExportModal isOpen={true} onClose={closeModal} />
            )}
            {activeModal === 'emptyDiary' && (
                <EmptyDiaryModal isOpen={true} onClose={closeModal} onOpenAuth={() => openModal('auth')} user={user} />
            )}
            {activeModal === 'itineraries' && (
                <ItinerariesModal isOpen={true} onClose={closeModal} onViewPoiDetail={handleToggleItinerary} userLocation={props.userLocation} user={user} initialZoneFilter={modalProps.zone} onOpenAuth={() => openModal('auth', { returnTo: 'itineraries' })} />
            )}
            {activeModal === 'add' && modalProps.poi && (
                <AddToItineraryModal isOpen={true} onClose={closeModal} onConfirm={(day, time) => { props.onConfirmAdd(modalProps.poi, day, time); }} onRemove={(id) => { props.onRemoveItem(id); }} poi={modalProps.poi} startDate={itinerary.startDate} endDate={itinerary.endDate} existingItems={itinerary.items} onDateSet={props.onSetItineraryDates} />
            )}
            {activeModal === 'conflict' && modalProps.conflict && (
                <TimeConflictModal isOpen={true} onClose={closeModal} item={modalProps.conflict.item} targetDayIndex={modalProps.conflict.targetDayIndex} conflictingItem={modalProps.conflict.conflictingItem} existingItemsInTargetDay={itinerary.items.filter((i:any) => i.dayIndex === modalProps.conflict.targetDayIndex)} onConfirm={(newTime) => props.onResolveConflict(modalProps.conflict.item, modalProps.conflict.targetDayIndex, modalProps.conflict.conflictingItem, 'changeTime', newTime)} onSwap={() => props.onResolveConflict(modalProps.conflict.item, modalProps.conflict.targetDayIndex, modalProps.conflict.conflictingItem, 'swap')} />
            )}
            {activeModal === 'duplicate' && modalProps.duplicate && (
                <DuplicateResolutionModal isOpen={true} onClose={closeModal} newItemPoi={modalProps.duplicate.poi} existingItem={modalProps.duplicate.existingItem} targetDayIndex={modalProps.duplicate.dayIndex} targetTime={modalProps.duplicate.timeSlotStr} onAddDuplicate={() => props.onResolveDuplicate(modalProps.duplicate.poi, modalProps.duplicate.dayIndex, modalProps.duplicate.timeSlotStr, modalProps.duplicate.existingItem, 'add')} onReplace={() => props.onResolveDuplicate(modalProps.duplicate.poi, modalProps.duplicate.dayIndex, modalProps.duplicate.timeSlotStr, modalProps.duplicate.existingItem, 'replace')} />
            )}
            {activeModal === 'removeSelection' && modalProps.items && (
                <RemoveItemModal isOpen={true} onClose={closeModal} items={modalProps.items} onRemoveSingle={props.onRemoveSingle} onRemoveAll={() => props.onRemoveAll(modalProps.items)} />
            )}

            {/* --- POI & REVIEWS (UNIFIED MODAL) --- */}
            {activeModal === 'review' && modalProps.poi && (
                <ReviewModal isOpen={true} onClose={closeModal} poi={modalProps.poi} onSubmit={(r, c, t) => { submitReview(modalProps.poi, r, c, t, user); }} />
            )}
            
            {activeModal === 'poiDetail' && modalProps.poi && (
                <PoiDetailModal 
                    poi={modalProps.poi} 
                    onClose={closeModal} 
                    onToggleItinerary={() => handleToggleItinerary(modalProps.poi)} 
                    isInItinerary={itinerary.items.some((i: any) => i.poi.id === modalProps.poi.id)} 
                    onOpenReview={() => handleOpenReview(modalProps.poi)} 
                    userLocation={props.userLocation} 
                    onSuggestEdit={(name) => { closeModal(); openModal('claim', { poi: modalProps.poi }); }} 
                    onOpenShop={props.onOpenShop} 
                    user={user} 
                    onOpenAuth={() => openModal('auth', { returnTo: 'poiDetail', returnProps: { poi: modalProps.poi } })} 
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
            {activeModal === 'global' && (
                <GlobalSectionView section={modalProps.section} initialTab={modalProps.tab} initialSelectedPostId={modalProps.id} onClose={closeModal} user={user} onUserUpdate={props.onUserUpdate} onOpenAuth={() => openModal('auth', { returnTo: 'global', returnProps: modalProps })} />
            )}
            {activeModal === 'suggestion' && (
                 <SuggestionModal isOpen={true} onClose={closeModal} cityId={props.activeCityId || 'napoli'} cityName={props.activeCitySummary?.name || 'Campania'} user={user} onOpenAuth={() => openModal('auth', { returnTo: 'suggestion', returnProps: modalProps })} initialType={modalProps.type} prefilledName={modalProps.prefilledName} existingPois={props.visibleAllPois} />
            )}
            {activeModal === 'aroundMe' && (
                <AroundMeWizard onClose={closeModal} cityManifest={props.cityManifest} onConfirm={(config) => { props.onAroundMeTrigger(config); closeModal(); }} />
            )}
            {activeModal === 'fullRankings' && (
                <FullRankingsModal 
                    onClose={closeModal}
                    onNavigateToCity={(cityId) => { closeModal(); props.onNavigateToCity(cityId); }}
                    onOpenPoi={handleOpenPoiDetailFromRanking}
                />
            )}
            {props.activePreview.isOpen && (
                <SectionPreviewModal cities={props.activePreview.cities} title={props.activePreview.title} icon={props.activePreview.icon} categories={props.activePreview.categories} initialSelectedId={props.activePreview.selectedId || props.activeCityId} onClose={props.onClosePreview} onCitySelect={props.onNavigateToCity} />
            )}

            {/* --- CITY INFO TABS --- */}
            {['guides', 'services', 'events', 'tour_operators'].includes(activeModal) && props.activeCityDetails && (
                 <CityInfoModal isOpen={true} onClose={closeModal} city={props.activeCityDetails} initialTab={activeModal as any} onAddToItinerary={(poi) => handleToggleItinerary(poi)} user={user} onOpenAuth={() => openModal('auth', { returnTo: activeModal, returnProps: { city: props.activeCityDetails } })} onSuggestEdit={(name) => { closeModal(); openModal('claim', { poi: { name, id: 'temp', category: 'discovery' } }); }} />
            )}
            {activeModal === 'province' && props.activeCityDetails && (
                <ProvinceModal isOpen={true} onClose={closeModal} currentCity={props.activeCityDetails} onSelectCity={(id) => props.onNavigateToCity(id)} liveManifest={props.cityManifest} onToggleMerge={(isActive, radius) => {}} />
            )}
        </>
    );
};
