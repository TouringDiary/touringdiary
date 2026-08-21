import type { PatronDetails } from '@/types/models/City';

/**
 * Aspect-ratio della Foto Patrono principale nella UI pubblica e nell’anteprima admin.
 * SoT CSS: `aspect-[16/9] md:aspect-[21/9]` + `object-cover` + `object-position: center`
 * (`PatronSaintModal`, `CulturePatronMainPhotoSection`).
 *
 * L’editor (`AdminPhotoInspector` + `viewportGuide`) deve predire lo stesso crop:
 * - primary = desktop 21:9 (export ritagliato a questo formato)
 * - secondary = mobile 16:9 come object-cover del primary
 */
export const PATRON_MAIN_PHOTO_ASPECT_RATIO = {
  /** Viewport sotto breakpoint md */
  mobile: 16 / 9,
  /** Viewport da md in su */
  desktop: 21 / 9,
} as const;

export type ObjectCoverCropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Rettangolo centrato equivalente a CSS `object-fit: cover` + `object-position: center`
 * quando una sorgente `sourceW×sourceH` viene mostrata in un box di aspect `targetAspect`.
 */
export function computeObjectCoverCropRect(
  sourceWidth: number,
  sourceHeight: number,
  targetAspect: number,
): ObjectCoverCropRect {
  if (sourceWidth <= 0 || sourceHeight <= 0 || targetAspect <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  const sourceAspect = sourceWidth / sourceHeight;
  if (sourceAspect > targetAspect) {
    const width = sourceHeight * targetAspect;
    return {
      x: (sourceWidth - width) / 2,
      y: 0,
      width,
      height: sourceHeight,
    };
  }
  const height = sourceWidth / targetAspect;
  return {
    x: 0,
    y: (sourceHeight - height) / 2,
    width: sourceWidth,
    height,
  };
}

/** URL della sola foto specifica città (mai il Patrono Master). */
export function getPatronCitySpecificImageUrl(
  patronDetails: PatronDetails | null | undefined,
): string {
  return patronDetails?.imageUrl?.trim() ?? '';
}

/**
 * Foto da mostrare in UI: specifica città se presente, altrimenti Patrono Master.
 * Il Master non viene mai scritto in `patronDetails.imageUrl`.
 */
export function resolvePatronDisplayImageUrl(
  patronDetails: PatronDetails | null | undefined,
  masterPatronUrl: string | null | undefined,
): string {
  const cityUrl = getPatronCitySpecificImageUrl(patronDetails);
  if (cityUrl) return cityUrl;
  return masterPatronUrl?.trim() ?? '';
}

export function isPatronUsingMasterFallback(
  patronDetails: PatronDetails | null | undefined,
): boolean {
  return getPatronCitySpecificImageUrl(patronDetails) === '';
}
