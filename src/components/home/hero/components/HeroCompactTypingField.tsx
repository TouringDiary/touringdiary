import React from 'react';
import { HERO_COMPACT, heroCompactFieldShell } from '../heroCompactTokens';

type HeroCompactTypingVariant = 'ai' | 'inspiration';

interface HeroCompactTypingFieldProps {
    text: string;
    variant?: HeroCompactTypingVariant;
    showCursor?: boolean;
    onClick?: () => void;
    disabled?: boolean;
    /** When true, renders only inner content (parent supplies the field shell). */
    bare?: boolean;
    'aria-label'?: string;
}

const VARIANT_STYLES: Record<HeroCompactTypingVariant, { text: string; cursor: string }> = {
    ai: {
        text: 'text-slate-300 font-mono',
        cursor: 'bg-purple-500',
    },
    inspiration: {
        text: 'text-slate-300',
        cursor: 'bg-amber-500',
    },
};

export const HeroCompactTypingField: React.FC<HeroCompactTypingFieldProps> = ({
    text,
    variant = 'ai',
    showCursor = true,
    onClick,
    disabled = false,
    bare = false,
    'aria-label': ariaLabel,
}) => {
    const styles = VARIANT_STYLES[variant];
    const interactive = Boolean(onClick) && !disabled;

    const content = (
        <p className={`${HERO_COMPACT.fieldText} ${styles.text}`}>
            {text}
            {showCursor && (
                <span className={`w-0.5 h-3.5 ${styles.cursor} inline-block ml-0.5 animate-pulse translate-y-0.5`} />
            )}
        </p>
    );

    const inner = interactive ? (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`min-w-0 w-full text-left transition-colors ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 cursor-pointer'
            }`}
        >
            {content}
        </button>
    ) : (
        <div className="min-w-0 w-full">{content}</div>
    );

    if (bare) return inner;

    return (
        <div
            className={`${heroCompactFieldShell} ${HERO_COMPACT.fieldPadding}`}
            role="region"
            aria-label={ariaLabel}
        >
            {inner}
        </div>
    );
};
