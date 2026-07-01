import React from 'react';
import { BookOpen, Briefcase, Compass, Layout, type LucideIcon } from 'lucide-react';
import type { SuitcaseSourceTab } from '../SuitcaseFloatingPanel/types/sourceTab';

/** Shell condiviso per i pannelli Inizia e La dashboard. */
export const SUITCASE_DASHBOARD_PANEL_SHELL_CLASS =
  'rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-950/35 via-slate-900/60 to-slate-950/50 backdrop-blur-md shadow-xl shadow-black/25';

export const SUITCASE_DASHBOARD_PANEL_PADDING_CLASS =
  'px-5 py-4 md:px-6 md:py-5 lg:py-6';

export const SUITCASE_DASHBOARD_SECTION_BAR_CLASS =
  'w-1 h-5 bg-amber-500 rounded-full shrink-0';

export const SUITCASE_DASHBOARD_SECTION_LABEL_CLASS =
  'text-[11px] font-black text-amber-500 uppercase tracking-[0.2em]';

/** Tipografia voci guida (colonna Inizia). */
export const SUITCASE_GUIDE_ITEM_TITLE_CLASS =
  'text-[11px] font-bold uppercase tracking-[0.16em] text-slate-100';

export const SUITCASE_GUIDE_ITEM_DESC_CLASS =
  'text-sm text-slate-300 leading-relaxed font-medium mt-1.5';

export const SUITCASE_GUIDE_COMPACT_PADDING_CLASS =
  'px-5 py-3.5 md:px-6 md:py-4';

export const SUITCASE_GUIDE_SUGGESTIONS_SHELL_CLASS =
  'rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-slate-900/55 to-slate-950/50 backdrop-blur-md shadow-xl shadow-indigo-950/20';

const TAB_ICONS: Partial<Record<SuitcaseSourceTab, LucideIcon>> = {
  start: Compass,
  trip: BookOpen,
  saved: Briefcase,
  default: Layout,
};

export function getSuitcaseTabIcon(tab: SuitcaseSourceTab): LucideIcon | null {
  return TAB_ICONS[tab] ?? null;
}

interface SuitcaseDashboardSectionLabelProps {
  label: string;
}

export const SuitcaseDashboardSectionLabel: React.FC<SuitcaseDashboardSectionLabelProps> = ({
  label,
}) => (
  <div className="flex items-center gap-3 shrink-0">
    <div className={SUITCASE_DASHBOARD_SECTION_BAR_CLASS} />
    <span className={SUITCASE_DASHBOARD_SECTION_LABEL_CLASS}>{label}</span>
  </div>
);
