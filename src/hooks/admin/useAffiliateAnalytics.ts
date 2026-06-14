import { useState, useEffect, useMemo } from 'react';
import { affiliateAdminService, AffiliateClickRecord } from '../../services/affiliateAdminService';
import { subDays, startOfDay, endOfDay, format, eachDayOfInterval } from 'date-fns';

export type AffiliateFilterRange = '7d' | '30d' | '90d' | 'year' | 'custom';

export interface AffiliateRankedItem {
  id: string;
  count: number;
}

export interface AffiliateCategoryCount {
  name: string;
  count: number;
}

export interface AffiliateDailyTrendPoint {
  date: string;
  fullDate: Date;
  count: number;
}

export interface AffiliateAnalyticsStats {
  totalClicks: number;
  trendPercent: number;
  activePartners: number;
  clickedProducts: number;
  avgClicksPerDay: number;
  topPartners: AffiliateRankedItem[];
  topProducts: AffiliateRankedItem[];
  topCategories: AffiliateCategoryCount[];
  sourcesBreakdown: Record<string, number>;
  dailyTrend: AffiliateDailyTrendPoint[];
}

export const useAffiliateAnalytics = () => {
  const [range, setRange] = useState<AffiliateFilterRange>('30d');
  const [customDates, setCustomDates] = useState<{ start: Date; end: Date } | null>(null);
  const [data, setData] = useState<AffiliateClickRecord[]>([]);
  const [prevData, setPrevData] = useState<AffiliateClickRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchedDateRange, setFetchedDateRange] = useState<{ start: Date; end: Date } | null>(null);

  const dateRange = useMemo(() => {
    let end = endOfDay(new Date());
    let start = startOfDay(subDays(end, 30));

    if (range === '7d') start = startOfDay(subDays(end, 7));
    else if (range === '90d') start = startOfDay(subDays(end, 90));
    else if (range === 'year') start = startOfDay(subDays(end, 365));
    else if (range === 'custom') {
      if (!customDates?.start || !customDates?.end) return null;
      start = startOfDay(customDates.start);
      end = endOfDay(customDates.end);
      return { start, end };
    }

    return { start, end };
  }, [range, customDates]);

  useEffect(() => {
    const fetchData = async () => {
      if (!dateRange) {
        setLoading(false);
        setIsRefreshing(false);
        return;
      }
      
      if (data.length === 0) setLoading(true);
      else setIsRefreshing(true);

      const { data: res, error } = await affiliateAdminService.getAnalyticsData(dateRange.start, dateRange.end);
      
      if (error) {
        console.error('[useAffiliateAnalytics] Error fetching analytics data:', error.message);
      }

      if (res) {
        setData(res.clicks);
        setPrevData(res.previousPeriodClicks);
        setFetchedDateRange(dateRange);
      }
      setLoading(false);
      setIsRefreshing(false);
    };

    fetchData();
  }, [dateRange]);

  const stats = useMemo((): AffiliateAnalyticsStats => {
    const totalClicks = data.length;
    const prevTotalClicks = prevData.length;
    const trendPercent = prevTotalClicks > 0 ? ((totalClicks - prevTotalClicks) / prevTotalClicks) * 100 : 0;

    const partnersMap: Record<string, number> = {};
    const productsMap: Record<string, number> = {};
    const categoriesMap: Record<string, number> = {};
    const sourcesMap: Record<string, number> = { suitcase: 0, poi: 0, ai: 0, cta: 0 };

    data.forEach(click => {
      partnersMap[click.partner_id] = (partnersMap[click.partner_id] || 0) + 1;
      if (click.product_id) productsMap[click.product_id] = (productsMap[click.product_id] || 0) + 1;
      if (click.category) categoriesMap[click.category] = (categoriesMap[click.category] || 0) + 1;
      if (Object.prototype.hasOwnProperty.call(sourcesMap, click.source_type)) {
        sourcesMap[click.source_type]++;
      } else {
        sourcesMap['cta']++;
      }
    });

    const topPartners = Object.entries(partnersMap)
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topProducts = Object.entries(productsMap)
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topCategories = Object.entries(categoriesMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Trend giornaliero ottimizzato (O(N + M))
    const clicksPerDay: Record<string, number> = {};
    data.forEach(click => {
      const dayKey = format(new Date(click.created_at), 'yyyy-MM-dd');
      clicksPerDay[dayKey] = (clicksPerDay[dayKey] || 0) + 1;
    });

    const days = fetchedDateRange
      ? eachDayOfInterval({ start: fetchedDateRange.start, end: fetchedDateRange.end })
      : [];
    const dailyTrend = days.map(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      return {
        date: format(day, 'dd/MM'),
        fullDate: day,
        count: clicksPerDay[dayKey] || 0
      };
    });

    const activePartners = Object.keys(partnersMap).length;
    const clickedProducts = Object.keys(productsMap).length;
    const daysCount = days.length || 1;
    const avgClicksPerDay = totalClicks / daysCount;

    return {
      totalClicks,
      trendPercent,
      activePartners,
      clickedProducts,
      avgClicksPerDay,
      topPartners,
      topProducts,
      topCategories,
      sourcesBreakdown: sourcesMap,
      dailyTrend
    };
  }, [data, prevData, fetchedDateRange]);

  return {
    range,
    setRange,
    customDates,
    setCustomDates,
    stats,
    loading,
    isRefreshing,
    effectiveDates: dateRange
  };
};
