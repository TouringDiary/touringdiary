
import React, { useState, useMemo, useEffect } from 'react';
import { Palette, Loader2, Save, Edit2, X, Monitor, Smartphone, CheckCircle, AlertTriangle, Shield, Layout, MapPin, BookOpen, Filter, Settings, Database, RotateCcw, Copy, Type } from 'lucide-react';
import { useDesignSystem } from '../../hooks/useDesignSystem';
import { DesignRule, FONTS } from '../../types/designSystem';
import { StyleEditorForm } from './design/StyleEditorForm';
import { User as UserType } from '../../types/users'; 
import { useAdminStyles } from '../../hooks/useAdminStyles'; 
import { MobileStylesSeeder } from './design/MobileStylesSeeder';

interface Props {
    currentUser: UserType;
}

// SQL SCRIPT FOR DB INIT (Per la Tab Impostazioni)
const DB_INIT_SQL = `-- ESEGUI QUESTO SCRIPT IN SUPABASE SQL EDITOR PER POPOLARE I SETTINGS

INSERT INTO public.global_settings (key, value, updated_at) VALUES ('site_design', '{ "heroImage": "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=1920", "defaultPatronImage": "https://upload.wikimedia.org/wikipedia/commons/7/79/Croce_del_campo1.jpg" }'::json, NOW()) ON CONFLICT (key) DO NOTHING;

-- POI CONFIG
INSERT INTO public.global_settings (key, value, updated_at) VALUES ( 'poi_categories_config', '[ {"id": "monument", "label": "Destinazioni", "icon": "landmark", "color": "text-violet-400", "emoji": "🏛️"}, {"id": "food", "label": "Sapori", "icon": "utensils", "color": "text-orange-400", "emoji": "🍕"}, {"id": "hotel", "label": "Alloggi", "icon": "bed", "color": "text-blue-400", "emoji": "🛏️"}, {"id": "nature", "label": "Natura", "icon": "sun", "color": "text-emerald-400", "emoji": "🌳"}, {"id": "leisure", "label": "Svago", "icon": "music", "color": "text-cyan-400", "emoji": "🎉"}, {"id": "shop", "label": "Shopping", "icon": "shoppingbag", "color": "text-pink-400", "emoji": "🛍️"}, {"id": "discovery", "label": "Novità", "icon": "scan", "color": "text-slate-400", "emoji": "✨"} ]'::json, NOW() ) ON CONFLICT (key) DO NOTHING;

-- DESCRIZIONI FASI VIAGGIO (BUSSOLA)
INSERT INTO public.design_system_rules 
(section, element_name, component_key, font_family, text_size, font_weight, text_transform, tracking, color_class, effect_class, preview_text, updated_at)
VALUES 
('journey', 'Descrizione: Scoperta', 'journey_desc_scoperta', 'font-sans', 'text-[10px]', 'font-medium', 'normal-case', 'tracking-wide', 'text-amber-500', 'none', 'Esplora le mete migliori', NOW()),
('journey', 'Descrizione: Selezione', 'journey_desc_selezione', 'font-sans', 'text-[10px]', 'font-medium', 'normal-case', 'tracking-wide', 'text-amber-500', 'none', 'Scegli cosa visitare', NOW()),
('journey', 'Descrizione: Pianifica (Vuoto)', 'journey_desc_pianifica_empty', 'font-sans', 'text-[10px]', 'font-medium', 'normal-case', 'tracking-wide', 'text-amber-500', 'none', 'Il diario è ancora vuoto', NOW()),
('journey', 'Descrizione: Live (No GPS)', 'journey_desc_live_inactive', 'font-sans', 'text-[10px]', 'font-medium', 'normal-case', 'tracking-wide', 'text-amber-500', 'none', 'Attiva GPS per dintorni', NOW()),
('journey', 'Descrizione: Ricorda (Guest)', 'journey_desc_ricorda_guest', 'font-sans', 'text-[10px]', 'font-medium', 'normal-case', 'tracking-wide', 'text-amber-500', 'none', 'Accedi per salvare i ricordi', NOW()),
('journey', 'Descrizione: Ricorda (User)', 'journey_desc_ricorda_user', 'font-sans', 'text-[10px]', 'font-medium', 'normal-case', 'tracking-wide', 'text-amber-500', 'none', 'Bentornato, {name}', NOW()),
('journey', 'Descrizione: Scoperta (Mobile)', 'journey_desc_scoperta_mobile', 'font-sans', 'text-[10px]', 'font-medium', 'normal-case', 'tracking-wide', 'text-amber-500', 'none', 'Esplora le mete migliori', NOW()),
('journey', 'Descrizione: Selezione (Mobile)', 'journey_desc_selezione_mobile', 'font-sans', 'text-[10px]', 'font-medium', 'normal-case', 'tracking-wide', 'text-amber-500', 'none', 'Scegli cosa visitare', NOW()),
('journey', 'Descrizione: Pianifica Vuoto (Mobile)', 'journey_desc_pianifica_empty_mobile', 'font-sans', 'text-[10px]', 'font-medium', 'normal-case', 'tracking-wide', 'text-amber-500', 'none', 'Il diario è ancora vuoto', NOW()),
('journey', 'Descrizione: Live No GPS (Mobile)', 'journey_desc_live_inactive_mobile', 'font-sans', 'text-[10px]', 'font-medium', 'normal-case', 'tracking-wide', 'text-amber-500', 'none', 'Attiva GPS per dintorni', NOW()),
('journey', 'Descrizione: Ricorda Guest (Mobile)', 'journey_desc_ricorda_guest_mobile', 'font-sans', 'text-[10px]', 'font-medium', 'normal-case', 'tracking-wide', 'text-amber-500', 'none', 'Accedi per salvare i ricordi', NOW()),
('journey', 'Descrizione: Ricorda User (Mobile)', 'journey_desc_ricorda_user_mobile', 'font-sans', 'text-[10px]', 'font-medium', 'normal-case', 'tracking-wide', 'text-amber-500', 'none', 'Bentornato, {name}', NOW())
ON CONFLICT (component_key) DO NOTHING;
`;

