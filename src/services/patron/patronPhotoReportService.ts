import type { Database } from '@/types/database';
import type {
  PatronPhotoReport,
  PatronPhotoReportReason,
  PatronPhotoReportStatus,
} from '@/types/models/patronGallery';
import { supabase } from '../supabaseClient';
import { deleteCityPatronGalleryPhoto } from './cityPatronGalleryService';

type ReportRow = Database['public']['Tables']['patron_photo_reports']['Row'];

const isPatronPhotoReportStatus = (value: string): value is PatronPhotoReportStatus =>
  value === 'pending' || value === 'in_review' || value === 'photo_blocked' || value === 'rejected';

const parsePatronPhotoReportStatus = (value: string): PatronPhotoReportStatus => {
  if (isPatronPhotoReportStatus(value)) return value;
  throw new Error(`Stato report abuso non valido ricevuto dal database: ${value}`);
};

const isPatronPhotoReportReason = (value: string): value is PatronPhotoReportReason =>
  value === 'copyright' ||
  value === 'other_rights' ||
  value === 'unauthorized' ||
  value === 'other';

const parsePatronPhotoReportReason = (value: string): PatronPhotoReportReason => {
  if (isPatronPhotoReportReason(value)) return value;
  throw new Error(`Motivo report abuso non valido ricevuto dal database: ${value}`);
};

const isModeratableReportStatus = (
  status: PatronPhotoReportStatus,
): status is 'pending' | 'in_review' => status === 'pending' || status === 'in_review';

const mapReport = (row: ReportRow, galleryPhotoUrl?: string): PatronPhotoReport => ({
  id: row.id,
  galleryPhotoId: row.gallery_photo_id,
  galleryImageUrl: row.gallery_image_url ?? galleryPhotoUrl ?? '',
  galleryStoragePath: row.gallery_storage_path ?? null,
  reporterUserId: row.reporter_user_id,
  reporterUserName: row.reporter_user_name,
  cityId: row.city_id,
  cityName: row.city_name,
  patronName: row.patron_name,
  reason: parsePatronPhotoReportReason(row.reason),
  notes: row.notes,
  status: parsePatronPhotoReportStatus(row.status),
  adminNotes: row.admin_notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  galleryPhotoUrl: galleryPhotoUrl ?? row.gallery_image_url ?? undefined,
});

export type CreatePatronPhotoReportInput = {
  galleryPhotoId: string;
  galleryImageUrl: string;
  galleryStoragePath?: string | null;
  reporterUserId: string;
  reporterUserName: string | null;
  cityId: string;
  cityName: string;
  patronName: string;
  reason: PatronPhotoReportReason;
  notes?: string;
};

export const createPatronPhotoReport = async (
  input: CreatePatronPhotoReportInput,
): Promise<void> => {
  const insertRow: Database['public']['Tables']['patron_photo_reports']['Insert'] = {
    gallery_photo_id: input.galleryPhotoId,
    gallery_image_url: input.galleryImageUrl,
    gallery_storage_path: input.galleryStoragePath ?? null,
    reporter_user_id: input.reporterUserId,
    reporter_user_name: input.reporterUserName,
    city_id: input.cityId,
    city_name: input.cityName,
    patron_name: input.patronName,
    reason: input.reason,
    notes: input.notes?.trim() || null,
    status: 'pending',
  };
  const { error } = await supabase.from('patron_photo_reports').insert(insertRow);

  if (error) throw error;
};

export const listPatronPhotoReportsForAdmin = async (): Promise<PatronPhotoReport[]> => {
  const { data: reports, error } = await supabase
    .from('patron_photo_reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!reports?.length) return [];

  const photoIds = [
    ...new Set(reports.map((r) => r.gallery_photo_id).filter((id): id is string => Boolean(id))),
  ];

  const urlById = new Map<string, string>();
  if (photoIds.length > 0) {
    const { data: photos, error: photosError } = await supabase
      .from('city_patron_gallery')
      .select('id, image_url')
      .in('id', photoIds);

    if (photosError) throw photosError;
    for (const photo of photos ?? []) {
      urlById.set(photo.id, photo.image_url);
    }
  }

  return reports.map((row) =>
    mapReport(row, row.gallery_photo_id ? urlById.get(row.gallery_photo_id) : undefined),
  );
};

export const getPendingPatronPhotoReportCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('patron_photo_reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  if (error) throw error;
  return count ?? 0;
};

/** Target ammessi dal writer generico (senza rimozione gallery). */
type ReportStatusWriterTarget = 'in_review' | 'rejected';

/**
 * Writer di status senza side-effect gallery.
 * `photo_blocked` NON è ammesso qui: richiede `blockPatronPhotoReportAndRemovePhoto`.
 */
export const updatePatronPhotoReportStatus = async (
  reportId: string,
  status: ReportStatusWriterTarget,
  adminNotes?: string,
): Promise<void> => {
  const { data: existing, error: fetchError } = await supabase
    .from('patron_photo_reports')
    .select('id, status')
    .eq('id', reportId)
    .single();
  if (fetchError) throw fetchError;

  const current = parsePatronPhotoReportStatus(existing.status);
  if (!isModeratableReportStatus(current)) {
    throw new Error('Questa segnalazione abuso è già conclusa.');
  }
  if (status === 'in_review' && current !== 'pending') {
    throw new Error('Solo le segnalazioni «Da gestire» possono passare In revisione.');
  }
  // rejected: consentito da pending e da in_review.

  // adminNotes fornito → trim / null se vuoto; omesso → non toccare note esistenti
  // (es. markPatronPhotoReportInReview).
  const updatePayload: Database['public']['Tables']['patron_photo_reports']['Update'] = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (adminNotes !== undefined) {
    updatePayload.admin_notes = adminNotes.trim() || null;
  }

  const { data: updated, error } = await supabase
    .from('patron_photo_reports')
    .update(updatePayload)
    .eq('id', reportId)
    .eq('status', current)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!updated) {
    throw new Error(
      'Conflitto di moderazione: la segnalazione abuso non è più nello stato previsto.',
    );
  }
};

