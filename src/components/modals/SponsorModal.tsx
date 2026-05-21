import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';
import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Store } from 'lucide-react';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { User as UserType } from '../../types/index';
import { SponsorTypeSelector } from './sponsor/SponsorTypeSelector';
import { SponsorPricingSelector } from './sponsor/SponsorPricingSelector';
import { SponsorForm } from './sponsor/SponsorForm';
import { SponsorSuccess } from './sponsor/SponsorSuccess';
import { useSponsorFormLogic } from '../../hooks/features/useSponsorFormLogic';
import { PlanType } from '../../constants/planTypes';

interface SponsorModalProps {
    isOpen: boolean;
    onClose: () => void;
    user?: UserType;
    initialType?: PlanType;
}

export const SponsorModal = ({ isOpen, onClose, user, initialType }: SponsorModalProps) => {
    // Hook Logica Form
    const {
        step, activeType, selectedPlan, formData, isSubmitting, errorMsg,
        termsAccepted, privacyAccepted, coverImage, isGuest,
        setFormData, setTermsAccepted, setPrivacyAccepted, setCoverImage, setErrorMsg, setSelectedPlan,
        handleTypeChange, handleSubmit, resetForm, handleMagicRewrite
    } = useSponsorFormLogic({ 
        user, 
        initialType
    });

    const handlePricingSelection = useCallback((id: string | null) => {
        setSelectedPlan(id);
    }, [setSelectedPlan]);

    // Reset quando si riapre
    useEffect(() => {
        if (isOpen && step === 'success') {
            resetForm();
        }
    }, [isOpen, step, resetForm]);

    useGlobalModalEscape(isOpen, onClose);


    if (!isOpen) return null;

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
                        <div><h2 className="text-2xl font-display font-bold text-white leading-none">Diventa Partner</h2><p className="text-xs text-slate-400 mt-1 font-medium">Entra nel network di Touring Diary</p></div>
                    </div>
                    <CloseButton 
                        onClose={onClose}
                        variant="primary"
                    />
                </div>

                {step === 'success' ? (
                    <SponsorSuccess 
                        contactName={formData.contactName}
                        isGuest={isGuest}
                        adminEmail={formData.adminEmail}
                        onClose={onClose}
                    />
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#020617]">
                        <div className="p-6 md:p-10 max-w-3xl mx-auto">
                            
                            <SponsorTypeSelector activeType={activeType} onChange={handleTypeChange} />

                            <SponsorPricingSelector
                                activeGroup={activeType as any}
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
