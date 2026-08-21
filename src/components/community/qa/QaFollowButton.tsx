import { Bell, Check, Loader2 } from 'lucide-react';

/**
 * Contratto discriminato: guest e member non condividono stati follow impossibili.
 * La mutation resta nel parent; qui solo presentazione + disabled.
 */
type QaFollowButtonProps =
  | {
      viewer: 'guest';
      /** Q&A sospeso: non attivabile. */
      paused: boolean;
      onActivate: () => void;
    }
  | {
      viewer: 'member';
      following: boolean;
      /** Mutation follow in corso. */
      busy: boolean;
      /** Q&A sospeso. */
      paused: boolean;
      onToggle: () => void;
    };

/**
 * Ingombro fisso = stato più largo («Seguito ✓»).
 * Sizer invisibile + label assoluta → nessun layout shift.
 * Colore attivo: indigo pieno (stesso linguaggio dei tab/filtri Q&A).
 */
export const QaFollowButton = (props: QaFollowButtonProps) => {
  const isGuest = props.viewer === 'guest';
  const isFollowing = props.viewer === 'member' && props.following;
  const showLoading = props.viewer === 'member' && props.busy;
  const disabled = props.viewer === 'guest' ? props.paused : props.paused || props.busy;
  const onClick = props.viewer === 'guest' ? props.onActivate : props.onToggle;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={props.viewer === 'member' ? props.following : undefined}
      aria-label={
        isGuest
          ? 'Accedi per seguire la discussione'
          : isFollowing
            ? 'Smetti di seguire'
            : 'Segui discussione'
      }
      className={`relative inline-flex items-center justify-center rounded-lg text-xs font-bold uppercase border transition-colors min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-50 ${
        isFollowing
          ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-900/30'
          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-indigo-500/50 hover:text-white'
      }`}
    >
      <span className="invisible flex items-center gap-1.5 px-3 py-2" aria-hidden>
        <Bell className="w-3.5 h-3.5 shrink-0" />
        <span>Seguito</span>
        <Check className="w-3.5 h-3.5 shrink-0" />
      </span>
      <span className="absolute inset-0 flex items-center justify-center gap-1.5 px-3 py-2">
        {showLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
        ) : (
          <Bell className="w-3.5 h-3.5 shrink-0" aria-hidden />
        )}
        {isFollowing ? (
          <>
            <span>Seguito</span>
            <Check className="w-3.5 h-3.5 shrink-0" aria-hidden />
          </>
        ) : (
          <span>Segui</span>
        )}
      </span>
    </button>
  );
};
