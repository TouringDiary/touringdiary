import React from 'react';
import type { CitySummary } from '@/types';
import { MySpaceCityThumbCollage } from './MySpaceCityThumbCollage';

/** Stesse dimensioni del thumb catalogo — non modificare senza allineare le righe. */
export const MY_SPACE_VIAGGIO_CITY_THUMB_BOX =
  'w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-lg overflow-hidden bg-slate-800 border border-slate-700/80';

interface Props {
  cities: CitySummary[];
  busy?: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  'aria-label': string;
  title?: string;
}

/**
 * Bottone thumb città del catalogo — solo presentazione.
 * Le CitySummary sono risolte dal parent orchestratore.
 */
export const MySpaceViaggioCityThumbButton: React.FC<Props> = ({
  cities,
  busy = false,
  onClick,
  'aria-label': ariaLabel,
  title,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={busy}
    className={`${MY_SPACE_VIAGGIO_CITY_THUMB_BOX} disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60`}
    aria-label={ariaLabel}
    title={title}
  >
    <MySpaceCityThumbCollage cities={cities} className="w-full h-full" />
  </button>
);
