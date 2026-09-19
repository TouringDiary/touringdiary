import { useCallback, useEffect, useRef, useState } from 'react';
import { listCityPatronGallery } from '@/services/patron/cityPatronGalleryService';
import type { CityPatronGalleryPhoto } from '@/types/models/patronGallery';

export const useCityPatronGallery = (cityId: string | undefined, enabled = true) => {
  const [photos, setPhotos] = useState<CityPatronGalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const reload = useCallback(async () => {
    if (!cityId || !enabled) {
      requestIdRef.current += 1;
      setPhotos([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const data = await listCityPatronGallery(cityId, { maskSuspendedAssignments: true });
      if (requestId !== requestIdRef.current) return;
      setPhotos(data);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setError('Impossibile caricare la gallery Patrono.');
      setPhotos([]);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [cityId, enabled]);

  useEffect(() => {
    if (!cityId || !enabled) {
      requestIdRef.current += 1;
      setPhotos([]);
      setIsLoading(false);
      setError(null);
      return;
    }
    void reload();
  }, [cityId, enabled, reload]);

  return { photos, isLoading, error, reload };
};
