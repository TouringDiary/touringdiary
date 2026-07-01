
import { useState, useEffect, useCallback, useRef } from 'react';
import { useCityEditor } from '@/context/CityEditorContext';
import { useSystemMessage } from '../useSystemMessage';
import { CityDetails } from '../../types/index';

const hasAiGenerationLogs = (city: CityDetails): boolean =>
    Array.isArray(city.details.generationLogs) && city.details.generationLogs.length > 0;

export const useAdminCityEditorLogic = () => {
    const { city, isLoading, isSaving, isDirty, previewRequest, clearPreviewRequest, saveCity } = useCityEditor();

    const [activeTab, setActiveTab] = useState<'general' | 'ratings' | 'culture' | 'info' | 'media' | 'pois' | 'logs'>('general');
    const [showNoAiContentConfirm, setShowNoAiContentConfirm] = useState(false);
    const [pendingSaveStatus, setPendingSaveStatus] = useState<'published' | 'draft' | null>(null);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const { getText: getMsgSave } = useSystemMessage('city_save_success');
    const { getText: getMsgPublish } = useSystemMessage('city_publish_success');
    const { getText: getMsgDraft } = useSystemMessage('city_draft_success');

    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        if (!isMounted.current) return;
        setToast({ message, type });
        setTimeout(() => {
            if (isMounted.current) setToast(null);
        }, 4000);
    }, []);

    const closeToast = useCallback(() => {
        if (isMounted.current) setToast(null);
    }, []);

    const resolveSuccessMessage = useCallback((targetStatus?: 'published' | 'draft'): string => {
        if (targetStatus === 'published') {
            return getMsgPublish().title || 'Città Pubblicata con Successo!';
        }
        if (targetStatus === 'draft') {
            return getMsgDraft().title || 'Bozza Salvata al Sicuro.';
        }
        return getMsgSave().title || 'Modifiche Salvate.';
    }, [getMsgPublish, getMsgDraft, getMsgSave]);

    const executeSave = useCallback(async (targetStatus?: 'published' | 'draft') => {
        if (!city) {
            showToast('Impossibile salvare: dati città non disponibili.', 'error');
            return;
        }

        const successMessage = resolveSuccessMessage(targetStatus);

        try {
            const success = await saveCity(targetStatus);
            if (!isMounted.current) return;

            if (success) {
                showToast(successMessage, 'success');
            } else {
                showToast('Errore durante il salvataggio. Riprova.', 'error');
            }
        } catch (error: unknown) {
            console.error('Critical Save Error:', error);
            if (isMounted.current) {
                const message = error instanceof Error ? error.message : 'Sconosciuto';
                showToast(`Errore critico: ${message}`, 'error');
            }
        }
    }, [city, saveCity, resolveSuccessMessage, showToast]);

    const handleSaveRequest = useCallback(async (targetStatus?: 'published' | 'draft') => {
        if (!city) {
            showToast('Impossibile salvare: dati città non disponibili.', 'error');
            return;
        }

        const requiresAiConfirm =
            targetStatus === 'published' &&
            !hasAiGenerationLogs(city);

        if (requiresAiConfirm) {
            setPendingSaveStatus(targetStatus);
            setShowNoAiContentConfirm(true);
            return;
        }

        await executeSave(targetStatus);
    }, [city, executeSave, showToast]);

    const confirmNoAiContentSave = useCallback(async () => {
        const status = pendingSaveStatus;
        setShowNoAiContentConfirm(false);
        setPendingSaveStatus(null);
        if (status) {
            await executeSave(status);
        }
    }, [pendingSaveStatus, executeSave]);

    const cancelNoAiContentSave = useCallback(() => {
        setShowNoAiContentConfirm(false);
        setPendingSaveStatus(null);
    }, []);

    const previewRef = useRef({ previewRequest, clearPreviewRequest });

    useEffect(() => {
        previewRef.current = { previewRequest, clearPreviewRequest };
    }, [previewRequest, clearPreviewRequest]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                const { previewRequest, clearPreviewRequest } = previewRef.current;
                if (previewRequest.type !== 'none') {
                    clearPreviewRequest();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return {
        activeTab,
        showNoAiContentConfirm,
        pendingSaveStatus,
        toast,

        city,
        isLoading,
        isSaving,
        isDirty,
        previewRequest,

        setActiveTab,

        handleSaveRequest,
        confirmNoAiContentSave,
        cancelNoAiContentSave,
        showToast,
        closeToast,
        clearPreviewRequest,
    };
};
