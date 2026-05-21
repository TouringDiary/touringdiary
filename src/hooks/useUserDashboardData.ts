import { useState, useEffect, useCallback, useRef } from 'react';
import { User, ShopPartner, Reward, UserReward, AppNotification, SponsorRequest, SuggestionRequest } from '../types/index';
import { getShopByOwner, getShopById } from '../services/shopService';
import { getBusinessStats, getUserSuggestionsAsync } from '../services/communityService';
import { getRewardsAsync, getClaimedRewards, claimReward, markRewardAsUsed } from '../services/gamificationService';
import { fetchNotificationsAsync } from '../services/notificationService'; 
import { getSponsorRequestsByProfile } from '../services/sponsors/sponsorRequestsService';
import { getSponsorsByOwner } from '../services/sponsors/sponsorContractsService';
import { safeArray } from '../utils/safeTypes';

import { useBusinessContext } from '../context/BusinessContext';

export const useUserDashboardData = (user: User) => {
    const isBusiness = user.role === 'business';
    const { activeBusinessId, activeBusiness, isLoading: isContextLoading } = useBusinessContext();
    
    // Ref to track the LATEST activeBusinessId regardless of closures
    const activeIdRef = useRef(activeBusinessId);
    activeIdRef.current = activeBusinessId;
    
    // Data States
    const [myShop, setMyShop] = useState<ShopPartner | null>(null);
    const [bizStats, setBizStats] = useState<any>(null);
    const [suggestions, setSuggestions] = useState<SuggestionRequest[]>([]);
    const [catalogRewards, setCatalogRewards] = useState<Reward[]>([]);
    const [myRewards, setMyRewards] = useState<UserReward[]>([]);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [sponsorRequests, setSponsorRequests] = useState<SponsorRequest[]>([]);
    
    // UI States
    const [isLoading, setIsLoading] = useState(false);

    // --- WIPEOUT LOGIC ---
    // Previene il cross-business leakage azzerando i dati durante lo switch
    useEffect(() => {
        if (activeBusinessId) {
            setMyShop(null);
            setBizStats(null);
        }
    }, [activeBusinessId]);

    const refreshData = useCallback(async () => {
        // SECURITY FIX: Skip fetch if user is null or guest
        if (!user || user.role === 'guest') return;
        
        const requestId = Math.random().toString(36).substring(7);
        const closureBizId = activeBusinessId;
        const closureShopId = activeBusiness?.shopId;

        console.log(`[Req:${requestId}] Syncing dashboard data...`);

        setIsLoading(true);
        try {
            // 1. Business Data (URL-AWARE)
            if (isBusiness) {
                try {
                    // Se abbiamo un business attivo dal contesto/URL, usiamo quello
                    if (closureBizId && activeBusiness) {
                        const shopId = closureShopId;
                        console.log(`[TRACE_REFRESH] [Req:${requestId}] Loading shop & stats for shopId:`, shopId);
                        
                        if (shopId) {
                             // CARICAMENTO ATOMICO MULTI-BUSINESS (UUID-SAFE)
                             const shop = await getShopById(shopId);
                             
                             const currentIdNow = activeIdRef.current;
                             if (currentIdNow !== closureBizId) return;
                             
                             setMyShop(shop || null);
                             
                             // STATS REALI (ASINCRONE)
                             const stats = await getBusinessStats(shopId);
                             
                             const currentIdAfterStats = activeIdRef.current;
                             if (currentIdAfterStats !== closureBizId) return;

                             console.log(`[TRACE_REFRESH] [Req:${requestId}] Applying setBizStats for biz:`, closureBizId);
                             setBizStats(stats);
                        } else {
                             console.warn(`[TRACE_REFRESH] [Req:${requestId}] No shopId found in activeBusiness!`);
                             setMyShop(null);
                             setBizStats(null);
                        }
                    } else if (!closureBizId) {
                        console.log(`[TRACE_REFRESH] [Req:${requestId}] Falling back to Legacy getShopByOwner...`);
                        const shop = await getShopByOwner(user.id);
                        setMyShop(shop || null);
                        if (shop?.id) {
                            const stats = await getBusinessStats(shop.id);
                            setBizStats(stats);
                        }
                    }
                } catch (e) {
                    console.error(`[TRACE_REFRESH] [Req:${requestId}] Shop load error`, e);
                }
            }
            
            // 1.5. Sponsor Requests & Active Sponsors (URL-FILTERED)
            const [requests, activeSponsors] = await Promise.all([
                getSponsorRequestsByProfile(user.id),
                getSponsorsByOwner(user.id)
            ]);
            
            if (activeIdRef.current === closureBizId) {
                setSponsorRequests(safeArray<SponsorRequest>(requests));
            } else {
                console.warn(`[TRACE_REFRESH] [Req:${requestId}] Skipping sponsor requests update - STALE`);
            }

            // 2. Community & Gamification
            const [sugs, rewardsCatalog] = await Promise.all([
                getUserSuggestionsAsync(user.id),
                getRewardsAsync()
            ]);
            
            if (activeIdRef.current === closureBizId) {
                setSuggestions(safeArray<SuggestionRequest>(sugs));
                setCatalogRewards(safeArray<Reward>(rewardsCatalog));
                setMyRewards(getClaimedRewards(user.id));
            }

            // 3. Notifications (FIX: ASYNC FETCH)
            const notifs = await fetchNotificationsAsync(user.id);
            const safeNotifs = safeArray<AppNotification>(notifs);
            
            if (activeIdRef.current === closureBizId) {
                setNotifications(safeNotifs);
                setUnreadCount(safeNotifs.filter(n => !n.isRead).length);
            }

        } finally {
            setIsLoading(false);
        }
    }, [user, isBusiness, activeBusinessId, activeBusiness]);

    // Initial Load & Reactive Switch
    useEffect(() => {
        refreshData();
    }, [refreshData, activeBusinessId, isBusiness]);

    // Actions
    const handleClaimReward = (reward: Reward, isUnlocked: boolean) => {
        if (!isUnlocked) return false;
        const existingActive = myRewards.find(r => r.rewardId === reward.id && r.status === 'active');
        if (existingActive) return true; // Already active

        const newCoupon = claimReward(user.id, user.name, reward);
        setMyRewards(prev => [newCoupon, ...prev]);
        return true;
    };

    const handleMarkUsed = (instanceId: string) => {
        markRewardAsUsed(instanceId);
        setMyRewards(prev => prev.map(r => r.instanceId === instanceId ? { ...r, status: 'used' } : r));
    };

    return {
        myShop,
        bizStats,
        suggestions,
        catalogRewards,
        myRewards,
        notifications,
        unreadCount,
        sponsorRequests, // EXPORTED
        isLoading,
        refreshData,
        handleClaimReward,
        handleMarkUsed,
        setNotifications,
        setUnreadCount
    };
};
