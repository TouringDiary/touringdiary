# ⭐️ DOC 27: USER REVIEW SYSTEM (v1.1)

Questo documento descrive l'architettura del sistema di recensioni e feedback degli utenti su TouringDiary.

---

## DESCRIZIONE SEMPLICE
Il sistema permette agli utenti di lasciare voti multi-criterio (1-5 stelle per criterio) e commenti testuali su vari elementi dell'app (POI, Itinerari, Shops, Guide). Include moderazione admin e monitoraggio qualità sulla **media** (`rating`).

## DESCRIZIONE TECNICA
Architettura ibrida: tabella centralizzata (`reviews`) per POI e Itinerari; campi JSON (`reviews`) per Shop e Guide. Ogni recensione cloud persiste:

| Campo | Ruolo |
|-------|--------|
| `criteria` | `jsonb` — mappa criterio → stelle (1–5), opzionale |
| `rating` | `numeric` — **media** dei criteri (1 decimale), usata da monitoraggio qualità / soglia sponsor |
| `status` | `pending` → `approved` / `rejected` (moderazione) |

---

## PIPELINE RUNTIME (POI & ITINERARI)
1. **Trigger**: dettaglio POI/itinerario → «Scrivi Recensione».
2. **Input**: `ReviewModal.tsx` carica i criteri per categoria; calcola `rating = media(criteria)`.
3. **Submit async**: il modal **attende** `onSubmit`; loading + anti doppio-click; in errore resta aperto con alert DS (nessun falso successo).
4. **Persistenza**: `saveUnifiedReview` → `INSERT` su `reviews` (`criteria` + `rating`, `status = pending`).
5. **Successo POI**: solo dopo insert OK → `reviewSuccess` (FeatureModals `onSubmitSuccess`).
6. **Moderazione**: Admin → Itinerari → tab Recensioni: media + criteri; approvazione/rifiuto.
7. **Qualità Sponsor**: media recensioni **approved** su `poi_id` vs soglia `threshold.sponsor_rating_alert_stars` (DOC 29 DL-030 / DOC 30) — alert UI, nessuna sospensione automatica.

---

## COMPONENTI ARCHITETTURALI
*   **DB**: `reviews` (`criteria jsonb`, `rating`, `status`, `poi_id`, `itinerary_id`, …).
*   **Services**: `src/services/community/reviewService.ts` (`computeReviewAverageRating`, `parseReviewCriteria`, `saveUnifiedReview`).
*   **Context**: `InteractionContext.submitReview` — solo persistenza; **non** apre success e **non** ingoia errori.
*   **UI**: `ReviewModal.tsx`, `FeatureModals.tsx`, `ItineraryReviews.tsx`, `ItineraryManager.tsx` (admin).

## CLASSIFICAZIONE PER ENTITÀ
*   **POI & Itinerari**: **COMPLETO** (DB + UI + Moderazione + criteri).
*   **Shops & Guide**: **PARZIALE** (feedback locale in-modal, non tabella `reviews`).
*   **Eventi**: **ASSENTE**.
*   **Città**: **PARZIALE** (rating aggregato campo `ratings`).

## NOTE OPERATIVE
*   Migration colonna: `supabase/migrations/20260723140000_reviews_add_criteria.sql`.
*   Tipi generati: `src/types/supabase.ts` → `reviews.criteria: Json | null`.
*   XP mostrato in UI success: claim UX; wiring `profiles.xp` / `xp_actions` non è parte di questa pipeline di persistenza.
