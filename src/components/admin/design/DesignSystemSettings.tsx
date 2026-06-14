
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useConfig } from '@/context/ConfigContext';
import type { StyleRule } from '../../../types/designSystem';
import { Smartphone, Monitor, Save, Loader2, Wand2, ArrowLeft, ChevronRight, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { updateDesignSystemRule, rebuildDesignSystemCache } from '../../../services/settingsService';
import { Z_ADMIN_MODAL } from '@/constants/zIndex';
import StyleEditor from './StyleEditor';
import ComponentPreviewHost from './ComponentPreviewHost';

// ── Module-level helper — pure, no closure, never re-created on render. ──────
// Semanticamente esplicito: no falsy coercion su stringa vuota.
const getRuleSection = (rule: StyleRule): string => {
    const section = rule.section?.trim() ?? '';
    return section.length > 0 ? section : 'uncategorized';
};

// ── Error boundary temporanea per debug runtime del pannello editor. ──────────
// Cattura crash React silenti nel subtree ComponentPreviewHost/StyleEditor
// e li espone visibilmente + in console con stack trace completo.
class DesignEditorBoundary extends React.Component<
    { children: React.ReactNode; label: string },
    { error: Error | null }
> {
    state = { error: null as Error | null };

    static getDerivedStateFromError(error: Error) {
        return { error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error(`[DesignEditorBoundary "${this.props.label}"] CRASH:`, error.message);
        console.error(`[DesignEditorBoundary "${this.props.label}"] Stack:`, error.stack);
        console.error(`[DesignEditorBoundary "${this.props.label}"] Component tree:`, info.componentStack);
    }

    render() {
        if (this.state.error) {
            return (
                <div className="p-4 m-2 bg-red-950 border border-red-500 rounded-lg text-xs font-mono overflow-auto max-h-48">
                    <p className="text-red-400 font-bold mb-1">⚠ CRASH [{this.props.label}]</p>
                    <p className="text-red-300">{this.state.error.message}</p>
                    <pre className="text-red-500 mt-2 text-[10px] whitespace-pre-wrap leading-tight">
                        {this.state.error.stack?.split('\n').slice(0, 6).join('\n')}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}

const SideEditorPanel: React.FC<{
    rule: StyleRule | null;
    isSaving: boolean;
    onRuleChange: (updatedRule: StyleRule) => void;
    onClose: () => void;
    onSave: (rule: StyleRule) => void;
    componentKey: string;
}> = ({ rule, onRuleChange, onClose, onSave, isSaving, componentKey }) => {
    const [localRule, setLocalRule] = useState(rule);
    const [deviceView, setDeviceView] = useState<'mobile' | 'desktop'>('desktop');

    useEffect(() => {
        console.log('[SideEditorPanel] rule prop →', {
            component_key: rule?.component_key ?? 'NULL',
            section: rule?.section ?? 'NULL',
            element_name: rule?.element_name ?? 'NULL',
            isNull: rule === null,
        });
        setLocalRule(rule);
    }, [rule]);

    const handleSyncAndSave = () => {
        if (localRule) {
            onRuleChange(localRule);
            onSave(localRule);
        }
    };

    if (!localRule) {
        console.warn('[SideEditorPanel] localRule is null — rendering nothing. rule prop:', rule);
        return null;
    }

    console.log('[SideEditorPanel] render | key:', localRule.component_key, '| section:', localRule.section, '| componentKey:', componentKey);

    const isMobile = deviceView === 'mobile';

    // Portal to document.body so the panel is not subject to any ancestor
    // overflow-hidden / overflow-y-auto clipping, and so backdrop-filter on
    // #focus-overlay (z=14000) cannot blur it (the panel sits at Z_ADMIN_MODAL=13000
    // but with the conditional backdrop-blur fix in AppCoordinator, admin mode
    // never activates the blur layer regardless).
    return createPortal(
        <>
            {/* Backdrop — below panel but above admin content */}
            <div
                className="fixed inset-0 bg-black/60"
                style={{ zIndex: Z_ADMIN_MODAL - 100 }}
                onClick={onClose}
            />
            {/* Slide-over panel — admin super-layer */}
            <div
                className="fixed top-0 right-0 h-full w-full max-w-2xl bg-slate-900 border-l border-slate-700 shadow-2xl transform transition-transform ease-in-out duration-300 translate-x-0"
                style={{ zIndex: Z_ADMIN_MODAL }}
            >
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center p-4 border-b border-slate-800">
                        <div className='flex items-center gap-4'>
                            <button onClick={onClose} className="text-slate-300 hover:text-white">
                                <ArrowLeft size={20} />
                            </button>
                            <h2 className="text-lg font-semibold text-white">{localRule.element_name}</h2>
                        </div>
                        <div className="flex items-center gap-2 p-1 bg-slate-800 rounded-lg">
                            <button onClick={() => setDeviceView('mobile')} className={`p-2 rounded-md ${deviceView === 'mobile' ? 'bg-slate-700 shadow-sm text-indigo-400' : 'text-slate-400'}`}><Smartphone size={20} /></button>
                            <button onClick={() => setDeviceView('desktop')} className={`p-2 rounded-md ${deviceView === 'desktop' ? 'bg-slate-700 shadow-sm text-indigo-400' : 'text-slate-400'}`}><Monitor size={20} /></button>
                        </div>
                    </div>

                    <div className="p-8 bg-slate-900 flex-grow flex items-center justify-center border-b border-slate-800">
                       <div className="border border-slate-700 rounded-lg bg-slate-800">
                         <DesignEditorBoundary label={`Preview:${componentKey}`}>
                             <ComponentPreviewHost rule={localRule} componentKey={componentKey} isLarge={true} isMobile={isMobile} />
                         </DesignEditorBoundary>
                       </div>
                    </div>
                    
                    <div className="flex-shrink-0 p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
                        <h3 className="text-xl font-bold mb-4 text-white">Editor Proprietà CSS</h3>
                        <DesignEditorBoundary label={`StyleEditor:${componentKey}`}>
                            <StyleEditor rule={localRule} onChange={setLocalRule} />
                        </DesignEditorBoundary>
                    </div>

                    <div className="mt-auto p-4 bg-slate-900/80 border-t border-slate-800 backdrop-blur-sm flex justify-end items-center gap-4">
                        <button onClick={onClose} className="text-slate-300 hover:text-white px-4 py-2 rounded-lg flex items-center gap-2"><X size={18}/> Annulla</button>
                        <button
                            onClick={handleSyncAndSave}
                            disabled={isSaving}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-lg shadow-md flex items-center justify-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            {isSaving ? 'Salvataggio...' : 'Salva e Chiudi'}
                        </button>
                    </div>
                </div>
            </div>
        </>,
        document.body,
    );
};

const DesignSystemSettings: React.FC = () => {
    const { configs, isLoading: isConfigLoading, refreshConfig } = useConfig();
    
    const [originalRules, setOriginalRules] = useState<Record<string, StyleRule> | null>(null);
    const [editedRules, setEditedRules] = useState<Record<string, StyleRule> | null>(null);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('');
    
    const [isSaving, setIsSaving] = useState(false);
    const [isRebuilding, setIsRebuilding] = useState(false);
    const [rebuildError, setRebuildError] = useState<string | null>(null);

    useEffect(() => {
        if (configs?.design_system_rules) {
            // Cast architetturalmente corretto: ConfigContext popola design_system_rules
            // come Record<string, StyleRule> via getDesignSystemRules() → StyleRule[].
            const source = configs.design_system_rules as Record<string, StyleRule>;

            const rulesMap = Object.entries(source).reduce<Record<string, StyleRule>>((acc, [key, value]) => {
                acc[key] = { ...value, component_key: key, section: value.section ?? 'uncategorized' };
                return acc;
            }, {});
    
            setOriginalRules(JSON.parse(JSON.stringify(rulesMap)));
            setEditedRules(JSON.parse(JSON.stringify(rulesMap)));
        }
    }, [configs]);

    // ── Deriva TABS e conteggi di sezione da editedRules.
    // NON dipende da activeTab: è pura derivazione dei dati.
    const { TABS, sectionCounts } = useMemo(() => {
        if (!editedRules) return { TABS: [] as string[], sectionCounts: {} as Record<string, number> };

        const allRules = Object.values(editedRules);
        const baseRules = allRules.filter(r => !r.component_key.endsWith('_mobile'));

        const sortedSections = [...new Set(allRules.map(getRuleSection))].sort((a, b) => {
            if (a === 'uncategorized') return 1;
            if (b === 'uncategorized') return -1;
            return a.localeCompare(b);
        });

        const counts = baseRules.reduce<Record<string, number>>((acc, rule) => {
            const s = getRuleSection(rule);
            acc[s] = (acc[s] || 0) + 1;
            return acc;
        }, {});

        return { TABS: sortedSections, sectionCounts: counts };
    }, [editedRules]);

    // ── Tab effettivamente attiva: preferenza utente se valida, altrimenti prima tab.
    // Derivazione pura — disponibile immediatamente nel render corrente,
    // prima che l'effect di sync abbia avuto modo di girare.
    const currentTab = TABS.length > 0
        ? (TABS.includes(activeTab) ? activeTab : TABS[0])
        : '';

    // ── Sincronizza activeTab state quando il valore corrente non è più valido.
    // Scatta solo se TABS o activeTab cambiano; se activeTab è già in TABS è no-op.
    // Nessun render loop: setActiveTab(TABS[0]) → activeTab === TABS[0] → TABS.includes = true → no-op.
    useEffect(() => {
        if (TABS.length > 0 && !TABS.includes(activeTab)) {
            setActiveTab(TABS[0]);
        }
    }, [TABS, activeTab]);

    // ── Righe visibili per la tab corrente.
    const groupedRules = useMemo(() => {
        if (!editedRules || !currentTab) return [];

        const allRules = Object.values(editedRules);
        const baseRules = allRules.filter(r => !r.component_key.endsWith('_mobile'));
        const mobileMap = new Map(
            allRules
                .filter(r => r.component_key.endsWith('_mobile'))
                .map(r => [r.component_key.replace('_mobile', ''), r])
        );

        return baseRules
            .filter(r => getRuleSection(r) === currentTab)
            .map(r => ({ key: r.component_key, desktop: r, mobile: mobileMap.get(r.component_key) }));
    }, [editedRules, currentTab]);


    const currentRule = useMemo(() => {
        return editedRules && selectedKey ? editedRules[selectedKey] : null;
    }, [editedRules, selectedKey]);
    
    const handleRuleChange = useCallback((updatedRule: StyleRule) => {
        if (!selectedKey) return;
        setEditedRules(prev => prev ? { ...prev, [selectedKey]: updatedRule } : null);
    }, [selectedKey]);
    
    const handleRebuildCache = useCallback(async () => {
        setIsRebuilding(true);
        setRebuildError(null);
        try {
            await rebuildDesignSystemCache();
            await refreshConfig(); 
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto.';
            setRebuildError(errorMessage);
        } finally {
            setIsRebuilding(false);
        }
    }, [refreshConfig]);

    const handleSaveChanges = async (ruleToSave: StyleRule) => {
        if (!originalRules || !selectedKey) return;

        const ruleToUpdate = ruleToSave;
        if (JSON.stringify(ruleToUpdate) === JSON.stringify(originalRules[selectedKey])) {
            setSelectedKey(null);
            return;
        }

        setIsSaving(true);

        try {
            await updateDesignSystemRule(ruleToUpdate);
            await rebuildDesignSystemCache();
            await refreshConfig();
            setSelectedKey(null);
        } catch (err) {
            console.error("Failed to save design settings:", err);
            // In a real app, show a toast or notification to the user
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isConfigLoading) {
        return <div className="p-8 flex items-center justify-center gap-3"><Loader2 className="animate-spin text-slate-500" /> <span className='text-slate-400'>Caricamento Design System...</span></div>;
    }

    if (!groupedRules.length) {
        return (
             <div style={{ paddingBottom: '80px' }}>
                <div className="p-8 text-center bg-slate-800 rounded-lg border border-yellow-500/50">
                    <div className='flex items-center justify-center gap-3 text-yellow-400'>
                        <AlertTriangle/>
                        <h3 className='text-xl font-bold'>Design System non inizializzato</h3>
                    </div>
                    <p className='mt-2 text-slate-300'>La cache del design system è vuota o non è stata generata.</p>
                    <p className='mt-1 text-sm text-slate-400'>Premi il pulsante qui sotto per processare le regole di stile e costruire la cache.</p>
                    {rebuildError && <div className="mt-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-sm text-red-300"><strong>Errore:</strong> {rebuildError}</div>}
                    <div className="mt-6">
                        <button onClick={handleRebuildCache} disabled={isRebuilding} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 mx-auto">
                            {isRebuilding ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                            {isRebuilding ? 'Rigenerazione in corso...' : 'Rigenera Cache'}
                        </button>
                    </div>
                </div>
             </div>
        );
    }

    return (
        <div style={{ paddingBottom: '80px' }}>
             <div className="mb-6 border-b border-slate-800">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`whitespace-nowrap capitalize py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                currentTab === tab
                                    ? 'border-indigo-500 text-white'
                                    : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
                            }`}
                        >
                            {tab}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                currentTab === tab ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'
                            }`}>
                                {sectionCounts[tab] || 0}
                            </span>
                        </button>
                    ))}
                </nav>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-lg">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-800">
                        <thead className="bg-slate-900">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Elemento UI</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Key Sistema</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Anteprima</th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Edit</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {groupedRules.map(({ key, desktop, mobile }) => (
                                <tr key={key} className="hover:bg-slate-800/50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-white">{desktop.element_name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <code className="text-sm text-slate-300 bg-slate-800 px-2 py-1 rounded">{key}</code>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap bg-slate-900">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-slate-800 rounded-lg border border-slate-700">
                                                <div className="flex items-center gap-2 mb-2 text-xs text-slate-400 px-3 pt-2"><Monitor size={14} /> Desktop</div>
                                                <ComponentPreviewHost rule={desktop} componentKey={key} isLarge={false} isMobile={false} />
                                            </div>
                                            {mobile && (
                                                <div className="bg-slate-800 rounded-lg border border-slate-700">
                                                    <div className="flex items-center gap-2 mb-2 text-xs text-slate-400 px-3 pt-2"><Smartphone size={14} /> Mobile</div>
                                                    <ComponentPreviewHost rule={mobile} componentKey={mobile.component_key} isLarge={false} isMobile={true} />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => {
                                            console.log('[DesignSystem] Modifica →', key, '| rule in editedRules:', editedRules?.[key]);
                                            setSelectedKey(key);
                                        }} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2">
                                            <Wand2 size={16} /> Modifica
                                            <ChevronRight size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="sticky bottom-0 mt-6 py-3 px-4 bg-slate-900/80 border-t border-slate-800 backdrop-blur-sm flex justify-between items-center rounded-b-lg">
                <div className="flex items-center gap-4">
                     <button
                        onClick={handleRebuildCache}
                        disabled={isRebuilding}
                        className="text-slate-400 hover:text-white text-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                         {isRebuilding ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                         {isRebuilding ? 'Rigenerando...' : 'Rigenera Cache'}
                     </button>
                     {rebuildError && <div className="text-sm text-red-500" role="alert">{rebuildError}</div>}
                </div>
            </div>
            
            {selectedKey && (
                <SideEditorPanel
                    rule={currentRule}
                    isSaving={isSaving}
                    onRuleChange={handleRuleChange}
                    onClose={() => setSelectedKey(null)}
                    onSave={handleSaveChanges}
                    componentKey={selectedKey}
                />
            )}
        </div>
    );
};

export default DesignSystemSettings;
