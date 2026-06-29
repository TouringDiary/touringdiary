import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { Briefcase, User, ArrowLeft, Loader2, Zap, Star, ShoppingBag, Eye, TrendingUp, BarChart3, Store } from 'lucide-react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { User as UserType, CitySummary, Itinerary, SuggestionRequest } from '../../types/index';
import { PLAN_TYPES } from '@/constants/planTypes';
import { Suitcase } from '@/types/suitcase';
import { BusinessShopManager } from './BusinessShopManager';
import { getCurrentLevel, getNextLevelProgress } from '../../services/gamificationService';
import { useUserDashboardData } from '../../hooks/useUserDashboardData';
import { useModal } from '@/context/ModalContext';
import { useBusinessContext } from '@/context/BusinessContext';
import { useAppRouter, URL_TO_INTERNAL_TAB } from '@/hooks/useAppRouter';


// Sub-components
import { UserSidebar } from './dashboard/UserSidebar';
import { UserOverviewTab } from './dashboard/UserOverviewTab';
import { UserWalletTab } from './dashboard/UserWalletTab';
import { UserSettingsTab } from './dashboard/UserSettingsTab';
import { UserNotificationsTab } from './dashboard/UserNotificationsTab';
import { UserReferralTab } from './dashboard/UserReferralTab';
import { UserMessagesTab } from './dashboard/UserMessagesTab'; // NEW IMPORT
import { UserSuitcasesTab } from './dashboard/UserSuitcasesTab';
import { UserTripsTab } from './dashboard/UserTripsTab';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    user: UserType;
    onNavigate: (section: 'community' | 'trips' | 'rewards' | 'profile' | 'city', tab?: string, id?: string, extra?: any) => void; 
    initialTab?: string;
    onLogout?: () => void;
    cityManifest?: CitySummary[];
    userSuitcases?: Suitcase[];
}

