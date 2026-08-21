import { Loader2 } from 'lucide-react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_LOCAL_OVERLAY } from '@/constants/zIndex';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { supabase } from '@/services/supabaseClient';
import { getUserById } from '@/services/userService';
import type { CommunityPost } from '../../../types/index';
import { splitDisplayName } from './qaForumShared';

type AuthorDetailState = {
  firstName: string;
  lastName: string;
  registrationDate: string | null;
  loading: boolean;
};

export type QaAuthorDetailDialogHandle = {
  open: (post: CommunityPost, trigger: HTMLElement | null) => void;
};

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
}

export const QaAuthorDetailDialog = forwardRef<QaAuthorDetailDialogHandle>(
  function QaAuthorDetailDialog(_props, ref) {
    const [authorDetail, setAuthorDetail] = useState<AuthorDetailState | null>(null);
    const authorDetailRequestRef = useRef(0);
    const authorDialogRef = useRef<HTMLDivElement | null>(null);
    const authorTriggerRef = useRef<HTMLElement | null>(null);

    const closeAuthorDetail = useCallback(() => {
      authorDetailRequestRef.current += 1;
      const trigger = authorTriggerRef.current;
      authorTriggerRef.current = null;
      setAuthorDetail(null);
      queueMicrotask(() => {
        trigger?.focus();
      });
    }, []);

    const openAuthorDetail = useCallback(
      async (post: CommunityPost, trigger: HTMLElement | null) => {
        const requestId = ++authorDetailRequestRef.current;
        authorTriggerRef.current = trigger;
        const fromCache = getUserById(post.authorId);
        if (fromCache) {
          if (requestId !== authorDetailRequestRef.current) return;
          const split = splitDisplayName(fromCache.name || post.authorName);
          setAuthorDetail({
            firstName: split.firstName,
            lastName: split.lastName,
            registrationDate: fromCache.registrationDate || null,
            loading: false,
          });
          return;
        }

        const fallback = splitDisplayName(post.authorName);
        setAuthorDetail({
          firstName: fallback.firstName,
          lastName: fallback.lastName,
          registrationDate: null,
          loading: true,
        });

        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('name, created_at')
            .eq('id', post.authorId)
            .maybeSingle();
          if (requestId !== authorDetailRequestRef.current) return;
          if (error || !data) {
            setAuthorDetail({
              firstName: fallback.firstName,
              lastName: fallback.lastName,
              registrationDate: null,
              loading: false,
            });
            return;
          }
          const split = splitDisplayName(data.name || post.authorName);
          setAuthorDetail({
            firstName: split.firstName,
            lastName: split.lastName,
            registrationDate: data.created_at || null,
            loading: false,
          });
        } catch {
          if (requestId !== authorDetailRequestRef.current) return;
          setAuthorDetail({
            firstName: fallback.firstName,
            lastName: fallback.lastName,
            registrationDate: null,
            loading: false,
          });
        }
      },
      [],
    );

    useImperativeHandle(ref, () => ({ open: openAuthorDetail }), [openAuthorDetail]);

    useEffect(() => {
      return () => {
        authorDetailRequestRef.current += 1;
      };
    }, []);

    useGlobalModalEscape(authorDetail !== null, closeAuthorDetail);

    useEffect(() => {
      if (!authorDetail) return;
      const dialog = authorDialogRef.current;
      const focusRaf = requestAnimationFrame(() => {
        dialog?.focus();
      });

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Tab' || !dialog) return;
        const focusable = getFocusableElements(dialog);
        if (focusable.length === 0) {
          event.preventDefault();
          dialog.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        if (event.shiftKey && (active === first || active === dialog)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      };

      dialog?.addEventListener('keydown', handleKeyDown);
      return () => {
        cancelAnimationFrame(focusRaf);
        dialog?.removeEventListener('keydown', handleKeyDown);
      };
    }, [authorDetail]);

    if (!authorDetail) return null;

    return (
      <div
        className="absolute inset-0 flex items-center justify-center bg-black/60 p-4"
        style={{ zIndex: Z_LOCAL_OVERLAY }}
        role="presentation"
      >
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full cursor-default border-0 bg-transparent p-0"
          onClick={closeAuthorDetail}
        />
        <div
          ref={authorDialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="qa-author-detail-title"
          tabIndex={-1}
          className="relative w-full max-w-sm max-h-[min(90dvh,32rem)] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
        >
          <CloseButton
            onClose={closeAuthorDetail}
            variant="primary"
            position="absolute"
            withEscape={false}
            className="top-3 right-3 z-local-overlay"
          />
          <div className="pr-12 mb-4">
            <h3 id="qa-author-detail-title" className="text-lg font-bold text-white">
              Dettaglio utente
            </h3>
          </div>
          {authorDetail.loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" aria-hidden />
            </div>
          ) : (
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Nome
                </dt>
                <dd className="text-white font-semibold">{authorDetail.firstName}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Cognome
                </dt>
                <dd className="text-white font-semibold">{authorDetail.lastName}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Data di iscrizione
                </dt>
                <dd className="text-white font-semibold">
                  {authorDetail.registrationDate
                    ? new Date(authorDetail.registrationDate).toLocaleDateString()
                    : 'Non disponibile'}
                </dd>
              </div>
            </dl>
          )}
        </div>
      </div>
    );
  },
);
