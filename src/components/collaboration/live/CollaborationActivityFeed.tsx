import React, { useEffect, useState } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import type { CollaborationDomainEvent } from '@/domain/collaboration/domainEvent';
import { listCollaborationEventsForWorkspace } from '@/services/collaboration/domainEventService';

interface Props {
  workspaceId: string;
  className?: string;
  limit?: number;
}

export const CollaborationActivityFeed: React.FC<Props> = ({
  workspaceId,
  className = '',
  limit = 30,
}) => {
  const [events, setEvents] = useState<CollaborationDomainEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    void listCollaborationEventsForWorkspace(workspaceId, limit)
      .then(setEvents)
      .finally(() => setIsLoading(false));
  }, [workspaceId, limit]);

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
    <ul className={`space-y-2 ${className}`}>
      {events.map((event) => (
        <li
          key={event.id}
          className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2.5 text-sm text-slate-200"
        >
          <p>{event.summary}</p>
          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(event.createdAt).toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  );
};
