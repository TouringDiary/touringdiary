
import React from 'react';
import { Store, CheckCircle, Bell, AlertTriangle, X, Info } from 'lucide-react';
import { SponsorDashboardOverview } from './SponsorDashboardOverview';
import { useSponsorLogic } from '../../hooks/useSponsorLogic';
import { useSponsorExport } from '../../hooks/useSponsorExport';
import { useSponsorOperations } from '../../hooks/useSponsorOperations'; 
import { SponsorFilters } from './SponsorFilters';
import { SponsorToolbar } from './sponsor/SponsorToolbar';
import { SponsorBulkActions } from './sponsor/SponsorBulkActions';
import { SponsorTable } from './sponsor/SponsorTable';
import { SponsorModals } from './sponsor/SponsorModals';
import { User } from '../../types/users';
import { useAdminStyles } from '../../hooks/useAdminStyles'; 
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';

interface SponsorManagerProps {
    currentUser?: User;
}

export const SponsorManager = ({ currentUser }: SponsorManagerProps) => {
    
    // --- 1. DATA HOOK (READ ONLY) ---
    const {
        requests,           
        manifest,           
        stats,              
        activeTab,          
        setActiveTab,       
        isLoading,          
        
        // Filtri & Paginazione
        filters,            
        sortConfig,         
        page, pageSize, totalItems,
        searchTerm,         
        options,            
        
        // Setters
        setSortConfig, 
        setSearchTerm, 
        setOnlyUnread, 
        handleContinentChange, handleNationChange, handleAdminRegionChange, 
        handleZoneChange, handleCityChange, handleTierChange, 
        setPageSize, handlePageChange,
        
        // Refresh Action
        refreshData         
    } = useSponsorLogic();
    
    // --- 2. OPERATIONS HOOK (WRITE ONLY) ---
    const {
        toast,                  
        deleteTarget,           
        isDeleting,             
        selectedIds,            
        isBulkDeleting,         
        showBulkDeleteModal,    
        modalState,             
        
        setDeleteTarget,        
        setShowBulkDeleteModal, 
        
        toggleSelection,        
        toggleAllPage,          
        resetSelection,         
        
        // CRUD Handlers
        handleInitialApproval,
        confirmActivation,
        confirmRejection,
        confirmCancellation,
        confirmExtension,
        handleDeleteRequest,
        confirmDelete,
        handleBulkDeleteClick,
        confirmBulkDelete,
        
        modalActions            
    } = useSponsorOperations({ refreshData });

    // --- 3. EXPORT HOOK ---
    const { exportToCSV } = useSponsorExport();
    
    // --- 4. STYLES HOOK ---
    const { styles } = useAdminStyles();

    const handleSectionNavigation = (cityId: string, statusTab: 'pending' | 'waiting' | 'approved' | 'rejected', filterUnread: boolean) => {
        setActiveTab(statusTab);
        handleCityChange(cityId);
        setOnlyUnread(filterUnread);
    };

    const isSuperAdmin = currentUser?.role === 'admin_all';

    return (
        <div className="space-y-6 flex flex-col h-full relative animate-in fade-in">
            
            {/* --- FEEDBACK TOAST --- */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[3000] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 border ${toast.type === 'success' ? 'bg-emerald-600 border-emerald-400' : toast.type === 'error' ? 'bg-red-600 border-red-400' : 'bg-blue-600 border-blue-400'} text-white`}>
                    {toast.type === 'success' ? <CheckCircle className="w-6 h-6"/> : toast.type === 'error' ? <AlertTriangle className="w-6 h-6"/> : <Info className="w-6 h-6"/>}
                    <div className="font-bold text-sm">{toast.message}</div>
                </div>
            )}

            {/* --- SINGLE DELETE MODAL --- */}
            <DeleteConfirmationModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Eliminare Sponsor?"
                message={`Stai per cancellare definitivamente "${deleteTarget?.name}".\n\nTutti i dati storici e CRM andranno persi.`}
                isDeleting={isDeleting}
            />

            {/* --- BULK DELETE MODAL --- */}
            <DeleteConfirmationModal
                isOpen={showBulkDeleteModal}
                onClose={() => setShowBulkDeleteModal(false)}
                onConfirm={confirmBulkDelete}
                title="Eliminazione Multipla"
                message={`Stai per cancellare definitivamente ${selectedIds.size} sponsor.\n\nQuesta operazione è IRREVERSIBILE.`}
                isDeleting={isBulkDeleting}
            />
            
            {/* --- FLOATING BULK ACTIONS --- */}
            <SponsorBulkActions 
                isVisible={selectedIds.size > 0}
                selectedCount={selectedIds.size}
                onBulkDelete={handleBulkDeleteClick}
                isBulkDeleting={isBulkDeleting}
                onResetSelection={resetSelection}
            />

            {/* --- PAGE HEADER --- */}
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-600 rounded-xl shadow-lg">
                        <Store className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className={styles.admin_page_title}>Attività & Sponsor</h2>
                            {stats.pending > 0 && (
                                <span className="bg-rose-600 text-white text-xs font-black px-2 py-1 rounded-full shadow-lg animate-pulse">
                                    {stats.pending} DA GESTIRE
                                </span>
                            )}
                        </div>
                        <p className={styles.admin_page_subtitle}>Gestione Contratti e Pagamenti</p>
                    </div>
                </div>
            </div>

            {/* --- TOOLBAR (COMPONENTE ATOMICO) --- */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shrink-0">
                <SponsorToolbar 
                    isVisible={activeTab !== 'dashboard'}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onExport={() => exportToCSV(requests)}
                    onMassExtension={modalActions.openMassExtension}
                    isSuperAdmin={isSuperAdmin}
                    selectedCount={selectedIds.size}
                    totalOnPage={requests.length}
                    areAllSelected={requests.length > 0 && requests.every(r => selectedIds.has(r.id))}
                    onToggleAll={() => toggleAllPage(requests)}
                    onBulkDeleteClick={handleBulkDeleteClick}
                    isBulkDeleting={isBulkDeleting}
                    pageSize={pageSize}
                    onPageSizeChange={(size) => { setPageSize(size); handlePageChange(1); }}
                    onlyUnread={filters.onlyUnread}
                    onToggleUnread={() => setOnlyUnread(!filters.onlyUnread)}
                    sortConfig={sortConfig}
                    onSortChange={setSortConfig}
                />
            </div>

            {/* --- FILTRI DROPDOWN --- */}
            <div className="shrink-0 overflow-x-auto">
                <SponsorFilters 
                    filters={{ 
                        continent: filters.continent, 
                        nation: filters.nation, 
                        adminRegion: filters.adminRegion, 
                        zone: filters.zone, 
                        city: filters.city, 
                        tier: filters.tier 
                    }} 
                    options={options} 
                    handlers={{ 
                        onContinentChange: handleContinentChange, 
                        onNationChange: handleNationChange, 
                        onAdminRegionChange: handleAdminRegionChange, 
                        onZoneChange: handleZoneChange, 
                        onCityChange: handleCityChange, 
                        onTierChange: handleTierChange 
                    }} 
                />
            </div>

            {/* --- TAB NAVIGATOR --- */}
            <div className="flex justify-between items-center bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0 overflow-x-auto">
                <div className="flex gap-1 w-full min-w-max">
                    {[ 
                        { id: 'dashboard', label: 'Dashboard', count: null, color: 'indigo' }, 
                        { id: 'pending', label: 'NUOVE RICHIESTE', count: stats.pending, color: 'amber' }, 
                        { id: 'waiting', label: 'ATTESA PAGAMENTI', count: stats.waiting, color: 'blue' }, 
                        { id: 'approved', label: 'SPONSOR ATTIVI', count: stats.approved, color: 'emerald' }, 
                        { id: 'rejected', label: 'SPONSOR RIFIUTATI', count: stats.rejected, color: 'slate' }, 
                        { id: 'cancelled', label: 'SPONSOR ANNULLATI', count: stats.cancelled, color: 'slate' } 
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id as any)} 
                            className={`flex-1 min-w-[100px] px-3 py-2 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === tab.id ? `bg-${tab.color}-600 text-white shadow-lg` : 'text-slate-500 hover:text-white'}`}
                        >
                            {tab.label}
                            {tab.count !== null && tab.count > 0 && <span className="bg-white text-black px-1.5 rounded-full text-[9px]">{tab.count}</span>}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* --- CONTENT AREA --- */}
            <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
                {activeTab === 'dashboard' ? (
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <SponsorDashboardOverview requests={requests} onNavigate={handleSectionNavigation} />
                    </div>
                ) : (
                    <SponsorTable 
                        requests={requests} 
                        allRequests={requests} 
                        manifest={manifest} 
                        onInitialApproval={handleInitialApproval} 
                        onReject={modalActions.openReject} 
                        onActivate={modalActions.openActivation} 
                        onOpenCrm={modalActions.openCrm} 
                        onPreview={(req) => modalActions.openPreview({ ...req } as any)} 
                        onExtend={(id) => { const req = requests.find(r => r.id === id); if (req?.endDate) modalActions.openSingleExtension(id, req.endDate); }} 
                        onCancel={modalActions.openCancel}
                        onDelete={handleDeleteRequest}
                        isSuperAdmin={isSuperAdmin}
                        currentPage={page}
                        maxPage={Math.ceil(totalItems / pageSize)}
                        onNext={() => handlePageChange(page + 1)}
                        onPrev={() => handlePageChange(page - 1)}
                        totalItems={totalItems}
                        selectedIds={selectedIds}
                        onToggleSelection={toggleSelection}
                    />
                )}
            </div>

            {/* --- CENTRALIZED MODAL MANAGER (ATOMICO) --- */}
            <SponsorModals 
                state={modalState} 
                actions={modalActions} 
                onConfirmActivation={confirmActivation} 
                onConfirmReject={confirmRejection} 
                onConfirmCancel={confirmCancellation} 
                onConfirmExtension={confirmExtension} 
                onDataChange={refreshData} 
                sponsorsList={requests}
                user={currentUser}
            />
        </div>
    );
};
