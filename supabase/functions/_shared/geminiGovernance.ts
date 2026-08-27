/** Shared edge governance: provider pre-check, consume denial, uniform error payload. */

import { logAiRuntime, type AiRuntimePhase } from './geminiRuntime.ts';

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_MESSAGES: Record<string, string> = {
  EMERGENCY_STOP: 'I servizi AI sono temporaneamente sospesi per emergenza.',
  AI_DISABLED: 'I servizi AI sono temporaneamente disattivati per manutenzione.',
  CREDITS_EXHAUSTED: 'Hai esaurito i crediti AI disponibili.',
  /** @deprecated alias kept for older clients */
  RATE_LIMIT_EXCEEDED: 'Hai esaurito i crediti AI disponibili.',
  FORBIDDEN: 'Sessione non valida per questa operazione AI. Effettua di nuovo l’accesso.',
  GUEST_ID_REQUIRED: 'Identità ospite mancante. Ricarica la pagina e riprova.',
  INVALID_GUEST_ID: 'Identità ospite non valida. Ricarica la pagina e riprova.',
  PROVIDER_UNAVAILABLE: 'Configurazione provider AI non disponibile.',
  AI_BACKEND_ERROR: 'Errore temporaneo del sistema AI.',
};

export function assertGeminiApiKey(): string {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('PROVIDER_UNAVAILABLE');
  }
  return apiKey;
}

/**
 * Maps RPC deny reasons to stable edge error codes.
 * Must NOT collapse auth/governance denials into CREDITS_EXHAUSTED.
 */
export function mapConsumeDenial(reason: string | undefined): string {
  switch (reason) {
    case 'EMERGENCY_STOP':
      return 'EMERGENCY_STOP';
    case 'AI_DISABLED':
      return 'AI_DISABLED';
    case 'CREDITS_EXHAUSTED':
      return 'CREDITS_EXHAUSTED';
    case 'FORBIDDEN':
      return 'FORBIDDEN';
    case 'GUEST_ID_REQUIRED':
      return 'GUEST_ID_REQUIRED';
    case 'INVALID_GUEST_ID':
      return 'INVALID_GUEST_ID';
    case 'RATE_LIMIT_EXCEEDED':
      return 'CREDITS_EXHAUSTED';
    default:
      return reason && reason.trim() ? reason.trim() : 'CREDITS_EXHAUSTED';
  }
}

export function edgeErrorResponse(
  code: string,
  message?: string,
  corsHeaders: Record<string, string> = CORS_HEADERS,
): Response {
  const msg = message || DEFAULT_MESSAGES[code] || 'Errore interno AI.';
  return new Response(JSON.stringify({ error: code, code, message: msg }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
}

const GOVERNANCE_CODES = new Set([
  'EMERGENCY_STOP',
  'AI_DISABLED',
  'CREDITS_EXHAUSTED',
  'RATE_LIMIT_EXCEEDED',
  'FORBIDDEN',
  'GUEST_ID_REQUIRED',
  'INVALID_GUEST_ID',
  'PROVIDER_UNAVAILABLE',
  'AI_BACKEND_ERROR',
]);

export function handleEdgeCatch(
  error: unknown,
  corsHeaders: Record<string, string> = CORS_HEADERS,
): Response {
  const msg = String((error as Error)?.message ?? error);

  if (GOVERNANCE_CODES.has(msg)) {
    // Normalize legacy alias
    const code = msg === 'RATE_LIMIT_EXCEEDED' ? 'CREDITS_EXHAUSTED' : msg;
    return edgeErrorResponse(code);
  }

  if (msg.includes('caratteri') || msg.includes('prompt') || msg.includes('JSON') || msg.includes('limiti operativi')) {
    return edgeErrorResponse('AI_ERROR', msg);
  }

  return edgeErrorResponse('AI_ERROR', msg || 'Errore interno AI.');
}

type ConsumeRpcResult = {
  allowed?: boolean;
  reason?: string;
  pricing_version_id?: string;
  source?: string;
};

function normalizeConsumeRpcResult(data: unknown): ConsumeRpcResult | null {
  if (data == null) return null;
  if (typeof data === 'string') {
    try {
      const parsed: unknown = JSON.parse(data);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as ConsumeRpcResult;
      }
      return null;
    } catch {
      return null;
    }
  }
  if (typeof data === 'object' && !Array.isArray(data)) {
    return data as ConsumeRpcResult;
  }
  return null;
}

export async function consumeCreditsOrThrow(
  supabase: {
    rpc: (
      name: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
  },
  params: {
    p_user_id: string | null;
    p_model_type: string;
    p_feature: string;
    p_guest_id: string | null;
  },
  ctx: { fn: string; feature: string; userId: string | null },
): Promise<ConsumeRpcResult> {
  const { data, error: rpcError } = await supabase.rpc('consume_ai_credits', params);

  if (rpcError) {
    logAiRuntime({
      function: ctx.fn,
      feature: ctx.feature,
      phase: 'consume_fail' as AiRuntimePhase,
      userId: ctx.userId,
      guest: !ctx.userId,
      errorCategory: 'rpc_error',
      message: rpcError.message,
    });
    throw new Error('AI_BACKEND_ERROR');
  }

  const rpcData = normalizeConsumeRpcResult(data);

  if (!rpcData?.allowed) {
    const reason = rpcData?.reason || 'denied';
    logAiRuntime({
      function: ctx.fn,
      feature: ctx.feature,
      phase: 'consume_fail' as AiRuntimePhase,
      userId: ctx.userId,
      guest: !ctx.userId,
      errorCategory: reason,
      message: `consume denied reason=${reason} p_user_id=${params.p_user_id ?? 'null'}`,
    });
    throw new Error(mapConsumeDenial(rpcData?.reason));
  }

  logAiRuntime({
    function: ctx.fn,
    feature: ctx.feature,
    phase: 'consume_ok' as AiRuntimePhase,
    userId: ctx.userId,
    guest: !ctx.userId,
  });

  return rpcData;
}
