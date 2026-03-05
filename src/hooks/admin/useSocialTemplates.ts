
import { useState, useEffect, useCallback } from 'react';
import { SocialTemplate, SocialLayoutConfig } from '../../types/index';
import { SystemMessageTemplate, getSystemMessagesAsync, saveSystemMessageAsync } from '../../services/communicationService';
import { getSocialTemplates, saveSocialTemplate, deleteSocialTemplate } from '../../services/socialMarketingService';

export const useSocialTemplates = () => {
    // Data State
    const [templates, setTemplates] = useState<SocialTemplate[]>([]);
    const [viralTemplates, setViralTemplates] = useState<SystemMessageTemplate[]>([]);
    const [activeTemplate, setActiveTemplate] = useState<SocialTemplate | null>(null);
    
    // Status Flags
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Feedback & Modals
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null);

    // Initial Load
    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Parallel Fetch
            const [tpls, msgs] = await Promise.all([
                getSocialTemplates(),
                getSystemMessagesAsync()
            ]);
            
            setTemplates(tpls);
            
            // Filter Viral Templates
            const viral = msgs.filter(m => m.key === 'social_share_global');
            setViralTemplates(viral);
            
        } catch (e) {
            console.error("Error loading social templates", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // --- ACTIONS ---

    const selectTemplate = (t: SocialTemplate) => {
        setActiveTemplate(t);
    };

    const clearActiveTemplate = () => {
        setActiveTemplate(null);
    };

    // Save Graphical Template
    const saveGraphicsTemplate = async (name: string, bgUrl: string, layout: SocialLayoutConfig) => {
        setIsSaving(true);
        try {
            const newTpl: any = {
                id: activeTemplate?.id || crypto.randomUUID(),
                name: name,
                bgUrl: bgUrl,
                layoutConfig: layout,
                theme: 'custom',
                isActive: true
            };

            const result = await saveSocialTemplate(newTpl);
            
            if (result.success && result.data) {
                await loadData(); // Refresh list
                setActiveTemplate(result.data); 
                setShowSuccessModal(true);
                setTimeout(() => setShowSuccessModal(false), 3000);
                return true;
            } else {
                alert(`Errore Salvataggio DB:\n${result.error}`);
                return false;
            }
        } catch (e) {
            console.error(e);
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    // Save Viral Text Template
    const saveViralTemplate = async (tpl: SystemMessageTemplate) => {
        try {
            await saveSystemMessageAsync(tpl);
            await loadData();
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
        } catch (e) {
            alert("Errore salvataggio messaggio virale.");
        }
    };

    // Initialize Default Viral Template (if missing)
    const initDefaultViral = async () => {
        const defaultViral: SystemMessageTemplate = {
            key: 'social_share_global',
            type: 'external',
            label: 'Condivisione Virale (Default)',
            titleTemplate: 'Scopri Touring Diary!',
            bodyTemplate: "Sto organizzando il mio viaggio in Campania con Touring Diary! È gratis e fantastico. Usa il mio codice {code} per avere crediti extra.\n\nLink: {url}",
            variables: ['code', 'url'],
            deviceTarget: 'all'
        };
        await saveViralTemplate(defaultViral);
    };

    // Delete Management
    const requestDelete = (id: string, name: string) => {
        setDeleteTarget({ id, name });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await deleteSocialTemplate(deleteTarget.id);
            // If deleting active one, notify parent (logic handled in UI via checking IDs)
            if (activeTemplate?.id === deleteTarget.id) {
                setActiveTemplate(null);
            }
            await loadData();
            setDeleteTarget(null);
        } catch (e) {
            console.error(e);
            alert("Errore durante l'eliminazione.");
        } finally {
            setIsDeleting(false);
        }
    };

    const closeModals = () => {
        setShowSuccessModal(false);
        setDeleteTarget(null);
    };

    return {
        // Data
        templates,
        viralTemplates,
        activeTemplate,
        
        // Status
        isLoading,
        isSaving,
        isDeleting,
        
        // Modals State
        showSuccessModal,
        deleteTarget,

        // Actions
        loadData,
        selectTemplate,
        clearActiveTemplate,
        saveGraphicsTemplate,
        saveViralTemplate,
        initDefaultViral,
        requestDelete,
        confirmDelete,
        closeModals
    };
};
