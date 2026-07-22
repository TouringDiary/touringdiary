import { supabase } from '../supabaseClient';
import { CommunityPost, CommunityReply } from '../../types/index';
import { DatabaseCommunityPost } from '../../types/database';
import { PLATFORM_FEATURE_FLAG_KEYS, PLATFORM_MESSAGE_TEMPLATE_KEYS } from '../../constants/platformFeatureFlags';
import { evaluateCachedFeatureFlag } from '../../domain/platformControl/platformFlagCache';
import { resolvePlatformUserBody } from '@/services/platformControl/resolvePlatformUserMessage';
import type { Json } from '@/types/supabase';

function assertQaLocalWriteAllowed(isAuthenticated: boolean): void {
    // Security Gate (service boundary): Feature Flag Runtime → Database.
    // UI UX Gates must not replace this check.
    const qaFlag = evaluateCachedFeatureFlag(
        PLATFORM_FEATURE_FLAG_KEYS.MODERATION_COMMUNITY_POSTS,
        {
            userRole: null,
            isAuthenticated,
        }
    );
    if (!qaFlag?.enabled) {
        throw new Error(
            resolvePlatformUserBody(
                qaFlag?.messageKey ?? PLATFORM_MESSAGE_TEMPLATE_KEYS.MODERATION_COMMUNITY_POSTS_PAUSED,
                'Le domande e risposte locali sono temporaneamente disabilitate.'
            )
        );
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mapCommunityReply(value: unknown): CommunityReply | null {
    if (!isRecord(value)) return null;

    const id = value.id;
    const authorName = value.authorName;
    const text = value.text;
    const date = value.date;
    const likes = value.likes;
    const authorRole = value.authorRole;

    if (
        typeof id !== 'string' ||
        typeof authorName !== 'string' ||
        typeof text !== 'string' ||
        typeof date !== 'string'
    ) {
        return null;
    }

    const reply: CommunityReply = {
        id,
        authorName,
        text,
        date,
        likes: typeof likes === 'number' ? likes : 0,
    };

    if (typeof authorRole === 'string') {
        reply.authorRole = authorRole;
    }

    return reply;
}

function mapRepliesFromJson(raw: Json | null): CommunityReply[] | undefined {
    if (!Array.isArray(raw)) return undefined;

    const replies: CommunityReply[] = [];
    for (const item of raw) {
        const reply = mapCommunityReply(item);
        if (reply !== null) {
            replies.push(reply);
        }
    }
    return replies;
}

/**
 * DB Row → dominio CommunityPost.
 * Le colonne DB sono nullable; il dominio richiede stringhe/numeri definiti.
 * Righe incomplete (identità assente) vengono scartate, non forzate.
 */
function mapDatabaseCommunityPost(row: DatabaseCommunityPost): CommunityPost | null {
    if (
        row.author_id === null ||
        row.author_name === null ||
        row.city_id === null ||
        row.city_name === null ||
        row.text === null ||
        row.created_at === null
    ) {
        return null;
    }

    const post: CommunityPost = {
        id: row.id,
        authorId: row.author_id,
        authorName: row.author_name,
        cityId: row.city_id,
        cityName: row.city_name,
        text: row.text,
        date: row.created_at,
        likes: row.likes ?? 0,
        repliesCount: row.replies_count ?? 0,
    };

    if (row.author_role !== null) {
        post.authorRole = row.author_role;
    }
    if (row.author_avatar !== null) {
        post.authorAvatar = row.author_avatar;
    }

    const replies = mapRepliesFromJson(row.replies);
    if (replies !== undefined) {
        post.replies = replies;
    }

    return post;
}

export const getCommunityPostsAsync = async (): Promise<CommunityPost[]> => {
    try {
        const { data, error } = await supabase
            .from('community_posts')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        if (!data) return [];

        const posts: CommunityPost[] = [];
        for (const row of data) {
            const mapped = mapDatabaseCommunityPost(row);
            if (mapped !== null) {
                posts.push(mapped);
            }
        }
        return posts;
    } catch (e) {
        console.error("Errore fetch community posts:", e);
        return [];
    }
};

export const addCommunityPostAsync = async (post: CommunityPost): Promise<CommunityPost | null> => {
    assertQaLocalWriteAllowed(Boolean(post.authorId));

    try {
        const payload = { 
            id: post.id, 
            author_id: post.authorId, 
            author_name: post.authorName, 
            author_role: post.authorRole, 
            author_avatar: post.authorAvatar, 
            city_id: post.cityId, 
            city_name: post.cityName, 
            text: post.text, 
            likes: 0, 
            replies_count: 0, 
            replies: [], 
            created_at: new Date().toISOString() 
        };
        const { data, error } = await supabase.from('community_posts').insert(payload).select().single();
        if (error) throw error;
        if (!data) return null;

        return mapDatabaseCommunityPost(data);
    } catch (e) {
        console.error("Errore post domanda:", e);
        return null;
    }
};
