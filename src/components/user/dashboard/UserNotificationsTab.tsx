
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, MessageCircle, Info, ArrowRight } from 'lucide-react';
import { AppNotification } from '../../../types/index';
import { markAsRead, markAllAsRead, fetchNotificationsAsync } from '../../../services/notificationService'; // IMPORT FETCH ASYNC

interface Props {
    userId: string;
    notifications: AppNotification[];
    unreadCount: number;
    onNavigate: (section: any, tab?: string, id?: string, extra?: any) => void;
    onClose: () => void;
    setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
    setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

export const UserNotificationsTab = ({ userId, notifications, unreadCount, onNavigate, onClose, setNotifications, setUnreadCount }: Props) => {
    const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);

    // FETCH REAL DATA ON MOUNT
    useEffect(() => {
        const load = async () => {
             const data = await fetchNotificationsAsync(userId);
             setNotifications(data);
             setUnreadCount(data.filter(n => !n.isRead).length);
        };
        load();
        
        // Polling leggero ogni 30 sec per nuovi messaggi
        const interval = setInterval(load, 30000);
        return () => clearInterval(interval);
    }, [userId]);

    const handleNotificationClick = async (notif: AppNotification) => {
        await markAsRead(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        setSelectedNotification(notif);
    };

    const handleMarkAllRead = async () => {
        await markAllAsRead(userId);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
    };

    const handleNotifAction = (notif: AppNotification) => {
        if (notif.linkData) {
            const { section, tab, targetId, poiId } = notif.linkData;
            onNavigate(section, tab, targetId, poiId ? { poiId } : undefined);
            onClose();
        }
    };

    if (selectedNotification) return (
        <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
                <button onClick={() => setSelectedNotification(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"><ArrowLeft className="w-6 h-6"/></button>
                <h3 className="text-2xl font-bold text-white">Dettaglio Messaggio</h3>
            </div>
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-1 block">{selectedNotification.type.replace('_', ' ')}</span>
                        <h4 className="text-3xl font-display font-bold text-white leading-tight">{selectedNotification.title}</h4>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">{new Date(selectedNotification.date).toLocaleString()}</span>
                </div>
                <p className="text-slate-300 text-lg leading-relaxed whitespace-pre-wrap">{selectedNotification.message}</p>
                {selectedNotification.linkData && (
                    <div className="pt-6 border-t border-slate-800 flex justify-end">
                        <button onClick={() => handleNotifAction(selectedNotification)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95">Vai alla sezione <ArrowRight className="w-5 h-5"/></button>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3"><Bell className="w-6 h-6 text-indigo-500"/> Centro Notifiche</h3>
                    <p className="text-slate-500 text-sm">Aggiornamenti e avvisi dalla community.</p>
                </div>
                {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs font-bold text-indigo-400 hover:text-white uppercase tracking-widest transition-colors">Segna tutte come lette</button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-600 italic bg-slate-900/20 rounded-2xl border border-slate-800 border-dashed">
                        <Bell className="w-12 h-12 opacity-10 mb-3"/>
                        <p>Ancora nessuna notifica per te.</p>
                    </div>
                ) : (
                    notifications.map(notif => (
                        <div key={notif.id} onClick={() => handleNotificationClick(notif)} className={`p-5 rounded-2xl border transition-all cursor-pointer group flex items-start gap-4 ${notif.isRead ? 'bg-slate-900/50 border-slate-800 opacity-70' : 'bg-slate-900 border-indigo-500/30 shadow-lg hover:border-indigo-500/60'}`}>
                            <div className={`p-2.5 rounded-xl shrink-0 ${notif.isRead ? 'bg-slate-800 text-slate-600' : 'bg-indigo-600 text-white shadow-lg'}`}>
                                {notif.type === 'reply_qa' ? <MessageCircle className="w-5 h-5"/> : <Info className="w-5 h-5"/>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className={`font-bold text-lg truncate pr-4 ${notif.isRead ? 'text-slate-400' : 'text-white'}`}>{notif.title}</h4>
                                    {!notif.isRead && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)] shrink-0"></div>}
                                </div>
                                <p className={`text-sm line-clamp-2 leading-relaxed ${notif.isRead ? 'text-slate-500' : 'text-slate-400'}`}>{notif.message}</p>
                                <div className="flex items-center gap-3 mt-3">
                                    <span className="text-[10px] text-slate-600 font-mono uppercase">{new Date(notif.date).toLocaleDateString()}</span>
                                    {notif.linkData && <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest group-hover:translate-x-1 transition-transform flex items-center gap-1">Vedi <ArrowRight className="w-3 h-3"/></span>}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
