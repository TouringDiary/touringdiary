# ⭐️ DOC 27: USER REVIEW SYSTEM (v1.0 — CERTIFIED)

Questo documento descrive l'architettura del sistema di recensioni e feedback degli utenti su TouringDiary.

---

## DESCRIZIONE SEMPLICE
Il sistema permette agli utenti di lasciare voti (1-5 stelle) e commenti testuali su vari elementi dell'app (POI, Itinerari, Shops, Guide). Include un sistema di moderazione admin e supporta recensioni multi-criterio per una valutazione più accurata.

## DESCRIZIONE TECNICA
Il sistema utilizza un'architettura ibrida: una tabella centralizzata (`reviews`) per POI e Itinerari, e campi JSON (`reviews`) per Shop e Guide. Le recensioni passano attraverso uno stato `pending` prima di essere approvate e diventare pubbliche.

---

## PIPELINE RUNTIME (POI & ITINERARI)
1. **Trigger**: L'utente apre il modal di dettaglio e clicca su "Scrivi Recensione".
2. **Input**: Viene aperto `ReviewModal.tsx` che carica i criteri in base alla categoria (es: Cibo, Servizio per ristoranti).
3. **Sottomissione**: `InteractionContext` invoca `communityService.saveUnifiedReview`.
4. **Persistenza**: Il record viene inserito nella tabella Supabase `reviews` con status `pending`.
5. **Gamification**: Il sistema calcola XP bonus (+10 per voto, +20 per testo > 10 parole).
6. **Moderazione**: L'admin approva la recensione tramite l'Admin Panel, rendendola visibile globalmente.

---

## COMPONENTI ARCHITETTURALI
*   **Tabelle Database**: 
    *   `reviews`: Tabella master strutturata.
    *   `shops` / `city_guides`: Campi JSON per feedback locali.
*   **Services**: `communityService.ts` (Core logic), `shopService.ts`.
*   **Context**: `InteractionContext.tsx` (Gestione voti e UI updates).
*   **Componenti UI**: 
    *   `ReviewModal.tsx`: Wizard di inserimento.
    *   `StarRating.tsx`: Visualizzatore stelle.
    *   `ShopReviews.tsx`: Gallery feedback botteghe.

## CLASSIFICAZIONE PER ENTITÀ
*   **POI & Itinerari**: **COMPLETO** (DB + UI + Moderazione).
*   **Shops & Guide**: **PARZIALE** (Solo lettura/JSON, sottomissione locale).
*   **Eventi**: **ASSENTE** (Nessun sistema di rating trovato).
*   **Città**: **PARZIALE** (Rating aggregato tramite campo `ratings` in `cities`).
