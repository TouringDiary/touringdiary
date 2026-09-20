import { useCallback, useEffect, useRef, useState } from 'react';
import { getAiVerifyQueueCounts } from '@/services/media/mediaAssetService';

export type ReportNotificationCounts = {
  aiVerifyQueueTotal: number;
  aiVerifyByEntityType: Record<string, number>;
};

const EMPTY_COUNTS: ReportNotificationCounts = {
  aiVerifyQueueTotal: 0,
  aiVerifyByEntityType: {},
};

/**
 * Badge MF3 — conteggio esclusivo asset in VERIFICARE IMMAGINE AI (verify_ai_image).
 */
export function useReportNotificationCounts(enabled = true) {
  const [counts, setCounts] = useState<ReportNotificationCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generationRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const generation = ++generationRef.current;
    setLoading(true);
    try {
      const result = await getAiVerifyQueueCounts();
      if (generation !== generationRef.current) return;
      setCounts({
        aiVerifyQueueTotal: result.total,
        aiVerifyByEntityType: result.byEntityType,
      });
      setError(null);
    } catch (e) {
      if (generation !== generationRef.current) return;
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    } finally {
      if (generation === generationRef.current) {
        setLoading(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
    const onVisibility = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener('visibilitychange', onVisibility);
    const interval = window.setInterval(() => {
      if (!document.hidden) void refresh();
    }, 180000);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(interval);
    };
  }, [refresh]);

  return { counts, loading, error, refresh };
}
