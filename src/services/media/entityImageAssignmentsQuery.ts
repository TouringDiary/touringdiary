import { supabase } from '../supabaseClient';

/** Query `entity_image_assignments` con tipi Supabase ufficiali. */
export function entityImageAssignmentsQuery() {
  return supabase.from('entity_image_assignments');
}
