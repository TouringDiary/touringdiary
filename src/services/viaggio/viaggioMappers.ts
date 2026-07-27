import type { Json } from '../../types/supabase';
import type { DbViaggio } from '../../types/domain';
import type { Viaggio } from '../../types/models/Viaggio';

function parseMetadata(raw: Json | null | undefined): Record<string, unknown> {
  if (raw === null || raw === undefined) return {};
  if (typeof raw !== 'object' || Array.isArray(raw)) return {};
  return raw as Record<string, unknown>;
}

export function mapDbViaggioToRuntime(row: DbViaggio): Viaggio {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    destination: row.destination,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    coverImage: row.cover_image,
    activeDiaryId: row.active_diary_id,
    metadata: parseMetadata(row.metadata),
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
  };
}
