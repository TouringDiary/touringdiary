import type { CityDetails } from '../models/City';

/** Coordinate GPS restituite da generateSingleField('coords'). */
export interface CityCoordsAiResult {
    lat: number;
    lng: number;
}

/** Gerarchia geografica restituita da generateSingleField('hierarchy'). */
export interface CityHierarchyAiResult {
    continent: string;
    nation: string;
    adminRegion: string;
    zone: string;
}

/** OUTPUT JSON sezione general (prompt city_gen_general). */
export interface CityGeneralAiResult {
    description?: string;
    subtitle?: string;
    zone?: string;
    lat?: number;
    lng?: number;
    officialWebsite?: string;
    continent?: string;
    nation?: string;
    adminRegion?: string;
}

export interface CitySeasonalVisitorsAiResult {
    spring: number;
    summer: number;
    autumn: number;
    winter: number;
}

/** OUTPUT JSON sezione stats (prompt city_gen_stats). */
export interface CityStatsAiResult {
    visitorsEstimate?: number;
    seasonalVisitors?: CitySeasonalVisitorsAiResult;
}

/** OUTPUT JSON sezione history (prompt city_gen_history). */
export interface CityHistoryAiResult {
    historySnippet?: string;
    historyFull?: string;
}

export type CityRatingsBlock = CityDetails['details']['ratings'];

/** OUTPUT JSON sezione ratings (prompt city_gen_ratings). */
export interface CityRatingsAiResult {
    ratings?: Partial<CityRatingsBlock>;
}

/** Santo patrono nested in OUTPUT JSON sezione patron. */
export interface CityPatronAiPatron {
    name: string;
    date?: string;
    history?: string;
}

/** OUTPUT JSON sezione patron (prompt city_gen_patron). */
export interface CityPatronAiResult {
    patron?: CityPatronAiPatron;
}

export type CitySectionKey = 'general' | 'stats' | 'history' | 'ratings' | 'patron';

export type CitySectionAiResultMap = {
    general: CityGeneralAiResult;
    stats: CityStatsAiResult;
    history: CityHistoryAiResult;
    ratings: CityRatingsAiResult;
    patron: CityPatronAiResult;
};

const RATING_KEYS: (keyof CityRatingsBlock)[] = [
    'cultura', 'monumenti', 'musei_arte', 'tradizione', 'architettura',
    'natura', 'mare_spiagge', 'paesaggi', 'clima', 'sostenibilita',
    'gusto', 'cucina', 'vita_notturna', 'caffe_bar', 'mercati',
    'viaggiatore', 'mobilita', 'accoglienza', 'costo', 'sicurezza',
];

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseCityCoordsAiResult(raw: unknown): CityCoordsAiResult {
    if (!isRecord(raw)) {
        throw new Error('city AI coords: expected JSON object');
    }
    if (typeof raw.lat !== 'number' || typeof raw.lng !== 'number') {
        throw new Error('city AI coords: lat and lng must be numbers');
    }
    return { lat: raw.lat, lng: raw.lng };
}

export function parseCityHierarchyAiResult(raw: unknown): CityHierarchyAiResult {
    if (!isRecord(raw)) {
        throw new Error('city AI hierarchy: expected JSON object');
    }
    const { continent, nation, adminRegion, zone } = raw;
    if (
        typeof continent !== 'string'
        || typeof nation !== 'string'
        || typeof adminRegion !== 'string'
        || typeof zone !== 'string'
    ) {
        throw new Error('city AI hierarchy: continent, nation, adminRegion and zone must be strings');
    }
    return { continent, nation, adminRegion, zone };
}

export function parseCityGeneralAiResult(raw: unknown): CityGeneralAiResult {
    if (!isRecord(raw)) {
        return {};
    }

    const result: CityGeneralAiResult = {};

    if (typeof raw.description === 'string') result.description = raw.description;
    if (typeof raw.subtitle === 'string') result.subtitle = raw.subtitle;
    if (typeof raw.zone === 'string') result.zone = raw.zone;
    if (typeof raw.officialWebsite === 'string') result.officialWebsite = raw.officialWebsite;
    if (typeof raw.continent === 'string') result.continent = raw.continent;
    if (typeof raw.nation === 'string') result.nation = raw.nation;
    if (typeof raw.adminRegion === 'string') result.adminRegion = raw.adminRegion;

    if (typeof raw.lat === 'number') result.lat = raw.lat;
    if (typeof raw.lng === 'number') result.lng = raw.lng;

    if (isRecord(raw.coords)) {
        if (typeof raw.coords.lat === 'number') result.lat = raw.coords.lat;
        if (typeof raw.coords.lng === 'number') result.lng = raw.coords.lng;
    }

    return result;
}

