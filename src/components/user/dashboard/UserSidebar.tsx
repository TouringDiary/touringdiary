
import React from 'react';
import { User, Bell, Wallet, BarChart3, Store, Settings, LogOut, Users, MessageSquare, Briefcase, Map } from 'lucide-react';
import { useBusinessContext } from '@/context/BusinessContext';
import { CountBadge } from '@/components/ui/CountBadge';

interface Props {
    activeTab: string;
    onTabChange: (tab: string) => void;
    isBusiness: boolean;
    unreadCount: number;
    onLogout: () => void;
    onClose: () => void;
    hasActiveRequests?: boolean; // NEW PROP
    unreadMessagesCount?: number; // NEW PROP
}

export const UserSidebar = ({ activeTab, onTabChange, isBusiness, unreadCount, onLogout, onClose, hasActiveRequests, unreadMessagesCount = 0 }: Props) => {
    const { activeBusinessId, userBusinesses, switchBusiness } = useBusinessContext();
    return (
        <div className="flex flex-col p-4 space-y-2 h-full overflow-y-auto custom-scrollbar">
            {/* SEZIONE 1: UTENTE BASE */}
            <button onClick={() => onTabChange('overview_user')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-bold text-lg transition-all ${activeTab === 'overview_user' ? 'bg-slate-800 text-white shadow-md border border-slate-700' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                <User className="w-5 h-5"/> Il Mio Profilo
            </button>
            
            <button onClick={() => onTabChange('trips')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-bold text-lg transition-all ${activeTab === 'trips' ? 'bg-slate-800 text-white shadow-md border border-slate-700' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                <Map className="w-5 h-5"/> I Miei Viaggi
            </button>
            
            <button onClick={() => onTabChange('suitcases')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-bold text-lg transition-all ${activeTab === 'suitcases' ? 'bg-slate-800 text-white shadow-md border border-slate-700' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                <Briefcase className="w-5 h-5"/> Le mie Valigie
            </button>
            
            <button onClick={() => onTabChange('notifications')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between font-bold text-lg transition-all ${activeTab === 'notifications' ? 'bg-slate-800 text-white shadow-md border border-slate-700' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                <div className="flex items-center gap-3"><Bell className="w-5 h-5"/> Notifiche</div>
                {unreadCount > 0 && <CountBadge count={unreadCount} size="md" variant="red" shape="pill" />}
            </button>
            
            <button onClick={() => onTabChange('wallet')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-bold text-lg transition-all ${activeTab === 'wallet' ? 'bg-slate-800 text-white shadow-md border border-slate-700' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                <Wallet className="w-5 h-5"/> Il mio Wallet
            </button>

            <button onClick={() => onTabChange('referral')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-bold text-lg transition-all ${activeTab === 'referral' ? 'bg-indigo-600 text-white shadow-md border border-indigo-500' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                <Users className="w-5 h-5"/> Porta un Amico
            </button>

            <div className="h-px bg-slate-800 my-2"></div>

            {/* SEZIONE 2: BUSINESS (SOLO SE RUOLO BUSINESS) */}
            {isBusiness && (
                <div className="space-y-4 pt-2">
                    {/* MINIMAL BUSINESS HEADER */}
                    <div className="px-1 mb-2">
                        <div className="flex items-center justify-between px-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Le Tue Attività</label>
                            {userBusinesses.length > 1 && (
                                <CountBadge count={userBusinesses.length} size="sm" variant="neutral" shape="pill" className="text-indigo-400 border border-slate-700 bg-slate-800" />
                            )}
                        </div>
                    </div>

                    <button onClick={() => onTabChange('overview_biz')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-bold text-lg transition-all ${activeTab === 'overview_biz' ? 'bg-indigo-600 text-white shadow-md border border-indigo-500' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                        <BarChart3 className="w-5 h-5"/> Business Stats
                    </button>
                    <button onClick={() => onTabChange('bottega')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-bold text-lg transition-all ${activeTab === 'bottega' ? 'bg-indigo-600 text-white shadow-md border border-indigo-500' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                        <Store className="w-5 h-5"/> La Mia Bottega
                    </button>
                </div>
            )}

            {/* SEZIONE SUPPORTO PARTNER (Visibile se Business O ha richieste attive) */}
            {(isBusiness || hasActiveRequests) && (
                <>
                    {!isBusiness && <div className="h-px bg-slate-800 my-2"></div>}
                    <button onClick={() => onTabChange('messages')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between font-bold text-lg transition-all ${activeTab === 'messages' ? 'bg-blue-600 text-white shadow-md border border-blue-500' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                         <div className="flex items-center gap-3"><MessageSquare className="w-5 h-5"/> Supporto Partner</div>
                         {unreadMessagesCount > 0 && <CountBadge count={unreadMessagesCount} size="md" variant="rose-500" shape="pill" pulse />}
                    </button>
                    <div className="h-px bg-slate-800 my-2"></div>
                </>
            )}
            
            {/* SEZIONE 3: SETTINGS & EXIT */}
            <button onClick={() => onTabChange('settings')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-bold text-lg transition-all ${activeTab === 'settings' ? 'bg-slate-800 text-white shadow-md border border-slate-700' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                <Settings className="w-5 h-5"/> Impostazioni
            </button>
            <div className="mt-auto pt-4 border-t border-slate-800">
                <button onClick={() => { onLogout(); onClose(); }} className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-bold text-red-400 hover:bg-slate-800 transition-colors">
                    <LogOut className="w-5 h-5"/> Log Out
                </button>
            </div>
        </div>
    );
};
