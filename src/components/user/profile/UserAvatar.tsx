import React from 'react';
import { User } from 'lucide-react';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-20 h-20 text-2xl',
  xl: 'w-24 h-24 text-3xl',
} as const;

const UPLOADED_AVATAR_PATH = /\/profiles\/[^/]+\/avatar/i;

function isUploadedProfileAvatar(url: string): boolean {
  try {
    return UPLOADED_AVATAR_PATH.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

function isGeneratedPlaceholderAvatar(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === 'ui-avatars.com';
  } catch {
    return true;
  }
}

function hasCustomAvatar(avatarUrl?: string | null): boolean {
  if (!avatarUrl?.trim()) return false;
  if (isUploadedProfileAvatar(avatarUrl)) return true;
  return !isGeneratedPlaceholderAvatar(avatarUrl);
}

function avatarAltText(name: string): string {
  const trimmed = name?.trim();
  return trimmed ? `Foto profilo di ${trimmed}` : 'Foto profilo';
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  className = '',
}) => {
  const sizeClass = SIZE_CLASSES[size];
  const initial = (name?.trim().charAt(0) || '?').toUpperCase();

  if (hasCustomAvatar(avatarUrl)) {
    return (
      <img
        src={avatarUrl!}
        alt={avatarAltText(name)}
        className={`rounded-full object-cover bg-slate-800 border border-slate-700 shrink-0 ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white shrink-0 ${sizeClass} ${className}`}
      aria-hidden
    >
      {initial || <User className="w-1/2 h-1/2 text-slate-400" />}
    </div>
  );
};
