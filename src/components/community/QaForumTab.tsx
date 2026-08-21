import { Filter, User } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { saveQaCityReturn } from '@/community/qaCityReturnMemory';
import { FeatureFlagPausedBanner } from '@/components/platform/FeatureFlagPausedBanner';
import {
  PLATFORM_FEATURE_FLAG_KEYS,
  PLATFORM_MESSAGE_TEMPLATE_KEYS,
} from '@/constants/platformFeatureFlags';
import { useModal } from '@/context/ModalContext';
import { useFeatureFlag } from '@/context/PlatformControlContext';
import { useNavigation } from '@/context/useNavigation';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { useSystemMessage } from '@/hooks/useSystemMessage';
import {
  resolvePlatformUserBody,
  resolvePlatformUserTitle,
} from '@/services/platformControl/resolvePlatformUserMessage';
import { showGlobalAlert } from '@/services/ui/toastService';
import { getFullManifestAsync } from '../../services/cityService';
import {
  addCommunityPostAsync,
  addCommunityReplyAsync,
  type CommunityPostCreateInput,
  getCommunityPostsAsync,
  getUserPostFollows,
  togglePostFollow,
  updateCommunityPostAsync,
} from '../../services/communityService';
import type { CitySummary, CommunityPost, User as UserType } from '../../types/index';
import { QaAuthorDetailDialog, type QaAuthorDetailDialogHandle } from './qa/QaAuthorDetailDialog';
import { QaPostList } from './qa/QaPostList';
import { QaQuestionComposer } from './qa/QaQuestionComposer';
import { QaThread } from './qa/QaThread';
import { resolveQaCityName, sortCitiesByName } from './qa/qaForumShared';

interface QaForumTabProps {
  user: UserType;
  initialSelectedPostId?: string;
  /** Stesso AuthModal del diario (`openModal('auth')`). Preferisce `onOpenAuth` del parent (Community Hub: returnTo global). */
  onOpenAuth?: () => void;
  /** Ripristino filtro/scroll dopo Indietro dalla città (CARD-17). */
  qaRestore?: {
    showMyPostsOnly: boolean;
    listScrollTop: number;
  };
}

/** Mapping ruolo app → author_role persistito su community_posts (payload creazione). */
function resolveAuthorRole(role: UserType['role']): string {
  if (role === 'business') return 'business';
  if (role === 'admin_all') return 'admin';
  return 'user';
}

