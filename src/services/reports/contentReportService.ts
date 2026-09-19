import {
  CONTENT_REPORT_ENTITY_TYPE_VALUES,
  CONTENT_REPORT_KIND_VALUES,
  CONTENT_REPORT_REASON_VALUES,
  type ContentReportEntityType,
  type ContentReportKind,
  type ContentReportReason,
  type ContentReportSourceContext,
  type ContentReportStatusDb,
  isContentReportStatusDb,
  parseContentReportSourceContext,
  parseContentReportStatusDb,
} from '@/constants/governance';
import type {
  ContentReport,
  CreateReportGroupResult,
  SubmitContentReportInput,
} from '@/types/models/contentReport';
import { mf2ContentReportsTable, mf2Rpc } from './mf2DbClient';

type ContentReportRow = {
  id: string;
  report_group_id: string;
  parent_report_id: string | null;
  report_kind: string;
  entity_type: string;
  entity_id: string;
  city_id: string;
  assignment_id: string | null;
  status: string;
  reason: string;
  user_notes: string;
  admin_notes: string | null;
  reporter_user_id: string | null;
  reporter_user_name: string | null;
  reporter_email: string | null;
  reporter_email_verified: boolean;
  source_context: string | null;
  snapshot_entity_name: string | null;
  snapshot_image_url: string | null;
  snapshot_storage_bucket: string | null;
  snapshot_storage_path: string | null;
  snapshot_entity_status: string | null;
  snapshot_assignment_status: string | null;
  evidence_storage_bucket: string | null;
  evidence_storage_path: string | null;
  evidence_content_hash: string | null;
  evidence_captured_at: string | null;
  created_at: string;
  updated_at: string;
};

function parseReportKind(value: string): ContentReportKind {
  if ((CONTENT_REPORT_KIND_VALUES as readonly string[]).includes(value)) {
    return value as ContentReportKind;
  }
  throw new Error(`report_kind non valido: ${value}`);
}

function parseEntityType(value: string): ContentReportEntityType {
  if ((CONTENT_REPORT_ENTITY_TYPE_VALUES as readonly string[]).includes(value)) {
    return value as ContentReportEntityType;
  }
  throw new Error(`entity_type non valido: ${value}`);
}

function parseReason(value: string): ContentReportReason {
  if ((CONTENT_REPORT_REASON_VALUES as readonly string[]).includes(value)) {
    return value as ContentReportReason;
  }
  throw new Error(`reason non valido: ${value}`);
}

