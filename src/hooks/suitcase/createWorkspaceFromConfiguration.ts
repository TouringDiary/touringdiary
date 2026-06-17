import { createSuitcaseAsync } from '@/services/suitcase/suitcaseCoreService';
import {
  applyStandardSeedToSuitcaseInMemory,
  seedStandardItemsOnSuitcaseAsync,
} from '@/services/suitcase/packingSeedService';
import type { CategorySetupMap } from '@/domain/packing/categorySetupTypes';
import {
  createDraftWorkspaceObject,
  createGuestSuitcaseObject,
  saveGuestSuitcase,
} from '@/utils/guestSuitcaseHelper';
import { DraftWorkspaceKind, Suitcase, SuitcaseCategory, SuitcaseUiState } from '@/types/suitcase';

export interface CreateWorkspaceFromConfigurationParams {
  userId: string;
  title: string;
  icon: string;
  workspaceKind: DraftWorkspaceKind;
  categorySetup: CategorySetupMap;
  customCategories: SuitcaseCategory[];
  /** Persiste direttamente su DB (dashboard) invece di draft localStorage. */
  persistToDatabase?: boolean;
}

/**
 * Crea valigia/template con category_setup scelto e seed condizionato (enabled && seeded).
 */
export async function createWorkspaceFromConfiguration(
  params: CreateWorkspaceFromConfigurationParams
): Promise<Suitcase> {
  const {
    userId,
    title,
    icon,
    workspaceKind,
    categorySetup,
    customCategories,
    persistToDatabase = false,
  } = params;

  const isGuest = userId === 'guest' || !userId;
  const uiState: SuitcaseUiState = {
    hidden_category_ids: [],
    category_setup: categorySetup,
  };

  if (persistToDatabase && !isGuest) {
    const suitcase = await createSuitcaseAsync(userId, title, icon, {
      is_user_template: workspaceKind === 'user_template',
      custom_categories: customCategories,
      ui_state: uiState,
    });

    if (!suitcase?.id) {
      throw new Error('[createWorkspaceFromConfiguration] Creazione entità non riuscita.');
    }

    await seedStandardItemsOnSuitcaseAsync(suitcase.id, categorySetup);
    const seeded = await applyStandardSeedToSuitcaseInMemory({
      ...suitcase,
      custom_categories: customCategories,
      ui_state: uiState,
      suitcase_items: [],
    });

    return {
      ...seeded,
      custom_categories: customCategories,
      ui_state: uiState,
      is_user_template: workspaceKind === 'user_template',
      workspace_kind: workspaceKind,
    };
  }

  const factoryOptions = {
    ui_state: uiState,
    custom_categories: customCategories,
    workspace_kind: workspaceKind,
  };

  let suitcase: Suitcase;
  if (isGuest) {
    suitcase = createGuestSuitcaseObject(title, icon, [], factoryOptions);
  } else {
    suitcase = createDraftWorkspaceObject(userId, title, icon, [], workspaceKind, factoryOptions);
  }

  suitcase = await applyStandardSeedToSuitcaseInMemory(suitcase);
  saveGuestSuitcase(suitcase);
  return suitcase;
}
