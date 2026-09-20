import { Loader2 } from 'lucide-react';
import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  type AdminCityEditorTab,
  isAdminCityEditLocationState,
  isAdminCityEditorTab,
} from '@/components/admin/adminCityEditNav';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getPendingReviewCount, getPendingSuggestionCount } from '../../services/communityService';
import { getPendingFamousPeopleAdminCount } from '../../services/famousPerson/famousPersonAdminCountsService';
import { getPendingPatronSaintAdminCount } from '../../services/patron/patronAdminCountsService';
import { getPendingPhotoCount } from '../../services/photoService';
import { getPendingContentReportCount } from '../../services/reports/contentReportService';
import { getSponsorStats } from '../../services/sponsorService';
import type { User } from '../../types/users';
import { AdminMobileHeader } from './layout/AdminMobileHeader';
// LAYOUT COMPONENTS
import { AdminSidebar } from './layout/AdminSidebar';

// VIEWS
import { UserManagementView } from './views/UserManagementView';

// --- LAZY IMPORTS ---
const AdminCityEditor = React.lazy(() =>
  import('./AdminCityEditor').then((m) => ({ default: m.AdminCityEditor })),
);
const CitiesManager = React.lazy(() =>
  import('./CitiesManager').then((m) => ({ default: m.CitiesManager })),
);
const ImportDashboard = React.lazy(() =>
  import('./import/ImportDashboard').then((m) => ({ default: m.ImportDashboard })),
);
const SponsorManager = React.lazy(() =>
  import('./SponsorManager').then((m) => ({ default: m.SponsorManager })),
);
const PhotoModeration = React.lazy(() =>
  import('./PhotoModeration').then((m) => ({ default: m.PhotoModeration })),
);
const NewsTickerManager = React.lazy(() =>
  import('./NewsTickerManager').then((m) => ({ default: m.NewsTickerManager })),
);
const LoadingTipsManager = React.lazy(() =>
  import('./LoadingTipsManager').then((m) => ({ default: m.LoadingTipsManager })),
);
const AdminStatsDashboard = React.lazy(() =>
  import('./AdminStatsDashboard').then((m) => ({ default: m.AdminStatsDashboard })),
);
const MarketingManager = React.lazy(() =>
  import('./MarketingManager').then((m) => ({ default: m.MarketingManager })),
);
const ItineraryManager = React.lazy(() =>
  import('./ItineraryManager').then((m) => ({ default: m.ItineraryManager })),
);
const AdminHeaderManager = React.lazy(() =>
  import('./AdminHeaderManager').then((m) => ({ default: m.AdminHeaderManager })),
);
const AdminCommunications = React.lazy(() =>
  import('./AdminCommunications').then((m) => ({ default: m.AdminCommunications })),
);
const AdminReportsHub = React.lazy(() =>
  import('./reports/AdminReportsHub').then((m) => ({ default: m.AdminReportsHub })),
);
const AdminGamification = React.lazy(() =>
  import('./AdminGamification').then((m) => ({ default: m.AdminGamification })),
);
const GlobalEventsManager = React.lazy(() =>
  import('./GlobalEventsManager').then((m) => ({ default: m.GlobalEventsManager })),
);
// const AdminDesignSystem = React.lazy(() => import('./AdminDesignSystem').then(m => ({ default: m.AdminDesignSystem }))); // VECCHIO COMPONENTE
const SettingsPage = React.lazy(() =>
  import('./settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
); // NUOVO COMPONENTE
const AdminSocialStudio = React.lazy(() =>
  import('./AdminSocialStudio').then((m) => ({ default: m.AdminSocialStudio })),
);
const AdminAssetLibrary = React.lazy(() =>
  import('./AdminAssetLibrary').then((m) => ({ default: m.AdminAssetLibrary })),
);
const AdminPatronSaintManager = React.lazy(() =>
  import('./AdminPatronSaintManager').then((m) => ({ default: m.AdminPatronSaintManager })),
);
const AdminFamousPeopleManager = React.lazy(() =>
  import('./AdminFamousPeopleManager').then((m) => ({ default: m.AdminFamousPeopleManager })),
);
const AiLimitsControlCenter = React.lazy(() =>
  import('./AiLimitsControlCenter').then((m) => ({ default: m.AiLimitsControlCenter })),
);
const AdminControlCenterAI = React.lazy(() =>
  import('./AdminControlCenterAI').then((m) => ({ default: m.AdminControlCenterAI })),
);
const AffiliateEditorialCenter = React.lazy(() =>
  import('../features/diary/packing_list/suitcase/AffiliateEditorialCenter').then((m) => ({
    default: m.AffiliateEditorialCenter,
  })),
);
const PlatformControlCenter = React.lazy(() =>
  import('./platformControl/PlatformControlCenter').then((m) => ({
    default: m.PlatformControlCenter,
  })),
);

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

const ADMIN_SECTIONS = [
  'dashboard',
  'cities',
  'osm_import',
  'events_global',
  'patron_saint',
  'famous_people',
  'users',
  'sponsors',
  'photos',
  'ticker',
  'tips',
  'marketing',
  'itineraries',
  'design_assets',
  'settings',
  'comms',
  'suggestions',
  'gamification',
  'social_studio',
  'assets',
  'ai_control',
  'ai_economics',
  'affiliations',
  'platform_control',
] as const;

type AdminSection = (typeof ADMIN_SECTIONS)[number];

function isAdminSection(value: string): value is AdminSection {
  for (const section of ADMIN_SECTIONS) {
    if (value === section) return true;
  }
  return false;
}

export const AdminDashboard = ({ onBack, currentUser, onUserUpdate }: AdminDashboardProps) => {
  useDocumentTitle('Admin Panel');
  const location = useLocation();
  const navigate = useNavigate();

  // DERIVAZIONE ROBUSTA DELLA SEZIONE DALL'URL (Bypassa i limiti di useParams fuori dai Routes)
  const section = location.pathname.split('/')[2] || 'dashboard';
  const view: AdminSection = isAdminSection(section) ? section : 'dashboard';

  const [editingCityId, setEditingCityId] = useState<string | null>(null);
  const [editingCityInitialTab, setEditingCityInitialTab] = useState<AdminCityEditorTab | null>(
    null,
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Deep-link Edit Città (es. matita Santo Patrono): state su `/admin/cities`, poi clear.
  useEffect(() => {
    if (!isAdminCityEditLocationState(location.state)) return;
    const { editCityId, editCityTab } = location.state;
    setEditingCityId(editCityId);
    setEditingCityInitialTab(editCityTab && isAdminCityEditorTab(editCityTab) ? editCityTab : null);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  // CONTATORI BADGE
  const [counts, setCounts] = useState({
    sponsors: 0,
    suggestions: 0,
    reviews: 0,
    photos: 0,
    patronSaint: 0,
    famousPeople: 0,
  });
  const refreshGenerationRef = useRef(0);

  const refreshCounts = useCallback(async () => {
    const generation = ++refreshGenerationRef.current;
    const [
      sponsorResult,
      suggestionsResult,
      contentReportsResult,
      reviewsResult,
      photosResult,
      patronSaintResult,
      famousPeopleResult,
      aiVerifyResult,
    ] = await Promise.allSettled([
      getSponsorStats(),
      getPendingSuggestionCount(),
      getPendingContentReportCount(),
      getPendingReviewCount(),
      getPendingPhotoCount(),
      getPendingPatronSaintAdminCount(),
      getPendingFamousPeopleAdminCount(),
      import('@/services/media/mediaAssetService').then((m) => m.getAiVerifyQueueCounts()),
    ]);
    if (generation !== refreshGenerationRef.current) return;

    setCounts((prev) => {
      const next = { ...prev };

      if (sponsorResult.status === 'fulfilled') {
        const sponsorStats = sponsorResult.value;
        next.sponsors = (sponsorStats?.pending ?? 0) + (sponsorStats?.unreadMessages ?? 0);
      } else {
        console.error('Error refreshing sponsor counts', sponsorResult.reason);
      }

      if (suggestionsResult.status === 'fulfilled') {
        next.suggestions = suggestionsResult.value;
      } else {
        console.error('Error refreshing suggestion counts', suggestionsResult.reason);
      }

      if (contentReportsResult.status === 'fulfilled') {
        next.suggestions += contentReportsResult.value;
      } else {
        console.error('Error refreshing content report counts', contentReportsResult.reason);
      }

      if (reviewsResult.status === 'fulfilled') {
        next.reviews = reviewsResult.value;
      } else {
        console.error('Error refreshing review counts', reviewsResult.reason);
      }

      if (photosResult.status === 'fulfilled') {
        next.photos = photosResult.value;
      } else {
        console.error('Error refreshing photo counts', photosResult.reason);
      }

      if (patronSaintResult.status === 'fulfilled') {
        next.patronSaint = patronSaintResult.value;
      } else {
        console.error('Error refreshing patron saint counts', patronSaintResult.reason);
      }

      if (famousPeopleResult.status === 'fulfilled') {
        next.famousPeople = famousPeopleResult.value;
      } else {
        console.error('Error refreshing famous people counts', famousPeopleResult.reason);
      }

      if (aiVerifyResult.status === 'fulfilled') {
        next.suggestions += aiVerifyResult.value.total;
      } else {
        console.error('Error refreshing AI verify queue counts', aiVerifyResult.reason);
      }

      return next;
    });
  }, []);

  useEffect(() => {
    refreshCounts();
    const onVisibility = () => {
      if (!document.hidden) void refreshCounts();
    };
    document.addEventListener('visibilitychange', onVisibility);
    // Badge admin: refresh on focus + intervallo lungo (non ogni minuto a tab nascosta).
    const interval = window.setInterval(() => {
      if (!document.hidden) void refreshCounts();
    }, 180000);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(interval);
    };
  }, [refreshCounts]);

  // Admin is a separate view-mode (no AppShell / consumer Header).
  // td-modal-overlay is chrome-safe via top: var(--header-height); without a consumer
  // header that token would leave a 64px undimmed strip. Reset for this view-mode.
  useEffect(() => {
    const previous = document.documentElement.style.getPropertyValue('--header-height');
    document.documentElement.style.setProperty('--header-height', '0px');
    return () => {
      if (previous) {
        document.documentElement.style.setProperty('--header-height', previous);
      } else {
        document.documentElement.style.removeProperty('--header-height');
      }
    };
  }, []);

  const sectionNames: Record<AdminSection, string> = {
    dashboard: 'Dashboard',
    cities: 'Manager POI',
    osm_import: 'Import OSM',
    events_global: 'Eventi Globali',
    patron_saint: 'Santo Patrono',
    famous_people: 'Personaggi Famosi',
    users: 'Utenti',
    sponsors: 'Sponsor',
    photos: 'Foto',
    ticker: 'News Ticker',
    tips: 'Loading Tips',
    marketing: 'Marketing',
    itineraries: 'Itinerari',
    design_assets: 'Asset Globali',
    settings: 'Impostazioni Globali',
    comms: 'Comunicazioni',
    suggestions: 'Segnalazioni',
    gamification: 'Gamification',
    social_studio: 'Social Studio',
    assets: 'Libreria',
    ai_control: 'AI Control Center',
    ai_economics: 'AI Economics',
    affiliations: 'Affiliazioni & Override',
    platform_control: 'Centro di Controllo',
  };

  const handleNavClick = (newView: string) => {
    if (editingCityId) {
      setEditingCityId(null);
      setEditingCityInitialTab(null);
    }
    // Realm Admin: replace sulle sezioni così non si accumulano /admin* sotto lo stack consumer.
    if (newView === 'dashboard') {
      navigate('/admin', { replace: true });
    } else {
      navigate(`/admin/${newView}`, { replace: true });
    }
    setIsMobileMenuOpen(false);
  };

  const closeCityEditor = () => {
    setEditingCityId(null);
    setEditingCityInitialTab(null);
  };

  const renderContent = () => {
    if (editingCityId)
      return (
        <AdminCityEditor
          cityId={editingCityId}
          onBack={closeCityEditor}
          currentUser={currentUser}
          initialTab={editingCityInitialTab ?? undefined}
        />
      );

    switch (view) {
      case 'dashboard':
        return <AdminStatsDashboard />;
      case 'comms':
        return <AdminCommunications />;
      case 'suggestions':
        return <AdminReportsHub />;
      case 'cities':
        return <CitiesManager onEdit={setEditingCityId} currentUser={currentUser} />;
      case 'osm_import':
        return <ImportDashboard />;
      case 'events_global':
        return <GlobalEventsManager />;
      case 'patron_saint':
        return <AdminPatronSaintManager />;
      case 'famous_people':
        return <AdminFamousPeopleManager />;
      case 'itineraries':
        return <ItineraryManager />;
      case 'gamification':
        return <AdminGamification />;
      case 'social_studio':
        return <AdminSocialStudio />;
      case 'assets':
        return <AdminAssetLibrary />;
      case 'users':
        return <UserManagementView currentUser={currentUser} onUserUpdate={onUserUpdate} />;
      case 'sponsors':
        return <SponsorManager currentUser={currentUser} />;
      case 'marketing':
        return <MarketingManager />;
      case 'photos':
        return <PhotoModeration currentUser={currentUser} onUpdate={refreshCounts} />;
      case 'ticker':
        return <NewsTickerManager />;
      case 'tips':
        return <LoadingTipsManager />;
      case 'design_assets':
        return <AdminHeaderManager />;
      case 'settings':
        return <SettingsPage />;
      case 'ai_control':
        return <AiLimitsControlCenter />;
      case 'ai_economics':
        return <AdminControlCenterAI />;
      case 'affiliations':
        return <AffiliateEditorialCenter />;
      case 'platform_control':
        return <PlatformControlCenter currentUser={currentUser} />;
      default:
        return <AdminStatsDashboard />;
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
        {!editingCityId && (
          <AdminMobileHeader
            title={sectionNames[view]}
            onMenuClick={() => setIsMobileMenuOpen(true)}
          />
        )}

        <div
          className={`${editingCityId ? 'p-0 pb-20' : 'p-4 md:p-8 pb-24 md:pb-20'} max-w-[1920px] mx-auto h-full w-full`}
        >
          <Suspense fallback={<DashboardLoading />}>{renderContent()}</Suspense>
        </div>
      </div>
    </div>
  );
};
