import { Z_FLOATING_PANEL } from '@/constants/zIndex';
import React, { useState, useEffect } from 'react';
import { CreditCard, Loader2, Calendar, History, Zap, TrendingUp, ShieldCheck, CheckCircle, AlertTriangle, X } from 'lucide-react';

import { useAdminStyles } from '../../hooks/useAdminStyles';
import {
    getPricingVersionsWithPlans,
    getCampaigns,
    createCampaign,
    deleteCampaign,
    updatePricingVersionExpiration,
    createPricingVersion,
    deletePricingVersionDraft,
    archivePreviousActivePricingVersions,
    activatePricingVersion,
    mergeAiLimits,
    PricingVersionJoined
} from '../../services/marketingService';
import { PricingPlansPanel } from './marketing/PricingPlansPanel';
import { PricingHistoryPanel } from './marketing/PricingHistoryPanel';
import { AiLimitsPanel } from './marketing/AiLimitsPanel';
import { CampaignsPanel } from './marketing/CampaignsPanel';
import { PromoManagerModal } from './marketing/PromoManagerModal';
import * as Domain from '../../types/domain/index';

type TabType = 'pricing' | 'history' | 'campaigns' | 'ai_limits';

interface GroupedPlans {
    planName: string;
    versions: PricingVersionJoined[];
}

interface NavTab {
    id: TabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

const NAV_TABS: NavTab[] = [
    { id: 'pricing', label: 'LISTINI LIVE', icon: CreditCard },
    { id: 'ai_limits', label: 'LIMITI AI', icon: Zap },
    { id: 'history', label: 'AUDIT STORICO', icon: History },
    { id: 'campaigns', label: 'CAMPAGNE', icon: Calendar },
];

// Componente Toast locale per l'Admin Panel (ispirato ad AdminCityEditor)
const AdminToast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
    <div
        className={`fixed top-6 right-6 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 border ${type === 'success' ? 'bg-emerald-600 border-emerald-400' : 'bg-red-600 border-red-400'} text-white`}
        style={{ zIndex: Z_FLOATING_PANEL }}
    >
        {type === 'success' ? <CheckCircle className="w-6 h-6 shrink-0" /> : <AlertTriangle className="w-6 h-6 shrink-0" />}
        <div className="font-bold text-sm">{message}</div>
        <button onClick={onClose} className="ml-4 hover:bg-white/20 p-1 rounded-full transition-colors"><X className="w-4 h-4" /></button>
    </div>
);

