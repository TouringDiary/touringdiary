import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { useDynamicStyles } from '@/hooks/useDynamicStyles';

/**
 * Layout-only page header orchestrator.
 * Typography, colors, icon sizing, radius, shadows → useDynamicStyles / design_system_rules.
 * This file must not own visual Tailwind (font-*, text-*, bg-*, rounded-*, shadow-*, etc.).
 */

/** Semantic accent keys → DS admin_page_icon_accent_* rules. */
export type AdminPageHeaderAccent =
    | 'cyan'
    | 'indigo'
    | 'purple'
    | 'amber'
    | 'rose'
    | 'emerald'
    | 'yellow'
    | 'blue'
    | 'pink';

type AdminPageIconAccentKey = `admin_page_icon_accent_${AdminPageHeaderAccent}`;

/** Structural layout only — responsive orchestration, not visual styling. */
const ROOT_LAYOUT = 'flex flex-col md:flex-row justify-between items-start md:items-center gap-4';
const TITLE_CLUSTER_LAYOUT = 'flex items-center gap-3';
const TITLE_ROW_LAYOUT = 'flex items-center gap-3';
const ACTIONS_SLOT_LAYOUT = 'flex gap-3 w-full md:w-auto items-center';

export interface AdminPageHeaderProps {
    icon: LucideIcon;
    title: string;
    subtitle?: string;
    accent?: AdminPageHeaderAccent;
    actions?: React.ReactNode;
    badge?: React.ReactNode;
    /** Optional layout override from parent (e.g. margin). Visual styling belongs in DS. */
    className?: string;
    as?: 'h1' | 'h2';
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
    icon: Icon,
    title,
    subtitle,
    accent = 'indigo',
    actions,
    badge,
    className = '',
    as: HeadingTag = 'h2',
}) => {
    const headerWrapperClass = useDynamicStyles('admin_page_header_wrapper');
    const iconWrapperClass = useDynamicStyles('admin_page_icon_wrapper');
    const iconGlyphClass = useDynamicStyles('admin_page_icon_glyph');
    const pageTitleClass = useDynamicStyles('admin_page_title');
    const pageSubtitleClass = useDynamicStyles('admin_page_subtitle');
    const iconAccentKey = `admin_page_icon_accent_${accent}` as AdminPageIconAccentKey;
    const iconAccentClass = useDynamicStyles(iconAccentKey);

    return (
        <div
            className={`${ROOT_LAYOUT} ${headerWrapperClass} ${className}`.trim()}
        >
            <div className={TITLE_CLUSTER_LAYOUT}>
                <div className={`${iconWrapperClass} ${iconAccentClass}`}>
                    <Icon className={iconGlyphClass} />
                </div>
                <div>
                    <div className={TITLE_ROW_LAYOUT}>
                        <HeadingTag className={pageTitleClass}>{title}</HeadingTag>
                        {badge}
                    </div>
                    {subtitle ? (
                        <p className={pageSubtitleClass}>{subtitle}</p>
                    ) : null}
                </div>
            </div>

            {actions ? (
                <div className={ACTIONS_SLOT_LAYOUT}>{actions}</div>
            ) : null}
        </div>
    );
};
