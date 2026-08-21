import type React from 'react';
import { useSystemMessage } from '../../hooks/useSystemMessage';

export interface AdPlaceholderProps {
  label?: string;
  className?: string;
  variant?: 'gold' | 'silver';
  onClick?: () => void;
}

export const AdPlaceholder: React.FC<AdPlaceholderProps> = ({
  label: propLabel,
  className = '',
  variant = 'gold',
  onClick,
}) => {
  const isGold = variant === 'gold';

  // TESTI DINAMICI DAL DB
  const { getText: getAdMsg } = useSystemMessage('ad_placeholder_text');
  const adMsg = getAdMsg();

  // Se la prop label è passata, usala. Altrimenti usa il titolo dal DB.
  const displayLabel = propLabel || adMsg.title || '';
  const subText = adMsg.body || '';

  // w-full: button nativo non espande come il vecchio div block; obbligatorio per slot PARTNER.
  const baseStyles =
    'w-full bg-slate-900/40 border border-dashed rounded-xl flex flex-col items-center justify-center text-center group transition-all cursor-pointer p-1 overflow-hidden relative';

  const variantStyles = isGold
    ? 'border-slate-800 hover:border-amber-600/50 hover:bg-amber-900/5'
    : 'border-slate-800 hover:border-slate-500 hover:bg-slate-800/40';

  const textStyles = isGold
    ? 'text-amber-500/80 group-hover:text-amber-400'
    : 'text-slate-400 group-hover:text-slate-200';

  const containerClass = `${baseStyles} ${variantStyles} ${className}`;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={displayLabel || 'Spazio pubblicitario'}
      className={`${containerClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50`}
    >
      {/* Label compattata */}
      <span
        className={`text-[8px] font-black uppercase tracking-wider mb-0.5 leading-none transition-colors ${textStyles}`}
      >
        {displayLabel}
      </span>

      {/* Contenuto scalato e senza gap eccessivi */}
      <div className="flex flex-col items-center leading-tight scale-90 group-hover:scale-95 transition-transform duration-300">
        <span className="text-[9px] text-white font-bold whitespace-pre-line">{subText}</span>
        <span
          className={`text-[7px] font-black uppercase tracking-tight animate-pulse ${isGold ? 'text-amber-500' : 'text-indigo-400'}`}
        >
          Clicca qui
        </span>
      </div>

      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
    </button>
  );
};
