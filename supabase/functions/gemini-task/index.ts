import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { GoogleGenAI } from "npm:@google/genai";
import {
  generateContentWithRetry,
  resolveGuestIdForRpc,
  logAiRuntime,
} from "../_shared/geminiRuntime.ts";
import {
  assertGeminiApiKey,
  consumeCreditsOrThrow,
  CORS_HEADERS,
  handleEdgeCatch,
} from "../_shared/geminiGovernance.ts";

const FN = 'gemini-task';

type RuntimeGenerationConfig = {
  model: string;
  contents: unknown;
  systemInstruction?: unknown;
  generationConfig?: Record<string, unknown>;
  tools?: unknown;
  imageConfig?: unknown;
};

type RuntimeGenerateResult = {
  text?: string;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  candidates?: unknown[];
};

type EdgeSuccessPayload = {
  reply: string;
  candidates?: unknown[];
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  let feature = 'task';
  let userId: string | null = null;

  try {
    const apiKey = assertGeminiApiKey();

    const authHeader = req.headers.get('Authorization') || '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id || null;

    const clientIps = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown-ip';
    const clientIp = clientIps.split(',')[0].trim();

    let body;
    try {
      body = await req.json();
    } catch (e) {
      throw new Error("Formato JSON della richiesta non valido o payload vuoto.");
    }

    const {
      prompt,
      modelId = 'gemini-2.0-flash',
      systemInstruction,
      isJson,
      files,
      guestId: bodyGuestId,
      generationConfig: bodyGenerationConfig,
      tools,
      imageConfig,
      responseSchema,
    } = body;
    feature = body.feature || 'task';

    const trimmedPrompt = prompt?.trim() || '';
    if (trimmedPrompt.length < 2 || trimmedPrompt.length > 25000) {
      throw new Error('Il prompt fornito supera i limiti operativi consentiti per il Data Task.');
    }

    const guestIdForRpc = await resolveGuestIdForRpc(userId, bodyGuestId, clientIp);

    const rpcData = await consumeCreditsOrThrow(
      supabase,
      {
        p_user_id: userId,
        p_model_type: modelId.includes('flash') ? 'flash' : 'pro',
        p_feature: feature,
        p_guest_id: guestIdForRpc,
      },
      { fn: FN, feature, userId },
    );

    const pricingVersionId = rpcData.pricing_version_id;
    const ai = new GoogleGenAI({ apiKey });

    const configDataGen: RuntimeGenerationConfig = {
      model: modelId,
      contents: [{ parts: [{ text: trimmedPrompt }] }]
    };

    if (systemInstruction) {
      configDataGen.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const mergedGenerationConfig: Record<string, unknown> = {
      ...(bodyGenerationConfig && typeof bodyGenerationConfig === 'object' ? bodyGenerationConfig : {}),
    };
    if (isJson) {
      mergedGenerationConfig.responseMimeType = 'application/json';
    }
    if (responseSchema) {
      mergedGenerationConfig.responseSchema = responseSchema;
    }
    if (Object.keys(mergedGenerationConfig).length > 0) {
      configDataGen.generationConfig = mergedGenerationConfig;
    }

    if (tools) {
      configDataGen.tools = tools;
    }

    if (imageConfig) {
      configDataGen.imageConfig = imageConfig;
    }

    if (files && Array.isArray(files) && files.length > 0) {
      (configDataGen.contents as { parts: unknown[] }[])[0].parts = [
        ...files.map((f: { mimeType: string; data: string }) => ({
          inlineData: { mimeType: f.mimeType, data: f.data }
        })),
        { text: trimmedPrompt }
      ];
    }

    let result: RuntimeGenerateResult;
    try {
      result = await generateContentWithRetry(ai, configDataGen) as RuntimeGenerateResult;
    } catch (providerErr: unknown) {
      logAiRuntime({
        function: FN,
        feature,
        phase: 'provider_fail',
        userId,
        guest: !userId,
        errorCategory: 'gemini',
        message: String((providerErr as Error)?.message ?? providerErr),
      });
      throw providerErr;
    }

    const replyText = result?.text || '';
    if (!replyText.trim()) {
      logAiRuntime({
        function: FN,
        feature,
        phase: 'malformed_response',
        userId,
        guest: !userId,
        errorCategory: 'empty_reply',
      });
      throw new Error('Risposta AI vuota dal provider.');
    }

    if (result?.usageMetadata) {
      try {
        await supabase.rpc('log_ai_usage_tokens', {
          p_user_id: userId,
          p_feature_name: feature,
          p_model_name: modelId,
          p_prompt_tokens: result.usageMetadata.promptTokenCount || 0,
          p_completion_tokens: result.usageMetadata.candidatesTokenCount || 0,
          p_total_tokens: result.usageMetadata.totalTokenCount || 0,
          p_estimated_cost_eur: 0,
          p_pricing_version_id: pricingVersionId
        });
      } catch (logErr) {
        logAiRuntime({
          function: FN,
          feature,
          phase: 'logging_fail',
          userId,
          guest: !userId,
          errorCategory: 'log_ai_usage_tokens',
          message: String((logErr as Error)?.message ?? logErr),
        });
      }
    }

    logAiRuntime({ function: FN, feature, phase: 'success', userId, guest: !userId });

    const edgePayload: EdgeSuccessPayload = { reply: replyText };
    if (Array.isArray(result.candidates)) {
      edgePayload.candidates = result.candidates;
    }

    return new Response(JSON.stringify(edgePayload), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: unknown) {
    return handleEdgeCatch(error, CORS_HEADERS);
  }
});
