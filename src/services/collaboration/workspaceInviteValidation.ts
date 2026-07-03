import { supabase } from '@/services/supabaseClient';
import { userNeedsUsername } from '@/domain/profile/username';
import { areUsersBlocked } from './userBlockService';
import {
  resolveUserIdByEmail,
  resolveUserIdByUsername,
} from './collaborationUserSearchService';
import type { InviteTarget } from './resourceInviteService';

export async function resolveInviteeId(target: InviteTarget): Promise<string | null> {
  if ('userId' in target) return target.userId;
  if ('email' in target) return resolveUserIdByEmail(target.email);
  return resolveUserIdByUsername(target.username);
}

export async function validateInvitee(
  ownerId: string,
  inviteeId: string
): Promise<string | null> {
  if (inviteeId === ownerId) {
    return 'Non puoi invitare te stesso.';
  }
  if (await areUsersBlocked(ownerId, inviteeId)) {
    return 'Non è possibile inviare inviti a questo utente.';
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, slug')
    .eq('id', inviteeId)
    .maybeSingle();

  if (error || !profile) {
    return 'Utente non trovato.';
  }
  if (userNeedsUsername(profile.slug)) {
    return 'L\'utente non ha ancora un Nome utente e non può collaborare.';
  }

  return null;
}
