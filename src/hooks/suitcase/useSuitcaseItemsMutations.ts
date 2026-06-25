import {
  updateSuitcaseItemAsync,
  addSuitcaseItemAsync,
  deleteSuitcaseItemAsync,
  persistSuitcaseItemsFromRuntimeAsync,
  AddSuitcaseItemMetadata,
  UpdateSuitcaseItemDto,
} from '@/services/suitcase/suitcaseItemsService';
import {
  addRejectionAsync
} from '@/services/suitcase/suitcaseRejectionsService';
import {
  updateSuitcaseAsync,
  createSuitcaseAsync
} from '@/services/suitcase/suitcaseCoreService';
import {
  applyStandardSeedToSuitcaseInMemory,
} from '@/services/suitcase/packingSeedService';
import { ensureUiStateForPersist, resolveCategorySetup } from '@/domain/packing/categorySetup';
import {
  checkProfileExistsAsync,
  createEmergencyProfileAsync,
  getAuthUserAsync
} from '@/services/suitcase/suitcaseGuestService';
import {
  appendDraftLocalRejection,
  DRAFT_ITEM_ID_PREFIX,
  DRAFT_SUITCASE_ID_PREFIX,
  getGuestSuitcase,
  isDraftWorkspaceId,
  LEGACY_GUEST_ITEM_ID_PREFIX,
  removeDraftItemFromWorkspace,
  saveGuestSuitcase,
  deleteGuestSuitcase
} from '@/utils/guestSuitcaseHelper';
import { isEphemeralItemId } from '@/utils/runtimeItemId';
import { Suitcase, SuitcaseItem } from '@/types/suitcase';
import { getDraftWorkspaceKind } from '@/utils/suitcaseDomain';
import { deleteSuitcase } from './useSuitcaseCrud';
import { unlinkSuitcase, linkSuitcaseToTrip } from './useSuitcaseLinking';

function getPostgrestErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return undefined;
  }
  const code = Reflect.get(error, 'code');
  return typeof code === 'string' ? code : undefined;
}

const updateDraftWorkspaceItem = (itemId: string, updates: UpdateSuitcaseItemDto) => {
  const draftSc = getGuestSuitcase();
  if (!draftSc?.suitcase_items) return;

  const updatedItems = draftSc.suitcase_items.map((item) =>
    item.id === itemId ? { ...item, ...updates } : item
  );
  saveGuestSuitcase({ ...draftSc, suitcase_items: updatedItems });
};

