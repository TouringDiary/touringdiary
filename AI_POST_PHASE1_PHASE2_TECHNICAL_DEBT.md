# Technical debt post FASE 1 — da rianalizzare a valle della FASE 2

Documento verificato sul codice corrente (Biome CLI sui path indicati).  
**Ogni voce sotto: DA RIANALIZZARE E RISOLVERE A VALLE DELLA FASE 2** (niente suppressions solo per pulire la print).

---

## Riepilogo print Biome (12 voci richieste)

| Stato | Conteggio |
|-------|-----------|
| **Ancora confermati** | **12 / 12** |
| **Già risolti** | **0** |
| **Registrati in questo documento** | **12** |

---

## Verifica macrofase Image Management (2026-09-28)

- **CityAuditModal / RegionalAnalysisModal (Biome):** unico diff funzionale recente nei modal = rimozione chiamate duplicate a `schedulePoiRealImageDiscovery` (orchestratore spostato su `saveSinglePoi`). **Non** toccati `useEffect`/`key`/handler click. Classificazione: **PRECEDENTE**, non conseguenza indiretta della FASE 1 media.
- **cityHeroReadService (TypeScript):** errore da bridge MF2 (`ReturnType<typeof supabase.from>` → tipo errato `obs_city_quality_metrics`) introdotto con query `entity_image_assignments` FASE 1. **Risolto nel perimetro attuale** (tabella in `supabase.ts` + boundary origin D-22 condiviso).

### Correzione TypeScript FASE 1 — colonne Wikimedia (2026-09-28, analisi 17 file)

| Campo | Valore |
|-------|--------|
| **ID** | D-TYP-WIKI-01 |
| **File coinvolti** | `cityHeroReadService.ts`, `cityReadService.ts`, `cityRealImageDiscoveryService.ts`, `cityWikimediaSettingsService.ts`, `poiMapper.ts`, `poiImageReadService.ts`, `poiRealImageDiscoveryService.ts`, `poiWikimediaSettingsService.ts` |
| **Problema** | 20 errori TS: `SelectQueryError` / update su colonne `wikimedia_hero_public_enabled` (cities) e `wikimedia_public_enabled` (pois) «inesistenti» nel tipo generato. |
| **Causa** | Codice FASE 1 allineato a migration `20260928100000_image_management_phase1_foundation.sql`, ma `src/types/supabase.ts` rigenerato da remote **senza** quelle colonne applicate sul DB linkato. |
| **Azione** | **Risolto ora** — allineamento manuale di `supabase.ts` al contratto migration (Row/Insert/Update), senza cast nei servizi. |
| **Follow-up** | Dopo apply migration su remote: `supabase gen types typescript --linked` per conferma; fino ad allora i tipi restano allineati al file migration in repo. |
| **Rischio se lasciato** | Gate Wikimedia/D-22/City Hero non compilano; rischio workaround MF2 o select senza typing. |

---

## `src/components/admin/cities/CityAuditModal.tsx`

### 1. `useExhaustiveDependencies` — area riga ~57–63

- **Classificazione macrofase:** **PRECEDENTE** (pattern hook pre-esistente; nessuna modifica FASE 1 su deps/`startAudit`).

- **Regola Biome:** `lint/correctness/useExhaustiveDependencies`
- **Problema:** `useEffect` dipende solo da `[isOpen]` ma invoca `startAudit()` non elencato nelle dipendenze.
- **Contesto:** rischio stale closure / doppio avvio audit se la callback cambia identità.
- **Perché non in FASE 1:** refactor hook/a11y/modal fuori scope Image Management; fix richiede pattern stabile (useCallback + deps o ref di sessione).
- **Verifica a valle FASE 2:** comportamento audit su riapertura modal, race già segnalate nel prompt correttivo.
- **DA RIANALIZZARE E RISOLVERE A VALLE DELLA FASE 2**

### 2. `noArrayIndexKey` — riga ~248 (origine map ~229)

