import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { useDynamicStyles } from '@/hooks/useDynamicStyles';
import { usePlatformControlTypography } from '@/hooks/usePlatformControlTypography';

interface PlatformControlTabBannerProps {
    icon: LucideIcon;
    title: string;
    description: string;
}

/**
 * Banner introduttivo a tutta larghezza per le TAB del Centro di Controllo.
 * Solo presentazione — nessuna logica operativa.
 */
export const PlatformControlTabBanner: React.FC<PlatformControlTabBannerProps> = ({
    icon: Icon,
    title,
    description,
}) => {
    const ty = usePlatformControlTypography();
    const shellClass = useDynamicStyles('admin_section_card');
    const iconWrapperClass = useDynamicStyles('admin_section_card_icon_wrapper');
    const iconGlyphClass = useDynamicStyles('admin_section_card_icon_glyph');
    const titleClass = useDynamicStyles('admin_section_card_title');
    const subtitleClass = useDynamicStyles('admin_section_card_subtitle');

    return (
        <header
            className={`${shellClass} !h-auto shrink-0`.trim()}
            aria-labelledby={`platform-control-banner-${title}`}
        >
            <div className="flex items-start gap-3 sm:gap-4 w-full min-w-0">
                <div className={`${iconWrapperClass} shrink-0`}>
                    <Icon className={iconGlyphClass} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                    <h2 id={`platform-control-banner-${title}`} className={titleClass}>
                        {title}
                    </h2>
                    <p
                        className={`${subtitleClass} ${ty.sectionSubtitle} mt-2 max-w-none w-full leading-relaxed`}
                    >
                        {description}
                    </p>
                </div>
            </div>
        </header>
    );
};