export const useSuitcaseItemsMutations = () => {
  const updateItem = async (itemId: string, updates: UpdateSuitcaseItemDto) => {
    if (isEphemeralItemId(itemId)) {
      updateDraftWorkspaceItem(itemId, updates);
      return;
    }
    await updateSuitcaseItemAsync(itemId, updates);
  };

  const addItem = async (suitcaseId: string, name: string, category: string, metadata: AddSuitcaseItemMetadata = {}) => {
    if (isDraftWorkspaceId(suitcaseId)) {
      const itemIdPrefix = suitcaseId.startsWith(DRAFT_SUITCASE_ID_PREFIX)
        ? DRAFT_ITEM_ID_PREFIX
        : LEGACY_GUEST_ITEM_ID_PREFIX;

      return {
        id: metadata.id || `${itemIdPrefix}${Date.now()}`,
        suitcase_id: suitcaseId,
        name,
        category,
        is_checked: metadata.is_checked ?? false,
        is_ai_suggestion: metadata.is_ai_suggestion ?? false,
        quantity: metadata.quantity ?? 1,
        ai_suggestion_context: metadata.ai_suggestion_context || null,
        suggested_at: metadata.suggested_at || null,
        accepted_from_ai: metadata.accepted_from_ai ?? false,
      };
    }
    return await addSuitcaseItemAsync(suitcaseId, name, category, metadata);
  };

  const deleteItem = async (itemId: string) => {
    if (isEphemeralItemId(itemId) || itemId.startsWith('temp-')) return;
    await deleteSuitcaseItemAsync(itemId);
  };

  const rejectItem = async (suitcaseId: string, item: { name: string; category: string; id?: string; ai_suggestion_context?: string | null }) => {
    if (isDraftWorkspaceId(suitcaseId)) {
      appendDraftLocalRejection(suitcaseId, item);
      if (item.id && isEphemeralItemId(item.id)) {
        removeDraftItemFromWorkspace(suitcaseId, item.id);
      }
      return;
    }

    try {
      await addRejectionAsync(
        suitcaseId,
        item.name,
        item.category,
        item.ai_suggestion_context || null
      );
    } catch (e) {
      if (getPostgrestErrorCode(e) === '23505') {
        console.warn("[rejectItem] Item already in blacklist, proceeding with deletion.");
      } else {
        console.error("[rejectItem] Critical failure during rejection persistence:", e);
        throw e;
      }
    }

    if (item.id && !item.id.startsWith('temp-')) {
      await deleteItem(item.id);
    }
  };

  const updateSuitcase = async (suitcaseId: string, updates: Partial<Suitcase>) => {
    if (isDraftWorkspaceId(suitcaseId)) {
      const draftSc = getGuestSuitcase();
      if (draftSc && draftSc.id === suitcaseId) {
        saveGuestSuitcase({ ...draftSc, ...updates });
      }
      return;
    }
    await updateSuitcaseAsync(suitcaseId, updates);
  };

  const persistGuestSuitcase = async (
    userId: string,
    itineraryId: string | null = null,
    titleOverride?: string
  ): Promise<Suitcase | null> => {
    const draftSc = getGuestSuitcase();
    if (!draftSc || !isDraftWorkspaceId(draftSc.id)) return null;

    const resolvedTitle = titleOverride?.trim() || draftSc.title;

    try {
      let draftForPersist = draftSc;
      draftForPersist = await applyStandardSeedToSuitcaseInMemory(draftForPersist);
      const normalizedUiState = ensureUiStateForPersist(draftForPersist);
      draftForPersist = { ...draftForPersist, ui_state: normalizedUiState };

      // 0. Verifica attiva del profilo per evitare FK violation silenziose (admin bypass bug)
      const profileCheck = await checkProfileExistsAsync(userId);

      if (!profileCheck) {
        console.warn(`[persistGuestSuitcase] Profilo (public.profiles) mancante per user_id: ${userId}. Avvio auto-provisioning di emergenza...`);
        const user = await getAuthUserAsync();

        if (user) {
          const email = user.email || '';
          const name = user.user_metadata?.full_name || email.split('@')[0] || 'Nuovo Utente';

          await createEmergencyProfileAsync(userId, email, name);
          console.log("[persistGuestSuitcase] ✅ Profilo auto-creato con successo.");
        } else {
          throw new Error("Impossibile sincronizzare la valigia: Sessione auth invalida per recupero profilo.");
        }
      }

      // 1. Promuoviamo la workspace draft → riga suitcases (UUID reale)
      const workspaceKind = getDraftWorkspaceKind(draftForPersist);
      const isUserTemplate = workspaceKind === 'user_template';

      const suitcase = await createSuitcaseAsync(userId, resolvedTitle, draftForPersist.icon, {
        is_user_template: isUserTemplate,
        source_template_id: draftForPersist.source_template_id ?? null,
        custom_categories: draftForPersist.custom_categories,
        ui_state: draftForPersist.ui_state,
      });

      if (!suitcase) {
        throw new Error("[persistGuestSuitcase] Valigia non inserita.");
      }

      // 2. Persistiamo gli item runtime (draft-item-* / guest-item-* → UUID DB)
      let persistedItems = draftForPersist.suitcase_items ?? [];
      if (persistedItems.length > 0) {
        persistedItems = await persistSuitcaseItemsFromRuntimeAsync(suitcase.id, persistedItems);
      }

      // 3. Metadati aggiuntivi creati in editing locale
      const metadataUpdates: Partial<Suitcase> = {};
      if (draftForPersist.custom_categories?.length) {
        metadataUpdates.custom_categories = draftForPersist.custom_categories;
      }
      if (draftForPersist.ui_state && Object.keys(draftForPersist.ui_state).length > 0) {
        metadataUpdates.ui_state = draftForPersist.ui_state;
      }
      if (draftForPersist.source_template_id) {
        metadataUpdates.source_template_id = draftForPersist.source_template_id;
      }
      if (Object.keys(metadataUpdates).length > 0) {
        await updateSuitcaseAsync(suitcase.id, metadataUpdates);
      }

      // 4. Migriamo i rifiuti AI locali → suitcase_rejections sulla valigia persistita
      const localRejections = draftForPersist.local_rejections ?? [];
      for (const rejection of localRejections) {
        try {
          await addRejectionAsync(
            suitcase.id,
            rejection.name,
            rejection.category,
            rejection.ai_suggestion_context ?? null
          );
        } catch (e) {
          if (getPostgrestErrorCode(e) !== '23505') {
            throw e;
          }
        }
      }

      // 5. Colleghiamo all'itinerario solo per valigie operative
      if (itineraryId && workspaceKind === 'suitcase') {
        await linkSuitcaseToTrip(itineraryId, suitcase.id, userId);
      }

      // 6. CLEANUP: rimuoviamo la workspace draft da localStorage
      deleteGuestSuitcase();

      return {
        ...suitcase,
        ...metadataUpdates,
        suitcase_items: persistedItems,
      };
    } catch (e) {
      console.error("Error persisting guest suitcase", e);
      throw e;
    }
  };

  return {
    updateItem,
    addItem,
    deleteItem,
    updateSuitcase,
    persistGuestSuitcase,
    deleteSuitcase,
    unlinkSuitcase,
    linkSuitcaseToTrip,
    rejectItem
  };
};
