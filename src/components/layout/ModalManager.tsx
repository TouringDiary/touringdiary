
import React, { Suspense, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useModal } from '@/context/ModalContext';
import { useUser } from '@/context/UserContext';
import { useItinerary } from '@/context/ItineraryContext';
import { useGps } from '@/context/GpsContext';
import { useNavigation } from '@/context/useNavigation';
import { useDiaryInteractionsContext } from '@/context/useDiaryInteractionsContext';
import { useCityData } from '../../hooks/useCityData';
import { resolveWorkspaceId } from '@/focus';

import { PointOfInterest, ItineraryItem, User } from '../../types/index';
import { ModalLoading } from '../common/ModalLoading';
import { COLLABORATION_RETURN_TO } from '@/collaboration/guestGate';
import { userNeedsUsername } from '@/domain/profile/username';
import { ModalManagerExternalProps } from './ModalManagerTypes';
import { openCollaborationWorkspaceFlow, type CollaborationWorkspaceTarget } from '@/hooks/useOpenCollaborationWorkspace';
import { openMyWorldFlow } from '@/hooks/useOpenMyWorld';

/** Shell modali — fuori dal grafo sync Home; caricati al primo utilizzo del dominio. */
const CoreModals = React.lazy(() =>
    import('./modals/CoreModals').then((module) => ({ default: module.CoreModals }))
);
const AdminModals = React.lazy(() =>
    import('./modals/AdminModals').then((module) => ({ default: module.AdminModals }))
);
const FeatureModals = React.lazy(() =>
    import('./modals/FeatureModals').then((module) => ({ default: module.FeatureModals }))
);

const CORE_MODAL_KEYS = new Set([
    'auth',
    'setUsername',
    'gpsAlert',
    'gpsError',
    'reviewSuccess',
    'static',
]);
const ADMIN_MODAL_KEYS = new Set(['adminEditPoi', 'sponsor', 'adminSuccess']);

/**
 * ModalManager — entry.
 *
 * Workspace keys (MySpace / MyWorld / Valigia / collaboration) are owned by
 * WorkspaceHost + FocusOverlay, not by classic modal trees. While a workspace
 * owns `activeModal`, skip the portal and all heavy context fan-out.
 * Remount Classic immediately when `activeModal` leaves WORKSPACE_REGISTRY
 * (e.g. auth / poiDetail replacing the workspace key).
 */
export const ModalManager = () => {
    const { activeModal } = useModal();
    if (resolveWorkspaceId(activeModal) != null) {
        return null;
    }
    return <ModalManagerClassic />;
};

