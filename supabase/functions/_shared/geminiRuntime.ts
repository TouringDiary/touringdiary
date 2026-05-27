/** Post-consume Gemini retries (C1). One consume per HTTP request; LLM may retry here only. */

const GEMINI_MAX_ATTEMPTS = 3;
const GEMINI_RETRY_BASE_MS = 2000;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function hashIp(ip: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(ip);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Deterministic UUID from IP when the client did not send guestId (edge-only fallback). */
export function ipHashToGuestUuid(hex64: string): string {
  const h = hex64.slice(0, 32);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(12, 15)}-8${h.slice(15, 18)}-${h.slice(18, 30)}`;
}

export async function resolveGuestIdForRpc(
  userId: string | null,
  bodyGuestId: unknown,
  clientIp: string,
): Promise<string | null> {
  if (userId) return null;
  const trimmed = typeof bodyGuestId === 'string' ? bodyGuestId.trim() : '';
  if (trimmed && UUID_RE.test(trimmed)) return trimmed;
  const hex = await hashIp(clientIp);
  return ipHashToGuestUuid(hex);
}

function isQuotaError(err: unknown): boolean {
  const msg = String((err as Error)?.message ?? err).toLowerCase();
  return msg.includes('429') || msg.includes('quota') || msg.includes('resource_exhausted');
}

export async function generateContentWithRetry(
  ai: { models: { generateContent: (cfg: unknown) => Promise<unknown> } },
  config: unknown,
): Promise<{ text?: string; usageMetadata?: Record<string, number> }> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < GEMINI_MAX_ATTEMPTS; attempt++) {
    try {
      return (await ai.models.generateContent(config)) as {
        text?: string;
        usageMetadata?: Record<string, number>;
      };
    } catch (err) {
      lastErr = err;
      if (isQuotaError(err)) throw err;
      if (attempt < GEMINI_MAX_ATTEMPTS - 1) {
        await new Promise((r) => setTimeout(r, GEMINI_RETRY_BASE_MS * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}
