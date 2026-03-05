
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { subscribeToDesignUpdates } from './useDynamicStyles'; 

// Cache in memoria
const contentCache: Record<string, { style: string, text: string }> = {};

const constructClassName = (rule: any) => {
    if (!rule) return '';
    if (rule.css_class && rule.css_class.length > 3) return rule.css_class;

    const parts = [
        rule.font_family,
        rule.text_size,
        rule.font_weight,
        rule.text_transform,
        rule.tracking,
        rule.color_class,
        rule.effect_class !== 'none' ? rule.effect_class : ''
    ];
    return parts.filter(Boolean).join(' ').trim();
};

export const useDynamicContent = (componentKey: string, isMobile: boolean = false) => {
    const effectiveKey = isMobile ? `${componentKey}_mobile` : componentKey;
    const [config, setConfig] = useState<{ style: string, text: string }>(
        contentCache[effectiveKey] || { style: '', text: '' }
    );
    const isMounted = useRef(true);

    const fetchContent = async () => {
        try {
            const { data, error } = await supabase
                .from('design_system_rules')
                .select('font_family, text_size, font_weight, text_transform, tracking, color_class, effect_class, css_class, preview_text')
                .eq('component_key', effectiveKey)
                .maybeSingle();

            if (data) {
                const newConfig = {
                    style: constructClassName(data),
                    text: data.preview_text || '' // Qui prendiamo il testo reale dal DB
                };
                
                // Aggiorna cache e stato
                contentCache[effectiveKey] = newConfig;
                
                if (isMounted.current) {
                    setConfig(newConfig);
                }
            }
        } catch (e) {
            console.error("Errore fetch dynamic content:", e);
        }
    };

    useEffect(() => {
        isMounted.current = true;
        
        // 1. Caricamento iniziale
        fetchContent();

        // 2. Iscrizione all'evento globale di refresh (triggerato dal tasto Salva Admin)
        const unsubscribe = subscribeToDesignUpdates(() => {
            // Rimuovi dalla cache per forzare il refresh fresco dal DB
            delete contentCache[effectiveKey];
            fetchContent();
        });

        return () => { 
            isMounted.current = false; 
            unsubscribe();
        };
    }, [effectiveKey]);

    return config;
};
