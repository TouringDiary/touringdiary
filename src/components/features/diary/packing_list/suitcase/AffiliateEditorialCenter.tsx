import React, { useState } from 'react';
import { ShoppingBag, Layout, Globe, Sliders } from 'lucide-react';
import { OverrideTab, GlobalSuggestionsTab, TemplateLibraryTab } from './EditorialCenterTabs';


interface AffiliateEditorialCenterProps { }

type TabType = 'overrides' | 'global' | 'library';

export const AffiliateEditorialCenter: React.FC<AffiliateEditorialCenterProps> = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overrides');
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(null);

  const TABS = [
    { id: 'overrides' as TabType, label: 'Override Prodotti', icon: Sliders },
    { id: 'global' as TabType, label: 'Suggerimenti Globali', icon: Globe },
    { id: 'library' as TabType, label: 'Template Library', icon: Layout },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-20 relative flex flex-col h-full">
      {/* Header & Nav */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-800/50 pb-6 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl shadow-xl shadow-indigo-900/40">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">Editorial Center</h2>
              <p className="text-[10px] text-slate-500 mt-2.5 uppercase tracking-[0.2em] font-black">Multi-Partner & Template Control</p>
            </div>
          </div>

          {/* Tab Switcher */}
          <nav className="flex items-center bg-slate-900/50 p-1 rounded-2xl border border-slate-800 shadow-inner">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSelectedMasterId(null); // Reset when switching tabs
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${isActive
                    ? 'bg-slate-800 text-indigo-400 shadow-lg border border-slate-700'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                    }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
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
      </div>

      {/* Footer Info (Context sensitive) */}
      <footer className="mt-6 py-4 border-t border-slate-900 flex items-center justify-between pointer-events-none text-slate-500 shrink-0">
        <div className="flex items-center gap-4 text-[9px] uppercase tracking-widest font-black">
          <span className="text-slate-700">Sistema Editoriale:</span>
          <code className="text-slate-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">
            {activeTab === 'overrides' ? 'Override Mode (Template specific)' : activeTab === 'global' ? 'Global Mode (Partner-driven)' : 'Library Mode (Content Masters)'}
          </code>
        </div>
        <p className="text-[9px] text-slate-700 uppercase tracking-widest font-black italic">
          Riservato agli amministratori • TouringDiary Content Hub
        </p>
      </footer>
    </div>
  );
};
