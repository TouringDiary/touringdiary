/**
 * Ripara assignment gallery Patrono mancanti (service role, no sessione admin).
 *   npx tsx scripts/repair_patron_gallery_assignments.ts
 *   npx tsx scripts/repair_patron_gallery_assignments.ts --execute
 */

import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { runPatronGalleryAssignmentRepair } from '../src/services/patron/patronGalleryAssignmentRepairs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const execute = process.argv.includes('--execute');

async function main(): Promise<void> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const sb = createClient(url, key);
  const result = await runPatronGalleryAssignmentRepair(sb, execute);

  console.log('[repair-patron-gallery]', {
    mode: execute ? 'EXECUTE' : 'DRY-RUN',
    ...result,
    repaired: execute ? result.repaired : 0,
  });

  if (result.errors > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
