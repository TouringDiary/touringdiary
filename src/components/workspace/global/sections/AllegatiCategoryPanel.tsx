import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, FileUp, Loader2, Trash2 } from 'lucide-react';
import { Z_MODAL_NESTED } from '@/constants/zIndex';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import type { User } from '@/types/users';
import type {
  WorkspaceAttachmentCategory,
  WorkspaceAttachmentWithUploader,
} from '@/domain/collaboration/workspaceAttachment';
import {
  deleteWorkspaceAttachment,
  getWorkspaceAttachmentPublicUrl,
  listWorkspaceAttachments,
  uploadWorkspaceAttachment,
} from '@/services/collaboration/workspaceAttachmentService';
import { workspaceAttachmentAcceptAttribute } from '@/utils/fileValidation';
import { WORKSPACE_ATTACHMENT_CATEGORY_LABELS } from '../globalWorkspacePresentation';

interface Props {
  workspaceId: string;
  workspaceOwnerId: string;
  category: WorkspaceAttachmentCategory;
  user: User;
  isOwner: boolean;
}

export const AllegatiCategoryPanel: React.FC<Props> = ({
  workspaceId,
  workspaceOwnerId,
  category,
  user,
  isOwner,
}) => {
  const [attachments, setAttachments] = useState<WorkspaceAttachmentWithUploader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkspaceAttachmentWithUploader | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const label = WORKSPACE_ATTACHMENT_CATEGORY_LABELS[category];
  const acceptAttribute = workspaceAttachmentAcceptAttribute();

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setAttachments(await listWorkspaceAttachments(workspaceId, category));
    } catch {
      setError('Impossibile caricare gli allegati.');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, category]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleUpload = async (file: File) => {
    if (isDeleting) return;
    setIsUploading(true);
    setError(null);
    const result = await uploadWorkspaceAttachment(
      workspaceId,
      workspaceOwnerId,
      user.id,
      file,
      category,
    );
    setIsUploading(false);
    if (result.success === false) {
      setError(result.error);
      return;
    }
    await refresh();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    setError(null);
    try {
      const result = await deleteWorkspaceAttachment(workspaceId, user.id, deleteTarget.id);
      if (!result.success) {
        setError(result.error ?? 'Impossibile eliminare l\'allegato.');
        return;
      }
      setDeleteTarget(null);
      await refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async (attachment: WorkspaceAttachmentWithUploader) => {
    const url = await getWorkspaceAttachmentPublicUrl(attachment.storagePath);
    if (!url) {
      setError('Download non disponibile.');
      return;
    }
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (!opened) {
      setError('Il browser ha bloccato l\'apertura del file. Consenti i popup per questo sito e riprova.');
    }
  };

  const busy = isUploading || isDeleting;
  const canDelete = (attachment: WorkspaceAttachmentWithUploader) =>
    attachment.uploadedBy === user.id || isOwner;

  return (
    <section className="space-y-3 min-h-0">
      <DeleteConfirmationModal
        isOpen={deleteTarget !== null}
        onClose={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        title="Eliminare allegato?"
        message={
          deleteTarget
            ? `Stai per eliminare "${deleteTarget.fileName}" dalla categoria ${label}.`
            : ''
        }
        isDeleting={isDeleting}
        zIndex={Z_MODAL_NESTED}
      />

      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</h3>
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
          accept={acceptAttribute}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleUpload(file);
            e.target.value = '';
          }}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="text-xs text-slate-500 flex items-center gap-2 py-4">
          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
          Caricamento...
        </p>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-slate-500 py-4">Nessun file in {label}.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2.5 min-h-[5.5rem]"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{attachment.fileName}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {attachment.uploaderName} · {(attachment.sizeBytes / 1024).toFixed(0)} KB
                </p>
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <button
                  type="button"
                  onClick={() => void handleDownload(attachment)}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[10px] font-bold uppercase text-slate-300"
                >
                  <Download className="w-3 h-3" />
                  Apri
                </button>
                {canDelete(attachment) && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (!busy) setDeleteTarget(attachment);
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                    aria-label="Elimina allegato"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
