import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';
import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Store } from 'lucide-react';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { User as UserType } from '../../types/index';
import { SponsorTypeSelector } from './sponsor/SponsorTypeSelector';
import { SponsorPricingSelector, resolveSponsorableGroup } from './sponsor/SponsorPricingSelector';
import { SponsorForm } from './sponsor/SponsorForm';
import { SponsorSuccess } from './sponsor/SponsorSuccess';
import { useSponsorFormLogic } from '../../hooks/features/useSponsorFormLogic';
import { PlanType } from '../../constants/planTypes';
import {
    PLATFORM_FEATURE_FLAG_KEYS,
    PLATFORM_MESSAGE_TEMPLATE_KEYS,
} from '../../constants/platformFeatureFlags';
import { useFeatureFlag } from '../../context/PlatformControlContext';
import { useSystemMessage } from '../../hooks/useSystemMessage';

interface SponsorModalProps {
    isOpen: boolean;
    onClose: () => void;
    user?: UserType;
    initialType?: PlanType;
}

export const SponsorModal = ({ isOpen, onClose, user, initialType }: SponsorModalProps) => {
    const {
        step, activeType, selectedPlan, formData, isSubmitting, errorMsg,
        termsAccepted, privacyAccepted, coverImage, isGuest,
        setFormData, setTermsAccepted, setPrivacyAccepted, setCoverImage, setErrorMsg, setSelectedPlan,
        handleTypeChange, handleSubmit, resetForm, handleMagicRewrite
    } = useSponsorFormLogic({
        user,
        initialType
    });

    const applicationsFlag = useFeatureFlag(PLATFORM_FEATURE_FLAG_KEYS.SPONSOR_APPLICATIONS);
    const applicationsOpen = applicationsFlag?.enabled ?? true;
    const { getText: getPausedMsg } = useSystemMessage(
        PLATFORM_MESSAGE_TEMPLATE_KEYS.SPONSOR_APPLICATIONS_PAUSED
    );

    const handlePricingSelection = useCallback((id: string | null) => {
        setSelectedPlan(id);
    }, [setSelectedPlan]);

    useEffect(() => {
        if (isOpen && step === 'success') {
            resetForm();
        }
    }, [isOpen, step, resetForm]);

    useGlobalModalEscape(isOpen, onClose);

    if (!isOpen) return null;

    const pausedCopy = getPausedMsg({});
    const pausedTitle = pausedCopy.title || 'Candidature sospese';
    const pausedBody =
        pausedCopy.body ||
        'Le nuove candidature Sponsor sono temporaneamente sospese. Riprova più tardi.';

    return createPortal(
        <div className="td-modal-overlay bg-black/90 backdrop-blur-sm animate-in fade-in" onClick={onClose} style={{ zIndex: Z_OVERLAY }}>
            <div
                className="relative bg-[#020617] w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] md:rounded-3xl border-0 md:border border-slate-700 shadow-2xl flex flex-col animate-in zoom-in-95 pointer-events-auto"
                style={{ zIndex: Z_MODAL }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-[#0f172a] shrink-0 sticky top-0 md:rounded-t-3xl">
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-600 p-2.5 rounded-xl shadow-lg shadow-amber-900/20"><Store className="w-6 h-6 text-white"/></div>
                        <div>
                            <h2 className="text-2xl font-display font-bold text-white leading-none">Diventa Partner</h2>
                            <p className="text-xs text-slate-400 mt-1 font-medium">Entra nel network di Touring Diary</p>
                        </div>
                    </div>
                    <CloseButton onClose={onClose} variant="primary" />
                </div>

                {step === 'success' ? (
                    <SponsorSuccess
                        contactName={formData.contactName}
                        isGuest={isGuest}
                        adminEmail={formData.adminEmail}
                        onClose={onClose}
                    />
                ) : !applicationsOpen ? (
                    <div className="flex-1 overflow-y-auto p-6 md:p-10">
                        <div className="max-w-xl mx-auto rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6 space-y-3">
                            <h3 className="text-lg font-bold text-amber-200">{pausedTitle}</h3>
                            <p className="text-sm text-slate-300 leading-relaxed">{pausedBody}</p>
                            <button
                                type="button"
                                onClick={onClose}
                                className="mt-2 px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-bold"
                            >
                                Chiudi
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#020617]">
                        <div className="p-6 md:p-10 max-w-3xl mx-auto">
                            <SponsorTypeSelector activeType={activeType} onChange={handleTypeChange} />
                            <SponsorPricingSelector
                                activeGroup={resolveSponsorableGroup(activeType)}
                                onSelectionChange={handlePricingSelection}
                            />
                            <SponsorForm
                                formData={formData}
                                setFormData={setFormData}
                                activeType={activeType}
                                isGuest={isGuest}
                                isSubmitting={isSubmitting}
                                errorMsg={errorMsg}
                                setErrorMsg={setErrorMsg}
                                onSubmit={handleSubmit}
                                setCoverImage={(file) => setCoverImage(file)}
                                coverImage={coverImage}
                                termsAccepted={termsAccepted}
                                setTermsAccepted={setTermsAccepted}
                                privacyAccepted={privacyAccepted}
                                setPrivacyAccepted={setPrivacyAccepted}
                                handleMagicRewrite={handleMagicRewrite}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};