- **Classificazione macrofase:** **PRECEDENTE** (`AuditPoiResult` senza id; `key={idx}` già presente prima della FASE 1).
- **Regola Biome:** `lint/suspicious/noArrayIndexKey`
- **Problema:** `key={idx}` sulla griglia risultati audit.
- **Contesto:** assente id stabile nel tipo risultato; serve chiave derivata da fingerprint/nome+coords o id audit.
- **Perché non in FASE 1:** non blocca FASE 1 media; richiede modello dati audit.
- **Verifica a valle FASE 2:** reorder selezione, stato checkbox, performance liste lunghe.
- **DA RIANALIZZARE E RISOLVERE A VALLE DELLA FASE 2**

---

## `src/components/admin/cities/RegionalAnalysisModal.tsx`

**Classificazione macrofase (tutte e 5 le voci Biome sotto):** **PRECEDENTE** — struttura UI Regional/Micro pre-esistente; diff FASE 1 limitato a rimozione discovery duplicata, non a layout/a11y/key.

### 3. `noArrayIndexKey` — riga ~760 (origine ~758)

- **Regola:** `lint/suspicious/noArrayIndexKey`
- **Problema:** `analysisResult.map((zone, idx) => key={idx})`.
- **Contesto:** zone senza id stabile in UI.
- **Perché non in FASE 1:** debt UX/regional flow pregresso.
- **Verifica a valle FASE 2:** chiave da `zone.name` o id regione se disponibile nel tipo.
- **DA RIANALIZZARE E RISOLVERE A VALLE DELLA FASE 2**

### 4–5. `noStaticElementInteractions` + `useKeyWithClickEvents` — riga ~793–797

- **Regole:** `lint/a11y/noStaticElementInteractions`, `lint/a11y/useKeyWithClickEvents`
- **Problema:** card città con `onClick` su `<div>` senza ruolo/tastiera.
- **Contesto:** selezione città non accessibile da keyboard.
- **Perché non in FASE 1:** richiede pattern a11y condiviso (button/checkbox label) senso refactor modal.
- **Verifica a valle FASE 2:** focus, aria per selezione, mobile touch target.
- **DA RIANALIZZARE E RISOLVERE A VALLE DELLA FASE 2**

### 6. `noArrayIndexKey` — riga ~794 (origine ~781)

- **Regola:** `lint/suspicious/noArrayIndexKey`
- **Problema:** `key={cIdx}` per città in zona.
- **Contesto:** preferire `city.name` + eventuale disambiguazione id DB.
- **Perché non in FASE 1:** idem sopra.
- **Verifica a valle FASE 2:** città omonime, import multiplo.
- **DA RIANALIZZARE E RISOLVERE A VALLE DELLA FASE 2**

### 7–8. `noArrayIndexKey` — righe ~888 e ~944 (origine map log ~887 / ~942)

- **Regola:** `lint/suspicious/noArrayIndexKey`
- **Problema:** chiavi log import `key={\`${idx}-...\`}` ancora basate su indice.
- **Contesto:** log append-only; chiave stabile = hash contenuto riga + timestamp se disponibile.
- **Perché non in FASE 1:** cosmetico/diagnostics.
- **Verifica a valle FASE 2:** scroll log live region, duplicati testo.
- **DA RIANALIZZARE E RISOLVERE A VALLE DELLA FASE 2**

### Nota aggiuntiva (stesso file, non nelle 12 voci)

- **format:** Biome segnala diff formattazione import/onChange — **DA RIANALIZZARE E RISOLVERE A VALLE DELLA FASE 2** (`npm run lint` / format).

---

## `src/hooks/admin/usePoiActions.ts`

### 9–11. `noUnusedVariables` — righe ~80, ~106, ~131

- **Regola:** `lint/correctness/noUnusedVariables`
- **Problema:** `catch (e)` / `catch (e: unknown)` senza uso del binding in `bulkDelete`, `bulkStatusChange`, `bulkResetImages`.
- **Contesto:** feedback errore ancora via `alert()` generico; il messaggio reale non è propagato.
- **Perché non in FASE 1:** fix completo legato a sostituzione alert → toast (prompt correttivo più ampio).
- **Verifica a valle FASE 2:** usare `e` nel notification system, bulk parziali, concorrenza limitata.
- **DA RIANALIZZARE E RISOLVERE A VALLE DELLA FASE 2**

---

## `src/services/city/poi/poiMapper.ts`

### 12. `noUnusedFunctionParameters` — riga ~50 (stato 2026-09-28)

