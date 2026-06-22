import React from 'react';
import { Sparkles } from 'lucide-react';
import {
  SUITCASE_DASHBOARD_PANEL_PADDING_CLASS,
  SUITCASE_DASHBOARD_PANEL_SHELL_CLASS,
  SUITCASE_GUIDE_COMPACT_PADDING_CLASS,
  SUITCASE_GUIDE_ITEM_DESC_CLASS,
  SUITCASE_GUIDE_ITEM_TITLE_CLASS,
  SUITCASE_GUIDE_SUGGESTIONS_SHELL_CLASS,
  SuitcaseDashboardSectionLabel,
  getSuitcaseTabIcon,
} from './suitcaseDashboardPanelUi';

interface GuideItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const GuideItem: React.FC<GuideItemProps> = ({ icon, title, description }) => (
  <div className="flex gap-3.5 items-start py-3 first:pt-0 last:pb-0">
    <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-white/10 shadow-inner flex items-center justify-center shrink-0 text-slate-300">
      {icon}
    </div>
    <div className="min-w-0 pt-0.5">
      <h4 className={SUITCASE_GUIDE_ITEM_TITLE_CLASS}>{title}</h4>
      <p className={SUITCASE_GUIDE_ITEM_DESC_CLASS}>{description}</p>
    </div>
  </div>
);

interface GuidePanelProps {
  children: React.ReactNode;
  'aria-label': string;
  grow?: boolean;
  compact?: boolean;
  accent?: boolean;
}

const GuidePanel: React.FC<GuidePanelProps> = ({
  children,
  'aria-label': ariaLabel,
  grow = false,
  compact = false,
  accent = false,
}) => (
  <div
    className={[
      'flex flex-col min-h-0',
      accent ? SUITCASE_GUIDE_SUGGESTIONS_SHELL_CLASS : SUITCASE_DASHBOARD_PANEL_SHELL_CLASS,
      compact ? SUITCASE_GUIDE_COMPACT_PADDING_CLASS : SUITCASE_DASHBOARD_PANEL_PADDING_CLASS,
      grow ? 'flex-1' : 'shrink-0',
    ].join(' ')}
    aria-label={ariaLabel}
  >
    {children}
  </div>
);

const TripIcon = getSuitcaseTabIcon('trip')!;
const SavedIcon = getSuitcaseTabIcon('saved')!;
const TemplateIcon = getSuitcaseTabIcon('default')!;

const SUGGESTIONS_COPY =
  'Durante la compilazione puoi ricevere suggerimenti per arricchire la valigia. ' +
  'Ti aiutano a non dimenticare l\'essenziale e a preparare il viaggio con serenità.';

export const SuitcaseDashboardGuideColumn: React.FC = () => {
  return (
    <aside
      className="w-full lg:w-[280px] xl:w-[300px] shrink-0 flex flex-col min-h-0 lg:h-full lg:self-stretch gap-3 md:gap-4"
      aria-label="Guida rapida alla dashboard"
    >
      <GuidePanel aria-label="La dashboard" grow>
        <div className="w-full space-y-2 shrink-0">
          <SuitcaseDashboardSectionLabel label="La dashboard" />
          <p className="text-sm text-slate-300 font-medium leading-snug">
            Oltre a Inizia, la dashboard è organizzata in tre sezioni:
          </p>
        </div>

        <div className="flex flex-col flex-1 min-h-0 justify-center divide-y divide-white/[0.06]">
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
            description="Qui trovi i template disponibili come base di partenza per creare una nuova valigia."
          />
        </div>
      </GuidePanel>

      <GuidePanel aria-label="Suggerimenti valigia" compact accent>
        <SuitcaseDashboardSectionLabel label="Suggerimenti valigia" />

        <div className="flex gap-3.5 items-start mt-1">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 shadow-inner flex items-center justify-center shrink-0 text-indigo-300">
            <Sparkles className="w-4 h-4" aria-hidden />
          </div>
          <p className={`${SUITCASE_GUIDE_ITEM_DESC_CLASS} mt-0 min-w-0`}>{SUGGESTIONS_COPY}</p>
        </div>
      </GuidePanel>
    </aside>
  );
};
