# Image Management — Audit globale post-MF5

> **Tipo:** audit architetturale e logica **read-only** (repository + documenti SSOT).  
> **Data audit:** 2026-09-23  
> **Perimetro:** MF1–MF5, consolidamento POST-MF5, integrazioni fino allo stato attuale del repository.  
> **Non eseguito in questa sessione:** apply migration, backfill `--execute`, E2E manuali, probe RPC su DB reale (salvo evidenze già registrate in `AI_IMAGE_MANAGEMENT_FINAL_CLOSURE_PLAN.md`).

---

## 1. Executive Summary

Il repository contiene **infrastruttura MF1–MF5 sostanzialmente completa** (schema `media_assets`, `entity_image_assignments`, `entity_image_history`, report MF2, catalogo MF4, script backfill/orphan, cutover read POST-MF5 per Person/POI/Patron primary, D90 person **in codice + migration**, D90 POI **solo in codice/migration repo**).

Lo **stato operativo reale** (dati + DB target + chiusura) **non** è allineato al modello definitivo: il cutover read **senza fallback legacy** è attivo mentre **~256 entità legacy** (per dry-run documentato) **non hanno ancora assignment** → la UI pubblica mostra **quasi nessuna immagine** Person/POI/Patron finché non si esegue backfill o si scrivono nuovi assignment. In parallelo restano **write path legacy** (moderazione foto personaggio, staging POI, observatory) e **write multi-step non atomici** (city+patron, photo, gallery, wikimedia) via RPC transitoria `upsert_entity_image_assignment_dual_write` (nome storico; **non** aggiorna colonne legacy entità nel SQL corrente `20260920120300`).

**Gap critico aggiuntivo (audit codice):** `deleteCityPerson` invoca RPC `delete_city_person_with_image_cleanup` **senza migration SQL corrispondente nel repository** — rischio runtime PGRST202 non mitigato da STEP 9 documentato.

**Verdetto:** **NOT YET READY FOR CLOSURE** (vedi §21).

---

## 2. Stato complessivo

| Area | Stato | Nota |
|------|--------|------|
| Schema / migration repo MF1–MF4 | Implementato | 25 file `202609*` image-related in `supabase/migrations/` |
| D90 Person save | Repo + DB (evidenza F1-1/F1-5) | `save_city_person_with_image_assignment` |
| D90 POI save/delete | Repo sì / DB **non verificato in audit** | `20260923153000` — closure plan: **assente su DB** |
| D90 Person delete | Client sì / SQL **mancante in repo** | Solo riferimento in `entitiesService.ts`, `mf2DbClient.ts` |
| Cutover read Person/POI/Patron primary | Implementato | Assignment + `media_assets`, fail-closed |
| Backfill | Script pronto / **execute no** | Dry-run 256 would-create (closure plan) |
| Dual-write client module | Rimosso | Sostituito da `entityImageAssignmentWriteService.ts` → RPC transitoria |
| RPC transitoria assignment | DB (evidenza closure) + caller attivi | Photo, patron, city, wikimedia, AI portrait register |
| Legacy decommission | Non iniziato | Colonne `image_url` ancora scritte in più flussi |
| E2E matrix | Prevalentemente NON VERIFICATO | Static PASS su subset |
| Quality gate `npm run check` | **FAIL** | Errori TS globali (RefObject/inert), non tutti image |
| Documentazione SSOT | **Parzialmente obsoleta** | Audit 2026-09-19, E2E matrix riga dual-write |

---

## 3. Architettura attuale rilevata

### 3.1 Modello dati (coerente con Master Plan §42)

- **`media_assets`:** oggetto immagine autonomo (status, provenance, storage).
- **`entity_image_assignments`:** relazione entità ↔ asset (`primary` / `gallery`, `is_current`, `assignment_status`, snapshot `source_*`).
- **`entity_image_history`:** append-only (MF4 migration + trigger/RPC trusted).

### 3.2 Read path migrati (POST-MF5)

- **`entityPrimaryImageReadService.ts`:** risolve URL solo da assignment `primary` + `is_current` + `assignment_status === 'active'` + asset pubblicabile; **nessun fallback** su `city_people.image_url` / `pois.image_url`.
- Applicato in `entitiesService.ts`, `cityReadService.ts`, `poiRead.ts`, `mediaService.findExistingPortrait`.
- **Patrono hero:** `resolvePatronPrimaryImagePublicUrl` (assignment `patron` primary); UI `PatronSaintModal.tsx` via `resolvePatronPrimaryImageUrl`.
- **Patrono gallery pubblica:** `filterPatronGalleryByAssignmentVisibility` — richiede `assignmentId` match; foto senza assignment **nascoste**.

### 3.3 Write path — tre famiglie

1. **D90 RPC (target definitivo):** `save_city_person_with_image_assignment`, `save_poi_with_image_assignment`, `delete_poi_with_image_cleanup` (231530).
2. **RPC transitoria (assignment-only, non D90 con entità tabella):** `upsert_entity_image_assignment_dual_write` via `upsertEntityImageAssignmentFromSource` — **non** scrive colonne legacy entità nel body SQL `20260920120300` (verificato: assenza `UPDATE city_people/pois`).
3. **Legacy diretto:** INSERT/UPDATE su colonne `image_url` (photo_submissions, city_people via G21, pois via staging/observatory, patron gallery table, cities JSON/payload).

### 3.4 Moderation / report (MF2)

- RPC `create_content_report_group`, `transition_report_status`, `ensure_current_image_assignment` (report modello B).
- Sospensione assignment + entity editorial su abuso immagine (`20260916130200_report_rpcs.sql`).

---

## 4. Matrice entità Read/Write SoT

| Entità | Read SoT (UI migrata) | Write SoT | Legacy read attivo | Legacy write attivo | D90 | Stato |
|--------|------------------------|-----------|--------------------|---------------------|-----|--------|
| **City Person** | Assignment primary + asset | RPC `save_city_person_with_image_assignment` | Parser legge DB `image_url` poi **sovrascritto** da cutover | `image_url: null` in payload person; G21 scrive legacy | Save **Sì** (repo+DB doc); Delete **client only** | **NUOVO READ + NUOVO WRITE (save)** / **READ ok + DELETE gap SQL** |
| **POI** | Cutover list/detail | `saveSinglePoi` → RPC D90 | `poiMapper` da colonna poi cutover | `stagingService`, `observatoryService`, seed lifecycle | **Repo Sì / DB non apply (doc)** | **NUOVO READ + write misto** |
| **Patron primary** | Assignment | PATCH city + `upsertEntityImageAssignmentFromSource` | JSON `patron_details.imageUrl` in payload city | PATCH persiste JSON; assignment step 2 | **No** | **NUOVO READ + VECCHIO/MULTI WRITE** |
| **Patron gallery** | Assignment gallery + table | `cityPatronGalleryService` table + RPC assignment | Row `image_url` in galleria | INSERT/UPDATE gallery + materialize assignment | **No** | **Read ibrido** (table + assignment id attach) |
| **Photo submission** | Dominio foto (`photographQuery`) | `photo_submissions.image_url` + assignment opzionale | URL colonna | Upload/approve + dual-write RPC | **No** (compensazione delete su fail assignment upload) | **Modello foto autonomo + assignment parziale** |
| **Wikimedia** | Cutover se assignment | Pipeline storage + asset status + assignment RPC | — | Multi-step client | **No** | **Parziale** |
| **City card/hero/gallery** | Colonne `cities.*` | `saveCityDetails` / mapper | Sì | Sì | Fuori scope MF5 assignment | **Legacy accettato (decisione scope)** |
| **Event/Guide/Shop** | Colonne entity | `entitiesService` save event/guide | Sì | Sì | — | Fuori perimetro MF5 |

---

## 5. D90 / atomicità

| Flusso | Boundary | Classificazione | Evidenza |
|--------|----------|-----------------|----------|
| Save person + primary image | `save_city_person_with_image_assignment` | **D90 completo** (transazione PL/pgSQL) | `20260922130000_*.sql`, `entitiesService.saveCityPerson` |
| Save POI + primary image | `save_poi_with_image_assignment` | **D90 completo (repo)** / **DB: non verificato** | `poiWrite.saveSinglePoi`, `20260923153000_*.sql` |
| Delete POI + cleanup assignment | `delete_poi_with_image_cleanup` | **D90 completo (repo)** / **DB: non verificato** | Stessa migration 231530 |
| Delete person + assignment | `delete_city_person_with_image_cleanup` | **D90 assente in repo SQL** | `entitiesService.deleteCityPerson` — **nessun file migration** |
| Save city details + patron primary | `callCityAdminApi` PATCH then `upsertEntityImageAssignmentFromSource` / revoke client | **Compensazione client-side parziale** | `cityWriteService.ts` — due boundary |
| Patron gallery add/remove | Table CRUD + RPC assignment / revoke REST | **D90 assente** | `cityPatronGalleryService.ts`, errori `PatronGalleryAssignmentInconsistentError` |
| Community photo upload | Storage → insert submission → materialize assignment; rollback delete submission on fail | **Compensazione client-side** | `photoService.uploadCommunityPhoto` |
| Photo approve/update path | DB update + assignment materialize | **D90 assente** | `photoService.ts` (varie funzioni) |
| Wikimedia download | Storage + asset RPC + transition + assignment | **D90 assente** | `commonsDownloadPipeline.ts` |
| AI portrait register | Upload storage + `registerAiGeneratedPortraitAsset` | **D90 assente** (person save separato se admin salva) | `mediaAssetService.ts` |
| Accept famous person **photo** suggestion | RPC atomica **solo legacy columns** | **D90 parziale / non allineato SoT** | `20260908130000_*.sql` UPDATE `city_people.image_url` |
| Accept famous person suggestion (entity) | RPC legacy person row | Non assignment | `famousPersonSuggestionService.ts` |
| Report abuse → suspend | `transition_report_status` | **Transazione RPC server** | MF2 migration |
| Backfill legacy | Script batch RPC `ensure_media_asset_from_source` + INSERT assignment | **Non atomico cross-entity** per design batch | `backfill_media_assets_from_legacy.ts` |

---

## 6. Legacy / dual-write / fallback — censimento

Legenda: **A** necessario · **B** temporaneo (backfill/cutover) · **C** da rimuovere (dopo prerequisiti) · **D** morto/non raggiungibile · **E** decisione architetturale

| Elemento | Classe | Dipendenze prima di rimozione | Note |
|----------|--------|-------------------------------|------|
| `city_people.image_url` / `image_storage_path` / `image_is_placeholder` | **B→C** | Backfill + stop G21 + stop cutover-only senza dati | G21 ancora scrive |
| `pois.image_url` (+ credit/license/status) | **B→C** | POI D90 su DB + backfill + stop staging/observatory writes | Admin save via RPC azzera lato SQL |
| `cities.image_url`, `hero_image`, `gallery`, `patron_details` JSON | **A** (scope city) / **B** patrono image in JSON | Patron primary su assignment | Dual write JSON + assignment |
| `photo_submissions.image_url` | **A** (modello foto) | Assignment SoT foto se/deciso | MF5 include entity type photo_submission |
| `imageAssignmentDualWriteService.ts` | **D** | — | Rimosso; smoke verifica assenza |
| `upsert_entity_image_assignment_dual_write` (RPC) | **B** | D90 per photo/patron/city/wikimedia; caller=0 | Nome misleading: **no UPDATE legacy** in SQL 201203 |
| `entityImageAssignmentWriteService.ts` | **B** | Sostituire con RPC D90 per flusso | Cast `as unknown as` per RPC non in tipi |
| `mf2DbClient.ts` boundary cast | **B** | Rigenerazione `supabase.ts` STEP 15 | |
| Cutover read (no fallback) | **C se backfill non fatto** | **Execute backfill** o rollback policy (vietato da DEC-P02) | Comportamento attuale **fail-closed** |
| `parsePerson` legge `image_url` | **B** | Innocuo post-cutover display | Dati parser ignorati per URL finale |
| `mergeLegacyUrlUsage` (city/shop/event/guide) | **A** | Decommission city media fuori scope | Person/POI **non** in merge |
| `cleanup_orphan_storage` index legacy Person/POI URLs | **B** | Backfill + assignment index | Conservativo per design |
| `ensure_current_image_assignment` (report C) | **B** | Assignment id ovunque + backfill | Closure STEP 11 |
| E2E matrix nota «dual-write mantenuto» | **D (doc stale)** | Aggiornare doc in fase chiusura | Contraddice POST-MF5 |

---

## 7. Backfill status

| Aspetto | Stato |
|---------|--------|
| Script implementato | **Sì** — `scripts/backfill_media_assets_from_legacy.ts` |
| Idempotenza (skip primary current) | **Sì** — codice + unique constraints |
| Dry-run eseguito | **Sì** (documentato closure plan F1-4) |
| `--execute` | **NON ESEGUITO** |
| `--verify` post-dry-run | **FAILED atteso** (256 legacy senza assignment) |
| Dati produzione | **NON VERIFICATO in audit** — closure plan: 1 assignment test (Poppea), ~256 would-create |
| Ordine DEC-P10 | POI migration apply + verifica **prerequisito** documentato prima execute |
| Rischio duplicazione | Mitigato da skip + unique primary |
| Partial failure handling | Contatore `partialFailures` — recovery manuale |

**Distinzione:** implementato ≠ eseguito ≠ verificato ≠ chiuso.

---

## 8. DB / RPC / RLS / Storage alignment

### 8.1 Repository

- Catena migration coerente: `161202 media_assets` → `161300 assignments` → dual_write/history → `221259/221300 person D90` → `231530 poi D90`.
- RPC image usati dal codice: elencati in §5; transitoria **non** in union `mf2Rpc` (by design).

### 8.2 DB reale

| Verifica | Esito audit sessione |
|----------|----------------------|
| Person D90 RPC presenti | **NON RIPETUTO** — closure plan F1-1: **presenti** |
| POI D90 RPC | **NON RIPETUTO** — closure plan: **PGRST202 / assenti** |
| `delete_city_person_with_image_cleanup` | **NON VERIFICABILE** — **migration SQL assente in repo** |
| RLS policies complete | **NON VERIFICABILE** senza SQL live |
| Storage buckets `public-media`, `community-photos` | Coerenti con codice |
| Tipi `src/types/supabase.ts` | **Parziali** — tabelle MF2/MF5 via cast boundary |

### 8.3 Allineamento codice ↔ migration

