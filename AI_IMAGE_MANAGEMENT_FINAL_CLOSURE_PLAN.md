# Image Management â€” Final Closure Plan + Audit & Decision Log

> **Tipo documento:** registro operativo ufficiale (non Master Plan).
> **Regola:** nessuna modifica DB/codice senza approvazione esplicita e voce aggiornata qui.

**Ultimo aggiornamento:** 2026-09-23 (FASE 1 â€” allineamento registro DB/G05/STEP 3â€“4 + evidenze F1-1â€¦F1-5)
**Stato chiusura globale:** **NON CHIUSO**
**Audit preparatori (repository):** **COMPLETATI**
**Verifica integrata (file perimetro + DB + dry-run):** **COMPLETATA** â€” vedi Â§ Verifica integrata
**Piano operativo a 2 fasi:** Â§ Piano operativo FASE 1 / FASE 2
**Autorizzazione FASE 2:** **NON CONCESSA** â€” vedi Â§ Condizioni autorizzazione FASE 2
**FASE 1 (implementazione):** **NON COMPLETATA** â€” vedi Â§ FASE 1 â€” Registro esecuzione 2026-09-23

---

## Vincolo operativo (consolidamento)

Durante questa fase di sviluppo lâ€™utente **non** caricherÃ  nÃ© gestirÃ  **nuove** immagini sul sito in parallelo al consolidamento.

- **Non** sostituisce verifiche tecniche obbligatorie.
- **Non** autorizza a saltare controlli su write path, backfill o D90.
- Chiarisce che il rischio Â«caricamenti live durante backfillÂ» Ã¨ **assente** per scelta operativa (rafforza **DEC-P10**: POI write prima del backfill senza urgenza di dual-write temporaneo solo per proteggere upload paralleli).

---

## Current State

### GiÃ  completato (evidenza repository â€” audit chiusi)

| Area | Evidenza |
|------|----------|
| MF1â€“MF4 stack migration + servizi core | `202609161*` â€¦ `202609201*` |
| Cutover read POST-MF5 person/POI/patron | `entityPrimaryImageReadService.ts` |
| Person save D90 (SQL + client) | `20260922130000_*`, `entitiesService.saveCityPerson` |
| `findExistingPortrait` city-scoped | `mediaService.ts`, smoke |
| Inventario dual-write callers | A-WRITE-01 |
| POI write D90 (client repo) | `poiWrite.ts` â†’ `save_poi_with_image_assignment`; **DB RPC 231530 da apply** (F1-2) |
| Backfill script audit completo | A-BF-PREP |
| Report A/B/C | A-REP-02 |
| AdminFamousPeopleManager mappatura | A-ADM-02 â†’ **READY FOR REMOVAL** (condizionato DEC-P11) |
| D90 census (repository) | A-D90-CENSUS |
| Delete person vs DEC-P04 | A-DEL-PERSON-01 |
| Migration/RPC **definizioni** in repo | A-DB-REPO |
| Contraddizioni doc note | A-DOC-02 |
| Pattern feedback Admin | A-D90-UI â†’ `AdminToast` + `useAdminCityEditorLogic` |

### Incompleto / intervento futuro (non audit â€” implementazione)

| Area | Gap / step |
|------|------------|
| POI write definitivo + assignment | G15, STEP 3â€“4, DEC-P10 |
| Backfill execute | G01, STEP 5â€“6 |
| D90 flussi residui | G04, G16, â€¦ |
| Delete person RPC | G06, STEP 9 |
| Dual-write removal | G03, DEC-P06, STEP 10 |
| Legacy decommission | G09, DEC-P02, STEP 12 |
| E2E | G02, DEC-P05, STEP 18 |
| `accept_famous_person_photo_suggestion` scrive legacy | **G21** (nuovo) |

### DB VERIFICATION â€” esito su DB reale (2026-09-23, read-only)

> **Stato DB corrente (post F1-1, probe RPC diretto):** `upsert_entity_primary_image_assignment` e `save_city_person_with_image_assignment` **PRESENTI** sul DB target (risposta semantica â‰  PGRST202; firme come migration repo). **`save_poi_with_image_assignment` (231530): ASSENTE** â€” PGRST202 finchÃ© non apply `20260923153000`. Stack MF1â€“MF4 + person D90 **sÃ¬**; POI D90 **no** (solo repo + client).

| ID | Esito | Dettaglio |
|----|--------|-----------|
| **DBV-01** | **PARZIALE â€” gap migration POI** | *(Evidenza iniziale sessione â€” **superata per person D90** da F1-1; conservata come storico.)* Tabelle MF5 presenti e leggibili. **Allâ€™epoca DBV-01:** PGRST202 su `save_city_person_with_image_assignment` / `upsert_entity_primary_image_assignment`. **Presenti giÃ  allora:** `ensure_media_asset_from_source`, `upsert_entity_image_assignment_dual_write`, `ensure_current_image_assignment`. **Stato corrente:** person RPC **presenti** (F1-1); **residuo:** migration POI `20260923153000` non applicata. CLI `supabase migration list` non disponibile in ambiente locale (path npm); evidenza via RPC PostgREST. |
| **DBV-02** | **OK (service_role)** | `ensure_media_asset_from_source` invocabile con firma script (`p_image_url`, `p_storage_bucket`, `p_storage_path`, `p_origin_type`); risposta attesa su sorgente nulla: `P0001` Â«Immagine sorgente assenteâ€¦Â» (funzione esiste, semantica coerente). Backfill dry-run **non** invoca RPC (solo `--execute`). |
| **DBV-03** | **OK (baseline)** / **aggiornato post F1-5** | Baseline read-only: `city_people` legacy image **1**; `pois` `image_url` non vuoto **255**; assignment primary+current **0**; `media_assets` **0**. **Post F1-5 (side-effect test):** **1** persona con primary assignment (`Poppea Sabina`); dry-run `would create` **256** (257âˆ’1). Patron `imageUrl` in JSON: **1** (coerente dry-run). |
| **DBV-04** | **PARZIALE** | Schema tabelle core **leggibile** e allineato alle query app/script (select/insert shape). *(Storico DBV-04: drift person 221259/221300 Â«solo repoÂ» â€” **non piÃ¹ valido** per person; F1-1.)* **Drift corrente:** RPC POI D90 **231530 solo in repo**. Campione MF5: almeno **1** assignment post F1-5; resto legacy non backfillato. RLS non interrogata via SQL diretto; accesso service_role OK su tabelle elencate. |

**Dry-run backfill (DB reale, no `--execute`):** eseguito `npm run mf5:backfill:dry-run` (baseline iniziale **257** scanned / **257** would create, pre-F1-5; **stato corrente** post F1-4/F1-5 sotto).

| Metrica | Valore (corrente F1-4/F1-5) |
|---------|--------|
| scanned | 256 |
| would create | 256 |
| skipped (giÃ  migrati) | 0 |
| conflicts | 0 |
| errors | 0 |
| partialFailures | 0 |
| post-run `--verify` integrato | **FAILED** â€” 256 legacy senza primary assignment (atteso **prima** dellâ€™execute) |

