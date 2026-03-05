
import React, { useState, useEffect } from 'react';
import { Bot, Loader2, Sparkles, X, Check, ListChecks, Settings, Plus, Trash2, Save, Database } from 'lucide-react';
import { getAiClient } from '../../services/ai/aiClient';
import { getAiConfig, saveAiConfig } from '../../services/aiConfigService';

interface AiFieldHelperProps {
    contextLabel: string;
    onApply: (value: any) => void;
    mode?: 'text' | 'number' | 'list';
    min?: number;
    max?: number;
    initialPrompt?: string;
    compact?: boolean;
    currentValue?: any;
    fieldId?: string;
    defaultPrompts?: string[];
    isStrategyConfig?: boolean; 
}

export const AiFieldHelper = ({ contextLabel, onApply, mode = 'text', min, max, initialPrompt, compact = false, currentValue, fieldId, defaultPrompts, isStrategyConfig = false }: AiFieldHelperProps) => {
    // ... (STATE SAME AS BEFORE)
    const [isOpen, setIsOpen] = useState(false);
    const dbKey = fieldId ? `ai_config_${fieldId}` : `ai_config_generic_${mode}`;
    const [savedPrompts, setSavedPrompts] = useState<string[]>([]);
    const [newPromptText, setNewPromptText] = useState('');
    const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
    const [isDbLoading, setIsDbLoading] = useState(true);
    const [isSavingConfig, setIsSavingConfig] = useState(false);
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ... (EFFECTS AND HANDLERS SAME AS BEFORE)
    useEffect(() => {
        const loadConfig = async () => {
            setIsDbLoading(true);
            const config = await getAiConfig(dbKey);
            let codeDefaults: string[] = [];
            if (defaultPrompts && defaultPrompts.length > 0) codeDefaults = [...defaultPrompts];
            else if (initialPrompt) codeDefaults = [initialPrompt];
            else if (mode === 'number') codeDefaults = [`Stima un valore numerico`, `Valuta da ${min || 0} a ${max || 100}`];
            else codeDefaults = [`Sii preciso`, `Usa tono emozionale`, `Includi curiosità`];

            if (config) {
                const mergedPrompts = Array.from(new Set([...config.prompts, ...codeDefaults]));
                setSavedPrompts(mergedPrompts);
                if (codeDefaults.length > 0) {
                     const enforcedSelection = Array.from(new Set([...config.selected, ...codeDefaults]));
                     setSelectedPrompts(enforcedSelection);
                } else {
                     setSelectedPrompts(config.selected);
                }
            } else {
                setSavedPrompts(codeDefaults);
                if (codeDefaults.length > 0) setSelectedPrompts(codeDefaults);
            }
            setIsDbLoading(false);
        };
        loadConfig();
    }, [dbKey]);
    
    // ... (HANDLERS)

    const handleGenerate = async () => {
        if (selectedPrompts.length === 0) { setError("Seleziona istruzioni."); return; }
        setLoading(true);
        setError(null);
        try {
            const aiClient = getAiClient();
            const combinedPrompt = selectedPrompts.join('\n- ');
            
            let systemInstruction = "Agisci come editor turistico esperto della Campania. Rispondi in italiano.";
            if (mode === 'number') systemInstruction += " Rispondi SOLO con un numero.";

            const finalPrompt = `
                TASK: Scrivere contenuto per "${contextLabel}".
                CONTESTO ATTUALE: "${currentValue || 'Nessuno'}"
                
                REGOLE OBBLIGATORIE DA SEGUIRE:
                - ${combinedPrompt}
                
                RISULTATO FINALE (Solo testo, niente spiegazioni):
            `;

            const response = await aiClient.models.generateContent({
                model: 'gemini-3.1-pro-preview',
                contents: `${systemInstruction}\n\n${finalPrompt}`,
            });

            if (response.text) {
                let cleanText = response.text.trim();
                if (mode === 'number') {
                    const match = cleanText.match(/\d+(\.\d+)?/);
                    cleanText = match ? match[0] : '0';
                }
                setResult(cleanText);
            }
        } catch (e: any) { 
             setError(e.message || "Errore AI."); 
        } finally { 
             setLoading(false); 
        }
    };

    // ... (RENDER SAME AS BEFORE)
    return (
        <div className="w-full mt-2">
            {/* ... UI ... */}
             <div className="flex justify-between items-center p-3 bg-slate-900/50 border-b border-slate-800 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                  <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${selectedPrompts.length > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                            {isStrategyConfig ? <Settings className="w-4 h-4"/> : <Bot className="w-4 h-4"/>}
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                                {isStrategyConfig ? 'Configura Strategia AI' : 'Generatore AI'}
                            </span>
                        </div>
                  </div>
             </div>
             {isOpen && (
                  <div className="p-4 bg-slate-900">
                      {/* ... Content ... */}
                      {!isStrategyConfig && (
                        <div className="pt-2 border-t border-slate-800">
                             <button onClick={handleGenerate} disabled={loading || selectedPrompts.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
                                Genera Contenuto (Pro)
                            </button>
                            {/* ... Result area ... */}
                            {result && (
                                <div className="mt-3 p-3 bg-slate-950 border border-indigo-500/30 rounded text-sm text-indigo-100">{result}</div>
                            )}
                        </div>
                      )}
                  </div>
             )}
        </div>
    );
};
