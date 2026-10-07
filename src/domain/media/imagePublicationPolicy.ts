import {
  type ImageAssetStatusDb,
  type ImageVerificationStepOutcomeDb,
  isPublicUsableImageAssetStatus,
} from '@/constants/governance';

/**
 * Regola funzionale chiusa: per Wikimedia `active` non basta.
 * `validazione_wikimedia` è true solo se il valore è esplicitamente true.
 * null e false restano non validate (fail-closed).
 * Le altre origini non leggono il flag.
 */
export function isWikimediaOrigin(originType: string | null | undefined): boolean {
  return (originType ?? '').trim().toLowerCase() === 'wikimedia';
}

export function isWikimediaValidationGranted(value: boolean | null | undefined): boolean {
  return value === true;
}

export function isAssetEligibleForPublicUse(input: {
  originType: string | null | undefined;
  assetStatus: ImageAssetStatusDb;
  wikimediaValidated: boolean | null | undefined;
  adminBlocked: boolean;
}): boolean {
  if (input.adminBlocked) return false;
  if (!isPublicUsableImageAssetStatus(input.assetStatus)) return false;
  if (!isWikimediaOrigin(input.originType)) return true;
  return isWikimediaValidationGranted(input.wikimediaValidated);
}

export type VerificationTone = 'passed' | 'review' | 'failed' | 'not_applicable';

/** Esiti già in `image_verification_step_outcome`. Non è un secondo catalogo. */
export function toneForVerificationOutcome(
  outcome: ImageVerificationStepOutcomeDb,
): VerificationTone {
  if (outcome === 'verified') return 'passed';
  if (outcome === 'blocked') return 'failed';
  if (outcome === 'not_applicable') return 'not_applicable';
  return 'review';
}

export function adminNoteRequiredForOutcome(outcome: ImageVerificationStepOutcomeDb): boolean {
  const tone = toneForVerificationOutcome(outcome);
  return tone === 'review' || tone === 'failed';
}

export function wikimediaFunctionalStatusLabel(input: {
  assetStatus: ImageAssetStatusDb | null;
  wikimediaValidated: boolean | null | undefined;
  adminBlocked?: boolean;
}): 'VALIDATA' | 'DA VALIDARE' | 'SOSPESO ADMIN' | null {
  if (input.adminBlocked) return 'SOSPESO ADMIN';
  if (input.assetStatus === 'removed' || input.assetStatus === 'replaced') return null;
  if (isWikimediaValidationGranted(input.wikimediaValidated) && input.assetStatus === 'active') {
    return 'VALIDATA';
  }
  if (isWikimediaValidationGranted(input.wikimediaValidated) && input.assetStatus === 'restored') {
    return 'VALIDATA';
  }
  return 'DA VALIDARE';
}
