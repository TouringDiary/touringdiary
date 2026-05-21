
import { useState, useCallback } from 'react';
import { getSponsorStats, getAllSponsorsForDashboard } from '../../services/sponsorService';
import { SponsorStats } from '../../types/index';
import { SponsorRequest } from '../../types/index';

export const useSponsorStats = () => {
    const [stats, setStats] = useState<SponsorStats>({ pending: 0, waiting: 0, approved: 0, expired: 0, rejected: 0, cancelled: 0, converted: 0, unreadMessages: 0 });
    const [dashboardRequests, setDashboardRequests] = useState<SponsorRequest[]>([]);
    const [loadingStats, setLoadingStats] = useState(true);

    const fetchStats = useCallback(async (isDashboardView: boolean) => {
        setLoadingStats(true);
        try {
            // Recupera sempre i contatori delle tab
            const statsResult = await getSponsorStats();
            setStats(statsResult);

            // Se siamo nella vista Dashboard, recupera ANCHE tutti i dati per la matrice
            if (isDashboardView) {
                const allData = await getAllSponsorsForDashboard();
                setDashboardRequests(allData);
            }
        } catch (e) {
            console.error("Stats fetch error:", e);
        } finally {
            setLoadingStats(false);
        }
    }, []);

    return {
        stats,
        dashboardRequests,
        loadingStats,
        fetchStats
    };
};
