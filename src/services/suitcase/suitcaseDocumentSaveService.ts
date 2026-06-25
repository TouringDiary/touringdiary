import { Suitcase, SuitcaseItem } from '@/types/suitcase';
import { isDraftWorkspaceId } from '@/utils/guestSuitcaseHelper';
import { isEphemeralItemId } from '@/utils/runtimeItemId';
import {
  updateSuitcaseAsync,
  createSuitcaseAsync,
} from '@/services/suitcase/suitcaseCoreService';
import {
  addSuitcaseItemAsync,
  deleteSuitcaseItemAsync,
  updateSuitcaseItemAsync,
  persistSuitcaseItemsFromRuntimeAsync,
} from '@/services/suitcase/suitcaseItemsService';
import { ensureUiStateForPersist } from '@/domain/packing/categorySetup';
import { getDraftWorkspaceKind } from '@/utils/suitcaseDomain';
import { snapshotsEqual } from '@/domain/save/documentSnapshot';

export interface SaveSuitcaseDocumentOptions {
  userId: string;
  name?: string;
  asCopy?: boolean;
  documentId: string | null;
}

const listContentKey = (values?: string[] | null) =>
  (values ?? []).slice().sort().join('\0');

const itemContentKey = (item: SuitcaseItem) =>
  `${item.name}|${item.category}|${item.quantity ?? 1}|${!!item.is_checked}|${!!item.is_ai_suggestion}|${item.accepted_from_ai ?? ''}|${listContentKey(item.affiliate_tags)}|${listContentKey(item.poi_triggers)}`;

/**
 * Creates a new persisted suitcase from the current editor snapshot.
 * Used for first save, Save As, and any copy that must reflect dirty local state.
 */
async function createSuitcaseFromSnapshot(
  snapshot: Suitcase,
  userId: string,
  title: string
): Promise<{ id: string }> {
  const workspaceKind = getDraftWorkspaceKind(snapshot);
  const isUserTemplate = workspaceKind === 'user_template';
  const normalizedUi = ensureUiStateForPersist(snapshot);

  const created = await createSuitcaseAsync(userId, title, snapshot.icon, {
    is_user_template: isUserTemplate,
    source_template_id: snapshot.source_template_id ?? null,
    custom_categories: snapshot.custom_categories,
    ui_state: normalizedUi,
  });

  if (!created?.id) {
    throw new Error('Impossibile creare la valigia.');
  }

  const items = snapshot.suitcase_items ?? [];
  if (items.length > 0) {
    await persistSuitcaseItemsFromRuntimeAsync(created.id, items);
  }

  return { id: created.id };
}

/**
 * Updates suitcase metadata only. Item-level sync is handled by syncSuitcaseItemsDiff.
 */
async function updateSuitcaseMetadataFromSnapshot(
  suitcaseId: string,
  snapshot: Suitcase,
  title: string
): Promise<void> {
  const normalizedUi = ensureUiStateForPersist(snapshot);
  await updateSuitcaseAsync(suitcaseId, {
    title,
    icon: snapshot.icon,
    custom_categories: snapshot.custom_categories,
    ui_state: normalizedUi,
    source_template_id: snapshot.source_template_id,
  });
}

/**
 * Persists a full suitcase document snapshot (first save, update, or save-as).
 * Save As always materializes the current editor snapshot — never clones stale DB state.
 * Item diff for existing documents runs via syncSuitcaseItemsDiff in the save hook.
 */
export async function saveSuitcaseDocumentAsync(
  snapshot: Suitcase,
  options: SaveSuitcaseDocumentOptions
): Promise<{ id: string }> {
  const { userId, name, asCopy, documentId } = options;

  const resolvedTitle = name?.trim() || snapshot.title?.trim();
  if (!resolvedTitle) {
    throw new Error('Inserisci un nome per la valigia.');
  }

  if (asCopy) {
    return createSuitcaseFromSnapshot(snapshot, userId, resolvedTitle);
  }

  if (!documentId || isDraftWorkspaceId(documentId)) {
    return createSuitcaseFromSnapshot(snapshot, userId, resolvedTitle);
  }

  await updateSuitcaseMetadataFromSnapshot(documentId, snapshot, resolvedTitle);
  return { id: documentId };
}

/**
 * Full item-level diff: creates, updates, and deletes items to match the current snapshot.
 */
export async function syncSuitcaseItemsDiff(
  suitcaseId: string,
  currentItems: SuitcaseItem[],
  baselineItems: SuitcaseItem[]
): Promise<SuitcaseItem[]> {
  const baselineById = new Map(baselineItems.filter((i) => i.id).map((i) => [i.id, i]));
  const currentById = new Map(
    currentItems.filter((i) => i.id && !isEphemeralItemId(i.id)).map((i) => [i.id, i])
  );

  for (const base of baselineItems) {
    if (!base.id || isEphemeralItemId(base.id)) continue;
    if (!currentById.has(base.id)) {
      await deleteSuitcaseItemAsync(base.id);
    }
  }

  const resultItems: SuitcaseItem[] = [];

  for (const item of currentItems) {
    if (!item.id || isEphemeralItemId(item.id)) {
      const created = await addSuitcaseItemAsync(suitcaseId, item.name, item.category, {
        is_checked: item.is_checked,
        is_ai_suggestion: item.is_ai_suggestion,
        quantity: item.quantity,
        ai_suggestion_context: item.ai_suggestion_context,
        suggested_at: item.suggested_at,
        accepted_from_ai: item.accepted_from_ai,
      });
      resultItems.push(created);
      continue;
    }

    const base = baselineById.get(item.id);
    if (!base || itemContentKey(base) !== itemContentKey(item)) {
      await updateSuitcaseItemAsync(item.id, {
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        is_checked: item.is_checked,
        is_ai_suggestion: item.is_ai_suggestion,
        accepted_from_ai: item.accepted_from_ai,
        affiliate_tags: item.affiliate_tags,
        poi_triggers: item.poi_triggers,
      });
    }
    resultItems.push(item);
  }

  return resultItems;
}

export function suitcaseSnapshotsEqual(a: Suitcase, b: Suitcase): boolean {
  return snapshotsEqual(
    {
      title: a.title,
      icon: a.icon,
      custom_categories: a.custom_categories,
      ui_state: a.ui_state,
      items: (a.suitcase_items ?? []).map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        is_checked: i.is_checked,
        is_ai_suggestion: i.is_ai_suggestion,
        accepted_from_ai: i.accepted_from_ai,
      })),
    },
    {
      title: b.title,
      icon: b.icon,
      custom_categories: b.custom_categories,
      ui_state: b.ui_state,
      items: (b.suitcase_items ?? []).map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        is_checked: i.is_checked,
        is_ai_suggestion: i.is_ai_suggestion,
        accepted_from_ai: i.accepted_from_ai,
      })),
    }
  );
}
