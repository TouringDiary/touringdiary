import { useMemo } from 'react';
import { SponsorRequest } from '../types/models/Sponsor';
import { 
    isShopCategory, 
    validateActivationData, 
    getCriticalPartnersCount 
} from '../utils/sponsorValidation';
import { 
    ActivationData, 
    RejectData, 
    CancelData, 
    ExtensionData 
} from './useSponsorModals';

interface SponsorModalState {
    activationData: ActivationData | null;
    rejectData: RejectData | null;
    cancelData: CancelData | null;
    extensionData: ExtensionData;
}

/**
 * Hook strettamente derivativo che trasforma lo stato UI grezzo in 
 * flag booleani e messaggi validati pronti per il rendering, applicando 
 * logiche di business sicure. NON utilizza useState.
 */
export const useSponsorModalLogic = (
    modalState: SponsorModalState, 
    requests: SponsorRequest[]
) => {
    // === 1. LOGICA ATTIVAZIONE ===
    const targetActivationRequest = useMemo(() => {
        if (!modalState.activationData?.id) return null;
        return requests.find(r => r.id === modalState.activationData?.id) || null;
    }, [modalState.activationData?.id, requests]);

    const isActivationShop = useMemo(() => {
        return isShopCategory(targetActivationRequest);
    }, [targetActivationRequest]);

    const activationValidation = useMemo(() => {
        return validateActivationData(
            modalState.activationData?.amount,
            modalState.activationData?.invoiceNumber
        );
    }, [modalState.activationData?.amount, modalState.activationData?.invoiceNumber]);

    // === 2. LOGICA RIFIUTO ===
    const isRejectValid = useMemo(() => {
        const reason = modalState.rejectData?.reason;
        return reason && reason.trim().length > 0;
    }, [modalState.rejectData?.reason]);

    // === 3. LOGICA CANCELLAZIONE ===
    const isCancelValid = useMemo(() => {
        const reason = modalState.cancelData?.reason;
        return reason && reason.trim().length > 0;
    }, [modalState.cancelData?.reason]);

    // === 4. LOGICA ESTENSIONE (Massiva) ===
    const criticalPartnersCount = useMemo(() => {
        // Ricalcola solo se la modale è aperta in modalità 'mass' per ottimizzare
        if (!modalState.extensionData?.isOpen || modalState.extensionData?.mode !== 'mass') return 0;
        return getCriticalPartnersCount(requests);
    }, [modalState.extensionData?.isOpen, modalState.extensionData?.mode, requests]);

    return {
        activation: {
            targetRequest: targetActivationRequest,
            isShop: isActivationShop,
            isValid: activationValidation.isValid,
            error: activationValidation.error,
            canSubmit: activationValidation.isValid
        },
        reject: {
            isValid: !!isRejectValid,
            canSubmit: !!isRejectValid
        },
        cancel: {
            isValid: !!isCancelValid,
            canSubmit: !!isCancelValid
        },
        extension: {
            criticalPartnersCount
        }
    };
};
