/**
 * STEP 2 audit — multi-link Valigia↔Viaggio (read-only).
 * npx tsx scripts/audit-wf13-suitcase-viaggio-links.ts
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(url, key);

async function main() {
  const { data, error } = await sb
    .from('viaggio_suitcases')
    .select('suitcase_id, viaggio_id, id, created_at');

  if (error) {
    console.error('ERR', error);
    process.exit(1);
  }

  const bySc = new Map<string, { viaggio_id: string; id: string; created_at: string }[]>();
  for (const r of data || []) {
    const list = bySc.get(r.suitcase_id) ?? [];
    list.push({ viaggio_id: r.viaggio_id, id: r.id, created_at: r.created_at });
    bySc.set(r.suitcase_id, list);
  }

  const multi = [...bySc.entries()].filter(
    ([, rows]) => new Set(rows.map((r) => r.viaggio_id)).size > 1,
  );

  // Personal diaries with viaggio_id (cardinality is column-level; check null ratio)
  const { count: personalCount, error: e2 } = await sb
    .from('itineraries')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'personal');
  const { count: linkedCount, error: e3 } = await sb
    .from('itineraries')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'personal')
    .not('viaggio_id', 'is', null);

  console.log(
    JSON.stringify(
      {
        viaggio_suitcases: {
          totalRows: (data || []).length,
          uniqueSuitcases: bySc.size,
          multiViaggioSuitcases: multi.length,
          sample: multi.slice(0, 8).map(([suitcase_id, rows]) => ({
            suitcase_id,
            viaggi: rows.map((r) => r.viaggio_id),
          })),
        },
        personal_diaries: {
          total: personalCount,
          with_viaggio_id: linkedCount,
          err: e2?.message || e3?.message || null,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
