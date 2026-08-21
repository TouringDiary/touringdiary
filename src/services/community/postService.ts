import { resolvePlatformUserBody } from '@/services/platformControl/resolvePlatformUserMessage';
import {
  PLATFORM_FEATURE_FLAG_KEYS,
  PLATFORM_MESSAGE_TEMPLATE_KEYS,
} from '../../constants/platformFeatureFlags';
import { evaluateCachedFeatureFlag } from '../../domain/platformControl/platformFlagCache';
import type { DatabaseCommunityPost } from '../../types/database';
import type { CommunityPost, CommunityReply } from '../../types/index';
import { supabase } from '../supabaseClient';

function assertQaLocalWriteAllowed(isAuthenticated: boolean): void {
  // Security Gate (service boundary): Feature Flag Runtime → Database.
  // UI UX Gates must not replace this check.
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

/** Autenticazione reale sessione Supabase (stesso pattern di photoService / rankingService). */
async function resolveIsAuthenticated(): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  return Boolean(data.user?.id);
}

type CommunityReplyRow = {
  id: string;
  post_id: string;
  parent_reply_id: string | null;
  author_id: string;
  author_name: string;
  author_role: string | null;
  text: string;
  created_at: string;
};

function mapReplyRow(row: CommunityReplyRow): CommunityReply {
  const reply: CommunityReply = {
    id: row.id,
    authorId: row.author_id,
    authorName: row.author_name,
    text: row.text,
    date: row.created_at,
    parentReplyId: row.parent_reply_id,
  };
  if (row.author_role !== null) {
    reply.authorRole = row.author_role;
  }
  return reply;
}

/**
 * DB Row → dominio CommunityPost.
 * Le colonne DB sono nullable; il dominio richiede stringhe/numeri definiti.
 * Righe incomplete (identità assente) vengono scartate, non forzate.
 * SoT risposte: `replyRows` da `community_replies` (non da `community_posts.replies` jsonb).
 */
function mapDatabaseCommunityPost(
  row: DatabaseCommunityPost,
  replyRows: CommunityReplyRow[],
): CommunityPost | null {
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
    repliesCount: replyRows.length,
    replies: replyRows.map(mapReplyRow),
  };

  if (row.author_role !== null) {
    post.authorRole = row.author_role;
  }
  if (row.author_avatar !== null) {
    post.authorAvatar = row.author_avatar;
  }

  return post;
}

async function fetchRepliesForPosts(postIds: string[]): Promise<Map<string, CommunityReplyRow[]>> {
  const byPost = new Map<string, CommunityReplyRow[]>();
  if (postIds.length === 0) return byPost;

  const { data, error } = await supabase
    .from('community_replies')
    .select('id, post_id, parent_reply_id, author_id, author_name, author_role, text, created_at')
    .in('post_id', postIds)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Errore fetch community_replies:', error);
    throw new Error('Impossibile caricare le risposte della discussione.');
  }

  for (const row of data ?? []) {
    const list = byPost.get(row.post_id) ?? [];
    list.push(row);
    byPost.set(row.post_id, list);
  }
  return byPost;
}

export const getCommunityPostsAsync = async (): Promise<CommunityPost[]> => {
  const { data, error } = await supabase
    .from('community_posts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Errore fetch community posts:', error);
    throw new Error('Impossibile caricare le domande Q&A Local.');
  }
  if (!data) return [];

  const replyMap = await fetchRepliesForPosts(data.map((row) => row.id));

  const posts: CommunityPost[] = [];
  for (const row of data) {
    const mapped = mapDatabaseCommunityPost(row, replyMap.get(row.id) ?? []);
    if (mapped !== null) {
      posts.push(mapped);
    }
  }
  return posts;
};

/** Input di creazione domanda: solo campi forniti dal chiamante e persistiti. */
export type CommunityPostCreateInput = {
  authorId: string;
  authorName: string;
  authorRole?: string;
  authorAvatar?: string;
  text: string;
  cityId: string;
  cityName: string;
};

