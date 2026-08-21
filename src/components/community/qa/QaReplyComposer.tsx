import { Loader2, Send, X } from 'lucide-react';
import type { CommunityReply } from '../../../types/index';
import { QaAuthGate } from './QaAuthGate';

interface QaReplyComposerProps {
  qaEnabled: boolean;
  isGuest: boolean;
  isOwner: boolean;
  showComposer: boolean;
  canComposeRoot: boolean;
  replyParentId: string | null;
  replyTarget: CommunityReply | null;
  replyText: string;
  isPostingReply: boolean;
  pausedTitle: string;
  pausedBody: string;
  onRequireAuth: () => void;
  onClearReplyTarget: () => void;
  onReplyTextChange: (value: string) => void;
  onSubmit: () => void;
}

export const QaReplyComposer = ({
  qaEnabled,
  isGuest,
  isOwner,
  showComposer,
  canComposeRoot,
  replyParentId,
  replyTarget,
  replyText,
  isPostingReply,
  pausedTitle,
  pausedBody,
  onRequireAuth,
  onClearReplyTarget,
  onReplyTextChange,
  onSubmit,
}: QaReplyComposerProps) => (
  <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
    {!qaEnabled ? (
      <p className="text-xs text-amber-200/90 font-bold">
        {pausedTitle}
        {' — '}
        {pausedBody}
      </p>
    ) : isGuest ? (
      <QaAuthGate
        message="Per rispondere a questa discussione è necessario autenticarsi. Accedi o registrati per continuare."
        onRequireAuth={onRequireAuth}
      />
    ) : isOwner && replyParentId === null ? (
      <p className="text-xs text-slate-400 leading-relaxed">
        Non puoi rispondere direttamente alla tua domanda. Usa «Rispondi» sotto una risposta
        ricevuta per continuare la discussione.
      </p>
    ) : null}

    {showComposer && (
      <div className="space-y-2">
        {replyTarget ? (
          <div className="flex items-start gap-2 rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-3 py-2">
            <p className="flex-1 text-[11px] text-indigo-200 leading-relaxed min-w-0">
              Rispondi a <span className="font-bold text-white">{replyTarget.authorName}</span>
              {replyTarget.text.trim() ? (
                <>
                  : <span className="text-slate-400 line-clamp-2">«{replyTarget.text.trim()}»</span>
                </>
              ) : null}
            </p>
            <button
              type="button"
              onClick={onClearReplyTarget}
              aria-label="Annulla destinatario della risposta"
              className="shrink-0 min-h-10 min-w-10 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <X className="w-4 h-4" aria-hidden />
            </button>
          </div>
        ) : canComposeRoot ? (
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Rispondi alla domanda
          </p>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-2">
          <label className="sr-only" htmlFor="qa-reply-input">
            {replyTarget
              ? `Rispondi a ${replyTarget.authorName}`
              : 'Scrivi una risposta alla domanda'}
          </label>
          <textarea
            id="qa-reply-input"
            value={replyText}
            onChange={(e) => onReplyTextChange(e.target.value)}
            placeholder={
              replyTarget
                ? `Scrivi una risposta a ${replyTarget.authorName}...`
                : 'Scrivi una risposta...'
            }
            disabled={isPostingReply}
            rows={2}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none disabled:opacity-50 min-h-11 resize-y"
          />
          <button
            type="button"
            onClick={onSubmit}
            disabled={isPostingReply || !replyText.trim() || (isOwner && replyParentId === null)}
            aria-label="Invia risposta"
            className="w-full sm:w-auto justify-center bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-h-11 font-bold text-xs uppercase"
          >
            {isPostingReply ? (
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
            ) : (
              <Send className="w-5 h-5" aria-hidden />
            )}
            Invia
          </button>
        </div>
      </div>
    )}
  </div>
);