**Nota dry-run:** modalitÃ  DRY-RUN = **read-only** (SELECT legacy + SELECT assignment; nessun RPC mutativo). Exit code 1 per verify post-dry-run, non per errori di simulazione.

**Rischio pre-execute:** zero conflitti storage nel campione; **blocco operativo corrente** = **DEC-P10** STEP 3â€“4: apply migration POI **`20260923153000`** + verifica save POI su DB (person D90 su DB **OK** â€” F1-1 / F1-5). Backfill **non** dipende dalle RPC person D90.

---

## Macrofasi (solo 3)

| Macrofase | Nome |
|-----------|------|
| **1** | CHIUSURA E CONSOLIDAMENTO |
| **2** | ARCHITETTURA DEFINITIVA |
| **3** | QUALITY GATE E CHIUSURA FINALE |

### Distinzione terminologica (obbligatoria)

- **Macrofasi 1â€“3:** roadmap architetturale a lungo periodo (tabella sopra + colonna Â«MacrofaseÂ» in Execution Order). **Non** aggiungere altre macrofasi.
- **FASE 1 / FASE 2 operative:** ondate di esecuzione correnti (Â§ Piano operativo â€” 2 fasi). **FASE 1** = preparazione, raddrizzamento, validazione (**include STEP 3â€“4** per DEC-P10, senza backfill `--execute`). **FASE 2** = esecuzione definitiva (backfill execute, decommission, E2E, â€¦) solo dopo autorizzazione esplicita.
- Uno stesso STEP puÃ² appartenere a una **macrofase** (es. STEP 3 = macrofase **2**) e contemporaneamente alla **FASE operativa 1** (implementazione POI D90 + verifica).

---

## Execution Order â€” piano operativo definitivo

Colonna **Macrofase** = macrofasi 1â€“3 (non confondere con FASE operativa 1/2).

| STEP | Macrofase | AttivitÃ  | Prerequisiti | â›” Non prima di | Verifica OK | Sblocca |
|------|------|----------|--------------|-----------------|-------------|---------|
| **1** | 1 | Audit DB read-only (**DBV-01â€¦04**) | Accesso Supabase | backfill execute | Report migration/RPC | 2â€“5 |
| **2** | 1 | Baseline dati legacy vs assignment (conteggi) | STEP 1 | backfill execute | A-DATA-01 metrics | 3 |
| **3** | 2 | **POI write path definitivo** (D90 o RPC equivalente; no solo `image_url`) | DEC-P10 | backfill | Nessuna scrittura POI solo legacy | 4, 5 |
| **4** | 1 | Verifica POI (grep + test manuale minimo / save POI senza immagine) | STEP 3 | backfill execute | A-POI-VERIFY | 5 |
| **5** | 1 | Backfill dry-run â†’ review log | STEP 2, 4, DEC-P01 | `--execute` senza review | Log dry-run | 6 |
| **6** | 1 | Backfill **execute** + `--verify` (no wipe dati test) | STEP 5, approvazione | legacy off | A-POST-BF-01 | 7+ |
| **7** | 2 | Completamento altri write path (patron, photo, gallery, wikimedia, **G21**) | STEP 6 preferibile | dual-write DROP | A-WRITE-CENSUS gap chiusi | 8 |
| **8** | 2 | **D90** per ogni flusso entity+image residuo + **AdminToast** feedback | STEP 7 | E2E | A-D90-CENSUS tutti ðŸŸ¢ | 9â€“10 |
| **9** | 2 | **Delete person** RPC coerente DEC-P04 (revoke assignment, no delete asset condiviso, history) | STEP 8 design | â€” | G06 chiuso | 10 |
| **10** | 2 | Rimozione caller dual-write per flusso (**DEC-P06**) | STEP 8 per flusso | DROP RPC dual-write | grep zero | 11 |
| **11** | 2 | Report: valutare rimozione **C** (`ensure_current_image_assignment`) | STEP 6, legacy read cutover, dati backfill | rimuovere C pre-dati | A-REP-03 | 12 |
| **12** | 2 | **Legacy decommission** read/write/fallback (**DEC-P02**) + inventario Â§42.17 | STEP 6â€“10 | DROP | A-DEC-01 | 13â€“14 |
| **13** | 2 | Rimozione **AdminFamousPeopleManager** + route/menu (**DEC-P11**) | A-ADM-02 READY, STEP 12 categorie | rimozione se funzioni mancanti | Nav + hub | 14 |
| **14** | 2 | DROP colonne/RPC/view (solo lista approvata) | STEP 12, **DEC-P05** prereq E2E non ancora | DROP prima E2E | A-DEC-02 | 15 |
| **15** | 2â†’3 | Rigenerare `src/types/supabase.ts`; ridurre `mf2DbClient` | Migration applicate | â€” | A-TYPE-01 | 16 |
| **16** | 3 | `npm run check`, Biome perimetro image, smoke MF5 | STEP 10â€“15 | E2E | PASS | 17â€“18 |
| **17** | 3 | Smoke MF5 (ripetizione) | STEP 16 | â€” | A-SMOKE-01 | 18 |
| **18** | 3 | **E2E matrix finale** (**DEC-P05**) | STEP 1â€“17 | E2E ora | A-E2E-01 | 19 |
| **19** | 3 | Audit architetturale A-ARCH-01 â†’ **CHIUSO** / **NON CHIUSO** | STEP 18 | â€” | Criteri Â§ Final Closure | â€” |

**Ordine POI â†’ Backfill (DEC-P10):** STEP **3 â†’ 4 â†’ 5 â†’ 6** (non invertire).

---

## Decision Log

### Decisioni architetturali base (DEC-001â€¦010)

Invariate (Master Plan, POST-MF5 read, city fuori scope assignment, no DROP senza approvazione).

### Decisioni utente â€” **DECISA**

| ID | Decisione | Data |
|----|-----------|------|
| **DEC-P01** | Backfill **obbligatorio**; no wipe dati test; audit pre-execute; execute non in preparatoria | 2026-09-22 |
| **DEC-P02** | Legacy spento **solo dopo** backfill verificato; inventario prima di eliminazioni | 2026-09-22 |
| **DEC-P03** | D90 **completare**; feedback Admin success/error via pattern esistente (`AdminToast`) | 2026-09-22 |
| **DEC-P04** | Delete person: asset autonomo, multi-assignment, storico; audit solo implementazione | 2026-09-22 |
| **DEC-P05** | E2E finali **solo** STEP 18 (dopo architettura + check) | 2026-09-22 |
| **DEC-P06** | Rimuovere RPC dual-write quando caller=0 e D90 ok | 2026-09-22 |
| **DEC-P10** | **POI write definitivo PRIMA del backfill**; ordine: POI â†’ verifica â†’ backfill â†’ verifica backfill | 2026-09-23 |
| **DEC-P11** | Rimuovere `AdminFamousPeopleManager` + route/menu **se e solo se** audit certifica migrazione completa | 2026-09-23 |

### Audit preparatori â€” esito (ex DEC-P07â€¦P09)

