
import { useState, useEffect, useMemo, useCallback } from 'react';
import { ShopPartner, ShopCategory, ShopProduct, PointOfInterest } from '../../types/index';
import { getShopsByFilter, getShopByVat } from '../../services/shopService';
import { fetchSponsorsByCityAsync } from '../../services/sponsorService';

interface UseShopNavigationProps {
    cityId: string;
    initialShopVat?: string | null;
}

export const useShopNavigation = ({ cityId, initialShopVat }: UseShopNavigationProps) => {
    // --- DATA STATE ---
    const [shopsList, setShopsList] = useState<ShopPartner[]>([]);
    const [citySponsors, setCitySponsors] = useState<PointOfInterest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- NAVIGATION STATE ---
    const [selectedCategory, setSelectedCategory] = useState<ShopCategory | null>(null);
    const [selectedShop, setSelectedShop] = useState<ShopPartner | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null); 
    
    // --- UI STATE ---
    const [showPlanner, setShowPlanner] = useState(false);
    const [pendingPoi, setPendingPoi] = useState<PointOfInterest | null>(null);
    const [showFullBio, setShowFullBio] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    // 1. DATA LOADING
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const [shops, sponsors] = await Promise.all([
                    getShopsByFilter(cityId, selectedCategory || undefined),
                    fetchSponsorsByCityAsync(cityId)
                ]);
                setShopsList(shops);
                setCitySponsors(sponsors);
            } catch (e) {
                console.error("Shop Load Error", e);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [cityId, selectedCategory]);

    // 2. DEEP LINKING (VAT NUMBER)
    useEffect(() => {
        if (initialShopVat && shopsList.length > 0) {
            const target = shopsList.find(s => s.vatNumber === initialShopVat);
            if (target) setSelectedShop(target);
        }
    }, [shopsList, initialShopVat]);

    // 3. COMPUTED LISTS
    const premiumShops = useMemo(() => shopsList.filter(s => s.level === 'premium'), [shopsList]);

    const contextualSponsors = useMemo(() => {
        if (!selectedCategory) return citySponsors;
        // Mapping category to POI category
        const map: Record<string, string> = { 'gusto': 'food', 'cantina': 'food', 'artigianato': 'shop', 'moda': 'shop' };
        const target = map[selectedCategory];
        return citySponsors.filter(s => s.category === target || s.tier === 'gold');
    }, [citySponsors, selectedCategory]);
    
    const goldSponsors = useMemo(() => contextualSponsors.filter(s => s.tier === 'gold'), [contextualSponsors]);
    const silverSponsors = useMemo(() => contextualSponsors.filter(s => s.tier === 'silver'), [contextualSponsors]);

    // 4. ACTIONS
    const handleRequestAdd = (poi: PointOfInterest, existsInItinerary: boolean) => {
        if (existsInItinerary) setShowPlanner(true);
        else setPendingPoi(poi);
    };

    const handleConfirmAdd = () => {
        setPendingPoi(null);
        setShowPlanner(true);
    };

    const handleBack = (onGlobalBack: () => void) => {
        if (selectedProduct) { setSelectedProduct(null); return; }
        if (showFullBio) { setShowFullBio(false); return; }
        if (selectedShop) { setSelectedShop(null); return; }
        if (selectedCategory) { setSelectedCategory(null); return; }
        onGlobalBack();
    };

    return {
        // State
        shopsList, premiumShops, goldSponsors, silverSponsors, isLoading,
        selectedCategory, selectedShop, selectedProduct,
        showPlanner, pendingPoi, showFullBio, lightboxImage,

        // Setters
        setSelectedCategory, setSelectedShop, setSelectedProduct,
        setShowPlanner, setPendingPoi, setShowFullBio, setLightboxImage,

        // Actions
        handleRequestAdd,
        handleConfirmAdd,
        handleBack
    };
};
