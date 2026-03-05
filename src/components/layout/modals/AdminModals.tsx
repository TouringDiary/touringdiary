
import React from 'react';
import { CheckCircle, RefreshCw } from 'lucide-react';
import { saveSinglePoi } from '../../../services/cityService';
import { PointOfInterest } from '../../../types/index';

// Lazy Imports per Admin
const AdminDashboard = React.lazy(() => import('../../admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const AdminPoiModal = React.lazy(() => import('../../admin/AdminPoiModal').then(module => ({ default: module.AdminPoiModal })));
const SponsorModal = React.lazy(() => import('../../modals/SponsorModal').then(module => ({ default: module.SponsorModal })));

interface AdminModalsProps {
    activeModal: string | null;
    modalProps: any;
    closeModal: () => void;
    openModal: (type: string, props?: any) => void;
    user: any;
    activeCityId: string | null;
    activeCitySummary: any;
    onUserUpdate: (u: any) => void;
    onNavigate: (section: any) => void; // Per tornare alla app dall'admin
}

export const AdminModals = ({ 
    activeModal, modalProps, closeModal, openModal, 
    user, activeCityId, activeCitySummary, onUserUpdate, onNavigate 
}: AdminModalsProps) => {

    const handleAdminSave = async (updatedPoi: PointOfInterest) => {
        if (!user || (user.role !== 'admin_all' && user.role !== 'admin_limited')) return;
        const targetCityId = updatedPoi.cityId || activeCityId || 'napoli';
        try {
            await saveSinglePoi(updatedPoi, targetCityId, user);
            openModal('adminSuccess'); 
        } catch (e) {
            console.error("Save error", e);
            alert("Errore salvataggio POI.");
        }
    };

    const handleReload = () => {
        window.dispatchEvent(new CustomEvent('refresh-city-data', { detail: { cityId: activeCityId } }));
        closeModal();
    };

    if (!activeModal) return null;

    // Nota: AdminDashboard di solito è una vista full-screen gestita da AppRouter, 
    // ma se viene aperta come modale (es. overlay), la gestiamo qui.
    // Attualmente AppRouter gestisce viewMode='admin', quindi questo case potrebbe essere ridondante 
    // ma lo teniamo per sicurezza o future implementazioni popup.
    
    return (
        <>
            {activeModal === 'adminEditPoi' && modalProps.poi && (
                <AdminPoiModal 
                    isOpen={true} 
                    onClose={closeModal} 
                    onSave={handleAdminSave} 
                    poi={modalProps.poi} 
                    cityName={activeCitySummary?.name || ''} 
                />
            )}

            {activeModal === 'sponsor' && (
                <SponsorModal 
                    isOpen={true} 
                    onClose={closeModal} 
                    user={user} 
                    initialTier={modalProps.sponsorTier} 
                    initialType={modalProps.sponsorType} 
                />
            )}

            {activeModal === 'adminSuccess' && (
                <div className="fixed inset-0 z-[3500] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-slate-900 border border-emerald-500/50 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl relative overflow-hidden animate-in zoom-in-95">
                         <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] mx-auto mb-6">
                            <CheckCircle className="w-8 h-8 text-emerald-500"/>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Salvataggio Completato</h3>
                        <p className="text-slate-300 text-sm mb-6">POI Aggiornato con successo.<br/>I dati sono stati salvati nel cloud.</p>
                        <button onClick={handleReload} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 uppercase tracking-wide text-xs transition-all active:scale-95">
                            <RefreshCw className="w-4 h-4"/> OK, Aggiorna Vista
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};
