
import { supabase } from '../supabaseClient';

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
 * Lettura diretta SELECT — consentita post-B8 (RLS).
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
    } else if (requestId) {
        query = query.eq('request_id', requestId);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
        console.error('[SponsorMessagesService] Error fetching messages:', error.message);
        return [];
    }

    return (data || []).map((m): SponsorMessage => {
        const senderProfile = m.sender;
        const sender =
            senderProfile?.name != null
                ? { name: senderProfile.name, avatarUrl: senderProfile.avatar_url }
                : undefined;

        return {
            id: m.id,
            partnerId: m.partner_id,
            senderId: m.sender_id,
            requestId: m.request_id,
            sponsorId: m.sponsor_id,
            direction: m.direction,
            message: m.message,
            // DB nullable; schema DEFAULT false — unread when absent
            isRead: m.is_read ?? false,
            createdAt: m.created_at ?? '',
            sender,
        };
    });
};

/**
 * Invia un nuovo messaggio nel CRM sponsor (RPC gateway — B8).
 * Il sender è risolto lato DB da `auth.uid()` nella RPC `insert_sponsor_message`.
 */
export const addSponsorMessageAsync = async (params: {
    partnerId: string;
    direction: 'admin' | 'partner' | 'system';
    message: string;
    requestId?: string;
    sponsorId?: string;
}): Promise<boolean> => {
    const { partnerId, direction, message, requestId, sponsorId } = params;

    const { error } = await supabase.rpc('insert_sponsor_message', {
        p_partner_id: partnerId,
        p_message: message,
        p_direction: direction,
        p_request_id: requestId ?? null,
        p_sponsor_id: sponsorId ?? null,
    });

    if (error) {
        console.error('[SponsorMessagesService] Error sending message:', error.message);
        return false;
    }

    return true;
};

/**
 * Segna i messaggi come letti per un partner (RPC gateway — B8).
 */
export const markMessagesAsReadAsync = async (identity: { profileId?: string | null, requestId?: string | null }, direction: 'admin' | 'partner') => {
    const { profileId, requestId } = identity;
    if (!profileId && !requestId) return;

    const { error } = await supabase.rpc('mark_sponsor_messages_read', {
        p_partner_id: profileId ?? null,
        p_request_id: requestId ?? null,
        p_reader: direction,
    });

    if (error) {
        console.error('[SponsorMessagesService] Error marking as read:', error.message);
    }
};
