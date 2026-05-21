# 🗺️ DOC 10: RUNTIME DATA FLOW MAP (v1.0 — CERTIFIED)

Questo documento descrive i flussi dati reali del sistema TouringDiary, mappando il percorso dall'input utente alla persistenza sul database Supabase.

---

## 1. AI CHAT PIPELINE (Consulente Virtuale)

Flusso di gestione del linguaggio naturale per assistenza turistica.

**Sequenza Step-by-Step:**
1. **Utente**: Inserisce un prompt nel componente `Hero` o `AiConsulente`.
2. **Hook**: `useHeroLogic.ts` chiama `handleAiSubmit`.
3. **Service**: `aiText.ts` chiama `aiGateway.generateChat(prompt)`.
4. **Gateway**: `aiGateway.ts` delega a `supabaseProvider.ts` con `operationType: 'chat'`.
5. **Edge Function**: Viene invocata `gemini-chat` su Supabase.
6. **RPC (Security)**: L'Edge Function esegue `consume_ai_credits` (check atomico).
7. **AI Execution**: Se autorizzato, l'Edge Function interroga `gemini-2.0-flash`.
8. **RPC (Audit)**: L'Edge Function esegue `log_ai_usage_tokens` (prompt/completion/total tokens).
9. **Tabelle DB**: `user_ai_credits` (aggiornamento saldo), `ai_global_usage` (log analitico).
10. **Risposta UI**: Il testo dell'assistente viene mostrato nel fumetto della mascotte.

---

## 2. AI TASK PIPELINE (Magic Planner)

Flusso strutturato per la generazione di itinerari complessi.

**Sequenza Step-by-Step:**
1. **Utente**: Configura preferenze e date nella modale AI Planner.
2. **Hook**: `useAiGeneration.ts` esegue `generatePlan`.
3. **Service**: `aiPlanner.ts` chiama `aiGateway.generateText` con `operationType: 'task'` e `isJson: true`.
4. **Edge Function**: Viene invocata `gemini-task` (default: `gemini-2.0-flash`, enrichment: `gemini-2.0-pro`).
5. **RPC (Security)**: Controllo atomico tramite `consume_ai_credits`.
6. **AI Execution**: Generazione JSON strutturato tramite Gemini AI.
7. **Risposta UI**: `useAiGeneration` riceve l'itinerario e chiama `applyPlanToItinerary` per aggiornare l' `ItineraryContext`.

---

## 3. CREDIT PURCHASE PIPELINE

Ciclo di vita dell'acquisto crediti extra tramite Stripe.

**Sequenza Step-by-Step:**
1. **Utente**: Seleziona un pacchetto crediti in `BuyCreditsModal`.
2. **Edge Function**: Viene invocata `purchase-extra-credits` (Inizio sessione Stripe).
3. **Tabelle DB**: Creazione record in `credit_transactions` con `status: 'pending'`.
4. **Third-Party**: Reindirizzamento a **Stripe Checkout**.
5. **Webhook**: Stripe invia evento a `stripe-webhook` Edge Function.
6. **Finalizzazione**:
    *   `credit_transactions`: Aggiornamento a `status: 'completed'`.
    *   `user_ai_credits`: Inserimento pacchetto con scadenza 365 giorni (`expires_at`).
7. **Risposta UI**: Il saldo viene ricaricato via `UserContext`.

---

## 4. SUBSCRIPTION LIMIT RESOLUTION PIPELINE

Calcolo dei limiti AI basato sulla sottoscrizione e sull'utilizzo reale.

**Sequenza Step-by-Step:**
1. **Runtime**: Richiesta di validazione crediti.
2. **Service**: `subscriptionService.ts` chiama `getUserModelLimits(userId)`.
3. **Query DB (Sottoscrizione)**: Legge `subscriptions` JOIN `pricing_versions` per ottenere `ai_limits` (JSON).
4. **Query DB (Utilizzo)**: Esegue `select` su `ai_global_usage` filtrando per `current_period_start`.
5. **Logic**: Sottrazione `Utilizzo` da `Limite Massimo` (Flash/Pro).
6. **Risposta UI**: Crediti residui mostrati in UI.

---

## 5. ADMIN CREDIT OVERRIDE PIPELINE

Pipeline manuale per l'assegnazione di crediti da parte dell'amministratore.

