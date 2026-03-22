
import React, { useState } from 'react';
import { Palette, Puzzle } from 'lucide-react';
import { useConfig } from '@/context/ConfigContext';
import { GlobalSettingsPanel } from './GlobalSettingsPanel';
import DesignSystemSettings from '../design/DesignSystemSettings';

const TABS = [
    { id: 'design_system', label: 'Design System', icon: Palette },
    { id: 'poi_categories_config', label: 'Categorie POI', icon: Puzzle },
];

export const SettingsPage: React.FC = () => {
    const { configs, isLoading, refreshConfig } = useConfig();
    const [activeTab, setActiveTab] = useState('design_system');

    if (isLoading) {
        return <div>Caricamento configurazioni...</div>;
    }

    const activeConfigData = activeTab && configs ? configs[activeTab] : null;

    return (
        <div className="flex flex-col h-full">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Impostazioni Globali</h2>
                <p className="text-sm text-slate-400">Gestione centralizzata delle configurazioni del sito.</p>
            </div>

            <div className="flex gap-2 border-b border-slate-800 mb-6">
                {TABS.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase rounded-t-lg border-b-2 ${isActive ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}>
                            <tab.icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : ''}`} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className="flex-1 overflow-y-auto">
                {activeTab === 'design_system' ? (
                    <DesignSystemSettings />
                ) : activeConfigData !== undefined && activeConfigData !== null ? (
                    <GlobalSettingsPanel
                        key={activeTab}
                        title={TABS.find(t => t.id === activeTab)?.label || 'Pannello'}
                        configKey={activeTab}
                        data={activeConfigData}
                        onSaveSuccess={refreshConfig}
                    />
                ) : (
                    <div className="text-center p-8 bg-slate-800/50 rounded-lg">
                        <h4 className="font-bold text-lg text-white">Nessuna Configurazione</h4>
                        <p className="text-sm text-slate-400 mt-1">Nessun dato di configurazione trovato per la chiave <strong>{activeTab}</strong>.</p>
                        <p className="text-xs text-slate-500 mt-2">Verifica che esista un record corrispondente nella tabella 'global_settings'.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
