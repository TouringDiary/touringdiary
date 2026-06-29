import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { HERO_COMPACT } from '../heroCompactTokens';

interface HeroCollapsedBarProps {
    title: string;
    titleClassName: string;
    accentClassName: string;
    expanded?: boolean;
    onClick: () => void;
    ariaLabel?: string;
    trailing?: React.ReactNode;
}

export const HeroCollapsedBar: React.FC<HeroCollapsedBarProps> = ({
    title,
    titleClassName,
    accentClassName,
    expanded = false,
    onClick,
    ariaLabel,
    trailing,
}) => (
    <button
        type="button"
        onClick={onClick}
        aria-expanded={expanded}
        aria-label={ariaLabel ?? title}
        className={`${HERO_COMPACT.collapsedBar} w-full text-left`}
    >
        <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className={`w-1 h-5 rounded-full shrink-0 ${accentClassName}`} />
            <h3 className={`${titleClassName} truncate`}>{title}</h3>
            {trailing}
        </div>
        <div className="p-1.5 bg-slate-800/50 rounded-full border border-white/10 text-white backdrop-blur-sm shrink-0">
            {expanded ? (
                <ChevronUp className="w-4 h-4" aria-hidden />
            ) : (
                <ChevronDown className="w-4 h-4" aria-hidden />
            )}
        </div>
    </button>
);
