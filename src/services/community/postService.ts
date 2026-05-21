import { supabase } from '../supabaseClient';
import { CommunityPost } from '../../types/index';
import { DatabaseCommunityPost } from '../../types/database';

export const getCommunityPostsAsync = async (): Promise<CommunityPost[]> => {
    try {
        const { data, error } = await supabase.from('community_posts').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return (data as DatabaseCommunityPost[]).map(p => ({ 
            id: p.id, 
            authorId: p.author_id, 
            authorName: p.author_name, 
            authorRole: p.author_role || undefined, 
            authorAvatar: p.author_avatar || undefined, 
            cityId: p.city_id, 
            cityName: p.city_name,
            text: p.text, 
            likes: p.likes, 
            repliesCount: p.replies_count, 
            replies: p.replies as any, 
            date: p.created_at 
        }));
    } catch (e) {
        console.error("Errore fetch community posts:", e);
        return [];
    }
};

export const addCommunityPostAsync = async (post: CommunityPost): Promise<CommunityPost | null> => {
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
        return { 
            id: data.id, 
            authorId: data.author_id, 
            authorName: data.author_name, 
            authorRole: data.author_role || undefined, 
            authorAvatar: data.author_avatar || undefined, 
            cityId: data.city_id, 
            cityName: data.city_name, 
            text: data.text, 
            likes: data.likes, 
            repliesCount: data.replies_count, 
            replies: data.replies as any, 
            date: data.created_at 
        };
    } catch (e) {
        console.error("Errore post domanda:", e);
        return null;
    }
};
