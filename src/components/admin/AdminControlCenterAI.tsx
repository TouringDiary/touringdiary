
import React, { useState, useEffect } from 'react';
import { 
    Zap, Euro, TrendingUp, ShieldCheck, 
    BarChart3, Settings, SlidersHorizontal, 
    Calculator, Layers, Sparkles, Activity, RefreshCcw
} from 'lucide-react';

// VIEWS
import { AdminAiAnalyticsV4 } from './economics/AdminAiAnalyticsV4';
import { AdminCreditPackages } from './marketing/AdminCreditPackages';
import { SustainabilityHelper } from './economics/SustainabilityHelper';
import { PricingManager } from './economics/PricingManager';
import { getActivePricingVersion, getGlobalSettings } from '@/services/aiAdminService';
import { supabase } from '@/services/supabaseClient';

export const AdminControlCenterAI = () => {
    const [activeTab, setActiveTab] = useState<'analytics' | 'packages' | 'sustainability' | 'pricing'>('analytics');
    const [runtimeStatus, setRuntimeStatus] = useState<{ stripeMode: string; activeVersion: string }>({ 
        stripeMode: '...', 
        activeVersion: '...' 
    });

    const tabs = [
        { id: 'analytics', label: 'Analytics & Margini', icon: Activity },
        { id: 'packages', label: 'Pacchetti Crediti', icon: Zap },
        { id: 'sustainability', label: 'Sustainability Helper', icon: Calculator },
        { id: 'pricing', label: 'Pricing Versioning', icon: Layers },
    ];

    const loadRuntimeStatus = async () => {
        try {
            // Database Reality First: Retrieve the real PRO_USER plan UUID from the plans table
            const { data: planData } = await supabase
                .from('plans')
                .select('id')
                .eq('type', 'PRO_USER')
                .single();

            const planId = planData?.id;

            const [settings, version] = await Promise.all([
                getGlobalSettings(),
                planId ? getActivePricingVersion(planId, 365) : Promise.resolve(null)
            ]);
            setRuntimeStatus({
                stripeMode: settings.stripe_env_mode || 'LOCAL',
                activeVersion: version ? `v${version.id.slice(0, 4)}` : 'N/A'
            });
        } catch (err) {
            console.error("Failed to load runtime status", err);
        }
    };

    useEffect(() => {
        loadRuntimeStatus();
    }, [activeTab]); // Refresh when switching tabs or on mount

    const getStatusColor = (mode: string) => {
        switch (mode.toUpperCase()) {
            case 'PROD':
            case 'PRODUCTION': return 'bg-emerald-500';
            case 'TEST': return 'bg-amber-500';
            default: return 'bg-slate-500';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* --- CENTRAL HUB HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-4 tracking-tighter">
                        <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-2xl shadow-indigo-500/20">
                            <Zap className="w-8 h-8 text-white" />
                        </div>
                        AI Economic Control Tower
                    </h1>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2 ml-1">
                        Governance Strategica & Strategia Monetaria v4
                    </p>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={loadRuntimeStatus}
                        className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all mr-2"
                    >
                        <RefreshCcw size={16} />
                    </button>
                    <span className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black flex items-center gap-2">
                        <ShieldCheck size={14} /> ENGINE CONSISTENTE
                    </span>
                    <div className="h-10 w-px bg-slate-800 mx-2 hidden md:block" />
                    <div className="flex gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                    ${activeTab === tab.id 
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                                    }
                                `}
                            >
                                <tab.icon size={14} />
                                <span className="hidden lg:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="min-h-[600px]">
                {activeTab === 'analytics' && <AdminAiAnalyticsV4 />}
                {activeTab === 'packages' && <AdminCreditPackages />}
                {activeTab === 'sustainability' && <SustainabilityHelper />}
                {activeTab === 'pricing' && <PricingManager />}
            </div>

            {/* --- FOOTER STATUS --- */}
            <div className="fixed bottom-6 right-8 left-auto md:left-auto flex items-center gap-4 z-admin-modal pointer-events-none md:pointer-events-auto">
                 <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 p-2 rounded-2xl shadow-2xl flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(runtimeStatus.stripeMode)} ${runtimeStatus.stripeMode === 'PROD' ? 'animate-pulse' : ''}`} />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Stripe: {runtimeStatus.stripeMode}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pricing: {runtimeStatus.activeVersion}</span>
                    </div>
                 </div>
            </div>
        </div>
    );
};
