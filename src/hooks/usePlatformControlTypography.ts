import { useDynamicStyles } from '@/hooks/useDynamicStyles';
import { useIsMobile } from '@/hooks/ui/useIsMobile';

/**
 * Tipografia Centro di Controllo — tutte le classi da Design System (admin_cc_*).
 * Nessuna text-size hardcoded nei consumer di questo hook.
 */
export function usePlatformControlTypography() {
    const isMobile = useIsMobile();

    return {
        cardTitle: useDynamicStyles('admin_cc_card_title', isMobile),
        cardDescription: useDynamicStyles('admin_cc_card_description', isMobile),
        fieldLabel: useDynamicStyles('admin_cc_field_label', isMobile),
        input: useDynamicStyles('admin_cc_input', isMobile),
        helper: useDynamicStyles('admin_cc_helper', isMobile),
        monoKey: useDynamicStyles('admin_cc_mono_key', isMobile),
        actionLink: useDynamicStyles('admin_cc_action_link', isMobile),
        success: useDynamicStyles('admin_cc_success', isMobile),
        error: useDynamicStyles('admin_cc_error', isMobile),
        tab: useDynamicStyles('admin_cc_tab', isMobile),
        badge: useDynamicStyles('admin_cc_badge', isMobile),
        btnPrimary: useDynamicStyles('admin_btn_primary', isMobile),
        btnSecondary: useDynamicStyles('admin_cc_btn_secondary', isMobile),
        valueEmphasis: useDynamicStyles('admin_cc_value_emphasis', isMobile),
        statLabel: useDynamicStyles('admin_cc_stat_label', isMobile),
        statValue: useDynamicStyles('admin_cc_stat_value', isMobile),
        sectionSubtitle: useDynamicStyles('admin_section_card_subtitle', isMobile),
        pageSubtitle: useDynamicStyles('admin_page_subtitle', isMobile),
        tableHead: useDynamicStyles('admin_table_head', isMobile),
        tableCell: useDynamicStyles('admin_table_cell', isMobile),
    };
}
