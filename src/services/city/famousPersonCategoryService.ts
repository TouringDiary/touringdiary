import { isCategoryAssignable } from '@/domain/city/famousPersonCategories';
import { buildLifespanDisplay } from '@/domain/city/famousPersonDates';
import type { Database } from '@/types/supabase';
import { supabase } from '../supabaseClient';

type MasterRow = Database['public']['Tables']['famous_person_master_categories']['Row'];
type SpecificRow = Database['public']['Tables']['famous_person_specific_categories']['Row'];

export type FamousPersonMasterDto = {
  id: string;
  slug: string;
  label: string;
  orderIndex: number;
  isActive: boolean;
  deletedAt: string | null;
};

export type FamousPersonSpecificDto = {
  id: string;
  masterId: string;
  slug: string;
  label: string;
  orderIndex: number;
  isActive: boolean;
  deletedAt: string | null;
};

export type FamousPersonTaxonomyTree = {
  masters: FamousPersonMasterDto[];
  specifics: FamousPersonSpecificDto[];
};

function mapMaster(row: MasterRow): FamousPersonMasterDto {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    orderIndex: row.order_index,
    isActive: row.is_active,
    deletedAt: row.deleted_at,
  };
}

function mapSpecific(row: SpecificRow): FamousPersonSpecificDto {
  return {
    id: row.id,
    masterId: row.master_id,
    slug: row.slug,
    label: row.label,
    orderIndex: row.order_index,
    isActive: row.is_active,
    deletedAt: row.deleted_at,
  };
}

/** Full taxonomy (admin sees inactive too). */
export async function loadFamousPersonTaxonomy(options?: {
  activeOnly?: boolean;
}): Promise<FamousPersonTaxonomyTree> {
  const activeOnly = options?.activeOnly === true;

  let masterQuery = supabase
    .from('famous_person_master_categories')
    .select('*')
    .order('order_index', { ascending: true });
  let specificQuery = supabase
    .from('famous_person_specific_categories')
    .select('*')
    .order('order_index', { ascending: true });

  if (activeOnly) {
    masterQuery = masterQuery.eq('is_active', true).is('deleted_at', null);
    specificQuery = specificQuery.eq('is_active', true).is('deleted_at', null);
  }

  const [mastersRes, specificsRes] = await Promise.all([masterQuery, specificQuery]);
  if (mastersRes.error) throw mastersRes.error;
  if (specificsRes.error) throw specificsRes.error;

  return {
    masters: ((mastersRes.data as MasterRow[]) || []).map(mapMaster),
    specifics: ((specificsRes.data as SpecificRow[]) || []).map(mapSpecific),
  };
}

/** Prompt string for AI: only active assignable categories. */
export function generateFamousPeopleCategoriesPromptString(tree: FamousPersonTaxonomyTree): string {
  const lines: string[] = [];
  for (const master of tree.masters) {
    if (!isCategoryAssignable({ is_active: master.isActive, deleted_at: master.deletedAt })) {
      continue;
    }
    const specs = tree.specifics.filter(
      (s) =>
        s.masterId === master.id &&
        isCategoryAssignable({ is_active: s.isActive, deleted_at: s.deletedAt }),
    );
    if (specs.length === 0) continue;
    lines.push(
      `${master.label} (${master.slug}): ${specs.map((s) => `${s.label} [${s.slug}]`).join(', ')}`,
    );
  }
  return lines.join('\n');
}

