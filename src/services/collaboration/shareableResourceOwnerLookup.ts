import type { SharedResourceKind } from '@/domain/collaboration';
import { supabase } from '@/services/supabaseClient';

/** Proprietario (`user_id`) dell'entità sottostante (Diario, Valigia, Template utente). */
export async function resolveResourceOwnerId(
  kind: SharedResourceKind,
  resourceId: string
): Promise<string | null> {
  if (kind === 'diary') {
    const { data } = await supabase
      .from('itineraries')
      .select('user_id')
      .eq('id', resourceId)
      .maybeSingle();
    return data?.user_id ?? null;
  }

  const { data } = await supabase
    .from('suitcases')
    .select('user_id')
    .eq('id', resourceId)
    .maybeSingle();
  return data?.user_id ?? null;
}
