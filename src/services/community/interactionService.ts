import { resolvePlatformUserBody } from '@/services/platformControl/resolvePlatformUserMessage';
import {
  PLATFORM_FEATURE_FLAG_KEYS,
  PLATFORM_MESSAGE_TEMPLATE_KEYS,
} from '../../constants/platformFeatureFlags';
import { evaluateCachedFeatureFlag } from '../../domain/platformControl/platformFlagCache';
import { UUID_REGEX } from '../../utils/uuid';
import { supabase } from '../supabaseClient';

function assertQaLocalWriteAllowed(isAuthenticated: boolean): void {
  // Security Gate (service boundary): Feature Flag Runtime → Database.
  const qaFlag = evaluateCachedFeatureFlag(PLATFORM_FEATURE_FLAG_KEYS.MODERATION_COMMUNITY_POSTS, {
    userRole: null,
    isAuthenticated,
  });
  if (!qaFlag?.enabled) {
    throw new Error(
      resolvePlatformUserBody(
        qaFlag?.messageKey ?? PLATFORM_MESSAGE_TEMPLATE_KEYS.MODERATION_COMMUNITY_POSTS_PAUSED,
        'Le domande e risposte locali sono temporaneamente disabilitate.',
      ),
    );
  }
}

export const getUserPostFollows = async (userId: string): Promise<string[]> => {
  if (!userId || userId === 'guest' || !UUID_REGEX.test(userId)) return [];
  try {
    const { data } = await supabase.from('user_interactions').select('target_id').match({
      user_id: userId,
      target_type: 'community_post',
      interaction_type: 'follow',
    });
    return (data || []).map((row) => row.target_id);
  } catch {
    return [];
  }
};

export const togglePostFollow = async (
  postId: string,
  userId: string,
): Promise<{ following: boolean }> => {
  if (!userId || userId === 'guest' || !UUID_REGEX.test(userId)) {
    return { following: false };
  }

  assertQaLocalWriteAllowed(true);

  const { data: existing, error: existingError } = await supabase
    .from('user_interactions')
    .select('id')
    .match({
      user_id: userId,
      target_id: postId,
      target_type: 'community_post',
      interaction_type: 'follow',
    })
    .maybeSingle();

  if (existingError) {
    console.error('Errore lettura follow community post:', existingError);
    throw new Error('Errore aggiornamento follow.');
  }

  if (existing) {
    const { error } = await supabase.from('user_interactions').delete().match({
      user_id: userId,
      target_id: postId,
      target_type: 'community_post',
      interaction_type: 'follow',
    });
    if (error) {
      console.error('Errore unfollow community post:', error);
      throw new Error('Errore aggiornamento follow.');
    }
    return { following: false };
  }

  const { error } = await supabase.from('user_interactions').insert({
    user_id: userId,
    target_id: postId,
    target_type: 'community_post',
    interaction_type: 'follow',
  });
  if (error) {
    console.error('Errore follow community post:', error);
    throw new Error('Errore aggiornamento follow.');
  }
  return { following: true };
};
