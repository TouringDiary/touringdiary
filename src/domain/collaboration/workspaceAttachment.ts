export interface WorkspaceAttachment {
  id: string;
  workspaceId: string;
  uploadedBy: string;
  fileName: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface WorkspaceAttachmentWithUploader extends WorkspaceAttachment {
  uploaderName: string;
}
