import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useCallback
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
    getLiveSnapStatus: (snap: { id: string; likes?: number }) => PhotoLikeStatus;
    toggleLiveSnapHeart: (snapId: string) => Promise<number | undefined>;

    submitReview: (
        poi: PointOfInterest,
        rating: number,
        criteria: Record<string, number>,
        comment: string,
        user: User
    ) => void;

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
                const photoLikes = await fetchUserPhotoLikes(currentUserId);
                // Initialize initial liked state in photoStatus if needed
                const initialStatus: Record<string, PhotoLikeStatus> = {};
                photoLikes.forEach(id => {
                    initialStatus[id] = { isLiked: true, count: 0, isLoading: false };
                });
                setPhotoStatus(prev => ({ ...prev, ...initialStatus }));
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
            return (
                photoStatus[photo.id] ?? {
                    isLiked: photo.likedByUser ?? false,
                    count: photo.likes ?? 0,
                    isLoading: false
                }
            );
        },
        [photoStatus]
    );

    const getLiveSnapStatus = useCallback(
        (snap: { id: string; likes?: number }): PhotoLikeStatus => {
            return (
                photoStatus[snap.id] ?? {
                    isLiked: false,
                    count: snap.likes ?? 0,
                    isLoading: false
                }
            );
        },
        [photoStatus]
    );

    // 🔥 TOGGLE LIKE FOTO (NUOVA VERSIONE CENTRALIZZATA)
    const togglePhotoHeart = async (
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
    };

    // Redirect legacy function to unified RPC-based logic
    const toggleLiveSnapHeart = togglePhotoHeart;

    const toggleVote = async (
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
    };

    const toggleLike = (poiId: string) => {
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
    };

    const submitReview = useCallback(
        async (
            poi,
            rating,
            criteria,
            comment,
            user
        ) => {
            if (!user || user.role === 'guest') return;

            const newReview = {
                id: `rev_${Date.now()}`,
                author: user.name,
                authorId: user.id,
                rating,
                date: new Date().toISOString(),
                text: comment,
                criteria,
                status: 'pending' as const,
                poiName: poi.name,
                poiId: poi.id
            };

            try {
                await saveUnifiedReview(newReview);
                modalContext.openModal('reviewSuccess');
            } catch {
                modalContext.openModal('reviewSuccess');
            }
        },
        [modalContext]
    );

    return (
        <InteractionContext.Provider
            value={{
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
            }}
        >
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
