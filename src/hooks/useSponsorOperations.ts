import { useState, useCallback } from 'react';
import { 
    deleteSponsor, 
    deleteSponsorsBulk, 
    updateSponsorStatus, 
    getSponsorById,
    createSponsorFromRequest,
    activateSponsorWithResourceAsync,
    rejectSponsor, 
    cancelSponsor,
    updateSponsorExpiration,
    extendAllActiveSponsors
} from '../services/sponsorService';
import { useSponsorModals } from './useSponsorModals';
import { SponsorRequest } from '../types/index';
import { validateActivationData } from '../utils/sponsorValidation';

/** Tipo di ritorno per l'estensione massiva degli sponsor */
type ExtensionResult = {
    count: number;
    skipped?: number;
};

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
        if (!validation.isValid) {
            showToast(validation.error || "Dati di attivazione non validi.", 'error');
            return;
        }

        try {
            // 1. Recupera i dati completi della richiesta originale
            const requestData = await getSponsorById(requestId);
            if (!requestData) {
                throw new Error(`Dati della richiesta sponsor con ID ${requestId} non trovati.`);
            }
            
            // Validazione: assicurarsi che il tier (plan_key) esista sui dati della richiesta
            if (!requestData.tier) {
                throw new Error(`'tier' (plan_key) è mancante nei dati della richiesta, impossibile chiamare la RPC.`);
            }

            // 2. Crea il record nella tabella 'sponsors'
            const newSponsor = await createSponsorFromRequest(requestData);
            if (!newSponsor?.id) {
                throw new Error("Creazione del record sponsor fallita. L'ID non è stato restituito.");
            }

            // 3. Chiama la RPC atomica (Crea risorsa UI + Attiva sottoscrizione)
            await activateSponsorWithResourceAsync(
                newSponsor.id, 
                requestId, 
                requestData.pricingVersionId || '',
                requestData.profileId // NEW: Pass profileId for ownership linkage
            );

            // 4. Successo: mostra feedback e aggiorna l'interfaccia
            showToast(`Sponsor "${newSponsor.companyName}" attivato con successo!`, 'success');
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
        const { mode, id, newExpirationDate, days } = modalState.extensionData;
        try {
            if (mode === 'single' && id && newExpirationDate) { 
                await updateSponsorExpiration(id, newExpirationDate); 
                showToast('Scadenza aggiornata.', 'success');
            } else if (mode === 'mass') { 
                const result = await extendAllActiveSponsors(days, excludeCritical) as ExtensionResult;
                const count = result?.count ?? 0;
                const skipped = result?.skipped ?? 0;
                if (excludeCritical && skipped > 0) {
                    showToast(`Estesi ${count} sponsor. Saltati ${skipped} critici.`, 'success');
                } else {
                    showToast(`Estesi ${count} sponsor attivi.`, 'success');
                }
            }
            modalActions.closeExtension();
            setTimeout(() => refreshData(), 500);
        } catch (e: any) {
            console.error(e);
            showToast("Errore durante l'estensione.", 'error');
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
