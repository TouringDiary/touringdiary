import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';
import type { User } from '@/types/users';
import {
  ProfileIdentityFields,
} from '@/components/user/profile/ProfileIdentityFields';
import { validateUsernameForSubmit } from '@/services/profileService';
import {
  updateProfileAvatarUrl,
  updateProfileSlug,
  uploadProfileAvatar,
} from '@/services/profileService';
import { mapProfileToUser } from '@/services/userService';
import { supabase } from '@/services/supabaseClient';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { CloseButton } from '@/components/ui/controls/CloseButton';

interface SetUsernameModalProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
  onComplete: (user: User) => void;
  mandatory?: boolean;
}

export const SetUsernameModal: React.FC<SetUsernameModalProps> = ({
  isOpen,
  user,
  onClose,
  onComplete,
  mandatory = true,
}) => {
  const [username, setUsername] = useState(user.slug ?? '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setUsername(user.slug ?? '');
    setAvatarFile(null);
    setAvatarPreview(user.avatar ?? null);
    setError(null);
  }, [isOpen, user.slug, user.avatar]);

  useEffect(() => {
    if (!avatarFile) return;
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  useGlobalModalEscape(isOpen, mandatory ? () => {} : onClose);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const validationError = await validateUsernameForSubmit(username, user.id);
      if (validationError) {
        setError(validationError);
        return;
      }

      const slugResult = await updateProfileSlug(user.id, username);
      if (!slugResult.success) {
        setError(slugResult.error ?? 'Errore durante il salvataggio del Nome utente.');
        return;
      }

      let avatarUrl = user.avatar;
      if (avatarFile) {
        const uploaded = await uploadProfileAvatar(user.id, avatarFile);
        if (!uploaded) {
          setError('Caricamento foto non riuscito. Riprova.');
          return;
        }
        const avatarResult = await updateProfileAvatarUrl(user.id, uploaded);
        if (!avatarResult.success) {
          setError(avatarResult.error ?? 'Errore durante il salvataggio della foto.');
          return;
        }
        avatarUrl = uploaded;
      }

      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError || !profile) {
        onComplete({ ...user, slug: slugResult.slug, avatar: avatarUrl });
        return;
      }

      onComplete(mapProfileToUser(profile));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="td-modal-overlay flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in pointer-events-auto"
      style={{ zIndex: Z_OVERLAY }}
    >
      <div
        className="relative w-full max-w-md bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl p-8 pointer-events-auto animate-in zoom-in-95"
        style={{ zIndex: Z_MODAL }}
        onClick={(e) => e.stopPropagation()}
      >
        {!mandatory && (
          <CloseButton onClose={onClose} position="absolute" variant="primary" />
        )}

        <h3 className="text-xl font-bold text-white mb-1">Scegli il tuo Nome utente</h3>
        <p className="text-sm text-slate-400 mb-6">
          Il Nome utente è obbligatorio per collaborare, invitare altri viaggiatori e farti trovare
          nell&apos;app.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <ProfileIdentityFields
            displayName={user.name}
            username={username}
            onUsernameChange={setUsername}
            avatarPreviewUrl={avatarPreview}
            onAvatarFileChange={setAvatarFile}
            excludeUserId={user.id}
            avatarRecommended
          />

          {error && (
            <p className="text-xs text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            Salva e continua
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};
