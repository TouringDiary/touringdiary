
import React, { useState } from 'react';
import { Database, RefreshCw, Filter, Trash2, Book, History, FileDown, Loader2 } from 'lucide-react';
import { useAdminData } from '../../../hooks/useAdminData';
import { ImportOsmModal } from './ImportOsmModal';
import { PaginationControls } from '../../common/PaginationControls';
import { useAdminExport } from '../../../hooks/useAdminExport';
import { SmartFilterDrawer } from '../../common/SmartFilterDrawer';
import { DeleteConfirmationModal } from '../../common/DeleteConfirmationModal';
import { AdminGuideModal } from '../common/AdminGuideModal';
import { useAdminStyles } from '../../../hooks/useAdminStyles';

// HOOKS MODULARI
import { useImportData } from '../../../hooks/admin/import/useImportData';
import { useImportActions } from '../../../hooks/admin/import/useImportActions';

// COMPONENTS ATOMICI
import { ImportStatsBar } from './components/ImportStatsBar';
import { ImportFilterBar } from './components/ImportFilterBar';
import { ImportActionToolbar } from './components/ImportActionToolbar';
import { ImportTable } from './components/ImportTable';
import { ImportReportModal } from './components/ImportReportModal';

export const ImportDashboard = () => {
    const { cities } = useAdminData();
    const { exportStagingCsv, isExporting } = useAdminExport();
    const { styles } = useAdminStyles();
    
    // --- 1. DATA HOOK (READ) ---
    const dataLogic = useImportData();
    
    // --- 2. ACTIONS HOOK (WRITE) ---
    const actionLogic = useImportActions({
        selectedCityId: dataLogic.selectedCityId,
        refreshData: dataLogic.refreshData,
        filtersContext: {
            statusFilter: dataLogic.statusFilter,
            searchTerm: dataLogic.searchTerm,
            filterAiRating: dataLogic.filterAiRating,
            filterRawCategories: dataLogic.filterRawCategories,
            totalItems: dataLogic.totalItems
        }
    });

    // Local UI States (Modals only)
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [showOsmModal, setShowOsmModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDeduplicateModal, setShowDeduplicateModal] = useState(false);
    const [showGuideModal, setShowGuideModal] = useState(false); 

    const activeCity = cities.find(c => c.id === dataLogic.selectedCityId);

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            dataLogic.setPage(1);
            dataLogic.refreshData();
        }
    };
    
    const onExport = () => {
        if (!dataLogic.selectedCityId || !activeCity) return;
        exportStagingCsv(dataLogic.selectedCityId, activeCity.name, dataLogic.statusFilter);
    };
    
    const onRequestBulkDelete = () => {
        if (actionLogic.selectedIds.size === 0) return;
        setShowDeleteModal(true);
    };

    const handleConfirmBulkDelete = async () => {
        await actionLogic.handleBulkDelete();
        setShowDeleteModal(false);
    };

    const handleConfirmDeduplicate = async () => {
        await actionLogic.handleDeduplicate();
        setShowDeduplicateModal(false);
    };

    const handleApplyFilters = (newFilters: any) => {
        if (newFilters.interest) {
             if (newFilters.interest === 'all' || (Array.isArray(newFilters.interest) && newFilters.interest.includes('all'))) {
                 dataLogic.setFilterAiRating([]);
             } else {
                 dataLogic.setFilterAiRating(Array.isArray(newFilters.interest) ? newFilters.interest : [newFilters.interest]);
             }
        }
        if (newFilters.rawCategories !== undefined) {
             dataLogic.setFilterRawCategories(newFilters.rawCategories);
        }
        dataLogic.setPage(1);
    };

    const activeFiltersCount = (dataLogic.filterAiRating.length > 0 ? 1 : 0) + (dataLogic.filterRawCategories.length > 0 ? 1 : 0);

    return (
        <div className="flex flex-col h-full space-y-4 animate-in fade-in">
            {/* MODALI & DRAWER */}
            {showGuideModal && <AdminGuideModal guideKey="admin_manual_cities" onClose={() => setShowGuideModal(false)} />}

            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleConfirmBulkDelete}
                title="Eliminazione Selezione"
                message={`Stai per eliminare ESCLUSIVAMENTE i ${actionLogic.selectedIds.size} elementi selezionati.\n\nL'azione è irreversibile.`}
                isDeleting={actionLogic.isBulkUpdating}
                icon={<Trash2 className="w-8 h-8 text-red-500 animate-pulse"/>}
                confirmLabel="Elimina Selezione"
            />

            <DeleteConfirmationModal
                isOpen={showDeduplicateModal}
                onClose={() => setShowDeduplicateModal(false)}
                onConfirm={handleConfirmDeduplicate}
                title="Deduplica Intelligente"
                message="Avviare la deduplica intelligente? Verranno rimossi i duplicati con meno informazioni."
                isDeleting={actionLogic.isDeduplicating}
                icon={<RefreshCw className="w-8 h-8 text-amber-500 animate-spin"/>}
                confirmLabel="Avvia Deduplica"
            />

            {activeCity && (
                <ImportOsmModal 
                    isOpen={showOsmModal} 
                    onClose={() => setShowOsmModal(false)} 
                    city={activeCity} 
                    onSuccess={dataLogic.refreshData}
                />
            )}

            <ImportReportModal report={actionLogic.report} onClose={actionLogic.closeReport} />
            
            <SmartFilterDrawer 
                isOpen={isFilterDrawerOpen}
                onClose={() => setIsFilterDrawerOpen(false)} 
                mode="staging" 
                filters={{
                    status: 'all', category: 'all', subCategory: [], minRating: 0,
                    interest: dataLogic.filterAiRating.length > 0 ? dataLogic.filterAiRating[0] : 'all',
                    priceLevel: [],
                    rawCategories: dataLogic.filterRawCategories 
                }}
                onApply={handleApplyFilters}
                resultCount={dataLogic.totalItems}
                hideStatus={true} 
                rawCategoryOptions={dataLogic.availableRawCats} 
            />

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 mb-2">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-cyan-600 rounded-xl shadow-lg"><Database className="w-8 h-8 text-white" /></div>
                    <div>
                        <h2 className={styles.admin_page_title}>Console Importazione OSM</h2>
                        <p className={styles.admin_page_subtitle}>Gestione dati grezzi (Staging Area)</p>
                    </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto items-center">
                    <button onClick={() => setShowGuideModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg transition-all border border-blue-500">
                        <Book className="w-4 h-4"/> Manuale
                    </button>

                    <select 
                        value={dataLogic.selectedCityId} 
                        onChange={(e) => dataLogic.setSelectedCityId(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:border-cyan-500 outline-none w-full md:w-64 font-bold"
                    >
                        <option value="">-- Seleziona Città --</option>
                        {cities.sort((a,b) => a.name.localeCompare(b.name)).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    
                    <button onClick={() => dataLogic.refreshData()} disabled={!dataLogic.selectedCityId} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 disabled:opacity-50 transition-colors" title="Aggiorna Lista">
                        <RefreshCw className={`w-5 h-5 ${dataLogic.isLoading ? 'animate-spin' : ''}`}/>
                    </button>
                    
                    {dataLogic.selectedCityId && <div className="h-8 w-px bg-slate-700 mx-1"></div>}
                    
                    <button onClick={() => activeCity && actionLogic.handleRecoverOrphans(activeCity.name)} disabled={!dataLogic.selectedCityId || dataLogic.isLoading} className="flex items-center gap-2 px-3 py-2 bg-indigo-950/30 hover:bg-indigo-900/50 text-indigo-400 hover:text-indigo-300 rounded-lg border border-indigo-900/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Recupera elementi staging rimasti orfani">
                        <History className="w-4 h-4"/>
                        <span className="text-[10px] font-black uppercase hidden md:inline">Recupera Orfani</span>
                    </button>
                </div>
            </div>

            {dataLogic.selectedCityId ? (
                <>
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                         <div className="flex-1 w-full">
                            <ImportStatsBar 
                                stats={dataLogic.stats} 
                                grandTotal={dataLogic.grandTotal} 
                                currentFilter={dataLogic.statusFilter} 
                                onFilterChange={dataLogic.setStatusFilter} 
                            />
                         </div>
                         <button onClick={onExport} disabled={isExporting} className="bg-slate-800 hover:bg-emerald-900/30 text-slate-300 hover:text-emerald-400 px-4 py-3 rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-2 border border-slate-700 transition-colors w-full md:w-auto h-full">
                            {isExporting ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileDown className="w-4 h-4"/>} Export CSV
                         </button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-900 p-2 rounded-xl border border-slate-800 shrink-0">
                         <ImportFilterBar 
                            searchTerm={dataLogic.searchTerm} 
                            onSearchChange={dataLogic.setSearchTerm} 
                            onKeyDown={handleSearchKeyDown}
                            activeFiltersCount={activeFiltersCount}
                            onOpenFilterDrawer={() => setIsFilterDrawerOpen(true)}
                        />
                        
                        <ImportActionToolbar 
                            selectedCount={actionLogic.selectedIds.size}
                            isExporting={isExporting} 
                            isAnalyzing={actionLogic.isAnalyzing}
                            isBulkUpdating={actionLogic.isBulkUpdating}
                            isPublishing={actionLogic.isPublishing}
                            analysisProgress={actionLogic.analysisProgress}
                            publishProgress={actionLogic.publishProgress}
                            onExport={onExport}
                            onFetchOsm={() => setShowOsmModal(true)}
                            onAiAnalysis={() => activeCity && actionLogic.handleAiAnalysis(activeCity.name)}
                            onBulkStatus={actionLogic.handleBulkStatus}
                            onPublish={() => activeCity && actionLogic.handlePublishSelected(activeCity.name)}
                            onBulkDelete={onRequestBulkDelete} 
                            onDeduplicate={() => setShowDeduplicateModal(true)}
                            isDeduplicating={actionLogic.isDeduplicating}
                        />
                    </div>

                    <ImportTable 
                        items={dataLogic.items} 
                        selectedIds={actionLogic.selectedIds}
                        isLoading={dataLogic.isLoading}
                        totalItems={dataLogic.totalItems}
                        isSelectingAll={actionLogic.isSelectingAll}
                        onSelectAll={actionLogic.handleSelectAll}
                        onToggleSelection={actionLogic.handleToggleSelection}
                        sortKey={dataLogic.sortKey}
                        sortDir={dataLogic.sortDir}
                        onSort={dataLogic.handleSort}
                    />

                    <PaginationControls 
                        currentPage={dataLogic.page} 
                        maxPage={Math.ceil(dataLogic.totalItems / dataLogic.pageSize)} 
                        onNext={() => dataLogic.setPage(p => p + 1)} 
                        onPrev={() => dataLogic.setPage(p => Math.max(1, p - 1))} 
                        totalItems={dataLogic.totalItems} 
                    />
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 border border-slate-800 border-dashed rounded-xl m-4">
                    <Filter className="w-12 h-12 mb-4 opacity-20"/>
                    <p className="font-bold uppercase tracking-widest text-sm">Seleziona una città per iniziare</p>
                </div>
            )}
        </div>
    );
};
