import { Bot, Check, Loader2, Settings, Sparkles } from 'lucide-react';

import { useEffect, useState } from 'react';
import { useAiRuntimeGate } from '@/hooks/useAiRuntimeGate';
import { aiGateway } from '@/services/ai/aiGateway';
import { getAiConfig } from '../../services/aiConfigService';

interface AiFieldHelperProps {
  contextLabel: string;
  onApply: (value: string) => void;
  mode?: 'text' | 'number' | 'list';
  min?: number;
  max?: number;
  initialPrompt?: string;
  compact?: boolean;
  currentValue?: unknown;
  fieldId?: string;
  defaultPrompts?: string[];
  isStrategyConfig?: boolean;
}

const MAX_CONTEXT_CHARS = 1200;

/** Rappresentazione leggibile del contesto campo per il prompt AI (no "[object Object]", no falso "Nessuno"). */
const formatCurrentValueForPrompt = (value: unknown): string => {
  if (value == null) return 'Nessuno';
  if (typeof value === 'string') return value.trim() ? value : 'Nessuno';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'bigint') return value.toString();

  if (Array.isArray(value)) {
    if (value.length === 0) return 'Nessuno';
    const parts = value.map((item) => {
      if (item == null) return '';
      if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
        return String(item);
      }
      try {
        return JSON.stringify(item);
      } catch {
        return '[valore non serializzabile]';
      }
    });
    const joined = parts.filter((p) => p.length > 0).join('; ');
    if (!joined) return 'Nessuno';
    return joined.length > MAX_CONTEXT_CHARS ? `${joined.slice(0, MAX_CONTEXT_CHARS)}…` : joined;
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value as object);
    if (keys.length === 0) return 'Nessuno';
    try {
      const json = JSON.stringify(value);
      if (!json || json === '{}') return 'Nessuno';
      return json.length > MAX_CONTEXT_CHARS ? `${json.slice(0, MAX_CONTEXT_CHARS)}…` : json;
    } catch {
      return `[oggetto con ${keys.length} campi]`;
    }
  }

  return String(value);
};

