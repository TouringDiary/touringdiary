import type { DatabaseNotificationInsert } from '../types/database';
import type { AppNotification, NotificationType } from '../types/index';
import type { Database } from '../types/supabase';
import { supabase } from './supabaseClient';

type NotificationRow = Database['public']['Tables']['notifications']['Row'];

// Helper Regex UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Cache locale per utente (popolata da fetchNotificationsAsync / mutazioni). */
let notificationsCache: AppNotification[] = [];

/** Evento DOM: badge Header / listener devono rinfrescare il conteggio locale. */
export const NOTIFICATIONS_CHANGED_EVENT = 'touringdiary:notifications-changed';

const emitNotificationsChanged = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
};

const mapNotificationRow = (row: NotificationRow): AppNotification => {
  const mapped: AppNotification = {
    id: row.id,
    userId: row.user_id,
    type: row.type as NotificationType,
    title: row.title,
    message: row.message,
    date: row.date,
    isRead: row.is_read,
  };

  if (row.link_data != null && typeof row.link_data === 'object' && !Array.isArray(row.link_data)) {
    mapped.linkData = row.link_data as AppNotification['linkData'];
  }

  return mapped;
};

/**
 * Lettura sincrona dalla cache locale (dopo fetch/mutazioni).
 * Nessun mock: se la cache non ha ancora dati per l'utente, restituisce [].
 */
export const getNotifications = (userId: string): AppNotification[] => {
  if (!userId || userId === 'guest') return [];
  return notificationsCache.filter((n) => n.userId === userId);
};

/** Recupero notifiche reali da Supabase; aggiorna la cache per userId. */
export const fetchNotificationsAsync = async (userId: string): Promise<AppNotification[]> => {
  if (!userId || userId === 'guest' || !UUID_REGEX.test(userId)) return [];

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;

    const rows: NotificationRow[] = data ?? [];
    const mapped = rows.map(mapNotificationRow);

    notificationsCache = [...notificationsCache.filter((n) => n.userId !== userId), ...mapped];
    emitNotificationsChanged();

    return mapped;
  } catch (e) {
    console.error('Error fetching notifications:', e);
    return [];
  }
};

export const getUnreadCount = (userId: string): number => {
  return getNotifications(userId).filter((n) => !n.isRead).length;
};

export const markAsRead = async (notificationId: string): Promise<void> => {
  const previous = notificationsCache.find((n) => n.id === notificationId);
  notificationsCache = notificationsCache.map((n) =>
    n.id === notificationId ? { ...n, isRead: true } : n,
  );
  emitNotificationsChanged();

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    if (previous) {
      notificationsCache = notificationsCache.map((n) =>
        n.id === notificationId ? { ...n, isRead: previous.isRead } : n,
      );
      emitNotificationsChanged();
    }
    console.error('Error marking notification read:', error);
    throw error;
  }
};

/** Riporta una notifica a non letta (stesso cache + evento + colonna `is_read` già esistenti). */
export const markAsUnread = async (notificationId: string): Promise<void> => {
  const previous = notificationsCache.find((n) => n.id === notificationId);
  notificationsCache = notificationsCache.map((n) =>
    n.id === notificationId ? { ...n, isRead: false } : n,
  );
  emitNotificationsChanged();

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: false })
    .eq('id', notificationId);

  if (error) {
    if (previous) {
      notificationsCache = notificationsCache.map((n) =>
        n.id === notificationId ? { ...n, isRead: previous.isRead } : n,
      );
      emitNotificationsChanged();
    }
    console.error('Error marking notification unread:', error);
    throw error;
  }
};

export const markAllAsRead = async (userId: string): Promise<void> => {
  const previousById = new Map(notificationsCache.map((n) => [n.id, n.isRead]));
  notificationsCache = notificationsCache.map((n) =>
    n.userId === userId ? { ...n, isRead: true } : n,
  );
  emitNotificationsChanged();

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId);

  if (error) {
    notificationsCache = notificationsCache.map((n) => {
      const prev = previousById.get(n.id);
      return prev === undefined ? n : { ...n, isRead: prev };
    });
    emitNotificationsChanged();
    console.error('Error marking all read:', error);
    throw error;
  }
};

export const addNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  linkData?: AppNotification['linkData'],
): Promise<void> => {
  if (!userId || userId === 'guest') return;

  const newNotif: DatabaseNotificationInsert = {
    user_id: userId,
    type,
    title,
    message,
    date: new Date().toISOString(),
    is_read: false,
    link_data: linkData || null,
  };

  const { data, error } = await supabase.from('notifications').insert(newNotif).select().single();

  if (error) {
    console.error('Error sending notification:', error);
    throw error;
  }

  if (data) {
    const mapped = mapNotificationRow(data);
    notificationsCache = [mapped, ...notificationsCache];
    emitNotificationsChanged();
  }
};
