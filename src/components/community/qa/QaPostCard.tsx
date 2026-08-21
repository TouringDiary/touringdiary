import { MapPin, MessageCircleQuestion } from 'lucide-react';
import type { CommunityPost } from '../../../types/index';
import { QaFollowButton } from './QaFollowButton';

interface QaPostCardProps {
  post: CommunityPost;
  isMyPost: boolean;
  isGuest: boolean;
  isFollowing: boolean;
  followLoading: boolean;
  qaEnabled: boolean;
  onOpenAuthor: (post: CommunityPost, trigger: HTMLElement) => void;
  onOpenCity: (post: CommunityPost) => void;
  onToggleFollow: (postId: string) => void;
  onOpenThread: (post: CommunityPost) => void;
}

export const QaPostCard = ({
  post,
  isMyPost,
  isGuest,
  isFollowing,
  followLoading,
  qaEnabled,
  onOpenAuthor,
  onOpenCity,
  onToggleFollow,
  onOpenThread,
}: QaPostCardProps) => (
  <article
    className={`bg-slate-900 border rounded-xl p-5 transition-all animate-in fade-in slide-in-from-bottom-2 shadow-md relative ${isMyPost ? 'border-indigo-500/50' : 'border-slate-800'}`}
  >
    {isMyPost && (
      <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-xl shadow-lg border-b border-l border-indigo-400">
        TU
      </div>
    )}
    <div className="flex justify-between items-start mb-3">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold text-slate-300 shrink-0 ${isMyPost ? 'bg-indigo-900/30 border-indigo-500/50' : 'bg-slate-800 border-slate-700'}`}
        >
          {post.authorName.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={(e) => onOpenAuthor(post, e.currentTarget)}
              className={`font-bold text-sm text-left underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-indigo-500 rounded ${isMyPost ? 'text-indigo-300' : 'text-white'}`}
            >
              {post.authorName}
            </button>
            {post.authorRole === 'guide' && (
              <span className="bg-indigo-900/50 text-indigo-300 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border border-indigo-500/30">
                Guida
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 flex items-center gap-2 flex-wrap">
            <span>{new Date(post.date).toLocaleDateString()}</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => onOpenCity(post)}
              className="flex items-center gap-1 text-indigo-400 font-bold uppercase hover:text-indigo-300 underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
            >
              <MapPin className="w-3 h-3" aria-hidden /> {post.cityName}
            </button>
          </div>
        </div>
      </div>
    </div>
    <p className="block text-slate-200 text-lg font-medium leading-relaxed mb-4 break-words">
      {post.text}
    </p>
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 border-t border-slate-800 pt-3">
      {isGuest ? (
        <QaFollowButton
          viewer="guest"
          paused={!qaEnabled}
          onActivate={() => onToggleFollow(post.id)}
        />
      ) : (
        <QaFollowButton
          viewer="member"
          following={isFollowing}
          busy={followLoading}
          paused={!qaEnabled}
          onToggle={() => onToggleFollow(post.id)}
        />
      )}
      <button
        type="button"
        onClick={() => onOpenThread(post)}
        aria-label={`Apri risposte della domanda (${post.repliesCount || 0})`}
        className={`flex items-center gap-1.5 text-xs font-bold uppercase px-2 py-2 min-h-11 rounded-lg border transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 ${
          post.repliesCount > 0
            ? 'text-indigo-400 border-indigo-500/40 hover:bg-indigo-950/40'
            : 'text-slate-500 border-slate-700 hover:bg-slate-800/60'
        }`}
      >
        <MessageCircleQuestion className="w-4 h-4" aria-hidden /> {post.repliesCount || 0}{' '}
        <span className="hidden sm:inline">Risposte</span>
      </button>
    </div>
  </article>
);
