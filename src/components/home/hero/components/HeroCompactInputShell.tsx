import React from 'react';
import { HERO_COMPACT, heroCompactFieldShell } from '../heroCompactTokens';

interface HeroCompactInputShellProps {
    children: React.ReactNode;
    focused?: boolean;
    className?: string;
}

/** Shared h-11 input row shell — used by search + AI query fields on mobile compact. */
export const HeroCompactInputShell: React.FC<HeroCompactInputShellProps> = ({
    children,
    focused = false,
    className = '',
}) => (
    <div
        className={[
            heroCompactFieldShell,
            HERO_COMPACT.fieldPadding,
            'relative',
            focused ? 'border-amber-500/50 ring-1 ring-amber-500/10' : '',
            className,
        ].filter(Boolean).join(' ')}
    >
        {children}
    </div>
);

/** Inner wrapper that vertically centers single-line input/textarea content. */
export const HeroCompactInputInner: React.FC<{
    children: React.ReactNode;
    className?: string;
}> = ({ children, className = '' }) => (
    <div className={`flex-1 flex items-center min-w-0 h-full min-h-0 ${className}`}>
        {children}
    </div>
);
