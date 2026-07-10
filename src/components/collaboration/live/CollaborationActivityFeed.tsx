import React, { useEffect, useState } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import type { CollaborationDomainEvent } from '@/domain/collaboration/domainEvent';
import { listCollaborationEventsForWorkspace } from '@/services/collaboration/domainEventService';

interface Props {
  workspaceId: string;
  className?: string;
  limit?: number;
  layout?: 'legacy' | 'hub';
}

export const CollaborationActivityFeed: React.FC<Props> = ({
  workspaceId,
  className = '',
  limit = 30,
  layout = 'legacy',
}) => {
  const [events, setEvents] = useState<CollaborationDomainEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    void listCollaborationEventsForWorkspace(workspaceId, limit)
      .then(setEvents)
      .finally(() => setIsLoading(false));
  }, [workspaceId, limit]);

  const listClass =
    layout === 'hub'
      ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2'
      : 'space-y-2';

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 text-slate-500 text-sm py-4 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin" />
        Caricamento attività...
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <p className={`text-sm text-slate-500 py-4 ${className}`}>
        Nessuna attività registrata ancora.
      </p>
    );
  }

  return (
    <ul className={`${listClass} ${className}`}>
      {events.map((event) => (
        <li
          key={event.id}
          className={`rounded-lg border border-slate-800 bg-slate-900/40 text-sm text-slate-200 ${
            layout === 'hub' ? 'px-3 py-2.5 flex flex-col min-h-[4.5rem]' : 'px-3 py-2.5'
          }`}
        >
          <p className={layout === 'hub' ? 'text-xs leading-snug line-clamp-3 flex-1' : undefined}>
            {event.summary}
          </p>
          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3" />
            {new Date(event.createdAt).toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  );
};
