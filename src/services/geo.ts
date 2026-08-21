/**
 * Utility Geografiche Matematiche (Safe)
 * Nota: La logica di richiesta permessi (navigator.geolocation) è stata spostata
 * direttamente in src/hooks/core/useGpsManager.ts per rispettare le policy dei browser.
 */

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;

  const R = 6371; // Raggio della terra in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return Math.round(d * 10) / 10;
};

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

import type { GeoIdNameOption } from '../types/models/Sponsor';
import { supabase } from './supabaseClient';

const FALLBACK_CONTINENT: GeoIdNameOption = { id: 'Europa', name: 'Europa' };

const toIdNameOptions = (values: Array<string | null>): GeoIdNameOption[] =>
  Array.from(new Set(values.filter((v): v is string => typeof v === 'string' && v.length > 0)))
    .sort()
    .map((name) => ({ id: name, name }));

// --- FUNZIONI REALI PER FILTRI SPONSOR ---

export const getContinents = async (): Promise<GeoIdNameOption[]> => {
  const { data, error } = await supabase
    .from('cities')
    .select('continent')
    .not('continent', 'is', null);

  if (error) return [FALLBACK_CONTINENT];
  return toIdNameOptions((data ?? []).map((d) => d.continent));
};

export const getNations = async (continentId: string): Promise<GeoIdNameOption[]> => {
  const { data, error } = await supabase
    .from('cities')
    .select('nation')
    .eq('continent', continentId)
    .not('nation', 'is', null);

  if (error) return [];
  return toIdNameOptions((data ?? []).map((d) => d.nation));
};

export const getAdminRegions = async (nationId: string): Promise<GeoIdNameOption[]> => {
  const { data, error } = await supabase
    .from('cities')
    .select('admin_region')
    .eq('nation', nationId)
    .not('admin_region', 'is', null);

  if (error) return [];
  return toIdNameOptions((data ?? []).map((d) => d.admin_region));
};

export const getZones = async (adminRegionId: string): Promise<GeoIdNameOption[]> => {
  const { data, error } = await supabase
    .from('cities')
    .select('zone')
    .eq('admin_region', adminRegionId)
    .not('zone', 'is', null);

  if (error) return [];
  return toIdNameOptions((data ?? []).map((d) => d.zone));
};

export const getCitiesByZone = async (zoneId: string): Promise<GeoIdNameOption[]> => {
  const { data, error } = await supabase
    .from('cities')
    .select('id, name')
    .eq('zone', zoneId)
    .order('name');

  if (error) return [];
  return (data ?? []).map((d) => ({ id: d.id, name: d.name }));
};
