# 🏆 DOC 11: RANKING SYSTEM (v1.0 — CERTIFIED)

Questo documento descrive il sistema di calcolo e visualizzazione delle classifiche di TouringDiary.

---

## DESCRIZIONE TECNICA
Il sistema di ranking è progettato per gestire classifiche dinamiche basate su criteri multipli (AI, Community, Popolarità). Utilizza una combinazione di logica server-side (RPC Supabase) per grandi dataset (Città) e logica client-side per dataset medi (Foto, POI).

## DESCRIZIONE SEMPLICE
TouringDiary ordina città, foto e luoghi in base a quanto sono amati dalla community o consigliati dall'AI, permettendo agli utenti di scoprire i contenuti migliori.

---

## PIPELINE RUNTIME: CITY RANKING
1. **Trigger**: L'utente naviga nella sezione "Classifiche" o "Top Cities".
2. **Hook**: `useRankingsLogic.ts` gestisce lo stato di paginazione e i filtri.
3. **Service**: `rankingService.ts` esegue la funzione `getRankedCities`.
4. **RPC**: Viene invocata la funzione Supabase `get_ranked_cities`.
5. **Logic**: La RPC ordina le città in base a `sort_type` ('ai', 'community', 'mix').
6. **Query Database**: Select su tabella `cities` con calcolo dinamico del punteggio.
7. **Risposta UI**: Visualizzazione card ordinate con badge di posizione (originalRank).

---

## COMPONENTI COINVOLTI
*   **File**: `rankingService.ts`, `useRankingsLogic.ts`, `RankingPage.tsx`.
*   **Tabelle**: `cities`, `pois`, `photo_submissions`, `photo_likes`.
*   **RPC**: `get_ranked_cities`.

## INTEGRAZIONE CON ALTRI SISTEMI
*   **Community Media**: Il ranking delle foto dipende dal numero di like in `photo_likes`.
*   **Geo Hierarchy**: Le classifiche possono essere filtrate per Zona/Nazione tramite `GEO_CONFIG`.
*   **Admin Dashboard**: Gli amministratori possono visualizzare il ranking per monitorare le città più attive.