**Sequenza Step-by-Step:**
1. **Admin**: Inserisce email e quota in `AdminDashboard`.
2. **Service**: `aiAdminService.ts` chiama `updateUserExtraQuota`.
3. **Transaction DB**:
    *   `profiles`: Update del campo `extra_quota`.
    *   `admin_credit_grants`: Inserimento record di audit (Admin ID, User ID, Motivo).
4. **Risposta UI**: Successo operazione e riga aggiornata in tabella admin.

---

## 6. SPONSOR ACTIVATION PIPELINE

Trasformazione di una richiesta partner in uno sponsor attivo sul territorio.

**Sequenza Step-by-Step:**
1. **Admin**: Approva una `sponsor_request`.
2. **Service**: `sponsorActivationService.ts` chiama la RPC `activate_sponsor_with_resource`.
3. **Atomic DB Operation (RPC)**:
    *   Crea riga in `sponsors`.
    *   Aggiorna `subscriptions` collegando lo `sponsor_id`.
    *   Attiva privilegi Pro.
4. **Risposta UI**: Sponsor attivo e visibile nelle sezioni partner.

---

## 7. POI IMPORT PIPELINE (Staging)

Flusso di acquisizione dati da fonti esterne (OpenStreetMap).

**Sequenza Step-by-Step:**
1. **Admin**: Avvia import in `ImportDashboard.tsx`.
2. **Service**: `importService.ts` scarica dati e inserisce in `pois_staging`.
3. **Deduplica (Smart)**: `stagingService.ts:deduplicateStagingData` rimuove duplicati (Distanza < 20m + Nome Simile > 0.8).
4. **AI Rating**: `updateStagingAiRatings` classifica i POI (High, Medium, Low).
5. **Promozione**: `promoteToLive` arricchisce via AI e inserisce in `pois` (`status: 'draft'`).
6. **Risposta UI**: POI pronti per revisione finale.

---

## 8. DESIGN SYSTEM PIPELINE

Aggiornamento dinamico dell'interfaccia.

**Sequenza Step-by-Step:**
1. **Admin**: Modifica parametri in `SettingsPage.tsx`.
2. **Service**: `settingsService.ts` esegue `saveSetting` su `global_settings`.
3. **Context**: `ConfigContext.tsx` invoca `refreshConfig`.
4. **UI**: I componenti che usano `useConfig()` aggiornano stili e variabili CSS a runtime.

---

## 9. ROADBOOK PIPELINE

Generazione documenti PDF di viaggio.

**Sequenza Step-by-Step:**
1. **Utente**: Clicca "Scarica Roadbook" in `TravelDiary.tsx`.
2. **Component**: `RoadbookDocument.tsx` renderizza la struttura PDF.
3. **Styling**: `PdfStyles.ts` applica il layout tipografico.
4. **Risposta UI**: Download del file `.pdf`.

---

## 10. COMMUNITY MEDIA PIPELINE

Gestione dei contenuti generati dagli utenti.

**Sequenza Step-by-Step:**
1. **Utente**: Carica foto o mette like.
2. **Service**: `photoService.ts` gestisce upload e interazioni.
3. **RPC**: `toggle_photo_like` gestisce l'atomicità del contatore like.
4. **Storage**: I file sono salvati nel bucket `community-photos`.
5. **Tabelle DB**: `photo_submissions`, `photo_likes`.

---

## 11. GAMIFICATION PIPELINE

Sistema di crescita e premi utente.

**Sequenza Step-by-Step:**
1. **Sistema**: Rileva azione XP in `gamificationService.ts`.
2. **Action**: `claimReward` genera un codice premio univoco.
3. **Tabelle DB**: `xp_actions`, `rewards_catalog`, `user_rewards`.
4. **Risposta UI**: Aggiornamento livelli e premi nel wallet utente.

---

## 12. GEO RESOLUTION PIPELINE

Risoluzione gerarchica del territorio.

**Sequenza Step-by-Step:**
1. **Service**: `geo.ts` esegue query gerarchiche.
2. **Logic**: Continente → Nazione → Regione → Zona → Città.
3. **Tabelle DB**: `cities` (Source of Truth per la gerarchia).
4. **Risposta UI**: Filtri dropdown aggiornati.

---

> [!IMPORTANT]
> Tutte le pipeline sopra descritte sono state certificate tramite analisi diretta del codice sorgente (Aprile 2026).
