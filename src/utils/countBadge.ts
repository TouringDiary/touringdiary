export type CountBadgeSize = 'xs' | 'sm' | 'md' | 'lg';
export type CountBadgeVariant =
  | 'red'
  | 'indigo'
  | 'amber'
  | 'rose'
  | 'rose-500'
  | 'red-ring'
  | 'white'
  | 'white-black'
  | 'neutral'
  | 'neutral-active'
  | 'indigo-light'
  | 'dark'
  | 'rank'
  | 'level';

export type CountBadgePosition =
  | 'inline'
  | 'overlay-tr'
  | 'overlay-corner'
  | 'overlay-tl'
  | 'overlay-br';

export type CountBadgeShape = 'circle' | 'pill';

/**
 * Base comune a tutti i badge numerici.
 *
 * Scelte tecniche per la centratura robusta cross-browser:
 * - `inline-flex items-center justify-center`: centratura esatta su assi X e Y.
 * - `leading-none`: line-height: 1 — la casella del testo è alta quanto il font-size.
 * - `font-normal`: nessun grassetto nei badge numerici.
 * - `tabular-nums`: numeri a larghezza fissa per evitare scatti di layout.
 * - `shrink-0`: impedisce compressione in contesti flex.
 * - `select-none`: previene selezione accidentale del numero.
 *
 * Nota: la compensazione pt-px è applicata per dimensione (non qui) perché
 * la pill shape usa py simmetrico e non deve ereditarla.
 */
export const COUNT_BADGE_BASE_CLASS =
  'inline-flex items-center justify-center shrink-0 rounded-full font-normal tabular-nums leading-none select-none';

/**
 * Dimensioni cerchio: altezza fissa (border-box), larghezza minima = altezza,
 * padding orizzontale per 2+ cifre.
 *
 * pt-px: compensazione metrica del font — i numeri non hanno discendenti, quindi
 * il loro centro visivo è ~0.5 px sopra il centro della casella di testo.
 * 1 px di padding-top riduce l'area flex di 1 px dal basso, spostando il testo
 * di 0.5 px in basso e allineando il centro dell'inchiostro al centro del cerchio.
 */
const SIZE_CLASSES: Record<CountBadgeSize, string> = {
  xs: 'h-[16px] min-w-[16px] px-[3px] pt-px text-[9px] border border-slate-900',
  sm: 'h-[20px] min-w-[20px] px-[4px] pt-px text-[10px] border-2 border-slate-950',
  md: 'h-[22px] min-w-[22px] px-[4px] pt-px text-[11px] border-2 border-slate-950',
  lg: 'h-[24px] min-w-[24px] px-[5px] pt-px text-[12px] border-2 border-slate-950',
};

const VARIANT_CLASSES: Record<CountBadgeVariant, string> = {
  red: 'bg-red-600 text-white shadow-md shadow-red-950/50',
  indigo: 'bg-indigo-500 text-white shadow-md shadow-indigo-950/50',
  amber: 'bg-amber-500 text-white shadow-md shadow-amber-950/50',
  rose: 'bg-rose-600 text-white shadow-sm',
  'rose-500': 'bg-rose-500 text-white shadow-sm',
  'red-ring': 'bg-red-600 text-white ring-2 ring-red-400 shadow-sm',
  white: 'bg-white text-indigo-600',
  'white-black': 'bg-white text-black',
  neutral: 'bg-slate-800 text-slate-400',
  'neutral-active': 'bg-black/20 text-inherit',
  'indigo-light': 'bg-indigo-400 text-white ring-1 ring-slate-900 shadow-lg',
  dark: 'bg-slate-800/80 text-slate-500 border border-slate-700',
  rank: 'bg-black/60 backdrop-blur-md text-white border border-white/10',
  level: 'bg-indigo-500 text-white border-2 border-slate-900',
};

const POSITION_CLASSES: Record<CountBadgePosition, string> = {
  inline: '',
  'overlay-tr':
    'pointer-events-none absolute top-0 right-0 z-20 translate-x-1/4 -translate-y-1/4',
  'overlay-corner': 'absolute -top-1 -right-1',
  'overlay-tl': 'absolute top-2 left-2 z-floating-panel',
  'overlay-br': 'absolute -bottom-2 -right-2',
};

/** Pill: altezza automatica, padding verticale esplicito per centratura testo. */
const PILL_CLASS = 'h-auto min-h-[18px] px-1.5 py-[3px] rounded-full border-0 text-[9px]';

/** Formato compatto per contatori (9+, 99+). */
export function formatCompactCount(count: number, max = 99): string {
  if (count <= 0) return '0';
  if (count > max) return `${max}+`;
  return String(count);
}

/**
 * Adatta min-width e font-size per etichette multi-carattere nei badge circolari.
 * Garantisce che il cerchio si allarghi proporzionalmente senza distorcersi.
 */
export function getCountBadgeLabelAdjustClass(label: string): string {
  const len = label.length;
  if (len >= 4) return 'min-w-[28px] text-[8px]';
  if (len === 3) return 'min-w-[24px] text-[9px]';
  if (len === 2) return 'min-w-[22px]';
  return '';
}

export interface CountBadgeClassOptions {
  size?: CountBadgeSize;
  variant?: CountBadgeVariant;
  position?: CountBadgePosition;
  shape?: CountBadgeShape;
  label?: string;
  pulse?: boolean;
  className?: string;
}

export function buildCountBadgeClassName({
  size = 'sm',
  variant = 'rose',
  position = 'inline',
  shape = 'circle',
  label,
  pulse = false,
  className = '',
}: CountBadgeClassOptions): string {
  const sizeClass = shape === 'pill' ? PILL_CLASS : SIZE_CLASSES[size];
  const labelAdjust = label && shape === 'circle' ? getCountBadgeLabelAdjustClass(label) : '';

  return [
    COUNT_BADGE_BASE_CLASS,
    sizeClass,
    VARIANT_CLASSES[variant],
    POSITION_CLASSES[position],
    labelAdjust,
    pulse ? 'animate-pulse' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}
