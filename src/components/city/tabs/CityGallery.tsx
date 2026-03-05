
import React, { useRef, useState, useMemo } from 'react';
import { CityDetails, User as UserType } from '../../../types/index';
import { useCityGallery } from '../../../hooks/useCityGallery';
import { GalleryLightbox, LightboxData } from '../gallery/GalleryLightbox';
import { GalleryUploadModal } from '../gallery/GalleryUploadModal';
import { GallerySuccessModal } from '../gallery/GallerySuccessModal';
import { GalleryGrid } from '../gallery/GalleryGrid';
import { compressImage, dataURLtoFile } from '../../../utils/common';

interface Props {
    city: CityDetails;
    user: UserType;
    onOpenAuth: () => void;
}

export const CityGallery = ({ city, user, onOpenAuth }: Props) => {
    // 1. Hook Logica
    const { 
        photos, visiblePhotos, topGallerySlots, 
        isUploading, uploadError, setUploadError,
        pagination, uploadPhoto, updatePhotoLikes
    } = useCityGallery(city, user);

    // 2. UI State
    // Gestiamo l'indice della foto attiva invece dell'oggetto data diretto
    // per permettere la navigazione next/prev
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    
    const [uploadPreview, setUploadPreview] = useState<string | null>(null);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Computiamo i dati per la lightbox basandoci sull'indice
    const lightboxData: LightboxData | null = useMemo(() => {
        if (lightboxIndex === null || !photos[lightboxIndex]) return null;
        const p = photos[lightboxIndex];
        return {
            id: p.id,
            url: p.url,
            user: p.user,
            likes: p.likes || 0,
            caption: p.description,
            date: p.date
        };
    }, [lightboxIndex, photos]);

    // 3. Handlers
    const handleAddClick = () => {
        if (isUploading) return;
        if (user.role === 'guest') {
            onOpenAuth();
            return;
        }
        fileInputRef.current?.click();
    };
    
    const handleOpenLightbox = (data: LightboxData) => {
        // Trova l'indice della foto cliccata nella lista completa
        const idx = photos.findIndex(p => p.id === data.id);
        if (idx !== -1) setLightboxIndex(idx);
    };
    
    const handleNextPhoto = () => {
        if (lightboxIndex !== null && lightboxIndex < photos.length - 1) {
            setLightboxIndex(lightboxIndex + 1);
        }
    };

    const handlePrevPhoto = () => {
        if (lightboxIndex !== null && lightboxIndex > 0) {
            setLightboxIndex(lightboxIndex - 1);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // Compressione Client-Side prima del modale
            const compressedBase64 = await compressImage(file);
            const compressedFile = dataURLtoFile(compressedBase64, file.name);

            setUploadPreview(compressedBase64);
            setUploadFile(compressedFile);
            setShowUploadModal(true);
            setUploadError(null);
        } catch (err) {
            console.error(err);
            setUploadError("Errore elaborazione immagine.");
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleConfirmUpload = async (description: string, shareToLive: boolean) => {
        if (!uploadFile) return;
        
        const result = await uploadPhoto(uploadFile, description, shareToLive);
        
        if (result) {
            setShowUploadModal(false);
            setShowSuccessModal(true);
            // Cleanup
            setUploadPreview(null);
            setUploadFile(null);
        }
    };

    const handleCancelUpload = () => {
        setShowUploadModal(false);
        setUploadPreview(null);
        setUploadFile(null);
        setUploadError(null);
    };

    return (
        <div className="flex flex-col animate-in fade-in select-none relative w-full h-auto">
            
            {/* Hidden Input */}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} disabled={isUploading}/>

            {/* Modals */}
            {lightboxData && (
                <GalleryLightbox 
                    data={lightboxData} 
                    onClose={() => setLightboxIndex(null)}
                    onNext={handleNextPhoto}
                    onPrev={handlePrevPhoto}
                    hasNext={lightboxIndex !== null && lightboxIndex < photos.length - 1}
                    hasPrev={lightboxIndex !== null && lightboxIndex > 0}
                />
            )}

            {showUploadModal && uploadPreview && (
                <GalleryUploadModal 
                    previewUrl={uploadPreview}
                    isUploading={isUploading}
                    uploadError={uploadError}
                    cityName={city.name}
                    onCancel={handleCancelUpload}
                    onConfirm={handleConfirmUpload}
                />
            )}

            {showSuccessModal && (
                <GallerySuccessModal onClose={() => setShowSuccessModal(false)} />
            )}

            {/* Main Content */}
            <GalleryGrid 
                photos={photos}
                visiblePhotos={visiblePhotos}
                topGallerySlots={topGallerySlots}
                pagination={pagination}
                isUploading={isUploading}
                onAddClick={handleAddClick}
                onOpenLightbox={handleOpenLightbox}
                onOpenAuth={onOpenAuth}
                onLikeUpdate={updatePhotoLikes} 
            />
        </div>
    );
};
