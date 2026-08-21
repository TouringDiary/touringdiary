import { MessageCircleQuestion } from 'lucide-react';
import type { Ref } from 'react';
import type { CommunityPost } from '../../../types/index';
import { QaPostCard } from './QaPostCard';

interface QaPostListProps {
  posts: CommunityPost[];
  showMyPostsOnly: boolean;
  isGuest: boolean;
  currentUserId: string;
  followedPostIds: string[];
  togglingFollowPostId: string | null;
  qaEnabled: boolean;
  listScrollRef: Ref<HTMLDivElement>;
  onOpenAuthor: (post: CommunityPost, trigger: HTMLElement) => void;
  onOpenCity: (post: CommunityPost) => void;
  onToggleFollow: (postId: string) => void;
  onOpenThread: (post: CommunityPost) => void;
}

export const QaPostList = ({
  posts,
  showMyPostsOnly,
  isGuest,
  currentUserId,
  followedPostIds,
  togglingFollowPostId,
  qaEnabled,
  listScrollRef,
  onOpenAuthor,
  onOpenCity,
  onToggleFollow,
  onOpenThread,
}: QaPostListProps) => (
  <div ref={listScrollRef} className="flex-1 space-y-4 overflow-y-auto custom-scrollbar min-h-0">
    {posts.length === 0 && (
      <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
        <MessageCircleQuestion className="w-12 h-12 text-slate-600 mx-auto mb-3" aria-hidden />
        <p className="text-slate-500 italic">
          {showMyPostsOnly
            ? 'Non hai ancora fatto domande.'
            : 'Nessuna domanda ancora. Sii il primo a chiedere!'}
        </p>
      </div>
    )}
    {posts.map((post) => {
      const isMyPost = !isGuest && post.authorId === currentUserId;
      return (
        <QaPostCard
          key={post.id}
          post={post}
          isMyPost={isMyPost}
          isGuest={isGuest}
          isFollowing={!isGuest && followedPostIds.includes(post.id)}
          followLoading={togglingFollowPostId === post.id}
          qaEnabled={qaEnabled}
          onOpenAuthor={onOpenAuthor}
          onOpenCity={onOpenCity}
          onToggleFollow={onToggleFollow}
          onOpenThread={onOpenThread}
        />
      );
    })}
  </div>
);
