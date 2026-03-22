
import { useState, useCallback } from 'react';
import { useCityEditor } from '@/context/CityEditorContext';
import { useSystemMessage } from './useSystemMessage';

type EditorTab = 'general' | 'ratings' | 'culture' | 'info' | 'media' | 'pois' | 'logs';

export const useCityEditorForm = () => {
    // Accesso ai dati dal Context esistente
    const { city, saveCity } = useCityEditor();

    // --- LOCAL UI STATE ---
    const [activeTab, setActiveTab] = useState<EditorTab>('general');
    const [showPublishBlocker, setShowPublishBlocker] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // --- SYSTEM MESSAGES ---
    const { getText: getMsgSave } = useSystemMessage('city_save_success');
    const { getText: getMsgPublish } = useSystemMessage('city_publish_success');
    const { getText: getMsgDraft } = useSystemMessage('city_draft_success');

    // --- ACTIONS ---

    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        // Auto-dismiss
        setTimeout(() => setToast(null), 4000);
    }, []);

    const closeToast = useCallback(() => {
        setToast(null);
    }, []);

    const handleSaveRequest = useCallback((targetStatus?: 'published' | 'draft') => {
        if (!city) return;

        // VALIDAZIONE DI BUSINESS: Blocco pubblicazione se nessun POI è attivo
        if (targetStatus === 'published') {
            const publishedPoiCount = city.details.allPois
                ? city.details.allPois.filter(p => p.status === 'published').length
                : 0;

            if (publishedPoiCount === 0) {
                setShowPublishBlocker(true);
                return;
            }
        }

        // Determinazione Messaggio di Successo
        let successMessage = "";
        if (targetStatus === 'published') {
            successMessage = getMsgPublish().title || "Città Pubblicata!";
        } else if (targetStatus === 'draft') {
            successMessage = getMsgDraft().title || "Bozza Salvata.";
        } else {
            // Salvataggio generico (senza cambio stato esplicito)
            successMessage = getMsgSave().title || "Salvataggio effettuato!";
        }

        // Esecuzione tramite Context
        saveCity(targetStatus, successMessage);
        
        // Se non è stato un blocco, chiudi eventuali modali di blocco aperti (safety)
        setShowPublishBlocker(false);

    }, [city, saveCity, getMsgPublish, getMsgDraft, getMsgSave]);

    return {
        // State
        activeTab,
        showPublishBlocker,
        toast,
        
        // Setters
        setActiveTab,
        setShowPublishBlocker,
        
        // Actions
        handleSaveRequest,
        showToast,
        closeToast
    };
};
