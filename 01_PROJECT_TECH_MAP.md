
# 🗺️ DOC 01: PROJECT TECH_MAP (v43.0 - UI UNIFICATION)

## 📍 STRUTTURA CARTELLE AGGIORNATA

### `src/components/layout/`
*   **`AppCoordinator.tsx`**: Orchestratore principale (snello).
*   **`MainLayout.tsx`**: Layout strutturale (Header, Sidebar, Content).
*   **`AppShell.tsx`**: Contenitore visivo (Z-Index, posizionamento fisso).
*   **`AppRouter.tsx`**: Switcher dei contenuti (Home/City/Shop).
*   **`ModalManager.tsx`**: Gestore centralizzato di tutti i modali.

### `src/components/common/`
*   **`UniversalCard.tsx`**: (NEW) Card polimorfica per POI (sostituisce ShowcaseCards).
*   `ImageWithFallback.tsx`, `StarRating.tsx`, `PaginationControls.tsx`.

### `src/components/modals/`
*   **`PoiDetailModal.tsx`**: (REFACTORED) Modale universale intelligente (Standard + Business).
*   *`BusinessCardModal.tsx`*: (DEPRECATED/MERGED) Logica integrata in PoiDetailModal.
*   `ReviewModal.tsx`, `SuggestionModal.tsx`, etc.

### `src/services/`
*   **Core:** `supabaseClient.ts`, `storageService.ts`, `settingsService.ts`.
*   **Domain:** `cityService.ts`, `mediaService.ts`, `communityService.ts`.
*   **AI:** `aiClient.ts`, `aiPlanner.ts`.

### `src/hooks/`
*   **Core:** `useAppUI.ts`, `useAppInitialization.ts`.
*   **Features:** `useNavigationController.ts` (Deprecato), `useNavigationContext.ts` (Attivo).

### `src/context/`
*   `NavigationContext.tsx`, `DiaryInteractionContext.tsx`, `UIContext.tsx`.

---
*Mappa allineata al refactoring Universal UI.*
