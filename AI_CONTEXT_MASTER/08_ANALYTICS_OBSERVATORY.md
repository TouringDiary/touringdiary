# 📈 MASTER 08: ANALYTICS & OBSERVATORY

## DESCRIZIONE SEMPLICE
Questo modulo si occupa della Business Intelligence (BI) e del monitoraggio della qualità dei dati. L'Analytics System traccia il comportamento degli utenti, mentre l'Observatory Engine analizza la salute del database territoriale, identificando anomalie e calcolando metriche di qualità per le città.

---

## MODULI DEL SISTEMA

### 1. Analytics Pipeline
*   **Tracciamento**: Eventi UI e visualizzazioni.
*   **Pipeline**: `trackingService.ts` -> LocalStorage.
*   **Nota**: La tabella `analytics_events` non è attualmente utilizzata per il salvataggio remoto degli eventi utente.

### 2. Affiliate Click Tracking
*   **Logica**: Registro dei click sui link e-commerce.
*   **Persistenza**: LocalStorage (chiave `touring_affiliate_stats`).
*   **Scopo**: Misurare l'efficacia del sistema di affiliazione.

### 3. Observatory Engine (Territorial BI)
*   **Logica**: Analisi automatizzata di anomalie (es. POI senza foto, orari mancanti).
*   **Pipeline**: `observatoryService.ts` analizza le tabelle `pois` e `cities`.
*   **Tabella**: `obs_poi_anomalies` (se presente) o report dinamico admin.

### 4. City Quality Metrics
*   **Logica**: Calcolo di un punteggio (0-100) per ogni città in base a contenuti, recensioni e copertura sponsor.
*   **Tabella**: `obs_city_quality_metrics`.
*   **UI**: `AdminObservatory.tsx`.

### 5. Ranking Aggregation
*   **Logica**: Calcolo periodico delle posizioni nel ranking per utenti e città.
*   **RPC**: `get_ai_economics_stats_v4` (per trend economici).

---

## PIPELINE RUNTIME (Observatory)
1.  **Trigger**: Accesso dell'Admin al pannello Observatory.
2.  **Scan**: `observatoryService` interroga il DB per identificare discrepanze o dati mancanti.
3.  **Alert**: Notifica di "Critical Anomalies" (es. Città senza personaggi illustri).
4.  **Fix**: Link diretto allo Staging Dashboard per correggere i dati tramite importazione OSM.

## COMPONENTI ARCHITETTURALI
*   **Service**: `trackingService.ts`, `observatoryService.ts`.
*   **Hooks**: `useAdminAnalytics.ts`.
*   **Views**: `AdminObservatory.tsx`.

## TABELLE DATABASE COINVOLTE
*   `analytics_events`, `obs_poi_anomalies`, `obs_city_quality_metrics`, `ai_global_usage`.
