import React from 'react';
import { Lock } from 'lucide-react';

export interface CollaborationLockBannerProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

/** Messaggio informativo per risorsa bloccata (§18.2). */
export const CollaborationLockBanner: React.FC<CollaborationLockBannerProps> = ({
  message,
  onRetry,
  className = '',
}) => (
  <div
    className={`flex items-start gap-2 px-3 py-2 text-sm text-amber-100 bg-amber-500/10 border border-amber-400/30 rounded-lg ${className}`}
    role="status"
    aria-live="polite"
  >
    <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-300" aria-hidden />
    <div className="flex-1 min-w-0">
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 text-xs font-semibold text-amber-200 hover:text-white underline underline-offset-2"
        >
          Riprova modifica
        </button>
      )}
    </div>
  </div>
);
