# Macrofase 5 — Consolidamento + regressioni + E2E finale

> **Ultimo aggiornamento:** 2026-09-19 (D90 / §42.16 atomicità post-MF5; Q10 invariato)

> ## ⚠️ REGOLA OBBLIGATORIA — LETTURA CONGIUNTA
>
> Master Plan + Audit + **questo file**. MF5 **solo dopo TEST MF4.**

---

## Obiettivo macrofase

- **Backfill** legacy (D71) — strategia **§42.15**: dual-write MF2 → batch dry-run MF5 → cutover read → drop legacy post-E2E
- Fix **`findExistingPortrait`** (persona + città, deterministico)
- Rimozione **dual-write** e codice deprecato (post-verifica)
- **E2E matrix** completa cross-flussi
- **Q10 — VERIFICA POST-SVILUPPO:** smoke test POST E2E RPC **`upsert_city_person_with_category_links`** su staging (DB + firma + PostgREST già verificati; POST applicativo reale **non** ancora eseguito) — **non** è una decisione funzionale da prendere ora
- Orphan Storage cleanup policy
- Documentazione AI_CONTEXT se richiesto da matrice workflow
- **Follow-up architetturale (D90, §42.16):** dopo completamento MF5 (backfill §42.15, cutover read, E2E matrix), progettare e implementare **atomicità end-to-end** entità + assignment per le operazioni applicative che oggi usano boundary separati (es. City Admin API + dual-write client). **Non** sostituibile con pezze client (retry/compensazione/ordine chiamate). Anticipo rispetto a MF5 **solo** con approvazione esplicita — vedi Audit §41.

---

## SVILUPPO → TEST → E2E

| Fase | Contenuto |
|------|-----------|
| **TEST** | `npm run check` full; integrazione report + media + backfill campione |
| **E2E matrix** | Tutti i flussi §6 Master; hub completo; evidenza permanente (MF2); auto-SUSPEND casi §34.6–§34.7; Patrono SUSPENDED → SUGGERISCI; solo Foto → entità PUBLISHED; POI Rivendica invariato |
| **Regressioni** | Culture corner; gallery; lightbox; import AI city |

**Criterio completamento:** E2E matrix verde; backfill verificato su campione rappresentativo; strategia backfill documentata e applicata.

---

## File da CREARE

| File | Motivo |
|------|--------|
| `scripts/backfill_media_assets_from_legacy.ts` | Backfill batch incrementale (**§42.15**) |
| `scripts/cleanup_orphan_storage.ts` | Policy orphan (dry-run default) |
| `docs/testing/IMAGE_MANAGEMENT_E2E_MATRIX.md` | Checklist E2E (opzionale) |

**Backfill:** strategia tecnica **chiusa** in Master Plan **§42.15**.

---

## File da MODIFICARE

| File | Motivo |
|------|--------|
| `src/services/mediaService.ts` | `findExistingPortrait`, `getAssetUsageMap` → assignment-based |
| `src/hooks/admin/people/usePeopleAI.ts` | Lookup media_assets |
| `src/hooks/admin/useAiCompleteCity.ts` | Idem |
| `src/hooks/admin/useAiMagicCity.ts` | Idem |
| `src/components/admin/cityEditor/culture/editorCultureRegeneration.ts` | Idem |
| `src/services/entitiesService.ts` | Cutover read da assignment (post-backfill) |
| `src/types/supabase.ts` | Rigenerazione post-migration finali |
| File deprecati MF2 | Rimozione modali/report service legacy se migrati |

---

## File da ELIMINARE (dopo verifica)

| File | Motivo |
|------|--------|
| `src/components/modals/ReportFamousPersonPhotoAbuseModal.tsx` | Se sostituito da ReportAbuseModal |
| Servizi report legacy duplicati | Post-migrazione contentReportService |
| Dual-write paths in entitiesService | Post-cutover |

**Drop colonne legacy:** solo dopo E2E completa + **approvazione esplicita**.

---

## File da VERIFICARE (matrice E2E)

| File / area | Flusso |
|-------------|--------|
| `CultureCornerModal.tsx` | Personaggio + Segnala abuso |
| `ReportAbuseModal.tsx` | Tipologia + note + preview + evidenza |
| `PoiClaimModal.tsx` | Rivendica **non** regression |
| `SuggestionModal.tsx` | POI dropdown errori |
| Public city gallery | Community abuso foto |
| Home Esplora | Tre pulsanti Segnala abuso |
| POI / Patron public pages | Segnala abuso |
| `AdminReportsHub.tsx` | Hub completo 4 macro-tab |
| `AdminAssetLibrary.tsx` | Catalogo utilizzi |

---

## DB / RPC / RLS / Storage

| Tipo | Dettaglio |
|------|-----------|
| **Backfill** | Strategia **§42.15** — dual-write → batch dry-run → cutover |
| **RPC `upsert_city_person_with_category_links`** | Esistenza DB ✅ · Firma ✅ · PostgREST ✅ · **Q10 — VERIFICA POST-SVILUPPO:** POST E2E reale su staging ⚪ non eseguito (non decisione funzionale) |
| **Storage** | Orphan audit people_portraits, report-evidence, community |
| **Migration** | Drop legacy — solo post-E2E + approvazione |
| **Atomicità entità + assignment (D90)** | Requisito **§42.16** — deliverable architetturale **post-chiusura MF5** (o task approvato separatamente); fuori dal perimetro «dual-write transitorio» §42.15 |

---

## Dipendenze

- MF1–MF4 complete
- Audit §38.C, S, W, **§41**; D71, **D90**
- Master §28, **§42.16**, Appendice C (A5 findExistingPortrait)

---

*Fine Macrofase 5 — perimetro file 2026-09-15*
Aggiornato al 19.09.2026
