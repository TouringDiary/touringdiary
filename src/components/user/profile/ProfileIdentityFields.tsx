import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AtSign, Camera, Loader2 } from 'lucide-react';
import { normalizeUsernameToSlug, validateUsernameFormat } from '@/domain/profile/username';
import {
  checkUsernameAvailability,
  USERNAME_TAKEN_MESSAGE,
  USERNAME_CHECK_NETWORK_MESSAGE,
  USERNAME_CHECK_TECHNICAL_MESSAGE,
} from '@/services/profileService';
import { UserAvatar } from './UserAvatar';

interface ProfileIdentityFieldsProps {
  displayName: string;
  username: string;
  onUsernameChange: (value: string) => void;
  avatarPreviewUrl?: string | null;
  onAvatarFileChange: (file: File | null) => void;
  excludeUserId?: string;
  showAvatar?: boolean;
  avatarRecommended?: boolean;
  usernameDisabled?: boolean;
}

export const ProfileIdentityFields: React.FC<ProfileIdentityFieldsProps> = ({
  displayName,
  username,
  onUsernameChange,
  avatarPreviewUrl,
  onAvatarFileChange,
  excludeUserId,
  showAvatar = true,
  avatarRecommended = false,
  usernameDisabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const availabilityRequestId = useRef(0);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const checkAvailability = useCallback(
    async (value: string) => {
      const formatError = validateUsernameFormat(value);
      if (formatError) {
        setUsernameError(formatError);
        setUsernameAvailable(null);
        return false;
      }

      const requestId = ++availabilityRequestId.current;
      setCheckingUsername(true);
      setUsernameError(null);

      try {
        const result = await checkUsernameAvailability(value, excludeUserId);
        if (requestId !== availabilityRequestId.current) {
          return false;
        }

        if (result.status === 'available') {
          setUsernameAvailable(true);
          return true;
        }

        setUsernameAvailable(null);
        if (result.status === 'taken') {
          setUsernameError(USERNAME_TAKEN_MESSAGE);
        } else {
          setUsernameError(
            result.kind === 'network'
              ? USERNAME_CHECK_NETWORK_MESSAGE
              : USERNAME_CHECK_TECHNICAL_MESSAGE
          );
        }
        return false;
      } finally {
        if (requestId === availabilityRequestId.current) {
          setCheckingUsername(false);
        }
      }
    },
    [excludeUserId]
  );

  useEffect(() => {
    if (!username.trim() || usernameDisabled) {
      availabilityRequestId.current += 1;
      setUsernameError(null);
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }

    const timer = setTimeout(() => {
      void checkAvailability(username);
    }, 400);

    return () => {
      clearTimeout(timer);
      availabilityRequestId.current += 1;
    };
  }, [username, usernameDisabled, checkAvailability]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onAvatarFileChange(file);
  };

  const slugPreview = normalizeUsernameToSlug(username);

  return (
    <div className="space-y-4">
      {showAvatar && (
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative group"
            aria-label="Carica foto profilo"
          >
            <UserAvatar name={displayName} avatarUrl={avatarPreviewUrl} size="xl" />
            <span className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="text-[10px] text-slate-500 text-center">
            {avatarRecommended
              ? 'Carica una foto — fortemente consigliato'
              : 'Foto profilo (opzionale)'}
          </p>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
          <AtSign className="w-3 h-3" /> Nome utente
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          disabled={usernameDisabled}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-4 text-white text-sm focus:border-amber-500 outline-none disabled:opacity-60"
          placeholder="mario.rossi"
          autoComplete="username"
          required
        />
        {slugPreview && (
          <p className="text-[10px] text-slate-500 ml-1">
            URL profilo: /{slugPreview}/dashboard/profilo
          </p>
        )}
        <div className="flex items-center gap-2 min-h-[1rem] ml-1">
          {checkingUsername && (
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Verifica disponibilità…
            </span>
          )}
          {!checkingUsername && usernameAvailable === true && (
            <span className="text-[10px] text-emerald-400">Nome utente disponibile</span>
          )}
          {usernameError && (
            <span className="text-[10px] text-red-400">{usernameError}</span>
          )}
        </div>
      </div>
    </div>
  );
};