export const QaForumTab = ({
  user,
  initialSelectedPostId,
  onOpenAuth,
  qaRestore,
}: QaForumTabProps) => {
  const { openModal, closeModal } = useModal();
  const { navigateToCity } = useNavigation();
  const qaFlag = useFeatureFlag(PLATFORM_FEATURE_FLAG_KEYS.MODERATION_COMMUNITY_POSTS);
  const qaEnabled = qaFlag?.enabled ?? true;
  const qaMsgKey =
    qaFlag?.messageKey ?? PLATFORM_MESSAGE_TEMPLATE_KEYS.MODERATION_COMMUNITY_POSTS_PAUSED;
  const { getText: getQaPausedMsg } = useSystemMessage(qaMsgKey);
  const pausedCopy = getQaPausedMsg({});

  const isGuest = user.role === 'guest';
  const isMobile = useMobileDetect();
  const sectionTitleClass = useFoundationStyles(FOUNDATION_STYLE_KEYS.sectionTitle, isMobile);
  const sectionDescriptionClass = useFoundationStyles(
    FOUNDATION_STYLE_KEYS.sectionDescription,
    isMobile,
  );

  const [qaPosts, setQaPosts] = useState<CommunityPost[]>([]);
  const [followedPostIds, setFollowedPostIds] = useState<string[]>([]);
  const [cityManifest, setCityManifest] = useState<CitySummary[]>([]);

  const [questionText, setQuestionText] = useState('');
  const [questionCity, setQuestionCity] = useState('');
  const [isPostingQa, setIsPostingQa] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [isPostingReply, setIsPostingReply] = useState(false);
  const [togglingFollowPostId, setTogglingFollowPostId] = useState<string | null>(null);
  const [showMyPostsOnly, setShowMyPostsOnly] = useState(false);

  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editText, setEditText] = useState('');
  const [editCity, setEditCity] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const listScrollRef = useRef<HTMLDivElement | null>(null);
  const authorDialogRef = useRef<QaAuthorDetailDialogHandle>(null);

  const requireAuth = () => {
    // Diario: openModal('auth'). Community Hub: onOpenAuth → stesso AuthModal + returnTo global.
    if (onOpenAuth) {
      onOpenAuth();
      return;
    }
    openModal('auth');
  };

  const restoreShowMyPostsOnly = qaRestore?.showMyPostsOnly;
  const restoreListScrollTop = qaRestore?.listScrollTop;

  useLayoutEffect(() => {
    if (restoreShowMyPostsOnly === undefined) return;
    setShowMyPostsOnly(restoreShowMyPostsOnly);
  }, [restoreShowMyPostsOnly]);

  const listCountForRestore = showMyPostsOnly
    ? qaPosts.filter((p) => !isGuest && p.authorId === user.id).length
    : qaPosts.length;

  // Restore scroll sulla lista (non nel thread), dopo paint di filtro/lista.
  useLayoutEffect(() => {
    if (restoreListScrollTop === undefined || selectedPost) return;
    const el = listScrollRef.current;
    if (!el) return;
    if (listCountForRestore === 0) {
      el.scrollTop = restoreListScrollTop;
      return;
    }
    el.scrollTop = Math.min(restoreListScrollTop, Math.max(0, el.scrollHeight - el.clientHeight));
  }, [restoreListScrollTop, selectedPost, listCountForRestore]);

  const openCityFromPost = (post: CommunityPost) => {
    if (!post.cityId || post.cityId === 'general') {
      showGlobalAlert('Questa domanda non è collegata a una città navigabile.');
      return;
    }
    const exists = cityManifest.some((c) => c.id === post.cityId);
    if (!exists) {
      showGlobalAlert('Città non disponibile nel catalogo.');
      return;
    }
    saveQaCityReturn({
      cityId: post.cityId,
      postId: post.id,
      showMyPostsOnly,
      listScrollTop: listScrollRef.current?.scrollTop ?? 0,
    });
    closeModal();
    navigateToCity(post.cityId);
  };

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const posts = await getCommunityPostsAsync();
        if (cancelled) return;
        setQaPosts(posts);
        if (initialSelectedPostId) {
          const post = posts.find((p) => p.id === initialSelectedPostId);
          if (post) setSelectedPost(post);
        }
      } catch (e: unknown) {
        if (cancelled) return;
        console.error('Errore caricamento Q&A Local:', e);
        setQaPosts([]);
        showGlobalAlert(
          e instanceof Error ? e.message : 'Impossibile caricare le domande Q&A Local.',
        );
      }
    })();

    void getFullManifestAsync()
      .then((manifest) => {
        if (!cancelled) setCityManifest(sortCitiesByName(manifest));
      })
      .catch((e: unknown) => {
        console.error('Errore caricamento manifest città Q&A:', e);
        if (!cancelled) setCityManifest([]);
      });

    if (!isGuest && user.id) {
      void getUserPostFollows(user.id)
        .then((ids) => {
          if (!cancelled) setFollowedPostIds(ids);
        })
        .catch((e: unknown) => {
          console.error('Errore caricamento follow Q&A:', e);
          // Nessuno stato di follow simulato: lista vuota (coerente col ramo guest).
          if (!cancelled) setFollowedPostIds([]);
        });
    } else {
      setFollowedPostIds([]);
    }

    return () => {
      cancelled = true;
    };
  }, [user.id, isGuest, initialSelectedPostId]);

  const pausedAlertMessage = () =>
    pausedCopy.body ||
    resolvePlatformUserBody(
      qaMsgKey,
      'Le domande e risposte locali sono temporaneamente disabilitate.',
    );

  const pausedTitle = pausedCopy.title || resolvePlatformUserTitle(qaMsgKey, 'Consigli sospesi');
  const pausedBody = pausedAlertMessage();

  const syncPostState = (updated: CommunityPost) => {
    setQaPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedPost((prev) => (prev && prev.id === updated.id ? updated : prev));
  };

  const handlePostQuestion = async () => {
    if (!qaEnabled) {
      showGlobalAlert(pausedAlertMessage());
      return;
    }
    if (isGuest) {
      requireAuth();
      return;
    }
    if (!questionText.trim()) {
      showGlobalAlert('Scrivi una domanda!');
      return;
    }
    if (!questionCity) {
      showGlobalAlert('Seleziona una città!');
      return;
    }

    const selectedCityName = resolveQaCityName(questionCity, cityManifest);
    if (!selectedCityName) {
      showGlobalAlert('Città non valida. Seleziona una città dall’elenco.');
      return;
    }

    // PK assegnata dal DB (community_posts.id DEFAULT gen_random_uuid()).
    const newPost: CommunityPostCreateInput = {
      authorId: user.id,
      authorName: user.name,
      authorRole: resolveAuthorRole(user.role),
      authorAvatar: user.avatar,
      text: questionText,
      cityId: questionCity,
      cityName: selectedCityName,
    };

    setIsPostingQa(true);
    try {
      const savedPost = await addCommunityPostAsync(newPost);
      setQaPosts((prev) => [savedPost, ...prev]);
      // Owner auto-follow: trigger DB; allinea stato UI solo dopo successo.
      setFollowedPostIds((prev) => (prev.includes(savedPost.id) ? prev : [...prev, savedPost.id]));
      setShowMyPostsOnly(true);
      setQuestionText('');
    } catch (e: unknown) {
      showGlobalAlert(e instanceof Error ? e.message : pausedAlertMessage());
    } finally {
      setIsPostingQa(false);
    }
  };

  const handleToggleFollow = async (postId: string) => {
    if (!qaEnabled) {
      showGlobalAlert(pausedAlertMessage());
      return;
    }
    if (isGuest) {
      requireAuth();
      return;
    }
    if (togglingFollowPostId === postId) return;

    setTogglingFollowPostId(postId);
    try {
      const result = await togglePostFollow(postId, user.id);
      setFollowedPostIds((prev) => {
        if (result.following) {
          return prev.includes(postId) ? prev : [...prev, postId];
        }
        return prev.filter((id) => id !== postId);
      });
    } catch (e: unknown) {
      showGlobalAlert(e instanceof Error ? e.message : pausedAlertMessage());
    } finally {
      setTogglingFollowPostId(null);
    }
  };

  const startEditQuestion = () => {
    if (!selectedPost) return;
    if (isGuest) {
      requireAuth();
      return;
    }
    setEditText(selectedPost.text);
    setEditCity(selectedPost.cityId);
    setIsEditingQuestion(true);
  };

  const cancelEditQuestion = () => {
    setIsEditingQuestion(false);
    setEditText('');
    setEditCity('');
  };

  const handleSaveQuestion = async () => {
    if (!selectedPost || isSavingEdit) return;
    if (isGuest) {
      requireAuth();
      return;
    }
    if (!editText.trim() || !editCity) {
      showGlobalAlert('Compila testo e città.');
      return;
    }

    const cityName = resolveQaCityName(editCity, cityManifest);
    if (!cityName) {
      showGlobalAlert('Città non valida. Seleziona una città dall’elenco.');
      return;
    }

    setIsSavingEdit(true);
    try {
      const updated = await updateCommunityPostAsync(selectedPost.id, {
        text: editText,
        cityId: editCity,
        cityName,
      });
      syncPostState(updated);
      setIsEditingQuestion(false);
    } catch (e: unknown) {
      showGlobalAlert(e instanceof Error ? e.message : 'Errore salvataggio domanda.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const beginReplyTo = (parentId: string | null) => {
    if (isGuest) {
      requireAuth();
      return;
    }
    // Cambia destinatario senza cancellare il testo già digitato.
    setReplyParentId(parentId);
  };

  const clearReplyTarget = () => {
    setReplyParentId(null);
  };

  const handlePostReply = async () => {
    if (!qaEnabled) {
      showGlobalAlert(pausedAlertMessage());
      return;
    }
    if (!replyText.trim() || !selectedPost || isPostingReply) return;

    if (isGuest) {
      requireAuth();
      return;
    }

    const isOwner = selectedPost.authorId === user.id;
    const parentId = replyParentId;
    if (isOwner && parentId === null) {
      showGlobalAlert(
        'Non puoi rispondere direttamente alla tua domanda. Rispondi a una risposta ricevuta.',
      );
      return;
    }

    setIsPostingReply(true);
    try {
      const savedReply = await addCommunityReplyAsync({
        postId: selectedPost.id,
        text: replyText,
        parentReplyId: parentId,
      });

      const updatedReplies = [...(selectedPost.replies || []), savedReply];
      const updatedPost: CommunityPost = {
        ...selectedPost,
        replies: updatedReplies,
        repliesCount: (selectedPost.repliesCount || 0) + 1,
      };
      syncPostState(updatedPost);
      setReplyText('');
      setReplyParentId(null);
    } catch (e: unknown) {
      showGlobalAlert(e instanceof Error ? e.message : pausedAlertMessage());
    } finally {
      setIsPostingReply(false);
    }
  };

  if (selectedPost) {
    return (
      <QaThread
        post={selectedPost}
        isGuest={isGuest}
        currentUserId={user.id}
        qaEnabled={qaEnabled}
        isFollowing={!isGuest && followedPostIds.includes(selectedPost.id)}
        followLoading={togglingFollowPostId === selectedPost.id}
        replyText={replyText}
        replyParentId={replyParentId}
        isPostingReply={isPostingReply}
        isEditingQuestion={isEditingQuestion}
        editText={editText}
        editCity={editCity}
        isSavingEdit={isSavingEdit}
        cityManifest={cityManifest}
        pausedTitle={pausedTitle}
        pausedBody={pausedBody}
        onBack={() => {
          cancelEditQuestion();
          setReplyParentId(null);
          setReplyText('');
          setSelectedPost(null);
        }}
        onToggleFollow={() => void handleToggleFollow(selectedPost.id)}
        onRequireAuth={requireAuth}
        onStartEdit={startEditQuestion}
        onCancelEdit={cancelEditQuestion}
        onEditTextChange={setEditText}
        onEditCityChange={setEditCity}
        onSaveEdit={() => void handleSaveQuestion()}
        onBeginReply={beginReplyTo}
        onClearReplyTarget={clearReplyTarget}
        onReplyTextChange={setReplyText}
        onSubmitReply={() => void handlePostReply()}
      />
    );
  }

  const filteredPosts = showMyPostsOnly
    ? qaPosts.filter((p) => !isGuest && p.authorId === user.id)
    : qaPosts;

  return (
    <div className="flex flex-col h-full gap-6 pb-10 px-4 md:px-8 pt-8 relative">
      <QaAuthorDetailDialog ref={authorDialogRef} />
      <FeatureFlagPausedBanner
        flagKey={PLATFORM_FEATURE_FLAG_KEYS.MODERATION_COMMUNITY_POSTS}
        defaultMessageKey={PLATFORM_MESSAGE_TEMPLATE_KEYS.MODERATION_COMMUNITY_POSTS_PAUSED}
      />

      <header className="shrink-0 space-y-1">
        <h3 className={sectionTitleClass}>Consigli</h3>
        <p className={sectionDescriptionClass}>Chiedi ai viaggiatori consigli ed esperienze.</p>
      </header>

      <div className="flex items-center justify-between bg-slate-900/50 border border-slate-800 rounded-xl p-2 gap-2 flex-wrap shrink-0">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 ml-2" aria-hidden />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Filtra Discussioni:
          </span>
        </div>
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setShowMyPostsOnly(false)}
            className={`px-4 py-1.5 min-h-10 rounded-md text-xs font-bold uppercase transition-all ${!showMyPostsOnly ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            Tutte
          </button>
          <button
            type="button"
            onClick={() => {
              if (isGuest) {
                requireAuth();
                return;
              }
              setShowMyPostsOnly(true);
            }}
            className={`px-4 py-1.5 min-h-10 rounded-md text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${showMyPostsOnly ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            <User className="w-3.5 h-3.5" aria-hidden /> Le Mie
          </button>
        </div>
      </div>

      <QaPostList
        posts={filteredPosts}
        showMyPostsOnly={showMyPostsOnly}
        isGuest={isGuest}
        currentUserId={user.id}
        followedPostIds={followedPostIds}
        togglingFollowPostId={togglingFollowPostId}
        qaEnabled={qaEnabled}
        listScrollRef={listScrollRef}
        onOpenAuthor={(post, trigger) => {
          void authorDialogRef.current?.open(post, trigger);
        }}
        onOpenCity={openCityFromPost}
        onToggleFollow={(postId) => void handleToggleFollow(postId)}
        onOpenThread={setSelectedPost}
      />

      <QaQuestionComposer
        qaEnabled={qaEnabled}
        isGuest={isGuest}
        pausedTitle={pausedTitle}
        pausedBody={pausedBody}
        questionText={questionText}
        questionCity={questionCity}
        isPostingQa={isPostingQa}
        cityManifest={cityManifest}
        onRequireAuth={requireAuth}
        onQuestionTextChange={setQuestionText}
        onQuestionCityChange={setQuestionCity}
        onSubmit={() => void handlePostQuestion()}
      />
    </div>
  );
};
