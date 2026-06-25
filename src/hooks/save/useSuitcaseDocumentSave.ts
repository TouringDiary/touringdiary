import { useCallback, useEffect, useRef } from 'react';
import { Suitcase, SuitcaseItem } from '@/types/suitcase';
import { useDocumentSaveController } from '@/hooks/save/useDocumentSaveController';
import { AUTOSAVE_PREF_KEYS } from '@/domain/save/documentSaveTypes';
import { isDraftWorkspaceId } from '@/utils/guestSuitcaseHelper';
import { registerDocumentExitGate, controllerToExitRegistration } from '@/focus/exitGate/documentExitRegistry';
import { registerDocumentSaveController } from '@/domain/save/documentSaveRegistry';
import {
  saveSuitcaseDocumentAsync,
  syncSuitcaseItemsDiff,
} from '@/services/suitcase/suitcaseDocumentSaveService';
import { snapshotsEqual } from '@/domain/save/documentSnapshot';

interface UseSuitcaseDocumentSaveOptions {
  activeSuitcase: Suitcase | null | undefined;
  isGuest: boolean;
  userId: string | null;
  onDocumentSaved: (suitcase: Suitcase) => void;
  onSaveAsNavigate: (newId: string) => void;
  enabled?: boolean;
}

/**
 * Content-only snapshot for dirty detection.
 * Excludes server-managed fields (updated_at, created_at) and item IDs
 * (which change from ephemeral to real after first save) to prevent
 * false dirty states after fetchUserSuitcases refreshes the suitcase.
 * Items are sorted by category+name so that DB ordering differences
 * don't trigger false positives.
 */
function toContentSnapshot(sc: Suitcase) {
  return {
    title: sc.title ?? null,
    icon: sc.icon ?? null,
    custom_categories: sc.custom_categories ?? null,
    ui_state: sc.ui_state ?? null,
    items: (sc.suitcase_items ?? [])
      .map((i: SuitcaseItem) => ({
        name: i.name,
        category: i.category,
        quantity: i.quantity ?? null,
        is_checked: i.is_checked ?? false,
        is_ai_suggestion: i.is_ai_suggestion ?? false,
        accepted_from_ai: i.accepted_from_ai ?? null,
      }))
      .sort((a, b) =>
        `${a.category}|${a.name}`.localeCompare(`${b.category}|${b.name}`)
      ),
  };
}

export function useSuitcaseDocumentSave({
  activeSuitcase,
  isGuest,
  userId,
  onDocumentSaved,
  onSaveAsNavigate,
  enabled = true,
}: UseSuitcaseDocumentSaveOptions) {
  const suitcaseRef = useRef(activeSuitcase);
  const baselineSuitcaseRef = useRef<Suitcase | null>(null);
  suitcaseRef.current = activeSuitcase;

  const isNeverSaved = useCallback(() => {
    const sc = suitcaseRef.current;
    if (!sc?.id) return true;
    return isDraftWorkspaceId(sc.id);
  }, []);

  const persist = useCallback(
    async (
      _snapshot: ReturnType<typeof toContentSnapshot>,
      options: { name?: string; asCopy?: boolean; documentId: string | null }
    ) => {
      if (!userId) throw new Error('Utente non autenticato');

      const sc = suitcaseRef.current!;
      const wasPersisted =
        !!options.documentId && !isDraftWorkspaceId(options.documentId);

      const result = await saveSuitcaseDocumentAsync(sc, {
        userId,
        name: options.name,
        asCopy: options.asCopy,
        documentId: options.documentId,
      });

      if (options.asCopy) {
        onSaveAsNavigate(result.id);
        return result;
      }

      let savedSuitcase: Suitcase;
      if (wasPersisted && baselineSuitcaseRef.current) {
        const syncedItems = await syncSuitcaseItemsDiff(
          result.id,
          sc.suitcase_items ?? [],
          baselineSuitcaseRef.current.suitcase_items ?? []
        );
        savedSuitcase = { ...sc, id: result.id, suitcase_items: syncedItems };
      } else {
        savedSuitcase = { ...sc, id: result.id };
      }

      // Suitcase is a plain JSON-serializable runtime model (strings, numbers,
      // booleans, arrays, plain objects). No Date instances, class instances,
      // or functions — structuredClone is safe for baseline copies.
      baselineSuitcaseRef.current = structuredClone(savedSuitcase);
      onDocumentSaved(savedSuitcase);
      return result;
    },
    [onDocumentSaved, onSaveAsNavigate, userId]
  );

  const controller = useDocumentSaveController({
    autosavePreferenceKey: AUTOSAVE_PREF_KEYS.suitcase,
    isGuest,
    isNeverSaved,
    // Content-only snapshot: excludes updated_at/created_at and item IDs.
    // This prevents computePhaseFromSnapshot from returning 'dirty' after
    // fetchUserSuitcases refreshes server-side metadata or after ephemeral
    // item IDs are replaced with real DB IDs on first save.
    getSnapshot: () => toContentSnapshot(suitcaseRef.current!),
    getDocumentId: () => suitcaseRef.current?.id ?? null,
    persist,
    enabled: enabled && !!activeSuitcase && !isGuest,
  });

  // Set baseline when switching to a different suitcase.
  // Suitcase is JSON-serializable — see structuredClone note in persist().
  useEffect(() => {
    if (!activeSuitcase || isGuest) return;
    if (baselineSuitcaseRef.current?.id !== activeSuitcase.id) {
      baselineSuitcaseRef.current = structuredClone(activeSuitcase);
      controller.setBaseline(toContentSnapshot(activeSuitcase));
    }
  }, [activeSuitcase?.id, activeSuitcase, controller, isGuest]);

  // Dirty detection: use content comparison to ignore server metadata and ID changes
  useEffect(() => {
    if (!activeSuitcase || isGuest) return;
    if (
      baselineSuitcaseRef.current &&
      baselineSuitcaseRef.current.id === activeSuitcase.id &&
      !snapshotsEqual(
        toContentSnapshot(baselineSuitcaseRef.current),
        toContentSnapshot(activeSuitcase)
      )
    ) {
      controller.markDirty();
    }
  }, [activeSuitcase, controller, isGuest]);

  useEffect(() => {
    if (!enabled || !activeSuitcase) return;
    const gateId = `suitcase-${activeSuitcase.id}`;
    const unregister = registerDocumentExitGate(
      controllerToExitRegistration(
        gateId,
        activeSuitcase.title || 'Valigia',
        controller
      )
    );
    const unregisterSave = registerDocumentSaveController('suitcase-active', controller);
    return () => {
      unregister();
      unregisterSave();
    };
  }, [activeSuitcase?.id, activeSuitcase?.title, controller, enabled, activeSuitcase]);

  const notifyLocalMutation = useCallback(() => {
    controller.markDirty();
  }, [controller]);

  const onBaselineSynced = useCallback((sc: Suitcase) => {
    baselineSuitcaseRef.current = structuredClone(sc);
    controller.setBaseline(toContentSnapshot(sc));
  }, [controller]);

  return {
    ...controller,
    notifyLocalMutation,
    onBaselineSynced,
    isSuitcaseNeverSaved: isNeverSaved,
  };
}
