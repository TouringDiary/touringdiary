import type { CommonsLicenseParseOutcome } from './commonsLicenseParser';
import type { WikidataCandidate, WikidataP18Proposal } from './wikidataLookupService';

export type WikimediaProposalPreview = {
  candidate: WikidataCandidate;
  proposal: WikidataP18Proposal | null;
  license: CommonsLicenseParseOutcome | null;
  isImportable: boolean;
  validityNote: string;
  isBest?: boolean;
};

function confidenceRank(confidence: WikidataP18Proposal['confidence'] | undefined): number {
  if (confidence === 'high') return 2;
  if (confidence === 'medium') return 1;
  return 0;
}

/** Ordina proposte manuali: CC BY 4.0 auto-path → matchScore → confidence → QID. */
export function rankWikimediaProposals(
  previews: WikimediaProposalPreview[],
): WikimediaProposalPreview[] {
  const sorted = [...previews].sort((a, b) => {
    const aAuto = a.isImportable && a.license?.isCcBy40AutoPathEligible ? 1 : 0;
    const bAuto = b.isImportable && b.license?.isCcBy40AutoPathEligible ? 1 : 0;
    if (bAuto !== aAuto) return bAuto - aAuto;

    const scoreDelta = b.candidate.matchScore - a.candidate.matchScore;
    if (scoreDelta !== 0) return scoreDelta;

    const confDelta =
      confidenceRank(b.proposal?.confidence) - confidenceRank(a.proposal?.confidence);
    if (confDelta !== 0) return confDelta;

    return a.candidate.qid.localeCompare(b.candidate.qid);
  });

  const bestIndex = sorted.findIndex((row) => row.isImportable && row.proposal);

  return sorted.map((row, index) => ({
    ...row,
    isBest: bestIndex >= 0 && index === bestIndex,
  }));
}
