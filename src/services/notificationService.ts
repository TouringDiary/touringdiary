
import { AppNotification, NotificationType } from '../types/index';
import { supabase } from './supabaseClient';
import { Database } from '../types/supabase';

// Mock iniziale (legacy support for guest/first run)
const MOCK_NOTIFICATIONS: AppNotification[] = [
    {
        id: 'notif_welcome',
        userId: 'u_user_1',
        type: 'system',
        title: 'Benvenuto in Community!',
        message: 'Siamo felici di averti qui! Esplora la sezione Q&A, condividi i tuoi scatti e crea il tuo primo itinerario.',
        date: new Date().toISOString(),
        isRead: false,
        linkData: {
            section: 'community',
            tab: 'qa'
        }
    }
];

// Helper Regex UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Cache locale per ridurre chiamate (opzionale, per ora diretta)
let notificationsCache: AppNotification[] = [];

export const getNotifications = (userId: string): AppNotification[] => {
    // Nota: Questa funzione ora è sincrona per compatibilità con i componenti esistenti,
    // ma dovrebbe essere usata in combinazione con un fetch asincrono (es. useEffect)
    // Se la cache è vuota, restituisce array vuoto o mock finché non arriva il dato dal DB.
    if (!userId || userId === 'guest') return [];
    
    // Filtra la cache locale se popolata
    const userNotifs = notificationsCache.filter(n => n.userId === userId);
    if (userNotifs.length > 0) return userNotifs;
    
    return userId === 'u_user_1' ? MOCK_NOTIFICATIONS : [];
};

// Funzione ASINCRONA per recuperare dal DB (da usare in useEffect nei componenti)
export const fetchNotificationsAsync = async (userId: string): Promise<AppNotification[]> => {
    // SECURITY FIX: UUID CHECK
    if (!userId || userId === 'guest' || !UUID_REGEX.test(userId)) return [];
    
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });
            
        if (error) throw error;
        
        const mapped = (data as any[]).map(n => ({
            id: n.id,
            userId: n.user_id,
            type: n.type as NotificationType,
            title: n.title,
            message: n.message,
            date: n.date,
            isRead: n.is_read,
            linkData: n.link_data
        }));
        
        // Aggiorna cache globale
        notificationsCache = [...notificationsCache.filter(n => n.userId !== userId), ...mapped];
        
        return mapped;
    } catch (e) {
        console.error("Error fetching notifications:", e);
        return [];
    }
};

export const getUnreadCount = (userId: string): number => {
    const notifs = getNotifications(userId);
    return notifs.filter(n => !n.isRead).length;
};

export const markAsRead = async (notificationId: string): Promise<void> => {
    // Aggiornamento ottimistico locale
    notificationsCache = notificationsCache.map(n => n.id === notificationId ? { ...n, isRead: true } : n);
    
    // Aggiornamento DB
    try {
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);
    } catch (e) {
        console.error("Error marking notification read:", e);
    }
};

export const markAllAsRead = async (userId: string): Promise<void> => {
    // Aggiornamento ottimistico locale
    notificationsCache = notificationsCache.map(n => n.userId === userId ? { ...n, isRead: true } : n);
    
    // Aggiornamento DB
    try {
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId);
    } catch (e) {
        console.error("Error marking all read:", e);
    }
};

export const addNotification = async (
    userId: string, 
    type: NotificationType, 
    title: string, 
    message: string, 
    linkData?: AppNotification['linkData']
): Promise<void> => {
    if (!userId || userId === 'guest') return;

    const newNotif = {
        user_id: userId,
        type,
        title,
        message,
        date: new Date().toISOString(),
        is_read: false,
        link_data: linkData || null
    };

    // Scrittura DB
    try {
        const { data, error } = await supabase
            .from('notifications')
            .insert(newNotif)
            .select()
            .single();
            
        if (error) throw error;
        
        // Aggiorna cache se successo
        if (data) {
             const mapped: AppNotification = {
                id: data.id,
                userId: data.user_id,
                type: data.type as NotificationType,
                title: data.title,
                message: data.message,
                date: data.date,
                isRead: data.is_read,
                linkData: data.link_data
            };
            notificationsCache = [mapped, ...notificationsCache];
        }
    } catch (e) {
        console.error("Error sending notification:", e);
    }
};
