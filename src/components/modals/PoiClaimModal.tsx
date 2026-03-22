
import React, { useState, useEffect } from 'react';
import { X, Briefcase, UserCheck, Edit3, CheckCircle, Store, Flag, ShoppingCart, Loader2, Info } from 'lucide-react';
import { PointOfInterest, User, MarketingConfig } from '../../types/index';
import { addSuggestion } from '../../services/communityService';
import { getSetting, SETTINGS_KEYS } from '../../services/settingsService';
import { useSponsorFormLogic } from '../../hooks/features/useSponsorFormLogic';
import { SponsorForm } from './sponsor/SponsorForm';
import { SponsorSuccess } from './sponsor/SponsorSuccess';

interface PoiClaimModalProps {
    isOpen: boolean;
    onClose: () => void;
    poi: PointOfInterest;
    user?: User;
}

export const PoiClaimModal = ({ isOpen, onClose, poi, user }: PoiClaimModalProps) => {
    // 1. Local State per il Tab Attivo
    const [activeTab, setActiveTab] = useState<'gold' | 'silver' | 'shop' | 'report'>('gold');
    const [marketingConfig, setMarketingConfig] = useState<MarketingConfig | null>(null);

    // 2. States for Suggestion (Report Mode only)
    const [suggestionText, setSuggestionText] = useState('');
    const [suggestionErrorTypes, setSuggestionErrorTypes] = useState({ name: false, location: false, hours: false, photo: false });
    const [isReporting, setIsReporting] = useState(false);
    const [reportSuccess, setReportSuccess] = useState(false);
    const [reportError, setReportError] = useState<string | null>(null);

    // 3. Load Marketing Config
    useEffect(() => {
        if (isOpen) {
            getSetting<MarketingConfig>(SETTINGS_KEYS.MARKETING_PRICES_V2).then(p => { 
                if(p) setMarketingConfig(p); 
            });
        }
    }, [isOpen]);

    // 4. Hook Logica Sponsor (Riutilizziamo la logica potente già esistente)
    // Inizializziamo con valori default, ma li aggiorneremo quando cambia il tab
    const sponsorLogic = useSponsorFormLogic({ 
        user, 
        initialType: 'activity', 
        initialTier: 'gold', 
        marketingConfig 
    });

    // 5. Sync Tab con Sponsor Logic
    useEffect(() => {
        if (activeTab === 'gold') {
            sponsorLogic.handleTypeChange('activity');
            sponsorLogic.setSelectedPlan('gold');
        } else if (activeTab === 'silver') {
            sponsorLogic.handleTypeChange('activity');
            sponsorLogic.setSelectedPlan('silver');
        } else if (activeTab === 'shop') {
            sponsorLogic.handleTypeChange('shop');
            sponsorLogic.setSelectedPlan('shop_basic');
        }

        // Pre-fill con dati POI se non già fatto
        if (activeTab !== 'report') {
            sponsorLogic.setFormData(prev => ({
                ...prev,
                publicName: poi.name,
                address: poi.address || '',
                category: poi.category || '',
                description: poi.description || ''
            }));
        }
    }, [activeTab]);

    // 6. Handle ESC Key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // 7. Handler per "Segnala" (Report)
    const handleSuggestionSubmit = async () => {
        if (!suggestionText.trim()) { setReportError("Descrivi cosa c'è da modificare."); return; }
        setIsReporting(true);
        setReportError(null);
        try {
            await addSuggestion({
                userId: user?.id || 'guest',
                userName: user?.name || 'Ospite',
                cityId: poi.cityId || 'unknown',
                cityName: 'N/A', 
                poiId: poi.id,
                type: 'edit_info',
                details: {
                    title: poi.name,
                    description: suggestionText,
                    errorTypes: suggestionErrorTypes
                }
            });
            setReportSuccess(true);
        } catch (e) {
            setReportError("Errore invio segnalazione.");
        } finally {
            setIsReporting(false);
        }
    };

    if (!isOpen) return null;

    const prices = marketingConfig ? { 
        gold: marketingConfig.gold.basePrice, 
        silver: marketingConfig.silver.basePrice,
        shop: marketingConfig.shop.basePrice
    } : { gold: 120, silver: 50, shop: 80 };

    return (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-4xl rounded-3xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 max-h-[90vh]">
                
                {/* HEADER */}
                <div className="p-6 border-b border-slate-800 bg-[#0f172a] flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-xl shadow-lg">
                            <Briefcase className="w-6 h-6 text-white"/>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white font-display">Gestisci: {poi.name}</h2>
                            <p className="text-xs text-slate-400">Sei il proprietario o vuoi segnalare un errore?</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"><X className="w-5 h-5"/></button>
                </div>

                {/* TABS NAVIGATION */}
                <div className="grid grid-cols-4 p-2 bg-slate-950 border-b border-slate-800 gap-2 shrink-0">
                    <button onClick={() => setActiveTab('gold')} className={`py-3 px-2 text-[10px] md:text-xs font-bold uppercase rounded-xl transition-all flex flex-col items-center gap-1.5 ${activeTab === 'gold' ? 'bg-amber-900/20 text-amber-500 shadow-lg border border-amber-500/50' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}>
                        <UserCheck className="w-5 h-5"/> 
                        <span>Gold <span className="opacity-70 block mt-0.5">€{prices.gold}/mese</span></span>
                    </button>
                    
                    <button onClick={() => setActiveTab('silver')} className={`py-3 px-2 text-[10px] md:text-xs font-bold uppercase rounded-xl transition-all flex flex-col items-center gap-1.5 ${activeTab === 'silver' ? 'bg-slate-800 text-white shadow-lg border border-slate-600' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}>
                        <Store className="w-5 h-5"/> 
                        <span>Silver <span className="opacity-70 block mt-0.5">€{prices.silver}/mese</span></span>
                    </button>

                    <button onClick={() => setActiveTab('shop')} className={`py-3 px-2 text-[10px] md:text-xs font-bold uppercase rounded-xl transition-all flex flex-col items-center gap-1.5 ${activeTab === 'shop' ? 'bg-indigo-900/20 text-indigo-400 shadow-lg border border-indigo-500/50' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}>
                        <ShoppingCart className="w-5 h-5"/> 
                        <span>Bottega <span className="opacity-70 block mt-0.5">€{prices.shop}/mese</span></span>
                    </button>

                    <button onClick={() => setActiveTab('report')} className={`py-3 px-2 text-[10px] md:text-xs font-bold uppercase rounded-xl transition-all flex flex-col items-center gap-1.5 ${activeTab === 'report' ? 'bg-red-900/20 text-red-400 shadow-lg border border-red-500/50' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}>
                        <Flag className="w-5 h-5"/> 
                        <span>Segnala <span className="opacity-70 block mt-0.5">Errore</span></span>
                    </button>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#020617]">
                    <div className="p-6 md:p-10 max-w-3xl mx-auto">

                        {/* CASO 1: SEGNALAZIONE */}
                        {activeTab === 'report' && (
                            reportSuccess ? (
                                <div className="text-center py-12 space-y-6">
                                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500 shadow-lg mx-auto">
                                        <CheckCircle className="w-10 h-10 text-emerald-500"/>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">Segnalazione Inviata!</h3>
                                    <p className="text-slate-400">Grazie per il tuo contributo. Verificheremo i dati al più presto.</p>
                                    <button onClick={onClose} className="bg-slate-800 px-8 py-3 rounded-xl font-bold text-white uppercase text-xs hover:bg-slate-700 transition-colors border border-slate-700">Chiudi</button>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in fade-in">
                                    <div className="bg-red-900/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
                                        <Info className="w-5 h-5 text-red-400 shrink-0 mt-0.5"/>
                                        <p className="text-xs text-red-200 leading-relaxed">
                                            Usa questo modulo solo per segnalare inesattezze (orari, indirizzo, nome errato). 
                                            Se sei il proprietario, usa i tab Gold, Silver o Bottega per rivendicare.
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Cosa c'è di sbagliato?</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {Object.keys(suggestionErrorTypes).map(k => (
                                                <button 
                                                    key={k} 
                                                    onClick={() => setSuggestionErrorTypes(p => ({...p, [k]: !p[k as keyof typeof p]}))}
                                                    className={`p-3 rounded-lg border text-xs font-bold uppercase transition-all ${suggestionErrorTypes[k as keyof typeof suggestionErrorTypes] ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                                                >
                                                    {k}
                                                </button>
                                            ))}
                                        </div>

                                        <label className="text-xs font-bold text-slate-500 uppercase block mt-4">Dettagli Corretti</label>
                                        <textarea 
                                            value={suggestionText}
                                            onChange={e => setSuggestionText(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-sm h-32 focus:border-red-500 outline-none resize-none"
                                            placeholder="Scrivi qui i dati corretti..."
                                        />

                                        {reportError && <p className="text-red-400 text-xs font-bold bg-red-900/20 p-2 rounded border border-red-500/30">{reportError}</p>}

                                        <button 
                                            onClick={handleSuggestionSubmit}
                                            disabled={isReporting}
                                            className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-xl font-bold uppercase text-xs shadow-lg transition-all"
                                        >
                                            {isReporting ? <Loader2 className="w-4 h-4 animate-spin mx-auto"/> : 'Invia Segnalazione'}
                                        </button>
                                    </div>
                                </div>
                            )
                        )}

                        {/* CASO 2: RIVENDICAZIONE BUSINESS (GOLD/SILVER/SHOP) */}
                        {activeTab !== 'report' && (
                             sponsorLogic.step === 'success' ? (
                                <SponsorSuccess 
                                    contactName={sponsorLogic.formData.contactName}
                                    isGuest={sponsorLogic.isGuest}
                                    adminEmail={sponsorLogic.formData.adminEmail}
                                    onClose={onClose}
                                />
                             ) : (
                                <SponsorForm 
                                    formData={sponsorLogic.formData} 
                                    setFormData={sponsorLogic.setFormData}
                                    activeType={sponsorLogic.activeType}
                                    isGuest={sponsorLogic.isGuest}
                                    isSubmitting={sponsorLogic.isSubmitting}
                                    errorMsg={sponsorLogic.errorMsg}
                                    setErrorMsg={sponsorLogic.setErrorMsg}
                                    onSubmit={sponsorLogic.handleSubmit}
                                    setCoverImage={(file) => sponsorLogic.setCoverImage(file)}
                                    coverImage={sponsorLogic.coverImage}
                                    termsAccepted={sponsorLogic.termsAccepted}
                                    setTermsAccepted={sponsorLogic.setTermsAccepted}
                                    privacyAccepted={sponsorLogic.privacyAccepted}
                                    setPrivacyAccepted={sponsorLogic.setPrivacyAccepted}
                                    handleMagicRewrite={sponsorLogic.handleMagicRewrite} // Pass the handler
                                />
                             )
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};
