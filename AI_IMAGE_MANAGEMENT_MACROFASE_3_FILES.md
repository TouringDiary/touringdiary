# Macrofase 3 — Stati immagini + provenance + AI + queue + notifiche

> **Ultimo aggiornamento:** 2026-09-16 (AI default SI/NO, D82, priorità Admin resolver)

> ## ⚠️ REGOLA OBBLIGATORIA — LETTURA CONGIUNTA
>
> Consultare **insieme**: Master Plan + Audit + **questo file**. Workflow: design → approvazione → SVILUPPO → TEST → E2E. **Solo dopo TEST MF2.**

---

## Obiettivo macrofase

- Stati immagine completi: ATTIVO, SOSPESO, RIPRISTINATO, SOSTITUITO, RIMOSSO, **VERIFICARE IMMAGINE AI**
- **Provenance** strutturata su `media_assets`
- Architettura **AI comune** (Patrono/POI/Personaggio) con step SI/NO configurabile (**D50/D51/D63** — default **SI** Personaggio · **NO** Patrono · **NO** POI; Admin può cambiare nel singolo processo; **nessuna** decisione funzionale aperta)
- Coda Admin **VERIFICARE IMMAGINE AI** + filtri geografici
- **Notifiche** badge (conteggio esclusivo stato verify)
- Sostituzione/ripristino via assignment chain — nuova immagine Admin **sostituisce** la precedente (**SOSTITUITO**) **senza** cancellarne la cronologia (§41, Master §3.6)
- Resolver immagine attiva: **priorità selezione Admin** (§3.6.A) — **senza** bypassare stati **SOSPESO/RIMOSSO** o segnalazioni in corso (§3.6.B)
- Integrazione `image_is_placeholder` / `generated_by_ai` / `origin_type` (D66)
- Resolver visibilità combinata entità+immagine (**D86**, §34.5)
- Pipeline verifica per-step + tabelle `image_verification_runs/steps` (**D80**, **§42.13**)
- Coda **VERIFICARE IMMAGINE AI**: UI griglia step (VERIFICATO/NON VERIFICATO/DUBBIO/BLOCCATO/N/A); motivazione AI separata da Admin (**D81**)
- Override Admin tracciato (**D82** — solo pipeline verifica foto reali; **≠** bypass stati moderazione §3.6)

**Classificazione decisioni (non riaprire):**
- Guest OTP (ex DF-1): requisito funzionale approvato — implementazione in **MF2**
- Evidenza permanente (ex DF-2): requisito chiuso — implementazione in **MF2**; MF3 **non** reintroduce retention
- Backfill (ex DF-3): necessità approvata — strategia tecnica in **MF5**

**Fuori scope MF3:** Wikidata, Media Library catalogo completo, safe archive (→ **MF4**); evidenza permanente (introdotta **MF2**).

**Coerenza stati:** stati **entità** = DRAFT/PUBLISHED/SUSPENDED/CANCELED (§34.2); stati **immagine/associazione** = ATTIVO/SOSPESO/… (§34.3).

**Prerequisito:** MF2 (assignments + report + evidenza permanente operativa).

---

## SVILUPPO → TEST → E2E

| Fase | Contenuto |
|------|-----------|
| **TEST** | State machine asset; transizioni RPC; notifica count = solo verify_ai |
| **E2E** | Foto dubbia → VERIFICARE IMMAGINE AI → coda Admin; AI Personaggio SI; Patrono/POI NO; sostituzione immagine → SOSTITUITO |
| **Regressioni** | Generazione portrait AI esistente; visibilità entità > immagine; evidenza MF2 consultabile |

---

## File da CREARE

| File | Motivo |
|------|--------|
| `src/services/media/imageStatusService.ts` | Transizioni stato immagine |
| `src/services/media/provenanceService.ts` | Priorità §12 resolver |
| `src/services/ai/aiImageStepConfig.ts` | Config SI/NO per entity type |
| `src/components/admin/reports/AdminAiVerifyQueue.tsx` | Coda VERIFICARE IMMAGINE AI |
| `src/components/admin/shared/GeoReportFilters.tsx` | Filtri continente→città |
| `src/hooks/admin/useReportNotificationCounts.ts` | Badge hub |
| `supabase/migrations/YYYYMMDD_image_asset_status_enum.sql` | Enum stati immagine |
| `supabase/migrations/YYYYMMDD_provenance_columns.sql` | Colonne provenance |
| `supabase/migrations/YYYYMMDD_ai_verify_queue_rpc.sql` | Query coda + counts |
| `supabase/migrations/YYYYMMDD_image_verification_pipeline.sql` | `image_verification_runs`, `image_verification_steps` (**§42.13**) |

---

## File da MODIFICARE

| File | Motivo |
|------|--------|
| `src/constants/governance.ts` | Allineamento MEDIA_STATUS vs asset_status |
| `src/hooks/admin/people/usePeopleAI.ts` | Persist provenance + AI flag; modal SI/NO |
| `src/services/ai/aiVision.ts` | Metadata post-gen su media_assets |
| `src/components/modals/CulturePersonDetailModal.tsx` | Dicitura AI |
| `src/components/admin/cityEditor/culture/CulturePersonCard.tsx` | AdminImageInput + stati |
| `src/domain/photos/photograph.ts` | Boundary WF-02 con nuovo modello |
| `src/services/media/mediaAssetService.ts` | Stati + placeholder flag |
| `src/components/admin/reports/AdminReportsAiTab.tsx` | Sotto-tab POI/Personaggio/Patrono |
| `src/components/admin/reports/AdminReportsHub.tsx` | Badge notifiche |

---

## File da VERIFICARE

| File | Motivo |
|------|--------|
| `src/services/photoService.ts` vs `mediaService.ts` | Duplicazione upload (Q13) |
| `supabase/migrations/20260908130000_famous_person_moderation_atomic_rpcs.sql` | `image_is_placeholder` write |

---

## DB / RPC / RLS / Storage

| Tipo | Dettaglio |
|------|-----------|
| **Enum** | `image_asset_status` su `media_assets` |
| **RPC** | `transition_media_asset_status`, `get_ai_verify_queue_counts` |
| **RLS** | Coda Admin admin-only |
| **Storage** | AI output path su `people_portraits/` con metadata |

---

## Dipendenze

- MF2 assignments + report + evidenza permanente
- Audit §38.G–I, N, O, U
- Master §11–§12, §36

---

*Fine Macrofase 3 — perimetro file 2026-09-15*
Aggiornato al 19.09.2026
