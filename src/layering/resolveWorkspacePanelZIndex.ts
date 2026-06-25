import { Z_MODAL, Z_MODAL_NESTED } from '@/constants/zIndex';

/**
 * Semantic tier of the workspace companion surface (diary).
 * `modal` = mobile fullscreen diary overlay at Z_MODAL (11000).
 * `focus` = desktop portaled companion at Z_FOCUS_COMPANION (9100).
 */
export type CompanionSurfaceTier = 'focus' | 'modal';

export interface CompanionSurfaceInput {
  mobileDiaryFullScreen: boolean;
}

/** Derives companion surface tier from UI state. */
export function resolveCompanionSurfaceTier(
  input: CompanionSurfaceInput
): CompanionSurfaceTier {
  return input.mobileDiaryFullScreen ? 'modal' : 'focus';
}

/**
 * Workspace Elevation Policy — focusActive z-index resolution.
 *
 * Mobile diary fullscreen (companion at modal tier): Z_MODAL_NESTED (12000).
 *
 * DESKTOP STACKING TEST (reversible):
 * Document-root tier temporarily Z_MODAL (11000) instead of Z_FOCUS_ACTIVE (9300)
 * to validate whether Home dimmedBackground leaks (z 9999–12000) cause the regression.
 * Revert `focus` branch to Z_FOCUS_ACTIVE after test — do not change Home components.
 */
export function resolveWorkspacePanelZIndex(
  companionTier: CompanionSurfaceTier
): number {
  return companionTier === 'modal' ? Z_MODAL_NESTED : Z_MODAL;
}