| ID | Esito |
|----|--------|
| DEC-P07 Report | **Chiuso** â€” A-REP-02; **DECISION REQUIRED:** no |
| DEC-P08 Manager | **Chiuso** â€” A-ADM-02; **READY FOR REMOVAL** (post STEP 13) |
| DEC-P09 Ordine | **Chiuso** â€” STEP 1â€“19; **ORD-STEP4** risolto da **DEC-P10** |

### Decisioni / ordering

| ID | Stato |
|----|--------|
| ~~DEC-R01 / ORD-STEP4~~ | **Chiuso** â†’ **DEC-P10** |
| **DEC-R02** (entry point categorie) | **Opzionale** â€” rimozione route implica categorie solo da Edit cittÃ  (coerente DEC-P11) |

**DECISION REQUIRED:** **nessuna** funzionale aggiuntiva obbligatoria prima degli interventi (salvo approvazione operativa **apply migration POI 231530** â€” person D90 giÃ  su DB).

---

## Audit Register (completo)

Formato: **ID â†’ domanda â†’ evidenza â†’ risultato â†’ conseguenza â†’ stato**

| ID | Domanda | Evidenza | Risultato | Conseguenza | Stato |
|----|---------|----------|-----------|-------------|-------|
| **A-DB-REPO** | Quali migration/RPC image esistono nel repo e ordine? | 23 file `202609*` + `202608*` community; chain: 161202 media_assets â†’ 161300 assignments â†’ 161302 report+ensure_media_asset â†’ 181200 dual_write â†’ 191403 replace dual_write â†’ 201203 dual_write+history â†’ 221259 primary assignment â†’ 221300 save person â†’ 231530 POI D90 | Definizioni complete in repo; **apply su target = DBV + F1-*** | STEP 1 | **COMPLETATO** (repo) |
| **A-DB-01** | DB target allineato? | DBV-01 + F1-1 2026-09-23 | **Parziale** â€” person 221259/300 **presenti** (F1-1); POI **231530 assente** | Apply migration POI prima save POI D90 operativo | **COMPLETATO** (con gap POI) |
| **A-DB-02** | RPC 221259/300 presenti? | Probe F1-1 (â‰  PGRST202) | **Presenti** su DB target | â€” (person); POI â†’ apply 231530 | **COMPLETATO** |
| **A-DATA-01** | Quanti legacy vs assignment? | DBV-03 + dry-run | 257 legacy / 0 assignment | Baseline registrata | **COMPLETATO** |
| **A-BF-PREP** | Backfill pronto? | `scripts/backfill_media_assets_from_legacy.ts` | Vedi Â§ Backfill Audit | STEP 5â€“6 | **COMPLETATO** |
| **A-POST-BF-01** | Post-backfill OK? | `--verify` in script | Dopo execute | STEP 6 | **NON ESEGUITO** |
| **A-WRITE-01** | Caller dual-write? | 6 moduli + RPC 201203 | Elenco chiuso | STEP 10 | **COMPLETATO** |
| **A-WRITE-02** | POI write? | `poiWrite.saveSinglePoi` â†’ RPC `save_poi_with_image_assignment` (repo); DB RPC **assente** finchÃ© 231530 | **Client D90**; **DB non operativo** | Apply 231530 + F1-3 **DEC-P10** | **COMPLETATO** (audit) |
| **A-WRITE-CENSUS** | Tutti i write path? | Vedi Â§ Write Path Census | **G21** aggiuntivo trovato | STEP 7 | **COMPLETATO** |
| **A-D90-CENSUS** | D90 per flusso? | Vedi Â§ D90 Census | Person **repo+DB**; POI **repo only**; resto assente/parziale | STEP 8 | **COMPLETATO** (census) |
| **A-D90-UI** | Feedback UI? | `AdminToast`, `AdminCityEditor.tsx` | Riutilizzare per D90 | STEP 8 | **COMPLETATO** |
| **A-DEL-PERSON-01** | Delete vs DEC-P04? | `deleteCityPerson` DELETE only; assignments RESTRICT media; no FK personâ†’assignment | **Gap G06** â†’ RPC STEP 9 | STEP 9 | **COMPLETATO** |
| **A-REP-02** | Report A/B/C? | Hub + `create_content_report_group` + ensure_current | C transitorio fino legacy empty | STEP 11 | **COMPLETATO** |
| **A-REP-03** | Rimuovere C? | Dopo backfill + assignmentId ovunque | Intervento Fase 2 | STEP 11 | **NON ESEGUITO** (runtime) |
| **A-ADM-02** | Manager migrato? | Tabella Â§ Manager | **READY FOR REMOVAL** | STEP 13 DEC-P11 | **COMPLETATO** |
| **A-HIST-01** | History su D90 person? | `221259` chiama `append_entity_image_history_trusted` | **Presente** in SQL person primary | â€” | **COMPLETATO** (repo) |
| **A-GOV-01** | D86 post-cutover | Assignment-only read | **DBV + E2E** | STEP 18 | **PARZIALE** |
| **A-UI-01** | Gate `imageUrl` UI | `CultureCornerModal` | Possibile fix post-backfill | STEP 7 opzionale | **COMPLETATO** (identificato) |
| **A-DOC-02** | Contraddizioni doc | Â§ Contraddizioni | Registrate | STEP 19 doc update | **COMPLETATO** |
| **A-SMOKE-01** | Smoke statico | PASS storico | Ripetere post-code | STEP 17 | **COMPLETATO** (snapshot) |
| **A-TYPE-01** | Typecheck | mf2 cast; check globale altri errori | STEP 15 | **PARZIALE** |
| **A-E2E-01** | E2E | DEC-P05 | STEP 18 | **NON ESEGUITO** |
| **A-ARCH-01** | Audit finale | â€” | STEP 19 | **NON ESEGUITO** |
| **A-DEC-01** | Inventario legacy | Â§ Legacy Inventory | STEP 12 | **COMPLETATO** (repo census) |
| **A-ORPHAN-01** | Orphan script | `cleanup_orphan_storage.ts` | Post-backfill opzionale | **COMPLETATO** (repo) |

### Audit chiusi (repository + DB read-only): **21**
### Audit aperti (runtime/post-intervento): **A-POST-BF-01, A-REP-03, A-GOV-01 (parziale), A-E2E-01, A-ARCH-01, A-TYPE-01 (parziale)**

---

## Verifica integrata â€” file perimetro (2026-09-23)

Riferimenti: `AI_POST_MF5_CONSOLIDATION_REPORT.md`, decisioni DEC-P01â€¦P11. Classificazione interventi aperti: **A** completo Â· **B** parziale Â· **C** errato da raddrizzare Â· **D** mancante Â· **N** non ripetere (giÃ  coperto).