| RPC client | Migration repo |
|------------|----------------|
| `save_city_person_with_image_assignment` | Sì |
| `save_poi_with_image_assignment` | Sì (231530) |
| `delete_poi_with_image_cleanup` | Sì (231530) |
| `delete_city_person_with_image_cleanup` | **No** |
| `upsert_entity_image_assignment_dual_write` | Sì (201203, storico 181200/191403) |

---

## 9. Test / E2E status

| Check | Esito |
|-------|--------|
| `npm run mf5:smoke` | **PASS** (sessione audit) |
| `npm run typecheck` | **FAIL** — errori RefObject/inert (globale, non perimetro image) |
| `npm run check` | **FAIL** (idem) |
| `npm run lint` (Biome) | **Non verde globale** — issue in script tmp e altro |
| Unit test image management | **NON VERIFICABILE** — nessun `*.test.ts` per entity_image nel repo |
| `IMAGE_MANAGEMENT_E2E_MATRIX.md` | Maggioranza **NON VERIFICATO**; alcuni **PASS** statici |
| Backfill dry-run | Documentato **eseguito** (closure); **non rieseguito** in audit |
| F1-5 save person mutativo | Documentato **OK** (closure) |
| F1-3 save POI DB | **NON ESEGUITO** (RPC assente su DB doc) |
| Concorrenza / race | **NON VERIFICATO** runtime |
| Scenari SUSPENDED person primary | E2E doc cita `maskSuspendedPrimaryImagesForPeople` — **funzione non trovata in `src/`**; cutover usa solo `active` → sospesi **non mostrati** (coerente fail-closed, doc E2E **obsoleto**) |

---

## 10. Codice e qualità (perimetro image)

| Tema | Valutazione |
|------|-------------|
| Cast `as unknown as` | Presenti in `mf2DbClient`, `entityImageAssignmentWriteService`, `cityWriteService`, `cityPatronGalleryService`, `photoService`, `contentReportService` — **giustificati** fino a STEP 15 tipi |
| Compensazioni pericolose | `photoService` delete submission on assignment fail — **corretto** fail-loud; `uploadCommunityPhoto` catch → `return null` **nasconde** errore (pre-esistente pattern) |
| Race city+patron | PATCH city poi assignment — **incoerenza possibile** se assignment fallisce |
| N+1 cutover | Chunk 200 su `.in()` — **accettabile** |
| RPC naming «dual_write» | **QUALITY DELTA** — confusione operativa; RPC non dual-write colonne |
| Delete person RPC senza SQL | **BLOCKING** |
| `poiWrite` payload `image_url: ''` | Passato in JSON RPC; SQL azzera — **OK** |

---

## 11. UI / accessibilità (solo file image-management)

| File | Osservazione |
|------|----------------|
| `PatronSaintModal.tsx` | `role="dialog"`, hero async assignment — loading implicito; **NON VERIFICATO** keyboard/E2E |
| `CultureCornerModal.tsx` | Person images da cutover; report wrapper invariato MF5; TS `inert` errors globali |
| Admin city editor / POI / people | Dipendono da save D90 — POI **bloccato** se RPC DB assente |
| Patron gallery hooks | `maskSuspendedAssignments: true` — coerente D86 |

Nessun audit estetico generale eseguito.

---

## 12. Documentazione alignment

| Documento | Coerenza codice | Problema |
|-----------|-----------------|----------|
| `AI_IMAGE_MANAGEMENT_MASTER_PLAN.md` | Decisioni valide | D90 «post-MF5» — implementazione **in corso**, non chiusa |
| `AI_IMAGE_MANAGEMENT_AUDIT.md` | **Obsoleto** (2026-09-19 executive: «nessuno storico», «no Wikimedia») | Contraddice MF3–MF4–MF5 reale |
| `AI_IMAGE_MANAGEMENT_FINAL_CLOSURE_PLAN.md` | **Allineato** al meglio (2026-09-23) | Ancora dice import dual-write rotti — **superato** da refactor `entityImageAssignmentWriteService` |
| `AI_POST_MF5_CONSOLIDATION_REPORT.md` | **Parzialmente obsoleto** su G03 import | Ripetere grep: **0 import** `imageAssignmentDualWriteService` |
| `docs/testing/IMAGE_MANAGEMENT_E2E_MATRIX.md` | **Contraddizioni** | Riga 25 dual-write; riga 10 funzione inesistente |
| `AI_CONTEXT` / `AI_CONTEXT_MASTER` | **Nessun hit** image MF5 | Non aggiornati al consolidamento |
| Macrofase 1–5 `_FILES.md` | Roadmap vs realtà | MF5 E2E/backfill **non chiusi** |

**Regola audit:** contraddizioni **segnalate**, non risolte in questo documento.

---

## 13. Problemi classificati

### 🔴 BLOCKING

#### B1 — Cutover read attivo senza backfill dati
- **Requisito:** §42.15 cutover read post-backfill (DEC-P01, DEC-P02).
- **Evidenza:** `applyPrimaryImageCutoverForCityPeople` ritorna `''` senza assignment; closure DBV-03 / dry-run 256 would-create.
- **Impatto:** Produzione/staging con legacy popolato → **immagini Person/POI/Patron invisibili** salvo nuovi save D90.
- **Fare:** Apply POI D90 (DEC-P10) → backfill `--execute` + `--verify` → campione UI.
- **Non fare:** Reintrodurre fallback read su colonne legacy (viola POST-MF5).

#### B2 — POI D90 non operativo su DB (evidenza documentata)
- **Requisito:** DEC-P10 STEP 3–4.
- **Evidenza:** `poiWrite.ts` throw se PGRST202; closure F1-2/F1-3.
- **Impatto:** Admin save POI con immagine **fallisce** su DB target.
- **Fare:** Apply `20260923153000` + test save.
- **Non fare:** Ripristinare upsert diretto `pois.image_url` come SoT.

#### B3 — `delete_city_person_with_image_cleanup` senza migration in repo
- **Requisito:** DEC-P04, STEP 9.
- **Evidenza:** `entitiesService.deleteCityPerson` + `mf2DbClient` union; grep migration: **0 file SQL**.
- **Impatto:** Delete admin person **fallisce** (PGRST202) o comportamento non atomico se si ripristina DELETE naive.
- **Fare:** Aggiungere migration SQL (fuori scope audit) + probe DB.
- **Non fare:** DELETE row senza revoca assignment/history.

#### B4 — G21 accept photo suggestion scrive solo legacy
- **Requisito:** Write census G21; allineamento assignment SoT read.
- **Evidenza:** `accept_famous_person_photo_suggestion` UPDATE `city_people.image_url` (`20260908130000`).
- **Impatto:** Moderazione accettata **non visibile** in UI cutover.
- **Fare:** Estendere RPC o chiamare D90 person/primary assignment in stessa transazione.
- **Non fare:** Solo backfill batch come unica mitigazione operativa.

### 🟠 IMPORTANT

#### I1 — City save + patron assignment non D90
- **File:** `cityWriteService.ts`.
- **Impatto:** PATCH ok + assignment fail → JSON patron vs assignment divergenti.

#### I2 — Photo / gallery / wikimedia multi-step
- **File:** `photoService.ts`, `cityPatronGalleryService.ts`, `commonsDownloadPipeline.ts`.
- **Impatto:** Stati intermedi; classi errori dedicated indicano consapevolezza ma non atomicità.

#### I3 — Write POI legacy residual
- **File:** `stagingService.ts`, `observatoryService.ts`, `cityLifecycleService.ts`.
- **Impatto:** Nuovi POI possono avere `image_url` senza assignment → invisible in cutover read.

#### I4 — FASE 1 / POST-MF5 non chiusi
- **Evidenza:** Consolidation report + closure plan header.

#### I5 — `npm run check` non verde
- **Impatto:** Gate STEP 16–18 closure non soddisfatto (errori oltre image).

#### I6 — Documentazione SSOT stale
- **Impatto:** Rischio decisioni basate su audit 2026-09-19 o E2E matrix errata.

### 🟡 QUALITY DELTA

- RPC nome `upsert_entity_image_assignment_dual_write` senza dual-write colonne.
- `uploadCommunityPhoto` swallow errors → `null`.
- E2E matrix / smoke mismatch su suspended person helper naming.
- Tipi Supabase non rigenerati — cast boundary prolungati.

### 🟢 ACCEPTABLE

- MF1–MF4 stack migration in repo.
- Person save D90 design + history append in SQL 221259/300.
- Usage map assignment SoT + legacy merge solo entità fuori scope.
- Orphan script policy conservativa + blocked MF4 namespaces.
- Fail-closed duplicate primary assignment (warn + hide image).
- Photo domain separation (`photograph` assert) coerente Master Plan.

---

## 14. File coinvolti (perimetro image)

**Core:** `entityPrimaryImageReadService.ts`, `imageAssignmentVisibilityService.ts`, `entityImageAssignmentWriteService.ts`, `mediaAssetService.ts`, `assetUsageMapService.ts`, `mediaService.ts`, `mf2DbClient.ts`, `mf3DbClient.ts`, `mf4DbClient.ts`, `contentReportService.ts`.

**City/entities:** `entitiesService.ts`, `cityReadService.ts`, `cityWriteService.ts`, `cityPayloadMapper.ts`, `poiRead.ts`, `poiWrite.ts`, `poiMapper.ts`, `parsePerson.ts`, `stagingService.ts`, `observatoryService.ts`, `cityLifecycleService.ts`.

**Patron/photo/wikimedia:** `cityPatronGalleryService.ts`, `photoService.ts`, `commonsDownloadPipeline.ts`, `famousPersonPhotoSuggestionService.ts`, `famousPersonSuggestionService.ts`.

**UI:** `PatronSaintModal.tsx`, `CultureCornerModal.tsx`, `useCityPatronGallery.ts`, Admin city/people/POI hooks.

**Scripts:** `backfill_media_assets_from_legacy.ts`, `cleanup_orphan_storage.ts`, `smoke-mf5-image-management.ts`, `f1_verify_save_person_minimal.ts`.

**SQL:** `20260916120200` … `20260923153000` (elenco completo §8.1).

---

## 15. Dipendenze da rimuovere (ordine logico)

1. Backfill + verify dati assignment.
2. Allineare **tutti** write path (G21, staging POI, patron, photo) a D90 o RPC assignment in transazione.
3. Apply POI D90 + person delete D90 SQL.
4. Stop scritture legacy colonne (DEC-P02 inventory).
5. Caller `upsert_entity_image_assignment_dual_write` → 0.
6. DROP RPC transitoria + colonne legacy (approvazione esplicita).
7. Rigenerare tipi; rimuovere `mf2DbClient` cast.
8. `ensure_current_image_assignment` valutazione STEP 11.

---

## 16. Funzionalità ancora da sviluppare

- Migration + RPC **delete person** D90 (DEC-P04).
- Apply + verifica **POI D90** su DB.
- D90 (o equivalente server) per city+patron, photo lifecycle, patron gallery, wikimedia end-to-end.
- Allineamento **G21** accept photo suggestion → assignment.
- Backfill **execute** + verifica post-backfill.
- Legacy decommission (read/write/fallback zero).
- E2E matrix runtime STEP 18 (DEC-P05).
- Rigenerazione tipi Supabase image RPC/tables.
- (Opzionale DEC-P11) rimozione `AdminFamousPeopleManager` post-verifica.

---

## 17. Funzionalità già completate

- Schema MF1–MF4 (assets, assignments, history, reports, evidence, catalog views, safe archive).
- Cutover read POST-MF5 Person/POI/Patron primary (fail-closed).
- Person **save** D90 client + SQL migration.
- POI **save/delete** D90 **in repository** (231530).
- Backfill script + dry-run + idempotenza design.
- Orphan storage script (dry-run default).
- Report MF2 RPC + sospensione assignment.
- Wikimedia / AI verification pipeline MF4 (ambito asset).
- Smoke statico MF5 invarianti.
- Refactor dual-write **client module** → `entityImageAssignmentWriteService` (RPC diretta).

---

## 18. Elementi che NON devono essere modificati (senza decisione)

- Principio **media_assets** autonomo + **assignments** relazione (DEC-001 / §42).
- Cutover read **senza fallback legacy** (POST-MF5 — correggere dati, non reintrodurre fallback).
- Separazione dominio **Photo** vs Presentation Media (Master Plan).
- Policy orphan cleanup conservativa (`verified/`, `wikimedia/` blocked).
- DEC-P10 ordine POI write → verifica → backfill.
- DEC-P05 E2E finali solo dopo architettura + check.
- City card/hero/gallery fuori scope assignment MF5 (non espandere scope in chiusura tacita).

---

## 19. Ordine logico consigliato delle correzioni

1. Apply migration `20260923153000` (POI D90 + delete POI RPC).
2. Test minimo save/delete POI su DB.
3. Implementare migration `delete_city_person_with_image_cleanup` + test.
4. Fix **G21** + audit write path POI residual (staging/observatory).
5. D90 city+patron (RPC unica PATCH+assignment o server handler).
6. D90 photo/patron gallery/wikimedia (STEP 7–8 closure).
7. Backfill `--execute` + `--verify`.
8. Legacy decommission inventario §42.17.
9. DROP approvati post-E2E.
10. Tipi + `npm run check` + E2E matrix + audit A-ARCH-01.

---

## 20. Criteri oggettivi per dichiarare chiusa la fase

Tutti **obbligatori**:

1. **Read/Write SoT** = assignment (+ media_assets) per Person/POI/Patron/Photo perimetrali — **zero** write legacy funzionali residui.
2. **Backfill** execute + verify **PASS** (0 legacy primary mancanti nel perimetro script).
3. **D90** per ogni boundary entity+image censito in closure §D90 — **0 assenti**.
4. **DB target** = migration repo image apply + RPC probe ≠ PGRST202 per D90 usati dal client.
5. **`npm run check`** PASS (o eccezione documentata fuori image non accettabile per STEP 16).
6. **`npm run mf5:smoke`** PASS.
7. **E2E matrix** DEC-P05 eseguita — scenari critici PASS (non solo statici).
8. **Documentazione** closure/consolidation/audit aggiornata — nessuno stato «CLOSED» contraddetto.
9. **Dual-write RPC** rimossa o caller=0 con decisione registrata.
10. Audit finale A-ARCH-01 esito **CHIUSO**.

---

## 21. Verdetto finale

**NOT YET READY FOR CLOSURE**

Motivazione sintetica: il **modello architetturale** è presente e il **cutover read** è coerente con le decisioni POST-MF5, ma **dati non migrati**, **POI D90 non applicato al DB** (evidenza closure), **delete person RPC mancante in repo**, **G21 e write legacy** in conflitto con read SoT, **D90 incompleto** sui flussi residui, **E2E/check** non verdi — condizioni §20 non soddisfatte.

