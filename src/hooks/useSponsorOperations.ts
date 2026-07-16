import { useState, useCallback } from 'react';
import { 
    deleteSponsor, 
    deleteSponsorsBulk, 
    updateSponsorStatus, 
    getSponsorById,
    activateSponsorFromRequestAsync,
    rejectSponsor, 
    cancelSponsor,
    updateSponsorExpiration,
    extendAllActiveSponsors
} from '../services/sponsorService';
import { useSponsorModals } from './useSponsorModals';
import { SponsorRequest } from '../types/index';
import { validateActivationData } from '../utils/sponsorValidation';

interface UseSponsorOperationsProps {
    refreshData: () => void; // Funzione di callback per ricaricare la UI dopo una mutazione
}

/**
 * useSponsorOperations - THE MUSCLE
 * Gestisce tutte le scritture, i modali di conferma e i feedback (Toast).
 */
export const useSponsorOperations = ({ refreshData }: UseSponsorOperationsProps) => {
    // UI State for Feedback
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' | 'error' } | null>(null);
    
    // Deletion State
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Bulk Action State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

    // Modal Manager Hook (Delegato)
    const { state: modalState, actions: modalActions } = useSponsorModals();

    // Helper Toast
    const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
        setToast({ message, type });
        // Auto-dismiss
        setTimeout(() => setToast(null), 4000);
    }, []);

    // --- SELECTION LOGIC ---
    const toggleSelection = useCallback((id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    }, [selectedIds]);

    const toggleAllPage = useCallback((requestsOnPage: SponsorRequest[]) => {
        const allOnPageIds = requestsOnPage.map(r => r.id);
        const allSelected = allOnPageIds.length > 0 && allOnPageIds.every(id => selectedIds.has(id));
        
        const newSet = new Set(selectedIds);
        if (allSelected) {
            allOnPageIds.forEach(id => newSet.delete(id));
        } else {
            allOnPageIds.forEach(id => newSet.add(id));
        }
        setSelectedIds(newSet);
    }, [selectedIds]);

    const resetSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    // --- CRUD OPERATIONS ---

    // 1. Approvazione Iniziale (Pending -> Waiting Payment)
    const handleInitialApproval = async (id: string) => { 
        try {
            await updateSponsorStatus(id, 'waiting_payment'); 
            showToast("Richiesta approvata. In attesa di pagamento.", 'success');
            setTimeout(() => refreshData(), 300); // Small delay to allow DB propagation
        } catch (e: any) {
            console.error(e);
            showToast("Errore durante l'approvazione.", 'error');
        }
    };

    // 2. Attivazione (Waiting -> Approved)
    const confirmActivation = async () => { 
        // Recupera i dati della richiesta dal modale.
        const { id: requestId, amount, invoiceNumber } = modalState.activationData || {};

        if (!requestId) {
            showToast("ID richiesta non specificato.", 'error');
            return;
        }

        // DOUBLE VALIDATION
        const validation = validateActivationData(amount, invoiceNumber);
        if (validation.isValid === false) {
            showToast(validation.error, 'error');
            return;
        }

        try {
            // 1. Recupera i dati completi della richiesta originale
            const requestData = await getSponsorById(requestId);
            if (!requestData) {
                throw new Error(`Dati della richiesta sponsor con ID ${requestId} non trovati.`);
            }

            if (!requestData.pricingVersionId) {
                throw new Error('Versione listino (pricingVersionId) mancante nella richiesta.');
            }

            // Validazione: assicurarsi che il tier (plan_key) esista sui dati della richiesta
            if (!requestData.tier) {
                throw new Error(`'tier' (plan_key) è mancante nei dati della richiesta, impossibile attivare.`);
            }

            await activateSponsorFromRequestAsync(
                requestId,
                requestData.pricingVersionId,
                validation.amount,
                validation.invoiceNumber,
            );

            // Successo: mostra feedback e aggiorna l'interfaccia
            showToast(`Sponsor "${requestData.companyName}" attivato con successo!`, 'success');
            modalActions.closeActivation(); 
            setTimeout(() => refreshData(), 300);

        } catch (e: any) {
            console.error("Errore nel processo di attivazione sponsor:", e);
            showToast(`Errore di attivazione: ${e.message}`, 'error');
        }
    };

    // 3. Rifiuto (Pending -> Rejected)
    const confirmRejection = async () => { 
        const { id, reason, notes } = modalState.rejectData || {};
        if (id && reason) { 
            try {
                await rejectSponsor(id, reason, notes || ''); 
                modalActions.closeReject(); 
                showToast('Richiesta rifiutata correttamente.', 'info');
                setTimeout(() => refreshData(), 300);
            } catch (e: any) {
                console.error(e);
                showToast("Errore durante il rifiuto.", 'error');
            }
        }
    };

    // 4. Cancellazione/Terminazione (Approved -> Cancelled)
    const confirmCancellation = async () => { 
        const { id, reason } = modalState.cancelData || {};
        if (id && reason) { 
            try {
                await cancelSponsor(id, reason); 
                modalActions.closeCancel(); 
                showToast('Contratto terminato.', 'info');
                setTimeout(() => refreshData(), 300);
            } catch (e: any) {
                console.error(e);
                showToast("Errore cancellazione contratto.", 'error');
            }
        }
    };

    // 5. Estensione (Single & Mass)
    const confirmExtension = async (excludeCritical: boolean = false) => {
        const { mode, id, newExpirationDate, days, reason } = modalState.extensionData;
        const trimmedReason = reason.trim();

        if (!trimmedReason) {
            showToast('Motivazione obbligatoria per estensione contratto.', 'error');
            return;
        }
        if (!days || days <= 0) {
            showToast('I giorni di estensione devono essere maggiori di zero.', 'error');
            return;
        }

        try {
            if (mode === 'single' && id && newExpirationDate) {
                await updateSponsorExpiration(id, newExpirationDate, trimmedReason);
                showToast('Scadenza aggiornata.', 'success');
            } else if (mode === 'mass') {
                if (selectedIds.size === 0) {
                    showToast('Seleziona almeno uno sponsor con le checkbox.', 'error');
                    return;
                }
                const result = await extendAllActiveSponsors(
                    Array.from(selectedIds),
                    days,
                    trimmedReason,
                    excludeCritical,
                );
                const count = result.count;
                const skipped = result.skipped ?? 0;
                if (excludeCritical && skipped > 0) {
                    showToast(`Estesi ${count} sponsor. Saltati ${skipped} critici.`, 'success');
                } else {
                    showToast(`Estesi ${count} sponsor selezionati.`, 'success');
                }
                resetSelection();
            }
            modalActions.closeExtension();
            setTimeout(() => refreshData(), 500);
        } catch (e: unknown) {
            console.error(e);
            const message = e instanceof Error ? e.message : "Errore durante l'estensione.";
            showToast(message, 'error');
        }
    };

    // --- DELETE LOGIC (HARD DELETE) ---

    const handleDeleteRequest = (id: string, name: string) => {
        setDeleteTarget({ id, name });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await deleteSponsor(deleteTarget.id);
            setDeleteTarget(null);
            showToast("Sponsor eliminato definitivamente dal database.", 'success');
            
            // Check if deleted item was selected
            if (selectedIds.has(deleteTarget.id)) {
                const newSet = new Set(selectedIds);
                newSet.delete(deleteTarget.id);
                setSelectedIds(newSet);
            }
            
            setTimeout(() => refreshData(), 300);
        } catch (e: any) {
            console.error("Delete Error:", e);
            showToast("Errore durante l'eliminazione.", 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBulkDeleteClick = () => {
        if (selectedIds.size > 0) {
            setShowBulkDeleteModal(true);
        }
    };

    const confirmBulkDelete = async () => {
        setIsBulkDeleting(true);
        try {
            await deleteSponsorsBulk(Array.from(selectedIds));
            showToast(`Eliminati ${selectedIds.size} record.`, 'success');
            setSelectedIds(new Set());
            setShowBulkDeleteModal(false);
            setTimeout(() => refreshData(), 500);
        } catch (e: any) {
            console.error("Bulk Delete Error:", e);
            showToast("Errore eliminazione multipla.", 'error');
        } finally {
            setIsBulkDeleting(false);
        }
    };

    return {
        // State
        toast,
        deleteTarget,
        isDeleting,
        selectedIds,
        isBulkDeleting,
        showBulkDeleteModal,
        modalState, // Expose internal modal state

        // Setters (Exposed for specific UI interactions)
        setDeleteTarget,
        setShowBulkDeleteModal,

        // Actions
        toggleSelection,
        toggleAllPage,
        resetSelection,
        handleInitialApproval,
        confirmActivation,
        confirmRejection,
        confirmCancellation,
        confirmExtension,
        handleDeleteRequest,
        confirmDelete,
        handleBulkDeleteClick,
        confirmBulkDelete,
        
        // Modal Actions Proxy (Open/Close)
        modalActions
    };
};