export const markPatronPhotoReportInReview = async (reportId: string): Promise<void> => {
  await updatePatronPhotoReportStatus(reportId, 'in_review');
};

export const rejectPatronPhotoReport = async (
  reportId: string,
  adminNotes?: string,
): Promise<void> => {
  await updatePatronPhotoReportStatus(reportId, 'rejected', adminNotes);
};

/**
 * photo_blocked: unico percorso che chiude il report e rimuove la foto gallery.
 *
 * Ordine applicativo (best effort, non transazione DB):
 * 1) valida report moderabile + coerenza reportId ↔ galleryPhotoId;
 * 2) CAS status → photo_blocked;
 * 3) `deleteCityPatronGalleryPhoto` (DELETE riga DB, poi Storage).
 *
 * Contratto reale della delete (senza probe Storage aggiuntivi):
 * - fallimento prima/durante DELETE DB → riga ancora presente → rollback status;
 * - DELETE DB ok + Storage fallito → throw con riga già assente → si lascia photo_blocked
 *   (la gallery SoT non espone più la foto; eventuale orphan Storage va gestito a parte);
 * - foto già assente → la delete non throw → successo.
 *
 * Limite: l’assenza della riga DB non certifica la rimozione Storage; non si interroga
 * Storage qui (nessuna API affidabile nel percorso senza side-effect fuori scope).
 */
export const blockPatronPhotoReportAndRemovePhoto = async (
  reportId: string,
  galleryPhotoId: string,
  adminNotes?: string,
): Promise<void> => {
  const { data: report, error: fetchError } = await supabase
    .from('patron_photo_reports')
    .select('id, status, gallery_photo_id, admin_notes')
    .eq('id', reportId)
    .single();
  if (fetchError) throw fetchError;

  const previousStatus = parsePatronPhotoReportStatus(report.status);
  if (!isModeratableReportStatus(previousStatus)) {
    throw new Error('Questa segnalazione abuso è già conclusa.');
  }
  if (!report.gallery_photo_id) {
    throw new Error('La segnalazione non è più associata a una foto in gallery.');
  }
  if (report.gallery_photo_id !== galleryPhotoId) {
    throw new Error('La foto indicata non corrisponde a quella associata a questa segnalazione.');
  }

  const previousAdminNotes = report.admin_notes;

  // photo_blocked solo qui (non tramite updatePatronPhotoReportStatus).
  const blockPayload: Database['public']['Tables']['patron_photo_reports']['Update'] = {
    status: 'photo_blocked',
    updated_at: new Date().toISOString(),
  };
  if (adminNotes !== undefined) {
    blockPayload.admin_notes = adminNotes.trim() || null;
  }

  const { data: blocked, error: blockError } = await supabase
    .from('patron_photo_reports')
    .update(blockPayload)
    .eq('id', reportId)
    .eq('status', previousStatus)
    .select('id')
    .maybeSingle();
  if (blockError) throw blockError;
  if (!blocked) {
    throw new Error(
      'Conflitto di moderazione: la segnalazione abuso non è più nello stato previsto.',
    );
  }

  try {
    await deleteCityPatronGalleryPhoto(galleryPhotoId);
  } catch (err) {
    const original =
      err instanceof Error ? err : new Error('Eliminazione foto gallery non riuscita.');

    const { data: galleryRow, error: galleryCheckError } = await supabase
      .from('city_patron_gallery')
      .select('id')
      .eq('id', galleryPhotoId)
      .maybeSingle();

    if (galleryCheckError) {
      throw new Error(
        `${original.message} Il report è «Foto bloccata»; verifica gallery/Storage (controllo presenza riga fallito).`,
        { cause: original },
      );
    }

    // Riga assente: non riaprire il report (gallery SoT senza foto). Storage non verificato qui.
    if (!galleryRow) {
      throw new Error(
        `${original.message} Il report resta «Foto bloccata»; riga gallery assente (Storage non verificato in questo percorso).`,
        { cause: original },
      );
    }

    const rollbackFailures: unknown[] = [];
    try {
      const { data: rolledBack, error: rollbackError } = await supabase
        .from('patron_photo_reports')
        .update({
          status: previousStatus,
          admin_notes: previousAdminNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId)
        .eq('status', 'photo_blocked')
        .select('id')
        .maybeSingle();
      if (rollbackError) throw rollbackError;
      if (!rolledBack) {
        throw new Error(
          'Rollback stato report non riuscito: il report non è più in «Foto bloccata».',
        );
      }
    } catch (rollbackErr) {
      console.error(
        '[blockPatronPhotoReportAndRemovePhoto] rollback status failed:',
        reportId,
        rollbackErr,
      );
      rollbackFailures.push(rollbackErr);
    }

    if (rollbackFailures.length > 0) {
      throw new Error(
        `${original.message} Il report è restato «Foto bloccata» con foto ancora in gallery; rollback stato fallito.`,
        { cause: original },
      );
    }

    throw new Error(
      `${original.message} Lo stato del report è stato ripristinato; la foto è ancora in gallery.`,
      { cause: original },
    );
  }
};
