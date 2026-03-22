import React, { useEffect, useState, useCallback } from 'react';
import { X, Store, Loader2 } from 'lucide-react';
import { User as UserType, MarketingConfig } from '../../types/index';
import { getSetting, SETTINGS_KEYS } from '../../services/settingsService';
import { SponsorTypeSelector } from './sponsor/SponsorTypeSelector';
import { SponsorPricingSelector } from './sponsor/SponsorPricingSelector'; // Import aggiornato
import { SponsorForm } from './sponsor/SponsorForm';
import { SponsorSuccess } from './sponsor/SponsorSuccess';
import { useSponsorFormLogic } from '../../hooks/features/useSponsorFormLogic';

interface SponsorModalProps {
    isOpen: boolean;
    onClose: () => void;
    user?: UserType;
    initialTier?: 'gold' | 'silver';
    initialType?: 'activity' | 'shop' | 'guide';
}

export const SponsorModal = ({ isOpen, onClose, user, initialTier, initialType }: SponsorModalProps) => {
    // Caricamento configurazione marketing (Prezzi) - NON MODIFICATO
    const [marketingConfig, setMarketingConfig] = useState<MarketingConfig | null>(null);
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setIsLoadingConfig(true);
            getSetting<MarketingConfig>(SETTINGS_KEYS.MARKETING_PRICES_V2).then(p => {
                if(p) setMarketingConfig(p);
                setIsLoadingConfig(false);
            });
        }
    }, [isOpen]);

    // Hook Logica Form - NON MODIFICATO
    const {
        step, activeType, selectedPlan, formData, isSubmitting, errorMsg,
        termsAccepted, privacyAccepted, coverImage, isGuest,
        setFormData, setTermsAccepted, setPrivacyAccepted, setCoverImage, setErrorMsg, setSelectedPlan,
        handleTypeChange, handleSubmit, resetForm, handleMagicRewrite
    } = useSponsorFormLogic({ 
        user, 
        initialType, 
        initialTier, 
        marketingConfig 
    });

    const handlePricingSelection = useCallback((id: string | null) => {
        setSelectedPlan(id as any);
    }, []);

    // Reset quando si riapre - NON MODIFICATO
    useEffect(() => {
        if (isOpen && step === 'success') {
            resetForm();
        }
    }, [isOpen]);

    // Key Handler - NON MODIFICATO
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 overflow-y-auto">
            <div className="relative bg-[#020617] w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] md:rounded-3xl border-0 md:border border-slate-700 shadow-2xl flex flex-col animate-in zoom-in-95">
                
                <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-[#0f172a] shrink-0 sticky top-0 z-50 md:rounded-t-3xl">
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-600 p-2.5 rounded-xl shadow-lg shadow-amber-900/20"><Store className="w-6 h-6 text-white"/></div>
                        <div><h2 className="text-2xl font-display font-bold text-white leading-none">Diventa Partner</h2><p className="text-xs text-slate-400 mt-1 font-medium">Entra nel network di Touring Diary</p></div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"><X className="w-6 h-6"/></button>
                </div>

                {step === 'success' ? (
                    <SponsorSuccess 
                        contactName={formData.contactName}
                        isGuest={isGuest}
                        adminEmail={formData.adminEmail}
                        onClose={onClose}
                    />
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#020617]">
                        {isLoadingConfig || !marketingConfig ? (
                            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-500 gap-4">
                                <Loader2 className="w-12 h-12 animate-spin text-indigo-500"/>
                                <p className="text-xs font-bold uppercase tracking-widest">Caricamento Listini...</p>
                            </div>
                        ) : (
                            <div className="p-6 md:p-10 max-w-3xl mx-auto">
                                
                                <SponsorTypeSelector activeType={activeType} onChange={handleTypeChange} />

                                {/* --- BLOCCO SOSTITUITO --- */}
                                <SponsorPricingSelector
                                    activeType={activeType}
                                    onSelectionChange={handlePricingSelection}
                                />
                                {/* --- FINE BLOCCO SOSTITUITO --- */}
                                
                                <SponsorForm 
                                    formData={formData} 
                                    setFormData={setFormData}
                                    activeType={activeType}
                                    isGuest={isGuest}
                                    isSubmitting={isSubmitting}
                                    errorMsg={errorMsg}
                                    setErrorMsg={setErrorMsg}
                                    onSubmit={handleSubmit}
                                    setCoverImage={(file) => setCoverImage(file)}
                                    coverImage={coverImage}
                                    termsAccepted={termsAccepted}
                                    setTermsAccepted={setTermsAccepted}
                                    privacyAccepted={privacyAccepted}
                                    setPrivacyAccepted={setPrivacyAccepted}
                                    handleMagicRewrite={handleMagicRewrite}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};