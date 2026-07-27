import React from 'react';
import type { ViaggioFolderSectionDefinition } from '@/myspace/viaggioFolderSections';

interface Props {
  section: ViaggioFolderSectionDefinition;
}

/** Empty silenzioso per sezione cartella Viaggio (STEP-2 — no feature STEP-3…5). */
export const ViaggioSectionPlaceholder: React.FC<Props> = ({ section }) => (
  <div
    id={`viaggio-section-panel-${section.id}`}
    role="tabpanel"
    aria-labelledby={`viaggio-section-tab-${section.id}`}
    data-testid={`viaggio-section-${section.id}`}
    className="flex-1 min-h-0 flex flex-col items-center justify-center text-center px-4 py-8"
  >
    <h3 className="text-base font-bold text-white tracking-tight mb-2">{section.label}</h3>
    <p className="text-sm text-slate-400 max-w-md leading-relaxed">{section.placeholder}</p>
  </div>
);
