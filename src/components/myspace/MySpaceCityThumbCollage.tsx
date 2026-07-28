import React from 'react';
import { Map } from 'lucide-react';
import type { CitySummary } from '@/types';
import { cityHeaderImageUrl } from '@/myspace/resolveCityPresentation';

const MAX_VISIBLE = 4;

interface Props {
  cities: CitySummary[];
  className?: string;
}

function ThumbCell({
  city,
  overflowLabel,
}: {
  city: CitySummary;
  overflowLabel?: string;
}) {
  const url = cityHeaderImageUrl(city);
  return (
    <span className="relative block min-w-0 min-h-0 w-full h-full overflow-hidden bg-slate-800">
      {url ? (
        <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center">
          <Map className="w-3.5 h-3.5 text-slate-600" aria-hidden />
        </span>
      )}
      {overflowLabel ? (
        <span className="absolute inset-0 flex items-center justify-center bg-slate-950/65 text-[10px] sm:text-[11px] font-black text-white tracking-tight">
          {overflowLabel}
        </span>
      ) : null}
    </span>
  );
}

/**
 * Collage foto header città entro un contenitore a dimensione fissa (catalogo MySpace).
 * 1 → full; 2 → 1×2; 3 → grande + due; 4 → 2×2; 5+ → prime 4 con +N sull’ultima.
 */
export const MySpaceCityThumbCollage: React.FC<Props> = ({ cities, className = '' }) => {
  if (cities.length === 0) {
    return (
      <span className={`flex items-center justify-center bg-slate-800 ${className}`}>
        <Map className="w-5 h-5 text-slate-600" aria-hidden />
      </span>
    );
  }

  const overflow = Math.max(0, cities.length - MAX_VISIBLE);
  const visible = cities.slice(0, MAX_VISIBLE);
  const mosaicClass = `w-full h-full gap-px bg-slate-700/80 ${className}`;

  if (visible.length === 1) {
    return (
      <span className={`block w-full h-full ${className}`}>
        <ThumbCell city={visible[0]} />
      </span>
    );
  }

  if (visible.length === 2) {
    return (
      <span className={`grid grid-cols-2 grid-rows-1 ${mosaicClass}`}>
        <ThumbCell city={visible[0]} />
        <ThumbCell
          city={visible[1]}
          overflowLabel={overflow > 0 ? `+${overflow}` : undefined}
        />
      </span>
    );
  }

  if (visible.length === 3) {
    return (
      <span className={`grid grid-cols-2 grid-rows-2 ${mosaicClass}`}>
        <span className="row-span-2 min-w-0 min-h-0 h-full">
          <ThumbCell city={visible[0]} />
        </span>
        <ThumbCell city={visible[1]} />
        <ThumbCell
          city={visible[2]}
          overflowLabel={overflow > 0 ? `+${overflow}` : undefined}
        />
      </span>
    );
  }

  // 4 (o 4 visibili con overflow sulle successive)
  return (
    <span className={`grid grid-cols-2 grid-rows-2 ${mosaicClass}`}>
      <ThumbCell city={visible[0]} />
      <ThumbCell city={visible[1]} />
      <ThumbCell city={visible[2]} />
      <ThumbCell
        city={visible[3]}
        overflowLabel={overflow > 0 ? `+${overflow}` : undefined}
      />
    </span>
  );
};
