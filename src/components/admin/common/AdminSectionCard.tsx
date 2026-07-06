import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { useDynamicStyles } from '@/hooks/useDynamicStyles';

/**
 * Thin shared admin section card — visual semantics via useDynamicStyles / design_system_rules.
 * Layout orchestration only in this file (header row structure, body slot).
 */

const HEADER_LAYOUT = 'flex items-center gap-4 mb-6';
const BODY_LAYOUT = 'flex-1';

export interface AdminSectionCardProps {
    title?: string;
    subtitle?: string;
    icon?: LucideIcon;
    /** Optional pass-through (e.g. page-level animation). Visual card shell belongs in DS. */
    className?: string;
    children: React.ReactNode;
}

export const AdminSectionCard: React.FC<AdminSectionCardProps> = ({
    title,
    subtitle,
    icon: Icon,
    className = '',
    children,
}) => {
    const sectionCardClass = useDynamicStyles('admin_section_card');
    const iconWrapperClass = useDynamicStyles('admin_section_card_icon_wrapper');
    const iconGlyphClass = useDynamicStyles('admin_section_card_icon_glyph');
    const sectionTitleClass = useDynamicStyles('admin_section_card_title');
    const sectionSubtitleClass = useDynamicStyles('admin_section_card_subtitle');
    const showHeader = Boolean(title || Icon);

    return (
        <div className={`${sectionCardClass} ${className}`.trim()}>
            {showHeader ? (
                <div className={HEADER_LAYOUT}>
                    {Icon ? (
                        <div className={iconWrapperClass}>
                            <Icon className={iconGlyphClass} />
                        </div>
                    ) : null}
                    {title ? (
                        <div>
                            <h3 className={sectionTitleClass}>{title}</h3>
                            {subtitle ? (
                                <p className={`${sectionSubtitleClass} mt-1 max-w-sm`}>
                                    {subtitle}
                                </p>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            ) : null}
            <div className={BODY_LAYOUT}>{children}</div>
        </div>
    );
};
