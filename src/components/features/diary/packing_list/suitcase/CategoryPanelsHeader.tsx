import React from 'react';
import type { DisplayCategory } from '@/domain/packing/categorySetup';
import { OptionalCategoriesPanel } from './OptionalCategoriesPanel';
import { HiddenCategoriesPanel } from './HiddenCategoriesPanel';
import { SuitcaseToolbarProgressBox } from './SuitcaseToolbarProgressBox';

type CategoryPanelsHeaderProps = {
  availableOptionalCategories: DisplayCategory[];
  hiddenCategoriesList: DisplayCategory[];
  readOnly: boolean;
  onActivateOptional: (categoryId: string) => void | Promise<void>;
  onRestoreHidden: (categoryId: string) => void;
  onRestoreAllHidden: () => void;
  progress: {
    checked: number;
    total: number;
    percentage: number;
  };
};

/**
 * Pannelli categorie opzionali / nascoste (+ progress desktop).
 * Mobile e desktop restano due layout distinti (stesso comportamento di prima).
 */
export const CategoryPanelsHeader: React.FC<CategoryPanelsHeaderProps> = ({
  availableOptionalCategories,
  hiddenCategoriesList,
  readOnly,
  onActivateOptional,
  onRestoreHidden,
  onRestoreAllHidden,
  progress,
}) => (
  <>
    {/* Mobile (<md): pannelli sempre in cima allo scroll; non sticky. */}
    <div className="grid grid-cols-1 gap-3 md:hidden">
      <OptionalCategoriesPanel
        categories={availableOptionalCategories}
        onActivate={onActivateOptional}
        readOnly={readOnly}
      />
      <HiddenCategoriesPanel
        categories={hiddenCategoriesList}
        onRestore={onRestoreHidden}
        onRestoreAll={onRestoreAllHidden}
        readOnly={readOnly}
      />
    </div>

    <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 items-stretch">
      <OptionalCategoriesPanel
        categories={availableOptionalCategories}
        onActivate={onActivateOptional}
        readOnly={readOnly}
      />
      <HiddenCategoriesPanel
        categories={hiddenCategoriesList}
        onRestore={onRestoreHidden}
        onRestoreAll={onRestoreAllHidden}
        readOnly={readOnly}
      />
      <SuitcaseToolbarProgressBox
        checkedCount={progress.checked}
        totalCount={progress.total}
        progressPerc={progress.percentage}
        variant="panels"
      />
    </div>
  </>
);
