# POST-MF5 â€” Consolidamento (Image Management)

> **Stato:** **IN CORSO** â€” consolidamento MF5 **non** chiuso globalmente.
> **Prima tranche (storico):** cutover read + `saveCityPerson` via RPC D90 person (payload `image_url: null`).
> **FASE 1 operativa (2026-09-23):** person RPC su DB verificate (F1-1/F1-5); client POI D90 in repo; migration POI **231530 non applicata** al DB.
> **Non** dichiarare chiuso finchÃ© restano: apply POI DB, verifica POI, write path residui, D90 residui, backfill execute, decommission legacy, import dual-write rotti, `npm run check` verde, E2E.
> **E2E manuali:** non eseguiti (come da perimetro).

Documenti di riferimento letti congiuntamente: `AI_IMAGE_MANAGEMENT_MASTER_PLAN.md` (Â§42.15â€“Â§42.17, D90), `AI_IMAGE_MANAGEMENT_AUDIT.md`, macrofasi 1â€“5, `AI_IMAGE_MANAGEMENT_FINAL_CLOSURE_PLAN.md` (registro FASE 1), `docs/testing/IMAGE_MANAGEMENT_E2E_MATRIX.md`.

---

## Distinzione storico vs corrente

| Ambito | Stato |
|--------|--------|
| **Prima tranche POST-MF5 (repository)** | Cutover read person/POI/patron; `saveCityPerson` â†’ RPC; usage map Person/POI; smoke aggiornato â€” vedi Â§ Completato prima tranche. |
| **FASE 1 operativa (2026-09-23)** | Probe DB person D90 **OK**; POI client D90 **OK**; POI DB **NON OK**; dual-write **modulo client rimosso** con import residui; backfill **solo dry-run**. |
| **Chiusura globale POST-MF5** | **NON raggiunta** â€” vedi Â§ Gap ancora aperti. |

---

## FASE 1 â€” Inventario legacy (sintesi)

### Colonne DB legacy (immagini entitÃ )

| Tabella / campo | Uso attuale nel repo | Classificazione POST-MF5 |
|-----------------|----------------------|---------------------------|
| `city_people.image_url` | Parser read; **`saveCityPerson` scrive `null` in payload**; immagine via RPC `save_city_person_with_image_assignment` (DB presente F1-1) | **B** â€” da DROP dopo migrazione dati + decommission |
| `city_people.image_storage_path` | Community, moderation | **B** / verificare community path |
| `city_people.image_is_placeholder` | Â§42.11 dual-write MF1â€“2 | **B** |
| `pois.image_url` (+ credit/license/status) | `poiMapper`, read cutover; **`saveSinglePoi` â†’ RPC** (231530 **da apply DB**); altri path (`stagingService`, â€¦) possono ancora scrivere legacy | **B** â€” write admin principale predisposto D90; **non operativo su DB** finchÃ© 231530 |
| `cities.image_url`, `hero_image`, `gallery`, `patron_details` JSON | City card, patrono legacy URL in JSON | **Misto** â€” patrono primary â†’ assignment read; hero/gallery city non ancora su `entity_image_assignments` |
| `photo_submissions.image_url` | Community pipeline | **A** fino a modello foto autonoma Â§39 |

### Servizi / pattern transitori

