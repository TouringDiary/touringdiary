/**
 * Fixture tipizzate per QA/script del catalogo packing (template TD).
 */

import { getDefaultCategorySetupForTdTemplate } from './categorySetup';
import type { CategorySetupMap } from './categorySetupTypes';
import type { Suitcase, SuitcaseUiState } from '@/types/suitcase';
import {
  TEMPLATE_DB_TITLES,
  type PackingTemplateKey,
} from './packingDomainCatalogTypes';

function buildTdTemplateUiState(categorySetup: CategorySetupMap): SuitcaseUiState {
  return {
    hidden_category_ids: [],
    dismissed_category_ids: [],
    category_display_order: [],
    category_setup: categorySetup,
  };
}

export interface TdTemplateSuitcaseFixtureOptions {
  id: string;
  templateKey: PackingTemplateKey;
  icon?: string;
  categorySetup?: CategorySetupMap;
}

/** Crea un Suitcase runtime coerente con il modello TD (user_id null, non user template). */
export function createTdTemplateSuitcaseFixture(
  options: TdTemplateSuitcaseFixtureOptions
): Suitcase {
  const title = TEMPLATE_DB_TITLES[options.templateKey];
  return {
    id: options.id,
    title,
    icon: options.icon ?? (options.templateKey === 'famiglia' ? '👨‍👩‍👧' : '🎒'),
    user_id: null,
    is_user_template: false,
    ui_state: buildTdTemplateUiState(
      options.categorySetup ?? getDefaultCategorySetupForTdTemplate(title)
    ),
    suitcase_items: [],
  };
}

/** Template Famiglia con Bambini e Animali abilitati nel category_setup. */
export function createFamigliaTdTemplateFixture(id = 'fixture-famiglia'): Suitcase {
  const title = TEMPLATE_DB_TITLES.famiglia;
  const setup = getDefaultCategorySetupForTdTemplate(title);
  setup.kids = { enabled: true, seeded: true };
  setup.pets = { enabled: true, seeded: true };
  return createTdTemplateSuitcaseFixture({
    id,
    templateKey: 'famiglia',
    icon: '👨‍👩‍👧',
    categorySetup: setup,
  });
}