export async function createFamousPersonMaster(input: {
  slug: string;
  label: string;
  orderIndex?: number;
}): Promise<FamousPersonMasterDto> {
  const { data, error } = await supabase
    .from('famous_person_master_categories')
    .insert({
      slug: input.slug,
      label: input.label,
      order_index: input.orderIndex ?? 0,
      is_active: true,
      deleted_at: null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapMaster(data as MasterRow);
}

export async function updateFamousPersonMaster(
  id: string,
  patch: { label?: string; orderIndex?: number },
): Promise<FamousPersonMasterDto> {
  const payload: Database['public']['Tables']['famous_person_master_categories']['Update'] = {};
  if (patch.label !== undefined) payload.label = patch.label;
  if (patch.orderIndex !== undefined) payload.order_index = patch.orderIndex;
  const { data, error } = await supabase
    .from('famous_person_master_categories')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return mapMaster(data as MasterRow);
}

/** Soft-deactivate (PO-R: no hard delete). */
export async function deactivateFamousPersonMaster(id: string): Promise<FamousPersonMasterDto> {
  const { data, error } = await supabase
    .from('famous_person_master_categories')
    .update({ is_active: false, deleted_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return mapMaster(data as MasterRow);
}

export async function restoreFamousPersonMaster(id: string): Promise<FamousPersonMasterDto> {
  const { data, error } = await supabase
    .from('famous_person_master_categories')
    .update({ is_active: true, deleted_at: null })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return mapMaster(data as MasterRow);
}

export async function createFamousPersonSpecific(input: {
  masterId: string;
  slug: string;
  label: string;
  orderIndex?: number;
}): Promise<FamousPersonSpecificDto> {
  const { data, error } = await supabase
    .from('famous_person_specific_categories')
    .insert({
      master_id: input.masterId,
      slug: input.slug,
      label: input.label,
      order_index: input.orderIndex ?? 0,
      is_active: true,
      deleted_at: null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapSpecific(data as SpecificRow);
}

export async function updateFamousPersonSpecific(
  id: string,
  patch: { label?: string; orderIndex?: number; masterId?: string },
): Promise<FamousPersonSpecificDto> {
  const payload: Database['public']['Tables']['famous_person_specific_categories']['Update'] = {};
  if (patch.label !== undefined) payload.label = patch.label;
  if (patch.orderIndex !== undefined) payload.order_index = patch.orderIndex;
  if (patch.masterId !== undefined) payload.master_id = patch.masterId;
  const { data, error } = await supabase
    .from('famous_person_specific_categories')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return mapSpecific(data as SpecificRow);
}

export async function deactivateFamousPersonSpecific(id: string): Promise<FamousPersonSpecificDto> {
  const { data, error } = await supabase
    .from('famous_person_specific_categories')
    .update({ is_active: false, deleted_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return mapSpecific(data as SpecificRow);
}

export async function restoreFamousPersonSpecific(id: string): Promise<FamousPersonSpecificDto> {
  const { data, error } = await supabase
    .from('famous_person_specific_categories')
    .update({ is_active: true, deleted_at: null })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return mapSpecific(data as SpecificRow);
}

export async function countSpecificCategoryUsage(specificId: string): Promise<number> {
  const { count, error } = await supabase
    .from('city_person_category_links')
    .select('*', { count: 'exact', head: true })
    .eq('specific_category_id', specificId);
  if (error) throw error;
  return count ?? 0;
}

/** Replace all category links for a person (only assignable/active IDs should be passed by caller). */
export async function replacePersonCategoryLinks(
  personId: string,
  specificCategoryIds: string[],
): Promise<void> {
  const uniqueIds = [...new Set(specificCategoryIds.filter(Boolean))];
  const { error: delError } = await supabase
    .from('city_person_category_links')
    .delete()
    .eq('person_id', personId);
  if (delError) throw delError;
  if (uniqueIds.length === 0) return;
  const { error: insError } = await supabase.from('city_person_category_links').insert(
    uniqueIds.map((specific_category_id) => ({
      person_id: personId,
      specific_category_id,
    })),
  );
  if (insError) throw insError;
}

export function computeLifespanDisplayForSave(input: {
  birthYear?: number | null;
  birthDate?: string | null;
  isLiving?: boolean;
  deathYear?: number | null;
  deathDate?: string | null;
}): string {
  return buildLifespanDisplay({
    birthYear: input.birthYear ?? null,
    birthDate: input.birthDate ?? null,
    isLiving: input.isLiving === true,
    deathYear: input.deathYear ?? null,
    deathDate: input.deathDate ?? null,
  });
}
