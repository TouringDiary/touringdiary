import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FileUp, Loader2, Paperclip, Trash2 } from 'lucide-react';
import { Z_MODAL_NESTED } from '@/constants/zIndex';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import type { User } from '@/types/users';
import type { WorkspaceAttachmentWithUploader } from '@/domain/collaboration/workspaceAttachment';
import {
  deleteWorkspaceAttachment,
  listWorkspaceAttachments,
  uploadWorkspaceAttachment,
} from '@/services/collaboration/workspaceAttachmentService';

interface Props {
  workspaceId: string;
  user: User;
  isSubmitting?: boolean;
}

export const WorkspaceAttachmentsSection: React.FC<Props> = ({
  workspaceId,
  user,
  isSubmitting: parentSubmitting = false,
}) => {
  const [attachments, setAttachments] = useState<WorkspaceAttachmentWithUploader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkspaceAttachmentWithUploader | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setAttachments(await listWorkspaceAttachments(workspaceId));
    } catch (loadError) {
      console.error('[WorkspaceAttachmentsSection] refresh:', loadError);
      setError('Impossibile caricare gli allegati.');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleUpload = async (file: File) => {
    if (parentSubmitting || isDeleting) return;
    setIsUploading(true);
    setError(null);
    const result = await uploadWorkspaceAttachment(workspaceId, user.id, file);
    setIsUploading(false);
    if (result.success === false) {
      setError(result.error);
      return;
    }
    await refresh();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting || parentSubmitting) return;
    setIsDeleting(true);
    setError(null);
    try {
      const result = await deleteWorkspaceAttachment(workspaceId, user.id, deleteTarget.id);
      if (result.success === false) {
        setError(result.error);
        return;
      }
      setDeleteTarget(null);
      await refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  const busy = parentSubmitting || isUploading || isDeleting;

  return (
    <section className="space-y-3">
      <DeleteConfirmationModal
        isOpen={deleteTarget !== null}
        onClose={() => { if (!isDeleting) setDeleteTarget(null); }}
        onConfirm={() => { void handleConfirmDelete(); }}
        title="Eliminare allegato?"
        message={
          deleteTarget
            ? `Stai per eliminare "${deleteTarget.fileName}" dal workspace.`
            : ''
        }
        isDeleting={isDeleting}
        zIndex={Z_MODAL_NESTED}
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-slate-400" aria-hidden />
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Allegati</h4>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileUp className="w-3.5 h-3.5" />}
          Carica
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.gif"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleUpload(file);
            e.target.value = '';
          }}
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {isLoading ? (
        <p className="text-xs text-slate-500 flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" aria-hidden />
          Caricamento allegati...
        </p>
      ) : attachments.length === 0 ? (
        <p className="text-xs text-slate-500">Nessun allegato nel workspace.</p>
      ) : (
        <ul className="space-y-2">
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-slate-800 bg-slate-900/40"
            >
              <div className="min-w-0">
                <p className="text-sm text-white truncate">{attachment.fileName}</p>
                <p className="text-[10px] text-slate-500">
                  {attachment.uploaderName} · {(attachment.sizeBytes / 1024).toFixed(0)} KB
                </p>
              </div>
              {attachment.uploadedBy === user.id && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => { if (!busy) setDeleteTarget(attachment); }}
                  className="text-slate-400 hover:text-red-400 p-1 disabled:opacity-50"
                  aria-label="Elimina allegato"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
