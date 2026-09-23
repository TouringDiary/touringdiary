import { AI_RELIABILITY_VALUES, TOURISM_INTEREST_VALUES } from '@/constants/governance';
import type { DatabasePoi } from '../../../types/database';
import type { PointOfInterest } from '../../../types/index';
import { applyPrimaryImageCutoverForPoisList } from '../../media/entityPrimaryImageReadService';
import { supabase } from '../../supabaseClient';
import { mapDbPoiToApp } from './poiMapper';

export interface PaginatedPois {
  data: PointOfInterest[];
  count: number;
}

interface PoiFilterParams {
  cityId: string;
  page: number;
  pageSize: number;
  status?: string;
  search?: string;

  // Filtri Avanzati
  category?: string;
  subCategory?: string[];
  minRating?: number;
  reliability?: string[]; // ['high', 'medium', 'unknown', ...]
  interest?: string[]; // ['high', 'medium', 'unknown', ...]
  createdDates?: string[]; // ['2023-12-01', ...]
  updatedDates?: string[]; // ['2023-12-01', ...]
  priceLevel?: number[]; // [1, 2, 3, 4] - NEW

  sortBy: 'name' | 'date_added' | 'updated_at';
  sortDir: 'asc' | 'desc';
}

const POI_FILTER_INTEREST_ALLOWLIST = new Set<string>([...TOURISM_INTEREST_VALUES, 'unknown']);

const POI_FILTER_RELIABILITY_ALLOWLIST = new Set<string>([
  ...AI_RELIABILITY_VALUES,
  'unknown',
  'no_gps',
  'out_of_zone',
]);

const POSTGREST_LITERAL_NEEDS_QUOTES = /[,:()+".\\]/;

/** Valore letterale in filtro PostgREST (`.gt`/`.gte`/`.lt`/`.eq`/…); `:` e `.` sono riservati. */
function postgrestFilterLiteral(value: string): string {
  if (!POSTGREST_LITERAL_NEEDS_QUOTES.test(value)) return value;
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '""');
  return `"${escaped}"`;
}

function postgrestEqFilter(column: string, value: string): string {
  return `${column}.eq.${postgrestFilterLiteral(value)}`;
}

/** Espressione OR PostgREST (senza wrapper `or(...)`) per un singolo campo. */
function buildOrFilterExpression(
  column: string,
  values: string[],
  allowlist: Set<string>,
  specialMap?: Record<string, string>,
): string | null {
  if (!values || values.length === 0) return null;

  const conditions: string[] = [];

  for (const raw of values) {
    const val = raw.trim();
    if (!val || !allowlist.has(val)) continue;

    if (val === 'unknown') {
      conditions.push(`${column}.is.null`);
    } else if (specialMap?.[val]) {
      conditions.push(specialMap[val]);
    } else {
      conditions.push(postgrestEqFilter(column, val));
    }
  }

  if (conditions.length === 0) return null;
  return conditions.join(',');
}

/**
 * Caratteri che rompono la grammatica del filtro PostgREST (virgola, or/and, operatori).
 * I wildcard ilike (% _) restano nel termine: il pattern è delimitato dagli operatori .ilike.
 */
