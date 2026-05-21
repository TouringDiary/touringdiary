import React from 'react';

/**
 * Default emoji icons for item categories (local mapping).
 * Used only for items, NOT for suitcase templates.
 */
export const ITEM_CATEGORY_ICONS_MAP: Record<string, string> = {
  'Abbigliamento': '👕',
  'Accessori': '🧢',
  'Documenti': '📄',
  'Elettronica': '🔌',
  'Extra': '🎒',
  'Igiene': '🧴'
};

interface TemplateCategoryIconProps {
  template?: any;
  category?: string;
  className?: string;
}

/**
 * Universal component to render an emoji icon.
 * If template is passed, it uses template.icon or fallback 🎒.
 * If category is passed, it uses ITEM_CATEGORY_ICONS_MAP for item categories.
 */
export const TemplateCategoryIcon: React.FC<TemplateCategoryIconProps> = ({ template, category, className }) => {
  // Case 1: Item Category (local map)
  if (category) {
    return <span className={className}>{ITEM_CATEGORY_ICONS_MAP[category] || '📦'}</span>;
  }

  // Case 2: Suitcase Template (from DB emoji)
  // Logic from suitcases.icon column
  return <span className={className}>{template?.icon || '🎒'}</span>;
};

/**
 * Specific component for rendering item category icons.
 * Useful for the TemplatePreview grid.
 */
export const ItemCategoryIcon: React.FC<{ category: string; className?: string }> = ({ category, className }) => {
  return <span className={className}>{ITEM_CATEGORY_ICONS_MAP[category] || '📦'}</span>;
};
