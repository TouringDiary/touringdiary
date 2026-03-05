
import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { DesignRule } from '../types/designSystem';

export const useDesignSystem = () => {
    const [rules, setRules] = useState<DesignRule[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRules = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('design_system_rules')
            .select('*')
            .order('section', { ascending: true })
            .order('element_name', { ascending: true });
        
        if (error) {
            console.error("Error fetching rules:", error);
        } else {
            setRules(data || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const updateRule = async (updatedRule: DesignRule) => {
        // Aggiornamento atomico su Supabase
        const { data, error } = await supabase
            .from('design_system_rules')
            .update({
                font_family: updatedRule.font_family,
                text_size: updatedRule.text_size,
                font_weight: updatedRule.font_weight,
                text_transform: updatedRule.text_transform,
                tracking: updatedRule.tracking,
                color_class: updatedRule.color_class,
                effect_class: updatedRule.effect_class,
                preview_text: updatedRule.preview_text,
                updated_at: new Date().toISOString()
            })
            .eq('id', updatedRule.id)
            .select(); // Fondamentale: chiede indietro i dati salvati

        // Se data esiste e ha lunghezza > 0, il salvataggio è reale.
        if (!error && data && data.length > 0) {
            setRules(prev => prev.map(r => r.id === updatedRule.id ? updatedRule : r));
            return true;
        } else {
            console.error("Salvataggio fallito (RLS o ID non trovato):", error);
            return false;
        }
    };

    return { rules, isLoading, updateRule, refreshRules: fetchRules };
};
