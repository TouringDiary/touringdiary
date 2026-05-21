# 🚀 DOC 25: USER ONBOARDING SYSTEM (v1.0 — CERTIFIED)

Questo documento descrive il sistema di onboarding guidato per i nuovi utenti di TouringDiary.

---

## DESCRIZIONE SEMPLICE
È il sistema che accoglie i nuovi utenti con una mascotte interattiva, spiegando le funzionalità principali dell'app (Diario, Esplora, AI Planner) attraverso una serie di messaggi guidati e punti luce che evidenziano i tasti da premere.

## DESCRIZIONE TECNICA
Il sistema è basato su dati dinamici memorizzati nella tabella `system_messages`. Utilizza un wizard (`OnboardingWizard`) che si attiva automaticamente al primo accesso rilevato localmente. La logica di posizionamento della mascotte e del fumetto è configurabile via database per pixel-perfect accuracy su mobile e desktop.

---

## PIPELINE RUNTIME
1. **Rilevamento**: Al caricamento, `useAppInitialization` controlla la chiave `has_seen_onboarding_v3` in LocalStorage.
2. **Trigger**: Se assente, dopo 800ms viene attivato il flag `showOnboarding`.
3. **Fetch Dati**: `OnboardingWizard` scarica i messaggi di tipo `onboarding` ordinati per chiave (`step_0`, `step_1`, etc.).
4. **Sequenza**: L'utente procede step-by-step. Se uno step ha un `targetId`, il wizard:
    *   Esegue lo scroll dell'elemento in vista.
    *   Posiziona un "Highlight Box" pulsante sull'elemento.
    *   Sposta la mascotte e il fumetto secondo le coordinate `uiConfig` salvate nel DB.
5. **Completamento**: Al termine, viene settato `has_seen_onboarding_v3: true` e il wizard si chiude con un'animazione verso il tasto menu.

---

## COMPONENTI ARCHITETTURALI
*   **Tabelle Database**: `system_messages`.
*   **Services**: `communicationService.ts` (fetch messaggi).
*   **Hooks**: `useAppInitialization.ts` (stato e persistenza).
*   **Componenti UI**: `OnboardingWizard.tsx`, `MascotSvg.tsx`.

## CONFIGURAZIONE DB (uiConfig)
Ogni step può definire:
*   `targetId`: ID dell'elemento DOM da evidenziare.
*   `mascot`: Coordinate `{x, y}` percentuali.
*   `bubble`: Coordinate `{x, y}` percentuali.
*   `arrowDirection`: Direzione della freccia del fumetto (`top`, `bottom`, `left`, `right`).
