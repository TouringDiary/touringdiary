/**
 * Allegati del Viaggio — Resource (DOC 37 §7).
 * Distinti da Workspace Allegati (`workspace_attachments`).
 */

export type ViaggioAttachmentCategory =
  | 'documents'
  | 'tickets'
  | 'bookings'
  | 'expenses'
  | 'misc';

export const VIAGGIO_ATTACHMENT_CATEGORIES: ViaggioAttachmentCategory[] = [
  'documents',
  'tickets',
  'bookings',
  'expenses',
  'misc',
];

export interface ViaggioAttachment {
  id: string;
  viaggioId: string;
  userId: string;
  fileName: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  category: ViaggioAttachmentCategory;
  createdAt: string;
}
