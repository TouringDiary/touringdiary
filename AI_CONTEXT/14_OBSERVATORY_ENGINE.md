# 🔭 DOC 14: OBSERVATORY ENGINE (v1.0 — CERTIFIED)

Questo documento descrive il sistema di monitoraggio della qualità dati e Business Intelligence (Osservatorio).

---

## DESCRIZIONE TECNICA
L'Osservatorio è il centro di controllo della salute dei dati territoriali. Utilizza funzioni RPC avanzate per calcolare metriche su migliaia di record e gestisce la risoluzione delle anomalie (POI duplicati o mancanti).

## DESCRIZIONE SEMPLICE
È lo strumento che assicura che le informazioni su TouringDiary siano sempre corrette, complete e senza doppioni, segnalando agli amministratori dove è necessario intervenire.

---

## PIPELINE RUNTIME: DATA QUALITY AUDIT
1. **Trigger**: L'amministratore apre la "Console Osservatorio".
2. **Service**: `observatoryService.ts` chiama `getObservatoryStats`.
3. **RPC**: Supabase esegue `get_observatory_stats` (aggregazione globale).
4. **Logic**: Il sistema identifica anomalie basate su metadati mancanti o coordinate sospette.
5. **Query Database**: Select su vista `obs_poi_anomalies` e tabella `obs_city_quality_metrics`.
6. **Interazione (Merge)**: Se vengono trovati duplicati, l'admin avvia `mergePoisInDb`.
7. **Atomic Operation**: Spostamento recensioni/itinerari dal record "vittima" al "sopravvissuto" e cancellazione del duplicato.
8. **Risposta UI**: Dashboard aggiornata con indicatori di salute (Health Score) per città.

---

## COMPONENTI COINVOLTI
*   **File**: `observatoryService.ts`, `ObservatoryDashboard.tsx`.
*   **Tabelle**: `pois`, `obs_poi_anomalies`, `obs_city_quality_metrics`.
*   **RPC**: `get_observatory_stats`, `get_detailed_city_stats`.

## INTEGRAZIONE CON ALTRI SISTEMI
*   **Staging Pipeline**: L'osservatorio monitora il successo della promozione dei POI da staging a live.
*   **AI Planner**: Assicura che l'AI utilizzi solo POI con alto punteggio di qualità.
*   **Geo Hierarchy**: Analisi della copertura dati per ogni Regione/Zona turistica.
