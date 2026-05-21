import { supabase } from '../supabaseClient';
import { SuitcaseItem } from '../../types/suitcase';

/**
 * Aggiunge un singolo item a una valigia.
 */
export const addSuitcaseItemAsync = async (
  suitcaseId: string,
  name: string,
  category: string,
  metadata: Partial<SuitcaseItem> = {}
): Promise<any> => {
  const { data, error } = await supabase
    .from('suitcase_items')
    .insert({
      id: metadata.id || undefined,
      suitcase_id: suitcaseId,
      name,
      category,
      is_checked: metadata.is_checked ?? false,
      is_ai_suggestion: metadata.is_ai_suggestion ?? false,
      quantity: metadata.quantity ?? 1,
      ai_suggestion_context: metadata.ai_suggestion_context || null,
      suggested_at: metadata.suggested_at || null
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Aggiunge più item in bulk a una valigia.
 */
export const addSuitcaseItemsBulkAsync = async (rows: any[]): Promise<any[]> => {
  const { data, error } = await supabase
    .from('suitcase_items')
    .insert(rows)
    .select();

  if (error) throw error;
  return data || [];
};

/**
 * Aggiorna le proprietà di un item interno (es. is_checked, quantity).
 */
export const updateSuitcaseItemAsync = async (itemId: string, updates: Partial<SuitcaseItem>): Promise<void> => {
  const { error } = await supabase
    .from('suitcase_items')
    .update(updates)
    .eq('id', itemId);

  if (error) throw error;
};

/**
 * Elimina un item da una valigia.
 */
export const deleteSuitcaseItemAsync = async (itemId: string): Promise<void> => {
  const { error } = await supabase
    .from('suitcase_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
};
