import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { useAdminStyles } from '@/hooks/useAdminStyles';

/**
 * Layout-only page header orchestrator.
 * Typography, colors, icon sizing, radius, shadows → useAdminStyles / design_system_rules.
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
    const { styles } = useAdminStyles();
    const iconAccentKey = `admin_page_icon_accent_${accent}` as AdminPageIconAccentKey;
    const iconAccentClass = styles[iconAccentKey];

    return (
        <div
            className={`${ROOT_LAYOUT} ${styles.admin_page_header_wrapper} ${className}`.trim()}
        >
            <div className={TITLE_CLUSTER_LAYOUT}>
                <div className={`${styles.admin_page_icon_wrapper} ${iconAccentClass}`}>
                    <Icon className={styles.admin_page_icon_glyph} />
                </div>
                <div>
                    <div className={TITLE_ROW_LAYOUT}>
                        <HeadingTag className={styles.admin_page_title}>{title}</HeadingTag>
                        {badge}
                    </div>
                    {subtitle ? (
                        <p className={styles.admin_page_subtitle}>{subtitle}</p>
                    ) : null}
                </div>
            </div>

            {actions ? (
                <div className={ACTIONS_SLOT_LAYOUT}>{actions}</div>
            ) : null}
        </div>
    );
};
