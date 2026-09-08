import type { Database } from '@/types/database';
import type {
  FamousPersonPhotoReport,
  FamousPersonPhotoReportReason,
  FamousPersonPhotoReportStatus,
} from '@/types/models/famousPersonCommunity';
import { deletePublicMediaByStoragePath } from '../mediaService';
import { supabase } from '../supabaseClient';

type ReportRow = Database['public']['Tables']['famous_person_photo_reports']['Row'];

const isStatus = (value: string): value is FamousPersonPhotoReportStatus =>
  value === 'pending' || value === 'in_review' || value === 'photo_blocked' || value === 'rejected';

const parseStatus = (value: string): FamousPersonPhotoReportStatus => {
  if (isStatus(value)) return value;
  throw new Error(`Stato report abuso Famous Person non valido: ${value}`);
};

const isReason = (value: string): value is FamousPersonPhotoReportReason =>
  value === 'copyright' ||
  value === 'other_rights' ||
  value === 'unauthorized' ||
  value === 'other';

const parseReason = (value: string): FamousPersonPhotoReportReason => {
  if (isReason(value)) return value;
  throw new Error(`Motivo report abuso Famous Person non valido: ${value}`);
};

const isModeratable = (status: FamousPersonPhotoReportStatus): status is 'pending' | 'in_review' =>
  status === 'pending' || status === 'in_review';

const mapReport = (
  row: ReportRow,
  currentOfficialImageUrl?: string | null,
): FamousPersonPhotoReport => ({
  id: row.id,
  personId: row.person_id,
  personImageUrl: row.person_image_url,
  personImageStoragePath: row.person_image_storage_path,
  reporterUserId: row.reporter_user_id,
  reporterUserName: row.reporter_user_name,
  cityId: row.city_id,
  cityName: row.city_name,
  personName: row.person_name,
  reason: parseReason(row.reason),
  notes: row.notes,
  status: parseStatus(row.status),
  adminNotes: row.admin_notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  currentOfficialImageUrl: currentOfficialImageUrl ?? row.person_image_url,
});

export type CreateFamousPersonPhotoReportInput = {
  personId: string;
  personImageUrl: string;
  personImageStoragePath?: string | null;
  reporterUserId: string;
  reporterUserName: string | null;
  cityId: string;
  cityName: string;
  personName: string;
  reason: FamousPersonPhotoReportReason;
  notes?: string;
};

export const createFamousPersonPhotoReport = async (
  input: CreateFamousPersonPhotoReportInput,
): Promise<void> => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('Autenticazione richiesta.');
  if (input.reporterUserId !== user.id) {
    throw new Error('Identità utente non valida.');
  }

  const { data: person, error: personError } = await supabase
    .from('city_people')
    .select('id, status, image_url, image_storage_path, city_id, name')
    .eq('id', input.personId)
    .single();
  if (personError) throw personError;

  if (person.status !== 'published') {
    throw new Error('Si può segnalare abuso solo su una foto ufficiale pubblicata.');
  }
  if (!person.image_url?.trim()) {
    throw new Error('Il personaggio non ha una foto ufficiale pubblicata.');
  }
  if (person.city_id !== input.cityId) {
    throw new Error('Città non coerente con il personaggio.');
  }

  const [{ data: city, error: cityError }, { data: profile, error: profileError }] =
    await Promise.all([
      supabase.from('cities').select('name').eq('id', person.city_id).single(),
      supabase.from('profiles').select('name').eq('id', user.id).single(),
    ]);
  if (cityError) throw cityError;
  if (profileError) throw profileError;

  const reporterName = profile.name?.trim() ?? '';
  if (!reporterName) {
    throw new Error('Nome profilo obbligatorio.');
  }

  const insertRow: Database['public']['Tables']['famous_person_photo_reports']['Insert'] = {
    person_id: input.personId,
    person_image_url: person.image_url,
    person_image_storage_path: person.image_storage_path ?? null,
    reporter_user_id: input.reporterUserId,
    reporter_user_name: reporterName,
    city_id: person.city_id,
    city_name: city.name?.trim() ?? '',
    person_name: person.name?.trim() ?? '',
    reason: input.reason,
    notes: input.notes?.trim() || null,
    status: 'pending',
  };

  const { error } = await supabase.from('famous_person_photo_reports').insert(insertRow);
  if (error) throw error;
};

export const listFamousPersonPhotoReportsForAdmin = async (): Promise<
  FamousPersonPhotoReport[]
