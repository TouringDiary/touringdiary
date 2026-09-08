import type { Database } from '@/types/database';
import type {
  FamousPersonModerationStatus,
  FamousPersonPhotoSuggestion,
} from '@/types/models/famousPersonCommunity';
import { deletePublicMediaByStoragePath, uploadPublicMediaDetailed } from '../mediaService';
import { supabase } from '../supabaseClient';

type SuggestionRow = Database['public']['Tables']['famous_person_photo_suggestions']['Row'];

const isStatus = (value: string): value is FamousPersonModerationStatus =>
  value === 'pending' || value === 'in_review' || value === 'accepted' || value === 'rejected';

const parseStatus = (value: string): FamousPersonModerationStatus => {
  if (isStatus(value)) return value;
  throw new Error(`Stato suggestion foto non valido: ${value}`);
};

const isModeratable = (status: FamousPersonModerationStatus): status is 'pending' | 'in_review' =>
  status === 'pending' || status === 'in_review';

const normalizeOptionalAdminNotes = (adminNotes: string | null | undefined): string | null => {
  if (adminNotes == null) return null;
  const trimmed = adminNotes.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const mapSuggestion = (row: SuggestionRow): FamousPersonPhotoSuggestion => ({
  id: row.id,
  userId: row.user_id,
  userName: row.user_name,
  cityId: row.city_id,
  cityName: row.city_name,
  personId: row.person_id,
  personName: row.person_name,
  notes: row.notes,
  rightsConfirmed: row.rights_confirmed,
  imageUrl: row.image_url,
  storagePath: row.storage_path,
  status: parseStatus(row.status),
  adminNotes: row.admin_notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export type CreateFamousPersonPhotoSuggestionInput = {
  userId: string;
  personId: string;
  notes?: string;
  rightsConfirmed: boolean;
  file: File;
};

export const createFamousPersonPhotoSuggestion = async (
  input: CreateFamousPersonPhotoSuggestionInput,
): Promise<string> => {
  if (!input.file) {
    throw new Error('Almeno una fotografia è obbligatoria.');
  }
  if (!input.rightsConfirmed) {
    throw new Error('Conferma i diritti sulla fotografia prima di inviare.');
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('Autenticazione richiesta.');
  if (input.userId !== user.id) {
    throw new Error('Identità utente non valida per l’upload.');
  }

  const folder = `famous_person_photo_suggestions/${user.id}`;
  let uploadedPath: string | null = null;

  try {
    const uploaded = await uploadPublicMediaDetailed(input.file, folder);
    if (!uploaded) {
      throw new Error('Errore upload fotografia.');
    }
    uploadedPath = uploaded.storagePath;

    const { data, error } = await supabase.rpc('submit_famous_person_photo_suggestion', {
      p_person_id: input.personId,
      p_rights_confirmed: input.rightsConfirmed,
      p_image_url: uploaded.publicUrl,
      p_storage_path: uploaded.storagePath,
      p_notes: input.notes?.trim() || null,
    });
    if (error) throw error;
    if (!data || typeof data !== 'string') {
      throw new Error('Invio segnalazione foto non riuscito.');
    }
    uploadedPath = null;
    return data;
  } catch (err) {
    if (uploadedPath) {
      try {
        await deletePublicMediaByStoragePath(uploadedPath);
      } catch (cleanupErr) {
        console.error(
          '[createFamousPersonPhotoSuggestion] cleanup upload failed:',
          uploadedPath,
          cleanupErr,
        );
      }
    }
    throw err instanceof Error ? err : new Error('Invio segnalazione foto non riuscito.');
  }
};

export const listFamousPersonPhotoSuggestionsForAdmin = async (): Promise<
  FamousPersonPhotoSuggestion[]
> => {
  const { data, error } = await supabase
    .from('famous_person_photo_suggestions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapSuggestion);
};

export const getPendingFamousPersonPhotoSuggestionCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('famous_person_photo_suggestions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  if (error) throw error;
  return count ?? 0;
};

export const markFamousPersonPhotoSuggestionInReview = async (
  suggestionId: string,
): Promise<void> => {
  const { data: suggestion, error: fetchError } = await supabase
    .from('famous_person_photo_suggestions')
    .select('id, status, updated_at')
    .eq('id', suggestionId)
    .single();
  if (fetchError) throw fetchError;
  if (parseStatus(suggestion.status) !== 'pending') {
    throw new Error('Solo le segnalazioni «Da gestire» possono passare In revisione.');
  }

  const { data: updated, error } = await supabase
    .from('famous_person_photo_suggestions')
    .update({ status: 'in_review' })
    .eq('id', suggestionId)
    .eq('status', 'pending')
    .eq('updated_at', suggestion.updated_at)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!updated) {
    throw new Error('Conflitto di moderazione: la segnalazione non è più in «Da gestire».');
  }
};

export const rejectFamousPersonPhotoSuggestion = async (
  suggestionId: string,
  adminNotes?: string,
): Promise<void> => {
  const { data: suggestion, error: fetchError } = await supabase
    .from('famous_person_photo_suggestions')
    .select('*')
    .eq('id', suggestionId)
    .single();
  if (fetchError) throw fetchError;

  const originalStatus = parseStatus(suggestion.status);
  if (!isModeratable(originalStatus)) {
    throw new Error('Questa segnalazione è già stata conclusa.');
  }

  const { data: updated, error } = await supabase
    .from('famous_person_photo_suggestions')
    .update({
      status: 'rejected',
      admin_notes: normalizeOptionalAdminNotes(adminNotes),
    })
    .eq('id', suggestionId)
    .eq('status', originalStatus)
    .eq('updated_at', suggestion.updated_at)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!updated) {
    throw new Error('Conflitto di moderazione: la segnalazione è già in elaborazione o moderata.');
  }
};

/**
 * Accetta foto → diventa unica foto ufficiale su city_people.
 * Sostituzione atomica gestita a livello database via RPC PostgreSQL.
 * La foto precedente viene rimossa da Storage se `image_storage_path` è noto (best effort).
 */
export const acceptFamousPersonPhotoSuggestion = async (
  suggestionId: string,
  adminNotes?: string,
): Promise<void> => {
  const { data, error } = await supabase.rpc('accept_famous_person_photo_suggestion', {
    p_suggestion_id: suggestionId,
    p_admin_notes: adminNotes?.trim() || null,
  });

  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error('Aggiornamento foto ufficiale non riuscito.');
  }

  const isObject = (val: unknown): val is Record<string, unknown> =>
    typeof val === 'object' && val !== null && !Array.isArray(val);

  if (!isObject(data) || data.ok !== true) {
    throw new Error('La risposta RPC di accettazione foto non è valida.');
  }

  const previousStoragePath =
    typeof data.previous_storage_path === 'string'
      ? data.previous_storage_path
      : null;

  // Fase 3: Rimozione della fotografia precedente (Best effort, non deve fare rollback se fallisce)
  if (previousStoragePath) {
    try {
      await deletePublicMediaByStoragePath(previousStoragePath);
    } catch (cleanupErr) {
      console.error(
        '[acceptFamousPersonPhotoSuggestion] previous official photo cleanup failed:',
        previousStoragePath,
        cleanupErr,
      );
    }
  }
};
