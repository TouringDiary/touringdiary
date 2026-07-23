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
*   **Logica**: Feedback multi-criterio su POI e Itinerari (`criteria` jsonb + `rating` media).
*   **Pipeline**: `ReviewModal` (async, errore in-modal) → `InteractionContext.submitReview` / `ItineraryReviews` → `reviewService.saveUnifiedReview` → moderazione Admin.
*   **Tabelle**: `reviews` (`criteria`, `rating`, `status`, …).
*   **SSOT**: `AI_CONTEXT/27_USER_REVIEW_SYSTEM.md` v1.1.
*   **Qualità**: media `rating` approved → alert soglia Sponsor (DOC 29 DL-030).

### 3. Gamification (XP & Ranking)
*   **Logica**: Assegnazione punti XP per azioni reali (Recensioni, Foto, Visite).
*   **Pipeline**: azioni gamification via `gamificationService` / `xp_actions` (il success modal recensioni mostra XP come claim UX; non sostituisce l’award server-side).
*   **Tabelle**: `xp_actions`, `rewards_catalog`, `profiles`.

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

### 8. Collaboration & Workspace (v1 — Fase 10)
*   **Dettaglio**: `AI_CONTEXT/28_COLLABORATION_WORKSPACE_SYSTEM.md` v2.0 (SSOT completo: dati, hub UI, wizard).
*   **Moduli**: shared resource ACL, workspace, amici (`user_friends` ≠ `user_blocks`), eventi dominio, allegati bucket privato, wizard condivisione.
*   **Services**: `src/services/collaboration/`.

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
1.  **Azione**: L'utente scrive una recensione utile (> 10 parole).
2.  **Trigger**: `communityService.ts` calcola i punti bonus.
3.  **Update**: Aggiornamento incrementale di `profiles.xp`.
4.  **Level Up**: Se l'utente supera la soglia, `LevelUpModal.tsx` mostra la nuova posizione nel ranking.

## COMPONENTI ARCHITETTURALI
*   **Context**: `InteractionContext.tsx`.
*   **Hooks**: `useRankingsLogic.ts`, `useOnboarding.ts`.
*   **Modals**: `ReviewModal.tsx`, `LevelUpModal.tsx`.

## TABELLE DATABASE COINVOLTE
*   `profiles`, `reviews`, `notifications`, `xp_actions`, `community_posts`.
*   **Collaborazione (Fase 10)**: `shared_resources`, `workspaces`, `user_friends`, `user_friend_requests`, `user_blocks`, `collaboration_domain_events`, `workspace_attachments` — vedi `AI_CONTEXT/28_COLLABORATION_WORKSPACE_SYSTEM.md`.