/** Update minimale domanda: solo campi editabili dall'autore. */
export type CommunityPostUpdateInput = {
  text: string;
  cityId: string;
  cityName: string;
};

/**
 * Ownership dell'UPDATE: demandata a RLS `community_posts_update_own`
 * (pattern canonico dei service layer: auth sessione + policy DB, non check client).
 */
export const addCommunityPostAsync = async (
  post: CommunityPostCreateInput,
): Promise<CommunityPost> => {
  assertQaLocalWriteAllowed(await resolveIsAuthenticated());

  // Non inviare `id`: community_posts.id ha DEFAULT gen_random_uuid().
  // Auto-follow owner: trigger DB on_community_post_owner_autofollow.
  const payload = {
    author_id: post.authorId,
    author_name: post.authorName,
    author_role: post.authorRole,
    author_avatar: post.authorAvatar,
    city_id: post.cityId,
    city_name: post.cityName,
    text: post.text,
    likes: 0,
    replies_count: 0,
    // `replies` jsonb: legacy default DB []; non scritto dal write path risposte.
    created_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('community_posts').insert(payload).select().single();
  if (error) {
    console.error('Errore post domanda:', error);
    throw new Error('Errore invio domanda.');
  }
  if (!data) {
    throw new Error('Errore invio domanda.');
  }

  const mapped = mapDatabaseCommunityPost(data, []);
  if (mapped === null) {
    throw new Error('Errore invio domanda.');
  }
  return mapped;
};

export const updateCommunityPostAsync = async (
  postId: string,
  patch: CommunityPostUpdateInput,
): Promise<CommunityPost> => {
  assertQaLocalWriteAllowed(await resolveIsAuthenticated());

  const text = patch.text.trim();
  if (!text || !patch.cityId.trim() || !patch.cityName.trim()) {
    throw new Error('Compila testo e città della domanda.');
  }

  const { data, error } = await supabase
    .from('community_posts')
    .update({
      text,
      city_id: patch.cityId,
      city_name: patch.cityName,
    })
    .eq('id', postId)
    .select()
    .single();
  if (error) {
    console.error('Errore update domanda:', error);
    throw new Error('Errore aggiornamento domanda.');
  }
  if (!data) {
    throw new Error('Errore aggiornamento domanda.');
  }

  const replyMap = await fetchRepliesForPosts([postId]);
  const mapped = mapDatabaseCommunityPost(data, replyMap.get(postId) ?? []);
  if (mapped === null) {
    throw new Error('Errore aggiornamento domanda.');
  }
  return mapped;
};

export type CommunityReplyCreateInput = {
  postId: string;
  text: string;
  parentReplyId?: string | null;
};

export const addCommunityReplyAsync = async (
  input: CommunityReplyCreateInput,
): Promise<CommunityReply> => {
  assertQaLocalWriteAllowed(await resolveIsAuthenticated());

  const text = input.text.trim();
  if (!text) {
    throw new Error('Scrivi una risposta.');
  }

  const { data, error } = await supabase.rpc('add_community_reply', {
    p_post_id: input.postId,
    p_text: text,
    p_parent_reply_id: input.parentReplyId ?? null,
  });

  if (error) {
    const msg = error.message || '';
    if (msg.includes('OWNER_CANNOT_REPLY_TO_OWN_QUESTION')) {
      throw new Error('Non puoi rispondere direttamente alla tua domanda.');
    }
    if (msg.includes('NOT_AUTHENTICATED')) {
      throw new Error('Accedi per rispondere.');
    }
    if (msg.includes('PROFILE_NOT_FOUND') || msg.includes('PROFILE_NAME_REQUIRED')) {
      throw new Error('Profilo incompleto: impossibile pubblicare la risposta.');
    }
    console.error('Errore add_community_reply:', error);
    throw new Error('Errore invio risposta.');
  }

  if (!data) {
    throw new Error('Errore invio risposta.');
  }

  return mapReplyRow(data);
};