export const UserDashboard = ({ isOpen, onClose, user, onNavigate, initialTab, onLogout, userSuitcases }: Props) => {
    if (!user || user.role === 'guest') return null;

    const isBusiness = user.role === 'business';
    const location = useLocation();
    const navigate = useNavigate();
    const router = useAppRouter();
    const { activeBusinessId, activeBusiness, userBusinesses, switchBusiness } = useBusinessContext();

    // DERIVAZIONE TAB DA URL (Per persistenza durante remount/switch)
    const urlTab = useMemo(() => {
        const segments = location.pathname.split('/').filter(Boolean);
        const dashboardIdx = segments.indexOf('dashboard');
        if (dashboardIdx === -1) return 'overview_user';

        const first = segments[dashboardIdx + 1];
        const second = segments[dashboardIdx + 2];

        // Cerchiamo il tab in prima o seconda posizione (legacy support)
        const internalTab = URL_TO_INTERNAL_TAB[first] || URL_TO_INTERNAL_TAB[second];
        return internalTab || 'overview_user';
    }, [location.pathname]);

    const [activeTab, setActiveTab] = useState<string>(urlTab); 
    
    // NEW: Mobile View State
    const [mobileView, setMobileView] = useState<'menu' | 'content'>('menu');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const { openModal } = useModal();
    
    // CUSTOM HOOK: Data Management
    const { 
        myShop, bizStats, suggestions, catalogRewards, myRewards, notifications, unreadCount, 
        sponsorRequests, // NEW DATA
        isLoading,
        refreshData, handleClaimReward, handleMarkUsed, setNotifications, setUnreadCount
    } = useUserDashboardData(user);

    // Calc unread messages
    const unreadMessages = (sponsorRequests ?? []).reduce((sum, req) => sum + (req.partnerLogs?.filter(l => l.direction === 'outbound' && l.isUnread).length || 0), 0);

    // GAMIFICATION CALCULATIONS
    const currentXP = user.xp || 0;
    const currentLevel = getCurrentLevel(currentXP);
    const progress = getNextLevelProgress(currentXP);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 1. Sincronizzazione Tab con URL e props
    useEffect(() => {
        if (isOpen) {
            if (initialTab && initialTab !== 'overview') {
                setActiveTab(initialTab);
                setMobileView('content');
            } else {
                // Sincronizza con l'URL se non c'è initialTab
                setActiveTab(urlTab);
                if (urlTab !== 'overview_user') setMobileView('content');
            }
        }
    }, [isOpen, initialTab, urlTab]);

    // Data synchronization is handled internally by useUserDashboardData hook



    const onClaimRewardWrapper = (reward: any, isUnlocked: boolean) => {
        const success = handleClaimReward(reward, isUnlocked);
        if (success) {
             handleTabChange('wallet');
        }
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        if (isMobile) setMobileView('content');

        // AGGIORNAMENTO URL (Sincronizzato con V4 Canonical Builder)
        // Usiamo lo slug se disponibile per evitare flicker/redirect di normalizzazione
        const currentIdentifier = activeBusiness?.slug || activeBusinessId;
        const canonicalPath = router.buildDashboardPath(user.slug, currentIdentifier || undefined, tab);
        navigate(canonicalPath);
    };

    return createPortal(
        <div className="td-modal-overlay !p-0 md:!p-4 bg-black/60 backdrop-blur-sm" onClick={onClose} style={{ zIndex: Z_OVERLAY }}>
            <div 
                className="relative bg-[#020617] w-full max-w-5xl h-full md:h-[85vh] md:rounded-2xl border-0 md:border border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 pointer-events-auto"
                style={{ zIndex: Z_MODAL }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-[#0f172a] shrink-0">
                    <div className="flex items-center gap-3">
                         {isMobile && mobileView === 'content' && (
                             <button onClick={() => setMobileView('menu')} className="p-2 bg-slate-800 rounded-lg text-white mr-1 border border-slate-700">
                                 <ArrowLeft className="w-5 h-5"/>
                             </button>
                         )}

                        <div className={`p-2 rounded-xl ${isBusiness ? 'bg-emerald-900/20 text-emerald-500' : 'bg-indigo-900/20 text-indigo-500'}`}>{isBusiness ? <Briefcase className="w-6 h-6"/> : <User className="w-6 h-6"/>}</div>
                        <h2 className="text-xl font-bold text-white uppercase tracking-wider">{isBusiness ? 'Business Dashboard' : 'Profilo Utente'}</h2>
                    </div>
                    <div className="flex items-center gap-3">
                         {!isBusiness && (
                             <button onClick={() => openModal('upgrade')} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-lg animate-pulse hidden md:flex">
                                <Zap className="w-3 h-3 fill-current"/> Passa a Premium
                            </button>
                         )}
                        <CloseButton onClose={onClose} variant="primary" />
                    </div>
                </div>
                
                <div className="flex flex-1 overflow-hidden relative">
                    
                    <div className={`w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col absolute md:relative inset-0 z-dropdown transition-transform duration-300 ${isMobile && mobileView === 'content' ? '-translate-x-full' : 'translate-x-0'}`}>
                        <UserSidebar 
                            activeTab={activeTab} 
                            onTabChange={handleTabChange} 
                            isBusiness={isBusiness} 
                            unreadCount={unreadCount} 
                            onLogout={() => { if(onLogout) onLogout(); onClose(); }}
                            onClose={onClose}
                            hasActiveRequests={(sponsorRequests ?? []).length > 0}
                            unreadMessagesCount={unreadMessages}
                        />
                    </div>

                    <div className={`flex-1 bg-[#020617] overflow-y-auto custom-scrollbar absolute md:relative inset-0 z-floating-panel transition-transform duration-300 ${isMobile && mobileView !== 'content' ? 'translate-x-full' : 'translate-x-0'}`}>
                        {/* PADDING RIMOSSO PER MESSAGES TAB PER AVERE FULL HEIGHT */}
                        {/* PADDING RIMOSSO PER MESSAGES TAB PER AVERE FULL HEIGHT */}
                        <div className={`h-full ${activeTab === 'messages' ? 'p-0' : 'p-6 md:p-10'}`}>
                            
                            {/* PREMIUM BUSINESS SWITCHER (VISIBLE IN BIZ TABS) */}
                            {isBusiness && (activeTab === 'overview_biz' || activeTab === 'bottega' || activeTab === 'messages') && userBusinesses.length > 1 && (
                                <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                                    <div className="flex items-center justify-between mb-4 px-2">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Seleziona Attività</h4>
                                        <div className="h-px flex-1 bg-slate-800/50 mx-4"></div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {userBusinesses.map(biz => (
                                            <button 
                                                key={biz.id}
                                                onClick={() => {
                                                    const targetId = biz.slug || biz.id;
                                                    console.log('[UserDashboard] Switching to:', targetId);
                                                    switchBusiness(targetId);
                                                }}
                                                className={`
                                                    group relative flex items-center gap-4 p-4 rounded-3xl transition-all duration-500 border overflow-hidden
                                                    ${activeBusinessId === biz.id 
                                                        ? 'bg-indigo-600/10 border-indigo-500/50 shadow-2xl shadow-indigo-500/10' 
                                                        : 'bg-slate-900/40 border-slate-800/50 hover:border-slate-600/50 hover:bg-slate-800/40'
                                                    }
                                                `}
                                            >
                                                {/* Status Indicator Bar */}
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-500 ${activeBusinessId === biz.id ? 'bg-indigo-500 h-full' : 'bg-transparent h-0'}`}></div>

                                                <div className={`
                                                    relative flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500
                                                    ${activeBusinessId === biz.id 
                                                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 rotate-0' 
                                                        : 'bg-slate-800 text-slate-500 group-hover:text-indigo-400 group-hover:rotate-3'
                                                    }
                                                `}>
                                                    {biz.type === PLAN_TYPES.REGIONAL_ACTIVITY ? <Briefcase className="w-6 h-6"/> : <Store className="w-6 h-6"/>}
                                                </div>

                                                <div className="flex flex-col text-left overflow-hidden">
                                                    <span className={`text-sm font-black truncate transition-colors duration-300 ${activeBusinessId === biz.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                                        {biz.companyName || biz.resolvedData?.name || 'Attività'}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${biz.type === PLAN_TYPES.REGIONAL_ACTIVITY ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-800 text-slate-500'}`}>
                                                            {biz.type === PLAN_TYPES.REGIONAL_ACTIVITY ? 'GOLD' : (biz.type === PLAN_TYPES.LOCAL_ACTIVITY ? 'SILVER' : 'STANDARD')}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-slate-600 uppercase italic truncate">{biz.city || 'Campania'}</span>
                                                    </div>
                                                </div>

                                                {/* Active Checkmark */}
                                                {activeBusinessId === biz.id && (
                                                    <div className="ml-auto animate-in zoom-in duration-300">
                                                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                                            <Zap className="w-3 h-3 text-indigo-400 fill-current" />
                                                        </div>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {activeTab === 'overview_biz' && isBusiness && (
                                <div className="space-y-8 animate-in fade-in duration-500">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-3xl font-black text-white tracking-tight mb-2">Business Insights</h3>
                                            <p className="text-slate-400 font-medium">Monitora le performance della tua attività in tempo reale.</p>
                                        </div>
                                        <div className="hidden md:block">
                                            <span className="px-4 py-2 bg-indigo-600/20 text-indigo-400 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-500/30">Live Data</span>
                                        </div>
                                    </div>

                                    {/* STATS GRID */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Card 1: Prodotti */}
                                        <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 hover:border-indigo-500/50 transition-all group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-3 bg-blue-600/20 text-blue-500 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all"><ShoppingBag className="w-6 h-6"/></div>
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Inventario</span>
                                            </div>
                                            <div className="text-4xl font-black text-white mb-1">{bizStats?.totalProducts || 0}</div>
                                            <div className="text-sm text-slate-400 font-bold flex items-center gap-2">
                                                <span className="text-emerald-500">{bizStats?.activeProducts || 0}</span> prodotti visibili
                                            </div>
                                        </div>

                                        {/* Card 2: Reputazione */}
                                        <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 hover:border-amber-500/50 transition-all group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-3 bg-amber-600/20 text-amber-500 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-all"><Star className="w-6 h-6"/></div>
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reputazione</span>
                                            </div>
                                            <div className="text-4xl font-black text-white mb-1">{bizStats?.rating?.toFixed(1) || '0.0'}</div>
                                            <div className="text-sm text-slate-400 font-bold flex items-center gap-2">
                                                Su <span className="text-white">{bizStats?.reviewsCount || 0}</span> recensioni totali
                                            </div>
                                        </div>

                                        {/* Card 3: Engagement (Placeholder per ora) */}
                                        <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 hover:border-indigo-500/50 transition-all group relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-2"><div className="text-[8px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Prossimamente</div></div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-3 bg-indigo-600/20 text-indigo-500 rounded-2xl"><TrendingUp className="w-6 h-6"/></div>
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Engagement</span>
                                            </div>
                                            <div className="text-4xl font-black text-white/20 mb-1">--</div>
                                            <div className="text-sm text-slate-600 font-bold">Analytics in fase di attivazione</div>
                                        </div>
                                    </div>

                                    {/* INFO BOX */}
                                    <div className="p-6 bg-indigo-600/10 rounded-3xl border border-indigo-500/20 flex flex-col md:flex-row items-center gap-6">
                                        <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-900/40"><BarChart3 className="w-8 h-8"/></div>
                                        <div>
                                            <h4 className="text-lg font-black text-white mb-1 uppercase tracking-tight">Potenzia la tua visibilità</h4>
                                            <p className="text-slate-400 text-sm leading-relaxed">Le statistiche di visualizzazione e i preferiti verranno attivati non appena il tuo profilo supererà le soglie di interazione previste dal tuo tier.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'bottega' && isBusiness && ( isLoading ? <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-4"><Loader2 className="w-10 h-10 animate-spin text-indigo-500"/><p>Caricamento bottega...</p></div> : myShop ? <BusinessShopManager shop={myShop} onUpdate={refreshData}/> : <div className="text-center py-20 text-slate-500">Configura la tua vetrina.</div>)}
                            
                            {activeTab === 'overview_user' && (
                                <UserOverviewTab 
                                    user={user}
                                    currentLevel={currentLevel}
                                    currentXP={currentXP}
                                    progress={progress}
                                    catalogRewards={catalogRewards}
                                    myRewards={myRewards}
                                    onClaimReward={onClaimRewardWrapper}
                                    suggestions={suggestions}
                                    onClose={onClose}
                                />
                            )}

                            {(activeTab === 'trips' || activeTab === 'suitcases') && (
                                <div className="animate-in fade-in duration-300">
                                    {activeTab === 'trips' && <UserTripsTab onClose={onClose} />}
                                    {activeTab === 'suitcases' && <UserSuitcasesTab user={user} />}
                                </div>
                            )}

                            {activeTab === 'referral' && (
                                <UserReferralTab 
                                    user={user} 
                                    onUpdateUser={refreshData}
                                    onSwitchToOverview={() => handleTabChange('overview_user')} 
                                    />
                            )}

                            {activeTab === 'wallet' && (
                                <UserWalletTab 
                                    rewards={myRewards} 
                                    onMarkUsed={handleMarkUsed}
                                />
                            )}
                            
                            {activeTab === 'messages' && (
                                <UserMessagesTab 
                                    user={user}
                                    requests={sponsorRequests}
                                    onRefresh={refreshData}
                                />
                            )}

                            {activeTab === 'notifications' && (
                                <UserNotificationsTab 
                                    userId={user.id}
                                    notifications={notifications}
                                    unreadCount={unreadCount}
                                    onNavigate={onNavigate}
                                    onClose={onClose}
                                    setNotifications={setNotifications}
                                    setUnreadCount={setUnreadCount}
                                />
                            )}

                            {activeTab === 'settings' && <UserSettingsTab />}

                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
