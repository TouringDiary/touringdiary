
import React, { useState, useEffect } from 'react';
import { X, Briefcase, User, ArrowLeft, Loader2, Zap } from 'lucide-react';
import { User as UserType, CitySummary } from '../../types/index';
import { useItinerary } from '../../context/ItineraryContext';
import { BusinessShopManager } from './BusinessShopManager';
import { getCurrentLevel, getNextLevelProgress } from '../../services/gamificationService';
import { useUserDashboardData } from '../../hooks/useUserDashboardData';
import { useModal } from '../../context/ModalContext';

// Sub-components
import { UserSidebar } from './dashboard/UserSidebar';
import { UserOverviewTab } from './dashboard/UserOverviewTab';
import { UserWalletTab } from './dashboard/UserWalletTab';
import { UserSettingsTab } from './dashboard/UserSettingsTab';
import { UserNotificationsTab } from './dashboard/UserNotificationsTab';
import { UserReferralTab } from './dashboard/UserReferralTab';
import { UserMessagesTab } from './dashboard/UserMessagesTab'; // NEW IMPORT

interface Props {
    isOpen: boolean;
    onClose: () => void;
    user: UserType;
    onNavigate: (section: 'community' | 'trips' | 'rewards' | 'profile' | 'city', tab?: string, id?: string, extra?: any) => void; 
    initialTab?: string;
    onLogout?: () => void;
    cityManifest?: CitySummary[];
}

export const UserDashboard = ({ isOpen, onClose, user, onNavigate, initialTab, onLogout }: Props) => {
    if (!user || user.role === 'guest') return null;

    const isBusiness = user.role === 'business';
    const [activeTab, setActiveTab] = useState<string>('overview_user'); 
    const [expandedSection, setExpandedSection] = useState<'none' | 'trips' | 'reports'>('none');
    
    // NEW: Mobile View State
    const [mobileView, setMobileView] = useState<'menu' | 'content'>('menu');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const { openModal } = useModal();
    const { savedProjects, loadProject } = useItinerary();
    
    // CUSTOM HOOK: Data Management
    const { 
        myShop, bizStats, suggestions, catalogRewards, myRewards, notifications, unreadCount, 
        sponsorRequests, // NEW DATA
        isLoading,
        refreshData, handleClaimReward, handleMarkUsed, setNotifications, setUnreadCount
    } = useUserDashboardData(user);

    // Calc unread messages
    const unreadMessages = sponsorRequests.reduce((sum, req) => sum + (req.partnerLogs?.filter(l => l.direction === 'outbound' && l.isUnread).length || 0), 0);

    // GAMIFICATION CALCULATIONS
    const currentXP = user.xp || 0;
    const currentLevel = getCurrentLevel(currentXP);
    const progress = getNextLevelProgress(currentXP);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (isOpen) {
            refreshData(); // Force refresh on open
            if (initialTab && initialTab !== 'overview') {
                setActiveTab(initialTab);
                setMobileView('content');
            } else {
                setActiveTab('overview_user');
                setMobileView(isMobile ? 'menu' : 'content');
            }
        }
    }, [isOpen, initialTab, refreshData, isMobile]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                if (expandedSection !== 'none') setExpandedSection('none');
                else if (isMobile && mobileView === 'content') setMobileView('menu');
                else onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, expandedSection, isMobile, mobileView]);

    const onClaimRewardWrapper = (reward: any, isUnlocked: boolean) => {
        const success = handleClaimReward(reward, isUnlocked);
        if (success) {
             setActiveTab('wallet');
             setMobileView('content');
        }
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setExpandedSection('none');
        if (isMobile) setMobileView('content');
    };

    // Render Expanded Section (Trips/Reports)
    const renderExpandedSection = () => {
        if (expandedSection === 'trips') return (
            <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
                    <button onClick={() => setExpandedSection('none')} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"><ArrowLeft className="w-6 h-6"/></button>
                    <h3 className="text-2xl font-bold text-white">I Miei Viaggi Salvati</h3>
                </div>
                <div className="space-y-3 overflow-y-auto custom-scrollbar">
                    {savedProjects.map(proj => (
                        <div key={proj.id} onClick={() => { loadProject(proj); onClose(); }} className="group flex justify-between items-center p-5 bg-slate-900 rounded-xl border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer">
                            <div><h4 className="font-bold text-white text-lg group-hover:text-amber-400 transition-colors mb-1">{proj.name || 'Senza Nome'}</h4><div className="text-sm text-slate-400">{new Date(proj.createdAt).toLocaleDateString()} • {proj.items.length} tappe</div></div>
                        </div>
                    ))}
                    {savedProjects.length === 0 && <div className="py-20 text-center text-slate-500 italic">Ancora nessun viaggio nel tuo diario.</div>}
                </div>
            </div>
        );
        return null;
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-0 md:p-4 pt-0 md:pt-24">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-[#020617] w-full max-w-5xl h-full md:h-[85vh] md:rounded-2xl border-0 md:border border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
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
                        <button onClick={onClose} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"><X className="w-6 h-6"/></button>
                    </div>
                </div>
                
                <div className="flex flex-1 overflow-hidden relative">
                    
                    <div className={`w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col absolute md:relative inset-0 z-20 transition-transform duration-300 ${isMobile && mobileView === 'content' ? '-translate-x-full' : 'translate-x-0'}`}>
                        <UserSidebar 
                            activeTab={activeTab} 
                            onTabChange={handleTabChange} 
                            isBusiness={isBusiness} 
                            unreadCount={unreadCount} 
                            onLogout={() => { if(onLogout) onLogout(); onClose(); }}
                            onClose={onClose}
                            hasActiveRequests={sponsorRequests.length > 0}
                            unreadMessagesCount={unreadMessages}
                        />
                    </div>

                    <div className={`flex-1 bg-[#020617] overflow-y-auto custom-scrollbar absolute md:relative inset-0 z-10 transition-transform duration-300 ${isMobile && mobileView !== 'content' ? 'translate-x-full' : 'translate-x-0'}`}>
                        {/* PADDING RIMOSSO PER MESSAGES TAB PER AVERE FULL HEIGHT */}
                        <div className={`h-full ${activeTab === 'messages' ? 'p-0' : 'p-6 md:p-10'}`}>
                            
                            {activeTab === 'bottega' && isBusiness && ( isLoading ? <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-4"><Loader2 className="w-10 h-10 animate-spin text-indigo-500"/><p>Caricamento bottega...</p></div> : myShop ? <BusinessShopManager shop={myShop} onUpdate={refreshData}/> : <div className="text-center py-20 text-slate-500">Configura la tua vetrina.</div>)}
                            
                            {activeTab === 'overview_user' && (expandedSection !== 'none' ? renderExpandedSection() : (
                                <UserOverviewTab 
                                    user={user}
                                    currentLevel={currentLevel}
                                    currentXP={currentXP}
                                    progress={progress}
                                    catalogRewards={catalogRewards}
                                    myRewards={myRewards}
                                    onClaimReward={onClaimRewardWrapper}
                                    savedProjects={savedProjects}
                                    onLoadProject={(p) => { loadProject(p); onClose(); }}
                                    suggestions={suggestions}
                                    onExpandSection={setExpandedSection}
                                    onClose={onClose}
                                />
                            ))}

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
        </div>
    );
};