---

## Appendice — Problemi (scheda estesa)

Per ogni problema 🔴/🟠 sopra:

| ID | Severità | Cosa fare | Cosa NON fare | Prerequisiti |
|----|----------|-----------|---------------|--------------|
| B1 | 🔴 | Execute backfill dopo POI D90 | Fallback read legacy | DEC-P10, approvazione execute |
| B2 | 🔴 | Apply 231530 | Solo client fix | Accesso DB |
| B3 | 🔴 | Migration delete person RPC | DELETE naive | Design DEC-P04 |
| B4 | 🔴 | RPC G21 + assignment | Solo backfill | Moderation flow |
| I1 | 🟠 | RPC city+patron D90 | Solo toast UX | STEP 8 |
| I2 | 🟠 | RPC unificate photo/gallery/wiki | Retry client | STEP 7–8 |
| I3 | 🟠 | Migrare staging/observatory POI | Ignorare cutover | POI D90 live |
| I4 | 🟠 | Chiudere FASE 1 checklist | Dichiarare POST-MF5 chiuso | B2 |
| I5 | 🟠 | Fix TS gate globale | Bypass hooks | — |
| I6 | 🟠 | Aggiornare audit/E2E post-chiusura codice | Riscrivere Master Plan decisioni | STEP 19 |

---

## 22. Seconda audit operativa — validazione pre-finalizzazione

> **Data:** 2026-09-23 (sessione 2)  
> **Modalità:** read-only (codice + documenti + probe RPC **non mutativi** con firma valida e payload che fallisce in semantica SQL).  
> **Non eseguito:** backfill `--execute`, migration apply, E2E manuali, probe mutativi (es. delete person su UUID reale — bloccato come rischio mutazione).

### 22.1 Executive seconda audit

| Esito | Valore |
|--------|--------|
| **Verdetto seconda audit** | **READY WITH PREREQUISITES** |
| **Grande modifica finale** | **Preparabile** come unica ondata, con ordine §22.11 |
| **Superato rispetto audit §1–21** | Import `imageAssignmentDualWriteService` (0 import); **POI D90 su DB target** (probe 2026-09-23) |
| **Confermato aperto** | Delete person RPC (SQL repo + DB); G21 vs cutover read; backfill execute; D90 residui; legacy write POI staging/observatory |

---

### 22.2 Punto 1 — Backfill legacy

**Script:** `scripts/backfill_media_assets_from_legacy.ts` (invariato, rivisto integralmente).

| Aspetto | Evidenza |
|---------|----------|
| **Entità** | `city_person`, `poi`, `patron` (`--entity-type` o `all`) |
| **Campi legacy letti** | `city_people.image_url` + `image_storage_path`; `pois.image_url`; `cities.patron_details` JSON (`imageUrl` / `image_url`) |
| **Output** | RPC `ensure_media_asset_from_source` + INSERT `entity_image_assignments` (primary, active, current, snapshot `source_*`) |
| **Origin type backfill** | Sempre `'admin'` in RPC (`p_origin_type: 'admin'`) — **non** preserva provenance reale (AI/community/wikimedia) se era solo in metadati non letti |
| **Idempotenza** | Skip se esiste già primary `is_current` (`hasPrimaryCurrentAssignment`) |
| **Duplicati** | Unique index one primary; insert `23505` → `conflict` |
| **Conflitti storage** | `assertLegacyStorageCompatible` → `conflict` se URL public-media ≠ path legacy |
| **Partial failures** | Asset creato, assignment fallito → log `partial_failure`, recovery manuale |
| **Verify** | `runVerify`: ogni legacy con immagine deve avere primary current + `media_asset_id` |

**DB reale (probe read-only conteggi, 2026-09-23):**

| Metrica | Valore |
|---------|--------|
| `entity_image_assignments` | **1** |
| `media_assets` | **1** |
| `city_people` con legacy image (url o storage_path) | **~0** |
| `pois` con `image_url` non vuoto | **~255** |

→ Il campione **256 would-create** della closure plan è **superato** sul personaggio: il backfill **operativo** riguarda soprattutto **POI (+ patron JSON)** sul DB corrente, non centinaia di person.

**Write path che possono interferire post-backfill:**

| Path | Rischio |
|------|---------|
| `stagingService` → `promote_staging_poi_to_live` con `image_url` in JSON | Nuovi POI **solo legacy**, invisibili in cutover read |
| `observatoryService` merge POI → `updates.image_url` | Idem |
| `saveSinglePoi` (D90) | Allineato assignment; **non** interferisce negativamente |
| G21 accept photo | Scrive legacy person — **invisibile** in cutover (non sovrascrive assignment) |

**Esclusioni script:** nessun backfill `photo_submission`, eventi, guide, city hero — **corretto** per scope MF5.

#### Esito Punto 1 — Backfill

**BACKFILL READY AFTER PREREQUISITES**

| Prerequisito | Motivo |
|--------------|--------|
| **Approvazione operativa DEC-P01** (`--execute`) | Obbligatoria per policy progetto |
| **POI D90 su DB** | DEC-P10 — **soddisfatto** (probe §22.3) |
| **Consigliato nello stesso programma:** fix G21 + migrazione write POI staging/observatory **prima o subito dopo** execute | Evita nuovo drift legacy POI/person |
| **Non blocca execute:** migration delete person | Delete ≠ backfill |

**Non è BACKFILL READY NOW** senza approvazione esplicita e senza piano anti-drift (write legacy residui).

---

### 22.3 Punto 2 — POI D90 DB

| Verifica | Esito |
|----------|--------|
| Migration repo | `20260923153000_poi_d90_save_with_image_assignment.sql` — `upsert_poi_primary_image_assignment`, `save_poi_with_image_assignment`, `delete_poi_with_image_cleanup` |
| Client | `poiWrite.saveSinglePoi` / `deleteSinglePoi` → `mf2Rpc` |
| Smoke | Assert firme RPC in `smoke-mf5-image-management.ts` — **PASS** (sessione 2) |
| **DB target (probe non mutativo)** | `save_poi_with_image_assignment` → **PRESENT_SEMANTIC** `P0001 POI id obbligatorio` (≠ PGRST202) |
| | `delete_poi_with_image_cleanup` → **PRESENT_SEMANTIC** `P0001 POI non trovato: __nonexistent_probe__` |

**Conclusione:** la prima audit / closure plan (RPC POI **assenti** su DB) è **superata** sul DB collegato a `.env` locale — migration **231530 risulta applicata** (o equivalente deployato).

| Domanda | Risposta |
|---------|----------|
| Pronta per apply? | **Già applicata** sul DB probe — nessuna apply in questa sessione |
| Correzioni SQL prima apply? | **Non rilevate** (allineamento client ↔ migration verificato staticamente) |
| Prerequisiti | Funzioni MF1–4 (`ensure_media_asset_from_source`, `append_entity_image_history_trusted`, `upsert_city_person` pattern) — implicitamente OK se save POI risponde semanticamente |
| Prima del backfill? | **Sì, ordine DEC-P10 rispettabile** — POI D90 **operativo su DB probe** |

**NON VERIFICATO in sessione 2:** save POI admin end-to-end mutativo (F1-3 equivalente POI).

---

### 22.4 Punto 3 — Delete person D90

| Verifica | Esito |
|----------|--------|
| Caller | `entitiesService.deleteCityPerson` → `mf2Rpc('delete_city_person_with_image_cleanup')` |
| | `usePeopleData.ts`, `useAiCompleteCity.ts`, `editorCultureRegeneration.ts` |
| Migration SQL in repo | **Assente** (grep `supabase/migrations` — solo menzione in doc) |
| RPC equivalente | **Nessuna** — pattern da copiare: `delete_poi_with_image_cleanup` (`20260923153000`) |
| **DB probe** | `delete_city_person_with_image_cleanup` con `p_person_id` dummy → **PGRST202 / firma non risolta** (funzione **assente** su DB probe) |

**Comportamento atteso (DEC-P04 + closure STEP 9):**

- Transazione: lock person → revoca assignment primary (e gallery se presenti) `active`/`current` → `append_entity_image_history_trusted` → **non** DELETE `media_assets` se altri assignment → DELETE `city_people` (+ link categorie esistenti).
- Vincoli: `entity_image_assignments.media_asset_id` → RESTRICT (no delete asset condiviso); verificare `content_reports` / FK verso person o assignment prima DELETE.
- Analogia implementativa: loop assignment come `delete_poi_with_image_cleanup`, entity_type `city_person`, `entity_id` uuid-as-text.

**Cosa sviluppare nella grande modifica (solo specifica, no SQL ora):**

1. Nuova migration `delete_city_person_with_image_cleanup(p_person_id uuid)` SECURITY DEFINER, GRANT authenticated + service_role.
2. Aggiornare `mf2DbClient` / tipi post-rigenerazione.
3. Test minimo admin delete (persona senza asset condivisi + persona con report aperto se vincolo).

---

### 22.5 Punto 4 — G21 / accept famous person photo suggestion

#### 1–3 Caller, RPC, UI

| Layer | Path |
|-------|------|
| **RPC** | `supabase/migrations/20260908130000_famous_person_moderation_atomic_rpcs.sql` — UPDATE `city_people.image_url`, `image_storage_path`, `image_is_placeholder` |
| **Service** | `famousPersonPhotoSuggestionService.acceptFamousPersonPhotoSuggestion` |
| **UI unica accept** | `AdminFamousPeopleManager.tsx` (tab moderazione foto) |
| **Submit community** | `SuggestFamousPersonPhotoModal.tsx` → `createFamousPersonPhotoSuggestion` (non accept) |

#### 4–10 Flussi alternativi e consumo

| Flusso | Scrive assignment? | Visibile cutover read? |
|--------|-------------------|------------------------|
| G21 accept | **No** | **No** (read SoT assignment) |
| `saveCityPerson` D90 | **Sì** | **Sì** |
| AI portrait + save person | **Sì** (via save) | **Sì** |
| Backfill person | **Sì** (se legacy url/path) | **Sì** — oggi **~0 legacy person** su DB probe |

**Percorsi che leggono ancora `city_people.image_url` (non SoT display):**

- `parsePerson` / fetch DB — **sovrascritto** da `applyPrimaryImageCutoverForCityPeople` su path pubblici/admin lista cutover.
- `famousPersonPhotoReportService`, `famousPersonSuggestionService` (meta moderação) — **admin/report**, non hero pubblico.
- Backfill / orphan index — **tooling**.

#### Esito G21 — sganciamento

**ANCORA UTILIZZATO — PARZIALMENTE SGANCIATO**

- **Non** «COMPLETAMENTE SGANCIATO»: RPC + UI admin **attivi** e **necessari** finché esiste moderazione foto dedicata manager.
- **Non eliminabile** nella fase successiva senza sostituzione:
  - **Modificare** RPC `accept_famous_person_photo_suggestion` (o sostituire caller) per chiamare `upsert_entity_primary_image_assignment` / `save_city_person_with_image_assignment` nella **stessa transazione** del accept suggestion; oppure
  - **Reindirizzare** accept a `saveCityPerson` D90 post-read person row.
- **Eliminabile solo dopo:** nuovo RPC D90 + UI che lo usa + zero caller legacy accept.
- **Non** confondere con `accept_famous_person_suggestion` (entità testo, non foto) — file separato, fuori G21.

---

### 22.6 Punto 5 — Legacy census aggiornato (attivi)

| Percorso | Scrive | Legge | Legacy | Assignment | Necessità | Destinazione finale |
|----------|--------|-------|--------|------------|-----------|---------------------|
| `entitiesService.saveCityPerson` | RPC D90, `image_url: null` | DB + cutover | Payload null | **Sì** | **A** | Mantieni |
| `entitiesService.deleteCityPerson` | RPC **assente DB** | — | — | — | **C** | Migration delete D90 |
| `poiWrite.saveSinglePoi` / `deleteSinglePoi` | RPC D90 | — | SQL nullifica url | **Sì** | **A** | Mantieni |
| `stagingService.promote_staging_poi_to_live` | `image_url` in `p_poi` JSON | staging | **Sì** | **No** | **B→C** | Migrare a save POI D90 o estendere RPC promote |
| `observatoryService` merge POI | `pois.image_url` update | POI | **Sì** | **No** | **C** | D90 o RPC |
| `cityLifecycleService` seed | `image_url` unsplash POI | — | **Sì** | **No** | **B** | Seed → D90 o backfill |
| `cityWriteService.saveCityDetails` | PATCH city + patron assignment RPC transitoria / revoke client | — | JSON patron | **Patron primary sì** | **C** | RPC city+patron D90 |
| `cityPatronGalleryService` | `city_patron_gallery` + assignment gallery | table + assignment | **Entrambi** | **Sì** | **C** | D90 gallery |
| `photoService` upload/create/approve/update | `photo_submissions.image_url` + materialize | URL colonna | **Sì** | **Parziale** | **A/C** | D90 photo o transitoria fino STEP 10 |
| `commonsDownloadPipeline` | storage + asset + assignment transitoria | — | — | **Sì** | **C** | D90 wikimedia |
| `mediaAssetService.registerAiGeneratedPortraitAsset` | assignment transitoria | — | — | **Sì** | **B** | OK se segue save person D90 |
| `entityImageAssignmentWriteService` | RPC `upsert_entity_image_assignment_dual_write` | — | Nome storico, **no UPDATE legacy** SQL 201203 | **Sì** | **B** | Sostituire con D90 per flusso |
| `famousPersonPhotoSuggestionService.accept*` | RPC G21 legacy columns | — | **Sì** | **No** | **C** | Allineamento G21 |
| `famousPersonSuggestionService.accept*` | RPC persona testo | person row | legacy non immagine focus | — | Fuori G21 | — |
| City/event/guide/shop `image_url` | varie | colonne | **Sì** | **No** | **Fuori scope** MF5 assignment | — |

---

### 22.7 Punto 6 — Matrice D90 aggiornata

