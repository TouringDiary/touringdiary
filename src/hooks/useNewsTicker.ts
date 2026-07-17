import { useEffect, useState } from 'react';
import { getNewsTickerItemsAsync } from '@/services/contentService';
import { getSetting } from '@/services/settingsService';
import type { NewsTickerItem } from '@/types/index';

interface BootstrapTickerRow {
    id: string;
    text: string;
    icon: NewsTickerItem['icon'];
    active: boolean;
    order_index?: number;
}

interface BootstrapTickerConfig {
    duration?: number;
}

interface BootstrapContentResponse {
    success: true;
    ticker: BootstrapTickerRow[];
    tickerConfig?: BootstrapTickerConfig;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

const TICKER_ICONS = [
    'globe', 'map', 'sun', 'camera', 'users', 'alert', 'info',
    'calendar', 'gift', 'clock', 'car', 'megaphone',
] as const satisfies readonly NewsTickerItem['icon'][];

/** Icone note tipizzate; sconosciute → `globe` (stesso fallback visuale di ICON_MAP). */
function parseTickerIcon(value: string): NewsTickerItem['icon'] {
    for (const icon of TICKER_ICONS) {
        if (icon === value) return icon;
    }
    return 'globe';
}

function parseBootstrapTickerRow(value: unknown): BootstrapTickerRow | null {
    if (!isRecord(value)) return null;
    if (typeof value.id !== 'string' || typeof value.text !== 'string') return null;
    if (typeof value.icon !== 'string' || typeof value.active !== 'boolean') return null;

    const row: BootstrapTickerRow = {
        id: value.id,
        text: value.text,
        icon: parseTickerIcon(value.icon),
        active: value.active,
    };
    if (typeof value.order_index === 'number') {
        row.order_index = value.order_index;
    }
    return row;
}

/** Valida il payload bootstrap; `null` → stesso percorso di `!success` (fallback Supabase). */
function parseBootstrapContent(data: unknown): BootstrapContentResponse | null {
    if (!isRecord(data) || !data.success) return null;

    const ticker = Array.isArray(data.ticker)
        ? data.ticker.flatMap((row) => {
            const parsed = parseBootstrapTickerRow(row);
            return parsed ? [parsed] : [];
        })
        : [];

    let tickerConfig: BootstrapTickerConfig | undefined;
    if (isRecord(data.tickerConfig)) {
        tickerConfig =
            typeof data.tickerConfig.duration === 'number'
                ? { duration: data.tickerConfig.duration }
                : {};
    }

    return { success: true, ticker, tickerConfig };
}

function isActiveTickerItem(item: NewsTickerItem): boolean {
    return Boolean(item && item.active && item.id);
}

function mapBootstrapRow(n: BootstrapTickerRow): NewsTickerItem {
    return {
        id: n.id,
        text: n.text,
        icon: n.icon,
        active: n.active,
        order: n.order_index,
    };
}

export interface UseNewsTickerOptions {
    overrideSpeed?: number;
    overrideItems?: NewsTickerItem[];
}

export interface UseNewsTickerResult {
    newsItems: NewsTickerItem[];
    speed: number;
}

/**
 * Carica items e velocità della News Bar (API bootstrap → fallback Supabase).
 * Override props: stesso comportamento di NewsTicker pre-estrazione.
 */
export function useNewsTicker({
    overrideSpeed,
    overrideItems,
}: UseNewsTickerOptions = {}): UseNewsTickerResult {
    const [newsItems, setNewsItems] = useState<NewsTickerItem[]>([]);
    const [speed, setSpeed] = useState(80);

    useEffect(() => {
        if (overrideSpeed !== undefined && overrideItems !== undefined) {
            setSpeed(overrideSpeed);
            setNewsItems(overrideItems.filter(isActiveTickerItem));
            return;
        }

        const load = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bootstrap/content`);
                if (response.ok) {
                    const apiRes = parseBootstrapContent(await response.json());
                    if (apiRes) {
                        const items: NewsTickerItem[] = apiRes.ticker.map(mapBootstrapRow);
                        setNewsItems(items.filter(isActiveTickerItem));
                        if (apiRes.tickerConfig?.duration) {
                            setSpeed(apiRes.tickerConfig.duration);
                        }
                        return;
                    }
                }
            } catch {
                console.warn('[NewsTicker] API locale fallita, uso fallback Supabase');
            }

            const [items, config] = await Promise.all([
                getNewsTickerItemsAsync(),
                getSetting<{ duration: number }>('ticker_config'),
            ]);
            setNewsItems((items || []).filter(isActiveTickerItem));
            if (config && config.duration) setSpeed(config.duration);
        };
        void load();
    }, [overrideSpeed, overrideItems]);

    return { newsItems, speed };
}