- **Regola:** `lint/correctness/noUnusedFunctionParameters`
- **Problema (storico):** parametro `cat` in `inferResourceType(cat, sub)` non usato.
- **Stato attuale:** su HEAD corrente `inferResourceType` espone solo `sub`; **Biome non segnala più** questa voce su `poiMapper.ts`. Resta **D-PM-01** sotto per decisione su uso categoria in `resourceType`.
- **DA RIANALIZZARE E RISOLVERE A VALLE DELLA FASE 2** (solo se si reintroduce `cat` nel helper)

---

## Impegno

Tutte le **12 voci confermate** della print e le note collegate sopra saranno **RIANALIZZATE TECNICAMENTE E RISOLTE DEFINITIVAMENTE A VALLE DELLA FASE 2**, includendo effetti su TypeScript, accessibilità/ARIA, stabilità key React, dipendenze hook ed eventuali refactor architetturali dove richiesti dai prompt correttivi (modal, staging, discovery UI, ecc.).

---

## Lavoro correttivo FASE 1 ancora aperto (non Biome — scope prompt utente)

Questi file del mega-prompt richiedono ancora revisione dedicata oltre al batch già applicato (governance, migration, pipeline, resolver parziali, orchestratore `on_create` centralizzato, poiForm, smoke):

- `AdminPoiModal.tsx`, `PoiMediaTab.tsx` — `TabMedia.tsx` galleria MF4 admin rivista (2026-09-28); resta read pubblico legacy
- `useAiValidation.ts`, `stagingService.ts`, `poiMapper.ts` (cast/governance)
- `poiImageReadService.ts`, `poiRealImageDiscoveryService.ts`, `cityRealImageDiscoveryService.ts`
- `cityWikimediaSettingsService.ts`, `poiWikimediaSettingsService.ts`
- `entityImageAssignmentsQuery.ts` — bridge MF2 fino a rigenerazione `src/types/supabase.ts` con tabella `entity_image_assignments` + `city`
- Verifica DB live RPC `upsert_entity_image_assignment_dual_write` (firma, SECURITY DEFINER, GRANT) post-migration

**DA RIANALIZZARE E RISOLVERE A VALLE DELLA FASE 2** per voci Biome; **priorità FASE 1** per voci funzionali elencate sopra se ancora pendenti al merge.

---

## stagingService.ts

**TECHNICAL DEBT PREESISTENTE** — **NON blocca** l’integrazione Image Management Phase 1 (salvo regressioni dimostrate). **Da affrontare a valle delle Fasi 1 e 2.**  
**Verifica integrazione Phase 1 (2026-09-28):** in `promoteToLive()`, `schedulePoiRealImageDiscovery(..., 'mass_import')` è chiamato **solo dopo** successo di `promote_staging_poi_to_live`; in caso di `rpcError` si fa `throw` **prima** della discovery → **sequenza corretta, nessuna modifica richiesta.**

### STG-01 — `orphanCityStaging` (OBSOLETO — modello NOT NULL)

| Campo | Valore |
|-------|--------|
| **Stato** | **Superato** — `orphanCityStaging` imposta solo `orphan_city_tag`; `city_id` resta NOT NULL. Non più step B con `city_id = null`. |
| **Debt residuo correlato** | STG-02 (reclaim per nome / omonimie), atomicità tag+reassign se servirà RPC. |

### STG-02 — `reclaimStagingByCityName`

| Campo | Valore |
|-------|--------|
| **Problema** | Match `city_id IS NULL` + `orphan_city_tag ILIKE cityName`. |
| **Perché** | Il nome città non è identificatore stabile (omonimie, normalizzazione). |
| **Rischio** | Orfani di città omonime riassegnati alla città sbagliata. |
| **Soluzione futura** | Chiave stabile: `city_id` storico, slug canonico, o UUID scritto al momento dell’orphan. |
| **Priorità** | Alta (integrità dati) |
| **Tipo** | **Decisione architetturale** + correzione tecnica |
| **Decisione da prendere** | Quale identificatore usare per reclaim post-delete. |

### STG-03 — `deduplicateStagingData` O(N²)

| Campo | Valore |
|-------|--------|
| **Problema** | Confronto pairwise client-side. |
| **Rischio** | Timeout/memoria su migliaia di righe; UI bloccata. |
| **Soluzione futura** | Deduplica SQL (window/group) o indice spaziale/nome normalizzato. |
| **Priorità** | Media |
| **Tipo** | Problema tecnico |

