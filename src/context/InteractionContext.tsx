import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useCallback,
    useMemo
} from 'react';

import { PointOfInterest, User } from '../types/index';
import { votePoiAsync } from '../services/cityService';
import { saveUnifiedReview } from '../services/communityService';
import {
    togglePhotoLikeRPC,
    fetchUserPhotoLikes,
} from '../services/photoService';
import { updatePhotoScore } from '../services/rankingService';

import { useModal } from './ModalContext';
import { getStorageItem, setStorageItem } from '../services/storageService';
import { PLATFORM_FEATURE_FLAG_KEYS } from '../constants/platformFeatureFlags';
import { evaluateCachedFeatureFlag } from '../domain/platformControl/platformFlagCache';

interface PhotoLikeStatus {
    isLiked: boolean;
    count: number;
    isLoading: boolean;
}

interface InteractionContextType {
    votedPois: string[];
    likedPois: string[];

    hasUserVoted: (poiId: string) => boolean;
    hasUserLiked: (poiId: string) => boolean;
    hasUserLikedPhoto: (photoId: string) => boolean;

    getPhotoStatus: (photo: { id: string; likes?: number; likedByUser?: boolean }) => PhotoLikeStatus;

    // Nuovi per Community Live Snaps
    getLiveSnapStatus: (snap: { id: string; likes?: number; likedByUser?: boolean }) => PhotoLikeStatus;
    toggleLiveSnapHeart: (snapId: string) => Promise<number | undefined>;

    submitReview: (
        poi: PointOfInterest,
        rating: number,
        criteria: Record<string, number>,
        comment: string,
        user: User
    ) => Promise<void>;

    toggleVote: (poiId: string) => Promise<number | null>;
    toggleLike: (poiId: string) => void;
    togglePhotoHeart: (photoId: string) => Promise<number | undefined>;

    setInteractionUser: (userId: string) => void;

    isGuest: boolean;
}

const InteractionContext = createContext<
    InteractionContextType | undefined
>(undefined);

