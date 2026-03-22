import React, { useState } from 'react';
import { submitSponsorRequest } from '../../services/sponsorService';
import { compressImage, dataURLtoFile } from '../../utils/common';
import { User, MarketingConfig } from '../../types/index';
import { getAiClient } from '../../services/ai/aiClient';

interface UseSponsorFormLogicProps {
    user?: User;
    initialType?: 'activity' | 'shop' | 'tour_operator' | 'guide';
    initialTier?: 'gold' | 'silver';
    marketingConfig: MarketingConfig | null;
}

export const useSponsorFormLogic = ({ user, initialType = 'activity', initialTier = 'gold', marketingConfig }: UseSponsorFormLogicProps) => {
    const isGuest = !user || user.role === 'guest';
    
    // Form State
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [activeType, setActiveType] = useState<'activity' | 'shop' | 'tour_operator' | 'guide'>(initialType || 'activity');
    
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

    const handleTypeChange = (type: 'activity' | 'shop' | 'tour_operator' | 'guide') => {
        setActiveType(type);
        setSelectedPlan(null); // Resetta la selezione del piano quando il tipo cambia
    };

    const handleMagicRewrite = async () => {
        if (!formData.description?.trim()) return null;
        
        try {
            const ai = getAiClient();
            const prompt = `Sei un copywriter turistico d'élite. Riscrivi questa descrizione per una vetrina su "Touring Diary". 
            Rendila accattivante, professionale e persuasiva. Max 500 caratteri.
            Testo originale: "${formData.description}"`;
            
            const response = await ai.models.generateContent({ 
                model: 'gemini-3.1-pro-preview', 
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
            }, activeType, selectedPlan);

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