| Entità | Operazione | File / RPC | Server TX | Client compensazione | Stato |
|--------|------------|------------|-----------|----------------------|--------|
| City Person | Save + image | `save_city_person_with_image_assignment` | **Sì** | No | **Sufficiente** |
| City Person | Delete | `delete_city_person_with_image_cleanup` | **No (manca SQL+DB)** | No | **Da sviluppare** |
| POI | Save + image | `save_poi_with_image_assignment` | **Sì** | No | **Sufficiente** (DB probe OK) |
| POI | Delete | `delete_poi_with_image_cleanup` | **Sì** | No | **Sufficiente** (DB probe OK) |
| Patron primary | Save city | `cityWriteService` PATCH + transitoria | **No** | Revoke parziale client | **Da sviluppare** |
| Patron gallery | CRUD foto | `cityPatronGalleryService` | **No** | Errori inconsistent state | **Da sviluppare** |
| Photo | Upload | `photoService.uploadCommunityPhoto` | **No** | Delete submission + storage | **Da sviluppare** |
| Photo | Approve | `updatePhotoStatusInDb` | **No** | Rollback status | **Da sviluppare** |
| Photo | Update URL/city | `updatePhotoData` | **No** | Rollback submission + revoke compensato | **Da sviluppare** |
| Photo | Delete | (varie in photoService) | **No** | Parziale | Verificare per flusso |
| Wikimedia | Pipeline complete | `commonsDownloadPipeline` | **No** | Fail pipeline | **Da sviluppare** |
| AI portrait | Register asset | `registerAiGeneratedPortraitAsset` | **No** | — | Accettabile se accoppiato save person |
| Famous person photo | Accept suggestion | `accept_famous_person_photo_suggestion` | **Sì (legacy only)** | Storage cleanup best-effort | **Modificare** (non D90 assignment) |
| Report abuse | Suspend image | `transition_report_status` | **Sì** | No | **Sufficiente** MF2 |

**Da sviluppare nella grande modifica (D90 reali):** delete person, city+patron, patron gallery, photo boundaries, wikimedia; **modifica** G21 (non eliminazione secca).

**Già sufficienti:** person save, POI save/delete, report transition.

---

### 22.8 Punto 7 — Backfill: può partire ora?

**Risposta: B — dopo un sottoinsieme preciso di condizioni (non A immediato, non C «solo dopo tutta» la grande modifica).**

| Ordine | Attività | Rapporto backfill |
|--------|----------|-------------------|
| 1 | POI D90 su DB | **Fatto** (probe) — supera blocco DEC-P10 storico |
| 2 | Approvazione DEC-P01 execute | **Obbligatorio** |
| 3 | **Consigliato prima o in parallelo immediato:** G21 + staging/observatory POI write | Riduce **nuovo** legacy post-backfill |
| 4 | **Backfill `--execute` + `--verify`** | Può essere **step dedicato** dentro la grande modifica **prima** decommission colonne |
| 5 | Read cutover | **Già attivo** — non tornare indietro |
| 6 | Decommission legacy | **Dopo** backfill verify (DEC-P02) |

**Motivo tecnico:** con cutover read attivo, **255 POI** con solo `image_url` sono **invisibili**; backfill è **urgente funzionalmente** e **non** richiede delete person né tutti i D90 residui. Richiede però **governance** (approve execute) e **anti-drift** su write legacy POI.

---

### 22.9 Punto 8 — Test status (sessione 2)

| Test | Esito sessione 2 |
|------|------------------|
| `npm run mf5:smoke` | **PASS** |
| `npm run typecheck` | **FAIL** (RefObject / `inert` — globale, non image) |
| `npm run check` | **FAIL** (idem) |
| Biome globale | **FAIL** parziale (script tmp / repo-wide) |
| Unit test image | **NON VERIFICABILE** — nessun test dedicato |
| `IMAGE_MANAGEMENT_E2E_MATRIX.md` | **NON ESEGUITO** runtime |
| `f1_verify_save_person_minimal.ts` | **NON ESEGUITO** (richiede `F1_5_CONFIRM=1`) |
| Backfill dry-run | **NON ESEGUITO** sessione 2 (conteggi DB alternativi §22.2) |

| Quando | Test |
|--------|------|
| **Prima grande modifica (gate minimo)** | `mf5:smoke` PASS; review migration delete person + G21 design |
| **Durante / dopo implementazione** | Probe RPC nuovi; save/delete POI/person smoke manuale |
| **Dopo backfill execute** | `backfill --verify`; campione UI POI |
| **Fine** | `npm run check`, E2E matrix DEC-P05 |

---

### 22.10 Punto 9 — Documentazione (cosa aggiornare dopo, non ora)

| Documento | Problema rilevato | Azione fase successiva |
|-----------|-------------------|------------------------|
| `AI_POST_MF5_CONSOLIDATION_REPORT.md` | POI DB assente; 5 import dual-write | Aggiornare: POI RPC presenti (se DB target allineato); import risolti |
| `AI_IMAGE_MANAGEMENT_FINAL_CLOSURE_PLAN.md` | DBV POI assente; G03 import | Idem + F1-3 POI test |
| `AI_IMAGE_MANAGEMENT_POST_MF5_GLOBAL_AUDIT.md` §21 | POI assente DB | Nota storica §1–21; verità operativa §22 |
| `AI_IMAGE_MANAGEMENT_AUDIT.md` | Executive pre-MF5 | Banner «storico» o sezione delta |
| `IMAGE_MANAGEMENT_E2E_MATRIX.md` | Riga 25 dual-write; riga 10 `maskSuspendedPrimaryImagesForPeople` inesistente | Allineare a POST-MF5 |
| `AI_IMAGE_MANAGEMENT_MASTER_PLAN.md` | Riferimento `imageAssignmentDualWriteService` | Nota decommission client |
| `AI_DELETED_CODE_REVIEW.md` | Presente in repo (gitignored workflow) | Solo se review attiva — **non letto** in audit 2 |

---

### 22.11 Ordine operativo validato (grande modifica finale)

| # | Attività | Prerequisiti | Blocca | Parallelo? | Rischio se presto |
|---|----------|--------------|--------|------------|-------------------|
| 1 | **Migration delete person D90** + apply | Design DEC-P04 | Delete admin | Con #2 design | DELETE naive lascia assignment orphan |
| 2 | **G21 RPC** allineamento assignment | Pattern 221259/300 | Moderazione foto | Con #1 | Accept invisibile in UI |
| 3 | **Legacy POI write** (staging promote, observatory) → D90 o RPC unificata | POI D90 live | Nuovi POI senza assignment | Dopo #2 ok | Drift post-backfill |
| 4 | **D90 residui** (city+patron, gallery, photo, wikimedia) | STEP 7–8 closure | Dual-write RPC removal | Parziale con #1–2 | Inconsistenza PATCH+assignment |
| 5 | **Backfill `--execute` + `--verify`** | DEC-P01, #3 consigliato | UI immagini POI | Dopo #1–2 **minimo**; ideale dopo #3 | Partial failures manuali |
| 6 | **Decommission** colonne / stop legacy write | #5 verify | DROP | No | Perdita dati se pre-backfill |
| 7 | **Rimozione RPC transitoria** dual_write | Caller=0 per flusso | STEP 10 | Dopo #4 | — |
| 8 | **Test** check + smoke + E2E | #4–6 | Chiusura | — | — |
| 9 | **Documentazione** | #8 | — | Parallelo #8 | — |