| File | Piano / ruolo | Esito | Note |
|------|---------------|-------|------|
| `entityPrimaryImageReadService.ts` | Cutover read person/POI/patron POST-MF5 | **A** | SoT display solo `media_assets` pubblicabile; no fallback colonne legacy; usa `mf2EntityImageAssignmentsTable`. **Conservare.** |
| `poiRead.ts` | Cutover read POI | **A** | `applyPrimaryImageCutoverForPoisList` su paginazione/batch. Filtri PostgREST multi-OR corretti. Biome OK. **Conservare.** |
| `cityReadService.ts` | Orchestrazione read cittÃ  | **A** | Applica cutover people/POI dove previsto. Patrono public via visibility/assignment (non JSON URL display). **Conservare.** |
| `entitiesService.ts` | Person write D90 + delete gap | **A / D** | `saveCityPerson`: payload `image_url: null` + RPC `save_city_person_with_image_assignment` â€” **corretto in repo**; **RPC presenti su DB** (F1-1, F1-5 verificato). `deleteCityPerson`: solo DELETE row (**D** STEP 9, invariato DEC-P04). **Non reintrodurre dual-write client.** |
| `mediaService.ts` | Portrait + usage | **A** | `findExistingPortrait(name, cityId)` via assignment cutover; no read `image_url`. **Conservare.** |
| `assetUsageMapService.ts` | Usage map | **A** | Assignment SoT; `mergeLegacyUrlUsage` solo entitÃ  fuori perimetro Person/POI (shop/event/city hero). **Conservare** fino a decommission. |
| `imageAssignmentVisibilityService.ts` | Patron visibility | **A** | Hero/gallery fail-closed su assignment+asset. **Conservare.** |
| `imageAssignmentDualWriteService.ts` | Transitorio MF2 | **C (repo)** | Modulo **rimosso** dal repository (consolidamento MF5); **non** ancora sostituito ovunque â€” **5 file** con import residuo (compile gap, **G03**). RPC DB `upsert_entity_image_assignment_dual_write` **ancora presente** (DBV). D90 + STEP 10 FASE 2 per flussi city/patron/photo/wikimedia. **Non reintrodurre** dual-write client come SoT person/POI. |
| `mf2DbClient.ts` | Boundary tipi temporaneo | **B** | Include `save_city_person_with_image_assignment` in union RPC â€” **corretto**; resta fino STEP 15 tipi. **Conservare.** |
| `PatronSaintModal.tsx` | UI patrono public | **B** | Hero async `resolvePatronPrimaryImageUrl` (assignment); **senza backfill UI patrono primary vuota** (DBV-03). ARIA `dialog`, mobile full-screen + `md:` â€” OK. **Nessuna modifica obbligatoria** pre-backfill; opzionale gate G18 post-backfill. |
| `20260922125900_upsert_entity_primary_image_assignment.sql` | D90 helper person primary | **A (DB)** | Applicata su DB target (F1-1); assenza iniziale solo in evidenza storica DBV-01. |
| `20260922130000_save_city_person_with_image_assignment.sql` | D90 person save | **A (DB)** | Idem F1-1; GRANT `authenticated` (admin app). |
| `smoke-mf5-image-management.ts` | Gate statico MF5 | **A** | `npm run mf5:smoke` **PASS** post-verifica. **Conservare.** |
| `AI_POST_MF5_CONSOLIDATION_REPORT.md` | Report tranche | **B (doc)** | Allineato post-FASE 1 su person D90 e dual-write rimosso; resta report storico/prima tranche + gap aperti. |
| `scripts/backfill_media_assets_from_legacy.ts` | Backfill (verificato, fuori elenco utente) | **A** | Dry-run read-only OK; idempotenza skip assignment; **corrente (F1-4/F1-5):** 256 scanned / 256 would-create / 0 skipped / 0 conflicts / 0 errors / 0 partialFailures; verify fallisce finchÃ© non execute. *(Baseline storica pre-F1-5: 257 scanned / 257 would-create.)* **Execute solo FASE 2** dopo DEC-P10 POI write. |

**Interventi piano â€” stato reale (A/B/C/D):**

| Intervento | Stato |
|------------|-------|
| Cutover read POST-MF5 | **A** |
| Person save D90 (codice) | **A** |
| Person save D90 (DB RPC) | **A** â€” 221259/221300 presenti su DB (probe FASE 1) |
| POI write definitivo | **B** â€” client D90 in repo; **DB RPC 231530 da apply** |
| Backfill | **B** â€” script pronto; DB pronto; dry-run **256** would-create (F1-4/F1-5); execute FASE 2 |
| D90 residuo (city/poi/photo/â€¦) | **D** |
| Delete person RPC | **D** |
| Dual-write removal | **D** â€” modulo client rimosso; RPC DB + import residui (**G03**) |
| ensure_current (report C) | **A** transitorio â€” RPC presente su DB |
| AdminFamousPeopleManager removal | **D** â€” FASE 2 STEP 13 |
| Legacy decommission | **D** |
| G21 accept photo suggestion | **D** |
| Tipi Supabase | **D** â€” STEP 15 |
| Smoke | **A** statico |
| E2E | **D** |

**Non rifare:** cutover read, `findExistingPortrait` city-scoped, payload `image_url: null`, rimozione merge legacy Person/POI in usage map.

---

## Piano operativo â€” 2 fasi (definitivo post-verifica)

### FASE 1 â€” PREPARAZIONE, RADDRIZZAMENTO E VALIDAZIONE

**Completato in questa esecuzione (FASE 1 â€” mutazioni DB solo F1-5 test person autorizzato):**

- Verifica integrata file perimetro + Biome su file toccati (**PASS**).
- DBV-01â€¦04 read-only + probe RPC; **F1-1:** person RPC **presenti** (supera assenza storica DBV-01).
- Implementazione client POI D90 + migration **231530 in repo** (apply DB **pendente**).
- Dry-run backfill su DB reale + analisi verify (**256** would-create).
- Smoke MF5 statico (**PASS**); F1-5 save person su DB (**OK**).

**Escluso da FASE 1:** backfill `--execute`, DELETE/DROP, rimozione dual-write, decommission legacy, E2E finali.

---

## FASE 1 â€” Registro esecuzione 2026-09-23

**Esito globale FASE 1:** **NON COMPLETATA** (blocco: apply migration POI D90 su DB reale + test POI end-to-end).

### F1-1 â€” APPLY MIGRATION PERSON D90

| Voce | Esito |
|------|--------|
| Apply `20260922125900` / `20260922130000` in questa sessione | **Non necessario** â€” giÃ  presenti sul DB target (probe RPC 2026-09-23: risposta semantica â‰  PGRST202) |
| `upsert_entity_primary_image_assignment` | **Presente** â€” firma `(p_entity_id uuid, p_city_id text, p_image_url, p_storage_bucket, p_storage_path, p_origin_type)` |
| `save_city_person_with_image_assignment` | **Presente** â€” firma `(p_person jsonb, p_specific_category_ids uuid[], p_image_url, p_storage_bucket, p_storage_path, p_origin_type)` â†’ `uuid` |
| SECURITY | **SECURITY DEFINER** + `search_path = public, pg_temp` (come migration repo) |
| GRANT | **EXECUTE â†’ authenticated** (migration repo); service_role bypassa gate in funzione |
| Dipendenze | `upsert_city_person_with_category_links` **presente** (probe OK) |
| File repo 221259/221300 | **Invariati** rispetto allâ€™approvazione (nessun apply locale in sessione) |

