
import React from 'react';
import { ArrowLeft, Award, MapPin, Box, Check, Plus, MessageCircle, ShoppingCart, X, Briefcase, Share2 } from 'lucide-react';
import { ShopPartner, PointOfInterest, ShopCategory } from '../../types/index';
import { openMap, open3DView } from '../../utils/common';
import { useShare } from '../../hooks/useShare';

interface ShopHeaderProps {
    shop: ShopPartner | null;
    selectedCategory: ShopCategory | null;
    cityName: string;
    onBack: () => void;
    onInternalBack: () => void;
    onAddToItinerary: (poi: PointOfInterest) => void;
    onTogglePlanner: () => void;
    onOpenSponsor: (type?: string) => void; 
    isPlannerOpen: boolean;
    isInItinerary: boolean;
    categories: { id: ShopCategory, label: string, icon?: any }[];
}

export const ShopHeader: React.FC<ShopHeaderProps> = ({ 
    shop, selectedCategory, cityName, onBack, onInternalBack, 
    onAddToItinerary, onOpenSponsor, isInItinerary, categories 
}) => {
    
    const { share } = useShare();

    // Converte lo shop in POI per l'aggiunta al diario
    const handleAddClick = () => {
        if (!shop) return;
        const shopAsPoi: PointOfInterest = {
            id: `shop-${shop.id}`,
            name: shop.name,
            category: 'shop',
            subCategory: 'market',
            description: shop.shortBio || shop.description || 'Bottega Partner',
            imageUrl: shop.imageUrl,
            rating: shop.rating || 0,
            votes: shop.likes || 0,
            coords: shop.coords,
            address: shop.address
        };
        onAddToItinerary(shopAsPoi);
    };

    const handleShare = () => {
        if (shop) {
             share({
                title: shop.name,
                text: `Guarda questa bottega fantastica a ${cityName}: ${shop.name}. ${shop.shortBio}`,
                params: { shop: shop.vatNumber }
            });
        } else {
             share({
                title: 'Shopping Touring Diary',
                text: `Scopri le migliori botteghe e prodotti tipici a ${cityName}.`,
                params: { city: 'napoli', tab: 'shopping' } // Fallback generic
            });
        }
    };

    const activeCategoryData = selectedCategory ? categories.find(c => c.id === selectedCategory) : null;
    const CategoryIcon = activeCategoryData?.icon;

    return (
        <div className="flex justify-between items-center px-4 py-4 md:px-10 md:py-6 shrink-0 z-50 bg-[#020617] border-b border-slate-800">
            <div className="flex items-center gap-4 md:gap-6 min-w-0">
                {(selectedCategory || shop) ? (
                    <button 
                        onClick={onInternalBack} 
                        className="p-2 md:p-3 bg-slate-900 hover:bg-slate-800 rounded-2xl text-white transition-all shadow-2xl shadow-indigo-900/30 group border-2 border-indigo-500 hover:border-indigo-400 shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-x-1 transition-transform text-indigo-100"/>
                    </button>
                ) : (
                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-900/40 shrink-0">
                        <ShoppingCart className="w-6 h-6 text-white"/>
                    </div>
                )}
                
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                        {/* ICONA CATEGORIA DINAMICA (VISIBILE SOLO SE NON C'È UNO SHOP ATTIVO E C'È UNA CATEGORIA) */}
                        {!shop && CategoryIcon && (
                             <CategoryIcon className="w-6 h-6 md:w-10 md:h-10 text-amber-500 shrink-0"/>
                        )}

                        <h2 className="text-2xl md:text-5xl font-display font-bold text-amber-500 tracking-tighter leading-none truncate">
                            {shop ? shop.name : activeCategoryData ? activeCategoryData.label : 'Shopping'}
                        </h2>
                        
                        {shop?.badge === 'gold' && <Award className="w-5 h-5 text-amber-500 shrink-0"/>}
                    </div>
                    
                    {shop ? (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                            <span className="text-[10px] md:text-xs text-indigo-400 font-black uppercase tracking-widest">{shop.category}</span>
                            <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
                            <button onClick={() => openMap(shop.coords.lat, shop.coords.lng, shop.name, shop.address)} className="text-[10px] md:text-xs text-slate-400 hover:text-white transition-colors underline decoration-slate-700 underline-offset-4 flex items-center gap-1 truncate max-w-[200px] md:max-w-none">
                                <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-500 shrink-0"/> {shop.address}
                            </button>
                            <button onClick={() => open3DView(shop.coords.lat, shop.coords.lng, shop.name, shop.address)} className="hidden md:flex text-[10px] font-black text-indigo-400 hover:text-white uppercase tracking-tighter items-center gap-1 bg-indigo-950/30 px-2 py-0.5 rounded border border-indigo-500/20">
                                <Box className="w-3 h-3"/> Vista 3D
                            </button>
                        </div>
                    ) : (
                        <p className="text-slate-500 text-[10px] md:text-base uppercase tracking-[0.4em] font-black mt-2 truncate">
                            Marketplace d'Eccellenza • <span className="text-indigo-400">{cityName}</span>
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-2">
                {shop && (
                    <button 
                        onClick={handleShare}
                        className="p-2 md:p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 shadow-lg transition-all"
                        title="Condividi Bottega"
                    >
                        <Share2 className="w-4 h-4"/>
                    </button>
                )}

                {/* TASTO SPONSOR (AGGIORNATO STILE) */}
                 {/* CSS Keyframe for shine identical to CityHeader */}
                 <style>{`
                    @keyframes metal-shine {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                    .animate-metal {
                        background: linear-gradient(270deg, #cbd5e1, #e2e8f0, #fcd34d, #f59e0b, #e2e8f0, #cbd5e1);
                        background-size: 400% 400%;
                        animation: metal-shine 6s ease infinite;
                    }
                `}</style>
                <button 
                    onClick={() => onOpenSponsor('shop')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-slate-900 transition-all transform hover:-translate-y-0.5 active:scale-95 border border-white/50 animate-metal"
                    title="Diventa Partner Shopping"
                >
                    <Briefcase className="w-4 h-4"/>
                    <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Sponsor</span>
                </button>

                {shop && (
                    <>
                        <button 
                            onClick={handleAddClick}
                            className={`px-3 md:px-4 py-2 md:py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl active:scale-95 transition-all border ${isInItinerary ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-amber-600 hover:bg-amber-500 border-amber-500 text-white'}`}
                            title={isInItinerary ? "Già nel diario" : "Aggiungi Bottega al Diario"}
                        >
                            {isInItinerary ? <Check className="w-4 h-4"/> : <Plus className="w-4 h-4"/>} 
                            <span className="hidden lg:inline">{isInItinerary ? 'AGGIUNTO' : 'AGGIUNGI'}</span>
                        </button>
                        <button className="hidden md:flex bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest items-center gap-2 shadow-xl active:scale-95 transition-all">
                            <MessageCircle className="w-4 h-4"/> Chatta
                        </button>
                    </>
                )}
                
                {/* STANDARD RED CLOSE BUTTON - RESIZED TO MATCH OTHER MODALS */}
                <button onClick={onBack} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg">
                    <X className="w-6 h-6"/>
                </button>
            </div>
        </div>
    );
};
