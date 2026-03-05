
import React from 'react';
import { Check, Camera, MapPin, Globe, ShoppingBag, UserCheck, Zap, Edit2, Bus, Crown, Star, Sparkles, Brain } from 'lucide-react';
import { TierPricingConfig } from '../../types/models/Sponsor';

interface SponsorPlanCardProps {
    type: 'silver' | 'gold' | 'shop' | 'guide' | 'tourOperator' | 'premiumUser' | 'premiumUserPlus';
    config: TierPricingConfig;
    selected?: boolean;
    onClick?: () => void;
    isEditable?: boolean;
    onUpdateConfig?: (newConfig: TierPricingConfig) => void;
    promoTypes?: { id: string, label: string }[];
}

export const SponsorPlanCard = ({ type, config, selected, onClick, isEditable, onUpdateConfig, promoTypes = [] }: SponsorPlanCardProps) => {
    
    // DEFINIZIONE STILI E CONTENUTI STATICI PER TIPO
    const THEME: Record<string, any> = {
        silver: {
            label: "SILVER",
            title: "Attività Locale",
            desc: "Per negozi, ristoranti e servizi che operano in una singola città.",
            gradient: "from-slate-400 via-slate-200 to-slate-500",
            badgeBg: "bg-slate-200 text-slate-900",
            border: "border-slate-400",
            shadow: "shadow-slate-900/20",
            defaultFeatures: [
                { icon: MapPin, text: "Visibilità nella città" },
                { icon: Camera, text: `Scheda con max ${config.features?.photos || 5} foto` },
                { icon: Zap, text: `Rotazione Standard (${config.features?.speed || 20}s)` }
            ]
        },
        gold: {
            label: "GOLD",
            title: "Attività Regionali",
            desc: "Per brand che vogliono visibilità regionale e priorità assoluta.",
            gradient: "from-amber-400 via-yellow-300 to-amber-500",
            badgeBg: "bg-gradient-to-r from-amber-400 to-yellow-600 text-black shadow-lg",
            border: "border-amber-500",
            shadow: "shadow-amber-900/20",
            defaultFeatures: [
                { icon: Globe, text: "Home Page & Dintorni" },
                { icon: Camera, text: `Max ${config.features?.photos || 10} Foto + Rotazione` },
                { icon: Zap, text: `Priorità Algoritmo (${config.features?.speed || 8}s)` }
            ]
        },
        shop: {
            label: "NEGOZIO",
            title: "Vetrina Digitale",
            desc: "Esponi i prodotti artigianali e vendi direttamente ai turisti.",
            gradient: "from-blue-500 via-blue-400 to-indigo-500",
            badgeBg: "bg-blue-600 text-white",
            border: "border-blue-500",
            shadow: "shadow-blue-900/20",
            defaultFeatures: [
                { icon: ShoppingBag, text: `Catalogo fino a ${config.features?.products || 20} Prodotti` },
                { icon: Check, text: "Contatto diretto (No commissioni)" },
                { icon: Globe, text: "Visibilità Nazionale" }
            ]
        },
        guide: {
            label: "PROFILO PRO",
            title: "Guida Turistica",
            desc: "Piano dedicato ai liberi professionisti e guide autorizzate.",
            gradient: "from-indigo-500 via-purple-500 to-indigo-600",
            badgeBg: "bg-indigo-900/50 border border-indigo-500 text-indigo-300",
            border: "border-indigo-500",
            shadow: "shadow-indigo-900/20",
            defaultFeatures: [
                { icon: UserCheck, text: "Profilo 'Verificato' con badge" },
                { icon: Globe, text: "Priorità nella lista 'Guide'" },
                { icon: Zap, text: `Rotazione Standard (${config.features?.speed || 15}s)` }
            ]
        },
        tourOperator: {
            label: "AGENCY",
            title: "Tour Operator",
            desc: "Per agenzie che offrono pacchetti, transfer e tour organizzati.",
            gradient: "from-cyan-500 via-teal-400 to-emerald-500",
            badgeBg: "bg-gradient-to-r from-cyan-600 to-teal-600 text-white",
            border: "border-cyan-500",
            shadow: "shadow-cyan-900/20",
            defaultFeatures: [
                { icon: Bus, text: "Vetrina Agenzia + Licenza" },
                { icon: Globe, text: "Visibilità Multi-Città (Itinerari)" },
                { icon: Zap, text: `Priorità su 'Dintorni' (${config.features?.speed || 10}s)` }
            ]
        },
        premiumUser: {
            label: "TRAVELER PRO",
            title: "Utente Pro",
            desc: "Ideale per pianificatori frequenti. Elimina i limiti giornalieri.",
            gradient: "from-fuchsia-500 via-purple-500 to-indigo-500",
            badgeBg: "bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white",
            border: "border-fuchsia-500",
            shadow: "shadow-fuchsia-900/20",
            defaultFeatures: [
                { icon: Zap, text: "Crediti AI (100/mese)" },
                { icon: Brain, text: "Motore AI Veloce (Flash)" },
                { icon: Crown, text: "Badge 'Pro' + Export PDF" }
            ]
        },
        premiumUserPlus: {
            label: "TRAVELER PRO PLUS",
            title: "Utente Pro Plus",
            desc: "Accesso al modello AI 'Deep Reasoning' per itinerari complessi.",
            gradient: "from-slate-900 via-slate-800 to-black",
            badgeBg: "bg-gradient-to-r from-slate-900 to-black text-amber-400 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]",
            border: "border-amber-500",
            shadow: "shadow-amber-900/30",
            defaultFeatures: [
                { icon: Zap, text: "Crediti Maggiorati (500)" },
                { icon: Brain, text: "AI Deep Reasoning (Smart)" },
                { icon: Crown, text: "Badge 'Plus' Oro + Supporto" }
            ]
        }
    };

    const theme = THEME[type];
    const isPromoActive = config.promoActive;
    
    // Funzione helper per aggiornare il testo di una feature specifica
    const handleFeatureTextChange = (index: number, newValue: string) => {
        if (!onUpdateConfig) return;
        const newLabels = config.customFeatureLabels ? [...config.customFeatureLabels] : theme.defaultFeatures.map((f:any) => f.text);
        while(newLabels.length <= index) {
            newLabels.push(theme.defaultFeatures[newLabels.length]?.text || "");
        }
        newLabels[index] = newValue;
        
        // Ensure array size 3
        const finalLabels = newLabels.slice(0, 3) as [string, string, string];
        onUpdateConfig({ ...config, customFeatureLabels: finalLabels });
    };

    return (
        <div 
            onClick={!isEditable ? onClick : undefined}
            className={`
                relative bg-[#020617] rounded-2xl overflow-hidden border-2 transition-all flex flex-col h-full
                ${selected ? `${theme.border} transform scale-[1.02] shadow-2xl ${theme.shadow}` : `border-slate-800 ${!isEditable && 'hover:border-slate-600 cursor-pointer'}`}
            `}
        >
            {/* TOP BAR GRADIENT */}
            <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${theme.gradient}`}></div>

            <div className="p-6 flex-1 flex flex-col">
                
                {/* HEADER: BADGE + PREZZO */}
                <div className="flex justify-between items-start mb-4">
                    <div className={`px-3 py-1 rounded-lg font-bold text-xs uppercase inline-block ${theme.badgeBg}`}>
                        {theme.label}
                    </div>
                    
                    <div className="text-right">
                        {isPromoActive ? (
                            <>
                                <div className="text-[10px] font-bold text-red-500 line-through">€{config.basePrice}</div>
                                <div className={`text-2xl font-black ${type === 'gold' || type === 'premiumUserPlus' ? 'text-amber-500' : 'text-white'}`}>
                                    €{config.promoPrice}
                                </div>
                            </>
                        ) : (
                            <div className={`text-2xl font-black ${type === 'gold' || type === 'premiumUserPlus' ? 'text-amber-500' : 'text-white'}`}>
                                €{config.basePrice}
                            </div>
                        )}
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">/ mese</span>
                    </div>
                </div>

                {/* TITLE & DESC */}
                <h3 className="text-xl font-bold text-white mb-2 font-display">{theme.title}</h3>
                <p className="text-slate-400 text-xs italic mb-6 leading-relaxed min-h-[40px]">
                    {theme.desc}
                </p>

                {/* FEATURES LIST (EDITABLE) */}
                <div className="space-y-3 mb-6 flex-1">
                    {theme.defaultFeatures.map((feat: any, idx: number) => {
                        const displayText = config.customFeatureLabels?.[idx] || feat.text;
                        
                        return (
                            <div key={idx} className="flex items-center gap-3">
                                <feat.icon className={`w-4 h-4 shrink-0 ${type === 'gold' || type === 'premiumUserPlus' ? 'text-amber-500' : 'text-slate-500'}`} />
                                {isEditable ? (
                                    <input 
                                        type="text" 
                                        value={displayText}
                                        onChange={(e) => handleFeatureTextChange(idx, e.target.value)}
                                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full focus:border-indigo-500 outline-none"
                                    />
                                ) : (
                                    <span className="text-sm text-slate-300">{displayText}</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* SELECTED INDICATOR (User Mode) - STILE PREMIUM VERDE */}
                {selected && !isEditable && (
                    <div className="mt-auto w-full py-3 rounded-xl font-black text-center text-xs uppercase flex items-center justify-center gap-2 bg-emerald-600 text-white shadow-lg shadow-emerald-900/30 tracking-widest border border-emerald-500 transform scale-105">
                        <Check className="w-5 h-5" strokeWidth={3}/> SELEZIONATO
                    </div>
                )}

                {/* EDIT CONTROLS (Admin Mode) */}
                {isEditable && onUpdateConfig && (
                    <div className="mt-auto pt-4 border-t border-slate-800 space-y-4">
                        
                        {/* Technical Limits */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Prezzo (€)</label>
                                <input 
                                    type="number" 
                                    value={config.basePrice}
                                    onChange={(e) => onUpdateConfig({...config, basePrice: Number(e.target.value)})}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono"
                                />
                            </div>
                             <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Limite (Foto/Prod)</label>
                                <input 
                                    type="number" 
                                    value={type === 'shop' ? config.features?.products : config.features?.photos}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        const newFeat = { ...config.features };
                                        if (type === 'shop') newFeat.products = val; else newFeat.photos = val;
                                        onUpdateConfig({...config, features: newFeat as any});
                                    }}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono"
                                />
                            </div>
                        </div>

                        {/* Individual Promo Controls */}
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                             <div className="flex justify-between items-center mb-2">
                                <label className="text-[9px] text-indigo-400 font-bold uppercase flex items-center gap-1">
                                    <Zap className="w-3 h-3"/> Promo Attiva
                                </label>
                                <input 
                                    type="checkbox" 
                                    checked={config.promoActive} 
                                    onChange={(e) => onUpdateConfig({...config, promoActive: e.target.checked})} 
                                    className="accent-indigo-500"
                                />
                            </div>
                            
                            {config.promoActive && (
                                <div className="space-y-2 animate-in fade-in">
                                    <select 
                                        value={config.promoLabel || ''} 
                                        onChange={(e) => onUpdateConfig({...config, promoLabel: e.target.value})}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none"
                                    >
                                        <option value="">Seleziona Periodo...</option>
                                        {promoTypes.map(p => (
                                            <option key={p.id} value={p.label}>{p.label}</option>
                                        ))}
                                    </select>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-slate-500 uppercase font-bold">Scontato:</span>
                                        <input 
                                            type="number" 
                                            value={config.promoPrice || ''}
                                            onChange={(e) => onUpdateConfig({...config, promoPrice: Number(e.target.value)})}
                                            className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-emerald-400 text-xs font-mono font-bold"
                                            placeholder="€"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
