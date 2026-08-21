import type { CommunityReply } from '../../../types/index';
import { MAX_NEST_INDENT_DEPTH } from './qaForumShared';

interface QaReplyNodeProps {
  reply: CommunityReply;
  depth: number;
  childrenByParent: Map<string | null, CommunityReply[]>;
  replyParentId: string | null;
  qaEnabled: boolean;
  isGuest: boolean;
  onBeginReply: (parentId: string) => void;
}

export const QaReplyNode = ({
  reply,
  depth,
  childrenByParent,
  replyParentId,
  qaEnabled,
  isGuest,
  onBeginReply,
}: QaReplyNodeProps) => {
  const children = childrenByParent.get(reply.id) ?? [];
  const indentDepth = Math.min(depth, MAX_NEST_INDENT_DEPTH);
  const nestClass = indentDepth > 0 ? 'ml-2 sm:ml-4 border-l border-slate-800 pl-2 sm:pl-4' : '';
  const isTarget = replyParentId === reply.id;

  return (
    <div className={`space-y-2 ${nestClass}`}>
      <div
        className={`bg-slate-900/50 border rounded-lg p-4 transition-colors ${
          isTarget ? 'border-indigo-500/60' : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex justify-between items-start mb-2 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-400 shrink-0">
              {reply.authorName.charAt(0)}
            </div>
            <span className="font-bold text-slate-300 text-sm truncate">{reply.authorName}</span>
            {reply.authorRole === 'guide' && (
              <span className="text-[9px] bg-indigo-900/30 text-indigo-400 px-1.5 rounded uppercase font-bold">
                Guida
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-600 shrink-0">
            {new Date(reply.date).toLocaleDateString()}
          </span>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed break-words">{reply.text}</p>
        {qaEnabled && !isGuest && (
          <button
            type="button"
            onClick={() => onBeginReply(reply.id)}
            aria-label={`Rispondi a ${reply.authorName}`}
            className={`mt-3 min-h-11 px-3 rounded-lg text-xs font-bold uppercase border transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              isTarget
                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200'
                : 'border-slate-700 text-indigo-400 hover:border-indigo-500/40 hover:text-indigo-300'
            }`}
          >
            Rispondi
          </button>
        )}
      </div>
      {children.map((child) => (
        <QaReplyNode
          key={child.id}
          reply={child}
          depth={depth + 1}
          childrenByParent={childrenByParent}
          replyParentId={replyParentId}
          qaEnabled={qaEnabled}
          isGuest={isGuest}
          onBeginReply={onBeginReply}
        />
      ))}
    </div>
  );
};
