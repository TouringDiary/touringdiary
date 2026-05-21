import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';

import React, { useState, useEffect } from 'react';
import { PLAN_TYPES } from '@/constants/planTypes';
import { createPortal } from 'react-dom';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import SponsorPlanCard from '../marketing/SponsorPlanCard';
import { getPricingVersions, FormattedPricingVersion } from '../../services/dataService';
import { MarketingTierConfig } from '../../types';

interface UserUpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const UserUpgradeModal: React.FC<UserUpgradeModalProps> = ({ isOpen, onClose }) => {
    const [pricingVersions, setPricingVersions] = useState<FormattedPricingVersion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        const loadPricings = async () => {
            try {
                setIsLoading(true);
                const versions = await getPricingVersions();
                const targetPlans = [PLAN_TYPES.PRO_USER, PLAN_TYPES.PRO_USER_PLUS] as string[];
                const filtered = versions.filter(v => targetPlans.includes(v.plan_type));
                filtered.sort((a, b) => a.price - b.price);
                setPricingVersions(filtered);
                setError(null);
            } catch (e) {
                console.error("UserUpgradeModal load error:", e);
                setError("Impossibile caricare i piani premium.");
            } finally {
                setIsLoading(false);
            }
        };

        loadPricings();
    }, [isOpen]);

    const handleSelectPlan = (versionId: string) => {
        setSelectedVersionId(versionId);
        console.log(`[UserUpgradeModal] Piano iniziato il checkout: ${versionId}`);
        // Logica di redirect Stripe
    };

    // MODIFICA 4 — Standardizzazione chiusura con tasto ESC
    useGlobalModalEscape(isOpen, onClose);

    if (!isOpen) return null;

    return createPortal(
        <div className="td-modal-overlay bg-black/90 backdrop-blur-sm animate-in fade-in !p-4" style={{ zIndex: Z_OVERLAY }}>
            <div 
                className="relative bg-slate-900 w-full max-w-4xl rounded-3xl border border-slate-700 shadow-2xl p-8 overflow-hidden flex flex-col animate-in zoom-in-95 max-h-[90vh] pointer-events-auto"
                style={{ zIndex: Z_MODAL }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="text-white relative">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold text-amber-400 font-display uppercase tracking-wide">Passa a Premium</h2>
                        <CloseButton onClose={onClose} variant="primary" />
                    </div>
                    
                    <p className="text-gray-400 mb-8 font-medium">
                        Sblocca funzionalità potenti e ottieni una quota più alta di limitazione AI.
                    </p>

                    {isLoading ? (
                        <div className="text-center py-12 flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Caricamento piani...</span>
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-500 py-6">{error}</div>
                    ) : pricingVersions.length === 0 ? (
                        <div className="text-center py-6 text-gray-400">Nessun piano premium disponibile al momento.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[60vh] custom-scrollbar p-2">
                            {pricingVersions.map((version) => {
                                 const features = ["Pianificazione Itinerari Premium", "Rimozione Pubblicità"];
                                 
                                 if (version.ai_limits && version.ai_limits.models) {
                                     const fLimit = version.ai_limits.models.flash || 0;
                                     const pLimit = version.ai_limits.models.pro || 0;
                                     if (fLimit > 0) features.push(`${fLimit} Flash requests/month`);
                                     if (pLimit > 0) features.push(`${pLimit} Pro requests/month`);
                                 }

                                 const planConfig: MarketingTierConfig = {
                                    basePrice: version.price,
                                    promoPrice: undefined,
                                    promoActive: false,
                                    customFeatureLabels: features
                                 };

                                return (
                                    <SponsorPlanCard
                                        key={version.pricing_version_id}
                                        planKey={version.plan_name}
                                        planType={version.plan_type}
                                        config={planConfig}
                                        isRecommended={version.plan_type === PLAN_TYPES.PRO_USER_PLUS}
                                        onSelect={() => handleSelectPlan(version.pricing_version_id)}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default UserUpgradeModal;



