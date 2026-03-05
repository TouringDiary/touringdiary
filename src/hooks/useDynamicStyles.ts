
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';

// --- ROBUST EVENT BUS SYSTEM (HMR PROOF) ---
// Usiamo un oggetto globale sulla window per mantenere i listener attivi
// anche quando il modulo viene ricaricato dall'HMR (Hot Module Replacement).

const EVENT_NAME = 'refresh-design-system';

// Estendiamo l'interfaccia Window
declare global {
    interface Window {
        __TD_STYLE_BUS__?: {
            listeners: Set<() => void>;
            cache: Record<string, string>;
            isAttached: boolean;
        };
    }
}

// Inizializzazione Singleton Globale
if (typeof window !== 'undefined') {
    if (!window.__TD_STYLE_BUS__) {
        window.__TD_STYLE_BUS__ = {
            listeners: new Set(),
            cache: {},
            isAttached: false
        };
    }
}

// Accessor sicuro
const getBus = () => {
    if (typeof window === 'undefined') return null;
    return window.__TD_STYLE_BUS__;
};

const notifyListeners = () => {
    const bus = getBus();
    if (!bus) return;
    
    // Invalida cache
    bus.cache = {};
    
    // Notifica tutti
    bus.listeners.forEach(cb => {
        try { cb(); } catch (e) { console.error("[StyleBus] Listener error:", e); }
    });
};

// Setup del listener DOM (Una volta sola per sessione browser)
const setupDomListener = () => {
    const bus = getBus();
    if (!bus || bus.isAttached) return;
    
    window.addEventListener(EVENT_NAME, notifyListeners);
    bus.isAttached = true;
};

export const subscribeToDesignUpdates = (callback: () => void) => {
    const bus = getBus();
    if (!bus) return () => {};
    
    setupDomListener();
    bus.listeners.add(callback);
    
    return () => {
        bus.listeners.delete(callback);
    };
};

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

export const useDynamicStyles = (componentKey: string, isMobile: boolean = false) => {
    const effectiveKey = isMobile ? `${componentKey}_mobile` : componentKey;
    const bus = getBus();
    
    // Stato iniziale dalla cache globale se disponibile
    const [styleClass, setStyleClass] = useState<string>(bus?.cache[effectiveKey] || '');
    const isMounted = useRef(true);

    const fetchStyle = async () => {
        if (!bus) return;

        // Cache Hit
        if (bus.cache[effectiveKey]) {
            if (isMounted.current) setStyleClass(bus.cache[effectiveKey]);
            return;
        }

        try {
            const { data } = await supabase
                .from('design_system_rules')
                .select('font_family, text_size, font_weight, text_transform, tracking, color_class, effect_class, css_class')
                .eq('component_key', effectiveKey)
                .maybeSingle();

            if (data) {
                const dbStyle = constructClassName(data);
                bus.cache[effectiveKey] = dbStyle;
                if (isMounted.current) setStyleClass(dbStyle);
            } else {
                bus.cache[effectiveKey] = ''; // Cache empty result
            }
        } catch (e) {
            // Silent fail
        }
    };

    useEffect(() => {
        isMounted.current = true;
        fetchStyle();

        const unsubscribe = subscribeToDesignUpdates(() => {
            fetchStyle();
        });
        
        return () => { 
            isMounted.current = false; 
            unsubscribe();
        };
    }, [effectiveKey]);

    return styleClass;
};
