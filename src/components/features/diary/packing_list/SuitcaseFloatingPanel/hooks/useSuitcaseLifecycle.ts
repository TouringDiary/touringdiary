import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { fetchLinkedSuitcaseIdsAsync, getAuthUserAsync } from '@/services/suitcaseService';

interface LifecycleProps {
  itineraryId: string | null;
  fetchGlobalTemplates: () => void;
  activeTabId: string | null;
  setActiveTabId: (id: string | null) => void;
  viewMode: 'selector' | 'editor';
  setViewMode: (v: 'selector' | 'editor') => void;
  sourceTab: 'trip' | 'saved' | 'default';
  setSourceTab: (t: 'trip' | 'saved' | 'default') => void;
  setSelectedItemName: (n: string | null) => void;
}

export const useSuitcaseLifecycle = ({
  itineraryId,
  fetchGlobalTemplates,
  activeTabId,
  setActiveTabId,
  viewMode,
  setViewMode,
  sourceTab,
  setSourceTab,
  setSelectedItemName
}: LifecycleProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [linkedSuitcaseIds, setLinkedSuitcaseIds] = useState<string[] | null>(null);

  const fetchLinkedIds = useCallback(async () => {
    if (!itineraryId) {
      setLinkedSuitcaseIds([]);
      return;
    }

    try {
      const ids = await fetchLinkedSuitcaseIdsAsync(itineraryId);
      setLinkedSuitcaseIds(ids);
    } catch (e) {
      console.error("Error fetching linked ids:", e);
      setLinkedSuitcaseIds([]);
    }
  }, [itineraryId]);

  // Initializations
  useEffect(() => {
    getAuthUserAsync().then((user) => setCurrentUser(user));
    fetchGlobalTemplates();
    fetchLinkedIds();
  }, [fetchGlobalTemplates, fetchLinkedIds]);

  // Il filtraggio e la selezione dei tab sono ora delegati a useSuitcasePanelData
  // per garantire un'unica sorgente di verità e prevenire render loop.

  return { currentUser, linkedSuitcaseIds, fetchLinkedIds };
};
