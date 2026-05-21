import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Camera, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { CityDetails, PhotoSubmission } from '@/types';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { DraggableSlider, DraggableSliderHandle } from '../../common/DraggableSlider';
import { isPlaceholderUrl, normalizeImageUrl } from '@/utils/imageOptimizer';
import { getOrCreatePhotoSubmissionForUrl, fetchTopCityPhotos } from '@/services/photoService';
import { getCityOfficialMedia } from '@/services/city/cityMediaService';

interface PreviewGalleryProps {
    city: CityDetails; 
    onOpenLightbox: (data: PhotoSubmission) => void;
    activeCategoryColor: string;
    className?: string;
}

export const PreviewGallery = ({ city, onOpenLightbox, activeCategoryColor, className }: PreviewGalleryProps) => {
    const galleryRef = useRef<DraggableSliderHandle>(null);
    const [resolvedItems, setResolvedItems] = useState<PhotoSubmission[]>([]);
    const [isResolving, setIsResolving] = useState(false);

    useEffect(() => {
        if (!city) return;
        
        const resolveGallery = async () => {
            setIsResolving(true);
            try {
                const cityName = city.name;
                const cityId = city.id;

                // 1. Raccogli URL validi (Governance Status-Driven)
                const validAssets = getCityOfficialMedia(city);

                const allUrls = Array.from(new Set(validAssets.map(a => a.url))).slice(0, 15); // Limite per evitare troppe chiamate

                // 2. Registrazione/Recupero UUID reali (No Virtual IDs)
                const promises = allUrls.map(url => 
                    getOrCreatePhotoSubmissionForUrl(url, cityId, cityName, 'Official city preview image')
                );

                const results = await Promise.all(promises);
                const officialItems = results.filter((p): p is PhotoSubmission => p !== null);

                // 3. RECUPERO TOP 10 COMMUNITY (Nuove Foto Approvate)
                const communityItems = await fetchTopCityPhotos(cityId);

                // 4. MERGE & DEDUPLICAZIONE (Priorità Community)
                const combined = [...communityItems];
                officialItems.forEach(off => {
                    if (!combined.some(c => normalizeImageUrl(c.url) === normalizeImageUrl(off.url))) {
                        combined.push(off);
                    }
                });

                setResolvedItems(combined.slice(0, 10));
            } catch (error) {
                console.error("[PreviewGallery] Errore risoluzione gallery:", error);
            } finally {
                setIsResolving(false);
            }
        };

        resolveGallery();
    }, [city]);

    const galleryItems = resolvedItems;

    const markerColorClass = activeCategoryColor ? activeCategoryColor.replace('text-', 'bg-') : 'bg-amber-500';

    return (
        <div className={`flex flex-col justify-end ${className}`}>
            <div className="flex items-center justify-between mb-2 px-6 pt-2">
                <div className="flex items-center gap-2">
                    <div className={`w-1 h-4 rounded-full ${markerColorClass}`}></div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <Camera className="w-4 h-4 text-slate-400"/> TOP 10 | COMMUNITY
                    </h3>
                </div>
                {galleryItems.length > 0 && (
                    <div className="flex gap-1">
                        <button onClick={() => galleryRef.current?.scroll('left')} className="p-1.5 bg-slate-900 border border-slate-700 rounded-lg hover:border-amber-500 text-slate-400 hover:text-white transition-colors"><ChevronLeft className="w-3.5 h-3.5"/></button>
                        <button onClick={() => galleryRef.current?.scroll('right')} className="p-1.5 bg-slate-900 border border-slate-700 rounded-lg hover:border-amber-500 text-slate-400 hover:text-white transition-colors"><ChevronRight className="w-3.5 h-3.5"/></button>
                    </div>
                )}
            </div>
            
            <div className="flex-1 min-h-0 pb-3 px-6">
                {isResolving ? (
                    <div className="h-full w-full flex items-center justify-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse bg-slate-900/20 rounded-xl border border-slate-800/50">
                        <Camera className="w-4 h-4 animate-bounce" /> Analisi Gallery...
                    </div>
                ) : galleryItems.length > 0 ? (
                    <DraggableSlider ref={galleryRef} className="h-full">
                        {galleryItems.map((item, idx) => (
                            <div key={idx} onClick={() => onOpenLightbox(item)} className="snap-start flex-shrink-0 w-64 h-full rounded-lg overflow-hidden relative group cursor-zoom-in border border-slate-800 hover:border-amber-500/50 transition-all shadow-lg">
                                <ImageWithFallback src={item.url} alt={`${item.description}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg"/>
                                </div>
                                <div className="absolute bottom-2 right-2 bg-black/70 px-1.5 py-0.5 rounded text-[10px] font-bold text-white pointer-events-none border border-white/20">#{idx + 1}</div>
                            </div>
                        ))}
                    </DraggableSlider>
                ) : (
                    <div className="h-full w-full flex items-center justify-center gap-2 text-slate-600 text-xs italic font-medium bg-slate-900/10 rounded-xl border border-slate-800/30 border-dashed">
                        Nessuna foto disponibile per questa anteprima.
                    </div>
                )}
            </div>
        </div>
    );
};
