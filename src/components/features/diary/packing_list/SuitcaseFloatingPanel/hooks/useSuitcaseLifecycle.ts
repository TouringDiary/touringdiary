import { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { fetchLinkedSuitcaseIdsAsync } from '@/services/suitcaseService';
import { useUser } from '@/context/UserContext';
import type { SuitcasePanelViewMode } from '../types/panelViewMode';
import type { SuitcaseSourceTab } from '../types/sourceTab';

interface LifecycleProps {
  itineraryId: string | null;
  activeTabId: string | null;
  setActiveTabId: (id: string | null) => void;
  viewMode: SuitcasePanelViewMode;
  setViewMode: (v: SuitcasePanelViewMode) => void;
  sourceTab: SuitcaseSourceTab;
  setSourceTab: (t: SuitcaseSourceTab) => void;
  setSelectedItemName: (n: string | null) => void;
}

export const useSuitcaseLifecycle = ({
  itineraryId,
  activeTabId,
  setActiveTabId,
  viewMode,
  setViewMode,
  sourceTab,
  setSourceTab,
  setSelectedItemName
}: LifecycleProps) => {
  const { user: appUser } = useUser();
  const currentUser = useMemo<User | null>(() => {
    if (appUser.role === 'guest') return null;
    return { id: appUser.id } as User;
  }, [appUser.id, appUser.role]);

  const [linkedSuitcaseIds, setLinkedSuitcaseIds] = useState<string[] | null>(null);

  const fetchLinkedIds = useCallback(async (overrideItineraryId?: string) => {
    const id = overrideItineraryId ?? itineraryId;
    if (!id) {
      setLinkedSuitcaseIds([]);
      return;
    }

    try {
      const ids = await fetchLinkedSuitcaseIdsAsync(id);
      setLinkedSuitcaseIds(ids);
    } catch (e) {
      console.error("Error fetching linked ids:", e);
      setLinkedSuitcaseIds([]);
    }
  }, [itineraryId]);

  // Linked ids: caricamento iniziale e refresh su cambio itineraryId (via fetchLinkedIds).
  useEffect(() => {
    fetchLinkedIds();
  }, [fetchLinkedIds]);

  // Il filtraggio e la selezione dei tab sono ora delegati a useSuitcasePanelData
  // per garantire un'unica sorgente di verità e prevenire render loop.

  return { currentUser, linkedSuitcaseIds, fetchLinkedIds };
};
