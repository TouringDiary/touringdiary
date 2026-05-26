
import { useConfig } from '@/context/ConfigContext';
import { useMemo } from 'react';
import { StyleRule } from '../types/designSystem';

/** Layout/spacing/sizing utilities — non typography. */
export const constructUtilityClassName = (rule: Partial<StyleRule>): string => {
    if (!rule) {
        return '';
    }

    return [
        rule.css_class?.trim(),
        rule.color_class?.trim(),
        rule.effect_class !== 'none' ? rule.effect_class?.trim() : undefined,
    ].filter(Boolean).join(' ').trim();
};

export const constructClassName = (rule: Partial<StyleRule>): string => {
    if (!rule) {
        return '';
    }

    // Utility-first: css_class presente → sizing/layout + color/effect opzionali.
    if (rule.css_class?.trim()) {
        return constructUtilityClassName(rule);
    }

    // Typography (+ color/effect tipografici).
    const parts = [
        rule.font_family,
        rule.text_size,
        rule.font_weight,
        rule.line_height,
        rule.text_transform !== 'none' ? rule.text_transform : undefined,
        rule.tracking,
        rule.color_class,
        rule.effect_class !== 'none' ? rule.effect_class : undefined,
    ];

    return parts.filter(Boolean).join(' ').trim();
};

export const useDynamicStyles = (componentKey: string, isMobile: boolean = false): string => {
    const effectiveKey = isMobile ? `${componentKey}_mobile` : componentKey;
    const { configs } = useConfig();

    const styleClass = useMemo(() => {
            const styleRule = configs?.design_system_rules?.[effectiveKey];

        if (!styleRule) {
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
