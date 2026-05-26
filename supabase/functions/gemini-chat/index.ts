import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { GoogleGenAI } from "npm:@google/genai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// COSTI DEI MODELLI
const MODEL_COSTS: Record<string, number> = {
  'gemini-2.0-flash': 1,
  'gemini-2.0-pro': 5
};

// Hashing IP per Guest
async function hashIp(ip: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(ip);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // 1. Identificazione Utente
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;

    // Recupero ruolo corretto da profiles (anziché user_metadata)
    let userRole = 'guest';
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      if (profile?.role) {
        userRole = profile.role;
      } else {
        userRole = user?.user_metadata?.role || 'user'; // Fallback
      }
    }

    // Hash IP per Guest (migliorato x-forwarded-for parsing per proxied envs come Deno Deploy)
    const clientIps = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown-ip';
    const clientIp = clientIps.split(',')[0].trim();
    const sessionId = userId ? null : `guest-${await hashIp(clientIp)}`;

    // Parsing body sicuro
    let body;
    try {
      body = await req.json();
    } catch (e) {
      throw new Error("Formato JSON della richiesta non valido o payload vuoto.");
    }

    const { prompt, modelId = 'gemini-2.0-flash' } = body;
    const cost = MODEL_COSTS[modelId] || 1;

    // 2. Validazione Prompt
    const trimmedPrompt = prompt?.trim() || '';
    if (trimmedPrompt.length < 3 || trimmedPrompt.length > 500) {
      throw new Error('Il prompt deve essere compreso tra 3 e 500 caratteri. Sii più preciso.');
    }

    // 3. Controllo Atomico backend tramite la nuova RPC v4 (Centralizzata)
    const { data: rpcData, error: rpcError } = await supabase.rpc('consume_ai_credits', {
      p_user_id: userId,
      p_model_type: 'flash', // La chat è sempre flash
      p_feature: 'chat'
    });

    if (rpcError) {
      console.error("RPC Error:", rpcError);
      throw new Error('Errore di validazione server crediti AI.');
    }

    if (!rpcData?.allowed) {
      throw new Error(rpcData?.reason === 'EMERGENCY_STOP' ? 'EMERGENCY_STOP' : 'RATE_LIMIT_EXCEEDED');
    }

    const pricingVersionId = rpcData.pricing_version_id;

    // 4. Chiamata al LLM
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('Configurazione API KEY del server mancante.');

    const ai = new GoogleGenAI({ apiKey });

    const masterPrompt = `Sei l'assistente ufficiale turistico di Touring Diary. Tono caldo. Solo Italiano. Max 80 parole. Non creare tu itinerari logistici completi (suggerisci il Magic Planner).
Domanda: "${trimmedPrompt}"
Risposta:`;

    const result = await ai.models.generateContent({
      model: modelId,
      contents: [{ parts: [{ text: masterPrompt }] }]
    });

    const replyText = result?.text || '';

    // 5. Logging Token per Analytics (v4)
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
      status: 200 // OK
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

    // Ritorniamo sempre STATUS 200 per evitare che supabase.functions.invoke frontend scateni:
    // "FunctionsHttpError: Edge Function returned a non-2xx status code" e nasconda la UI fallback (data.reply).
    return new Response(JSON.stringify({ error: error.message, reply: uiFallback }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
