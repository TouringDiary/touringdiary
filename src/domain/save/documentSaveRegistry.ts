import type { RegisteredDocumentSaveController } from '@/domain/save/documentSaveTypes';

const controllers = new Map<string, RegisteredDocumentSaveController>();

export function registerDocumentSaveController(
  id: string,
  controller: RegisteredDocumentSaveController,
): () => void {
  controllers.set(id, controller);
  return () => controllers.delete(id);
}

export function getDocumentSaveController(id: string) {
  return controllers.get(id);
}
