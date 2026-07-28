# 👤 MASTER 06: USER SYSTEMS

## DESCRIZIONE SEMPLICE
Questo modulo gestisce l'esperienza utente (UX) dal primo accesso (Onboarding) alla partecipazione attiva nella community. Include sistemi di fidelizzazione (Gamification), feedback (Recensioni) e interazione social (Media).

---

## MODULI DEL SISTEMA

### 1. Onboarding System
*   **Logica**: Tutorial guidato tramite la mascotte TouringDiary.
*   **Trigger**: Primo login (`profiles.created_at` o LocalStorage `has_seen_onboarding`).
*   **Componenti**: `OnboardingWizard.tsx`, `system_messages` (configurazione step).

### 2. User Review System
*   **Logica**: Feedback multi-criterio su POI e Itinerari (`criteria` jsonb + `rating` media). Pubblicazione immediata; 1 review / utente / target.
*   **Pipeline**: `ReviewModal` → `InteractionContext.submitReview` / `ItineraryReviews` → `saveUnifiedReview` (INSERT|UPDATE) → trigger sync `pois.rating` + alert soglia.
*   **Tabelle**: `reviews`, `review_rating_alerts`.
*   **SSOT**: `AI_CONTEXT/27_USER_REVIEW_SYSTEM.md` v2.0 · Audit `AUDIT_REVIEWS_AND_RATINGS.md` §18.
*   **Qualità**: media POI sotto soglia CC → coda Segnalazioni in Itinerari & Recensioni.

### 3. Gamification (XP & Ranking)
*   **Logica**: Assegnazione punti XP per azioni reali (pubblicazione diario Community, recensioni pubblicate, ecc.). I **premi** del catalogo sono indipendenti dall’XP.
*   **Freeze premi**: flag Platform Control `feature.gamification.rewards` (helper centrale `areRewardsEnabled()` / `useAreRewardsEnabled`). OFF = XP e livelli restano attivi; sblocco/riscatto premi bloccati. Export PDF = benefit sottoscrizione, **fuori** da questo gate.
*   **Pipeline**: XP server-side (`add_user_xp` / trigger review); claim premi via `gamificationService.claimReward` (gated).
*   **Tabelle**: `xp_actions`, `rewards_catalog`, `user_rewards`, `profiles.xp`, `platform_feature_flags`.

### 4. Ranking System
*   **Logica**: Classifiche globali e locali per Utenti (via XP) e Città.
*   **RPC**: `get_ranked_cities`.
*   **UI**: `RankingPanel.tsx`, `FullRankingsModal.tsx`.

### 5. Notification System
*   **Logica**: Notifiche in-app persistenti.
*   **Tabella**: `notifications`.
*   **Service**: `notificationService.ts` (DB persistence + memory cache).

### 6. Community Media
*   **Logica**: Upload foto community + layer **Official** (`is_official` su `photo_submissions`).
*   **Service**: `mediaService.ts` (`mapDbPhotoSubmission`), `useCityGallery.ts`.
*   **UI**: `GalleryGrid.tsx` (tab Official/Community), `PreviewGallery.tsx`.
*   **Dettaglio**: `AI_CONTEXT/16_CITY_MEDIA_MANAGEMENT.md` v2.0.

### 7. User Dashboard (Profilo)
*   **Componente**: `UserDashboard.tsx` — routing tab via `useAppRouter` (URL: `/profilo/condivisione`, `/profilo/amici`, ecc.).
*   **Tab Fase 10**: `UserSharingTab` (Condivisione), `UserFriendsTab` (Amici).
*   **Impostazioni**: `UserSettingsTab` — sezione «Notifiche collaborazione» persistente su `profiles.collaboration_notification_preferences`.
*   **Notifiche**: `UserNotificationsTab` — notifiche `collaboration`, deep link workspace.

