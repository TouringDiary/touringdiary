import React, { useState, useRef, useEffect } from 'react';
import { Monitor, Upload, ShieldCheck, Crop, Loader2, RefreshCw, Save, Image as ImageIcon, Plus, CheckCircle, AlertTriangle, X, Award, MessageSquare, Type, Lock, Share2, Bot, Trash2 } from 'lucide-react';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { SETTINGS_KEYS, getSetting, saveSetting } from '../../services/settingsService';
import { useConfig } from '@/context/ConfigContext';
import { uploadPublicMedia } from '../../services/mediaService';
import { AdminPhotoInspector } from './AdminPhotoInspector';
import { compressImage, dataURLtoFile } from '../../utils/common';
import { useAdminStyles } from '../../hooks/useAdminStyles';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { SafeArtPanel } from './design/SafeArtPanel';
import { PlaceholderGrid } from './design/PlaceholderGrid';

const GLOBAL_ASSET_DEFAULTS = {
    hero: 'https://images.unsplash.com/photo-1554797589-72413632cb75?w=1280&h=720&fit=crop',
    patron: 'https://images.unsplash.com/photo-1580834835824-839735a26622?w=150&h=150&fit=crop',
    auth_bg: 'https://images.unsplash.com/photo-1560440317-ac278253a693?w=1920&h=1080&fit=crop',
    social_bg: 'https://images.unsplash.com/photo-1554189097-90d3b64ea373?w=1080&h=1920&fit=crop',
    ai_box: ''
};

const AdminToast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
    <div className={`fixed top-6 right-6 z-[4000] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 border ${type === 'success' ? 'bg-emerald-600 border-emerald-400' : 'bg-red-600 border-red-400'} text-white`}>
        {type === 'success' ? <CheckCircle className="w-6 h-6 shrink-0"/> : <AlertTriangle className="w-6 h-6 shrink-0"/>}
        <div className="font-bold text-sm">{message}</div>
        <button onClick={onClose} className="ml-4 hover:bg-white/20 p-1 rounded-full"><X className="w-4 h-4"/></button>
    </div>
);

