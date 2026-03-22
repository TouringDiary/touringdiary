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
    togglePhotoLikeInDb,
    fetchUserPhotoLikes
} from '../services/photoService';

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
    likedPhotos: string[];

    hasUserVoted: (poiId: string) => boolean;
    hasUserLiked: (poiId: string) => boolean;
    hasUserLikedPhoto: (photoId: string) => boolean;

    getPhotoStatus: (photo: { id: string; likes?: number }) => PhotoLikeStatus;

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
    const [likedPhotos, setLikedPhotos] = useState<string[]>([]);

    // 🔥 SINGLE SOURCE OF TRUTH LIKE FOTO
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
                const photoLikes =
                    await fetchUserPhotoLikes(currentUserId);
                setLikedPhotos(photoLikes);
            } else {
                setLikedPhotos([]);
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
            photoStatus[photoId]?.isLiked ??
            likedPhotos.includes(photoId),
        [photoStatus, likedPhotos]
    );

    const getPhotoStatus = useCallback(
        (photo: { id: string; likes: number }): PhotoLikeStatus => {
            return (
                photoStatus[photo.id] ?? {
                    isLiked: likedPhotos.includes(photo.id),
                    count: photo.likes ?? photoStatus[photo.id]?.count ?? 0,
                    isLoading: false
                }
            );
        },
        [photoStatus, likedPhotos]
    );

    // 🔥 TOGGLE LIKE FOTO (NUOVA VERSIONE CENTRALIZZATA)
    const togglePhotoHeart = async (
        photoId: string
    ): Promise<number | undefined> => {
        if (isGuest) return;
        const current = photoStatus[photoId];

        if (current?.isLoading) return;

        const fallback = {
            isLiked:
                current?.isLiked ??
                likedPhotos.includes(photoId),
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
                await togglePhotoLikeInDb(photoId);

            setPhotoStatus((prev) => ({
                ...prev,
                [photoId]: {
                    isLiked: result.liked,
                    count: result.count,
                    isLoading: false
                }
            }));

            setLikedPhotos((prev) =>
                result.liked
                    ? [...new Set([...prev, photoId])]
                    : prev.filter((id) => id !== photoId)
            );

            return result.count;
        } catch (e) {
            console.error('Errore like foto', e);

            setPhotoStatus((prev) => ({
                ...prev,
                [photoId]: fallback
            }));

            return undefined;
        }
    };

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
                likedPhotos,
                hasUserVoted,
                hasUserLiked,
                hasUserLikedPhoto,
                getPhotoStatus,
                submitReview,
                toggleVote,
                toggleLike,
                togglePhotoHeart,
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
