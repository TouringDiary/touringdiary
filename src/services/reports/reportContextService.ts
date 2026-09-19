import {
  isAssignmentEntityType,
  isAssignmentStatusDb,
  isPersonStatusDb,
} from '@/constants/governance';
import type {
  ContentReport,
  ReportAdminContext,
  ReportOtherAssignment,
  ReportOtherPersonCity,
} from '@/types/models/contentReport';
import { mapContentReportRow } from './contentReportService';
import { mf2Rpc } from './mf2DbClient';

function parseAssignmentRow(row: Record<string, unknown>): ReportOtherAssignment | null {
  const assignmentId = row.assignment_id;
  const entityType = row.entity_type;
  const entityId = row.entity_id;
  const cityId = row.city_id;
  const cityName = row.city_name;
  const entityName = row.entity_name;
  const assignmentStatus = row.assignment_status;
  if (
    typeof assignmentId !== 'string' ||
    typeof entityType !== 'string' ||
    typeof entityId !== 'string' ||
    typeof cityId !== 'string' ||
    typeof cityName !== 'string' ||
    typeof entityName !== 'string' ||
    typeof assignmentStatus !== 'string'
  ) {
    return null;
  }
  if (!isAssignmentEntityType(entityType) || !isAssignmentStatusDb(assignmentStatus)) {
    return null;
  }
  return {
    assignmentId,
    entityType,
    entityId,
    cityId,
    cityName,
    entityName,
    assignmentStatus,
    isCurrent: row.is_current === true,
  };
}

function parseReportedAssignment(value: unknown): ReportOtherAssignment | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return parseAssignmentRow(value as Record<string, unknown>);
}

function parseOtherAssignments(value: unknown): ReportOtherAssignment[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const parsed = parseAssignmentRow(entry as Record<string, unknown>);
    return parsed ? [parsed] : [];
  });
}

function parseOtherPersonCities(value: unknown): ReportOtherPersonCity[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const row = entry as Record<string, unknown>;
    const cityId = row.city_id;
    const cityName = row.city_name;
    const personId = row.person_id;
    const status = row.status;
    if (
      typeof cityId !== 'string' ||
      typeof cityName !== 'string' ||
      typeof personId !== 'string' ||
      typeof status !== 'string'
    ) {
      return [];
    }
    if (!isPersonStatusDb(status)) {
      return [];
    }
    return [{ cityId, cityName, personId, status }];
  });
}

export async function getReportAdminContext(reportId: string): Promise<ReportAdminContext> {
  const { data, error } = await mf2Rpc<unknown>('get_report_admin_context', {
    p_report_id: reportId,
  });
  if (error) throw error;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Contesto admin segnalazione non valido.');
  }
  const record = data as Record<string, unknown>;
  const reportRaw = record.report;
  if (!reportRaw || typeof reportRaw !== 'object' || Array.isArray(reportRaw)) {
    throw new Error('Report mancante nel contesto admin.');
  }

  const report = mapContentReportRow(reportRaw as Parameters<typeof mapContentReportRow>[0]);
  const reportedAssignment = parseReportedAssignment(record.reported_assignment);

  return {
    report,
    reportedAssignment,
    otherAssignments: parseOtherAssignments(record.other_assignments),
    otherPersonCities: parseOtherPersonCities(record.other_person_cities),
  };
}

export type { ContentReport };
