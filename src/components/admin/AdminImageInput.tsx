
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Link, AlertTriangle, CheckCircle, Info, Image as ImageIcon, ShieldAlert, Loader2, Sparkles, Maximize, RefreshCw, X, Layers } from 'lucide-react';
import { compressImage, compressImageHighQuality, dataURLtoFile, getPoiCategoryLabel } from '../../utils/common';
import { uploadPublicMedia } from '../../services/mediaService';
import { getCachedPlaceholder } from '../../services/settingsService';
import { getAiClient } from '../../services/ai/aiClient';

interface AdminImageInputProps {
    imageUrl: string;
    imageCredit?: string;
    imageLicense?: 'own' | 'cc' | 'public' | 'copyright';
    onChange: (data: { imageUrl: string, imageCredit: string, imageLicense: 'own' | 'cc' | 'public' | 'copyright', fileName?: string }) => void;
    onValidityChange?: (isValid: boolean) => void;
    qualityMode?: 'standard' | 'high';
    category?: string; // NEW: Passiamo la categoria per mostrare il placeholder corretto
}

export const AdminImageInput = ({ imageUrl, imageCredit = '', imageLicense = 'public', onChange, onValidityChange, qualityMode = 'standard', category = 'monument' }: AdminImageInputProps) => {
    const [mode, setMode] = useState<'url' | 'upload'>('url');
    const [localPreview, setLocalPreview] = useState<string | null>(imageUrl || null);
    const [isUploading, setIsUploading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [aiAdvice, setAiAdvice] = useState<{ status: 'safe' | 'caution' | 'danger', message: string } | null>(null);
    const [dimensions, setDimensions] = useState<{ w: number, h: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Placeholder Logic
    const placeholderUrl = getCachedPlaceholder(category);
    const hasPlaceholder = !!placeholderUrl;

    useEffect(() => {
        if (imageUrl !== localPreview) setLocalPreview(imageUrl);
    }, [imageUrl]);

    useEffect(() => {
        if (localPreview) {
            const img = new Image();
            img.onload = () => setDimensions({ w: img.naturalWidth, h: img.naturalHeight });
            img.src = localPreview;
        } else {
            setDimensions(null);
        }
    }, [localPreview]);

    useEffect(() => {
        let isValid = true;
        if (imageLicense === 'copyright') isValid = false;
        if (imageLicense === 'cc' && (!imageCredit || !imageCredit.trim())) isValid = false;
        if (onValidityChange) onValidityChange(isValid);
    }, [imageLicense, imageCredit, onValidityChange]);

    const updateData = (updates: Partial<{ imageUrl: string, imageCredit: string, imageLicense: 'own' | 'cc' | 'public' | 'copyright', fileName: string }>) => {
        onChange({ imageUrl, imageCredit, imageLicense, ...updates });
    };

    const handleLicenseChange = (newLicense: 'own' | 'cc' | 'public' | 'copyright') => {
        let newCredit = imageCredit;
        if ((newLicense === 'cc' || newLicense === 'copyright') && (imageCredit === 'Opera Propria' || !imageCredit)) newCredit = '';
        else if (newLicense === 'own') newCredit = 'Opera Propria';
        updateData({ imageLicense: newLicense, imageCredit: newCredit });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            try {
                let compressedBase64 = '';
                if (qualityMode === 'high') {
                    compressedBase64 = await compressImageHighQuality(file);
                } else {
                    compressedBase64 = await compressImage(file);
                }
                setLocalPreview(compressedBase64);

                const compressedFile = dataURLtoFile(compressedBase64, file.name);
                const publicUrl = await uploadPublicMedia(compressedFile, 'admin_uploads');

                if (publicUrl) {
                    updateData({ imageUrl: publicUrl, imageLicense: 'own', imageCredit: 'Opera Propria', fileName: file.name });
                } else {
                    alert("Errore upload Cloud. Verifica la connessione.");
                }

            } catch (err) {
                console.error("Image handling error", err);
                alert("Errore elaborazione immagine.");
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleResetToPlaceholder = () => {
        setLocalPreview('');
        updateData({ imageUrl: '', imageLicense: 'public', imageCredit: '' });
    };

    const analyzeCopyright = async () => {
        if (!localPreview) return;
        setAnalyzing(true);
        setAiAdvice(null);
        try {
            // FIX: Uso il client centralizzato sicuro
            const ai = getAiClient();
            let prompt = "Analizza questa immagine (o URL) per scopi di copyright in una guida turistica. Cerca watermark, loghi di agenzie stock.";
            prompt += " Rispondi JSON: { status: 'safe'|'caution'|'danger', message: 'breve spiegazione' }";

            let contentPart: any;
            if (localPreview.startsWith('data:')) {
                const base64Data = localPreview.split(',')[1];
                const mimeType = localPreview.split(';')[0].split(':')[1];
                contentPart = { inlineData: { mimeType, data: base64Data } };
            } else {
                prompt += `\nL'URL dell'immagine è: ${localPreview}`;
                contentPart = { text: "Analizza questa immagine URL." }; 
            }

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: contentPart.inlineData ? { parts: [{ text: prompt }, contentPart] } : prompt
            });

            const text = response.text || "";
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                setAiAdvice(result);
                if (result.status === 'danger') updateData({ imageLicense: 'copyright' });
                else if (result.status === 'caution') updateData({ imageLicense: 'cc' });
            } else {
                setAiAdvice({ status: 'caution', message: "Non riesco a determinare con certezza." });
            }
        } catch (e: any) {
            setAiAdvice({ status: 'caution', message: e.message || "Analisi AI fallita." });
        } finally {
            setAnalyzing(false);
        }
    };

    const isCreditRequired = imageLicense === 'cc' || imageLicense === 'copyright';
    const isBlocking = (imageLicense === 'cc' && !imageCredit) || imageLicense === 'copyright';

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden mb-6">
            <div className="flex border-b border-slate-700">
                <button onClick={() => setMode('url')} className={`flex-1 py-3 text-xs font-bold uppercase flex items-center justify-center gap-2 ${mode === 'url' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}><Link className="w-4 h-4"/> Link URL</button>
                <button onClick={() => setMode('upload')} className={`flex-1 py-3 text-xs font-bold uppercase flex items-center justify-center gap-2 ${mode === 'upload' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}><Upload className="w-4 h-4"/> Carica File</button>
            </div>
            <div className="p-4 space-y-4">
                {mode === 'url' ? (
                    <div className="flex gap-2">
                        <input value={imageUrl} onChange={(e) => { setLocalPreview(e.target.value); updateData({ imageUrl: e.target.value }); }} placeholder="https://..." className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none text-sm"/>
                        {imageUrl && (
                             <button onClick={handleResetToPlaceholder} className="p-3 bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 rounded-lg border border-slate-700 transition-colors" title="Rimuovi e usa Placeholder">
                                 <X className="w-4 h-4"/>
                             </button>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 shadow-lg">
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <ImageIcon className="w-4 h-4"/>} {isUploading ? 'Caricamento Cloud...' : `Seleziona Foto (${qualityMode === 'high' ? 'HD' : 'SD'})`}
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        {localPreview && (
                             <button onClick={handleResetToPlaceholder} className="text-xs text-red-400 hover:text-red-300 font-bold underline">
                                 Rimuovi Foto
                             </button>
                        )}
                    </div>
                )}

                {localPreview ? (
                    <div className="flex gap-4 items-start bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                        <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 border border-slate-700 relative bg-black group">
                            <img src={localPreview} className="w-full h-full object-cover" alt="Preview"/>
                            {dimensions && <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[9px] font-mono text-center py-0.5 opacity-100">{dimensions.w}x{dimensions.h}</div>}
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col">
                                    <h4 className="text-xs font-bold text-slate-300 uppercase">{localPreview.startsWith('data:') ? 'File Locale (In Upload...)' : 'Cloud URL'}</h4>
                                    {dimensions && <span className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1"><Maximize className="w-3 h-3"/> {dimensions.w} x {dimensions.h} px</span>}
                                </div>
                                <button onClick={analyzeCopyright} disabled={analyzing} className="text-[10px] bg-purple-600/20 text-purple-300 border border-purple-500/50 px-2 py-1 rounded flex items-center gap-1 hover:bg-purple-600/40 transition-colors">
                                    {analyzing ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>} AI Copyright Check
                                </button>
                            </div>
                            {aiAdvice && (
                                <div className={`text-xs p-2 rounded border flex gap-2 ${aiAdvice.status === 'safe' ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-300' : aiAdvice.status === 'danger' ? 'bg-red-900/20 border-red-500/50 text-red-300' : 'bg-amber-900/20 border-amber-500/50 text-amber-300'}`}>
                                    {aiAdvice.status === 'safe' && <CheckCircle className="w-4 h-4 shrink-0"/>}
                                    {aiAdvice.status === 'caution' && <Info className="w-4 h-4 shrink-0"/>}
                                    {aiAdvice.status === 'danger' && <ShieldAlert className="w-4 h-4 shrink-0"/>}
                                    <span>{aiAdvice.message}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={`p-4 rounded-xl flex items-center justify-between gap-3 border ${hasPlaceholder ? 'bg-indigo-900/10 border-indigo-500/30' : 'bg-red-900/10 border-red-500/30'}`}>
                         <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-full ${hasPlaceholder ? 'bg-indigo-500 text-white' : 'bg-red-500 text-white'}`}>
                                 {hasPlaceholder ? <RefreshCw className="w-4 h-4"/> : <AlertTriangle className="w-4 h-4"/>}
                             </div>
                             <div>
                                 <h4 className={`text-xs font-bold uppercase ${hasPlaceholder ? 'text-indigo-300' : 'text-red-300'}`}>
                                     {hasPlaceholder ? 'Placeholder Attivo' : 'Placeholder Mancante'}
                                 </h4>
                                 <p className="text-[10px] text-slate-400">
                                     Categoria: <span className="font-mono text-white">{category}</span> ({getPoiCategoryLabel(category)})
                                 </p>
                             </div>
                         </div>
                         
                         {hasPlaceholder ? (
                             <div className="h-10 w-16 rounded overflow-hidden border border-slate-700 bg-black relative">
                                 <img src={placeholderUrl} className="w-full h-full object-cover opacity-80" alt="Placeholder"/>
                                 <div className="absolute inset-0 bg-black/20"></div>
                             </div>
                         ) : (
                             <div className="text-[9px] text-red-400 font-bold max-w-[120px] text-right">
                                 Cambia Categoria in "Info" o carica una foto.
                             </div>
                         )}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Licenza / Fonte</label>
                        <select value={imageLicense} onChange={(e) => handleLicenseChange(e.target.value as any)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm focus:outline-none">
                            <option value="own">Opera Propria</option>
                            <option value="public">Dominio Pubblico</option>
                            <option value="cc">Creative Commons</option>
                            <option value="copyright">Copyright Protetto</option>
                        </select>
                    </div>
                    <div>
                        <label className={`text-[10px] font-bold uppercase block mb-1 flex items-center justify-between ${isCreditRequired ? 'text-amber-500' : 'text-slate-500'}`}>Attribuzione {isBlocking && <span className="text-[9px] bg-red-500 text-white px-1.5 rounded animate-pulse">RICHIESTO</span>}</label>
                        <input value={imageCredit} onChange={(e) => updateData({ imageCredit: e.target.value })} placeholder="Es. Foto di Mario Rossi" className={`w-full bg-slate-900 border rounded-lg p-2 text-white text-sm focus:outline-none ${isBlocking ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-indigo-500'}`}/>
                    </div>
                </div>
            </div>
        </div>
    );
};
