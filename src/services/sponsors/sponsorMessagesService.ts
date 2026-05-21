
import { supabase } from '../supabaseClient';
import { DatabaseSponsorMessageInsert } from '../../types/database';

export interface SponsorMessage {
    id: string;
    partnerId: string | null;
    senderId: string | null;
    requestId?: string | null;
    sponsorId?: string | null;
    direction: 'admin' | 'partner' | 'system';
    message: string;
    isRead: boolean;
    createdAt: string;
    sender?: {
        name: string;
        avatarUrl?: string | null;
    };
}

/**
 * Recupera la conversazione completa per un partner (via profileId o requestId).
 */
export const getSponsorMessagesAsync = async (identity: { profileId?: string | null, requestId?: string | null }): Promise<SponsorMessage[]> => {
    const { profileId, requestId } = identity;
    if (!profileId && !requestId) return [];

    let query = supabase
        .from('sponsor_messages')
        .select(`
            *,
            sender:profiles!sender_id(name, avatar_url)
        `);

    if (profileId) {
        query = query.eq('partner_id', profileId);
    } else {
        query = query.eq('request_id', requestId);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
        console.error('[SponsorMessagesService] Error fetching messages:', error.message);
        return [];
    }

    return (data || []).map(m => ({
        id: m.id,
        partnerId: m.partner_id,
        senderId: m.sender_id,
        requestId: m.request_id,
        sponsorId: m.sponsor_id,
        direction: m.direction,
        message: m.message,
        isRead: m.is_read,
        createdAt: m.created_at,
        sender: m.sender
    }));
};

interface SponsorMessageInsert {
    partner_id: string | null;
    sender_id: string | null;
    request_id?: string | null;
    sponsor_id?: string | null;
    direction: 'admin' | 'partner' | 'system';
    message: string;
    is_read?: boolean;
}

/**
 * Invia un nuovo messaggio nel CRM sponsor.
 */
export const addSponsorMessageAsync = async (params: {
    partnerId?: string | null;
    senderId: string;
    direction: 'admin' | 'partner' | 'system';
    message: string;
    requestId?: string;
    sponsorId?: string;
}): Promise<boolean> => {
    const { partnerId, senderId, direction, message, requestId, sponsorId } = params;

    const payload: DatabaseSponsorMessageInsert = {
        partner_id: partnerId || null,
        sender_id: senderId,
        direction,
        message,
        request_id: requestId || null,
        sponsor_id: sponsorId || null,
        is_read: false
    };

    const { error } = await supabase
        .from('sponsor_messages')
        .insert(payload);

    if (error) {
        console.error('[SponsorMessagesService] Error sending message:', error.message);
        return false;
    }

    return true;
};

/**
 * Segna i messaggi come letti per un partner.
 */
export const markMessagesAsReadAsync = async (identity: { profileId?: string | null, requestId?: string | null }, direction: 'admin' | 'partner') => {
    const { profileId, requestId } = identity;
    if (!profileId && !requestId) return;

    // Se l'admin apre la chat, segna come letti i messaggi inviati dal partner
    const targetDirection = direction === 'admin' ? 'partner' : 'admin';

    let query = supabase
        .from('sponsor_messages')
        .update({ is_read: true });

    if (profileId) {
        query = query.eq('partner_id', profileId);
    } else {
        query = query.eq('request_id', requestId);
    }

    const { error } = await query
        .eq('direction', targetDirection)
        .eq('is_read', false);

    if (error) {
        console.error('[SponsorMessagesService] Error marking as read:', error.message);
    }
};
