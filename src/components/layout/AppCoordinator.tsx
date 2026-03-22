import React, { useState, useEffect, Suspense } from 'react';
import { useUser } from '@/context/UserContext';
import { useNavigation } from '@/context/NavigationContext';
import { useReferralTracking } from '../../hooks/useReferralTracking';
import { MainLayout } from './MainLayout';
import { ModalLoading } from '../common/ModalLoading'; 
import { useInteraction } from '../../context/InteractionContext';
import { usePartnerIntegrations } from '../../hooks/usePartnerIntegrations';

const AdminDashboard = React.lazy(() => import('../admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));

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

    // --- VERIFICA TEMPORANEA CARICAMENTO PARTNER INTEGRATIONS ---
    const partnerIntegrations = usePartnerIntegrations();
    useEffect(() => {
        console.log('--- VERIFICA CARICAMENTO PARTNER INTEGRATIONS ---');
        if (Object.keys(partnerIntegrations).length > 0) {
            console.log('Configurazione caricata con successo:', partnerIntegrations);
            console.log('Esempio accesso a Booking.com:', partnerIntegrations.booking);
        } else {
            console.log('Configurazione non ancora caricata o vuota.');
        }
        console.log('------------------------------------------------');
    }, [partnerIntegrations]);
    // --- FINE VERIFICA ---

    // --- ADMIN VIEW SWITCH ---
    if (viewMode === 'admin' && user && (user.role === 'admin_all' || user.role === 'admin_limited')) {
        return (
            <Suspense fallback={<div className="h-screen w-full bg-slate-950 flex items-center justify-center"><ModalLoading/></div>}>
                <AdminDashboard onBack={() => setViewMode('app')} currentUser={user} onUserUpdate={setUser} />
            </Suspense>
        );
    }
    
    // --- MAIN APP RENDER ---
    return (
        <MainLayout 
            helpFlash={helpFlash}
            onCompleteOnboarding={handleCompleteOnboarding}
        />
    );
};