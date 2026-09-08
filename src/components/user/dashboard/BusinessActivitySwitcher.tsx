import { ChevronDown } from 'lucide-react';
import type { ResolvedSponsor } from '@/types/models/Sponsor';
import { formatLocalIsoDateDisplay } from '@/utils/common';

const activityDisplayName = (biz: ResolvedSponsor): string =>
  biz.companyName || biz.resolvedData?.name || 'Attività';

/** Runtime contract validity label for owner-facing UI (domain: approved + endDate). */
export const getSponsorContractStatusLabel = (
  biz: ResolvedSponsor,
): { label: string; toneClass: string } => {
  if (biz.status === 'approved' && biz.isExpired) {
    return { label: 'Scaduto', toneClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30' };
  }
  if (biz.status === 'approved') {
    return {
      label: 'Attivo',
      toneClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    };
  }
  if (biz.status === 'cancelled') {
    return { label: 'Annullato', toneClass: 'bg-slate-800 text-slate-400 border-slate-600' };
  }
  return {
    label: biz.status.replace(/_/g, ' '),
    toneClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  };
};

/**
 * Owner-facing plan level — SoT: `ResolvedSponsor.tier` (RuntimeTier),
 * già risolto in `mapDbSponsorToApp` da `pricing_versions.plans.type` via `resolvePlanTier`.
 * Non usare `biz.type`: la colonna `sponsors.type` può restare LOCAL_ACTIVITY anche con piano Gold a listino.
 */
export const getBusinessActivityLevelLabel = (
  biz: ResolvedSponsor,
): { label: 'GOLD' | 'SILVER' | 'STANDARD'; toneClass: string } => {
  if (biz.tier === 'gold') {
    return {
      label: 'GOLD',
      toneClass:
        'bg-gradient-to-r from-amber-200/20 via-yellow-400/15 to-amber-500/20 text-amber-300 border-amber-500/40',
    };
  }
  if (biz.tier === 'silver') {
    return {
      label: 'SILVER',
      toneClass: 'bg-slate-200/10 text-slate-200 border-slate-400/40',
    };
  }
  return {
    label: 'STANDARD',
    toneClass: 'bg-slate-800 text-slate-400 border-slate-600',
  };
};

const formatValidityRange = (biz: ResolvedSponsor): string | null => {
  const start = biz.startDate ? formatLocalIsoDateDisplay(biz.startDate) : '';
  const end = biz.endDate ? formatLocalIsoDateDisplay(biz.endDate) : '';
  if (start && end) return `Dal ${start} al ${end}`;
  if (start) return `Dal ${start}`;
  if (end) return `Fino al ${end}`;
  return null;
};

interface Props {
  businesses: ResolvedSponsor[];
  activeBusiness: ResolvedSponsor | null;
  onSwitch: (businessIdOrSlug: string) => void;
}

/**
 * Compact owner activity switcher — replaces the former card grid.
 * Selection state remains BusinessContext (URL-driven).
 */
export const BusinessActivitySwitcher = ({ businesses, activeBusiness, onSwitch }: Props) => {
  if (businesses.length === 0) return null;

  const selected = activeBusiness ?? businesses[0];
  const status = getSponsorContractStatusLabel(selected);
  const level = getBusinessActivityLevelLabel(selected);
  const validity = formatValidityRange(selected);
  const selectValue = selected.slug || selected.id;

  return (
    <div className="mb-8 md:mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="pt-1 px-1 sm:px-2">
        <div className="flex items-center gap-3 mb-4">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] shrink-0">
            Seleziona Attività
          </h4>
          <div className="h-px flex-1 bg-slate-800/50" aria-hidden />
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-6">
          <div className="flex-1 min-w-0 w-full lg:max-w-md">
            <label htmlFor="business-activity-select" className="sr-only">
              Attività
            </label>
            <div className="relative">
              <select
                id="business-activity-select"
                value={selectValue}
                onChange={(e) => onSwitch(e.target.value)}
                disabled={businesses.length === 1}
                className="w-full appearance-none bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:outline-none rounded-xl pl-4 pr-11 py-3.5 text-sm font-bold text-white cursor-pointer disabled:cursor-default disabled:opacity-90 min-h-11"
              >
                {businesses.map((biz) => {
                  const optStatus = getSponsorContractStatusLabel(biz);
                  const optLevel = getBusinessActivityLevelLabel(biz);
                  const name = activityDisplayName(biz);
                  return (
                    <option key={biz.id} value={biz.slug || biz.id}>
                      {`${name} · ${optStatus.label} · ${optLevel.label}`}
                    </option>
                  );
                })}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
                aria-hidden
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 min-w-0 lg:pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${status.toneClass}`}
              >
                {status.label}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${level.toneClass}`}
              >
                {level.label}
              </span>
              {selected.city ? (
                <span className="text-[10px] font-bold text-slate-500 uppercase truncate max-w-full">
                  {selected.city}
                </span>
              ) : null}
            </div>
            {validity ? (
              <p className="text-xs font-medium text-slate-400">{validity}</p>
            ) : (
              <p className="text-xs font-medium text-slate-600">Validità non disponibile</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
