import { CITY_BADGE_VALUES, CITY_STATUS_VALUES } from '../../src/constants/governance';
import type { CityUpsertPayload } from '../../src/types/write';
import { supabaseAdmin } from '../supabaseAdmin';

type CityStatus = (typeof CITY_STATUS_VALUES)[number];
type CityBadge = (typeof CITY_BADGE_VALUES)[number];

const ALLOWED_STATUSES = new Set<string>(CITY_STATUS_VALUES);
const ALLOWED_BADGES = new Set<string>(CITY_BADGE_VALUES);

/** Contratto condiviso con cityPayloadMapper / CityUpsertPayload. */
export type CityWritePayload = CityUpsertPayload;

export interface CityManifestPatch {
  name: string;
  zone: string | null;
  status: CityStatus | null;
  updated_at: string;
}

function assertAdminClient() {
  if (!supabaseAdmin) {
    throw new Error('Supabase Admin client not initialized');
  }
  return supabaseAdmin;
}

function validateCityWritePayload(cityId: string, payload: CityWritePayload): void {
  if (payload.id !== cityId) {
    throw new Error('City ID mismatch');
  }
  if (!payload.name?.trim()) {
    throw new Error('City name is required');
  }
  if (payload.status && !ALLOWED_STATUSES.has(payload.status)) {
    throw new Error('Invalid city status');
  }
}

export async function persistCityDetails(cityId: string, payload: CityWritePayload) {
  validateCityWritePayload(cityId, payload);
  const admin = assertAdminClient();

  const { id: _id, ...updateFields } = payload;

  const { data: existing, error: existingError } = await admin
    .from('cities')
    .select('id')
    .eq('id', cityId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    const { data, error } = await admin
      .from('cities')
      .update(updateFields)
      .eq('id', cityId)
      .select('id, updated_at')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'City update failed');
    }

    return data;
  }

  const { data, error } = await admin
    .from('cities')
    .insert({ id: cityId, ...updateFields })
    .select('id, updated_at')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'City insert failed');
  }

  return data;
}

export async function updateCityStatus(cityId: string, status: CityStatus) {
  if (!ALLOWED_STATUSES.has(status)) {
    throw new Error('Invalid status');
  }

  const admin = assertAdminClient();
  const updated_at = new Date().toISOString();

  const { data, error } = await admin
    .from('cities')
    .update({ status, updated_at })
    .eq('id', cityId)
    .select('id, status, updated_at')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Status update failed');
  }

  return data;
}

export async function patchCityManifestFields(cityId: string, patch: CityManifestPatch) {
  if (!patch.name?.trim()) {
    throw new Error('City name is required');
  }
  if (patch.status && !ALLOWED_STATUSES.has(patch.status)) {
    throw new Error('Invalid city status');
  }

  const admin = assertAdminClient();

  const { data, error } = await admin
    .from('cities')
    .update({
      name: patch.name,
      zone: patch.zone,
      status: patch.status,
      updated_at: patch.updated_at,
    })
    .eq('id', cityId)
    .select('id, updated_at')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Manifest update failed');
  }

  return data;
}

export async function patchCityBadge(cityId: string, special_badge: CityBadge | null) {
  if (special_badge != null && !ALLOWED_BADGES.has(special_badge)) {
    throw new Error('Invalid city badge');
  }

  const admin = assertAdminClient();

  const { data, error } = await admin
    .from('cities')
    .update({ special_badge, updated_at: new Date().toISOString() })
    .eq('id', cityId)
    .select('id, updated_at')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Badge update failed');
  }

  return data;
}

export async function patchCityHomeOrder(cityId: string, home_order: number | null) {
  const admin = assertAdminClient();

  const { data, error } = await admin
    .from('cities')
    .update({ home_order, updated_at: new Date().toISOString() })
    .eq('id', cityId)
    .select('id, updated_at')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Home order update failed');
  }

  return data;
}
