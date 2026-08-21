import type { Database, Json } from '@/types/database';
import type {
  CityPatronGalleryPhoto,
  PatronPhotoSuggestion,
  PatronPhotoSuggestionItem,
  PatronPhotoSuggestionItemStatus,
  PatronPhotoSuggestionStatus,
} from '@/types/models/patronGallery';
import { deletePublicMediaByStoragePath, uploadPublicMediaDetailed } from '../mediaService';
import { supabase } from '../supabaseClient';
import {
  addCityPatronGalleryPhotoFromApprovedSuggestion,
  deleteCityPatronGalleryPhoto,
} from './cityPatronGalleryService';

type SuggestionRow = Database['public']['Tables']['patron_photo_suggestions']['Row'];
type ItemRow = Database['public']['Tables']['patron_photo_suggestion_items']['Row'];

type SuggestionUploadItem = {
  image_url: string;
  storage_path: string;
  sort_order: number;
};

const isPatronPhotoSuggestionStatus = (value: string): value is PatronPhotoSuggestionStatus =>
  value === 'pending' || value === 'in_review' || value === 'accepted' || value === 'rejected';

const isPatronPhotoSuggestionItemStatus = (
  value: string,
): value is PatronPhotoSuggestionItemStatus =>
  value === 'pending' || value === 'approved' || value === 'rejected';

const isModeratableSuggestionStatus = (
  status: PatronPhotoSuggestionStatus,
): status is 'pending' | 'in_review' => status === 'pending' || status === 'in_review';

