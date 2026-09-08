import type { PointOfInterest } from '@/types';

/** Contratto visuale Gold/Silver — SoT runtime: `poi.tier` (già risolto a monte). */
type SponsorTierPoi = Pick<PointOfInterest, 'tier'>;

export function isSponsorGold(poi: SponsorTierPoi): boolean {
  return poi.tier === 'gold';
}

export function isSponsorSilver(poi: SponsorTierPoi): boolean {
  return poi.tier === 'silver';
}

/** Border + ring (classe `border` già sul contenitore). */
export const SPONSOR_TIER_BORDER = {
  gold: 'border-amber-500 hover:border-amber-400 ring-1 ring-amber-500/20',
  silver: 'border-slate-200 hover:border-white ring-1 ring-white/10',
  default: 'border-slate-800 hover:border-slate-600',
} as const;

export const SPONSOR_GOLD_BADGE_CLASS =
  'bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 text-black text-[7px] font-black px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(251,191,36,0.5)] uppercase tracking-normal inline-flex items-center gap-0.5 border border-yellow-100';

export const SPONSOR_SILVER_BADGE_CLASS =
  'bg-gradient-to-r from-slate-200 via-white to-slate-400 text-slate-900 text-[7px] font-black px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(255,255,255,0.2)] uppercase tracking-normal inline-flex items-center gap-0.5 border border-white/50';

export function sponsorTierBorderClass(poi: SponsorTierPoi): string {
  if (isSponsorGold(poi)) return SPONSOR_TIER_BORDER.gold;
  if (isSponsorSilver(poi)) return SPONSOR_TIER_BORDER.silver;
  return SPONSOR_TIER_BORDER.default;
}
