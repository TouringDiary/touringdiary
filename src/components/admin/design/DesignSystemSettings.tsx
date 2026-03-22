
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useConfig } from '@/context/ConfigContext';
import type { StyleRule } from '../../../types/designSystem';
import { Smartphone, Monitor, Save, Loader2, Wand2, ArrowLeft, ChevronRight, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { updateDesignSystemRule, rebuildDesignSystemCache } from '../../../services/settingsService';

import StyleEditor from './StyleEditor';
import ComponentPreviewHost from './ComponentPreviewHost';

const SideEditorPanel: React.FC<{
    rule: StyleRule | null;
    isSaving: boolean;
    onRuleChange: (updatedRule: StyleRule) => void;
    onClose: () => void;
    onSave: () => void;
    componentKey: string;
}> = ({ rule, onRuleChange, onClose, onSave, isSaving, componentKey }) => {
    const [localRule, setLocalRule] = useState(rule);
    const [deviceView, setDeviceView] = useState<'mobile' | 'desktop'>('desktop');

    useEffect(() => {
        setLocalRule(rule);
    }, [rule]);

    const handleSyncAndSave = () => {
        if (localRule) {
            onRuleChange(localRule);
        }
        onSave();
    };

    if (!localRule) return null;

    const isMobile = deviceView === 'mobile';

    return (
        <>
            <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-slate-900 border-l border-slate-700 shadow-2xl z-50 transform transition-transform ease-in-out duration-300 translate-x-0">
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
                         <ComponentPreviewHost rule={localRule} componentKey={componentKey} isLarge={true} isMobile={isMobile} />
                       </div>
                    </div>
                    
                    <div className="flex-shrink-0 p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
                        <h3 className="text-xl font-bold mb-4 text-white">Editor Proprietà CSS</h3>
                        <StyleEditor rule={localRule} onChange={setLocalRule} />
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
            <div className="fixed inset-0 bg-black bg-opacity-60 z-40" onClick={onClose}></div>
        </>
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
            const source = configs?.design_system_rules || {};

            const rulesMap = Object.entries(source).reduce((acc, [key, value]) => {
                acc[key] = { ...value, component_key: key, section: value.section || 'uncategorized' };
                return acc;
            }, {} as Record<string, StyleRule>);
    
            setOriginalRules(JSON.parse(JSON.stringify(rulesMap)));
            setEditedRules(JSON.parse(JSON.stringify(rulesMap)));
        }
    }, [configs]);

    const { TABS, groupedRules, sectionCounts } = useMemo(() => {
        if (!editedRules) return { TABS: [], groupedRules: [], sectionCounts: {} };

        const allRules = Object.values(editedRules);
        const baseRules = allRules.filter(rule => !rule.component_key.endsWith('_mobile'));
        const mobileRules = new Map(allRules.filter(rule => rule.component_key.endsWith('_mobile')).map(rule => [rule.component_key.replace('_mobile', ''), rule]));

        const getSection = (rule: StyleRule) => (rule.section && rule.section.trim()) ? rule.section.trim() : 'uncategorized';

        const sections = [...new Set(allRules.map(getSection))];
        const sortedSections = sections.sort((a, b) => {
            if (a === 'uncategorized') return 1;
            if (b === 'uncategorized') return -1;
            return a.localeCompare(b);
        });

        const counts = baseRules.reduce((acc, rule) => {
            const section = getSection(rule);
            acc[section] = (acc[section] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const currentActiveTab = activeTab || sortedSections[0] || 'uncategorized';
        if (activeTab !== currentActiveTab) {
             setTimeout(() => setActiveTab(currentActiveTab), 0);
        }

        const rules = baseRules.filter(rule => getSection(rule) === currentActiveTab).map(rule => ({
            key: rule.component_key,
            desktop: rule,
            mobile: mobileRules.get(rule.component_key)
        }));

        return { TABS: sortedSections, groupedRules: rules, sectionCounts: counts };
    }, [editedRules, activeTab]);


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

    const handleSaveChanges = async () => {
        if (!editedRules || !originalRules || !selectedKey) return;

        const ruleToUpdate = editedRules[selectedKey];
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
                                (activeTab || TABS[0]) === tab
                                    ? 'border-indigo-500 text-white'
                                    : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
                            }`}
                        >
                            {tab}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                (activeTab || TABS[0]) === tab ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'
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
                                        <button onClick={() => setSelectedKey(key)} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2">
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
