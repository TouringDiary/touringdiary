import type { SharedResourceKind } from './sharedResource';

/** Tipi evento collaborativo (§20). Estendibile senza cambiare schema. */
export const COLLABORATION_EVENT_TYPES = [
  'resource.item_added',
  'resource.item_removed',
  'resource.item_updated',
  'resource.note_created',
  'resource.note_updated',
  'resource.day_updated',
  'resource.content_updated',
  'workspace.resource_linked',
  'workspace.attachment_added',
  'workspace.attachment_removed',
  'workspace.member_joined',
] as const;

export type CollaborationEventType = (typeof COLLABORATION_EVENT_TYPES)[number];

export interface CollaborationDomainEvent {
  id: string;
  domain: string;
  eventType: CollaborationEventType | string;
  actorId: string | null;
  kind: SharedResourceKind | null;
  resourceId: string | null;
  workspaceId: string | null;
  sharedResourceId: string | null;
  summary: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface RecordCollaborationEventInput {
  eventType: CollaborationEventType | string;
  actorId: string | null;
  summary: string;
  kind?: SharedResourceKind;
  resourceId?: string;
  workspaceId?: string;
  sharedResourceId?: string;
  payload?: Record<string, unknown>;
}
