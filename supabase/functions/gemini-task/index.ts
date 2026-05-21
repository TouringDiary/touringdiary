import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { GoogleGenAI } from "npm:@google/genai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL_COSTS: Record<string, number> = {
  'gemini-2.0-flash': 1,
  'gemini-2.0-pro': 5
};

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

    // Hash IP per Guest (migliorato x-forwarded-for parsing)
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

    const { prompt, modelId = 'gemini-2.0-flash', systemInstruction, isJson, files } = body;
    const cost = MODEL_COSTS[modelId] || 1;

    // Consentiamo prompt più lunghi per i task strutturati
    const trimmedPrompt = prompt?.trim() || '';
    if (trimmedPrompt.length < 2 || trimmedPrompt.length > 25000) {
      throw new Error('Il prompt fornito supera i limiti operativi consentiti per il Data Task.');
    }

    // RPC check atomico crediti v4 (Centralizzata)
    const { data: rpcData, error: rpcError } = await supabase.rpc('consume_ai_credits', {
      p_user_id: userId,
      p_model_type: modelId.includes('flash') ? 'flash' : 'pro',
      p_feature: body.feature || 'task'
    });

    if (rpcError) {
      console.error("RPC consume_ai_credits error:", rpcError);
      throw new Error('Fallimento controllo crediti server.');
    }
    if (!rpcData?.allowed) throw new Error('RATE_LIMIT_EXCEEDED');

    const pricingVersionId = rpcData.pricing_version_id;

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('Configurazione API KEY mancante.');

    const ai = new GoogleGenAI({ apiKey });

    // Configurazione avanzata in base al payload
    const configDataGen: any = {
      model: modelId,
      contents: [{ parts: [{ text: trimmedPrompt }] }]
    };

    if (systemInstruction) {
      configDataGen.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    if (isJson) {
      configDataGen.generationConfig = { responseMimeType: "application/json" };
    }

    // Se ci sono file (Vision API multimodale)
    if (files && Array.isArray(files) && files.length > 0) {
      configDataGen.contents[0].parts = [
        ...files.map((f: any) => ({ inlineData: { mimeType: f.mimeType, data: f.data } })),
        { text: trimmedPrompt }
      ];
    }

    const result = await ai.models.generateContent(configDataGen);
    const replyText = result?.text || '';

    // Logging Token per Analytics (v4)
    if (result?.usageMetadata) {
      try {
        await supabase.rpc('log_ai_usage_tokens', {
          p_user_id: userId,
          p_feature_name: body.feature || 'task',
          p_model_name: modelId,
          p_prompt_tokens: result.usageMetadata.promptTokenCount || 0,
          p_completion_tokens: result.usageMetadata.candidatesTokenCount || 0,
          p_total_tokens: result.usageMetadata.totalTokenCount || 0,
          p_estimated_cost_eur: 0, // Calcolato poi via SQL in base a pricing_version
          p_pricing_version_id: pricingVersionId
        });
      } catch (logErr) {
        console.error("Failed to log AI tokens:", logErr);
      }
    }

    return new Response(JSON.stringify({ reply: replyText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 // OK
    });

  } catch (error: any) {
    const isRateLimit = error.message === 'RATE_LIMIT_EXCEEDED';
    // Se isJson era abilitato, il chiamante si aspetta spesso un JSON parsabile nella reply.
    // Strutturalmente proviamo a fornire un JSON valido o una stringa d'errore a seconda dei contesti.
    const uiFallback = isRateLimit
      ? '{"error": "Limite crediti esaurito per questo mese.", "code":"429"}'
      : '{"error": "Errore interno AI.", "message":"' + error.message.replace(/"/g, '\\"') + '"}';

    // Ritorna Status 200 per evitare errori nativi Supabase HTTP exception 
    return new Response(JSON.stringify({ error: error.message, reply: uiFallback }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
