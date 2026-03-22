import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, Zap } from 'lucide-react';
import { User } from '../../../types/users';
import { MarketingConfig, AiLimitsConfig } from '../../../types';
import { AdminUserManager } from '../AdminUserManager';
import { AdminRoleManager } from '../AdminRoleManager';
import AiLimitsTab from '../userManager/AiLimitsTab';
import { useAdminStyles } from '../../../hooks/useAdminStyles';
import { getCachedSetting, SETTINGS_KEYS, saveSetting } from '../../../services/settingsService';

interface UserManagementViewProps {
    currentUser: User;
    onUserUpdate?: (user: User) => void;
}

export const UserManagementView = ({ currentUser, onUserUpdate }: UserManagementViewProps) => {
    console.log("USER MANAGEMENT VIEW MOUNTED");
    const [activeTab, setActiveTab] = useState<'list' | 'roles' | 'limits'>('list');
    const [marketingConfig, setMarketingConfig] = useState<MarketingConfig | null>(null);
    const { styles } = useAdminStyles();

    useEffect(() => {
        console.log("USER MANAGEMENT VIEW useEffect");
        const config = getCachedSetting<MarketingConfig>(SETTINGS_KEYS.MARKETING_PRICES_V2);
        setMarketingConfig(config);
    }, []);

    const handleAiLimitsUpdate = async (newAiLimits: AiLimitsConfig) => {
        if (!marketingConfig) return;

        const updatedConfig = {
            ...marketingConfig,
            aiLimits: newAiLimits
        };
        
        setMarketingConfig(updatedConfig);
        await saveSetting(SETTINGS_KEYS.MARKETING_PRICES_V2, updatedConfig);
        // Optionally, add some user feedback (e.g., a toast notification)
    };

    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in">
             <div className="flex items-center gap-3 mb-2 shrink-0">
                <div className="p-3 bg-pink-600 rounded-xl shadow-lg">
                    <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h2 className={styles.admin_page_title}>Utenti & Permessi</h2>
                    <p className={styles.admin_page_subtitle}>Gestione accessi, ruoli e sicurezza piattaforma</p>
                </div>
            </div>

            <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800 w-full md:w-fit shrink-0 overflow-x-auto gap-1">
                <button 
                    onClick={() => setActiveTab('list')} 
                    className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === 'list' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                    <Users className="w-4 h-4"/> Lista Utenti
                </button>
                <button 
                    onClick={() => setActiveTab('roles')} 
                    className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === 'roles' ? 'bg-fuchsia-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                    <ShieldCheck className="w-4 h-4"/> Matrice Permessi
                </button>
                <button 
                    onClick={() => setActiveTab('limits')} 
                    className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === 'limits' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                    <Zap className="w-4 h-4"/> Limiti AI
                </button>
            </div>
            
            <div className="flex-1 min-h-0 bg-slate-900/50 rounded-2xl border border-slate-800/50 p-1 overflow-hidden">
                {activeTab === 'list' && <AdminUserManager currentUser={currentUser} />}
                {activeTab === 'roles' && <AdminRoleManager currentUser={currentUser} />}
                {activeTab === 'limits' && (
                    <AiLimitsTab 
                        config={marketingConfig?.aiLimits} 
                        onUpdate={handleAiLimitsUpdate} 
                    />
                )}
            </div>
        </div>
    );
};
