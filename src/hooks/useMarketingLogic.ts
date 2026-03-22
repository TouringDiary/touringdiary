import { useState, useEffect } from 'react';
import { saveSetting, SETTINGS_KEYS } from '../services/settingsService';
import { useConfig } from '@/context/ConfigContext';
// I tipi vengono ora importati tramite l'index barrel file
import { MarketingConfig, MarketingTierConfig, MarketingPromoType } from '../types';

export type MarketingTierKey =
  | "silver"
  | "gold"
  | "guide"
  | "shop"
  | "tourOperator"
  | "premiumUser"
  | "premiumUserPlus";

export const useMarketingLogic = () => {
    // CORREZIONE: L'hook useConfig non restituisce più refetch. Rimuoviamolo dalla destrutturazione.
    const { configs, isLoading: isConfigLoading } = useConfig();

    const [prices, setPrices] = useState<MarketingConfig | null>(null);
    const [promoTypes, setPromoTypes] = useState<MarketingPromoType[]>([]);
    
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isLoading = isConfigLoading;

    useEffect(() => {
        if (!isConfigLoading && configs) {
            try {
                const loadedPrices = configs[SETTINGS_KEYS.MARKETING_PRICES_V2] as MarketingConfig | null;
                const loadedPromos = configs[SETTINGS_KEYS.MARKETING_PROMO_TYPES] as MarketingPromoType[] | null;

                setPrices(loadedPrices);
                setPromoTypes(loadedPromos || []);
                setError(null);
            } catch (err) {
                 console.error("Error processing marketing settings from context", err);
                 setError("Errore durante la lettura della configurazione.");
            }
        }
    }, [isConfigLoading, configs]);

    const updateTierPrice = (tierId: MarketingTierKey, newConfig: MarketingTierConfig) => {
        if (!prices) return;
        
        const updatedPrices = { ...prices, [tierId]: newConfig };
        setPrices(updatedPrices);
    };

    const savePrices = async (newPrices: MarketingConfig) => {
        setIsSaving(true);
        setError(null);
        try {
            await saveSetting(SETTINGS_KEYS.MARKETING_PRICES_V2, newPrices);
            // CORREZIONE: La chiamata a refetch() è stata rimossa perché non più disponibile.
            // La logica di aggiornamento della UI si affiderà al refresh della pagina o alla gestione dello stato locale.
        } catch (err) {
            console.error("Error saving marketing prices", err);
            setError("Errore during the saving of the prices.");
        } finally {
            setIsSaving(false);
        }
    };

    return {
        prices,
        promoTypes,
        isLoading,
        isSaving,
        error,
        updateTierPrice,
        savePrices,
    };
};
