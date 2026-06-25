import { Z_MODAL_NESTED } from '@/constants/zIndex';
import React, { useState, useRef, useEffect, useMemo, useContext } from 'react';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { Camera, Heart, MapPin, ChevronDown, Smile, Send, Loader2, X, Clock, Trash2, Trophy, ChevronLeft, ChevronRight, Edit3 } from 'lucide-react';
import { PhotoSubmission, User as UserType, CitySummary } from '../../types/index';

import { compressImage } from '../../utils/common';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { fetchCommunityPhotos, uploadCommunityPhoto, deletePhotoSubmissionInDb, updatePhotoData } from '../../services/photoService';
import { analyzeImageSafety, generateImageCaption } from '../../services/ai/aiVision';
import { CountBadge } from '@/components/ui/CountBadge';
import { getFullManifestAsync } from '../../services/cityService';
import { useModal } from '../../context/ModalContext';
import { useInteraction } from '../../context/InteractionContext';
import { useNavigation } from '../../context/useNavigation';
import { UserPhotoEditor } from './UserPhotoEditor';
import { GalleryLightbox, LightboxData } from '../city/gallery/GalleryLightbox'; // IMPORT CONDIVISO
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';

interface LiveFeedTabProps {
    user: UserType;
    onUserUpdate?: (user: UserType) => void;
}

const EMOJIS = ['😀', '😍', '✈️', '🌍', '🍕', '📸', '🌊', '☀️', '🏛️', '🍝', '🍷', '🎉', '🔥', '❤️', '😎'];

