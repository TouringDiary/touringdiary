
# 🗺️ DOC 01: PROJECT TECH_MAP (v43.0 - UI UNIFICATION)

## 📍 STACK TECNOLOGICO PRINCIPALE

*   **Frontend Framework:** React (con Vite come build tool).
*   **Linguaggio:** TypeScript per la tipizzazione statica e la robustezza del codice.
*   **Backend & Database:** Supabase (PostgreSQL con API RESTful e servizi di autenticazione).
*   **Styling:** TailwindCSS per un approccio utility-first alla UI.

---

## 📍 STRUTTURA CARTELLE AGGIORNATA

### `src/components/layout/`
*   **`AppCoordinator.tsx`**: Orchestratore principale (snello).
*   **`MainLayout.tsx`**: Layout strutturale (Header, Sidebar, Content).
*   **`AppShell.tsx`**: Contenitore visivo (Z-Index, posizionamento fisso).
*   **`AppRouter.tsx`**: (CRITICAL NOTE) Implementa un pattern di routing "Stateful" non standard. Tutta la logica è nel componente MainContent, non in rotte multiple.
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

---

### Design System Architecture

**Flusso Dati delle Regole di Stile**
Il Design System è interamente guidato da una configurazione dinamica e non contiene regole di stile hardcoded nel codice sorgente. Il flusso è il seguente:

1.  **Origine Dati (Supabase)**:
    *   Le definizioni delle `StyleRule` sono memorizzate nella tabella `public.global_settings` di Supabase.
    *   Le regole si trovano nel record con `key = 'site_design'`. Il campo `value` di questa riga contiene un oggetto JSON con una proprietà `components`, che è la collezione di tutte le regole.

2.  **Caricamento nel Contesto (Context Layer)**:
    *   All'avvio dell'app, `ConfigContext` carica la configurazione `site_design` dal database.
    *   I dati diventano disponibili globalmente tramite l'hook `useConfig()`, accessibili tramite `configs.site_design.components`.

3.  **Rendering Dinamico (UI Layer)**:
    *   Il componente `src/components/admin/design/DesignSystemSettings.tsx` utilizza `useConfig()` per ottenere le regole.
    *   I tab delle sezioni (es. "Bottoni", "Card") vengono generati dinamicamente raggruppando le regole in base al valore del loro campo `section`.
    *   Per creare una nuova sezione, è sufficiente aggiungere al database una `StyleRule` con un nuovo valore per `section` (es. `"typography"`). Il componente la renderizzerà automaticamente in un nuovo tab.

4.  **Editing e Preview**:
    *   `DesignRuleEditor.tsx` riceve le regole e gestisce la loro modifica e l'anteprima.
    *   Le preview sono generate dinamicamente utilizzando le proprietà `preview_type`, `preview_size`, e `preview_content` definite in ogni regola.

Questa architettura rende il Design System estensibile direttamente dal database, senza richiedere modifiche al codice dei componenti admin per aggiungere nuove sezioni o regole.

---
