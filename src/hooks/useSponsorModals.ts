
import { useState } from 'react';
import { PointOfInterest, SponsorRequest } from '../types/index';

function sponsorRequestToPreviewPoi(request: SponsorRequest): PointOfInterest {
    return {
        id: request.poiId ?? request.id,
        name: request.companyName,
        description: request.description ?? '',
        imageUrl: request.imageUrl ?? '',
        image_status: request.image_status,
        category: request.poiCategory ?? 'discovery',
        subCategory: request.poiSubCategory,
        rating: 0,
        votes: 0,
        coords: {
            lat: request.coordsLat ?? 0,
            lng: request.coordsLng ?? 0,
        },
        cityId: request.cityId,
        address: request.address,
    };
}

export interface ActivationData {
    id: string | null;
    pricingVersionId: string | null;
    startDate?: string;
    duration?: string;
    amount?: number;
    invoiceNumber?: string;
}

export interface RejectData {
    id: string | null;
    reason: string;
    notes: string;
}

export interface CancelData {
    id: string | null;
    reason: string;
}

export interface ExtensionData {
    isOpen: boolean;
    mode: 'mass' | 'single';
    id: string | null;
    currentExpirationDate: string;
    newExpirationDate: string;
    days: number;
}

export interface CrmIdentity {
    profileId?: string | null;
    vat?: string | null;
    email?: string | null;
    requestId?: string | null;
}

export const useSponsorModals = () => {
    const [activationData, setActivationData] = useState<ActivationData | null>(null);
    const [rejectData, setRejectData] = useState<RejectData | null>(null);
    const [cancelData, setCancelData] = useState<CancelData | null>(null);
    const [previewPoi, setPreviewPoi] = useState<PointOfInterest | null>(null);
    const [partnerCrmIdentity, setPartnerCrmIdentity] = useState<CrmIdentity | null>(null);
    
    const [extensionData, setExtensionData] = useState<ExtensionData>({
        isOpen: false,
        mode: 'mass',
        id: null,
        currentExpirationDate: '',
        newExpirationDate: '',
        days: 30
    });

    // --- ACTIONS ---

    // Activation
    const openActivation = (id: string, pricingVersionId: string) => {
        setActivationData({
            id,
            pricingVersionId
        });
    };
    const closeActivation = () => setActivationData(null);
    const updateActivation = (data: Partial<ActivationData>) => {
        setActivationData(prev => prev ? { ...prev, ...data } : null);
    };

    // Reject
    const openReject = (id: string) => setRejectData({ id, reason: '', notes: '' });
    const closeReject = () => setRejectData(null);
    const updateReject = (data: Partial<RejectData>) => {
        setRejectData(prev => prev ? { ...prev, ...data } : null);
    };

    // Cancel
    const openCancel = (id: string) => setCancelData({ id, reason: '' });
    const closeCancel = () => setCancelData(null);
    const updateCancel = (reason: string) => {
        setCancelData(prev => prev ? { ...prev, reason } : null);
    };

    // Preview
    const openPreview = (request: SponsorRequest) => setPreviewPoi(sponsorRequestToPreviewPoi(request));
    const closePreview = () => setPreviewPoi(null);

    // CRM
    const openCrm = (identity: CrmIdentity) => setPartnerCrmIdentity(identity);
    const closeCrm = () => setPartnerCrmIdentity(null);

    // Extension
    const openMassExtension = () => {
        setExtensionData({
            isOpen: true,
            mode: 'mass',
            id: null,
            currentExpirationDate: '',
            newExpirationDate: '',
            days: 3
        });
    };

    const openSingleExtension = (id: string, currentEndDate: string) => {
        // Default: Add 30 days
        let newDateStr = '';
        if (currentEndDate) {
            const d = new Date(currentEndDate);
            d.setDate(d.getDate() + 30);
            newDateStr = d.toISOString().split('T')[0];
        } else {
            // Fallback if no end date
            const d = new Date();
            d.setDate(d.getDate() + 30);
            newDateStr = d.toISOString().split('T')[0];
        }
        
        setExtensionData({
            isOpen: true,
            mode: 'single',
            id,
            currentExpirationDate: currentEndDate || 'N/A',
            newExpirationDate: newDateStr,
            days: 30
        });
    };

    const closeExtension = () => {
        setExtensionData(prev => ({ ...prev, isOpen: false }));
    };

    const setExtensionDays = (days: number) => {
        let newDate = '';
        if (extensionData.currentExpirationDate && extensionData.currentExpirationDate !== 'N/A') {
            const d = new Date(extensionData.currentExpirationDate);
            d.setDate(d.getDate() + days);
            newDate = d.toISOString().split('T')[0];
        }
        setExtensionData(prev => ({ ...prev, days, newExpirationDate: newDate }));
    };

    const setExtensionDate = (date: string) => {
        let days = 0;
        if (extensionData.currentExpirationDate && extensionData.currentExpirationDate !== 'N/A' && date) {
            const start = new Date(extensionData.currentExpirationDate);
            const end = new Date(date);
            const diffTime = end.getTime() - start.getTime();
            days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        setExtensionData(prev => ({ ...prev, newExpirationDate: date, days }));
    };

    const partnerCrmVat = partnerCrmIdentity?.vat || null;

    return {
        state: {
            activationData,
            rejectData,
            cancelData,
            previewPoi,
            partnerCrmVat,
            partnerCrmIdentity,
            extensionData
        },
        actions: {
            openActivation, closeActivation, updateActivation,
            openReject, closeReject, updateReject,
            openCancel, closeCancel, updateCancel,
            openPreview, closePreview,
            openCrm, closeCrm,
            openMassExtension, openSingleExtension, closeExtension, setExtensionDays, setExtensionDate
        }
    };
};
