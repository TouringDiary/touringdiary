
import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { User } from '../../types/users';
import { getPendingSuggestionCount, getPendingReviewCount } from '../../services/communityService';
import { getSponsorStats } from '../../services/sponsorService';
import { getPendingPhotoCount } from '../../services/photoService';
import { useDocumentTitle } from '../../hooks/useDocumentTitle'; 

// LAYOUT COMPONENTS
import { AdminSidebar } from './layout/AdminSidebar';
import { AdminMobileHeader } from './layout/AdminMobileHeader';

// VIEWS
import { UserManagementView } from './views/UserManagementView';

// --- LAZY IMPORTS ---
const AdminCityEditor = React.lazy(() => import('./AdminCityEditor').then(m => ({ default: m.AdminCityEditor })));
const CitiesManager = React.lazy(() => import('./CitiesManager').then(m => ({ default: m.CitiesManager })));
const ImportDashboard = React.lazy(() => import('./import/ImportDashboard').then(m => ({ default: m.ImportDashboard }))); 
const SponsorManager = React.lazy(() => import('./SponsorManager').then(m => ({ default: m.SponsorManager })));
const PhotoModeration = React.lazy(() => import('./PhotoModeration').then(m => ({ default: m.PhotoModeration })));
const NewsTickerManager = React.lazy(() => import('./NewsTickerManager').then(m => ({ default: m.NewsTickerManager })));
const LoadingTipsManager = React.lazy(() => import('./LoadingTipsManager').then(m => ({ default: m.LoadingTipsManager })));
const AdminStatsDashboard = React.lazy(() => import('./AdminStatsDashboard').then(m => ({ default: m.AdminStatsDashboard })));
const MarketingManager = React.lazy(() => import('./MarketingManager').then(m => ({ default: m.MarketingManager })));
const ItineraryManager = React.lazy(() => import('./ItineraryManager').then(m => ({ default: m.ItineraryManager })));
const AdminHeaderManager = React.lazy(() => import('./AdminHeaderManager').then(m => ({ default: m.AdminHeaderManager })));
const AdminCommunications = React.lazy(() => import('./AdminCommunications').then(m => ({ default: m.AdminCommunications })));
const SuggestionManager = React.lazy(() => import('./SuggestionManager').then(m => ({ default: m.SuggestionManager })));
const AdminGamification = React.lazy(() => import('./AdminGamification').then(m => ({ default: m.AdminGamification })));
const GlobalEventsManager = React.lazy(() => import('./GlobalEventsManager').then(m => ({ default: m.GlobalEventsManager })));
// const AdminDesignSystem = React.lazy(() => import('./AdminDesignSystem').then(m => ({ default: m.AdminDesignSystem }))); // VECCHIO COMPONENTE
const SettingsPage = React.lazy(() => import('./settings/SettingsPage').then(m => ({ default: m.SettingsPage }))); // NUOVO COMPONENTE
const AdminSocialStudio = React.lazy(() => import('./AdminSocialStudio').then(m => ({ default: m.AdminSocialStudio })));
const AdminAssetLibrary = React.lazy(() => import('./AdminAssetLibrary').then(m => ({ default: m.AdminAssetLibrary })));

interface AdminDashboardProps {
    onBack: () => void;
    currentUser: User;
    onUserUpdate?: (user: User) => void;
}

const DashboardLoading = () => (
    <div className="flex flex-col items-center justify-center h-full w-full text-slate-500 gap-4 animate-in fade-in duration-300">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
        <p className="text-xs font-bold uppercase tracking-widest">Caricamento Modulo...</p>
    </div>
);

