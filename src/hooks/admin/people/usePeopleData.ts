import { useCallback, useEffect, useRef, useState } from 'react';
import { useCityEditor } from '@/context/CityEditorContext';
import {
  canPublishFamousPerson,
  type FamousPersonPublishAttemptResult,
  getMissingFamousPersonFields,
  isFamousPersonPublishBlockedError,
} from '@/domain/city/famousPersonCompleteness';
import {
  deleteCityPerson,
  getCityPeople,
  type SaveCityPersonInput,
  saveCityPerson,
} from '../../../services/cityService';
import type { FamousPerson } from '../../../types/index';

export type { FamousPersonPublishAttemptResult };

const isValidPersonId = (id: string | undefined): id is string =>
  typeof id === 'string' && id.trim().length > 0;

function replacePersistedOrderRef(
  target: { current: Map<string, number> },
  list: FamousPerson[],
): void {
  target.current = new Map(
    list
      .filter((p): p is FamousPerson & { id: string } => isValidPersonId(p.id))
      .map((p) => [p.id, p.orderIndex ?? 0]),
  );
}

function hasUnpersistedOrderChanges(list: FamousPerson[], persisted: Map<string, number>): boolean {
  return list.some((p) => isValidPersonId(p.id) && persisted.get(p.id) !== (p.orderIndex ?? 0));
}

function applyLocalReorder(
  id: string,
  newRank: number,
  sourceList: FamousPerson[],
): FamousPerson[] | null {
  if (!Number.isFinite(newRank) || !Number.isInteger(newRank) || newRank < 1) return null;

  const index = newRank - 1;
  const currentList = [...sourceList];
  const itemIndex = currentList.findIndex((p) => p.id === id);

  if (itemIndex === -1 || index >= currentList.length) return null;
  if (itemIndex === index) return null;

  const [item] = currentList.splice(itemIndex, 1);
  currentList.splice(index, 0, item);

  return currentList.map((p, idx) => ({ ...p, orderIndex: idx + 1 }));
}

