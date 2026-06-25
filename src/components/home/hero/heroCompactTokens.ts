/** Shared layout tokens for side-by-side mobile hero twin boxes. */
export const HERO_COMPACT = {
    boxPadding: 'p-3',
    headerRow: 'h-8 mb-2 shrink-0',
    /** Tighter title-to-fields gap for the AI twin box on mobile. */
    headerRowAi: 'h-8 mb-1 shrink-0',
    /** Flexible spacer above the bottom field stack (filter box, expanded layouts). */
    body: 'flex-1 min-h-0 min-w-0',
    bodyGap: 'gap-2',
    /** Mobile twin-box stack: header + field rows (matches filter + AI layout). */
    compactTwinStack: 'flex flex-col shrink-0',
    fieldHeight: 'h-11',
    fieldRadius: 'rounded-xl',
    fieldBorder: 'border border-slate-800',
    fieldBg: 'bg-slate-950/80',
    fieldShadow: 'shadow-inner',
    fieldPadding: 'px-3',
    fieldText: 'text-xs leading-tight truncate whitespace-nowrap overflow-hidden',
    fieldInputText: 'text-xs text-white placeholder:text-slate-600 leading-4 py-0 min-h-0',
} as const;

/** Identical shell for every compact hero field row (output + input). */
export const heroCompactFieldShell = [
    HERO_COMPACT.fieldHeight,
    HERO_COMPACT.fieldRadius,
    HERO_COMPACT.fieldBorder,
    HERO_COMPACT.fieldBg,
    HERO_COMPACT.fieldShadow,
    'flex items-center min-w-0 w-full shrink-0 overflow-hidden',
].join(' ');
