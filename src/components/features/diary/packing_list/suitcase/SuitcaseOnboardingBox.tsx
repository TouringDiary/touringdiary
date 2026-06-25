import React from 'react';
import { Briefcase, Layout, Sparkles, LogIn, ChevronRight, MousePointerClick } from 'lucide-react';
import { SuitcaseDashboardGuideColumn } from './SuitcaseDashboardGuideColumn';
import {
  SUITCASE_DASHBOARD_PANEL_PADDING_CLASS,
  SUITCASE_DASHBOARD_PANEL_SHELL_CLASS,
  SuitcaseDashboardSectionLabel,
} from './suitcaseDashboardPanelUi';

type OnboardingEntryVariant = 'default' | 'highlight' | 'informative';

interface OnboardingEntryProps {
  icon: React.ReactNode;
  iconClassName?: string;
  title: string;
  description: string;
  onClick?: () => void;
  disabled?: boolean;
  interactive?: boolean;
  variant?: OnboardingEntryVariant;
  actionHint?: string;
}

const OnboardingEntry: React.FC<OnboardingEntryProps> = ({
  icon,
  iconClassName = '',
  title,
  description,
  onClick,
  disabled = false,
  interactive = true,
  variant = 'default',
  actionHint,
}) => {
  const isClickable = interactive && !!onClick && !disabled;
  const isInformative = variant === 'informative';
  const isHighlight = variant === 'highlight';
  const isInformativeNav = isInformative && isClickable;

  const iconShellClass = [
    'w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner',
    isHighlight
      ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
      : isInformative
        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
        : 'bg-slate-800/80 border-white/10 text-slate-300',
    iconClassName,
  ].join(' ');

  const cardClass = [
    'w-full h-full flex flex-col min-h-[108px] md:min-h-0 p-4 md:p-5 rounded-xl text-left transition-all relative',
    isInformative && !isInformativeNav
      ? 'border border-dashed border-indigo-500/25 bg-slate-950/25'
      : isInformativeNav
        ? 'border border-indigo-500/25 bg-slate-950/40 shadow-lg shadow-black/10 hover:bg-indigo-500/5 hover:border-indigo-500/40 hover:shadow-[0_0_28px_rgba(99,102,241,0.12)] cursor-pointer active:scale-[0.99] group'
        : isHighlight
          ? 'border border-amber-500/20 bg-slate-950/40 shadow-[0_0_24px_rgba(245,158,11,0.06)]'
          : 'border border-white/10 bg-slate-950/40 shadow-lg shadow-black/10',
    isClickable && !isInformativeNav
      ? isHighlight
        ? 'hover:bg-amber-500/5 hover:border-amber-500/35 hover:shadow-[0_0_28px_rgba(245,158,11,0.12)] cursor-pointer active:scale-[0.99] group'
        : 'hover:bg-indigo-500/5 hover:border-indigo-500/35 hover:shadow-[0_0_28px_rgba(99,102,241,0.12)] cursor-pointer active:scale-[0.99] group'
      : '',
    disabled && !isInformativeNav ? 'opacity-50 cursor-not-allowed' : '',
  ].join(' ');

  const body = (
    <>
      <div className="flex items-start justify-between gap-3 w-full">
        <div className={iconShellClass}>{icon}</div>
        {isClickable && (
          <ChevronRight
            className={`w-5 h-5 shrink-0 mt-1 transition-transform group-hover:translate-x-0.5 ${
              isHighlight
                ? 'text-amber-400/70 group-hover:text-amber-300'
                : 'text-slate-500 group-hover:text-indigo-300'
            }`}
            aria-hidden
          />
        )}
      </div>

      <div className="min-w-0 flex-1 mt-3">
        <h4 className="text-base md:text-lg font-black text-white tracking-tight leading-snug">
          {title}
        </h4>
        <p className="text-sm text-slate-300 leading-snug font-medium mt-1.5">{description}</p>
        {actionHint && (
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mt-2">
            {actionHint}
          </p>
        )}
      </div>
    </>
  );

  if (isClickable) {
    return (
      <button type="button" onClick={onClick} className={cardClass}>
        {body}
      </button>
    );
  }

  return <div className={cardClass}>{body}</div>;
};

interface SuitcaseOnboardingBoxProps {
  onCreateSuitcase?: () => void;
  onCreateTemplate?: () => void;
  onOpenRecommendedSuitcase?: () => void;
  showRecommendedSuitcase?: boolean;
  onNavigateToTemplates?: () => void;
  isGuest?: boolean;
  onLogin?: () => void;
}

