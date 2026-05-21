import { aiGateway } from '@/services/ai/aiGateway';
import React, { useState } from 'react';
import { submitSponsorRequest } from '../../services/sponsorService';
import { compressImage, dataURLtoFile } from '../../utils/common';
import { User } from '../../types/index';
import { PLAN_TYPES, PlanType } from '../../constants/planTypes';


interface UseSponsorFormLogicProps {
    user?: User;
    initialType?: PlanType;
}

export const useSponsorFormLogic = ({ user, initialType = PLAN_TYPES.LOCAL_ACTIVITY }: UseSponsorFormLogicProps) => {
    const isGuest = !user || user.role === 'guest';
    
    // Form State
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [activeType, setActiveType] = useState<PlanType>(initialType);
    
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    
    const [formData, setFormData] = useState({
        companyName: user?.companyName || '',
        vatNumber: user?.vatNumber || '',
        contactName: user?.name || '',
        adminEmail: user?.email || '',
        adminPhone: '',
        publicName: user?.companyName || '',
        address: user?.city ? `${user.city}, Italia` : '',
        cityId: '',   // NUOVO CAMPO
        description: '',
        website: '',
        openingHours: '',
        category: '',
        publicPhone: '',
        languages: '',
        licenseNumber: '',
        sdiCode: '',
        password: '', // For guests
        confirmPassword: '' // For guests
    });

    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    
    // Status State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleTypeChange = (type: PlanType) => {
        setActiveType(type);
        setSelectedPlan(null); // Resetta la selezione del piano quando il tipo cambia
    };

    const handleMagicRewrite = async () => {
        if (!formData.description?.trim()) return null;
        
        try {
            
            const prompt = `Sei un copywriter turistico d'élite. Riscrivi questa descrizione per una vetrina su "Touring Diary". 
            Rendila accattivante, professionale e persuasiva. Max 500 caratteri.
            Testo originale: "${formData.description}"`;
            
            const response = await aiGateway.generateLegacy({ 
                model: 'gemini-2.0-pro', 
                contents: prompt 
            });
            
            return response.text?.trim() || null;
        } catch (e) {
            console.error("AI Rewrite Error", e);
            return null;
        }
    };

    const resetForm = () => {
        setStep('form');
        setFormData({
            companyName: user?.companyName || '',
            vatNumber: user?.vatNumber || '',
            contactName: user?.name || '',
            adminEmail: user?.email || '',
            adminPhone: '',
            publicName: user?.companyName || '',
            address: user?.city ? `${user.city}, Italia` : '',
            cityId: '',
            description: '',
            website: '',
            openingHours: '',
            category: '',
            publicPhone: '',
            languages: '',
            licenseNumber: '',
            sdiCode: '',
            password: '',
            confirmPassword: ''
        });
        setCoverImage(null);
        setTermsAccepted(false);
        setPrivacyAccepted(false);
        setErrorMsg(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!termsAccepted || !privacyAccepted) {
            setErrorMsg("Devi accettare Termini e Privacy.");
            return;
        }

        if (!selectedPlan) { // Aggiunto controllo
            setErrorMsg("Devi selezionare un piano e una durata.");
            return;
        }

        if (isGuest) {
             if (formData.password.length < 6) {
                 setErrorMsg("La password deve essere di almeno 6 caratteri.");
                 return;
             }
             if (formData.password !== formData.confirmPassword) {
                 setErrorMsg("Le password non coincidono.");
                 return;
             }
        }

        setIsSubmitting(true);
        try {
            const success = await submitSponsorRequest({
                 ...formData,
                 pricing_version_id: selectedPlan,
                 coverImage: coverImage
            }, activeType, selectedPlan, user?.id);

            if (success) {
                setStep('success');
            } else {
                setErrorMsg("Errore durante l'invio della richiesta.");
            }
        } catch (err: any) {
             setErrorMsg(err.message || "Errore sconosciuto.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        step,
        activeType,
        selectedPlan,
        formData,
        isSubmitting,
        errorMsg,
        termsAccepted,
        privacyAccepted,
        coverImage,
        isGuest,
        
        setFormData,
        setTermsAccepted,
        setPrivacyAccepted,
        setCoverImage,
        setErrorMsg,
        setSelectedPlan,
        
        handleTypeChange,
        handleSubmit,
        resetForm,
        handleMagicRewrite
    };
};