export const LiveFeedTab = ({ user, onUserUpdate }: LiveFeedTabProps) => {
    const { openModal } = useModal();
    const { activeCityId } = useNavigation();
    const [liveSnaps, setLiveSnaps] = useState<PhotoSubmission[]>([]);
    const { togglePhotoHeart: toggleLiveSnapHeart, getPhotoStatus: getLiveSnapStatus } = useInteraction();
    const [visibleSnapsCount, setVisibleSnapsCount] = useState(15);

    // LIGHTBOX NAVIGATION STATE
    const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    // HERO SLIDER STATE
    const [heroIndex, setHeroIndex] = useState(0);

    // UPLOAD FORM STATES
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStep, setUploadStep] = useState<string>('');
    const [uploadPreview, setUploadPreview] = useState<{ url: string, file: File, hash: string } | null>(null);
    const [snapCaption, setSnapCaption] = useState('');
    const [isOfficialUpload, setIsOfficialUpload] = useState(false);

    // EDITOR STATE
    const [showEditor, setShowEditor] = useState(false);
    const [rawFile, setRawFile] = useState<File | null>(null);

    // NEW FIELDS
    const [cityManifest, setCityManifest] = useState<CitySummary[]>([]);
    const [selectedCityId, setSelectedCityId] = useState(activeCityId || '');
    const [streetName, setStreetName] = useState('');

    // REWARD STATE
    const [showRewardModal, setShowRewardModal] = useState(false);
    const [earnedXp, setEarnedXp] = useState(0);

    // DELETE STATE
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, caption: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Sincronizzazione selectedCityId con activeCityId quando cambia (navigazione)
    useEffect(() => {
        if (activeCityId) setSelectedCityId(activeCityId);
    }, [activeCityId]);

    // ANTI-DUPLICATE LOCAL CACHE
    const uploadedHashes = useRef<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);
    const thumbScrollRef = useRef<HTMLDivElement>(null);

    const isAdmin = user.role === 'admin_all' || user.role === 'admin_limited';

    const refreshSnaps = async () => {
        const snaps = await fetchCommunityPhotos('approved');
        setLiveSnaps(snaps);
    };

    useEffect(() => {
        refreshSnaps();
        getFullManifestAsync().then(setCityManifest);
    }, [user]);

    const filteredSnaps = useMemo(() => {
        return liveSnaps.filter(s => {
            if (isAdmin) return true;
            if (user && s.userId === user.id) return true;
            return s.status === 'approved' || !s.status;
        });
    }, [liveSnaps, user.id, isAdmin]);

    // Calcolo Lightbox Data
    const lightboxData: LightboxData | null = useMemo(() => {
        if (activeLightboxIndex === null || !filteredSnaps[activeLightboxIndex]) return null;
        const s = filteredSnaps[activeLightboxIndex];
        return {
            id: s.id,
            url: s.url,
            user: s.user,
            likes: s.likes,
            caption: s.description,
            date: s.date
        };
    }, [activeLightboxIndex, filteredSnaps]);

    // 1. MODIFICA: Centralizzazione ESC tramite hook globale
    useGlobalModalEscape(activeLightboxIndex !== null || (!!uploadPreview && !isUploading && !showEditor), (e) => {
        e?.stopPropagation?.();
        if (activeLightboxIndex !== null) {
            setActiveLightboxIndex(null);
        } else if (uploadPreview && !isUploading && !showEditor) {
            resetUploadForm();
        }
    });

    // 2. TASK 4: Gallery Synchronization logic
    useEffect(() => {
        if (thumbScrollRef.current) {
            const activeThumb = thumbScrollRef.current.querySelector(`[data-index="${heroIndex}"]`);
            if (activeThumb) {
                activeThumb.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
            }
        }
    }, [heroIndex]);

    // HERO NAVIGATION
    const nextHero = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setHeroIndex(prev => (prev + 1) % filteredSnaps.length);
    };

    const prevHero = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setHeroIndex(prev => (prev - 1 + filteredSnaps.length) % filteredSnaps.length);
    };

    const resetUploadForm = () => {
        setUploadPreview(null);
        setSnapCaption('');
        setSelectedCityId(activeCityId || '');
        setStreetName('');
        setShowEmojiPicker(false);
        setIsUploading(false);
        setUploadStep('');
        setRawFile(null);
        setShowEditor(false);
        setIsOfficialUpload(false);
    };

    const handleSnapSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setRawFile(file);
        setShowEditor(true);
        e.target.value = '';
    };

    const handleEditorSave = async (editedFile: File, previewUrl: string) => {
        setShowEditor(false);
        const fileHash = `${editedFile.name}-${editedFile.size}-${Date.now()}`;
        if (uploadedHashes.current.has(fileHash)) {
            alert("File già processato.");
            return;
        }
        setUploadPreview({ url: previewUrl, file: editedFile, hash: fileHash });
    };

    const handleConfirmUpload = async () => {
        if (!uploadPreview) return;
        if (!selectedCityId) { alert("Seleziona la città!"); return; }
        if (!snapCaption.trim()) { alert("Inserisci una didascalia!"); return; }

        setIsUploading(true);
        const cityObj = cityManifest.find(c => c.id === selectedCityId);
        const cityName = cityObj ? cityObj.name : "Campania";

        try {
            setUploadStep('AI: Controllo Duplicati...');
            const aiVisualFingerprint = await generateImageCaption(uploadPreview.url, `Descrivi dettagliatamente questa foto di ${cityName} per controllo duplicati.`);
            const isGenericStock = aiVisualFingerprint.toLowerCase().includes('stock') || aiVisualFingerprint.toLowerCase().includes('generica');

            if (isGenericStock) throw new Error("L'AI ha identificato questa come un'immagine generica o stock.");

            setUploadStep('AI: Analisi Sicurezza...');
            let finalStatus: 'approved' | 'pending' = 'pending';
            if (!isAdmin) {
                const safetyResult = await analyzeImageSafety(uploadPreview.url);
                if (safetyResult.isSafe) finalStatus = 'approved';
            } else {
                finalStatus = 'approved';
            }

            setUploadStep('Salvataggio...');
            const finalCaption = streetName ? `${snapCaption} (${streetName})` : snapCaption;

            const savedSnap = await uploadCommunityPhoto(
                uploadPreview.file,
                user.id,
                user.name,
                cityName,
                finalCaption,
                selectedCityId,
                finalStatus,
                isOfficialUpload
            );

            if (savedSnap) {
                setLiveSnaps(prev => [savedSnap, ...prev]);
                uploadedHashes.current.add(uploadPreview.hash);
                setHeroIndex(0);

                if (user.role !== 'guest') {
                    const xpAmount = 50;
                    // XP is now handled by Supabase trigger
                    if (onUserUpdate) {
                        const updatedUser = { ...user, xp: (user.xp || 0) + xpAmount };
                        onUserUpdate(updatedUser);
                    }
                    setEarnedXp(xpAmount);
                    setShowRewardModal(true);
                    setTimeout(() => { resetUploadForm(); }, 500);
                } else {
                    resetUploadForm();
                    alert("Foto caricata! Accedi per guadagnare XP.");
                }
            } else {
                throw new Error("Salvataggio fallito");
            }
        } catch (e: any) {
            console.error(e);
            alert(e.message || "Errore durante il caricamento.");
            setIsUploading(false);
        }
    };

    const handleEmojiClick = (emoji: string) => {
        setSnapCaption(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    const handleDeleteRequest = (snap: PhotoSubmission) => {
        setDeleteTarget({ id: snap.id, caption: snap.description || 'Senza titolo' });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await deletePhotoSubmissionInDb(deleteTarget.id);
            setLiveSnaps(prev => prev.filter(s => s.id !== deleteTarget.id));
            setDeleteTarget(null);
            if (heroIndex >= liveSnaps.length - 1) setHeroIndex(0);
        } catch (e) { console.error(e); alert("Errore durante l'eliminazione."); } finally { setIsDeleting(false); }
    };

    // Lightbox Handlers
    const openLightbox = (snapId: string) => {
        const index = filteredSnaps.findIndex(s => s.id === snapId);
        if (index !== -1) setActiveLightboxIndex(index);
    };

    console.log("UPLOAD MODAL STATE:", {
        uploadPreview,
        showRewardModal,
        showEditor,
        selectedCityId
    });
    const heroSnap = filteredSnaps[heroIndex];
    // TASK 4: Non escludiamo più la heroSnap per permettere la sincronizzazione visuale nella strip
    const gridSnaps = filteredSnaps.slice(0, visibleSnapsCount);
    const hasMore = filteredSnaps.length > visibleSnapsCount;

    return (
        <div className="flex flex-col h-full relative">

            {/* LIGHTBOX CONDIVISA E POTENZIATA */}
            {lightboxData && (
                <GalleryLightbox
                    data={lightboxData}
                    onClose={() => setActiveLightboxIndex(null)}
                    onNext={() => setActiveLightboxIndex(i => (i !== null && i < filteredSnaps.length - 1) ? i + 1 : i)}
                    onPrev={() => setActiveLightboxIndex(i => (i !== null && i > 0) ? i - 1 : i)}
                    hasNext={activeLightboxIndex !== null && activeLightboxIndex < filteredSnaps.length - 1}
                    hasPrev={activeLightboxIndex !== null && activeLightboxIndex > 0}
                />
            )}

            {showEditor && rawFile && <UserPhotoEditor file={rawFile} onSave={handleEditorSave} onCancel={() => { setShowEditor(false); setRawFile(null); }} />}

            {showRewardModal && (
                <div
                    className="absolute inset-0 flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-md animate-in fade-in zoom-in-95"
                    style={{ zIndex: Z_MODAL_NESTED }}
                >
                    <div className="flex flex-col items-center text-center space-y-6 max-w-sm w-full">
                        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center border-4 border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.5)] animate-bounce">
                            <Trophy className="w-12 h-12 text-emerald-400 fill-emerald-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black text-white uppercase tracking-wide">Grande Scatto!</h3>
                            <p className="text-slate-400">Hai appena guadagnato</p>
                            <div className="text-5xl font-black text-amber-500 drop-shadow-lg">+{earnedXp} XP</div>
                        </div>
                        <button onClick={() => setShowRewardModal(false)} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl uppercase tracking-widest transition-all shadow-xl border border-slate-700">Continua</button>
                    </div>
                </div>
            )}

            <DeleteConfirmationModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} title="Eliminare Snap?" message={`Stai per cancellare definitivamente la foto "${deleteTarget?.caption}".`} isDeleting={isDeleting} />

            {uploadPreview && !showRewardModal && !showEditor && (
                <div className="fixed top-header-mob md:top-header inset-x-0 bottom-0 z-modal bg-slate-950/98 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="w-full max-w-md flex flex-col bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden max-h-[80vh]">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/50">
                            <h3 className="text-xl font-bold text-white">Nuovo Scatto</h3>
                            <button onClick={resetUploadForm} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {!activeCityId && (
                                <div className="bg-indigo-900/10 border border-indigo-500/20 p-3 rounded-xl">
                                    <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5 block">Seleziona Città (Richiesto)</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                                        <select value={selectedCityId} onChange={(e) => setSelectedCityId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pl-10 text-sm font-bold text-white focus:border-indigo-500 outline-none appearance-none cursor-pointer"><option value="">Scegli città...</option>{cityManifest.sort((a, b) => a.name.localeCompare(b.name)).map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}</select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                    </div>
                                </div>
                            )}
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden border-2 border-indigo-500 bg-black group">
                                <img src={uploadPreview.url} className="w-full h-full object-contain" alt="Preview" />
                                <button onClick={() => { setShowEditor(true); setRawFile(uploadPreview.file); }} className="absolute bottom-2 right-2 bg-slate-800 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity border border-slate-600 hover:bg-slate-700" title="Modifica Ancora"><Edit3 className="w-4 h-4" /></button>
                            </div>
                            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                                {isAdmin && (
                                    <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-indigo-500/30 mb-2">
                                        <div>
                                            <p className="text-xs font-bold text-white uppercase tracking-wider">Tipo Contenuto</p>
                                            <p className="text-[10px] text-slate-400">Definisci se editoriale o community</p>
                                        </div>
                                        <div className="flex bg-slate-800 p-1 rounded-lg">
                                            <button 
                                                onClick={() => setIsOfficialUpload(false)}
                                                className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${!isOfficialUpload ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                                            >
                                                Community
                                            </button>
                                            <button 
                                                onClick={() => setIsOfficialUpload(true)}
                                                className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${isOfficialUpload ? 'bg-amber-500 text-black shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                                            >
                                                Official
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Via / Luogo (Opzionale)</label><input value={streetName} onChange={(e) => setStreetName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-indigo-500 outline-none" placeholder="Es. Piazza del Plebiscito" /></div>
                                <div className="relative"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Didascalia</label><input value={snapCaption} onChange={(e) => setSnapCaption(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pr-10 text-white focus:border-indigo-500 outline-none" placeholder="Scrivi un pensiero..." /><button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="absolute right-2 bottom-2 text-slate-400 hover:text-amber-400 transition-colors p-1"><Smile className="w-5 h-5" /></button>{showEmojiPicker && (<div className="absolute bottom-full right-0 mb-2 bg-slate-800 border border-slate-700 rounded-xl p-2 shadow-xl grid grid-cols-5 gap-1 z-modal">{EMOJIS.map(em => (<button key={em} onClick={() => handleEmojiClick(em)} className="text-xl p-1 hover:bg-slate-700 rounded">{em}</button>))}</div>)}</div>
                            </div>
                        </div>

                        {/* Sticky Footer for "Pubblica" Button */}
                        <div className="p-4 bg-slate-900 border-t border-slate-800">
                            <button onClick={handleConfirmUpload} disabled={isUploading || !selectedCityId || !snapCaption} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">
                                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                {isUploading && uploadStep ? uploadStep : 'Pubblica Foto (+50 XP)'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="sticky top-0 z-modal pb-4 bg-[#020617] flex justify-between items-center px-4 md:px-8 pt-1 border-b border-slate-800/50 mb-2">
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div><h3 className="text-white font-bold uppercase tracking-widest text-sm">Live Feed</h3></div>
                <div className="flex items-center gap-2">
                    {!activeCityId && (
                        <div className="relative min-w-[140px]">
                            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400" />
                            <select value={selectedCityId} onChange={(e) => setSelectedCityId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-8 pr-8 text-[11px] font-bold text-white focus:border-indigo-500 outline-none appearance-none cursor-pointer"><option value="">Città...</option>{cityManifest.sort((a, b) => a.name.localeCompare(b.name)).map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}</select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                        </div>
                    )}
                    <button onClick={() => fileInputRef.current?.click()} disabled={isUploading || user.role === 'guest' || !selectedCityId} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/30 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-95"><Camera className="w-4 h-4" /> Scatta</button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleSnapSelect} />
                </div>
            </div>

            <div className="flex-1 flex flex-col pb-10 px-4 md:px-8">
                {heroSnap && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-700 -mx-4 md:-mx-8 mb-4 relative group">
                        <div className="relative w-full h-[45vh] md:h-[38vh] overflow-hidden shadow-2xl cursor-zoom-in bg-slate-900 md:rounded-3xl" onClick={() => openLightbox(heroSnap.id)}>
                            <div className="absolute inset-0 overflow-hidden"><img src={heroSnap.url} alt="Background" className="w-full h-full object-cover blur-xl scale-110 opacity-50 brightness-50" /></div>
                            <div className="absolute inset-0 flex items-center justify-center p-2"><ImageWithFallback src={heroSnap.url} alt="Hero" className="w-full h-full object-contain shadow-lg rounded-lg relative z-floating-panel" /></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80 z-dropdown pointer-events-none"></div>

                            {filteredSnaps.length > 1 && (
                                <>
                                    <button onClick={prevHero} className="absolute top-1/2 left-2 -translate-y-1/2 p-3 bg-black/30 hover:bg-black/60 backdrop-blur-md rounded-full text-white z-dropdown transition-all border border-white/10 group-hover:scale-110 active:scale-95 hidden md:block">
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button onClick={nextHero} className="absolute top-1/2 right-2 -translate-y-1/2 p-3 bg-black/30 hover:bg-black/60 backdrop-blur-md rounded-full text-white z-dropdown transition-all border border-white/10 group-hover:scale-110 active:scale-95 hidden md:block">
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                </>
                            )}

                            {heroSnap.status === 'pending' && <div className="absolute top-4 left-4 z-dropdown"><span className="bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg border border-amber-300"><Clock className="w-3 h-3" /> In Attesa</span></div>}
                            {isAdmin && (
                                <div className="absolute top-4 left-4 z-dropdown flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => handleDeleteRequest(heroSnap)} className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg transition-transform hover:scale-110" title="Elimina"><Trash2 className="w-4 h-4" /></button>
                                    <button 
                                        onClick={async () => {
                                            const newOfficial = !heroSnap.isOfficial;
                                            await updatePhotoData(heroSnap.id, { isOfficial: newOfficial });
                                            refreshSnaps();
                                        }}
                                        className={`p-2 rounded-full shadow-lg transition-transform hover:scale-110 ${heroSnap.isOfficial ? 'bg-amber-500 text-black' : 'bg-slate-700 text-slate-300'}`}
                                        title={heroSnap.isOfficial ? "Rendi Community" : "Promuovi a Official"}
                                    >
                                        <Trophy className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <div className="absolute top-4 right-4 z-dropdown"><button onClick={(e) => { e.stopPropagation(); toggleLiveSnapHeart(heroSnap.id); }} className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/20 transition-all active:scale-95 hover:bg-black/60 shadow-lg"><Heart className={`w-5 h-5 ${getLiveSnapStatus(heroSnap).isLiked ? 'fill-rose-500 text-rose-500' : 'text-white'}`} /><CountBadge count={getLiveSnapStatus(heroSnap).count} size="md" variant="white" className="bg-transparent text-white border-0 min-w-0 px-0 shadow-none text-sm" /></button></div>
                            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 flex justify-between items-end z-dropdown pointer-events-none"><div className="max-w-3xl"><div className="flex items-center gap-2 mb-1"><div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-lg border border-indigo-400">{heroSnap.user.charAt(0)}</div><span className="text-base font-bold text-white shadow-black drop-shadow-md">{heroSnap.user}</span></div>{heroSnap.description && <p className="text-sm md:text-lg text-slate-200 italic font-serif">"{heroSnap.description}"</p>}</div></div>
                        </div>
                    </div>
                )}

                {/* HORIZONTAL CAROUSEL FOR COMMUNITY SNAPS - Task 3, 4, 5, 6 */}
                <div 
                    ref={thumbScrollRef}
                    className="flex flex-nowrap gap-4 overflow-x-auto pb-6 no-scrollbar snap-x snap-mandatory w-full pt-4 mt-auto mb-4 transition-all duration-500"
                >
                    {gridSnaps.map((snap, idx) => {
                        const status = getLiveSnapStatus(snap);
                        const isActive = idx === heroIndex;
                        return (
                            <div
                                key={snap.id}
                                data-index={idx}
                                className={`snap-start flex-shrink-0 w-[32vw] md:w-[220px] aspect-square bg-slate-900 rounded-xl relative group overflow-hidden cursor-pointer shadow-xl border-2 transition-all duration-300 ${
                                    isActive ? 'border-indigo-500 scale-105 z-10' : 'border-slate-800 opacity-60 hover:opacity-100'
                                }`}
                                onClick={() => {
                                    if (isActive) openLightbox(snap.id);
                                    else setHeroIndex(idx);
                                }}
                            >
                                <ImageWithFallback src={snap.url} alt="Snap" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />

                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent z-dropdown opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                {snap.status === 'pending' && (
                                    <div className="absolute top-2 left-2 z-dropdown">
                                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse border border-black"></div>
                                    </div>
                                )}

                                <div className="absolute bottom-0 left-0 right-0 p-3 z-dropdown opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-end">
                                    <span className="text-white text-[10px] font-bold truncate max-w-[70%]">{snap.description || 'Foto'}</span>
                                    <div className="flex items-center gap-1.5 text-white text-xs font-black">
                                        <Heart className={`w-4 h-4 ${status.isLiked ? 'fill-rose-500 text-rose-500' : 'text-white'}`} /> {status.count}
                                    </div>
                                </div>
                                
                                {isActive && (
                                    <div className="absolute inset-0 bg-indigo-600/10 pointer-events-none"></div>
                                )}
                            </div>
                        );
                    })}

                    {/* LOAD MORE CARD INTEGRATED IN CAROUSEL */}
                    {hasMore && (
                        <div 
                            onClick={() => setVisibleSnapsCount(prev => prev + 15)}
                            className="snap-start flex-shrink-0 w-[35vw] md:w-[180px] aspect-square rounded-xl border border-slate-800 bg-slate-900/40 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors group"
                        >
                            <div className="p-4 rounded-full bg-slate-800 group-hover:bg-indigo-900/30 text-slate-500 group-hover:text-indigo-400 mb-2">
                                <ChevronRight className="w-8 h-8" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white">Vedi Altri</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};



