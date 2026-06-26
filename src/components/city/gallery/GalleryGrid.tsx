
import React, { useRef } from 'react';
import { Camera, ChevronLeft, ChevronRight, Grid, Heart, Plus, User, Loader2, Maximize2 } from 'lucide-react';
import { PhotoSubmission } from '../../../types/index';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { DraggableSlider, DraggableSliderHandle } from '../../common/DraggableSlider';
import { LightboxData } from './GalleryLightbox';
// CORREZIONE: Usa il percorso relativo per garantire una singola istanza del context
import { useInteraction } from '../../../context/InteractionContext';
import { CountBadge } from '@/components/ui/CountBadge';

interface PhotoCardProps {
    photo: PhotoSubmission;
    onOpenLightbox: (d: LightboxData) => void;
    onOpenAuth: () => void;
    variant?: 'grid' | 'slider'; 
}

const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onOpenLightbox, onOpenAuth, variant = 'grid' }) => {
    const { getPhotoStatus, togglePhotoHeart, isGuest } = useInteraction();
    const { isLiked, count, isLoading } = getPhotoStatus(photo);

    const handleLikeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isGuest) { onOpenAuth(); return; }
        togglePhotoHeart(photo.id);
    };

    const dimensionClass = variant === 'slider' ? 'h-full w-full' : 'aspect-square';

    return (
        <div 
            onClick={() => onOpenLightbox({
                id: photo.id, 
                url: photo.url, 
                user: photo.user, 
                likes: count, 
                caption: photo.description, 
                date: photo.date
            })} 
            className={`${dimensionClass} relative rounded-lg overflow-hidden border border-slate-800 bg-slate-900 group cursor-pointer shadow-md hover:shadow-xl transition-all`}
        >
            <ImageWithFallback 
                src={photo.url} 
                alt={photo.description || "User photo"} 
                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${photo.status === 'pending' ? 'opacity-50 grayscale' : ''}`}
                draggable={false} 
            />
            
            <div className="absolute top-2 right-2 z-local-overlay">
                 <button 
                    onClick={handleLikeClick}
                    className={`flex items-center gap-1 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] font-bold border transition-colors bg-black/40 border-white/10 hover:bg-black/60 cursor-pointer`}
                    title="Mi Piace"
                >
                    {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white"/>
                    ) : (
                        <Heart className={`w-3.5 h-3.5 transition-colors ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-white group-hover:text-rose-400'}`}/>
                    )}
                    <span className={isLiked ? 'text-rose-500' : 'text-white'}>
                        {count}
                    </span>
                </button>
            </div>
            
            {photo.status === 'pending' && <div className="absolute top-2 left-2 z-local-overlay bg-amber-500/90 text-black text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-lg border border-amber-300/50">In Attesa</div>}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 pointer-events-none">
                <span className="text-[10px] text-white font-bold truncate">{photo.description || photo.locationName}</span>
                <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-0.5"><User className="w-2.5 h-2.5"/> {photo.user}</div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <Maximize2 className="w-6 h-6 text-white drop-shadow-md"/>
            </div>
        </div>
    );
};

export interface GalleryGridProps {
    photos: PhotoSubmission[];
    officialPhotos: PhotoSubmission[];
    communityPhotos: PhotoSubmission[];
    topOfficial: PhotoSubmission[];
    topCommunity: PhotoSubmission[];
    activeTab: 'official' | 'community';
    onTabChange: (tab: 'official' | 'community') => void;
    visiblePhotos: PhotoSubmission[];
    pagination: {
        currentPage: number;
        totalPages: number;
        goToPage: (p: number) => void;
        loadMore: () => void;
    };
    isUploading: boolean;
    onAddClick: () => void;
    onOpenLightbox: (data: LightboxData) => void;
    onOpenAuth: () => void;
    onLikeUpdate?: (photoId: string, likes: number) => void;
}


