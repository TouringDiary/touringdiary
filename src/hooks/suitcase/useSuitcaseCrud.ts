import { useState } from 'react';
import {
  createSuitcaseAsync,
  cloneSuitcaseAsync,
  deleteSuitcaseAsync,
  fetchClonedTemplateDetailsAsync
} from '@/services/suitcaseService';
import {
  saveGuestSuitcase,
  deleteGuestSuitcase,
  createGuestSuitcaseObject,
  createDraftWorkspaceObject,
  isDraftWorkspaceId,
  toDraftWorkspaceSeedItems,
} from '@/utils/guestSuitcaseHelper';
import { Suitcase, SuitcaseItem, DraftWorkspaceKind } from '@/types/suitcase';

export const DRAFT_OVERWRITE_NEW_SUITCASE = 'new-suitcase';
export const DRAFT_OVERWRITE_NEW_TEMPLATE = 'new-template';
export const DRAFT_OVERWRITE_SUGGESTED_TEMPLATES = 'suggested-templates';
export const DRAFT_OVERWRITE_SAVE_AS_TEMPLATE = 'save-as-template';

export const useCreateSuitcase = () => {
  const [isCreating, setIsCreating] = useState(false);

  const createSuitcase = async (itineraryId: string | null, userId: string, title = "Valigia", icon = "🎒") => {
    setIsCreating(true);
    try {
      if (userId === 'guest' || !userId) {
        const guestSc = createGuestSuitcaseObject(title, icon);
        saveGuestSuitcase(guestSc);
        return guestSc;
      }

      const suitcase = await createSuitcaseAsync(userId, title, icon);
      return suitcase;
    } finally {
      setIsCreating(false);
    }
  };

  return { createSuitcase, isCreating };
};

/**
 * Crea una workspace temporanea in localStorage (draft-suitcase-*).
 */
export const createDraftWorkspace = (
  userId: string,
  title = 'Valigia',
  icon = '🎒',
  workspaceKind: DraftWorkspaceKind = 'suitcase'
): Suitcase => {
  const draftSc = createDraftWorkspaceObject(userId, title, icon, [], workspaceKind);
  saveGuestSuitcase(draftSc);
  return draftSc;
};

/**
 * Crea una draft workspace popolata da un template (TD o USER) → draft valigia.
 */
export const createDraftWorkspaceFromTemplate = (
  userId: string,
  template: Suitcase,
  title?: string
): Suitcase => {
  let resolvedTitle = title ?? template.title;
  if (resolvedTitle?.startsWith('Template ')) {
    resolvedTitle = resolvedTitle.replace('Template ', 'Valigia ');
  }

  const seedItems = toDraftWorkspaceSeedItems(template.suitcase_items ?? [], {
    is_checked: false,
    is_ai_suggestion: false,
  });

  const draftSc = createDraftWorkspaceObject(
    userId,
    resolvedTitle || 'Valigia',
    template.icon || '🎒',
    seedItems,
    'suitcase'
  );

  const draft: Suitcase = {
    ...draftSc,
    source_template_id: template.id,
    custom_categories: template.custom_categories ?? [],
    ui_state: template.ui_state ?? { hidden_category_ids: [] },
  };

  saveGuestSuitcase(draft);
  return draft;
};

/**
 * Crea draft da valigia/template sorgente con kind esplicito.
 */
export const createDraftWorkspaceFromSuitcase = (
  userId: string,
  source: Suitcase,
  workspaceKind: DraftWorkspaceKind,
  title?: string
): Suitcase => {
  const seedItems = toDraftWorkspaceSeedItems(source.suitcase_items ?? [], {
    is_checked: workspaceKind === 'suitcase' ? false : false,
    is_ai_suggestion: false,
  });

  const resolvedTitle =
    title ??
    (workspaceKind === 'user_template'
      ? `Template ${source.title}`
      : source.title);

  const draftSc = createDraftWorkspaceObject(
    userId,
    resolvedTitle,
    source.icon || '🎒',
    seedItems,
    workspaceKind
  );

  const draft: Suitcase = {
    ...draftSc,
    source_template_id: workspaceKind === 'suitcase' ? source.id : source.source_template_id ?? source.id,
    custom_categories: source.custom_categories ?? [],
    ui_state: source.ui_state ?? { hidden_category_ids: [] },
  };

  saveGuestSuitcase(draft);
  return draft;
};

/**
 * Crea una draft workspace popolata da item merge-deduplicati (Valigia Consigliata).
 */
export const createDraftWorkspaceFromMergedItems = (
  userId: string,
  title: string,
  items: SuitcaseItem[],
  icon = '🎒'
): Suitcase => {
  const seedItems = toDraftWorkspaceSeedItems(items, {
    is_checked: false,
    is_ai_suggestion: false,
  });

  const draftSc = createDraftWorkspaceObject(userId, title, icon, seedItems, 'suitcase');
  saveGuestSuitcase(draftSc);
  return draftSc;
};

export const useCloneSuitcase = () => {
  const [isCloning, setIsCloning] = useState(false);

  const cloneSuitcase = async (
    suitcaseId: string,
    itineraryId: string | null,
    userId: string,
    title?: string
  ) => {
    setIsCloning(true);
    try {
      if (userId === 'guest' || !userId) {
        const template = await fetchClonedTemplateDetailsAsync(suitcaseId);

        const guestScId = `guest-suitcase-${Date.now()}`;
        const items: SuitcaseItem[] = (template?.suitcase_items || []).map((item, i) => ({
          id: `guest-item-${Date.now()}-${i}`,
          suitcase_id: guestScId,
          name: item.name,
          category: item.category,
          quantity: item.quantity || 1,
          is_checked: false
        }));

        const guestSc: Suitcase = {
          id: guestScId,
          title: title || template?.title || 'Template',
          icon: template?.icon || '🎒',
          user_id: 'guest',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          suitcase_items: items,
          custom_categories: [],
          ui_state: { hidden_category_ids: [] },
          source_template_id: suitcaseId,
          workspace_kind: 'suitcase',
        };

        saveGuestSuitcase(guestSc);
        return guestSc.id;
      }

      const newSuitcaseId = await cloneSuitcaseAsync(suitcaseId, userId, title);
      return newSuitcaseId;
    } finally {
      setIsCloning(false);
    }
  };

  return { cloneSuitcase, isCloning };
};

export const deleteSuitcase = async (suitcaseId: string) => {
  if (isDraftWorkspaceId(suitcaseId)) {
    deleteGuestSuitcase();
    return;
  }

  await deleteSuitcaseAsync(suitcaseId);
};
