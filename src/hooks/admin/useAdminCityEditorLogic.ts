
import { useState, useEffect, useCallback, useRef } from 'react';
import { useCityEditor } from '../../context/CityEditorContext';
import { useSystemMessage } from '../useSystemMessage';

export const useAdminCityEditorLogic = () => {
    // Accesso ai dati dal Context (Data Layer - Single Source of Truth)
    const { city, isLoading, isSaving, isDirty, previewRequest, clearPreviewRequest, saveCity } = useCityEditor();

    // --- LOCAL UI STATE ---
    const [activeTab, setActiveTab] = useState<'general' | 'ratings' | 'culture' | 'info' | 'media' | 'pois' | 'logs'>('general');
    const [showNoLogsWarning, setShowNoLogsWarning] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    
    // --- MOUNT SAFETY (Memory Leak Protection) ---
    const isMounted = useRef(true);
    
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    // --- SYSTEM MESSAGES (DB Driven) ---
    const { getText: getMsgSave } = useSystemMessage('city_save_success');
    const { getText: getMsgPublish } = useSystemMessage('city_publish_success');
    const { getText: getMsgDraft } = useSystemMessage('city_draft_success');

    // --- ACTIONS ---

    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        if (!isMounted.current) return;
        setToast({ message, type });
        // Auto-dismiss gestito internamente
        const timer = setTimeout(() => {
            if (isMounted.current) setToast(null);
        }, 4000);
        return () => clearTimeout(timer);
    }, []);

    const closeToast = useCallback(() => {
        if (isMounted.current) setToast(null);
    }, []);

    const handleSaveRequest = useCallback(async (targetStatus?: 'published' | 'draft', skipLogsCheck = false) => {
        // 1. Guard Clause: Dati non pronti
        if (!city) {
            console.warn("Tentativo di salvataggio su città nulla.");
            return;
        }

        // 2. Business Logic: Validazione Pubblicazione
        if (targetStatus === 'published') {
            // Regola: Se non ci sono log AI e non stiamo forzando (skipLogsCheck), avvisa l'utente
            const hasLogs = city.details.generationLogs && city.details.generationLogs.length > 0;
            if (!hasLogs && !skipLogsCheck) {
                if (isMounted.current) setShowNoLogsWarning(true);
                return;
            }
        }

        // 3. Preparazione Messaggio UI
        let successMessage = "Operazione completata";
        if (targetStatus === 'published') {
            successMessage = getMsgPublish().title || "Città Pubblicata con Successo!";
        } else if (targetStatus === 'draft') {
            successMessage = getMsgDraft().title || "Bozza Salvata al Sicuro.";
        } else {
            // Salvataggio intermedio (senza cambio stato esplicito)
            successMessage = getMsgSave().title || "Modifiche Salvate.";
        }

        try {
            // 4. Esecuzione Atomica (Await critico)
            // Il context gestisce la transazione DB e l'aggiornamento stato
            const success = await saveCity(targetStatus);
            
            // 5. Post-Save UI Update (Safe Check)
            if (!isMounted.current) return;
            
            if (success) {
                showToast(successMessage, 'success');
            } else {
                showToast("Errore durante il salvataggio. Riprova.", 'error');
            }
        } catch (error: any) {
            console.error("Critical Save Error:", error);
            if (isMounted.current) {
                showToast(`Errore critico: ${error.message || 'Sconosciuto'}`, 'error');
            }
        }

    }, [city, saveCity, getMsgPublish, getMsgDraft, getMsgSave, showToast]);

    // Gestione ESC con REF per evitare churn
    const stateRef = useRef({ showNoLogsWarning, previewRequest, clearPreviewRequest });
    
    // Aggiorna ref
    useEffect(() => {
        stateRef.current = { showNoLogsWarning, previewRequest, clearPreviewRequest };
    }, [showNoLogsWarning, previewRequest, clearPreviewRequest]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                // Accesso tramite ref corrente
                const { showNoLogsWarning, previewRequest, clearPreviewRequest } = stateRef.current;
                
                if (showNoLogsWarning) {
                    setShowNoLogsWarning(false);
                    return;
                }
                if (previewRequest.type !== 'none') { 
                    clearPreviewRequest(); 
                    return;
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []); // Empty deps = stable listener

    return {
        // State
        activeTab,
        showNoLogsWarning,
        toast,
        
        // Context Passthrough (Data Layer)
        city,
        isLoading,
        isSaving,
        isDirty,
        previewRequest,

        // Setters (UI Logic)
        setActiveTab,
        setShowNoLogsWarning,
        
        // Actions
        handleSaveRequest,
        showToast,
        closeToast,
        clearPreviewRequest
    };
};
