import { supabase } from './supabaseClient';
import { normalizeUsernameToSlug, validateUsernameFormat } from '@/domain/profile/username';

const PROFILE_AVATAR_BUCKET = 'public-media';
const PROFILE_AVATAR_FOLDER = 'profiles';

export const USERNAME_TAKEN_MESSAGE = 'Questo Nome utente è già in uso.';
export const USERNAME_CHECK_NETWORK_MESSAGE =
  'Impossibile verificare la disponibilità. Controlla la connessione e riprova.';
export const USERNAME_CHECK_TECHNICAL_MESSAGE =
  'Impossibile verificare la disponibilità. Riprova tra poco.';

export type UsernameAvailabilityResult =
  | { status: 'available' }
  | { status: 'taken' }
  | { status: 'error'; kind: 'database' | 'network' };

function isUniqueConstraintError(error: { code?: string }): boolean {
  return error.code === '23505';
}

function classifyAvailabilityError(error: { message?: string }): 'database' | 'network' {
  const message = error.message?.toLowerCase() ?? '';
  if (
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('networkerror')
  ) {
    return 'network';
  }
  return 'database';
}

export async function checkUsernameAvailability(
  rawUsername: string,
  excludeUserId?: string
): Promise<UsernameAvailabilityResult> {
  const slug = normalizeUsernameToSlug(rawUsername);

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('[profileService] checkUsernameAvailability:', error.message);
    return { status: 'error', kind: classifyAvailabilityError(error) };
  }

  if (!data) return { status: 'available' };
  if (excludeUserId && data.id === excludeUserId) return { status: 'available' };
  return { status: 'taken' };
}

export async function validateUsernameForSubmit(
  username: string,
  excludeUserId?: string
): Promise<string | null> {
  const formatError = validateUsernameFormat(username);
  if (formatError) return formatError;

  const availability = await checkUsernameAvailability(username, excludeUserId);
  if (availability.status === 'available') return null;
  if (availability.status === 'taken') return USERNAME_TAKEN_MESSAGE;
  if (availability.kind === 'network') return USERNAME_CHECK_NETWORK_MESSAGE;
  return USERNAME_CHECK_TECHNICAL_MESSAGE;
}

export function resolveProfileSlug(
  rawUsername: string
): { slug: string } | { error: string } {
  const formatError = validateUsernameFormat(rawUsername);
  if (formatError) return { error: formatError };
  return { slug: normalizeUsernameToSlug(rawUsername) };
}

export async function uploadProfileAvatar(userId: string, file: File): Promise<string | null> {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = /^[a-z0-9]+$/.test(extension) ? extension : 'jpg';
  const folderPath = `${PROFILE_AVATAR_FOLDER}/${userId}`;
  const filePath = `${folderPath}/avatar.${safeExt}`;

  const { data: existingFiles } = await supabase.storage
    .from(PROFILE_AVATAR_BUCKET)
    .list(folderPath);

  if (existingFiles?.length) {
    const pathsToRemove = existingFiles.map((entry) => `${folderPath}/${entry.name}`);
    const { error: removeError } = await supabase.storage
      .from(PROFILE_AVATAR_BUCKET)
      .remove(pathsToRemove);
    if (removeError) {
      console.warn('[profileService] uploadProfileAvatar: cleanup failed:', removeError.message);
    }
  }

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_AVATAR_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    console.error('[profileService] uploadProfileAvatar:', uploadError.message);
    return null;
  }

  const { data } = supabase.storage.from(PROFILE_AVATAR_BUCKET).getPublicUrl(filePath);
  return data.publicUrl ?? null;
}

export async function updateProfileSlug(
  userId: string,
  rawUsername: string
): Promise<{ success: boolean; slug?: string; error?: string }> {
  const resolved = resolveProfileSlug(rawUsername);
  if ('error' in resolved) {
    return { success: false, error: resolved.error };
  }

  const { slug } = resolved;

  const { data, error } = await supabase
    .from('profiles')
    .update({ slug })
    .eq('id', userId)
    .select('slug');

  if (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: USERNAME_TAKEN_MESSAGE };
    }
    console.error('[profileService] updateProfileSlug:', error.message);
    return { success: false, error: 'Impossibile aggiornare il Nome utente. Riprova.' };
  }
  if (!data?.length) {
    return { success: false, error: 'Impossibile aggiornare il Nome utente.' };
  }

  return { success: true, slug };
}

export async function updateProfileAvatarUrl(
  userId: string,
  avatarUrl: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId)
    .select('id');

  if (error) {
    return { success: false, error: error.message };
  }
  if (!data?.length) {
    return { success: false, error: 'Impossibile aggiornare la foto profilo.' };
  }

  return { success: true };
}

export async function resolveReferralCodeToUserId(code: string): Promise<string | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('referral_code', normalized)
    .maybeSingle();

  if (error || !data) return null;
  return data.id;
}
