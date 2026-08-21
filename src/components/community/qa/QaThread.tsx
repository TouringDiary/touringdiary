import { ArrowLeft, Loader2, MapPin, MessageSquare, Pencil } from 'lucide-react';
import { FeatureFlagPausedBanner } from '@/components/platform/FeatureFlagPausedBanner';
import {
  PLATFORM_FEATURE_FLAG_KEYS,
  PLATFORM_MESSAGE_TEMPLATE_KEYS,
} from '@/constants/platformFeatureFlags';
import type { CitySummary, CommunityPost, CommunityReply } from '../../../types/index';
import { QaFollowButton } from './QaFollowButton';
import { QaReplyComposer } from './QaReplyComposer';
import { QaReplyNode } from './QaReplyNode';
import { QA_GENERAL_CITY_LABEL } from './qaForumShared';

interface QaThreadProps {
  post: CommunityPost;
  isGuest: boolean;
  currentUserId: string;
  qaEnabled: boolean;
  isFollowing: boolean;
  followLoading: boolean;
  replyText: string;
  replyParentId: string | null;
  isPostingReply: boolean;
  isEditingQuestion: boolean;
  editText: string;
  editCity: string;
  isSavingEdit: boolean;
  cityManifest: CitySummary[];
  pausedTitle: string;
  pausedBody: string;
  onBack: () => void;
  onToggleFollow: () => void;
  onRequireAuth: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onEditTextChange: (value: string) => void;
  onEditCityChange: (value: string) => void;
  onSaveEdit: () => void;
  onBeginReply: (parentId: string | null) => void;
  onClearReplyTarget: () => void;
  onReplyTextChange: (value: string) => void;
  onSubmitReply: () => void;
}

