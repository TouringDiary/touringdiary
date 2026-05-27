/** Extract prompt/files from legacy Gemini-shaped payloads (FASE 2A contract fix). */

export interface LegacyExtractResult {
    textPrompt: string;
    files: { mimeType: string; data: string }[];
    systemInstruction: string;
    isJson: boolean;
    generationConfig?: unknown;
    tools?: unknown;
    imageConfig?: unknown;
    responseSchema?: unknown;
}

export function extractLegacyPayload(payload: {
    contents?: unknown;
    systemInstruction?: { parts?: { text?: string }[] };
    config?: Record<string, unknown>;
}): LegacyExtractResult {
    let textPrompt = '';
    const files: { mimeType: string; data: string }[] = [];
    let systemInstruction = '';

    const appendPart = (p: { text?: string; inlineData?: { mimeType: string; data: string } }) => {
        if (p.text) textPrompt += `${p.text}\n`;
        if (p.inlineData) {
            files.push({ mimeType: p.inlineData.mimeType, data: p.inlineData.data });
        }
    };

    const contents = payload.contents;

    if (typeof contents === 'string') {
        textPrompt = contents;
    } else if (Array.isArray(contents)) {
        for (const item of contents) {
            if (typeof item === 'string') {
                textPrompt += `${item}\n`;
            } else if (item && typeof item === 'object') {
                const obj = item as { parts?: unknown[]; text?: string };
                if (obj.text) textPrompt += `${obj.text}\n`;
                if (Array.isArray(obj.parts)) {
                    for (const p of obj.parts) appendPart(p as Parameters<typeof appendPart>[0]);
                }
            }
        }
    } else if (contents && typeof contents === 'object') {
        const obj = contents as { parts?: unknown[]; text?: string };
        if (obj.text) textPrompt += `${obj.text}\n`;
        if (Array.isArray(obj.parts)) {
            for (const p of obj.parts) appendPart(p as Parameters<typeof appendPart>[0]);
        }
    }

    if (payload.systemInstruction?.parts?.[0]?.text) {
        systemInstruction = payload.systemInstruction.parts[0].text;
    }

    const cfg = payload.config ?? {};
    const isJson = cfg.responseMimeType === 'application/json';
    const tools = cfg.tools;
    const imageConfig = cfg.imageConfig;
    const responseSchema = cfg.responseSchema;

    const {
        responseMimeType: _mime,
        tools: _tools,
        imageConfig: _imageConfig,
        responseSchema: _responseSchema,
        ...restGenerationConfig
    } = cfg;

    const generationConfig =
        Object.keys(restGenerationConfig).length > 0 ? restGenerationConfig : undefined;

    return {
        textPrompt: textPrompt.trim(),
        files,
        systemInstruction,
        isJson,
        generationConfig,
        tools,
        imageConfig,
        responseSchema,
    };
}

export function wrapLegacyResponse(text: string, raw?: unknown) {
    return {
        text,
        response: { text: () => text },
        raw,
    };
}

interface GeminiInlinePart {
    inlineData?: { mimeType: string; data: string };
}

interface GeminiCandidate {
    content?: { parts?: GeminiInlinePart[] };
}

/** Read first inline image/data URL from edge-preserved raw payload. */
export function extractInlineDataFromRaw(raw: unknown): string | null {
    if (!raw || typeof raw !== 'object') return null;
    const candidates = (raw as { candidates?: GeminiCandidate[] }).candidates;
    if (!Array.isArray(candidates)) return null;

    for (const candidate of candidates) {
        const parts = candidate.content?.parts;
        if (!Array.isArray(parts)) continue;
        for (const part of parts) {
            if (part.inlineData?.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    return null;
}
