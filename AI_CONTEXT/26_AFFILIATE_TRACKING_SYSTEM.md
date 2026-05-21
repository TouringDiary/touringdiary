# 🔗 DOC 26: AFFILIATE TRACKING SYSTEM (v1.0 — CERTIFIED)

Questo documento descrive il sistema di tracciamento link affiliati verso partner e-commerce (Booking, TripAdvisor, etc.).

---

## DESCRIZIONE SEMPLICE
È il sistema che permette all'app di guadagnare una commissione quando un utente clicca su un link di prenotazione (es. un hotel su Booking.com) all'interno della scheda di un punto di interesse.

## DESCRIZIONE TECNICA
Il sistema è di tipo "Click-Tracking" con arricchimento dinamico degli URL. Non gestisce direttamente le conversioni (vendite) ma ottimizza i link con i codici partner di TouringDiary e registra i click localmente per scopi statistici.

---

## PIPELINE RUNTIME
1. **Visualizzazione**: Nella scheda POI (`PoiInfoSection.tsx`), se sono presenti URL nel campo JSON `affiliate`, vengono mostrati i pulsanti brandizzati.
2. **Interazione**: Al click, viene invocata la funzione `trackAffiliateClick`.
3. **Tracciamento Locale**: Il click viene salvato in LocalStorage nella chiave `touring_affiliate_stats` (ID POI, Partner, Timestamp).
4. **Enrichment URL**: L'utility `enrichAffiliateUrl` interviene prima dell'apertura:
    *   Recupera il Partner ID (es. `aid` per Booking).
    *   Aggiunge i parametri UTM (`utm_source=touring_diary_app`).
5. **Redirect**: L'utente viene inviato al sito partner con il link tracciato.

---

## COMPONENTI ARCHITETTURALI
*   **Tabelle Database**: `pois` (campo JSON `affiliate`).
*   **Services**: `trackingService.ts` (statistiche locali).
*   **Utility**: `affiliateNetwork.ts` (costruzione URL).
*   **Componenti UI**: `PoiInfoSection.tsx`, `PoiLinksTab.tsx` (Admin).

## LIMITAZIONI ATTUALI
*   **No Server Tracking**: I click non vengono inviati a Supabase (`analytics_events` non utilizzato per questa specifica pipeline).
*   **No Conversion Data**: Non c'è integrazione con le API dei partner per sapere se il click ha generato una vendita reale.
*   **Persistenza**: Essendo basato su LocalStorage, le statistiche sono relative al singolo dispositivo dell'utente.