| Componente | Ruolo | Stato **corrente** (repo + FASE 1) |
|------------|--------|-------------------------------------|
| RPC `upsert_entity_image_assignment_dual_write` (DB) | Write assignment transitorio MF2 | **Presente su DB**; caller client **senza** modulo wrapper rimosso â€” **5 import residui** (compile gap) |
| `imageAssignmentDualWriteService.ts` | *(storico)* wrapper client dual-write | **Rimosso dal repository** nel consolidamento MF5 â€” **non** invocabile; funzione storica: incapsulare RPC dual-write lato client |
| `entityPrimaryImageReadService` | Cutover read | **Aggiornato** â€” no fallback colonne legacy |
| `imageAssignmentVisibilityService` | Mascheramento D86 | **Aggiornato** â€” no fallback senza assignment |
| `assetUsageMapService.mergeLegacyUrlUsage` | URL shop/event/guide/template + city hero | Person/POI legacy rimossi da merge |
| `entitiesService.saveCityPerson` | RPC `save_city_person_with_image_assignment` | **`image_url: null` in payload**; RPC **presente su DB** (F1-1, F1-5 verificato) |
| `cityWriteService.saveCityDetails` | API cities + patron (ex dual-write client) | **Da atomicizzare** (D90); import dual-write **rotto** finchÃ© non refactor FASE 2 |
| `poiWrite.ts` | RPC `save_poi_with_image_assignment` | **Client migrato** â€” migration `20260923153000` **non applicata al DB** â†’ save POI admin **fallisce** (PGRST202) |
| `photoService`, `mediaAssetService`, `commonsDownloadPipeline`, `cityPatronGalleryService` | Ex dual-write client | **Import residui** â€” consolidamento D90 FASE 2 |
| `backfill_media_assets_from_legacy.ts` | Migrazione batch | **Tool** â€” dry-run OK; **execute** non eseguito |
| `cleanup_orphan_storage.ts` | Orphan public-media | **A** (governance storage) |

### AtomicitÃ  D90 / Â§42.16

**Stato corrente (post prima tranche + FASE 1):**

| Flusso | Boundary | D90 |
|--------|----------|-----|
| Save person + image | `save_city_person_with_image_assignment` (server) | **SÃ¬** â€” repo + **DB** (F1-1) |
| Save POI + image | `save_poi_with_image_assignment` via `saveSinglePoi` | **SÃ¬ in repo** / **no su DB** (231530 da apply) |
| Save city + patron image | PATCH + client (ex dual-write) | **No** |
| Photo / patron gallery / wikimedia | client multi-step | **No** |

**Stato pre-MF5 / pre-D90 person (solo storico):**

- `saveCityPerson` â†’ `upsert_city_person_with_category_links` + **dual-write/revoca client** (non atomico).
- `saveCityDetails` â†’ `persistCityDetails` + dual-write patron client.
- POI / photo / gallery â†’ stesso pattern client.

**Prossimo passo architetturale (invariato):** RPC/handler server-side per ogni boundary entity+image residuo (DEC-P03, FASE 2 STEP 7â€“8).

---

## FASE 2â€“5 â€” Avanzamento prima tranche *(storico repository)*

### Completato in repository (prima tranche POST-MF5)

1. **Cutover read personaggi:** senza assignment primario corrente â†’ `imageUrl` vuoto (no fallback `city_people.image_url`).
2. **Cutover read POI:** `applyPrimaryImageCutoverForPois` su API city, fallback Supabase, `getPoisByCityId`.
3. **Patrono public URL:** `resolvePatronPrimaryImageUrl` / assignment + asset.
4. **`findExistingPortrait`:** risoluzione via assignment cutover (no query colonne immagine legacy).
5. **`saveCityPerson`:** payload RPC con `image_url: null`; immagine da input UI â†’ RPC assignment; risposta con cutover.
6. **Usage map:** rimosso merge URL legacy per Person/POI senza primary assignment.
7. **Smoke MF5:** aggiornato per POST-MF5 portrait/cutover (invarianti MF5 base invariate).

### Aggiunte FASE 1 operativa (2026-09-23) â€” oltre prima tranche

- **`poiWrite.ts`:** RPC `save_poi_with_image_assignment`; migration SQL `20260923153000` in repo (**non** apply DB).
- **Verifica DB person D90** (F1-1, F1-5); dry-run backfill **256** would-create (257âˆ’1 test person).
- **Rimozione** `imageAssignmentDualWriteService.ts` dal repo (caller non ancora rifattorizzati).

---

## Non completato (blocchi chiusura â€” **stato corrente**)

- Apply DB migration POI D90 (`20260923153000`) + **verifica save POI su DB** (F1-3)
- Backfill **`--execute`** + `--verify` (FASE 2 operativa, DEC-P01)
- Rifattorizzazione / D90 per city, patron, photo, wikimedia (**import dual-write residui**)
- Stop scrittura legacy residua (`stagingService`, `observatoryService`, patron JSON, photo paths, G21 accept suggestion)
- Delete person RPC (G06)
- DROP colonne, view, trigger legacy (DEC-P02)
- Storage cleanup oltre script esistenti
- Ricerca Â«zero fallbackÂ» su tutto il repo
- **`npm run check` verde globale** (errori noti: import dual-write mancante, altri fuori perimetro)
- E2E finali (DEC-P05)

