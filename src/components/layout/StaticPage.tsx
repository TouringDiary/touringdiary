
import React, { useState, useEffect } from 'react';
import { 
    Globe, Send, ShieldCheck, Award, Loader2, Database, Mail, MapPin, Phone, Scale, FileText, Lock, User, Briefcase, Check, X as XIcon, Zap, Crown, Brain, Star
} from 'lucide-react';
import { getStaticPageContent } from '../../services/contentService';
import { getSetting, SETTINGS_KEYS } from '../../services/settingsService';
import { MarketingConfig } from '../../types/models/Sponsor';
import { SponsorPlanCard } from '../marketing/SponsorPlanCard';
import { CloseButton } from '../common/CloseButton';

interface StaticPageProps {
    type: 'about' | 'contacts' | 'terms' | 'privacy';
    onBack: () => void;
    onOpenSponsor: (tier: 'silver' | 'gold') => void;
}

// CARD PIANO FREE (STATICA PER CONFRONTO)
const FreePlanCard = () => (
    <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 flex flex-col h-full opacity-80 hover:opacity-100 transition-opacity">
        <div className="p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div className="px-3 py-1 rounded-lg font-bold text-xs uppercase inline-block bg-slate-800 text-slate-400">
                    Base
                </div>
                <div className="text-right">
                    <div className="text-2xl font-black text-white">Gratis</div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Per Sempre</span>
                </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-2 font-display">Viaggiatore</h3>
            <p className="text-slate-400 text-xs italic mb-6 leading-relaxed min-h-[40px]">
                Per chi vuole esplorare e creare itinerari semplici.
            </p>

            <div className="space-y-3 mb-6 flex-1">
                <div className="flex items-center gap-3">
                    <User className="w-4 h-4 shrink-0 text-slate-500" />
                    <span className="text-sm text-slate-300">Profilo Turista</span>
                </div>
                <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 shrink-0 text-amber-500" />
                    <span className="text-sm text-slate-300">30 Crediti AI / mese</span>
                </div>
                <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 shrink-0 text-slate-500" />
                    <span className="text-sm text-slate-300">Diario di Viaggio Base</span>
                </div>
            </div>

            <div className="mt-auto w-full py-2 rounded-lg font-bold text-center text-xs uppercase flex items-center justify-center gap-2 bg-slate-800 text-slate-400">
                Attivo
            </div>
        </div>
    </div>
);

