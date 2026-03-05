
import React, { useState, useEffect } from 'react';
import { X, Save, MapPin, Camera, Award, Link, Info, AlertCircle, Plus, History, ImageOff, Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { PointOfInterest } from '../../types/index';
import { usePoiForm } from '../../hooks/usePoiForm';
import { PoiInfoTab } from './poiModal/PoiInfoTab';
import { PoiMediaTab } from './poiModal/PoiMediaTab';
import { PoiLogisticsTab } from './poiModal/PoiLogisticsTab';
import { PoiMarketingTab } from './poiModal/PoiMarketingTab';
import { PoiLinksTab } from './poiModal/PoiLinksTab';
import { deleteSinglePoi } from '../../services/cityService';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';

interface AdminPoiModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (poi: PointOfInterest) => void;
    poi: PointOfInterest | null;
    cityName?: string;
}

export const AdminPoiModal = ({ isOpen, onClose, onSave, poi, cityName }: AdminPoiModalProps) => {
    // USE CUSTOM HOOK
    const { 
        formData, isDirty, setIsImageValid, isLocating, 
        updateField, updateCoord, updateAffiliate, handleAutoLocate, validate, isMissingAsset 
    } = usePoiForm(poi, cityName);

    const [activeTab, setActiveTab] = useState<'info' | 'media' | 'logistics' | 'marketing' | 'links'>('info');
    const [showConfirmClose, setShowConfirmClose] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setActiveTab('info');
            setShowConfirmClose(false);
            setValidationError(null);
            setShowDeleteConfirm(false);
        }
    }, [isOpen]);

    const handleCloseAttempt = () => {
        if (isDirty) setShowConfirmClose(true);
        else onClose();
    };

    // ESC Key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                if (showDeleteConfirm) setShowDeleteConfirm(false);
                else if (validationError) setValidationError(null);
                else if (showConfirmClose) setShowConfirmClose(false);
                else handleCloseAttempt();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, showConfirmClose, isDirty, validationError, showDeleteConfirm]);

    const handleSaveClick = () => {
        const error = validate();
        if (error) {
            setValidationError(error);
            if (error.includes("Sottocategoria")) setActiveTab('info');
            return;
        }
        onSave(formData);
    };

    // FIX: Changed from window.location.reload() to soft refresh event
    const handleDelete = async () => {
        if (!poi) return;
        setIsDeleting(true);
        try {
            await deleteSinglePoi(poi.id);
            
            // Trigger soft refresh for the current city
            window.dispatchEvent(new CustomEvent('refresh-city-data', { 
                detail: { cityId: poi.cityId } 
            }));
            
            onClose(); // Close modal immediately
        } catch (e) {
            console.error(e);
            alert("Errore durante l'eliminazione.");
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const formatMetaDate = (isoStr?: string) => {
        if (!isoStr) return '--';
        return new Date(isoStr).toLocaleString('it-IT', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    const handleAutoLocateWrapper = async () => {
        const res = await handleAutoLocate();
        if (res.error) alert(res.error);
    };

    if (!isOpen) return null;

    return (
        // FIX: z-[3000] per coprire nav tab (z-1020). pt-24 per scendere sotto header.
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 pt-24 md:p-6">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={handleCloseAttempt}></div>
            
            {validationError && (
                <div className="absolute inset-0 z-[3600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
                    <div className="bg-slate-900 border border-red-500/50 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl relative overflow-hidden animate-in zoom-in-95">
                         <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)] mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse"/>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Errore Validazione</h3>
                        <p className="text-slate-300 text-sm mb-6 font-bold">{validationError}</p>
                        <button 
                            onClick={() => setValidationError(null)}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl shadow-lg uppercase tracking-wide text-xs transition-all border border-slate-600"
                        >
                            Chiudi e Correggi
                        </button>
                    </div>
                </div>
            )}

            {showConfirmClose && (
                <div className="absolute inset-0 z-[3500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-2xl max-w-sm w-full text-center">
                        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2"/>
                        <h3 className="text-lg font-bold text-white mb-1">Modifiche non salvate</h3>
                        <div className="flex gap-3 w-full mt-4">
                            <button onClick={onClose} className="flex-1 py-2 bg-red-900/30 text-red-400 border border-red-900/50 rounded-lg font-bold text-xs uppercase">Esci</button>
                            <button onClick={() => setShowConfirmClose(false)} className="flex-1 py-2 bg-slate-800 text-white rounded-lg font-bold text-xs uppercase">Annulla</button>
                        </div>
                    </div>
                </div>
            )}
            
            <DeleteConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Eliminare POI?"
                message={`Stai per eliminare definitivamente "${formData.name}". L'azione è irreversibile.`}
                isDeleting={isDeleting}
            />

            <div className="relative bg-slate-900 w-full max-w-5xl h-full md:h-auto md:max-h-[85vh] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-[#0f172a]">
                    <h3 className="text-2xl font-bold text-white font-display">{poi ? 'Modifica POI' : 'Nuovo POI'}</h3>
                    <div className="flex items-center gap-3">
                         <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                             <button onClick={() => updateField('status', 'published')} disabled={isMissingAsset} className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${formData.status === 'published' ? 'bg-emerald-600 text-white shadow' : isMissingAsset ? 'text-slate-600 cursor-not-allowed' : 'text-slate-500 hover:text-white'}`}>Pubblico</button>
                             <button onClick={() => updateField('status', 'draft')} className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${formData.status === 'draft' ? 'bg-amber-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}>Bozza</button>
                             <button onClick={() => updateField('status', 'needs_check')} className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${formData.status === 'needs_check' ? 'bg-red-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}>Check</button>
                         </div>
                        
                        {poi && (
                            <button 
                                onClick={() => setShowDeleteConfirm(true)}
                                className="p-2 bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-500 rounded-lg transition-colors border border-slate-700 hover:border-red-500/30"
                                title="Elimina POI"
                            >
                                <Trash2 className="w-5 h-5"/>
                            </button>
                        )}
                        
                        <button onClick={handleCloseAttempt} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"><X className="w-6 h-6"/></button>
                    </div>
                </div>

                <div className="px-6 py-3 border-b border-slate-800 bg-slate-900 overflow-x-auto">
                    <div className="flex gap-2">
                        {[{ id: 'info', label: 'Info Base', icon: Info }, { id: 'media', label: 'Media', icon: Camera }, { id: 'logistics', label: 'Logistica', icon: MapPin }, { id: 'marketing', label: 'Marketing', icon: Award }, { id: 'links', label: 'Affiliazioni', icon: Link }].map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}>
                                <tab.icon className="w-4 h-4"/> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#020617]">
                    
                    {isMissingAsset && (
                        <div className="mb-6 bg-red-900/20 border-2 border-red-500 rounded-xl p-4 flex items-start gap-4 animate-pulse">
                            <div className="p-2 bg-red-500 rounded-full text-white shrink-0"><ImageOff className="w-6 h-6"/></div>
                            <div><h4 className="text-red-400 font-bold uppercase text-sm mb-1">Asset Mancante</h4><p className="text-slate-300 text-xs">Manca foto o placeholder per "{formData.category}". Pubblicazione bloccata.</p></div>
                        </div>
                    )}

                    {activeTab === 'info' && (
                        <PoiInfoTab formData={formData} updateField={updateField} />
                    )}

                    {activeTab === 'media' && (
                        <PoiMediaTab formData={formData} updateField={updateField} setIsImageValid={setIsImageValid} />
                    )}

                    {activeTab === 'logistics' && (
                        <PoiLogisticsTab 
                            formData={formData} 
                            updateField={updateField} 
                            updateCoord={updateCoord} 
                            handleAutoLocate={handleAutoLocateWrapper} 
                            isLocating={isLocating} 
                        />
                    )}

                    {activeTab === 'marketing' && (
                        <PoiMarketingTab formData={formData} updateField={updateField} />
                    )}

                    {activeTab === 'links' && (
                        <PoiLinksTab formData={formData} updateAffiliate={updateAffiliate} cityName={cityName} />
                    )}
                </div>

                <div className="p-4 border-t border-slate-800 bg-[#0f172a] flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex gap-6 text-[10px] text-slate-500 font-mono self-start md:self-center">
                        <div className="flex items-center gap-2" title="Data Creazione"><Plus className="w-3 h-3 text-emerald-500"/> <span className="text-slate-400 font-bold">{formData.createdBy || 'Sistema'}</span> <span className="opacity-60">| {formatMetaDate(formData.createdAt)}</span></div>
                        <div className="flex items-center gap-2" title="Ultima Modifica"><History className="w-3 h-3 text-amber-500"/> <span className="text-slate-400 font-bold">{formData.updatedBy || 'Sistema'}</span> <span className="opacity-60">| {formatMetaDate(formData.updatedAt)}</span></div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button onClick={handleSaveClick} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold shadow-xl transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95 w-full md:w-auto">
                            <Save className="w-5 h-5"/> Salva Modifiche
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
