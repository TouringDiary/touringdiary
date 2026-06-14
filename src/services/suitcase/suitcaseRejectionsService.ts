import { supabase } from '../supabaseClient';
import { SuitcaseRejection } from '../../types/suitcase';
import { normalizeItemName } from '../../utils/tagDerivation';

/**
 * SERVICE: Suitcase Rejections
 * Gestisce la blacklist persistente dei suggerimenti AI rifiutati dall'utente.
 * 
 * Invariante di Dominio: 
 * Tutti i nomi salvati e confrontati in questa tabella sono normalizzati tramite 
 * normalizeItemName() per garantire l'integrità del vincolo UNIQUE e l'efficacia 
 * dei filtri AI.
 */

/**
 * Aggiunge un oggetto alla blacklist dei suggerimenti rifiutati.
 * Applica automaticamente la normalizzazione al nome prima della persistenza.
 */
export const addRejectionAsync = async (
  suitcaseId: string,
  name: string,
  category: string,
  context?: string | null
): Promise<SuitcaseRejection> => {
  // Preserviamo la capitalizzazione per il ripristino, ma normalizziamo il resto (accenti, spazi, ecc.)
  const processedName = normalizeItemName(name, { preserveCase: true });

  const { data, error } = await supabase
    .from('suitcase_rejections')
    .insert({
      suitcase_id: suitcaseId,
      name: processedName,
      category,
      ai_suggestion_context: context ?? null
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Rimuove un oggetto dalla blacklist.
 */
export const removeRejectionAsync = async (rejectionId: string): Promise<void> => {
  const { error } = await supabase
    .from('suitcase_rejections')
    .delete()
    .eq('id', rejectionId);

  if (error) throw error;
};

/**
 * Recupera tutti i rifiuti associati a una specifica valigia.
 */
export const getRejectionsBySuitcaseAsync = async (
  suitcaseId: string
): Promise<SuitcaseRejection[]> => {
  const { data, error } = await supabase
    .from('suitcase_rejections')
    .select('*')
    .eq('suitcase_id', suitcaseId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Verifica se un oggetto è già presente nella blacklist di una valigia.
 * Applica internamente la normalizzazione per il confronto case-insensitive.
 */
export const existsRejectionAsync = async (
  suitcaseId: string,
  name: string
): Promise<boolean> => {
  const processedName = normalizeItemName(name, { preserveCase: true });

  const { data, error } = await supabase
    .from('suitcase_rejections')
    .select('id')
    .eq('suitcase_id', suitcaseId)
    .ilike('name', processedName)
    .maybeSingle();

  if (error) throw error;
  return !!data;
};

/**
 * Rimuove un oggetto dalla blacklist usando il nome e la valigia.
 * Fondamentale per l'Undo del Reject (mantiene coerenza tra valigia e blacklist).
 */
export const removeRejectionByNameAsync = async (
  suitcaseId: string,
  name: string
): Promise<void> => {
  const processedName = normalizeItemName(name, { preserveCase: true });

  const { error } = await supabase
    .from('suitcase_rejections')
    .delete()
    .eq('suitcase_id', suitcaseId)
    .ilike('name', processedName);

  if (error) throw error;
};