export const StaticPage = ({ type, onBack, onOpenSponsor }: StaticPageProps) => {
    const [pageData, setPageData] = useState<{title: string, content: string} | null>(null);
    const [loading, setLoading] = useState(true);
    const [prices, setPrices] = useState<MarketingConfig | null>(null);

    // Configurazione Icone/Colori UI - PALETTE LUSSO
    const config = {
        about: { 
            icon: Globe, 
            color: 'text-indigo-500', 
            bg: 'bg-indigo-500/20',
            border: 'border-indigo-500/30',
            defaultTitle: 'CHI SIAMO'
        },
        contacts: { 
            icon: Send, 
            color: 'text-emerald-500', 
            bg: 'bg-emerald-500/20',
            border: 'border-emerald-500/30',
            defaultTitle: 'CONTATTI'
        },
        privacy: { 
            icon: Lock, 
            color: 'text-blue-500', 
            bg: 'bg-blue-500/20',
            border: 'border-blue-500/30',
            defaultTitle: 'PRIVACY POLICY'
        },
        terms: { 
            icon: Scale, 
            color: 'text-amber-500', 
            bg: 'bg-amber-500/20',
            border: 'border-amber-500/30',
            defaultTitle: 'TERMINI E LISTINO'
        }
    }[type];

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await getStaticPageContent(type);
            setPageData(data);
            
            if (type === 'terms') {
                const configData = await getSetting<MarketingConfig>(SETTINGS_KEYS.MARKETING_PRICES);
                if(configData) setPrices(configData);
            }
            
            setLoading(false);
        };
        load();
    }, [type]);

    // Gestione ESC per chiusura
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onBack();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onBack]);

    const ThemeIcon = config.icon;

    return (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
            
            {/* --- CSS INIETTATO PER STYLING DEL CONTENUTO HTML (DATABASE) --- */}
            <style>{`
                .premium-content {
                    font-family: 'Lato', sans-serif;
                    color: #94a3b8; /* Slate-400 */
                    font-size: 0.95rem;
                    line-height: 1.7;
                }
                .premium-content h1, .premium-content h2, .premium-content h3 {
                    font-family: 'Playfair Display', serif;
                    color: white;
                    margin-top: 2rem;
                    margin-bottom: 1rem;
                }
                .premium-content h1 { font-size: 2rem; border-bottom: 1px solid #334155; padding-bottom: 0.5rem; }
                .premium-content h2 { font-size: 1.5rem; color: #f59e0b; }
                .premium-content h3 { font-size: 1.25rem; color: #cbd5e1; font-weight: bold; }
                .premium-content p { margin-bottom: 1rem; text-align: justify; }
                .premium-content ul { margin-bottom: 1.5rem; padding-left: 1.5rem; list-style-type: disc; color: #cbd5e1; }
                .premium-content li { margin-bottom: 0.5rem; }
                .premium-content strong { color: #e2e8f0; font-weight: 700; }
                .premium-content a { color: #818cf8; text-decoration: underline; text-underline-offset: 4px; }
                .premium-content a:hover { color: #a5b4fc; }
                .premium-content .highlight-box {
                    background: rgba(30, 41, 59, 0.5);
                    border-left: 4px solid #f59e0b;
                    padding: 1rem;
                    margin: 1.5rem 0;
                    border-radius: 0 0.5rem 0.5rem 0;
                    font-style: italic;
                }
            `}</style>

            <div className="relative bg-[#020617] w-full max-w-6xl h-full md:h-[95vh] md:rounded-3xl border-0 md:border border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
                
                {/* HEADER STANDARD */}
                <div className="flex justify-between items-center px-6 py-5 border-b border-slate-800 bg-[#0f172a] shrink-0 z-20">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl shadow-lg border ${config.bg} ${config.border}`}>
                            <ThemeIcon className={`w-6 h-6 ${config.color}`}/>
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-wide leading-none">
                                {pageData?.title || config.defaultTitle}
                            </h2>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Touring Diary Info</p>
                        </div>
                    </div>
                    {/* STANDARD RED CLOSE BUTTON */}
                    <CloseButton onClose={onBack} size="lg" />
                </div>

                {/* CONTENUTO SCROLLABILE CENTRALE */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 bg-[#020617] relative">
                    
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                            <Loader2 className={`w-12 h-12 animate-spin ${config.color}`}/>
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Caricamento documenti...</span>
                        </div>
                    ) : pageData ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
                            
                            {/* INIEZIONE CONTENUTO HTML */}
                            <div 
                                className="premium-content mb-16"
                                dangerouslySetInnerHTML={{ __html: pageData.content }}
                            />

                            {/* SEZIONE PREZZI (Solo per Termini) - AGGIORNATA CON 3 COLONNE B2C */}
                            {type === 'terms' && prices && (
                                <div className="mt-10 pt-10 border-t border-slate-800 relative">
                                    
                                    {/* SEZIONE VIAGGIATORI (B2C) */}
                                    <div className="mb-16">
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="p-2 bg-indigo-900/20 rounded-lg text-indigo-400"><User className="w-6 h-6"/></div>
                                            <h3 className="text-2xl font-display font-bold text-white">Piani per Viaggiatori</h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {/* FREE */}
                                            <FreePlanCard />
                                            
                                            {/* TRAVELER PRO (Standard) */}
                                            <SponsorPlanCard type="premiumUser" config={prices.premiumUser || { basePrice: 4.99, promoActive: false }} />
                                            
                                            {/* TRAVELER PRO PLUS (Smart) */}
                                            <SponsorPlanCard type="premiumUserPlus" config={prices.premiumUserPlus || { basePrice: 9.99, promoActive: false }} />
                                        </div>
                                        
                                        {/* Box Informativo Crediti */}
                                        <div className="mt-6 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 border border-indigo-500/20 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start">
                                            <div className="flex-1">
                                                <h4 className="text-indigo-300 font-bold uppercase text-xs tracking-widest flex items-center gap-2 mb-2"><Zap className="w-4 h-4"/> Potenza AI</h4>
                                                <ul className="text-xs text-slate-400 space-y-2">
                                                    <li className="flex items-start gap-2">
                                                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0"></span>
                                                        <span><strong>Standard (Flash):</strong> Veloce e ideale per info rapide. (Costo: 1 credito)</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 shrink-0"></span>
                                                        <span><strong>Smart (Pro):</strong> Ragionamento complesso, itinerari su misura e analisi profonda. (Costo: 5 crediti)</span>
                                                    </li>
                                                </ul>
                                            </div>
                                            <div className="flex-1 border-l border-indigo-500/20 pl-6">
                                                <h4 className="text-purple-300 font-bold uppercase text-xs tracking-widest flex items-center gap-2 mb-2"><Brain className="w-4 h-4"/> Deep Reasoning</h4>
                                                <p className="text-xs text-slate-400 leading-relaxed">
                                                    Il livello "Traveler Pro Plus" sblocca il modello AI capace di "pensare" prima di rispondere, risolvendo conflitti logistici complessi e trovando gemme nascoste che l'AI standard ignora.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SEZIONE BUSINESS (B2B) */}
                                    <div>
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="p-2 bg-emerald-900/20 rounded-lg text-emerald-400"><Briefcase className="w-6 h-6"/></div>
                                            <h3 className="text-2xl font-display font-bold text-white">Soluzioni Business</h3>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                            <SponsorPlanCard type="silver" config={prices.silver} />
                                            <SponsorPlanCard type="gold" config={prices.gold} />
                                            <SponsorPlanCard type="shop" config={prices.shop} />
                                            <SponsorPlanCard type="tourOperator" config={prices.tourOperator || { basePrice: 150, promoActive: false }} />
                                            <SponsorPlanCard type="guide" config={prices.guide} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SEZIONE CONTATTI EXTRA (Solo per pagina contatti) */}
                            {type === 'contacts' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16 pt-10 border-t border-slate-800">
                                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 text-center hover:border-emerald-500/30 transition-colors">
                                        <div className="w-12 h-12 bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Mail className="w-6 h-6 text-emerald-500"/>
                                        </div>
                                        <h4 className="text-white font-bold mb-1 text-sm">Supporto</h4>
                                        <a href="mailto:support@touringdiary-it.com" className="text-xs text-slate-400 hover:text-white transition-colors">support@touringdiary-it.com</a>
                                    </div>
                                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 text-center hover:border-indigo-500/30 transition-colors">
                                        <div className="w-12 h-12 bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <MapPin className="w-6 h-6 text-indigo-500"/>
                                        </div>
                                        <h4 className="text-white font-bold mb-1 text-sm">Headquarters</h4>
                                        <p className="text-xs text-slate-400">Napoli, Campania</p>
                                    </div>
                                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 text-center hover:border-amber-500/30 transition-colors">
                                        <div className="w-12 h-12 bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Phone className="w-6 h-6 text-amber-500"/>
                                        </div>
                                        <h4 className="text-white font-bold mb-1 text-sm">Partner</h4>
                                        <p className="text-xs text-slate-400">Area Business dedicata</p>
                                    </div>
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 text-center opacity-50">
                            <Database className="w-16 h-16 text-slate-700 mb-4"/>
                            <h3 className="text-xl font-bold text-slate-400">Contenuto non disponibile</h3>
                            <p className="text-slate-500 mt-1">Impossibile recuperare il testo dal database.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
