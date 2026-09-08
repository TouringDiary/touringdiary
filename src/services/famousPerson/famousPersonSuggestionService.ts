import { validateFamousPersonSuggestionInput } from '@/domain/city/famousPersonCommunityValidation';
import type { Database } from '@/types/database';
import type {
  FamousPersonModerationStatus,
  FamousPersonSuggestion,
} from '@/types/models/famousPersonCommunity';
import { supabase } from '../supabaseClient';

type SuggestionRow = Database['public']['Tables']['famous_person_suggestions']['Row'];

const isStatus = (value: string): value is FamousPersonModerationStatus =>
  value === 'pending' || value === 'in_review' || value === 'accepted' || value === 'rejected';

const parseStatus = (value: string): FamousPersonModerationStatus => {
  if (isStatus(value)) return value;
  throw new Error(`Stato suggestion personaggio non valido: ${value}`);
};

const isModeratable = (status: FamousPersonModerationStatus): status is 'pending' | 'in_review' =>
  status === 'pending' || status === 'in_review';

const normalizeOptionalAdminNotes = (adminNotes: string | null | undefined): string | null => {
  if (adminNotes == null) return null;
  const trimmed = adminNotes.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const mapSuggestion = (
  row: SuggestionRow,
  personMeta?: { status: string | null; image_url: string | null },
): FamousPersonSuggestion => {
  const personStatus =
    personMeta?.status === 'published' || personMeta?.status === 'draft' ? personMeta.status : null;
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    cityId: row.city_id,
    cityName: row.city_name,
    suggestedName: row.suggested_name,
    notes: row.notes,
    status: parseStatus(row.status),
    adminNotes: row.admin_notes,
    acceptedPersonId: row.accepted_person_id,
    acceptedPersonStatus: personStatus,
    acceptedPersonImageUrl: personMeta?.image_url ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export type CreateFamousPersonSuggestionInput = {
  userId: string;
  cityId: string;
  suggestedName: string;
  notes: string;
};

export const createFamousPersonSuggestion = async (
  input: CreateFamousPersonSuggestionInput,
): Promise<string> => {
  const validated = validateFamousPersonSuggestionInput({
    suggestedName: input.suggestedName,
    notes: input.notes,
  });
  if (!validated.ok) {
    throw new Error(validated.errors.join(' '));
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('Autenticazione richiesta.');
  if (input.userId !== user.id) {
    throw new Error('Identità utente non valida.');
  }

  const { data, error } = await supabase.rpc('submit_famous_person_suggestion', {
    p_city_id: input.cityId,
    p_suggested_name: validated.suggestedName,
    p_notes: validated.notes,
  });
  if (error) throw error;
  if (!data || typeof data !== 'string') {
    throw new Error('Invio suggerimento non riuscito.');
  }
  return data;
};

export const listFamousPersonSuggestionsForAdmin = async (): Promise<FamousPersonSuggestion[]> => {
  const { data, error } = await supabase
    .from('famous_person_suggestions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (!data?.length) return [];

  const personIds = [
    ...new Set(
      data
        .map((row) => row.accepted_person_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    ),
  ];

  const personMeta = new Map<string, { status: string | null; image_url: string | null }>();
  if (personIds.length > 0) {
    const { data: people, error: peopleError } = await supabase
      .from('city_people')
      .select('id, status, image_url')
      .in('id', personIds);
    if (peopleError) throw peopleError;
    for (const person of people ?? []) {
      personMeta.set(person.id, { status: person.status, image_url: person.image_url });
    }
  }

  return data.map((row) =>
    mapSuggestion(row, row.accepted_person_id ? personMeta.get(row.accepted_person_id) : undefined),
  );
};

export const getPendingFamousPersonSuggestionCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('famous_person_suggestions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  if (error) throw error;
  return count ?? 0;
};

export const markFamousPersonSuggestionInReview = async (suggestionId: string): Promise<void> => {
  const { data: suggestion, error: fetchError } = await supabase
    .from('famous_person_suggestions')
    .select('id, status, updated_at')
    .eq('id', suggestionId)
    .single();
  if (fetchError) throw fetchError;
  if (parseStatus(suggestion.status) !== 'pending') {
    throw new Error('Solo le segnalazioni «Da gestire» possono passare In revisione.');
  }

  const { data: updated, error } = await supabase
    .from('famous_person_suggestions')
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

export const rejectFamousPersonSuggestion = async (
  suggestionId: string,
  adminNotes?: string,
): Promise<void> => {
  const { data: suggestion, error: fetchError } = await supabase
    .from('famous_person_suggestions')
    .select('*')
    .eq('id', suggestionId)
    .single();
  if (fetchError) throw fetchError;

  const originalStatus = parseStatus(suggestion.status);
  if (!isModeratable(originalStatus)) {
    throw new Error('Questa segnalazione è già stata conclusa.');
  }

  const { data: updated, error } = await supabase
    .from('famous_person_suggestions')
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
 * Accetta suggestion → crea city_people in DRAFT (non pubblicato) e claima la suggestion.
 * Eseguito atomicamente via RPC PostgreSQL per prevenire inconsistenze e race conditions.
 */
export const acceptFamousPersonSuggestion = async (
  suggestionId: string,
  adminNotes?: string,
): Promise<{ personId: string }> => {
  const { data, error } = await supabase.rpc('accept_famous_person_suggestion', {
    p_suggestion_id: suggestionId,
    p_admin_notes: adminNotes?.trim() || null,
  });

  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error('Impossibile accettare il suggerimento (nessun ID restituito).');
  }

  return { personId: data };
};

export const setAcceptedFamousPersonEditorialStatus = async (
  suggestionId: string,
  nextStatus: 'draft' | 'published',
): Promise<void> => {
  const { data: suggestion, error: fetchError } = await supabase
    .from('famous_person_suggestions')
    .select('id, status, accepted_person_id')
    .eq('id', suggestionId)
    .single();
  if (fetchError) throw fetchError;
  if (parseStatus(suggestion.status) !== 'accepted' || !suggestion.accepted_person_id) {
    throw new Error(
      'Solo una suggestion accettata con personaggio collegato può cambiare stato editoriale.',
    );
  }

  const { error } = await supabase.rpc('set_famous_person_editorial_status', {
    p_person_id: suggestion.accepted_person_id,
    p_status: nextStatus,
  });

  if (error) {
    throw error;
  }
};
