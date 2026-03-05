
import { useState, useEffect, useCallback } from 'react';
import { User, ShopPartner, Reward, UserReward, AppNotification, SponsorRequest } from '../types/index';
import { getShopByVat } from '../services/shopService';
import { getBusinessStats, getUserSuggestionsAsync } from '../services/communityService';
import { getRewardsAsync, getClaimedRewards, claimReward, markRewardAsUsed } from '../services/gamificationService';
import { fetchNotificationsAsync } from '../services/notificationService'; 
import { getSponsorRequestsByEmail } from '../services/sponsorService'; // IMPORT

export const useUserDashboardData = (user: User) => {
    const isBusiness = user.role === 'business';
    
    // Data States
    const [myShop, setMyShop] = useState<ShopPartner | null>(null);
    const [bizStats, setBizStats] = useState<any>(null);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [catalogRewards, setCatalogRewards] = useState<Reward[]>([]);
    const [myRewards, setMyRewards] = useState<UserReward[]>([]);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [sponsorRequests, setSponsorRequests] = useState<SponsorRequest[]>([]); // NEW
    
    // UI States
    const [isLoading, setIsLoading] = useState(false);

    const refreshData = useCallback(async () => {
        // SECURITY FIX: Skip fetch if user is null or guest
        if (!user || user.role === 'guest') return;
        
        setIsLoading(true);
        try {
            // 1. Business Data
            if (isBusiness && user.vatNumber) {
                try {
                    const shop = await getShopByVat(user.vatNumber);
                    setMyShop(shop || null);
                    setBizStats(getBusinessStats(user.id));
                } catch (e) {
                    console.error("Shop load error", e);
                }
            }
            
            // 1.5. Sponsor Requests (For Message Center)
            const requests = await getSponsorRequestsByEmail(user.email);
            setSponsorRequests(requests);

            // 2. Community & Gamification
            const [sugs, rewardsCatalog] = await Promise.all([
                getUserSuggestionsAsync(user.id),
                getRewardsAsync()
            ]);
            
            setSuggestions(sugs);
            setCatalogRewards(rewardsCatalog);
            setMyRewards(getClaimedRewards(user.id));

            // 3. Notifications (FIX: ASYNC FETCH)
            const notifs = await fetchNotificationsAsync(user.id);
            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.isRead).length);

        } catch (e) {
            console.error("Dashboard data sync error", e);
        } finally {
            setIsLoading(false);
        }
    }, [user, isBusiness]);

    // Initial Load
    useEffect(() => {
        refreshData();
    }, [refreshData]);

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