**Nota vs DBV-01 precedente:** il gap Â«RPC assentiÂ» era obsoleto al momento dellâ€™implementazione FASE 1; rieseguito probe diretto.

### F1-2 â€” POI WRITE DEFINITIVO

| Voce | Esito |
|------|--------|
| Client | `src/services/city/poi/poiWrite.ts` â†’ `mf2Rpc('save_poi_with_image_assignment')`; payload RPC con `image_url` azzerato lato SQL; **nessun** `from('pois').upsert` |
| Boundary tipi | `mf2DbClient.ts` â€” union RPC `save_poi_with_image_assignment` |
| Migration nuova (repo) | `20260923153000_poi_d90_save_with_image_assignment.sql` â€” `upsert_poi_primary_image_assignment` + `save_poi_with_image_assignment` (pattern 221259/221300) |
| Apply migration POI su DB | **NON ESEGUITO** â€” `PGRST202` su `save_poi_with_image_assignment`; ambiente senza `SUPABASE_DB_URL` / `DATABASE_URL` per DDL (`scripts/f1_apply_sql_migration.cjs`) |
| Dual-write client POI | **Non introdotto** |

### F1-3 â€” VERIFICA POI

| Controllo | Esito |
|-----------|--------|
| `saveSinglePoi` / admin POI path | **Nuovo percorso D90** (RPC) â€” operativo solo post-apply 231530 |
| Scritture legacy `pois.image_url` residue | **SÃ¬ (fuori saveSinglePoi):** `stagingService.ts`, `observatoryService.ts`, `cityLifecycleService.ts` (seed) â€” **non** introdotte in FASE 1; decommission FASE 2 |
| Smoke MF5 | **PASS** (inclusi assert `poiWrite` D90) |
| TypeScript file toccati | **Nessun errore** su `poiWrite.ts` / `mf2DbClient.ts` (check globale repo non rieseguito completo) |
| Biome file toccati | **PASS** (`poiWrite.ts`, `mf2DbClient.ts`, `smoke-mf5-image-management.ts`) |
| Test POI DB (save + assignment) | **NON ESEGUITO** â€” RPC assente su DB |

### F1-4 â€” NUOVO DRY-RUN BACKFILL

| Metrica | Baseline | Post FASE 1 (2026-09-23) | Î” / causa |
|---------|----------|---------------------------|-----------|
| scanned | 257 | **256** | âˆ’1: `city_person` con immagine giÃ  coperta da assignment (F1-5 test Poppea Sabina) |
| would create (`created` dry-run) | 257 | **256** | Idem |
| skipped | 0 | 0 | |
| conflicts | 0 | 0 | |
| errors | 0 | 0 | |
| partialFailures | 0 | 0 | |
| verify post-dry-run | FAILED atteso | **FAILED atteso** (256 legacy senza assignment) | |
| Anomalie URL/storage | â€” | **Nessuna** nel log | |

**Backfill `--execute`:** **non eseguito** (perimetro FASE 1).

### F1-5 â€” VERIFICA SAVE PERSON

| Voce | Esito |
|------|--------|
| RPC save person | **OK** â€” `save_city_person_with_image_assignment` (service_role) |
| Test con immagine | **Poppea Sabina** `6051c4c7-59f1-4d2a-bd6d-b3319c617704` â€” creati **1** `media_assets` + **1** primary assignment `active`/`current` (side-effect accettabile; backfill skip su quella persona) |
| Test senza immagine | **Dino De Laurentiis** â€” RPC OK, nessun assignment (legacy `image_url` null) |
| Dual-write client | **Non usato** |

Script operativo: `scripts/f1_verify_save_person_minimal.ts` (aggiornare `PERSON_ID` se necessario).

### F1-6 â€” REGISTRO

Questa sezione + aggiornamento header / condizioni FASE 2 sotto.

### Problemi / interventi correttivi

1. **Apply obbligatorio:** `20260923153000_poi_d90_save_with_image_assignment.sql` via URI Postgres (`SUPABASE_DB_URL`) + `node scripts/f1_apply_sql_migration.cjs supabase/migrations/20260923153000_poi_d90_save_with_image_assignment.sql` **oppure** Supabase Dashboard SQL / CLI quando disponibile.
2. **Post-apply:** re-probe `save_poi_with_image_assignment`; test minimo save POI esistente (es. `osm_node3992056149`, city `city_torre-annunziata`) con stessa `imageUrl` (materializza assignment, `pois.image_url` null lato RPC).
3. **Delete person RPC** (`delete_city_person_with_image_cleanup`): **fuori FASE 1** â€” migration dedicata step futuro.

### Condizioni ancora necessarie per autorizzare FASE 2

1. F1-1 person D90 â€” **soddisfatta** (RPC presenti).
2. F1-2 + F1-3 POI â€” **NON soddisfatta** finchÃ© 231530 non applicata e save POI verificato su DB.
3. Dry-run â€” **0 conflicts/errors** OK; conteggio `would create` **256** fino a backfill (257âˆ’1 Poppea) â€” **accettabile** documentato.
4. Nessuna anomalia storage nel dry-run â€” **OK**.
5. DEC-P01â€¦P11 â€” **invariate**.

### FASE 2 â€” ESECUZIONE DEFINITIVA

**Solo dopo autorizzazione operativa esplicita** e FASE 1 chiusa con checklist Â§ Condizioni.

| # | AttivitÃ  | Riferimento STEP 1â€“19 |
|---|----------|------------------------|
| F2-1 | Backfill `--execute` + `--verify` | STEP 5â€“6 |
| F2-2 | Altri write path + G21 | STEP 7 |
| F2-3 | D90 residuo + AdminToast | STEP 8 |
| F2-4 | Delete person RPC | STEP 9 |
| F2-5 | Rimozione dual-write per flusso | STEP 10 |
| F2-6 | Report / rimozione C quando consentito | STEP 11 |
| F2-7 | Legacy decommission | STEP 12 |
| F2-8 | Rimozione AdminFamousPeopleManager | STEP 13 |
| F2-9 | DROP approvati (post E2E prereq DEC-P05) | STEP 14 |
| F2-10 | Tipi Supabase + check + smoke + E2E + audit finale | STEP 15â€“19 |

### Condizioni autorizzazione FASE 2

Tutte **obbligatorie**:

1. F1-1 completato â€” RPC `save_city_person_with_image_assignment` e `upsert_entity_primary_image_assignment` **presenti** su DB (re-probe PGRST â‰  202).
2. F1-2 + F1-3 â€” POI non scrive solo legacy per immagini nuove/modificate.
3. Dry-run rivisto: **0 conflicts**, **0 errors**; elenco `would create` accettato (**256** attuali, 257âˆ’1 Poppea F1-5).
4. Nessuna anomalia storage URL vs path nel log dry-run.
5. Decisioni DEC-P01â€¦P11 invariate (nessuna riapertura architetturale).

**Blocchi attuali che impedirebbero FASE 2:**

- Migration POI **`20260923153000`** **non applicata** su DB â†’ `saveSinglePoi` fallisce con PGRST202 finchÃ© non apply.
- Percorsi legacy POI **residui** (`stagingService`, `observatoryService`, â€¦) â€” decommission FASE 2, non blocco apply POI admin principale.

