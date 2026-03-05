
import React, { useState, useEffect, useRef } from 'react';
import { Save, Upload, Loader2, Share2, Crop, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { getSetting, saveSetting, SETTINGS_KEYS } from '../../../services/settingsService';
import { uploadPublicMedia } from '../../../services/mediaService';
import { AdminPhotoInspector } from '../AdminPhotoInspector';

export const SocialPreviewConfig = () => {
    // ... (STATE)
    const [imageUrl, setImageUrl] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isInspectorOpen, setIsInspectorOpen] = useState(false);
    const [imageToEdit, setImageToEdit] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const load = async () => {
            const config = await getSetting<any>('social_preview_config');
            if (config) {
                setImageUrl(config.image || '');
                setTitle(config.title || 'Touring Diary - Scopri la Campania');
                setDescription(config.description || 'Pianifica il tuo viaggio, scopri luoghi unici e ottieni sconti esclusivi.');
            }
            setIsLoading(false);
        };
        load();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        await saveSetting('social_preview_config', { image: imageUrl, title, description });
        setIsSaving(false);
        setShowSuccessModal(true);
    };
    
    // ... (HANDLERS)

    const handleInspectorSave = async (data: { image: string }) => {
        setImageUrl(data.image);
        setIsInspectorOpen(false);
        setImageToEdit(null);
    };

    if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-500"/></div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in relative">
            {/* ... (UI) */}
             {isInspectorOpen && imageToEdit && (
                <AdminPhotoInspector 
                    isOpen={true}
                    imageUrl={imageToEdit}
                    onClose={() => { setIsInspectorOpen(false); setImageToEdit(null); }}
                    onSave={handleInspectorSave}
                    mode="social"
                    initialData={{ locationName: 'Social Preview', user: 'Admin' }}
                />
            )}
            
            {/* CONFIG PANEL */}
             <div className="space-y-6">
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-indigo-500"/> Dati Condivisione Link
                    </h3>
                    
                    <div className="space-y-4">
                         {/* Inputs */}
                         <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Titolo Sito</label>
                            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-indigo-500 outline-none"/>
                        </div>
                         {/* ... */}
                         <button onClick={handleSave} disabled={isSaving} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 mt-4">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Salva Configurazione
                        </button>
                    </div>
                </div>
            </div>
            {/* ... */}
        </div>
    );
};
