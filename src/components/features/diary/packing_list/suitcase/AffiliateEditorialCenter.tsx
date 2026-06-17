import React, { useState } from 'react';
import { ShoppingBag, Layout, Globe, Sliders, Package, Sparkles, ListTree } from 'lucide-react';
import { OverrideTab, GlobalSuggestionsTab, TemplateLibraryTab, StandardItemsTab, TemplateSpecificItemsTab, AiCatalogTab } from './EditorialCenterTabs';
import { AdminPageHeader } from '@/components/admin/common/AdminPageHeader';

interface AffiliateEditorialCenterProps { }

type TabType = 'overrides' | 'global' | 'library' | 'standard' | 'template_items' | 'ai_catalog';

const TABS = [
    { id: 'overrides' as TabType, label: 'Override Prodotti', icon: Sliders },
    { id: 'global' as TabType, label: 'Suggerimenti Globali', icon: Globe },
    { id: 'library' as TabType, label: 'Template Library', icon: Layout },
    { id: 'standard' as TabType, label: 'Standard Items', icon: Package },
    { id: 'template_items' as TabType, label: 'Template Specifici', icon: ListTree },
    { id: 'ai_catalog' as TabType, label: 'Catalogo AI', icon: Sparkles },
];

export const AffiliateEditorialCenter: React.FC<AffiliateEditorialCenterProps> = () => {
    const [activeTab, setActiveTab] = useState<TabType>('overrides');
    const [selectedMasterId, setSelectedMasterId] = useState<string | null>(null);

    return (
        <div className="space-y-8 animate-in fade-in duration-300 pb-20 relative flex flex-col h-full">
            <AdminPageHeader
                as="h1"
                icon={ShoppingBag}
                title="Editorial Center"
                subtitle="Multi-Partner & Template Control"
                accent="purple"
            />

            <nav className="flex items-center bg-slate-900/50 p-1 rounded-2xl border border-slate-800 shadow-inner w-fit max-w-full overflow-x-auto shrink-0">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                                setActiveTab(tab.id);
                                setSelectedMasterId(null);
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${isActive
                                ? 'bg-slate-800 text-indigo-400 shadow-lg border border-slate-700'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                                }`}
                        >
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                            {tab.label}
                        </button>
                    );
                })}
            </nav>

            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'overrides' && (
                    <OverrideTab
                        selectedMasterId={selectedMasterId}
                        onSelectMaster={setSelectedMasterId}
                    />
                )}
                {activeTab === 'global' && (
                    <GlobalSuggestionsTab />
                )}
                {activeTab === 'library' && (
                    <TemplateLibraryTab
                        selectedMasterId={selectedMasterId}
                        onSelectMaster={setSelectedMasterId}
                    />
                )}
                {activeTab === 'standard' && <StandardItemsTab />}
                {activeTab === 'template_items' && <TemplateSpecificItemsTab />}
                {activeTab === 'ai_catalog' && <AiCatalogTab />}
            </div>

            <footer className="mt-6 py-4 border-t border-slate-900 flex items-center justify-between pointer-events-none text-slate-500 shrink-0">
                <div className="flex items-center gap-4 text-[9px] uppercase tracking-widest font-black">
                    <span className="text-slate-700">Sistema Editoriale:</span>
                    <code className="text-slate-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        {activeTab === 'overrides' ? 'Override Mode (Template specific)' : activeTab === 'global' ? 'Global Mode (Partner-driven)' : activeTab === 'library' ? 'Library Mode (Content Masters)' : activeTab === 'standard' ? 'Standard Items (DB)' : activeTab === 'template_items' ? 'Template Specifics (DB)' : 'AI Catalog (DB)'}
                    </code>
                </div>
                <p className="text-[9px] text-slate-700 uppercase tracking-widest font-black italic">
                    Riservato agli amministratori • TouringDiary Content Hub
                </p>
            </footer>
        </div>
    );
};
