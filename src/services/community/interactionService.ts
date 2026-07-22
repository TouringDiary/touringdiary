import { supabase } from '../supabaseClient';
import { UUID_REGEX } from '../../utils/uuid';
import { PLATFORM_FEATURE_FLAG_KEYS, PLATFORM_MESSAGE_TEMPLATE_KEYS } from '../../constants/platformFeatureFlags';
import { evaluateCachedFeatureFlag } from '../../domain/platformControl/platformFlagCache';
import { resolvePlatformUserBody } from '@/services/platformControl/resolvePlatformUserMessage';

function assertQaLocalWriteAllowed(isAuthenticated: boolean): void {
    // Security Gate (service boundary): Feature Flag Runtime → Database.
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

export const togglePostLike = async (postId: string, userId: string): Promise<{ liked: boolean, count: number }> => {
    if (!userId || userId === 'guest' || !UUID_REGEX.test(userId)) {
        return { liked: false, count: 0 };
    }

    assertQaLocalWriteAllowed(true);

    try {
        const { data: existing } = await supabase
            .from('user_interactions')
            .select('id')
            .match({
                user_id: userId,
                target_id: postId,
                target_type: 'community_post',
                interaction_type: 'like'
            })
            .maybeSingle();

        let liked = false;

        if (existing) {
            await supabase
                .from('user_interactions')
                .delete()
                .match({
                    user_id: userId,
                    target_id: postId,
                    target_type: 'community_post',
                    interaction_type: 'like'
                });
        } else {
            await supabase
                .from('user_interactions')
                .insert({
                    user_id: userId,
                    target_id: postId,
                    target_type: 'community_post',
                    interaction_type: 'like'
                });

            liked = true;
        }

        const { count } = await supabase
            .from('user_interactions')
            .select('*', { count: 'exact', head: true })
            .match({
                target_id: postId,
                target_type: 'community_post',
                interaction_type: 'like'
            });

        return { liked, count: count || 0 };

    } catch (e) {
        console.error("Errore toggle like community post:", e);
        return { liked: false, count: 0 };
    }
};

export const getUserPostLikes = async (userId: string): Promise<string[]> => {
    if (!userId || userId === 'guest' || !UUID_REGEX.test(userId)) return [];
    try {
        const { data } = await supabase
            .from('user_interactions')
            .select('target_id')
            .match({
                user_id: userId,
                target_type: 'community_post',
                interaction_type: 'like'
  });
        return (data || []).map((row: any) => row.target_id);
    } catch (e) {
        return [];
    }
};
