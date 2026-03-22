
import React, { useRef } from 'react';
import { Camera, ChevronLeft, ChevronRight, Grid, Heart, Plus, User, Loader2, Maximize2 } from 'lucide-react';
import { PhotoSubmission } from '../../../types/index';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { DraggableSlider, DraggableSliderHandle } from '../../common/DraggableSlider';
import { LightboxData } from './GalleryLightbox';
// CORREZIONE: Usa il percorso relativo per garantire una singola istanza del context
import { useInteraction } from '../../../context/InteractionContext';

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
            
            <div className="absolute top-2 right-2 z-20">
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
            
            {photo.status === 'pending' && <div className="absolute top-2 left-2 z-20 bg-amber-500/90 text-black text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-lg border border-amber-300/50">In Attesa</div>}
            
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

interface GalleryGridProps {
    photos: PhotoSubmission[];
    visiblePhotos: PhotoSubmission[];
    topGallerySlots: (PhotoSubmission | null)[];
    pagination: {
        currentPage: number;
        totalPages: number;
        goToPage: (p: number) => void;
    };
    isUploading: boolean;
    onAddClick: () => void;
    onOpenLightbox: (data: LightboxData) => void;
    onOpenAuth: () => void;
}


export const GalleryGrid = ({ 
    photos, visiblePhotos, topGallerySlots, pagination, 
    isUploading, onAddClick, onOpenLightbox, onOpenAuth 
}: GalleryGridProps) => {
    
    const sliderRef = useRef<DraggableSliderHandle>(null);

    const scrollSlider = (direction: 'left' | 'right') => {
        if (sliderRef.current) {
            sliderRef.current.scroll(direction);
        }
    };

    return (
        <div className="flex flex-col bg-[#020617] gap-4 w-full">
             {/* TOP 10 CURATED SLIDER - INVARIATO */}
             <div className="relative group/slider shrink-0 pt-2 pb-2 bg-[#020617] z-10 px-4 md:px-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-display font-bold text-white flex items-center gap-2"><Camera className="w-4 h-4 text-amber-500"/> TOP 10</h3>
                    <div className="flex gap-2">
                        <button onClick={() => scrollSlider('left')} className="p-1 bg-slate-900 border border-slate-700 rounded-lg hover:border-amber-500 text-slate-400 hover:text-white transition-colors"><ChevronLeft className="w-3.5 h-3.5"/></button>
                        <button onClick={() => scrollSlider('right')} className="p-1 bg-slate-900 border border-slate-700 rounded-lg hover:border-amber-500 text-slate-400 hover:text-white transition-colors"><ChevronRight className="w-3.5 h-3.5"/></button>
                    </div>
                </div>

                <DraggableSlider ref={sliderRef} className="gap-2">
                    {topGallerySlots.map((photo, idx) => {
                        if (!photo) {
                            return (
                                <div key={`empty-${idx}`} className="snap-center flex-shrink-0 w-[50vw] md:w-[280px] h-[150px] relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900/30 flex flex-col items-center justify-center gap-2 group transition-all">
                                    <div className="absolute top-2 left-2 z-10 bg-slate-800/80 backdrop-blur px-2 py-0.5 rounded-full text-slate-500 font-bold text-[10px] border border-slate-700">#{idx + 1}</div>
                                    <Camera className="w-6 h-6 text-slate-700 group-hover:text-slate-600 transition-colors"/>
                                    <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">In Attesa</span>
                                </div>
                            );
                        }

                        return (
                             <div key={photo.id} className="snap-center flex-shrink-0 w-[50vw] md:w-[280px] h-[150px]">
                                <PhotoCard photo={photo} onOpenLightbox={onOpenLightbox} onOpenAuth={onOpenAuth} variant="slider" />
                             </div>
                        );
                    })}
                </DraggableSlider>
            </div>

            {/* COMMUNITY GRID (MASONRY-LIKE) - INVARIATO */}
            <div className="w-full px-4 md:px-8 pb-10">
                <div className="flex items-center justify-between py-2 border-b border-slate-800 mb-4">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-900/20 p-1.5 rounded-lg"><Grid className="w-4 h-4 text-blue-500"/></div>
                        <div><h3 className="text-xl font-display font-bold text-white leading-none">Galleria Completa</h3><span className="text-[10px] font-mono text-slate-500 font-bold">{photos.length} foto</span></div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                     <div onClick={onAddClick} className={`aspect-square rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/20 flex flex-col items-center justify-center cursor-pointer group transition-all relative overflow-hidden ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-emerald-500 hover:bg-slate-900'}`}>
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-2"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin"/><span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Upload...</span></div>
                        ) : (
                            <><div className="p-3 rounded-full bg-slate-800 group-hover:bg-emerald-900/30 text-slate-400 group-hover:text-emerald-400 mb-2 transition-colors"><Plus className="w-6 h-6"/></div><span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white">Aggiungi</span></>
                        )}
                    </div>

                    {visiblePhotos.map((photo) => (
                        <div key={photo.id}>
                             <PhotoCard photo={photo} onOpenLightbox={onOpenLightbox} onOpenAuth={onOpenAuth} variant="grid" />
                        </div>
                    ))}
                </div>

                {/* PAGINAZIONE - INVARIATO */}
                {pagination.totalPages > 1 && (
                     <div className="flex justify-center gap-2 mt-8">
                         <button disabled={pagination.currentPage === 1} onClick={() => pagination.goToPage(pagination.currentPage - 1)} className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 disabled:opacity-50"><ChevronLeft className="w-4 h-4"/></button>
                         <span className="text-xs text-slate-500 self-center font-bold px-2">{pagination.currentPage} / {pagination.totalPages}</span>
                         <button disabled={pagination.currentPage === pagination.totalPages} onClick={() => pagination.goToPage(pagination.currentPage + 1)} className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 disabled:opacity-50"><ChevronRight className="w-4 h-4"/></button>
                     </div>
                )}
            </div>
        </div>
    );
};
