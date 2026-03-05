
import { supabase } from './supabaseClient';
import { DatabaseTaxonomyMapping } from '../types/database';

export interface TaxonomyRule {
    id: string;
    inputTerm: string;
    category: string;
    subCategory: string;
    targetTab: string; // NEW
    context: 'poi' | 'event'; // NEW
}

export const getTaxonomyRules = async (context: 'poi' | 'event' = 'poi'): Promise<TaxonomyRule[]> => {
    const { data, error } = await supabase
        .from('taxonomy_mappings')
        .select('*')
        .eq('context', context)
        .order('input_term', { ascending: true });

    if (error) {
        console.error("Error fetching taxonomy:", error);
        return [];
    }

    return (data as DatabaseTaxonomyMapping[]).map(d => ({
        id: d.id,
        inputTerm: d.input_term,
        category: d.target_category,
        subCategory: d.target_subcategory,
        targetTab: d.target_tab || 'destinazioni',
        context: (d.context as 'poi' | 'event') || 'poi'
    }));
};

export const addTaxonomyRule = async (term: string, cat: string, sub: string, tab: string, context: 'poi' | 'event'): Promise<boolean> => {
    const { error } = await supabase.from('taxonomy_mappings').insert({
        input_term: term.toLowerCase().trim(),
        target_category: cat,
        target_subcategory: sub,
        target_tab: tab,
        context: context
    });
    return !error;
};

export const updateTaxonomyRule = async (id: string, term: string, cat: string, sub: string, tab: string, context: 'poi' | 'event'): Promise<boolean> => {
    const { error } = await supabase.from('taxonomy_mappings').update({
        input_term: term.toLowerCase().trim(),
        target_category: cat,
        target_subcategory: sub,
        target_tab: tab,
        context: context
    }).eq('id', id);
    return !error;
};

export const deleteTaxonomyRule = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('taxonomy_mappings').delete().eq('id', id);
    return !error;
};

// Funzione helper per l'AI: scarica tutto e crea una mappa veloce
// AGGIORNATO: Supporta il contesto opzionale per dizionari specifici
export const getTaxonomyDictionary = async (context: 'poi' | 'event' = 'poi'): Promise<Record<string, { cat: string, sub: string, tab: string }>> => {
    const rules = await getTaxonomyRules(context);
    const dict: Record<string, { cat: string, sub: string, tab: string }> = {};
    rules.forEach(r => {
        dict[r.inputTerm.toLowerCase()] = { cat: r.category, sub: r.subCategory, tab: r.targetTab };
    });
    return dict;
};