import { Suitcase } from '@/types/suitcase';
import { normalizeItemName } from '@/utils/tagDerivation';

export const checkDuplicateItem = (
  id: string, 
  name: string, 
  category: string, 
  suitcaseId: string | null, 
  activeTabId: string | null,
  userSuitcases: Suitcase[],
  isUndo = false
) => {
  const targetId = suitcaseId || activeTabId;
  if (!targetId) return true;
  const suitcase = userSuitcases.find(s => s.id === targetId);
  if (!suitcase) return true;
  
  const items = suitcase.suitcase_items || [];

  // Se l'ID è lo stesso stiamo probabilmente cercando di ripristinare proprio quell'item.
  // In caso di Undo, non dobbiamo considerarlo un duplicato di se stesso.
  return items.some(i => 
    (i.id === id && !isUndo) || 
    (i.id !== id && normalizeItemName(i.name) === normalizeItemName(name) && i.category === category)
  );
};