const DiaryBrand: React.FC = () => (
  <span className="font-handwriting text-amber-400 text-xl md:text-2xl leading-none whitespace-nowrap">
    Diario di Viaggio
  </span>
);

export const SuitcaseOnboardingBox: React.FC<SuitcaseOnboardingBoxProps> = ({
  onCreateSuitcase,
  onCreateTemplate,
  onOpenRecommendedSuitcase,
  showRecommendedSuitcase = false,
  onNavigateToTemplates,
  isGuest = false,
  onLogin,
}) => {
  const handlePersonalizedClick = () => {
    if (showRecommendedSuitcase && onOpenRecommendedSuitcase) {
      onOpenRecommendedSuitcase();
      return;
    }
    if (isGuest && onLogin) {
      onLogin();
    }
  };

  const personalizedInteractive =
    (showRecommendedSuitcase && !!onOpenRecommendedSuitcase) || (isGuest && !!onLogin);

  return (
    <div className="w-full shrink-0 flex flex-col lg:flex-1 lg:flex-row lg:items-stretch lg:min-h-0 gap-5 lg:gap-5 animate-in fade-in zoom-in duration-700">
      {/* Colonna principale — onboarding */}
      <div
        className={`shrink-0 flex flex-col min-w-0 lg:flex-1 lg:self-stretch gap-4 md:gap-5 ${SUITCASE_DASHBOARD_PANEL_SHELL_CLASS} ${SUITCASE_DASHBOARD_PANEL_PADDING_CLASS}`}
      >
        <div className="w-full space-y-2 shrink-0">
          <SuitcaseDashboardSectionLabel label="Inizia qui" />
          <div>
            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight">
              Come preparare la valigia
            </h3>
            <p className="text-sm md:text-base text-slate-300 font-medium mt-1 leading-snug">
              Scegli il percorso più adatto al tuo viaggio.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-lg:gap-3 md:gap-4 w-full max-lg:flex-none lg:flex-1 lg:min-h-0 lg:auto-rows-fr">
          <OnboardingEntry
            icon={<Briefcase className="w-5 h-5 md:w-6 md:h-6" />}
            title="Crea una nuova valigia"
            description="Parti da zero ed aggiungi gli oggetti manualmente."
            onClick={onCreateSuitcase}
          />

          <OnboardingEntry
            variant="highlight"
            icon={<Sparkles className="w-5 h-5 md:w-6 md:h-6" />}
            title="Crea una Valigia Personalizzata"
            description="Lasciati guidare nella creazione della valigia in base al viaggio."
            onClick={personalizedInteractive ? handlePersonalizedClick : undefined}
            interactive={personalizedInteractive}
            disabled={!personalizedInteractive}
          />

          <OnboardingEntry
            icon={<Layout className="w-5 h-5 md:w-6 md:h-6" />}
            title="Crea un template"
            description="Crea da zero il tuo template ed aggiungi gli oggetti manualmente."
            onClick={onCreateTemplate}
          />

          <OnboardingEntry
            variant="informative"
            icon={<MousePointerClick className="w-5 h-5 md:w-6 md:h-6" />}
            title="Usa un template"
            description="Scegli uno dei template disponibili qui sotto."
            onClick={onNavigateToTemplates}
            interactive={!!onNavigateToTemplates}
            actionHint={onNavigateToTemplates ? 'Apri tab Template' : undefined}
          />
        </div>

        <div className="w-full rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 md:p-5 shadow-inner shadow-indigo-500/5 shrink-0 max-lg:mt-1 lg:mt-auto">
          {isGuest && onLogin ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-left">
              <button
                type="button"
                onClick={onLogin}
                className="inline-flex items-center justify-center gap-2 shrink-0 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98]"
              >
                <LogIn className="w-4 h-4" aria-hidden />
                Accedi
              </button>
              <p className="text-sm md:text-base text-slate-200 leading-relaxed font-medium min-w-0 flex-1">
                Effettua il login: le valigie ed i template salvati possono essere associati al{' '}
                <DiaryBrand />.
              </p>
            </div>
          ) : (
            <p className="text-sm md:text-base text-slate-200 leading-relaxed font-medium text-left">
              Le valigie e i template salvati possono essere associati al <DiaryBrand />.
            </p>
          )}
        </div>
      </div>

      {/* Colonna secondaria — guida tab */}
      <SuitcaseDashboardGuideColumn />
    </div>
  );
};
