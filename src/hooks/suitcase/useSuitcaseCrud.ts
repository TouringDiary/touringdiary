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
  createGuestSuitcaseObject
} from '@/utils/guestSuitcaseHelper';
import { linkSuitcaseToTrip } from './useSuitcaseLinking';
import { Suitcase, SuitcaseItem } from '@/types/suitcase';

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

      // Fase 1: Creazione link esplicito nella join table
      if (itineraryId && suitcase?.id) {
        await linkSuitcaseToTrip(itineraryId, suitcase.id, userId);
      }

      return suitcase;
    } finally {
      setIsCreating(false);
    }
  };

  return { createSuitcase, isCreating };
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
          source_template_id: suitcaseId
        };

        saveGuestSuitcase(guestSc);
        return guestSc.id;
      }

      const newSuitcaseId = await cloneSuitcaseAsync(suitcaseId, itineraryId, userId, title);

      // Fase 1: Creazione link esplicito nella join table dopo clone
      if (itineraryId && newSuitcaseId) {
        await linkSuitcaseToTrip(itineraryId, newSuitcaseId, userId);
      }

      return newSuitcaseId; // The new suitcase UUID
    } finally {
      setIsCloning(false);
    }
  };

  return { cloneSuitcase, isCloning };
};

export const deleteSuitcase = async (suitcaseId: string) => {
  if (suitcaseId.startsWith('guest-suitcase-')) {
    deleteGuestSuitcase();
    return;
  }

  await deleteSuitcaseAsync(suitcaseId);
};
