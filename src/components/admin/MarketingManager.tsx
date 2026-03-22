import React, { useState, useEffect } from 'react';
import { CreditCard, Save, Loader2, CheckCircle, X, Link } from 'lucide-react';
import { useMarketingLogic, MarketingTierKey } from '../../hooks/useMarketingLogic';
import PriceConfigurator from './marketing/PriceConfigurator';
import { useAdminStyles } from '../../hooks/useAdminStyles';
import { MarketingTierConfig } from '../../types';

export const MarketingManager = () => {
    const {
        prices,
        promoTypes,
        isLoading,
        isSaving,
        updateTierPrice,
        savePrices,
    } = useMarketingLogic();
    
    const { styles } = useAdminStyles();
    const [toast, setToast] = useState<{ show: boolean, message: string } | null>(null);

    useEffect(() => {
        if (toast?.show) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleSave = async () => {
        if (!prices) return;
        await savePrices(prices);
        setToast({ show: true, message: "Impostazioni aggiornate con successo!" });
    };

    // CORREZIONE MINIMA: Assicura che promoActive sia sempre un booleano
    const handleUpdatePrice = (tierId: MarketingTierKey, config: MarketingTierConfig) => {
        const correctedConfig = {
            ...config,
            promoActive: !!config.promoActive, // Forza la conversione a booleano
        };
        updateTierPrice(tierId, correctedConfig);
    };

    if (isLoading || !prices) {
        return (
            <div className="text-center py-20 text-slate-500 flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500"/>
                <p>Caricamento configurazioni...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in pb-12 relative">
            
            {toast && toast.show && (
                <div className="fixed bottom-10 right-10 z-[2000] animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className="bg-emerald-600 border border-emerald-400 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[300px]">
                        <div className="bg-white/20 p-2 rounded-full"><CheckCircle className="w-6 h-6 text-white"/></div>
                        <div className="flex-1"><h4 className="font-bold text-sm uppercase tracking-wide mb-0.5">Notifica</h4><p className="text-emerald-100 text-xs">{toast.message}</p></div>
                        <button onClick={() => setToast(null)} className="text-white/70 hover:text-white p-1 rounded-full"><X className="w-5 h-5"/></button>
                    </div>
                </div>
            )}
            
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-600 rounded-xl shadow-lg"><CreditCard className="w-8 h-8 text-white" /></div>
                    <div><h2 className={styles.admin_page_title}>Marketing & Guadagni</h2><p className={styles.admin_page_subtitle}>Listini e Promozioni</p></div>
                </div>
                <button onClick={handleSave} disabled={isSaving || isLoading} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all disabled:opacity-50 border border-emerald-500 hover:scale-105 active:scale-95">
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5"/>} {isSaving ? 'Salvataggio...' : 'Salva Modifiche DB'}
                </button>
            </div>
            
            <PriceConfigurator
                config={prices}
                onUpdate={handleUpdatePrice}
            />

             <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-xl mt-8">
                 <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-4"><Link className="w-6 h-6 text-blue-500"/> Info Addizionali</h3>
                 <div className="text-center text-slate-500 text-xs italic">
                    La gestione degli affiliati e della cronologia prezzi è stata spostata o deprecata per semplificare l'interfaccia.
                 </div>
            </div>
        </div>
    );
};
