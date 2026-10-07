import type {
  AssignmentStatusDb,
  ImageAssetStatusDb,
  MediaOriginTypeDb,
} from '@/constants/governance';
import { isPubliclyVisibleAssignmentStatus, parseImageAssetStatusDb } from '@/constants/governance';
import { isAssetEligibleForPublicUse } from '@/domain/media/imagePublicationPolicy';
import type { PoiCategory } from '@/types/models/City';
import {
  type ResolvePoiDisplayImageUrlParams,
  resolveCategoryPlaceholderUrl,
} from './resolvePoiDisplayImageUrl';

/** Ordine D-22 POI (INT-01b) — indice minore = priorità maggiore. */
export const POI_D22_TIER_ORDER = [
  'sponsor',
  'admin',
  'real_wikimedia',
  'community',
  'ai',
  'placeholder',
] as const;

export type PoiD22Tier = (typeof POI_D22_TIER_ORDER)[number];

export type PoiImageAssignmentCandidate = {
  assignmentRole: 'primary' | 'gallery';
  /** Solo assignment corrente (MF4 is_current) è eleggibile. */
  isCurrent: boolean;
  assignmentStatus: AssignmentStatusDb;
  originType: MediaOriginTypeDb;
  assetStatus: ImageAssetStatusDb;
  /** true solo se la validazione Wikimedia è concessa. Ignorato se l'origine non è wikimedia. */
  wikimediaValidated: boolean | null;
  adminBlocked: boolean;
  publicUrl: string | null;
  createdAt?: string | null;
  stableId?: string | null;
};

export type PoiImageD22Context = {
  wikimediaPublicEnabled: boolean;
  assignments: PoiImageAssignmentCandidate[];
  category: PoiCategory | string;
  categoryPlaceholders?: Record<string, string> | null;
};

function tierForOrigin(
  originType: string,
  _assignmentRole: 'primary' | 'gallery',
  wikimediaPublicEnabled: boolean,
): PoiD22Tier | null {
  const origin = originType.trim().toLowerCase();
  if (origin === 'sponsor') return 'sponsor';
  if (origin === 'admin' || origin === 'admin_upload') return 'admin';
  if (origin === 'verified_real' || origin === 'wikimedia') {
    if (origin === 'wikimedia' && !wikimediaPublicEnabled) return null;
    return 'real_wikimedia';
  }
  if (origin === 'community') return 'community';
  if (origin === 'ai' || origin === 'ai_generated') return 'ai';
  if (origin === 'placeholder') return 'placeholder';
  return null;
}

function isUsableCandidate(candidate: PoiImageAssignmentCandidate): boolean {
  if (!candidate.isCurrent) return false;
  if (!isPubliclyVisibleAssignmentStatus(candidate.assignmentStatus)) return false;
  const url = candidate.publicUrl?.trim() ?? '';
  if (!url) return false;
  try {
    if (
      !isAssetEligibleForPublicUse({
        originType: candidate.originType,
        assetStatus: parseImageAssetStatusDb(candidate.assetStatus),
        wikimediaValidated: candidate.wikimediaValidated,
        adminBlocked: candidate.adminBlocked,
      })
    ) {
      return false;
    }
  } catch {
    return false;
  }
  return true;
}

function tierRank(tier: PoiD22Tier): number {
  return POI_D22_TIER_ORDER.indexOf(tier);
}

/**
 * Resolver puro D-22: nessuna query I/O.
 * Sponsor: gallery (o primary) con origin sponsor; Admin non bypassa moderazione.
 */
export function resolvePoiPublicImageByD22(context: PoiImageD22Context): {
  url: string | undefined;
  tier: PoiD22Tier | 'none';
} {
  const usable = context.assignments
    .filter(isUsableCandidate)
    .map((row) => {
      const tier = tierForOrigin(
        row.originType,
        row.assignmentRole,
        context.wikimediaPublicEnabled,
      );
      return tier ? { tier, row, rank: tierRank(tier) } : null;
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      const aCreated = a.row.createdAt ?? '';
      const bCreated = b.row.createdAt ?? '';
      if (aCreated !== bCreated) return aCreated.localeCompare(bCreated);
      if (a.row.assignmentRole !== b.row.assignmentRole) {
        return a.row.assignmentRole === 'primary' ? -1 : 1;
      }
      const aId = a.row.stableId ?? '';
      const bId = b.row.stableId ?? '';
      return aId.localeCompare(bId);
    });

  const winner = usable[0];
  if (winner?.row.publicUrl) {
    return { url: winner.row.publicUrl.trim(), tier: winner.tier };
  }

  const placeholderParams: ResolvePoiDisplayImageUrlParams = {
    category: context.category,
    categoryPlaceholders: context.categoryPlaceholders,
  };
  const placeholder = resolveCategoryPlaceholderUrl(placeholderParams);
  if (placeholder) {
    return { url: placeholder, tier: 'placeholder' };
  }

  return { url: undefined, tier: 'none' };
}

/** Guard orchestratore: primary/gallery attiva con tier ≥ admin blocca auto Wikimedia. */
export function poiHasHigherPriorityThanWikimedia(context: PoiImageD22Context): boolean {
  const wikimediaRank = tierRank('real_wikimedia');
  for (const row of context.assignments) {
    if (!isUsableCandidate(row)) continue;
    const tier = tierForOrigin(row.originType, row.assignmentRole, true);
    if (!tier) continue;
    if (tierRank(tier) < wikimediaRank) return true;
  }
  return false;
}
