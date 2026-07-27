import { supabase } from '../supabaseClient';
import type { Database } from '@/types/supabase';
import type {
  ViaggioAttachment,
  ViaggioAttachmentCategory,
} from '@/types/models/ViaggioAttachment';
import { VIAGGIO_ATTACHMENT_CATEGORIES } from '@/types/models/ViaggioAttachment';
import { validateWorkspaceAttachmentFile } from '@/utils/fileValidation';

const VIAGGIO_ATTACHMENTS_BUCKET = 'viaggio-attachments';

type AttachmentRow = Database['public']['Tables']['viaggio_attachments']['Row'];

function isAttachmentCategory(value: string): value is ViaggioAttachmentCategory {
  for (const category of VIAGGIO_ATTACHMENT_CATEGORIES) {
    if (category === value) return true;
  }
  return false;
}

function parseAttachmentCategory(category: string): ViaggioAttachmentCategory {
  if (isAttachmentCategory(category)) return category;
  return 'misc';
}

function mapRow(row: AttachmentRow): ViaggioAttachment {
  return {
    id: row.id,
    viaggioId: row.viaggio_id,
    userId: row.user_id,
    fileName: row.file_name,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes) || 0,
    category: parseAttachmentCategory(row.category),
    createdAt: row.created_at,
  };
}

export async function listViaggioAttachments(viaggioId: string): Promise<ViaggioAttachment[]> {
  const { data, error } = await supabase
    .from('viaggio_attachments')
    .select('*')
    .eq('viaggio_id', viaggioId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[viaggioAttachmentService] listViaggioAttachments:', error.message);
    throw new Error(error.message);
  }
  return (data ?? []).map(mapRow);
}

export async function uploadViaggioAttachment(params: {
  viaggioId: string;
  userId: string;
  file: File;
  category?: ViaggioAttachmentCategory;
}): Promise<ViaggioAttachment> {
  const validation = await validateWorkspaceAttachmentFile(params.file);
  if (validation.ok === false) {
    throw new Error(validation.error);
  }

  const safeName = params.file.name.replace(/[^\w.\-]+/g, '_');
  const storagePath = `${params.userId}/${params.viaggioId}/${crypto.randomUUID()}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(VIAGGIO_ATTACHMENTS_BUCKET)
    .upload(storagePath, params.file, { cacheControl: '3600', upsert: false });

  if (uploadError) {
    console.error('[viaggioAttachmentService] upload:', uploadError.message);
    throw new Error(uploadError.message);
  }

  const { data, error } = await supabase
    .from('viaggio_attachments')
    .insert({
      viaggio_id: params.viaggioId,
      user_id: params.userId,
      file_name: params.file.name,
      storage_path: storagePath,
      mime_type: validation.mimeType || params.file.type,
      size_bytes: params.file.size,
      category: params.category ?? 'misc',
    })
    .select('*')
    .single();

  if (error || !data) {
    await supabase.storage.from(VIAGGIO_ATTACHMENTS_BUCKET).remove([storagePath]);
    console.error('[viaggioAttachmentService] insert:', error?.message);
    throw new Error(error?.message ?? 'Salvataggio allegato non riuscito.');
  }
  return mapRow(data);
}

export async function deleteViaggioAttachment(attachment: ViaggioAttachment): Promise<void> {
  const { error } = await supabase.from('viaggio_attachments').delete().eq('id', attachment.id);
  if (error) {
    console.error('[viaggioAttachmentService] delete:', error.message);
    throw new Error(error.message);
  }
  await supabase.storage.from(VIAGGIO_ATTACHMENTS_BUCKET).remove([attachment.storagePath]);
}

export async function createSignedViaggioAttachmentUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(VIAGGIO_ATTACHMENTS_BUCKET)
    .createSignedUrl(storagePath, 60 * 60);
  if (error) {
    console.error('[viaggioAttachmentService] signedUrl:', error.message);
    return null;
  }
  return data?.signedUrl ?? null;
}
