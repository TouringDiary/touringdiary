import { aiGateway } from '@/services/ai/aiGateway';
import React, { useState } from 'react';
import { submitSponsorRequest } from '../../services/sponsorService';
import { registerUser } from '../../services/userService';
import { supabase } from '../../services/supabaseClient';
import { User } from '../../types/index';
import { PLAN_TYPES, PlanType } from '../../constants/planTypes';
import { PLATFORM_FEATURE_FLAG_KEYS } from '../../constants/platformFeatureFlags';
import { evaluateCachedFeatureFlag } from '../../domain/platformControl/platformFlagCache';

export interface SponsorFormData {
    companyName: string;
    vatNumber: string;
    contactName: string;
    adminEmail: string;
    adminPhone: string;
    publicName: string;
    address: string;
    cityId: string;
    description: string;
    website: string;
    openingHours: string;
    category: string;
    publicPhone: string;
    languages: string;
    licenseNumber: string;
    sdiCode: string;
    username: string;
    password: string;
    confirmPassword: string;
}

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
    
    const [formData, setFormData] = useState<SponsorFormData>({
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
        username: '',
        password: '',
        confirmPassword: ''
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
            username: '',
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

        const applicationsFlag = evaluateCachedFeatureFlag(
            PLATFORM_FEATURE_FLAG_KEYS.SPONSOR_APPLICATIONS,
            {
                userRole: user?.role ?? null,
                isAuthenticated: Boolean(user && user.role !== 'guest'),
            }
        );
        if (applicationsFlag && !applicationsFlag.enabled) {
            setErrorMsg('Le candidature Sponsor sono temporaneamente sospese.');
            return;
        }

        if (!termsAccepted || !privacyAccepted) {
            setErrorMsg("Devi accettare Termini e Privacy.");
            return;
        }

        if (!selectedPlan) { // Aggiunto controllo
            setErrorMsg("Devi selezionare un piano e una durata.");
            return;
        }

        if (isGuest) {
             if (!formData.username.trim()) {
                 setErrorMsg("Il nome utente è obbligatorio.");
                 return;
             }
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
            let submitProfileId = user?.id;

            if (isGuest) {
                const registration = await registerUser({
                    name: formData.contactName || formData.companyName,
                    email: formData.adminEmail,
                    password: formData.password,
                    username: formData.username.trim(),
                });

                if (registration.error || !registration.user) {
                    setErrorMsg(registration.error || "Registrazione fallita.");
                    return;
                }

                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) {
                    setErrorMsg(
                        "Registrazione completata. Conferma la tua email, accedi al tuo account e invia nuovamente la candidatura da questo modulo."
                    );
                    return;
                }

                submitProfileId = session.user.id;
            }

            if (!submitProfileId || submitProfileId === 'guest') {
                setErrorMsg("Autenticazione richiesta per inviare la candidatura Sponsor.");
                return;
            }

            const success = await submitSponsorRequest({
                companyName: formData.companyName,
                vatNumber: formData.vatNumber,
                contactName: formData.contactName,
                adminEmail: formData.adminEmail,
                adminPhone: formData.adminPhone,
                address: formData.address,
                cityId: formData.cityId,
                description: formData.description,
                licenseNumber: formData.licenseNumber || undefined,
                languages: formData.languages
                    ? formData.languages.split(',').map((lang) => lang.trim()).filter(Boolean)
                    : undefined,
            }, activeType, selectedPlan, submitProfileId);

            if (success) {
                setStep('success');
            } else {
                setErrorMsg("Errore durante l'invio della richiesta.");
            }
        } catch (err: unknown) {
             const message = err instanceof Error ? err.message : "Errore sconosciuto.";
             setErrorMsg(message);
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
