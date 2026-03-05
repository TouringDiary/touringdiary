
import React, { useState, useRef } from 'react';
import { Wand2, Loader2, Image as ImageIcon, Upload, Sparkles, Download } from 'lucide-react';
import { generateSocialBackground } from '../../../services/socialMarketingService';
import { uploadPublicMedia } from '../../../services/mediaService';
import { dataURLtoFile, compressImage } from '../../../utils/common';
import { CONFIG } from '../../../config/env';

interface Props {
    onBgSelected: (url: string) => void;
}

export const AiBackgroundPanel = ({ onBgSelected }: Props) => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsGenerating(true);
        setGeneratedUrl(null);
        try {
            const base64 = await generateSocialBackground(prompt);
            if (base64) {
                const file = dataURLtoFile(base64, `social_bg_ai_${Date.now()}.png`);
                const url = await uploadPublicMedia(file, 'social_templates');
                if (url) {
                    onBgSelected(url);
                    setGeneratedUrl(url);
                }
            } else {
                alert("Errore generazione immagine");
            }
        } catch (e) {
            console.error(e);
            alert("Errore AI");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        setGeneratedUrl(null);
        try {
            const compressedBase64 = await compressImage(file);
            const compressedFile = dataURLtoFile(compressedBase64, file.name);
            const url = await uploadPublicMedia(compressedFile, 'social_templates');
            if (url) {
                onBgSelected(url);
                setGeneratedUrl(url);
            }
        } catch (e) {
            alert("Errore upload");
        } finally {
            setIsUploading(false);
        }
    };
    
    // FIX CRITICO: Download tramite Blob per evitare navigazione
    const handleDownloadRaw = async () => {
        if (!generatedUrl) return;
        setIsDownloading(true);
        try {
            // 1. Scarica i dati grezzi in memoria (senza cambiare pagina)
            const response = await fetch(generatedUrl);
            const blob = await response.blob();
            
            // 2. Crea un URL temporaneo locale
            const blobUrl = window.URL.createObjectURL(blob);

            // 3. Simula il click su un link invisibile
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `social_raw_bg_${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            
            // 4. Pulizia
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (e) {
            console.error("Download blob failed", e);
            // Fallback sicuro: apre in una NUOVA scheda (non perde la sessione corrente)
            window.open(generatedUrl, '_blank');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-indigo-400 uppercase mb-3 flex items-center gap-2">
                    <Wand2 className="w-4 h-4"/> AI Generator
                </h4>
                <textarea 
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="Es. Panorama di Positano al tramonto, stile acquerello..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-indigo-500 outline-none resize-none h-24 mb-3"
                />
                <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Sparkles className="w-3.5 h-3.5"/>} Genera Sfondo
                </button>
                
                {generatedUrl && (
                    <button 
                        onClick={handleDownloadRaw}
                        disabled={isDownloading}
                        className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-2 border border-slate-700 disabled:opacity-50"
                    >
                        {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Download className="w-3.5 h-3.5"/>} Scarica Immagine (No Testo)
                    </button>
                )}
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500 font-bold">Oppure</span></div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4"/> Upload Manuale
                </h4>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload}/>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-2 disabled:opacity-50 border border-slate-700"
                >
                    {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Upload className="w-3.5 h-3.5"/>} Carica File
                </button>
            </div>
        </div>
    );
};
