export type HeroCoverCollagePlan =
    | { kind: 'single'; top: number }
    | { kind: 'stack'; indices: number[] };

/**
 * Collage plan condiviso tra PDF/Word/HTML preview.
 *
 * - 1 immagine → full-bleed singolo
 * - 2+ immagini → colonna verticale (ordine viaggio: prima → ultima città)
 *
 * Indici basati su un array di immagini ordinato (0 => prima città, ...).
 */
export function buildHeroCoverCollagePlan(imageCount: number): HeroCoverCollagePlan {
    const count = Math.max(0, Math.floor(imageCount));

    if (count <= 1) {
        return { kind: 'single', top: 0 };
    }

    return {
        kind: 'stack',
        indices: Array.from({ length: count }, (_, i) => i),
    };
}

/** Altezza target per ogni tile del collage verticale (PDF / Word). */
export function heroCoverStackImageHeight(imageCount: number): number {
    if (imageCount <= 2) return 200;
    if (imageCount === 3) return 150;
    return 120;
}

/** Gap verticale (pt / px logici) tra tile del collage stack — PDF. */
export const HERO_COVER_STACK_GAP = 12;
