/** Typed edge AI errors — fail-fast client-side (FASE 2). */

export type AiEdgeErrorCode =
  | 'RATE_LIMIT'
  | 'EMERGENCY_STOP'
  | 'AI_DISABLED'
  | 'FORBIDDEN'
  | 'AUTH_REQUIRED'
  | 'AI_BACKEND_ERROR'
  | 'AI_ERROR'
  | 'TIMEOUT'
  | 'MALFORMED_RESPONSE'
  | 'NETWORK'
  | 'QUOTA_EXCEEDED';

export class AiEdgeError extends Error {
  readonly code: AiEdgeErrorCode;

  constructor(code: AiEdgeErrorCode, message: string) {
    super(message);
    this.name = 'AiEdgeError';
    this.code = code;
  }
}

export const AI_TIMEOUT_REPLAY_WARNING =
  'La richiesta potrebbe essere ancora in elaborazione sul server. Attendi qualche minuto prima di un nuovo tentativo: un replay immediato potrebbe consumare altri crediti.';

export const PORTRAIT_AI_QUOTA_MESSAGE =
  'Quota Gemini esaurita per la generazione immagini. Il personaggio può essere importato senza ritratto AI.';

export function isAiEdgeError(err: unknown): err is AiEdgeError {
  return err instanceof AiEdgeError;
}

/** Typed portrait/provider quota — blocks further portrait AI attempts in the same recovery session. */
export function isAiEdgeQuotaBlockedError(err: unknown): err is AiEdgeError {
  return err instanceof AiEdgeError && (err.code === 'QUOTA_EXCEEDED' || err.code === 'RATE_LIMIT');
}

function isProviderQuotaMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('resource_exhausted') ||
    lower.includes('quota_exceeded') ||
    lower.includes('quota_exceeded_daily') ||
    lower.includes('generate_content_free_tier') ||
    lower.includes('limit: 0')
  );
}

/**
 * Provider/Google quota or internal credits exhausted — retrying portrait immediately will not help.
 * Uses typed AiEdgeError codes first; message heuristics only for known provider shapes (429/RESOURCE_EXHAUSTED).
 */
export function isAiProviderQuotaExhaustedError(err: unknown): boolean {
  if (isAiEdgeQuotaBlockedError(err)) return true;
  if (!(err instanceof Error)) {
    return isProviderQuotaMessage(String(err));
  }
  return isProviderQuotaMessage(err.message);
}

/** Normalize any quota-like failure to a typed QUOTA_EXCEEDED for portrait callers. */
export function asPortraitQuotaExceededError(err: unknown): AiEdgeError {
  if (err instanceof AiEdgeError && err.code === 'QUOTA_EXCEEDED') return err;
  if (err instanceof AiEdgeError && err.code === 'RATE_LIMIT') {
    return new AiEdgeError('QUOTA_EXCEEDED', err.message || PORTRAIT_AI_QUOTA_MESSAGE);
  }
  return new AiEdgeError('QUOTA_EXCEEDED', PORTRAIT_AI_QUOTA_MESSAGE);
}

export interface EdgeInvokeResult {
  text: string;
  raw: unknown;
}

const DEFAULT_EDGE_MESSAGES: Record<string, string> = {
  EMERGENCY_STOP: 'I servizi AI sono temporaneamente sospesi per manutenenza di emergenza.',
  AI_DISABLED: 'I servizi AI sono temporaneamente disattivati per manutenenza.',
  CREDITS_EXHAUSTED:
    'Hai esaurito i crediti AI disponibili. Aggiorna il profilo o usa un codice Referral per crediti extra.',
  RATE_LIMIT_EXCEEDED:
    'Hai esaurito i crediti AI disponibili. Aggiorna il profilo o usa un codice Referral per crediti extra.',
  FORBIDDEN: 'Sessione non valida per questa operazione AI. Effettua di nuovo l’accesso.',
  GUEST_ID_REQUIRED: 'Identità ospite mancante. Ricarica la pagina e riprova.',
  INVALID_GUEST_ID: 'Identità ospite non valida. Ricarica la pagina e riprova.',
  AI_BACKEND_ERROR: 'Errore temporaneo del sistema AI.',
};

function hasInlineImageInEdgePayload(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false;
  const candidates = (payload as { candidates?: unknown[] }).candidates;
  if (!Array.isArray(candidates)) return false;

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue;
    const parts = (candidate as { content?: { parts?: unknown[] } }).content?.parts;
    if (!Array.isArray(parts)) continue;
    for (const part of parts) {
      if (!part || typeof part !== 'object' || !('inlineData' in part)) continue;
      const inlineData = (part as { inlineData?: { mimeType?: string; data?: string } }).inlineData;
      if (typeof inlineData?.data !== 'string' || inlineData.data.trim().length === 0) continue;
      const mime = inlineData.mimeType?.trim().toLowerCase() ?? '';
      if (!mime.startsWith('image/')) continue;
      return true;
    }
  }
  return false;
}

