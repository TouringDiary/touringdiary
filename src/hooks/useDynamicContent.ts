import { useConfig } from '@/context/ConfigContext';
import { useMemo } from 'react';

// Funzione helper per costruire la classe CSS, allineata con useDynamicStyles.
const constructClassName = (rule: any): string => {
    if (!rule) {
        return '';
    }
    if (rule.css_class && rule.css_class.length > 3) {
        return `${rule.css_class} ${rule.color_class || ''}`.trim();
    }
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
    const { configs } = useConfig(); // 1. Utilizzo del Context

    // useMemo garantisce che il calcolo venga rieseguito solo se configs o effectiveKey cambiano.
    const componentConfig = useMemo(() => {
        // Safeguard per il caricamento iniziale
        if (!configs || !configs.design_system_rules) {
            return { style: '', text: '' };
        }

        const rule = configs.design_system_rules[effectiveKey];

        if (!rule) {
            if (process.env.NODE_ENV === 'development') {
                console.warn(`[useDynamicContent] Component key "${effectiveKey}" not found in design_system_rules.`);
            }
            return { style: '', text: '' };
        }

        // 2. Estrazione dei dati (stile e testo) direttamente dal context
        const style = constructClassName(rule);
        const text = rule.preview_text || ''; 

        return { style, text };

    }, [effectiveKey, configs]); // 3. Reattività basata sulle dipendenze del context

    return componentConfig;
};
