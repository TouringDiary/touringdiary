
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, ScrollText } from 'lucide-react';
import { ShopPartner } from '../../types/index';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { DraggableSlider, DraggableSliderHandle } from '../common/DraggableSlider';

interface ShopHeroProps {
    shop: ShopPartner;
    onOpenLightbox: (url: string) => void;
    onToggleBio: (v: boolean) => void;
}

export const ShopHero: React.FC<ShopHeroProps> = ({ shop, onOpenLightbox, onToggleBio }) => {
    const galleryRef = useRef<DraggableSliderHandle>(null);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);

    const galleryImages = useMemo(() => {
        const base = (shop.gallery && shop.gallery.length > 0) ? shop.gallery : [shop.imageUrl];
        const res = [];
        for(let i=0; i<5; i++) res.push(base[i % base.length]);
        return res;
    }, [shop.gallery, shop.imageUrl]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (galleryRef.current) {
                setActivePhotoIndex(prev => {
                    const next = (prev + 1) % 5;
                    if (next === 0) galleryRef.current?.scroll('left');
                    else galleryRef.current?.scroll('right');
                    return next;
                });
            }
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col lg:flex-row w-full border-b border-slate-800 bg-[#020617]">
            
            {/* LEFT: SLIDER */}
            <div className="w-full lg:w-[75%] h-64 md:h-72 lg:h-[40vh] relative group overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
                <DraggableSlider ref={galleryRef} className="h-full w-full [&::-webkit-scrollbar]:hidden scrollbar-hide">
                    {galleryImages.map((img, idx) => (
                        <div key={idx} onClick={() => onOpenLightbox(img)} className="snap-center shrink-0 w-full h-full relative cursor-zoom-in">
                            <ImageWithFallback 
                                src={img} 
                                alt={`${shop.name} ${idx}`} 
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                priority={idx === 0} // Only first image is priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-60"></div>
                        </div>
                    ))}
                </DraggableSlider>

                {/* Controls */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-40">
                    {galleryImages.map((_, dotIdx) => (
                        <div key={dotIdx} className={`h-1.5 rounded-full transition-all duration-500 ${dotIdx === activePhotoIndex ? 'w-8 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]' : 'w-4 bg-slate-500/30 border border-white/5'}`}/>
                    ))}
                </div>
                
                <button onClick={() => galleryRef.current?.scroll('left')} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-all z-20 border border-white/10 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0"><ChevronLeft className="w-6 h-6"/></button>
                <button onClick={() => galleryRef.current?.scroll('right')} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-all z-20 border border-white/10 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0"><ChevronRight className="w-6 h-6"/></button>
            </div>

            {/* RIGHT: INFO COLUMN */}
            <div className="w-full lg:w-[25%] bg-[#050b1a] flex flex-col justify-center p-6 md:p-8 lg:p-10 relative">
                <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500 via-slate-900 to-transparent"></div>
                
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        {/* STILE UNIFORMATO SUB-HEADER CON ICONA */}
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 flex items-center gap-2">
                            <ScrollText className="w-3.5 h-3.5 text-amber-500"/> Passione & Radici
                        </h4>
                        {/* STILE UNIFORMATO MAIN-HEADER - Rimosso lg:text-4xl per uniformità */}
                        <h3 className="text-2xl md:text-3xl font-display font-bold text-amber-500 leading-tight mb-4">
                            L'Anima della Bottega
                        </h3>
                        <div className="h-px w-full bg-gradient-to-r from-slate-700 to-transparent mb-6"></div>
                        <p className="text-slate-300 text-sm md:text-base leading-relaxed italic font-serif opacity-90 line-clamp-4 lg:line-clamp-none">
                            "{shop.shortBio || 'La nostra attività nasce dalla volontà di preservare le tradizioni campane e offrire prodotti d\'eccellenza.'}"
                        </p>
                    </div>

                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggleBio(true); }} 
                        className="w-full mt-8 py-4 bg-slate-800 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-slate-700 hover:border-amber-500 transition-all flex items-center justify-center gap-3 shadow-lg group"
                    >
                        <BookOpen className="w-4 h-4 group-hover:scale-110 transition-transform"/> LEGGI LA STORIA
                    </button>
                </div>
            </div>
        </div>
    );
};