### 8. Collaboration & Workspace
*   **Dettaglio**: `AI_CONTEXT/28_COLLABORATION_WORKSPACE_SYSTEM.md` v3 (target dominio + runtime as-is).
*   **Dominio ufficiale:** MySpace = **solo originali**; Workspace = **solo copie**. Il **Viaggio originale non si condivide**. Share per risorsa resta; estensione: Workspace da Viaggio (shell isomorfa, sezioni mancanti vuote). «Condividi Originale» / `share_current` **rimosso dal prodotto**.
*   **Architettura (conforme DOC 34A / DOC 28):** MySpace contiene esclusivamente gli **originali**; Workspace contiene esclusivamente **copie collaborative**. Il Viaggio originale non viene mai condiviso; la collaborazione avviene sempre tramite copie.
*   **Moduli**: shared resource ACL, workspace, amici (`user_friends` ≠ `user_blocks`), eventi dominio, allegati bucket privato, wizard condivisione.
*   **Services**: `src/services/collaboration/`.

### 8b. MySpace / Viaggio (dominio congelato)
*   **Regole:** `AI_CONTEXT/34A_DOMAIN_DESIGN_RULES.md`
*   **Struttura Viaggio:** `AI_CONTEXT/37_VIAGGIO_DOMAIN.md` — Diario 0..N, Ricordi (Foto/Video/Note-giorno), Roadbook library, Mappa/Riepilogo views; cover unica manuale; Ricordami su Viaggio.
*   **Visione casa:** `AI_CONTEXT/35_MYSPACE_PRODUCT_VISION.md` (v2.1+) — catalogo cover, cartella compatta, memoria navigazione, Preferiti=vista, Esploratore=archivio.
*   **Ordine capacità:** `AI_CONTEXT/36_MYSPACE_PRODUCT_MASTERPLAN.md`
*   **Implementazione:** MP-01 concluso; residuale UX → `AI_DEV_WORKFLOW/MASTERPLANS/MP_02_MYSPACE_UX_REALIGNMENT.md`.
*   **Invariante:** MySpace = originali; Workspace = copie.

---

### 9. User Roles & Identity (riferimento cross-SSOT)

*Dettaglio Sponsor e pipeline signup → DOC 29 § Tassonomia ruoli, DL-033. Operazioni irreversibili → `02_GOVERNANCE.md` §11.*

| Ruolo (`profiles.role`) | Significato |
|-------------------------|-------------|
| `user` | Utente registrato |
| `business` | Partner / Sponsor attivo (Silver e Gold — stesso ruolo) |
| `admin_limited` | Admin delegato |
| `admin_all` | Super admin |
| `guest` | Solo sessione frontend — non in DB |

**SSOT implementazione:** `src/types/users.ts`, `src/services/userService.ts` (`ROLE_PERMISSIONS`), pannello **Utenti & Ruoli**.

---

## PIPELINE RUNTIME (Gamification & XP)
1.  **Azione**: L'utente pubblica un diario in Community oppure pubblica una recensione (pubblicazione diretta, senza coda di approvazione).
2.  **Award XP**: RPC/`add_user_xp` o trigger DB aggiornano `profiles.xp` (i punti non vengono mai cancellati dal freeze premi).
3.  **Level Up**: Se l'utente supera la soglia, `LevelUpModal.tsx` celebra il nuovo livello.
4.  **Premi**: sblocco/riscatto solo se `areRewardsEnabled()` (flag `feature.gamification.rewards` ON); altrimenti UI freeze + messaggio positivo su XP.

## COMPONENTI ARCHITETTURALI
*   **Context**: `InteractionContext.tsx`.
*   **Hooks**: `useRankingsLogic.ts`, `useOnboarding.ts`.
*   **Modals**: `ReviewModal.tsx`, `LevelUpModal.tsx`.

## TABELLE DATABASE COINVOLTE
*   `profiles`, `reviews`, `notifications`, `xp_actions`, `community_posts`.
*   **Collaborazione (Fase 10)**: `shared_resources`, `workspaces`, `user_friends`, `user_friend_requests`, `user_blocks`, `collaboration_domain_events`, `workspace_attachments` — vedi `AI_CONTEXT/28_COLLABORATION_WORKSPACE_SYSTEM.md`.

---

## Invarianti del sistema utente

*   Un utente possiede il proprio patrimonio tramite **MySpace**.
*   Il **Viaggio** è il contenitore principale del patrimonio.
*   **Workspace** è l’ambiente operativo collaborativo (copie).
*   **XP e Gamification** non modificano il patrimonio.
*   **Review e Media** sono contributi Community.
*   Nessun modulo può violare le regole del Domain Design (**DOC 34A**).
