/**
 * Source of truth editoriale per i token del Design System.
 *
 * Questo modulo è la sorgente autoritative per:
 * - quali token sono validi nell'editor
 * - validazione implicita dei valori DB
 * - allineamento runtime/DB
 * - futuri strumenti di audit o documentazione automatica
 *
 * IMPORTANTE:
 * - NON mischiare con runtime types (→ types/designSystem.ts)
 * - NON mischiare con DB seed data (→ data/system/designRules.ts)
 * - NON importare in codice runtime (hooks, services)
 * - Importare solo da: editor admin, validator, tool di audit
 *
 * font-display = Playfair Display, font-handwriting = Caveat (definiti in index.css @theme)
 */

export const FONT_TOKENS = [
    'font-display', 'font-handwriting', 'font-sans', 'font-serif', 'font-mono',
] as const;

// Inclusi token arbitrari usati nel DB (text-[9px], text-[10px], text-[11px]).
// Sono safe da Tailwind purge perché appaiono come stringhe letterali in designRules.ts,
// scansionato da @tailwindcss/vite.
export const SIZE_TOKENS = [
    'text-[9px]', 'text-[10px]', 'text-[11px]',
    'text-xs', 'text-sm', 'text-base', 'text-lg',
    'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl',
] as const;

export const WEIGHT_TOKENS = [
    'font-thin', 'font-extralight', 'font-light', 'font-normal',
    'font-medium', 'font-semibold', 'font-bold', 'font-extrabold', 'font-black',
] as const;

export const LINE_HEIGHT_TOKENS = [
    'leading-none', 'leading-tight', 'leading-snug', 'leading-normal',
    'leading-relaxed', 'leading-loose',
] as const;

// 'none' è un sentinel: valore neutro selezionabile in editor.
// constructClassName lo esclude dall'output CSS perché non è una utility Tailwind valida.
export const TRANSFORM_TOKENS = [
    'none', 'normal-case', 'uppercase', 'lowercase', 'capitalize',
] as const;

// tracking-[0.2em] e tracking-[0.25em] usati in diary_badge e diary_badge_mobile.
export const TRACKING_TOKENS = [
    'tracking-tighter', 'tracking-tight', 'tracking-normal',
    'tracking-wide', 'tracking-wider', 'tracking-widest',
    'tracking-[0.2em]', 'tracking-[0.25em]',
] as const;

// Nota: include bg-* per color_class degli elementi journey_line_* (sfondo, non testo).
// La separazione semantica text-color/background-color richiede una migration DB futura
// con aggiunta del campo bg_class.
export const COLOR_TOKENS = [
    'text-transparent', 'text-black', 'text-white',
    'text-slate-200', 'text-slate-300', 'text-slate-400', 'text-slate-500', 'text-slate-700',
    'text-stone-500', 'text-stone-600', 'text-stone-800', 'text-stone-900',
    'text-gray-200', 'text-gray-500', 'text-gray-800',
    'text-indigo-400', 'text-indigo-500',
    'text-amber-500', 'text-amber-600',
    'text-red-500', 'text-red-600',
    'text-green-500', 'text-yellow-500',
    'bg-white', 'bg-slate-700',
    'bg-cyan-600', 'bg-indigo-600', 'bg-purple-600', 'bg-amber-600',
    'bg-rose-600', 'bg-emerald-600', 'bg-yellow-600', 'bg-blue-600', 'bg-pink-600',
] as const;

/** Preset sicuri per css_class (layout/spacing/sizing/radius). Solo editor admin. */
export const UTILITY_CSS_PRESETS = [
    'shrink-0',
    'mb-2', 'mb-4', 'mb-6',
    'p-3', 'p-4',
    'rounded-xl', 'rounded-2xl',
    'w-6', 'h-6', 'w-8', 'h-8',
] as const;

// 'none' è un sentinel: nessun effetto. constructClassName lo esclude dall'output CSS.
// effect-soft-glow, effect-hard-glow, effect-text-shadow: classi custom non standard Tailwind;
// mantenute per compatibilità con eventuali valori DB preesistenti.
export const EFFECT_TOKENS = [
    'none',
    'italic',
    'drop-shadow-sm', 'drop-shadow-md',
    'shadow-sm', 'shadow-md', 'shadow-lg',
    'shadow-[0_0_10px_rgba(255,255,255,0.5)]',
    'effect-soft-glow', 'effect-hard-glow', 'effect-text-shadow',
] as const;

// --- Derived types per TypeScript consumers e validation tools ---

export type FontToken        = typeof FONT_TOKENS[number];
export type SizeToken        = typeof SIZE_TOKENS[number];
export type WeightToken      = typeof WEIGHT_TOKENS[number];
export type LineHeightToken  = typeof LINE_HEIGHT_TOKENS[number];
export type TransformToken   = typeof TRANSFORM_TOKENS[number];
export type TrackingToken    = typeof TRACKING_TOKENS[number];
export type ColorToken       = typeof COLOR_TOKENS[number];
export type EffectToken      = typeof EFFECT_TOKENS[number];

// Unione di tutti i token registrati (utile per validatori)
export type RegisteredToken =
    | FontToken | SizeToken | WeightToken | LineHeightToken
    | TransformToken | TrackingToken | ColorToken | EffectToken;