const SettingsTab = () => {
    const [copied, setCopied] = useState(false);
    
    const handleCopy = () => {
        navigator.clipboard.writeText(DB_INIT_SQL);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in">
             <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-500"/> Ripristino Database
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                    Se vedi tabelle vuote o errori, usa questi strumenti per reinizializzare le regole di stile nel database.
                </p>
                <MobileStylesSeeder onComplete={() => window.location.reload()} />
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Settings className="w-5 h-5 text-indigo-500"/> Configurazione SQL Avanzata
                    </h3>
                    <button onClick={handleCopy} className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors border border-slate-700">
                        {copied ? <CheckCircle className="w-4 h-4 text-emerald-500"/> : <Copy className="w-4 h-4"/>}
                        {copied ? 'Copiato!' : 'Copia SQL'}
                    </button>
                </div>
                <div className="bg-black/50 p-4 rounded-xl border border-slate-700/50 overflow-x-auto">
                    <pre className="text-[10px] font-mono text-emerald-400 whitespace-pre-wrap">{DB_INIT_SQL}</pre>
                </div>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-4">Font Disponibili</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {FONTS.map(font => (
                        <div key={font.value} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                            <span className="text-sm text-slate-300 font-bold">{font.label}</span>
                            <span className={`text-xl ${font.value} text-white`}>Aa Bb Cc</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const AdminDesignSystem = ({ currentUser }: Props) => {
    const { rules, isLoading, updateRule, refreshRules } = useDesignSystem();
    const { styles } = useAdminStyles();
    
    // UI State
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [activeTab, setActiveTab] = useState<string>('admin');
    
    // Editor State
    const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

    // Initial load check
    useEffect(() => {
        if (!isLoading && rules.length === 0) {
            // Se non ci sono regole, forse è il primo avvio. Non facciamo nulla, l'utente userà il seeder.
        }
    }, [isLoading, rules]);

    // Computed Lists
    const filteredRules = useMemo(() => {
        if (activeTab === 'settings') return [];
        
        return rules.filter(r => {
            const isMobileRule = r.component_key?.endsWith('_mobile');
            const modeMatch = viewMode === 'mobile' ? isMobileRule : !isMobileRule;
            const sectionMatch = r.section === activeTab;
            
            return modeMatch && sectionMatch;
        });
    }, [rules, viewMode, activeTab]);

    const activeRule = rules.find(r => r.id === selectedRuleId);

    const handleSave = async (updatedRule: DesignRule) => {
        setIsSaving(true);
        const success = await updateRule(updatedRule);
        if (success) {
            setToast({ msg: 'Stile aggiornato con successo!', type: 'success' });
            // Forza refresh visuale immediato
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('refresh-design-system'));
        } else {
            setToast({ msg: 'Errore durante il salvataggio.', type: 'error' });
        }
        setIsSaving(false);
        setTimeout(() => setToast(null), 3000);
    };

    // Tabs Configuration
    const TABS = [
        { id: 'settings', label: 'Impostazioni', icon: Settings },
        { id: 'admin', label: 'Admin', icon: Shield },
        { id: 'home', label: 'Home', icon: Layout },
        { id: 'journey', label: 'Bussola', icon: RotateCcw },
        { id: 'city', label: 'Città', icon: MapPin },
        { id: 'diary', label: 'Diario', icon: BookOpen },
        { id: 'filters', label: 'Filtri', icon: Filter },
    ];

    if (isLoading) return <div className="flex items-center justify-center h-full text-slate-500"><Loader2 className="w-10 h-10 animate-spin"/></div>;

    return (
        <div className="flex flex-col h-full relative animate-in fade-in">
            
            {/* TOAST */}
            {toast && (
                <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full font-bold text-sm shadow-2xl flex items-center gap-2 border ${toast.type === 'success' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-red-600 border-red-400 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle className="w-4 h-4"/> : <AlertTriangle className="w-4 h-4"/>}
                    {toast.msg}
                </div>
            )}

            {/* HEADER PAGE - Allineato allo standard admin (senza padding extra) */}
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-pink-600 rounded-xl shadow-lg">
                        <Type className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className={styles.admin_page_title}>Design System</h2>
                        <p className={styles.admin_page_subtitle}>Gestione centralizzata stili, font e colori</p>
                    </div>
                </div>
            </div>
            
            {/* TOP BAR: DEVICE TOGGLE */}
            <div className="flex justify-center mb-4 shrink-0 z-10">
                <div className="flex bg-indigo-950/30 p-1 rounded-xl border border-indigo-500/30 relative">
                     {/* Pill Indicator Animation */}
                     <div 
                        className={`absolute top-1 bottom-1 w-[140px] bg-blue-600 rounded-lg shadow-lg transition-all duration-300 ease-in-out ${viewMode === 'mobile' ? 'translate-x-[140px]' : 'translate-x-0'}`}
                     ></div>
                     
                     <button 
                        onClick={() => setViewMode('desktop')} 
                        className={`relative z-10 w-[140px] py-2 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-colors ${viewMode === 'desktop' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Monitor className="w-4 h-4"/> Desktop (12px)
                    </button>
                    <button 
                        onClick={() => setViewMode('mobile')} 
                        className={`relative z-10 w-[140px] py-2 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-colors ${viewMode === 'mobile' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Smartphone className="w-4 h-4"/> Mobile (16px)
                    </button>
                </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="shrink-0">
                <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-slate-800 pb-px">
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setSelectedRuleId(null); }}
                                className={`
                                    flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all border-x border-t
                                    ${isActive 
                                        ? 'bg-slate-900 border-slate-800 text-white border-b-slate-900 mb-[-1px] z-10' 
                                        : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'
                                    }
                                `}
                            >
                                <tab.icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-500' : 'opacity-50'}`}/>
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-hidden bg-slate-900 border-t border-slate-800 flex relative">
                
                {/* VIEW: SETTINGS */}
                {activeTab === 'settings' && (
                    <div className="w-full h-full overflow-y-auto custom-scrollbar">
                        <SettingsTab />
                    </div>
                )}

                {/* VIEW: RULES LIST & EDITOR */}
                {activeTab !== 'settings' && (
                    <div className="flex w-full h-full">
                        
                        {/* LEFT: LISTA REGOLE */}
                        <div className={`w-full ${activeRule ? 'w-1/2 lg:w-[45%]' : 'w-full'} flex flex-col border-r border-slate-800 transition-all duration-300`}>
                            
                            {/* TABLE HEADER */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-950/50 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest sticky top-0 z-10">
                                <div className="col-span-4">Elemento UI</div>
                                <div className="col-span-3">Key Sistema</div>
                                <div className="col-span-4">Anteprima Reale</div>
                                <div className="col-span-1 text-right">Edit</div>
                            </div>

                            {/* TABLE BODY */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {filteredRules.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-slate-500 opacity-60">
                                        <Palette className="w-12 h-12 mb-2"/>
                                        <p className="text-xs uppercase font-bold">Nessuna regola in questa sezione</p>
                                    </div>
                                ) : (
                                    filteredRules.map(rule => (
                                        <div 
                                            key={rule.id}
                                            onClick={() => setSelectedRuleId(rule.id)}
                                            className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-800/50 items-center cursor-pointer transition-colors group ${selectedRuleId === rule.id ? 'bg-indigo-900/10 border-indigo-500/30' : 'hover:bg-slate-800/30'}`}
                                        >
                                            <div className="col-span-4">
                                                <div className="text-sm font-bold text-slate-200">{rule.element_name}</div>
                                                <div className="text-[10px] text-slate-500 mt-0.5">{rule.section.toUpperCase()}</div>
                                            </div>
                                            
                                            <div className="col-span-3">
                                                <code className="text-[10px] bg-slate-950 px-2 py-1 rounded border border-slate-800 text-indigo-300 font-mono">
                                                    {rule.component_key}
                                                </code>
                                            </div>

                                            <div className="col-span-4">
                                                <div className={`truncate max-w-full px-2 py-1 rounded border border-slate-700/50 ${rule.color_class} ${rule.font_family} ${rule.text_size} ${rule.font_weight} ${rule.text_transform} ${rule.tracking} ${rule.effect_class !== 'none' ? rule.effect_class : ''} bg-slate-900/50`}>
                                                    {rule.preview_text}
                                                </div>
                                            </div>

                                            <div className="col-span-1 text-right">
                                                <button className={`p-2 rounded-full transition-colors ${selectedRuleId === rule.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 group-hover:text-white group-hover:bg-slate-700'}`}>
                                                    <Edit2 className="w-3.5 h-3.5"/>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* RIGHT: EDITOR PANEL (SLIDE IN) */}
                        {activeRule && (
                            <div className="flex-1 bg-[#0b0f1a] border-l border-slate-800 flex flex-col h-full animate-in slide-in-from-right-10 duration-300 shadow-2xl relative z-20">
                                
                                <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
                                    <div>
                                        <h3 className="text-xl font-display font-bold text-white mb-1">Modifica Stile</h3>
                                        <p className="text-xs text-slate-400 font-mono">{activeRule.component_key}</p>
                                    </div>
                                    <button onClick={() => setSelectedRuleId(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors">
                                        <X className="w-5 h-5"/>
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                     
                                     {/* ANTEPRIMA LIVE GRANDE */}
                                     <div className="mb-8 p-8 bg-black/40 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center min-h-[150px]">
                                         <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-4">Anteprima Live</span>
                                         <div className={`${activeRule.font_family} ${activeRule.text_size} ${activeRule.font_weight} ${activeRule.text_transform} ${activeRule.tracking} ${activeRule.color_class} ${activeRule.effect_class !== 'none' ? activeRule.effect_class : ''} transition-all duration-300`}>
                                             {activeRule.preview_text}
                                         </div>
                                     </div>

                                     <StyleEditorForm 
                                        rule={activeRule} 
                                        onChange={(field, val) => {
                                            // Aggiornamento ottimistico locale per preview istantanea
                                            const updated = { ...activeRule, [field]: val };
                                        }} 
                                    />
                                    
                                    {/* WRAPPER PER LO STATO LOCALE */}
                                    <LocalEditorWrapper rule={activeRule} onSave={handleSave} isSaving={isSaving} />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Wrapper per gestire lo stato locale dell'editor e la preview istantanea
const LocalEditorWrapper = ({ rule, onSave, isSaving }: { rule: DesignRule, onSave: (r: DesignRule) => void, isSaving: boolean }) => {
    const [localRule, setLocalRule] = useState(rule);

    // Sync quando cambia la selezione dalla lista
    useEffect(() => {
        setLocalRule(rule);
    }, [rule.id]);

    const handleChange = (field: keyof DesignRule, value: any) => {
        setLocalRule(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="-mt-6"> {/* Negative margin to pull into previous container padding */}
             {/* Sovrascriviamo la preview visuale sopra usando localRule */}
             <div className="hidden"> 
             </div>

             {/* RENDERIZZA DI NUOVO LA PREVIEW QUI DENTRO PERCHÉ HA LO STATO AGGIORNATO */}
             <div className="mb-8 p-8 bg-black/40 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center min-h-[150px] relative -top-[250px] z-0 opacity-0 pointer-events-none absolute">
                 {/* Placeholder hidden */}
             </div>
             
             {/* RE-RENDERIZZO FORM CON STATO LOCALE */}
             <div className="relative z-10 bg-[#0b0f1a]"> 
                <div className="mb-8 p-8 bg-black/40 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center min-h-[150px]">
                     <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-4">Anteprima Live (Modifica)</span>
                     <div className={`${localRule.font_family} ${localRule.text_size} ${localRule.font_weight} ${localRule.text_transform} ${localRule.tracking} ${localRule.color_class} ${localRule.effect_class !== 'none' ? localRule.effect_class : ''} transition-all duration-300`}>
                         {localRule.preview_text}
                     </div>
                 </div>

                <StyleEditorForm rule={localRule} onChange={handleChange} />
                
                <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end sticky bottom-0 bg-[#0b0f1a] pb-4">
                    <button 
                        onClick={() => onSave(localRule)} 
                        disabled={isSaving}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold uppercase text-xs shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 w-full md:w-auto justify-center"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5"/>}
                        Salva Modifiche DB
                    </button>
                </div>
            </div>
        </div>
    );
};