export const AdminHeaderManager = () => {
    const { configs, isLoading, updateSetting, refreshConfig } = useConfig();

    // STATE
    const [currentImage, setCurrentImage] = useState(GLOBAL_ASSET_DEFAULTS.hero);
    const [patronImage, setPatronImage] = useState(GLOBAL_ASSET_DEFAULTS.patron);
    const [placeholders, setPlaceholders] = useState<Record<string, string>>({});
    const [authBg, setAuthBg] = useState(GLOBAL_ASSET_DEFAULTS.auth_bg);
    const [socialBg, setSocialBg] = useState(GLOBAL_ASSET_DEFAULTS.social_bg);
    const [aiBg, setAiBg] = useState(GLOBAL_ASSET_DEFAULTS.ai_box);
    
    // UI State
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [mode, setMode] = useState<'upload' | 'generate'>('upload');
    const [isSavingHero, setIsSavingHero] = useState(false);
    const [isSavingPatron, setIsSavingPatron] = useState(false);
    const [isSavingExtra, setIsSavingExtra] = useState(false);
    const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);
    const [inspectorOpen, setInspectorOpen] = useState(false);
    const [imageToEdit, setImageToEdit] = useState('');
    const [editTarget, setEditTarget] = useState<'hero' | 'patron' | 'placeholder' | 'auth' | 'social' | 'ai_bg'>('hero');
    const [editPlaceholderCat, setEditPlaceholderCat] = useState<string>('');
    const [heroNote, setHeroNote] = useState('');

    // DELETE CONFIRMATION STATE
    const [showDeleteHeroConfirm, setShowDeleteHeroConfirm] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [deleteAssetTarget, setDeleteAssetTarget] = useState<'auth' | 'social' | 'ai_bg' | null>(null);

    // REFS
    const fileInputRef = useRef<HTMLInputElement>(null);
    const patronInputRef = useRef<HTMLInputElement>(null);
    const placeholderInputRef = useRef<HTMLInputElement>(null);
    const authInputRef = useRef<HTMLInputElement>(null);
    const socialInputRef = useRef<HTMLInputElement>(null);
    const aiBgInputRef = useRef<HTMLInputElement>(null);
    
    const { styles } = useAdminStyles();

    // Initial Load from ConfigContext
    useEffect(() => {
        if (!isLoading && configs) {
            const heroImage = configs[SETTINGS_KEYS.HERO_IMAGE];
            const patron = configs[SETTINGS_KEYS.DEFAULT_PATRON_IMAGE];
            const auth = configs[SETTINGS_KEYS.AUTH_BACKGROUND_IMAGE];
            const social = configs[SETTINGS_KEYS.SOCIAL_CANVAS_BG];
            const ai = configs[SETTINGS_KEYS.AI_CONSULTANT_BG];
            const ph = configs[SETTINGS_KEYS.CATEGORY_PLACEHOLDERS];

            setCurrentImage(heroImage || GLOBAL_ASSET_DEFAULTS.hero);
            setPreviewImage(heroImage || GLOBAL_ASSET_DEFAULTS.hero);
            setPatronImage(patron || GLOBAL_ASSET_DEFAULTS.patron);
            setAuthBg(auth || GLOBAL_ASSET_DEFAULTS.auth_bg);
            setSocialBg(social || GLOBAL_ASSET_DEFAULTS.social_bg);
            setAiBg(ai !== undefined ? ai : GLOBAL_ASSET_DEFAULTS.ai_box);
            setPlaceholders(ph || {});
        }
    }, [configs, isLoading]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), type === 'error' ? 8000 : 4000);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'hero' | 'patron' | 'placeholder' | 'auth' | 'social' | 'ai_bg', phCat?: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const compressedBase64 = await compressImage(file);
            const compressedFile = dataURLtoFile(compressedBase64, file.name);
            const publicUrl = await uploadPublicMedia(compressedFile, 'admin_assets');

            if (publicUrl) {
                if (target === 'hero') setPreviewImage(publicUrl);
                else if (target === 'patron') setPatronImage(publicUrl);
                else if (target === 'auth') setAuthBg(publicUrl);
                else if (target === 'social') setSocialBg(publicUrl);
                else if (target === 'ai_bg') setAiBg(publicUrl);
                else if (target === 'placeholder' && phCat) await handleSavePlaceholder(phCat, publicUrl);
                
                showToast("Immagine caricata con successo!", 'success');
            } else {
                showToast("Errore upload cloud.", 'error');
            }
        } catch (err) {
            console.error(err);
            showToast("Errore elaborazione file.", 'error');
        } finally {
             if (fileInputRef.current) fileInputRef.current.value = '';
             if (patronInputRef.current) patronInputRef.current.value = '';
             if (placeholderInputRef.current) placeholderInputRef.current.value = '';
             if (authInputRef.current) authInputRef.current.value = '';
             if (socialInputRef.current) socialInputRef.current.value = '';
             if (aiBgInputRef.current) aiBgInputRef.current.value = '';
        }
    };

    const handleSaveHero = async () => {
        setIsSavingHero(true);
        const valToSave = previewImage === GLOBAL_ASSET_DEFAULTS.hero ? '' : previewImage;
        await updateSetting(SETTINGS_KEYS.HERO_IMAGE, valToSave);
        setCurrentImage(previewImage || GLOBAL_ASSET_DEFAULTS.hero);
        setIsSavingHero(false);
        showToast("Header salvato!", 'success');
    };
    
    const handleRemoveHeroRequest = () => setShowDeleteHeroConfirm(true);

    const confirmRemoveHero = () => {
        setPreviewImage(GLOBAL_ASSET_DEFAULTS.hero); 
        setShowDeleteHeroConfirm(false);
        showToast("Immagine rimossa dall'anteprima. Clicca 'Applica' per salvare il default.", 'success');
    };

    const handleRemoveAssetRequest = (target: 'auth' | 'social' | 'ai_bg') => setDeleteAssetTarget(target);

    const confirmRemoveAsset = () => {
        if (deleteAssetTarget === 'auth') setAuthBg(GLOBAL_ASSET_DEFAULTS.auth_bg);
        else if (deleteAssetTarget === 'social') setSocialBg(GLOBAL_ASSET_DEFAULTS.social_bg);
        else if (deleteAssetTarget === 'ai_bg') setAiBg('');
        
        setDeleteAssetTarget(null);
        showToast("Asset rimosso/ripristinato. Clicca 'Salva Asset' per confermare.", 'success');
    };

    const handleSavePatron = async () => {
        setIsSavingPatron(true);
        const valToSave = patronImage === GLOBAL_ASSET_DEFAULTS.patron ? '' : patronImage;
        await updateSetting(SETTINGS_KEYS.DEFAULT_PATRON_IMAGE, valToSave);
        setIsSavingPatron(false);
        showToast("Patrono master aggiornato!", 'success');
    };
    
    const handleSaveExtraAssets = async () => {
        setIsSavingExtra(true);
        try {
            const newAssetData = {
                'auth_background_image': authBg === GLOBAL_ASSET_DEFAULTS.auth_bg ? '' : authBg,
                'social_canvas_bg': socialBg === GLOBAL_ASSET_DEFAULTS.social_bg ? '' : socialBg,
                'ai_consultant_bg': aiBg,
            };

            await updateSetting(SETTINGS_KEYS.AUTH_BACKGROUND_IMAGE, newAssetData.auth_background_image);
            await updateSetting(SETTINGS_KEYS.SOCIAL_CANVAS_BG, newAssetData.social_canvas_bg);
            await updateSetting(SETTINGS_KEYS.AI_CONSULTANT_BG, newAssetData.ai_consultant_bg);
            await refreshConfig();

            showToast("Asset funzionali salvati in 'design_system'!", 'success');
        } catch (err) {
            console.error("Errore durante il salvataggio degli asset:", err);
            showToast("Errore imprevisto durante il salvataggio.", 'error');
        } finally {
            setIsSavingExtra(false);
        }
    };
    
    const handleReset = () => setShowResetConfirm(true);

    const executeReset = async () => {
        setPreviewImage(GLOBAL_ASSET_DEFAULTS.hero);
        setCurrentImage(GLOBAL_ASSET_DEFAULTS.hero);
        await updateSetting(SETTINGS_KEYS.HERO_IMAGE, ''); 
        showToast("Reset completato.", 'success');
        setShowResetConfirm(false);
    };

    const handleResetPatronGlobal = async () => {
        setPatronImage(GLOBAL_ASSET_DEFAULTS.patron);
        await updateSetting(SETTINGS_KEYS.DEFAULT_PATRON_IMAGE, '');
        showToast("Patrono reset.", 'success');
    };

    const handleSavePlaceholder = async (cat: string, url: string) => {
        const updated = { ...placeholders, [cat]: url };
        setPlaceholders(updated);
        await updateSetting(SETTINGS_KEYS.CATEGORY_PLACEHOLDERS, updated);
        showToast(`Placeholder per ${cat} aggiornato!`, 'success');
    };

    const openEditor = (url: string, target: 'hero' | 'patron' | 'placeholder' | 'auth' | 'social' | 'ai_bg', cat?: string) => {
        if (!url) return;
        setImageToEdit(url);
        setEditTarget(target);
        if (cat) setEditPlaceholderCat(cat);
        setInspectorOpen(true);
    };

    const handleEditorSave = async (data: { image: string }) => {
        const newImageUrl = data.image;
        if (editTarget === 'hero') {
            setPreviewImage(newImageUrl);
            setHeroNote("Immagine modificata pronta per il salvataggio.");
        } else if (editTarget === 'patron') {
            setPatronImage(newImageUrl);
        } else if (editTarget === 'auth') {
            setAuthBg(newImageUrl);
        } else if (editTarget === 'social') {
            setSocialBg(newImageUrl);
        } else if (editTarget === 'ai_bg') {
            setAiBg(newImageUrl);
        } else if (editTarget === 'placeholder' && editPlaceholderCat) {
            await handleSavePlaceholder(editPlaceholderCat, newImageUrl);
        }
        setInspectorOpen(false);
    };
    
    const triggerPlaceholderUpload = (cat: string) => {
        setEditPlaceholderCat(cat);
        if (placeholderInputRef.current) placeholderInputRef.current.value = '';
        placeholderInputRef.current?.click();
    };
    
    const handleSafeArtSuccess = (url: string) => {
        setPreviewImage(url);
        setMode('upload');
        showToast("Safe-Art Generata con successo!", 'success');
    };

    return (
        <div className="space-y-8 animate-in fade-in relative min-h-screen overflow-hidden pb-20">
            
            {toast && <AdminToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <DeleteConfirmationModal
                isOpen={showDeleteHeroConfirm}
                onClose={() => setShowDeleteHeroConfirm(false)}
                onConfirm={confirmRemoveHero}
                title="Rimuovere Hero Image?"
                message="L'immagine verrà rimossa e il sito mostrerà lo stile di default. Devi cliccare 'Applica Header' per confermare."
                confirmLabel="Rimuovi"
                variant="danger"
                icon={<Trash2 className="w-8 h-8 text-red-500 animate-pulse"/>}
            />

            <DeleteConfirmationModal
                isOpen={!!deleteAssetTarget}
                onClose={() => setDeleteAssetTarget(null)}
                onConfirm={confirmRemoveAsset}
                title={deleteAssetTarget === 'ai_bg' ? "Rimuovere Immagine?" : "Ripristinare Default?"}
                message={deleteAssetTarget === 'ai_bg' 
                    ? "L'immagine del Box AI verrà rimossa e verrà usato lo stile nativo del sito (sfondo scuro)." 
                    : "L'immagine verrà sostituita con quella predefinita del sistema."}
                confirmLabel={deleteAssetTarget === 'ai_bg' ? "Rimuovi Foto" : "Ripristina Default"}
                cancelLabel="Annulla"
                variant={deleteAssetTarget === 'ai_bg' ? "danger" : "info"}
                icon={deleteAssetTarget === 'ai_bg' ? <Trash2 className="w-8 h-8 text-red-500"/> : <RefreshCw className="w-8 h-8 text-amber-500 animate-spin-slow"/>}
            />

            <DeleteConfirmationModal
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                onConfirm={executeReset}
                title="Ripristina Default"
                message="Ripristinare l'immagine di default?"
                confirmLabel="Ripristina"
                variant="info"
            />
            
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-600 rounded-xl shadow-lg">
                        <Monitor className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className={styles.admin_page_title}>Design & Asset Globali</h2>
                        <p className={styles.admin_page_subtitle}>Personalizza l'aspetto e i fallback</p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg overflow-hidden relative z-10">
                 <div className="flex justify-end items-center p-4 border-b border-slate-800 bg-slate-950/50">
                    <button onClick={handleReset} className="bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-colors">
                        <RefreshCw className="w-4 h-4"/> Ripristina Default
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-6">
                        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                            <button onClick={() => setMode('upload')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-md flex items-center justify-center gap-2 transition-all ${mode === 'upload' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>
                                <Upload className="w-4 h-4"/> Carica / URL
                            </button>
                            <button onClick={() => setMode('generate')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-md flex items-center justify-center gap-2 transition-all ${mode === 'generate' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>
                                <ImageIcon className="w-4 h-4"/> Safe-Art Gen
                            </button>
                        </div>

                        <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-slate-700 bg-black group shadow-lg">
                            <ImageWithFallback 
                                src={previewImage || GLOBAL_ASSET_DEFAULTS.hero} 
                                alt="Hero" 
                                className="w-full h-full object-cover opacity-60 grayscale-[30%] group-hover:grayscale-[10%] transition-all duration-1000"
                                priority={true} 
                            />
                             <div className="absolute top-2 right-2 flex gap-2">
                                <button onClick={() => openEditor(previewImage || GLOBAL_ASSET_DEFAULTS.hero, 'hero')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg shadow-lg border border-white/20 transition-colors flex items-center gap-2 text-[10px] font-bold uppercase" title="Modifica e Ritaglia">
                                    <Crop className="w-4 h-4"/> <span className="hidden lg:inline">Ritaglia / Effetti</span>
                                </button>
                                <button onClick={handleRemoveHeroRequest} className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg shadow-lg border border-white/20 transition-colors" title="Rimuovi Immagine">
                                    <Trash2 className="w-4 h-4"/>
                                </button>
                             </div>
                        </div>
                        
                        {mode === 'upload' ? (
                            <div className="flex gap-3">
                                <button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold text-sm border border-slate-700 transition-colors flex items-center justify-center gap-2">
                                    <Upload className="w-4 h-4"/> Carica File
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'hero')} />
                            </div>
                        ) : (
                            <SafeArtPanel 
                                onImageGenerated={handleSafeArtSuccess} 
                                onError={(msg) => showToast(msg, 'error')} 
                            />
                        )}

                        <button onClick={handleSaveHero} disabled={isSavingHero} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white py-4 rounded-xl font-bold text-base shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 mt-4">
                            {isSavingHero ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5"/>} 
                            Applica Header (DB)
                        </button>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col gap-4">
                            <div className="flex items-center gap-3 mb-2 justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-900/20 rounded-lg text-amber-500"><Award className="w-6 h-6"/></div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Patrono Master</h3>
                                        <p className="text-xs text-slate-400">Default per nuovi Santi</p>
                                    </div>
                                </div>
                                <button onClick={handleResetPatronGlobal} className="text-[10px] text-slate-500 hover:text-red-400 underline">Reset</button>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-slate-700 shadow-xl group shrink-0">
                                    <img src={patronImage || GLOBAL_ASSET_DEFAULTS.patron} className="w-full h-full object-cover" onClick={() => openEditor(patronImage || GLOBAL_ASSET_DEFAULTS.patron, 'patron')}/>
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => openEditor(patronImage || GLOBAL_ASSET_DEFAULTS.patron, 'patron')}>
                                        <Crop className="w-6 h-6 text-white"/>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 w-full">
                                    <button onClick={() => patronInputRef.current?.click()} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase rounded-lg border border-slate-600 transition-colors">
                                        Carica File
                                    </button>
                                    <input ref={patronInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'patron')} />
                                    <button onClick={handleSavePatron} disabled={isSavingPatron} className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold uppercase rounded-lg shadow-lg transition-colors flex items-center justify-center gap-2">
                                        {isSavingPatron ? <Loader2 className="w-3 h-3 animate-spin"/> : <Save className="w-3 h-3"/>} Salva
                                    </button>
                                </div>
                            </div>
                        </div>

                        <PlaceholderGrid 
                            placeholders={placeholders} 
                            onUploadClick={triggerPlaceholderUpload} 
                            onEditClick={(url, catId) => openEditor(url, 'placeholder', catId)} 
                        />
                        <input ref={placeholderInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'placeholder', editPlaceholderCat)} />

                    </div>
                </div>
            </div>
            
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg mt-8">
                 <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                     <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Monitor className="w-5 h-5 text-indigo-500"/> Asset Funzionali
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Immagini di sistema per login, condivisione e AI.</p>
                     </div>
                     <button onClick={handleSaveExtraAssets} disabled={isSavingExtra} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold uppercase text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95">
                         {isSavingExtra ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Salva Asset
                     </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-4">
                         <div className="flex items-center justify-between mb-1">
                             <div className="flex items-center gap-2">
                                 <div className="p-2 bg-indigo-900/20 rounded-lg text-indigo-400"><Lock className="w-4 h-4"/></div>
                                 <div>
                                     <h4 className="font-bold text-white text-sm">Background Login</h4>
                                     <p className="text-[10px] text-slate-500 uppercase">Schermata Auth</p>
                                 </div>
                             </div>
                             <button onClick={() => handleRemoveAssetRequest('auth')} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded transition-colors"><Trash2 className="w-4 h-4"/></button>
                         </div>
                         <div className="aspect-video bg-black rounded-lg overflow-hidden relative group border border-slate-700">
                             <img src={authBg || GLOBAL_ASSET_DEFAULTS.auth_bg} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" alt="Auth BG"/>
                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity gap-2">
                                 <button onClick={() => authInputRef.current?.click()} className="p-2 bg-white text-slate-900 rounded-full shadow-lg hover:scale-110 transition-transform"><Upload className="w-4 h-4"/></button>
                                 <button onClick={() => openEditor(authBg || GLOBAL_ASSET_DEFAULTS.auth_bg, 'auth')} className="p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform"><Crop className="w-4 h-4"/></button>
                             </div>
                             <input ref={authInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'auth')} />
                         </div>
                     </div>

                     <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-4">
                         <div className="flex items-center justify-between mb-1">
                             <div className="flex items-center gap-2">
                                 <div className="p-2 bg-pink-900/20 rounded-lg text-pink-400"><Share2 className="w-4 h-4"/></div>
                                 <div>
                                     <h4 className="font-bold text-white text-sm">Social Canvas Default</h4>
                                     <p className="text-[10px] text-slate-500 uppercase">Viral Kit</p>
                                 </div>
                             </div>
                             <button onClick={() => handleRemoveAssetRequest('social')} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded transition-colors"><Trash2 className="w-4 h-4"/></button>
                         </div>
                         <div className="aspect-[3/4] bg-black rounded-lg overflow-hidden relative group border border-slate-700 max-w-[150px] mx-auto">
                             <img src={socialBg || GLOBAL_ASSET_DEFAULTS.social_bg} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" alt="Social BG"/>
                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity gap-2">
                                 <button onClick={() => socialInputRef.current?.click()} className="p-2 bg-white text-slate-900 rounded-full shadow-lg hover:scale-110 transition-transform"><Upload className="w-4 h-4"/></button>
                                 <button onClick={() => openEditor(socialBg || GLOBAL_ASSET_DEFAULTS.social_bg, 'social')} className="p-2 bg-pink-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform"><Crop className="w-4 h-4"/></button>
                             </div>
                             <input ref={socialInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'social')} />
                         </div>
                     </div>
                     
                     <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col gap-4">
                         <div className="flex items-center justify-between mb-1">
                             <div className="flex items-center gap-2">
                                 <div className="p-2 bg-purple-900/20 rounded-lg text-purple-400"><Bot className="w-4 h-4"/></div>
                                 <div>
                                     <h4 className="font-bold text-white text-sm">Box AI Consultant</h4>
                                     <p className="text-[10px] text-slate-500 uppercase">Home Page</p>
                                 </div>
                             </div>
                             <button onClick={() => handleRemoveAssetRequest('ai_bg')} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded transition-colors"><Trash2 className="w-4 h-4"/></button>
                         </div>
                         
                         <div className="aspect-video bg-black rounded-lg overflow-hidden relative group border border-slate-700">
                             {aiBg ? (
                                <img src={aiBg} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" alt="AI BG"/>
                             ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-500 text-xs font-bold uppercase tracking-widest border-2 border-dashed border-slate-700">
                                    Nessuna Foto (Stile Sito)
                                </div>
                             )}
                             
                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity gap-2">
                                 <button onClick={() => aiBgInputRef.current?.click()} className="p-2 bg-white text-slate-900 rounded-full shadow-lg hover:scale-110 transition-transform"><Upload className="w-4 h-4"/></button>
                                 {aiBg && <button onClick={() => openEditor(aiBg, 'ai_bg')} className="p-2 bg-purple-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform"><Crop className="w-4 h-4"/></button>}
                             </div>
                             <input ref={aiBgInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'ai_bg')} />
                         </div>
                     </div>
                 </div>
            </div>

            {heroNote && (
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 animate-in fade-in">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                         <MessageSquare className="w-4 h-4 text-purple-500"/> Nota
                    </h4>
                    <p className="text-sm text-slate-300 italic">"{heroNote}"</p>
                </div>
            )}
            
            {inspectorOpen && (
                <AdminPhotoInspector 
                    isOpen={true}
                    imageUrl={imageToEdit}
                    mode={editTarget === 'patron' ? 'card' : 'hero'}
                    initialData={{ locationName: 'Design Asset', user: 'Admin', description: `Ottimizzazione ${editTarget}` }}
                    onClose={() => setInspectorOpen(false)}
                    onSave={handleEditorSave}
                />
            )}
        </div>
    );
};
