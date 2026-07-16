
import { useState } from 'react';
import { PointOfInterest, SponsorRequest } from '../types/index';
import { getTodayDateString } from '../services/sponsors/_internalTypes';

/** Somma giorni a una data calendario YYYY-MM-DD in UTC, senza shift timezone locale. */
const addCalendarDays = (isoDate: string, days: number): string => {
    const [year, month, day] = isoDate.split('-').map(Number);
    const utc = new Date(Date.UTC(year, month - 1, day + days));
    return utc.toISOString().split('T')[0];
};

/** Differenza in giorni tra due date calendario YYYY-MM-DD (UTC). */
const calendarDaysBetween = (fromIso: string, toIso: string): number => {
    const [y1, m1, d1] = fromIso.split('-').map(Number);
    const [y2, m2, d2] = toIso.split('-').map(Number);
    const from = Date.UTC(y1, m1 - 1, d1);
    const to = Date.UTC(y2, m2 - 1, d2);
    return Math.round((to - from) / (1000 * 60 * 60 * 24));
};

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
    reason: string;
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
        days: 30,
        reason: '',
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
            days: 3,
            reason: '',
        });
    };

    const openSingleExtension = (id: string, currentEndDate: string) => {
        const baseDate = currentEndDate || getTodayDateString();
        const newDateStr = addCalendarDays(baseDate, 30);

        setExtensionData({
            isOpen: true,
            mode: 'single',
            id,
            currentExpirationDate: currentEndDate || 'N/A',
            newExpirationDate: newDateStr,
            days: 30,
            reason: '',
        });
    };

    const closeExtension = () => {
        setExtensionData(prev => ({ ...prev, isOpen: false }));
    };

    const setExtensionDays = (days: number) => {
        let newDate = '';
        if (extensionData.currentExpirationDate && extensionData.currentExpirationDate !== 'N/A') {
            newDate = addCalendarDays(extensionData.currentExpirationDate, days);
        }
        setExtensionData(prev => ({ ...prev, days, newExpirationDate: newDate }));
    };

    const setExtensionDate = (date: string) => {
        let days = 0;
        if (extensionData.currentExpirationDate && extensionData.currentExpirationDate !== 'N/A' && date) {
            days = calendarDaysBetween(extensionData.currentExpirationDate, date);
        }
        setExtensionData(prev => ({ ...prev, newExpirationDate: date, days }));
    };

    const setExtensionReason = (reason: string) => {
        setExtensionData(prev => ({ ...prev, reason }));
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
            openMassExtension, openSingleExtension, closeExtension, setExtensionDays, setExtensionDate, setExtensionReason
        }
    };
};
