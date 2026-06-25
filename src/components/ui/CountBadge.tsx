import React from 'react';
import {
  buildCountBadgeClassName,
  formatCompactCount,
  type CountBadgePosition,
  type CountBadgeShape,
  type CountBadgeSize,
  type CountBadgeVariant,
} from '@/utils/countBadge';

export interface CountBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Valore numerico — formattato con limite compatto se `display` non è impostato. */
  count?: number;
  /** Etichetta esplicita (es. "#3", "99+"). Ha priorità su `count`. */
  display?: string;
  /** Soglia massima prima del formato compatto (es. 99 → "99+"). */
  max?: number;
  size?: CountBadgeSize;
  variant?: CountBadgeVariant;
  position?: CountBadgePosition;
  shape?: CountBadgeShape;
  pulse?: boolean;
}

export const CountBadge: React.FC<CountBadgeProps> = ({
  count = 0,
  display,
  max = 99,
  size = 'sm',
  variant = 'rose',
  position = 'inline',
  shape = 'circle',
  pulse = false,
  className = '',
  ...rest
}) => {
  const label = display ?? formatCompactCount(count, max);

  return (
    <span
      className={buildCountBadgeClassName({
        size,
        variant,
        position,
        shape,
        label,
        pulse,
        className,
      })}
      {...rest}
    >
      {label}
    </span>
  );
};