---

## Backfill Audit (A-BF-PREP â€” chiuso)

| Aspetto | Dettaglio |
|---------|-----------|
| **Script** | `scripts/backfill_media_assets_from_legacy.ts` |
| **EntitÃ ** | `city_person`, `poi`, `patron` (`--entity-type` o `all`) |
| **Input** | Legacy: `city_people.image_url/image_storage_path`, `pois.image_url`, `cities.patron_details` JSON |
| **Output** | RPC `ensure_media_asset_from_source`; INSERT `entity_image_assignments` (primary, active, current, snapshot source_*) |
| **Skip** | Se esiste giÃ  primary current (`hasPrimaryCurrentAssignment`) |
| **Idempotenza** | Skip su assignment esistente; re-run non duplica primary |
| **Duplicati** | Unique index one primary per entity; insert conflict â†’ `conflict` |
| **Errori** | `error`, `partial_failure` (asset creato, assignment fallito â€” **attenzione manuale**) |
| **Dry-run** | Default; `--execute`; `--verify` mode `runVerify` |
| **Rollback** | Nessuno automatico; recovery manuale su partial_failure |
| **Prereq DB** | `media_assets`, `entity_image_assignments`, RPC `ensure_media_asset_from_source` (**DBV-02**) |
| **Ordine** | **Dopo DEC-P10** POI write (STEP 3â€“4) |

### Controlli obbligatori

| Fase | Controlli |
|------|-----------|
| **PRIMA** | DBV-01/02/03; STEP 3â€“4 POI; dry-run log (created/skipped/conflict/error); review conflitti storage URL vs path |
| **DURANTE** | Monitor counters; pause `--pause-ms`; batch `--batch-size`; stop su errori massivi |
| **DOPO** | `--verify` (primary + media_asset_id); checklist Â§ Post-backfill; campione UI person/POI/patron |

---

## Write Path Census (zero non censiti â€” A-WRITE-CENSUS)

| EntitÃ  | File / funzione | Vecchio | Nuovo / dual-write | D90 | Stato | Destinazione |
|--------|-----------------|---------|-------------------|-----|-------|--------------|
| **Person** save admin/AI | `entitiesService.saveCityPerson` | `image_url` null | RPC `save_city_person_with_image_assignment` | **SÃ¬** | OK | Mantieni |
| **Person** delete | `entitiesService.deleteCityPerson` | DELETE row | â€” | **No** | G06 | RPC STEP 9 |
| **Person** photo suggestion accept | RPC `accept_famous_person_photo_suggestion` | UPDATE `city_people.image_url/path` | **No assignment** | Parziale RPC atomico legacy | **G21** | Allineare a D90 person o assignment |
| **POI** save | `poiWrite.saveSinglePoi` | `image_url` + `image_status` | RPC `save_poi_with_image_assignment` (repo) | **SÃ¬ (repo)** / **DB no** | G15 | Apply 231530 + F1-3 |
| **City** details | API PATCH + `cityWriteService` | `patron_details` JSON | dual-write patron primary | **No** | G16 | RPC STEP 8 |
| **Patron** gallery | `cityPatronGalleryService` | table gallery | dual-write gallery | **No** | G03 | D90/RPC STEP 7â€“8 |
| **Patron** upload UI | `CulturePatronMainPhotoSection`, fest gallery | storage upload | poi saveCityDetails path | **No** | G16 | Idem city |
| **Photo** community | `photoService.uploadCommunityPhoto`, `getOrCreatePhotoSubmissionForUrl`, approve | `photo_submissions.image_url` | dual-write | **No** | G03 | D90 photo STEP 8 |
| **Wikimedia** | `commonsDownloadPipeline` | â€” | dual-write | **No** | G03 | D90/assignment STEP 8 |
| **Media library assign** | `mediaAssetService` | â€” | dual-write | **No** | G03 | STEP 8 |
| **AI portrait** | `aiVision.generateHistoricalPortrait` â†’ `uploadPublicMedia` | storage only | poi `saveCityPerson` (D90) | **Indiretto** | OK se save person | â€” |
| **Admin assets** | `useAdminHeaderManager`, `mediaService.uploadPublicMedia*` | storage URL | fuori entity assignment MF5 | â€” | Fuori scope | â€” |
| **Famous person photo suggest** | `famousPersonPhotoSuggestionService` submit | storage | moderation RPC accept â†’ **G21** | â€” | G21 | STEP 7 |
| **Patron photo suggest** | `patronPhotoSuggestionService` | storage + gallery table | parziale | â€” | G03 area | STEP 7 |
| **City** card/hero/media tab | `saveCityDetails` | `cities.image_url/hero/gallery` | non assignment | â€” | Fuori scope MF5 | â€” |
| **Events/guides** save | `entitiesService` save event/guide | `image_url` column | â€” | â€” | Fuori scope | â€” |

---

## D90 Census (A-D90-CENSUS)

| Flusso | Boundary | Atomico? | Classificazione | Manca |
|--------|----------|----------|-----------------|-------|
| Save person + image | `save_city_person_with_image_assignment` (BEGINâ€¦COMMIT implicito PL/pgSQL) | **SÃ¬** | **D90 PRESENTE** (repo + **DB** F1-1) | â€” |
| Save city + patron image | PATCH + dual-write client (import residui post-rimozione modulo) | No | **D90 ASSENTE** | RPC STEP 8 |
| POI save + image | `save_poi_with_image_assignment` via `saveSinglePoi` | **SÃ¬ (repo)** | **D90 PRESENTE (repo)** / **DB assente** (231530) | Apply + F1-3 |
| Photo upload/approve + assignment | photoService + dual-write | No | **D90 ASSENTE** | RPC STEP 8 |
| Patron gallery + assignment | service + dual-write | No | **D90 ASSENTE** | RPC STEP 8 |
| Wikimedia + assignment | pipeline + dual-write | No | **D90 ASSENTE** | RPC STEP 8 |
| Accept photo suggestion person | `accept_famous_person_photo_suggestion` | **SÃ¬ per suggestion+person row** ma **legacy columns only** | **D90 PARZIALE** / non allineato SoT | Allineamento assignment STEP 7â€“8 |
| Delete person | client DELETE | No | **D90 ASSENTE** | RPC STEP 9 |
| Moderation person (MF1) | altre RPC `60908130000` | Vari | Fuori perimetro immagine assignment MF5 | â€” |

---

## Delete Personaggio â€” G06 (DEC-P04, chiusura audit)

| Elemento | Comportamento attuale | Coerente DEC-P04? |
|----------|----------------------|-------------------|
| `city_people` DELETE | SÃ¬, client | â€” |
| `entity_image_assignments` | **Restano** (entity_id text, no FK) | **No** â€” orphan |
| `media_assets` | Non cancellati | **SÃ¬** (riuso) |
| `entity_image_history` | Non append su delete | **Gap** â€” storico evento delete/revoke |
| FK `assignments.media_asset_id` â†’ assets | ON DELETE **RESTRICT** | Impedisce delete asset se assignment esiste |
| FK `content_reports.assignment_id` | ON DELETE SET NULL | â€” |

