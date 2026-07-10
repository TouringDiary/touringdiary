import React from 'react';
import { Check } from 'lucide-react';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';

export interface OptionCardProps {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: React.ReactNode;
  icon: React.ReactNode;
  recommended?: boolean;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  selected,
  onSelect,
  title,
  description,
  icon,
  recommended = false,
}) => {
  const isMobile = useMobileDetect();
  const selectableCardBase = useFoundationStyles(FOUNDATION_STYLE_KEYS.selectableCardBase);
  const selectableCardSelected = useFoundationStyles(FOUNDATION_STYLE_KEYS.selectableCardSelected);
  const selectableCardUnselected = useFoundationStyles(FOUNDATION_STYLE_KEYS.selectableCardUnselected);
  const selectableCardHeaderRow = useFoundationStyles(FOUNDATION_STYLE_KEYS.selectableCardHeaderRow);
  const selectableBadgeBase = useFoundationStyles(FOUNDATION_STYLE_KEYS.selectableBadgeBase);
  const selectableBadgeSelected = useFoundationStyles(FOUNDATION_STYLE_KEYS.selectableBadgeSelected);
  const selectableBadgeUnselected = useFoundationStyles(FOUNDATION_STYLE_KEYS.selectableBadgeUnselected);
  const selectableCheckIcon = useFoundationStyles(FOUNDATION_STYLE_KEYS.selectableCheckIcon);
  const selectableIconBoxBase = useFoundationStyles(FOUNDATION_STYLE_KEYS.selectableIconBoxBase);
  const selectableIconBoxSelected = useFoundationStyles(FOUNDATION_STYLE_KEYS.selectableIconBoxSelected);
  const selectableIconBoxUnselected = useFoundationStyles(FOUNDATION_STYLE_KEYS.selectableIconBoxUnselected);
  const selectableCardTitle = useFoundationStyles(FOUNDATION_STYLE_KEYS.selectableCardTitle, isMobile);
  const selectableCardDescription = useFoundationStyles(
    FOUNDATION_STYLE_KEYS.selectableCardDescription,
    isMobile
  );

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`${selectableCardBase} w-full text-left ${
        selected ? selectableCardSelected : selectableCardUnselected
      }`}
    >
      <div
        className={`${selectableBadgeBase} ${
          selected ? selectableBadgeSelected : selectableBadgeUnselected
        }`}
      >
        {selected && <Check className={selectableCheckIcon} aria-hidden />}
      </div>
      <div className="flex w-full flex-1 flex-col justify-center">
        <div className={selectableCardHeaderRow}>
          <div
            className={`${selectableIconBoxBase} ${
              selected ? selectableIconBoxSelected : selectableIconBoxUnselected
            }`}
          >
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`${selectableCardTitle} ${selected ? 'text-white' : 'text-slate-300'}`}>
                {title}
              </span>
              {recommended && (
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  Consigliato
                </span>
              )}
            </div>
            <p className={selectableCardDescription}>{description}</p>
          </div>
        </div>
      </div>
    </button>
  );
};
