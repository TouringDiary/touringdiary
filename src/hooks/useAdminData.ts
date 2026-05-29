
import { useState, useEffect, useCallback } from 'react';
import { CitySummary, CityDetails } from '../types/index';
import * as CityService from '../services/cityService';

export const useAdminData = () => {
    const [cities, setCities] = useState<CitySummary[]>([]);
    const [loading, setLoading] = useState(false);

    const refreshManifest = useCallback(async () => {
        setLoading(true);
        try {
            const data = await CityService.getFullManifestAsync(false);
            setCities(data);
        } catch (e) {
            console.error("Failed to refresh manifest from cloud", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshManifest();
    }, [refreshManifest]);

    const updateCity = async (city: CitySummary) => {
        setLoading(true);
        await CityService.saveManifestItem(city);
        await refreshManifest();
        setLoading(false);
    };

    const getFullCity = async (id: string) => {
        return await CityService.getCityDetails(id, undefined, { peopleAudience: 'admin' });
    };

    const saveFullCity = async (city: CityDetails) => {
        setLoading(true);
        try {
            await CityService.saveCityDetails(city);
            await refreshManifest();
        } finally {
            setLoading(false);
        }
    };

    return {
        cities,
        loading,
        updateCity,
        getFullCity,
        saveFullCity,
        refreshManifest
    };
};