**Intervento futuro (STEP 9):** RPC **`delete_city_person_with_image_cleanup`** (nome indicativo): transazione â€” revoca/removed primary (e gallery?) assignments per quella person; **non** DELETE `media_assets` se altri assignment attivi; append history; DELETE person (cascade category links giÃ  su DB); rispettare RESTRICT su report se necessario.

---

## Report Audit â€” chiusura (DEC-P07)

| Layer | Meccanismo | Necessario oggi | Dopo cutover |
|-------|------------|-----------------|--------------|
| **A** | `content_reports`, `ReportAbuseModal`, `useReportAbuseSubmit`, hub `ReportsListPanel` | **SÃ¬** â€” definitivo | Resta |
| **B** | Report nel vecchio manager | **Non esisteva** come abuso; solo suggerimenti community | N/A |
| **C** | `ensure_current_image_assignment` in `create_content_report_group` se manca `assignment_id`; legge legacy columns; **service_role** | **SÃ¬** finchÃ© dati/report senza assignment | Rimuovere in STEP 11 quando legacy read/write spenti e backfill fatto |

**Confusione Cursor corretta:** G10 â‰  tab manager; **C** Ã¨ fallback MF2 submit, non UI manager.

**DECISION REQUIRED:** **no**.

---

## AdminFamousPeopleManager Audit (DEC-P08 / DEC-P11)

| Vecchia funzione | File | Nuova destinazione | Evidenza | Stato |
|------------------|------|-------------------|----------|-------|
| Categorie personaggio | `AdminFamousPeopleCategoriesManager` embedded | Edit cittÃ  `CulturePeople` + overlay | Stesso componente | **MIGRATA COMPLETAMENTE** (duplicata entry) |
| Suggerimenti personaggio | embed `person_suggestions` | Hub â†’ `AdminReportsFamousPersonTab` | `AdminReportsFamousPersonTab.tsx` | **MIGRATA COMPLETAMENTE** |
| Suggerimenti foto personaggio | embed `photo_suggestions` | Hub micro-tab | idem | **MIGRATA COMPLETAMENTE** |
| Abuso personaggio/foto | *non in manager standalone* | Hub `ReportsListPanel` entity/image_abuse | MF2 | **MIGRATA COMPLETAMENTE** |
| Standalone route `famous_people` | `AdminDashboard.tsx` L122,369; `AdminSidebar` L199 | Solo categorie (subtitle conferma) | **DUPLICATA** | Entry ridondante |
| Lazy import | `AdminDashboard` lazy `AdminFamousPeopleManager` | â€” | â€” | STEP 13 rimuovere |

**Riferimenti:** `famous_people` in `ADMIN_SECTIONS`, sidebar, smoke non testa route.

**Verdetto:** **READY FOR REMOVAL** (manager + route + menu + lazy import) **dopo DEC-P11** e STEP 13 â€” **nessuna funzione necessaria esclusiva nel vecchio manager**.

---

## Source of Truth Matrix (finale)

| Entity | SoT attuale display | SoT definitivo | Read attuale | Write attuale | Read def. | Write def. | Fallback | Dual-write | D90 | Migrazione |
|--------|---------------------|----------------|--------------|---------------|-----------|------------|----------|------------|-----|------------|
| city_person | assignment+asset (cutover) | idem | cutover | RPC D90 | idem | RPC | No display | No save | Person save | **In corso** |
| poi | assignment+asset (cutover) | idem | cutover | RPC D90 (client); **DB pending 231530** | idem | RPC POI | No | No | Repo sÃ¬ / DB no | **G15** |
| patron primary | assignment+asset | idem | cutover | JSON+dual-write | idem | RPC | No hero | SÃ¬ | Assente | **G16** |
| patron gallery | assignment+asset | idem | filter assignmentId | dual-write | idem | RPC | â€” | SÃ¬ | Assente | G20/G03 |
| photo_submission | submission+assignment | idem | community | dual-write | idem | D90 | â€” | SÃ¬ | Assente | Community |
| city hero/card | colonne city | fuori MP assignment | diretto | saveCityDetails | â€” | â€” | â€” | patron only | â€” | Fuori scope |

---

## Legacy Decommission Inventory (A-DEC-01 â€” repo)

| Elemento | Uso | Sostituto | Prerequisito rimozione | Step |
|----------|-----|-----------|------------------------|------|
| `city_people.image_url` / `image_storage_path` | backfill source, ensure_current, accept photo RPC, orphan index | assignment+asset | Backfill+write SoT+DEC-P02 | 12â€“14 |
| `pois.image_url` | backfill; altri path legacy (staging/observatory/seed); **non** `saveSinglePoi` post-refactor | assignment | STEP 3â€“6 + F1-3 | 12â€“14 |
| `patron_details` image JSON | city save, backfill patron | assignment | D90 city STEP 8 | 12â€“14 |
| RPC `upsert_entity_image_assignment_dual_write` | 6 callers | RPC D90 per flusso | DEC-P06 STEP 10 | 14 |
| RPC `ensure_current_image_assignment` | report submit C | assignment_id obbligatorio / dati migrati | STEP 11 | 14 |
| `imageAssignmentDualWriteService.ts` | client *(rimosso repo)* | D90 per flusso / refactor caller | **5** import residui; RPC DB finchÃ© caller â‰  0 | 10 |
| Cutover read giÃ  senza fallback person/POI | â€” | â€” | â€” | â€” |
| Route `famous_people`, `AdminFamousPeopleManager.tsx` | categorie duplicate | CulturePeople | DEC-P11 audit | 13 |
| `mf2DbClient` cast | tipi | supabase.ts | STEP 15 | 15 |
| `ReportFamousPersonPhotoAbuseModal` | wrapper | `ReportAbuseModal` | opzionale cleanup | 12 |
| E2E matrix righe obsolete | doc | aggiornamento | STEP 19 | 19 |

**Non inventare DROP** finchÃ© inventario non Ã¨ verificato su DB (DBV).

---

## Storage / Orphan / History / Provenance (audit repo)

| Area | Stato | Gap |
|------|-------|-----|
| `media_assets` lifecycle | enum MF3, `safe_archive_media_asset` blocks active assignments | â€” |
| `entity_image_assignments` | RESTRICT delete asset; city_id FK CASCADE city | delete person orphan **G06** |
| `entity_image_history` | append su D90 person + dual_write RPC | delete person no event |
| Provenance | `origin_type`, verify pipeline MF4 | â€” |
| Report evidence | bucket separato MF2 | orphan script esclude report-evidence |
| Orphan cleanup | assignment index + legacy URL scan | POST-backfill opzionale |

---

## Gap Register

