/** Tipi per ui_state.category_setup — dominio categorie valigia. */

export interface CategorySetupEntry {
  enabled: boolean;
  seeded: boolean;
}

export type CategorySetupMap = Record<string, CategorySetupEntry>;