> => {
  const { data: reports, error } = await supabase
    .from('famous_person_photo_reports')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (!reports?.length) return [];

  const personIds = [
    ...new Set(
      reports.map((r) => r.person_id).filter((id): id is string => typeof id === 'string'),
    ),
  ];
  const urlById = new Map<string, string | null>();
  if (personIds.length > 0) {
    const { data: people, error: peopleError } = await supabase
      .from('city_people')
      .select('id, image_url')
      .in('id', personIds);
    if (peopleError) throw peopleError;
    for (const person of people ?? []) {
      urlById.set(person.id, person.image_url);
    }
  }

  return reports.map((row) =>
    mapReport(row, row.person_id ? urlById.get(row.person_id) : undefined),
  );
};

export const getPendingFamousPersonPhotoReportCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('famous_person_photo_reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  if (error) throw error;
  return count ?? 0;
};

type ReportStatusWriterTarget = 'in_review' | 'rejected';

export const updateFamousPersonPhotoReportStatus = async (
  reportId: string,
  status: ReportStatusWriterTarget,
  adminNotes?: string,
): Promise<void> => {
  const { data: existing, error: fetchError } = await supabase
    .from('famous_person_photo_reports')
    .select('id, status, updated_at')
    .eq('id', reportId)
    .single();
  if (fetchError) throw fetchError;

  const current = parseStatus(existing.status);
  if (!isModeratable(current)) {
    throw new Error('Questa segnalazione abuso è già conclusa.');
  }
  if (status === 'in_review' && current !== 'pending') {
    throw new Error('Solo le segnalazioni «Da gestire» possono passare In revisione.');
  }

  const updatePayload: Database['public']['Tables']['famous_person_photo_reports']['Update'] = {
    status,
  };
  if (adminNotes !== undefined) {
    updatePayload.admin_notes = adminNotes.trim() || null;
  }

  const { data: updated, error } = await supabase
    .from('famous_person_photo_reports')
    .update(updatePayload)
    .eq('id', reportId)
    .eq('status', current)
    .eq('updated_at', existing.updated_at)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!updated) {
    throw new Error(
      'Conflitto di moderazione: la segnalazione abuso non è più nello stato previsto.',
    );
  }
};

export const markFamousPersonPhotoReportInReview = async (reportId: string): Promise<void> => {
  await updateFamousPersonPhotoReportStatus(reportId, 'in_review');
};

export const rejectFamousPersonPhotoReport = async (
  reportId: string,
  adminNotes?: string,
): Promise<void> => {
  await updateFamousPersonPhotoReportStatus(reportId, 'rejected', adminNotes);
};

type BlockPhotoReportRpcResult = {
  ok: boolean;
  cleared_storage_path: string | null;
};

function parseBlockPhotoReportRpcResult(data: unknown): BlockPhotoReportRpcResult {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Risposta RPC block photo report non valida.');
  }
  const record = data as Record<string, unknown>;
  if (record.ok !== true) {
    throw new Error('Blocco foto segnalata non riuscito.');
  }
  if ('cleared_storage_path' in record) {
    const val = record.cleared_storage_path;
    if (val !== null && typeof val !== 'string') {
      throw new Error('Formato cleared_storage_path non valido nella risposta RPC.');
    }
    return { ok: true, cleared_storage_path: val };
  }
  throw new Error('cleared_storage_path mancante nella risposta RPC.');
}

/**
 * photo_blocked: rimuove atomicamente la foto ufficiale SOLO se coincide con quella segnalata.
 * Storage cleanup è best-effort post-commit (fuori dalla transazione PostgreSQL).
 */
export const blockFamousPersonPhotoReportAndClearOfficialPhoto = async (
  reportId: string,
  personId: string,
  adminNotes?: string,
): Promise<void> => {
  const { data, error } = await supabase.rpc('block_famous_person_photo_report_and_clear', {
    p_report_id: reportId,
    p_person_id: personId,
    p_admin_notes: adminNotes === undefined ? undefined : adminNotes.trim() || null,
  });
  if (error) throw error;

  const result = parseBlockPhotoReportRpcResult(data);
  const storagePathToDelete = result.cleared_storage_path;
  if (!storagePathToDelete) return;

  try {
    await deletePublicMediaByStoragePath(storagePathToDelete);
  } catch (cleanupErr) {
    console.error(
      '[blockFamousPersonPhotoReportAndClearOfficialPhoto] storage cleanup failed:',
      storagePathToDelete,
      cleanupErr,
    );
  }
};
