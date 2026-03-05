
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { PointOfInterest, User } from '../types/index';
import { votePoiAsync } from '../services/cityService';
import { saveUnifiedReview } from '../services/communityService';
import { togglePhotoLikeInDb, fetchUserPhotoLikes } from '../services/photoService';
import { useModal } from './ModalContext';
import { getStorageItem, setStorageItem } from '../services/storageService'; // IMPORT SAFE STORAGE

interface InteractionContextType {
    votedPois: string[];
    likedPois: string[];
    likedPhotos: string[];
    hasUserVoted: (poiId: string) => boolean;
    hasUserLiked: (poiId: string) => boolean;
    hasUserLikedPhoto: (photoId: string) => boolean;
    submitReview: (poi: PointOfInterest, rating: number, criteria: Record<string, number>, comment: string, user: User) => void;
    toggleVote: (poiId: string) => Promise<number | null>; 
    toggleLike: (poiId: string) => void; 
    togglePhotoHeart: (photoId: string) => Promise<number | undefined>;
    setInteractionUser: (userId: string) => void; 
    isGuest: boolean;
}

const InteractionContext = createContext<InteractionContextType | undefined>(undefined);

export const InteractionProvider = ({ children }: { children?: ReactNode }) => {
    const [currentUserId, setCurrentUserId] = useState<string>('guest');
    
    const [votedPois, setVotedPois] = useState<string[]>([]);
    const [likedPois, setLikedPois] = useState<string[]>([]);
    
    // QUESTO è l'array critico. Deve contenere TUTTI gli ID delle foto a cui l'utente ha messo like.
    const [likedPhotos, setLikedPhotos] = useState<string[]>([]);
    
    const modalContext = useModal();

    const isGuest = currentUserId === 'guest';

    // Caricamento Dati Utente
    useEffect(() => {
        const loadUserData = async () => {
            // SAFE STORAGE: Usa i wrapper che non crashano se i cookie sono bloccati
            const votesKey = `voted_pois_${currentUserId}`;
            const likesKey = `liked_pois_${currentUserId}`;
            
            setVotedPois(getStorageItem<string[]>(votesKey, []));
            setLikedPois(getStorageItem<string[]>(likesKey, []));
            
            // Database per le FOTO (Like Community)
            if (!isGuest) {
                const photoLikes = await fetchUserPhotoLikes(currentUserId);
                setLikedPhotos(photoLikes); // Carica lo stato iniziale dal DB
            } else {
                setLikedPhotos([]);
            }
        };
        loadUserData();
    }, [currentUserId, isGuest]);

    const setInteractionUser = useCallback((userId: string) => {
        if (userId !== currentUserId) setCurrentUserId(userId);
    }, [currentUserId]);

    const hasUserVoted = useCallback((poiId: string) => votedPois.includes(poiId), [votedPois]);
    const hasUserLiked = useCallback((poiId: string) => likedPois.includes(poiId), [likedPois]);
    
    // Verifica istantanea se l'utente ha messo like a una foto
    const hasUserLikedPhoto = useCallback((photoId: string) => likedPhotos.includes(photoId), [likedPhotos]);

    // --- LOGICA VOTO POI ---
    const toggleVote = async (poiId: string): Promise<number | null> => {
        const isAdding = !votedPois.includes(poiId);
        const nextVoted = isAdding ? [...votedPois, poiId] : votedPois.filter(id => id !== poiId);
        setVotedPois(nextVoted);
        
        // SAFE SAVE
        setStorageItem(`voted_pois_${currentUserId}`, nextVoted);

        if (isGuest) return null;

        try {
            const newCount = await votePoiAsync(poiId, isAdding);
            return newCount;
        } catch (e) {
            console.error("Errore voto DB:", e);
            return null;
        }
    };
    
    // --- LOGICA LIKE FOTO ---
    const togglePhotoHeart = async (photoId: string): Promise<number | undefined> => {
        if (isGuest) return undefined;
        
        // 1. Aggiornamento Ottimistico UI
        setLikedPhotos(currentLikes => {
            const isLiked = currentLikes.includes(photoId);
            if (isLiked) {
                return currentLikes.filter(id => id !== photoId);
            } else {
                return [...currentLikes, photoId];
            }
        });

        try {
             // 2. Chiamata al Database
             const result = await togglePhotoLikeInDb(photoId, currentUserId);
             
             // 3. Verifica consistenza
             if (result.liked) {
                 setLikedPhotos(prev => {
                     if (!prev.includes(photoId)) return [...prev, photoId];
                     return prev;
                 });
             } else {
                 setLikedPhotos(prev => prev.filter(id => id !== photoId));
             }
             
             return result.count; 
        } catch (e) {
             console.error("Errore like foto", e);
             // Rollback
             setLikedPhotos(currentLikes => {
                const isLiked = currentLikes.includes(photoId);
                return isLiked ? currentLikes.filter(id => id !== photoId) : [...currentLikes, photoId];
             });
             return undefined;
        }
    };

    const toggleLike = (poiId: string) => {
        setLikedPois(prev => {
            const isLiked = prev.includes(poiId);
            const next = isLiked ? prev.filter(id => id !== poiId) : [...prev, poiId];
            // SAFE SAVE
            setStorageItem(`liked_pois_${currentUserId}`, next);
            return next;
        });
    };

    const submitReview = useCallback(async (poi: PointOfInterest, rating: number, criteria: Record<string, number>, comment: string, user: User) => {
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
        } catch (e) {
            console.error("Review Submit Failed:", e);
            modalContext.openModal('reviewSuccess'); 
        }
    }, [modalContext]);

    return (
        <InteractionContext.Provider value={{ 
            votedPois, likedPois, likedPhotos, 
            hasUserVoted, hasUserLiked, hasUserLikedPhoto, 
            submitReview, toggleVote, toggleLike, togglePhotoHeart, 
            setInteractionUser, isGuest 
        }}>
            {children}
        </InteractionContext.Provider>
    );
};

export const useInteraction = () => {
    const context = useContext(InteractionContext);
    if (!context) throw new Error('useInteraction must be used within InteractionProvider');
    return context;
};
