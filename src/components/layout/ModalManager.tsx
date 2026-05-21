
import React, { Suspense, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useModal } from '@/context/ModalContext';
import { useUser } from '@/context/UserContext';
import { useItinerary } from '@/context/ItineraryContext';
import { useGps } from '@/context/GpsContext';
import { useNavigation } from '@/context/useNavigation';
import { useDiaryInteractionsContext } from '@/context/useDiaryInteractionsContext';
import { useCityData } from '../../hooks/useCityData';

import { PointOfInterest, ItineraryItem, User, CitySummary } from '../../types/index';
import { ModalLoading } from '../common/ModalLoading';

// Sotto-Manager (Organizzati per dominio)
import { CoreModals } from './modals/CoreModals';
import { AdminModals } from './modals/AdminModals';
import { FeatureModals } from './modals/FeatureModals';
import { ModalManagerExternalProps } from './ModalManagerTypes';

export const ModalManager = () => {
    // 1. CONSUMO CONTEXT (Smart Component)
    const { activeModal, modalProps, closeModal, openModal } = useModal();
    const { user, setUser, cityManifest, closeLevelUp, handleLogout } = useUser();
    const { itinerary, setItinerary, removeItem } = useItinerary();
    const { userLocation, confirmGpsFromModal } = useGps();

    const {
        activeCityId,
        navigateToCity,
        handleNavigateGlobal,
        openShopFromPoi,
        activePreview,
        setActivePreview,
        handleAroundMeTrigger
    } = useNavigation();

    const {
        confirmAddToItinerary,
        resolveConflict,
        resolveDuplicate
    } = useDiaryInteractionsContext();

    // 2. DATI CITTÀ ATTIVA (On-Demand)
    const { city: activeCityDetails } = useCityData(activeCityId);

    // 3. HANDLERS ADATTATI
    const handleAuthSuccess = (u: User) => {
        setUser(u);
        if (modalProps.returnTo === 'dashboard') {
            closeModal();
            handleNavigateGlobal('profile', undefined, undefined, { slug: u.slug });
        } else if (modalProps.returnTo) {
            openModal(modalProps.returnTo, modalProps.returnProps);
        } else {
            closeModal();
        }
    };

    const handleCloseAuth = () => {
        if (modalProps.returnTo) {
            openModal(modalProps.returnTo, modalProps.returnProps);
        } else {
            closeModal();
        }
    };

    const handleToggleItinerary = (poi: PointOfInterest) => {
        const exists = itinerary.items.some(i => i.poi.id === poi.id);
        if (exists) {
            const items = itinerary.items.filter(i => i.poi.id === poi.id);
            if (items.length === 1) removeItem(items[0].id);
            else openModal('removeSelection', { 
                items,
                onRemoveSingle: async (id: string) => { await removeItem(id); closeModal(); },
                onRemoveAll: async () => { await handleRemoveAll(items); }
            });
        } else {
            openModal('add', { poi });
        }
    };

    const handleRemoveAll = async (items: ItineraryItem[]) => {
        await Promise.all(items.map(i => removeItem(i.id)));
        closeModal();
    };

    const activeCitySummary = activeCityId
        ? cityManifest.find(c => c.id === activeCityId)
        : null;

    // Props aggregate per i sotto-modali
    const sharedProps: ModalManagerExternalProps = useMemo(() => ({
        user,
        itinerary,
        userLocation,
        activeCityId,
        activeCitySummary,
        visibleAllPois: activeCityDetails?.details.allPois || [],
        activeCityDetails,
        cityManifest,
        onAuthSuccess: handleAuthSuccess,
        onConfirmGps: confirmGpsFromModal,
        onCloseLevelUp: closeLevelUp,
        onNavigateToCity: navigateToCity,
        onToggleItinerary: handleToggleItinerary,
        onConfirmAdd: confirmAddToItinerary,
        onRemoveItem: removeItem,
        onSetItineraryDates: (s, e) => setItinerary(prev => ({ ...prev, startDate: s, endDate: e })),
        onResolveConflict: resolveConflict,
        onResolveDuplicate: resolveDuplicate,
        onRemoveSingle: (id) => { removeItem(id); closeModal(); },
        onRemoveAll: handleRemoveAll,
        onUserUpdate: setUser,
        onNavigateGlobal: handleNavigateGlobal,
        onOpenShop: openShopFromPoi,
        activePreview,
        onClosePreview: () => setActivePreview({ ...activePreview, isOpen: false }),
        onLogout: handleLogout,
        onAroundMeTrigger: handleAroundMeTrigger
    }), [
        user,
        itinerary,
        userLocation,
        activeCityId,
        activeCitySummary,
        activeCityDetails,
        cityManifest,
        activePreview
    ]);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <Suspense fallback={<ModalLoading />}>

            <CoreModals
                activeModal={activeModal}
                modalProps={modalProps}
                closeModal={closeModal}
                onConfirmGps={confirmGpsFromModal}
                onAuthSuccess={handleAuthSuccess}
                onCloseAuth={handleCloseAuth}
            />

            <AdminModals
                activeModal={activeModal}
                modalProps={modalProps}
                closeModal={closeModal}
                openModal={openModal}
                user={user}
                activeCityId={activeCityId}
                activeCitySummary={activeCitySummary}
                onUserUpdate={setUser}
                onNavigate={handleNavigateGlobal}
            />

            <FeatureModals
                {...sharedProps}
                activeModal={activeModal}
                modalProps={modalProps}
                closeModal={closeModal}
                openModal={openModal}
            />

        </Suspense>,
        document.body
    );
};