### STG-04 — Tie-break `getDataScore`

| Campo | Valore |
|-------|--------|
| **Problema** | A pari score, vincitore dipende dall’ordine array/DB. |
| **Soluzione futura** | Tie-break stabile: `osm_id`, `updated_at`, `id` UUID. |
| **Priorità** | Media |
| **Tipo** | Problema tecnico |

### STG-05 — `getStagingPois` paginazione

| Campo | Valore |
|-------|--------|
| **Problema** | `page`/`pageSize` default 1/50 ma non validati (`page=0`, negativi, `pageSize` enorme). |
| **Rischio** | `range()` negativo o richieste oversized; errori PostgREST opachi. |
| **Soluzione futura** | Clamp/validate come altri servizi lista del progetto. |
| **Priorità** | Bassa |
| **Tipo** | Cleanup tecnico |

### STG-06 — `getStagingItemsByIds` concorrenza

| Campo | Valore |
|-------|--------|
| **Problema** | `Promise.all` su tutti i chunk (50 id/chunk) senza limite. |
| **Rischio** | Centinaia di query parallele con dataset grandi. |
| **Soluzione futura** | Pool concorrente bounded (es. max 5 chunk). |
| **Priorità** | Media |
| **Tipo** | Problema tecnico |

### STG-07 — `updateStagingAiRatings` concorrenza / partial failure

| Campo | Valore |
|-------|--------|
| **Problema** | `Promise.all(updates)` un update per riga; fallimento a metà lascia batch parzialmente aggiornato. |
| **Rischio** | Stato staging incoerente senza report all’admin. |
| **Soluzione futura** | Batch RPC o limite concorrenza + riepilogo success/fail. |
| **Priorità** | Media |
| **Tipo** | Problema tecnico |

### STG-08 — Fallback dati sintetici in `promoteToLive`

| Campo | Valore |
|-------|--------|
| **Problema reale** | `category \|\| 'discovery'`, `description \|\| Luogo di interesse…`, `visitDuration \|\| '1h'`, `priceLevel \|\| 1`, `ai_rating \|\| 'medium'` possono **inventare** metadati se enrichment AI è scarso. |
| **Perché non Phase 1** | Comportamento storico import staging; fuori scope Image Management. |
| **Soluzione futura** | Promuovere solo con metadati minimi verificati o lasciare draft incompleto esplicito. |
| **Priorità** | Media |
| **Tipo** | **Decisione di prodotto/dati** + correzione tecnica |

### STG-09 — Type safety

| Campo | Valore |
|-------|--------|
| **Problema** | Cast `(e as SaveCityEventInput)` in promote path; tipi staging manuali. |
| **Tipo** | Cleanup / allineamento tipi DB |
| **Priorità** | Bassa |

---

## AdminPoiModal.tsx — debt residuo (post-revisione a11y)

### ADM-POI-01 — `isMissingAsset` / D-22

| Campo | Valore |
|-------|--------|
| **Problema** | `usePoiForm.isMissingAsset` usa solo `imageUrl` + placeholder categoria, non la cascata D-22 (assignments). |
| **Tipo** | **Decisione architetturale** — quando il gate “Pubblico” admin deve usare il resolver canonico. |
| **Phase 2** | Valutare read D-22 async o flag da servizio senza duplicare gerarchia nel modal. |

### ADM-POI-02 — `alert()` su errore delete

| Campo | Valore |
|-------|--------|
| **Problema** | UX legacy; preesistente. |
| **Tipo** | Cleanup UI |
| **Nota** | `deleteSinglePoi` → RPC `delete_poi_with_image_cleanup` (hard delete con cleanup immagini): messaggio “irreversibile” **coerente** con il contratto attuale. |

---

## Diagnostiche post-Phase 1 (2026-09-28) — analisi git diff / HEAD

Verifica: `git diff HEAD` sui file segnalati; confronto `git show HEAD:…` per catch block e helper MF2.

### TabMedia.tsx — TS `reason` su union

| Campo | Valore |
|-------|--------|
| **Esito analisi** | **Introdotto Fase 1** (consumer `CityDiscoveryResult`, non `PoiDiscoveryResult`). |
| **Azione** | **Risolto ora** — narrowing esplicito per `skipped` / `lookup` / `failed` / `imported`. |

