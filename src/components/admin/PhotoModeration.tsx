
import React from 'react';
import { Camera, CheckCircle2, AlertTriangle, X, MapPin, Edit3, Loader2, Trash2 } from 'lucide-react';
import { User as UserType } from '../../types/users';
import { usePhotoModeration } from '../../hooks/admin/usePhotoModeration';
import { PhotoFilters } from './photos/PhotoFilters';
import { PhotoTable } from './photos/PhotoTable';
import { AdminPhotoInspector } from './AdminPhotoInspector';
import { useAdminStyles } from '../../hooks/useAdminStyles'; // IMPORTATO STYLES

// Toast Locale (Mantenuto qui o spostato in shared se preferisci, per ora qui va bene)
const PhotoToast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
    <div className={`fixed top-6 right-6 z-[2000] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 border ${type === 'success' ? 'bg-emerald-600 border-emerald-400' : 'bg-red-600 border-red-400'} text-white max-w-md`}>
        {type === 'success' ? <CheckCircle2 className="w-6 h-6 shrink-0"/> : <AlertTriangle className="w-6 h-6 shrink-0"/>}
        <div className="font-bold text-sm leading-snug">{message}</div>
        <button onClick={onClose} className="ml-4 hover:bg-white/20 p-1 rounded-full"><X className="w-4 h-4"/></button>
    </div>
);

interface PhotoModerationProps {
    currentUser: UserType;
    onUpdate?: () => void;
}

export const PhotoModeration = ({ currentUser, onUpdate }: PhotoModerationProps) => {
    const { styles } = useAdminStyles(); // USATO STILI DINAMICI
    // USE HOOK
    const {
        filteredList,
        isLoading,
        filterStatus, setFilterStatus,
        filterCity, setFilterCity,
        sortDir, setSortDir,
        cityOptions,
        
        isInspectorOpen, setIsInspectorOpen,
        photoToEdit, setPhotoToEdit,
        metadataModal, setMetadataModal,
        deleteTarget, setDeleteTarget,
        isDeleting,
        isUploading,
        uploadStep,
        toast, setToast,
        fileInputRef,
        isSuperAdmin,

        handleFileUpload,
        handleStatusUpdate,
        requestDelete,
        confirmDelete,
        handleInspectorSave,
        saveMetadata
    } = usePhotoModeration({ currentUser, onUpdate });

    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-500">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500"/>
                <p className="font-bold uppercase tracking-widest text-xs">Sincronizzazione Cloud...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 flex flex-col h-full animate-in fade-in relative">
            
            {toast && <PhotoToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            {/* DELETE CONFIRMATION MODAL */}
            {deleteTarget && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-red-500/50 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative animate-in zoom-in-95">
                        <div className="flex flex-col items-center text-center gap-4">
                            <AlertTriangle className="w-16 h-16 text-red-500 animate-pulse"/>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2 font-display">Eliminare Foto?</h3>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    Stai per cancellare definitivamente la foto di <br/>
                                    <strong className="text-white">"{deleteTarget.locationName}"</strong>.
                                    <br/>L'azione è irreversibile.
                                </p>
                            </div>
                            <div className="flex gap-3 w-full mt-2">
                                <button 
                                    onClick={() => setDeleteTarget(null)} 
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors"
                                >
                                    Annulla
                                </button>
                                <button 
                                    onClick={confirmDelete} 
                                    disabled={isDeleting} 
                                    className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>} 
                                    Elimina
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* INSPECTOR MODAL */}
            {isInspectorOpen && photoToEdit && (
                <AdminPhotoInspector 
                    isOpen={true}
                    imageUrl={photoToEdit.url}
                    initialData={{ 
                        locationName: photoToEdit.locationName, 
                        user: photoToEdit.user,
                        description: photoToEdit.description
                    }}
                    onClose={() => { setIsInspectorOpen(false); setPhotoToEdit(null); }}
                    onSave={handleInspectorSave}
                    mode="moderation"
                />
            )}
            
            <div className="flex justify-between items-center mb-2 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-600 rounded-xl shadow-lg">
                        <Camera className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className={styles.admin_page_title}>Foto & Moderazione</h2>
                        <p className={styles.admin_page_subtitle}>Gestisci i contributi visivi della community</p>
                    </div>
                </div>
            </div>

            <PhotoFilters 
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                filterCity={filterCity}
                setFilterCity={setFilterCity}
                cityOptions={cityOptions}
                sortDir={sortDir}
                setSortDir={setSortDir}
                onUploadClick={() => fileInputRef.current?.click()}
                fileInputRef={fileInputRef}
                isUploading={isUploading}
                uploadStep={uploadStep}
                onFileChange={handleFileUpload}
            />

            <PhotoTable 
                photos={filteredList}
                manifest={cityOptions} // Reuse options as they contain minimal city data needed
                isSuperAdmin={isSuperAdmin}
                actions={{
                    onStatusUpdate: handleStatusUpdate,
                    onDeleteRequest: requestDelete,
                    onOpenInspector: (photo) => { setPhotoToEdit(photo); setIsInspectorOpen(true); },
                    onOpenMetadata: (photo) => setMetadataModal({ isOpen: true, photoId: photo.id, description: photo.description || '', locationName: photo.locationName || '' })
                }}
            />
            
            {/* METADATA EDIT MODAL */}
            {metadataModal && (
                <div className="fixed inset-0 z-[2200] bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white flex items-center gap-2"><Edit3 className="w-4 h-4 text-indigo-500"/> Modifica Dati Foto</h3>
                            <button onClick={() => setMetadataModal(null)}><X className="w-5 h-5 text-slate-500 hover:text-white"/></button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Città (Location Name)</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-500"/>
                                    <select 
                                        value={metadataModal.locationName} 
                                        onChange={e => setMetadataModal({...metadataModal, locationName: e.target.value})} 
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:border-indigo-500 outline-none appearance-none"
                                    >
                                        <option value="">Seleziona Città...</option>
                                        {cityOptions.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Descrizione</label>
                                <textarea 
                                    value={metadataModal.description} 
                                    onChange={e => setMetadataModal({...metadataModal, description: e.target.value})} 
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-indigo-500 outline-none h-24 resize-none"
                                    placeholder="Descrivi la foto..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end mt-6">
                            <button onClick={saveMetadata} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase shadow-lg transition-colors flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4"/> Salva Modifiche
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
