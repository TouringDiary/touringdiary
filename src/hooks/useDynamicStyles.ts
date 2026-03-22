
import { useConfig } from '@/context/ConfigContext';
import { useMemo } from 'react';
import { StyleRule } from '../types/designSystem';

// --- FIX: La funzione ora include tutte le proprietà di StyleRule ---
export const constructClassName = (rule: Partial<StyleRule>): string => {
    if (!rule) {
        return '';
    }

    // Se la sezione NON è 'typography', manteniamo la logica di priorità per css_class.
    if (rule.section !== 'typography') {
        if (rule.css_class && rule.css_class.length > 3) {
            return `${rule.css_class}`.trim();
        }
    }

    // Per 'typography' (o altri senza css_class), costruisce la classe dinamicamente.
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

export const useDynamicStyles = (componentKey: string, isMobile: boolean = false): string => {
    const effectiveKey = isMobile ? `${componentKey}_mobile` : componentKey;
    const { configs } = useConfig();

    const styleClass = useMemo(() => {
            const styleRule = configs?.design_system_rules?.[effectiveKey];

        if (!styleRule) {
            if (process.env.NODE_ENV === 'development' && configs?.design_system_rules) {
                console.warn(`[useDynamicStyles] Component key "${effectiveKey}" not found in design_system_rules.`);
            }
            return '';
        }

        return constructClassName(styleRule);
    }, [effectiveKey, configs]);

    return styleClass;
};

export const subscribeToDesignUpdates = () => {
  // legacy compatibility - no longer needed with ConfigContext
  return () => {};
};
