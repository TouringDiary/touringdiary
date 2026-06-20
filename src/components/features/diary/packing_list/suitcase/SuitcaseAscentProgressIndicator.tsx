import React, { useMemo } from 'react';

interface SuitcaseAscentProgressIndicatorProps {
  progressPerc: number;
}

const BAR_HEIGHTS = [4, 6, 8, 10, 12];

function interpolateHex(from: string, to: string, t: number): string {
  const parse = (hex: string) => {
    const value = hex.replace('#', '');
    return [
      parseInt(value.slice(0, 2), 16),
      parseInt(value.slice(2, 4), 16),
      parseInt(value.slice(4, 6), 16),
    ];
  };
  const [r1, g1, b1] = parse(from);
  const [r2, g2, b2] = parse(to);
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
  const r = mix(r1, r2);
  const g = mix(g1, g2);
  const b = mix(b1, b2);
  return `rgb(${r}, ${g}, ${b})`;
}

export function getAscentProgressColor(progressPerc: number): string {
  const p = Math.max(0, Math.min(100, progressPerc)) / 100;
  if (p <= 0.5) {
    return interpolateHex('#ef4444', '#eab308', p * 2);
  }
  return interpolateHex('#eab308', '#22c55e', (p - 0.5) * 2);
}

export const SuitcaseAscentProgressIndicator: React.FC<SuitcaseAscentProgressIndicatorProps> = ({
  progressPerc,
}) => {
  const accentColor = useMemo(() => getAscentProgressColor(progressPerc), [progressPerc]);
  const filledBars = (progressPerc / 100) * BAR_HEIGHTS.length;

  return (
    <div
      className="flex items-end justify-center gap-[2px] h-[14px] md:h-[15px] px-0.5 w-full"
      aria-hidden
    >
      {BAR_HEIGHTS.map((height, index) => {
        const fillAmount = Math.max(0, Math.min(1, filledBars - index));
        const isActive = fillAmount > 0;

        return (
          <div
            key={index}
            className="relative w-[5px] md:w-[6px] rounded-t-[2px] bg-slate-500/35 border border-slate-400/25 overflow-hidden transition-all duration-500"
            style={{ height: `${height}px` }}
          >
            <div
              className="absolute inset-x-0 bottom-0 transition-all duration-500 ease-out rounded-t-[1px]"
              style={{
                height: `${fillAmount * 100}%`,
                backgroundColor: isActive ? accentColor : 'transparent',
                boxShadow: isActive ? `0 0 6px ${accentColor}55` : undefined,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
