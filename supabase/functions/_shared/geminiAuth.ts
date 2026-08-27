/** Edge auth helpers: bind caller JWT → userId for consume_ai_credits. */

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export type AuthedEdgeClient = {
  supabase: SupabaseClient;
  userId: string | null;
  authHeader: string;
};

/**
 * Creates a request-scoped Supabase client with the caller's Authorization header
 * and resolves userId via getUser(jwt).
 *
 * Critical: on supabase-js 2.39.x, auth.getUser() without an explicit JWT does not
 * reliably read global.headers.Authorization in the Edge runtime (no local session).
 * That yields userId=null while PostgREST still sees auth.uid() from the same JWT,
 * which makes consume_ai_credits return FORBIDDEN (registered user on guest path).
 */
export function createAuthedEdgeClient(req: Request): Promise<AuthedEdgeClient> {
  const authHeader = req.headers.get('Authorization') || '';
  const jwt = authHeader.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || '';

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_ANON_KEY') || '',
    {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );

  return resolveUserId(supabase, jwt).then((userId) => ({
    supabase,
    userId,
    authHeader,
  }));
}

async function resolveUserId(
  supabase: SupabaseClient,
  jwt: string,
): Promise<string | null> {
  if (!jwt) return null;

  // Prefer explicit JWT (Edge-safe). Ignore anon/service JWTs without a user sub.
  const { data, error } = await supabase.auth.getUser(jwt);
  if (!error && data?.user?.id) {
    return data.user.id;
  }

  // Fallback: decode payload.sub when verify_jwt already accepted the token at the gateway.
  // Does not trust signature again (gateway did); only used to recover user id for RPC binding.
  const sub = decodeJwtSub(jwt);
  return sub;
}

function decodeJwtSub(jwt: string): string | null {
  try {
    const parts = jwt.split('.');
    if (parts.length < 2) return null;
    const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson) as { sub?: unknown; role?: unknown };
    if (payload.role === 'anon' || payload.role === 'service_role') return null;
    const sub = typeof payload.sub === 'string' ? payload.sub.trim() : '';
    if (!sub || !/^[0-9a-f-]{36}$/i.test(sub)) return null;
    return sub;
  } catch {
    return null;
  }
}
