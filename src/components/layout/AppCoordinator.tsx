
import React, { useState, useEffect, Suspense } from 'react';
import { useUser } from '../../context/UserContext';
import { useNavigation } from '../../context/NavigationContext';
import { useReferralTracking } from '../../hooks/useReferralTracking';
import { MainLayout } from './MainLayout';
import { ModalLoading } from '../common/ModalLoading'; 
import { useInteraction } from '../../context/InteractionContext';

const AdminDashboard = React.lazy(() => import('../admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));

export const AppCoordinator = () => {
    
    // --- 0. REFERRAL TRACKING ---
    useReferralTracking(); 

    // --- 1. CORE DATA FROM CONTEXT ---
    const { user, setUser, completeOnboarding } = useUser();
    const { viewMode, setViewMode } = useNavigation();
    const { setInteractionUser } = useInteraction();

    // --- FIX CRITICAL SYNC: User -> Interaction ---
    useEffect(() => {
        setInteractionUser(user.id);
    }, [user.id, setInteractionUser]);

    // --- FLASH LOGIC FOR HELP BUTTON ---
    const [helpFlash, setHelpFlash] = useState(false);
    
    const handleCompleteOnboarding = () => {
        completeOnboarding();
        setHelpFlash(true);
        setTimeout(() => setHelpFlash(false), 4000);
    };

    // --- ADMIN VIEW SWITCH ---
    if (viewMode === 'admin' && (user.role === 'admin_all' || user.role === 'admin_limited')) {
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
