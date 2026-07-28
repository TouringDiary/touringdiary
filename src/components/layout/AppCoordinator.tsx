import type { User } from '@/types/users';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useUser } from '@/context/UserContext';
import { useNavigation } from '@/context/useNavigation';
import { useModal } from '@/context/ModalContext';
import { useUI } from '@/context/UIContext';
import { useReferralTracking } from '../../hooks/useReferralTracking';
import { MainLayout } from './MainLayout';
import { ModalLoading } from '../common/ModalLoading';
import { useInteraction } from '../../context/InteractionContext';
import { usePartnerIntegrations } from '../../hooks/usePartnerIntegrations';
import { FocusModeProvider, FocusOverlay, WorkspaceHost } from '@/focus';
import { WorkspacePanelProvider } from '@/components/workspace/global/WorkspacePanelContext';
import { useAppExitProtection } from '@/hooks/save/useAppExitProtection';
import { UsernameRequiredGate } from '@/collaboration/UsernameRequiredGate';
import { GlobalAlert } from '@/components/common/GlobalAlert';
const AdminDashboard = React.lazy(() => import('../admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const RemoveItemModal = React.lazy(() => import('../modals/RemoveItemModal').then(module => ({ default: module.RemoveItemModal })));

export const AppCoordinator = () => {

    useReferralTracking();
    useAppExitProtection();

    const { user, setUser, completeOnboarding } = useUser();
    const { viewMode, setViewMode } = useNavigation();
    const { setInteractionUser } = useInteraction();

    useEffect(() => {
        if (!user?.id) return;
        setInteractionUser(user.id);
    }, [user, setInteractionUser]);

    const [helpFlash, setHelpFlash] = useState(false);
    const helpFlashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (helpFlashTimeoutRef.current != null) {
                clearTimeout(helpFlashTimeoutRef.current);
                helpFlashTimeoutRef.current = null;
            }
        };
    }, []);

    const handleCompleteOnboarding = () => {
        if (!completeOnboarding) return;
        completeOnboarding();
        setHelpFlash(true);
        if (helpFlashTimeoutRef.current != null) {
            clearTimeout(helpFlashTimeoutRef.current);
        }
        helpFlashTimeoutRef.current = setTimeout(() => {
            helpFlashTimeoutRef.current = null;
            setHelpFlash(false);
        }, 4000);
    };

    const { integrations, loading } = usePartnerIntegrations();
    useEffect(() => {
        if (!import.meta.env.DEV) return;
        if (loading) {
            console.log('[AppCoordinator] Partner Integrations in caricamento...');
            return;
        }
        if (integrations && Object.keys(integrations).length > 0) {
            console.log('[AppCoordinator] Partner Integrations caricate con successo:', integrations);
            return;
        }
        console.log('[AppCoordinator] Partner Integrations caricate ma vuote o non trovate.');
    }, [integrations, loading]);

    const { activeModal, modalProps, closeModal } = useModal();
    useUI();

    const isCollaborationWorkspaceOpen = activeModal === 'collaborationWorkspace';
    const workspaceIdIntent = isCollaborationWorkspaceOpen ? modalProps?.workspaceId : undefined;
    const initialSectionIntent = isCollaborationWorkspaceOpen ? modalProps?.initialSection : undefined;

    const renderLayout = () => {
        if (loading) {
            return (
                <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center gap-4">
                    <ModalLoading />
                    <p className="text-slate-500 uppercase font-black text-[10px] tracking-widest animate-pulse">
                        Sincronizzazione Configurazioni...
                    </p>
                </div>
            );
        }

        if (viewMode === 'admin') {
            if (!user || user.role === 'guest') {
                return (
                    <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center gap-4">
                        <ModalLoading />
                        <p className="text-slate-500 uppercase font-black text-[10px] tracking-widest">
                            Accesso Area Riservata...
                        </p>
                    </div>
                );
            }

            if (user.role === 'admin_all' || user.role === 'admin_limited') {
                return (
                    <Suspense fallback={<div className="h-screen w-full bg-slate-950 flex items-center justify-center"><ModalLoading /></div>}>
                        <AdminDashboard onBack={() => setViewMode('app')} currentUser={user} onUserUpdate={setUser} />
                    </Suspense>
                );
            }

            setViewMode('app');
            return null;
        }

        return (
            <MainLayout
                helpFlash={helpFlash}
                onCompleteOnboarding={handleCompleteOnboarding}
            />
        );
    };

    return (
        <FocusModeProvider>
            <WorkspacePanelProvider
                isPanelOpen={isCollaborationWorkspaceOpen}
                initialWorkspaceId={workspaceIdIntent}
                initialSection={initialSectionIntent}
            >
                <UsernameRequiredGate />
                {renderLayout()}
                <GlobalAlert />

                <FocusOverlay />
                <WorkspaceHost />
                {activeModal === 'removeSelection' && modalProps?.items && modalProps?.onRemoveSingle && modalProps?.onRemoveAll && (
                    <Suspense fallback={null}>
                        <RemoveItemModal
                            isOpen={true}
                            onClose={closeModal}
                            items={modalProps.items}
                            onRemoveSingle={modalProps.onRemoveSingle}
                            onRemoveAll={modalProps.onRemoveAll}
                        />
                    </Suspense>
                )}
            </WorkspacePanelProvider>
        </FocusModeProvider>
    );
};
