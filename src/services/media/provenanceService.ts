import {
  type ImageAssetStatusDb,
  isPublicUsableImageAssetStatus,
  type MediaOriginTypeDb,
} from '@/constants/governance';
import type { MediaStatus } from '@/types/models/Media';

/** Priorità resolver §12 / §3.6 — solo tra candidati **utilizzabili**. */
export const IMAGE_RESOLVER_PRIORITY = ['admin', 'verified_real', 'ai', 'placeholder'] as const;

export type ImageResolverTier = (typeof IMAGE_RESOLVER_PRIORITY)[number];

export type ImageResolverCandidate = {
  tier: ImageResolverTier;
  url: string;
  mediaAssetId?: string | null;
  originType?: MediaOriginTypeDb | null;
  generatedByAi?: boolean;
  isPlaceholder?: boolean;
  assetStatus?: ImageAssetStatusDb | null;
  assignmentStatus?: string | null;
  licenseVerifiedAt?: string | null;
  mediaStatus?: MediaStatus | null;
};

export type ResolvedPublicImage = {
  url: string;
  tier: ImageResolverTier;
  generatedByAi: boolean;
  isPlaceholder: boolean;
  mediaAssetId?: string | null;
};

function normalizeOrigin(origin: string | null | undefined): string {
  return (origin ?? '').trim().toLowerCase();
}

function isAdminOrigin(origin: string): boolean {
  return origin === 'admin' || origin === 'admin_upload';
}

/** Foto reale verificata — non confondere provenienza (community/wikimedia) con verifica MF3. */
function isVerifiedRealCandidate(candidate: ImageResolverCandidate): boolean {
  const origin = normalizeOrigin(candidate.originType ?? undefined);
  return origin === 'verified_real';
}

function tierForCandidate(candidate: ImageResolverCandidate): ImageResolverTier | null {
  if (candidate.isPlaceholder) return 'placeholder';
  const origin = normalizeOrigin(candidate.originType ?? undefined);
  if (candidate.generatedByAi || origin === 'ai' || origin === 'ai_generated') {
    return 'ai';
  }
  if (isAdminOrigin(origin)) return 'admin';
  if (isVerifiedRealCandidate(candidate)) return 'verified_real';
  if (candidate.mediaStatus === 'placeholder') return 'placeholder';
  return null;
}

/** Immagine utilizzabile: assignment attivo + asset lifecycle pubblicabile (D86). */
export function isCandidatePubliclyUsable(candidate: ImageResolverCandidate): boolean {
  const assignment = candidate.assignmentStatus?.trim().toLowerCase();
  if (!assignment || assignment !== 'active') return false;

  const assetStatus = candidate.assetStatus;
  if (!assetStatus || !isPublicUsableImageAssetStatus(assetStatus)) return false;

  const url = candidate.url.trim();
  return url.length > 0;
}

/**
 * Seleziona la migliore immagine tra candidati **già filtrati per utilizzabilità**.
 * Priorità Admin non bypassa stati di moderazione — applicare isCandidatePubliclyUsable prima.
 */
export function resolveBestUsableImage(
  candidates: ImageResolverCandidate[],
): ResolvedPublicImage | null {
  const usable = candidates.filter(isCandidatePubliclyUsable);
  if (usable.length === 0) return null;

  let best: { candidate: ImageResolverCandidate; tier: ImageResolverTier; rank: number } | null =
    null;

  for (const candidate of usable) {
    const tier = tierForCandidate(candidate);
    if (!tier) continue;
    const rank = IMAGE_RESOLVER_PRIORITY.indexOf(tier);
    if (rank < 0) continue;
    if (!best || rank < best.rank) {
      best = { candidate, tier, rank };
    }
  }

  if (!best) return null;

  const origin = normalizeOrigin(best.candidate.originType ?? undefined);
  const generatedByAi =
    Boolean(best.candidate.generatedByAi) || origin === 'ai' || origin === 'ai_generated';

  return {
    url: best.candidate.url.trim(),
    tier: best.tier,
    generatedByAi,
    isPlaceholder: Boolean(best.candidate.isPlaceholder) || best.tier === 'placeholder',
    mediaAssetId: best.candidate.mediaAssetId ?? null,
  };
}

export const AI_PUBLIC_DISCLOSURE_TEXT =
  'Immagine generata con Intelligenza Artificiale - Rappresentazione illustrativa, non fotografia reale.';

export function shouldShowAiPublicDisclosure(resolved: ResolvedPublicImage | null): boolean {
  return Boolean(resolved?.generatedByAi);
}
