import type { DatabaseLoadingTip, DatabaseNewsTicker } from '../types/database';
import type { DbInsert } from '../types/domain';
import type { LoadingTip, NewsTickerItem } from '../types/index';
import { supabase } from './supabaseClient';

type LoadingTipUpsertPayload = DbInsert<'loading_tips'>;

const NEWS_TICKER_ICONS = [
  'globe',
  'map',
  'sun',
  'camera',
  'users',
  'alert',
  'info',
  'calendar',
  'gift',
  'clock',
  'car',
  'megaphone',
] as const satisfies readonly NewsTickerItem['icon'][];

const isNewsTickerIcon = (value: string | null | undefined): value is NewsTickerItem['icon'] =>
  typeof value === 'string' && (NEWS_TICKER_ICONS as readonly string[]).includes(value);

// --- STATIC PAGES (DB) ---
export const getStaticPageContent = async (
  slug: string,
): Promise<{ title: string; content: string } | null> => {
  try {
    const { data, error } = await supabase
      .from('static_pages')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      // Silenzioso se non trovato, userà fallback UI
      return null;
    }

    if (data) {
      return {
        title: data.title ?? '',
        content: data.content_html ?? '',
      };
    }
  } catch (e) {
    console.error('[ContentService] Error fetching static page:', e);
  }
  return null;
};

// --- NEWS TICKER ---
export const getNewsTickerItemsAsync = async (): Promise<NewsTickerItem[]> => {
  try {
    const { data, error } = await supabase
      .from('news_ticker')
      .select('*')
      .order('order_index', { ascending: true }) // ORDINE PER INDICE
      .order('created_at', { ascending: false }); // FALLBACK

    if (error) throw error;

    return (data as DatabaseNewsTicker[]).map((n) => ({
      id: n.id,
      text: n.text,
      icon: isNewsTickerIcon(n.icon) ? n.icon : 'info',
      active: n.active ?? false,
      order: n.order_index ?? undefined,
    }));
  } catch (e: any) {
    // Degradazione graziosa: se è un errore di rete, non inondare la console di errori rossi
    if (e?.message === 'TypeError: Failed to fetch' || e?.message?.includes('fetch')) {
      console.warn('Ticker offline: Database non raggiungibile. Uso fallback.');
    } else {
      console.error('Errore critico ticker:', e);
    }
    return [];
  }
};

export const saveNewsTickerItemAsync = async (item: NewsTickerItem): Promise<boolean> => {
  try {
    const payload: DatabaseNewsTicker = {
      id: item.id,
      text: item.text,
      icon: item.icon,
      active: item.active,
      created_at: new Date().toISOString(),
      order_index: item.order ?? null,
    };
    await supabase.from('news_ticker').upsert(payload);
    return true;
  } catch (e) {
    return false;
  }
};

export const deleteNewsTickerItemAsync = async (id: string): Promise<boolean> => {
  try {
    await supabase.from('news_ticker').delete().eq('id', id);
    return true;
  } catch (e) {
    return false;
  }
};

// --- LOADING TIPS (DB PERSISTENCE) ---

export const getLoadingTipsAsync = async (): Promise<LoadingTip[]> => {
  try {
    const { data, error } = await supabase
      .from('loading_tips')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) throw error;

    return (data as DatabaseLoadingTip[]).map((t) => ({
      id: t.id,
      text: t.text,
      active: t.active ?? false,
      imageUrl: t.image_url ?? undefined,
      order: t.order_index ?? undefined,
      type: t.type === 'status' || t.type === 'tip' ? t.type : 'tip',
    }));
  } catch (e) {
    console.error('Errore caricamento tips:', e);
    return [
      {
        id: '1',
        text: 'Usa lo Smart Roadbook per il percorso perfetto!',
        active: true,
        type: 'tip',
      },
      { id: '2', text: 'Analisi della destinazione...', active: true, type: 'status' },
    ];
  }
};

export const saveLoadingTipAsync = async (tip: LoadingTip): Promise<boolean> => {
  try {
    const isNew = !tip.id || !tip.id.includes('-');

    const payload: LoadingTipUpsertPayload = {
      text: tip.text,
      active: tip.active,
      image_url: tip.imageUrl ?? null,
      order_index: tip.order || 0,
      type: tip.type || 'tip',
      created_at: new Date().toISOString(),
    };

    if (!isNew) {
      payload.id = tip.id;
    }

    const { error } = await supabase.from('loading_tips').upsert(payload).select().single();

    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Errore salvataggio tip:', e);
    return false;
  }
};

export const deleteLoadingTipAsync = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('loading_tips').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Errore eliminazione tip (Service):', e);
    return false;
  }
};
