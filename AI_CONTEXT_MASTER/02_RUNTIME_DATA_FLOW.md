# 🚀 MASTER 02: RUNTIME DATA FLOW

## DESCRIZIONE SEMPLICE
Questo documento mappa i flussi di dati principali che avvengono durante l'utilizzo dell'app, descrivendo come le azioni dell'utente si trasformano in chiamate server, elaborazioni AI e aggiornamenti del database.

## PIPELINE RUNTIME STEP-BY-STEP

### 1. AI CHAT PIPELINE (Conversazione)
*   **Input**: Utente invia un prompt in `useAiGeneration.ts`.
*   **Auth**: Verifica crediti tramite `consume_ai_credits` RPC.
*   **Edge Function**: Chiamata a `gemini-chat`.
*   **Processing**: Gemini elabora il contesto (City/POI) e risponde in streaming.
*   **Logging**: Registrazione token in `log_ai_usage_tokens` RPC e aggiornamento `ai_global_usage`.

### 2. AI PLANNER PIPELINE (Generazione Itinerari)
*   **Trigger**: Utente richiede un piano in `AiItineraryModal.tsx`.
*   **Task**: Invocazione Edge Function `gemini-task` con operazione `enrichment`.
*   **Output**: Ritorno di un JSON strutturato con attività, orari e suggerimenti.
*   **Persistenza**: Salvataggio nel Diario tramite `communityService.saveUserDraft`.

### 3. SPONSOR ACTIVATION PIPELINE
*   **Ingresso**: Un lead compila il form in `PoiClaimModal.tsx`.
*   **Admin Approval**: L'admin approva in `PartnerManager.tsx`.
*   **RPC**: Esecuzione `activate_sponsor_with_resource`.
*   **Effetto**: Creazione record in `sponsors`, aggiornamento `pois.is_sponsored = true`.

### 4. SUBSCRIPTION LIMIT RESOLUTION
*   **Check**: In ogni operazione AI, `getUserModelLimits` verifica il piano attuale.
*   **Priority**: Risolve il limite confrontando `subscriptions` e `pricing_versions`.
*   **Enforcement**: Se il limite è raggiunto, la UI blocca l'input e propone l'upgrade.

### 5. AFFILIATE TRACKING PIPELINE
*   **Click**: L'utente preme un link Booking/TripAdvisor in `PoiInfoSection.tsx`.
*   **Utility**: `enrichAffiliateUrl` aggiunge i parametri partner (`aid`, `utm`).
*   **Tracking**: `trackingService.ts` registra il click in LocalStorage (`touring_affiliate_stats`).

### 6. REVIEW SUBMISSION PIPELINE
*   **Submit**: Inviata tramite `ReviewModal.tsx`.
*   **Persistence**: Salvataggio in tabella `reviews` con status `pending`.
*   **XP**: `communityService.ts` assegna punti XP al profilo utente.

### 7. ROADBOOK GENERATION
*   **Data Source**: Aggregazione dati da `itinerary.items` e `cityManifest`.
*   **Logic**: `RoadbookDocument.tsx` calcola tempi di percorrenza e orari.
*   **UI**: Renderizzazione PDF o vista stampabile interattiva.

### 8. ONBOARDING PIPELINE
*   **Trigger**: Primo accesso rilevato da `useAppInitialization.ts`.
*   **Data**: Fetch step da `system_messages` (tipo `onboarding`).
*   **UI**: La mascotte interattiva (`OnboardingWizard.tsx`) guida l'utente tra i componenti.

### 9. AROUND-ME EXPLORER
*   **Geo**: `geo.ts` calcola la posizione GPS o manuale.
*   **Service**: `cityReadService.ts` (`buildVirtualCity`) aggrega POI/Eventi in un raggio di 2-50km.
*   **Output**: Generazione di una "Città Virtuale" temporanea con ID `around-me-virtual`.

### 10. NOTIFICATION & ANALYTICS
*   **Notify**: `notificationService.ts` scrive persistentemente in tabella `notifications` e popola la cache locale `notificationsCache`.
*   **Events**: `trackingService.ts` registra esclusivamente in **LocalStorage** per il tracciamento affiliazioni (chiave `touring_affiliate_stats`). La tabella `analytics_events` non è attualmente alimentata dal service layer.

## COMPONENTI ARCHITETTURALI
*   **Hooks**: `useAppInitialization`, `useAiGeneration`, `useInteraction`.
*   **Services**: `communityService`, `cityReadService`, `trackingService`, `subscriptionService`.
*   **RPC**: `consume_ai_credits`, `activate_sponsor_with_resource`, `get_active_pricing_version_v2`.
