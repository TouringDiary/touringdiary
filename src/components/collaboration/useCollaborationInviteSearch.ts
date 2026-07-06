import { useEffect, useRef, useState } from 'react';
import type { CollaborationUserSearchResult } from '@/domain/collaboration';
import { searchUsersForCollaborationInvite } from '@/services/collaboration';

/**
 * Debounced user search for collaboration invites.
 * Shared by share modal and workspace panel.
 */
export function useCollaborationInviteSearch(
  userId: string,
  enabled: boolean,
  searchQuery: string,
  excludedUserIds: readonly string[]
) {
  const [searchResults, setSearchResults] = useState<CollaborationUserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchGenerationRef = useRef(0);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setSearchResults([]);
      return;
    }

    const trimmed = searchQuery.trim();
    if (trimmed.length < 3 && !trimmed.includes('@')) {
      setSearchResults([]);
      return;
    }

    searchGenerationRef.current += 1;
    const searchGeneration = searchGenerationRef.current;
    const excluded = new Set(excludedUserIds);

    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchUsersForCollaborationInvite(userId, trimmed);
        if (searchGeneration !== searchGenerationRef.current || !enabledRef.current) return;
        setSearchResults(results.filter((result) => !excluded.has(result.id)));
      } finally {
        if (searchGeneration === searchGenerationRef.current) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery, userId, enabled, excludedUserIds]);

  return { searchResults, isSearching };
}
