import { Z_LIGHTBOX_CLOSE, Z_LIGHTBOX_CONTENT, Z_LIGHTBOX, Z_OVERLAY, Z_OVERLAY_BACKDROP, Z_MODAL } from '@/constants/zIndex';
import React, { useEffect, useState, Suspense } from 'react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Map, Loader2 } from 'lucide-react';
import { ShopPartner, ShopCategory, PointOfInterest, User } from '../../types/index';
import { useItinerary } from '@/context/ItineraryContext';
import { AddToItineraryModal } from '../modals/AddToItineraryModal';
import { TravelDiary } from '../features/diary/TravelDiary';
import { useShopNavigation } from '../../hooks/features/useShopNavigation';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ShopHeader } from './ShopHeader';
import { Utensils, Wine, Hammer, Scissors } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { useGps } from '@/context/GpsContext';
import { useUI } from '@/context/UIContext';
import { useDiaryInteractionsContext } from '@/context/useDiaryInteractionsContext';

// --- LAZY IMPORTS ---
const ShopDetailView = React.lazy(() => import('./ShopDetailView').then(m => ({ default: m.ShopDetailView })));
const ShopHomeView = React.lazy(() => import('./ShopHomeView').then(m => ({ default: m.ShopHomeView })));
const ShopCategoryView = React.lazy(() => import('./ShopCategoryView').then(m => ({ default: m.ShopCategoryView })));

interface ShopPageProps {
    cityId: string;
    cityName: string;
    onBack: () => void;
    onAddToItinerary: (poi: PointOfInterest) => void;
    onOpenPoiDetail: (poi: PointOfInterest) => void;
    onOpenSponsor: (type?: string) => void; 
    isSidebarOpen?: boolean; 
    initialShopVat?: string | null; 
    isModalOpen?: boolean; 
}

const CATEGORIES: { id: ShopCategory, label: string, icon: any, color: string, desc: string }[] = [
    { id: 'gusto', label: 'Gusto', icon: Utensils, color: 'text-orange-500', desc: 'Eccellenze gastronomiche' },
    { id: 'cantina', label: 'Cantina', icon: Wine, color: 'text-purple-500', desc: 'Vini e distillati' },
    { id: 'artigianato', label: 'Artigianato', icon: Hammer, color: 'text-amber-600', desc: 'Fatto a mano' },
    { id: 'moda', label: 'Moda', icon: Scissors, color: 'text-blue-400', desc: 'Tessuti e sartoria' },
];

const ShopLoader = () => (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500"/>
        <p className="text-xs font-bold uppercase tracking-widest">Caricamento Vetrina...</p>
    </div>
);

