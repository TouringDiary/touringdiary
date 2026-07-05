import React from 'react';
import { Check, type LucideIcon } from 'lucide-react';
import {
  FOUNDATION_HELPER_TEXT_FALLBACK,
  FOUNDATION_SELECTABLE_BADGE_BASE,
  FOUNDATION_SELECTABLE_BADGE_SELECTED,
  FOUNDATION_SELECTABLE_BADGE_UNSELECTED,
  FOUNDATION_SELECTABLE_CARD_BASE,
  FOUNDATION_SELECTABLE_CARD_HEADER_ROW,
  FOUNDATION_SELECTABLE_CARD_SELECTED,
  FOUNDATION_SELECTABLE_CARD_UNSELECTED,
  FOUNDATION_SELECTABLE_CHECK_CLASS,
  FOUNDATION_SELECTABLE_ICON_BOX_BASE,
  FOUNDATION_SELECTABLE_ICON_BOX_SELECTED,
  FOUNDATION_SELECTABLE_ICON_BOX_UNSELECTED,
  FOUNDATION_SELECTABLE_TITLE_FALLBACK,
} from './foundationModalPrototypeStyles';

export interface FoundationSelectableCardProps {
  isSelected: boolean;
  onSelect: () => void;
  icon: LucideIcon;
  title: string;
  description: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

/**
 * Card selezionabile Foundation — linguaggio grafico da AiSuggestionsModal
 * (card "Valuta ed inserisci" in stato selezionato).
 */
export const FoundationSelectableCard: React.FC<FoundationSelectableCardProps> = ({
  isSelected,
  onSelect,
  icon: Icon,
  title,
  description,
  titleClassName = FOUNDATION_SELECTABLE_TITLE_FALLBACK,
  descriptionClassName = FOUNDATION_HELPER_TEXT_FALLBACK,
}) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={isSelected}
    className={`${FOUNDATION_SELECTABLE_CARD_BASE} ${
      isSelected ? FOUNDATION_SELECTABLE_CARD_SELECTED : FOUNDATION_SELECTABLE_CARD_UNSELECTED
    }`}
  >
    <div
      className={`${FOUNDATION_SELECTABLE_BADGE_BASE} ${
        isSelected ? FOUNDATION_SELECTABLE_BADGE_SELECTED : FOUNDATION_SELECTABLE_BADGE_UNSELECTED
      }`}
    >
      {isSelected && <Check className={FOUNDATION_SELECTABLE_CHECK_CLASS} aria-hidden />}
    </div>

    <div className={FOUNDATION_SELECTABLE_CARD_HEADER_ROW}>
      <div
        className={`${FOUNDATION_SELECTABLE_ICON_BOX_BASE} ${
          isSelected
            ? FOUNDATION_SELECTABLE_ICON_BOX_SELECTED
            : FOUNDATION_SELECTABLE_ICON_BOX_UNSELECTED
        }`}
      >
        <Icon className="w-5 h-5" aria-hidden />
      </div>
      <span className={`${titleClassName} ${isSelected ? 'text-white' : 'text-slate-300'}`}>
        {title}
      </span>
    </div>

    <p className={`${descriptionClassName} leading-relaxed font-normal`}>{description}</p>
  </button>
);