function throwFromEdgeCode(code: string, message?: string): never {
  const msg = message || DEFAULT_EDGE_MESSAGES[code];

  if (code === 'EMERGENCY_STOP') {
    throw new AiEdgeError('EMERGENCY_STOP', msg || DEFAULT_EDGE_MESSAGES.EMERGENCY_STOP);
  }
  if (code === 'AI_DISABLED') {
    throw new AiEdgeError('AI_DISABLED', msg || DEFAULT_EDGE_MESSAGES.AI_DISABLED);
  }
  if (code === 'CREDITS_EXHAUSTED' || code === 'RATE_LIMIT_EXCEEDED' || code === 'RATE_LIMIT') {
    throw new AiEdgeError('RATE_LIMIT', msg || DEFAULT_EDGE_MESSAGES.CREDITS_EXHAUSTED);
  }
  if (code === 'FORBIDDEN') {
    throw new AiEdgeError('FORBIDDEN', msg || DEFAULT_EDGE_MESSAGES.FORBIDDEN);
  }
  if (code === 'GUEST_ID_REQUIRED' || code === 'AUTH_REQUIRED') {
    throw new AiEdgeError('AUTH_REQUIRED', msg || DEFAULT_EDGE_MESSAGES.GUEST_ID_REQUIRED);
  }
  if (code === 'INVALID_GUEST_ID') {
    throw new AiEdgeError('AUTH_REQUIRED', msg || DEFAULT_EDGE_MESSAGES.INVALID_GUEST_ID);
  }
  if (code === 'PROVIDER_UNAVAILABLE') {
    throw new AiEdgeError('AI_ERROR', msg || 'Configurazione provider AI non disponibile.');
  }
  if (code === 'AI_BACKEND_ERROR') {
    throw new AiEdgeError('AI_ERROR', msg || DEFAULT_EDGE_MESSAGES.AI_BACKEND_ERROR);
  }
  throw new AiEdgeError('AI_ERROR', msg || code);
}

/** Map invoke/edge failures to typed errors (no silent success). */
export function parseEdgeInvokeResponse(
  data: unknown,
  transportError?: { message?: string } | null,
): EdgeInvokeResult {
  if (transportError) {
    const msg = transportError.message || 'Errore di rete durante la chiamata AI.';
    if (/timeout|timed out|abort/i.test(msg)) {
      throw new AiEdgeError('TIMEOUT', `${msg} ${AI_TIMEOUT_REPLAY_WARNING}`);
    }
    throw new AiEdgeError('NETWORK', msg);
  }

  if (!data || typeof data !== 'object') {
    throw new AiEdgeError('MALFORMED_RESPONSE', 'Risposta AI non valida dal server.');
  }

  const payload = data as { error?: string; reply?: string; code?: string; message?: string };
  const edgeCode = payload.code || payload.error;

  if (edgeCode) {
    if (payload.message && isProviderQuotaMessage(payload.message)) {
      throw new AiEdgeError(
        'QUOTA_EXCEEDED',
        'Quota Gemini esaurita. Riprova più tardi o verifica il piano di fatturazione Google AI.',
      );
    }
    throwFromEdgeCode(edgeCode, payload.message);
  }

  const reply = payload.reply === undefined || payload.reply === null ? '' : String(payload.reply);
  const hasInlineImage = hasInlineImageInEdgePayload(payload);

  if (!reply.trim() && !hasInlineImage) {
    throw new AiEdgeError('MALFORMED_RESPONSE', 'Risposta AI vuota.');
  }

  return { text: reply, raw: data };
}

export function aiErrorUserMessage(
  err: unknown,
  fallback = 'Errore tecnico del server AI.',
): string {
  if (isAiEdgeError(err)) return err.message;
  if (err instanceof Error) {
    if (/timeout|180s|impiegando troppo/i.test(err.message)) {
      return `${err.message} ${AI_TIMEOUT_REPLAY_WARNING}`;
    }
    return err.message || fallback;
  }
  return fallback;
}

export function aiErrorModalTitle(err: unknown): string {
  if (!isAiEdgeError(err)) return 'Errore Generazione';
  switch (err.code) {
    case 'EMERGENCY_STOP':
      return 'Servizi AI sospesi';
    case 'AI_DISABLED':
      return 'Manutenzione AI';
    case 'QUOTA_EXCEEDED':
      return 'Quota esaurita';
    case 'RATE_LIMIT':
      return 'Crediti esauriti';
    case 'FORBIDDEN':
    case 'AUTH_REQUIRED':
      return 'Accesso richiesto';
    case 'TIMEOUT':
      return 'Timeout richiesta';
    case 'NETWORK':
      return 'Errore di rete';
    default:
      return 'Errore Generazione';
  }
}
