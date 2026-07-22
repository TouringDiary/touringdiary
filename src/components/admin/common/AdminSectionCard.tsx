import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { useDynamicStyles } from '@/hooks/useDynamicStyles';

/**
 * Thin shared admin section card — visual semantics via useDynamicStyles / design_system_rules.
 * Layout orchestration only in this file (header row structure, body slot).
 */

const HEADER_LAYOUT = 'flex items-center gap-4 mb-6';
const HEADER_LAYOUT_WITH_ASIDE =
    'flex flex-col gap-4 mb-0 pb-5 border-b border-slate-800/80 items-stretch md:flex-row md:items-start md:justify-between md:gap-6';
const BODY_LAYOUT = 'flex-1';
const BODY_LAYOUT_AFTER_ASIDE = 'flex-1 pt-5';

export interface AdminSectionCardProps {
    title?: string;
    subtitle?: string;
    icon?: LucideIcon;
    /** Optional pass-through (e.g. page-level animation). Visual card shell belongs in DS. */
    className?: string;
    /** Controllo contestuale a destra dell’header — una sola fascia con titolo (responsive). */
    headerAside?: React.ReactNode;
    children: React.ReactNode;
}

export const AdminSectionCard: React.FC<AdminSectionCardProps> = ({
    title,
    subtitle,
    icon: Icon,
    className = '',
    headerAside,
    children,
}) => {
    const sectionCardClass = useDynamicStyles('admin_section_card');
    const iconWrapperClass = useDynamicStyles('admin_section_card_icon_wrapper');
    const iconGlyphClass = useDynamicStyles('admin_section_card_icon_glyph');
    const sectionTitleClass = useDynamicStyles('admin_section_card_title');
    const sectionSubtitleClass = useDynamicStyles('admin_section_card_subtitle');
    const showHeader = Boolean(title || Icon || headerAside);
    const hasAside = Boolean(headerAside);

    return (
        <div className={`${sectionCardClass} ${className}`.trim()}>
            {showHeader ? (
                <div className={hasAside ? HEADER_LAYOUT_WITH_ASIDE : HEADER_LAYOUT}>
                    <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                        {Icon ? (
                            <div className={`${iconWrapperClass} shrink-0`}>
                                <Icon className={iconGlyphClass} />
                            </div>
                        ) : null}
                        {title ? (
                            <div className="min-w-0 flex-1 pt-0.5">
                                <h3 className={sectionTitleClass}>{title}</h3>
                                {subtitle ? (
                                    <p className={`${sectionSubtitleClass} mt-1.5 max-w-2xl`}>
                                        {subtitle}
                                    </p>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                    {headerAside ? (
                        <div className="shrink-0 w-full md:w-auto md:max-w-[17rem] md:pt-0.5">
                            {headerAside}
                        </div>
                    ) : null}
                </div>
            ) : null}
            <div className={hasAside ? BODY_LAYOUT_AFTER_ASIDE : BODY_LAYOUT}>{children}</div>
        </div>
    );
};
