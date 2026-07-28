import React from 'react';
import { ChevronRight } from 'lucide-react';

export type MyWorldCrumb = {
  id: 'myWorld' | 'mySpace' | string;
  label: string;
  onClick?: () => void;
};

interface Props {
  crumbs: MyWorldCrumb[];
}

/**
 * Breadcrumb cliccabile MyWorld / MySpace (DOC 35 §4.6).
 * STEP-2: fino a Viaggio (e sezione cartella) quando la shell passa crumbs più profondi.
 */
export const MyWorldBreadcrumb: React.FC<Props> = ({ crumbs }) => {
  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Percorso MyWorld" className="flex items-center gap-1 min-w-0 flex-wrap">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        /** DOC 35: ogni livello è cliccabile quando ha destinazione. */
        const clickable = !!crumb.onClick;

        return (
          <React.Fragment key={`${crumb.id}-${index}`}>
            {index > 0 && (
              <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" aria-hidden />
            )}
            {clickable ? (
              <button
                type="button"
                onClick={crumb.onClick}
                className={`text-[10px] font-bold uppercase tracking-wider truncate max-w-[10rem] ${
                  isLast
                    ? 'text-slate-200 hover:text-white'
                    : 'text-indigo-300 hover:text-indigo-100'
                }`}
                aria-current={isLast ? 'page' : undefined}
              >
                {crumb.label}
              </button>
            ) : (
              <span
                className={`text-[10px] font-bold uppercase tracking-wider truncate max-w-[10rem] ${
                  isLast ? 'text-slate-200' : 'text-slate-500'
                }`}
                aria-current={isLast ? 'page' : undefined}
              >
                {crumb.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
