import React, { useCallback, useEffect, useState } from 'react';
import { Bookmark, Loader2 } from 'lucide-react';
import {
  isUserFavorite,
  toggleUserFavorite,
  type UserFavoriteEntityKind,
} from '@/services/myspace/userFavoritesService';
import { showGlobalAlert } from '@/services/ui/toastService';

interface Props {
  userId: string | null | undefined;
  entityKind: UserFavoriteEntityKind;
  entityId: string;
  /** Se guest: callback login invece del toggle. */
  onRequireAuth?: () => void;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Marcatore Preferito canonico — Segnalibro (DOC 35 §7).
 */
export const FavoriteBookmarkButton: React.FC<Props> = ({
  userId,
  entityKind,
  entityId,
  onRequireAuth,
  className = '',
  size = 'md',
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(Boolean(userId));
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    if (!userId || !entityId) {
      setIsFavorite(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const fav = await isUserFavorite(userId, entityKind, entityId);
      setIsFavorite(fav);
    } finally {
      setLoading(false);
    }
  }, [userId, entityKind, entityId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) {
      onRequireAuth?.();
      return;
    }
    setBusy(true);
    try {
      const result = await toggleUserFavorite(userId, entityKind, entityId);
      if (!result.ok) {
        showGlobalAlert('Non è stato possibile aggiornare i preferiti.');
        return;
      }
      setIsFavorite(result.isFavorite);
    } finally {
      setBusy(false);
    }
  };

  const iconClass = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <button
      type="button"
      onClick={(e) => void handleClick(e)}
      disabled={busy || loading}
      className={`inline-flex items-center justify-center rounded-lg border transition-colors disabled:opacity-50 ${
        isFavorite
          ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
          : 'border-slate-700 bg-slate-900/80 text-slate-400 hover:text-amber-200 hover:border-amber-500/30'
      } ${size === 'sm' ? 'p-1.5' : 'p-2'} ${className}`}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
      title={isFavorite ? 'Nei preferiti' : 'Aggiungi ai preferiti'}
      data-testid={`favorite-bookmark-${entityKind}`}
    >
      {busy || loading ? (
        <Loader2 className={`${iconClass} animate-spin`} />
      ) : (
        <Bookmark className={`${iconClass} ${isFavorite ? 'fill-current' : ''}`} aria-hidden />
      )}
    </button>
  );
};
