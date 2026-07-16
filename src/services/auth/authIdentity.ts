import { supabase } from '@/services/supabaseClient';
import { UUID_REGEX } from '@/utils/uuid';

/**
 * Risolve l'ID utente autenticato allineato a `auth.uid()` (JWT Supabase).
 * Preferisce sessione corrente, poi refresh via getUser(), infine fallback opzionale.
 * Usare per ogni scrittura protetta da RLS che confronta `auth.uid()`.
 */
export async function resolveAuthenticatedUserId(
  fallbackUserId?: string | null
): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession();

  if (sessionData?.session?.user?.id && UUID_REGEX.test(sessionData.session.user.id)) {
    return sessionData.session.user.id;
  }

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user?.id && UUID_REGEX.test(userData.user.id)) {
      return userData.user.id;
    }
  } catch (e) {
    console.warn('[authIdentity] resolveAuthenticatedUserId getUser failed:', e);
  }

  if (fallbackUserId && UUID_REGEX.test(fallbackUserId)) {
    return fallbackUserId;
  }

  return null;
}
