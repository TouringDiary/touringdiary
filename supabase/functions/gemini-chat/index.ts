import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { GoogleGenAI } from "npm:@google/genai";
import {
  generateContentWithRetry,
  resolveGuestIdForRpc,
} from "../_shared/geminiRuntime.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;

    const clientIps = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown-ip';
    const clientIp = clientIps.split(',')[0].trim();

    let body;
    try {
      body = await req.json();
    } catch (e) {
      throw new Error("Formato JSON della richiesta non valido o payload vuoto.");
    }

    const { prompt, modelId = 'gemini-2.0-flash', guestId: bodyGuestId } = body;

    const trimmedPrompt = prompt?.trim() || '';
    if (trimmedPrompt.length < 3 || trimmedPrompt.length > 500) {
      throw new Error('Il prompt deve essere compreso tra 3 e 500 caratteri. Sii più preciso.');
    }

    const guestIdForRpc = await resolveGuestIdForRpc(userId, bodyGuestId, clientIp);

    const { data: rpcData, error: rpcError } = await supabase.rpc('consume_ai_credits', {
      p_user_id: userId,
      p_model_type: 'flash',
      p_feature: 'chat',
      p_guest_id: guestIdForRpc,
    });

    if (rpcError) {
      console.error("RPC Error:", rpcError);
      throw new Error('Errore di validazione server crediti AI.');
    }

    if (!rpcData?.allowed) {
      throw new Error(rpcData?.reason === 'EMERGENCY_STOP' ? 'EMERGENCY_STOP' : 'RATE_LIMIT_EXCEEDED');
    }

    const pricingVersionId = rpcData.pricing_version_id;

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('Configurazione API KEY del server mancante.');

    const ai = new GoogleGenAI({ apiKey });

    const masterPrompt = `Sei l'assistente ufficiale turistico di Touring Diary. Tono caldo. Solo Italiano. Max 80 parole. Non creare tu itinerari logistici completi (suggerisci il Magic Planner).
Domanda: "${trimmedPrompt}"
Risposta:`;

    const result = await generateContentWithRetry(ai, {
      model: modelId,
      contents: [{ parts: [{ text: masterPrompt }] }]
    });

    const replyText = result?.text || '';

    if (result?.usageMetadata) {
      try {
        await supabase.rpc('log_ai_usage_tokens', {
          p_user_id: userId,
          p_feature_name: 'chat',
          p_model_name: modelId,
          p_prompt_tokens: result.usageMetadata.promptTokenCount || 0,
          p_completion_tokens: result.usageMetadata.candidatesTokenCount || 0,
          p_total_tokens: result.usageMetadata.totalTokenCount || 0,
          p_estimated_cost_eur: 0,
          p_pricing_version_id: pricingVersionId
        });
      } catch (logErr) {
        console.error("Failed to log chat tokens:", logErr);
      }
    }

    return new Response(JSON.stringify({ reply: replyText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    const isEmergencyStop = error.message === 'EMERGENCY_STOP';
    const isRateLimit = error.message === 'RATE_LIMIT_EXCEEDED';
    const isShortPrompt = error.message.includes('caratteri');

    const uiFallback = isEmergencyStop
      ? "I servizi AI sono temporaneamente sospesi per manutenzione di emergenza. Riprova più tardi."
      : isRateLimit
      ? "Hai esaurito i crediti AI di questo mese. Aggiorna il profilo o sfrutta il tuo codice Referral per ottenere crediti extra!"
      : isShortPrompt ? error.message : "Spiacenti, il consulente non è disponibile per problemi di ricezione. Riprova tra poco.";

    return new Response(JSON.stringify({ error: error.message, reply: uiFallback }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
