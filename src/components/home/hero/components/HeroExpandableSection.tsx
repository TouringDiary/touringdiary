import React from 'react';
import { HERO_COMPACT } from '../heroCompactTokens';

interface HeroExpandableSectionProps {
    expanded: boolean;
    children: React.ReactNode;
    className?: string;
}

/** Animated height + opacity wrapper for stacked hero module bodies. */
export const HeroExpandableSection: React.FC<HeroExpandableSectionProps> = ({
    expanded,
    children,
    className = '',
}) => (
    <div
        className={`grid transition-[grid-template-rows] ${HERO_COMPACT.expandDuration} ${HERO_COMPACT.expandEase} ${
            expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        } ${className}`}
        aria-hidden={!expanded}
    >
        <div className="overflow-hidden min-h-0">
            <div
                className={`transition-opacity ${HERO_COMPACT.contentFadeDuration} ${
                    expanded ? 'opacity-100 delay-75' : 'opacity-0 pointer-events-none'
                }`}
            >
                {children}
            </div>
        </div>
    </div>
);
