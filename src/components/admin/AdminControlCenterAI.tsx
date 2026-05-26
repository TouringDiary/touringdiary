
import React, { useState, useEffect } from 'react';
import {
    Zap, ShieldCheck,
    Calculator, Layers, Activity, RefreshCcw,
    type LucideIcon,
} from 'lucide-react';

// VIEWS
import { AdminAiAnalyticsV4 } from './economics/AdminAiAnalyticsV4';
import { AdminCreditPackages } from './marketing/AdminCreditPackages';
import { SustainabilityHelper } from './economics/SustainabilityHelper';
import { PricingManager } from './economics/PricingManager';
import { getActivePricingVersion, getGlobalSettings } from '@/services/aiAdminService';
import { supabase } from '@/services/supabaseClient';
import { AdminPageHeader } from './common/AdminPageHeader';

type ControlTowerTab = 'analytics' | 'packages' | 'sustainability' | 'pricing';

const TABS: { id: ControlTowerTab; label: string; icon: LucideIcon }[] = [
    { id: 'analytics', label: 'Analytics & Margini', icon: Activity },
    { id: 'packages', label: 'Pacchetti Crediti', icon: Zap },
    { id: 'sustainability', label: 'Sustainability Helper', icon: Calculator },
    { id: 'pricing', label: 'Pricing Versioning', icon: Layers },
];

export const AdminControlCenterAI = () => {
    const [activeTab, setActiveTab] = useState<ControlTowerTab>('analytics');
    const [runtimeStatus, setRuntimeStatus] = useState<{ stripeMode: string; activeVersion: string }>({
        stripeMode: '...',
        activeVersion: '...',
    });

    const loadRuntimeStatus = async () => {
        try {
            const { data: planData } = await supabase
                .from('plans')
                .select('id')
                .eq('type', 'PRO_USER')
                .single();

            const planId = planData?.id;

            const [settings, version] = await Promise.all([
                getGlobalSettings(),
                planId ? getActivePricingVersion(planId, 365) : Promise.resolve(null),
            ]);
            setRuntimeStatus({
                stripeMode: settings.stripe_env_mode || 'LOCAL',
                activeVersion: version ? `v${version.id.slice(0, 4)}` : 'N/A',
            });
        } catch (err) {
            console.error('Failed to load runtime status', err);
        }
    };

    useEffect(() => {
        loadRuntimeStatus();
    }, [activeTab]);

    const getStatusColor = (mode: string) => {
        switch (mode.toUpperCase()) {
            case 'PROD':
            case 'PRODUCTION':
                return 'bg-emerald-500';
            case 'TEST':
                return 'bg-amber-500';
            default:
                return 'bg-slate-500';
        }
    };

    const headerActions = (
        <>
            <button
                type="button"
                onClick={loadRuntimeStatus}
                className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all shrink-0"
                aria-label="Aggiorna stato runtime"
            >
                <RefreshCcw size={16} />
            </button>
            <span className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black flex items-center gap-2 shrink-0">
                <ShieldCheck size={14} /> ENGINE CONSISTENTE
            </span>
            <div className="h-10 w-px bg-slate-800 mx-2 hidden md:block shrink-0" />
            <div className="flex gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 overflow-x-auto max-w-full">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap
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
        </>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <AdminPageHeader
                as="h1"
                icon={Zap}
                title="AI Economic Control Tower"
                subtitle="Governance Strategica & Strategia Monetaria v4"
                accent="indigo"
                actions={headerActions}
            />

            <div className="min-h-[600px]">
                {activeTab === 'analytics' && <AdminAiAnalyticsV4 />}
                {activeTab === 'packages' && <AdminCreditPackages />}
                {activeTab === 'sustainability' && <SustainabilityHelper />}
                {activeTab === 'pricing' && <PricingManager />}
            </div>

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
