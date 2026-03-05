
import React, { useState } from 'react';
import { X, Share2, Loader2, Send, AlertCircle } from 'lucide-react';

interface Props {
    previewUrl: string;
    isUploading: boolean;
    uploadError: string | null;
    cityName: string;
    onCancel: () => void;
    onConfirm: (description: string, shareToLive: boolean) => void;
}

export const GalleryUploadModal = ({ previewUrl, isUploading, uploadError, cityName, onCancel, onConfirm }: Props) => {
    const [description, setDescription] = useState('');
    const [shareToLive, setShareToLive] = useState(true);

    return (
        <div className="absolute inset-0 z-[50] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm rounded-xl h-full min-h-[500px]">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-white">Descrivi il tuo scatto</h3>
                    <button onClick={onCancel} className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
                </div>
                
                <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4 border border-slate-800">
                    <img src={previewUrl} className="w-full h-full object-contain" alt="Preview"/>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Didascalia / Luogo</label>
                        <input 
                            autoFocus 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            placeholder={`Es. ${cityName} al tramonto...`} 
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm outline-none focus:border-emerald-500 transition-colors"
                        />
                    </div>
                    
                    {/* TOGGLE SHARE TO LIVE */}
                    <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-full ${shareToLive ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-500'}`}>
                                <Share2 className="w-4 h-4"/>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white">Posta nel Live Feed</span>
                                <span className="text-[9px] text-slate-400">Visibile a tutta la community</span>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={shareToLive} onChange={e => setShareToLive(e.target.checked)} className="sr-only peer" />
                            <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>
                    
                    {uploadError && (
                        <div className="text-red-400 text-xs font-bold bg-red-900/20 p-2 rounded border border-red-500/30 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> {uploadError}</div>
                    )}

                    <button 
                        onClick={() => onConfirm(description, shareToLive)} 
                        disabled={!description.trim() || isUploading} 
                        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>} 
                        {isUploading ? 'Compressione & Upload...' : 'Invia per Approvazione'}
                    </button>
                </div>
            </div>
        </div>
    );
};
