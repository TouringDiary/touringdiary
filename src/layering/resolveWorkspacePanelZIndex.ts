import { Z_FOCUS_ACTIVE } from '@/constants/zIndex';

/**
 * Semantic tier of the workspace companion surface (diary).
 * `modal` = mobile fullscreen diary overlay (Z_FOCUS_COMPANION, 9100).
 * `focus` = desktop portaled companion (Z_FOCUS_COMPANION, 9100).
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
 * The primary workspace panel (Valigia) always sits at Z_FOCUS_ACTIVE (9300):
 * above the diary companion (Z_FOCUS_COMPANION, 9100) and the global header
 * (Z_GLOBAL_CHROME, 9200), but BELOW portaled chrome menus (Z_POPOVER, 14500).
 * Popover sits above modal dimming (Z_OVERLAY) so hamburger/header menus stay
 * visible and interactive over open modals/wizards.
 *
 * Both companion tiers resolve to the same value: the mobile diary fullscreen
 * overlay also lives in the focus band (Z_FOCUS_COMPANION), so no modal-band
 * elevation is required to keep the panel above it.
 */
export function resolveWorkspacePanelZIndex(
  _companionTier: CompanionSurfaceTier
): number {
  return Z_FOCUS_ACTIVE;
}
