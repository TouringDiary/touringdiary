import { User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

/**
 * Verifica se un profilo esiste nel database prima del merge.
 */
export const checkProfileExistsAsync = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error("[suitcaseService] Errore verifica profilo:", error);
    return false;
  }
  return !!data;
};

/**
 * Crea un profilo utente base di emergenza (previene violazioni di FK silenziose).
 */
export const createEmergencyProfileAsync = async (userId: string, email: string, name: string): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email: email,
      name: name,
      role: 'user',
      status: 'active'
    });

  if (error) throw error;
};

/**
 * Recupera l'utente autenticato corrente.
 */
export const getAuthUserAsync = async (): Promise<User | null> => {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
};