**Raggruppamento proposto utente (1–9):** **tecnicamente valido** con correzione: **backfill (#6)** deve precedere **decommission (#7)** e seguire **POI D90** (già OK) + **preferibilmente** fix write drift (#3) e **G21 (#2)**.

**In parallelo:** redazione SQL delete person + G21; tipi Supabase prep.

**Non in parallelo con backfill:** decommission DROP; rimozione RPC senza caller zero.

---

### 22.12 Cosa può contenere la grande modifica finale

1. SQL: `delete_city_person_with_image_cleanup` (+ apply).  
2. SQL: rewrite `accept_famous_person_photo_suggestion` (assignment + legacy stop o null).  
3. Codice: staging/observatory/lifecycle → POI D90 o RPC promote estesa.  
4. Codice + SQL: D90 city+patron, gallery, photo, wikimedia (batch).  
5. Operazione: backfill execute + verify (POI/patron focus).  
6. Decommission legacy read/write (DEC-P02).  
7. Rimozione RPC/client transitori; rigenerazione tipi.  
8. Gate test + doc sync.

---

### 22.13 Cosa fare prima di aprire la grande modifica

- [ ] Approvazione esplicita scope + ordine (DEC-P01 execute incluso o meno nel batch).  
- [ ] Conferma DB target = ambiente produzione/staging corretto (probe POI OK **non** generalizzato ad altri env senza re-probe).  
- [ ] Design review delete person (report FK).  
- [ ] **Non** richiede: ripristino dual-write client (già assente).

---

### 22.14 Cosa NON deve essere modificato

- Cutover read fail-closed (`entityPrimaryImageReadService`).  
- Person save D90 (`save_city_person_with_image_assignment`).  
- POI save/delete D90 client (allineato a migration 231530).  
- Separazione dominio Photo / Presentation Media.  
- Policy orphan cleanup conservativa.

---

### 22.15 Problemi superati (vs §13 prima audit)

| ID | Nota |
|----|------|
| Import dual-write client | **Superato** — `entityImageAssignmentWriteService` + 0 import file rimosso |
| POI D90 DB assente (B2 storico) | **Superato sul DB probe** — **NON VERIFICATO** su altri ambienti |
| Conteggio backfill 256 person | **Superato** — DB probe ~0 person legacy, ~255 POI |

---

### 22.16 Problemi ancora aperti

- Delete person SQL + DB (B3).  
- G21 vs cutover (B4).  
- Backfill execute + verify (B1 adattato a POI).  
- Legacy write staging/observatory (I3).  
- D90 residui (I1, I2).  
- `npm run check` (I5).  
- Documentazione stale (I6).

---

### 22.17 Verdetto finale seconda audit

## **READY WITH PREREQUISITES**

La **grande modifica finale unica** è **preparabile** con contenuto e ordine §22.11–22.12.

**Prerequisiti obbligatori prima di avviare implementazione:**

1. Approvazione operativa batch (incluso backfill execute se nello scope).  
2. Accettazione design **delete person D90** + **G21** (modifica RPC, non eliminazione secca).  
3. Re-probe RPC su **ogni** DB target (POI/person/delete) — esito sessione 2 **non** sostituisce checklist multi-ambiente.

**Non è 🔴 NOT READY:** architettura e percorso closure sono coerenti; gap sono **implementativi censiti**, non contraddizioni architetturali nuove.

**Non è 🟢 READY FOR FINAL IMPLEMENTATION** senza i prerequisiti di governance sopra.

---

*Fine audit — §1–21 storico prima audit 2026-09-23; §22 seconda audit operativa stessa data.*

---

## 23. Progettazione tecnica pre-intervento finale (audit read-only §23)

> **Data:** 2026-09-23 (sessione 3 — solo progettazione, nessuna implementazione).  
> **Fonti:** repository, migration SQL, documentazione MF5 (`AI_IMAGE_MANAGEMENT_MASTER_PLAN.md` §42.15–§42.17, D90; `AI_IMAGE_MANAGEMENT_FINAL_CLOSURE_PLAN.md` DEC-P01…P11, G06, G21, STEP 1–19; `AI_POST_MF5_CONSOLIDATION_REPORT.md`; §22 audit).  
> **Stato DB (SELECT read-only, `.env` locale):** `entity_image_assignments`=1, `media_assets`=1, person legacy con immagine ≈0, POI con `image_url` non vuoto ≈255. Host Supabase = un solo progetto referenziato in documentazione progetto (senza secret).  
> **Nota cronologica:** §22 segnalava POI D90 assente su DB; §23 **conferma presenza RPC POI** sul DB collegato a `.env` (probe semantico `P0001`, non `PGRST202`) — **disallineamento documentale** closure/F1 da aggiornare in fase documentale, non contraddice il codice repo.

Legenda tipi riga: **Verificato** = evidenza repo/DB probe; **Decisione doc** = già in Master Plan / Closure Plan; **Proposta** = derivata da pattern esistenti (221259/231530), da implementare nel giro successivo; **Da decidere** = solo se documentazione insufficiente.

---

### 23.1 DELETE City Person — specifica implementativa (G06 / DEC-P04)

#### 23.1.1 Stato attuale (Verificato)

| Elemento | Evidenza |
|----------|----------|
| **Service** | `src/services/city/entitiesService.ts` — `deleteCityPerson` |
| **RPC atteso** | `delete_city_person_with_image_cleanup` via `mf2Rpc` |
| **Migration SQL** | **Assente** in `supabase/migrations/` |
| **DB** | Probe `delete_city_person_with_image_cleanup` → **PGRST202 / firma non risolta** (§22); funzione **non deployata** |
| **Commento codice** | D90: revoca assignment + history + DELETE person; no delete asset condivisi |

**Caller (Verificato):**

| Caller | Path |
|--------|------|
| Admin people CRUD | `src/hooks/admin/people/usePeopleData.ts` |
| AI complete city | `src/hooks/admin/useAiCompleteCity.ts` |
| Culture regeneration | `src/components/admin/cityEditor/culture/editorCultureRegeneration.ts` |

Comportamento **oggi:** ogni delete admin invoca RPC **inesistente** → errore esplicito `Applicare migration SQL D90 delete person` (non DELETE client silenzioso).

#### 23.1.2 Relazioni da considerare (Verificato schema migration)

| Risorsa | Vincolo / comportamento | Implicazione delete |
|---------|-------------------------|---------------------|
| `city_people` | PK uuid | **DELETE** target |
| `city_person_category_links` | `person_id` → `city_people` **ON DELETE CASCADE** | Automatico con DELETE person |
| `entity_image_assignments` | **Nessuna FK** verso `city_people`; `entity_id` text polimorfico | **Orphan** se DELETE person senza revoca — **vietato** |
| `entity_image_history` | append-only via `append_entity_image_history_trusted` | **Append** eventi revoca/delete, non DELETE history |
| `media_assets` | `assignments.media_asset_id` → **ON DELETE RESTRICT** | **Mai** DELETE asset se esiste assignment (anche removed?) — revoca assignment, **non** cancellare asset |
| `content_reports` | `assignment_id` → assignments **ON DELETE SET NULL**; `entity_id` text senza FK person | Report restano; snapshot conservati |
| `famous_person_photo_suggestions` | `person_id` **ON DELETE CASCADE** | Suggerimenti foto eliminati con person |
| `famous_person_photo_reports` | `person_id` **ON DELETE RESTRICT** | **DELETE person fallisce** se esistono report — **Decisione doc** G06 / audit trail |
| `famous_person_suggestions` | `accepted_person_id` SET NULL (60827140000) | Non blocca DELETE person |
| Assignment **condiviso** | Stesso `media_asset_id` su altre entità (altro person/poi/patron/photo) | **Non** DELETE `media_assets`; revoca solo assignment **di questa** person |

#### 23.1.3 Comportamento target RPC (Proposta — allineata DEC-P04 + pattern `delete_poi_with_image_cleanup`)

**Nome:** `delete_city_person_with_image_cleanup(p_person_id uuid)` (coerente client esistente).

**Autorizzazione (Verificato pattern POI/person):** `SECURITY DEFINER`, `search_path = public, pg_temp`; gate `is_service_role()` OR `is_td_admin(auth.uid())`.

**Transazione unica (D90 reale):**

1. Validare `p_person_id`; `SELECT … FROM city_people WHERE id = p_person_id FOR UPDATE`; se assente → eccezione.
2. **Pre-check RESTRICT:** se esiste almeno una riga in `famous_person_photo_reports` con `person_id = p_person_id` → `RAISE EXCEPTION` messaggio esplicito (admin deve chiudere/archiviare report prima — **Decisione doc** audit trail).
3. Per ogni riga `entity_image_assignments` con `entity_type = 'city_person'`, `entity_id = p_person_id::text`, `is_current = true`, `assignment_status = 'active'` (inclusi eventuali ruoli oltre primary se presenti in futuro — oggi **primary**):
   - `UPDATE` → `assignment_status = 'removed'`, `is_current = false`, `removed_at = now()`, `updated_at = now()`.
   - `PERFORM append_entity_image_history_trusted(...)` con `source = 'delete_city_person_with_image_cleanup'`, `reason = 'person_deleted'`.
4. **Non** eseguire `DELETE FROM media_assets` (RESTRICT + DEC-P04 riuso).
5. `DELETE FROM city_people WHERE id = p_person_id` (cascade category links).
6. `RETURN` void o `city_id` (opzionale per invalidazione cache client).

**Cosa NON fare (Decisione doc + Verificato):**

- Non DELETE assignment rows (stesso stile POI delete — update removed).
- Non DELETE asset condivisi.
- Non DELETE `content_reports` / `entity_image_history`.
- Non ripristinare DELETE client-side su `city_people` senza RPC.

**GRANT:** `REVOKE ALL FROM PUBLIC`; `GRANT EXECUTE TO authenticated` (+ service_role bypass), come `delete_poi_with_image_cleanup`.

**Migration necessaria (Proposta):** nuovo file `supabase/migrations/YYYYMMDDHHMMSS_delete_city_person_with_image_cleanup.sql` (timestamp da assegnare al implement).

**Verifiche DB pre-apply (checklist operativa):**

- [ ] Probe RPC assente pre-migration; post-apply probe semantico (persona inesistente ≠ PGRST202).
- [ ] Test person **senza** report: delete OK, assignments revocate, history append.
- [ ] Test person **con** `famous_person_photo_reports` pending: delete **bloccato**.
- [ ] Test person con assignment + asset usato anche da altra entità: delete person OK, asset **ancora presente**, altri assignment intatti.

**Codice post-migration:** `entitiesService.deleteCityPerson` — **nessun cambio funzionale** previsto se firma RPC coincide; aggiornare `mf2DbClient` / tipi (STEP 15).

---

### 23.2 G21 — `accept_famous_person_photo_suggestion` (allineamento SoT)

#### 23.2.1 Conferma riferimenti (Verificato)

| Ruolo | Path / oggetto |
|-------|----------------|
| UI accept | `src/components/admin/AdminFamousPeopleManager.tsx` (tab moderazione foto) |
| UI submit | `src/components/modals/SuggestFamousPersonPhotoModal.tsx` → `createFamousPersonPhotoSuggestion` |
| Service accept | `famousPersonPhotoSuggestionService.acceptFamousPersonPhotoSuggestion` |
| RPC legacy | `accept_famous_person_photo_suggestion` — `20260908130000_famous_person_moderation_atomic_rpcs.sql` |
| Scrittura legacy oggi | `UPDATE city_people SET image_url, image_storage_path, image_is_placeholder = false` |
| **Caller RPC** | **Un solo** percorso accept: service sopra ← manager (Verificato grep) |
| Altri flussi suggestion | `rejectFamousPersonPhotoSuggestion` — solo status suggestion, **non** tocca immagine ufficiale |
| Report abuso foto | `famousPersonPhotoReportService` / RPC block — **separato** da G21 accept |

**Decisione doc (Closure G21, STEP 7–8):** moderazione **resta**; allineare write a assignment SoT; **non** eliminare la funzione UI/RPC senza sostituto.

#### 23.2.2 Problema (Verificato + Decisione POST-MF5 cutover)

Accept atomico **legacy-only** → cutover read (`applyPrimaryImageCutoverForCityPeople`) **non** mostra la foto accettata finché non esiste primary assignment.

#### 23.2.3 Proposta tecnica (Proposta — motivata da pattern D90 esistente)

**Scelta RPC:** **modificare in-place** `accept_famous_person_photo_suggestion` (Proposta) — un solo caller; evita drift nomi; coerente DEC-P06 «rimuovere dual-write quando caller=0» (qui caller=1).

**Transazione unica (contenuto RPC rivisto):**

1. Lock suggestion + lock person (invariato).
2. Validazioni city/person/status (invariato).
3. Update suggestion → `accepted` (invariato).
4. **Nuovo — sostituisce UPDATE legacy colonne immagine:**
   - `PERFORM upsert_entity_primary_image_assignment(person_id, city_id, suggestion.image_url, bucket, suggestion.storage_path, 'community')`  
     (bucket `public-media` se path relativo — allineare a `ensure_media_asset_from_source` / parser URL).
   - **`UPDATE city_people SET image_url = NULL, image_storage_path = NULL, image_is_placeholder = false`** (allineamento `save_city_person_with_image_assignment` — **Decisione doc** write SoT assignment).
5. **Non** scrivere `image_url` / `image_storage_path` con valori foto (cessazione legacy write — prerequisito decommission DEC-P02).
6. History: già coperta da `upsert_entity_primary_image_assignment` (221259 append su replace/create — Verificato migration person primary).

**Client (`acceptFamousPersonPhotoSuggestion`):**

- Invariato contratto RPC; parsing `ok` jsonb.
- **Storage cleanup** foto precedente (`deletePublicMediaByStoragePath`) resta **best-effort post-RPC** (Proposta — come oggi; **non** equivalente D90; accettabile solo se RPC già committed — **Decisione doc** fail-loud su RPC, cleanup non rollback).

**Errori:**

- Qualsiasi fallimento step 4–5 → rollback transazione (suggestion resta non accepted).
- Client propaga errore; **non** secondo write assignment client.

**Legacy da smettere di scrivere (Decisione doc + Proposta):**

- `city_people.image_url`, `image_storage_path` su accept (sostituiti da null + assignment).
- `image_is_placeholder` può restare `false` o diventare irrilevante pre-DROP colonna.

**Eliminazione futura (solo post-allineamento):**

- **Non** eliminare RPC né UI G21.
- Eliminabile **solo** codice client commenti «legacy» e, a STEP 12–14, colonne person dopo backfill+decommission.

**Migration necessaria:** replace function in nuovo file migration SQL (Proposta).

**Ordine implementazione:** **prima o in parallelo** con delete person; **prima del backfill person** (oggi 0 legacy) ma **critico** per ogni accept live; **obbligatorio prima decommission** colonne person.

---

### 23.3 Vecchi writer POI — censimento e timing vs backfill

#### 23.3.1 Percorsi (Verificato)

| Percorso | Chi lo chiama | Cosa scrive | D90? | Crea POI senza assignment? |
|----------|---------------|-------------|------|----------------------------|
| **`poiWrite.saveSinglePoi`** | Admin modals, AI magic/flash/targeted, validation, observatory inspector save, ecc. (grep `saveSinglePoi`) | RPC `save_poi_with_image_assignment`; SQL azzera `pois.image_url` | **Sì** | No (assignment in RPC) |
| **`poiWrite.deleteSinglePoi`** | Admin POI actions | RPC `delete_poi_with_image_cleanup` | **Sì** | — |
| **`stagingService` → `promote_staging_poi_to_live`** | Import OSM (`useImportActions`, `importAutomationService`, …) | RPC upsert POI con **`image_url` in JSON** → colonne legacy (`20260909150000` L393+) | **No** | **Sì** — cutover read nasconde immagine |
| **`observatoryService.mergePoisInDb`** | `useDuplicateFinder` / DuplicateResolver | `UPDATE pois SET image_url = …` diretto client | **No** | Modifica legacy senza assignment |
| **`cityLifecycleService`** | Bulk city import | Scrive `cities.image_url` (Unsplash) — **non POI** | N/A POI | Fuori perimetro POI assignment |
| **`poiWrite` votes** | `updatePoiVotes` | solo `votes` | — | — |

**Campi POI legacy rilevanti:** `image_url`, `image_status`, `image_credit`, `image_license` (Presentation Media — backfill script usa solo `image_url` per POI; credit/license **non** migrati da backfill — **Verificato** script).

#### 23.3.2 Sequenza vs backfill (Decisione doc DEC-P10 + verifica tecnica §23)

**Sequenza validata (Proposta operativa, coerente Master Plan §42.15 + Closure STEP 3→4→5→6):**

```text
POI D90 su DB (save/delete admin)     ← Verificato presente su DB probe §23
→ chiusura writer legacy POI necessari (staging promote, observatory merge)
→ BACKFILL dry-run (review) + approvazione DEC-P01
→ BACKFILL --execute
→ BACKFILL --verify
→ verifica campione UI POI/patron
→ decommission colonne/write legacy (DEC-P02, STEP 12–14)
→ test E2E (DEC-P05)
→ chiusura documentale
```

**Perché chiudere writer legacy POI prima (o nello stesso release, prima di `--execute`):**

- Durante backfill, ogni nuovo POI via promote con solo `image_url` rientra nel set «legacy senza assignment» → **`--verify` fallisce** (Verificato logica `runVerify`).
- Cutover read già attivo → POI creati solo legacy restano **invisibili** (regressione funzionale).

**`cityLifecycleService`:** non blocca backfill POI; resta nel perimetro **city card** (fuori scope assignment MF5 — **Decisione doc** Source of Truth Matrix).

**Destinazione architetturale (Proposta):**

- **Staging:** estendere `promote_staging_poi_to_live` per chiamare `upsert_poi_primary_image_assignment` quando `image_url`/path presente **oppure** deprecare promote e usare `save_poi_with_image_assignment` post-insert POI base (valutare payload completeness).
- **Observatory merge:** dopo merge campi testuali, se copia `image_url` → invocare stessa primitive D90 POI primary (server-side preferito — **Decisione doc** §42.16).

---

### 23.4 D90 rimanenti — mini-specifiche + tabella riepilogo

#### A. City + Patron primary (Proposta)

1. **Operazione:** Admin salva scheda città con foto patrono (hero JSON + assignment).
2. **Oggi:** `cityWriteService.saveCityDetails` → PATCH API + `upsertEntityImageAssignmentFromSource` / revoke client (`cityWriteService.ts`).
3. **Rischio:** PATCH OK, assignment fail → JSON `patron_details.imageUrl` desincronizzato da cutover read.
4. **Atomico:** PATCH `cities` (incluso `patron_details` senza URL display obbligatorio post-decommission) + primary patron assignment/revoke.
5. **Soluzione proposta:** RPC server **`save_city_patron_primary_with_details`** o estensione handler `persistCityDetails` + RPC assignment in **una** transazione DB (preferito **Decisione doc** §42.16 server-side).
6. **Migration:** nuova RPC; possibile riuso `upsert_entity_primary_image_assignment` con `entity_type = patron`.
7. **Errore:** rollback completo; AdminToast (DEC-P03).
8. **Asset condiviso:** stesse regole 221259 (replace primary, no delete asset).

#### B. Patron gallery (Proposta)

1. **Operazione:** add/update/remove foto galleria patrono.
2. **Oggi:** CRUD `city_patron_gallery` + `materializePatronGalleryAssignment` / revoke client (`cityPatronGalleryService.ts`).
3. **Rischio:** riga gallery senza assignment → filtro pubblico nasconde (`filterPatronGalleryByAssignmentVisibility`).
4. **Atomico:** insert/update gallery row + gallery assignment + history in un RPC per operazione (add/remove/reorder non immagine escluso).
5. **Migration:** RPC dedicate o una `save_patron_gallery_photo_with_assignment`.

#### C. Photo upload (Proposta)

1. **Operazione:** upload community / official.
2. **Oggi:** storage → insert `photo_submissions` → `materializePhotoSubmissionAssignment`; rollback delete submission on fail (**compensazione client** — Verificato `uploadCommunityPhoto`).
3. **D90 proposto:** RPC `create_photo_submission_with_assignment` (submission approved/pending + assignment se approved).

#### D. Photo approve / update / delete (Proposta)

| Sotto-flusso | Oggi | D90 proposto |
|--------------|------|--------------|
| Approve | update status + materialize; rollback status | RPC transazione |
| Update URL/city | update + materialize + revoke old; rollback parziale | RPC transazione |
| Delete | revoke assignment client + delete row (`deletePhotoSubmissionInDb`) | RPC transazione |

#### E. Wikimedia pipeline (Proposta)

1. **Oggi:** storage + asset status RPC + `upsertEntityImageAssignmentFromSource` (`commonsDownloadPipeline.ts`).
2. **D90 proposto:** RPC unica post-verifica MF4 che materializza asset verified + primary assignment per entity target.

#### F. Altri (Verificato)

- **G21 accept:** §23.2 (modifica RPC).
- **Report transition:** già transazione MF2 — **Sufficiente**.
- **Transitoria `upsert_entity_image_assignment_dual_write`:** decommission per flusso quando D90 sopra live (DEC-P06 STEP 10).

#### G. AI portrait (Decisione doc + Verificato)

- **`registerAiGeneratedPortraitAsset`** + **`saveCityPerson` D90** = due step; **accoppiamento accettabile** se save person sempre invocato dopo portrait admin (**Closure Write census** — «OK se save person»).
- **D90 dedicato portrait-only:** **non obbligatorio** salvo flusso che registra asset **senza** save person (Verificare caller `usePeopleAI` / regeneration — **Proposta:** audit caller nel giro implement; default **no nuovo D90** se sempre seguito da save person).

#### Tabella riepilogo D90

| Flusso | D90 necessario | Soluzione proposta | Migration | Codice | Prerequisiti | Ordine |
|--------|----------------|-------------------|-----------|--------|--------------|--------|
| Person delete | **Sì** | RPC `delete_city_person_with_image_cleanup` (pattern delete POI) | **Nuova SQL** | Già chiama RPC | G06 design | **1** |
| G21 accept foto | **Sì** | Rewrite RPC + null legacy person columns | **Nuova SQL** | Service invariato | Cutover read | **2** (parallelo 1) |
| POI staging promote | **Sì** | Extend promote RPC o call POI D90 | SQL promote / POI | `stagingService` | POI D90 DB | **3** |
| POI observatory merge | **Sì** | D90 primary on image copy | SQL o client→RPC | `observatoryService` | POI D90 DB | **3** |
| City + patron primary | **Sì** | RPC unificata PATCH+assignment | Nuova SQL | `cityWriteService` | — | **4** |
| Patron gallery CRUD | **Sì** | RPC per add/remove foto+assignment | Nuova SQL | `cityPatronGalleryService` | — | **5** |
| Photo upload/approve/update/delete | **Sì** | RPC family photo_submission | Nuova SQL | `photoService` | MF2 photo rules | **6** |
| Wikimedia complete | **Sì** | RPC pipeline terminal | Nuova SQL | `commonsDownloadPipeline` | MF4 asset status | **7** |
| AI portrait register | **Condizionale** | Mantieni accoppiamento save person | — | hooks AI | Verifica caller | **8** opzionale |
| Person save | No | Già D90 | 221300 | `entitiesService` | — | — |
| POI save/delete admin | No | Già D90 | 231530 | `poiWrite` | DB apply | — |
| Report abuse | No | MF2 RPC | 161302 | `contentReportService` | — | — |

---

### 23.5 Backfill — piano obbligatorio chiusura MF5

**Decisione doc (DEC-P01, Master Plan §42.15, MF5):** backfill **obbligatorio**; dry-run default; execute solo post-review; **non** opzionale per chiusura.

#### Stato attuale (Verificato §23 DB + script)

| Entità | Legacy residuo (DB probe) | Già migrato |
|--------|---------------------------|-------------|
| `city_person` | ≈0 righe con url/path | 1 assignment test (Poppea — storico F1-5 doc) |
| `poi` | ≈255 con `image_url` | 0 assignment POI |
| `patron` | da contare JSON (`patron_details.imageUrl`) — **NON VERIFICATO** conteggio singolo in §23 | — |

#### Cosa produce backfill (Verificato script)

- `media_assets` via `ensure_media_asset_from_source` (`origin_type = 'admin'` **fisso** — **limitazione provenance** documentata §22).
- Primary assignment `active`/`current` + snapshot source_*.
- **Non** cancella legacy columns; **non** DELETE storage; **non** rimuove dati test.

#### Prerequisiti

| Tipo | Requisito |
|------|-----------|
| **Governance** | Approvazione esplicita execute (DEC-P01); vincolo utente «no upload parallelo» (Closure vincolo operativo) |
| **Tecnico** | `ensure_media_asset_from_source` su DB (DBV-02 doc); POI D90 operativo (**Verificato** §23); writer POI legacy **chiusi o congelati** durante execute (**Proposta** §23.3) |
| **G21** | **Consigliato** prima di accept foto live post-backfill person (person legacy ≈0 oggi) |

#### Comandi (Verificato `package.json`)

| Fase | Comando |
|------|---------|
| Dry-run | `npm run mf5:backfill:dry-run` → `tsx scripts/backfill_media_assets_from_legacy.ts` |
| Execute | `tsx scripts/backfill_media_assets_from_legacy.ts --execute` (+ `--entity-type`, `--batch-size`, `--pause-ms`) |
| Verify | `npm run mf5:backfill:verify` → `--verify` |

#### Successo / stop

- **Successo verify:** 0 entità legacy con immagine senza primary current + `media_asset_id` (Verificato `runVerify`).
- **Stop operativo:** errori massivi, `partial_failure` > 0 → pausa, recovery manuale (script **non** rollback automatico — **Verificato**).
- **Rollback:** **non automatico**; recovery manuale assignment/asset orphan (DEC-P01).

#### Sequenza chiusura MF5 (Decisione doc + §23.3)

```text
Completamento architettura necessaria (D90 delete, G21, POI writers, altri D90 per flussi ancora attivi in produzione)
→ BACKFILL dry-run (review log)
→ BACKFILL --execute
→ BACKFILL --verify
→ verifica UI campione + metriche DB
→ decommission legacy (DEC-P02, §42.17)
→ test E2E (DEC-P05)
→ chiusura documentale MF5
```

**Correzione rispetto a «backfill subito dopo solo POI D90»:** POI D90 **non basta** se staging/observatory continuano a scrivere legacy — serve **chiusura writer** (step 3 §23.3) **nello stesso programma**, idealmente **prima** di `--execute`.

---

### 23.6 Verifica ambiente database (read-only)

| Domanda | Esito |
|---------|--------|
| Quanti Supabase URL in repo template? | **Uno** client: `VITE_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` server (`.env.example`) |
| Staging vs production in repo? | **NON VERIFICABILE** file `.env` (secret); **nessun** workflow GitHub Actions migration multi-env trovato (0 `.github/workflows` image) |
| Local Supabase CLI | `supabase/config.toml` — `project_id = "TouringDiary"` — dev locale **opzionale**; non prova secondo remoto |
| Documentazione progetto | `AI_CONTEXT/AUDIT_REVIEWS_AND_RATINGS.md` cita progetto linked «Touring Diary» — **un** project ref documentato |
| Apply migration | Script `scripts/f1_apply_sql_migration.cjs` — DDL manuale via `SUPABASE_DB_URL` / Dashboard (**Verificato** commento script) |

**Conclusione (Proposta basata su evidenze):** per lo sviluppo corrente risulta **un singolo database operativo** collegato via `.env` locale; **distinzione staging/production non dimostrata** nel repository — se esiste altro ambiente, serve checklist probe RPC/contagens **per ambiente** prima execute backfill.

**NON esposti:** chiavi, token, URL completi con credenziali.

---

### 23.7 Ordine del grande intervento (non esecutivo)

| Fase | Contenuto | Note |
|------|-----------|------|
| **A** | Migration + apply: **delete person D90** | Sblocca admin delete |
| **B** | Migration + apply: **G21 RPC** allineata assignment | Sblocca moderazione foto visibile |
| **C** | **POI legacy writers** (staging promote, observatory merge) | **Prima backfill execute** |
| **D** | D90 **city+patron primary**, **patron gallery**, **photo**, **wikimedia** (batch implementazione) | Ordine interno 4→5→6→7 tabella §23.4 |
| **E** | **BACKFILL** dry-run review → **--execute** → **--verify** | **Obbligatorio** MF5 |
| **F** | Verifica post-backfill (UI + `--verify` + campione) | Gate DEC-P02 |
| **G** | **Decommission** legacy read/write/colonne (DEC-P02, §42.17) | Solo post-verify |
| **H** | Rimozione RPC transitoria dual_write + `ensure_current` quando caller=0 (DEC-P06, STEP 11) | Dopo G |
| **I** | Rigenerazione `src/types/supabase.ts`, riduzione cast (STEP 15) | Dopo SQL stabili |
| **J** | `npm run check`, smoke MF5, **E2E matrix** (DEC-P05) | Gate finale |
| **K** | Documentazione + verdetto chiusura MF5 (STEP 19) | — |

**Parallelo ammesso:** A+B redazione SQL; C+D parziale per team.

**Inversione sconsigliata:** backfill execute **prima** di C (writer POI) — **motivo** §23.3.

**Inversione sconsigliata:** decommission **prima** di verify backfill — viola DEC-P02.

---

### 23.8 Decisioni — tabella chiusura

| Decisione | Già documentata? | Risultato audit §23 | Deve decidere l'utente? |
|-----------|------------------|---------------------|-------------------------|
| Backfill obbligatorio (DEC-P01) | **Sì** | Confermato; POI ≈255 da migrare | **Sì** — approvazione execute |
| Ordine POI → backfill (DEC-P10) | **Sì** | POI D90 DB OK; writer legacy **prima** execute | No (seguire sequenza §23.7) |
| Delete person: no delete asset condiviso (DEC-P04) | **Sì** | Spec §23.1 | No |
| Delete bloccato se photo reports RESTRICT | **Sì** (60827140000) | Spec §23.1 pre-check | No |
| G21 resta, non eliminare (G21/STEP 7) | **Sì** | Modifica RPC §23.2 | No |
| Cutover read senza fallback POST-MF5 | **Sì** | Non revert | No |
| D90 server-side §42.16 | **Sì** | Tabella §23.4 | No |
| Decommission solo post-backfill (DEC-P02) | **Sì** | §23.5 | No |
| E2E solo STEP 18 (DEC-P05) | **Sì** | Invariato | No |
| Staging promote: extend RPC vs replace con saveSinglePoi | **Parziale** | **Proposta** due opzioni §23.3 | **Opzionale** — preferenza implementativa (default: extend promote server-side) |
| RPC unica city+patron vs extend admin API handler | **Parziale** | **Proposta** server transaction | **Opzionale** — default RPC co-located DB |
| AI portrait D90 standalone | **Parziale** | Default **no** se save person sempre | **Opzionale** — solo se trovato caller orphan |
| Multi-ambiente Supabase | **No** | Single env probabile | **Sì** — solo se esiste secondo DB non documentato |

---

### 23.9 Verdetto finale §23

## **READY FOR IMPLEMENTATION**

*(con prerequisiti di governance espliciti — distinto da «ready for closure MF5»)*

| Categoria | Contenuto |
|-----------|-----------|
| **Deciso (doc + audit)** | Modello SoT assignment; backfill obbligatorio; sequenza POI D90 → writer → backfill → decommission; G21 da **modificare** non rimuovere; delete person RPC da **creare** come §23.1; POI admin D90 **già su DB probe** |
| **Progettato (§23)** | Spec delete person, G21, POI writers, tabella D90, piano backfill, ordine §23.7 |
| **Da decidere utente** | Approvazione **execute** backfill; conferma **single DB** vs altri ambienti; opzioni implementative minori (staging promote shape, city+patron RPC vs handler) |
| **Prossimo giro** | Implementazione unica ondata §23.7 A→K — **senza** improvvisare architettura durante coding |

**Non equivale a:** MF5 **CLOSED** / POST-MF5 **CLOSED** — mancano execute, D90 codice/SQL, decommission, E2E, check verde.

---

*Fine audit — §1–21 storico; §22 verifica operativa; §23 progettazione pre-intervento finale (2026-09-23).*

---

## §24 — FINAL CONSOLIDATION VERIFICATION

> **Tipo:** verifica tecnica **read-only** pre–grande intervento finale MF5 / Image Management.  
> **Data:** 2026-09-24  
> **Eseguito:** analisi codice + probe DB in sola lettura (client `.env` locale → un progetto Supabase; **nessuna** scrittura, migration, backfill, cancellazione).  
> **Non modificato:** codice applicativo, DB, script eseguiti in modalità `--execute`.  
> **Relazione con §22–§23:** conferma/corregge ipotesi operative (es. «~255 POI da migrare» → **placeholder, non fotografie**).

---

### 24.1 — POI con `image_url` (~255): placeholder vs foto reali (**PRIORITÀ backfill**)

| Campo | Valore |
|--------|--------|
| **STATO** | **Confermato — conclusione A (placeholder)** |
| **Evidenza DB (read-only)** | `255` righe `pois` con `image_url` non vuoto; **`11` URL distinti**; **`255/255`** contengono path `public-media/.../admin_assets/` (Asset Globali); **`0`** assignment `entity_type = 'poi'`; **`0`** evidenza upload utente su POI nel DB corrente |
| **Evidenza codice — scrittura** | `stagingService.promoteToLive`: `image_url: getCachedSetting(category)` da `category_placeholders` (`settingsService` / Asset Globali) — `src/services/stagingService.ts` (~612–677); RPC `promote_staging_poi_to_live` persiste `p_poi->>'image_url'` — `supabase/migrations/20260909150000_promote_staging_poi_atomic_hardening.sql`; `observatoryService.mergePoisInDb` può copiare `victim.imageUrl` in `updates.image_url` — `src/services/observatoryService.ts` (~130) |
| **Evidenza codice — lettura / UI** | Cutover read: `applyPrimaryImageCutoverForPois` → **senza assignment** `imageUrl` vuoto — `entityPrimaryImageReadService.ts`; display: `resolvePoiDisplayImageUrl` usa snapshot poi **placeholder di categoria** — `src/domain/poi/resolvePoiDisplayImageUrl.ts`; i valori legacy in colonna **non** sono la SoT POST-MF5 |
| **Placeholder definitivo** | Mappa `global_settings.category_placeholders` + registry origine Asset Globali (`platformPlaceholderRegistry.ts`, `platformPlaceholderOrigin.ts`); UI POI **non** deve materializzare placeholder come `media_assets` / assignment |
| **Cosa modificare** | `scripts/backfill_media_assets_from_legacy.ts`: **`fetchPoiBatch` / loop POI** deve **escludere** ogni sorgente placeholder (vedi sotto); chiudere writer legacy che reintroducono `pois.image_url` placeholder (§24.4) |
| **Cosa NON modificare** | Non creare `media_assets` né `entity_image_assignments` per i ~255 URL attuali; non trattare `image_url IS NOT NULL` come criterio di migrabilità |
| **Script backfill — modifica richiesta** | Prima di `ensure_media_asset_from_source`: caricare registry (`getPlatformPlaceholderRegistryAsync` o equivalente server-side) e **`skip` se `isPlatformPlaceholderUrl(imageUrl, registry)`**; in alternativa minima coerente con dominio Photo: **skip se path contiene `/admin_assets/`** (allineato a `assertPhotographWrite` / Asset Globali). **Non** usare `p_origin_type: 'admin'` per POI placeholder. Eventuali POI futuri con foto reale avranno path **non** placeholder e assignment già via `save_poi_with_image_assignment` (`poiWrite.ts`) |
| **Conclusione esplicita A** | I ~255 record sono **grafica di categoria / Asset Globali**, non fotografie associate al POI. **NON migrare** al backfill; **NON** diventare `media_assets` / assignment; backfill POI deve **escluderli**; il POI in produzione deve continuare a mostrare placeholder via **cutover read + `resolvePoiDisplayImageUrl` / category map**, non via assignment fittizio |
| **Conclusione B** | **Non applicabile** sul DB probe: nessun URL POI fuori `admin_assets/`; nessuna evidenza caricamenti manuali POI |

**Correzione rispetto a §22–§23:** la cifra ~255 indica **righe con colonna legacy valorizzata**, non **foto migrabili**.

---

### 24.2 — Santo Patrono: foto accettate in Admin, non visibili nel frontend

| Campo | Valore |
|--------|--------|
| **STATO** | **Confermato — da correggere (divergenza dati + read POST-MF5)** |
| **Flusso scrittura (suggerimento foto → galleria)** | UI: `AdminReportsPatronTab` → `AdminPatronSaintManager` (`embeddedSection="photo_suggestions"`) → `approvePatronPhotoSuggestionItems` — `patronPhotoSuggestionService.ts`; per item approvato: `addCityPatronGalleryPhotoFromApprovedSuggestion` → INSERT `city_patron_gallery` + `materializePatronGalleryAssignment` → `upsertEntityImageAssignmentFromSource` (`role: gallery`) — `cityPatronGalleryService.ts` |
| **Flusso lettura frontend** | `PatronSaintModal` → `useCityPatronGallery` → `listCityPatronGallery(..., { maskSuspendedAssignments: true })` → `filterPatronGalleryByAssignmentVisibility` — **nasconde** righe senza `assignmentId` attivo + `media_assets` pubblicabile — `imageAssignmentVisibilityService.ts`, `useCityPatronGallery.ts` |
| **Flusso lettura hero (primaria)** | `PatronSaintModal` → `resolvePatronPrimaryImageUrl` → assignment **primary** patron — **non** `patron_details.imageUrl` — `PatronSaintModal.tsx`, `entityPrimaryImageReadService.ts` |
| **Evidenza DB** | `city_patron_gallery`: **6** righe; `entity_image_assignments` patron `gallery`: **0**; patron `primary`: **0**; item `patron_photo_suggestion_items` **approved**: **4**; suggerimento **accepted** presente (es. città `city_torre-annunziata`) |
| **Dove si rompe** | **Lettura POST-MF5 fail-closed** con **dati legacy galleria senza assignment**. Le righe in `city_patron_gallery` esistono ma **non passano** `filterPatronGalleryByAssignmentVisibility` (`assignmentId` assente). Cause plausibili: approvazioni **prima** dell’introduzione di `materializePatronGalleryAssignment`, fallimento storico materialize, o DB mai allineato dopo deploy MF5 |
| **Scrittura manuale admin (city editor)** | `saveCityDetails` → PATCH città poi **separato** `upsertEntityImageAssignmentFromSource` primary se `patronDetails.imageUrl` — `cityWriteService.ts`; anteprima editor usa ancora `resolvePatronDisplayImageUrl` su `patronDetails` — `CulturePatronMainPhotoSection.tsx` (**divergenza preview vs pubblico** finché primary non è su assignment) |
| **Correzione definitiva** | (1) **Repair dati:** per ogni riga `city_patron_gallery` valida, materializzare assignment gallery (stesso contratto di `materializePatronGalleryAssignment`) — fase dedicata pre/post backfill, **non** backfill `fetchPatronBatch` (legge solo `cities.patron_details`, non galleria). (2) **Nuove approvazioni:** verificare che materialize non fallisca (RPC `upsert_entity_image_assignment_dual_write` / ensure asset). (3) **Primaria:** allineare salvataggio editor e read pubblico su **assignment primary** (PATCH città **non** deve essere annullato se fallisce solo assignment — vedi §24.6) |
| **Cosa NON fare** | Fallback read su `city_patron_gallery.image_url` senza assignment; dual-write permanente su `patron_details.imageUrl` come SoT pubblica |

**Nota:** voce sidebar legacy `patron_saint` (`AdminPatronSaintManager` completo) duplica parzialmente Segnalazioni → Patrono; decommission **UI** da pianificare con G21 (§24.3), non blocca la fix tecnica galleria.

---

### 24.3 — G21 — Personaggio famoso: solo nuovo sistema

| Campo | Valore |
|--------|--------|
| **STATO** | **Confermato — migrazione esclusiva al nuovo sistema; da implementare in SQL/servizi** |
| **Percorso ufficiale (target)** | `AdminReportsHub` → Personaggio famoso → **Suggerimento foto** → `AdminFamousPeopleManager` `embeddedSection="photo_suggestions"` — `AdminReportsFamousPersonTab.tsx` |
| **Vecchio percorso ancora attivo** | Sidebar **`famous_people`** → `AdminFamousPeopleManager` **senza** embed — `AdminDashboard.tsx` (`case 'famous_people'`), `AdminSidebar.tsx`; stesso componente, stesse RPC |
| **Scrittura oggi (accettazione foto)** | `acceptFamousPersonPhotoSuggestion` → RPC **`accept_famous_person_photo_suggestion`** → UPDATE **`city_people.image_url` / `image_storage_path`** — `famousPersonPhotoSuggestionService.ts`, `20260908130000_famous_person_moderation_atomic_rpcs.sql` (**solo legacy entità**) |
| **Lettura oggi** | `applyPrimaryImageCutoverForCityPeople` → **solo** `entity_image_assignments` + `media_assets` — `entityPrimaryImageReadService.ts`; DB probe: **`0`** person con legacy image, **`1`** assignment `city_person` |
| **Divergenza** | Accettazione admin **scrive legacy**; frontend **legge assignment** → foto accettata **invisibile** (stesso pattern Patrono primary se non c’è assignment) |
| **Decisione architetturale** | **Confermata:** un solo sistema — accettazione deve creare/aggiornare **`media_assets` + assignment primary** con provenance da suggerimento (`origin`/`license`/`credit` da riga suggestion, **non** `admin` hardcoded se il dato esiste). **Niente** sync legacy → nuovo né nuovo → legacy |
| **Da rimuovere / decommission** | Route/nav **`famous_people`** standalone per moderazione; mantenere embed in Segnalazioni. RPC **`accept_famous_person_photo_suggestion`** va **riscritta** (o sostituita) come D90 assignment — allineato §23.2. Moderazione personaggio (non foto) resta distinta: `accept_famous_person_suggestion` |
| **Sostituibilità** | **Sì:** il tab Segnalazioni copre `photo_suggestions` e `person_suggestions`; il vecchio manager full-page è **ridondante** per moderazione |

---

### 24.4 — Vecchi writer POI (`image_url` legacy)

| Writer | Scrive `pois.image_url`? | STATO | Azione |
|--------|---------------------------|--------|--------|
| `stagingService.promoteToLive` + RPC `promote_staging_poi_to_live` | **Sì** (placeholder categoria) | **Da correggere** | Smettere di persistere placeholder in colonna; promote POI **senza** foto reale → `image_url` null/vuoto; placeholder solo in read UI |
| `observatoryService.mergePoisInDb` | **Sì** (copia vittima) | **Da correggere** | Non propagare placeholder/real legacy; merge metadati POI senza colonna immagine legacy |
| `poiWrite.saveSinglePoi` / RPC `save_poi_with_image_assignment` | Payload RPC: **`image_url` null** in transazione assignment | **Confermato** — percorso nuovo | Mantenere come unico writer foto **reale** POI |
| Altri (censimento §22) | Verificare in implementazione | — | Nessun altro writer deve reintrodurre placeholder |

**Ordine (allineato punto 1 utente):** (1) verifica placeholder **§24.1** ✓ → (2) chiusura writer legacy → (3) backfill **solo** foto reali (atteso **~0 POI** sul DB attuale) → (4) verify → (5) decommission colonna/read legacy.

**Placeholder:** restano serviti da **`applyPrimaryImageCutoverForPois` + `resolvePoiDisplayImageUrl`**, non da assignment.

---

### 24.5 — DELETE Personaggio + foto

| Campo | Valore |
|--------|--------|
| **STATO** | **Confermato — decisione §22/§23 invariata** |
| **Implementazione attesa** | RPC server-side `delete_city_person_with_image_cleanup`: revoca assignment/history; **non** DELETE `media_assets` se condivisi; rispettare FK/report RESTRICT |
| **Evidenza** | Migration **assente** in repo; probe client → funzione **non deployata** (§22) |
| **Cosa NON riaprire** | Semantica delete / cleanup condiviso — già approvata |

---

### 24.6 — D90 — Creazione città vs operazioni secondarie

| Campo | Valore |
|--------|--------|
| **STATO** | **Confermato — principio utente corretto; codice parzialmente allineato** |
| **Principio** | **Città = operazione principale**; fallimento Patrono / personaggio / POI / immagini **non** deve annullare la città già creata. Atomicità **dentro** la singola operazione coerente (es. approvazione foto galleria = riga gallery + assignment; approvazione community = status + assignment con rollback status — `photoService.updatePhotoStatusInDb`) |
| **Evidenza — lifecycle import** | `cityLifecycleService`: insert/update città **per città** in try/catch; errore su una città non rollback batch intero — `cityLifecycleService.ts` (~352–356) |
| **Evidenza — save city + patron primary** | `saveCityDetails`: **PATCH** `/cities/.../details` **poi** assignment primary; se assignment fallisce → throw **dopo** PATCH (**città salvata, foto no**) — `cityWriteService.ts` — **non** mega-transazione «città+patron indivisibile» |
| **Interpretazione §23 da correggere** | **NON** richiedere RPC unica «city + foto patrono» come requisito prodotto; eventuale D90 **solo** per «immagine + assignment» nella stessa operazione |
| **Transazioni troppo ampie** | Non trovata transazione DB che leghi creazione città intera a POI/Personaggi; staging promote è atomico **POI+staging**, non intera città |

---

### 24.7 — Galleria Santo Patrono (operazione indipendente)

| Campo | Valore |
|--------|--------|
| **STATO** | **Confermato — confine atomicità già definito in codice; dati da riallineare** |
| **Operazioni distinte** | Suggerimento/modera; **singola approvazione item** = INSERT gallery + materialize assignment (rollback gallery+storage su fallimento) — `addCityPatronGalleryPhotoFromApprovedSuggestion`; delete gallery + revoke assignment — `deleteCityPatronGalleryPhoto` |
| **RPC server-side aggiuntivo** | **Non dimostrato necessario** se materialize assignment resta affidabile; valutare RPC solo se si vogliono gallery+assignment **strict** in un unico round-trip DB (opzionale, non D90 «città») |
| **Personaggio famoso ↔ galleria patrono** | **Nessun legame** — confermato |

---

### 24.8 — Foto Community

| Fase | Scrive | Legge | Nuovo sistema | Legacy | Atomicità |
|------|--------|-------|---------------|--------|-----------|
| Upload / ricezione | `photo_submissions` + storage `community-photos` | — | Parziale (`assertPhotographWrite`, registry placeholder) | Tabella submission | Upload ≠ moderazione |
| Moderazione approve/reject | `updatePhotoStatusInDb` | `photo_submissions` | **Assignment** on approve via `materializePhotoSubmissionAssignment` | Status su submission | **Sì** approve: update status + assignment, rollback status se assignment fallisce — `photoService.ts` (~719–747) |
| Pubblicazione / visibilità | `published_at`, status | Cutover / query photograph | Assignment `photo_submission` | Colonne submission | Fase distinta |
| Rimozione | `deletePhotoSubmissionInDb`, `propagatePhotoRemoval` | — | Revoca assignment | Submission + storage | Per flusso |

**Confine D90:** **approve/reject** (status + assignment), **non** l’intero ciclo vita community in una transazione.

---

### 24.9 — «Foto & Moderazione» vs Segnalazioni → Community

| Campo | Valore |
|--------|--------|
| **STATO** | **Confermato — NON è duplicato di «Foto Live» in Segnalazioni** |
| **Foto & Moderazione** | Route `photos` → `PhotoModeration` + `usePhotoModeration` — coda **`photo_submissions`**: upload, approve, reject, metadata, delete — `AdminSidebar.tsx`, `PhotoModeration.tsx`, `photoService.ts` |
| **Segnalazioni → Community → Foto Live** | `AdminReportsCommunityTab` → `ReportsListPanel` **`photo_submission` + `community_live` + abuse** — solo **segnalazioni abuso**, non moderazione ingresso — `AdminReportsCommunityTab.tsx` |
| **Ruolo definitivo** | Mantenere **un** punto di moderazione submission (`PhotoModeration` o successor under Segnalazioni se si unifica UX); **non** confondere con tab abuso. Decommission solo se in futuro si **sposta** la stessa funzionalità in Segnalazioni con parità feature (oggi **non equivalente**) |

---

### 24.10 — Wikimedia

| Campo | Valore |
|--------|--------|
| **STATO** | **Confermato — confine atomicità già modulare** |
| **Flusso** | Download → storage → `media_assets` (+ provenance patch) → `record_image_verification_run` → (auto-path) `transition_media_asset_status` → `upsertEntityImageAssignmentFromSource` — `commonsDownloadPipeline.ts` |
| **Atomicità** | Persistenza asset + run verifica in try; assignment **solo** su auto-path verificato; quarantena **senza** assignment — **non** un unico D90 gigante |
| **Metadata** | `origin_type: 'wikimedia'`, licenza/provenience da Commons — **non** hardcodare `admin` |

---

### 24.11 — BACKFILL (piano, non esecuzione)

| Campo | Valore |
|--------|--------|
| **STATO** | **Confermato obbligatorio (DEC-P01) — NON eseguire finché non soddisfatte le condizioni sotto** |
| **Condizioni pre-execute** | (1) Placeholder POI **esclusi** in script (§24.1); (2) writer POI legacy chiusi (§24.4); (3) G21 / Patrono gallery repair o nuove write corrette; (4) provenance/license non inventate; (5) **dry-run** + review log; (6) approvazione esplicita utente; (7) `--execute`; (8) `--verify` + campione UI |
| **Cosa il backfill NON deve fare** | Cancellare legacy fisico; promuovere placeholder; creare duplicati; `admin` falso su origini community/wikimedia/suggestion |
| **Contenuto migrabile atteso (DB probe)** | POI: **~0** foto reali; Person: **~0** legacy column (assignment già presente per casi nuovi); Patron primary da `patron_details` solo se URL **non** placeholder; **galleria patrono** richiede **job/repair dedicato**, non solo `fetchPatronBatch` |

---

### 24.12 — Database / staging / produzione

| Campo | Valore |
|--------|--------|
| **STATO** | **Non dimostrabile dal repository/configurazione analizzata** — distinzione staging/production **separati** |
| **Evidenza** | Un client template: `VITE_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (`.env.example`); probe eseguito su `.env` locale; `supabase/config.toml` per dev CLI — **non prova** secondo ambiente remoto |
| **Policy** | Trattare DB collegato al `.env` corrente come **unico operativo** salvo documentazione esterna utente |

---

### 24.13 — TEST

| Campo | Valore |
|--------|--------|
| **STATO** | **Confermato — fuori scope verifica; gate finale invariato** |
| **Sequenza** | Implementazione → backfill + verify → decommission → `supabase.ts` → `npm run check` → smoke → E2E (DEC-P05) |

---

### 24.14 — Principio generale architetturale

| Principio | STATO |
|-----------|--------|
| Nuovo Image Management = unica SoT read (POST-MF5) | **Confermato** |
| Niente fallback legacy read Person/POI/Patron primary | **Confermato** (fail-closed) |
| Niente dual-write permanente entità | **Confermato** (RPC dual_write = nome storico; no update colonne entità in SQL corrente) |
| Niente placeholder → media_asset/assignment | **Confermato** §24.1 |
| Città indipendente da secondari | **Confermato** §24.6 |
| Atomicità per operazione coerente | **Confermato** §24.6–24.8 |
| Backfill prima decommission legacy | **Confermato** |
| E2E alla fine | **Confermato** |

---

### 24.15 — Ordine grande intervento (verificato e motivato)

Rispetto alla traccia A–T utente: **I (placeholder) e J (script backfill) devono precedere M (execute)**; **C (writer POI) prima di M**; **B e D/E prima del backfill dati person/patron**.

| Step | Contenuto | Motivo |
|------|-----------|--------|
| **A** | Delete person D90 SQL + apply | Sblocca admin; decisione chiusa §24.5 |
| **B** | G21: RPC/servizio **solo** assignment; rimuovi nav `famous_people` moderazione | Divergenza write/read oggi §24.3 |
| **C** | Chiusura writer POI (staging promote, observatory merge) | Evita re-popolamento legacy placeholder |
| **D** | Patrono: fix materialize + **repair** `city_patron_gallery` → assignment | DB: 6 gallery / 0 assignment §24.2 |
| **E** | Patrono primary: read/write coerenti assignment; editor vs pubblico | §24.2 |
| **F** | Community: verificare approve + assignment su campione | Già pattern rollback in `photoService` |
| **G** | «Foto & Moderazione»: **non** rimuovere come duplicato Foto Live; eventuale **riorganizzazione UX** opzionale | §24.9 |
| **H** | Wikimedia: mantenere confine pipeline attuale | §24.10 |
| **I** | Verifica definitiva placeholder POI | **Completata in §24.1** — gate per backfill |
| **J** | Modifica script backfill (skip placeholder + origini corrette) | §24.1 |
| **K** | Dry-run backfill | — |
| **L** | Approvazione utente su log dry-run | — |
| **M** | Execute backfill | Solo post K–L e A–J |
| **N** | Verify post-backfill | `--verify` + UI |
| **O** | Decommission legacy (colonne, path read, UI duplicate) | DEC-P02 |
| **P** | Rimozione RPC/client transitori se caller=0 | DEC-P06 |
| **Q** | Rigenerazione `src/types/supabase.ts` | Post-SQL stabili |
| **R** | Test (`npm run check`, smoke, funzionali) | WF-QUAL-01 |
| **S** | Documentazione AI_CONTEXT / MASTER / WORKFLOW | Matrice protocollo |
| **T** | E2E finale | DEC-P05 |

**Inversione obbligatoria:** **M non prima di C + I + J**. **O non prima di N**.

---

### DECISIONI CONFERMATE

1. **~255 `pois.image_url` = placeholder Asset Globali (11 URL distinti, 100% path `admin_assets/`) — NON backfill, NON assignment** (§24.1).  
2. **Cutover read senza fallback** per Person / POI / Patron primary / galleria patrono con mask — confermato.  
3. **G21:** unico percorso moderazione foto = Segnalazioni → Personaggio famoso → Suggerimento foto; accettazione deve scrivere **solo** nuovo stack; **decommission** sidebar `famous_people` per moderazione.  
4. **Patrono frontend invisibile:** causa principale **galleria DB senza assignment** + filtro visibilità POST-MF5 (§24.2).  
5. **Delete person** con cleanup assignment senza delete asset condivisi — invariato (§24.5).  
6. **D90:** non estendere atomicità a «intera creazione città»; città separabile da Patrono/Personaggi/POI/immagini (§24.6).  
7. **Foto & Moderazione ≠ duplicato** di Segnalazioni → Community → Foto Live (§24.9).  
8. **Backfill obbligatorio ma subordinato** a placeholder filter + chiusura writer + approvazione (§24.11).

---

### PUNTI ANCORA DA CHIARIRE

1. **Ambiente Supabase multiplo** (staging/prod): non dimostrabile da repo — conferma operatore se esiste secondo DB.  
2. **Data esatta** delle 6 righe galleria patrono senza assignment (pre/post materialize): non rilevante per fix — serve **repair** indipendente dalla causa storica.  
3. **Eventuale POI con foto reale** in altri ambienti: regola discriminante = **non** placeholder registry + path non `admin_assets/` + preferibilmente già flusso `save_poi_with_image_assignment`.

---

### BACKFILL — CONDIZIONI DI ESECUZIONE

**NON eseguire** `scripts/backfill_media_assets_from_legacy.ts --execute` finché:

- lo script **esclude** i placeholder POI (§24.1 / modifica **J**);  
- i writer POI **non** reintroducono `image_url` placeholder (step **C**);  
- G21 e repair galleria patrono allineano write path al read POST-MF5 (**B**, **D**);  
- dry-run (**K**) revisionato e **approvazione esplicita** (**L**).

---

### VERDETTO §24

## **READY FOR FINAL IMPLEMENTATION**

La verifica read-only **elimina l’ambiguità critica sui POI (~255)** e **localizza** le rotture Patrono/G21 (write legacy o dati senza assignment vs read assignment-only). Restano **lavori di implementazione** (SQL, script, repair dati, decommission) — **non** ulteriori audit architetturali prima dell’ondata finale.

**NON READY** per: **execute backfill** (subordinato a condizioni sopra); **chiusura MF5 / E2E** (subordinato a implementazione + gate §24.13).

---

*Fine audit — §1–21 storico; §22 verifica operativa; §23 progettazione; §24 verifica consolidamento pre-intervento (2026-09-24).*

---

## §25 — IMPLEMENTAZIONE FASE 1 (post-verifica §24)

> **Data:** 2026-09-24  
> **Scope:** correzioni codice + migration SQL (repo) + repair dati galleria Patrono + backfill **dry-run only**.  
> **NON eseguito:** backfill `--execute`, decommission legacy, E2E finale, chiusura MF5.  
> **Migration SQL:** file creati in repo; **apply DB non eseguito** in questa sessione (`SUPABASE_DB_URL` / `DATABASE_URL` assenti in `.env` locale).

---

### 25.1 Riepilogo per stato

| Area | Stato | Note |
|------|--------|------|
| Delete person D90 | **IMPLEMENTATO** (repo) | Migration `20260924170000_delete_city_person_with_image_cleanup.sql` — **apply DB: DEFERRED** |
| G21 accettazione → assignment | **IMPLEMENTATO** (repo) | Migration `20260924171000_famous_person_photo_accept_assignment.sql` + publish gate su assignment |
| G21 sidebar legacy | **IMPLEMENTATO** | Voce rimossa; `/admin/famous_people` → `AdminReportsHub` tab Personaggio |
| Writer POI legacy | **IMPLEMENTATO** | `stagingService` (no placeholder in promote), `observatoryService` (no copy `image_url`) |
| Tab Media POI | **VERIFICATO** (codice) | `PoiMediaTab` → `saveSinglePoi` → RPC `save_poi_with_image_assignment` (`image_url` payload vuoto) |
| Gerarchia immagini D16 | **VERIFICATO** (codice) | Primary via assignment unico; cutover read senza fallback; writer automatici non assegnano placeholder |
| Patrono gallery repair | **IMPLEMENTATO + ESEGUITO** | Script `repair_patron_gallery_assignments.ts --execute`: **6/6** assignment gallery materializzati (service role) |
| Patrono save città | **IMPLEMENTATO** | `saveCityDetails`: PATCH città + assignment Patrono in try/catch separato |
| Backfill placeholder gate | **IMPLEMENTATO** | Registry ufficiale + skip `admin_assets`; dry-run: **255 POI skipped**, **0 created** per POI |
| Backfill dry-run | **ESEGUITO** | Totals: scanned 256, created 1 (patron primary candidato), skipped 255; verify segnala 1 patron legacy in `patron_details` senza assignment (atteso pre-execute) |
| Community Photo | **VERIFICATO** | Nessuna modifica; rollback su approve documentato in §24 |
| PhotoModeration | **INVARIATO** | Non rimossa |
| Reports label | **IMPLEMENTATO** | Abusi Foto Live / Abusi Foto Galleria |
| Wikimedia | **INVARIATO** | Nessun refactor |
| ON/OFF creazione città | **VERIFICATO** (parziale) | Vedi §25.6 |

---

### 25.2 Gerarchia immagini (Admin > verified > AI > placeholder)

| Entità | Evidenza | Esito |
|--------|----------|--------|
| POI | `saveSinglePoi` scrive solo assignment; `applyPrimaryImageCutoverForPois` azzera legacy; placeholder UI via `resolvePoiDisplayImageUrl` | **PRESERVATA** |
| Personaggio | `saveCityPerson` D90; read cutover; G21 accept → `upsert_entity_primary_image_assignment` | **PRESERVATA** (post-apply migration) |
| Patrono primary | `saveCityDetails` → assignment; read `resolvePatronPrimaryImageUrl` | **PRESERVATA** |
| Patrono gallery | Assignment obbligatorio per visibilità pubblica | **ALLINEATA** (repair 6 righe) |

Writer automatici staging/observatory **non** creano più primary assignment né propagano foto legacy.

---

### 25.3 Tab Media POI (Admin)

| Percorso | Writer | SoT |
|----------|--------|-----|
| Upload / URL / sostituzione | `AdminPoiModal` → `PoiMediaTab` → `saveSinglePoi` | `save_poi_with_image_assignment` → `media_assets` + `entity_image_assignments` |
| Colonna `pois.image_url` | Payload RPC **vuoto** (`poiWrite.ts`) | **Non** SoT |

**NON BLOCCANTE:** test manuale UI non eseguito in sessione; contratto codice confermato.

---

### 25.4 G21 e Patrono

- **G21:** RPC riscritta per assignment `community` da suggerimento; legacy `city_people.image_url` azzerata in accept; moderazione resta in Segnalazioni → Personaggio famoso → Suggerimento foto.
- **Patrono gallery:** repair dati eseguito; nuove approvazioni continuano a usare `materializePatronGalleryAssignment` (rollback su fallimento già presente).

---

### 25.5 Backfill dry-run (2026-09-24)

```
mode=DRY-RUN
placeholderRegistrySize=48
poi: scanned=255, created=0, skipped=255 (tutti skip:placeholder)
city_person: scanned=0
patron: scanned=1, would create=1 (origin=admin)
verify: 1 patron legacy patron_details senza assignment (pre-backfill execute)
```

**Conferma:** `tsx scripts/backfill_media_assets_from_legacy.ts --execute` **NON eseguito**.

---

### 25.6 Controlli ON/OFF creazione città (immagini / costo)

| Dominio | Controllo SoT | OFF rispettato? |
|---------|---------------|-----------------|
| POI deep scan / bonifica costosa | `CompleteCityModal` → `runPoiDeepScan` (default **false**) | **Sì** — `useAiCompleteCity` esegue `verifyDraftsBatch` solo se `runPoiDeepScan` |
| Hero città | Nessun generatore automatico | **Sì** — step Media avvisa e non inventa Hero |
| Personaggi — quantità | `peopleCount` (5/10/15) | **Parziale** — non esiste toggle «zero personaggi»; recovery portrait usa `skipImageAiRecovery` su quota AI |
| Personaggi — portrait AI | `ensureFamousPersonCompletenessWithAi` + `skipImageAiRecovery` | **Sì** su quota esaurita |
| Patrono — immagine in Complete City | Solo testo `generateCitySection(..., 'patron')` | **Nessun toggle dedicato** — non viene generata immagine Patrono automatica in questo flusso |
| POI promote staging | Non genera immagine reale | **Sì** — post-fix niente placeholder in colonna |

**NON BLOCCANTE:** toggle UI dedicati «genera immagini sì/no» per Patrono/Personaggi **non** trovati come switch unificati; comportamento costoso POI già gated da `runPoiDeepScan`.

---

### 25.7 Test eseguiti

| Test | Risultato |
|------|-----------|
| `npm run mf5:smoke` | **PASS** |
| `npm run mf5:backfill:dry-run` | **Eseguito** — exit 1 per verify pre-execute (patron legacy atteso) |
| `npm run typecheck` | **FAIL** — errori preesistenti (`inert`, `RefObject`) non legati a questa attività |
| Biome file toccati | **PASS** (dopo format su `cityPatronGalleryService.ts`) |
| Repair patron gallery `--execute` | **PASS** (6 repaired) |

---

### 25.8 DEFERRED / HOLD

| Voce | Stato |
|------|--------|
| Apply migration SQL su DB remoto | **DEFERRED** — richiede `SUPABASE_DB_URL` o Dashboard |
| Backfill `--execute` | **DEFERRED** — gate §24 / approvazione utente |
| Decommission colonne/path legacy | **DEFERRED** |
| E2E finale / chiusura MF5 | **DEFERRED** |
| SQL promote_staging: forzare `image_url` NULL server-side | **DEFERRED** (opzionale; client già non invia placeholder) |
| Mega-RPC / service_role su `upsert_entity_image_assignment_dual_write` | **HOLD** — repair script usa ensure+insert |

---

### 25.9 Problemi residui

| ID | Gravità | Descrizione |
|----|---------|-------------|
| R1 | **BLOCCANTE** (per delete/G21 in prod) | Migration non applicate finché non si esegue apply SQL |
| R2 | **NON BLOCCANTE** | Backfill verify fallisce finché patron primary legacy non migrato (1 città in dry-run) |
| R3 | **NON BLOCCANTE** | `set_famous_person_editorial_status` aggiornato in migration — richiede apply |
| R4 | **NON BLOCCANTE** | typecheck globale rosso (legacy UI) |

---

### 25.10 Verdetto fase

**IMPLEMENTAZIONE FASE 1 COMPLETATA** nel perimetro richiesto (max dry-run backfill).  
**MF5 NON CHIUSA.**  
**Backfill `--execute` NON ESEGUITO.**

---

*Fine audit — §25 implementazione fase 1 (2026-09-24).*

