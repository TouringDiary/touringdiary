import type {
  AssignmentStatusDb,
  ImageAssetStatusDb,
  MediaOriginTypeDb,
} from '@/constants/governance';
import { isPublicUsableImageAssetStatus, parseImageAssetStatusDb } from '@/constants/governance';

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
  publicUrl: string | null;
  stableId?: string | null;
};

export type CityHeroResolutionContext = {
  adminHeroUrl?: string | null;
  wikimediaHeroPublicEnabled: boolean;
  wikimediaGalleryCandidates: CityHeroAssignmentCandidate[];
  communityHeroUrl?: string | null;
  aiHeroUrl?: string | null;
  platformPlaceholderUrl?: string | null;
};

function tierForCityOrigin(originType: string, wikimediaEnabled: boolean): CityHeroTier | null {
  const origin = originType.trim().toLowerCase();
  if (origin === 'admin' || origin === 'admin_upload') return 'admin';
  if (origin === 'verified_real' || origin === 'wikimedia') {
    if (origin === 'wikimedia' && !wikimediaEnabled) return null;
    return 'real_wikimedia';
  }
  if (origin === 'community') return 'community';
  if (origin === 'ai' || origin === 'ai_generated') return 'ai';
  if (origin === 'placeholder') return 'placeholder';
  return null;
}

function isUsableHeroCandidate(candidate: CityHeroAssignmentCandidate): boolean {
  if (!candidate.isCurrent) return false;
  if (candidate.assignmentStatus !== 'active') return false;
  const url = candidate.publicUrl?.trim() ?? '';
  if (!url) return false;
  try {
    return isPublicUsableImageAssetStatus(parseImageAssetStatusDb(candidate.assetStatus));
  } catch {
    return false;
  }
}

function tierRank(tier: CityHeroTier): number {
  return CITY_HERO_TIER_ORDER.indexOf(tier);
}

export function resolveCityHeroDisplayUrl(context: CityHeroResolutionContext): {
  url: string | undefined;
  tier: CityHeroTier | 'none';
} {
  const adminUrl = context.adminHeroUrl?.trim() ?? '';
  if (adminUrl.length > 0) {
    return { url: adminUrl, tier: 'admin' };
  }

  const wmCandidates = context.wikimediaGalleryCandidates
    .filter(isUsableHeroCandidate)
    .map((row) => {
      const tier = tierForCityOrigin(row.originType, context.wikimediaHeroPublicEnabled);
      return tier
        ? {
            tier,
            url: row.publicUrl?.trim() ?? '',
            rank: tierRank(tier),
            stableId: row.stableId ?? '',
          }
        : null;
    })
    .filter((v): v is NonNullable<typeof v> => v !== null && v.url.length > 0)
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.stableId.localeCompare(b.stableId);
    });

  if (wmCandidates[0]) {
    return { url: wmCandidates[0].url, tier: wmCandidates[0].tier };
  }

  const communityUrl = context.communityHeroUrl?.trim() ?? '';
  if (communityUrl) return { url: communityUrl, tier: 'community' };

  const aiUrl = context.aiHeroUrl?.trim() ?? '';
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
