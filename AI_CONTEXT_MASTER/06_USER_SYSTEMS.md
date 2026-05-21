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
*   **Logica**: Feedback certificate su POI e Itinerari.
*   **Pipeline**: `ReviewModal.tsx` -> `communityService.saveUnifiedReview` -> Moderazione.
*   **Tabelle**: `reviews`.

### 3. Gamification (XP & Ranking)
*   **Logica**: Assegnazione punti XP per azioni reali (Recensioni, Foto, Visite).
*   **Pipeline**: Azione -> `useInteraction.submitReview` -> Update `profiles.xp`.
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
*   **Logica**: Upload e visualizzazione di foto scattate dagli utenti (`Live Snaps`).
*   **Service**: `mediaService.ts`, `useCityGallery.ts`.
*   **UI**: `PreviewGallery.tsx`.

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