---

### `src/components/admin/import/ImportOsmModal.tsx`

**Classificazione macrofase (4 voci Biome):** **PRECEDENTE** — `git diff HEAD` modifica solo messaggio `inserted` → `processed` (righe ~89–90); hook, `addLog`, key log, label categorie invariati rispetto a `HEAD`.

#### D-IOM-01 — `useExhaustiveDependencies` (~41–45)

| Campo | Valore |
|-------|--------|
| **Regola** | `lint/correctness/useExhaustiveDependencies` |
| **Problema** | Biome considera `logs` superfluo perché il corpo dell’effect legge solo `logsEndRef`; l’intent è però rieseguire lo scroll a ogni append. |
| **Correzione prevista** | Dipendenza `logs.length` (equivalente funzionale) o refactor dedicato auto-scroll; **non** rimuovere `logs` senza sostituto (rompe auto-scroll). |
| **Decisione** | Nessuna — pattern hook standard |
| **Phase 2** | Fix mirato senza cambiare UX log console |

#### D-IOM-02 — `noArrayIndexKey` (~133–135)

| Campo | Valore |
|-------|--------|
| **Regola** | `lint/suspicious/noArrayIndexKey` |
| **Problema** | `key={i}` su righe log append-only. |
| **Correzione prevista** | Key stabile derivata dalla riga (es. contenuto `[timestamp] msg` già univoco) o id monotono al push. |
| **Decisione** | Nessuna |
| **Phase 2** | Applicare quando si tocca la vista log |

#### D-IOM-03 — `noLabelWithoutControl` (~225–227)

| Campo | Valore |
|-------|--------|
| **Regola** | `lint/a11y/noLabelWithoutControl` |
| **Problema** | Titolo sezione «Categorie da scaricare» su `<label>` senza `htmlFor`; i controlli sono `<button>` multipli, non un singolo input. |
| **Correzione prevista** | `<span>`/heading semantico (`<p>` con id) + `aria-labelledby` sul gruppo, oppure `<fieldset>`/`<legend>`. |
| **Decisione** | Nessuna — scelta markup gruppo checkbox-like |
| **Phase 2** | Allineare al pattern a11y admin condiviso |

#### D-IOM-04 — `noUnusedFunctionParameters` (~49, parametro `type`)

| Campo | Valore |
|-------|--------|
| **Regola** | `lint/correctness/noUnusedFunctionParameters` |
| **Problema** | `addLog(msg, type?)` accetta `info`/`success`/`error` ma non colora/stila in base a `type` (solo stringhe nel testo). |
| **Correzione prevista** | Usare `type` per classi CSS (come il branch `includes('ERRORE')`) **oppure** rimuovere parametro e aggiornare call site. |
| **Decisione** | Nessuna — API incompleta, non rimozione contratto |
| **Phase 2** | Completare styling per tipo o semplificare firma |

---

### `src/hooks/admin/useAiMagicCity.ts`

#### D-MC-01 — `cityCenterCoords` unused

| Campo | Valore |
|-------|--------|
| **Stato (2026-09-28)** | **Risolto / obsoleto** — variabile e assegnazioni rimosse con rimozione fallback GEO_CONFIG / centro sintetico. |

#### D-MC-02 — `err` unused (~184)

| Campo | Valore |
|-------|--------|
| **Stato (2026-09-28)** | **Risolto ora** — `catch (_err: unknown)` (messaggio utente già in `addLog`; binding intenzionalmente ignorato). |
| **Classificazione** | Preesistente (pattern catch senza uso); fix minimo in scope revisione. |

#### D-MC-03 — optional chain (~331, ~448)

| Campo | Valore |
|-------|--------|
| **Stato (2026-09-28)** | **Risolto ora** — `if (p?.name)` / `if (e?.name)` (Biome `useOptionalChain`). |
| **Classificazione** | Preesistente, stile equivalente; nessun cambio semantico. |

#### D-MC-04 — TS2322 `isValidGeoPair` / coordinate città

| Campo | Valore |
|-------|--------|
| **Stato (2026-09-28)** | **Risolto ora** — `parseFiniteGeoCoords` → `{ lat, lng } \| undefined` + `resolveOptionalCityCoords`; nessun `as`/`!`, nessun 0,0. |

