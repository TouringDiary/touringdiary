import { Bookmark, Loader2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
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
  /**
   * Tooltip opzionale quando l’entità è già nei preferiti.
   * Se omesso, resta il default legacy «Nei preferiti» (POI, guide, TO, shop, …).
   * Passarlo solo per wording specifico di superficie (es. «Città preferita» su card/header città).
   */
  titleWhenFavorite?: string;
  /** Notifica il parent dopo un toggle riuscito (es. filtro Preferiti sulla lista City). */
  onFavoriteChange?: (isFavorite: boolean) => void;
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
  titleWhenFavorite,
  onFavoriteChange,
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(Boolean(userId));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!userId || !entityId) {
      setIsFavorite(false);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    void (async () => {
      try {
        const fav = await isUserFavorite(userId, entityKind, entityId);
        if (!cancelled) {
          setIsFavorite(fav);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, entityKind, entityId]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!userId) {
      onRequireAuth?.();
      return;
    }
    const requestUserId = userId;
    const requestKind = entityKind;
    const requestEntityId = entityId;
    setBusy(true);
    try {
      const result = await toggleUserFavorite(requestUserId, requestKind, requestEntityId);
      if (!result.ok) {
        showGlobalAlert('Non è stato possibile aggiornare i preferiti.');
        return;
      }
      if (requestUserId === userId && requestKind === entityKind && requestEntityId === entityId) {
        setIsFavorite(result.isFavorite);
        onFavoriteChange?.(result.isFavorite);
      }
    } finally {
      if (requestUserId === userId && requestKind === entityKind && requestEntityId === entityId) {
        setBusy(false);
      }
    }
  };

  const iconClass = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <button
      type="button"
      onClick={(e) => void handleClick(e)}
      disabled={busy || loading}
      className={`inline-flex items-center justify-center rounded-lg border transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 ${
        isFavorite
          ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
          : 'border-slate-700 bg-slate-900/80 text-slate-400 hover:text-amber-200 hover:border-amber-500/30'
      } ${size === 'sm' ? 'p-1.5 min-h-11 min-w-11' : 'p-2 min-h-11 min-w-11'} ${className}`}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
      title={isFavorite ? (titleWhenFavorite ?? 'Nei preferiti') : 'Aggiungi ai preferiti'}
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