export function mapContentReportRow(row: ContentReportRow): ContentReport {
  return {
    id: row.id,
    reportGroupId: row.report_group_id,
    parentReportId: row.parent_report_id,
    reportKind: parseReportKind(row.report_kind),
    entityType: parseEntityType(row.entity_type),
    entityId: row.entity_id,
    cityId: row.city_id,
    assignmentId: row.assignment_id,
    status: parseContentReportStatusDb(row.status),
    reason: parseReason(row.reason),
    userNotes: row.user_notes,
    adminNotes: row.admin_notes,
    reporterUserId: row.reporter_user_id,
    reporterUserName: row.reporter_user_name,
    reporterEmail: row.reporter_email,
    reporterEmailVerified: row.reporter_email_verified,
    sourceContext: row.source_context
      ? parseContentReportSourceContext(row.source_context)
      : null,
    snapshotEntityName: row.snapshot_entity_name,
    snapshotImageUrl: row.snapshot_image_url,
    snapshotStorageBucket: row.snapshot_storage_bucket,
    snapshotStoragePath: row.snapshot_storage_path,
    snapshotEntityStatus: row.snapshot_entity_status,
    snapshotAssignmentStatus: row.snapshot_assignment_status,
    evidenceStorageBucket: row.evidence_storage_bucket,
    evidenceStoragePath: row.evidence_storage_path,
    evidenceContentHash: row.evidence_content_hash,
    evidenceCapturedAt: row.evidence_captured_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseCreateGroupResult(data: unknown): CreateReportGroupResult {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Risposta create_content_report_group non valida.');
  }
  const record = data as Record<string, unknown>;
  if (record.ok !== true) {
    throw new Error('Creazione segnalazione non riuscita.');
  }
  const groupId = record.report_group_id;
  if (typeof groupId !== 'string') {
    throw new Error('report_group_id mancante nella risposta RPC.');
  }
  return {
    reportGroupId: groupId,
    entityReportId: typeof record.entity_report_id === 'string' ? record.entity_report_id : null,
    imageReportId: typeof record.image_report_id === 'string' ? record.image_report_id : null,
    assignmentId: typeof record.assignment_id === 'string' ? record.assignment_id : null,
  };
}

export async function submitContentReportGroup(
  input: SubmitContentReportInput,
): Promise<CreateReportGroupResult> {
  const payload = {
    city_id: input.cityId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    entity_name: input.entityName,
    include_entity_abuse: input.includeEntityAbuse,
    include_image_abuse: input.includeImageAbuse,
    reason: input.reason,
    user_notes: input.userNotes.trim(),
    reporter_user_name: input.reporterUserName,
    source_context: input.sourceContext,
    image_url: input.imageUrl,
    storage_bucket: input.storageBucket,
    storage_path: input.storagePath,
    assignment_id: input.assignmentId ?? null,
  };

  const { data, error } = await mf2Rpc<unknown>('create_content_report_group', {
    p_payload: payload,
  });
  if (error) throw error;
  return parseCreateGroupResult(data);
}

export type ListReportsFilter = {
  entityTypes?: ContentReportEntityType[];
  sourceContexts?: ContentReportSourceContext[];
  status?: ContentReportStatusDb | 'all';
  reportKinds?: ContentReportKind[];
};

export async function listContentReportsForAdmin(
  filter: ListReportsFilter = {},
): Promise<ContentReport[]> {
  let query = mf2ContentReportsTable().select('*').order('created_at', { ascending: false });

  if (filter.status && filter.status !== 'all') {
    query = query.eq('status', filter.status);
  }
  if (filter.entityTypes?.length) {
    query = query.in('entity_type', filter.entityTypes);
  }
  if (filter.reportKinds?.length) {
    query = query.in('report_kind', filter.reportKinds);
  }
  if (filter.sourceContexts?.length) {
    query = query.in('source_context', filter.sourceContexts);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => mapContentReportRow(row as unknown as ContentReportRow));
}

export async function getContentReportById(reportId: string): Promise<ContentReport | null> {
  const { data, error } = await mf2ContentReportsTable()
    .select('*')
    .eq('id', reportId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapContentReportRow(data as unknown as ContentReportRow);
}

export async function getReportsByGroupId(groupId: string): Promise<ContentReport[]> {
  const { data, error } = await mf2ContentReportsTable()
    .select('*')
    .eq('report_group_id', groupId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => mapContentReportRow(row as unknown as ContentReportRow));
}

export async function transitionReportStatus(
  reportId: string,
  targetStatus: Exclude<ContentReportStatusDb, 'nuovo'>,
  adminNotes?: string,
): Promise<void> {
  const { data, error } = await mf2Rpc<unknown>('transition_report_status', {
    p_report_id: reportId,
    p_target_status: targetStatus,
    p_admin_notes: adminNotes ?? null,
  });
  if (error) throw error;
  if (!data || typeof data !== 'object' || (data as { ok?: boolean }).ok !== true) {
    throw new Error('Transizione stato segnalazione non riuscita.');
  }
}

export async function getPendingContentReportCount(
  entityTypes?: ContentReportEntityType[],
): Promise<number> {
  let query = mf2ContentReportsTable()
    .select('*', { count: 'exact', head: true })
    .eq('status', 'nuovo');
  if (entityTypes?.length) {
    query = query.in('entity_type', entityTypes);
  }
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export function isReportStatusFilter(value: string): value is ContentReportStatusDb | 'all' {
  return value === 'all' || isContentReportStatusDb(value);
}