export const AiFieldHelper = ({
  contextLabel,
  onApply,
  mode = 'text',
  min,
  max,
  initialPrompt,
  compact = false,
  currentValue,
  fieldId,
  defaultPrompts,
  isStrategyConfig = false,
}: AiFieldHelperProps) => {
  const { aiBlocked, blockTitle, blockMessage, guardAiAction } = useAiRuntimeGate();
  const [isOpen, setIsOpen] = useState(false);
  const dbKey = fieldId ? `ai_config_${fieldId}` : `ai_config_generic_${mode}`;
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Callers spesso passano `defaultPrompts={[...]}` inline: chiave stabile per evitare reload inutili di getAiConfig.
  const defaultPromptsKey = JSON.stringify(defaultPrompts ?? []);

  useEffect(() => {
    let cancelled = false;

    const loadConfig = async () => {
      const config = await getAiConfig(dbKey);
      if (cancelled) return;

      let codeDefaults: string[] = [];
      if (defaultPrompts && defaultPrompts.length > 0) codeDefaults = [...defaultPrompts];
      else if (initialPrompt) codeDefaults = [initialPrompt];
      else if (mode === 'number')
        codeDefaults = [
          `Stima un valore numerico`,
          `Valuta da ${min ?? 0} a ${max ?? 100}`,
        ];
      else codeDefaults = [`Sii preciso`, `Usa tono emozionale`, `Includi curiosità`];

      // Selection drives generation UI; full prompt catalog is not rendered here.
      if (config) {
        if (codeDefaults.length > 0) {
          const enforcedSelection = Array.from(new Set([...config.selected, ...codeDefaults]));
          setSelectedPrompts(enforcedSelection);
        } else {
          setSelectedPrompts(config.selected);
        }
      } else if (codeDefaults.length > 0) {
        setSelectedPrompts(codeDefaults);
      }
    };
    void loadConfig();

    return () => {
      cancelled = true;
    };
  }, [dbKey, defaultPromptsKey, initialPrompt, max, min, mode]);

  // When CC disables AI: close panel and wipe ephemeral generation session state.
  useEffect(() => {
    if (!aiBlocked) return;
    setIsOpen(false);
    setError(null);
    setResult('');
    setLoading(false);
  }, [aiBlocked]);

  const handleHeaderClick = () => {
    if (aiBlocked) return;
    setIsOpen(!isOpen);
  };

  const handleGenerate = async () => {
    if (!guardAiAction()) {
      setError(blockMessage);
      return;
    }
    if (selectedPrompts.length === 0) {
      setError('Seleziona istruzioni.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const combinedPrompt = selectedPrompts.join('\n- ');

      let systemInstruction =
        'Agisci come editor turistico esperto della Campania. Rispondi in italiano.';
      if (mode === 'number') systemInstruction += ' Rispondi SOLO con un numero.';

      const finalPrompt = `
                TASK: Scrivere contenuto per "${contextLabel}".
                CONTESTO ATTUALE: "${formatCurrentValueForPrompt(currentValue)}"
                
                REGOLE OBBLIGATORIE DA SEGUIRE:
                - ${combinedPrompt}
                
                RISULTATO FINALE (Solo testo, niente spiegazioni):
            `;

      const response = await aiGateway.generateLegacy({
        model: 'gemini-2.0-pro',
        contents: `${systemInstruction}\n\n${finalPrompt}`,
      });

      if (!response.text) {
        setError("L'AI non ha restituito un risultato utilizzabile.");
        return;
      }

      let cleanText = response.text.trim();
      if (mode === 'number') {
        const match = cleanText.match(/-?\d+(\.\d+)?/);
        if (!match) {
          setError("L'AI non ha restituito un numero interpretabile.");
          return;
        }
        const numeric = Number(match[0]);
        if (!Number.isFinite(numeric)) {
          setError("L'AI non ha restituito un numero interpretabile.");
          return;
        }
        if (min != null && numeric < min) {
          setError(`Il valore AI (${numeric}) è inferiore al minimo consentito (${min}).`);
          return;
        }
        if (max != null && numeric > max) {
          setError(`Il valore AI (${numeric}) è superiore al massimo consentito (${max}).`);
          return;
        }
        cleanText = match[0];
      }
      setResult(cleanText);
    } catch (e: unknown) {
      setError((e instanceof Error ? e.message : String(e)) || 'Errore AI.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full ${compact ? 'mt-1' : 'mt-2'} ${aiBlocked ? 'opacity-60' : ''}`}>
      <button
        type="button"
        className={`w-full flex justify-between items-center text-left ${compact ? 'p-2' : 'p-3'} bg-slate-900/50 border-b border-slate-800 ${aiBlocked ? 'cursor-not-allowed' : 'cursor-pointer'} min-h-11`}
        onClick={handleHeaderClick}
        aria-disabled={aiBlocked}
        aria-expanded={isOpen && !aiBlocked}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`p-1.5 rounded-lg shrink-0 ${
              aiBlocked
                ? 'bg-slate-800 text-slate-500'
                : selectedPrompts.length > 0
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-500'
            }`}
          >
            {isStrategyConfig ? <Settings className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
              {aiBlocked
                ? blockTitle
                : isStrategyConfig
                  ? 'Configura Strategia AI'
                  : 'Generatore AI'}
            </span>
            {aiBlocked ? (
              <span className="text-[10px] text-amber-400/90 block mt-0.5 line-clamp-2">
                {blockMessage}
              </span>
            ) : null}
          </div>
        </div>
      </button>
      {isOpen && !aiBlocked && (
        <div className={`${compact ? 'p-3' : 'p-4'} bg-slate-900`}>
          {isStrategyConfig ? (
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => onApply(selectedPrompts.join('\n- '))}
                disabled={selectedPrompts.length === 0}
                className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-2.5 min-h-11 rounded-lg text-[10px] uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Check className="w-3.5 h-3.5" /> Applica strategia
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || selectedPrompts.length === 0 || aiBlocked}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 min-h-11 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Genera Contenuto (Pro)
              </button>
              {error && <div className="text-xs text-red-400 font-bold break-words">{error}</div>}
              {result && (
                <div className="space-y-2">
                  <div className="p-3 bg-slate-950 border border-indigo-500/30 rounded text-sm text-indigo-100 break-words">
                    {result}
                  </div>
                  <button
                    type="button"
                    onClick={() => onApply(result)}
                    className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2.5 min-h-11 rounded-lg text-[10px] uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <Check className="w-3.5 h-3.5" /> Applica
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
