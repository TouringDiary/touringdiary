
import React from 'react';
import { User, Bell, Wallet, BarChart3, Store, Settings, LogOut, Users, MessageSquare } from 'lucide-react';

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
    return (
        <div className="flex flex-col p-4 space-y-2 h-full overflow-y-auto custom-scrollbar">
            {/* SEZIONE 1: UTENTE BASE */}
            <button onClick={() => onTabChange('overview_user')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-bold text-lg transition-all ${activeTab === 'overview_user' ? 'bg-slate-800 text-white shadow-md border border-slate-700' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                <User className="w-5 h-5"/> Il Mio Profilo
            </button>
            
            <button onClick={() => onTabChange('notifications')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between font-bold text-lg transition-all ${activeTab === 'notifications' ? 'bg-slate-800 text-white shadow-md border border-slate-700' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                <div className="flex items-center gap-3"><Bell className="w-5 h-5"/> Notifiche</div>
                {unreadCount > 0 && <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-black shadow-sm">{unreadCount}</span>}
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
                <>
                    <button onClick={() => onTabChange('overview_biz')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-bold text-lg transition-all ${activeTab === 'overview_biz' ? 'bg-indigo-600 text-white shadow-md border border-indigo-500' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                        <BarChart3 className="w-5 h-5"/> Business Stats
                    </button>
                    <button onClick={() => onTabChange('bottega')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-bold text-lg transition-all ${activeTab === 'bottega' ? 'bg-indigo-600 text-white shadow-md border border-indigo-500' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                        <Store className="w-5 h-5"/> La Mia Bottega
                    </button>
                </>
            )}

            {/* SEZIONE SUPPORTO PARTNER (Visibile se Business O ha richieste attive) */}
            {(isBusiness || hasActiveRequests) && (
                <>
                    {!isBusiness && <div className="h-px bg-slate-800 my-2"></div>}
                    <button onClick={() => onTabChange('messages')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between font-bold text-lg transition-all ${activeTab === 'messages' ? 'bg-blue-600 text-white shadow-md border border-blue-500' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                         <div className="flex items-center gap-3"><MessageSquare className="w-5 h-5"/> Supporto Partner</div>
                         {unreadMessagesCount > 0 && <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-black animate-pulse shadow-sm">{unreadMessagesCount}</span>}
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