export const MarketingManager = () => {
    useAdminStyles();
    const [activeTab, setActiveTab] = useState<TabType>('pricing');
    const [plansData, setPlansData] = useState<GroupedPlans[]>([]);
    const [allVersions, setAllVersions] = useState<PricingVersionJoined[]>([]);
    const [campaigns, setCampaigns] = useState<Domain.Row<'campaigns'>[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const loadData = async () => {
        try {
            setIsLoading(true);

            // 1. Carica tutte le versioni con i piani collegati tramite il service layer
            const vData = await getPricingVersionsWithPlans();
            setAllVersions(vData);

            // 2. Raggruppa deterministically per i pannelli dei piani, escludendo item orfani senza plan o plan.type reale
            const groups: Record<string, PricingVersionJoined[]> = {};
            for (const item of vData) {
                const plan = item.plans;
                if (plan && plan.type) {
                    const pType = plan.type;
                    if (!groups[pType]) groups[pType] = [];
                    groups[pType].push(item);
                }
            }

            const groupedArray: GroupedPlans[] = Object.keys(groups).map(key => ({
                planName: key,
                versions: groups[key]
            }));
            setPlansData(groupedArray);

            // 3. Carica Campagne tramite il service layer
            const cData = await getCampaigns();
            setCampaigns(cData);

        } catch (err) {
            console.error("MarketingManager load error:", err);
            showToast("Errore nel caricamento dei dati", 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // --- HANDLERS ---

    const handleAddCampaign = async (name: string) => {
        try {
            // Invio del payload pulito delegando l'inserimento senza created_at artificiale nel frontend
            await createCampaign(name, null);
            showToast(`Campagna ${name} creata correttamente`, 'success');
            await loadData(); // Refresh immediato
        } catch (err) {
            console.error("Campaign insert failed:", err);
            const msg = err instanceof Error ? err.message : String(err);
            showToast(`Errore durante la creazione della campagna: ${msg}`, 'error');
            throw err; // Rilanciamo per permettere al componente UI di gestire lo stato
        }
    };

    const handleDeleteCampaign = async (id: string) => {
        if (!confirm("Eliminare definitivamente questa campagna?")) return;

        try {
            await deleteCampaign(id);
            showToast("Campagna eliminata", 'success');
            await loadData();
        } catch (err) {
            console.error("Delete failed:", err);
            showToast("Errore durante l'eliminazione", 'error');
        }
    };

    const handleUpdateAiLimits = async (versionId: string, flash: number, pro: number) => {
        const now = new Date().toISOString();
        try {
            const current = allVersions.find(v => v.id === versionId);
            if (!current) return;

            if (!current.valid_until) {
                await updatePricingVersionExpiration(versionId, now);
            }

            // Merge strutturale deterministico del JSON per preservare chiavi sconosciute e forward compatibility
            const aiLimitsMerged = mergeAiLimits(current.ai_limits, flash, pro);

            await createPricingVersion({
                plan_id: current.plan_id,
                duration_days: current.duration_days,
                price: current.price,
                currency: current.currency,
                ai_limits: aiLimitsMerged,
                features: current.features,
                campaign_id: current.campaign_id,
                valid_from: now,
                valid_until: null,
                created_at: now
            });

            showToast("Limiti AI aggiornati (Nuova Versione)", 'success');
            await loadData();
        } catch (e) {
            console.error("AI Limits Update Error:", e);
            showToast("Errore nell'aggiornamento limiti", 'error');
        }
    };

    const handlePricingAction = async (action: 'create_draft' | 'activate' | 'delete_draft', id: string) => {
        const now = new Date().toISOString();
        try {
            switch (action) {
                case 'create_draft': {
                    const baseVersion = allVersions.find(v => v.plan_id === id && v.valid_until === null)
                        || allVersions.find(v => v.plan_id === id);
                    if (!baseVersion) return;

                    // Assegnamento diretto senza cast "as any" o "as Json" grazie alla perfetta conformità a Json | null
                    await createPricingVersion({
                        plan_id: baseVersion.plan_id,
                        duration_days: baseVersion.duration_days,
                        price: baseVersion.price,
                        currency: baseVersion.currency,
                        ai_limits: baseVersion.ai_limits,
                        features: baseVersion.features,
                        valid_from: now,
                        valid_until: null,
                        created_at: now,
                        is_active: false
                    });
                    showToast("Bozza creata", 'success');
                    break;
                }
                case 'activate': {
                    const target = allVersions.find(v => v.id === id);
                    if (!target) return;

                    // Archivia le versioni attive precedenti per lo stesso piano/campagna
                    await archivePreviousActivePricingVersions(target.plan_id, target.campaign_id, now);

                    // Attiva la bozza corrente
                    await activatePricingVersion(id, now);

                    showToast("Versione attivata con successo", 'success');
                    break;
                }
                case 'delete_draft': {
                    await deletePricingVersionDraft(id);
                    showToast("Bozza eliminata", 'success');
                    break;
                }
            }
            await loadData();
        } catch (e) {
            console.error(`Action ${action} failed:`, e);
            showToast("Errore durante l'operazione", 'error');
        }
    };

    if (isLoading) {
        return (
            <div className="text-center py-40 flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">Sincronizzazione Pricing Engine...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in pb-20 relative">
            {toast && <AdminToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* HEADER & NAV */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl shadow-xl shadow-indigo-900/40">
                        <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Pricing Engine</h2>
                        <p className="text-slate-500 text-sm font-bold flex items-center gap-2">
                            Relational Versioning Control (SSOT)
                        </p>
                    </div>
                </div>

                <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl overflow-x-auto">
                    {NAV_TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 shrink-0 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-500 hover:text-white'}`}>
                            <tab.icon className="w-4 h-4" /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="space-y-12">
                {activeTab === 'pricing' && <PricingPlansPanel plansData={plansData} onAction={handlePricingAction} />}
                {activeTab === 'ai_limits' && <AiLimitsPanel versions={allVersions} onSave={handleUpdateAiLimits} />}
                {activeTab === 'history' && <PricingHistoryPanel versions={allVersions} campaigns={campaigns} onAction={handlePricingAction} />}
                {activeTab === 'campaigns' && (
                    <CampaignsPanel
                        campaigns={campaigns}
                        onAdd={handleAddCampaign}
                        onDelete={handleDeleteCampaign}
                    />
                )}
            </div>

            <PromoManagerModal
                isOpen={isPromoModalOpen}
                onClose={() => setIsPromoModalOpen(false)}
                promoTypes={campaigns.map(c => ({ id: c.id, label: c.name }))}
                onAdd={handleAddCampaign}
                onDeleteRequest={async (id) => {
                    await handleDeleteCampaign(id);
                }}
            />
        </div>
    );
};
