import { normalizeCategoryName } from '@/domain/packing/packingCategories';
import { Suitcase } from '@/types/suitcase';
import { normalizeItemName } from '@/utils/tagDerivation';

export const checkDuplicateItem = (
  id: string, 
  name: string, 
  category: string, 
  suitcaseId: string | null, 
  activeTabId: string | null,
  userSuitcases: Suitcase[],
  _isUndo = false
) => {
  const targetId = suitcaseId || activeTabId;
  if (!targetId) return true;
  const suitcase = userSuitcases.find(s => s.id === targetId);
  if (!suitcase) return true;
  
  const items = suitcase.suitcase_items || [];
  const targetCategory = normalizeCategoryName(category);
  const normalizedName = normalizeItemName(name);

  return items.some(
    (item) =>
      item.id !== id &&
      normalizeItemName(item.name) === normalizedName &&
      normalizeCategoryName(item.category) === targetCategory
  );
};