/** Classic consumer/admin/feature modal portal — mounted only when not in workspace focus. */
const ModalManagerClassic = () => {
    // 1. CONSUMO CONTEXT (Smart Component)
    const { activeModal, modalProps, closeModal, openModal } = useModal();
    const { user, setUser, cityManifest, showLevelUp, closeLevelUp, handleLogout } = useUser();
    const { itinerary, setItinerary, removeItem } = useItinerary();
    const { userLocation, confirmGpsFromModal } = useGps();

    // Ripristino cablaggio gamification: detector XP (`showLevelUp`) → modal `levelUp`.
    // Deve stare prima di eventuali early-return: altrimenti con activeModal null
    // il manager usciva senza aprire FeatureModals/LevelUpModal.
    useEffect(() => {
        if (showLevelUp && activeModal !== 'levelUp') {
            openModal('levelUp');
        }
    }, [showLevelUp, activeModal, openModal]);

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
    const resumeAfterIdentitySetup = useCallback((u: User) => {
        const pendingReturnTo = modalProps.returnTo;
        const pendingReturnProps = modalProps.returnProps;

        if (pendingReturnTo === 'dashboard') {
            closeModal();
            handleNavigateGlobal('profile', undefined, undefined, { slug: u.slug });
            return;
        }
        if (pendingReturnTo === COLLABORATION_RETURN_TO) {
            closeModal();
            const resumeProps = pendingReturnProps as {
                intent?: string;
                entryMode?: string;
                workspaceId?: string;
                initialSection?: string;
                kind?: string;
                resourceId?: string;
                resourceTitle?: string;
                preselectedDiaryId?: string;
                preselectedDiaryTitle?: string;
                viaggioId?: string;
                viaggioTitle?: string;
            } | undefined;
            if (resumeProps?.intent === 'myworld') {
                openMyWorldFlow(u, openModal);
                return;
            }
            if (resumeProps?.intent === 'workspace') {
                openCollaborationWorkspaceFlow(u, openModal, {
                    workspaceId: resumeProps.workspaceId,
                    initialSection: resumeProps.initialSection as CollaborationWorkspaceTarget['initialSection'],
                });
                return;
            }
            if (resumeProps?.entryMode === 'create_workspace') {
                openModal('collaborationShare', {
                    entryMode: 'create_workspace',
                    preselectedDiaryId: resumeProps.preselectedDiaryId,
                    preselectedDiaryTitle: resumeProps.preselectedDiaryTitle,
                });
                return;
            }
            if (resumeProps?.entryMode === 'workspace_from_viaggio' && resumeProps?.viaggioId) {
                openModal('collaborationShare', {
                    entryMode: 'workspace_from_viaggio',
                    viaggioId: resumeProps.viaggioId,
                    viaggioTitle: resumeProps.viaggioTitle,
                    preselectedDiaryId: resumeProps.preselectedDiaryId,
                });
                return;
            }
            if (resumeProps?.kind && resumeProps?.resourceId) {
                openModal('collaborationShare', {
                    kind: resumeProps.kind,
                    resourceId: resumeProps.resourceId,
                    resourceTitle: resumeProps.resourceTitle ?? '',
                });
            }
            return;
        }
        if (pendingReturnTo) {
            openModal(pendingReturnTo, pendingReturnProps);
            return;
        }
        closeModal();
    }, [modalProps.returnTo, modalProps.returnProps, closeModal, openModal, handleNavigateGlobal]);

    const handleAuthSuccess = (u: User) => {
        setUser(u);
        if (userNeedsUsername(u.slug)) {
            openModal('setUsername', {
                returnTo: modalProps.returnTo,
                returnProps: modalProps.returnProps,
                mandatory: true,
            });
            return;
        }
        resumeAfterIdentitySetup(u);
    };

    const handleUsernameComplete = (u: User) => {
        setUser(u);
        resumeAfterIdentitySetup(u);
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
        onClosePreview: () => {
            setActivePreview((prev) => ({ ...prev, isOpen: false }));
        },
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

    const needsCore = activeModal != null && CORE_MODAL_KEYS.has(activeModal);
    const needsAdmin = activeModal != null && ADMIN_MODAL_KEYS.has(activeModal);
    // removeSelection è montato in AppCoordinator (lazy dedicato), non in FeatureModals.
    const needsFeature =
        activePreview?.isOpen === true ||
        (activeModal != null &&
            activeModal !== 'removeSelection' &&
            !CORE_MODAL_KEYS.has(activeModal) &&
            !ADMIN_MODAL_KEYS.has(activeModal));

    if (!needsCore && !needsAdmin && !needsFeature) return null;

    return createPortal(
        <Suspense fallback={<ModalLoading />}>
            {needsCore && (
                <CoreModals
                    activeModal={activeModal}
                    modalProps={modalProps}
                    closeModal={closeModal}
                    onConfirmGps={confirmGpsFromModal}
                    onAuthSuccess={handleAuthSuccess}
                    onCloseAuth={handleCloseAuth}
                    user={user}
                    onUsernameComplete={handleUsernameComplete}
                />
            )}

            {needsAdmin && (
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
            )}

            {needsFeature && (
                <FeatureModals
                    {...sharedProps}
                    activeModal={activeModal}
                    modalProps={modalProps}
                    closeModal={closeModal}
                    openModal={openModal}
                />
            )}
        </Suspense>,
        document.body
    );
};
