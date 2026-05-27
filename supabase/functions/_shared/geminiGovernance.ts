/** Shared edge governance: provider pre-check, consume denial, uniform error payload. */

import { logAiRuntime, type AiRuntimePhase } from './geminiRuntime.ts';

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_MESSAGES: Record<string, string> = {
  EMERGENCY_STOP: 'I servizi AI sono temporaneamente sospesi per emergenza.',
  AI_DISABLED: 'I servizi AI sono temporaneamente disattivati per manutenzione.',
  RATE_LIMIT_EXCEEDED: 'Hai esaurito i crediti AI disponibili.',
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

export function mapConsumeDenial(reason: string | undefined): string {
  if (reason === 'EMERGENCY_STOP') return 'EMERGENCY_STOP';
  if (reason === 'AI_DISABLED') return 'AI_DISABLED';
  return 'RATE_LIMIT_EXCEEDED';
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

export function handleEdgeCatch(
  error: unknown,
  corsHeaders: Record<string, string> = CORS_HEADERS,
): Response {
  const msg = String((error as Error)?.message ?? error);

  if (msg === 'EMERGENCY_STOP' || msg === 'AI_DISABLED' || msg === 'RATE_LIMIT_EXCEEDED' || msg === 'PROVIDER_UNAVAILABLE') {
    return edgeErrorResponse(msg);
  }

  if (msg === 'AI_BACKEND_ERROR') {
    return edgeErrorResponse(msg);
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

export async function consumeCreditsOrThrow(
  supabase: { rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: ConsumeRpcResult | null; error: { message: string } | null }> },
  params: {
    p_user_id: string | null;
    p_model_type: string;
    p_feature: string;
    p_guest_id: string | null;
  },
  ctx: { fn: string; feature: string; userId: string | null },
): Promise<ConsumeRpcResult> {
  const { data: rpcData, error: rpcError } = await supabase.rpc('consume_ai_credits', params);

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

  if (!rpcData?.allowed) {
    logAiRuntime({
      function: ctx.fn,
      feature: ctx.feature,
      phase: 'consume_fail' as AiRuntimePhase,
      userId: ctx.userId,
      guest: !ctx.userId,
      errorCategory: rpcData?.reason || 'denied',
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
