import type {
  CollaborationDomainEvent,
  RecordCollaborationEventInput,
} from '@/domain/collaboration/domainEvent';
import type { SharedResourceKind } from '@/domain/collaboration';
import { isSharedResourceKind } from '@/domain/collaboration';
import { resolveAuthenticatedUserId } from '@/services/auth/authIdentity';
import { supabase } from '@/services/supabaseClient';
import type { Json } from '@/types/supabase';

interface DomainEventRow {
  id: string;
  domain: string;
  event_type: string;
  actor_id: string | null;
  kind: string | null;
  resource_id: string | null;
  workspace_id: string | null;
  shared_resource_id: string | null;
  summary: string;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export function mapCollaborationDomainEventRow(row: DomainEventRow): CollaborationDomainEvent {
  return {
    id: row.id,
    domain: row.domain,
    eventType: row.event_type,
    actorId: row.actor_id,
    kind: row.kind && isSharedResourceKind(row.kind) ? row.kind : null,
    resourceId: row.resource_id,
    workspaceId: row.workspace_id,
    sharedResourceId: row.shared_resource_id,
    summary: row.summary,
    payload: row.payload ?? {},
    createdAt: row.created_at,
  };
}

/** Registra un evento nel motore dominio (§20). */
export async function recordCollaborationDomainEvent(
  input: RecordCollaborationEventInput
): Promise<void> {
  const actorId = await resolveAuthenticatedUserId();
  if (!actorId) {
    console.error(
      '[domainEventService] recordCollaborationDomainEvent: utente autenticato non disponibile'
    );
    return;
  }

  const { error } = await supabase.from('collaboration_domain_events').insert({
    domain: 'collaboration',
    event_type: input.eventType,
    actor_id: actorId,
    kind: input.kind ?? null,
    resource_id: input.resourceId ?? null,
    workspace_id: input.workspaceId ?? null,
    shared_resource_id: input.sharedResourceId ?? null,
    summary: input.summary,
    payload: (input.payload ?? {}) as Json,
  });

  if (error) {
    console.error('[domainEventService] recordCollaborationDomainEvent:', error.message);
  }
}

export async function listCollaborationEventsForWorkspace(
  workspaceId: string,
  limit = 50
): Promise<CollaborationDomainEvent[]> {
  const { data, error } = await supabase
    .from('collaboration_domain_events')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[domainEventService] listCollaborationEventsForWorkspace:', error.message);
    return [];
  }

  return (data as DomainEventRow[]).map(mapCollaborationDomainEventRow);
}

export async function listCollaborationEventsForResource(
  kind: SharedResourceKind,
  resourceId: string,
  limit = 50
): Promise<CollaborationDomainEvent[]> {
  const { data, error } = await supabase
    .from('collaboration_domain_events')
    .select('*')
    .eq('kind', kind)
    .eq('resource_id', resourceId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[domainEventService] listCollaborationEventsForResource:', error.message);
    return [];
  }

  return (data as DomainEventRow[]).map(mapCollaborationDomainEventRow);
}
