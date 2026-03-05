
import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

interface AdminStyles {
    admin_h1: string;
    admin_sidebar_link: string;
    admin_table_head: string;
    admin_table_cell: string;
    admin_btn_primary: string;
    // Nuove chiavi
    admin_page_title: string;
    admin_page_subtitle: string;
}

// DEFAULT AGGIORNATI SECONDO RICHIESTA UTENTE
const DEFAULT_STYLES: AdminStyles = {
    admin_h1: 'font-display text-3xl font-bold text-white',
    admin_sidebar_link: 'font-sans text-sm font-bold text-slate-400',
    admin_table_head: 'font-sans text-[10px] font-black uppercase tracking-widest text-slate-500',
    admin_table_cell: 'font-sans text-sm font-medium text-slate-300',
    admin_btn_primary: 'font-sans text-xs font-bold uppercase tracking-wider text-white shadow-md',
    
    // Nuovi default (identici a Centro Comunicazioni)
    admin_page_title: 'font-display text-3xl font-bold text-white',
    admin_page_subtitle: 'font-sans text-sm text-slate-400'
};

export const useAdminStyles = () => {
    const [styles, setStyles] = useState<AdminStyles>(DEFAULT_STYLES);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStyles = async () => {
            const { data } = await supabase
                .from('design_system_rules')
                .select('component_key, font_family, text_size, font_weight, text_transform, tracking, color_class, effect_class')
                .eq('section', 'admin');

            if (data && data.length > 0) {
                const newStyles = { ...DEFAULT_STYLES };
                data.forEach((row: any) => {
                    if (row.component_key && (newStyles as any)[row.component_key] !== undefined) {
                        (newStyles as any)[row.component_key] = `${row.font_family} ${row.text_size} ${row.font_weight} ${row.text_transform} ${row.tracking} ${row.color_class} ${row.effect_class !== 'none' ? row.effect_class : ''}`;
                    }
                });
                setStyles(newStyles);
            }
            setLoading(false);
        };
        fetchStyles();

        // Listener per aggiornamenti in tempo reale dal Design System
        const handleRefresh = () => { fetchStyles(); };
        window.addEventListener('refresh-design-system', handleRefresh);
        return () => window.removeEventListener('refresh-design-system', handleRefresh);

    }, []);

    return { styles, loading };
};
