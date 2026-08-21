# ⭐️ DOC 27: USER REVIEW SYSTEM (v2.0 — P0 2026-07-23)

Questo documento descrive l'architettura del sistema di recensioni e feedback degli utenti su TouringDiary.

---

## DESCRIZIONE SEMPLICE
Il sistema permette agli utenti di lasciare voti multi-criterio (1-5 stelle per criterio) e commenti testuali su POI e Itinerari. La recensione è **pubblicata immediatamente**. Una sola recensione per utente per target. Il rating del POI è la **media reale** delle recensioni.

---

## DESCRIZIONE TECNICA
Architettura ibrida: tabella centralizzata (`reviews`) per POI e Itinerari; campi JSON (`reviews`) per Shop e Guide (ramo parallelo, fuori P0).

| Campo | Ruolo |
|-------|--------|
| `criteria` | `jsonb` — mappa criterio → stelle (1–5) |
| `rating` | `numeric` — media dei criteri (1 decimale) |
| `status` | `approved` all’insert (pubblicazione immediata) |
| `updated_at` | valorizzato solo dopo una modifica contenuto |

**SoT rating POI:** `pois.rating` denormalizzato, sincronizzato da trigger `reviews_sync_poi_rating` → `sync_poi_rating_from_reviews`.

**Alert soglia:** tabella `review_rating_alerts` quando media POI < `threshold.sponsor_rating_alert_stars`.

---

## PIPELINE RUNTIME (POI)
1. Trigger: dettaglio POI → Scrivi/Modifica Recensione.
2. `FeatureModals` carica eventuale review esistente (`getUserReviewForPoi`).
3. `ReviewModal` → `submitReview` → `saveUnifiedReview` (INSERT o UPDATE).
4. Status `approved` immediato; trigger aggiorna `pois.rating` e crea/risolve alert.
5. Dopo salvataggio riuscito (`onSubmitSuccess`): INSERT apre `reviewSuccess` (con XP); UPDATE apre la stessa modale con `intent: 'update'` (conferma modifica, senza XP). Errore/annulla non aprono la conferma.
6. UI listing/sort leggono `poi.rating` (SoT).

---

## COMPONENTI ARCHITETTURALI
* **DB:** `reviews`, `review_rating_alerts`, trigger sync rating, RLS author UPDATE/DELETE + admin ALL.
* **Services:** `src/services/community/reviewService.ts` (`saveUnifiedReview`, `getReviewsForPoi`, `deleteOwnReview`, `deleteReviewAsAdmin`).
* **Context:** `InteractionContext.submitReview`.
* **UI:** `ReviewModal`, `FeatureModals`, `PoiImageSection`, `ItineraryReviews`, `ItineraryManager` (Segnalazioni + Storico).
* **Admin UX (`ItineraryManager`):** orchestratore UI (`ItineraryManager.tsx`); load/refresh/enrichment/manifest + race protection in `itineraryManager/useItineraryManagerData.ts`; geo SoT/filter in `itineraryManagerGeo.ts`; UI Segnalazioni/Storico in `ItineraryManagerReviews.tsx`. Enrichment client unico (`getPoisByIds` + `getFullManifestAsync` → Map); filtri area via `GeoCascadingFilters` con SoT **CitySummary**; con filtro geo attivo e manifesto fallito → filtro non applicato + avviso (no falsi “nessun risultato”). Tab `ITINERARI | RECENSIONI` → sotto-tab `SEGNALAZIONI | STORICO`; apertura POI via `PoiDetailModal` locale. Nessun cambio a `reviewService`/DB.
* **Flag:** `feature.moderation.reviews` (invariato).

## CLASSIFICAZIONE PER ENTITÀ
* **POI & Itinerari:** COMPLETO (P0).
* **Shops & Guide:** PARZIALE (JSON locale).
* **Eventi:** ASSENTE.
* **Città:** rating aggregato editoriale (`details.ratings`) — distinto dalle user reviews.

## NOTE OPERATIVE
* Migration P0: `supabase/migrations/20260723160000_reviews_p0_publish_rating_alerts.sql`.
* Audit: `AI_CONTEXT/AUDIT_REVIEWS_AND_RATINGS.md` §18.
* Unique: `(author_id, poi_id)` e `(author_id, itinerary_id)` (indici parziali).
* XP recensione: accreditati solo alla **prima pubblicazione** sul target (`saveUnifiedReview` INSERT). L’UPDATE di una recensione già esistente aggiorna voto/testo e `updated_at`; non ristampa `status` / `approved_at` e non riaccredita XP.
