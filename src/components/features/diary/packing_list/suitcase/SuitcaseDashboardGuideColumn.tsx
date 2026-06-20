import React from 'react';
import {
  SUITCASE_DASHBOARD_PANEL_PADDING_CLASS,
  SUITCASE_DASHBOARD_PANEL_SHELL_CLASS,
  SuitcaseDashboardSectionLabel,
  getSuitcaseTabIcon,
} from './suitcaseDashboardPanelUi';

interface GuideItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const GuideItem: React.FC<GuideItemProps> = ({ icon, title, description }) => (
  <div className="flex gap-3 lg:flex-1 lg:items-center">
    <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-white/10 shadow-inner flex items-center justify-center shrink-0 text-slate-300">
      {icon}
    </div>
    <div className="min-w-0">
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
        {title}
      </h4>
      <p className="text-xs text-slate-400 leading-relaxed font-medium mt-1.5">{description}</p>
    </div>
  </div>
);

const TripIcon = getSuitcaseTabIcon('trip')!;
const SavedIcon = getSuitcaseTabIcon('saved')!;
const TemplateIcon = getSuitcaseTabIcon('default')!;

export const SuitcaseDashboardGuideColumn: React.FC = () => {
  return (
    <aside
      className={`w-full lg:w-[280px] xl:w-[300px] shrink-0 flex flex-col min-h-0 lg:self-stretch gap-4 md:gap-5 ${SUITCASE_DASHBOARD_PANEL_SHELL_CLASS} ${SUITCASE_DASHBOARD_PANEL_PADDING_CLASS}`}
      aria-label="Guida rapida alla dashboard"
    >
      <div className="w-full space-y-2 shrink-0">
        <SuitcaseDashboardSectionLabel label="La dashboard" />
        <p className="text-sm text-slate-300 font-medium leading-snug">
          Oltre a Inizia, la dashboard è organizzata in tre sezioni:
        </p>
      </div>

      <div className="flex flex-col flex-1 justify-evenly gap-5 lg:gap-0 min-h-0">
        <GuideItem
          icon={<TripIcon className="w-4 h-4" aria-hidden />}
          title="Diario"
          description="Qui trovi le valigie associate ai viaggi del tuo Diario di Viaggio, pronte per il packing del viaggio in corso."
        />
        <GuideItem
          icon={<SavedIcon className="w-4 h-4" aria-hidden />}
          title="Salvate"
          description="Qui sono conservate le tue valigie personali salvate, da riutilizzare o associare a un nuovo viaggio."
        />
        <GuideItem
          icon={<TemplateIcon className="w-4 h-4" aria-hidden />}
          title="Template"
          description="Qui puoi consultare e utilizzare i template disponibili come base per creare una nuova valigia."
        />
      </div>
    </aside>
  );
};