export const AdminDashboard = ({ onBack, currentUser, onUserUpdate }: AdminDashboardProps) => {
    useDocumentTitle('Admin Panel');

    // STATE PRINCIPALE DI NAVIGAZIONE
    const [view, setView] = useState<'dashboard' | 'cities' | 'osm_import' | 'events_global' | 'users' | 'sponsors' | 'photos' | 'ticker' | 'tips' | 'marketing' | 'itineraries' | 'design_assets' | 'settings' | 'comms' | 'suggestions' | 'gamification' | 'social_studio' | 'assets'>('dashboard');
    const [editingCityId, setEditingCityId] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // CONTATORI BADGE
    const [counts, setCounts] = useState({ sponsors: 0, suggestions: 0, reviews: 0, photos: 0 });
    
    const refreshCounts = useCallback(async () => {
        try {
            const sponsorStats = await getSponsorStats();
            const [suggestions, reviews, photos] = await Promise.all([
                getPendingSuggestionCount(), 
                getPendingReviewCount(), 
                getPendingPhotoCount()
            ]);
            const totalSponsorActionItems = (sponsorStats?.pending ?? 0) + (sponsorStats?.unreadMessages ?? 0);
            setCounts({ sponsors: totalSponsorActionItems, suggestions, reviews, photos });
        } catch (e) {
            console.error("Error refreshing dashboard counts", e);
        }
    }, []);

    useEffect(() => {
        refreshCounts();
        const interval = setInterval(refreshCounts, 60000);
        return () => clearInterval(interval);
    }, [refreshCounts]);

    const sectionNames: Record<string, string> = {
        dashboard: 'Dashboard', cities: 'Manager POI', osm_import: 'Import OSM', events_global: 'Eventi Globali', users: 'Utenti', sponsors: 'Sponsor', photos: 'Foto', ticker: 'News Ticker', tips: 'Loading Tips', marketing: 'Marketing', itineraries: 'Itinerari', design_assets: 'Asset Globali', settings: 'Impostazioni Globali', comms: 'Comunicazioni', suggestions: 'Segnalazioni', gamification: 'Gamification', social_studio: 'Social Studio', assets: 'Libreria'
    };

    const handleNavClick = (newView: any) => {
        if (editingCityId) setEditingCityId(null);
        setView(newView);
        setIsMobileMenuOpen(false);
    };
    
    const renderContent = () => {
        if (editingCityId) return <AdminCityEditor cityId={editingCityId} onBack={() => setEditingCityId(null)} currentUser={currentUser} />;

        switch (view) {
            case 'dashboard': return <AdminStatsDashboard />;
            case 'comms': return <AdminCommunications />;
            case 'suggestions': return <SuggestionManager onUserUpdate={onUserUpdate} />;
            case 'cities': return <CitiesManager onEdit={setEditingCityId} currentUser={currentUser} />;
            case 'osm_import': return <ImportDashboard />;
            case 'events_global': return <GlobalEventsManager />;
            case 'itineraries': return <ItineraryManager />;
            case 'gamification': return <AdminGamification />;
            case 'social_studio': return <AdminSocialStudio />;
            case 'assets': return <AdminAssetLibrary />;
            case 'users': return <UserManagementView currentUser={currentUser} onUserUpdate={onUserUpdate} />;
            case 'sponsors': return <SponsorManager currentUser={currentUser} />;
            case 'marketing': return <MarketingManager />;
            case 'photos': return <PhotoModeration currentUser={currentUser} onUpdate={refreshCounts} />;
            case 'ticker': return <NewsTickerManager />;
            case 'tips': return <LoadingTipsManager />;
            case 'design_assets': return <AdminHeaderManager />;
            case 'settings': return <SettingsPage />;
            default: return <AdminStatsDashboard />;
        }
    };

    return (
        <div className="h-screen w-full bg-slate-950 text-slate-200 font-sans selection:bg-amber-500/30 flex overflow-hidden relative">
            <AdminSidebar 
                isOpen={isMobileMenuOpen} 
                onClose={() => setIsMobileMenuOpen(false)} 
                activeView={view} 
                onNavigate={handleNavClick} 
                onBack={onBack} 
                currentUser={currentUser} 
                counts={counts} 
                editingCityId={editingCityId} 
            />
            
            <div className="flex-1 h-full overflow-y-auto bg-slate-950 custom-scrollbar relative flex flex-col">
                <AdminMobileHeader 
                    title={editingCityId ? 'Modifica Città' : sectionNames[view]} 
                    onMenuClick={() => setIsMobileMenuOpen(true)} 
                />
                
                <div className="p-4 md:p-8 pb-24 md:pb-20 max-w-[1920px] mx-auto h-full w-full">
                    <Suspense fallback={<DashboardLoading />}>
                        {renderContent()}
                    </Suspense>
                </div>
            </div>
        </div>
    );
};