| ID | Descrizione | Fase | Stato | Decisione |
|----|-------------|------|-------|-----------|
| G01 | Backfill non eseguito | 1 | APERTO | DEC-P01 |
| G02 | E2E | 3 | APERTO | DEC-P05 |
| G03 | Dual-write callers | 2 | APERTO | DEC-P06 |
| G04 | D90 incompleto | 2 | APERTO | DEC-P03 |
| G05 | RPC person on DB | 1 | **CHIUSO** â€” F1-1: 221259/300 **presenti** su DB reale | â€” |
| G06 | Delete person | 2 | APERTO | DEC-P04 |
| G07 | UI senza backfill | 1 | APERTO | DEC-P01 |
| G08 | findExistingPortrait | â€” | CHIUSO (repo) | â€” |
| G09 | Inventario Â§42.17 | 2 | APERTO | DEC-P02 |
| G10 | ensure_current (C) | 2 | IN VERIFICA post-backfill | DEC-P07 chiuso |
| G11 | Smoke | 3 | APERTO | â€” |
| G12 | Doc obsoleta | 3 | APERTO | â€” |
| G13 | D86 | 3 | PARZIALE | E2E |
| G14 | History D90 person | 2 | CHIUSO (repo SQL) | â€” |
| G15 | POI write D90 operativo end-to-end | 1â†’2 | **APERTO** â€” client OK; **DB 231530 + test F1-3** | **DEC-P10** |
| G16 | City/patron save | 2 | APERTO | DEC-P03 |
| G17 | Tipi Supabase | 3 | APERTO | â€” |
| G18 | CultureCorner gate | 1 | APERTO | opzionale |
| G19 | Route famous_people | 2 | READY FOR REMOVAL | **DEC-P11** |
| G20 | Patron gallery assignmentId | 1 | APERTO | backfill |
| **G21** | `accept_famous_person_photo_suggestion` scrive legacy person | 2 | APERTO | STEP 7â€“8 |

**Gap aperti:** 15 (+ G10,G13 parziali; **G05 chiuso**)

---

## Contraddizioni (A-DOC-02)

| # | Documento | Affermazione | Evidenza attuale | Conseguenza |
|---|-----------|--------------|------------------|-------------|
| C1 | POST_MF5 report | saveCityPerson dual-write client *(storico)* | RPC D90 person (F1-1) | Report allineato 2026-09-23 |
| C2 | E2E #10 | maskSuspendedPrimaryImagesForPeople | Rimosso | E2E STEP 18 |
| C3 | E2E #21 | usage legacy person/POI | Rimosso usage map | Idem |
| C4 | MF2 closure | saveCityPerson dual-write obbligatorio | Superato POST-MF5 | Storico |
| C5 | Smoke label | Â«D90Â» = intero sistema | Solo person | Wording doc opzionale |
| C6 | MF5 vs person D90 | D90 post-MF5 | Anticipo person ammesso | Coerente |

---

## Checklist Â«Nessuna sorpresa prima degli interventiÂ»

| Voce | Stato |
|------|--------|
| Decisioni funzionali necessarie | **Chiuse** (DEC-P01â€¦P11) |
| Ordine operativo | **Definito** STEP 1â€“19 |
| Write path censiti | **SÃ¬** (A-WRITE-CENSUS + G21) |
| Backfill audit | **SÃ¬** (A-BF-PREP) |
| D90 / delete / report / manager audit | **SÃ¬** (repository) |
| Legacy inventory | **SÃ¬** (repo) |
| DB verification | **SÃŒ** â€” DBV-01â€¦04 eseguiti 2026-09-23 (Â§ DB VERIFICATION) |
| Apply migration se assenti | **SÃŒ** â€” **231530 POI** da applicare (F1-2; person 221259/221300 **giÃ  su DB** F1-1) |
| Dry-run backfill | **SÃŒ** â€” **256** would-create post F1-5 (257âˆ’1), 0 conflict |
| DECISION REQUIRED aggiuntive | **Nessuna** |

### Â«Ci mancano ancora informazioni/decisioni indispensable prima di iniziare gli interventi?Â»

**NO** per audit/informazioni â€” baseline DB e dry-run **registrati**.

**SÃŒ** per **autorizzazione operativa** a: (1) apply migration **POI 231530** + chiusura F1-3; (2) avvio **FASE 2 operativa** dopo checklist Â§ Condizioni.

### Readiness

| Gate | Stato |
|------|--------|
| **READY FOR FASE 1 implementation** (codice POI + migration apply autorizzata) | **SÃŒ** |
| **READY FOR FASE 2 execution** (backfill execute, decommission, â€¦) | **NO** â€” FASE 1 incompleta + autorizzazione FASE 2 |
| **READY FOR IMPLEMENTATION PLAN** (legacy STEP 1â€“19) | **SÃŒ** per sequenza F1â†’F2; **non** eseguire backfill prima POI (DEC-P10) |

---

## Macrofasi 1â€“3 vs FASE operativa 1/2 â€” riepilogo step

**Macrofasi (colonna Execution Order):**

- **Macrofase 1:** STEP 1â€“2, 4â€“6 (audit DB, baseline, verifica POI, backfill dry/execute).
- **Macrofase 2:** STEP 3, 7â€“14 (POI write definitivo, altri write path, D90, delete, dual-write removal, decommission, â€¦).
- **Macrofase 3:** STEP 15â€“19 (tipi, check, smoke, E2E, audit finale).

**FASE operativa 1** (implementazione corrente â€” **NON COMPLETATA**):

- STEP 1â€“2 (DBV, baseline) â€” eseguiti; F1-1 person RPC â€” **soddisfatto**.
- **STEP 3â€“4 (DEC-P10)** â€” F1-2 client + migration repo **OK**; **apply 231530 + F1-3 test DB** â€” **pendenti**.
- Dry-run rivisto (F1-4), F1-5 save person â€” eseguiti.
- **Escluso:** backfill `--execute`, STEP 7+, decommission, E2E finali.

**FASE operativa 2** (solo dopo autorizzazione + FASE 1 chiusa):

- STEP 5â€“6 (backfill execute) poi STEP 7â€“19 come tabella F2-1â€¦F2-10.

---

## Final Closure Criteria

Invariati: DEC-P01â€¦P06, P10, P11; backfill verificato; D90 completo; legacy spento (DEC-P02); E2E STEP 18; nessun dual-write/fallback non autorizzato; A-ARCH-01; doc coerente.

**Esito attuale:** **NON CHIUSO**

---

## Cronologia documento

| Data | Modifica |
|------|----------|
| 2026-09-22 | Creazione registro da audit architetturale |
| 2026-09-22 | Fase preparatoria DEC-P01â€¦P09, STEP preliminari |
| 2026-09-23 | Completamento audit preparatori; DEC-P10/P11; STEP 1â€“19 definitivi; write census; G21; DBV; NOT YET READY |
| 2026-09-23 | Verifica integrata file perimetro + DB reale + dry-run; piano 2 fasi F1/F2; evidenza storica DBV-01 Â«person RPC assentiÂ» |
| 2026-09-23 | FASE 1 implementazione: POI D90 client + migration 231530; F1-1 person RPC **presenti**; F1-5 save person OK; dry-run 256/0/0; FASE 1 **NON COMPLETATA** (apply POI SQL + F1-3) |
| 2026-09-23 | Allineamento registro: G05 chiuso; distinzione macrofasi vs FASE 1/2; stato DB corrente vs DBV storico; STEP 3â€“4 in FASE operativa 1 |
