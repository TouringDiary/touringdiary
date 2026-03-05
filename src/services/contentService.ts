
import { supabase } from './supabaseClient';
import { NewsTickerItem, LoadingTip } from '../types/index';
import { DatabaseNewsTicker, DatabaseLoadingTip, DatabaseStaticPage } from '../types/database';
import { getStorageItem, setStorageItem } from './storageService';

// --- STATIC PAGES (DB) ---
export const getStaticPageContent = async (slug: string): Promise<{ title: string, content: string } | null> => {
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
            return { title: data.title, content: data.content_html };
        }

    } catch (e) {
        console.error("[ContentService] Error fetching static page:", e);
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
        
        return (data as DatabaseNewsTicker[]).map(n => ({
            id: n.id,
            text: n.text,
            icon: n.icon as any,
            active: n.active,
            order: n.order_index
        }));
    } catch (e: any) {
        // Degradazione graziosa: se è un errore di rete, non inondare la console di errori rossi
        if (e?.message === 'TypeError: Failed to fetch' || e?.message?.includes('fetch')) {
            console.warn("Ticker offline: Database non raggiungibile. Uso fallback.");
        } else {
            console.error("Errore critico ticker:", e);
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
            order_index: item.order
        };
        await supabase.from('news_ticker').upsert(payload);
        return true;
    } catch (e) { return false; }
};

export const deleteNewsTickerItemAsync = async (id: string): Promise<boolean> => {
    try {
        await supabase.from('news_ticker').delete().eq('id', id);
        return true;
    } catch (e) { return false; }
};

// --- LOADING TIPS (DB PERSISTENCE) ---

export const getLoadingTipsAsync = async (): Promise<LoadingTip[]> => {
    try {
        const { data, error } = await supabase
            .from('loading_tips')
            .select('*')
            .order('order_index', { ascending: true }); 
            
        if (error) throw error;
        
        return (data as DatabaseLoadingTip[]).map(t => ({
            id: t.id,
            text: t.text,
            active: t.active,
            imageUrl: t.image_url,
            order: t.order_index,
            type: t.type as 'tip' | 'status' || 'tip' 
        }));
    } catch (e) {
        console.error("Errore caricamento tips:", e);
        return [
            { id: '1', text: 'Usa lo Smart Roadbook per il percorso perfetto!', active: true, type: 'tip' },
            { id: '2', text: 'Analisi della destinazione...', active: true, type: 'status' }
        ];
    }
};

export const saveLoadingTipAsync = async (tip: LoadingTip): Promise<boolean> => {
    try {
        const isNew = !tip.id || !tip.id.includes('-');
        
        const payload: any = {
            text: tip.text,
            active: tip.active,
            image_url: tip.imageUrl,
            order_index: tip.order || 0,
            type: tip.type || 'tip',
            created_at: new Date().toISOString()
        };
        
        if (!isNew) {
            payload.id = tip.id;
        }

        const { data, error } = await supabase
            .from('loading_tips')
            .upsert(payload)
            .select()
            .single();

        if (error) throw error;
        return true;
    } catch (e) {
        console.error("Errore salvataggio tip:", e);
        return false;
    }
};

export const deleteLoadingTipAsync = async (id: string): Promise<boolean> => {
    try {
        const { error } = await supabase.from('loading_tips').delete().eq('id', id);
        if (error) throw error;
        return true;
    } catch (e) {
        console.error("Errore eliminazione tip (Service):", e);
        return false;
    }
};
