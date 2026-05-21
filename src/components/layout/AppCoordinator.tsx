import type { User } from '@/types/users';
import { Z_OVERLAY } from '@/constants/zIndex';
import React, { useState, useEffect, Suspense } from 'react';
import { useUser } from '@/context/UserContext';
import { useNavigation } from '@/context/useNavigation';
import { useModal } from '@/context/ModalContext';
import { useUI } from '@/context/UIContext';
import { useReferralTracking } from '../../hooks/useReferralTracking';
import { MainLayout } from './MainLayout';
import { ModalLoading } from '../common/ModalLoading';
import { useInteraction } from '../../context/InteractionContext';
import { usePartnerIntegrations } from '../../hooks/usePartnerIntegrations';

const AdminDashboard = React.lazy(() => import('../admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const RemoveItemModal = React.lazy(() => import('../modals/RemoveItemModal').then(module => ({ default: module.RemoveItemModal })));
const SuitcaseFloatingPanel = React.lazy(() => import('@/components/features/diary/packing_list/SuitcaseFloatingPanel').then(module => ({ default: module.SuitcaseFloatingPanel })));

export const AppCoordinator = () => {

    // --- 0. REFERRAL TRACKING ---
    useReferralTracking();

    // --- 1. CORE DATA FROM CONTEXT ---
    const { user, setUser, completeOnboarding } = useUser();
    const { viewMode, setViewMode } = useNavigation();

    // ⚠️ FIX: protezione accesso context
    let setInteractionUser: ((userId: string) => void) | null = null;
    try {
        const interaction = useInteraction();
        setInteractionUser = interaction.setInteractionUser;
    } catch (e) {
        // context non ancora pronto → ignora
    }

    // --- FIX CRITICAL SYNC: User -> Interaction ---
    useEffect(() => {
        if (!user || !user.id) return;
        if (!setInteractionUser) return;

        setInteractionUser(user.id);
    }, [user, setInteractionUser]);

    // --- FLASH LOGIC FOR HELP BUTTON ---
    const [helpFlash, setHelpFlash] = useState(false);

    const handleCompleteOnboarding = () => {
        if (!completeOnboarding) return;
        completeOnboarding();
        setHelpFlash(true);
        setTimeout(() => setHelpFlash(false), 4000);
    };

    // --- VERIFICA CARICAMENTO PARTNER INTEGRATIONS ---
    const { integrations, loading } = usePartnerIntegrations();
    useEffect(() => {
        if (!loading && integrations && Object.keys(integrations).length > 0) {
            console.log('[AppCoordinator] Partner Integrations caricate con successo:', integrations);
        } else if (!loading) {
            console.log('[AppCoordinator] Partner Integrations caricate ma vuote o non trovate.');
        } else {
            console.log('[AppCoordinator] Partner Integrations in caricamento...');
        }
    }, [integrations, loading]);

    // --- GUARDIA DI CARICAMENTO ---
    // Impediamo il rendering del MainLayout finché le configurazioni base non sono pronte
    const { activeModal, modalProps, closeModal } = useModal();
    const { isSidebarOpen } = useUI();
    
    // Il focus mode è attivo solo se una modale standard richiede l'oscuramento (es. ricerca)
    const showFocusMode = viewMode === "app" && activeModal !== null && activeModal !== 'packingList';

    // --- RENDER SELECTION ---
    const renderLayout = () => {
        // 1. Loading Globale (Configurazioni/Partner)
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

        // 2. Dominio Admin
        if (viewMode === 'admin') {
            // Se siamo in admin ma l'utente non è ancora caricato o è guest, mostriamo un loader admin
            // per evitare il flash della Home consumer (MainLayout)
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

            // Verifica autorizzazioni effettive
            if (user.role === 'admin_all' || user.role === 'admin_limited') {
                return (
                    <Suspense fallback={<div className="h-screen w-full bg-slate-950 flex items-center justify-center"><ModalLoading /></div>}>
                        <AdminDashboard onBack={() => setViewMode('app')} currentUser={user} onUserUpdate={setUser} />
                    </Suspense>
                );
            }

            // Fallback per utenti non autorizzati in area admin
            setViewMode('app');
            return null;
        }

        // 3. Dominio Consumer
        return (
            <MainLayout
                helpFlash={helpFlash}
                onCompleteOnboarding={handleCompleteOnboarding}
            />
        );
    };

    return (
        <>
            {renderLayout()}

            {/* ROOT-LEVEL FOCUS MODE SYSTEM (Z-index priority guaranteed) */}
            <div
                id="focus-overlay"
                onClick={closeModal}
                className={`
                    fixed top-[var(--header-height)] left-0 right-0 bottom-0
                    bg-black/60 backdrop-blur-sm
                    ${showFocusMode ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}
                    select-none
                    transition-opacity duration-500 ease-in-out
                    ${showFocusMode ? 'opacity-100' : 'opacity-0'}
                `}
                style={{ zIndex: Z_OVERLAY }}
            />

            {activeModal === 'packingList' && (
                <Suspense fallback={null}>
                    <SuitcaseFloatingPanel
                        onClose={closeModal}
                        itineraryId={modalProps?.itineraryId || null}
                        cityType={modalProps?.cityType}
                        suitcaseId={modalProps?.suitcaseId}
                    />
                </Suspense>
            )}

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
        </>
    );
};