export const ShopPage = ({ 
    cityId, cityName, onBack, onAddToItinerary, onOpenPoiDetail, 
    onOpenSponsor, isSidebarOpen, initialShopVat, isModalOpen 
}: ShopPageProps) => {
    
    const { user } = useUser();
    const { userLocation } = useGps();
    const { handleMainScroll } = useUI();
    const { itinerary, addItem, setItinerary } = useItinerary();
    
    // RECUPERO LOGICA DIARIO
    const { handleSmartDrop } = useDiaryInteractionsContext();

    const {
        shopsList, premiumShops, goldSponsors, silverSponsors, isLoading,
        selectedCategory, selectedShop, selectedProduct,
        showPlanner, pendingPoi, showFullBio, lightboxImage,
        setSelectedCategory, setSelectedShop, setSelectedProduct,
        setShowPlanner, setPendingPoi, setShowFullBio, setLightboxImage,
        handleRequestAdd, handleConfirmAdd, handleBack
    } = useShopNavigation({ cityId, initialShopVat });

    const pageTitle = selectedShop 
        ? selectedShop.name 
        : selectedCategory 
            ? `${CATEGORIES.find(c => c.id === selectedCategory)?.label || 'Shopping'} a ${cityName}` 
            : `Shopping a ${cityName}`;
    useDocumentTitle(pageTitle);

    const currentShopPoi = selectedShop ? {
        id: `shop-${selectedShop.id}`,
        name: selectedShop.name,
        category: 'shop',
        description: selectedShop.shortBio || 'Bottega',
        imageUrl: selectedShop.imageUrl,
        rating: selectedShop.rating || 0,
        votes: selectedShop.likes || 0,
        coords: selectedShop.coords,
        address: selectedShop.address
    } as PointOfInterest : null;

    const isInItinerary = currentShopPoi ? itinerary.items.some(i => i.poi.id === currentShopPoi.id) : false;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isModalOpen) return;
                e.preventDefault(); e.stopPropagation();
                handleBack(onBack);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleBack, onBack, isModalOpen]);

    const confirmAddToItinerary = (dayIndex: number, timeSlotStr: string) => {
        if (!pendingPoi) return;
        addItem({ id: `item-${Date.now()}`, poi: pendingPoi, cityId, dayIndex, timeSlotStr, isCustom: false });
        handleConfirmAdd();
    };

    const renderMainContent = () => {
        if (selectedShop) {
            return (
                <ShopDetailView 
                    shop={selectedShop} 
                    onBack={() => handleBack(onBack)} 
                    onOpenLightbox={setLightboxImage} 
                    showFullBio={showFullBio} 
                    onToggleBio={setShowFullBio} 
                    onAddToItinerary={(poi) => handleRequestAdd(poi, itinerary.items.some(i => i.poi.id === poi.id))}
                    selectedProduct={selectedProduct}
                    onSelectProduct={setSelectedProduct}
                />
            );
        }

        if (selectedCategory) {
            return (
                <ShopCategoryView 
                    isLoading={isLoading}
                    shopsList={shopsList}
                    goldSponsors={goldSponsors}
                    silverSponsors={silverSponsors}
                    onSelectShop={setSelectedShop}
                    onAddToItinerary={(poi) => handleRequestAdd(poi, itinerary.items.some(i => i.poi.id === poi.id))}
                    onOpenSponsor={onOpenSponsor}
                />
            );
        }

        return (
            <ShopHomeView 
                premiumShops={premiumShops}
                categories={CATEGORIES}
                onSelectCategory={setSelectedCategory}
                onSelectShop={setSelectedShop}
                onOpenShopSponsor={() => onOpenSponsor('shop')}
                isSidebarOpen={isSidebarOpen}
            />
        );
    };

    return (
        <div className="relative w-full h-full flex flex-col bg-[#020617] animate-in fade-in duration-500 overflow-hidden">
            
            {lightboxImage && (
                <div style={{ zIndex: Z_LIGHTBOX }} className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-300 pointer-events-auto" onClick={() => setLightboxImage(null)}>
                    <img src={lightboxImage} alt="Fullscreen" style={{ zIndex: Z_LIGHTBOX_CONTENT }} className="max-w-[95vw] max-h-[90vh] rounded shadow-2xl object-contain relative" />
                    <CloseButton onClose={() => setLightboxImage(null)} variant="primary" position="absolute" style={{ zIndex: Z_LIGHTBOX_CLOSE }} className="top-6 right-6" />
                </div>
            )}

            {pendingPoi && (
                 <AddToItineraryModal 
                    isOpen={true} 
                    onClose={() => setPendingPoi(null)} 
                    onConfirm={confirmAddToItinerary} 
                    onRemove={() => {}} 
                    poi={pendingPoi} 
                    startDate={itinerary.startDate} 
                    endDate={itinerary.endDate} 
                    existingItems={itinerary.items} 
                    onDateSet={(s, e) => setItinerary(prev => ({ ...prev, startDate: s, endDate: e }))} 
                />
            )}

            <div style={{ zIndex: Z_MODAL }} className={`absolute top-0 bottom-0 right-0 w-full md:w-[400px] bg-slate-950 border-l border-slate-800 shadow-2xl transform transition-transform duration-500 ease-in-out ${showPlanner ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
                <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-[#0f172a]">
                    <div className="flex items-center gap-2"><Map className="w-5 h-5 text-amber-500"/><h3 className="font-bold text-white text-lg">Il Tuo Viaggio</h3></div>
                    <CloseButton onClose={() => setShowPlanner(false)} variant="primary" />
                </div>
                <div className="flex-1 overflow-hidden relative">
                    {user && (
                         <Suspense fallback={<ShopLoader />}>
                            <TravelDiary 
                                user={user} 
                                onViewDetail={onOpenPoiDetail} 
                                onDayDrop={handleSmartDrop} // FIXED: Passed real handler
                                onPrint={() => {}} 
                                userLocation={userLocation || null} 
                                onCityClick={() => {}} 
                            />
                         </Suspense>
                    )}
                </div>
            </div>
            {showPlanner && <div style={{ zIndex: Z_OVERLAY_BACKDROP }} className="absolute inset-0 bg-black/50 md:hidden" onClick={() => setShowPlanner(false)}></div>}

            <div className="relative w-full h-full max-w-[1920px] mx-auto flex flex-col overflow-hidden bg-[#020617]">
                <ShopHeader 
                    shop={selectedShop} 
                    selectedCategory={selectedCategory} 
                    cityName={cityName} 
                    categories={CATEGORIES}
                    onBack={onBack} 
                    onInternalBack={() => handleBack(onBack)}
                    onAddToItinerary={(poi) => handleRequestAdd(poi, itinerary.items.some(i => i.poi.id === poi.id))} 
                    onTogglePlanner={() => setShowPlanner(!showPlanner)} 
                    onOpenSponsor={onOpenSponsor}
                    isPlannerOpen={showPlanner}
                    isInItinerary={isInItinerary}
                />

                {/* FIX SCROLL MOBILE: Scroll handler on Main Content */}
                <div 
                    className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar scrollbar-hide-mobile bg-[#020617] pb-24"
                    onScroll={handleMainScroll}
                >
                    <Suspense fallback={<ShopLoader />}>
                        {renderMainContent()}
                    </Suspense>
                </div>
            </div>
        </div>
    );
};



