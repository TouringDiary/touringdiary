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
*   **Task**: `generateItineraryPlan` (`aiPlanner.ts`) → Edge Function `gemini-task`.
*   **Output**: JSON strutturato con attività, orari e suggerimenti.
*   **Applicazione**: `applyPlanToItinerary` (`useAiGeneration.ts`) scrive il piano nello stato Diario runtime via `ItineraryContext` (`clearItinerary` + `setItinerary`).
*   **Persistenza cloud**: al salvataggio utente, `ItineraryStorageManager` → `saveUserDraft` (crea/collega il Viaggio Aggregate Root). Non è un save immediato a fine generazione.

### 3. SPONSOR ACTIVATION PIPELINE
*   **Ingresso**: Un lead compila il form in `PoiClaimModal.tsx`.
*   **Admin Approval / Attivazione**: L’admin opera in `SponsorManager.tsx` (`useSponsorOperations`).
*   **RPC**: `activate_sponsor_from_request` tramite `activateSponsorFromRequestAsync` (`sponsorActivationService.ts`).
*   **Effetto**: Creazione contratto sponsor, risorsa UI, subscription e conversione della richiesta (attivazione atomica post DL-017).

### 4. SUBSCRIPTION LIMIT RESOLUTION
*   **Check**: In ogni operazione AI, `getUserModelLimits` verifica il piano attuale.
*   **Priority**: Risolve il limite confrontando `subscriptions` e `pricing_versions`.
*   **Enforcement**: Se il limite è raggiunto, la UI blocca l'input e propone l'upgrade.

### 5. AFFILIATE TRACKING PIPELINE
*   **Click**: L'utente preme un link Booking/TripAdvisor in `PoiInfoSection.tsx`.
*   **Utility**: `enrichAffiliateUrl` aggiunge i parametri partner (`aid`, `utm`).
*   **Tracking**: `trackingService.ts` registra il click in LocalStorage (`touring_affiliate_stats`).

### 6. REVIEW SUBMISSION PIPELINE
*   **Submit**: `ReviewModal.tsx` → `saveUnifiedReview` (INSERT o UPDATE se già esiste per utente+target).
*   **Persistence**: `reviews` con `status = approved` immediato; `updated_at` su modifica.
*   **Rating POI**: trigger `sync_poi_rating_from_reviews` aggiorna `pois.rating`; sotto soglia → `review_rating_alerts`.
*   **XP**: trigger `handle_review_approval_xp` su pubblicazione/approve.

### 7. ROADBOOK / EXPORT ITINERARIO
*   **Data Source**: Aggregazione da `itinerary.items` / city hero; SoT immagini = `prepareItineraryForPdf` (una prepare all’apertura di `ExportModal`).
*   **Distanze**: SoT unica `domain/diary/itineraryDistance.ts` (stessa catena geo del Diario; Note non spezzano i segmenti).
*   **Logo**: `ExportLogo` (viewBox condivisi) + `useLogoRasterizer` (icona a proporzioni corrette).
*   **Collage**: `heroCoverCollagePlan` condiviso PDF / DOCX / Preview.
*   **Logic PDF**: `TravelDocument.tsx` (+ footer editoriale «Pagina X di Y»); Roadbook artifact → `RoadbookDocument.tsx`.
*   **Logic DOCX**: `exportGenerators.ts` (struttura editoriale allineata al PDF).
*   **UI**: Anteprima WYSIWYG in `ExportModal` (stesso preparedDoc) o download PDF/DOCX.

### 8. ONBOARDING PIPELINE
*   **Trigger**: Primo accesso rilevato da `useAppInitialization.ts`.
*   **Data**: Fetch step da `system_messages` (tipo `onboarding`).
*   **UI**: La mascotte interattiva (`OnboardingWizard.tsx`) guida l'utente tra i componenti.

### 9. AROUND-ME EXPLORER
*   **Geo**: `geo.ts` calcola la posizione GPS o manuale.
*   **Service**: `cityReadService.ts` (`buildVirtualCity`) aggrega POI/Eventi/Guide in un raggio di 2-50km via fetch **batch** (`getPoisByCityIds`, `getCityEventsByCityIds`, `getCityGuidesByCityIds`) — evita N+1 per città nel raggio.
*   **Output**: Generazione di una "Città Virtuale" temporanea con ID `around-me-virtual`.

### 10. NOTIFICATION & ANALYTICS
*   **Notify**: `notificationService.ts` scrive persistentemente in tabella `notifications` e popola la cache locale `notificationsCache`; emette `NOTIFICATIONS_CHANGED_EVENT` su fetch/mark/add per aggiornare UI senza polling aggressivo.
*   **Polling hygiene**: Header ~60s + visibility + event; UserNotificationsTab ~120s; AdminDashboard ~180s + visibility.
*   **Collaboration notify** (Fase 10): `collaborationNotificationService.ts` — categorie filtrate da preferenze profilo; dettaglio in `AI_CONTEXT/28_COLLABORATION_WORKSPACE_SYSTEM.md`.
*   **Events**: `trackingService.ts` registra esclusivamente in **LocalStorage** per il tracciamento affiliazioni (chiave `touring_affiliate_stats`). La tabella `analytics_events` non è attualmente alimentata dal service layer.

### 11. COLLABORATION SHARE PIPELINE (v1 — Fase 10)
*   **Trigger**: Condivisione da Diario/Valigia/Template → `CollaborationShareModal` (sempre **copia**; target: anche Workspace da Viaggio — DOC 28 v3).
*   **Persistenza**: shared resource / workspace + inviti; opzionale duplicazione (`personalShareService`).
*   **Side effects**: notifiche collaborative, eventi dominio, sync ACL workspace.
*   **Dettaglio step-by-step**: `AI_CONTEXT/28_COLLABORATION_WORKSPACE_SYSTEM.md`.

## COMPONENTI ARCHITETTURALI
*   **Hooks**: `useAppInitialization`, `useAiGeneration`, `useInteraction`, `useSponsorOperations`.
*   **Services**: `communityService`, `cityReadService`, `trackingService`, `subscriptionService`, `sponsorActivationService`, `ItineraryStorageManager`.
*   **RPC**: `consume_ai_credits`, `activate_sponsor_from_request`, `get_active_pricing_version_v2`.
*   **Context**: `ItineraryContext` (Diario operativo runtime nel dominio Viaggio).