#### D-MC-05 — scrittura `details.gallery` JSON in Magic Add update

| Campo | Valore |
|-------|--------|
| **File/area** | `useAiMagicCity.ts` → `saveCityDetails` payload |
| **Problema** | In update mode il payload include ancora `gallery: existingCityData?.details?.gallery ?? []` per non azzerare il JSON legacy al save editoriale. |
| **Perché preesistente / compatibilità** | SoT **write** galleria fotografica = MF4 (`entity_image_assignments`, ruolo `gallery`, TabMedia). SoT **read pubblico** ancora su JSON (`getCityPhotographicGalleryAssets` / `cityReadService`). |
| **Perché non risolto ora** | Rimuovere la chiave dal payload senza migrazione read pubblico MF4 rischia di cancellare il JSON legacy al prossimo Magic Add. |
| **Decisione necessaria** | Quando il read pubblico userà MF4: stop write JSON + eventuale backfill/deprecazione colonna `details.gallery`. |
| **Impatto** | Admin MF4 e JSON legacy possono divergere finché il read pubblico non è allineato. |
| **Priorità** | Media (dopo read path MF4 città) |
| **Condizione chiusura** | Read path pubblico galleria città su assignments + policy esplicita sul JSON legacy (D-TM-MF4-01). |

#### D-MC-06 — sort imports (~1)

| Campo | Valore |
|-------|--------|
| **Tipo** | Cleanup Biome |
| **Perché non ora** | Nessun impatto funzionale |
| **Phase 2** | `biome check --write` sul file se la print persiste |

---

### `src/hooks/admin/usePoiActions.ts`

#### D-PA-01 / D-PA-02 / D-PA-03 — `e` unused in catch (bulkDelete ~80, bulkStatusChange ~106, bulkResetImages ~131)

| Campo | Valore |
|-------|--------|
| **Tipo** | Cleanup tecnico (+ miglioramento osservabilità opzionale) |
| **Verifica git** | Identici in `git show HEAD:src/hooks/admin/usePoiActions.ts` (alert generico senza uso di `e`) |
| **Perché non ora** | Preesistenti; Fase 1 ha solo aggiunto `schedulePoiRealImageDiscovery` in bonifica |
| **Phase 2** | `console.error`/`report` con messaggio reale o partial-failure bulk (già richiesto da prompt correttivo) |
| **Decisione** | **Da valutare in Phase 2** se i bulk devono esporre errori parziali in UI (non solo alert generico) |

---

### `src/services/city/poi/poiMapper.ts`

#### D-PM-01 — parametro `cat` unused in `inferResourceType` (~50)

| Campo | Valore |
|-------|--------|
| **Tipo** | Cleanup tecnico (API helper incompleta) |
| **Verifica git** | Diff Fase 1 aggiunge solo `wikimediaPublicEnabled`; `inferResourceType` invariato |
| **Perché non ora** | Preesistente; rimozione `cat` richiede verifica call site e se la categoria doveva influire sul tipo risorsa |
| **Phase 2** | Usare `cat` nella logica, rinominare `_cat`, o rimuovere parametro + aggiornare call site |
| **Decisione** | **Da chiarire** se `resourceType` deve dipendere dalla categoria POI o solo da sub_category |

---

### `src/services/photoService.ts`

#### D-PH-01 — `Mf2AssignmentConditionalUpdateBuilder` unused (~936)

| Campo | Valore |
|-------|--------|
| **Tipo** | Cleanup (workaround MF2 obsoleto) |
| **Verifica git** | Reso orphan da Fase 1: rimosso cast su `entityImageAssignmentsQuery().update()` |
| **Azione** | **Risolto ora** — type alias eliminato |

#### D-PH-02 — sort imports (~14)

| Campo | Valore |
|-------|--------|
| **Tipo** | Cleanup |
| **Verifica git** | Introdotto riordino necessario dopo aggiunta `entityImageAssignmentsQuery` in Fase 1 |
| **Azione** | **Risolto ora** — organize imports Biome |

#### D-PH-03 — lifecycle `approved` → `pending` / `rejected` senza revoca assignment

