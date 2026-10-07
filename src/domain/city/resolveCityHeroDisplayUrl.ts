import type {
  AssignmentStatusDb,
  ImageAssetStatusDb,
  MediaOriginTypeDb,
} from '@/constants/governance';
import { isPubliclyVisibleAssignmentStatus } from '@/constants/governance';
import { isAssetEligibleForPublicUse } from '@/domain/media/imagePublicationPolicy';

/** Gerarchia City Hero (D-CONS-25) — nessuno Sponsor. */
export const CITY_HERO_TIER_ORDER = [
  'admin',
  'real_wikimedia',
  'community',
  'ai',
  'placeholder',
] as const;

export type CityHeroTier = (typeof CITY_HERO_TIER_ORDER)[number];

export type CityHeroAssignmentCandidate = {
  originType: MediaOriginTypeDb;
  isCurrent: boolean;
  assignmentStatus: AssignmentStatusDb;
  assetStatus: ImageAssetStatusDb;
  wikimediaValidated: boolean | null;
  adminBlocked: boolean;
  publicUrl: string | null;
  stableId?: string | null;
};

export type CityHeroResolutionContext = {
  /**
   * Colonna città grezza. Non è un URL vincente da sola.
   * Il chiamante la usa per scegliere `adminCandidates`.
   */
  adminHeroUrl?: string | null;
  /**
   * `cities.hero_image` quando `hero_status` è `real` e nessun assignment Admin
   * corrisponde a quell'URL. L'upload Admin della copertina non crea
   * `entity_image_assignments` (`uploadPublicMediaDetailed`).
   */
  adminColumnUrl?: string | null;
  wikimediaHeroPublicEnabled: boolean;
  /** Candidati Admin il cui URL coincide già con `adminHeroUrl`. */
  adminCandidates?: CityHeroAssignmentCandidate[];
  wikimediaGalleryCandidates: CityHeroAssignmentCandidate[];
  communityCandidates?: CityHeroAssignmentCandidate[];
  aiCandidates?: CityHeroAssignmentCandidate[];
  platformPlaceholderUrl?: string | null;
};

function normalizedOrigin(originType: string): string {
  return originType.trim().toLowerCase();
}

function belongsToTier(
  originType: string,
  tier: Exclude<CityHeroTier, 'placeholder'>,
  wikimediaEnabled: boolean,
): boolean {
  const origin = normalizedOrigin(originType);
  if (tier === 'admin') return origin === 'admin' || origin === 'admin_upload';
  if (tier === 'real_wikimedia') {
    if (origin === 'verified_real') return true;
    return origin === 'wikimedia' && wikimediaEnabled;
  }
  if (tier === 'community') return origin === 'community';
  if (tier === 'ai') return origin === 'ai' || origin === 'ai_generated';
  return false;
}

function isUsableHeroCandidate(candidate: CityHeroAssignmentCandidate): boolean {
  if (!candidate.isCurrent) return false;
  if (!isPubliclyVisibleAssignmentStatus(candidate.assignmentStatus)) return false;
  const url = candidate.publicUrl?.trim() ?? '';
  if (!url) return false;
  return isAssetEligibleForPublicUse({
    originType: candidate.originType,
    assetStatus: candidate.assetStatus,
    wikimediaValidated: candidate.wikimediaValidated,
    adminBlocked: candidate.adminBlocked,
  });
}

function eligibleCandidates(
  candidates: CityHeroAssignmentCandidate[] | undefined,
  tier: Exclude<CityHeroTier, 'placeholder'>,
  wikimediaEnabled: boolean,
): CityHeroAssignmentCandidate[] {
  return (candidates ?? [])
    .filter(
      (candidate) =>
        isUsableHeroCandidate(candidate) &&
        belongsToTier(candidate.originType, tier, wikimediaEnabled),
    )
    .sort((left, right) => (left.stableId ?? '').localeCompare(right.stableId ?? ''));
}

function firstEligibleCandidateUrl(
  candidates: CityHeroAssignmentCandidate[] | undefined,
  tier: Exclude<CityHeroTier, 'placeholder'>,
  wikimediaEnabled: boolean,
): string {
  return eligibleCandidates(candidates, tier, wikimediaEnabled)[0]?.publicUrl?.trim() ?? '';
}

function matchedAdminUrl(context: CityHeroResolutionContext): string {
  return firstEligibleCandidateUrl(context.adminCandidates, 'admin', false);
}

export function resolveCityHeroDisplayUrl(context: CityHeroResolutionContext): {
  url: string | undefined;
  tier: CityHeroTier | 'none';
} {
  const adminUrl = matchedAdminUrl(context) || context.adminColumnUrl?.trim() || '';
  if (adminUrl) {
    return { url: adminUrl, tier: 'admin' };
  }

  const wikimediaUrl = firstEligibleCandidateUrl(
    context.wikimediaGalleryCandidates,
    'real_wikimedia',
    context.wikimediaHeroPublicEnabled,
  );
  if (wikimediaUrl) return { url: wikimediaUrl, tier: 'real_wikimedia' };

  const communityUrl = firstEligibleCandidateUrl(
    context.communityCandidates,
    'community',
    context.wikimediaHeroPublicEnabled,
  );
  if (communityUrl) return { url: communityUrl, tier: 'community' };

  const aiUrl = firstEligibleCandidateUrl(
    context.aiCandidates,
    'ai',
    context.wikimediaHeroPublicEnabled,
  );
  if (aiUrl) return { url: aiUrl, tier: 'ai' };

  const placeholder = context.platformPlaceholderUrl?.trim() ?? '';
  if (placeholder) return { url: placeholder, tier: 'placeholder' };

  return { url: undefined, tier: 'none' };
}

export type CityPresentationInput = {
  heroImage?: string | null;
  imageUrl?: string | null;
  wikimediaHeroPublicEnabled?: boolean;
  resolvedHeroUrl?: string | null;
};

/** Read layer pubblico: solo URL già risolto dalla cascata City Hero (D-CONS-25). */
export function resolveCityPresentation(input: CityPresentationInput): {
  headerImageUrl: string | null;
} {
  const resolved = input.resolvedHeroUrl?.trim();
  return { headerImageUrl: resolved || null };
}
