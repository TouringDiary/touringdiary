
import React, { useState, useEffect } from 'react';
import { Wand2, Loader2, Palette, PenTool, AlertTriangle, Landmark, User, Image as ImageIcon, Save, History, Plus, Trash2, X, Check, Camera, Moon, Aperture } from 'lucide-react';
import { getAiClient } from '../../../services/ai/aiClient';
import { uploadPublicMedia } from '../../../services/mediaService';
import { dataURLtoFile } from '../../../utils/common';
import { getAiConfig, saveAiConfig, AiPreset } from '../../../services/aiConfigService';
import { ImageWithFallback } from '../../common/ImageWithFallback';

// ... (STYLES CONSTANT SAME AS BEFORE)
const STYLES = {
    city_real: { label: 'Città / Card (Reale)', icon: Aperture, dbKey: 'safe_art_city_real', defaultPrompt: "...", previewUrl: "..." },
    // ...
};

type StyleKey = keyof typeof STYLES;

export const SafeArtPanel = ({ onImageGenerated, onError }: { onImageGenerated: (url: string) => void; onError: (msg: string) => void; }) => {
    // ... (STATE SAME AS BEFORE)
    const [isGenerating, setIsGenerating] = useState(false);
    const [genPrompt, setGenPrompt] = useState('');
    const [styleMode, setStyleMode] = useState<StyleKey>('city_real');
    const [currentInstruction, setCurrentInstruction] = useState('');
    // ...

    const generateImage = async () => {
        if (!genPrompt.trim()) return;
        setIsGenerating(true);
        
        try {
            const aiClient = getAiClient();
            
            const fullPrompt = `Genera un'immagine. Soggetto: ${genPrompt}. STILE: ${currentInstruction}. NO TESTO.`;

            const response = await aiClient.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: fullPrompt }] },
                 config: { imageConfig: { aspectRatio: "16:9" } }
            });
            
            let generatedBase64 = '';
            if (response.candidates && response.candidates[0].content.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        generatedBase64 = part.inlineData.data;
                        break;
                    }
                }
            }

            if (generatedBase64) {
                const file = dataURLtoFile(`data:image/png;base64,${generatedBase64}`, `ai_gen_${Date.now()}.png`);
                const publicUrl = await uploadPublicMedia(file, 'ai_generated');
                if (publicUrl) onImageGenerated(publicUrl);
                else onError("Errore salvataggio cloud.");
            } else {
                throw new Error("Nessun dato immagine.");
            }
        } catch (e: any) {
            console.error("Safe-Art Error", e);
            onError(`Errore generazione: ${e.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col gap-5 animate-in fade-in bg-slate-950 p-5 rounded-2xl border border-indigo-500/30 shadow-xl">
            {/* UI SAME AS BEFORE */}
             <div className="flex items-center gap-2 mb-1 pb-3 border-b border-slate-800">
                <Wand2 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">Safe-Art Generator</h3>
            </div>
            {/* ... rest of UI ... */}
            <button onClick={generateImage} disabled={isGenerating || !genPrompt.trim()} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-indigo-900/20 transition-all flex items-center justify-center gap-2 mt-2 border border-indigo-400/20 hover:scale-[1.02] active:scale-95">
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <PenTool className="w-4 h-4"/>} 
                {isGenerating ? 'Creazione Artistica in corso...' : 'Genera Safe-Art'}
            </button>
        </div>
    );
};
