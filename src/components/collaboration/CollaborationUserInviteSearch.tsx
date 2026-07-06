import React from 'react';
import { Loader2, Search } from 'lucide-react';
import type { CollaborationUserSearchResult } from '@/domain/collaboration';

export interface CollaborationUserInviteSearchProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  searchResults: CollaborationUserSearchResult[];
  isSearching: boolean;
  onSelectUser: (user: CollaborationUserSearchResult) => void;
  isSubmitting?: boolean;
  placeholder?: string;
  showSearchIcon?: boolean;
  inputId?: string;
}

export const CollaborationUserInviteSearch: React.FC<CollaborationUserInviteSearchProps> = ({
  searchQuery,
  onSearchQueryChange,
  searchResults,
  isSearching,
  onSelectUser,
  isSubmitting = false,
  placeholder = 'Email o Nome utente',
  showSearchIcon = true,
  inputId,
}) => (
  <div className="space-y-2">
    <div className="relative">
      {showSearchIcon && (
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
          aria-hidden
        />
      )}
      <input
        id={inputId}
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        placeholder={placeholder}
        disabled={isSubmitting}
        className={`w-full rounded-lg border border-slate-700 bg-slate-900 py-2 text-sm text-white placeholder:text-slate-500 disabled:opacity-50 ${
          showSearchIcon ? 'pl-9 pr-3' : 'px-3'
        }`}
      />
    </div>
    {isSearching && (
      <p className="text-xs text-slate-500 flex items-center gap-2">
        <Loader2 className="w-3 h-3 animate-spin" aria-hidden />
        Ricerca...
      </p>
    )}
    {searchResults.length > 0 && (
      <div
        className="rounded-xl border border-slate-700 overflow-hidden divide-y divide-slate-800"
        role="listbox"
        aria-label="Risultati ricerca utenti"
      >
        {searchResults.map((result) => (
          <button
            key={result.id}
            type="button"
            role="option"
            disabled={isSubmitting}
            onClick={() => onSelectUser(result)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-800/80 transition-colors disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-xs font-bold shrink-0">
              {result.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-white truncate">{result.name}</div>
              {result.slug && (
                <div className="text-xs text-slate-400 truncate">@{result.slug}</div>
              )}
            </div>
          </button>
        ))}
      </div>
    )}
  </div>
);
