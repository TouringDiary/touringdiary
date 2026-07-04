import React from 'react';
import { Check } from 'lucide-react';
import type { SharingMode } from '@/domain/collaboration';
import {
  getWizardSteps,
  getWizardStepShortLabel,
  type SharePath,
  type WizardStep,
} from './collaborationSharePresentation';

export interface WizardStepIndicatorProps {
  wizardStep: WizardStep;
  sharePath: SharePath;
  sharingMode: SharingMode;
}

export const WizardStepIndicator: React.FC<WizardStepIndicatorProps> = ({
  wizardStep,
  sharePath,
  sharingMode,
}) => {
  const steps = getWizardSteps(sharePath, sharingMode);
  const currentIndex = steps.indexOf(wizardStep);

  if (steps.length <= 1) return null;

  return (
    <nav
      className="flex items-center justify-center gap-0 py-3 px-2 border-b border-slate-800/80"
      aria-label="Progresso wizard"
    >
      {steps.map((step, index) => {
        const isCurrent = step === wizardStep;
        const isCompleted = currentIndex >= 0 && index < currentIndex;
        const isFuture = currentIndex >= 0 && index > currentIndex;

        return (
          <React.Fragment key={step}>
            {index > 0 && (
              <div
                className={`h-px w-4 sm:w-8 shrink-0 ${
                  isCompleted ? 'bg-indigo-500/70' : 'bg-slate-700'
                }`}
                aria-hidden
              />
            )}
            <div className="flex flex-col items-center gap-1 min-w-0">
              <div
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors
                  ${isCurrent ? 'bg-indigo-600 border-indigo-400 text-white ring-2 ring-indigo-500/40' : ''}
                  ${isCompleted ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-200' : ''}
                  ${isFuture ? 'bg-slate-800 border-slate-700 text-slate-500' : ''}
                `}
                aria-current={isCurrent ? 'step' : undefined}
                title={getWizardStepShortLabel(step)}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3" aria-hidden />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span
                className={`hidden sm:block text-[8px] font-bold uppercase tracking-wider truncate max-w-[4.5rem] text-center ${
                  isCurrent ? 'text-indigo-300' : isCompleted ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                {getWizardStepShortLabel(step)}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </nav>
  );
};

WizardStepIndicator.displayName = 'WizardStepIndicator';
