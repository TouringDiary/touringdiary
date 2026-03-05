
import { useState, useEffect } from 'react';
import { getSetting, saveSetting, SETTINGS_KEYS } from '../services/settingsService';
import { MarketingConfig, PriceHistoryEntry, TierPricingConfig } from '../types/index';

interface PromoType {
    id: string;
    label: string;
}

export const useMarketingLogic = () => {
    const [prices, setPrices] = useState<MarketingConfig | null>(null);
    const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
    const [affiliateIds, setAffiliateIds] = useState<any>({});
    const [promoTypes, setPromoTypes] = useState<PromoType[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial Load
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const [loadedPrices, loadedHistory, loadedAffiliates, loadedPromos] = await Promise.all([
                    getSetting<MarketingConfig>(SETTINGS_KEYS.MARKETING_PRICES),
                    getSetting<PriceHistoryEntry[]>(SETTINGS_KEYS.PRICE_HISTORY),
                    getSetting(SETTINGS_KEYS.AFFILIATE_CONFIG),
                    getSetting<PromoType[]>(SETTINGS_KEYS.MARKETING_PROMO_TYPES)
                ]);
                
                setPrices(loadedPrices);
                setHistory(loadedHistory || []);
                setAffiliateIds(loadedAffiliates);
                setPromoTypes(loadedPromos || []);
            } catch (err) {
                console.error("Error loading marketing settings", err);
                setError("Errore caricamento dati.");
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    // Actions
    const updatePriceConfig = (key: keyof MarketingConfig, newConfig: TierPricingConfig) => {
        if (!prices) return;
        // @ts-ignore
        setPrices({ ...prices, [key]: newConfig });
    };

    // UPDATED: More generic update function
    const updateGlobalRule = (key: string, value: any) => {
        if (!prices) return;
        setPrices(prev => prev ? ({ ...prev, [key]: value }) : null);
    };

    const addPromoType = (name: string) => {
        const newType: PromoType = {
            id: `promo_${Date.now()}`,
            label: name.trim()
        };
        setPromoTypes(prev => [...prev, newType]);
    };

    const deletePromoType = (id: string) => {
        setPromoTypes(prev => prev.filter(p => p.id !== id));
    };

    const addHistoryEntry = (entry: PriceHistoryEntry) => {
        setHistory(prev => [entry, ...prev]);
    };

    const deleteHistoryEntry = (id: string) => {
        setHistory(prev => prev.filter(h => h.id !== id));
    };

    const saveAllSettings = async (): Promise<boolean> => {
        if (!prices) return false;
        setIsSaving(true);
        try {
            await Promise.all([
                saveSetting(SETTINGS_KEYS.MARKETING_PRICES, prices),
                saveSetting(SETTINGS_KEYS.PRICE_HISTORY, history),
                saveSetting(SETTINGS_KEYS.AFFILIATE_CONFIG, affiliateIds),
                saveSetting(SETTINGS_KEYS.MARKETING_PROMO_TYPES, promoTypes)
            ]);
            return true;
        } catch (err) {
            console.error("Save error", err);
            setError("Errore salvataggio.");
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    return {
        // State
        prices,
        history,
        affiliateIds,
        promoTypes,
        isLoading,
        isSaving,
        error,

        // Methods
        updatePriceConfig,
        updateGlobalRule, 
        addPromoType,
        deletePromoType,
        addHistoryEntry,
        deleteHistoryEntry,
        saveAllSettings,
        setError
    };
};