export const usePeopleData = (cityId: string) => {
  const { reloadCurrentCity } = useCityEditor();

  const [peopleList, setPeopleList] = useState<FamousPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const peopleListRef = useRef(peopleList);
  peopleListRef.current = peopleList;

  /** Ultimo orderIndex per id realmente confermato da saveCityPerson. */
  const persistedOrderRef = useRef<Map<string, number>>(new Map());
  const reorderInFlightRef = useRef(false);

  const loadPeople = useCallback(async (): Promise<FamousPerson[]> => {
    if (!cityId) return [];
    setIsLoading(true);
    try {
      const data = await getCityPeople(cityId, 'admin');
      const sorted = [...data].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
      setPeopleList(sorted);
      peopleListRef.current = sorted;
      replacePersistedOrderRef(persistedOrderRef, sorted);
      return sorted;
    } catch (e) {
      console.error('[usePeopleData] loadPeople failed', e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [cityId]);

  useEffect(() => {
    loadPeople().catch((err: unknown) => {
      console.error('[usePeopleData] initial loadPeople failed', err);
    });
  }, [loadPeople]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const selectableIds = peopleList.map((p) => p.id).filter(isValidPersonId);
    if (selectableIds.length === 0) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds((prev) => {
      const allSelected = selectableIds.every((sid) => prev.has(sid));
      return allSelected ? new Set() : new Set(selectableIds);
    });
  };

  const resetSelection = () => {
    setSelectedIds(new Set());
  };

  const addManualPerson = async (): Promise<string | undefined> => {
    // name NOT NULL a DB: bozza con nome assente (= ''), non placeholder semantico.
    const draftPerson: SaveCityPersonInput = {
      name: '',
      bio: null,
      imageUrl: null,
      categories: [],
      isLiving: true,
      relatedPlaces: [],
      famousWorks: [],
      status: 'draft',
      orderIndex: peopleListRef.current.length + 1,
    };
    const saved = await saveCityPerson(cityId, draftPerson);
    await loadPeople();
    return saved.id;
  };

  const deletePerson = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteCityPerson(id);
      setPeopleList((prev) => prev.filter((p) => p.id !== id));
      peopleListRef.current = peopleListRef.current.filter((p) => p.id !== id);
      persistedOrderRef.current.delete(id);
      setSelectedIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await reloadCurrentCity();
      return true;
    } catch {
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const updatePersonLocal = <K extends keyof FamousPerson>(
    id: string,
    field: K,
    value: FamousPerson[K],
  ) => {
    setPeopleList((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const savePersonChanges = async (person: FamousPerson) => {
    const toSave: FamousPerson =
      person.status === 'published' && !canPublishFamousPerson(person)
        ? { ...person, status: 'draft' }
        : person;

    try {
      await saveCityPerson(cityId, toSave);
      setPeopleList((prev) => prev.map((p) => (p.id === person.id ? toSave : p)));
      await reloadCurrentCity();
      return true;
    } catch (e) {
      if (person.status === 'published' && isFamousPersonPublishBlockedError(e)) {
        const demoted = { ...person, status: 'draft' as const };
        try {
          await saveCityPerson(cityId, demoted);
          setPeopleList((prev) => prev.map((p) => (p.id === person.id ? demoted : p)));
          await reloadCurrentCity();
          return false;
        } catch (demoteError) {
          console.error('[usePeopleData] demote to draft failed', demoteError);
          await loadPeople();
          throw demoteError;
        }
      }
      await loadPeople();
      return false;
    }
  };

  const toggleStatus = async (person: FamousPerson): Promise<FamousPersonPublishAttemptResult> => {
    const newStatus: 'published' | 'draft' = person.status === 'published' ? 'draft' : 'published';

    if (newStatus === 'published' && !canPublishFamousPerson(person)) {
      return {
        ok: false,
        cause: 'incomplete',
        missingFields: getMissingFamousPersonFields(person),
        person,
      };
    }

    const updated: FamousPerson = { ...person, status: newStatus };
    setPeopleList((prev) => prev.map((p) => (p.id === person.id ? updated : p)));

    try {
      await saveCityPerson(cityId, updated);
      await reloadCurrentCity();
      return { ok: true };
    } catch (e) {
      setPeopleList((prev) => prev.map((p) => (p.id === person.id ? person : p)));
      if (isFamousPersonPublishBlockedError(e)) {
        return {
          ok: false,
          cause: 'incomplete',
          missingFields: e.missingFields,
          person,
        };
      }
      return {
        ok: false,
        cause: 'runtime',
        person,
        message: e instanceof Error ? e.message : String(e),
      };
    }
  };

  const persistOrderChanges = async (): Promise<boolean> => {
    const snapshot = peopleListRef.current;
    const persisted = persistedOrderRef.current;
    const toPersist = snapshot.filter((p) => {
      if (!isValidPersonId(p.id)) return false;
      return persisted.get(p.id) !== (p.orderIndex ?? 0);
    });

    if (toPersist.length === 0) return true;

    // saveCityPerson fa upsert dell'intera riga: orderIndex dalla snapshot del pass,
    // altri campi dallo stato locale corrente per non sovrascrivere edit concorrenti.
    try {
      for (const snapPerson of toPersist) {
        const current = peopleListRef.current.find((p) => p.id === snapPerson.id);
        if (!current || !isValidPersonId(current.id)) continue;

        const orderIndex = snapPerson.orderIndex ?? 0;
        const payload: SaveCityPersonInput = { ...current, orderIndex };
        await saveCityPerson(cityId, payload);
        persistedOrderRef.current.set(current.id, orderIndex);
      }
      return true;
    } catch (e) {
      console.error('[usePeopleData] reorder persist failed — reloading from DB', e);
      try {
        await loadPeople();
      } catch (loadErr) {
        console.error('[usePeopleData] reload after reorder failed', loadErr);
      }
      return false;
    }
  };

  const reorderPerson = async (id: string, newRank: number) => {
    const updated = applyLocalReorder(id, newRank, peopleListRef.current);
    if (!updated) return;

    setPeopleList(updated);
    peopleListRef.current = updated;

    if (reorderInFlightRef.current) return;

    reorderInFlightRef.current = true;
    try {
      while (hasUnpersistedOrderChanges(peopleListRef.current, persistedOrderRef.current)) {
        const ok = await persistOrderChanges();
        if (!ok) break;
      }
    } finally {
      reorderInFlightRef.current = false;
    }
  };

  return {
    peopleList,
    setPeopleList,
    isLoading,
    selectedIds,
    isDeleting,

    toggleSelection,
    toggleAll,
    resetSelection,

    addManualPerson,
    deletePerson,
    updatePersonLocal,
    savePersonChanges,
    toggleStatus,
    reorderPerson,
    reloadList: loadPeople,
  };
};
