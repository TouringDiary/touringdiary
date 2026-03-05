
import React, { useState, useEffect } from 'react';
import { Zap, Loader2, Save, User, UserCheck, Crown, Store, ShoppingCart, Briefcase, CheckCircle, Info, Brain } from 'lucide-react';
import { getSetting, saveSetting, SETTINGS_KEYS } from '../../../services/settingsService';
import { MarketingConfig } from '../../../types/models/Sponsor';

export const AiLimitsTab = () => {
    // Stato locale per l'intera configurazione marketing (per non perdere i prezzi)
    const [config, setConfig] = useState<MarketingConfig | null>(null);
    const [saving, setSaving] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        // Carica la configurazione completa. 
        // Se aiLimits manca nel DB (vecchia struttura), usiamo i default definiti nel service.
        getSetting<MarketingConfig>(SETTINGS_KEYS.MARKETING_PRICES).then(data => {
            if (data) {
                // Assicuriamoci che l'oggetto aiLimits esista anche se il DB è parziale
                if (!data.aiLimits) {
                    data.aiLimits = {
                        guest: 3,
                        registered: 20,
                        premium: 50,
                        premium_plus: 500, // Default nuovo
                        sponsor: 100,
                        shop: 200,
                        pro: 150
                    };
                }
                setConfig(data);
            }
        });
    }, []);

    const updateLimit = (role: keyof MarketingConfig['aiLimits'], value: number) => {
        if (!config || !config.aiLimits) return;
        
        // Aggiornamento immutabile della struttura nidificata
        const newLimits = { ...config.aiLimits, [role]: value };
        setConfig({ ...config, aiLimits: newLimits });
    };

    const handleSave = async () => {
        if (!config) return;
        setSaving(true);
        try {
            // Salva l'intera configurazione (prezzi + limiti) su Supabase
            await saveSetting(SETTINGS_KEYS.MARKETING_PRICES, config);
            setSaving(false);
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
        } catch (e) {
            console.error("Errore salvataggio limiti:", e);
            alert("Errore durante il salvataggio.");
            setSaving(false);
        }
    };

    if (!config || !config.aiLimits) return (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500"/>
            <p className="font-bold uppercase tracking-widest text-xs">Caricamento Configurazione...</p>
        </div>
    );

    // Definizione visuale dei 7 livelli (incluso Pro Plus)
    const limits = [
        { key: 'guest', label: 'Ospiti (Non Reg.)', icon: User, color: 'text-slate-400', desc: 'Utenti non loggati (Sessione)' },
        { key: 'registered', label: 'Utenti Free', icon: UserCheck, color: 'text-emerald-400', desc: 'Account standard gratuito' },
        { key: 'premium', label: 'Traveler Pro', icon: Crown, color: 'text-purple-400', desc: 'Piano a pagamento base' },
        { key: 'premium_plus', label: 'Traveler Pro+', icon: Brain, color: 'text-amber-500', desc: 'Piano AI Smart Reasoning' },
        { key: 'sponsor', label: 'Sponsor (Activity)', icon: Store, color: 'text-blue-400', desc: 'Ristoranti/Hotel Partner' },
        { key: 'shop', label: 'Negozi / Botteghe', icon: ShoppingCart, color: 'text-indigo-400', desc: 'Venditori Marketplace' },
        { key: 'pro', label: 'Guide & Agency', icon: Briefcase, color: 'text-cyan-400', desc: 'Professionisti del settore' },
    ];

    return (
        <div className="space-y-6 relative h-full flex flex-col overflow-hidden">
            
            {/* SUCCESS TOAST OVERLAY */}
            {showSuccessModal && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl animate-in slide-in-from-top-4 flex items-center gap-2 border border-emerald-400 font-bold text-sm">
                    <CheckCircle className="w-5 h-5"/> Configurazione Salvata!
                </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex-1 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-500"/> Limiti Generazione AI (Mensili)
                        </h3>
                        <p className="text-slate-400 text-xs mt-1">Imposta il numero massimo di richieste AI (Flash + Pro) per ogni ruolo utente.</p>
                    </div>
                    
                    <button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg text-xs font-bold uppercase flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} 
                        {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {limits.map((item) => (
                        <div key={item.key} className="bg-slate-950 p-5 rounded-xl border border-slate-800 hover:border-slate-600 transition-colors group relative">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2.5 bg-slate-900 rounded-lg border border-slate-800 ${item.color} group-hover:bg-slate-800 transition-colors`}>
                                    <item.icon className="w-6 h-6"/>
                                </div>
                                <div>
                                    <span className="text-sm font-bold text-slate-200 block">{item.label}</span>
                                    <span className="text-[10px] text-slate-500 block leading-tight">{item.desc}</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between bg-slate-900 rounded-lg border border-slate-700 p-1">
                                <button 
                                    onClick={() => updateLimit(item.key as any, Math.max(0, (config.aiLimits![item.key as keyof typeof config.aiLimits] || 0) - 5))}
                                    className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                                >
                                    -5
                                </button>
                                <input 
                                    type="number" 
                                    value={config.aiLimits![item.key as keyof typeof config.aiLimits] || 0}
                                    onChange={(e) => updateLimit(item.key as any, parseInt(e.target.value))}
                                    className="w-20 bg-transparent text-white font-mono font-bold text-center focus:outline-none text-lg appearance-none"
                                />
                                <button 
                                    onClick={() => updateLimit(item.key as any, (config.aiLimits![item.key as keyof typeof config.aiLimits] || 0) + 5)}
                                    className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                                >
                                    +5
                                </button>
                            </div>
                            <div className="text-center mt-1">
                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">CREDITI / MESE</span>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="mt-8 p-4 bg-indigo-900/10 border border-indigo-500/20 rounded-xl flex gap-3 items-start">
                    <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5"/>
                    <div className="text-xs text-indigo-200 space-y-1">
                        <p><strong>Nota Tecnica:</strong> Il conteggio totale include sia le richieste <em>Gemini Flash</em> (1 credito) che <em>Gemini Pro</em> (5 crediti).</p>
                        <p>I limiti sono applicati immediatamente. Gli utenti admin (`admin_all`, `admin_limited`) hanno sempre accesso illimitato (9999).</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
