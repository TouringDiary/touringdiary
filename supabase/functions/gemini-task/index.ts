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

    const { prompt, modelId = 'gemini-2.0-flash', systemInstruction, isJson, files, guestId: bodyGuestId } = body;

    const trimmedPrompt = prompt?.trim() || '';
    if (trimmedPrompt.length < 2 || trimmedPrompt.length > 25000) {
      throw new Error('Il prompt fornito supera i limiti operativi consentiti per il Data Task.');
    }

    const guestIdForRpc = await resolveGuestIdForRpc(userId, bodyGuestId, clientIp);

    const { data: rpcData, error: rpcError } = await supabase.rpc('consume_ai_credits', {
      p_user_id: userId,
      p_model_type: modelId.includes('flash') ? 'flash' : 'pro',
      p_feature: body.feature || 'task',
      p_guest_id: guestIdForRpc,
    });

    if (rpcError) {
      console.error("RPC consume_ai_credits error:", rpcError);
      throw new Error('Fallimento controllo crediti server.');
    }
    if (!rpcData?.allowed) {
      throw new Error(rpcData?.reason === 'EMERGENCY_STOP' ? 'EMERGENCY_STOP' : 'RATE_LIMIT_EXCEEDED');
    }

    const pricingVersionId = rpcData.pricing_version_id;

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('Configurazione API KEY mancante.');

    const ai = new GoogleGenAI({ apiKey });

    const configDataGen: Record<string, unknown> = {
      model: modelId,
      contents: [{ parts: [{ text: trimmedPrompt }] }]
    };

    if (systemInstruction) {
      configDataGen.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    if (isJson) {
      configDataGen.generationConfig = { responseMimeType: "application/json" };
    }

    if (files && Array.isArray(files) && files.length > 0) {
      (configDataGen.contents as { parts: unknown[] }[])[0].parts = [
        ...files.map((f: { mimeType: string; data: string }) => ({
          inlineData: { mimeType: f.mimeType, data: f.data }
        })),
        { text: trimmedPrompt }
      ];
    }

    const result = await generateContentWithRetry(ai, configDataGen);
    const replyText = result?.text || '';

    if (result?.usageMetadata) {
      try {
        await supabase.rpc('log_ai_usage_tokens', {
          p_user_id: userId,
          p_feature_name: body.feature || 'task',
          p_model_name: modelId,
          p_prompt_tokens: result.usageMetadata.promptTokenCount || 0,
          p_completion_tokens: result.usageMetadata.candidatesTokenCount || 0,
          p_total_tokens: result.usageMetadata.totalTokenCount || 0,
          p_estimated_cost_eur: 0,
          p_pricing_version_id: pricingVersionId
        });
      } catch (logErr) {
        console.error("Failed to log AI tokens:", logErr);
      }
    }

    return new Response(JSON.stringify({ reply: replyText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    const isEmergencyStop = error.message === 'EMERGENCY_STOP';
    const isRateLimit = error.message === 'RATE_LIMIT_EXCEEDED';
    const uiFallback = isEmergencyStop
      ? '{"error": "Servizi AI sospesi per emergenza.", "code":"EMERGENCY_STOP"}'
      : isRateLimit
      ? '{"error": "Limite crediti esaurito per questo mese.", "code":"429"}'
      : '{"error": "Errore interno AI.", "message":"' + error.message.replace(/"/g, '\\"') + '"}';

    return new Response(JSON.stringify({ error: error.message, reply: uiFallback }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
