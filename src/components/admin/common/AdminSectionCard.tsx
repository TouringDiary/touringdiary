import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { useAdminStyles } from '@/hooks/useAdminStyles';

/**
 * Thin shared admin section card — visual semantics via useAdminStyles / design_system_rules.
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
    const { styles } = useAdminStyles();
    const showHeader = Boolean(title || Icon);

    return (
        <div className={`${styles.admin_section_card} ${className}`.trim()}>
            {showHeader ? (
                <div className={HEADER_LAYOUT}>
                    {Icon ? (
                        <div className={styles.admin_section_card_icon_wrapper}>
                            <Icon className={styles.admin_section_card_icon_glyph} />
                        </div>
                    ) : null}
                    {title ? (
                        <div>
                            <h3 className={styles.admin_section_card_title}>{title}</h3>
                            {subtitle ? (
                                <p className={`${styles.admin_section_card_subtitle} mt-1 max-w-sm leading-relaxed`}>
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
