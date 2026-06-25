import React from 'react';
import { SUITCASE_TOOLBAR_GROUP_DIVIDER_CLASS } from './SuitcaseUtils';

interface SuitcaseToolbarGroupProps {
  /** Solo accessibilità — nessuna etichetta visibile. */
  label: string;
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
  showDividerBefore?: boolean;
  showDividerAfter?: boolean;
}

export const SuitcaseToolbarGroup: React.FC<SuitcaseToolbarGroupProps> = ({
  label,
  children,
  className = '',
  align = 'center',
  showDividerBefore = false,
  showDividerAfter = false,
}) => {
  const alignClass =
    align === 'start'
      ? 'justify-self-start'
      : align === 'end'
        ? 'justify-self-end'
        : 'justify-self-center';

  return (
    <div
      className={`flex items-center min-w-0 shrink-0 overflow-visible ${alignClass} ${className}`}
      role="group"
      aria-label={label}
    >
      {showDividerBefore && (
        <div className={SUITCASE_TOOLBAR_GROUP_DIVIDER_CLASS} aria-hidden />
      )}
      <div className="flex items-center gap-1 min-w-0">{children}</div>
      {showDividerAfter && (
        <div className={SUITCASE_TOOLBAR_GROUP_DIVIDER_CLASS} aria-hidden />
      )}
    </div>
  );
};
