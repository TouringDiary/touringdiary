
import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { User } from '../../types/users';
import { getSetting, SETTINGS_KEYS } from '../../services/settingsService';
import { MarketingConfig } from '../../types/models/Sponsor';
import { SponsorPlanCard } from '../marketing/SponsorPlanCard';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onSuccess: () => void;
}

export const UserUpgradeModal = ({ isOpen, onClose, user, onSuccess }: Props) => {
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [selectedTier, setSelectedTier] = useState<'premiumUser' | 'premiumUserPlus'>('premiumUserPlus');
    const [config, setConfig] = useState<MarketingConfig | null>(null);
    
    // Load Config
    useEffect(() => {
        if(isOpen) {
            getSetting<MarketingConfig>(SETTINGS_KEYS.MARKETING_PRICES).then(c => {
                if(c) setConfig(c);
            });
        }
    }, [isOpen]);

    // Gestione Tasto ESC
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleUpgrade = async () => {
        setIsUpgrading(true);
        // SIMULAZIONE PAGAMENTO
        await new Promise(r => setTimeout(r, 2000));
        
        try {
            alert(`Upgrade a ${selectedTier === 'premiumUser' ? 'TRAVELER PRO' : 'TRAVELER PRO PLUS'} completato con successo!`);
            onSuccess();
            onClose();
        } catch (e) {
            alert("Errore durante l'attivazione.");
        } finally {
            setIsUpgrading(false);
        }
    };

    if (!isOpen) return null;

    // Fallback config if loading
    const proConfig = config?.premiumUser || { basePrice: 4.99, promoActive: false, features: { photos: 9999, speed: 1 } };
    const plusConfig = config?.premiumUserPlus || { basePrice: 9.99, promoActive: false, features: { photos: 9999, speed: 1 } };

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
            <div className="bg-[#0b0f1a] w-full max-w-4xl rounded-[2rem] border border-indigo-500/30 shadow-[0_0_50px_rgba(79,70,229,0.2)] relative overflow-hidden flex flex-col animate-in zoom-in-95 max-h-[90vh]">
                
                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors z-50">
                    <X className="w-5 h-5"/>
                </button>

                <div className="p-8 text-center border-b border-slate-800 bg-slate-900/50">
                    <h2 className="text-3xl font-display font-black text-white mb-2 uppercase tracking-wide">Sblocca il Potenziale</h2>
                    <p className="text-slate-400 text-sm">Scegli il livello di intelligenza adatto al tuo viaggio.</p>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto h-full">
                        
                        {/* REUSE SPONSOR PLAN CARD FOR 100% CONSISTENCY */}
                        <SponsorPlanCard 
                            type="premiumUser" 
                            config={proConfig} 
                            selected={selectedTier === 'premiumUser'} 
                            onClick={() => setSelectedTier('premiumUser')} 
                        />
                        
                        <SponsorPlanCard 
                            type="premiumUserPlus" 
                            config={plusConfig} 
                            selected={selectedTier === 'premiumUserPlus'} 
                            onClick={() => setSelectedTier('premiumUserPlus')} 
                        />
                        
                    </div>
                </div>

                <div className="p-6 border-t border-slate-800 bg-[#020617] flex flex-col items-center">
                    <button 
                        onClick={handleUpgrade}
                        disabled={isUpgrading}
                        className={`w-full max-w-md py-4 rounded-xl font-black uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 transition-all transform active:scale-95 text-sm ${selectedTier === 'premiumUserPlus' ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:to-orange-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                    >
                        {isUpgrading ? <Loader2 className="w-5 h-5 animate-spin"/> : null}
                        {isUpgrading ? 'Attivazione in corso...' : `Attiva ${selectedTier === 'premiumUserPlus' ? 'Pro Plus' : 'Pro'} Ora`}
                    </button>
                    <p className="text-xs text-slate-500 mt-4">Disdici in qualsiasi momento. Pagamento sicuro SSL.</p>
                </div>
            </div>
        </div>
    );
};