| Campo | Valore |
|-------|--------|
| **Stato (2026-09-28)** | **Risolto ora** — `updatePhotoStatusInDb`: dopo update submission a non-`approved`, revoca assignment MF4; rollback status se revoca fallisce. `revokePhotoSubmissionAssignment` imposta anche `is_current: false`. |

#### D-PH-04 — `propagatePhotoRemoval` no-op vs caller

| Campo | Valore |
|-------|--------|
| **File/area** | `photoService.propagatePhotoRemoval`, `usePhotoModeration.confirmDelete` |
| **Problema** | Funzione legacy a no-op (MF4: revoca in `deletePhotoSubmissionInDb` / status update); `confirmDelete` la invoca ancora prima del delete canonico. |
| **Perché preesistente** | Bridge pre-MF4 (Hero/Card/gallery JSON). |
| **Perché non risolto ora** | Rimozione call site richiede verifica regressioni su tutti i consumer; comportamento attuale corretto (idempotente). |
| **Decisione necessaria** | Deprecare ed eliminare API + call site in batch moderazione. |
| **Impatto** | Rumore / doppia lettura contratto per chi modifica moderazione. |
| **Priorità** | Bassa |
| **Condizione chiusura** | Nessun caller; documentazione moderazione aggiornata. |

#### D-PH-05 — atomicità `photo_submissions` ↔ `entity_image_assignments`

| Campo | Valore |
|-------|--------|
| **File/area** | `uploadCommunityPhoto`, `updatePhotoData`, `updatePhotoStatusInDb` |
| **Problema** | Compensazioni client-side (delete submission, revoke assignment, rollback status) non garantiscono atomicità cross-tabella come una RPC unica. |
| **Finestre note (2026-09-28)** | **Approve:** materialize → update submission; se update fallisce si tenta revoca compensatoria — se anche quella fallisce, `PhotoSubmissionAssignmentInconsistentError`. **Unpublish:** update → revoca; doppio fallimento revoca+rollback → stesso errore esplicito. **updatePhotoData / upload:** materialize solo se `status === 'approved'` (allineato RPC `photo_submission non approvata`); pending/rejected non creano assignment active; doppia guardia read con filtro `status` su `listPhotographs`. **Atomicità:** nessuna RPC moderazione foto in repo; v. D-PH-05 condizione chiusura. |
| **Perché preesistente** | Pattern MF4 introdotto in Fase 1 senza RPC transazionale dedicata. |
| **Perché non risolto ora** | Richiede contratto architetturale (RPC SECURITY DEFINER o job di riparazione) oltre scope correttivo attuale. |
| **Decisione necessaria** | RPC unificata moderazione foto vs compensazioni documentate + monitoraggio incoerenze. |
| **Impatto** | Edge case su failure di rete mid-flow (assignment orfano o submission incoerente). |
| **Priorità** | Media |
| **Condizione chiusura** | RPC approvata in migration + sostituzione path client. |

---

### D90 — `save_poi_with_image_assignment` (coordinate su UPDATE)

#### D-D90-01 — payload senza coords vs preserve esistenti

| Campo | Valore |
|-------|--------|
| **File/area** | `20260928210000_save_poi_skip_primary_image_update.sql`, checklist `supabase/tests/save_poi_d90_contract_tests.sql` |
| **Problema** | Se `coords_lat`/`coords_lng` sono assenti nel JSON, la migration scrive NULL su UPDATE (non «omit = preserve»). |
| **Perché non risolto ora** | Nessuna decisione architetturale D90 documentata nel repo che imponga preserve; cambiare la RPC è fuori scope revisione checklist. |
| **Decisione necessaria** | Contratto editoriale POI: omit preserve vs NULL esplicito cancella vs obbligo di inviare coords su ogni save. |
| **Impatto** | Magic Add / save editoriale con skip=true possono azzerare coordinate POI esistenti se il payload non le include. |
| **Priorità** | Media |
| **Condizione chiusura** | Decisione + eventuale migration (COALESCE su UPDATE da riga esistente) o fix client che re-invia sempre coords. |

---

### `src/components/admin/cityEditor/tabs/TabMedia.tsx` — galleria MF4 (2026-09-28)

#### D-TM-MF4-01 — read pubblico galleria città ancora JSON legacy

