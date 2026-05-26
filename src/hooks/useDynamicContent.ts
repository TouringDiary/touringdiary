import { useConfig } from '@/context/ConfigContext';
import { useMemo } from 'react';
import { constructClassName } from './useDynamicStyles';

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
