/**
 * cityWriteService.ts
 *
 * Persistenza CityDetails verso Supabase via admin API (service role server-side).
 * Nessuna write client-side diretta sulla tabella `cities`.
 */

import type { CityDetails } from '../../types/index';
import { parseStorageLocationFromPublicUrl } from '../../utils/storagePathFromPublicUrl';
import { upsertEntityImageAssignmentFromSource } from '../media/entityImageAssignmentWriteService';
import { mf2EntityImageAssignmentsTable } from '../reports/mf2DbClient';
import { callCityAdminApi } from './cityAdminApi';
import { clearCacheKey, invalidateCityCache } from './cityCache';
import { reclaimOrphanedItems } from './cityLifecycleService';
import { buildCityWritePayload } from './cityPayloadMapper';

export { buildCityWritePayload } from './cityPayloadMapper';

type Mf2AssignmentIdRow = { id: string };

type Mf2AssignmentConditionalUpdateBuilder = {
  eq: (column: string, value: string | boolean) => Mf2AssignmentConditionalUpdateBuilder;
  select: (columns: string) => Promise<{
    data: unknown;
    error: { message: string } | null;
  }>;
};

/** Lifecycle MF2 removal — stesso contratto di transition_report_status (image_abuse → ok). */
async function revokePatronPrimaryAssignment(cityId: string): Promise<void> {
  const { data, error } = await mf2EntityImageAssignmentsTable()
    .select('id')
    .eq('entity_type', 'patron')
    .eq('entity_id', cityId)
    .eq('city_id', cityId)
    .eq('assignment_role', 'primary')
    .eq('is_current', true)
    .eq('assignment_status', 'active')
    .maybeSingle();

  if (error) {
    throw new Error(`Lettura assignment Patrono primary fallita: ${error.message}`);
  }

  const assignmentRow = data as unknown as Mf2AssignmentIdRow | null;
  if (!assignmentRow?.id) return;

  const now = new Date().toISOString();
  const updateClient = mf2EntityImageAssignmentsTable() as unknown as {
    update: (values: {
      assignment_status: 'removed';
      removed_at: string;
      updated_at: string;
    }) => Mf2AssignmentConditionalUpdateBuilder;
  };
  const { data: updatedRows, error: updateError } = await updateClient
    .update({
      assignment_status: 'removed',
      removed_at: now,
      updated_at: now,
    })
    .eq('id', assignmentRow.id)
    .eq('entity_type', 'patron')
    .eq('entity_id', cityId)
    .eq('city_id', cityId)
    .eq('assignment_role', 'primary')
    .eq('is_current', true)
    .eq('assignment_status', 'active')
    .select('id');

  if (updateError) {
    throw new Error(`Revoca assignment Patrono primary fallita: ${updateError.message}`);
  }

  const rows = updatedRows as unknown as Mf2AssignmentIdRow[] | null;
  if (!rows || rows.length === 0) {
    throw new Error(
      'Revoca assignment Patrono primary fallita: nessuna riga aggiornata (stato cambiato).',
    );
  }
}

export const saveCityDetails = async (
  city: CityDetails,
  options: { skipReclaim?: boolean } = {},
): Promise<void> => {
  invalidateCityCache(city.id);
  clearCacheKey('manifest');

  const payload = buildCityWritePayload(city);

  await callCityAdminApi<{ id: string; updated_at: string }>(
    `/cities/${encodeURIComponent(city.id)}/details`,
    'PATCH',
    payload,
  );

  const patronImageUrl = city.details.patronDetails?.imageUrl?.trim() ?? '';
  if (patronImageUrl.length > 0) {
    const parsedStorage = parseStorageLocationFromPublicUrl(patronImageUrl);
    await upsertEntityImageAssignmentFromSource({
      entityType: 'patron',
      entityId: city.id,
      cityId: city.id,
      assignmentRole: 'primary',
      source: {
        imageUrl: patronImageUrl,
        storageBucket: parsedStorage?.storageBucket ?? null,
        storagePath: parsedStorage?.storagePath ?? null,
        originType: 'admin',
      },
    });
  } else {
    await revokePatronPrimaryAssignment(city.id);
  }

  if (city.id && city.name && !options.skipReclaim) {
    void reclaimOrphanedItems(city.id, city.name).catch((err: unknown) => {
      console.warn('[saveCityDetails] reclaimOrphanedItems failed:', err);
    });
  }
};
