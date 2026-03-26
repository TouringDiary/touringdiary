
import { useState, useEffect, useMemo, useCallback } from 'react';
import { PhotoSubmission, User, CityDetails } from '../types/index';
import { fetchCommunityPhotos, uploadCommunityPhoto } from '../services/photoService';

export const useCityGallery = (city: CityDetails, user: User) => {
    const [photos, setPhotos] = useState<PhotoSubmission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    
    // Pagination
    const ITEMS_PER_PAGE = 11;
    const [currentPage, setCurrentPage] = useState(1);

    // HELPER: Normalizza URL (Deprecato, usato solo per deduplica chiave)
    const normalizeKey = (url: string) => {
        if (!url) return '';
        try {
            // Decodifica URL encoded se presenti
            let clean = decodeURIComponent(url);
            // Rimuovi protocollo (solo per chiave di confronto)
            clean = clean.replace(/^https?:\/\//, '').replace(/^www\./, '');
            // Rimuovi query string e hash
            clean = clean.split('?')[0].split('#')[0];
            return clean.replace(/\/$/, '').trim();
        } catch (e) {
            return url;
        }
    };

    // 1. Load Data
    const loadPhotos = useCallback(async () => {
        setIsLoading(true);
        try {
            // A. Recupera foto Community (Dal DB submissions - Queste hanno Autore e Like!)
            const allCommunityPhotos = await fetchCommunityPhotos();
            
            // Filtra per città corrente (Usa ID se disponibile, fallback su nome)
            const communityCityPhotos = allCommunityPhotos.filter(p => {
                // PRIMARIO: Controllo per ID città (se presente nella submission)
                if (p.cityId && p.cityId === city.id) {
                    const isApproved = p.status === 'approved';
                    const isMyPending = p.status === 'pending' && p.userId === user.id;
                    return isApproved || isMyPending;
                }
                
                // FALLBACK: Controllo per Nome (Legacy)
                const isCityMatch = p.locationName.toLowerCase().includes(city.name.toLowerCase());
                const isApproved = p.status === 'approved';
                const isMyPending = p.status === 'pending' && p.userId === user.id;
                return isCityMatch && (isApproved || isMyPending);
            });

            // B. RECUPERA FOTO UFFICIALI (Spostate nel DB submissions via migrazione)
            // Non leggiamo più direttamente da city.details.gallery per garantire integrità del sistema Like.
            const finalPhotos = communityCityPhotos;
            
            // Ordina per data (più recenti prima)
            finalPhotos.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            // Ordina per data (più recenti prima)
            finalPhotos.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setPhotos(finalPhotos);

        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [city.name, city.details.gallery, city.id, city.updatedAt, user.id]);

    useEffect(() => {
        loadPhotos();
    }, [loadPhotos]);

    // 2. Computed Data (Top 10)
    const topGallerySlots = useMemo(() => {
        // Prendi solo le foto approvate
        const validPhotos = photos.filter(p => p.status === 'approved');
        
        // Ordina per like DECRESCENTI
        const sorted = [...validPhotos].sort((a,b) => (b.likes || 0) - (a.likes || 0));

        let topCandidates = sorted;
        
        // Se abbiamo abbastanza contenuti, sii selettivo (mostra solo quelle con voti)
        if (validPhotos.length > 15) {
            topCandidates = sorted.filter(p => (p.likes || 0) > 0);
        }
        
        // Prendi i primi 10
        const top10 = topCandidates.slice(0, 10);

        // Fill slots with null to maintain grid structure if needed
        const filled = [...top10];
        while(filled.length < 10) {
            filled.push(null as any);
        }
        return filled;
    }, [photos]);

    const totalPages = Math.max(1, Math.ceil(photos.length / ITEMS_PER_PAGE));
    const visiblePhotos = photos.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const goToPage = (page: number) => {
        const safePage = Math.max(1, Math.min(page, totalPages));
        setCurrentPage(safePage);
    };

    // 3. Update Likes Locally (Synchronization Helper)
    const updatePhotoLikes = useCallback((photoId: string, newCount: number) => {
        setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, likes: newCount } : p));
    }, []);

    // 4. Upload Action (CON PROTEZIONE SPAM)
    const uploadPhoto = async (file: File, description: string, shareToLive: boolean): Promise<User | null> => {
        setIsUploading(true);
        setUploadError(null);
        let updatedUser: User | null = null;

        try {
            // --- SECURITY CHECK 1: LIMITE GIORNALIERO ---
            const today = new Date().toDateString();
            const myUploadsToday = photos.filter(p => 
                p.userId === user.id && 
                new Date(p.date).toDateString() === today
            ).length;

            if (myUploadsToday >= 3 && user.role !== 'admin_all') {
                throw new Error("Hai raggiunto il limite giornaliero di 3 foto per questa città. Torna domani!");
            }

            // --- SECURITY CHECK 2: ANTI-SPAM RIPETITIVO ---
            const isSpam = photos.some(p => 
                p.userId === user.id &&
                (p.description?.toLowerCase().trim() === description.toLowerCase().trim()) && 
                (new Date().getTime() - new Date(p.date).getTime() < 24 * 60 * 60 * 1000) 
            );

            if (isSpam && user.role !== 'admin_all') {
                 throw new Error("Sembra che tu abbia già inviato un contenuto simile di recente. Evita pubblicità ripetitiva.");
            }

            const uploadedPhoto = await uploadCommunityPhoto(
                file,
                user.id,
                user.name,
                city.name,
                description || city.name,
                city.id // PASSING CITY ID
            );

            if (uploadedPhoto) {
                // Ensure cityID is set on returned object for local state
                uploadedPhoto.cityId = city.id;
                
                if (user.role !== 'guest') {
                    // XP is now handled by Supabase trigger
                }

                // Aggiungi alla lista locale (La deduplicazione al prossimo refresh pulirà eventuali conflitti)
                setPhotos(prev => [uploadedPhoto, ...prev]);
                return updatedUser || user;
            } else {
                throw new Error("Upload fallito");
            }
        } catch (err: any) {
            console.error(err);
            setUploadError(err.message || "Errore tecnico durante il caricamento.");
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    return {
        photos,
        visiblePhotos,
        topGallerySlots,
        isLoading,
        isUploading,
        uploadError,
        setUploadError,
        pagination: {
            currentPage,
            totalPages,
            goToPage
        },
        updatePhotoLikes,
        uploadPhoto,
        refresh: loadPhotos
    };
};
