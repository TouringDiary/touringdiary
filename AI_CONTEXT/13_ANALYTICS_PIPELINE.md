# 📊 DOC 13: ANALYTICS PIPELINE (v1.0 — CERTIFIED)

Questo documento descrive il sistema di tracciamento eventi e metriche di conversione di TouringDiary.

---

## DESCRIZIONE TECNICA
Il sistema di analytics è focalizzato sul monitoraggio delle conversioni verso i partner (Booking, TripAdvisor, ecc.). Attualmente implementato con persistenza locale sincronizzata, è predisposto per l'esportazione verso la tabella `analytics_events`.

## DESCRIZIONE SEMPLICE
TouringDiary tiene traccia di quali hotel, ristoranti o attività vengono cliccati di più, aiutando gli amministratori a capire quali suggerimenti sono più utili per i viaggiatori.

---

## PIPELINE RUNTIME: TRACKING FLOW
1. **Trigger**: L'utente clicca su un link esterno (es. "Prenota su Booking") in un dettaglio POI.
2. **Component**: Il componente `PoiDetail` chiama la funzione di tracking.
3. **Service**: `trackingService.ts` esegue `trackAffiliateClick`.
4. **Data Entry**: Viene creato un oggetto `AffiliateClick` con `poiId`, `partner`, `timestamp` e `cityId`.
5. **Persistence**: L'evento viene salvato in LocalStorage (chiave `touring_affiliate_stats`) tramite `storageService`.
6. **Aggregation**: Il servizio fornisce metodi (`getAffiliateStatsByPartner`, `getTopConvertingPois`) per aggregare i dati.
7. **Risposta UI**: Gli amministratori visualizzano i grafici di conversione nella dashboard economica.

---

## COMPONENTI COINVOLTI
*   **File**: `trackingService.ts`, `storageService.ts`, `AdminControlCenterAI.tsx`.
*   **Tabelle**: `analytics_events` (target futuro), `pois`.
*   **Metriche**: Click per partner, Conversioni per città, POI più popolari.

## INTEGRAZIONE CON ALTRI SISTEMI
*   **AI Planner**: Monitoraggio dei click generati dai suggerimenti dell'AI.
*   **Sponsor System**: Calcolo del ROI per i partner sponsorizzati.
*   **Observatory Engine**: Correlazione tra qualità del dato e tasso di conversione.