function parseSeasonalVisitors(raw: unknown): CitySeasonalVisitorsAiResult | undefined {
    if (!isRecord(raw)) return undefined;

    const seasonal: CitySeasonalVisitorsAiResult = {
        spring: typeof raw.spring === 'number' ? raw.spring : 0,
        summer: typeof raw.summer === 'number' ? raw.summer : 0,
        autumn: typeof raw.autumn === 'number' ? raw.autumn : 0,
        winter: typeof raw.winter === 'number' ? raw.winter : 0,
    };

    return seasonal;
}

export function parseCityStatsAiResult(raw: unknown): CityStatsAiResult {
    if (!isRecord(raw)) {
        return {};
    }

    const result: CityStatsAiResult = {};
    if (typeof raw.visitorsEstimate === 'number') {
        result.visitorsEstimate = raw.visitorsEstimate;
    }

    const seasonalVisitors = parseSeasonalVisitors(raw.seasonalVisitors);
    if (seasonalVisitors) {
        result.seasonalVisitors = seasonalVisitors;
    }

    return result;
}

export function parseCityHistoryAiResult(raw: unknown): CityHistoryAiResult {
    if (!isRecord(raw)) {
        return {};
    }

    const result: CityHistoryAiResult = {};
    if (typeof raw.historySnippet === 'string') result.historySnippet = raw.historySnippet;
    if (typeof raw.historyFull === 'string') result.historyFull = raw.historyFull;
    return result;
}

function parseRatingsBlock(raw: unknown): Partial<CityRatingsBlock> | undefined {
    if (!isRecord(raw)) return undefined;

    const ratings: Partial<CityRatingsBlock> = {};
    for (const key of RATING_KEYS) {
        const value = raw[key];
        if (typeof value === 'number') {
            ratings[key] = value;
        }
    }

    return Object.keys(ratings).length > 0 ? ratings : undefined;
}

export function parseCityRatingsAiResult(raw: unknown): CityRatingsAiResult {
    if (!isRecord(raw)) {
        return {};
    }

    const ratings = parseRatingsBlock(raw.ratings);
    return ratings ? { ratings } : {};
}

function parsePatron(raw: unknown): CityPatronAiPatron | undefined {
    if (!isRecord(raw) || typeof raw.name !== 'string') {
        return undefined;
    }

    const patron: CityPatronAiPatron = { name: raw.name };
    if (typeof raw.date === 'string') patron.date = raw.date;
    if (typeof raw.history === 'string') patron.history = raw.history;
    return patron;
}

export function parseCityPatronAiResult(raw: unknown): CityPatronAiResult {
    if (!isRecord(raw)) {
        return {};
    }

    const patron = parsePatron(raw.patron);
    return patron ? { patron } : {};
}

export function parseCitySectionAiResult(section: 'general', raw: unknown): CityGeneralAiResult;
export function parseCitySectionAiResult(section: 'stats', raw: unknown): CityStatsAiResult;
export function parseCitySectionAiResult(section: 'history', raw: unknown): CityHistoryAiResult;
export function parseCitySectionAiResult(section: 'ratings', raw: unknown): CityRatingsAiResult;
export function parseCitySectionAiResult(section: 'patron', raw: unknown): CityPatronAiResult;
export function parseCitySectionAiResult(
    section: CitySectionKey,
    raw: unknown,
): CitySectionAiResultMap[CitySectionKey] {
    switch (section) {
        case 'general':
            return parseCityGeneralAiResult(raw);
        case 'stats':
            return parseCityStatsAiResult(raw);
        case 'history':
            return parseCityHistoryAiResult(raw);
        case 'ratings':
            return parseCityRatingsAiResult(raw);
        case 'patron':
            return parseCityPatronAiResult(raw);
    }
}
