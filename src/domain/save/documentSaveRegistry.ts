import type { DocumentSaveController } from '@/domain/save/documentSaveTypes';

const controllers = new Map<string, DocumentSaveController & { getPhase?: () => DocumentSaveController['phase'] }>();

export function registerDocumentSaveController(
  id: string,
  controller: DocumentSaveController
): () => void {
  controllers.set(id, controller);
  return () => controllers.delete(id);
}

export function getDocumentSaveController(id: string) {
  return controllers.get(id);
}