const normalizeOptionalAdminNotes = (adminNotes: string | null | undefined): string | null => {
  if (adminNotes == null) return null;
  const trimmed = adminNotes.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const parsePatronPhotoSuggestionStatus = (value: string): PatronPhotoSuggestionStatus => {
  if (isPatronPhotoSuggestionStatus(value)) return value;
  throw new Error(`Stato suggestion non valido ricevuto dal database: ${value}`);
};

const parsePatronPhotoSuggestionItemStatus = (value: string): PatronPhotoSuggestionItemStatus => {
  if (isPatronPhotoSuggestionItemStatus(value)) return value;
  throw new Error(`Stato item suggestion non valido ricevuto dal database: ${value}`);
};

const mapItem = (row: ItemRow): PatronPhotoSuggestionItem => ({
  id: row.id,
  suggestionId: row.suggestion_id,
  imageUrl: row.image_url,
  storagePath: row.storage_path,
  status: parsePatronPhotoSuggestionItemStatus(row.status),
  sortOrder: row.sort_order,
  createdAt: row.created_at,
});

const mapSuggestion = (
  row: SuggestionRow,
  items: PatronPhotoSuggestionItem[],
): PatronPhotoSuggestion => ({
  id: row.id,
  userId: row.user_id,
  userName: row.user_name,
  cityId: row.city_id,
  cityName: row.city_name,
  patronName: row.patron_name,
  notes: row.notes,
  rightsConfirmed: row.rights_confirmed,
  status: parsePatronPhotoSuggestionStatus(row.status),
  adminNotes: row.admin_notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  items,
});

export type CreatePatronPhotoSuggestionInput = {
  userId: string;
  cityId: string;
  notes?: string;
  rightsConfirmed: boolean;
  files: File[];
};

export const createPatronPhotoSuggestion = async (
  input: CreatePatronPhotoSuggestionInput,
): Promise<string> => {
  if (input.files.length === 0) {
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
  if (!user) {
    throw new Error('Autenticazione richiesta.');
  }
  // Path Storage e RPC vincolano auth.uid(); allinea input.userId alla sessione reale.
  if (input.userId !== user.id) {
    throw new Error('Identità utente non valida per l’upload.');
  }

  const uploadedItems: SuggestionUploadItem[] = [];
  const uploadedPaths: string[] = [];
  const folder = `patron_photo_suggestions/${user.id}`;

  // Cleanup solo dei path registrati in questa operazione; errori di delete non nascondono l'originale.
  const cleanupTemporaryUploads = async (): Promise<unknown[]> => {
    const failures: unknown[] = [];
    for (const path of uploadedPaths) {
      try {
        await deletePublicMediaByStoragePath(path);
      } catch (cleanupErr) {
        console.error('[createPatronPhotoSuggestion] cleanup upload failed:', path, cleanupErr);
        failures.push(cleanupErr);
      }
    }
    return failures;
  };

  try {
    for (let i = 0; i < input.files.length; i += 1) {
      const file = input.files[i];
      const uploaded = await uploadPublicMediaDetailed(file, folder);
      if (!uploaded) {
        throw new Error(`Errore upload fotografia ${i + 1}.`);
      }
      uploadedPaths.push(uploaded.storagePath);
      uploadedItems.push({
        image_url: uploaded.publicUrl,
        storage_path: uploaded.storagePath,
        sort_order: i,
      });
    }

    const { data, error } = await supabase.rpc('submit_patron_photo_suggestion', {
      p_city_id: input.cityId,
      p_rights_confirmed: input.rightsConfirmed,
      p_notes: input.notes?.trim() || null,
      p_items: uploadedItems.map(
        (item): Json => ({
          image_url: item.image_url,
          storage_path: item.storage_path,
          sort_order: item.sort_order,
        }),
      ),
    });

    if (error) throw error;
    if (!data || typeof data !== 'string') {
      throw new Error('Invio segnalazione non riuscito.');
    }
    return data;
  } catch (err) {
    const cleanupFailures = await cleanupTemporaryUploads();
    const original = err instanceof Error ? err : new Error('Invio segnalazione non riuscito.');
    if (cleanupFailures.length > 0) {
      throw new Error(
        `${original.message} Inoltre il cleanup degli upload temporanei è fallito (${cleanupFailures.length} file).`,
        { cause: original },
      );
    }
    throw original;
  }
};

export const listPatronPhotoSuggestionsForAdmin = async (): Promise<PatronPhotoSuggestion[]> => {
  const { data: suggestions, error } = await supabase
    .from('patron_photo_suggestions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!suggestions?.length) return [];

  const ids = suggestions.map((s) => s.id);
  const { data: items, error: itemsError } = await supabase
    .from('patron_photo_suggestion_items')
    .select('*')
    .in('suggestion_id', ids)
    .order('sort_order', { ascending: true });

  if (itemsError) throw itemsError;

  const itemsBySuggestion = new Map<string, PatronPhotoSuggestionItem[]>();
  for (const row of items ?? []) {
    const mapped = mapItem(row);
    const list = itemsBySuggestion.get(mapped.suggestionId) ?? [];
    list.push(mapped);
    itemsBySuggestion.set(mapped.suggestionId, list);
  }

  return suggestions.map((row) => mapSuggestion(row, itemsBySuggestion.get(row.id) ?? []));
};

export const getPendingPatronPhotoSuggestionCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('patron_photo_suggestions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  if (error) throw error;
  return count ?? 0;
};

/** pending → in_review (presa in carico). Non modifica gli item. */
export const markPatronPhotoSuggestionInReview = async (suggestionId: string): Promise<void> => {
  const { data: suggestion, error: fetchError } = await supabase
    .from('patron_photo_suggestions')
    .select('id, status, updated_at')
    .eq('id', suggestionId)
    .single();
  if (fetchError) throw fetchError;

  if (parsePatronPhotoSuggestionStatus(suggestion.status) !== 'pending') {
    throw new Error('Solo le segnalazioni «Da gestire» possono passare In revisione.');
  }

  const { data: updated, error } = await supabase
    .from('patron_photo_suggestions')
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

/**
 * Claim esclusivo = CAS verso uno status finale (`rejected` / `accepted`).
 * Un update di solo `admin_notes` che lascia `pending`|`in_review` NON è un lock:
 * un secondo admin che rilegge dopo il bump di `updated_at` può ancora moderare.
 *
 * Limite residuo (richiede intervento DB/RPC futuro): tra CAS finale e completamento
 * item/gallery esiste una finestra in cui lo status è finale ma gli side-effect no;
 * i rollback compensativi mitigano, non sostituiscono una transazione.
 */
export const rejectPatronPhotoSuggestion = async (
  suggestionId: string,
  adminNotes?: string,
): Promise<void> => {
  const { data: suggestion, error: fetchError } = await supabase
    .from('patron_photo_suggestions')
    .select('*')
    .eq('id', suggestionId)
    .single();
  if (fetchError) throw fetchError;

  const originalStatus = parsePatronPhotoSuggestionStatus(suggestion.status);
  if (!isModeratableSuggestionStatus(originalStatus)) {
    throw new Error('Questa segnalazione è già stata conclusa.');
  }

  const normalizedAdminNotes = normalizeOptionalAdminNotes(adminNotes);
  const originalAdminNotes = suggestion.admin_notes;
  const originalUpdatedAt = suggestion.updated_at;

  // Claim esclusivo: esce dagli status moderabili → nessun secondo admin può avviare moderazione.
  const { data: claimed, error: claimError } = await supabase
    .from('patron_photo_suggestions')
    .update({
      status: 'rejected',
      admin_notes: normalizedAdminNotes,
    })
    .eq('id', suggestionId)
    .eq('status', originalStatus)
    .eq('updated_at', originalUpdatedAt)
    .select('id, updated_at')
    .maybeSingle();
  if (claimError) throw claimError;
  if (!claimed) {
    throw new Error('Conflitto di moderazione: la segnalazione è già in elaborazione o moderata.');
  }
  const claimedUpdatedAt = claimed.updated_at;

  const { data: pendingItems, error: pendingFetchError } = await supabase
    .from('patron_photo_suggestion_items')
    .select('id')
    .eq('suggestion_id', suggestionId)
    .eq('status', 'pending');
  if (pendingFetchError) {
    await supabase
      .from('patron_photo_suggestions')
      .update({
        status: originalStatus,
        admin_notes: originalAdminNotes,
      })
      .eq('id', suggestionId)
      .eq('status', 'rejected')
      .eq('updated_at', claimedUpdatedAt);
    throw pendingFetchError;
  }

  const pendingItemIds = (pendingItems ?? []).map((item) => item.id);
  const rejectedItemIds: string[] = [];

  try {
    for (const itemId of pendingItemIds) {
      const { data: updatedItem, error: itemError } = await supabase
        .from('patron_photo_suggestion_items')
        .update({ status: 'rejected' })
        .eq('id', itemId)
        .eq('suggestion_id', suggestionId)
        .eq('status', 'pending')
        .select('id')
        .maybeSingle();
      if (itemError) throw itemError;
      if (!updatedItem) {
        throw new Error(
          'Conflitto di moderazione: un item non è più in stato pending durante il rifiuto.',
        );
      }
      rejectedItemIds.push(itemId);
    }
  } catch (err) {
    const rollbackFailures: unknown[] = [];

    for (const itemId of [...rejectedItemIds].reverse()) {
      try {
        const { error } = await supabase
          .from('patron_photo_suggestion_items')
          .update({ status: 'pending' })
          .eq('id', itemId)
          .eq('suggestion_id', suggestionId)
          .eq('status', 'rejected');
        if (error) throw error;
      } catch (cleanupErr) {
        console.error('[rejectPatronPhotoSuggestion] rollback item failed:', itemId, cleanupErr);
        rollbackFailures.push(cleanupErr);
      }
    }

    try {
      const { error } = await supabase
        .from('patron_photo_suggestions')
        .update({
          status: originalStatus,
          admin_notes: originalAdminNotes,
        })
        .eq('id', suggestionId)
        .eq('status', 'rejected')
        .eq('updated_at', claimedUpdatedAt);
      if (error) throw error;
    } catch (cleanupErr) {
      console.error(
        '[rejectPatronPhotoSuggestion] rollback suggestion status failed:',
        suggestionId,
        cleanupErr,
      );
      rollbackFailures.push(cleanupErr);
    }

    const original = err instanceof Error ? err : new Error('Rifiuto segnalazione non riuscito.');
    if (rollbackFailures.length > 0) {
      throw new Error(
        `${original.message} Inoltre il rollback compensativo del rifiuto è fallito (${rollbackFailures.length} step).`,
        { cause: original },
      );
    }
    throw original;
  }
};

export type ApprovePatronPhotoSuggestionItemsOptions = {
  adminNotes?: string;
  /** Didascalie opzionali per item approvati → `city_patron_gallery.caption` (NULL se assenti). */
  captionsByItemId?: Record<string, string | null | undefined>;
};

export const approvePatronPhotoSuggestionItems = async (
  suggestionId: string,
  approvedItemIds: string[],
  options?: ApprovePatronPhotoSuggestionItemsOptions,
): Promise<void> => {
  if (approvedItemIds.length === 0) {
    throw new Error('Seleziona almeno una fotografia da approvare.');
  }

  const uniqueApprovedIds = [...new Set(approvedItemIds)];
  const normalizedAdminNotes = normalizeOptionalAdminNotes(options?.adminNotes);
  const captionsByItemId = options?.captionsByItemId ?? {};

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) {
    throw new Error('Sessione admin non valida.');
  }

  const { data: suggestion, error: fetchError } = await supabase
    .from('patron_photo_suggestions')
    .select('*')
    .eq('id', suggestionId)
    .single();
  if (fetchError) throw fetchError;

  const originalSuggestionStatus = parsePatronPhotoSuggestionStatus(suggestion.status);
  if (!isModeratableSuggestionStatus(originalSuggestionStatus)) {
    throw new Error('Questa segnalazione è già stata conclusa.');
  }

  const { data: items, error: itemsError } = await supabase
    .from('patron_photo_suggestion_items')
    .select('*')
    .eq('suggestion_id', suggestionId);
  if (itemsError) throw itemsError;

  const suggestionItems = items ?? [];
  if (suggestionItems.length === 0) {
    throw new Error('La segnalazione non contiene fotografie da moderare.');
  }

  const itemsById = new Map(suggestionItems.map((item) => [item.id, item]));

  // Snapshot coerente: suggestion ancora moderabile ⇒ tutti gli item devono essere pending.
  for (const item of suggestionItems) {
    if (parsePatronPhotoSuggestionItemStatus(item.status) !== 'pending') {
      throw new Error(
        'Stato item incoerente: la segnalazione è ancora moderabile ma alcune fotografie risultano già moderate.',
      );
    }
  }

  const unknownIds = uniqueApprovedIds.filter((id) => !itemsById.has(id));
  if (unknownIds.length > 0) {
    throw new Error(
      'Uno o più ID fotografia non appartengono a questa segnalazione o non esistono.',
    );
  }

  const approvedSet = new Set(uniqueApprovedIds);
  const allApproved = suggestionItems.every((item) => approvedSet.has(item.id));
  const nextStatus: PatronPhotoSuggestionStatus = allApproved ? 'accepted' : 'rejected';
  const originalSuggestionAdminNotes = suggestion.admin_notes;
  const originalSuggestionUpdatedAt = suggestion.updated_at;

  type MutatedItem = { id: string; writtenStatus: 'approved' | 'rejected' };
  const createdGalleryPhotos: CityPatronGalleryPhoto[] = [];
  const mutatedItems: MutatedItem[] = [];
  let claimedUpdatedAt: string | null = null;

  const rollbackApprovalSideEffects = async (): Promise<unknown[]> => {
    const rollbackFailures: unknown[] = [];

    if (claimedUpdatedAt) {
      try {
        const { error } = await supabase
          .from('patron_photo_suggestions')
          .update({
            status: originalSuggestionStatus,
            admin_notes: originalSuggestionAdminNotes,
          })
          .eq('id', suggestionId)
          .eq('status', nextStatus)
          .eq('updated_at', claimedUpdatedAt);
        if (error) throw error;
      } catch (cleanupErr) {
        console.error(
          '[approvePatronPhotoSuggestionItems] rollback suggestion status failed:',
          suggestionId,
          cleanupErr,
        );
        rollbackFailures.push(cleanupErr);
      }
    }

    for (const mutated of [...mutatedItems].reverse()) {
      try {
        const { error } = await supabase
          .from('patron_photo_suggestion_items')
          .update({ status: 'pending' })
          .eq('id', mutated.id)
          .eq('suggestion_id', suggestionId)
          .eq('status', mutated.writtenStatus);
        if (error) throw error;
      } catch (cleanupErr) {
        console.error(
          '[approvePatronPhotoSuggestionItems] rollback item status failed:',
          mutated.id,
          cleanupErr,
        );
        rollbackFailures.push(cleanupErr);
      }
    }

    for (const photo of [...createdGalleryPhotos].reverse()) {
      try {
        await deleteCityPatronGalleryPhoto(photo.id);
      } catch (cleanupErr) {
        console.error(
          '[approvePatronPhotoSuggestionItems] rollback gallery photo failed:',
          photo.id,
          cleanupErr,
        );
        rollbackFailures.push(cleanupErr);
      }
    }

    return rollbackFailures;
  };

  try {
    // Claim esclusivo: CAS a status finale (accepted|rejected). Vedi nota su rejectPatronPhotoSuggestion.
    const { data: claimed, error: claimError } = await supabase
      .from('patron_photo_suggestions')
      .update({
        status: nextStatus,
        admin_notes: normalizedAdminNotes,
      })
      .eq('id', suggestionId)
      .eq('status', originalSuggestionStatus)
      .eq('updated_at', originalSuggestionUpdatedAt)
      .select('id, updated_at')
      .maybeSingle();
    if (claimError) throw claimError;
    if (!claimed) {
      throw new Error(
        'Conflitto di moderazione: la segnalazione è già in elaborazione o moderata.',
      );
    }
    claimedUpdatedAt = claimed.updated_at;

    for (const id of uniqueApprovedIds) {
      const item = itemsById.get(id);
      if (!item?.storage_path) {
        throw new Error(`Fotografia ${id} senza storage_path.`);
      }
      // Caption: normalizeCaption è responsabilità di addCityPatronGalleryPhotoFromApprovedSuggestion.
      const galleryPhoto = await addCityPatronGalleryPhotoFromApprovedSuggestion(
        suggestion.city_id,
        {
          id: item.id,
          storagePath: item.storage_path,
          caption: captionsByItemId[id],
        },
        user.id,
      );
      createdGalleryPhotos.push(galleryPhoto);
    }

    for (const id of uniqueApprovedIds) {
      const { data: updatedItem, error } = await supabase
        .from('patron_photo_suggestion_items')
        .update({ status: 'approved' })
        .eq('id', id)
        .eq('suggestion_id', suggestionId)
        .eq('status', 'pending')
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (!updatedItem) {
        throw new Error('Conflitto di moderazione: una fotografia non è più in stato pending.');
      }
      mutatedItems.push({ id, writtenStatus: 'approved' });
    }

    for (const item of suggestionItems) {
      if (!approvedSet.has(item.id)) {
        const { data: updatedItem, error } = await supabase
          .from('patron_photo_suggestion_items')
          .update({ status: 'rejected' })
          .eq('id', item.id)
          .eq('suggestion_id', suggestionId)
          .eq('status', 'pending')
          .select('id')
          .maybeSingle();
        if (error) throw error;
        if (!updatedItem) {
          throw new Error(
            'Conflitto di moderazione: una fotografia non approvata non è più in stato pending.',
          );
        }
        mutatedItems.push({ id: item.id, writtenStatus: 'rejected' });
      }
    }
  } catch (err) {
    const rollbackFailures = await rollbackApprovalSideEffects();
    const original =
      err instanceof Error ? err : new Error('Approvazione segnalazione non riuscita.');
    if (rollbackFailures.length > 0) {
      throw new Error(
        `${original.message} Inoltre il rollback compensativo è fallito (${rollbackFailures.length} step). Controllare gallery/item/suggestion.`,
        { cause: original },
      );
    }
    throw original;
  }
};
