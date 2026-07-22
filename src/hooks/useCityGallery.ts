import { useState, useEffect, useMemo, useCallback } from 'react';
import { PhotoSubmission, User, CityDetails } from '../types/index';
import { listPhotographs, uploadCommunityPhoto, getOrCreatePhotoSubmissionForUrl } from '../services/photoService';
import { getCityPhotographicGalleryAssets } from '../services/city/cityMediaService';
import { PLATFORM_FEATURE_FLAG_KEYS, PLATFORM_MESSAGE_TEMPLATE_KEYS } from '../constants/platformFeatureFlags';
import { evaluateCachedFeatureFlag } from '../domain/platformControl/platformFlagCache';
import { resolvePlatformUserBody } from '@/services/platformControl/resolvePlatformUserMessage';

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
            // A. Fotografie (unica porta dominio Photo)
            const allCommunityPhotos = await listPhotographs({ withLikes: true });

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

            // B. Galleria Fotografica città (unica sorgente Official autorizzata lato città)
            // Presentation Media (Hero / Card / POI cover) NON entra nel dominio Photograph.
            const photographicGalleryAssets = getCityPhotographicGalleryAssets(city);

            // C. REGISTRAZIONE PERSISTENTE & MERGE (solo URL della Galleria Fotografica)
            const registeredPhotosPromises = photographicGalleryAssets.map(asset => {
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

            // Ordina per data (solo Fotografie: filtro nel dominio via listPhotographs)
            const sortedPhotos = finalPhotos
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setPhotos(sortedPhotos);

        } catch (err: unknown) {
            if (err instanceof Error) console.error(`[useCityGallery] Error loading photos: ${err.message}`);
            else console.error("[useCityGallery] Unknown error loading photos", err);
        } finally {
            setIsLoading(false);
        }
    }, [city.name, city.details?.gallery, city.id, user.id]);

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
        // UX Gate only — early feedback if flag OFF (avoids spinner).
        // Security Gate remains exclusively in uploadCommunityPhoto (service boundary).
        // Pipeline: UI → UX Gate → Service Boundary → Feature Flag Runtime → Database.
        const photosFlagUx = evaluateCachedFeatureFlag(
            PLATFORM_FEATURE_FLAG_KEYS.MODERATION_PHOTOS,
            {
                userRole: user.role,
                isAuthenticated: user.role !== 'guest',
            }
        );
        if (photosFlagUx?.enabled !== true) {
            setUploadError(
                resolvePlatformUserBody(
                    photosFlagUx?.messageKey ?? PLATFORM_MESSAGE_TEMPLATE_KEYS.MODERATION_PHOTOS_PAUSED,
                    ''
                )
            );
            return null;
        }

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