export const InteractionProvider = ({
    children
}: {
    children?: ReactNode;
}) => {
    const [currentUserId, setCurrentUserId] =
        useState<string>('guest');

    const [votedPois, setVotedPois] = useState<string[]>([]);
    const [likedPois, setLikedPois] = useState<string[]>([]);

    // 🔥 SINGLE SOURCE OF TRUTH LIKE FOTO (Unified for both City Gallery & Live Feed)
    const [photoStatus, setPhotoStatus] = useState<
        Record<string, PhotoLikeStatus>
    >({});

    const modalContext = useModal();

    const isGuest = currentUserId === 'guest';

    // LOAD USER DATA
    useEffect(() => {
        const loadUserData = async () => {
            const votesKey = `voted_pois_${currentUserId}`;
            const likesKey = `liked_pois_${currentUserId}`;

            setVotedPois(getStorageItem<string[]>(votesKey, []));
            setLikedPois(getStorageItem<string[]>(likesKey, []));

            if (!isGuest) {
                // Warm liked flags without inventing count:0 (that desynced heart vs counter).
                // Authoritative isLiked+count come from photo entity (likedByUser + likes)
                // until togglePhotoHeart writes a full RPC result into photoStatus.
                const photoLikes = await fetchUserPhotoLikes(currentUserId);
                setPhotoStatus(prev => {
                    const next = { ...prev };
                    photoLikes.forEach(id => {
                        const existing = prev[id];
                        if (existing) {
                            next[id] = { ...existing, isLiked: true };
                        }
                        // Intentionally skip new entries without a known count.
                    });
                    return next;
                });
            }
        };

        loadUserData();
    }, [currentUserId, isGuest]);

    const setInteractionUser = useCallback(
        (userId: string) => {
            if (userId !== currentUserId)
                setCurrentUserId(userId);
        },
        [currentUserId]
    );

    const hasUserVoted = useCallback(
        (poiId: string) => votedPois.includes(poiId),
        [votedPois]
    );

    const hasUserLiked = useCallback(
        (poiId: string) => likedPois.includes(poiId),
        [likedPois]
    );

    const hasUserLikedPhoto = useCallback(
        (photoId: string) =>
            photoStatus[photoId]?.isLiked ?? false,
        [photoStatus]
    );

    const getPhotoStatus = useCallback(
        (photo: { id: string; likes?: number; likedByUser?: boolean }): PhotoLikeStatus => {
            const cached = photoStatus[photo.id];
            const entityCount = photo.likes ?? 0;

            if (!cached) {
                // Zero likes ⇒ heart never selected. Otherwise heart = current-user like only.
                if (entityCount <= 0) {
                    return { isLiked: false, count: 0, isLoading: false };
                }
                return {
                    isLiked: photo.likedByUser ?? false,
                    count: entityCount,
                    isLoading: false
                };
            }

            // Incomplete seed from fetchUserPhotoLikes: { isLiked: true, count: 0 }.
            // Merge real entity count; if still zero, do not show a selected heart.
            if (cached.isLiked && cached.count === 0 && !cached.isLoading) {
                if (entityCount <= 0) {
                    return { isLiked: false, count: 0, isLoading: false };
                }
                return { isLiked: true, count: entityCount, isLoading: false };
            }

            return cached;
        },
        [photoStatus]
    );

    const getLiveSnapStatus = useCallback(
        (snap: { id: string; likes?: number; likedByUser?: boolean }): PhotoLikeStatus => {
            return getPhotoStatus(snap);
        },
        [getPhotoStatus]
    );

    // 🔥 TOGGLE LIKE FOTO (NUOVA VERSIONE CENTRALIZZATA)
    const togglePhotoHeart = useCallback(async (
        photoId: string
    ): Promise<number | undefined> => {
        if (isGuest) {
            modalContext.openModal('auth');
            return;
        }
        const current = photoStatus[photoId];

        if (current?.isLoading) return;

        const fallback = {
            isLiked:
                current?.isLiked ?? false,
            count:
                current?.count ??
                photoStatus[photoId]?.count ??
                0,
            isLoading: false
        };

        const optimistic = {
            ...fallback,
            isLiked: !fallback.isLiked,
            isLoading: true
        };

        setPhotoStatus((prev) => ({
            ...prev,
            [photoId]: optimistic
        }));

        try {
            const result =
                await togglePhotoLikeRPC(photoId);

            // 2. Aggiornamento Punteggio Ranking asincrono (fire-and-forget)
            updatePhotoScore(photoId, result.liked).catch(console.error);

            setPhotoStatus((prev) => ({
                ...prev,
                [photoId]: {
                    isLiked: result.liked,
                    count: result.count,
                    isLoading: false
                }
            }));

            // likedPhotos legacy: non più utilizzato

            return result.count;
        } catch (e) {
            console.error('Errore critico like foto RPC (Triggering Rollback):', e);

            setPhotoStatus((prev) => ({
                ...prev,
                [photoId]: fallback
            }));

            return undefined;
        }
    }, [isGuest, photoStatus, modalContext]);

    // Redirect legacy function to unified RPC-based logic
    const toggleLiveSnapHeart = togglePhotoHeart;

    const toggleVote = useCallback(async (
        poiId: string
    ): Promise<number | null> => {
        const isAdding = !votedPois.includes(poiId);

        const next = isAdding
            ? [...votedPois, poiId]
            : votedPois.filter((id) => id !== poiId);

        setVotedPois(next);

        setStorageItem(
            `voted_pois_${currentUserId}`,
            next
        );

        if (isGuest) return null;

        try {
            return await votePoiAsync(poiId, isAdding);
        } catch {
            return null;
        }
    }, [votedPois, currentUserId, isGuest]);

    const toggleLike = useCallback((poiId: string) => {
        setLikedPois((prev) => {
            const next = prev.includes(poiId)
                ? prev.filter((id) => id !== poiId)
                : [...prev, poiId];

            setStorageItem(
                `liked_pois_${currentUserId}`,
                next
            );

            return next;
        });
    }, [currentUserId]);

    const submitReview = useCallback(
        async (
            poi: PointOfInterest,
            rating: number,
            criteria: Record<string, number>,
            comment: string,
            user: User
        ): Promise<void> => {
            if (!user || user.role === 'guest') {
                throw new Error('Devi accedere per pubblicare una recensione.');
            }

            const reviewsFlag = evaluateCachedFeatureFlag(
                PLATFORM_FEATURE_FLAG_KEYS.MODERATION_REVIEWS,
                {
                    userRole: user.role,
                    isAuthenticated: true,
                }
            );
            if (reviewsFlag && !reviewsFlag.enabled) {
                throw new Error('L’invio di nuove recensioni è temporaneamente disabilitato.');
            }

            await saveUnifiedReview({
                author: user.name,
                authorId: user.id,
                rating,
                text: comment,
                criteria,
                poiId: poi.id,
            });
        },
        []
    );

    const value = useMemo<InteractionContextType>(() => ({
        votedPois,
        likedPois,
        hasUserVoted,
        hasUserLiked,
        hasUserLikedPhoto,
        getPhotoStatus,
        getLiveSnapStatus,
        submitReview,
        toggleVote,
        toggleLike,
        togglePhotoHeart,
        toggleLiveSnapHeart,
        setInteractionUser,
        isGuest
    }), [
        votedPois,
        likedPois,
        hasUserVoted,
        hasUserLiked,
        hasUserLikedPhoto,
        getPhotoStatus,
        getLiveSnapStatus,
        submitReview,
        toggleVote,
        toggleLike,
        togglePhotoHeart,
        toggleLiveSnapHeart,
        setInteractionUser,
        isGuest,
    ]);

    return (
        <InteractionContext.Provider value={value}>
            {children}
        </InteractionContext.Provider>
    );
};

export const useInteraction = () => {
    const context = useContext(InteractionContext);

    if (!context)
        throw new Error(
            'useInteraction must be used within InteractionProvider'
        );

    return context;
};
