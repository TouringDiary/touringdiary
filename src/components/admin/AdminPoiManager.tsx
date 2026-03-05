
import React, { useState, useEffect } from 'react';
import { usePoiManager } from '../../hooks/usePoiManager';
import { PoiToolbar } from './poiManager/PoiToolbar';
import { PoiList } from './poiManager/PoiList';
import { SmartFilterDrawer } from '../common/SmartFilterDrawer';
import { AdminPoiModal } from './AdminPoiModal';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { AdminTaxonomyManager } from './AdminTaxonomyManager';
import { User, PointOfInterest } from '../../types/index';
import { X } from 'lucide-react';
import { useCityGenerator } from '../../hooks/useCityGenerator';
import { ProcessLogModal } from './cities/ProcessLogModal';

export interface AdminPoiManagerProps {
    cityId: string;
    cityName: string;
    currentUser: User;
}

export const AdminPoiManager: React.FC<AdminPoiManagerProps> = ({ cityId, cityName, currentUser }) => {
    // 1. USE AGGREGATOR HOOK
    const { state, actions, counts } = usePoiManager(cityId, cityName);
    
    // 2. AI GENERATOR HOOK (Per bonifica e discovery)
    const generator = useCityGenerator(() => {
        // Callback a fine processo: ricarica i dati
        actions.refreshData();
    });

    // 3. UI STATES (Modals & Drawers)
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [isTaxonomyOpen, setIsTaxonomyOpen] = useState(false);
    const [editingPoi, setEditingPoi] = useState<PointOfInterest | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [previewPoi, setPreviewPoi] = useState<PointOfInterest | null>(null);
    
    // Delete States (Local for UI confirmation)
    const [deleteTarget, setDeleteTarget] = useState<PointOfInterest | null>(null);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [showProcessLog, setShowProcessLog] = useState(false);

    const isSuperAdmin = currentUser?.role === 'admin_all';

    useEffect(() => {
        if (generator.isProcessing) setShowProcessLog(true);
    }, [generator.isProcessing]);

    // --- UI HANDLERS ---

    const handleOpenEdit = (poi: PointOfInterest | null) => {
        setEditingPoi(poi);
        setIsEditModalOpen(true);
    };

    const handleSavePoi = async (poi: PointOfInterest) => {
        const success = await actions.savePoi(poi, currentUser);
        if (success) {
            setIsEditModalOpen(false);
            setEditingPoi(null);
        }
    };

    const handleDeleteRequest = (poi: PointOfInterest) => {
        setDeleteTarget(poi);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        await actions.deletePoi(deleteTarget.id);
        setDeleteTarget(null);
    };
    
    const handleBulkStatus = (status: 'published' | 'draft') => {
        actions.bulkStatusChange(status, currentUser);
    };

    const handleBulkDeleteRequest = () => {
        setShowBulkDeleteModal(true);
    };

    const confirmBulkDelete = async () => {
        await actions.bulkDelete();
        setShowBulkDeleteModal(false);
    };

    // --- AI BRIDGE HANDLERS ---

    const handleAiGen = async (count?: number, categories?: {id:string, label:string}[]) => {
        if (count && categories && categories.length > 0) {
            // Modalità "Search New POI" (Flash Discovery)
            await generator.generateDraftsOnly(cityId, cityName, count, categories, currentUser);
        } else {
            console.warn("Chiamata AI Gen senza parametri");
        }
    };

    // *** NEW: BONIFICA MIRATA ***
    const handleFixPois = async () => {
        if (state.selectedIds.size === 0) {
            alert("Seleziona almeno un elemento da bonificare.");
            return;
        }
        
        await generator.verifyDraftsBatch(
            cityId, 
            cityName, 
            currentUser, 
            undefined, // No category filter
            Array.from(state.selectedIds) // Target IDs
        );
        
        actions.resetSelection();
    };

    return (
        <div className="space-y-6 relative pb-24 h-full flex flex-col">
            
            {/* MODALS */}
            <AdminPoiModal 
                isOpen={isEditModalOpen} 
                onClose={() => { setIsEditModalOpen(false); setEditingPoi(null); }} 
                onSave={handleSavePoi} 
                poi={editingPoi} 
                cityName={cityName} 
            />

            <DeleteConfirmationModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Eliminare POI?"
                message={`Stai per eliminare "${deleteTarget?.name}".`}
                isDeleting={state.isDeleting}
            />

            <DeleteConfirmationModal
                isOpen={showBulkDeleteModal}
                onClose={() => setShowBulkDeleteModal(false)}
                onConfirm={confirmBulkDelete}
                title="Eliminazione Multipla"
                message={`Stai per eliminare ${state.selectedIds.size} elementi.`}
                isDeleting={state.isBulkProcessing}
            />

            <ProcessLogModal 
                isOpen={showProcessLog}
                onClose={() => { setShowProcessLog(false); actions.refreshData(); }}
                isProcessing={generator.isProcessing}
                logs={generator.processLog}
                reports={generator.stepReports}
                cityName={cityName}
            />

            {isTaxonomyOpen && (
                <div className="fixed inset-0 z-[3000] bg-slate-950 flex flex-col">
                     <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                         <h2 className="text-white font-bold">Gestione Tassonomia</h2>
                         <button onClick={() => setIsTaxonomyOpen(false)}><X className="w-6 h-6 text-white"/></button>
                     </div>
                     <div className="flex-1 overflow-hidden">
                         <AdminTaxonomyManager />
                     </div>
                </div>
            )}

            <PoiToolbar 
                state={{...state, isGenerating: generator.isProcessing}} 
                counts={counts} 
                cityName={cityName} 
                cityId={cityId} 
                currentUser={currentUser} 
                actions={{ 
                    ...actions, 
                    openFilterDrawer: () => setIsFilterDrawerOpen(true), 
                    openNewModal: () => handleOpenEdit(null), 
                    executeAiGeneration: handleAiGen, 
                    fixSelectedPois: handleFixPois,
                    openTaxonomy: () => setIsTaxonomyOpen(true),
                    bulkResetImages: () => actions.bulkResetImages(currentUser),
                    // Pass-through standard actions are already in `actions`
                }} 
            />

            <PoiList 
                pois={state.pois} 
                selectedIds={state.selectedIds} 
                isLoading={state.isLoading} 
                page={state.page} 
                totalItems={state.totalItems} 
                pageSize={state.pageSize} 
                sortBy={state.sortBy} 
                isBulkProcessing={state.isBulkProcessing} 
                viewStatus={state.viewStatus} 
                actions={{ 
                    toggleSelection: actions.toggleSelection, 
                    onEdit: handleOpenEdit, 
                    onPreview: setPreviewPoi, 
                    onDeleteRequest: handleDeleteRequest, 
                    setPage: actions.setPage, 
                    setPageSize: actions.setPageSize,
                    bulkStatusChange: handleBulkStatus, 
                    bulkDelete: handleBulkDeleteRequest, 
                    resetSelection: actions.resetSelection, 
                    resetFiltersAndReload: actions.resetFiltersAndReload 
                }} 
                isSuperAdmin={!!isSuperAdmin} 
            />

            <SmartFilterDrawer 
                isOpen={isFilterDrawerOpen}
                onClose={() => setIsFilterDrawerOpen(false)}
                filters={{
                    status: state.viewStatus,
                    category: (state.activeCategory || 'all') as string,
                    subCategory: (state.filterSubCategory as string[]) || [],
                    minRating: Number(state.filterRating || 0),
                    interest: (state.filterInterest.length > 0 ? state.filterInterest[0] : 'all')
                }}
                onApply={(val: any) => {
                    // Mapping local filter inputs to hook actions
                    const input = val as { subCategory?: string[], minRating?: number, interest?: string };
                    if (input && input.subCategory && Array.isArray(input.subCategory)) {
                        actions.setFilterSubCategory(input.subCategory);
                    }
                    if (input && input.minRating !== undefined) {
                        actions.setFilterRating(Number(input.minRating));
                    }
                    if (input && input.interest !== undefined) {
                        actions.setFilterInterest(input.interest === 'all' ? [] : [input.interest]);
                    }
                    actions.setPage(1);
                }}
                resultCount={state.totalItems}
                availableItems={state.allCityPois} 
                hideStatus={true} 
                hideCategory={state.activeCategory !== 'all'}
            />
        </div>
    );
};
