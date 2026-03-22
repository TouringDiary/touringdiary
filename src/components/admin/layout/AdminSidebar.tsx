
import React from 'react';
import { Lock, LayoutDashboard, Settings, CalendarDays, Map, Store, TrendingUp, Type, Palette, Lightbulb, FileText, Trophy, Camera, Newspaper, Megaphone, Users, ArrowLeft, Brush, Image as ImageIcon, Microscope, Database, Download } from 'lucide-react';
import { User } from '../../../types/users';
import { getRoleLabel } from '../../../services/userService';
import { useAdminStyles } from '../../../hooks/useAdminStyles';

interface AdminSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    activeView: string;
    onNavigate: (view: any) => void;
    onBack: () => void;
    currentUser: User;
    counts: {
        sponsors: number;
        suggestions: number;
        reviews: number;
        photos: number;
    };
    editingCityId: string | null;
}

// Sub-component locale per raggruppare le voci
const NavGroup = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="mb-4 px-3">
        <h3 className="px-2 text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1.5 opacity-90 select-none">{title}</h3>
        <div className="space-y-0.5">
            {children}
        </div>
    </div>
);

export const AdminSidebar = ({ 
    isOpen, 
    onClose, 
    activeView, 
    onNavigate, 
    onBack, 
    currentUser, 
    counts, 
    editingCityId 
}: AdminSidebarProps) => {
    
    const { styles } = useAdminStyles();
    
    const displayName = currentUser.name;
    const displayRole = getRoleLabel(currentUser.role);
    const displayInitial = displayName.charAt(0).toUpperCase();
    const isSuperAdmin = currentUser.role === 'admin_all';

    const NavItem = ({ id, label, icon: Icon, active, badgeCount }: { id: string, label: string, icon: any, active: boolean, badgeCount?: number }) => (
        <button 
            onClick={() => { onNavigate(id); }} 
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${active ? 'bg-indigo-600 text-white shadow-md font-bold text-sm' : `${styles.admin_sidebar_link} hover:bg-slate-800 hover:text-white`}`}
        >
            <div className="flex items-center gap-3">
                <Icon className="w-4 h-4"/> 
                <span>{label}</span>
            </div>
            {badgeCount && badgeCount > 0 ? (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-sm animate-pulse ${id === 'sponsors' ? 'bg-red-600 text-white ring-2 ring-red-400' : 'bg-rose-600 text-white'}`}>
                    {badgeCount > 99 ? '9+' : badgeCount}
                </span>
            ) : null}
        </button>
    );

    return (
        <>
             {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/80 z-30 backdrop-blur-sm md:hidden animate-in fade-in"
                    onClick={onClose}
                ></div>
            )}

            <div className={`
                fixed inset-y-0 left-0 z-40 w-64 bg-[#0b0f1a] border-r border-slate-800 flex flex-col h-full shadow-2xl transition-transform duration-300 ease-in-out
                md:relative md:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-4 border-b border-slate-800 bg-[#020617] shrink-0">
                    <div className="flex items-center gap-2.5 mb-4 select-none">
                        <div className="p-1.5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg shadow-lg">
                            <Lock className="w-4 h-4 text-white"/>
                        </div>
                        <div>
                            <h2 className="text-sm font-display font-bold text-white uppercase tracking-wider leading-none">Admin Panel</h2>
                            <p className="text-[10px] text-slate-500 font-bold mt-0.5">Touring Diary v3.5</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-lg border border-indigo-400">
                            {displayInitial}
                        </div>
                        <div className="min-w-0">
                            <p className="text-white font-bold text-xs truncate leading-tight" title={displayName}>{displayName}</p>
                            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-wider truncate">{displayRole}</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-2 overflow-y-auto custom-scrollbar">
                    
                    <NavGroup title="Territorio">
                        <NavItem id="osm_import" label="Manager & Import POI" icon={Download} active={activeView === 'osm_import' && !editingCityId} />
                        <NavItem id="cities" label="Manager POI - DB" icon={Database} active={activeView === 'cities' || !!editingCityId} />
                        <NavItem id="events_global" label="Eventi Globali" icon={CalendarDays} active={activeView === 'events_global' && !editingCityId} />
                        <NavItem id="itineraries" label="Itinerari & Recensioni" icon={Map} active={activeView === 'itineraries' && !editingCityId} badgeCount={counts.reviews} />
                    </NavGroup>

                    <NavGroup title="Business">
                        <NavItem id="sponsors" label="Attività & Sponsor" icon={Store} active={activeView === 'sponsors' && !editingCityId} badgeCount={counts.sponsors} />
                        <NavItem id="marketing" label="Listini & Marketing" icon={TrendingUp} active={activeView === 'marketing' && !editingCityId} />
                        <NavItem id="social_studio" label="Social Studio" icon={Brush} active={activeView === 'social_studio' && !editingCityId} />
                    </NavGroup>

                    <NavGroup title="Sistema">
                        {isSuperAdmin && (
                            <NavItem id="settings" label="Impostazioni Globali" icon={Settings} active={activeView === 'settings' && !editingCityId} />
                        )}
                        <NavItem id="design_assets" label="Asset Globali" icon={Palette} active={activeView === 'design_assets' && !editingCityId} />
                        <NavItem id="tips" label="Loading Tips" icon={Lightbulb} active={activeView === 'tips' && !editingCityId} />
                        <NavItem id="assets" label="Libreria Media" icon={ImageIcon} active={activeView === 'assets' && !editingCityId} />
                    </NavGroup>
                    
                    <NavGroup title="Community">
                        <NavItem id="suggestions" label="Segnalazioni" icon={FileText} active={activeView === 'suggestions' && !editingCityId} badgeCount={counts.suggestions} />
                        <NavItem id="gamification" label="Gamification" icon={Trophy} active={activeView === 'gamification' && !editingCityId} />
                        <NavItem id="photos" label="Foto & Moderazione" icon={Camera} active={activeView === 'photos' && !editingCityId} badgeCount={counts.photos} />
                        <NavItem id="ticker" label="News Ticker" icon={Newspaper} active={activeView === 'ticker' && !editingCityId} />
                        <NavItem id="comms" label="Comunicazioni" icon={Megaphone} active={activeView === 'comms' && !editingCityId} />
                    </NavGroup>

                </nav>
                
                <div className="p-3 border-t border-slate-800 bg-[#020617] mt-auto shrink-0 space-y-1">
                    
                    <button 
                        onClick={() => onNavigate('dashboard')} 
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all font-bold text-xs ${activeView === 'dashboard' && !editingCityId ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <span className="flex items-center gap-2"><LayoutDashboard className="w-4 h-4"/> Dashboard Generale</span>
                    </button>

                    <button 
                        onClick={() => onNavigate('users')} 
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all font-bold text-xs ${activeView === 'users' ? 'bg-pink-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <span className="flex items-center gap-2"><Users className="w-4 h-4"/> Utenti & Ruoli</span>
                    </button>
                    
                    <button onClick={onBack} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white transition-all font-bold text-[10px] group uppercase tracking-widest">
                        <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform"/> Torna all'App
                    </button>
                </div>
            </div>
        </>
    );
};