export const GalleryGrid = ({ 
    photos, officialPhotos, communityPhotos, topOfficial, topCommunity,
    activeTab, onTabChange,
    visiblePhotos, pagination, 
    isUploading, onAddClick, onOpenLightbox, onOpenAuth,
    onLikeUpdate 
}: GalleryGridProps) => {
    
    const sliderRef = useRef<DraggableSliderHandle>(null);

    const scrollSlider = (direction: 'left' | 'right') => {
        if (sliderRef.current) {
            sliderRef.current.scroll(direction);
        }
    };

    const currentTopSlots = activeTab === 'official' ? topOfficial : topCommunity;
    const currentGridPhotos = activeTab === 'official' 
        ? officialPhotos 
        : visiblePhotos; 


    return (
        <div className="flex flex-col bg-[#020617] gap-2 w-full">
             
             {/* TAB SWITCHER PREMIUM - FASE 3 REFINED */}
             <div className="flex items-center justify-center pt-2 pb-1 px-4 md:px-8">
                <div className="flex bg-slate-900/80 backdrop-blur-md rounded-lg border border-slate-800 shadow-xl overflow-hidden">
                    <button 
                        onClick={() => onTabChange('official')}
                        className={`px-6 md:px-10 py-2.5 text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'official' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
                    >
                        Official
                    </button>
                    <button 
                        onClick={() => onTabChange('community')}
                        className={`px-6 md:px-10 py-2.5 text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'community' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
                    >
                        Community
                    </button>
                </div>
             </div>

             {/* TOP SLIDER (OFFICIAL OR COMMUNITY) */}
             <div className="relative group/slider shrink-0 pt-2 pb-2 bg-[#020617] z-local-raised px-4 md:px-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${activeTab === 'official' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'}`}>
                             <Camera className="w-4 h-4"/>
                        </div>
                        <h3 className="text-xl font-display font-bold text-white uppercase tracking-tight">
                            TOP 10 <span className="text-slate-500 text-sm font-mono ml-2">/ {activeTab}</span>
                        </h3>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => scrollSlider('left')} className="p-1 bg-slate-900 border border-slate-700 rounded-lg hover:border-amber-500 text-slate-400 hover:text-white transition-colors"><ChevronLeft className="w-3.5 h-3.5"/></button>
                        <button onClick={() => scrollSlider('right')} className="p-1 bg-slate-900 border border-slate-700 rounded-lg hover:border-amber-500 text-slate-400 hover:text-white transition-colors"><ChevronRight className="w-3.5 h-3.5"/></button>
                    </div>
                </div>

                <DraggableSlider ref={sliderRef} className="gap-2">
                    {currentTopSlots.length > 0 ? (
                        currentTopSlots.map((photo, idx) => (
                            <div key={photo.id} className="snap-center flex-shrink-0 w-[50vw] md:w-[280px] h-[150px]">
                                <PhotoCard photo={photo} onOpenLightbox={onOpenLightbox} onOpenAuth={onOpenAuth} variant="slider" />
                            </div>
                        ))
                    ) : (
                        [...Array(3)].map((_, idx) => (
                            <div key={`empty-${idx}`} className="snap-center flex-shrink-0 w-[50vw] md:w-[280px] h-[150px] relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900/30 flex flex-col items-center justify-center gap-2 group transition-all">
                                <CountBadge display={`#${idx + 1}`} size="sm" variant="dark" position="overlay-tl" className="z-local-overlay backdrop-blur" />
                                <Camera className="w-6 h-6 text-slate-700 group-hover:text-slate-600 transition-colors"/>
                                <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">In Arrivo</span>
                            </div>
                        ))
                    )}
                </DraggableSlider>
            </div>

            {/* FULL GRID (MASONRY-LIKE) */}
            <div className="w-full px-4 md:px-8 pb-10">
                <div className="flex items-center justify-between py-2 border-b border-slate-800 mb-4">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${activeTab === 'official' ? 'bg-amber-900/20 text-amber-500' : 'bg-blue-900/20 text-blue-500'}`}>
                            <Grid className="w-4 h-4"/>
                        </div>
                        <div>
                            <h3 className="text-xl font-display font-bold text-white leading-none capitalize">{activeTab} Gallery</h3>
                            <span className="text-[10px] font-mono text-slate-500 font-bold">{activeTab === 'official' ? officialPhotos.length : communityPhotos.length} foto totali</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-nowrap gap-4 overflow-x-auto pb-6 no-scrollbar snap-x snap-mandatory w-full">
                    {/* Upload Card only in Community Tab */}
                    {activeTab === 'community' && (
                        <div onClick={onAddClick} className={`snap-start flex-shrink-0 w-[32vw] md:w-[280px] h-48 md:h-64 rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/20 flex flex-col items-center justify-center cursor-pointer group transition-all relative overflow-hidden ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-emerald-500 hover:bg-slate-900'}`}>
                            {isUploading ? (
                                <div className="flex flex-col items-center gap-2"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin"/><span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Upload...</span></div>
                            ) : (
                                <><div className="p-3 rounded-full bg-slate-800 group-hover:bg-emerald-900/30 text-slate-400 group-hover:text-emerald-400 mb-2 transition-colors"><Plus className="w-6 h-6"/></div><span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white">Aggiungi Foto</span></>
                            )}
                        </div>
                    )}

                    {currentGridPhotos.map((photo) => (
                        <div key={photo.id} className="snap-start flex-shrink-0 w-[65vw] md:w-[280px] h-48 md:h-64">
                            <PhotoCard photo={photo} onOpenLightbox={onOpenLightbox} onOpenAuth={onOpenAuth} variant="slider" />
                        </div>
                    ))}

                    {/* LOAD MORE CARD (Only if more photos exist in community) */}
                    {activeTab === 'community' && pagination.currentPage < pagination.totalPages && (
                        <div 
                            onClick={pagination.loadMore}
                            className="snap-start flex-shrink-0 w-[40vw] md:w-[200px] h-48 md:h-64 rounded-xl border border-slate-800 bg-slate-900/40 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors group"
                        >
                            <div className="p-3 rounded-full bg-slate-800 group-hover:bg-blue-900/30 text-slate-500 group-hover:text-blue-400 mb-2">
                                <Plus className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-white">Vedi Altre</span>
                            <span className="text-[8px] font-mono text-slate-600 mt-1">{communityPhotos.length - currentGridPhotos.length} rimanenti</span>
                        </div>
                    )}
                    
                    {currentGridPhotos.length === 0 && !isUploading && (
                         <div className="snap-start flex-shrink-0 w-full flex flex-col items-center justify-center text-slate-700 py-10">
                            <Camera className="w-8 h-8 opacity-20 mb-2"/>
                            <span className="text-[9px] font-bold uppercase tracking-widest">Nessuna foto in questa categoria</span>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};

