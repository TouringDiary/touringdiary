import type {
  WorkspaceAttachment,
  WorkspaceAttachmentCategory,
  WorkspaceAttachmentWithUploader,
} from '@/domain/collaboration/workspaceAttachment';
import type { StorageLimitsConfig } from '@/domain/storage/storageLimits';
import { supabase } from '@/services/supabaseClient';
import { isWorkspaceOwner } from './workspaceService';
import { validateWorkspaceAttachmentFile } from '@/utils/fileValidation';
import { recordCollaborationDomainEvent } from './domainEventService';
import { getCachedSetting, SETTINGS_KEYS } from '@/services/settingsService';

const WORKSPACE_ATTACHMENTS_BUCKET = 'workspace-attachments';

function parseStorageLimits(raw: unknown): StorageLimitsConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const maxAttachmentBytes = Number(record.maxAttachmentBytes);
  const maxAccountBytes = Number(record.maxAccountBytes);
  const maxWorkspaceBytes = Number(record.maxWorkspaceBytes);
  if (![maxAttachmentBytes, maxAccountBytes, maxWorkspaceBytes].every((n) => Number.isFinite(n) && n > 0)) {
    return null;
  }
  return { maxAttachmentBytes, maxAccountBytes, maxWorkspaceBytes };
}

export function resolveStorageLimitsConfig(): StorageLimitsConfig | null {
  return parseStorageLimits(getCachedSetting(SETTINGS_KEYS.STORAGE_LIMITS));
}

function mapAttachmentRow(row: {
  id: string;
  workspace_id: string;
  uploaded_by: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  category?: WorkspaceAttachmentCategory | null;
  created_at: string;
}): WorkspaceAttachment {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    uploadedBy: row.uploaded_by,
    fileName: row.file_name,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    category: row.category ?? 'misc',
    createdAt: row.created_at,
  };
}

async function getWorkspaceAttachmentBytes(workspaceId: string): Promise<number> {
  const { data, error } = await supabase
    .from('workspace_attachments')
    .select('size_bytes.sum()')
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (error) {
    console.error('[workspaceAttachmentService] getWorkspaceAttachmentBytes:', error.message);
    return 0;
  }

  const aggregate = data as { sum?: number | null } | null;
  return Number(aggregate?.sum ?? 0);
}

export async function listWorkspaceAttachments(
  workspaceId: string,
  category?: WorkspaceAttachmentCategory
): Promise<WorkspaceAttachmentWithUploader[]> {
  let query = supabase
    .from('workspace_attachments')
    .select('*, profiles:uploaded_by(name)')
    .eq('workspace_id', workspaceId);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('[workspaceAttachmentService] listWorkspaceAttachments:', error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const profile = row.profiles as { name?: string } | null;
    const base = mapAttachmentRow(row);
    return {
      ...base,
      uploaderName: profile?.name?.trim() || 'Collaboratore',
    };
  });
}

export async function uploadWorkspaceAttachment(
  workspaceId: string,
  workspaceOwnerId: string,
  actorId: string,
  file: File,
  category: WorkspaceAttachmentCategory
): Promise<{ success: true; attachment: WorkspaceAttachment } | { success: false; error: string }> {
  const limits = resolveStorageLimitsConfig();
  if (!limits) {
    return { success: false, error: 'Caricamento allegati non configurato. Contatta l\'amministratore.' };
  }

  if (file.size > limits.maxAttachmentBytes) {
    return { success: false, error: 'Il file supera la dimensione massima consentita.' };
  }

  const validation = await validateWorkspaceAttachmentFile(file);
  if (validation.ok === false) {
    return { success: false, error: validation.error };
  }

  const usedBytes = await getWorkspaceAttachmentBytes(workspaceId);
  if (usedBytes + file.size > limits.maxWorkspaceBytes) {
    return {
      success: false,
      error: 'Spazio allegati del workspace esaurito.',
    };
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${workspaceOwnerId}/${workspaceId}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(WORKSPACE_ATTACHMENTS_BUCKET)
    .upload(storagePath, file, {
      contentType: validation.mimeType,
      upsert: false,
    });

  if (uploadError) {
    console.error('[workspaceAttachmentService] upload:', uploadError.message);
    return { success: false, error: 'Caricamento non riuscito.' };
  }

  const { data, error } = await supabase
    .from('workspace_attachments')
    .insert({
      workspace_id: workspaceId,
      uploaded_by: actorId,
      file_name: file.name,
      storage_path: storagePath,
      mime_type: validation.mimeType,
      size_bytes: file.size,
      category,
    })
    .select('*')
    .single();

  if (error || !data) {
    await supabase.storage.from(WORKSPACE_ATTACHMENTS_BUCKET).remove([storagePath]);
    return { success: false, error: 'Impossibile registrare l\'allegato.' };
  }

  const attachment = mapAttachmentRow(data);
  await recordCollaborationDomainEvent({
    eventType: 'workspace.attachment_added',
    workspaceId,
    summary: `Allegato aggiunto: ${file.name}`,
    payload: { attachmentId: attachment.id, fileName: file.name },
  });

  return { success: true, attachment };
}

export async function deleteWorkspaceAttachment(
  workspaceId: string,
  actorId: string,
  attachmentId: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase
    .from('workspace_attachments')
    .select('*')
    .eq('id', attachmentId)
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (error || !data) {
    return { success: false, error: 'Allegato non trovato.' };
  }

  const isOwner = await isWorkspaceOwner(workspaceId, actorId);
  const canDelete = data.uploaded_by === actorId || isOwner;

  if (!canDelete) {
    return { success: false, error: 'Non puoi eliminare questo allegato.' };
  }

  const fileName = data.file_name as string;

  const { error: deleteError } = await supabase
    .from('workspace_attachments')
    .delete()
    .eq('id', attachmentId);

  if (deleteError) {
    return { success: false, error: 'Impossibile eliminare l\'allegato.' };
  }

  const { error: storageError } = await supabase.storage
    .from(WORKSPACE_ATTACHMENTS_BUCKET)
    .remove([data.storage_path as string]);

  if (storageError) {
    console.error(
      '[workspaceAttachmentService] deleteWorkspaceAttachment storage remove:',
      storageError.message,
      { workspaceId, attachmentId, storagePath: data.storage_path, fileName },
    );
  }

  await recordCollaborationDomainEvent({
    eventType: 'workspace.attachment_removed',
    workspaceId,
    summary: `Allegato rimosso: ${fileName}`,
    payload: { attachmentId, fileName },
  });

  return { success: true };
}

/** URL firmato per download; non assume bucket pubblico. */
export async function getWorkspaceAttachmentPublicUrl(
  storagePath: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(WORKSPACE_ATTACHMENTS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error) {
    console.error('[workspaceAttachmentService] getWorkspaceAttachmentPublicUrl:', error.message);
    return null;
  }

  return data.signedUrl ?? null;
}