function stripPostgrestStructuralChars(term: string): string {
  return term
    .replace(/[,()+\\"'`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Escape wildcard ilike nel valore letterale (non altera il resto del testo). */
function escapeIlikeWildcards(term: string): string {
  return term.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

function buildPostgrestIlikePattern(term: string): string {
  const structuralSafe = stripPostgrestStructuralChars(term);
  if (structuralSafe.length === 0) return '';
  const pattern = `%${escapeIlikeWildcards(structuralSafe)}%`;
  return postgrestFilterLiteral(pattern);
}

function applyAndOrFilterGroups<T extends { or: (filters: string) => T }>(
  query: T,
  andOrGroups: string[],
): T {
  if (andOrGroups.length === 0) return query;
  if (andOrGroups.length === 1) {
    const inner = andOrGroups[0].startsWith('or(') ? andOrGroups[0].slice(3, -1) : andOrGroups[0];
    return query.or(inner);
  }
  return query.or(`and(${andOrGroups.join(',')})`);
}

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function isGregorianLeapYear(year: number): boolean {
  if (year % 400 === 0) return true;
  if (year % 100 === 0) return false;
  return year % 4 === 0;
}

function daysInGregorianMonth(year: number, month: number): number {
  const lengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && isGregorianLeapYear(year)) return 29;
  return lengths[month - 1] ?? 0;
}

function isValidIsoDateOnly(date: string): boolean {
  if (!ISO_DATE_ONLY.test(date)) return false;
  const year = Number.parseInt(date.slice(0, 4), 10);
  const month = Number.parseInt(date.slice(5, 7), 10);
  const day = Number.parseInt(date.slice(8, 10), 10);
  if (month < 1 || month > 12 || day < 1) return false;
  return day <= daysInGregorianMonth(year, month);
}

/**
 * Intervallo [inizio giorno, inizio giorno dopo) con literal `YYYY-MM-DDT00:00:00` senza offset.
 * Colonne DB: `pois.created_at` / `updated_at` (timestamptz, v. `src/types/supabase.ts`).
 * Il progetto non definisce una timezone SoT per i filtri date admin POI: il confine del giorno
 * segue la stessa convenzione già usata in passato (stringhe senza offset → regole PostgREST/session DB).
 */
/** Solo per date già validate con `isValidIsoDateOnly` (calendario gregoriano, senza timezone). */
function nextIsoDateOnly(date: string): string {
  let year = Number.parseInt(date.slice(0, 4), 10);
  let month = Number.parseInt(date.slice(5, 7), 10);
  let day = Number.parseInt(date.slice(8, 10), 10) + 1;
  const maxDay = daysInGregorianMonth(year, month);
  if (day > maxDay) {
    day = 1;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Range per singolo giorno (YYYY-MM-DD) in OR PostgREST — semantica [00:00, giorno successivo). */
const buildDateRangeFilter = (column: string, dates: string[]) => {
  if (!dates || dates.length === 0) return null;

  const conditions = dates
    .map((raw) => {
      const date = raw.trim();
      if (!isValidIsoDateOnly(date)) return null;

      const start = postgrestFilterLiteral(`${date}T00:00:00`);
      const nextDayStart = postgrestFilterLiteral(`${nextIsoDateOnly(date)}T00:00:00`);

      return `and(${column}.gte.${start},${column}.lt.${nextDayStart})`;
    })
    .filter(Boolean);

  if (conditions.length === 0) return null;
  return conditions.join(',');
};

export const getPoisPaginated = async (params: PoiFilterParams): Promise<PaginatedPois> => {
  try {
    let query = supabase.from('pois').select('*', { count: 'exact' }).eq('city_id', params.cityId);

    // 1. STATUS
    if (params.status && params.status !== 'all') {
      query = query.eq('status', params.status);
    }

    // 2. CATEGORIA
    if (params.category && params.category !== 'all') {
      query = query.eq('category', params.category);
    }

    // 3. SOTTOCATEGORIA
    if (params.subCategory && params.subCategory.length > 0) {
      query = query.in('sub_category', params.subCategory);
    }

    const andOrGroups: string[] = [];

    // 4. INTERESSE TURISTICO
    if (params.interest && params.interest.length > 0) {
      const expr = buildOrFilterExpression(
        'tourism_interest',
        params.interest,
        POI_FILTER_INTEREST_ALLOWLIST,
      );
      if (expr) andOrGroups.push(`or(${expr})`);
    }

    // 5. AFFIDABILITÀ AI
    if (params.reliability && params.reliability.length > 0) {
      const expr = buildOrFilterExpression(
        'ai_reliability',
        params.reliability,
        POI_FILTER_RELIABILITY_ALLOWLIST,
        {
          no_gps: 'coords_lat.eq.0',
          out_of_zone: 'ai_reliability.eq.invalidated',
        },
      );
      if (expr) andOrGroups.push(`or(${expr})`);
    }

    // 6. FILTRO DATA CREAZIONE
    if (params.createdDates && params.createdDates.length > 0) {
      const dateFilter = buildDateRangeFilter('created_at', params.createdDates);
      if (dateFilter) andOrGroups.push(`or(${dateFilter})`);
    }

    // 7. FILTRO DATA MODIFICA
    if (params.updatedDates && params.updatedDates.length > 0) {
      const dateFilter = buildDateRangeFilter('updated_at', params.updatedDates);
      if (dateFilter) andOrGroups.push(`or(${dateFilter})`);
    }

    // 8. FILTRO LIVELLO ECONOMICO
    if (params.priceLevel && params.priceLevel.length > 0) {
      query = query.in('price_level', params.priceLevel);
    }

    // 9. RATING
    if (params.minRating && params.minRating > 0) {
      query = query.gte('rating', params.minRating);
    }

    // 10. SEARCH
    if (params.search) {
      const ilikePattern = buildPostgrestIlikePattern(params.search);
      if (ilikePattern.length > 0) {
        andOrGroups.push(`or(name.ilike.${ilikePattern},address.ilike.${ilikePattern})`);
      }
    }

    query = applyAndOrFilterGroups(query, andOrGroups);

    // ORDINAMENTO
    const sortColumn = params.sortBy === 'date_added' ? 'created_at' : params.sortBy;
    query = query.order(sortColumn, { ascending: params.sortDir === 'asc' });

    // PAGINAZIONE
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('DB Error getPoisPaginated:', JSON.stringify(error, null, 2));
      throw error;
    }

    const mapped = (data as DatabasePoi[]).map(mapDbPoiToApp);
    return {
      data: await applyPrimaryImageCutoverForPoisList(mapped),
      count: count || 0,
    };
  } catch (e: unknown) {
    console.error('Critical Error fetching POIs:', e);
    throw e;
  }
};

// --- ALTRI METODI DI LETTURA ---

/**
 * Recupera un batch di POI che necessitano di bonifica.
 */
export const getPoisForDeepScan = async (
  cityId: string,
  limit: number = 10,
): Promise<PointOfInterest[]> => {
  const { data } = await supabase
    .from('pois')
    .select('*')
    .eq('city_id', cityId)
    .not('ai_reliability', 'like', '%+%')
    .neq('ai_reliability', 'invalidated')
    .order('created_at', { ascending: false })
    .limit(limit);

  return applyPrimaryImageCutoverForPoisList(((data as DatabasePoi[]) || []).map(mapDbPoiToApp));
};

export const getPoisByCityId = async (cityId: string): Promise<PointOfInterest[]> => {
  const { data } = await supabase.from('pois').select('*').eq('city_id', cityId);
  return applyPrimaryImageCutoverForPoisList(((data as DatabasePoi[]) || []).map(mapDbPoiToApp));
};

export const getAllPoisGlobal = async (): Promise<PointOfInterest[]> => {
  const { data, error } = await supabase.from('pois').select('*');
  if (error) return [];
  return applyPrimaryImageCutoverForPoisList(((data as DatabasePoi[]) || []).map(mapDbPoiToApp));
};

export const getPoisByCityIds = async (cityIds: string[]): Promise<PointOfInterest[]> => {
  if (cityIds.length === 0) return [];
  const { data } = await supabase.from('pois').select('*').in('city_id', cityIds);
  return applyPrimaryImageCutoverForPoisList(((data as DatabasePoi[]) || []).map(mapDbPoiToApp));
};

/** Recupera POI per id (singola query `.in('id', ids)`; chunking non implementato). */
export const getPoisByIds = async (ids: string[]): Promise<PointOfInterest[]> => {
  if (!ids || ids.length === 0) return [];

  const { data, error } = await supabase.from('pois').select('*').in('id', ids);

  if (error) {
    console.error('Error fetching POIs by IDs:', error);
    return [];
  }

  return applyPrimaryImageCutoverForPoisList(((data as DatabasePoi[]) || []).map(mapDbPoiToApp));
};
