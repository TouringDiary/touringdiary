# 📊 MASTER 03: DATABASE SCHEMA

## DESCRIZIONE SEMPLICE
Il database di TouringDiary è progettato per gestire relazioni complesse tra entità territoriali, economia AI e sistemi business. Utilizza ampiamente campi JSON per la flessibilità dei dati e RPC per la logica di business atomica.

---

## TABELLE PRINCIPALI

### Core Territorial
*   **`cities`**: Dati anagrafici, coordinate, rating e campi JSON `patron_details` e `ratings`.
*   **`pois`**: Punti di interesse con metadati AI, campi JSON `opening_hours` e `affiliate`.
*   **`city_people`**: Personaggi storici/famosi legati alle città.
*   **`city_events`**: Calendario eventi con campo JSON `metadata`.
*   **`city_services`**: Servizi di pubblica utilità e servizi essenziali.
*   **`city_guides`**: Guide turistiche professionali con campo JSON `reviews`.
*   **`city_tour_operators`**: Operatori turistici (spesso mappati come `city_services`).

### Business & Economics
*   **`sponsors`**: Contratti attivi, tier, scadenze e campo JSON `partner_logs`.
*   **`shops`**: Marketplace (Botteghe) con rating, likes e campo JSON `reviews`.
*   **`shop_products`**: Catalogo prodotti delle botteghe.
*   **`subscriptions`**: Abbonamenti utenti collegati a `pricing_versions`.
*   **`pricing_versions`**: Configurazioni storiche di prezzi e limiti AI (`ai_limits` JSON).
*   **`user_ai_credits`**: Saldo crediti extra (top-up) per ogni utente.
*   **`credit_transactions`**: Storico acquisti e utilizzi crediti AI.
*   **`ai_global_usage`**: Statistiche aggregate di utilizzo modelli per scopi di analytics.

### User & Community
*   **`profiles`**: Dati utente, XP, badge, ruolo e contatori AI giornalieri.
*   **`reviews`**: Recensioni certificate (POI/Itinerari) con status di moderazione.
*   **`photo_submissions`**: Media inviati dalla community, approvati tramite dashboard admin.
*   **`notifications`**: Messaggi di sistema e notifiche utente persistenti.
*   **`xp_actions`**: Catalogo azioni che assegnano XP.
*   **`rewards_catalog`**: Premi riscattabili tramite XP.
*   **`community_posts`**: Post social e domande della community.

### System Configuration
*   **`system_messages`**: Template per onboarding e messaggi mascot (campo JSON `ui_config`).
*   **`global_settings`**: Configurazioni dinamiche della piattaforma (campo JSON `value`).
*   **`analytics_events`**: Registro eventi per BI e tracciamento errori.

---

## RELAZIONI CHIAVE
*   **`cities` ↔ `pois`**: Relazione 1:N basata su `city_id`.
*   **`pois` ↔ `sponsors`**: Relazione 1:1 o 1:N per la gestione della visibilità premium.
*   **`profiles` ↔ `subscriptions`**: Relazione 1:N (uno solo attivo) per la determinazione dei limiti.
*   **`pricing_versions` ↔ `subscriptions`**: Foreign key per garantire immutabilità dei prezzi passati.

## RPC (Remote Procedure Calls)
*   **`consume_ai_credits`**: Logica atomica per scalare crediti e verificare limiti.
*   **`log_ai_usage_tokens`**: Registrazione asincrona del consumo token.
*   **`activate_sponsor_with_resource`**: Pipeline transazionale per attivazione sponsor.
*   **`get_active_pricing_version_v2`**: Risoluzione della versione di pricing corrente.
*   **`get_ranked_cities`**: Aggregazione dati per classifiche territoriali.

## JSON STRUCTURED FIELDS (Esempi)
*   **`pois.opening_hours`**: `{ days: string[], morning: string, afternoon: string, isEstimated: boolean }`.
*   **`pricing_versions.ai_limits`**: `{ daily_chat: number, flash_itinerary: number, pro_planner: number }`.
*   **`system_messages.ui_config`**: `{ mascot: {x, y}, bubble: {x, y}, targetId: string }`.
