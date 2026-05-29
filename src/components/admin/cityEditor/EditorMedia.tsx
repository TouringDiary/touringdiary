
import React, { useState } from 'react';
import { MediaAsset, MediaStatus, CityDetails } from '@/types';
import { createMediaAssetFromUrl, dedupeGalleryAssets, mediaAssetUrl } from '../../../utils/media';
import { ImageIcon, Crop, Plus, RefreshCw, Loader2, Trash2, LayoutTemplate, Square } from 'lucide-react';
import { useCityEditor } from '@/context/CityEditorContext';
import { AdminImageInput } from '../AdminImageInput';
import { AdminPhotoInspector } from '../AdminPhotoInspector';
import { generateCitySection } from '../../../services/ai';
import { saveCityDetails } from '../../../services/cityService';
import { DeleteConfirmationModal } from '../../common/DeleteConfirmationModal';
import { CityCard } from '../../city/CityCard';

export const EditorMedia = () => {
    const { city, updateField, updateDetailField, reloadCurrentCity } = useCityEditor();
    const [isHeroImageValid, setIsHeroImageValid] = useState(true);
    const [isInspectorOpen, setIsInspectorOpen] = useState(false);
    
    // Stato per gestire quale immagine stiamo modificando e con quale modalità
    const [imageToEdit, setImageToEdit] = useState<{ url: string, index: number | null }>({ url: '', index: null });
    const [editingTarget, setEditingTarget] = useState<'hero' | 'card' | 'patron' | 'gallery'>('hero');
    
    const [generating, setGenerating] = useState(false);

    // --- DELETE STATE ---
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'hero' | 'card' | 'gallery', index?: number } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirmRegen, setShowConfirmRegen] = useState(false);

    if (!city) return null;

    // --- LOGICA CANCELLAZIONE ---
    const handleDeleteRequest = (type: 'hero' | 'card' | 'gallery', index?: number) => {
        if (type === 'hero' && !city.details.heroImage) return;
        if (type === 'card' && !city.imageUrl) return;
        setDeleteTarget({ type, index });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        
        try {
            if (deleteTarget.type === 'hero') {
                updateHeroState('', '', 'public', 'missing');
            } else if (deleteTarget.type === 'card') {
                updateCardState('', 'missing');
            } else if (deleteTarget.type === 'gallery' && typeof deleteTarget.index === 'number') {
                const currentGallery = [...(city.details.gallery || [])];
                currentGallery.splice(deleteTarget.index, 1);
                updateDetailField('gallery', currentGallery);
            }
            setDeleteTarget(null);
        } catch (e) {
            console.error("Errore cancellazione media:", e);
            alert("Si è verificato un errore durante la rimozione.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleRegeneratePage = async (e: React.MouseEvent) => {
        e.preventDefault();
        
        if (!city.name) { alert("Inserisci il nome della città!"); return; }
        setShowConfirmRegen(true);
    };

    const executeRegeneratePage = async () => {
        setShowConfirmRegen(false);
        setGenerating(true);
        try {
            const data = await generateCitySection(city.name, 'general');
            const newDetails = { ...city.details };
            
            if (data.officialWebsite) newDetails.officialWebsite = data.officialWebsite;
            
            const newHero = `https://images.unsplash.com/photo-1596825205486-3c36957b9fba?q=80&w=1200&sig=${Date.now()}`;
            
            newDetails.heroImage = newHero;
            newDetails.gallery = [];

            const newLog = `[${new Date().toISOString()}] ✅ Fine: Rigenerazione Pagina Media (in 0s)`;
            newDetails.generationLogs = [...(newDetails.generationLogs || []), newLog];

            const updatedCity: CityDetails = {
                ...city,
                imageUrl: newHero,
                image_status: 'real',
                hero_status: 'real',
                details: {
                    ...newDetails,
                    heroImage: newHero,
                    hero_status: 'real',
                    gallery: [],
                },
            };

            await saveCityDetails(updatedCity);
            await new Promise(r => setTimeout(r, 1000));
            await reloadCurrentCity();

            alert("Media rigenerati. La galleria è stata svuotata e l'immagine Hero aggiornata.");

        } catch (e: unknown) {
             console.error(e);
             const msg = e instanceof Error ? e.message : "Errore tecnico durante la rigenerazione.";
             alert(`Errore rigenerazione: ${msg}`);
        } finally {
            setGenerating(false);
        }
    };


    const updateHeroState = (url: string, credit: string, license: string, status: MediaStatus) => {
        updateField('heroImage', url);
        updateField('hero_status', status);
        updateDetailField('heroImage', url);
        updateDetailField('hero_status', status);
        updateField('imageCredit', credit);
        updateField('imageLicense', license);
    };

    const updateCardState = (url: string, status: MediaStatus) => {
        updateField('imageUrl', url);
        updateField('image_status', status);
    };

    const handleHeroUpload = (data: { imageUrl: string, imageCredit: string, imageLicense: 'own' | 'cc' | 'public' | 'copyright', fileName?: string, image_status: MediaStatus }) => {
        updateHeroState(data.imageUrl, data.imageCredit, data.imageLicense, data.image_status);
    };

    const handleCardUpload = (data: { imageUrl: string, image_status: MediaStatus }) => {
        updateCardState(data.imageUrl, data.image_status);
    };

    const handleInspectorSave = (data: { image: string }) => {
        if (editingTarget === 'hero') {
            updateHeroState(data.image, city.imageCredit || '', city.imageLicense || 'public', data.image ? 'real' : 'missing');
        } else if (editingTarget === 'card') {
            updateCardState(data.image, data.image ? 'real' : 'missing');
        } else if (editingTarget === 'patron') {
             const currentDetails = city.details.patronDetails || { name: '', date: '', history: '', imageUrl: '' };
             updateDetailField('patronDetails', { ...currentDetails, imageUrl: data.image });
        } else if (editingTarget === 'gallery') {
            const currentGallery = [...(city.details.gallery || [])];
            if (imageToEdit.index !== null && imageToEdit.index >= 0 && imageToEdit.index < currentGallery.length) {
                currentGallery[imageToEdit.index] = {
                    ...currentGallery[imageToEdit.index],
                    url: data.image,
                    mediaStatus: data.image ? 'real' : 'missing',
                };
                updateDetailField('gallery', dedupeGalleryAssets(currentGallery));
            }
        }
        setIsInspectorOpen(false);
    };

    const openInspector = (url: string, target: 'hero' | 'card' | 'patron' | 'gallery', index: number | null = null) => {
        if (!url) return;
        setImageToEdit({ url, index });
        setEditingTarget(target);
        setIsInspectorOpen(true);
    };

    const addImageToGallery = () => {
        const url = prompt("Inserisci URL immagine:");
        if(url) {
             if (url === city.details.heroImage) {
                 alert("Questa immagine è già impostata come Copertina. Non è necessario aggiungerla alla galleria.");
                 return;
             }
             const currentGallery = city.details.gallery || [];
             const newGallery: MediaAsset[] = [...currentGallery, createMediaAssetFromUrl(url)];
             updateDetailField('gallery', dedupeGalleryAssets(newGallery));
        }
    };

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in relative">
            
            {/* DELETE MODAL */}
            <DeleteConfirmationModal 
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title={deleteTarget?.type === 'hero' ? "Rimuovere Copertina?" : deleteTarget?.type === 'card' ? "Rimuovere Card?" : "Eliminare Foto?"}
                message={deleteTarget?.type === 'hero' 
                    ? "Rimuovi l'immagine principale della pagina."
                    : deleteTarget?.type === 'card' 
                    ? "Rimuovi l'immagine per le liste e le card." 
                    : "Elimina questa foto dalla galleria."}
                isDeleting={isDeleting}
            />
            <DeleteConfirmationModal 
                isOpen={showConfirmRegen}
                onClose={() => setShowConfirmRegen(false)}
                onConfirm={executeRegeneratePage}
                title="Rigenera Media"
                message="ATTENZIONE: Questo cercherà una nuova immagine Hero e resetterà la galleria. Continuare?"
                confirmLabel="Rigenera"
            />

            <div className="flex justify-end border-b border-slate-800 pb-4">
                <button 
                    onClick={handleRegeneratePage} 
                    disabled={generating}
                    className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-xs tracking-widest border border-rose-500"
                >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4"/>}
                    RIGENERA PAGINA
                </button>
            </div>

            {/* SPLIT SECTION: HERO & CARD */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* SINISTRA: HERO (WIDE) */}
                <div className="bg-slate-900 p-4 md:p-8 rounded-2xl border border-slate-800 shadow-xl flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2"><LayoutTemplate className="w-5 h-5 text-indigo-500"/> Copertina Hero</h3>
                        <div className="flex gap-2">
                            {city.details.heroImage && (
                                <button onClick={() => handleDeleteRequest('hero')} className="text-xs bg-red-900/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold uppercase transition-colors">
                                    <Trash2 className="w-3.5 h-3.5"/>
                                </button>
                            )}
                            <button onClick={() => openInspector(city.details.heroImage, 'hero')} disabled={!city.details.heroImage} className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold uppercase shadow-lg">
                                <Crop className="w-3.5 h-3.5"/> Ritaglia
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between gap-4">
                         <div className="bg-black/40 rounded-xl overflow-hidden aspect-[21/9] border-2 border-dashed border-slate-700 relative group">
                             {city.details.heroImage ? (
                                 <img src={city.details.heroImage} className="w-full h-full object-cover" alt="Hero" />
                             ) : (
                                 <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-xs font-bold uppercase">Nessuna Immagine</div>
                             )}
                         </div>
                         <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Carica Master (Sorgente)</h4>
                            <AdminImageInput 
                                imageUrl={city.details.heroImage} 
                                imageCredit={city.imageCredit} 
                                imageLicense={city.imageLicense}
                                qualityMode="high" 
                                onChange={handleHeroUpload} // Usa handler specifico
                                onValidityChange={setIsHeroImageValid}
                            />
                        </div>
                    </div>
                </div>

                {/* DESTRA: CARD (PORTRAIT/SQUARE) */}
                <div className="bg-slate-900 p-4 md:p-8 rounded-2xl border border-slate-800 shadow-xl flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2"><Square className="w-5 h-5 text-emerald-500"/> Card Anteprima</h3>
                        <div className="flex gap-2">
                             {city.imageUrl && (
                                <button onClick={() => handleDeleteRequest('card')} className="text-xs bg-red-900/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold uppercase transition-colors">
                                    <Trash2 className="w-3.5 h-3.5"/>
                                </button>
                            )}
                            <button onClick={() => openInspector(city.imageUrl, 'card')} disabled={!city.imageUrl} className="text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold uppercase shadow-lg">
                                <Crop className="w-3.5 h-3.5"/> Ritaglia
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                        <div className="flex gap-6 items-start mb-6">
                             {/* Preview Card Verticale Realistica */}
                             <div className="shrink-0">
                                 <CityCard 
                                    city={city} 
                                    onClick={() => {}} 
                                    userLocation={null} 
                                    className="w-[160px] h-[240px] pointer-events-none shadow-2xl"
                                />
                             </div>
                             
                             <div className="flex-1 py-2">
                                <div className="text-xs text-slate-400 leading-relaxed italic border-l-2 border-slate-700 pl-3">
                                    <p className="mb-2 text-white font-bold not-italic">Info Miniatura:</p>
                                    <p className="mb-2">Questa immagine appare nelle liste e in Home Page.</p>
                                    <p>Puoi caricarne una specifica qui sotto oppure ritagliare quella della Hero.</p>
                                </div>
                             </div>
                        </div>

                        <div className="pt-4 border-t border-slate-800">
                             <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Carica Specifica (Opzionale)</h4>
                             <AdminImageInput 
                                imageUrl={city.imageUrl} 
                                onChange={handleCardUpload}
                                qualityMode="standard" 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* GALLERIA */}
            <div className="bg-slate-900 p-4 md:p-8 rounded-2xl border border-slate-800 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-6 border-b border-slate-800 pb-2 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-indigo-500"/> Galleria Fotografica
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {city.details.gallery?.map((asset, i) => (
                        <div key={i} className="aspect-square relative group rounded-xl overflow-hidden border border-slate-700 shadow-md">
                            <img src={mediaAssetUrl(asset)} className="w-full h-full object-cover" alt="Gallery item"/>
                            
                            {/* OVERLAY ACTIONS */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button 
                                    onClick={() => openInspector(mediaAssetUrl(asset), 'gallery', i)} 
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110"
                                    title="Modifica / Ritaglia"
                                >
                                    <Crop className="w-4 h-4"/>
                                </button>
                                <button 
                                    onClick={() => handleDeleteRequest('gallery', i)}
                                    className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110"
                                    title="Elimina Foto"
                                >
                                    <Trash2 className="w-4 h-4"/>
                                </button>
                            </div>
                        </div>
                    ))}
                     <div 
                        className="aspect-square rounded-xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 hover:text-white cursor-pointer transition-colors bg-slate-950/50 hover:bg-slate-900 hover:border-indigo-500" 
                        onClick={addImageToGallery}
                    >
                        <Plus className="w-8 h-8 mb-1"/>
                        <span className="text-[10px] font-bold uppercase">Aggiungi</span>
                    </div>
                </div>
            </div>

            {isInspectorOpen && (
                <AdminPhotoInspector 
                    isOpen={true}
                    imageUrl={imageToEdit.url}
                    // Passiamo il target mode per adattare l'interfaccia dell'editor
                    mode={editingTarget === 'card' ? 'card' : 'hero'}
                    initialData={{ locationName: city.name, user: 'Admin', description: editingTarget === 'card' ? 'Ottimizzazione Card Verticale' : 'Ottimizzazione Copertina' }}
                    onClose={() => setIsInspectorOpen(false)}
                    onSave={handleInspectorSave}
                />
            )}
        </div>
    );
};