export const QaThread = ({
  post,
  isGuest,
  currentUserId,
  qaEnabled,
  isFollowing,
  followLoading,
  replyText,
  replyParentId,
  isPostingReply,
  isEditingQuestion,
  editText,
  editCity,
  isSavingEdit,
  cityManifest,
  pausedTitle,
  pausedBody,
  onBack,
  onToggleFollow,
  onRequireAuth,
  onStartEdit,
  onCancelEdit,
  onEditTextChange,
  onEditCityChange,
  onSaveEdit,
  onBeginReply,
  onClearReplyTarget,
  onReplyTextChange,
  onSubmitReply,
}: QaThreadProps) => {
  const isOwner = !isGuest && post.authorId === currentUserId;
  const replies = post.replies || [];
  const childrenByParent = new Map<string | null, CommunityReply[]>();
  for (const reply of replies) {
    const key = reply.parentReplyId ?? null;
    const list = childrenByParent.get(key) ?? [];
    list.push(reply);
    childrenByParent.set(key, list);
  }
  const rootReplies = childrenByParent.get(null) ?? [];

  const replyTarget =
    replyParentId === null ? null : (replies.find((r) => r.id === replyParentId) ?? null);

  const canComposeRoot = qaEnabled && !isGuest && !isOwner;
  const canComposeNested = qaEnabled && !isGuest && replyParentId !== null;
  const showComposer = canComposeRoot || canComposeNested;

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right-4 px-4 md:px-8">
      <FeatureFlagPausedBanner
        flagKey={PLATFORM_FEATURE_FLAG_KEYS.MODERATION_COMMUNITY_POSTS}
        defaultMessageKey={PLATFORM_MESSAGE_TEMPLATE_KEYS.MODERATION_COMMUNITY_POSTS_PAUSED}
        className="mb-3"
      />
      <div className="flex items-center gap-3 sm:gap-4 mb-4 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Torna alla lista"
          className="p-2 min-h-11 min-w-11 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden />
        </button>
        <h3 className="text-lg font-bold text-white flex-1 min-w-0 truncate">Discussione</h3>
        {isGuest ? (
          <QaFollowButton viewer="guest" paused={!qaEnabled} onActivate={onToggleFollow} />
        ) : (
          <QaFollowButton
            viewer="member"
            following={isFollowing}
            busy={followLoading}
            paused={!qaEnabled}
            onToggle={onToggleFollow}
          />
        )}
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-lg">
          <div className="flex justify-between items-start mb-3 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-indigo-600 border border-indigo-500 flex items-center justify-center font-bold text-white shadow-md shrink-0">
                {post.authorName.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-base">{post.authorName}</span>
                  {post.authorRole === 'guide' && (
                    <span className="bg-indigo-900/50 text-indigo-300 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border border-indigo-500/30">
                      Guida
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 flex items-center gap-2 flex-wrap">
                  <span>{new Date(post.date).toLocaleString()}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-indigo-400 font-bold uppercase">
                    <MapPin className="w-3 h-3" aria-hidden /> {post.cityName}
                  </span>
                </div>
              </div>
            </div>
            {isOwner && !isEditingQuestion && (
              <button
                type="button"
                onClick={onStartEdit}
                disabled={!qaEnabled}
                aria-label="Modifica domanda"
                className="shrink-0 p-2 min-h-11 min-w-11 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
              >
                <Pencil className="w-4 h-4" aria-hidden />
              </button>
            )}
          </div>

          {isEditingQuestion ? (
            <div className="space-y-3 mb-4">
              <label className="sr-only" htmlFor="qa-edit-text">
                Testo domanda
              </label>
              <textarea
                id="qa-edit-text"
                value={editText}
                onChange={(e) => onEditTextChange(e.target.value)}
                disabled={isSavingEdit}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white text-sm focus:border-indigo-500 outline-none resize-none min-h-24"
              />
              <div className="relative">
                <label className="sr-only" htmlFor="qa-edit-city">
                  Città domanda
                </label>
                <MapPin
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
                  aria-hidden
                />
                <select
                  id="qa-edit-city"
                  value={editCity}
                  onChange={(e) => onEditCityChange(e.target.value)}
                  disabled={isSavingEdit}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-xs font-bold text-white uppercase tracking-wide focus:border-indigo-500 outline-none min-h-11"
                >
                  <option value="">Seleziona Città...</option>
                  {cityManifest.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="general">{QA_GENERAL_CITY_LABEL}</option>
                </select>
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={onCancelEdit}
                  disabled={isSavingEdit}
                  className="px-4 py-2.5 min-h-11 rounded-lg text-xs font-bold uppercase border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={onSaveEdit}
                  disabled={isSavingEdit || !editText.trim() || !editCity}
                  className="px-4 py-2.5 min-h-11 rounded-lg text-xs font-bold uppercase bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : null}
                  Salva
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-200 text-lg font-medium leading-relaxed mb-4 break-words">
              {post.text}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-800 pt-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500">
              <MessageSquare className="w-4 h-4" aria-hidden />
              {post.repliesCount || replies.length}{' '}
              <span className="hidden sm:inline">Risposte</span>
            </div>
            {canComposeRoot && (
              <button
                type="button"
                onClick={() => onBeginReply(null)}
                aria-label="Rispondi alla domanda"
                className={`min-h-11 px-4 rounded-lg text-xs font-bold uppercase border transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  replyParentId === null
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'border-slate-700 text-indigo-300 hover:border-indigo-500/40'
                }`}
              >
                Rispondi
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {rootReplies.length === 0 ? (
            <p className="text-xs text-slate-500 italic px-1">
              Nessuna risposta ancora.
              {canComposeRoot ? ' Usa «Rispondi» per aprire la discussione.' : null}
            </p>
          ) : (
            rootReplies.map((reply) => (
              <QaReplyNode
                key={reply.id}
                reply={reply}
                depth={0}
                childrenByParent={childrenByParent}
                replyParentId={replyParentId}
                qaEnabled={qaEnabled}
                isGuest={isGuest}
                onBeginReply={onBeginReply}
              />
            ))
          )}
        </div>
      </div>

      <QaReplyComposer
        qaEnabled={qaEnabled}
        isGuest={isGuest}
        isOwner={isOwner}
        showComposer={showComposer}
        canComposeRoot={canComposeRoot}
        replyParentId={replyParentId}
        replyTarget={replyTarget}
        replyText={replyText}
        isPostingReply={isPostingReply}
        pausedTitle={pausedTitle}
        pausedBody={pausedBody}
        onRequireAuth={onRequireAuth}
        onClearReplyTarget={onClearReplyTarget}
        onReplyTextChange={onReplyTextChange}
        onSubmit={onSubmitReply}
      />
    </div>
  );
};
