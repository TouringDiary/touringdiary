export type WorkspaceAttachmentCategory =
  | 'documents'
  | 'tickets'
  | 'bookings'
  | 'expenses'
  | 'misc';

export const WORKSPACE_ATTACHMENT_CATEGORIES: WorkspaceAttachmentCategory[] = [
  'documents',
  'tickets',
  'bookings',
  'expenses',
  'misc',
];

export interface WorkspaceAttachment {
  id: string;
  workspaceId: string;
  uploadedBy: string;
  fileName: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  category: WorkspaceAttachmentCategory;
  createdAt: string;
}

export interface WorkspaceAttachmentWithUploader extends WorkspaceAttachment {
  uploaderName: string;
}
