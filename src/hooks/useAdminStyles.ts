
import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { constructClassName } from './useDynamicStyles';

interface AdminStyles {
    admin_h1: string;
    admin_sidebar_link: string;
    admin_table_head: string;
    admin_table_cell: string;
    admin_btn_primary: string;
    admin_page_title: string;
    admin_page_subtitle: string;
    admin_page_header_wrapper: string;
    admin_page_icon_wrapper: string;
    admin_page_icon_glyph: string;
    admin_page_icon_accent_cyan: string;
    admin_page_icon_accent_indigo: string;
    admin_page_icon_accent_purple: string;
    admin_page_icon_accent_amber: string;
    admin_page_icon_accent_rose: string;
    admin_page_icon_accent_emerald: string;
    admin_page_icon_accent_yellow: string;
    admin_page_icon_accent_blue: string;
    admin_page_icon_accent_pink: string;
    admin_section_card: string;
    admin_section_card_icon_wrapper: string;
    admin_section_card_icon_glyph: string;
    admin_section_card_title: string;
    admin_section_card_subtitle: string;
}

// DEFAULT AGGIORNATI SECONDO RICHIESTA UTENTE
const DEFAULT_STYLES: AdminStyles = {
    admin_h1: 'font-display text-3xl font-bold text-white',
    admin_sidebar_link: 'font-sans text-sm font-bold text-slate-400',
    admin_table_head: 'font-sans text-[10px] font-black uppercase tracking-widest text-slate-500',
    admin_table_cell: 'font-sans text-sm font-medium text-slate-300',
    admin_btn_primary: 'font-sans text-xs font-bold uppercase tracking-wider text-white shadow-md',
    
    admin_page_title: 'font-display text-3xl font-bold text-white',
    admin_page_subtitle: 'font-sans text-sm text-slate-400',
    admin_page_header_wrapper: 'shrink-0 mb-2',
    admin_page_icon_wrapper: 'p-3 rounded-xl shadow-lg',
    admin_page_icon_glyph: 'w-8 h-8 text-white',
    admin_page_icon_accent_cyan: 'bg-cyan-600',
    admin_page_icon_accent_indigo: 'bg-indigo-600',
    admin_page_icon_accent_purple: 'bg-purple-600',
    admin_page_icon_accent_amber: 'bg-amber-600',
    admin_page_icon_accent_rose: 'bg-rose-600',
    admin_page_icon_accent_emerald: 'bg-emerald-600',
    admin_page_icon_accent_yellow: 'bg-yellow-600',
    admin_page_icon_accent_blue: 'bg-blue-600',
    admin_page_icon_accent_pink: 'bg-pink-600',
    admin_section_card: 'bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl flex flex-col h-full',
    admin_section_card_icon_wrapper: 'p-3 rounded-2xl border border-slate-700 bg-slate-800',
    admin_section_card_icon_glyph: 'w-6 h-6 text-indigo-400',
    admin_section_card_title: 'font-sans text-lg font-bold text-white uppercase tracking-tight',
    admin_section_card_subtitle: 'font-sans text-xs font-normal text-slate-500 leading-relaxed',
};

export const useAdminStyles = () => {
    const [styles, setStyles] = useState<AdminStyles>(DEFAULT_STYLES);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStyles = async () => {
            const { data } = await supabase
                .from('design_system_rules')
                .select('component_key, css_class, font_family, text_size, font_weight, line_height, text_transform, tracking, color_class, effect_class')
                .eq('section', 'admin');

            if (data && data.length > 0) {
                const newStyles = { ...DEFAULT_STYLES };
                data.forEach((row: any) => {
                    if (row.component_key && (newStyles as any)[row.component_key] !== undefined) {
                        (newStyles as any)[row.component_key] = constructClassName(row);
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
