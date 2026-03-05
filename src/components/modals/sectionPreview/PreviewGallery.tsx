
import React, { useMemo, useRef } from 'react';
import { Camera, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { CityDetails } from '../../../types/index';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { DraggableSlider, DraggableSliderHandle } from '../../common/DraggableSlider';

interface PreviewGalleryProps {
    city: any; // Generic object support
    onOpenLightbox: (data: { url: string, user: string, likes: number, caption: string }) => void;
    activeCategoryColor: string;
    className?: string;
}

export const PreviewGallery = ({ city, onOpenLightbox, activeCategoryColor, className }: PreviewGalleryProps) => {
    const galleryRef = useRef<DraggableSliderHandle>(null);

    const galleryItems = useMemo(() => {
        // Se è un oggetto generico senza dettagli (es. Guide/Servizi), costruiamo una galleria solo con l'immagine principale
        if (!city) return [];
        
        const allPois = city.details?.allPois || [];
        // Ordina per voti decrescenti
        const votedPois = [...allPois].sort((a: any, b: any) => (b.votes || 0) - (a.votes || 0));
        
        // Estrai immagini e metadati
        const items = [];
        
        // Prima la cover principale
        if (city.imageUrl) {
            items.push({
                url: city.imageUrl,
                user: "Touring Diary",
                likes: (city.rating || 0) * 100,
                caption: city.name
            });
        }

        votedPois.forEach((p: any) => {
             if (p.imageUrl) {
                 items.push({
                     url: p.imageUrl,
                     user: p.suggestedBy || "Community",
                     likes: p.votes || 0,
                     caption: p.name
                 });
             }
        });
        
        // Se non ci sono POI (es. Guida), aggiungi altre immagini se disponibili nell'oggetto stesso
        if (items.length <= 1 && city.details?.gallery) {
             city.details.gallery.forEach((url: string) => {
                 if (url !== city.imageUrl) {
                     items.push({
                         url: url,
                         user: "Official",
                         likes: 0,
                         caption: city.name
                     });
                 }
             });
        }
        
        // Se ancora solo 1 immagine (es. Guida senza galleria), ok così. Non inventiamo.

        // Rimuovi duplicati URL e prendi i primi 10
        const seen = new Set();
        const uniqueItems = [];
        for (const item of items) {
            if (!seen.has(item.url)) {
                seen.add(item.url);
                uniqueItems.push(item);
            }
        }
        
        return uniqueItems.slice(0, 10);
    }, [city]);

    // Estrae il colore base
    const markerColorClass = activeCategoryColor ? activeCategoryColor.replace('text-', 'bg-') : 'bg-amber-500';

    if (galleryItems.length === 0) return null;

    return (
        <div className={`flex flex-col justify-end ${className}`}>
            <div className="flex items-center justify-between mb-2 px-6 pt-2">
                <div className="flex items-center gap-2">
                    <div className={`w-1 h-4 rounded-full ${markerColorClass}`}></div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <Camera className="w-4 h-4 text-slate-400"/> TOP 10 | COMMUNITY
                    </h3>
                </div>
                <div className="flex gap-1">
                    <button onClick={() => galleryRef.current?.scroll('left')} className="p-1.5 bg-slate-900 border border-slate-700 rounded-lg hover:border-amber-500 text-slate-400 hover:text-white transition-colors"><ChevronLeft className="w-3.5 h-3.5"/></button>
                    <button onClick={() => galleryRef.current?.scroll('right')} className="p-1.5 bg-slate-900 border border-slate-700 rounded-lg hover:border-amber-500 text-slate-400 hover:text-white transition-colors"><ChevronRight className="w-3.5 h-3.5"/></button>
                </div>
            </div>
            
            <div className="flex-1 min-h-0 pb-3 px-6">
                <DraggableSlider ref={galleryRef} className="h-full">
                    {galleryItems.map((item, idx) => (
                        <div key={idx} onClick={() => onOpenLightbox(item)} className="snap-start flex-shrink-0 w-64 h-full rounded-lg overflow-hidden relative group cursor-zoom-in border border-slate-800 hover:border-amber-500/50 transition-all shadow-lg">
                            <ImageWithFallback src={item.url} alt={`${item.caption}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg"/>
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black/70 px-1.5 py-0.5 rounded text-[10px] font-bold text-white pointer-events-none border border-white/20">#{idx + 1}</div>
                        </div>
                    ))}
                </DraggableSlider>
            </div>
        </div>
    );
};