| Campo | Valore |
|-------|--------|
| **File/area** | `cityReadService` / `getCityPhotographicGalleryAssets`; UI pubblica città |
| **Problema** | Admin TabMedia scrive MF4 (`cityPhotographicGalleryService`); la lettura pubblica usa ancora `city.details.gallery` JSON. |
| **Perché preesistente** | Fase 1 ha spostato write admin; read pubblico non era in scope. |
| **Perché non risolto ora** | Richiede resolver D-22/MF4 lato read + eventuale dual-read/backfill. |
| **Decisione necessaria** | Ordine migrazione: backfill assignments da JSON vs cutover read; deprecazione JSON. |
| **Impatto** | Utenti pubblici non vedono immagini aggiunte solo via MF4 admin fino al cutover. |
| **Priorità** | Alta (coerenza prodotto post-Fase 1 admin) |
| **Condizione chiusura** | Read path pubblico su `entity_image_assignments` (role `gallery`) + aggiornamento D-MC-05. |

#### D-TM-MF4-02 — `prompt()` per URL galleria manuale

| Campo | Valore |
|-------|--------|
| **Problema** | Inserimento URL galleria via `window.prompt`, fuori design system admin (modal/toast/validazione UX). |
| **Perché preesistente** | Pattern legacy pre-MF4. |
| **Perché non risolto ora** | Refactor UX non richiesto in questa revisione (solo contratto MF4 assignmentId). |
| **Decisione necessaria** | Componente admin condiviso (URL + preview + validazione boundary). |
| **Impatto** | UX mobile/a11y subottimale; validazione URL resta al service boundary. |
| **Priorità** | Bassa |
| **Condizione chiusura** | Sostituzione UI in sprint admin UX. |

#### D-TM-MF4-03 — delete/replace galleria per `assignmentId`

| Campo | Valore |
|-------|--------|
| **Stato (2026-09-28)** | **Risolto ora** — UI e service usano `assignmentId` canonico; helper per URL mantenuti solo come compatibilità lookup. |

---

### `src/services/wikimedia/commonsDownloadPipeline.ts`

#### D-CDP-01 — optional chain (~180)

| Campo | Valore |
|-------|--------|
| **Tipo** | Cleanup (equivalente semantico) |
| **Verifica git** | Riga introdotta da Fase 1 (loop redirect `manual`) |
| **Azione** | **Risolto ora** — `!response?.ok` al posto di `!response \|\| !response.ok` |

---

### Import sort — servizi media (Fase 1 ha sostituito MF2 → `entityImageAssignmentsQuery`)

#### D-IMP-01 — `entityPrimaryImageReadService.ts` riga 1

#### D-IMP-02 — `imageAssignmentVisibilityService.ts` riga 1

#### D-IMP-03 — `cityPatronGalleryService.ts` riga 1

#### D-IMP-04 — `contentReportService.ts` riga 1

| Campo | Valore |
|-------|--------|
| **Tipo** | Cleanup (Biome `organizeImports`) |
| **Verifica git** | Diff Fase 1 modifica solo la riga import MF2→query; warning sort spesso preesistente o riattivato dal cambio path |
| **Perché non ora** | Nessun impatto funzionale; evitare churn multi-file solo per Biome |
| **Phase 2** | Batch `biome check --write` su cartella `services/media` e `reports` |
| **Decisione** | Nessuna |

---

## `src/services/patron/cityPatronGalleryService.ts`

### D-PATRON-GAL-01 — `reorderCityPatronGallery()` non atomico

| Campo | Valore |
|-------|--------|
| **File / funzione** | `cityPatronGalleryService.ts` → `reorderCityPatronGallery()` |
| **Problema** | Reorder esegue N `UPDATE` client-side su `city_patron_gallery.sort_order` senza transazione unica. |
| **Conseguenza** | Fallimento a metà batch può lasciare ordini parzialmente aggiornati fino a retry manuale Admin. |
| **Mitigazione attuale (Fase 1)** | Validazione cityId/ID duplicati/appartenenza città; ogni UPDATE verifica riga modificata via `.select('id')`. |
| **Soluzione futura** | RPC batch transazionale Patron Gallery (allineata a insert/replace/delete già atomiche). |
| **Perché fuori scope ora** | Nessuna RPC batch Patron Gallery approvata in architettura MF4/MF5 corrente. |
| **Classificazione** | Quality Delta documentato — **DA RIANALIZZARE A VALLE DELLA FASE 2** |
