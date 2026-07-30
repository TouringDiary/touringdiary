import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { useMyWorldStyles } from '@/hooks/useMyWorldStyles';
import { MYWORLD_STYLE_KEYS } from '@/data/system/myWorldSettingsCatalog';

export interface MySpaceSectionHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  /** Override classe icona (accent per root). */
  iconClassName?: string;
}

/**
 * Header sezione MySpace — identità MyWorld Style (riferimento Valigia).
 * SoT tipografia/chrome: sezione Design System `myworld`.
 */
export const MySpaceSectionHeader: React.FC<MySpaceSectionHeaderProps> = ({
  icon: Icon,
  title,
  description,
  actions,
  className = '',
  iconClassName,
}) => {
  const barClass = useMyWorldStyles(MYWORLD_STYLE_KEYS.sectionHeaderBar);
  const titleClass = useMyWorldStyles(MYWORLD_STYLE_KEYS.sectionTitle);
  const iconClass = useMyWorldStyles(MYWORLD_STYLE_KEYS.sectionIcon);
  const descClass = useMyWorldStyles(MYWORLD_STYLE_KEYS.sectionDescription);

  return (
    <header className={`${barClass} ${className}`.trim()}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className={`${titleClass} flex items-center gap-2`}>
            <Icon className={iconClassName ?? iconClass} aria-hidden />
            {title}
          </h2>
          {description ? <p className={descClass}>{description}</p> : null}
        </div>
        {actions ? <div className="shrink-0 flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
};
