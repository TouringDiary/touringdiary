import React from 'react';
import { SuitcaseAscentProgressIndicator, getAscentProgressColor } from './SuitcaseAscentProgressIndicator';

interface SuitcaseToolbarProgressBoxProps {
  checkedCount: number;
  totalCount: number;
  progressPerc: number;
  variant?: 'toolbar' | 'header' | 'panels';
  className?: string;
  /**
   * Solo mobile (<lg): dispone testata su una sola riga [%] [barra] [conteggio] per ridurre
   * l'altezza verticale del box. Su desktop (lg+) resta invariato il layout impilato originale.
   */
  mobileSingleRow?: boolean;
}

export const SuitcaseToolbarProgressBox: React.FC<SuitcaseToolbarProgressBoxProps> = ({
  checkedCount,
  totalCount,
  progressPerc,
  variant = 'toolbar',
  className = '',
  mobileSingleRow = false,
}) => {
  const accentColor = getAscentProgressColor(progressPerc);
  const isHeader = variant === 'header';
  const isPanels = variant === 'panels';

  const panelsLayoutClass =
    isPanels && mobileSingleRow
      ? 'bg-slate-950/40 border-white/10 px-3 py-1.5 min-h-0 justify-center lg:px-4 lg:py-4 lg:min-h-[5.5rem]'
      : 'bg-slate-950/40 border-white/10 px-4 py-2 sm:py-4 min-h-[3.25rem] sm:min-h-[5.5rem] justify-center';

  const countText = (textClass: string) => (
    <div className={`flex items-center justify-center gap-1.5 tabular-nums whitespace-nowrap leading-none ${textClass}`}>
      <span
        className={`font-black transition-colors duration-500 ${
          isHeader || isPanels ? 'text-xs md:text-sm' : 'text-sm md:text-base'
        }`}
        style={{ color: accentColor }}
      >
        {progressPerc}%
      </span>
      <span className="text-[10px] text-slate-500 font-bold" aria-hidden>
        •
      </span>
      <span className={`font-black text-white ${isHeader || isPanels ? 'text-xs md:text-sm' : 'text-sm md:text-base'}`}>
        {checkedCount}
        <span className="text-slate-400 font-bold mx-0.5" aria-hidden>/</span>
        {totalCount}
      </span>
    </div>
  );

  return (
    <div
      className={`shrink-0 flex flex-col items-stretch gap-1 rounded-xl border shadow-lg shadow-black/25 ring-1 ring-white/10 ${className} ${
        isPanels
          ? panelsLayoutClass
          : isHeader
            ? 'bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-slate-950 border-white/15 px-2.5 py-1 min-w-[5.5rem] md:min-w-[6.5rem]'
            : 'self-center bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-slate-950 border-white/15 px-2.5 py-1.5 md:px-3 min-w-[6.5rem] md:min-w-[7.5rem]'
      }`}
      role="status"
      aria-label={`Progresso valigia: ${checkedCount} completati su ${totalCount}, ${progressPerc} percento`}
    >
      {isPanels && mobileSingleRow ? (
        <>
          {/* Mobile (<lg): una sola riga [%] [barra] [conteggio] */}
          <div className="flex lg:hidden items-center gap-2.5 w-full tabular-nums whitespace-nowrap leading-none">
            <span
              className="font-black text-xs transition-colors duration-500 shrink-0"
              style={{ color: accentColor }}
            >
              {progressPerc}%
            </span>
            <div className="flex-1 min-w-0">
              <SuitcaseAscentProgressIndicator progressPerc={progressPerc} />
            </div>
            <span className="font-black text-white text-xs shrink-0">
              {checkedCount}
              <span className="text-slate-400 font-bold mx-0.5" aria-hidden>/</span>
              {totalCount}
            </span>
          </div>

          {/* Desktop (lg+): layout impilato originale */}
          <div className="hidden lg:flex lg:flex-col lg:items-stretch lg:gap-1 w-full">
            {countText('')}
            <SuitcaseAscentProgressIndicator progressPerc={progressPerc} />
          </div>
        </>
      ) : (
        <>
          {countText('')}
          <SuitcaseAscentProgressIndicator progressPerc={progressPerc} />
        </>
      )}
    </div>
  );
};
