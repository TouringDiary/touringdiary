
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
    fetchCommunityPhotos, 
    updatePhotoStatusInDb, 
    updatePhotoData, 
    uploadCommunityPhoto, 
    deletePhotoSubmissionInDb
} from '../../services/photoService';

// IMPORT DAL NUOVO SERVIZIO PONTE (No Cycle!)
import { propagatePhotoRemoval, syncPhotoDescriptionToCity } from '../../services/mediaConsistencyService';

import { getFullManifestAsync, getCityDetails, saveCityDetails } from '../../services/cityService';
import { addNotification } from '../../services/notificationService';
import { generateImageCaption } from '../../services/ai/aiVision';
import { compressImage, dataURLtoFile } from '../../utils/common';
import { PhotoSubmission, CitySummary, User } from '../../types/index';

type SortKey = 'date' | 'updatedAt' | 'locationName' | 'user' | 'status';

interface UsePhotoModerationProps {
    currentUser: User;
    onUpdate?: () => void;
}

export const usePhotoModeration = ({ currentUser, onUpdate }: UsePhotoModerationProps) => {
    // DATA STATE
    const [photos, setPhotos] = useState<PhotoSubmission[]>([]);
    const [manifest, setManifest] = useState<CitySummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // FILTER & SORT STATE
    const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected' | 'city_deleted'>('pending');
    const [filterCity, setFilterCity] = useState<string>('');
    const [sortKey, setSortKey] = useState<SortKey>('date');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    // UI & MODAL STATE
    const [isInspectorOpen, setIsInspectorOpen] = useState(false);
    const [photoToEdit, setPhotoToEdit] = useState<PhotoSubmission | null>(null);
    const [metadataModal, setMetadataModal] = useState<{ isOpen: boolean, photoId: string, description: string, locationName: string } | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string, url: string, locationName: string, description: string } | null>(null);
    
    // PROCESS STATE
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStep, setUploadStep] = useState<string>('');
    const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const isSuperAdmin = currentUser.role === 'admin_all';

    // INITIAL LOAD
    useEffect(() => {
        refreshPhotos();
        getFullManifestAsync().then(setManifest);
    }, []);

    // AUTO DISMISS TOAST
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    const refreshPhotos = async () => {
        setIsLoading(true);
        try {
            const allPhotos = await fetchCommunityPhotos();
            setPhotos(allPhotos);
            if (onUpdate) onUpdate();
        } catch (e) {
            console.error("Error loading photos:", e);
            showToast("Errore nel caricamento delle foto", 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // --- COMPUTED VALUES ---

    const cityOptions = useMemo(() => {
        return manifest.sort((a,b) => a.name.localeCompare(b.name));
    }, [manifest]);

    const filteredList = useMemo(() => {
        let list = photos.filter(p => p.status === filterStatus);

        if (filterCity) {
            list = list.filter(p => p.locationName.toLowerCase().includes(filterCity.toLowerCase()));
        }

        list.sort((a,b) => {
            let valA: any = a[sortKey];
            let valB: any = b[sortKey];

            if (sortKey === 'date' || sortKey === 'updatedAt') {
                valA = new Date(valA || 0).getTime();
                valB = new Date(valB || 0).getTime();
            } else if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }

            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return list;
    }, [photos, filterStatus, filterCity, sortKey, sortDir]);

    // --- ACTIONS ---

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadStep('Compressione...');

        try {
            const base64 = await compressImage(file);
            const compressedFile = dataURLtoFile(base64, file.name);
            
            setUploadStep('Analisi AI...');
            const aiCaption = await generateImageCaption(base64, `Caricamento manuale per ${file.name}`);
            const finalDesc = aiCaption ? `${aiCaption} (${file.name})` : `[${file.name}] Caricamento manuale admin`;

            setUploadStep('Salvataggio...');
            await uploadCommunityPhoto(
                compressedFile,
                currentUser.id.startsWith('u_') ? currentUser.id : 'admin_manual', 
                currentUser.name || 'Admin',
                'Da assegnare',
                finalDesc
            );
            
            await refreshPhotos();
            if (fileInputRef.current) fileInputRef.current.value = '';
            showToast("Foto caricata e auto-descritta con successo.", 'success');
        } catch (error) {
            console.error("Errore upload:", error);
            showToast("Errore nel caricamento del file.", 'error');
        } finally {
            setIsUploading(false);
            setUploadStep('');
        }
    };

    const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected' | 'pending') => {
        const photo = photos.find(p => p.id === id);
        
        if (status === 'approved' && photo) {
            const cityMatch = manifest.find(c => photo.locationName.toLowerCase().trim() === c.name.toLowerCase().trim());
            
            if (!cityMatch) {
                 showToast(`Impossibile approvare: La città "${photo.locationName}" non esiste nel database attivo.`, 'error');
                 return;
            }

            // Sync to City Gallery
            try {
                const fullCity = await getCityDetails(cityMatch.id);
                if (fullCity) {
                    const currentGallery = fullCity.details.gallery || [];
                    // Simple deduplication check
                    if (!currentGallery.includes(photo.url)) {
                        fullCity.details.gallery = [photo.url, ...currentGallery];
                        await saveCityDetails(fullCity);
                    }
                }
            } catch (e) {
                console.warn("Could not sync to city gallery", e);
            }

            // XP & Notification
            if (photo.userId && !photo.userId.startsWith('admin')) {
                if (photo.status !== 'approved') {
                    addNotification(
                        photo.userId,
                        'reward_unlocked',
                        'Foto Approvata!',
                        `La tua foto su ${photo.locationName} è stata pubblicata. Hai guadagnato +20 XP!`,
                        { 
                            section: 'city', 
                            targetId: cityMatch.id, 
                            tab: 'galleria' 
                        }
                    );
                }
            }
        }
        
        // Use Bridge for removal
        if ((status === 'rejected' || status === 'pending') && photo && photo.status === 'approved') {
            await propagatePhotoRemoval(photo.url, photo.locationName, photo.description);
        }
        
        // Optimistic UI update
        setPhotos(prev => prev.map(p => p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p));
        
        await updatePhotoStatusInDb(id, status);
        if (onUpdate) onUpdate();
    };

    const requestDelete = (photo: PhotoSubmission) => {
        if (!isSuperAdmin) return;
        setDeleteTarget({ 
            id: photo.id, 
            name: photo.locationName || 'Foto', 
            url: photo.url, 
            locationName: photo.locationName,
            description: photo.description || ''
        });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await propagatePhotoRemoval(deleteTarget.url, deleteTarget.locationName, deleteTarget.description);
            await deletePhotoSubmissionInDb(deleteTarget.id);
            
            setPhotos(prev => prev.filter(p => p.id !== deleteTarget.id));
            if (onUpdate) onUpdate();
            
            setDeleteTarget(null);
            showToast("Foto eliminata definitivamente.", 'success');
        } catch (e: any) {
            console.error("Errore cancellazione:", e);
            showToast(`ERRORE CRITICO DB: ${e.message}`, 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleInspectorSave = async (data: { image: string }) => {
        if (photoToEdit) {
            await updatePhotoDataInDb(photoToEdit.id, { 
                url: data.image
            });
            refreshPhotos();
            setIsInspectorOpen(false);
            setPhotoToEdit(null);
            showToast("Dati foto aggiornati.", 'success');
        }
    };

    const saveMetadata = async () => {
        if (metadataModal) {
            try {
                // 1. Aggiorna DB Foto
                await updatePhotoDataInDb(metadataModal.photoId, { 
                    description: metadataModal.description,
                    locationName: metadataModal.locationName
                });
                
                // 2. Sincronizza DB Città (Cross-Update via Bridge)
                const photo = photos.find(p => p.id === metadataModal.photoId);
                if (photo) {
                     await syncPhotoDescriptionToCity(photo.url, metadataModal.description, metadataModal.locationName);
                }

                setPhotos(prev => prev.map(p => p.id === metadataModal.photoId ? { ...p, description: metadataModal.description, locationName: metadataModal.locationName } : p));
                setMetadataModal(null);
                showToast("Metadati aggiornati e sincronizzati.", 'success');
            } catch (e: any) {
                 showToast(`Errore: ${e.message}`, 'error');
            }
        }
    };

    return {
        // State
        photos,
        filteredList,
        isLoading,
        filterStatus,
        filterCity,
        sortKey,
        sortDir,
        cityOptions,
        
        isInspectorOpen,
        photoToEdit,
        metadataModal,
        deleteTarget,
        isDeleting,
        isUploading,
        uploadStep,
        toast,
        fileInputRef,
        isSuperAdmin,

        // Setters
        setFilterStatus,
        setFilterCity,
        setSortDir,
        setIsInspectorOpen,
        setPhotoToEdit,
        setMetadataModal,
        setDeleteTarget,
        setToast,

        // Actions
        handleSort,
        handleFileUpload,
        handleStatusUpdate,
        requestDelete,
        confirmDelete,
        handleInspectorSave,
        saveMetadata,
        refreshPhotos
    };
};