---

## FASE 9 â€” Verifiche tecniche (sessione corrente)

| Check | Esito |
|--------|--------|
| `npm run mf5:smoke` | **PASS** |
| Biome file perimetro MF5 / FASE 1 | **PASS** su file toccati |
| `npm run typecheck` / `npm run check` | **Non verde globale** â€” import `imageAssignmentDualWriteService` mancante + errori pre-esistenti; rieseguire prima chiusura |

---

## FASE 10 â€” Report file (parziale)

### File modificati (prima tranche + estensioni FASE 1)

- `src/services/media/entityPrimaryImageReadService.ts`
- `src/services/media/imageAssignmentVisibilityService.ts`
- `src/services/mediaService.ts`
- `src/services/media/assetUsageMapService.ts`
- `src/services/city/cityReadService.ts`
- `src/services/city/entitiesService.ts`
- `src/services/city/poi/poiRead.ts`
- `src/services/city/poi/poiWrite.ts` *(FASE 1 â€” D90 client)*
- `src/services/reports/mf2DbClient.ts` *(FASE 1)*
- `scripts/smoke-mf5-image-management.ts`

### File creati / documentazione

- `AI_POST_MF5_CONSOLIDATION_REPORT.md` (questo documento)
- `AI_IMAGE_MANAGEMENT_FINAL_CLOSURE_PLAN.md` â€” registro operativo FASE 1 (non sostituisce questo report)

### Migration / RPC / DROP

- **Prima tranche:** nessuna apply in quella attivitÃ .
- **FASE 1:** migration POI `20260923153000` **solo in repo**; person 221259/221300 **giÃ  su DB** (non apply in sessione).

### Riferimenti legacy ancora necessari (A) vs da eliminare (B)

| Riferimento | Motivo |
|-------------|--------|
| RPC `upsert_entity_image_assignment_dual_write` (DB) | **A temporaneo** â€” finchÃ© flussi city/patron/photo non hanno D90; **modulo client rimosso** |
| Parser `parsePerson` legge `image_url` DB | **B** â€” innocuo con cutover display; colonna ancora in DB |
| `poiWrite` via RPC (non upsert legacy column) | **A client** / **B su DB** finchÃ© 231530 assente |
| Scritture `pois.image_url` fuori `saveSinglePoi` | **B** â€” decommission FASE 2 |
| `cityPayloadMapper` / `patron_details` | **B** per immagine patrono |
| Tipi Supabase `image_url` | **A** fino a migration DROP |

### Gap ancora aperti (espliciti)

1. **Migration POI 231530** non applicata al DB â†’ D90 POI non operativo in produzione.
2. **Test POI DB** (save + assignment) â€” non eseguito (F1-3).
3. Dati legacy senza backfill â†’ UI senza immagine dove manca assignment (mitigato solo per persona test F1-5).
4. **5 caller** con import verso servizio dual-write **rimosso** â€” gap compile + rischio inconsistenza fino a D90 FASE 2.
5. POI/patrono/community write path legacy ancora attivi **fuori** save admin D90.
6. Backfill execute, decommission, E2E, quality gate finale â€” **aperti**.

---

## Criterio di chiusura POST-MF5 (promemoria)

```
NUOVO SISTEMA (assignment + media_assets)
  â†’ UNICA FONTE READ/WRITE FUNZIONALE
  â†’ NESSUN FALLBACK LEGACY
  â†’ NESSUN DUAL-WRITE CLIENT
  â†’ ATOMICITÃ€ SERVER-SIDE (D90)
  â†’ E2E FINALI
```

**Regola:** se il nuovo sistema fallisce, **non** ripristinare fallback legacy â€” correggere assignment/asset/backfill.

**Esito attuale:** **NON CHIUSO** â€” vedi Â§ Gap ancora aperti.

---

## Cronologia documento

| Data | Modifica |
|------|----------|
| 2026-09-22 | Creazione report prima tranche POST-MF5 |
| 2026-09-23 | Allineamento post-FASE 1: person D90 su DB; POI client vs DB; dual-write modulo rimosso; distinzione storico/corrente; gap espliciti |
