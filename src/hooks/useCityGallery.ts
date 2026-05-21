import { useState, useEffect, useMemo, useCallback } from 'react';
import { PhotoSubmission, User, CityDetails, MediaStatus } from '../types/index';
import { fetchCommunityPhotos, uploadCommunityPhoto, getOrCreatePhotoSubmissionForUrl } from '../services/photoService';
import { getCityOfficialMedia } from '../services/city/cityMediaService';

export const useCityGallery = (city: CityDetails, user: User) => {
    const [photos, setPhotos] = useState<PhotoSubmission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Pagination
    const ITEMS_PER_PAGE = 11;
    const [currentPage, setCurrentPage] = useState(1);

    // 1. Load Data
    const loadPhotos = useCallback(async () => {
        setIsLoading(true);
        try {
            // A. Recupera foto Community (Dal DB submissions)
            const allCommunityPhotos = await fetchCommunityPhotos();

            // Filtra per città corrente
            const communityCityPhotos = allCommunityPhotos.filter(p => {
                if (p.cityId && p.cityId === city.id) {
                    const isApproved = p.status === 'approved';
                    const isMyPending = p.status === 'pending' && p.userId === user.id;
                    return isApproved || isMyPending;
                }
                const isCityMatch = p.locationName.toLowerCase().includes(city.name.toLowerCase());
                const isApproved = p.status === 'approved';
                const isMyPending = p.status === 'pending' && p.userId === user.id;
                return isCityMatch && (isApproved || isMyPending);
            });

            // B. RECUPERA FOTO UFFICIALI & POI CON METADATI (Governance-Driven)
            const officialAssets = getCityOfficialMedia(city);

            // C. REGISTRAZIONE PERSISTENTE & MERGE
            const registeredPhotosPromises = officialAssets.map(asset => {
                const existing = communityCityPhotos.find(p => p.url === asset.url);
                if (existing) return Promise.resolve(existing);
                return getOrCreatePhotoSubmissionForUrl(asset.url, city.id, city.name, 'Immagine ufficiale', asset.mediaStatus);
            });

            const registeredPhotos = await Promise.all(registeredPhotosPromises);

            const finalPhotos: PhotoSubmission[] = [...communityCityPhotos];

            registeredPhotos.forEach(p => {
                if (p && !finalPhotos.some(existing => existing.id === p.id)) {
                    finalPhotos.push(p);
                }
            });

            // Ordina per data (Il filtraggio placeholder/missing avviene ora nel service layer)
            const sortedPhotos = finalPhotos
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setPhotos(sortedPhotos);

        } catch (err: unknown) {
            if (err instanceof Error) console.error(`[useCityGallery] Error loading photos: ${err.message}`);
            else console.error("[useCityGallery] Unknown error loading photos", err);
        } finally {
            setIsLoading(false);
        }
    }, [city.name, city.details?.gallery, city.details?.allPois, city.id, city.imageUrl, city.hero_status, user.id]);

    useEffect(() => {
        loadPhotos();
    }, [loadPhotos]);

    // FASE 3: Partitioning logic
    const officialPhotos = useMemo(() => photos.filter(p => p.isOfficial), [photos]);
    const communityPhotos = useMemo(() => photos.filter(p => !p.isOfficial), [photos]);

    const defaultTab = useMemo((): 'official' | 'community' => (officialPhotos.length > 5 ? 'official' : 'community'), [officialPhotos.length]);

    const topOfficial = useMemo(() => {
        // Ordine editoriale (fallback su data decrescente come caricato)
        return officialPhotos.filter(p => p.status === 'approved').slice(0, 10);
    }, [officialPhotos]);

    const topCommunity = useMemo(() => {
        // Ordine per engagement/like
        return [...communityPhotos]
            .filter(p => p.status === 'approved')
            .sort((a, b) => (b.likes || 0) - (a.likes || 0))
            .slice(0, 10);
    }, [communityPhotos]);

    const totalPages = Math.max(1, Math.ceil(communityPhotos.length / ITEMS_PER_PAGE));
    const visiblePhotos = communityPhotos.slice(0, currentPage * ITEMS_PER_PAGE);


    const goToPage = (page: number) => {
        const safePage = Math.max(1, Math.min(page, totalPages));
        setCurrentPage(safePage);
    };

    const loadMore = useCallback(() => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        }
    }, [currentPage, totalPages]);

    const updatePhotoLikes = useCallback((photoId: string, newCount: number) => {
        setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, likes: newCount } : p));
    }, []);

    const uploadPhoto = async (file: File, description: string, shareToLive: boolean): Promise<User | null> => {
        setIsUploading(true);
        setUploadError(null);
        try {
            const uploadedPhoto = await uploadCommunityPhoto(file, user.id, user.name, city.name, description || city.name, city.id);
            if (uploadedPhoto) {
                uploadedPhoto.cityId = city.id;
                setPhotos(prev => [uploadedPhoto, ...prev]);
                return user;
            } else {
                throw new Error("Upload fallito");
            }
        } catch (err: unknown) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : "Errore tecnico durante il caricamento.";
            setUploadError(errorMessage);
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    return {
        photos,
        officialPhotos,
        communityPhotos,
        topOfficial,
        topCommunity,
        defaultTab,
        visiblePhotos,
        topGallerySlots: topCommunity, // Fallback legacy
        isLoading, isUploading, uploadError, setUploadError,
        pagination: { currentPage, totalPages, goToPage, loadMore },
        updatePhotoLikes, uploadPhoto, refresh: loadPhotos
    };
};

