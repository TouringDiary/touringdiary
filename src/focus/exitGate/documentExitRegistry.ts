import type { DocumentSaveController, DocumentSavePhase } from '@/domain/save/documentSaveTypes';
import { phaseBlocksExit } from '@/domain/save/documentSaveTypes';

export type ExitIntent =
  | 'close_panel'
  | 'overlay_click'
  | 'escape'
  | 'switch_diary'
  | 'switch_suitcase'
  | 'logout'
  | 'navigation'
  | 'browser_back'
  | 'page_unload';

export interface DocumentExitRegistration {
  id: string;
  label: string;
  getPhase: () => DocumentSavePhase;
  flush: () => Promise<string | null>;
  awaitInFlight: () => Promise<void>;
  isGuest: boolean;
}

const registrations = new Map<string, DocumentExitRegistration>();

export function registerDocumentExitGate(entry: DocumentExitRegistration): () => void {
  registrations.set(entry.id, entry);
  return () => {
    registrations.delete(entry.id);
  };
}

export function getDocumentExitGates(): DocumentExitRegistration[] {
  return Array.from(registrations.values());
}

export function getBlockingExitGates(): DocumentExitRegistration[] {
  return getDocumentExitGates().filter((g) => phaseBlocksExit(g.getPhase()));
}

export function controllerToExitRegistration(
  id: string,
  label: string,
  controller: Pick<
    DocumentSaveController,
    'phase' | 'flush' | 'awaitInFlight' | 'isGuest'
  > & { getPhase?: () => DocumentSavePhase }
): DocumentExitRegistration {
  return {
    id,
    label,
    getPhase: controller.getPhase ?? (() => controller.phase),
    flush: controller.flush,
    awaitInFlight: controller.awaitInFlight,
    isGuest: controller.isGuest,
  };
}
