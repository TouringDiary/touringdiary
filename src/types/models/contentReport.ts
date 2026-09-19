import type {
  AssignmentEntityType,
  AssignmentStatusDb,
  ContentReportEntityType,
  ContentReportKind,
  ContentReportReason,
  ContentReportSourceContext,
  ContentReportStatusDb,
  PersonStatusDb,
} from '@/constants/governance';

export type ContentReport = {
  id: string;
  reportGroupId: string;
  parentReportId: string | null;
  reportKind: ContentReportKind;
  entityType: ContentReportEntityType;
  entityId: string;
  cityId: string;
  assignmentId: string | null;
  status: ContentReportStatusDb;
  reason: ContentReportReason;
  userNotes: string;
  adminNotes: string | null;
  reporterUserId: string | null;
  reporterUserName: string | null;
  reporterEmail: string | null;
  /** Popolato dal RPC da auth.users — non attestare verifica OTP lato client. */
  reporterEmailVerified: boolean;
  sourceContext: ContentReportSourceContext | null;
  snapshotEntityName: string | null;
  snapshotImageUrl: string | null;
  snapshotStorageBucket: string | null;
  snapshotStoragePath: string | null;
  snapshotEntityStatus: string | null;
  snapshotAssignmentStatus: string | null;
  evidenceStorageBucket: string | null;
  evidenceStoragePath: string | null;
  evidenceContentHash: string | null;
  evidenceCapturedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReportAdminContext = {
  report: ContentReport;
  reportedAssignment: ReportOtherAssignment | null;
  otherAssignments: ReportOtherAssignment[];
  otherPersonCities: ReportOtherPersonCity[];
};

export type ReportOtherAssignment = {
  assignmentId: string;
  entityType: AssignmentEntityType;
  entityId: string;
  cityId: string;
  entityName: string;
  cityName: string;
  assignmentStatus: AssignmentStatusDb;
  isCurrent: boolean;
};

export type ReportOtherPersonCity = {
  cityId: string;
  cityName: string;
  personId: string;
  status: PersonStatusDb;
};

export type SubmitContentReportInput = {
  cityId: string;
  entityType: ContentReportEntityType;
  entityId: string;
  entityName: string;
  includeEntityAbuse: boolean;
  includeImageAbuse: boolean;
  reason: ContentReportReason;
  userNotes: string;
  /** Inviato al RPC come reporter_user_name; identità/verifica email derivate server-side. */
  reporterUserName: string | null;
  sourceContext: ContentReportSourceContext | null;
  imageUrl: string | null;
  storageBucket: string | null;
  storagePath: string | null;
  assignmentId?: string | null;
};

export type CreateReportGroupResult = {
  reportGroupId: string;
  entityReportId: string | null;
  imageReportId: string | null;
  assignmentId: string | null;
};
