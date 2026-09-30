# Image Management — Analisi di esecuzione (consolidamento)

**Source of Truth documentale (BIBBIA operativa pre-sviluppo):** questo file + `AI_IMAGE_MANAGEMENT_CONSOLIDATION_DEEP_ANALYSIS_2026-09-27_v5.md` + `AI_IMAGE_MANAGEMENT_MASTER_PLAN.md` (Appendice G–I). Audit §32–§37.

**Data ultimo aggiornamento:** 2026-09-27 (§37 — specifiche tecniche definitive)  
**Tipo:** analisi, ricostruzione flussi, pianificazione — **nessuna implementazione**  
**Vincoli rispettati:** nessuna modifica a codice, DB, migration, backfill o cancellazione dati.

---

## REGOLA FONDAMENTALE — MODIFICHE CHE POSSONO ROMPERE QUALCOSA

Se una **decisione di prodotto** richiede una modifica che può: rompere un flusso esistente; cambiare comportamento di un’altra area; rendere incompatibile tabella/RPC/UI; perdere dati o storico; rompere RLS/FK; creare regressioni su un altro dominio immagine; o creare conflitto tra vecchio e nuovo sistema — **non si implementa** finché il proprietario non conferma.

In documentazione obbligatorio: (1) cosa si romperebbe; (2) perché; (3) percorso UI reale; (4) file/servizi/RPC/DB; (5) soluzione possibile; (6) cosa decidere; (7) cosa non modificare ancora.

Etichetta: **BLOCCO / DECISIONE DA CONFERMARE**.

---

## 1. Executive Summary

Image Management (MF2–MF5) **operativo** su primary Persona/POI/Patrono (D90); backfill primary **chiuso** (scope script). **Audit VII (2026-09-27):** decisioni prodotto **consolidate in §32** — **non riaprire** merge survivor-only, D-22 cascata, Sponsor min/max lifecycle, segnalazioni=`content_reports`, verify AI separata, city delete admin_all, AI config per-sezione, Safe-Art autonomo. **Priorità POI D-22** — **decisa, non implementata** (§32.2). **Sponsor** quote §32.3 — **decise, assenti** in codice. **Merge:** **INT-MERGE-IMG-01** unico fix (SQL trasferisce victim oggi). **Wikimedia:** motore unico `commonsDownloadPipeline` — POI/Patrono devono **riusarlo** (§32.5). **Segnalazioni:** badge legacy+verify **mischiati** in dashboard (§32.8). **Applica Header:** residuo probabile, consumer public home **assente** (§32.13). **INT-13:** **APPROVATO PER RIMOZIONE** (Audit VIII §34.1) — non ancora rimosso in codice. **Safe-Art DB:** **7 chiavi** recuperabili (§33.1). **Applica Header:** decommission **approvato** — sequenza §35.2 dopo scollegamento Magic Add. **Magic Add:** **DECISIONE CHIUSA** — resta attivo; **non** assegna più foto città né legge `global_settings.hero_image` (§35.1). **Notifica Sponsor:** testo definitivo + anteprime + raggruppamento per operazione (§34.4, §35.3). **Fase decisionale:** **CHIUSA**. **Bibbia operativa §37:** POI discovery + toggle Wikimedia + link Commons tab Media + City delete spec; §36 per altri INT.

Pipeline import OSM → `promoteToLive` **senza immagine**. Persona Wikimedia: modale post-import. POI Wikimedia: da cablare (stessa pipeline manuale + AI).

---

## 2. Fonti consultate

| Fonte | Uso |
|--------|-----|
| Codice `src/` (servizi, hook, componenti admin) | Ricostruzione flussi reali |
| `supabase/migrations/*` (entity_image, D90, merge, content_reports, dual-write) | FK, RPC, CASCADE, priorità merge |
| `AI_CONTEXT/08_ADMIN_GUIDE.md` §4 Staging & Import POI | Proxy procedura import |
| `AI_CONTEXT/10_DATA_FLOW_MAP.md`, `AI_CONTEXT/14_OBSERVATORY_ENGINE.md` | Proxy osservatorio / data flow |
| `AI_IMAGE_MANAGEMENT_CONSOLIDATION_DEEP_ANALYSIS_2026-09-25.md` + addendum decisioni D-01…D-15 | Decisioni già approvate |
| `scripts/backfill_media_assets_from_legacy.ts` | Scope backfill chiuso |
| **`Procedura Master: Gestione Città & Contenuti`** | **Non presente nel repository** come file markdown/SQL. In UI: `AdminGuideModal` con `guideKey="admin_manual_cities"` (`CitiesManager.tsx`, `ImportDashboard.tsx`) → contenuto da **`system_messages`** via `useSystemMessage` (DB). **Testo integrale del manuale non verificabile senza query al DB target.** |

---

## 3. Confronto con «Procedura Master: Gestione Città & Contenuti»

### Come abbiamo confrontato

- **Manuale in-app:** chiave `admin_manual_cities` (titolo visualizzato dipende dal record DB; in design preview compare «Gestione Città»).
- **Proxy repo:** DOC 08 §4, troubleshooting duplicati staging, sidebar «Manager & Import POI».

### A. Parti che corrispondono al codice (proxy / attese coerenti)

| Tema | Codice |
|------|--------|
| Import OSM in staging | `ImportOsmModal` → `fetchOsmData` (Overpass) → `saveStagingBatch` → `pois_staging` |
| Toolbar import | `ImportActionToolbar`: **SCARICA OSM**, **DEDUPLICA**, **AI QUALITY**, **SEND TO READY**, **SEND TO DB (BOZZE)** |
| Deduplica staging | `deduplicateStagingData` — stesso OSM ID o <20 m + nome ~80% — elimina i perdenti in staging |
| Promozione live come bozza | `promoteToLive` → `enrichStagingPoi` (Gemini) → RPC `promote_staging_poi_to_live`, `status: draft`, **senza campi immagine** |
| Duplicati POI già in DB | `CitiesManager` → tab Osservatorio → `DuplicateResolver` |
| Guida apribile da Import / Cities | `AdminGuideModal guideKey="admin_manual_cities"` |

### B. Incomplete rispetto al codice (probabile gap manuale)

- **Immagini POI:** manuale/proxy non enfatizza che **import OSM non porta foto**; foto reali POI = **MF4 non cablato in UI POI** + upload admin + placeholder.
- **Due pipeline AI distinte:** (1) **AI QUALITY** su staging; (2) **Bonifica** / **Validazione Pro** su POI già in DB (`useAiValidation.verifyDraftsBatch`) — nomi pulsante reali in `PoiToolbar`: **Bonifica (N)**, **Flash AI Discovery**, **NUOVO POI (AI)**.
- **Image Management MF2:** assignment, segnalazioni `content_reports`, revoca/sospensione via RPC — assenti nel DOC 08.
- **Segnalazioni:** hub **Community → Segnalazioni** con tab Community / Santo Patrono / Personaggio Famoso / AI; conteggio sidebar **non** allineato al solo `content_reports`.

### C. Comportamenti in codice non descritti nel manuale (proxy)

- Dual-write transitorio Community/Wikimedia.
- D90: `save_poi_with_image_assignment` / `save_city_person_with_image_assignment` con `image_url` null su riga entità.
- Merge immagini: `reconcile_poi_image_assignments_for_merge` + priorità merge SQL (senza Sponsor).
- Cancellazione Persona: RPC `delete_city_person_with_image_cleanup` (atomica).
- Patrono: salvataggio città + RPC assignment **in due passi** (`saveCityDetails`).
- Coda **VERIFICARE IMMAGINE AI** (`verify_ai_image`) con badge solo tab **AI** in hub.

### D. Parti manuale potenzialmente non più valide

- Qualsiasi istruzione che presuppone **`patron_details.imageUrl`** o **`pois.image_url`** come SoT pubblico (read cutover su assignment per Persona/POI/Patron primary pubblico).
- Conteggi segnalazioni basati solo su `famous_person_photo_reports` / `patron_photo_reports` come unico flusso operativo.
- Eliminazione città «semplice» senza menzione **non-atomicità**, **RESTRICT history**, **DELETE personaggi senza D90**.

### E. Cosa aggiungere/correggere nel manuale (senza modificarlo ora)

1. Sequenza import con **assenza immagine** fino a intervento admin/MF4/community.
2. Percorso **Manager POI - DB** → editor città → POI → modale → tab **Media** → **AdminImageInput** (Link URL / Carica File / **Rimuovi e usa Placeholder**).
3. Osservatorio: pulsanti freccia **Mantieni A, Fondi B in A** / **Mantieni B, Fondi A in B**, **Ignora (Sono Diversi)**.
4. Segnalazioni MF2 + stati **NUOVO → IN VERIFICA → OK/KO** e effetto su assignment (`transition_report_status`).
5. Patrono: una sola SoT immagine (target), galleria separata.
6. Nota: **eliminazione città** oggi **non** disponibile da UI collegata a `deleteCity`.

**Informazione mancante per confronto A–E al 100%:** export testuale di `system_messages` where `key = 'admin_manual_cities'`.

---

## 4. Pipeline completa POI

### 4.1 Forma tecnica (sequenza)

```
Overpass API (importService.fetchOsmData)
  → saveStagingBatch → pois_staging (status new, …)
  → [opz.] deduplicateStagingData (staging only, DELETE perdenti)
  → [selezione righe] runAiAnalysisService → updateStagingAiRatings (staging)
  → [selezione] runBulkStatusUpdateService → status ready/discarded
  → runPublishingService → promoteToLive
       → enrichStagingPoi (Gemini — testo/tassonomia/indirizzo, useSearch opzionale)
       → RPC promote_staging_poi_to_live (INSERT/UPDATE pois, NO image_url)
  → POI in DB: status draft, image_url legacy vuoto, nessun assignment automatico

Post-import (DB live):
  → AdminCityEditor → AdminPoiManager
  → [opz.] verifyDraftsBatch (useAiValidation) → verifyPoisBatch AI → saveSinglePoi (testo/GPS/status, p_origin_type sempre admin se immagine)
  → [opz.] PoiToolbar Bonifica / Flash AI Discovery / NUOVO POI (AI) — generazione testuale/coord, non pipeline immagine OSM
  → Immagine: AdminPoiModal → PoiMediaTab → AdminImageInput
       → uploadPublicMedia (admin_uploads) o URL
       → saveSinglePoi → RPC save_poi_with_image_assignment
            → upsert_poi_primary_image_assignment (origin admin)
            → media_assets + entity_image_assignments (+ history)
  → Read pubblico: entityPrimaryImageReadService + placeholder categoria se nessun assignment active

Wikimedia MF4 (POI): commonsDownloadPipeline accetta entityType poi — NESSUN caller UI POI trovato (solo city_person in usePeopleAI).

Merge duplicati (altra pipeline): DuplicateResolver → merge_pois_observatory_atomic → reconcile_poi_image_assignments_for_merge.
```

### 4.2 Forma non tecnica (Admin)

1. **Sidebar → Manager & Import POI** (`ImportDashboard`).
2. Selezioni la **città** nell’interfaccia import.
3. **SCARICA OSM** → modale import → categorie → conferma → il sistema scarica da OSM e salva in **staging** (non ancora nel catalogo POI pubblicabile).
4. **DEDUPLICA** (opzionale): il sistema elimina automaticamente i duplicati in staging (resta il record «più ricco»).
5. Selezioni righe in tabella → **AI QUALITY** (rating su staging) → **SEND TO READY** → **SEND TO DB (BOZZE)**.
6. Durante **SEND TO DB (BOZZE)** il sistema chiama l’AI per **descrizione e metadati**, crea/aggiorna POI come **Bozze** — **senza foto**.
7. **Sidebar → Manager POI - DB** → apri la **città** → tab POI.
8. Per la foto: apri il POI → tab **Media** → incolli URL o **Seleziona Foto** → salvi il POI → il sistema registra **media asset + assignment** (origine **admin**).
9. Se non metti foto: in lettura compare il **placeholder** di categoria (se configurato in impostazioni).
10. Per arricchire testo/GPS bozze: selezioni POI → **Bonifica (N)** (validazione AI batch) oppure flussi **Flash AI Discovery** / **NUOVO POI (AI)**.
11. Duplicati già in catalogo: **Manager POI - DB** → **Osservatorio** → **DuplicateResolver** → freccia per tenere A o B.

### 4.3 Risposte puntuali (1–25)

| # | Risposta |
|---|----------|
| 1 | Overpass API via `importService.fetchOsmData` |
| 2 | `ImportDashboard` (Manager & Import POI) |
| 3 | **SCARICA OSM** (poi modale conferma import) |
| 4 | `fetchOsmData` + `saveStagingBatch` |
| 5 | Righe `pois_staging` (+ oggetti POI costruiti solo in `promoteToLive`) |
| 6 | In staging: **DEDUPLICA** (`deduplicateStagingData`); in live: Osservatorio |
| 7 | Staging: score dati; Live merge: scelta admin (freccia survivor) |
| 8 | **Non** durante import OSM |
| 9 | Dopo import: admin upload/URL; Persona: Wikimedia; Community: foto approvata — **non** automatico su OSM |
| 10 | Alla **save** POI con URL/path in `saveSinglePoi` |
| 11 | **Dopo** INSERT POI (promote senza immagine; immagine solo su save admin) |
| 12 | Sì, via `ensure_media_asset` / upsert D90 |
| 13 | Sì, `entity_image_assignments` primary |
| 14 | Colonna `pois.image_url` azzerata in RPC save; legacy non SoT |
| 15 | Admin save: **`admin`** sempre (`poiWrite.ts` `p_origin_type: 'admin'`) |
| 16 | **Nessuna** regola Sponsor>Admin>Real>AI in upsert POI; admin save **sostituisce** primary active senza controllo priorità origine |
| 17 | POI bozza senza assignment; UI placeholder |
| 18 | `verifyDraftsBatch` / Bonifica — aggiorna testo, coords, status via `saveSinglePoi` |
| 19 | Editor città → `AdminPoiManager` |
| 20 | **Bonifica (N)** o validazione massiva da toolbar |
| 21 | `useAiValidation` → `verifyPoisBatch` → `saveSinglePoi` |
| 22 | description, coords, category, aiReliability, status, … — **non** imposta immagine nel loop verificato |
| 23 | Sì, AI staging (`enrichStagingPoi`) separata da AI validazione bozze live |
| 24 | **AdminImageInput** su POI: upload/URL/copyright AI — **non** genera immagine POI; AI immagine personaggi è altro hook |
| 25 | «Completo» è operativo: bozza arricchita + (opz.) foto; **published** è scelta status admin — nessun gate automatico «immagine obbligatoria» in promote |

---

## 5. Pipeline AI (immagini e testo)

### 5.1 Dove l’admin usa l’AI (evidenza codice)

| Schermata | Azione UI | Servizio | Immagine? |
|-----------|-----------|----------|-----------|
| Import POI | **AI QUALITY** / **SEND TO DB** | `runAiAnalysisService`, `promoteToLive` / `enrichStagingPoi` | No |
| AdminPoiManager | **Bonifica**, Discovery, **NUOVO POI (AI)** | `useAiValidation`, generator hooks | No (salvo save manuale separata) |
| AdminImageInput | **AI Copyright Check** | `aiGateway.generateLegacy` (gemini-2.0-flash) | No generazione |
| Culture / Personaggi | Import discovery, rigenera ritratto | `generateHistoricalPortrait` → Storage `people_portraits` → `saveCityPerson` D90 (`imageOriginType: ai`) | Sì (persona) |
| Personaggi | Wikidata/Commons conferma | `runCommonsDownloadPipeline` + `saveCityPerson` | Sì (wikimedia / coda verify) |
| AI Complete City / Magic City | batch persone | `findExistingPortrait`, `generateHistoricalPortrait`, `saveCityPerson` | Sì persone |

**Nota:** `registerAiGeneratedPortraitAsset` (dual-write) **non ha caller** in `src/`; flusso UI attuale = `generateHistoricalPortrait` + D90 — **non eliminare** (INT-13 sospeso, §24.13).

### 5.2 Sequenza tecnica AI ritratto personaggio

`usePeopleAI.regeneratePortrait` / import → `generateHistoricalPortrait` (`aiVision.ts`, modello gateway) → upload `public-media/people_portraits/...` → `saveCityPerson` → RPC **`save_city_person_with_image_assignment`** (non dual-write).

### 5.3 Sequenza semplice

Apri città → **Personaggi** → azione AI (es. rigenera ritratto) → attendi → foto in Storage → salva personaggio → vedi foto aggiornata. Se Wikimedia: confermi proposta → stesso flusso con origine reale/licenza.

### 5.4 Stati parziali

- **Patrono:** PATCH città ok, RPC assignment fallisce → errore solo in console (`saveCityDetails`).
- **Community upload:** insert `photo_submissions` rollback se materialize assignment fallisce.
- **Wikimedia coda verify:** asset creato, **primary persona non sostituita** (alert esplicito in `usePeopleAI`).

---

## 6. Pipeline Wikimedia

| Step | Dettaglio |
|------|-----------|
| Avvio UI | Editor città → **Personaggi** → flusso Wikidata (`usePeopleAI`, `WikidataConfirmModal`) |
| Pipeline | `runCommonsDownloadPipeline` → download Commons → `public-media/wikimedia/...` → `media_assets` + provenance + `record_image_verification_run` |
| Auto-path CC BY 4.0 | `transition_media_asset_status` → **`upsertEntityImageAssignmentFromSource`** (dual-write) + poi **`saveCityPerson`** con URL (D90) |
| Coda admin | Assignment dual-write opzionale; **non** sostituisce immagine corrente persona |
| POI / Patron | Pipeline **supporta** `entityType: 'poi'` nel tipo, **nessun** wiring UI trovato per POI/Patron |
| Vecchio collegamento | Dual-write RPC + colonna persona ancora popolata via D90 |
| Da cambiare (futuro) | Sostituire dual-write con D90 puro mantenendo MF4 identico |
| Invariato | Download, licenza, credit, verification run, coda verify |

---

## 7. Pipeline Community

| Step | Dettaglio |
|------|-----------|
| Utente | Carica foto community (o admin in **Foto** moderazione) |
| Sistema | `photoService.uploadCommunityPhoto` / approve → riga `photo_submissions` |
| Assignment | `materializePhotoSubmissionAssignment` → **`upsert_entity_image_assignment_dual_write`** (`originType: community`) |
| Moderazione | **PhotoModeration** — flusso approve/reject **non** analizzato per modifiche (per decisione: invariato) |
| Dopo migrazione | Stessi passi UI; sostituire RPC dual-write con ensure+upsert D90 equivalente |
| Rischio parziale | Rollback submission se assignment fallisce (già gestito) |

**Collegamento a POI/Persona:** materialize usa metadati submission (entità collegata quando presente in flusso approve — seguire `photoService.ts` path approve ~729+).

---

## 8. Merge / DuplicateResolver

### 8.1 Oggi (tecnico)

- UI: `DuplicateResolver` — **Ignora (Sono Diversi)**; frecce **Mantieni A, Fondi B in A** / **Mantieni B, Fondi A in B**.
- `observatoryService.mergePoisInDb` → **`merge_pois_observatory_atomic`** → **`reconcile_poi_image_assignments_for_merge`** → DELETE victim POI.
- Priorità merge SQL (`media_origin_primary_merge_priority`): admin 4, verified_real/wikimedia 3, community 2, ai 1, placeholder 0 — **no sponsor**.
- Victim assignments → `removed` + history; **non** DELETE fisico `media_assets` in reconcile.
- Bug: transfer può invocare `upsert_poi_primary_image_assignment` con origine **`verified_real`** → RPC **rifiuta** parametro (deve restare su asset da pipeline D79–D82).

### 8.2 Oggi (semplice)

Nell’Osservatorio vedi due schede POI simili. Scegli la freccia verso il POI da **tenere**. Il sistema unisce recensioni e campi vuoti, decide quale foto tenere con regole interne, elimina l’altro POI.

### 8.3 Problema concreto

- Priorità merge SQL **≠** D-22 (manca Sponsor; ordine legacy).
- **`verified_real` al merge:** **NON RAGGIUNGIBILE** (INT-02 rimosso). Merge immagini: regola survivor-only (§29.1); **INT-MERGE-IMG-01**; INT-03 rimosso.
- Foto duplicate OSM/pre-pubblicazione: victim asset spesso **non** cancellato (resta in libreria se non condiviso).

### 8.4 Proposta (pianificazione, non implementata)

Allineamento merge priority a D-22: **solo opzionale** per edge-case Admin Media (§28.1); non in piano INT-03.

---

## 9. Priorità immagini POI (decisione definitiva vs codice)

**Target prodotto (D-22):** SPONSOR → ADMIN → REAL/WIKIMEDIA → COMMUNITY → AI → PLACEHOLDER; admin sempre intervenibile; placeholder fallback.

| Aspetto | Stato codice |
|---------|----------------|
| Enum `MEDIA_ORIGIN_TYPE_DB_VALUES` | **No `sponsor`** |
| `saveSinglePoi` | Sempre **`p_origin_type: 'admin'`** — sovrascrive primary senza guardia priorità |
| Import OSM / AI | Non toccano immagine |
| Dual-write community/wikimedia | Possono impostare community/wikimedia/ai — **nessun** confronto con admin esistente in dual-write |
| Merge | Priorità **diversa** e senza sponsor |
| Admin rimuove | `AdminImageInput` **Rimuovi e usa Placeholder** → save senza URL → RPC revoca assignment `removed` |
| Admin sospende | **Nessun** pulsante dedicato in `AdminImageInput`; sospensione assignment via flussi report (**OK** image_abuse → `removed`) o tooling libreria non trovato in componenti admin grep |
| Placeholder | Read resolver + `global_settings` categoria; `image_is_placeholder` legacy |
| Sponsor POI foto | Sponsor legge `pois.image_url` in resolver display — **nessun** write sponsor origin trovato |

**Conclusione:** priorità definitiva **non** rispettata globalmente; l’admin **può** sostituire/rimuovere via save POI, **non** c’è enforcement anti-downgrade per flussi automatici.

---

## 10. City orphan feasibility

### 10.1 Comportamento `deleteCity` oggi (`cityLifecycleService.ts`)

**UI:** `DeleteCityOptionsModal` esiste; **nessun** import/uso in `CitiesManager` o altro — **`deleteCity` non invocato** dall’admin panel attuale.

**Sequenza client (non atomica):**

1. `orphanCityStaging`
2. `photo_submissions` delete o orphan (`keepUserPhotos`)
3. Sponsor: null FK + RPC **`handle_city_deleted_for_sponsors`**
4. **DELETE** `shops` (obbligatorio)
5. DELETE legacy **`famous_person_photo_reports`**, suggestions PF
6. **DELETE** tutti **`city_people`** (no opzione keep; **no** `delete_city_person_with_image_cleanup`)
7. POI: `keepPOIs` → `city_id null`; else DELETE reviews, suggestions, **pois** (**no** `delete_poi_with_image_cleanup`)
8. DELETE events, services, guides, operators
9. DELETE **`cities`**

**RPC usate:** `handle_city_deleted_for_sponsors`, `orphanCityStaging` / reclaim (altri flussi).

**CASCADE rilevanti:**

- `entity_image_assignments.city_id` → **`ON DELETE CASCADE`** (migration `20260916130000`)
- `content_reports.city_id` → **`ON DELETE CASCADE`**
- `entity_image_history.city_id` → **SET NULL**; history → assignment **`ON DELETE RESTRICT`**

**Rischio concreto:** DELETE città che CASCADE assignments può **fallire** se esiste history che referenzia assignment (**RESTRICT**), a meno che cleanup non avvenga prima (oggi **assente** in `deleteCity`).

### 10.2 Cosa si perde oggi (modello attuale, keepPOIs false)

- POI, personaggi, shops, eventi, servizi, guide, operatori, report legacy PF, assignment/history/report MF2 legati alla città (CASCADE), staging orphan tag.

### 10.3 Ostacoli modello orphan (D-01)

| Ostacolo | Dettaglio |
|----------|-----------|
| `city_people.city_id` | **NOT NULL** — orphan persone impossibile senza schema |
| DELETE persone bulk | Bypass D90 → assignment/history inconsistenti prima del CASCADE |
| DELETE pois bulk | Bypass D90 |
| `entity_image_assignments.city_id` NOT NULL + CASCADE | Orphan entità con assignment richiede **city_id** valido o redesign FK |
| `content_reports` CASCADE | Segnalazioni perse su delete città |
| Re-associazione stesso `city_id` | Possibile se entità conservate con id stabile e FK city ripristinata |

### 10.4 Fattibilità

**Fattibile** solo con **RPC unica** `delete_city_orphan_atomic` (o equivalente): soft-delete city, set orphan flags, **non** CASCADE assignments; preservare `city_id` storico su entità; re-link su recreate. **Non** fattibile senza migration su FK/nullable e senza sostituire delete client sequenziale.

### 10.5 Implementazione proposta (solo piano)

1. Migration: status città `deleted_orphan`, nullable FK dove serve, **RESTRICT** → cleanup ordinato history.
2. RPC unica che per ogni entità chiama pattern D90 delete/revoke o marca orphan.
3. Wire UI `DeleteCityOptionsModal` + opzioni keepPOIs/keepPeople coerenti.
4. Job reassociation su `resolveCanonicalCityId` match.

---

## 11. Patron decommission (`patron_details.imageUrl`)

| Lettura | `CulturePatronMainPhotoSection` → **`resolvePatronDisplayImageUrl(patronDetails, …)`** (JSON); pubblico modal → **`resolvePatronPrimaryImageUrl`** (assignment) |
| Scrittura | `buildCityWritePayload` serializza JSON; **`saveCityDetails`** → RPC **`upsert_patron_primary_image_assignment`** / **`revoke_patron_primary_image_assignment`** |
| Atomico? | **No** — PATCH ok + RPC fallisce → JSON e assignment disallineati |
| Dopo eliminazione legacy | Solo assignment + galleria RPC; migrare dati test via backfill già eseguito per primary |
| Migrazione | Backfill primary patron **chiuso**; JSON va azzerato in fase decommission |
| Piano | RPC **`save_patron_with_primary_assignment`** unica; read admin su assignment; rimuovere `resolvePatronDisplayImageUrl` come SoT |

---

## 12. Legacy report decommission

### Oggi

- Sidebar **Segnalazioni** (`counts.suggestions`) = `getPendingSuggestionCount()` **+** `getPendingContentReportCount()` **+** `getPendingFamousPeopleAdminCount()` (include **`famous_person_photo_reports`**) **+** totale coda **AI verify**.
- Hub tab: badge **solo** tab **AI** (`useReportNotificationCounts` → `verify_ai_image`).
- Tab Community/Patron/Famous: **nessun** CountBadge rosso per `content_reports` pending.
- Legacy **`famous_person_photo_reports`** ancora insert in `famousPersonPhotoReportService`; delete person **blocca** se righe legacy presenti.

### Target (D-05)

- Conteggio **da gestire** = `content_reports.status = 'nuovo'` (e per tab: filtro `entity_type` / sotto-tab).
- Rosso su ogni tab/sotto-tab.
- Legacy tabelle report foto **solo storico** / decommission.

---

## 13. Backfill verification (scope chiuso)

| Coperto | `city_person`, `poi`, `patron` **primary** da colonne/JSON legacy → verify assignment |
| Escluso | **`city_patron_gallery`**, 255 POI **placeholder** (corretto) |
| Creato | `media_assets` + assignments allineati a sorgenti eligible |
| Gap fuori scope backfill | Gallery patron; dual-write attivo; JSON patron SoT parallelo; sponsor origin POI; POI senza primary intenzionale (placeholder) |
| Repair necessario? | **Non** riesecuzione backfill globale; **sì** repair puntuali (merge verified_real, test data, gallery) come interventi separati |
| Gap residui nello scope script | **Nessuno** dichiarato oltre verifiche puntuali post-anomalie |

---

## 14. Patron test image (dato da eliminare — non eseguito)

**Classificazione:** test caricato dal proprietario — **da eliminare** (non conservare).

**Record (pattern, senza query DB live):**

- Riga **`cities.patron_details`** JSON campo **`imageUrl`** (o `image_url`) per la città di test.
- Eventuale **`entity_image_assignments`** `entity_type = 'patron'`, `assignment_role = primary`, stesso `city_id`.
- Eventuale **`media_assets`** referenziato + file **`public-media`** sotto path patron/admin.

**Procedura sicura (ordine):**

1. Admin: rimuovi foto in UI Patrono (svuota immagine) → **`revoke_patron_primary_image_assignment`** via save.
2. Verifica assenza primary active in assignment.
3. Se asset orfano confermato (usage map), **`safe_archive`** / policy libreria — **non** DELETE se condiviso.
4. Pulisci JSON **`patron_details.imageUrl`** in save finale coerente con D90.

**Assignment:** revoca primary **prima** di cancellare file storage.

---

## 15. Patron gallery

| Tipo | Esempi |
|------|--------|
| **A. Test** | Foto caricate manualmente in dev; righe galleria senza significato prod |
| **B. Strutturali** | Backfill **non** copre gallery; RPC **`deleteCityPatronGalleryPhotoWithAssignmentRpc`**; reorder; **`resolvePatronGalleryOriginType`**; suggerimenti **`patronPhotoSuggestionService`** che creano/eliminano righe; possibile disallineamento assignment **`gallery`** vs `city_patron_gallery.image_url` legacy |

**Problema strutturale:** doppia persistenza (tabella galleria + assignment role gallery) finché non completato cutover MF5 gallery-only assignment.

**Soluzione proposta:** stesso pattern D90 della primary; operazioni **`save_patron_gallery_*`** atomiche; read da assignment.

---

## 16. Single Person deletion

### Tecnico

`CulturePeople` → **Elimina personaggio** → `usePeopleData.deletePerson` → **`deleteCityPerson`** → RPC **`delete_city_person_with_image_cleanup`** (migration `20260924170000`).

RPC: lock persona; blocca se **`famous_person_photo_reports`** o **`content_reports`** aperti; revoca assignments active/suspended; history; DELETE persona; **non** DELETE asset condivisi.

### Semplice

Nella scheda personaggio clicchi **Elimina** → confermi → il sistema toglie il personaggio e scollega le sue foto dal catalogo, lasciando intatti file usati anche altrove.

### Atomico?

**Sì** lato RPC **se** chiamata — **unico** path UI trovato.

### City delete contrasto

DELETE massivo `city_people` in **`deleteCity`** **bypassa** RPC → rischio storico/RESTRICT e incoerenza.

**Verifica finale 2026-09-26:** **OK** — nessuna modifica proposta al path D90 singola persona.

---

## 24. ADDENDUM AUDIT 2026-09-26 (II)

Per ogni sotto-punto: **FATTO VERIFICATO** | **DECISIONE PRODOTTO** | **GAP** | **INTERVENTO**.

### 24.1 Wikimedia — Personaggio famoso (A)

| # | Risposta |
|---|----------|
| 1 Schermata | Admin → **Manager POI - DB** → editor città → tab **Personaggi** (`CulturePeople.tsx`) |
| 2–3 Pulsante | **Non esiste** un pulsante dedicato «Importa Wikimedia» su personaggio già salvato. Il flusso parte da **Discovery**: sezione `CulturePeopleDiscovery` → import singolo personaggio (`importDiscoveryPerson` in `usePeopleAI.ts`) |
| 4 Componente | Dopo import, modale **`WikidataConfirmModal`** (`title`: **Conferma Wikidata / Commons**) |
| 5 Servizi | `lookupWikidataP18Proposal` → (conferma) `runCommonsDownloadPipeline` → opz. `saveCityPerson` |
| 6 Ricerca fonte | Wikidata P18 + metadati Commons (`wikidataLookupService`, `fetchCommonsExtMetadata`) |
| 7 Download | HTTP blob → Storage `public-media/wikimedia/` o `verified/wikimedia/` (auto-path CC BY 4.0) |
| 8 Verifiche | Licenza Commons parser; magic bytes; `record_image_verification_run`; coda `verify_ai_image` se non auto-path |
| 9 `media_assets` | `materializeMediaAssetForPath` (insert `origin_type: wikimedia`) |
| 10 `entity_image_assignments` | Solo se auto-path: `upsertEntityImageAssignmentFromSource` (dual-write) + poi D90 su persona |
| 11 Attiva subito? | **Auto-path:** sì primary + alert successo. **Coda verify:** asset creato, **primary persona non sostituita** (alert esplicito) |
| 12 Conferma | Checkbox + pulsante **«Conferma e verifica Commons»**; alternativa **«Salta (no Wikimedia)»** |
| 13 UI | Anteprima, Q-id, P18, confidenza; link **«Apri Commons»** |

**Semplice:** importi un personaggio dalla Discovery → compare da sola la finestra Wikidata → spunti la casella → **Conferma e verifica Commons** → foto verificata si applica, altrimenti finisce in coda **Segnalazioni → AI**.

**Su personaggio esistente:** solo **Genera ritratto AI** (icona accanto URL); **nessun** re-trigger Wikimedia in UI.

### 24.2 Wikimedia — Santo Patrono (B)

**FATTO VERIFICATO:** **nessun** wiring Wikimedia in `CulturePatron*`, `AdminPatronSaintManager`, né chiamate `runCommonsDownloadPipeline` con `entityType: patron`.

**DECISIONE PRODOTTO:** non richiesto oggi per Patrono primary (solo Persona + POI futuro).

### 24.3 Wikimedia — POI (decisione + architettura)

**DECISIONE PRODOTTO:** stesso motore MF4; attivazione **manuale** (tab Media POI) + **automatica** (stesso servizio invocato da AI arricchimento).

**FATTO VERIFICATO:** `CommonsDownloadPipelineInput.entity.entityType` include `'poi'`; **unico caller** UI: `usePeopleAI.confirmWikidataCommonsImport` (`city_person` only).

**Architettura condivisa (proposta):** estrarre `runCommonsDownloadForEntity(proposal, entityTarget, options)` già centrato su `runCommonsDownloadPipeline`; POI manual = `PoiMediaTab` → stessa funzione; POI auto = `enrichStagingPoi` / `verifyDraftsBatch` → stessa funzione (no seconda implementazione).

**Origine attesa:** `wikimedia` su `media_assets`; priorità prodotto **Real** sotto Admin/Sponsor — **assente** enforcement (§24.5).

**INTERVENTO:** **INT-12** (obbligatorio, non opzionale) + **INT-12b** hook AI condiviso.

### 24.4 Candidate Wikimedia (DECISIONE — non `verify_ai_image`)

**FATTO:** `verify_ai_image` / `AdminAiVerifyQueue` = coda **verifica portrait AI** — **dominio diverso**; **non** riusare per candidate Wikimedia (DECISIONE D-24).

**FATTO:** pipeline Commons crea `media_assets` `origin_type=wikimedia`; path persona può lasciare asset in verify/quarantine senza primary — **nessuna** UI «Candidate Wikimedia» per entità corrente.

**DECISIONE PRODOTTO:** modale **Candidate Wikimedia** (Persona/Patron/POI) + **Associa** → D90; stessa pipeline manuale + AI.

**INTERVENTO:** **INT-WM-PHASE-01** (storage candidate dedicato + UI; vedi §27.6).

### 24.5 Priorità POI + provenienza UI

**DECISIONE PRODOTTO (D-22):** **SPONSOR → ADMIN → REAL/WIKIMEDIA → COMMUNITY → AI → PLACEHOLDER**; downgrade automatico vietato; **Admin** può sempre sostituire/sospendere/rimuovere/ripristinare manualmente.

**FATTO VERIFICATO:** `saveSinglePoi` passa sempre `p_origin_type: 'admin'`; nessun `sponsor` in enum; `PoiMediaTab` / `AdminImageInput` **non** mostrano badge provenienza; merge SQL priorità diversa (§24.8).

**Stato:** **assente** (priorità + UI provenienza).

**INTERVENTO:** **INT-01**, **INT-01b** (label: Sponsor/Admin/Real-Wikimedia/Community/AI/Placeholder + licenza/credit).

### 24.6 Sponsor — audit + regole complete (DECISIONE PRODOTTO)

**Quote (proprietario, non in codice):**

| Tipologia | Max foto POI (galleria) | Note |
|-----------|-------------------------|------|
| GOLD | 10 | una **principale** + altre sfogliabili |
| SILVER | 5 | idem |
| GUIDA TURISTICA | 3 | spazio dedicato; POI propri **non** ancora in prodotto |
| TOUR OPERATOR | 3 | idem |
| DIGITAL SHOP | 10 POI + 10 spazio shop esclusivo | vedi §27.7 |

**FATTO VERIFICATO:**

- `sponsors`: tier/plan/type, `poi_id`, `shop_id`, `guide_id`, `operator_id` — **nessuna** colonna galleria/quota foto.
- **Nessun** enforcement 10/5/3 in `src/` o migration sponsor.
- `poiMapper.ts`: **`gallery: []` sempre**; `PoiImageSection` carousel **pronto** ma **mai alimentato**.
- Primary POI sponsor oggi ≈ read su primary assignment / legacy display, **non** modello multi-foto.

**GAP:** origin `sponsor`, tabelle/servizi galleria, quota RPC, UI area personale (scelta principale), Admin override, carousel POI.

**INTERVENTO:** **INT-SPONSOR-01** (+ **INT-SHOP-SPONSOR-01** — Shop grande 1–5, piccola 1–10, max 15).

### 24.7 Negozi digitali (dominio separato)

**FATTO VERIFICATO:** `shops` + `shop_products.image_url`; upload partner **`BusinessShopManager`** → `uploadPublicMedia(..., 'shop_products')`; **nessun** `entity_image_assignments` per prodotti negozio; **nessun** path Community/Admin/Sponsor scrive in `shop_products` senza passare da shop owner UI.

**DECISIONE PRODOTTO:** isolamento **corretto** oggi; **non** applicare priorità POI.

**INTERVENTO:** documentazione + test RLS; eventuale audit RLS esplicito (**INT-SHOP-01** solo se gap permessi trovato in review).

### 24.8 Merge POI — lifecycle reale (audit definitivo)

Vedi **§28.1** per simulazione UI e esito **INT-03 rimosso**.

**`verified_real`:** **NON RAGGIUNGIBILE** — **INT-02 RIMOSSO** (nessun writer `media_assets.origin_type = verified_real`; Wikimedia = `wikimedia`).

**Lifecycle nominale import (FATTO):** staging → dedupe staging → AI quality → `promoteToLive` → POI `draft` **senza** campi immagine / **senza** assignment automatico → Osservatorio → merge. In questo percorso, al click merge, **nessun** `entity_image_assignments` primary sui POI importati.

**Eccezione raggiungibile (FATTO):** **prima** del merge, Admin può aprire **Manager POI - DB → città → POI → modale → tab Media → AdminImageInput → salva** → `saveSinglePoi` → RPC `save_poi_with_image_assignment` → primary **`admin`**. Poi **Osservatorio → Duplicati → Mantieni A, Fondi B in A** → `merge_pois_observatory_atomic` → **`reconcile_poi_image_assignments_for_merge`** (priorità SQL **senza** sponsor, ordine **≠** D-22).

**Contraddizione prodotto vs documentazione precedente:** il proprietario considera il merge **senza** immagini come lifecycle reale; il codice **non** vieta il bypass Media e **sempre** invoca reconcile al merge.

**INT-03 (aggiornamento IV):** **RIMOSSO dal piano** — vedi §28.1 (percorso Media→merge **possibile** ma **atipico**; reconcile SQL già presente).

### 24.9 Patron decommission — audit sintetico

| Layer | Attuale | Desiderato |
|-------|---------|------------|
| Write JSON | `saveCityDetails` PATCH `patron_details.imageUrl` | Solo assignment |
| Write assignment | RPC separata (errori swallowed) | RPC unica atomica con PATCH |
| Read admin | `resolvePatronDisplayImageUrl(JSON, master)` | Assignment + master fallback editorial |
| Read public | `resolvePatronPrimaryImageUrl` (assignment) | Solo assignment |
| Gallery | `city_patron_gallery.image_url` + assignment `gallery` | Tabella metadati galleria; foto SoT assignment |

**INTERVENTO:** **INT-05**, **INT-11**.

### 24.10 Galleria Patrono — spiegazione semplice

**Dove sono le foto oggi:** ogni foto festa/patroni sta in **`city_patron_gallery`** (didascalia, ordine) **e** ha un collegamento **`entity_image_assignments`** (role `gallery`). La foto principale città è **`patron_details.imageUrl`** (JSON) **più** assignment primary — **due sistemi paralleli**.

**Desiderato:** una sola fonte per i pixel (assignment); la tabella galleria resta solo per **ordine/didascalia/id riga**, non URL duplicato SoT.

### 24.11 Segnalazioni — audit + piano

**Attuale:** sidebar **Segnalazioni** somma suggestions + `content_reports` + legacy PF counts + AI verify; tab Community/Patron/Famous **senza** badge rosso; insert legacy `famous_person_photo_reports` ancora attivo; delete person **bloccato** da FK legacy reports.

**DECISIONE PRODOTTO:** eliminare operativamente `famous_person_photo_reports` e `patron_photo_reports`; conteggi solo `content_reports.status = 'nuovo'`.

**INTERVENTO:** **INT-08** (+ migration delete dati legacy dopo inventario, **INT-REP-DECOM**).

### 24.12 Community / Wikimedia linkage

**Community:** cambia solo `materializePhotoSubmissionAssignment` → RPC D90; moderazione identica; rollback insert submission già presente.

**Wikimedia:** sostituire dual-write post-verify con D90; pipeline Commons identica.

### 24.13 AI configurabile + `registerAiGeneratedPortraitAsset`

**FATTO VERIFICATO — `AiFieldHelper`:** label **«Generatore AI»** / **«Configura Strategia AI»**; usato in `TabRatings`, `EditorRatings`, `CulturePatron` (`fieldId` `ratings_strategy`, `patron_strategy`); legge `ai_configs` via **`getAiConfig`**; **`saveAiConfig` non ha caller in `src/`** → criteri **non persistiti** da UI (solo stato locale `onApply`).

**Classificazione:** **B — presente parzialmente e rotta** (persistenza CRUD assente).

**`registerAiGeneratedPortraitAsset`:** dual-write AI portrait; **nessun caller**; flusso UI usa **`generateHistoricalPortrait` + `saveCityPerson` D90**. **Non** collegato a `AiFieldHelper`. **IPOTESI:** helper pensato per unificare portrait AI prima del cutover D90 — **non dimostrato** oltre similarità funzionale.

**INTERVENTO:** **INT-AI-CONFIG-01** (UI CRUD `ai_configs` + wire `saveAiConfig`); **INT-13 sospeso** fino a decisione se riattivare register o consolidare su D90.

### 24.14 City orphan — modello definitivo

**Master ID:** tabella **`cities_registry`** (`id` canonico); `resolveCanonicalCityId` / import regionale **obbligano** registry (`cityIdService.ts`, `CityEditorContext.tsx`).

**Attuale delete:** DELETE riga **`cities`**; registry **non** toccato; contenuti **cancellati** (personaggi/POI/…).

**DECISIONE PRODOTTO:** registry **permanente**; riga `cities` disattivata/orphan; **tutti** i contenuti conservati con `city_id` storico; riattivazione stesso `city_id`.

**INTERVENTO:** **INT-09** (soft status + RPC orphan atomica + no CASCADE distruttivo su assignment/history), **INT-10** obsoleto come «delete D90 bulk» → sostituito da «preserva entità».

### 24.15 Backfill — inventario chiusura

| Classe | Elementi |
|--------|----------|
| **MIGRATO E CHIUSO** | Primary `city_person`, `poi`, `patron` da legacy (script); verify owner |
| **INTENZIONALMENTE ESCLUSO** | 255 POI placeholder; `city_patron_gallery` |
| **DA SISTEMARE** | Dual-write Community/Wikimedia; Patron JSON; priorità; Sponsor gallery; POI Wikimedia UI |
| **DA DECOMMISSIONARE** | Legacy report tables operativi; dual-write RPC |
| **DA VERIFICARE** | Solo dati DB target (conteggi legacy rows pre-delete) — **non** determinabile da git |
| **DATO TEST** | Patron primary test → delete controllato |

**Nessun** re-run backfill script senza gap dimostrato.

### 24.16 Admin — sospensione foto (comportamento attuale)

**FATTO VERIFICATO:**

- **Segnalazione utente** `create_content_report_group` → assignment **`suspended`** (RPC §34).
- Chiusura **OK** report → assignment **`removed`** (`transition_report_status`).
- **Nessun** pulsante Admin «Sospendi foto» in `AdminImageInput` / `PoiMediaTab`.
- `transition_media_asset_status` + `admin_rationale` in SQL — **nessun** uso in componenti admin grep.

**Vs requisito proprietario (note libere, fallback priorità, storico):** **parzialmente** (solo via segnalazione; no workflow admin dedicato).

**INTERVENTO:** **INT-04** (RPC assignment suspend + UI + history + rationale + resolver fallback).

---

## 17. Remaining legacy image linkage

### Flussi dual-write attivi

1. **`photoService.materializePhotoSubmissionAssignment`** → Community  
2. **`commonsDownloadPipeline`** (auto-path) → Wikimedia  
3. **`mediaAssetService.registerAiGeneratedPortraitAsset`** → **zero caller UI** (helper D90 alternativo non collegato; **non** eliminare fino a chiusura audit AI — §24.14)

### Dual-write RPC

**`upsert_entity_image_assignment_dual_write`** — scrive `media_assets` + assignment + aggiorna colonne legacy entità dove previsto dalla RPC.

### Cosa non cambiare

Moderazione Community; download/licenza Wikimedia; placeholder POI; read cutover pubblico.

---

## 18. Tabella comparativa Wikimedia / Community / AI

| | Wikimedia | Community | AI (persona) |
|---|-----------|-----------|--------------|
| **Utente** | Conferma import Wikidata personaggio | Carica / modera foto | Rigenera ritratto / import AI |
| **Sistema** | Commons pipeline + verify run | photo_submissions + materialize | generateHistoricalPortrait + saveCityPerson |
| **Immagine** | Commons file | Upload utente | Gemini portrait |
| **Storage** | `public-media/wikimedia/...` | bucket community | `people_portraits` |
| **Associazione** | dual-write poi D90 save | dual-write | **Solo D90** RPC |
| **Legacy ancora?** | Sì dual-write | Sì dual-write | Colonna nullata ma D90 |
| **Cambiare** | Assignment path | Assignment path | Nulla flusso; INT-13 sospeso su register |
| **Non cambiare** | MF4 verify/licenza | Moderazione | Modello AI upload |
| **Stato parziale** | Coda verify senza replace UI | Rollback submission | Quota AI → senza foto |
| **Soluzione** | D90 post-verify | D90 post-approve | D90 (`registerAi…` non usato) |

---

## 27. ADDENDUM AUDIT DEFINITIVO 2026-09-26 (III)

### 27.1 POI merge — simulazione Admin (UI → RPC)

| Step | Dove clicchi | Cosa succede | Assignment al merge? |
|------|----------------|--------------|----------------------|
| 1 | **Manager & Import POI** → città → **SCARICA OSM** | `pois_staging` | No |
| 2 | **DEDUPLICA** | elimina duplicati **solo staging** | No |
| 3 | **AI QUALITY** / **SEND TO DB (BOZZE)** | `promoteToLive` → INSERT `pois` `status=draft`, payload **senza** image | No |
| 4 | **CitiesManager → Osservatorio → Duplicati** → città → **Scansiona** | `getPoisByCityId` — tutti i POI | Solo se step 5 fatto |
| 5 | **Mantieni A, Fondi B in A** (o viceversa) | `merge_pois_observatory_atomic` → **`reconcile_poi_image_assignments_for_merge`** → DELETE victim | Vedi sotto |

**Percorso nominale (import first):** step 1→4 **senza** tab Media → al merge **0** primary assignment → reconcile **no-op** su transfer.

**Bypass documentato:** step 3b **prima** del 4: **Editor città → POI → modale → Media → Carica/URL → salva** → `saveSinglePoi` → `p_origin_type: 'admin'` fisso → primary esiste. Merge step 5 può **trasferire** vincitore/perdente secondo `media_origin_primary_merge_priority` (migration `20260924183300`, **senza sponsor**).

**Origini teoricamente al merge (se bypass):** `admin`, `wikimedia`, `community`, `ai`, `placeholder` — **non** `verified_real`.

**INT-02:** rimosso. **INT-03:** **RIMOSSO (IV)** — §28.1.

---

### 27.2 Priorità POI + provenienza `sponsor` (DECISIONE D-22)

**FATTO:** `MEDIA_ORIGIN_TYPE_DB_VALUES` (`governance.ts`) **non** include `sponsor`. Merge SQL idem. `saveSinglePoi` sempre `admin`.

**DECISIONE:** gerarchia a **6 livelli** (Community tra Real/Wikimedia e AI).

**GAP:** enum/check DB `media_assets.origin_type`; `normalize_canonical_media_origin_type`; RPC `upsert_poi_primary_image_assignment` / `save_poi_with_image_assignment`; guard rank in servizi automatici (Wikimedia, Community, AI); merge priority; TypeScript `MediaOriginTypeDb`; UI badge.

**COME (piano):** migration enum + rank function condivisa; param `p_admin_override` / `p_force_replace` su RPC admin; automatic paths passano `allow_downgrade=false`.

**PAROLE SEMPLICI:** oggi il sistema non sa dire in modo strutturato «questa foto è dello Sponsor»; spesso registra «Admin» anche quando non lo è.

---

### 27.3 `saveSinglePoi` — chi chiama e rischio priorità

| Caller | Immagine? | Origin oggi | Origin atteso (futuro) |
|--------|-----------|-------------|-------------------------|
| `AdminModals` / `PoiMediaTab` | Sì | `admin` | admin (OK se upload admin) |
| `usePoiActions` (clear image) | revoca | `admin` | admin |
| `useAiValidation` / Bonifica | raro URL | `admin` | **ai** o testo-only |
| `useAiMagicCity` / Flash / Targeted | nuovo POI | `admin` | spesso **senza** foto |
| `AnomalyInspector`, `RegionalAnalysisModal`, `CityAuditModal` | variabile | `admin` | per origine reale |
| `Observatory` save | sì possibile | `admin` | **BLOCCO** se merge-first policy |

**Rischio:** qualsiasi save con URL **sostituisce** primary RPC **senza** guard D-22 → AI/Admin può battere Sponsor se non gated.

---

### 27.4 Enforcement priorità (automatico vs Admin)

**Automatico:** Wikimedia POI (futuro), Community materialize, AI portrait/generator, placeholder resolver — **devono** rifiutare se rank inferiore al primary attivo.

**Manuale Admin:** sostituzione esplicita con audit in `entity_image_history`.

**DOVE:** RPC server-side (fonte verità), **non** solo UI.

---

### 27.5 Sponsor + Digital Shop + Guide/Tour (DECISIONE)

Regole complete in §24.6 e prompt proprietario §6–8. **FATTO:** dominio sponsor/subscription esiste (`sponsors`, `subscriptions`, `activate_sponsor_*`); **manca** intero layer immagini commerciali.

**INT-SPONSOR-01:** modello `sponsor_poi_images` (o assignment multipli role `sponsor_gallery`) + quota per `tier`/`type` + UI partner + primary flag + `PoiImageSection`.

**INT-SHOP-SPONSOR-01:** 10 foto `shop_products`/spazio shop + 10 POI — **isolamento** shop: nessun fallback POI nello spazio shop.

**Guide/Tour:** tabelle `city_guides`, `city_tour_operators`; sponsor FK — predisposto quota 3, POI futuro **non** bloccante.

---

### 27.6 Wikimedia — macrofase unica (DECISIONE)

**A)** cut dual-write **B)** UI Persona/Patrono/POI **C)** candidate/orphan **NUOVA** **D)** pulsante **E)** trigger AI — **stesso** `runCommonsDownloadPipeline` entrypoint.

**FATTO:** `verify_ai_image` = coda **AI portrait verify** (`AdminAiVerifyQueue`) — **NON** usare per candidate Wikimedia.

**INT-WM-PHASE-01:** storage candidate (tabella es. `wikimedia_image_candidates` o asset `assignment_role=pending` + stato); modale «Candidate Wikimedia»; Associa → D90; rifiuto/archivio.

---

### 27.7 `registerAiGeneratedPortraitAsset` — audit forense

| Voce | Esito |
|------|--------|
| File | `src/services/media/mediaAssetService.ts` |
| Caller attuali | **Zero** (solo definizione) |
| RPC | `upsertEntityImageAssignmentFromSource` (dual-write path) |
| Tabelle | `media_assets`, `entity_image_assignments` |
| origin | `ai` |
| Storage | bucket `public-media`, path portrait |
| Flusso UI vivo | `generateHistoricalPortrait` → upload → **`saveCityPerson` D90** |
| Collegamento AiFieldHelper / `ai_configs` | **Nessuno** |
| Dead code? | **Non eliminare** (INT-13 sospeso) |

**IPOTESI:** helper preparato per cutover unificato pre-D90 — non dimostrato oltre similarità.

---

### 27.8 AI «Generatore AI» / «Configura Strategia AI»

**FATTO VERIFICATO:**

- UI: `AiFieldHelper` — titoli **Generatore AI** / **Configura Strategia AI**; tab Valutazioni, Patrono, Generali, POI info, Storia.
- Read DB: `getAiConfig` / `getAiPrompt` su tabella **`ai_configs`** (tipi in `supabase.ts`: `key`, `prompts[]`, `selected[]`, `presets` JSON).
- Write DB: **`saveAiConfig` implementato ma nessun caller**; strategia «Applica strategia» chiama solo **`onApply` parent** (stato form), **non** persiste su DB.
- Consumer runtime: `getAiPrompt` in `aiVision.ts` (`vision_portrait_historical`, `vision_caption`), `aiPlanner.ts`, `cityContentGenerator.ts` — **funzionano se righe DB presenti**.

**Classificazione:** **B — UI parziale, persistenza CRUD assente** (non E eliminato).

**Schema DB `ai_configs`:** presente in tipi generati; **nessuna** migration `create table ai_configs` nel folder migrations grep — tabella presumibilmente **pre-esistente** su DB remoto; **contenuto righe non verificabile** senza query live.

**INT-AI-CONFIG-01:** wire `saveAiConfig` + UI add/edit/delete prompts; opzionale seed keys documentate in `AI_IMAGE_MANAGEMENT_AUDIT.md`.

---

### 27.9 Stati entità + SUSPENDED ADMIN (DECISIONE)

**FATTO codice:**

- POI: `draft`, `published`, `suspended`, `canceled`, `needs_check` (`governance.ts`).
- Persona: stesso set editoriale **senza** `needs_check`.
- Patrono: `cities.patron_editorial_status` — **solo** draft/published/suspended/canceled (migration check).
- **`suspended_admin` / SOSPESO ADMIN:** **assente** su entità e su `IMAGE_ASSET_STATUS_DB_VALUES` / `ASSIGNMENT_STATUS_DB_VALUES`.

**DECISIONE proprietario:** stati entità **SUSPENDED ADMIN**; immagini **SOSPESO ADMIN** distinto da segnalazione; UI **SOSPENDI** + motivo + audit.

**INT-SUSP-ADMIN-01:** migration enum/check + RPC + UI Admin + integrazione `content_reports` (solo dove già previsto per segnalazione).

---

### 27.10 City delete + segnalazioni + legacy report

**DECISIONE:** modal per categoria **CANCELLA DEFINITIVAMENTE** vs **CONSERVA ORFANO**; **`content_reports` SEMPRE conservati**; legacy report test **DELETE** (no export).

**FATTO:** `DeleteCityOptionsModal` — solo `keepUserPhotos`, `keepPOIs`; `deleteCity` **DELETE** massivo; **cancella** `famous_person_photo_reports` per city.

**INT-09:** RPC atomica orphan; modal estesa; FK `content_reports` → **RESTRICT** o detach con snapshot.

**INT-REP-DECOM:** drop tabelle/servizi legacy dopo rimozione FK da delete person.

---

### 27.11 Backfill — inventario chiusura (zero «forse»)

| Elemento | Classe |
|----------|--------|
| Primary person/poi/patron da legacy → assignment | **CHIUSO / MIGRATO** |
| 255 POI placeholder → non media asset | **INTENZIONALMENTE ESCLUSO** |
| `city_patron_gallery` righe | **DA CORREGGERE** (INT-11) |
| Dual-write Community/Wikimedia | **DA DECOMMISSIONARE** (INT-06/07) |
| `patron_details.imageUrl` JSON SoT | **DA DECOMMISSIONARE** (INT-05) |
| Sponsor POI images | **DA IMPLEMENTARE** |
| Wikimedia candidate store | **DA IMPLEMENTARE** |
| Legacy report tables (test) | **DA ELIMINARE — TEST** (INT-REP-DECOM) |
| Merge transfer `verified_real` | **NON RAGGIUNGIBILE / RIMOSSO** |
| Merge immagini victim→survivor | **DA CORREGGERE** (regola IV-BIS; SQL oggi trasferisce) **INT-MERGE-IMG-01** |
| `registerAiGeneratedPortraitAsset` | **SOSPESO** (INT-13) |
| Rigenerazione `supabase.ts` | **ULTIMO STEP** (INT-14) |

---

### 27.12 `supabase.ts` + boundary mf2/mf3/mf4

**FATTO:** client temporanei (`mf2DbClient`, `mf3DbClient`, `mf4DbClient`) usati per tabelle/RPC non ancora nel tipo rigenerato (reports, media_assets, reconcile merge).

**Rischio post-rigenerazione:** cast obsoleti, RPC names mismatch; **non** rigenerare finché migration enum sponsor/suspended_admin non applicate.

**Verifica:** `npm run check` + grep zero `mf4Rpc` superfluo.

---

## 19. Piano di sviluppo (2026-09-26 III)

| ID | Stato | COSA | DOVE (principale) |
|----|-------|------|-------------------|
| INT-01 | ATTIVO | Priorità D-22 + `sponsor` + guard RPC | migrations, `governance.ts`, upsert POI RPC |
| INT-01b | ATTIVO | Provenance UI POI (+ patron/person dove serve) | `PoiMediaTab`, read services |
| INT-02 | **RIMOSSO** | verified_real merge | — |
| INT-03 | **RIMOSSO (IV)** | Intervento generico edge-case merge | — |
| INT-MERGE-IMG-01 | ATTIVO | Merge: **no** trasferimento immagini victim; solo survivor Flusso 1 | `reconcile_poi_image_assignments_for_merge`; §30.1 |
| INT-SPONSOR-MINMAX-01 | ATTIVO | Min/max foto adesione + server validation + galleria | §30.3 |
| INT-SPONSOR-NOTIF-01 | ATTIVO | Notifica proprietario foto Sponsor sospesa | `addNotification`; §30.4 |
| INT-SPONSOR-PRIMARY-02 | ATTIVO | Primary auto semplice + scelta manuale protetta | §30.4 |
| INT-SAFE-ART-RESTORE-01 | ATTIVO | Ripristino Safe-Art autonomo (post-decisione scope) | §30.15–30.16 |
| INT-04 | ATTIVO | Sospensione immagine + note | RPC/UI/history |
| INT-SUSP-ADMIN-01 | ATTIVO | SUSPENDED ADMIN entità + SOSPESO ADMIN immagine | enums, RPC, Admin UI |
| INT-SPONSOR-01 | ATTIVO | Quote tier + galleria POI | DB, sponsor UI, `poiMapper`, `PoiImageSection` |
| INT-SHOP-SPONSOR-01 | ATTIVO | Digital Shop: grande 1–5 + piccola 1–10 (max 15) | `BusinessShopManager`, sponsor type shop |
| INT-WM-PHASE-01 | ATTIVO | Wikimedia: D90 + UI + candidate + AI trigger | `commonsDownloadPipeline`, nuovi componenti |
| INT-05 / INT-11 | ATTIVO | Patron atomico + gallery SoT | `cityWriteService`, patron RPC |
| INT-06 / INT-07 | ATTIVO | Community/Wikimedia linkage only | `photoService`, pipeline |
| INT-08 / INT-REP-DECOM | ATTIVO | Segnalazioni + drop legacy test | Dashboard, services, migrations |
| INT-09 | ATTIVO | City orphan + modal per categoria | `DeleteCityOptionsModal`, RPC |
| INT-AI-CONFIG-01 | ATTIVO | Persistenza `ai_configs` | `AiFieldHelper`, `saveAiConfig` |
| INT-13 | SOSPESO | registerAi portrait | `mediaAssetService.ts` |
| INT-14 / INT-15 | ATTIVO | supabase.ts + E2E | fine catena |

---

## 20. Ordine operativo definitivo (proposta)

1. **INT-01 + INT-01b** (D-22 — base legge priorità)  
2. **INT-SPONSOR-01 + INT-SHOP-SPONSOR-01 + INT-SPONSOR-MINMAX-01**  
3. **INT-SUSP-ADMIN-01 + INT-04 + INT-SPONSOR-NOTIF-01 + INT-SPONSOR-PRIMARY-02**  
4. **INT-WM-PHASE-01**  
5. **INT-06, INT-07**  
6. **INT-05, INT-11**  
7. **INT-08, INT-REP-DECOM**  
8. **INT-09** (solo **admin_all** + RPC guard)  
9. **INT-MERGE-IMG-01**  
10. **INT-AI-CONFIG-01** (label **«CONFIGURA GENERATORE AI»**)  
11. **INT-SAFE-ART-RESTORE-01** (autonomo da altre sezioni AI)  
12. **INT-13** — **sospeso** (decisione post §30.13)  
13. **INT-14 → INT-15**  

Catena: **implementazione → verifica → decommission → supabase.ts → E2E**. **No** re-backfill globale.

---

# STATO REALE DOPO AUDIT — 2026-09-26

| Cat | Contenuto |
|-----|-----------|
| **A. CHIUSO** | Backfill primary scope; Persona delete D90; isolamento shop base; pipeline Commons Persona |
| **B. NON RAGGIUNGIBILE / RIMOSSO** | INT-02 verified_real merge |
| **C. INTENZIONALMENTE ESCLUSO** | 255 POI placeholder → media asset |
| **D. DA IMPLEMENTARE** | INT-01, 01b, 04, 05, 06, 07, 08, 09, 11, WM-PHASE, SPONSOR, SHOP-SPONSOR, SUSP-ADMIN, AI-CONFIG, **INT-MERGE-IMG-01** |
| **E. DA DECOMMISSIONARE** | dual-write; patron JSON SoT; legacy report operativi |
| **F. DA ELIMINARE — TEST** | righe `famous_person_photo_reports`, `patron_photo_reports` (dati test proprietario) |
| **G. BLOCCO / DECISIONE** | INT-13 post §30.13; preset Safe-Art se DB vuoto (§30.16) |
| **H. RISCHI** | `saveSinglePoi` downgrade; deleteCity CASCADE reports; enum sponsor breaking RPC |
| **I. DECISIONI APPROVATE** | D-22 priorità 6 livelli; quote sponsor; Wikimedia candidate separata; content_reports SoT; city registry permanente |
| **J. NON DIMOSTRABILE SENZA DB LIVE** | row count legacy reports; contenuto `ai_configs.*`; testo `admin_manual_cities` |

---

# PIANO OPERATIVO DEFINITIVO

Per ogni INT: **COSA / PERCHÉ / COME / DOVE / DIPENDENZE / RISCHI / TEST / CRITERIO CHIUSURA** — dettaglio §27 e §19. Sequenza §20.

---

# PROBLEMI CHE POTREBBERO ROMPERE ALTRE FUNZIONALITÀ

| # | Cosa si rompe | Perché | Percorso UI | Soluzione proposta | Decisione |
|---|---------------|--------|-------------|-------------------|-----------|
| 1 | Primary Sponsor perso | INT-01 non applicato; saveSinglePoi sempre admin | Media POI salva dopo sponsor | Guard RPC + origin sponsor | Implementare INT-01 prima sponsor write |
| 2 | Foto POI eliminato appaiono su POI mantenuto | RPC merge **trasferisce** primary victim (§29.1) | Osservatorio Deduplica | **INT-MERGE-IMG-01** — revoca victim, survivor invariato | Regola IV-BIS **chiusa**; sviluppo pianificato |
| 3 | Segnalazioni perse | DELETE city CASCADE | deleteCity | INT-09 RESTRICT reports | Obbligo conservazione |
| 4 | Delete person bloccato | FK legacy reports | delete persona | INT-REP-DECOM prima | Ordine decommission |
| 5 | Shop foto sostituite da POI | coupling errato | — | INT-SHOP isolamento | Già decisione |
| 6 | Enum `sponsor` | migration su origin_type | — | migration additiva + backfill rank | Test RPC |
| 7 | `supabase.ts` early | tipi desincronizzati | — | INT-14 ultimo | Non rigenerare ora |

**Nessuna** soluzione sopra va implementata senza conferma dove indicato **BLOCCO**.

---

# IN PAROLE SEMPLICI / COSA ABBIAMO SCOPERTO (26/09/2026, audit III)

**Priorità foto POI (deciso):** prima lo **Sponsor**, poi l’**Admin**, poi foto **vere/Wikimedia**, poi **Community**, poi **AI**, infine **segnaposto**. Una fonte «debole» non deve sostituire da sola una «forte»; l’Admin può sempre intervenire.

**Wikimedia:** sui **Personaggi** si attiva dopo l’import, nella finestra **Conferma Wikidata / Commons**. Su **Patrono** e **POI** manca ancora l’interfaccia; è deciso che POI avrà lo **stesso motore** con pulsante e con l’AI che lo avvia uguale. Le foto Wikimedia **in attesa di scelta** saranno una **funzione nuova** (non la coda «verifica AI»).

**Sponsor:** conteggi **10/5/3/3** e galleria POI sfogliabile sono **regole approvate** ma **non nel programma** oggi; il negozio digitale avrà **10 foto sue + 10 sui POI**, separate.

**Merge duplicati:** due flussi (§29.1): di solito import → Deduplica **senza** foto; oppure prima **Media** (Flusso 1) poi Deduplica. **Regola:** dopo il merge restano **solo** le foto già sul POI **mantenuto**; le foto del POI **eliminato** **non** passano all’altro. Il programma oggi **non** rispetta ancora questa regola → intervento **INT-MERGE-IMG-01** (INT-03 resta tolto).

**Città eliminata:** l’ID resta nel **registro**; vogliamo scegliere cosa **cancellare** e cosa **tenere orfano**; le **segnalazioni** non si devono mai perdere.

**Segnalazioni:** restano solo quelle **nuove** (`content_reports`); le vecchie tabelle test **vanno eliminate**.

**Sospensione Admin:** vogliamo poter mettere **sospeso dall’Admin** (senza segnalazione) su contenuti e foto — **non c’è ancora** nel database.

**Criteri AI:** il pannello **c’è** e legge il database, ma **non salva** le modifiche alle strategie.

---

---

## 28. ADDENDUM AUDIT IV — 2026-09-26

### 28.1 INT-03 — Percorso «foto Media → merge» (verifica UI reale)

**DECISIONE proprietario (contesto):** dubita che il percorso problematico sia praticabile dopo import.

**RISULTATO AUDIT:** il percorso **è possibile** nel codice attuale, ma **non è un flusso continuo** Import→Merge; richiede **due area Admin** e uscita dall’editor città. **Non esiste** separazione tecnica che lo impedisca. **Flusso operativo tipico post-import** (Import → più tardi Osservatorio **senza** Edit City) → merge **senza** assignment.

#### Click path verificato (Admin)

| # | Schermata | Click / azione |
|---|-----------|----------------|
| 1 | Sidebar Admin → **Manager & Import POI** (`AdminDashboard` `view=osm_import` → `ImportDashboard`) | **SEND TO DB (BOZZE)** → `promoteToLive` (POI senza immagine) |
| 2 | Sidebar Admin → **Manager POI - DB** (`view=cities` → `CitiesManager`) | Tab **Edit City** |
| 3 | `CitiesListTab` | Icona **modifica** (matita) sulla riga città → `onEdit(cityId)` |
| 4 | **`AdminCityEditor`** (sostituisce `CitiesManager` finché aperto) | Tab **Punti Interesse** (`TabPois` → `AdminPoiManager`) |
| 5 | Lista POI | Apri POI → **`AdminPoiModal`** |
| 6 | Modale POI | Tab **Media** → `PoiMediaTab` / `AdminImageInput` → **Carica file** o **Link URL** → salva modale |
| 7 | Backend | `onSave` → **`saveSinglePoi`** → RPC **`save_poi_with_image_assignment`** → primary assignment (`p_origin_type: 'admin'`) |
| 8 | `AdminCityEditor` | **Indietro** (`onBack`) → torna a **`CitiesManager`** |
| 9 | `CitiesManager` | Tab **Osservatorio Dati** |
| 10 | `ObservatoryLayout` | Sub-tab **Deduplica** |
| 11 | `DuplicateResolver` | Select città → **Cerca Duplicati** → freccia **Mantieni A, Fondi B in A** (o viceversa) |
| 12 | Backend | **`merge_pois_observatory_atomic`** → **`reconcile_poi_image_assignments_for_merge`** |

**Punto immagini nel problema:** step **12** (solo se step **7** eseguito prima per almeno uno dei due POI).

**Percorsi alternativi step 6–7:** Osservatorio → **Anomalie** → `AnomalyInspector` → stesso **`AdminPoiModal`** → Media (stesso `saveSinglePoi`).

**Cosa NON esiste:** pulsante «Modifica foto» dentro **`DuplicateResolver`**; link diretto Import → Media → Deduplica senza cambiare sidebar/view.

**Stato INT-03 (IV-BIS):** **RIMOSSO** — nessun progetto generico «transfer merge». **IV-BIS:** la RPC **`reconcile_poi_image_assignments_for_merge`** **trasferisce** ancora immagini victim → survivor → **DISCREPANZA** con regola proprietario → **INT-MERGE-IMG-01** (piano §29.1). Allineamento priorità merge a D-22 **non necessario** se non si trasferisce più il victim.

---

### 28.2 Priorità POI D-22 — audit implementativo

| Layer | Oggi | Da cambiare |
|-------|------|-------------|
| Enum / DB | `MEDIA_ORIGIN_TYPE_DB_VALUES` senza `sponsor` | migration `media_assets.origin_type` + check |
| RPC write POI | `save_poi_with_image_assignment` sostituisce primary | rank guard + `p_admin_override` |
| RPC upsert generico | `upsert_poi_primary_image_assignment` | stesso guard |
| `saveSinglePoi` | sempre `admin` | origin dal caller; bloccare downgrade automatico |
| Dual-write / Community | `materializePhotoSubmissionAssignment` | origin `community` + guard |
| Wikimedia pipeline | `originType: 'wikimedia'` | guard + **toggle POI** (§28.4) |
| AI portrait POI | vari caller `saveSinglePoi` | origin `ai` + guard |
| Read pubblico | **un solo** primary `assignment_status=active` + asset usable | resolver gerarchia multi-livello (Sponsor gallery + primary) — **INT-01** |
| UI | nessun badge provenienza | **INT-01b** `PoiMediaTab` |
| Merge SQL | priority legacy | solo edge case (§28.1) |

**Override Admin:** RPC/UI con flag esplicito + `entity_image_history.admin_rationale`.

**Test chiusura:** matrice origini — tentativo AI su primary Sponsor → **reject**; Admin override → **ok** + audit.

---

### 28.3 Sponsor / Digital Shop / Guide / Tour — piano tecnico + UI prodotto

**DECISIONE:** quote §24.6; visualizzazione card/modal come da schermate proprietario.

| Area | Componenti attuali | Gap / intervento |
|------|-------------------|------------------|
| POI card esterna | `ShowcaseCards.tsx` — **una** `imageUrl`, no frecce | Alimentare `gallery[]`; frecce L/R; **no** zoom click |
| POI dettaglio | `PoiImageSection.tsx` — frecce se `gallery` non vuota; flip per recensioni, **no lightbox** su click foto | Lightbox/ingrandimento su click immagine (interno); frecce già parziali |
| Tour Operator | `CityTourOperatorsTab.tsx` — **una** `operator.imageUrl`, no galleria basso | Galleria basso modal + primary + swipe + lightbox |
| Guide | `CityGuidesTab.tsx` — analogo | Stesso pattern Tour |
| Admin sponsor | `SponsorManager`, `SponsorForm` | Upload multiplo, quota tier, scelta primary |
| DB | `sponsors` senza colonne foto | tabelle assignment/galleria + link POI/shop/guide/operator |
| POI read | `poiMapper` `gallery: []` | popolare da sponsor/shop POI pool |
| Digital Shop | `shop_products` + POI pool | grande **1–5**, piccola **1–10** (max **15** shop); POI sponsor **1–10** (**INT-SHOP-SPONSOR-01**) |

**Quota enforcement:** RPC `check_sponsor_media_quota` (nuova) chiamata pre-upload; UI errore chiaro.

**Test:** upload 11° foto Gold → rifiuto; carousel 3 foto → frecce visibili mobile/desktop.

---

### 28.4 Wikimedia POI — regole prodotto IV + gap codice

**DECISIONI:**

- Stesso motore **`runCommonsDownloadPipeline`** / lookup Commons.
- **AI auto:** se tutti i controlli obbligatori OK → **nessuna** modale «Conferma» (diverso da Persona oggi con `WikidataConfirmModal` + `adminConfirmedQid`).
- **Admin manuale:** pulsante nuova ricerca; sostituisce candidato precedente; **nessuna** conferma extra oltre azione Admin; **stessi** controlli licenza (§28.5).
- **Toggle per POI** `wikimedia_enabled` (nome da definire in migration): default **OFF** per ogni POI nuovo / nuova città; OFF → asset Wikimedia **non** entra in selezione pubblica; ON → partecipa a D-22 se controlli superati.
- Toggle **non** bypassa copyright/licenza.

**STATO ATTUALE:**

- Nessun campo toggle su `pois` (grep negativo).
- Persona: **`adminConfirmedQid` obbligatorio** in pipeline (`commonsDownloadPipeline.ts` L245–250) — **incompatibile** con auto POI senza refactor (parametro «system confirmed» post-checklist).
- POI entity type già supportato in `CommonsDownloadEntityTarget`.

**INTERVENTO:** **INT-WM-PHASE-01** — wrapper POI; colonna toggle; init OFF su promote/import; resolver read rispetta toggle; UI Media: toggle + «Cerca Wikimedia» + sostituisci.

**Dipendenze:** INT-01 (gerarchia), INT-WM-PHASE-01 prima di cut dual-write Wikimedia POI.

---

### 28.5 STATO ATTUALE DELLA SICUREZZA WIKIMEDIA

**Principio proprietario (IV):** *Meglio nessuna foto che una foto dubbia.* *Al minimo dubbio → non utilizzabile automaticamente.* **REGRESSION GUARD:** nessuna modifica futura può **indebolire** controlli licenza/provenenza/attribuzione.

**Flusso reale oggi** (`wikidataLookupService` → `runCommonsDownloadPipeline`):

1. Lookup Wikidata P18 / Commons file title (Persona: post-import UI).
2. **Gate:** `adminConfirmedQid` (Persona) — assente → stop.
3. Fetch **ExtMetadata** Commons API.
4. **`parseCommonsLicenseMetadata`** — focus **CC BY 4.0** (codice **più restrittivo** della policy testuale generica «CC BY» storica).
5. Download HTTPS solo `upload.wikimedia.org`; MIME allowlist; magic bytes; max 12MB.
6. Storage **`verified/wikimedia`** vs **`wikimedia/quarantine`** in base a `isCcBy40AutoPathEligible && formatConsistent`.
7. `media_assets` + provenance patch (licenza, credit, hash, QID, blocking_reasons).
8. **`record_image_verification_run`** con griglia step; se non auto-path → **`verify_ai_image`** queue, **no** primary assignment.
9. Solo auto-path → `transition_media_asset_status` **active** + **`upsertEntityImageAssignmentFromSource`** (`wikimedia`).

| Controllo | Stato |
|-----------|--------|
| Licenza CC BY 4.0 esplicita | **PRESENTE E CORRETTO** (parser) |
| CC BY-SA / NC / ND / altre | **Bloccate** (non auto-path) |
| Provenienza Commons page | **PRESENTE** |
| Attribuzione / autore | **PRESENTE** (blocca auto-path se incompleta) |
| Identità file / MIME | **PRESENTE** |
| Diritti persona / privacy / marchi / beni culturali (step checklist) | **ASSENTE come valutazione automatica** → `not_applicable` in pipeline |
| «Commons = libera» | **NON assumuto** — quarantena se non CC BY 4.0 verified |
| Dubbio / dati mancanti | **Fail-closed** → quarantena + no assignment |
| Admin selezione manuale foto non ammissibile | **Oggi Persona:** solo proposte post-QID; **futuro POI:** Admin sceglie solo tra candidati **già passati** parser (decisione IV) |

**Gap vs decisione POI auto senza conferma:** serve **`adminConfirmedQid` equivalente = true solo dopo checklist** (non modale umana).

**POI futuro:** stessi step; **nessuna** pipeline semplificata; toggle OFF ≠ skip controlli.

---

### 28.6 Community (INT-06) — conferma audit

**Mantenere:** moderazione approve/reject, `photo_submissions` lifecycle.

**Eliminare/decommission:** dual-write legacy in **`materializePhotoSubmissionAssignment`** (`photoService.ts`) → solo D90 assignment `origin community`.

**Test:** approve → assignment active; reject → nessun assignment; rollback submission intact.

---

### 28.7 Patrono (INT-05) — dati vs foto

**DECISIONE IV:** salvataggio **dati Patrono sempre**; foto fallita → placeholder + messaggio Admin.

**OGGI:** `saveCityDetails` PATCH **sempre**; RPC immagine in **try/catch** che **logga** e **non** propaga errore (`cityWriteService.ts` L76–91) — **dati salvati, foto può fallire in silenzio** (manca toast proprietario).

**DA FARE:** messaggio UI esplicito; eliminare JSON `patron_details.imageUrl` come SoT; RPC atomica opzionale target.

---

### 28.8 Segnalazioni test (INT-REP-DECOM) — decisione chiusa

**DECISIONE:** tutte le righe attuali in `famous_person_photo_reports` / `patron_photo_reports` = **test** → **DELETE**; **no export**.

**Piano esecuzione (futuro):** 1) rimuovere insert/badge da `famousPersonPhotoReportService`, `patronPhotoReportService`, `AdminDashboard` counts; 2) migrare conteggi a **`content_reports`**; 3) DROP FK-safe tabelle legacy; 4) verificare delete person non bloccato.

**Oggi:** `deleteCity` **cancella** legacy reports per city — da invertire con conservazione `content_reports` (INT-09).

---

### 28.9 SUSPENDED ADMIN (INT-SUSP-ADMIN-01)

**DECISIONE:** stato distinto; foto sospesa non pubblica; fallback D-22; galleria Sponsor: altre foto Sponsor valide restano.

**OGGI:** `assignment_status` `active|suspended|removed|replaced`; **`suspended_admin` assente**; read primary solo **`active`** (`entityPrimaryImageReadService.ts` L147).

**Gap:** enum asset/assignment; RPC sospensione con motivo; UI **SOSPENDI**; resolver **multi-primary Sponsor** non esiste → con galleria Sponsor, quale immagine mostrare?

**DECISIONE D-29 (Audit VII — CHIUSA, sostituisce formulazione `sort_order` prima):** tra le foto Sponsor **valide**, la primary automatica segue **l’ordine di caricamento** (`created_at ASC` dell’assignment/riga Sponsor, tie-break `assignment_id` / `media_asset_id ASC`). Alla sospensione della primary → la **successiva per ordine di caricamento**; se esaurite le Sponsor valide → **cascata D-22** (§32.2). **Non** scelta casuale.

---

### 28.10 City delete (INT-09) + categorie modale

**DECISIONE:** modale unica — per categoria **CANCELLA** vs **CONSERVA ORFANO**; **`content_reports` sempre conservati**.

**OGGI:** `DeleteCityOptionsModal` — solo `keepUserPhotos`, `keepPOIs`; shop **sempre cancellati**; `deleteCity` sequenziale non atomico.

**DA FARE:** estendere opzioni (Personaggi, POI, Patrono, Eventi, Servizi, Guide, Operatori, Shop, Community, immagini/history); RPC atomica; **RESTRICT** su reports.

---

### 28.11 AI config locale (INT-AI-CONFIG-01) — IV

**DECISIONE (IV-BIS — CHIUSA):** **no** schermata globale; config **per sezione**; label uniforme obbligatoria: **«CONFIGURA GENERATORE AI»** (sostituisce varianti «strategia» / «Configura AI (sezione)»).

**Punti `AiFieldHelper` verificati:**

| Sezione | File | `fieldId` / dbKey |
|---------|------|-------------------|
| Generali città | `TabGeneral.tsx`, `EditorGeneral.tsx` | vari |
| Valutazioni | `TabRatings.tsx`, `EditorRatings.tsx` | `ratings_strategy` + `isStrategyConfig` |
| Storia | `CultureHistory.tsx` | history keys |
| Patrono | `CulturePatron.tsx` | `patron_strategy` |
| POI info | `PoiInfoTab.tsx` | field-specific |
| Persona | `CulturePersonCard.tsx` | field-specific |

**Oggi:** `getAiConfig` / `getAiPrompt` **leggono** `ai_configs`; **`saveAiConfig` mai chiamato**; strategia «Applica strategia» → solo `onApply` parent.

**DOPO:** modale/pannello per sezione → CRUD istruzioni → **`saveAiConfig(`ai_config_${fieldId}`)`**; consumer esistenti (`aiVision`, `cityContentGenerator`, `aiPlanner`) già usano `getAiPrompt`.

---

### 28.12 INT-13 — spiegazione semplice (non decidere eliminazione)

1. **Cos’è:** intervento piano etichetta **INT-13** = funzione codice **`registerAiGeneratedPortraitAsset`** in `mediaAssetService.ts`.
2. **Cosa fa:** dopo upload storage portrait AI, crea/aggiorna **`media_assets`** + **`entity_image_assignments`** con `origin_type: ai`.
3. **Dove usata:** **da nessuna parte** (zero import/caller in `src/`).
4. **Flusso vivo:** **`generateHistoricalPortrait`** + upload + **`saveCityPerson` D90**.
5. **Perché in piano:** ipotesi helper unificato pre-D90; audit «dead code» — **sospeso** finché non chiude INT-AI-CONFIG-01.
6. **Se eliminata:** nessun effetto immediato UI; perdita helper se si volesse riattaccare portrait AI senza D90.
7. **Alternativa funzionante:** **sì** — D90 person save.
8. **Necessaria?** **Non** per runtime attuale; **forse** per consolidamento futuro — **decisione proprietario dopo** INT-AI-CONFIG-01.

---

### 28.13 Chiusura DB / tipi / test (solo piano, esecuzione a fine sviluppo)

| Fase | Cosa |
|------|------|
| Migration | `sponsor` origin; `suspended_admin`; toggle Wikimedia POI; tabelle galleria sponsor; city orphan RPC; drop legacy reports |
| Dati | DELETE test reports; **no** re-backfill primary |
| `supabase.ts` | **INT-14 ultimo** dopo migration apply |
| Gate | `npm run check` |
| Smoke | save POI origin guard; Wikimedia auto fail-closed; toggle OFF; Community approve |
| E2E | Import → dedupe; Sponsor carousel; Patrono save senza foto; city delete conserva reports |
| Live DB | verify zero legacy report badges |
| A11y/mobile | frecce carousel touch; modale AI config |
| Sicurezza | RLS sponsor shop; Admin-only AI config |

**Audit finale pre-release (IV):** riesaminare repo intero Image Management — nessun dual-write; priorità D-22; Wikimedia regression guard.

---

# IN PAROLE SEMPLICI / COSA ABBIAMO SCOPERTO (audit IV)

**Merge e foto:** Flusso 1 = foto dal **Media** del POI; Flusso 2 = **Osservatorio → Deduplica**. Dopo il merge **restano solo le foto del POI che tieni**; quelle del POI eliminato **non** si spostano. Oggi il codice **può ancora spostarle** → correzione prevista (**INT-MERGE-IMG-01**).

**Wikimedia POI:** stessi controlli rigidi di oggi; l’AI potrà applicare la foto **senza** chiedere conferma **solo** se passa tutti i controlli; ogni POI avrà un interruttore **Wikimedia OFF/ON** (tutti **OFF** all’inizio).

**Sicurezza foto:** preferiamo **nessuna foto** piuttosto che una foto **dubbia**; Commons non basta da solo — serve **CC BY 4.0** verificata nel codice attuale.

**Segnalazioni vecchie:** sono **solo test** e **andranno cancellate**; resterà il sistema nuovo.

**Patrono:** si salvano **sempre i testi**, anche se la foto fallisce.

---

---

## 29. ADDENDUM AUDIT IV-BIS — 2026-09-26

### 29.1 Merge POI — due flussi + regola immagini (DECISIONE CHIUSA)

**FLUSSO 1 (arricchimento immagini POI):** Import/creazione POI → **Manager POI - DB** → **Edit City** → POI → tab **Media** → associazione immagini (`saveSinglePoi` / Flusso 1).

**FLUSSO 2 (deduplica):** **Osservatorio Dati** → **Deduplica** → merge (`merge_pois_observatory_atomic`).

**Lifecycle normale (prodotto):** creazione/import → (opz.) arricchimento Flusso 1 → (opz.) merge Flusso 2.

**INT-03:** resta **RIMOSSO** (nessun intervento generico «transfer merge»). **Nuovo requisito:** **INT-MERGE-IMG-01** (sotto).

**REGOLA DEFINITIVA MERGE — IMMAGINI:**

- Restano **solo** le immagini già associate al **POI mantenuto (survivor)** tramite Flusso 1.
- **Non** trasferire al survivor le immagini del POI **eliminato (victim)**.
- Se il survivor ha galleria Sponsor (futuro), **tutte** le foto Sponsor valide del survivor restano (nessuna perdita per effetto merge).
- Il merge **non** è un trasferimento generico di tutte le immagini dei due POI.

**FATTO VERIFICATO — codice attuale NON coerente:**

In `reconcile_poi_image_assignments_for_merge` (`20260924183300_…sql`, L395–439), se il victim ha primary attiva e (survivor senza primary **oppure** priorità origin victim > survivor), esegue **`upsert_poi_primary_image_assignment`** sul survivor con i dati del **victim** → **trasferimento esplicito** immagine eliminato → mantenuto.

**DISCREPANZA:** viola regola proprietario IV-BIS.

| Campo piano | Valore |
|-------------|--------|
| **ID** | **INT-MERGE-IMG-01** |
| **COSA** | Merge: revocare assignment victim; **non** copiare primary/media victim su survivor |
| **COME** | Migration SQL: rimuovere blocco `v_should_transfer` / upsert da victim; mantenere revoca victim + DELETE poi; survivor invariato lato immagini |
| **DOVE** | `supabase/migrations/…reconcile_poi_image_assignments_for_merge.sql`; doc footer DuplicateResolver (testo «sposterà foto» da allineare) |
| **DIPENDENZE** | D-22 non richiede priority merge se non si trasferisce |
| **RISCHI** | Survivor senza foto resta senza foto dopo merge (corretto per regola) |
| **NON modificare ora** | codice/migration |
| **TEST** | Merge A+B: A con foto Flusso 1, B con foto → dopo merge A **solo** foto A; B revocata, **nessuna** foto B su A |
| **Chiusura** | Test verde + assenza upsert victim→survivor in SQL |

---

### 29.2 D-22 — piano operativo INT-01 / INT-01b (COSA · COME)

| COSA ottenere | COME (tecnico) | DOVE | Test chiusura |
|---------------|----------------|------|---------------|
| Origine **Sponsor** riconoscibile | Enum `sponsor` su `media_assets.origin_type`; writer sponsor galleria | migration + `governance.ts` | asset salvato con origin sponsor |
| Gerarchia centralizzata | Funzione rank condivisa (6 livelli D-22) | SQL + TS mirror | rank(A)>rank(B) |
| No downgrade automatico | RPC rifiuta incoming se rank inferiore senza `p_admin_override` | `save_poi_with_image_assignment`, upsert POI, materialize community, pipeline Wikimedia/AI | AI non sovrascrive Admin |
| Override Admin | Flag esplicito + history `admin_rationale` | RPC + `AdminImageInput` | Admin sostituisce Sponsor con audit |
| Provenance UI | Badge origine in Media POI | `PoiMediaTab`, read service | Admin vede «Sponsor», ecc. |
| Pubblico | Resolver multi-livello (primary + galleria sponsor + fallback D-22) | `entityPrimaryImageReadService`, `resolvePoiDisplayImageUrl` refactor | utente vede foto corretta |
| Flussi auto | Wikimedia/Community/AI chiamano stesso guard | servizi esistenti + wrapper POI | stesso test downgrade |

**NON cambiare:** moderazione Community; controlli Wikimedia.

---

### 29.3 Sponsor — INT-SPONSOR-01 / INT-SHOP-SPONSOR-01

**Quote (definitive audit VI — min/max):** Gold POI 1–10, Silver POI 1–5, Guida 1–3, Tour Operator 1–3; Digital Shop **grande 1–5**, **piccola 1–10** (max **15** totali shop); POI sponsor 1–10. Dettaglio §31.3.

| COSA | COME | DOVE |
|------|------|------|
| Quota upload | RPC/contatore pre-insert | sponsor service + UI partner |
| Galleria POI collegata | assignment multipli + `poiMapper.gallery` | DB + `PoiImageSection`, `ShowcaseCards` |
| Shop separato da POI sponsor | bucket/path/role distinti | `shop_products` vs sponsor POI pool |
| UI card esterna | frecce L/R, **no** zoom | `ShowcaseCards` |
| UI dettaglio POI | frecce + **zoom** click | `PoiDetailModal` / `PoiImageSection` |
| Guide/Tour modale | galleria **parte bassa**, **proporzionata** (non dominante), touch-friendly | `CityGuidesTab`, `CityTourOperatorsTab` |

**Responsive:** mobile-first; `object-cover` senza deformazione; area galleria ~25–35% altezza modale (target UX, da rifinire in design).

---

### 29.4 D-29 — Primary Sponsor dopo sospensione (CHIUSA)

Vedi §28.9 aggiornato. **Implementazione:** in INT-SPONSOR-01 + INT-SUSP-ADMIN-01, funzione **`pickNextSponsorPrimaryDeterministic(galleryRows)`** con ordinamento sopra.

---

### 29.5 Wikimedia — INT-WM-PHASE-01 (sicurezza + toggle)

Principi **fail-closed**, **CC BY 4.0** auto-path (codice attuale), **REGRESSION GUARD** documentale §28.5.

| COSA | COME |
|------|------|
| Toggle OFF default | colonna POI + init su `promoteToLive` |
| AI auto senza conferma umana | solo se checklist = tutti obbligatori **verified**; parametro pipeline ≠ modale QID |
| Candidate non auto | storage dedicato; **≠** `verify_ai_image` |
| Stesso motore POI | `runCommonsDownloadPipeline` unico entrypoint |

---

### 29.6 Community INT-06 · Patrono INT-05/11 · Report INT-REP-DECOM · SUSP INT-SUSP-ADMIN-01 · City INT-09 · AI INT-AI-CONFIG-01

Sintesi **COSA/COME** (dettaglio §28.6–28.11, confermati IV-BIS):

- **Community:** solo taglio dual-write in `materializePhotoSubmissionAssignment`; approve/reject identici.
- **Patrono:** PATCH dati sempre; foto opzionale; toast «Patrono salvato… foto non salvata»; SoT assignment unica.
- **Report:** DELETE dati test legacy; badge solo `content_reports`; UI senza nomi tecniche.
- **SUSPENDED ADMIN:** stato + UI SOSPENDI + fallback D-22 + D-29.
- **City delete:** modale per categoria; testo semplice conservazione **segnalazioni** (no «content_reports» in UI).
- **AI config:** label uniforme **«CONFIGURA GENERATORE AI»**; modale per sezione; `saveAiConfig` per `ai_config_${fieldId}`.

#### 29.7 Community (INT-06) — DECISIONE CHIUSA

| | |
|--|--|
| **COSA** | Un solo percorso di materializzazione assignment POI da submission Community; moderazione invariata |
| **COME** | Rimuovere dual-write legacy; approve/reject stessi RPC; stessi stati submission |
| **DOVE** | `photoService` / `materializePhotoSubmissionAssignment` |
| **NON cambiare** | UI moderazione, criteri accettazione, notifiche utente |
| **TEST** | Approve/reject prima/dopo = stesso esito visibile; nessuna seconda primary fantasma |
| **Chiusura** | Zero scrittura su path legacy POI image |

#### 29.8 Patrono (INT-05 / INT-11) — DECISIONE CHIUSA

| | |
|--|--|
| **COSA** | Testi/dati Patrono **sempre** salvati; foto opzionale; placeholder se foto fallisce; messaggio Admin chiaro |
| **COME** | Transazione: PATCH dati indipendente da upload; assignment SoT unica; deprecare `patron_details.imageUrl` come SoT |
| **DOVE** | `cityWriteService`, tab Patrono, RPC patron gallery |
| **TEST** | «Patrono salvato senza foto» + toast esplicito |
| **Chiusura** | Nessun rollback dati per errore foto |

#### 29.9 Segnalazioni (INT-REP-DECOM / INT-08) — DECISIONE CHIUSA

| | |
|--|--|
| **COSA** | SoT operativo = **`content_reports`**; tabelle legacy test **eliminate** al decommission; nessun doppio conteggio badge |
| **COME** | Migrazione DELETE dati test (non export); redirect lettura/scrittura; rimuovere badge su legacy |
| **NON fare** | Nuovi flussi su `famous_person_photo_reports` / `patron_photo_reports` |
| **TEST** | Segnalazione POI/persona → solo `content_reports`; badge dashboard coerente |

#### 29.10 SUSPENDED ADMIN (INT-SUSP-ADMIN-01 / INT-04) — DECISIONE CHIUSA

| | |
|--|--|
| **COSA** | Admin sospende immagine **senza** segnalazione; nascosta al pubblico; resta in storico; fallback D-22; nuova primary Sponsor **D-29** |
| **COME** | `assignment_status=suspended` + note; RPC trusted; UI SOSPENDI in Media; resolver pubblico esclude suspended |
| **TEST** | Sospensione → pubblico non vede; storico conservato; prossima fonte valida per D-22 |

#### 29.11 City delete (INT-09) — DECISIONE CHIUSA

| | |
|--|--|
| **COSA** | Modale unica: per categoria **CANCELLA** o **CONSERVA ORFANO**; città in registro; **segnalazioni mai cancellate** |
| **COME** | RPC atomica; RESTRICT/CASCADE selettivo; copy UI semplice (es. «Le segnalazioni… conservate e ricollegabili…») — **no** termine `content_reports` in UI |
| **TEST** | Delete parziale; reports sopravvivono; rigenerazione città possibile |

#### 29.11b AI config (INT-AI-CONFIG-01) — DECISIONE CHIUSA

| | |
|--|--|
| **COSA** | Pannello config **nella sezione** che usa l’AI; CRUD persistito; label **«CONFIGURA GENERATORE AI»** |
| **COME** | Modale da `AiFieldHelper`; `getAiConfig` / `saveAiConfig`; chiavi `ai_config_${fieldId}`; permessi Admin; mobile/a11y |
| **TEST** | Salvataggio sopravvive refresh; generatore legge config aggiornata |

---

### 29.12 INDAGINE SAFE-ART / INT-13 (sintesi IV-BIS — dettaglio Audit V §30.13–30.16)

| # | Esito |
|---|--------|
| 1 | **Cos’è:** generatore immagini AI per **Hero / Asset Globali** (non Image Management POI/Persona). |
| 2 | **Componente:** `SafeArtPanel.tsx`; tab **Safe-Art Gen** in `HeroSection.tsx` → `AdminHeaderManager` → Admin **Asset Globali** (`view=design_assets`). |
| 3 | **Pulsante:** **Genera Safe-Art** → `generateImage()`. |
| 4 | **Perché «non succede nulla»:** UI **guttata** — mancano input prompt/stile; `genPrompt` resta `''`; bottone **`disabled={!genPrompt.trim()}`** (L82). |
| 5 | **Pannello config stile:** **non presente** nel JSX attuale (commenti «UI SAME AS BEFORE» / «rest of UI» rimossi). |
| 6 | **DB:** `STYLES.city_real.dbKey = 'safe_art_city_real'` — **nessun** `getAiConfig`/`saveAiConfig` chiamato in `SafeArtPanel`. |
| 7 | **Coincide con ricordo proprietario?** **Parzialmente** — intento prompt/stile c’era (state `styleMode`, `currentInstruction`, `dbKey`); **implementazione UI+ persistenza assente**. |
| 8 | **`registerAiGeneratedPortraitAsset`:** **NON collegato** — Safe-Art usa `uploadPublicMedia(..., 'ai_generated')` + callback hero settings, **non** entity assignment portrait. |
| 9 | **`ai_configs`:** chiave `safe_art_city_real` **prevista** ma **non letta/scritta** dal panel attuale. |
| 10 | **UI scollegata:** sì — refactor ha lasciato solo bottone generate. |
| 11 | **Recuperabile:** logica generate + gateway **sì**; UI stili + load/save config **da ricostruire**. |
| 12 | **Distinto da INT-AI-CONFIG-01:** **sì** — Safe-Art = asset piattaforma/hero; INT-AI-CONFIG-01 = generatori testo/sezioni editor città. Possibile **riusare stesso pattern** modale+`saveAiConfig`. |
| 13 | **Decisioni proprietario dopo indagine:** (a) ripristinare Safe-Art config? (b) unificare sotto «CONFIGURA GENERATORE AI»? (c) INT-13 resta **sospeso** (non correlato a Safe-Art). |

**INT-13:** resta **INDAGINE / NESSUNA DECISIONE** — non eliminare `registerAiGeneratedPortraitAsset`.

---

## DECISIONI — RIEPILOGO IV-BIS

### A. DECISIONI CHIUSE

D-22 priorità 6 livelli; quote Sponsor; UI gallerie/proporzioni; D-29 primary Sponsor deterministica; Wikimedia fail-closed + toggle; Community linkage only; Patrono save dati; report test DELETE; SUSPENDED ADMIN; city delete modale + segnalazioni conservate; label **CONFIGURA GENERATORE AI**; merge immagini **solo survivor Flusso 1** (regola); INT-03 rimosso; INT-MERGE-IMG-01 pianificato per discrepanza SQL.

### B. DECISIONI ANCORA DA PRENDERE

| Domanda semplice | Perché serve | Sistema | Se non decidi |
|------------------|--------------|---------|---------------|
| Ripristinare configurazione stile/prompt **Safe-Art Generator** (Asset Globali) come funzione separata o unificata al pattern «CONFIGURA GENERATORE AI»? | Pulsante oggi inutilizzabile; `safe_art_city_real` non persistito | `SafeArtPanel`, `ai_configs`, Hero | Safe-Art resta rotto |
| Confermare destinazione **INT-13** (`registerAiGeneratedPortraitAsset`) dopo chiusura Safe-Art vs portrait D90 | Evitare delete errato | `mediaAssetService` | INT-13 resta sospeso (OK) |

### C. INDAGINI ANCORA IN CORSO

- **Safe-Art / INT-13** — indagine §29.12 completata; **decisione prodotto** su ripristino pending (sezione B).

### D. ELEMENTI CHIUSI — NON RIAPRIRE

INT-03 come lavoro generico merge; export legacy report test; riaprire priorità D-22; bypass controlli Wikimedia; schermata AI config globale unica.

---

---

## 30. ADDENDUM AUDIT V — 2026-09-27

Audit repository-only. Ogni blocco segue: **DECISIONE · COSA · OGGI · MANCA · COME · DOVE · DIPENDENZE · RISCHI · NON MODIFICARE · TEST · CHIUSURA**.

---

### 30.1 Merge POI e immagini — INT-MERGE-IMG-01

| | |
|--|--|
| **DECISIONE** | Flusso 1 (Media POI) vs Flusso 2 (Osservatorio Deduplica). Al merge il **survivor** conserva **solo** le proprie immagini (incluso Sponsor sul survivor). **Zero** trasferimento automatico dal **victim**. INT-03 resta **RIMOSSO**. |
| **COSA** | Esempio: survivor 3 foto, victim 4 → post-merge survivor **3**, nessuna delle 4 del victim sul survivor. |
| **OGGI** | `merge_pois_observatory_atomic` → `reconcile_poi_image_assignments_for_merge` (`20260924183300_…sql`, L395–439): se victim ha primary usable e (survivor senza primary **o** survivor non usable **o** priorità victim > survivor) → **`upsert_poi_primary_image_assignment`** sul survivor con asset victim. Poi revoca assignment victim (L476–518) e DELETE POI. Chiamata TS: `poiMergeImageAssignments.ts` / `observatoryService.mergePoisInDb`. |
| **MANCA** | Ramo `v_should_transfer` / upsert victim→survivor; test E2E; copy UI merge se ancora dice «sposta foto». |
| **COME** | Nuova migration: in reconcile **eliminare** trasferimento; solo revoca victim + DELETE; survivor **invariato** lato assignment. Opzionale: revocare anche gallery victim senza copiare. |
| **DOVE** | SQL reconcile; `DuplicateResolver.tsx` (testo footer); test integrazione merge. |
| **DIPENDENZE** | Nessuna dipendenza da D-22 se non si trasferisce. |
| **RISCHI** | Survivor senza foto resta senza foto (comportamento voluto). |
| **NON MODIFICARE** | Flusso review/suggestion merge; INT-03 non reintrodurre. |
| **TEST** | Merge con entrambi POI fotografati (Flusso 1); assert **count** assignment survivor invariato; **nessun** `media_asset_id` del victim su survivor; caso **Sponsor** su victim only → survivor **non** acquisisce quelle Sponsor. |
| **CHIUSURA** | Test verde + grep SQL assenza upsert victim→survivor. |

---

### 30.2 Priorità POI D-22 — INT-01 / INT-01b

| | |
|--|--|
| **DECISIONE** | SPONSOR → ADMIN → REAL/WIKIMEDIA → COMMUNITY → AI → PLACEHOLDER; no downgrade automatico; override Admin esplicito. |
| **OGGI** | `MEDIA_ORIGIN_TYPE_DB_VALUES` (`governance.ts`) **senza** `sponsor`. `saveSinglePoi` → `p_origin_type: 'admin'` fisso (`poiWrite.ts` L120). Primary letta in `entityPrimaryImageReadService.ts` (solo `assignment_status === 'active'`). `imageAssignmentVisibilityService` esclude non-active dal pubblico. Nessun rank D-22 centralizzato in TS/SQL per upsert POI. |
| **MANCA** | Enum `sponsor`; funzione rank condivisa; guard RPC su `save_poi_with_image_assignment`, materialize community, pipeline Wikimedia/AI; provenance UI; resolver multi-livello + galleria Sponsor. |
| **COME** | Migration enum; SQL `media_origin_rank_d22(text)`; param `p_admin_override`; rifiuto incoming se rank inferiore; mirror TS per messaggi; refactor `resolvePoiDisplayImageUrl`. |
| **DOVE** | migrations; `governance.ts`; RPC POI/patron; `commonsDownloadPipeline`; `photoService.materializePhotoSubmissionAssignment`; `PoiMediaTab`, `AdminImageInput`. |
| **TEST** | Matrice 6 livelli: tentativo AI su primary Sponsor → **reject**; Community su Admin → **reject**; Admin override → **ok** + history. |
| **CHIUSURA** | `npm run check` + test integrazione rank. |

---

### 30.3 Sponsor min/max e gallerie — INT-SPONSOR-01 / INT-SHOP-SPONSOR-01 / INT-SPONSOR-MINMAX-01

| | |
|--|--|
| **DECISIONE (VI)** | Min/max §31.3: Digital Shop grande **1–5**, piccola **1–10**, max **15** shop; POI sponsor **1–10**; min adesione obbligatorio. (Storico audit V «max 10 shop» — **superato** da VI.) |
| **OGGI** | Adesione: `SponsorModal` → `useSponsorFormLogic` → `submitSponsorRequest` (`sponsorRequestsService.ts`). `coverImage` in state + UI upload (`SponsorForm.tsx`) ma **non** validato in `handleSubmit` e **non** passato a `submitSponsorRequest` (solo dati testuali). Nessun contatore min/max tier in servizi. Galleria POI sponsor / `poiMapper.gallery` non implementata come da piano. |
| **MANCA** | Validazione client+server min/max; upload immagini obbligatorie ad adesione; schema galleria multi-immagine; RPC conteggio; UI partner post-adesione; Digital Shop grande/piccola distinte. |
| **COME** | Estendere submit/activation flow: bloccare `step=success` se `< min`; RPC `assert_sponsor_gallery_bounds(tier)`; tier config centralizzata; UI modale adesione con contatore «minimo X di Y»; server reject oltre max; shop product images separate da POI pool. |
| **DOVE** | `useSponsorFormLogic`, `SponsorForm`, `BusinessShopManager`, sponsor RPC/DB (future `sponsor_gallery` / assignment), `ShowcaseCards`, `PoiImageSection`, modali Guide/Tour. |
| **RISCHI** | Confondere min adesione con «devi avere sempre N foto» — documentare copy: min solo completamento adesione. |
| **TEST** | Adesione con 0 foto → fail; con min → ok; 11° foto Gold → fail; sostituzione dopo adesione; shop 10+1 fail. |
| **CHIUSURA** | Test tier + validazione server. |

---

### 30.4 Primary Sponsor, sospensione, notifica — D-29 / D-30 / INT-SPONSOR-PRIMARY-02 / INT-SPONSOR-NOTIF-01

| | |
|--|--|
| **DECISIONE (VI)** | Admin **non** obbligato a sostituta; cascata D-22 se nessuna Sponsor/Admin valida (§31.4). Se restano più Sponsor attive → auto primary deterministica (criterio accettato). Scelta manuale owner protetta. Notifica proprietario su sospensione Sponsor (§30.4). |
| **OGGI** | Galleria Sponsor POI Image Management **non** implementata. `assignment_status` `suspended` esiste nel modello read (`assetUsageMapService`); pubblico usa solo `active` (`entityPrimaryImageReadService`). Nessuna RPC Admin «sospendi immagine» POI sponsor in UI. `addNotification` (`notificationService.ts`) usato altrove (es. `PartnerDetailModal`). `linkData` **non** prevede campo immagine — anteprima via URL in messaggio o estensione controllata metadata. |
| **MANCA** | Flag `is_primary` / `primary_locked_by_owner`; RPC suspend + auto-promote; UI scelta primary partner; notifica con `profileId` sponsor owner. |
| **COME** | INT-SUSP-ADMIN-01 + gallery: on suspend primary → `pickNextSponsorPrimary(active rows order by created_at)`; set `manual_primary=true` quando owner sceglie; auto skip se manual lock; on suspend → `addNotification(userId,'info',…, linkData profile)`. |
| **TEST** | Sospensione primary → altra foto stabile su reload; owner set primary → sospensione altra non cambia scelta; notifica ricevuta. |
| **CHIUSURA** | Test determinismo + manual lock. |

---

### 30.5 Wikimedia — INT-WM-PHASE-01 (conferma)

Piano §29.5 / §28.5 **coerente e completo**: `commonsDownloadPipeline` fail-closed CC BY 4.0; toggle POI OFF; candidate store ≠ `verify_ai_image`; REGRESSION GUARD. **Nessuna modifica decisionale.**

---

### 30.6 Community — INT-06

**DECISIONE:** moderazione invariata; solo taglio dual-write in `materializePhotoSubmissionAssignment` (`photoService.ts`). **TEST:** approve/reject identici pre/post.

---

### 30.7 Patrono — INT-05 / INT-11

**DECISIONE:** dati sempre salvati; foto opzionale Image Management. **OGGI:** `saveCityPerson` + RPC `save_city_person_with_image_assignment`; `image_url` null in payload + URL via RPC. **MANCA:** toast Admin «Patrono salvato, foto non salvata»; SoT unica assignment; deprec JSON SoT. **DOVE:** `cityWriteService`, `CulturePatron`, patron RPC.

---

### 30.8 Segnalazioni — INT-REP-DECOM / INT-08

**DECISIONE:** operativo = `content_reports`. **OGGI:** legacy `famous_person_photo_reports` / `patron_photo_reports` ancora scritti (`famousPersonPhotoReportService`, `patronPhotoReportService`); `deleteCity` **DELETE** legacy reports per city (L154–158) — **conflitto** con conservazione segnalazioni fino a decommission. **MANCA:** rimuovere badge/count legacy; DELETE dati test; nessun nuovo flusso legacy.

---

### 30.9 SUSPENDED ADMIN — INT-SUSP-ADMIN-01 / INT-04

Allineato D-22 fallback + §30.4. **MANCA:** UI SOSPENDI, RPC motivazione, enum completo.

---

### 30.10 Cancellazione città — INT-09 (solo ADMIN ALL)

| | |
|--|--|
| **DECISIONE (V)** | Operazione **solo `admin_all`**. Modale per categoria **CANCELLA** / **CONSERVA ORFANO**; identità in `cities_registry`; segnalazioni **mai** cancellate (copy semplice, no jargon DB). |
| **OGGI** | `deleteCity` (`cityLifecycleService.ts`): sequenziale, **non atomico**; **nessun** check ruolo nel servizio. `DeleteCityOptionsModal` esiste ma **nessun import** in Admin cities — **UI delete non collegata**. Toggle: `keepUserPhotos`, `keepPOIs` only. **Sempre DELETE:** `city_events`, `city_services`, `city_guides`, `city_tour_operators`, `city_people`, `shops`, legacy person reports. **Orphan:** `photo_submissions` (se keep), `pois` (se keep), sponsors via `handle_city_deleted_for_sponsors`. **Non gestito in deleteCity:** `content_reports`, patron D90 assignments espliciti, riga `cities_registry`. **Reclaim:** `reclaimOrphanedItems` per rigenerazione. |
| **Categorie effettive (da codice + modale)** | (1) Foto Community/Media `photo_submissions`; (2) Negozi `shops` — **sempre cancella** (NOT NULL city_id); (3) Personaggi `city_people` — **sempre cancella** (UI+code); (4) POI `pois`; (5) Eventi `city_events`; (6) Servizi `city_services`; (7) Guide `city_guides`; (8) Tour operator `city_tour_operators`; (9) Sponsor — detach/orphan RPC, non delete row; (10) Staging OSM — orphan pre-delete; (11) Segnalazioni — **preservare** `content_reports` (oggi deleteCity non li tocca; legacy reports **sì** — da correggere in INT-09). **Patrono / immagini entity:** non enumerati in deleteCity attuale → **INT-09** deve estendere senza inventare tabelle assenti. |
| **COME** | RPC `delete_city_admin_all_only` con assert role; wire modal in `CitiesManager` solo se `currentUser.role === 'admin_all'`; estendere opzioni per categorie 5–8; RESTRICT reports; soft-delete city + registry; atomic transaction. |
| **TEST** | `admin_limited` → RPC 403; orphan + `reclaimOrphanedItems`; reports sopravvivono. |

---

### 30.11 Config AI per sezione — INT-AI-CONFIG-01

| | |
|--|--|
| **DECISIONE** | Per-sezione; label concordata documentazione IV-BIS/V: **«CONFIGURA GENERATORE AI»** (sostituisce UI attuale «Generatore AI» / «Configura Strategia AI»). |
| **OGGI** | `AiFieldHelper.tsx` L228–233: label **non** ancora aggiornata. `getAiConfig` sì; **`saveAiConfig` zero caller UI**. Chiavi `ai_config_${fieldId}`. Punti: `TabGeneral`, `EditorGeneral`, `TabRatings`, `CulturePatron`, `CultureHistory`, `PoiInfoTab`, `CulturePersonCard`. |
| **COME** | Modale CRUD + `saveAiConfig`; persistenza refresh; permessi admin. |
| **CHIUSURA** | Refresh browser mantiene config; label uniforme in UI. |

**Safe-Art (V):** strumento **autonomo** — **non** propagare config alle altre sezioni AI; può **riusare la stessa label** nel pannello testuale interno Safe-Art.

---

### 30.13 INT-13 — INDAGINE NECESSARIA PRIMA DELLA DECISIONE

**Non eliminare. Non collegare a Safe-Art.** Risposte obbligatorie:

1. **Cosa significa «registrare»?** Dopo upload Storage, creare/aggiornare riga **`media_assets`** (provenance AI) e **`entity_image_assignments`** primary per entità (`city_person` \| `poi` \| `patron`) tramite `upsertEntityImageAssignmentFromSource` + patch `origin_type: 'ai'`, `generated_by_ai: true`.

2. **Cosa crea/aggiorna/dove?** Assignment primary + asset collegato; bucket **`public-media`** obbligatorio; path da URL pubblica.

3. **A cosa serve?** Unificare portrait AI nel modello D90 **senza** passare dal save entità completo — helper post-upload.

4. **Perché esiste?** Introdotto macrofase MF3–MF5 (`git log -S registerAiGeneratedPortraitAsset`: `e904f93`, `ec22f79`, `72016e3` — image management consolidation).

5. **Problema previsto?** Evitare dual-write incoerente tra Storage, `media_assets` e assignment quando UI genera immagine prima del save persona/POI.

6. **Flusso originario previsto?** Generazione/upload portrait → **register** → poi save entità (ipotesi architetturale MF5; **nessun caller** mai collegato in UI).

7. **Sostituita?** **Sì** per Personaggi: `generateHistoricalPortrait` (`aiVision.ts`) → upload `people_portraits/` → URL passato a **`saveCityPerson`** + RPC **`save_city_person_with_image_assignment`** (`p_origin_type` da `imageOriginType`).

8. **Quando/perché?** Cutover D90 persona; register rimasto orphan helper.

9. **Obsoleta?** **Parzialmente** per persona UI attuale; **potrebbe** servire per flussi «solo upload asset» o POI/patron se si volesse separare upload da save metadati.

10. **Dati persi eliminando?** Solo funzione TS (~60 righe); nessun dato runtime (zero chiamate).

11. **Differenze:** **INT-13** = register assignment da URL già caricato. **generateHistoricalPortrait** = genera + upload + ritorna URL (no register). **saveCityPerson** = persist persona + immagine via RPC unica. **Image Management** = modello generale assignment/read/governance.

12. **Artefatti storici?** Documentazione consolidation §24.13, §27.7; commit MF5; **nessun** documento che imponga caller obbligatorio.

13. **Relazione Safe-Art?** **NO dimostrata.** Safe-Art → `uploadPublicMedia(...,'ai_generated')` + hero preview (`handleSafeArtSuccess`); **non** chiama register; bucket/path diversi da portrait entity.

14. **Se eliminato:** nessun effetto runtime oggi; rischio futuro se si implementa flusso «register prima di save» senza alternativa.

**Decisione proprietario:** ancora **aperta** (collegare a nuovo flusso POI/patron vs deprecare vs lasciare helper).

---

### 30.14–30.16 SAFE-ART GENERATOR — AUDIT STORICO E PIANO DI RIPRISTINO

#### 30.14 Stato codice e storico git

| Elemento | Esito |
|----------|--------|
| Percorso UI | Admin → Asset Globali (`view=design_assets`) → `AdminHeaderManager` → tab Hero → **Safe-Art Gen** → `SafeArtPanel` |
| Generate | `aiGateway.generateLegacy` gemini-2.5-flash-image; upload `ai_generated` |
| UI input stile/prompt | **Assente** (commenti `// ... rest of UI ...`); `genPrompt` sempre `''` → bottone disabled |
| Git history `SafeArtPanel.tsx` | Commits `147399a` (import FBS) → oggi: **sempre stub UI**; import `getAiConfig`/`saveAiConfig` presente in commit intermedi, **rimosso** in versione attuale |
| `STYLES` / categorie MONUMENTI… | **Non presenti** nel repo (solo placeholder `city_real` con `dbKey: safe_art_city_real`) |
| Migration SQL `safe_art` | **Nessuna** in `supabase/` |
| Tabella `ai_configs` | **Esiste** (`supabase.ts`: key, prompts, selected, presets) — **possibile** persistenza live non verificabile senza DB |

**Scenario indagine (V):** **B + D** — infrastruttura DB/servizi **generica** recuperabile; **UI e preset completi mai versionati** nel repository (export Firebase già troncato); eventuali righe `safe_art_*` in DB = **solo verificabili su DB live** (non audit V).

#### 30.15 «Applica Header (DB)»

| # | Risposta |
|---|----------|
| 1–2 | Pulsante **esiste** (`HeroSection.tsx` L108–116); attivo salvo `isSavingHero` |
| 3–5 | `handleSaveHero` → `commitAssetSettingChange` → `SETTINGS_KEYS.HERO_IMAGE` via `useConfig` / `settingsService` (config piattaforma globale) |
| 6–8 | **Header** = immagine hero homepage; valore in **settings** piattaforma, non città |
| 9–10 | Dati in DB settings (caricati da `ConfigContext`); preview locale `previewImage` |
| 11 | **Operativo** se `previewImage` valorizzata (upload o Safe-Art success); salva URL in DB |
| 12–14 | Non legacy disabilitato; Safe-Art rotto **non** impedisce Applica Header se immagine caricata altrove |

#### 30.16 Proposta ripristino (solo piano)

| | |
|--|--|
| **A Recuperabile** | `ai_configs` schema; `getAiConfig`/`saveAiConfig`; pipeline generate+upload; Applica Header |
| **B Da ricostruire** | UI stile tendina (Realistico, Cinematografico, Fumetto, Paesaggistico); pannello testuale tipo Generatore AI; categorie asset/placeholder se richieste; proporzioni modale |
| **C Perso in repo** | Elenco STYLES/categorie complete; prompt storici (salvo seed DB live) |
| **D/E/F** | Chiavi `safe_art_*` per stile in `ai_configs`; **no** auto-link ad `AiFieldHelper` altre sezioni; possibile `safe_art_style_cinematic` ecc. |
| **Coerenza stilistica** | Persistere `selected`+`presets` per stile; prompt base per stile + istruzioni utente; stesso stile → stesso blocco `STILE:` in `generateImage` |
| **Label pannello testo** | **«CONFIGURA GENERATORE AI»** (allineamento IV-BIS — riuso concettuale, tool resta separato) |
| **ID piano** | **INT-SAFE-ART-RESTORE-01** |

---

## AUDIT V — REPORT FINALE (formato §19 richiesta)

### 1. DECISIONI RECEPITE (chiuse)

Merge survivor-only; D-22; Sponsor min/max + min adesione obbligatorio; primary Sponsor auto semplice + manuale protetta + notifica sospensione; Wikimedia; Community; Patrono; content_reports SoT; SUSPENDED ADMIN; city delete solo admin_all + modale categorie; AI config per-sezione label **CONFIGURA GENERATORE AI**; Safe-Art autonomo; INT-03 rimosso.

### 2. GIÀ CORRETTO (verificato)

Merge review/suggestion; D90 read assignment active; Wikimedia pipeline fail-closed; `reclaimOrphanedItems`; `addNotification`; Applica Header (DB) funzionale con preview; `saveCityPerson` RPC immagine; tabella `ai_configs`; Safe-Art engine generate (se prompt valorizzato manualmente in futuro).

### 3. MANCA

INT-MERGE-IMG-01; D-22 completo; sponsor galleria/minmax; suspend+notify; city delete guard+wire UI; AI saveAiConfig; Safe-Art UI; INT-13 decisione; decommission legacy reports.

### 4–6. Vedi §30.1–30.16 e §19 tabella INT.

### 7. DECISIONI ANCORA DA PRENDERE

| Domanda | Perché | Se non decidi |
|---------|--------|---------------|
| **INT-13:** collegare `registerAiGeneratedPortraitAsset` a un flusso reale, o deprecare? | Zero caller; alternativa D90 via save entità | Resta sospeso |
| **Safe-Art:** confermare rebuild preset 4 stili se DB `safe_art_*` vuoto? | Prompt storici assenti in git | Piano INT-SAFE-ART usa default nuovi |
| **Notifica Sponsor:** anteprima solo testo+URL vs estendere `linkData`? | Schema notification attuale | Implementazione minima messaggio |

**Non riaprire:** unificare Safe-Art con config AI altre sezioni (V: **NO**).

### 8. ORDINE OPERATIVO

Vedi **§20** aggiornato (Audit V).

### 9. STATO AUDIT V

**Nessun** codice, DB, migration, dato o UI modificati in questa attività.

---

## DECISIONI — RIEPILOGO POST AUDIT V

### A. CHIUSE

Vedi §30 report §1.

### B. DA PRENDERE

Vedi §30 report §7.

### C. INDAGINI

INT-13 §30.13 **completata** (decisione prodotto pending). Safe-Art §30.14–16 **completata** (rebuild pending conferma preset).

### D. NON RIAPRIRE

INT-03; bypass Wikimedia; config AI globale; trasferimento immagini victim; Safe-Art → auto-config altre sezioni.

---

**Nota documentale:** `AI_IMAGE_MANAGEMENT_MASTER_PLAN.md` può ancora citare quote Sponsor come numeri fissi (pre-V). **Non modificato** in questa attività — allineamento master plan = decisione separata se richiesta.

---

## 31. ADDENDUM AUDIT VI — 2026-09-27

Legenda: **FV** = fatto verificato repository · **DP** = decisione prodotto · **PT** = proposta tecnica · **NV** = non verificato (es. DB live non interrogato in questa sessione).

---

### 31.1 Merge immagini — INT-MERGE-IMG-01 (DP chiusa)

| Voce | Contenuto |
|------|-----------|
| **DP** | Survivor mantiene **solo** le proprie immagini; **zero** trasferimento victim (tutti gli `origin`, incluso Sponsor). INT-03 rimosso. |
| **FV — unico trasferimento SQL** | `reconcile_poi_image_assignments_for_merge` (`supabase/migrations/20260924183300_…sql`, L395–439): `v_should_transfer` → `upsert_poi_primary_image_assignment` sul **survivor** con primary **victim**. Invocato solo da `merge_pois_observatory_atomic` (`20260924183500_…sql`, L125) ← `poiMergeImageAssignments.ts` ← `observatoryService.mergePoisInDb`. |
| **FV — altri percorsi merge immagini** | **Nessun** altro SQL/TS che copia assignment victim→survivor al merge. `scripts/backfill_media_assets_from_legacy.ts` usa `upsert_poi_primary_image_assignment` per **backfill**, non merge. |
| **PT — INT-MERGE-IMG-01 sufficiente?** | **Sì** per regola «no transfer»: rimuovere blocco L395–439 (o forzare `v_should_transfer := false` e rimuovere upsert). Mantenere revoca victim (L476–518) + DELETE POI. **Non** toccare spostamento recensioni/suggestion (merge testo). |
| **FV — Sponsor survivor** | Nessuna logica merge che **rimuove** gallery Sponsor già sul survivor; rischio è solo **aggiunta** foto victim — eliminata con fix sopra. |
| **FV — UI discordante** | `DuplicateResolver.tsx` L266: «Merge sposterà foto…» — da allineare in implementazione. |
| **TEST** | Merge A(3 img)+B(4 img) → survivor **3**; nessun `media_asset_id` B su A; caso Sponsor solo su B. |
| **CHIUSURA** | SQL senza upsert victim→survivor + test + copy UI. |

---

### 31.2 D-22 — INT-01 / INT-01b (DP chiusa)

| Voce | Contenuto |
|------|-----------|
| **DP** | Gerarchia **server-side** (§32.2); no downgrade automatico; azioni Admin **esplicite** (upload/sostituzione) — **non** rank Admin sopra Sponsor. |
| **FV — primary oggi** | `entityPrimaryImageReadService.ts`: una primary `is_current` + `assignment_status === 'active'`; **nessuna** cascata D-22 (se non active → URL vuoto L147). `poiMapper.ts` L171: `gallery: []`. |
| **FV — sostituzione primary** | `saveSinglePoi` → `p_origin_type: 'admin'` fisso (`poiWrite.ts` L120). `upsertEntityImageAssignmentFromSource` / RPC POI **senza** rank. Wikimedia: `commonsDownloadPipeline.ts`. Community: `photoService.materializePhotoSubmissionAssignment` (`originType: 'community'`). |
| **FV — rischio downgrade** | Path automatici (AI magic city `saveSinglePoi`, Community materialize, Wikimedia) possono **sovrascrivere** primary esistente senza confronto rank — **manca** guard D-22. |
| **FV — Sponsor origin** | Assente da `MEDIA_ORIGIN_TYPE_DB_VALUES` (`governance.ts` L460–468). |
| **PT** | Enum `sponsor`; SQL+TS rank; param `p_admin_override`; resolver **cascata** D-22 (§31.4); badge provenienza `PoiMediaTab`. |
| **NON MODIFICARE** | Moderazione stati segnalazione (Master Plan D16). |

---

### 31.3 Sponsor quote — INT-SPONSOR-01 / INT-SHOP-SPONSOR-01 / INT-SPONSOR-MINMAX-01 (DP VI)

| Tier | Min | Max | Note |
|------|-----|-----|------|
| Gold POI | 1 | 10 | foto POI sponsor |
| Silver POI | 1 | 5 | |
| Guida | 1 | 3 | |
| Tour Operator | 1 | 3 | |
| Digital Shop **grande** | 1 | 5 | slot distinto |
| Digital Shop **piccola** | 1 | 10 | slot distinto |
| Digital Shop **totale** | 2 | **15** | somma vincoli (≥1+≥1, ≤5+≤10) |
| POI (pool shop) | 1 | 10 | separato da immagini shop |

**DP (Audit VII):** min e max sono vincoli **permanenti per tutto il lifecycle** (adesione, aggiunte, sostituzioni, cancellazioni) — l’utente **non** può scendere sotto il minimo né superare il massimo. Non confondere min/max/grande/piccola/POI/shop.

**FV:** `useSponsorFormLogic.handleSubmit` — **no** validazione `coverImage`; `submitSponsorRequest` **non** riceve immagini. Quote **assenti** in servizi/schema sponsor.

**PT:** tier config centralizzata; RPC bounds; adesione blocca senza min; contatori shop `large`/`small`; UI partner + galleria pubblica proporzionata (modale basso, touch, `object-cover`).

**DB da verificare pre-implementazione (NV live):** righe `sponsors` / `shop_products` esistenti.

---

### 31.4 Primary Sponsor + SUSPENDED + cascata D-22 (DP VI)

| Voce | Contenuto |
|------|-----------|
| **DP** | Admin **non** obbligato a sostituta Sponsor; sospensione → prossima Sponsor per **ordine di caricamento**; esaurite Sponsor valide → **cascata D-22** (Sponsor→Admin→Real/Wikimedia→Community→AI→Placeholder). Primary auto **deterministica** (`created_at ASC`, tie-break id). **Admin non è mai sopra Sponsor** in D-22. |
| **FV** | Nessun resolver cascata POI in produzione; sospensione Admin immagine POI **non** in UI; `entityPrimaryImageReadService` non considera gallery Sponsor. |
| **PT** | `INT-01b` resolver: per livello D-22, prima primary/gallery attive non sospese; poi livello successivo; placeholder finale. INT-SUSP-ADMIN-01: suspend **non** forza nuova Sponsor. INT-SPONSOR-PRIMARY-02: flag manual lock. |
| **TEST** | Tutte Sponsor sospese, nessuna sostituta scelta → URL da livello Admin o inferiore se presente; mai pagina «rotta» se esiste fonte valida. |

---

### 31.5 Wikimedia (DP chiusa)

**FV:** `commonsDownloadPipeline.ts` — messaggi CC BY **4.0** verificata; fail-closed. **FV:** nessun secondo bypass trovato oltre path documentati §28.5. Piano INT-WM-PHASE-01 **allineato**.

---

### 31.6 Community — INT-06 (DP chiusa)

**CAMBIA:** solo consolidamento assignment (`materializePhotoSubmissionAssignment` → Image Management). **NON CAMBIA:** approve/reject moderazione, stati submission.

---

### 31.7 Patrono — INT-05/11 (DP chiusa)

**FV:** `saveCityPerson` invia payload persona + immagine opzionale via RPC unica; fallimento RPC **blocca** intero save (non split dati/foto lato client). **MANCA:** messaggio Admin «dati ok, foto no» se si separa transazione. **PT:** RPC/servizio split o partial success documentato.

---

### 31.8 Segnalazioni — INT-REP-DECOM / badge (DP VI)

**DP:** SoT operativo = `content_reports`; badge **solo** nuovo sistema; per tab + micro-tab + totale hub coerente; **no** legacy nei totali.

**FV — hub** | `AdminReportsHub.tsx`: tab Community, Patron, Famous person, AI. Badge tab: **solo** `aiVerifyQueueTotal` (MF3 queue, **non** `content_reports`). |
**FV — dashboard** | `AdminDashboard.refreshCounts`: `getPendingContentReportCount()` **sommato a `suggestions`** (L221–222); `getPendingFamousPeopleAdminCount()` include **legacy** `famous_person_photo_reports` (L246); `getPendingPatronSaintAdminCount()` include **legacy** `patron_photo_reports`; `getAiVerifyQueueCounts()` **sommato a `suggestions`** (L251–252). **Doppio conteggio / mix legacy+MF2 confermato.** |
**FV — legacy write** | `famousPersonPhotoReportService`, `patronPhotoReportService` ancora attivi. |
**PT** | INT-REP-DECOM: rimuovere legacy da badge; `getPendingContentReportCount` per **entity_type** per tab; totale hub = somma tab MF2; micro-badge in panel (es. Community suggestions L57–59). **NON eliminare dati** fino a fase implementazione. |

---

### 31.9 City delete — INT-09 (DP chiusa)

**DP:** solo `admin_all`; guard server; modale CANCELLA/CONSERVA ORFANO; segnalazioni conservate (copy semplice).

**FV:** `deleteCity` — **nessun** check ruolo. `DeleteCityOptionsModal` — **nessun** import in Admin cities (**flusso non cablato**). Categorie codice: photo_submissions (toggle), pois (toggle), shops/people sempre delete, events/services/guides/operators sempre delete, sponsors detach RPC, legacy reports **DELETE** (conflitto conservazione).

---

### 31.10 AI config — INT-AI-CONFIG-01 (DP chiusa)

**DP:** per-sezione; label **CONFIGURA GENERATORE AI** (maiuscolo come da audit VI).

**FV:** `AiFieldHelper.tsx` L228–233: ancora «Generatore AI» / «Configura Strategia AI». `saveAiConfig` — **zero** caller UI. Sezioni: TabGeneral, EditorGeneral, TabRatings, CulturePatron, CultureHistory, PoiInfoTab, CulturePersonCard.

---

### 31.11 Safe-Art — direzione autonoma (DP VI)

**DP:** autonomo; stile → load/save istruzioni → generate; **non** propagare config ad altre sezioni AI.

**FV funzionante:** `generateImage` + `uploadPublicMedia('ai_generated')` + `handleSafeArtSuccess` → preview; **Applica Header** separato.

**FV non collegato:** UI prompt/stile; `getAiConfig`/`saveAiConfig` **rimossi** da `SafeArtPanel.tsx`; `STYLES.city_real.dbKey = 'safe_art_city_real'` stub.

**DB live (verificato §33.1):** **7** righe `safe_art_*` in `ai_configs` con prompt/preset recuperabili — **non** vuoto.

**PT INT-SAFE-ART-RESTORE-01:** ripristinare UI da pattern git (import config in commit intermedi); **prima** query DB chiavi esistenti; riusare chiavi recuperabili; ricostruire **solo** gap (4 stili: Realistico, Cinematografico, Fumetto, Paesaggistico).

Lista A–F §31.11 in tabella execution §30.16 resta valida; VI conferma **non unificare** con INT-AI-CONFIG-01.

---

## INT-13 — Definitive Runtime / Feature Audit (integrazione VI)

### A. Utilizzo e raggiungibilità

| Domanda | Evidenza |
|---------|----------|
| Definizione | `src/services/media/mediaAssetService.ts` L88–148 |
| Import diretti | Solo `mediaAssetService.ts` (definizione) |
| Caller `src/` | **0** |
| Test / scripts / supabase functions | **0** (grep repo) |
| Re-export | **No** |
| Documentazione flusso operativo | Post-MF5 audit descrive helper **non collegato** |
| **Raggiungibilità runtime UI** | **FV: NO** — nessuna catena da componente a funzione |

### B. Flusso reale vs INT-13

| Step | Flusso **reale** (Persona AI) | Flusso **INT-13** |
|------|------------------------------|-------------------|
| Generate | `generateHistoricalPortrait` (`aiVision.ts`) | (esterno) URL già su Storage |
| Upload | `people_portraits/` | **`public-media`** obbligatorio |
| Assignment | `saveCityPerson` → RPC `save_city_person_with_image_assignment` | `upsertEntityImageAssignmentFromSource` → RPC transitoria dual-write |
| Provenance patch | via RPC save + origin param | patch `media_assets` `origin_type: ai`, `generated_by_ai: true` |

**Coincidono:** modello D90 assignment + asset. **Differiscono:** bucket/path; INT-13 non aggiorna riga persona; INT-13 usa RPC transitoria invece di save entità.

### C. Responsabilità INT-13

1. Validazione URL/bucket `public-media` — **unica** a questo helper (FV).
2. Materializzazione assignment primary — **coperta** da save POI/person/patron RPC nel flusso reale.
3. Patch provenance AI su asset — **parzialmente** coperta da RPC save / pipeline.

### D. DB legacy INT-13

**NV:** asset creati **solo** via INT-13 (identificabile solo se tracciato `source_ref`) — nessun caller storico in repo.

### E. Classificazione tecnica (non decisione prodotto)

**SOSPESO — NON ELIMINARE** (Audit VII §32.12): oggi **zero** raggiungibilità runtime UI; flusso reale = `generateHistoricalPortrait` (`people_portraits/`) + `saveCityPerson` D90. **Prima di deprecare:** verifica NV DB asset tracciati solo via questo helper; eventuale unificazione vincolo bucket/documentazione — **non** chiusura con solo «zero caller».

**Nota:** se in futuro servisse «register portrait su public-media senza save entità», il comportamento **non** è identico a `generateHistoricalPortrait` (bucket diverso) — **FUNZIONALITÀ UNICA POTENZIALE** = vincolo `public-media` + patch provenance post-assignment.

---

## Applica Header (DB) — Definitive Functional Audit (integrazione VI)

### Percorso FV

`HeroSection.tsx` (Admin Asset Globali) L108–116 → `handleSaveHero` (`useAdminHeaderManager.ts` L292–305) → `commitAssetSettingChange` → `updateSetting` → `global_settings` chiave **`hero_image`** (`SETTINGS_KEYS.HERO_IMAGE`, `settingsService.ts` L53).

Safe-Art success → `setPreviewImage(url)` L713–715 — **stesso** preview, **non** salva DB finché non si clicca Applica Header.

### Cosa significa «Header» (FV)

**Immagine hero piattaforma** in `global_settings.hero_image` — **non** `cities.hero_image` (campo per **città** in `cityReadService` / ranking).

### Lettura / rendering (FV + gap)

- **FV:** caricamento in `ConfigContext` Phase B (tutte `SETTINGS_KEYS`).
- **FV consumatori grep `src/`:** Admin preview (`useAdminHeaderManager`), `useAiMagicCity` (default hero per magic add), registry placeholder (`platformPlaceholderOrigin.ts`).
- **FV:** componente public `components/home/HeroSection.tsx` = **UI ricerca/filtri**, **non** legge `configs.hero_image`.
- **PT/NV:** verificare design_system / bootstrap API esterno se hero piattaforma esposto altrove — **non trovato** in `server/`.

### Stato funzionale

| Aspetto | Valutazione |
|---------|-------------|
| Salvataggio DB | **FV: funzionante** se preview valorizzata |
| Safe-Art → preview | **FV: funzionante** |
| Safe-Art → generate | **FV: disabilitato** senza prompt UI |
| Consumo public Home hero image setting | **FV: percorso non dimostrato** in `src/` |

### Relazione Safe-Art ↔ Applica Header (FV)

**Condiviso:** solo state `previewImage` in sessione Admin. **Non condiviso:** INT-13, entity assignments, chiavi AI sezione. Safe-Art **non** usa `registerAiGeneratedPortraitAsset`. Applica Header **non** usa `ai_configs`.

### Incrocio INT-13 ↔ Header ↔ Safe-Art

| # | Risposta | Evidenza |
|---|----------|----------|
| 1 INT-13 ↔ Header | **NO** | Nessun import/codice comune |
| 2 INT-13 → Header | **NO** | |
| 3 Header usa asset INT-13 | **NO** | Header = URL string setting |
| 4 Header usa media system D90 | **NO** | global_settings, non assignments |
| 5 Safe-Art usa INT-13 | **NO** | upload `ai_generated` |
| 6 Safe-Art usa Applica Header | **Indiretto** — preview condivisa; save solo su click Applica |
| 7–9 DB/servizi/chiavi condivise | Solo `previewImage` UI state; chiavi distinte (`hero_image` vs `safe_art_*`) |
| 10 Rischio rimozione INT-13 | **FV: nessuno** su Header/Safe-Art |

---

## AUDIT VI — OUTPUT FINALE

### A. Decisioni chiuse documentate

Merge survivor-only; D-22 server-side; quote Sponsor §31.3; cascata post-sospensione; Wikimedia; Community; Patrono; badge content_reports; SUSPENDED cascata; city delete admin_all; AI label; Safe-Art autonomo.

### B. Cosa sviluppare

INT-MERGE-IMG-01, INT-01/01b (+ resolver cascata), INT-SPONSOR/MINMAX/SHOP, INT-SUSP+NOTIF+PRIMARY, INT-WM-PHASE, INT-06, INT-05/11, INT-REP-DECOM+badge, INT-09, INT-AI-CONFIG, INT-SAFE-ART-RESTORE; INT-13 **decisione pending**.

### C. Rischi FV

Downgrade D-22; badge legacy mix; deleteCity legacy reports; merge SQL transfer; Applica Header senza consumer public dimostrato.

### D. Safe-Art

Vedi §31.11 + §30.16; DB preset **NV**.

### E. Disallineamenti documentali

- **MASTER PLAN DA ALLINEARE** (quote Sponsor / shop, se presenti numeri fissi pre-min/max).
- Execution §30.3 Digital Shop **obsoleto** (max 10 shop) — sostituito da §31.3.
- Deep analysis D-23 riferimento 10+10 — da allineare addendum VI.
- `DuplicateResolver` copy vs regola merge.

### F. Decisioni ancora aperte (pre–Audit VII)

Vedi **§32.H** per elenco aggiornato post–Audit VII.

---

## 32. ADDENDUM AUDIT VII — 2026-09-27

**Scopo:** consolidamento **definitivo** delle decisioni; audit tecnico repository; piano **COSA · COME · DOVE** per ogni intervento futuro. **NON RIAPRIRE** le decisioni marcate **CHIUSA** salvo nuova evidenza di contraddizione in codice/produzione.

**Regola documentale §17 (da Audit VII in poi):** ogni decisione chiusa deve avere, in modo recuperabile: **DECISIONE DEFINITIVA** · **COSA SIGNIFICA IN PRATICA** · **COSA SUCCEDE OGGI** · **COSA MANCA** · **COSA DEVE ESSERE SVILUPPATO** · **COME** · **DOVE** · **DIPENDENZE** · **RISCHI** · **TEST** · **CRITERIO DI CHIUSURA** · **NON RIAPRIRE**.

**DB live (Audit VII delta §33):** query read-only eseguite 2026-09-27 su DB autorizzato (service role, solo SELECT) — esiti in §33.1–33.2.

---

### 32.0 Schede decisione (indice rapido)

| ID | Stato | Intervento futuro |
|----|-------|-------------------|
| Merge immagini | **CHIUSA** | INT-MERGE-IMG-01 |
| D-22 + cascata + Sponsor primary | **CHIUSA** | INT-01, INT-01b |
| Sponsor min/max lifecycle | **CHIUSA** | INT-SPONSOR-01, INT-SHOP-SPONSOR-01, INT-SPONSOR-MINMAX-01 |
| Sospensione Sponsor + cascata | **CHIUSA** | INT-SUSP-ADMIN-01, INT-SPONSOR-PRIMARY-02, INT-01b |
| Wikimedia POI | **CHIUSA (architettura)** | INT-WM-PHASE-01 — **riuso** `runCommonsDownloadPipeline` |
| Community | **CHIUSA** | INT-06 |
| Patrono dati vs foto | **CHIUSA** | INT-05 / INT-11 |
| Segnalazioni + badge | **CHIUSA** | INT-REP-DECOM, INT-REP-BADGE-01 |
| Tab Suggerimento foto UI | **CHIUSA (UX)** | INT-REP-UI-01 |
| City delete | **CHIUSA** | INT-09 |
| AI config per sezione | **CHIUSA** | INT-AI-CONFIG-01 |
| Safe-Art autonomo | **CHIUSA** | INT-SAFE-ART-RESTORE-01 (dopo NV DB) |
| INT-13 | **INDAGINE CHIUSA / AZIONE SOSPESA** | INT-13-DECOM (solo dopo NV DB) |
| Applica Header | **AUDIT CHIUSO → residuo** | INT-APPLY-HEADER-DECOM-01 (dopo ack) |
| Safe-Art ↔ Header | **CONSEGUENZA §32.14** | Nessuna dipendenza funzionale se Header decommissionato |

---

### 32.1 Merge immagini — **NON RIAPRIRE**

| Campo | Contenuto |
|-------|-----------|
| **DECISIONE DEFINITIVA** | Al merge di due POI, il **survivor mantiene solo le proprie immagini**. Le immagini del **victim non si trasferiscono** al survivor (**tutti** gli `origin_type`, incluso Sponsor). |
| **COSA SIGNIFICA** | Il merge unifica recensioni/suggestion/testo POI; **non** unifica gallery/primary immagini tra POI. |
| **OGGI** | `reconcile_poi_image_assignments_for_merge` (`supabase/migrations/20260924183300_…sql`, L395–439): `v_should_transfer` → `upsert_poi_primary_image_assignment` sul survivor con asset victim. Entry: `merge_pois_observatory_atomic` ← `poiMergeImageAssignments.ts`. `DuplicateResolver.tsx` ~L266: copy «sposterà foto» **discordante**. |
| **MANCA** | Rimozione ramo transfer; test merge; allineamento copy UI. |
| **COSA SVILUPPARE** | **Solo INT-MERGE-IMG-01** — nessun INT-03, nessun riallineamento priorità merge a D-22 (irrilevante se non si trasferisce). |
| **COME** | Migration SQL: eliminare blocco `v_should_transfer` + upsert victim→survivor; mantenere revoca assignment victim (L476–518) + DELETE POI victim. |
| **DOVE** | `20260924183300_reconcile_poi_image_assignments_for_merge.sql`; `DuplicateResolver.tsx` (testo); eventuali doc interne merge. |
| **NON MODIFICARE** | Spostamento recensioni/suggestion; logica arricchimento campi testuali survivor. |
| **DIPENDENZE** | Nessuna su D-22/Sponsor per il fix merge. |
| **RISCHI** | Regressioni se altri branch SQL invocano upsert merge (FV: **solo** questa RPC). |
| **TEST** | Merge A(3 img)+B(4 img) → survivor resta a **3**; nessun `media_asset_id` del victim sul survivor; caso Sponsor solo su victim → survivor invariato. |
| **CRITERIO DI CHIUSURA** | Migration applicata + test verdi + copy UI corretta + assenza upsert victim→survivor in SQL. |

---

### 32.2 D-22 — priorità immagini POI — **NON RIAPRIRE**

| Campo | Contenuto |
|-------|-----------|
| **DECISIONE DEFINITIVA** | Gerarchia **sempre**: **1 SPONSOR → 2 ADMIN → 3 REAL/WIKIMEDIA → 4 COMMUNITY → 5 AI → 6 PLACEHOLDER**. **Admin non è mai superiore a Sponsor.** Admin è superiore a Real/Wikimedia, Community, AI, Placeholder. |
| **CASCATA (pubblico)** | Prima fonte **valida e non sospesa** al livello più alto presente; se assente, livello successivo; fino a placeholder. Esempi: Sponsor valida → Sponsor; no Sponsor + Admin → Admin; no Sponsor/Admin + Real/Wikimedia → Real/Wikimedia; …; nessuna → Placeholder. |
| **SPONSOR (multi-foto)** | Primary Sponsor = **prima caricata** (ordine di caricamento). Sospensione primary → **seconda caricata**, poi terza, …; esaurite Sponsor valide → cascata al livello **Admin**. Scelta **deterministica** (`created_at ASC`, tie-break id). **Non** introdurre regola separata «protezione primary Admin» — D-22 è la regola. |
| **OGGI** | `entityPrimaryImageReadService.ts`: una primary `active` only; **nessuna** cascata multi-livello; `poiMapper.ts`: `gallery: []`. `saveSinglePoi` → `p_origin_type: 'admin'` fisso. `origin_type=sponsor` **assente** in enum. |
| **MANCA** | Enum `sponsor`; rank SQL+TS; guard su RPC save automatici; resolver cascata read; UI provenienza. |
| **COSA · COME · DOVE** | **INT-01:** migration enum + funzione rank condivisa SQL/TS (`governance.ts`, upsert POI RPC). **INT-01b:** `resolvePoiDisplayImageUrl` / read service — loop livelli D-22 + gallery Sponsor + placeholder categoria. **INT-SPONSOR-PRIMARY-02:** `pickNextSponsorPrimaryByUploadOrder()`. Param `p_admin_override` solo per azioni Admin esplicite (**non** per bump di priorità su Sponsor esistente). |
| **DIPENDENZE** | INT-SPONSOR-01 (origine Sponsor) prima di rank completo. |
| **RISCHI** | Downgrade: AI magic city / Community / Wikimedia sovrascrivono primary senza guard (FV). |
| **TEST** | Matrice livelli + sospensioni Sponsor sequenziali + Admin presente/assente + placeholder finale. |
| **CRITERIO DI CHIUSURA** | E2E read pubblico rispetta ordine D-22; nessun path automatico abbassa Sponsor valida; sospensione Sponsor esegue cascata documentata. |

---

### 32.3 Sponsor quote min/max — **NON RIAPRIRE**

| Tier / scope | MIN | MAX |
|--------------|-----|-----|
| Gold POI | 1 | 10 |
| Silver POI | 1 | 5 |
| Guida | 1 | 3 |
| Tour Operator | 1 | 3 |
| Digital Shop — foto **grande** | 1 | 5 |
| Digital Shop — foto **piccola** | 1 | 10 |
| Digital Shop — **totale** | 2 | 15 |
| POI pool / immagini POI Sponsor | 1 | 10 |

| Campo | Contenuto |
|-------|-----------|
| **DECISIONE** | Min/max **permanenti** su **tutto il lifecycle** (adesione, add, replace, delete). Ultima foto Sponsor valida **non** cancellabile se min=1; **no** 11ª foto se max=10 (Gold POI). |
| **OGGI** | `useSponsorFormLogic`: `coverImage` **non** validato né inviato a `submitSponsorRequest`. Nessun enforcement server quote. |
| **COSA · COME · DOVE** | Config tier centralizzata; RPC `check_sponsor_image_bounds` (o equivalente); UI partner + modale adesione: blocchi client + messaggi; contatori shop `large`/`small`/`total`; delete guard. File: sponsor hooks/services, `BusinessShopManager`, RPC sponsor/shop. |
| **TEST** | Delete sotto min; add sopra max; sostituzione ai limiti; shop grande+piccola rispettano totale 15. |
| **CRITERIO DI CHIUSURA** | Impossibile violare min/max da UI e API per ogni tier/categoria shop. |

---

### 32.4 Sospensione Sponsor + sostituzione automatica — **NON RIAPRIRE**

| Campo | Contenuto |
|-------|-----------|
| **DECISIONE** | Sospensione foto Sponsor → altra Sponsor valida per **ordine di caricamento**; ripetere fino a esaurimento; poi **Admin → Real/Wikimedia → Community → AI → Placeholder**. Admin **non** deve cercare manualmente sostituta Sponsor. |
| **OGGI** | Nessun flusso sospensione Sponsor POI in produzione; nessun resolver cascata. |
| **COSA · COME · DOVE** | **INT-SUSP-ADMIN-01** + **INT-SPONSOR-PRIMARY-02** + **INT-01b**; hook su transizione `asset_status` / assignment sospeso che ricalcola primary. |
| **TEST** | Catena 3 Sponsor: sospendi 1→2, sospendi 2→3, sospendi 3→Admin (se presente). |
| **CRITERIO DI CHIUSURA** | Comportamento deterministico identico in read e dopo ogni sospensione, senza intervento Admin obbligatorio. |

---

### 32.5 Wikimedia — audit definitivo POI vs Personaggi / Patrono

| Domanda audit | Risposta Audit VII |
|---------------|-------------------|
| Esiste **una sola** implementazione controlli sicurezza (fail-closed, MIME, size, licenza CC BY, quarantine, `verify_ai_image` vs auto-path)? | **SÌ — motore unico:** `src/services/wikimedia/commonsDownloadPipeline.ts` (`runCommonsDownloadPipeline`). |
| Personaggi famosi la usano? | **SÌ:** `usePeopleAI.ts` L658+ chiama `runCommonsDownloadPipeline`. |
| Santo Patrono la usa oggi? | **NO (gap wiring):** nessun caller Patrono a `runCommonsDownloadPipeline` in `src/` (FV grep). Controlli **devono** riusare la stessa pipeline quando Patrono/POI Wikimedia saranno cablati — **vietata** seconda logica parallela. |
| POI Wikimedia futuro? | **Non implementato** in UI; `CommonsDownloadEntityTarget` include già `entityType: 'poi'`. **COME:** INT-WM-PHASE-01 invoca **solo** `runCommonsDownloadPipeline` con `entity: { entityType: 'poi', … }`. |
| Controlli condivisi (non duplicare) | `parseCommonsLicenseMetadata`, `fetchCommonsExtMetadata`, step `IMAGE_VERIFICATION_STEP_DEFINITIONS`, cartelle `verified/wikimedia` vs quarantine, `upsertEntityImageAssignmentFromSource`, queue admin se fail-closed. |

**CRITERIO DI CHIUSURA WM-POI:** un solo file pipeline; test regressione Personaggi + nuovi test POI; Patrono (se previsto) stesso import.

---

### 32.6 Community — audit definitivo

| Campo | Contenuto |
|-------|-----------|
| **DECISIONE** | Consolidamento = **solo** collegamento foto approvata a Image Management (`entity_image_assignments`). **NON** cambiare approve/reject, stati moderazione, code legacy UI oltre decommission pianificato. |
| **OGGI (corretto)** | `photoService.ts`: `materializePhotoSubmissionAssignment` su insert/approve path (`originType: 'community'`); moderazione in `PhotoModeration` / update `photo_submissions.status` **invariata**. |
| **MANCA** | Allineamento completo a D-22 guard su materialize; decommission dual-write legacy URL colonne entità dove ancora presente (piano INT-06). |
| **COSA · COME · DOVE** | INT-06: dopo approve, assignment MF2 obbligatorio; **non** seconda moderazione. File: `photoService.ts`, `usePhotoModeration`, RPC se necessario per guard rank. |
| **TEST** | Approve/reject stati identici pre/post; assignment creato solo su approve; nessuna doppia coda moderazione. |
| **CRITERIO DI CHIUSURA** | Stessi stati submission; read pubblico da assignments; zero logica moderazione duplicata. |

---

### 32.7 Patrono — dati salvati anche se foto fallisce — **NON RIAPRIRE**

| Campo | Contenuto |
|-------|-----------|
| **DECISIONE** | Salvataggio **dati Patrono** deve completarsi anche se **foto/assignment** fallisce; Admin vede messaggio chiaro «dati salvati, foto non salvata» — **non** errore globale «Patrono non salvato». |
| **OGGI — parziale** | `saveCityDetails` (`cityWriteService.ts`): PATCH `/cities/.../details` **prima**; poi `upsertPatronPrimaryImageAssignment` in `try/catch` con `console.error` — **dati già persistiti**, **nessun toast Admin**. |
| **OGGI — blocco totale** | `saveCityPerson` (e flussi AI persona/patrono via RPC unica): fallimento RPC **annulla** intero save. |
| **MANCA** | Contratto API «partial success»; UI toast/banner distinto; allineamento Culture Patron + Person RPC dove applicabile. |
| **COSA · COME · DOVE** | **INT-05/11:** opzione A — RPC split (save dati + save image opzionale); opzione B — RPC unica con JSON `{ dataOk, imageOk, imageError }`. UI: `CulturePatron.tsx`, editor città, hook save. Messaggio: titolo successo dati + warning foto + link riprovare upload. |
| **RISCHI** | Stato incoerente temporaneo (dati senza foto) — accettato da prodotto; rollback foto opzionale. |
| **TEST** | Simula failure RPC assignment con PATCH ok; UI mostra warning; reload mostra dati + placeholder/fallback D-22. |
| **CRITERIO DI CHIUSURA** | Nessun percorso Admin lascia impressione fallimento totale se dati ok; messaggio esplicito su foto. |

---

### 32.8 Segnalazioni — sistema definitivo — **NON RIAPRIRE**

| # | Domanda | Risposta desiderata | OGGI (FV) |
|---|---------|---------------------|-----------|
| 1 | Totale «Segnalazioni» = solo `content_reports`? | **SÌ** | **NO:** `AdminDashboard.refreshCounts` somma legacy + MF2 + AI verify in `suggestions` (L215–252). |
| 2 | Ogni tab solo proprie segnalazioni? | **SÌ** | **NO:** badge tab hub quasi solo AI verify (`AdminReportsHub`). |
| 3 | Ogni micro-tab solo proprie? | **SÌ** | Parziale: liste MF2 per panel; conteggi micro non uniformi. |
| 4 | Una segnalazione conteggiata una volta nel totale? | **SÌ** | **NO:** mix legacy + content_reports + verify queue in un badge. |
| 5 | Post-decommission conteggio legacy visibile? | **NO** | Legacy ancora in badge e write (`famousPersonPhotoReportService`, `patronPhotoReportService`). |
| 6 | `verify_ai_image` separata da Segnalazioni? | **SÌ**, badge **proprio** | **NO:** sommata a `suggestions`; tab AI ha badge verify. |

| **COSA · COME · DOVE** | **INT-REP-DECOM:** stop write legacy (fase impl); delete dati test legacy. **INT-REP-BADGE-01:** sidebar «Segnalazioni» = `getPendingContentReportCount()` (+ per-tab filter `entity_type`); voce/coda **AI verify** = `getAiVerifyQueueCounts()` **separata**; hub totale = somma tab MF2 **senza** verify; **non** sommare verify a segnalazioni. File: `AdminDashboard.tsx`, `AdminReportsHub.tsx`, `useReportNotificationCounts.ts`, `contentReportService.ts`. |
| **CRITERIO DI CHIUSURA** | Audit visivo sidebar/hub/tab/micro-tab/dashboard: zero legacy nei totali; due badge distinti; nessun doppio conteggio. |

---

### 32.8A Coerenza visiva tab «Suggerimento foto» — **NON RIAPRIRE**

| Campo | Contenuto |
|-------|-----------|
| **PROBLEMA** | Micro-tab bar esterna = `ReportsMicroTabBar` (stile «Abuso foto»: slate bar, `rounded-md`). Contenuto «Suggerimento foto» embedda `AdminPatronSaintManager` / `AdminFamousPeopleManager` con filtri **pill `rounded-full`** (L404–414 `AdminPatronSaintManager.tsx`) — **incoerente**. |
| **COMPORTAMENTO CORRETTO** | Filtri stato suggerimenti foto usano **stesso pattern** `ReportsMicroTabBar` (o sub-bar identica) come «Abuso foto». |
| **DOVE** | `AdminReportsPatronTab.tsx`, `AdminReportsFamousPersonTab.tsx`, `AdminPatronSaintManager.tsx` (embedded `photo_suggestions`), analogo Famous. |
| **COME (INT-REP-UI-01)** | Estrarre filtri suggestion in componente condiviso stile micro-tab; rimuovere pill rounded-full nel contesto reports hub. |
| **TEST** | Visual/responsive: Patron + Famous Person; confronto side-by-side con tab Abuso foto. |
| **CRITERIO DI CHIUSURA** | Stessa forma/tablist in tutte le viste pertinenti hub Segnalazioni. |

---

### 32.9 Cancellazione città — **NON RIAPRIRE**

| Campo | Contenuto |
|-------|-----------|
| **DECISIONE** | Solo **ADMIN ALL** avvia delete (UI + server); **ADMIN LIMITED** senza pulsante e **bloccato server-side**; modale **collegata** al flusso; scelta **per categoria** CANCELLA / CONSERVA ORFANO; **`content_reports` conservati**; correggere DELETE legacy reports in `deleteCity`. |
| **OGGI** | `deleteCity` (`cityLifecycleService.ts`): **no** role check; DELETE `famous_person_photo_reports` L154–158; `DeleteCityOptionsModal` **non importata** in UI cities — **`deleteCity` non invocato** da Admin panel (FV). |
| **COSA · COME · DOVE** | **INT-09:** (1) Guard `admin_all` in UI cities manager + API route/RPC `delete_city_admin`. (2) Wire modale → `deleteCity` o RPC atomica sostitutiva. (3) Estendere modale: categorie allineate a §31.9 tabella (photo_submissions, pois, shops, people, events, services, guides, operators, sponsor detach, staging, **content_reports preserve**, patron assignments via D90 cleanup). (4) Rimuovere DELETE legacy reports; orphan dove previsto. (5) `cities_registry` se in scope piano. |
| **RISCHI** | FK `entity_image_history` RESTRICT (deep analysis); delete non atomico oggi. |
| **TEST** | LIMITED 403; ALL flow modale; reports MF2 post-delete city; orphan POI/photo toggle. |
| **CRITERIO DI CHIUSURA** | Ruolo enforced; modale operativa; reports conservati; nessun path alternativo LIMITED. |

---

### 32.10 Configurazione AI per sezione — **NON RIAPRIRE**

| Campo | Contenuto |
|-------|-----------|
| **DECISIONE** | Config AI **per singola sezione**; **no** schermata globale unica; label uniforme **CONFIGURA GENERATORE AI**. |
| **OGGI** | `AiFieldHelper.tsx`: legge `getAiConfig`; label «Generatore AI» / «Configura Strategia AI»; **`saveAiConfig` zero caller UI**. Sezioni: TabGeneral, EditorGeneral, TabRatings, CulturePatron, CultureHistory, PoiInfoTab, CulturePersonCard, EditorRatings, FormFieldHelper. |
| **COSA · COME · DOVE** | INT-AI-CONFIG-01: pannello modale per `dbKey` con load/save/error/toast; stesso pattern ovunque; **non** unificare Safe-Art (§32.11). |
| **CRITERIO DI CHIUSURA** | Ogni sezione: apri → modifica → salva → ricarica → feedback; label CONFIGURA GENERATORE AI. |

---

### 32.11 Safe-Art — audit DB (NV) + direzione — **NON RIAPRIRE**

| Campo | Contenuto |
|-------|-----------|
| **DECISIONE** | Safe-Art **autonomo**; 4 stili (Realistico, Cinematografico, Fumetto, Paesaggistico); istruzioni per stile editabili e usate in generate; **non** unificare con INT-AI-CONFIG-01. |
| **PRIMA DI RICOSTRUIRE** | **Fatto §33.1:** 7 chiavi `safe_art_*` con `prompts`/`selected`/`presets` — **riusare** contenuti; **non** DELETE righe. |
| **OGGI (repo)** | `SafeArtPanel.tsx`: stub `safe_art_city_real`; generate disabilitato; no get/save config in panel. |
| **COSA · COME · DOVE** | INT-SAFE-ART-RESTORE-01: UI 4 stili prodotto **ma** load/save dalle chiavi DB esistenti (mapping §33.1); generate usa istruzioni stile selezionato. |
| **CRITERIO DI CHIUSURA** | 4 stili UI persistiti; modifica Admin; generate legge stile; inventario DB §33.1 in doc. |

---

### 32.12 INT-13 — audit definitivo — **NON ELIMINARE ORA**

| Area | Esito Audit VII |
|------|-----------------|
| **A Codice** | Definizione: `mediaAssetService.ts` L88+. Caller `src/`, test, scripts, edge: **0**. Re-export: **no**. |
| **B Git** | Introdotto MF3–MF5 (`e904f93`, `ec22f79`, `72016e3`); `git log -S registerAiGeneratedPortraitAsset`: **nessuna** evidenza caller storici in repo. |
| **C vs D90** | Flusso reale: `generateHistoricalPortrait` → `people_portraits/` → `saveCityPerson` RPC. INT-13: richiede **`public-media`**, `upsertEntityImageAssignmentFromSource` transitorio — **sovrapposizione funzionale** con save D90, **non** equivalente bucket. |
| **D Dati storici** | **NV DB:** asset creati solo via INT-13 (es. metadata/source_ref). |
| **E Bucket** | Vincolo `AI_PORTRAIT_PUBLIC_BUCKET = 'public-media'` **unico** a questo helper — documentare se serve a D90 prima di rimozione. |
| **F Rischio rimozione** | **UI attuale: nessuna perdita.** **NV:** eventuali asset storici orfani solo INT-13. |
| **G Consolidamento** | Se serve register senza save entità su `public-media`, **trasferire** in servizio D90 documentato **prima** di INT-13-DECOM. |

**Conclusione:** **NON cancellare INT-13** in questa fase. Classificazione: **codice morto runtime**, **sospeso** fino a NV DB + decisione esplicita INT-13-DECOM o merge funzionalità bucket.

---

### 32.13 Applica Header — audit consumer — **NON ELIMINARE ORA**

| Campo | Contenuto |
|-------|-----------|
| **Percorso save (FV)** | `HeroSection.tsx` → `handleSaveHero` → `global_settings.hero_image` (`useAdminHeaderManager.ts`, `settingsService.ts`). Safe-Art → **preview** fino ad Applica Header. |
| **Consumer `global_settings.hero_image` (FV grep `src/`)** | Admin preview; `useAiMagicCity` (default magic city **admin**); `assetUsageMapService`; `platformPlaceholderOrigin` registry — **non** Home pubblica. |
| **Home pubblica (FV)** | `HeroFilterModule` («Trova la tua meta»), `HeroAiModule` («Il Tuo Consulente») usano **design system** (`designRules.ts` / snapshot) — **nessun** read `configs.hero_image`. |
| **Ipotesi proprietario (§14)** | Sfondo Home legacy rimosso — **coerente** con assenza consumer public in repo. |
| **DECISIONE TECNICA DOCUMENTATA** | **Applica Header = residuo funzionale da eliminare** dopo ack proprietario — intervento **INT-APPLY-HEADER-DECOM-01**: rimuovere pulsante, save, preview coupling non necessario, verificare nessun altro consumer (incluso bootstrap esterno **NV**). |
| **Se consumer trovato in futuro** | Documentare e **mantenere** — Audit VII non ha trovato consumer public in `src/`. |

---

### 32.14 Safe-Art ↔ Applica Header

Dipende da §32.13: **nessuna dipendenza funzionale Safe-Art → hero_image** oltre preview sessione Admin condivisa. Decommission Header **non** impone unificazione Safe-Art con altre config AI. Safe-Art resta autonomo (§32.11).

---

### 32.15 Master Plan — disallineamenti (non modificato in Audit VII)

| Argomento Master Plan | Testo / rischio | Decisione Audit VII | Aggiornamento futuro |
|-----------------------|-----------------|---------------------|----------------------|
| §3.6 D16 «Admin priorità assoluta» vs selezione | Admin sopra real/AI/placeholder | **D-22:** Sponsor **sopra** Admin | **Risolto** — Master Plan Appendice G §G.3, D-CONS-06 |
| §24.1 pipeline «Admin ha immagine? → fine» | Admin first | Obsoleto per POI commerciali | **Risolto** — Appendice G §G.3 |
| Quote Sponsor / Digital Shop | Non numerate min/max in MP (grep) | Tabella §32.3 | Inserire tabella min/max lifecycle |
| Merge immagini victim | Non esplicitato «no transfer» | §32.1 | Documentare regola survivor-only |
| INT-13 / Safe-Art / Applica Header | Non aggiornati post-audit | §32.11–13 | Sezione implementazione post-MF5 |
| Segnalazioni hub unico | D88 modale | Badge/content_reports §32.8 | Specificare decommission legacy counts |

---

## AUDIT VII — OUTPUT FINALE (sezioni A–J)

### A. DECISIONI DEFINITIVAMENTE CHIUSE

Merge survivor-only; D-22 completa + cascata + Sponsor per ordine caricamento; Sponsor min/max lifecycle; sospensione Sponsor automatica; Wikimedia motore unico; Community solo linkage; Patrono partial save; segnalazioni = `content_reports`; verify AI coda separata; tab UI suggerimenti; city delete admin_all; AI config per sezione; Safe-Art autonomo.

### B. DECISIONI NON RIAPRIBILI

§32.0 tabella — **NON** ripresentare come domande prodotto nei prossimi audit.

### C. AUDIT TECNICI COMPLETATI

Merge SQL; D-22 gap; Sponsor form; Wikimedia pipeline callers; Community materialize; Patrono save split; badge dashboard/hub; tab UI; deleteCity; AiFieldHelper; INT-13 reachability; hero_image consumers; Safe-Art repo (DB **NV**).

### D. COSA È DA SVILUPPARE

INT-MERGE-IMG-01; INT-01/01b; INT-SPONSOR-* / INT-SHOP-*; INT-SUSP-*; INT-WM-PHASE-01; INT-06; INT-05/11; INT-REP-DECOM; INT-REP-BADGE-01; INT-REP-UI-01; INT-09; INT-AI-CONFIG-01; INT-SAFE-ART-RESTORE-01 (post NV DB); INT-APPLY-HEADER-DECOM-01 (post ack); INT-13-DECOM (post NV DB).

### E. COME DEVE ESSERE SVILUPPATO

Dettaglio operativo per ogni ID in §32.1–32.14 (migration SQL, servizi, RPC, UI, badge, modale, pattern CONFIGURA GENERATORE AI, riuso `commonsDownloadPipeline`, no seconda logica moderazione Community).

### F. RISCHI E DIPENDENZE

Downgrade D-22 su save automatici; FK delete city + history; badge mix legacy; merge SQL finché INT-MERGE-IMG-01 open; mapping Safe-Art 7 chiavi DB → 4 stili UI (§33.1).

### G. TEST NECESSARI

Per ogni INT: vedi schede §32.1–32.14 + §33 + regression Wikimedia Personaggi + visual tab + role LIMITED city delete.

### H. PUNTI ANCORA APERTI

| Punto | Tipo | Blocco |
|-------|------|--------|
| ~~Magic Add / `hero_image`~~ | **SUPERATA** — **DECISIONE CHIUSA** §35.1 (Audit VIII chiusura) | — |

**Verificati e chiusi in §33–§35:** Safe-Art DB; INT-13 dati storici; Applica Header audit; notifica Sponsor testo/canale; Magic Add.

**Non riaprire (solo sviluppo futuro):** merge; D-22; quote Sponsor; segnalazioni; Wikimedia; Community; Patrono; city delete; AI config; Safe-Art autonomo.

### I. DISALLINEAMENTI MASTER PLAN

§32.15 — disallineamenti **risolti** con **Appendice G** Master Plan + §35.6 (2026-09-27).

### J. ELEMENTI DA NON TOCCARE ANCORA

Codice applicativo; migration; DB write; UI; INT-13 delete; Applica Header remove; Safe-Art rebuild; Master Plan edit; dati legacy delete.

---

## 33. ADDENDUM AUDIT VII — DELTA CHIUSO (verifiche DB + repo) — 2026-09-27

**Metodo:** SELECT read-only su DB live (Supabase service role, sessione 2026-09-27); grep repository + git history. **Nessuna** write DB/codice.

---

### 33.1 Safe-Art — verifica DB reale

| # | Voce | Esito verificato |
|---|------|------------------|
| 1 | **Cosa verificato** | `ai_configs` con `key ILIKE 'safe_art%'` — colonne `key, description, presets, prompts, selected, updated_at` (tabella **non** ha colonna `value`). |
| 2 | **Cosa trovato** | **7 configurazioni** (DB **non** vuoto). |
| 3 | **Chiavi** | `safe_art_artistic`, `safe_art_cinematic_night`, `safe_art_city_real`, `safe_art_people_sketch`, `safe_art_photo_real`, `safe_art_poi_vintage`, `safe_art_technical_prompt`. |
| 4 | **Stili (semantica DB)** | Paesaggistico/pittorico (`artistic`); notturno/cinematografico (`cinematic_night`); città/card real (`city_real` + preset «Foto città / card»); sketch personaggi (`people_sketch`); macro/real (`photo_real`); vintage POI (`poi_vintage`); aggregato legacy (`technical_prompt` — prompt duplicati da altri stili). |
| 5 | **Istruzioni/prompt** | Ogni chiave ha `prompts[]` e `selected[]` (1 prompt attivo ciascuna, salvo `city_real` con 2 prompt + 1 preset). Contenuti **in italiano**, dettagliati (National Geographic, Xerography, macro, ecc.). |
| 6 | **Storiche/inutilizzate** | Tutte **potenzialmente recuperabili**; nessuna flag «disattiva» in schema. `technical_prompt` sembra **bucket storico** sovrapposto ad altri. Codice attuale legge **solo** stub `safe_art_city_real` in `SafeArtPanel.tsx` — **nessuna** chiave letta in UI. |
| 7 | **Recuperabile** | **Sì** — riusare testi esistenti; INT-SAFE-ART-RESTORE-01 deve **mapeare** le 4 etichette prodotto (Realistico, Cinematografico, Fumetto, Paesaggistico) sulle chiavi sopra **senza** cancellare righe DB. Proposta mapping implementativa (non decisione prodotto): Realistico ← `photo_real` + `city_real`; Cinematografico ← `cinematic_night`; Fumetto ← `people_sketch` + `poi_vintage`; Paesaggistico ← `artistic`; `technical_prompt` = archivio/testi da fondere se duplicati. |
| 8 | **Ambiguo** | Nomi chiavi **≠** i 4 stili prodotto; `technical_prompt` non è uno stile UI. **Non** cambia la decisione chiusa (4 stili autonomi): cambia solo il piano **recupero-first** (non rebuild da zero). |
| 9 | **Vuoto?** | **NO** — 7 righe presenti. |
| 10 | **STOP pianificazione?** | **No** — allinea INT-SAFE-ART-RESTORE-01 al recupero DB; **non** creare 4 nuovi stili da zero se i prompt esistono già. |

| Campo | Contenuto |
|-------|-----------|
| **DECISIONE** | Safe-Art **autonomo** (invariata). |
| **NON TOCCARE** | Righe `ai_configs` esistenti; non unificare con CONFIGURA GENERATORE AI. |
| **SVILUPPO** | INT-SAFE-ART-RESTORE-01: UI 4 stili + `getAiConfig`/`saveAiConfig` per chiavi mappate; generate legge `selected`. |
| **DOVE** | `SafeArtPanel.tsx`, `aiConfigService.ts`. |
| **TEST** | Seleziona stile → carica prompt DB; modifica → save; generate usa prompt salvato. |
| **CHIUSURA** | 4 stili UI operativi con contenuti recuperati da DB. |

**Query eseguita (read-only):** `select key, description, presets, prompts, selected, updated_at from ai_configs where key like 'safe_art%' order by key`.

---

### 33.2 INT-13 — verifica DB reale (`registerAiGeneratedPortraitAsset`)

| # | Voce | Esito |
|---|------|-------|
| 1 | **Cosa verificato** | `media_assets` con `storage_bucket = 'public-media'` AND `generated_by_ai = true`; `source_ref` ILIKE `%registerAi%`; campione `origin_type = 'ai'`; path `%people_portraits%`. |
| 2 | **Trovato — certo INT-13** | **0** asset. Nessun `source_ref` riconducibile al helper. **0** righe `generated_by_ai = true` in tutta la tabella (conteggio head). |
| 3 | **Probabilmente INT-13** | **0** — il flusso impone bucket `public-media` + patch AI post-assignment; nessun asset AI in quel bucket. |
| 4 | **Non riconducibile / altro flusso** | 1 riga con path che contiene `people_portraits` ma `storage_bucket = 'external'`, `origin_type = 'admin'`, `generated_by_ai = false` — **flusso D90/`generateHistoricalPortrait`**, non INT-13. 7 asset `public-media` = galleria patrono/admin/community (path `city_patron_gallery/`, `edited_assets/`). |
| 5 | **Funzionalità unica a rischio** | Solo vincolo codice **bucket `public-media`** nel helper (mai invocato). Flusso reale usa `people_portraits/`. |
| 6 | **DECISIONE documentale** | Dati storici INT-13: **assenti**. INT-13 resta **non eliminato** fino a commit decommission; classificazione: **INT-13-DECOM ammissibile** dopo decisione implementativa (zero perdita dati verificata). |
| **NON TOCCARE** | Funzione `registerAiGeneratedPortraitAsset` in codice. |
| **SVILUPPO** | INT-13-DECOM: rimuovere helper + doc; opzionale nota bucket in D90 se serve. |
| **TEST** | Post-rimozione: grep zero ref; portrait AI personaggi invariato. |
| **CHIUSURA** | Decommission codice + verifica regression D90. |

---

### 33.3 Applica Header — verifica definitiva (repo + DB)

| # | Voce | Esito |
|---|------|-------|
| 1 | **Cosa verificato** | Pulsante `Applica Header (DB)` (`HeroSection.tsx` L110–115) → `handleSaveHero` → `global_settings` chiave `hero_image`; grep consumer `src/`; Home `HeroSection` / `HeroFilterModule` / `HeroAiModule`; git history home hero background; DB riga `hero_image`. |
| 2 | **DB `global_settings.hero_image`** | **Nessuna riga** presente (`select … where key = 'hero_image'` → null). Setting **non** valorizzato oggi in DB. |
| 3 | **Ipotesi storica Home** | **Confermata rimozione consumer:** commit `93ddad8` e stato attuale — `HeroFilterModule` **non** accetta più `heroImage` / background da config; moduli «Trova la tua meta» / «Il Tuo Consulente» usano **design system** (`useDynamicStyles`, token). **Nessun** read `configs.hero_image` in `src/components/home/**`. |
| 4 | **Consumer attuali di `global_settings.hero_image`** | (a) **Admin Asset Globali** — preview/salva/rimuovi (`useAdminHeaderManager.ts`); (b) **`useAiMagicCity.ts` L70–75, L254, L270** — fallback `imageUrl` / `details.heroImage` **città** in Magic Add (admin), **non** Home pubblica; (c) `platformPlaceholderOrigin.ts` — registry chiavi Asset Globali; (d) `ConfigContext` carica tutte le settings (generico). **Non** confondere con `cities.hero_image` (campo città — usato ranking/read city). |
| 5 | **Safe-Art** | Preview condivisa in sessione Admin; save su DB **solo** su Applica Header — **non** dipendenza funzionale persistente oltre preview. |
| 6 | **CASO A/B** | **Ibrido documentato:** residuo **Home piattaforma** = **CASO A** (eliminabile). **CASO B minimo:** Magic Add admin legge ancora `configs.hero_image` come default città (oggi stringa vuota se DB assente). |
| **DECISIONE (chiusa)** | **Decommission completo** Applica Header + chiave `global_settings.hero_image` **previsto**, con **prerequisito** INT-APPLY-HEADER-DECOM-01: decouple `useAiMagicCity` (fallback `''` o placeholder città esistente, **non** hero globale). |
| **NON TOCCARE (ora)** | Pulsante, save, setting. |
| **ELIMINARE in sviluppo** | Pulsante Applica Header; `handleSaveHero` / remove hero; sezione hero piattaforma in Asset Globali se solo quella funzione; chiave `global_settings.hero_image`; preview coupling non necessario; voce `hero_image` in registry se orphan; refactor Magic Add. |
| **TEST** | Home invariata; Magic Add crea città senza hero globale; Asset Globali senza regressione altri asset. |
| **CHIUSURA** | Zero caller `HERO_IMAGE` / hero piattaforma; DB senza chiave (o rimossa). |

---

### 33.4 Notifica Sponsor — decisione definitiva (prodotto + canale)

| Campo | Contenuto |
|-------|-----------|
| **DECISIONE** | Alla sospensione/blocco admin di una foto Sponsor, l’utente Sponsor riceve notifica **chiara e neutra**; testo **modificabile** da Admin senza deploy codice. |
| **Quando** | Transizione a stato sospeso/non attivo della foto Sponsor (INT-SUSP-ADMIN-01 + INT-SPONSOR-NOTIF-01), dopo salvataggio moderazione. |
| **Dove configurabile** | Admin Panel → **Comunicazioni** → tab **Standard** → sotto-tab **Notifiche Esterne** (`AdminCommunications.tsx` + `CommsTemplates.tsx`); persistenza tabella **`system_messages`**, `type = 'external'`. |
| **Chiave proposta** | `sponsor_photo_suspended` (nuova riga seed/migration in fase impl.; oggi **assente** in DB — esiste solo `sponsor_active`). |
| **Titolo notifica (template)** | `Foto Sponsor non più attiva` |
| **Corpo (TESTO DEFINITIVO APPROVATO)** | «Una delle immagini del tuo profilo Sponsor non è più utilizzata come immagine attiva, a seguito di una verifica amministrativa. In alcuni casi ciò può dipendere dal possibile non rispetto di regole della piattaforma (ad esempio contenuti non appropriati, privacy, diritti o licenze, materiale offensivo o altre policy applicabili). Non indichiamo una violazione specifica: si tratta di un controllo di conformità. Per chiarimenti o se ritieni si tratti di un errore, contatta il supporto tecnico.» — dettaglio anteprime §34.4 |
| **Variabili opzionali** | `{entityLabel}` (nome POI/negozio/guida) — sostituzione lato codice se presente; corpo valido anche senza variabili. |
| **COME (codice futuro)** | `getCachedSystemMessage('sponsor_photo_suspended')` → `bodyTemplate` / `titleTemplate` → `addNotification(userId, …)` (`notificationService.ts`); **no** stringa hard-coded in sorgente. |
| **NON TOCCARE** | Flussi moderazione esistenti fino a INT-SPONSOR-NOTIF-01. |
| **TEST** | Sospensione foto → notifica con testo da DB; modifica template in Comunicazioni → prossima notifica usa nuovo testo. |
| **CHIUSURA** | Template in `system_messages` + notifica inviata su sospensione Sponsor. |

---

### 33.5 Master Plan

**Allineato** in chiusura §35 — vedi `AI_IMAGE_MANAGEMENT_MASTER_PLAN.md` Appendice G.

---

---

## 34. ADDENDUM AUDIT VIII — 2026-09-27

**Scope:** chiusura decisioni INT-13, Safe-Art, notifica Sponsor; analisi autonoma **Magic Add**; Master Plan invariato. **Nessuna implementazione** in questa sessione.

**Nota cronologica:** sezioni anteriori che citano INT-13 «sospeso / non eliminare» sono **storiche**; **Audit VIII §34.1** prevale.

---

### 34.1 INT-13 — APPROVATO PER LA RIMOZIONE (DECISIONE CHIUSA)

| Campo | Contenuto |
|-------|-----------|
| **DECISIONE DEFINITIVA** | **`registerAiGeneratedPortraitAsset`** (**INT-13**) — **approvato per rimozione** dal proprietario (Audit VIII). **Non** più punto aperto. |
| **Audit conservato** | Definizione: `src/services/media/mediaAssetService.ts` (~L88+). **Zero caller** in `src/`, test, scripts, edge functions, re-export (audit VI–VII). Flusso portrait reale: `generateHistoricalPortrait` → `people_portraits/` → `saveCityPerson` D90. DB (VII): 0 asset `generated_by_ai=true`; 0 `public-media` AI; 0 `source_ref` register; nessun dato storico attribuibile. |
| **NON TOCCARE ORA** | Codice e funzione in repo fino alla fase implementativa. |
| **COSA (futuro INT-13-REMOVE-01)** | Rimuovere `registerAiGeneratedPortraitAsset`, tipo `RegisterAiPortraitAssetInput`, costante/uso collegato solo a quella funzione; aggiornare riferimenti documentali interni al repo se necessario. |
| **COME** | 1) `rg registerAiGeneratedPortraitAsset` repo intero. 2) Delete blocco in `mediaAssetService.ts`. 3) `npm run check` (typecheck + biome + layers). 4) Test portrait personaggi (manual/E2E admin) post-rimozione. 5) Verificare nessun import rotto in audit/post-MF5 markdown (opzionale). |
| **DOVE** | `src/services/media/mediaAssetService.ts` (primario); eventuali mention in `AI_IMAGE_MANAGEMENT_*.md` (manutenzione doc separata). |
| **PERCHÉ** | Codice morto; flusso D90 copre portrait; zero dati INT-13. |
| **RISCHI** | Basso se grep pulito; vincolo bucket `public-media` del helper **non** usato altrove — documentare in commento D90 se serve memoria tecnica. |
| **TEST POST-RIMOZIONE** | Typecheck; Biome; generazione portrait admin; save person; nessuna regressione `mediaAssetService` export usati (`patchMediaAssetProvenance`, queue AI, ecc.). |
| **CRITERIO DI CHIUSURA** | Zero occorrenze simbolo; `npm run check` verde; portrait D90 OK. |

---

### 34.2 MAGIC ADD — analisi Audit VIII (decisione **CHIUSA** in §35.1)

> **Stato vigente:** **DECISIONE DEFINITIVA** — Magic Add **resta**; **non** assegna più automaticamente la fotografia città; **non** usa `global_settings.hero_image`. Dettaglio operativo §35.1.  
> Il testo sotto resta **analisi tecnica** Audit VIII (percorso, Git, scenari); **non** riaprire come domanda di prodotto.

#### A. Cos'è Magic Add (prodotto)

| Voce | Descrizione |
|------|-------------|
| **Nome UI** | «Nuova Città AI» / processo log «MAGIC ADD» / «MAGIC ENRICHMENT» (`useAiMagicCity.ts` L119). |
| **Funzione** | Strumento **Admin** per **creare o arricchire** una città nel registro con contenuti generati da AI: anagrafica, storia, rating, patrono, personaggi, POI draft, servizi, eventi, guide, operatori. |
| **Problema risolto** | Accelerare onboarding territoriale senza compilazione manuale completa. |
| **Chi** | Admin con accesso **Manager Città** (`CitiesManager.tsx`, tab lista/mappa). |
| **Dove in app** | Admin → Città → modale **Nuova Città AI** (`CityGeneratorModal.tsx`) → `ProcessLogModal` durante esecuzione. |

#### B. Flusso tecnico (passo-passo)

| Step | Nome UI | Azione |
|------|---------|--------|
| 0 | Modale | Admin inserisce nome città + `poiCount` (default 10). |
| 0b | Conflitto | Se città esiste: bozze → merge; scheletro → popola; **online** → blocco (`CitiesManager` L94–98). |
| 1 | Analisi & Creazione/Arricchimento | `resolveCanonicalCityId` (registry); AI `generateCitySection` (general, stats, history, ratings, patron) + suggest guide/eventi/servizi/personaggi; build `CityDetails`; **`saveCityDetails`**. |
| 2 | Ricerca Flash POI | Per 6 macro-categorie: `suggestNewPois` → `saveSinglePoi` draft (`imageUrl: ''`). |
| 3 | Bonifica Servizi | `refineServiceData` → save guide/eventi/operatori/servizi. |
| 4 | Validazione | `verifyDraftsBatch` (POI); enrichment personaggi draft (`enrichPersonData`, portrait `findExistingPortrait`). |
| 5 | Finalizzazione | Append log generazione → `saveCityDetails`. |

**Hook/servizi principali:** `useCityGenerator` → `useAiMagicCity`; `useAiTaskRunner`; `useAiValidation.verifyDraftsBatch`; `cityService` (save/get); `services/ai/*` (generate, suggest, refine); **nessuna** Edge Function dedicata «magic add».

#### C. Dove (file)

| Layer | Path |
|-------|------|
| UI ingresso | `src/components/admin/CitiesManager.tsx`, `cities/CitiesListTab.tsx`, `cities/CityGeneratorModal.tsx`, `cities/ProcessLogModal.tsx` |
| Orchestrazione | `src/hooks/useCityGenerator.ts`, `src/hooks/admin/useAiMagicCity.ts` |
| AI | `src/services/ai` (generateCitySection, suggestNewPois, suggestCityPeople, refineServiceData, enrichPersonData, …) |
| Persistenza | `saveCityDetails`, `saveSinglePoi`, `saveCityPerson`, `saveCityGuide`, … (`cityService`) |
| Config globale | `useConfig()` / `ConfigContext` — bootstrap `global_settings` |

#### D. `hero_image` in Magic Add

| Domanda | Risposta (FV codice) |
|---------|----------------------|
| Perché legge `hero_image`? | Commento L238: «CLEANUP: Usa il default globale invece di Unsplash hardcoded» — sostituire placeholder Unsplash per **immagine città** (`cities.imageUrl` / `details.heroImage`), **non** Home piattaforma. |
| Dove letto | `useAiMagicCity.ts` L70–75: `defaultHero` da `configs.hero_image` o `configs.HERO_IMAGE`. |
| Dove applicato | L251–254 `imageUrl`; L266–270 `details.heroImage` — **solo se** valore esistente assente o contiene `unsplash`. |
| Se `hero_image` esiste | URL salvato su città draft come card/hero **città**. |
| Se assente (DB oggi) | `defaultHero = ''` — città senza URL immagine finché non impostata altrove. |
| Fallback? | Sì, condizionale: preserva immagine città esistente non-unsplash; altrimenti `defaultHero`. |
| Errore se assente? | **No** — stringa vuota ammessa. |
| Altri fallback POI | POI creati con `imageUrl: ''`; personaggi usano `findExistingPortrait` / enrichment. |
| Legame Applica Header | **Indiretto:** stessa chiave `global_settings.hero_image` che Applica Header **scrive**; Magic Add **legge** a runtime bootstrap. Safe-Art → preview Applica Header **non** alimenta Magic Add senza save. |
| Funzione reale oggi | **Admin-only default** per copertina città in generazione AI; **non** consumer Home public. |

#### E. Storia Git (FV)

| Evidenza | Interpretazione |
|----------|-----------------|
| Firebase init (`366f090`) | Già `getGlobalImage('hero')` + stesso pattern unsplash → default globale. |
| `bff37a8` | Migrazione a `configs.hero_image` / `HERO_IMAGE` via `ConfigContext`. |
| Home refactor (`93ddad8` area) | `HeroFilterModule` **non** passa più `heroImage` background da config (rimosso prop). |
| Conclusione storica | Dipendenza Magic Add ↔ hero globale **predates** rimozione background Home; originariamente stesso asset «hero» piattaforma; Home **non** lo usa più; Magic Add **sì** ancora come default città. |

#### F. Impatto scenari (senza decisione)

| # | Scenario | Cosa cambia | File | Rischi | Test |
|---|----------|-------------|------|--------|------|
| 1 | Magic Add **invariato** | Nessuno | — | hero DB vuoto → città senza cover | Magic add città nuova |
| 2 | Magic Add OK, **scollegato** da `hero_image` | `defaultHero` = `''` o placeholder categoria città / `GLOBAL_ASSET_DEFAULTS` | `useAiMagicCity.ts` | Città senza cover fino ad altro flusso | Confronto payload saveCityDetails |
| 3 | Elimina **solo** hero globale (Applica Header decom) senza (2) | Magic Add legge config vuota → come oggi se DB vuoto | Header manager + settings | Nessuno extra se DB già vuoto | Magic add + Asset Globali |
| 4 | Dipendenza indiretta Applica Header | Solo se admin salva hero via Applica Header **poi** Magic Add — allora default città = quell’URL | `useAdminHeaderManager`, `useAiMagicCity` | Accoppiamento operativo admin | Save hero → magic add nuova città |

#### G. Confronto per il proprietario (neutro)

- **Magic Add oggi fa:** generazione/arricchimento automatico contenuti città (draft) via AI multi-step Admin.
- **Utilizza `hero_image` per:** impostare `imageUrl` / `details.heroImage` della **città** quando non c’è già un’immagine valida (non Unsplash), leggendo il valore globale da bootstrap.
- **Se eliminiamo `hero_image` (setting + Applica Header) senza toccare Magic Add:** Magic Add non legge più nulla di utile → **comportamento equivalente a oggi con DB vuoto** (`defaultHero ''`).
- **Se scolleghiamo Magic Add da `hero_image` esplicitamente:** stesso effetto operativo se fallback = `''`; si può sostituire con altro default **solo se** il proprietario lo chiederà in decisione futura.

**Esito proprietario (§35.1):** scollegamento esplicito da `hero_image`; nessun fallback automatico foto città; città creata/completata **senza** immagine se assente.

---

### 34.3 Safe-Art — DIREZIONE APPROVATA / PRONTO PER SVILUPPO (DECISIONE CHIUSA)

| Campo | Contenuto |
|-------|-----------|
| **DECISIONE** | Safe-Art **autonomo**; 4 stili prodotto; istruzioni per stile editabili; **recupero** righe DB `safe_art_*` (**non** DELETE). |
| **Mapping storico → 4 stili** | **Realistico:** `safe_art_photo_real` (primary prompt macro/real), **`safe_art_city_real`** (secondario: preset «Foto città / card» + prompt documentaristico). **Cinematografico:** `safe_art_cinematic_night`. **Fumetto:** `safe_art_people_sketch` (volti/sketch), **`safe_art_poi_vintage`** (architetture vintage/xerography) — UI può offrire sotto-variante o unificare selezione «Fumetto». **Paesaggistico:** `safe_art_artistic` (olio/paesaggio). **`safe_art_technical_prompt`:** **archivio** — prompt duplicati; import/manuale in UI, **non** cancellare DB. |
| **Contenuti** | **Mantenere** tutti i `prompts[]`/`selected[]`/`presets` DB; **adattare** solo etichette UI ai 4 nomi prodotto. |
| **COSA** | INT-SAFE-ART-RESTORE-01: pannello stile + editor istruzioni + save + generate + preview (Asset Globali). |
| **COME — operazioni** | Load: `getAiConfig(dbKey)` per chiave mappata allo stile selezionato. View/edit: textarea/list prompt, add/remove righe locali → `saveAiConfig({ key, prompts, selected })`. Generate: `generateImage` con prompt **selected** dello stile; upload `ai_generated`; preview callback (senza unificare ad AiFieldHelper). |
| **DOVE** | `src/components/admin/design/SafeArtPanel.tsx`, `src/hooks/admin/useAdminHeaderManager.ts` (preview only), `src/services/aiConfigService.ts`, `src/services/ai/*` + upload esistente Safe-Art. **Non** `AiFieldHelper`. |
| **DB** | **7 righe** restano; eventuali nuove chiavi **solo** se mapping insufficiente e proprietario approva (default: riusare esistenti). **No** migration obbligatoria se schema `ai_configs` già sufficiente. |
| **RPC/API** | Nessuna RPC dedicata; CRUD via `ai_configs` PostgREST come oggi `saveAiConfig`. |
| **TEST** | 4 stili switch; load prompt DB; modifica/save/reload; generate usa prompt salvato; regression Asset Globali altri tab. |
| **Mobile/a11y/DS** | Form Admin esistenti pattern slate/indigo; touch target ≥44px; label stile accessibili. |
| **CRITERIO DI CHIUSURA** | 4 stili prodotto operativi con dati recuperati da DB. |

---

### 34.4 Notifica Sponsor — meccanismo, testo, anteprime (DECISIONI CHIUSE)

#### Testo e canale (APPROVATO)

| Voce | Valore |
|------|--------|
| **Template key** | `sponsor_photo_suspended` (`system_messages`, `type: external`) |
| **Titolo (DEFINITIVO APPROVATO)** | Foto Sponsor non più attiva |
| **Corpo (DEFINITIVO APPROVATO)** | Una delle immagini del tuo profilo Sponsor non è più utilizzata come immagine attiva, a seguito di una verifica amministrativa. In alcuni casi ciò può dipendere dal possibile non rispetto di regole della piattaforma (ad esempio contenuti non appropriati, privacy, diritti o licenze, materiale offensivo o altre policy applicabili). Non indichiamo una violazione specifica: si tratta di un controllo di conformità. Per chiarimenti o se ritieni si tratti di un errore, contatta il supporto tecnico. |
| **Config Admin** | Comunicazioni → **Standard** → **Notifiche Esterne** (`AdminCommunications`, `CommsTemplates`, `communicationService.saveSystemMessageAsync`) |

#### Regole operazione / notifiche (REQUISITO APPROVATO)

| Caso | Comportamento |
|------|----------------|
| **1** — 1 foto sospesa | 1 notifica; testo + **1 anteprima**. |
| **2** — N foto stessa operazione Admin | **1 sola** notifica; testo + **N anteprime**. |
| **3** — operazioni in momenti diversi | **1 notifica per operazione** (non raggruppare retroattivo). |
| **4** — tutte le foto in un’unica operazione | 1 notifica; tutte le anteprime dell’operazione. |

#### Architettura anteprime (FV + piano)

| Voce | Analisi |
|------|---------|
| **FV oggi** | `notifications`: `title`, `message`, `link_data` JSON; **nessun** campo immagini. `UserNotificationsTab` renderizza **solo testo** — **non** sufficiente per anteprime. |
| **Evento origine** | Fine transazione admin «sospendi foto Sponsor» (batch unico) — INT-SUSP-ADMIN-01 + INT-SPONSOR-NOTIF-01. |
| **Operazione** | Identificatore **`suspensionOperationId`** (UUID generato all’inizio azione admin, condiviso da tutte le foto del batch). |
| **Anti-duplicato** | Un insert notifica per `(sponsorUserId, suspensionOperationId)` — vincolo app o check prima insert; **non** ri-notificare stesso operationId. |
| **Snapshot anteprima** | In `link_data` (esteso) persistere array **`suspendedPreviews`**: `{ mediaAssetId, publicUrl, storageBucket, storagePath, suspendedAt }` catturati **al momento sospensione** (URL pubblico o path risolvibile). **Non** affidarsi solo a primary live post-suspend. |
| **Asset non disponibile** | Fallback placeholder Sponsor/categoria in UI; messaggio testo invariato. |
| **Sicurezza** | Notifica solo `user_id` titolare sponsor; RLS read notifications; URL solo asset già visibili al partner o thumbnail derivata da path snapshot. |
| **Tipo notifica** | Nuovo `NotificationType` es. `sponsor_photo_suspended` o riuso `info` + discriminator in `link_data` — preferibile tipo dedicato per filtri/badge futuri. |

#### Piano sviluppo INT-SPONSOR-NOTIF-01

| Area | Dettaglio |
|------|-----------|
| **COSA** | Seed `system_messages` template; servizio `notifySponsorPhotosSuspended({ userId, operationId, previews[] })`; estensione tipi `AppNotification.linkData`; UI lista + dettaglio con griglia anteprime; hook sospensione admin invoca servizio **una volta** per operazione. |
| **COME** | Admin suspend handler raccoglie asset IDs → dopo commit DB success → resolve testo da `getCachedSystemMessage('sponsor_photo_suspended')` → costruisce snapshot URL → `addNotification` con `link_data.suspendedPreviews` + `operationId`. Transazione: sospensioni DB first; notifica best-effort con log errore (dati già sospesi). |
| **DOVE** | Servizio nuovo es. `src/services/sponsor/sponsorPhotoSuspensionNotificationService.ts`; call site futuro in flusso INT-SUSP-ADMIN-01 (admin POI/sponsor media UI); `notificationService.ts`; `src/types/models/Media.ts`; `UserNotificationsTab.tsx` (+ eventuale componente `NotificationPreviewGrid`); migration seed SQL `system_messages`; opzionale indice/constraint duplicati lato app. |
| **TEST** | (1) 1 foto; (2) 2 foto stessa op; (3) molte foto stessa op; (4) 2 op temporali separate; (5) tutte foto; (6) duplicato operationId bloccato; (7) render anteprime; (8) asset mancante; (9) auth partner vs altro user; (10) admin_all vs limited (limited non sospende se policy); (11) mobile layout griglia; (12) a11y alt text da entity label; (13) stress 10 anteprime. |
| **CRITERIO DI CHIUSURA** | Template modificabile in Comunicazioni; casi 1–4 rispettati; anteprime visibili; no duplicati per operazione. |

---

### 34.5 Applica Header — stato dopo Audit VIII (sequenza finale §35.2)

| Voce | Stato |
|------|--------|
| Decommission **Applica Header** / vecchio hero Home | **Approvato** (VII) — Home non consuma; background moduli rimosso. |
| Riga DB `hero_image` | Assente (VII SELECT). |
| **Sequenza decommission** | §35.2 — **Magic Add deciso**; eseguire scollegamento Magic Add **prima** della rimozione codice/chiave hero globale. |
| Safe-Art | Preview sessione; **autonomo** — **non** eliminare con Applica Header. |

---

### 34.6 Master Plan

**Allineato** in chiusura decisionale §35.6 — `AI_IMAGE_MANAGEMENT_MASTER_PLAN.md` Appendice G (2026-09-27).

---

### 34.7 Stato finale Audit VIII (pre-chiusura §35)

| # | Stato | Voce |
|---|--------|------|
| 1 | **CHIUSA** | INT-13 → **APPROVATO PER RIMOZIONE** |
| 2 | **CHIUSA** | Safe-Art → **PRONTO PER SVILUPPO** |
| 3–6 | **CHIUSA** | Notifica Sponsor (meccanismo, testo, anteprime, raggruppamento) |
| 7 | **CHIUSA** (§35.1) | **Magic Add** — resta; no auto-foto; no `hero_image` |

Tabella stato complessivo post-chiusura: **§35.8**.

---

## 35. CHIUSURA DECISIONALE — Audit VIII + allineamento Master Plan — 2026-09-27

**Scope:** decisioni **definitive** emerse dagli audit VII/VIII; **nessuna implementazione** in questo intervento (solo documentazione).  
**Riferimenti codice verificati:** repository `src/` a data 2026-09-27.

### 35.1 Magic Add — DECISIONE DEFINITIVA

| Campo | Contenuto |
|-------|-----------|
| **DECISIONE** | Magic Add **DEVE RIMANERE**. Continua a creare/completare/arricchire la città e tutte le sezioni del flusso attuale. **Eliminata** la responsabilità di assegnare **automaticamente** una fotografia alla città. |
| **PERCHÉ** | La fotografia città appartiene ad altri flussi (Admin, media città dedicati); Magic Add non è un sistema di gestione immagini; evitare fallback globali non trasparenti. |
| **COSA (sviluppo futuro)** | Rimuovere lettura `global_settings.hero_image` / `HERO_IMAGE` da Magic Add; non introdurre placeholder/fallback sostitutivi automatici; se manca foto valida → `imageUrl` / `details.heroImage` **vuoti** (stringa vuota o null coerente con mapper esistente). |
| **COME** | 1) Eliminare blocco `defaultHero` da `configs` in `useAiMagicCity.ts` (L70–75). 2) In build `CityDetails` (L251–254, L266–270): usare **solo** immagine città esistente non-unsplash; altrimenti `''` (o omit). 3) **Non** leggere `useConfig()` per hero se l’unico uso era `defaultHero`. 4) Regression test Magic Add end-to-end. |
| **DOVE** | **UI:** `src/components/admin/CitiesManager.tsx` → `CityGeneratorModal.tsx` → `useCityGenerator.executeMagicAdd`. **Hook:** `src/hooks/admin/useAiMagicCity.ts` (unico punto applicazione hero oggi). **Config (da scollegare):** `src/context/ConfigContext.tsx` (`hero_image`, `HERO_IMAGE`); bootstrap `global_settings` via settings service. **Non confondere** con `cities.hero_image` (campo entità città — resta gestito da altri flussi). |
| **DIPENDENZE** | Applica Header / `SETTINGS_KEYS.HERO_IMAGE` (`src/services/settingsService.ts`); `useAdminHeaderManager.ts` (save/remove hero); `platformPlaceholderOrigin.ts` L17 (`hero_image` in registry Asset Globali); sequenza §35.2. |
| **RISCHI** | Regressione creazione città; rimozione accidentale di step AI non legati all’immagine; introdurre nuovi fallback; rimuovere `hero_image` globale **prima** dello scollegamento Magic Add. |
| **TEST** | Magic Add crea nuova città **senza** fotografia; altre sezioni (patrono, POI draft, personaggi, servizi) **invariati**; nessun errore con immagine assente; **nessuna** query/lettura `hero_image` in Magic Add; nessun fallback hero globale; flussi Admin foto città separati OK; layout mobile invariato dove pertinente. |
| **CRITERIO DI CHIUSURA** | Magic Add operativo per città/contenuti; **zero** assegnazione automatica foto; **zero** dipendenza da `global_settings.hero_image`. |
| **NON MODIFICARE (in questo INT)** | POI Magic Add (`imageUrl: ''` già oggi); portrait personaggi (`findExistingPortrait`); eliminazione INT-13; decommission Header (INT separato). |

### 35.2 Applica Header — decommission DEFINITIVO (sequenza)

| Campo | Contenuto |
|-------|-----------|
| **DECISIONE** | **Applica Header** completamente **decommissionato** (vecchio hero piattaforma Home). Safe-Art **resta autonomo**. |
| **PERCHÉ** | Nessun consumer Home pubblico; background hero rimosso; DB senza riga `hero_image`; dipendenza residua rilevante era Magic Add (ora deciso §35.1). |
| **COSA** | Percorso Admin «Applica Header (DB)» + save/remove hero globale; chiave `global_settings.hero_image` solo quando **zero** consumer legittimi. |
| **COME (ordine obbligatorio)** | 1) **INT-MAGIC-ADD-DECOUPLE-01** — §35.1. 2) `rg hero_image` / `HERO_IMAGE` / `SETTINGS_KEYS.HERO_IMAGE` su repo; elencare consumer reali (attesi post-1: `useAdminHeaderManager`, `HeroSection` admin, `platformPlaceholderOrigin`, tipi Supabase — **non** Magic Add). 3) **INT-APPLY-HEADER-DECOM-01:** rimuovere UI `src/components/admin/adminHeaderManager/HeroSection.tsx` (pulsante Applica Header), handler `handleSaveHero` / remove in `useAdminHeaderManager.ts`, wiring in `AdminHeaderManager.tsx`. 4) Rimuovere save setting hero **solo se** orphan. 5) Rimuovere `'hero_image'` da `PLATFORM_PLACEHOLDER_SETTING_KEYS` **solo se** nessun write/read legittimo. 6) Opzionale migration: drop row `global_settings` se mai ricreata. |
| **DOVE** | `useAdminHeaderManager.ts`, `adminHeaderManager/HeroSection.tsx`, `AdminHeaderManager.tsx`, `settingsService.ts` (`HERO_IMAGE: 'hero_image'`), `platformPlaceholderOrigin.ts`, `ConfigContext.tsx`. **Safe-Art:** `SafeArtPanel.tsx` + preview in header manager — **mantenere**. **Home pubblica:** `src/components/home/HeroSection.tsx` — **non** usa hero globale DB (distinto da admin). |
| **DIPENDENZE** | §35.1 completato; Safe-Art non bloccante. |
| **RISCHI** | Rimozione prematura chiave mentre Magic Add legge ancora; regression Asset Globali (altri placeholder); confusione `cities.hero_image` vs setting globale. |
| **TEST** | Home pubblica invariata; Magic Add senza hero globale; Asset Globali (patron, placeholder, Safe-Art) OK; nessun consumer runtime di `global_settings.hero_image`. |
| **CRITERIO DI CHIUSURA** | **Zero** consumer legittimi del vecchio hero globale; **zero** dipendenza Magic Add da `hero_image`. |

### 35.3 Sponsor — notifica + anteprime (DEFINITIVO)

| Campo | Contenuto |
|-------|-----------|
| **DECISIONE** | Meccanismo, **testo definitivo approvato**, **anteprime obbligatorie**, raggruppamento **una notifica per operazione di sospensione**. **Non** riaprire. |
| **TESTO DEFINITIVO APPROVATO** | **Titolo:** «Foto Sponsor non più attiva». **Corpo:** «Una delle immagini del tuo profilo Sponsor non è più utilizzata come immagine attiva, a seguito di una verifica amministrativa. In alcuni casi ciò può dipendere dal possibile non rispetto di regole della piattaforma (ad esempio contenuti non appropriati, privacy, diritti o licenze, materiale offensivo o altre policy applicabili). Non indichiamo una violazione specifica: si tratta di un controllo di conformità. Per chiarimenti o se ritieni si tratti di un errore, contatta il supporto tecnico.» |
| **Persistenza testo** | Admin → **Comunicazioni** → **Standard** → **Notifiche Esterne** (`AdminCommunications.tsx`, tab con `CommsTemplates.tsx`); `system_messages` con `type = external`, chiave **`sponsor_photo_suspended`**; load/save via `communicationService.ts` (`getCachedSystemMessage`, `saveSystemMessageAsync`). **Vietato** hard-code nel codice applicativo. |
| **Regola raggruppamento (DEFINITIVA)** | **Stessa operazione Admin** → **una sola** notifica con **tutte** le anteprime delle foto sospese in quell’operazione. **Operazioni diverse** → notifiche **separate**. Motivo: evitare spam (N notifiche per N foto nello stesso intervento) mantenendo tracciabilità tra interventi distinti. |
| **COSA** | Servizio notifica post-sospensione; seed template; estensione `link_data`; UI griglia anteprime in area utente Sponsor. |
| **COME** | Handler sospensione raccoglie asset → **commit DB sospensione prima** → genera `suspensionOperationId` (UUID per batch) → snapshot anteprime → `getCachedSystemMessage('sponsor_photo_suspended')` → `addNotification` (`notificationService.ts`) con `link_data.suspendedPreviews[]` + `link_data.suspensionOperationId`; **un insert** per `(userId, suspensionOperationId)`; notifica **best-effort** (errore notifica **non** annulla sospensione). |
| **DOVE** | Nuovo servizio es. `src/services/sponsor/sponsorPhotoSuspensionNotificationService.ts`; call site futuro **INT-SUSP-ADMIN-01** (flusso admin moderazione Sponsor — **non presente** come nome file oggi; agganciare al handler reale quando implementato); `notificationService.ts`; tipi `AppNotification` / `src/types/models/Media.ts` (estensione `linkData`); `src/components/user/dashboard/UserNotificationsTab.tsx`; componente griglia es. `NotificationPreviewGrid` (da creare); migration/seed SQL `system_messages`. |
| **DIPENDENZE** | INT-SUSP-ADMIN-01; policy `admin_all` / `admin_limited` (§32); RLS `notifications`. |
| **RISCHI** | Duplicati notifica; leak anteprima ad utente non titolare; URL asset non più risolvibile post-suspend. |
| **TEST** | (1) 1 foto; (2) 2 foto stessa op; (3) molte foto stessa op; (4) 2 op separate; (5) tutte le foto Sponsor; (6) duplicato `suspensionOperationId` bloccato; (7) render anteprime; (8) asset mancante → placeholder; (9) auth titolare Sponsor; (10) admin_all vs admin_limited; (11) mobile griglia; (12) a11y alt text; (13) stress fino a max foto Sponsor prodotto. |
| **CRITERIO DI CHIUSURA** | Testo modificabile in Comunicazioni; anteprime visibili; raggruppamento corretto; nessun duplicato per operazione; mobile + a11y OK. |

Dettaglio tabellare Audit VIII: **§34.4** (invariato nel merito, ora **solo** riferimento storico VIII).

### 35.4 INT-13 — DECISIONE DEFINITIVA (rimozione approvata, non implementata)

| Campo | Contenuto |
|-------|-----------|
| **DECISIONE** | **APPROVATO PER RIMOZIONE** — `registerAiGeneratedPortraitAsset` e percorso morto. |
| **COSA** | **INT-13-REMOVE-01:** eliminare funzione, tipi input dedicati, export collegati. |
| **COME** | `rg registerAiGeneratedPortraitAsset` → delete in `src/services/media/mediaAssetService.ts` (L88+); `npm run check`; test portrait via `generateHistoricalPortrait` → `people_portraits/` → `saveCityPerson` **intatti**. |
| **DOVE** | `mediaAssetService.ts` (unica definizione verificata). |
| **EVIDENZA** | Zero caller; zero dati INT-13 in DB (§33.2); portrait storico = percorso D90/admin. |
| **CRITERIO DI CHIUSURA** | Zero simbolo; check verde; flusso portrait reale OK. |

Sezioni storiche «INT-13 sospeso / non eliminare» → **SUPERATE DA AUDIT VIII / §35.4**.

### 35.5 Safe-Art — DECISIONE DEFINITIVA (sviluppo, non implementato)

| Campo | Contenuto |
|-------|-----------|
| **DECISIONE** | Safe-Art **autonomo**; **7** righe `ai_configs` `safe_art_*` **non cancellare**; mapping su **4** stili prodotto con istruzioni editabili Admin. |
| **Stili** | Realistico · Cinematografico · Fumetto · Paesaggistico — mapping §34.3. |
| **INT** | **INT-SAFE-ART-RESTORE-01** — dettaglio §34.3. |
| **NON FARE** | Cancellare righe storiche DB; unificare Safe-Art con Applica Header; usare INT-13. |

### 35.6 Decisioni già chiuse — stato finale (non riaprire)

| Tema | Stato documentale |
|------|-------------------|
| Merge survivor-only | **DECISIONE CHIUSA** — INT-MERGE-IMG-01 |
| D-22 cascata POI | **DECISIONE CHIUSA** — INT-01 / INT-01b |
| Sponsor min/max lifecycle | **DECISIONE CHIUSA** — §32.3 |
| Cascata Sponsor deterministica (upload order) | **CHIUSA** |
| Wikimedia fail-closed + CC BY 4.0 + toggle OFF | **CHIUSA** — `commonsDownloadPipeline` |
| Community invariata | **CHIUSA** |
| Patron partial success | **CHIUSA** |
| `content_reports` SoT segnalazioni | **CHIUSA** |
| verify_ai_image separata | **CHIUSA** |
| City delete solo ADMIN ALL | **CHIUSA** |
| AI config per-sezione | **CHIUSA** — INT-AI-CONFIG-01 |

Sezioni anteriori che citano questi temi come «aperti» restano **storico**; prevale questa tabella + §32.

### 35.7 Master Plan — allineamento

Aggiornato **`AI_IMAGE_MANAGEMENT_MASTER_PLAN.md`**: **Appendice G** (consolidamento 2026-09-27), lettura congiunta estesa, decisioni D-CONS-01… su Magic Add, Header, Sponsor, INT-13, Safe-Art, D-22 operativa.

### 35.8 Tabella stato finale — fase decisionale

#### CHIUSO / DECISIONE DEFINITIVA

Merge survivor-only · D-22 · Sponsor min/max · Sponsor cascade · Wikimedia · Community · Patron partial save · Segnalazioni · City delete · AI config per-sezione · Safe-Art (direzione) · INT-13 (rimozione approvata) · Sponsor notification · Sponsor notification text · Sponsor suspended previews · Sponsor notification grouping · Applica Header (decommission) · **Magic Add** (resta; no auto-foto)

#### PRONTO PER SVILUPPO (INT — COSA/COME/DOVE in §32–§35)

| INT | Oggetto |
|-----|---------|
| INT-MAGIC-ADD-DECOUPLE-01 | §35.1 |
| INT-APPLY-HEADER-DECOM-01 | §35.2 |
| INT-13-REMOVE-01 | §35.4 / §34.1 |
| INT-SAFE-ART-RESTORE-01 | §34.3 |
| INT-SPONSOR-NOTIF-01 | §35.3 / §34.4 |
| INT-MERGE-IMG-01 | §32.1 |
| INT-01 / INT-01b | §32.2 |
| INT-SPONSOR-* / INT-SUSP-ADMIN-01 | §32.3 |
| INT-WM-PHASE-01 | §32.5 |
| INT-AI-CONFIG-01 | §32.11 |
| INT-REP-DECOM / badge / UI | §32.8 |
| INT-09 (city delete) | §32.10 |

#### NON IMPLEMENTATO ANCORA

Codice · migration · DB write · UI · rimozioni effettive INT-13 / Applica Header / hero_image · Safe-Art rebuild/restore · notifiche Sponsor con anteprime

---

---

## 36. AUDIT DI CHIUSURA SVILUPPO — 2026-09-27

**Scope:** audit tecnico/architetturale read-only su 6 decisioni funzionali **chiuse** + requisito link Wikimedia; **zero** implementazione.  
**Metodo:** grep/`src/`, migration `supabase/migrations`, tipi `supabase.ts`, incrocio con §32–§35 e Master Plan Appendice G.

### 36.0 Riepilogo classificazione (A / B / C / D)

| Classe | Significato |
|--------|-------------|
| **A** | Decisione funzionale **DEFINITIVA** (non riaprire) |
| **B** | Tecnica **già definita** nel repo o in §32–§35 (pronta o quasi) |
| **C** | Tecnica **da implementare** — piano COSA/COME/DOVE/TEST in sottosezioni |
| **D** | **BLOCCO** proprietario (nessuno rilevato in questo audit) |

| # | Tema | A | B | C |
|---|------|---|---|---|
| 1 | City delete CONSERVA ORFANO + immagini | ✓ | gap FK/CASCADE | INT-09 esteso |
| 2 | Legacy report test → DELETE | ✓ | caller UI assenti | INT-REP-DECOM-01 |
| 3 | Patron save OK se foto fallisce | ✓ | split PATCH/RPC oggi | INT-PATRON-SAVE-02 |
| 4 | Wikimedia POI + Patrono = Personaggi | ✓ | pipeline + Person UI | INT-WM-POI-01, INT-WM-PATRON-01 |
| 5 | POI ricerca auto foto reale (no AI search) | ✓ | lookup + pipeline esistono | INT-POI-REAL-DISCOVERY-01 |
| 6 | Sospensione → cascata auto D-22 | ✓ | suspend report RPC | INT-04 + INT-01b + INT-SUSP |
| 7 | Link originale Wikimedia | ✓ | `source_url` + Libreria UI | esposizione POI/Persona tab Media |

---

### 36.1 City delete — CONSERVA ORFANO (immagini e contenuti)

**DECISIONE (A — definitiva):** in modalità **CONSERVA ORFANO**, contenuti/immagini delle categorie previste **non** vengono distrutti; mantengono **`city_id`** (ID città), storico/commenti/metadati; restano orfani finché la riga `cities` assente; al **recreare** la città con **lo stesso ID** (`cities_registry` + `resolveCanonicalCityId`) → **relink** automatico (`reclaimOrphanedItems` + estensioni).

#### Cosa conta come «immagine città» / coinvolta (FV repo)

| Categoria | Record / storage | Oggi in `deleteCity` | Target CONSERVA ORFANO |
|-----------|------------------|----------------------|-------------------------|
| **Galleria città / hero presentazione** | `cities.image_url`, `cities.hero_image`, `cities.gallery` (JSON) | **Persi** con DELETE `cities` | **Conservare** righe asset + metadati collegati; non cancellare file Storage se policy orphan |
| **Community foto città** | `photo_submissions` (+ assignment `entity_type=photo_submission`) | `city_id → null`, `status=city_deleted` | **Mantenere `city_id`** (decisione); status orphan esplicito |
| **POI immagini** | `entity_image_assignments` (`entity_type=poi`) + `media_assets` | CASCADE delete assignments con città; POI delete o `city_id null` | **Conservare** POI + assignments + assets se categoria CONSERVA |
| **Personaggi** | `city_people` + assignments primary/gallery | **Sempre DELETE** people | **Conflitto:** `city_people.city_id` NOT NULL — CONSERVA richiede **non** delete people o soft-delete città |
| **Patrono primary + galleria** | `entity_image_assignments` patron; `city_patron_gallery` | Persi con DELETE city / people path | **Conservare** gallery + assignments + JSON `patron_details` storico |
| **Sponsor foto POI** | future galleria sponsor + assignments | Sponsor detach RPC | Detach sponsor business; **foto** restano su media/assignment se POI conservato |
| **Segnalazioni MF2** | `content_reports` | **`ON DELETE CASCADE`** su `city_id` | **MAI cancellare** — FK → **SET NULL** o soft-delete city |
| **Storico immagine** | `entity_image_history` | RESTRICT se assignment eliminato male | Preservare; cleanup ordinato in RPC |
| **Legacy report test** | `famous_person_photo_reports` | DELETE esplicito | **Eliminare sistema** (§36.2), non conservare |
| **Staging OSM** | `pois_staging`, `orphan_city_tag` | Orphan tag | Già parzialmente gestito |

#### Come deve funzionare (target — INT-09)

1. **Soft-delete città** (consigliato): colonna `cities.deleted_at` / status `deleted_orphan` invece di `DELETE cities` quando esiste almeno una categoria CONSERVA — **oppure** DELETE city solo dopo spostamento FK a `cities_registry.id` come ancoraggio (più invasivo).
2. **`entity_image_assignments.city_id`:** oggi `NOT NULL` + **`ON DELETE CASCADE`** (`20260916130000_entity_image_assignments.sql`) — **migration obbligatoria:** `ON DELETE RESTRICT` o riferimento a registry; CONSERVA **non** può passare da DELETE hard `cities`.
3. **`content_reports.city_id`:** CASCADE → **`ON DELETE SET NULL`** + `entity_id`/`assignment_id`/`snapshot_*` immutati.
4. **RPC atomica** `delete_city_admin(p_city_id, p_options jsonb)` sostituisce sequenza client `cityLifecycleService.deleteCity` (non atomica).
5. **Re-link:** estendere `reclaimOrphanedItems` / nuovo `relink_orphaned_city_media(p_city_id)` per: `photo_submissions`, assignments, `city_patron_gallery`, POI (`city_id` match), reports MF2.
6. **UI:** `DeleteCityOptionsModal` — per-categoria CANCELLA / CONSERVA; wire in `CitiesManager`; guard **`admin_all`**.

#### Dove (file / DB)

| Layer | Path |
|-------|------|
| Oggi | `src/services/city/cityLifecycleService.ts` (`deleteCity`, `reclaimOrphanedItems`) |
| UI | `src/components/admin/cities/DeleteCityOptionsModal.tsx` (**non wired**) |
| DB | `entity_image_assignments`, `content_reports`, `cities`, `photo_submissions`, `city_patron_gallery`, `pois`, `city_people` |
| INT | **INT-09** (§32.9) — ampliato con matrice sopra |

#### Dipendenze

D90 cleanup RPC (`delete_city_person_with_image_cleanup`) per path CANCELLA person; INT-REP-DECOM prima di rimuovere blocchi legacy FK.

#### Rischi

DELETE città oggi **cascade** assignments e **perde** MF2 reports; delete parziale client; RESTRICT history deadlock; people NOT NULL.

#### Test

CONSERVA photo + POI + patron gallery → delete soft → recreate same ID → immagini/report visibili; CANCELLA categoria → asset rimossi; LIMITED 403; nessun CASCADE su `content_reports`.

#### Criterio di chiusura

Modale operativa; RPC atomica; CONSERVA mantiene `city_id` su media previsti; MF2 intatto; reclaim su recreate verificato.

**NON modificare** in fase audit: codice delete attuale.

---

### 36.2 Vecchi sistemi segnalazione foto (legacy test)

**DECISIONE (A):** `famous_person_photo_reports`, `patron_photo_reports` (+ dati test) → **eliminazione completa**; **nessun** export/archivio; **`content_reports`** resta SoT.

#### Audit caller (FV)

| Componente | Uso legacy | Sostituto |
|------------|------------|-----------|
| `createFamousPersonPhotoReport` / `createPatronPhotoReport` | **0 caller UI** | `create_content_report_group` (`contentReportService.ts`) |
| `getPendingFamousPersonPhotoReportCount` | `famousPersonAdminCountsService` → **sidebar** `AdminDashboard` | Solo `getPendingContentReportCount` + verify AI |
| `famousPersonPhotoReportService.ts` | RPC `block_famous_person_photo_report_and_clear` | MF2 transition + suspend assignment |
| `patronPhotoReportService.ts` | CRUD admin legacy | Hub Segnalazioni MF2 |
| `deleteCity` | DELETE reports per city | Rimuovere step; MF2 preserved |
| `delete_city_person_with_image_cleanup` | **BLOCK** se legacy reports | Rimuovere check post-DECOM |
| Migration / tipi | Tabelle + RPC in `supabase.ts` | Drop migration dedicata |

#### Ordine decommission (INT-REP-DECOM-01)

1. Rimuovere conteggi/badge legacy da `AdminDashboard` / `famousPersonAdminCountsService` / `patronAdminCountsService`.
2. Eliminare servizi `*PhotoReportService.ts` e import.
3. Aggiornare RPC delete person (rimuovere guard legacy).
4. Migration: `DROP TABLE` reports + RPC legacy; **DELETE dati test**.
5. Rigenerare tipi Supabase.
6. **`content_reports`:** intatto.

#### Test

Segnalazione abuso foto Persona/Patrono/POI → solo MF2; sidebar count coerente; delete person/city senza legacy FK.

#### Criterio di chiusura

Zero riferimenti repo a tabelle legacy; MF2 operativo; dati test gone.

---

### 36.3 Patrono — salvataggio dati se foto fallisce

**DECISIONE (A):** PATCH dati Patrono **sempre** salvati; foto: resta **precedente** assignment; se assente → **placeholder** cascata D-22 (stessa regola POI/Persona, **nessuna** regola speciale Patrono); messaggio Admin **«Dati salvati, foto non aggiornata»**; nuova foto **non** sostituisce se upload/RPC fallisce.

#### Oggi (FV)

| Step | File | Comportamento |
|------|------|---------------|
| 1 | `cityWriteService.saveCityDetails` | `callCityAdminApi` PATCH **sempre prima** |
| 2 | RPC | `upsert_patron_primary_image_assignment` / `revoke_*` in `try/catch` — errore → **solo** `console.error` |
| 3 | Read pubblico | `resolvePatronPrimaryImagePublicUrl` — assignment SoT, **non** JSON |
| 4 | Gap | JSON `patron_details.imageUrl` può **disallinearsi** se PATCH include nuova URL e RPC fallisce; **nessun** toast Admin |

#### Target (INT-PATRON-SAVE-02 — estende INT-05/11)

1. **Ordine:** validare/upload foto **prima** o in RPC unica; se fallisce → **non** scrivere nuovo `imageUrl` nel PATCH (o rollback field).
2. **RPC unica** (preferito): `save_patron_with_primary_assignment` — atomicità dati + assignment.
3. **UX:** toast/warning esplicito su fallimento foto; success dati comunque.
4. **Cascata:** read via `entityPrimaryImageReadService` + placeholder (`resolvePatronDisplayImageUrl` deprecato come SoT).

#### DOVE

`cityWriteService.ts`, `CulturePatron*.tsx` (save handler), migration RPC, eventuale `patronPrimaryImageWriteHelpers.ts`.

#### Test

RPC fail simulato → dati OK, primary invariata, placeholder se vuota; success path → nuova foto; cascata D-22 dopo INT-01.

#### Criterio di chiusura

Messaggio Admin obbligatorio; zero disallineamento JSON/assignment persistente.

---

### 36.4 Wikimedia — POI e Patrono (stesso percorso Personaggi)

**DECISIONE (A):** **Un solo** motore: `wikidataLookupService` + `commonsDownloadPipeline` + modale conferma (`WikidataConfirmModal`) + regole fail-closed/CC BY 4.0/quarantena/coda verify — **identiche** a Personaggi (`usePeopleAI.ts` L620–711).

#### Oggi

| Entità | Wiring | Gap |
|--------|--------|-----|
| **Persona** | `CulturePeople` + `WikidataConfirmModal` + `runCommonsDownloadPipeline` `entityType: city_person` | Riferimento |
| **POI** | `CommonsDownloadEntityTarget` supporta `'poi'`; **zero** caller UI | INT-WM-POI-01 |
| **Patrono** | Pipeline supporta `'patron'` in assignment; **zero** Wikimedia UI | INT-WM-PATRON-01 |

**Nota:** §24.2 storico («Patrono non richiesto») **superato** da questa decisione (A).

#### COME (implementazione)

1. Estrarre hook condiviso es. `useWikimediaEntityImport.ts` (proposal lookup, modal state, `confirmWikidataCommonsImport`).
2. **POI:** `PoiMediaTab` / `AdminPoiModal` — pulsante «Cerca su Wikimedia» → stesso modal → pipeline → `save_poi_with_image_assignment` (D90) con `origin_type=wikimedia`.
3. **Patrono:** `CulturePatronMainPhotoSection` — stesso flusso → `upsert_patron_primary_image_assignment` o RPC unificata §36.3.
4. **Entity target:** `{ entityType, entityId, cityId }` — patron: `entityId = cityId`.
5. **Sicurezza:** `adminConfirmedQid: true` solo post-checkbox modal; ambiguous → **no** auto-select (lookup già fail-closed).

#### TEST

Stessi casi Persona: CC BY auto-path, quarantena, coda verify, no replace primary su queue, licenza bloccata.

#### Criterio di chiusura

Zero seconda pipeline; POI e Patrono passano gli stessi test di sicurezza Persona.

---

### 36.5 POI — ricerca automatica fotografia reale verificata (spec tecnica)

**DECISIONE (A):** Priorità **D-22**; livello **REAL/WIKIMEDIA** via discovery **non-AI** (Wikidata P18 + Commons); **AI solo** se esplicitamente richiesta (regole esistenti); sistema **deve** poter cercare automaticamente candidati reali.

#### A. COSA significa «foto reale verificata» (nel repo)

- **Fonte ammessa v1:** Wikimedia Commons via **P18** (stesso perimetro Persona).
- **Verificata:** `commonsDownloadPipeline` — checklist licenza (`parseCommonsLicenseMetadata`), MIME/magic bytes, size cap 12MB, path `verified/wikimedia` vs `wikimedia/quarantine`, `record_image_verification_run`, auto-path **solo** CC BY 4.0 coerente (D79).
- **Classificazione:** `media_assets.origin_type = 'wikimedia'`; assignment `origin_type` wikimedia; **non** `verified_real` (INT-02 rimosso).
- **Salvataggio:** download → Storage `public-media` → `media_assets` + provenance → `upsertEntityImageAssignmentFromSource` / `save_poi_with_image_assignment` (D90).
- **Primary:** rispetta D-22 — Wikimedia **non** scavalca Sponsor/Admin esistenti (INT-01 guard).
- **Nessun candidato:** nessuna write; placeholder categoria (`resolvePoiDisplayImageUrl`) fino ad altra fonte.

#### B. COME — flusso tecnico end-to-end

```
POI (name, cityId, category, optional link_metadata)
  → [guard D-22] skip se già primary active Sponsor/Admin/…
  → lookupWikidataP18Proposal({ label: poi.name, cityName, description, knownQid? })
  → none | ambiguous | proposal
  → ambiguous/none → stop (log + optional Admin task)
  → proposal + Admin confirm (modal) OR policy auto-confirm solo se già confermato in sessione
  → runCommonsDownloadPipeline({ proposal, entity: { entityType:'poi', entityId, cityId } })
  → ok + autoVerified → save_poi_with_image_assignment (primary wikimedia)
  → ok + queuedForAdminVerify → asset in coda, primary POI **non** cambiata (come Persona)
  → fail → fail-closed, no partial primary
```

**Riuso obbligatorio (no reinvent):** `wikidataLookupService.ts`, `commonsDownloadPipeline.ts`, `commonsLicenseParser.ts`, `entityImageAssignmentWriteService.ts`, RPC `save_poi_with_image_assignment`, read `applyPrimaryImageCutoverForPois`.

**Non usare:** Gemini per **search** foto; `verify_ai_image` per candidate Commons (D-24).

#### Trigger automatici (C — da implementare, non blocco funzionale)

| Trigger | Dove agganciare |
|---------|-----------------|
| **T1 Admin** | `PoiMediaTab` — «Cerca foto reale (Wikimedia)» |
| **T2 Post-save** | Dopo `saveSinglePoi` se primary assente e toggle città/POI «auto-discovery» (config Admin) |
| **T3 Batch** | Osservatorio `pois_without_img` — job asincrono rate-limited |

**Rate limit / idempotenza:** riusare `REQUEST_TIMEOUT_MS` lookup; chiave idempotenza `(poi_id, content_hash)` su asset; non rilanciare se primary active non-placeholder.

#### C. DOVE

| Azione | File |
|--------|------|
| Nuovo orchestratore | `src/services/poi/poiRealImageDiscoveryService.ts` (proposto) |
| UI | `PoiMediaTab.tsx`, `AdminPoiModal.tsx`, `WikidataConfirmModal.tsx` (generico entity) |
| Hook | `useWikimediaEntityImport.ts` (condiviso §36.4) |
| Save | `saveSinglePoi` / RPC D90 in `entitiesService` o `poiWriteService` |
| Read cascade | futuro `resolvePoiPrimaryByCascade` (INT-01b) — fino ad allora cutover primary singola |
| AI esplicita | flussi AI POI esistenti — **solo** generazione immagine, non search |

**POI `link_metadata`:** JSON esistente — opzionale persistere `wikidata_qid` scelto per retry (non obbligatorio v1).

#### D. TEST (minimo)

Candidato valido CC BY; nessun P18; licenza rifiutata; download fail; timeout API; POI con Sponsor primary (skip); POI Admin primary (skip); ambiguous Wikidata; quarantena; concurrent discovery stesso POI; sospensione post-assign; regression Persona/Patrono pipeline.

#### E. Dipendenze implementative

**INT-01** (origin sponsor/admin guard RPC) consigliato **prima** auto-promote; **INT-WM-POI-01** può partire in parallelo con guard lato servizio (skip assign se primary esiste).

#### Criterio di chiusura

Discovery service documentato implementato; almeno trigger T1; stessi controlli sicurezza Persona; D-22 rispettata con INT-01.

---

### 36.6 Sospensione foto — cambio automatico cascata D-22

**DECISIONE (A):** Admin sospende → **nessuna** scelta manuale sostitutiva; sistema promuove prossima fonte **D-22**; Sponsor → selezione deterministica (upload order); notifica Sponsor (§35.3) se coinvolto.

#### Oggi

| Percorso | Comportamento |
|----------|---------------|
| Segnalazione utente MF2 | `create_content_report_group` → assignment **`suspended`** (migration `20260924170000` L432–434) — **non** auto-promote altra primary |
| Admin sospendi diretto | **Assente** UI/RPC dedicata (INT-SUSP-ADMIN-01) |
| Read pubblico | Solo assignment **`active`** (`entityPrimaryImageReadService.ts` L147) — suspended = nascosto, **senza** fallback multi-livello |
| POI display legacy | `resolvePoiDisplayImageUrl` — snapshot/catalog/placeholder — **non** D-22 |

#### Target (C — INT-04 + INT-01b + INT-SUSP-ADMIN-01)

1. RPC **`suspend_entity_image_assignment`** (admin) → status suspended + history.
2. **`resolvePrimaryDisplayUrlCascade(entity)`** — ordine D-22: Sponsor gallery deterministic → Admin → wikimedia active → community → AI → placeholder.
3. Invocare resolver **dopo** ogni suspend (stessa transazione RPC preferita).
4. Sponsor: `pickNextSponsorPrimaryDeterministic` (§32.3); notify §35.3.
5. Se **nessuna** foto rimane → placeholder / empty per policy entità.

#### TEST

Sospendi primary Admin → promote Wikimedia; sospendi Sponsor → prossima gallery; tutte sospese → placeholder; notifica sponsor batch; atomicità transazione.

#### Criterio di chiusura

Admin un click; pubblico vede cascata senza intervento manuale; storico assignment conservato.

---

### 36.7 Link originale Wikimedia (requisito definitivo)

**DECISIONE (A):** Ogni asset Wikimedia acquisito deve permettere all’Admin di aprire la **pagina Commons** originale senza nuova ricerca.

#### Audit architettura attuale

| Dato | Conservato? | Dove |
|------|-------------|------|
| **Pagina Commons** (File:…) | **Sì** | `media_assets.source_url` via `patchMediaAssetProvenance` ← `commonsPageUrl` (`commonsDownloadPipeline.ts` L269–277, L362) |
| **URL file upload.wikimedia.org** | **Sì** (audit) | `metadata.commons_image_url` JSON + hash in metadata |
| **QID Wikidata** | **Sì** | `source_ref` + `metadata.wikidata_qid` |
| **Titolo file** | **Sì** | `metadata.commons_file` |
| **Dopo assignment/sospensione** | **Sì** | Provenance su **asset**, non sull’assignment |
| **UI Admin** | **Parziale** | `MediaAssetDetailPanel.tsx` L285–295 — link cliccabile **`sourceUrl`** in **Libreria Media** |
| **Tab Media POI/Persona** | **Gap** | `PoiMediaTab` / `AdminImageInput` — **no** link a `source_url` del primary asset |

**Verdetto:** requisito **parzialmente soddisfatto** — dati OK in DB; manca esposizione nel punto operativo Admin per entità (non solo catalogo).

#### COME (INT-WM-SOURCE-LINK-UI-01 — solo UI/read)

1. Read primary assignment → `media_asset_id` → `source_url` (+ optional `metadata.commons_image_url`).
2. Mostrare in `PoiMediaTab`, Culture person/patron photo section: «Apri su Wikimedia Commons» se `origin_type=wikimedia`.
3. **Non** nuovi campi DB se `source_url` sufficiente (pagina descriptiva Commons è la fonte canonical per Admin).

#### TEST

Post-import pipeline → Libreria + tab entità mostrano stesso URL; sospensione/sostituzione → link resta su asset storico in catalogo.

---

### 36.8 Tabella readiness sviluppo

| Area | Decisione | Doc tecnica | Implementazione |
|------|-----------|-------------|-----------------|
| City orphan media | Chiusa | §36.1 | **C** — INT-09 |
| Legacy reports | Chiusa | §36.2 | **C** — INT-REP-DECOM-01 |
| Patron partial save | Chiusa | §36.3 | **C** — INT-PATRON-SAVE-02 |
| Wikimedia POI/Patron | Chiusa | §36.4 | **C** |
| POI real discovery | Chiusa | §36.5 | **C** — INT-POI-REAL-DISCOVERY-01 |
| Suspend cascade | Chiusa | §36.6 | **C** — dipende INT-01b |
| Wikimedia source link UI | Chiusa | §36.7 | **C** — UI only |
| Magic Add / Header / Sponsor notif | Chiusa §35 | Sì | **C** (già pianificati) |

**BLOCCO proprietario (D) pre-§38:** risolto in **§38.4** (tabella batch + domande residue §38.12).

---

---

## 37. BIBBIA OPERATIVA — SPECIFICHE TECNICHE DEFINITIVE (2026-09-27)

**Scope:** completamento documentale pre-sviluppo per POI Wikimedia (auto + manuale + toggle), link fonte, City delete CONSERVA ORFANO. **Zero implementazione** in questa attività.

---

### POI REAL IMAGE DISCOVERY — SPECIFICA TECNICA DEFINITIVA

#### Decisioni funzionali confermate (A — non riaprire)

- Ogni **nuovo POI** può essere sottoposto a ricerca foto reale Wikidata/P18 + pipeline Commons (**stessa sicurezza Personaggi**).
- **Auto (A/B/C)** e **manuale (D)** = **quattro attivazioni**, **un solo orchestratore** (§38.5).
- **Auto-save (§38.1):** se lookup + controlli pipeline **passano tutti** (non ambiguo, CC BY auto-path, download OK) → **persist automatico** senza click Admin import; **non** implica foto pubblica (toggle OFF + D-22).
- Pulsante tab Media: **`API WIKIMEDIA`** (testo UI definitivo).
- **Toggle Wikimedia OFF** alla nascita: foto può esistere nel sistema ma **non** è foto pubblica D-22 finché Admin non mette toggle **ON** (§37.2).

#### DELTA RILEVATO — UI modale città vs decisione CONSERVA

| Documentazione | Repository | Soluzione proposta |
|----------------|------------|-------------------|
| CONSERVA ORFANO esteso a immagini/assignment (§36) | `DeleteCityOptionsModal` dichiara Personaggi **SEMPRE CANCELLA** (UI obsoleta) | INT-09: Personaggi **CONSERVA/CANCELLA** (§38.6); estendere modale — non riaprire principio CONSERVA per immagini |

#### A. Quando parte la ricerca automatica (decisione §38 — NO Osservatorio)

| Attivazione | Evento reale (audit repo) | Stato repo | Azione futura |
|-------------|---------------------------|------------|---------------|
| **A — Nascita POI** | Insert live: `saveSinglePoi` (`poiWrite.ts`), `promote_staging_poi_to_live` via `promoteToLive` (`stagingService.ts`), Flash AI (`generateDraftsOnly` → save), **Nuovo POI** manuale | **Assente** | `discoverForPoi(poiId, { activation: 'on_create' })` — vedi §38.1 idempotenza vs import batch |
| **B — Import massivo DB** | Click **`SEND TO DB (BOZZE)`** (`ImportActionToolbar.tsx` L125–138, title «Importa nel DB reale come Bozze») → `runPublishingService` → `promoteToLive` per ogni staging id | **Assente** | `discoverForPoi` con `activation: 'mass_import'` **dopo** ogni promote riuscito (o batch finale per id) |
| **C — Bonifica POI** | (1) **`Bonifica Pro (Daily)`** → `executeDailyDeepScan` (`usePoiActions.ts` L169+) + `enrichStagingPoi`; (2) **`Bonifica (N)`** selezione → `verifyDraftsBatch` con `targetIds` (`AdminPoiManager.handleFixPois`); (3) **`Validazione Pro Massiva`** / per categoria da `useAiValidation.verifyDraftsBatch`; (4) step **`Bonifica POI Pro (Daily)`** in `useAiCompleteCity` se `config.runPoiDeepScan`; (5) step **`Validazione & Deep Check (Pro)`** in `useAiMagicCity` post-save draft | **Assente** | Dopo persist POI per ogni id processato: `activation: 'bonifica'` |
| **D — Manuale Admin** | **`API WIKIMEDIA`** tab Media `PoiMediaTab` | **Assente** | `activation: 'manual'` — modale proposte §38.2 |

**Escluso esplicitamente:** tab **Osservatorio** (`ObservatoryLayout`, `DuplicateResolver`, `AnomalyInspector`) — **nessun** trigger discovery immagini (decisione proprietario §38.4).

#### B. Cosa succede quando nasce un POI

1. Insert riga `pois` (spesso `status=draft`, `image_url` vuoto, **nessun** assignment primary) — **GIÀ PRESENTE** (`promote_staging_poi_post_mf5`, `saveSinglePoi`).
2. Default **`wikimedia_public_enabled = false`** (colonna **DA CREARE** — §37.2).
3. Orchestratore **opzionale** T0: lookup Wikidata → pipeline → asset/candidate **senza** promuovere foto pubblica.
4. Read pubblico: cutover primary assente → **placeholder categoria** (`resolvePoiDisplayImageUrl`) — **GIÀ PRESENTE** (non D-22 completo finché INT-01b).

#### C. Arricchimento massivo

- Percorsi reali: `useAiValidation.verifyDraftsBatch`, `useAiMagicCity` (save POI draft), `usePoiActions` (Bonifica + `enrichStagingPoi`).
- **DOPO** persist testi/coordinate, invocare **una volta per POI** `poiRealImageDiscoveryService.discoverForPoi(id, { mode: 'batch', skipIfPrimaryExists: true })`.
- **NON** duplicare logica Commons dentro `verifyPoisBatch` (Gemini) — separazione netta: AI = testi; Wikimedia = servizio dedicato.

#### D. Manuale singolo POI — stessa finestra modifica

| Percorso | File ingresso | Modale |
|----------|---------------|--------|
| Pubblico → matita POI | `CityDetailContent.handleAdminEdit` → `openModal('adminEditPoi')` | `AdminModals.tsx` → **`AdminPoiModal`** |
| Admin → Manager POI-DB → Edit città → POI | `AdminPoiManager.handleOpenEdit` | **`AdminPoiModal`** |

**GIÀ PRESENTE:** stesso componente modale. **DA MODIFICARE:** `PoiMediaTab.tsx` — pulsante **`API WIKIMEDIA`** + stato loading + preview candidate.

#### E. Pipeline/servizi comuni (riuso obbligatorio)

| Pezzo | File | Stato |
|-------|------|--------|
| Lookup Wikidata/P18 | `wikidataLookupService.ts` | **GIÀ PRESENTE** |
| Download + licenza + quarantena | `commonsDownloadPipeline.ts` | **GIÀ PRESENTE** |
| Modale conferma | `WikidataConfirmModal.tsx` | **GIÀ PRESENTE** (Persona) |
| Assignment D90 POI | RPC `save_poi_with_image_assignment` / `upsertEntityImageAssignmentFromSource` | **GIÀ PRESENTE** |
| Orchestratore unico | **`poiRealImageDiscoveryService.ts`** | **DA CREARE** |
| Hook UI condiviso | **`useWikimediaEntityImport.ts`** | **DA CREARE** (POI + Patrono + refactor Persona) |

#### F. File da creare / modificare

| File | Azione | Motivo |
|------|--------|--------|
| `src/services/poi/poiRealImageDiscoveryService.ts` | **CREARE** | Unico entrypoint attivazioni A–D (§38.1) |
| `src/hooks/admin/useWikimediaEntityImport.ts` | **CREARE** | Stato modal + confirm condiviso |
| `src/components/admin/poiModal/PoiMediaTab.tsx` | **MODIFICARE** | Pulsante API WIKIMEDIA + preview + toggle |
| `src/components/admin/AdminPoiModal.tsx` | **MODIFICARE** | Wire hook + refresh post-discovery |
| `src/components/admin/wikimedia/WikidataConfirmModal.tsx` | **MODIFICARE** | Titoli/label generici entity (poi/patron/person) |
| `src/hooks/admin/useAiValidation.ts` | **MODIFICARE** | Hook batch post-save |
| `src/hooks/admin/useAiMagicCity.ts` | **MODIFICARE** | Hook post-`saveSinglePoi` draft |
| `src/hooks/admin/usePoiActions.ts` | **MODIFICARE** (opz.) | Bonifica batch |
| `supabase/migrations/*_poi_wikimedia_public_enabled.sql` | **CREARE** | Toggle default OFF |
| `supabase/migrations/*_poi_wikimedia_candidate_assignment.sql` | **CREARE** (se modello assignment) | Candidate vs primary — vedi §37.2 |

**NON TOCCARE:** logica licenza in `commonsLicenseParser.ts`; regole verify AI portrait; `verify_ai_image` queue.

#### G. Flusso dati completo

```
POI (id, cityId, name, category, wikimedia_public_enabled=false)
  → poiRealImageDiscoveryService.discoverForPoi
  → lookupWikidataP18Proposal({ label, cityName, description, knownQid? })
  → [none|ambiguous|proposal]
  → ambiguous/none → stop (log Admin); manual → modal candidati
  → proposal + adminConfirmedQid (modal)
  → runCommonsDownloadPipeline({ proposal, entity:{entityType:'poi', entityId, cityId}, assignToEntity: per policy §37.2 })
  → media_assets (+ source_url, metadata) in verified/ o quarantine/
  → assignment **candidate** (gallery / wikimedia_staged) OR asset-only se quarantena
  → Admin analizza in tab Media (preview + link Commons §37.3)
  → toggle ON + eventuale «Abilita come foto pubblica» → rispetta D-22 (INT-01) → primary active
  → read pubblico: entityPrimaryImageReadService + future cascade INT-01b
```

#### H. Casi limite

| Caso | Comportamento target |
|------|---------------------|
| Nessun risultato Wikidata | Nessuna write; messaggio Admin; placeholder resta |
| Risultato valido CC BY auto-path | Asset active; **candidate** salvato; **non** primary pubblica se toggle OFF |
| Non verificabile / quarantena | `queuedForAdminVerify`; **nessuna** sostituzione primary (come Persona L688–693) |
| Errore Wikimedia HTTP/API | Fail-closed; log stage (`commons_metadata`, `download`, …); POI invariato lato pubblico |
| Errore Wikidata | `lookup status error/none`; nessun asset |
| Scaricata ma non abilitata | Asset + candidate in DB; toggle OFF → D-22 ignora Wikimedia |
| Immagine già presente (Admin/Sponsor primary) | Orchestratore **skip** (`skipIfHigherPriorityPrimary`) — INT-01 |
| Ricerca ripetuta | Idempotenza: stesso `content_hash` → riusa asset; nuova candidate solo se Admin conferma |
| Duplicato POI | `verifyDraftsBatch` delete duplicate **prima** — discovery non partire su duplicati rimossi |

#### I. Controlli anti-pubblicazione non verificata

**GIÀ PRESENTE** in pipeline Persona:

- `adminConfirmedQid` obbligatorio (`commonsDownloadPipeline` L245–250).
- Licenza fail-closed → quarantena + `mark_verify_queue` (no auto primary).
- Auto primary assignment **solo** se `autoPath && assignToEntity !== false` (L398–429).

**DA AGGIUNGERE** per POI (toggle):

- Default `assignToEntity: false` **oppure** assignment non-primary finché toggle OFF.
- Resolver D-22 (**INT-01b**) **esclude** Wikimedia se `wikimedia_public_enabled=false`.
- **Mai** promuovere quarantena a primary senza transizione Admin.

#### Esempio ufficiale D-22 — POI nuovo (§37.2)

Sponsor ✗, Admin ✗, Wikimedia asset in pancia toggle **OFF** ✗ (non utilizzabile), Community ✗, AI ✗ → **PLACEHOLDER** pubblico. **Presenza file Storage ≠ foto pubblica.**

#### INT e ordine

1. Migration toggle + modello candidate assignment  
2. `poiRealImageDiscoveryService` + hook Wikimedia condiviso  
3. UI `API WIKIMEDIA` + batch hooks  
4. **INT-01 / INT-01b** (guard + cascade)  
5. Test + E2E (percorsi matita + Manager POI)

---

### POI — TOGGLE WIKIMEDIA (DECISIONE DEFINITIVA §37.2)

| Concetto | Regola |
|----------|--------|
| **Foto nel sistema** | Asset `media_assets` + eventuale assignment candidate |
| **Foto pubblica D-22** | Solo se toggle **`wikimedia_public_enabled=true`** sul POI **e** passa guard INT-01 |
| **Default** | **`false`** su ogni insert POI (migration + default RPC promote) |

**DA CREARE:** `pois.wikimedia_public_enabled boolean NOT NULL DEFAULT false`.

**Alternativa valutata:** solo metadata assignment — **scartata** per toggle Admin esplicito in tab Media (requisito prodotto).

**Criterio chiusura sviluppo:** POI appena creato con candidate Wikimedia → pubblico vede placeholder; toggle ON → Wikimedia entra in cascata se nessun livello superiore.

---

### WIKIMEDIA SOURCE LINK — SPECIFICA TECNICA DEFINITIVA

#### Stato

| Area | Stato | Dove |
|------|--------|------|
| Persistenza pagina Commons | **GIÀ PRESENTE** | `media_assets.source_url` ← `commonsPageUrl` in pipeline |
| URL file originale | **GIÀ PRESENTE** | `metadata.commons_image_url` |
| Libreria Media | **GIÀ PRESENTE** | `MediaAssetDetailPanel.tsx` L285–295 |
| Tab Media POI | **DA COMPLETARE** | `PoiMediaTab.tsx` + read asset da primary/candidate |
| Tab Media Persona | **DA COMPLETARE** | `CulturePeople` / card personaggio (no link oggi su assignment) |
| Tab Media Patrono | **DA COMPLETARE** | `CulturePatronMainPhotoSection` (o equivalente) |

#### Implementazione (INT-WM-SOURCE-LINK-UI-01)

| File | Azione |
|------|--------|
| **`src/components/admin/media/WikimediaSourceLink.tsx`** | **CREARE** — props: `sourceUrl`, `label?`; link `ExternalLink` solo se URL https Commons/Wikidata valido |
| `PoiMediaTab.tsx` | **MODIFICARE** — sotto anteprima, se `origin=wikimedia` |
| `CulturePeople.tsx` / person card media | **MODIFICARE** |
| Sezione foto Patrono admin | **MODIFICARE** |
| `mediaCatalogService` / read helper | **RIUSARE** `fetchMediaAssetsByIds` — **GIÀ PRESENTE** |

**Se `source_url` assente:** non mostrare riga link (fail silent); asset legacy pre-provenance senza link.

**Aspetto:** testo «Apri su Wikimedia Commons» + icona; target `_blank` `rel=noopener`.

---

### CITY DELETE — SPECIFICA TECNICA DEFINITIVA

#### A. `deleteCity()` attuale — audit file e sequenza

| # | Step | File | Operazione | Perdita / orphan |
|---|------|------|------------|------------------|
| 0 | Staging orphan | `stagingService.orphanCityStaging` | UPDATE staging tag | Orphan staging **OK** |
| 1 | Photo | `cityLifecycleService` L68–77 | keep: `city_id=null`, status `city_deleted`; else DELETE | **CONFLITTO CONSERVA:** azzera `city_id` |
| 2 | Sponsors | null FK + `handle_city_deleted_for_sponsors` | detach | Sponsor orfani **OK** |
| 3 | Shops | DELETE | sempre | **OK** decisione |
| 4 | Legacy reports | DELETE `famous_person_photo_reports`, suggestions | | Da rimuovere (INT-REP) |
| 5 | People | DELETE `city_people` | sempre | **CONFLITTO** modale futura CONSERVA persone |
| 6 | POI | keep: `city_id null`; else DELETE cascata reviews/suggestions | | keep **perde** FK city_id |
| 7 | Events/services/guides/operators | DELETE | | Sempre cancellati oggi |
| 8 | `cities` | DELETE | | CASCADE assignments + content_reports |

**File coinvolti:** `cityLifecycleService.ts`, `DeleteCityOptionsModal.tsx` (**non wired** — nessun caller `deleteCity` in UI), `types/core.ts` (`CityDeleteOptions`).

**Atomicità:** **NON ATOMICA** — commento L60–62.

#### B. Matrice FK (migration verificate + effetti delete hard `cities`)

| Tabella | Colonna | FK → cities | ON DELETE (migration) | Problema | Target CONSERVA | Modifica |
|---------|---------|-------------|------------------------|----------|-----------------|----------|
| `entity_image_assignments` | `city_id` | sì NOT NULL | **CASCADE** | Perdita assignment | **Conservare** con `city_id` | FK → **RESTRICT** o soft-delete city; no CASCADE |
| `content_reports` | `city_id` | sì NOT NULL | **CASCADE** | Perdita segnalazioni | **Mai DELETE** | **SET NULL** o soft-delete; `city_id` storico in snapshot |
| `entity_image_history` | `city_id` | sì | **SET NULL** | OK parziale | Conservare storico | OK se assignment/media restano |
| `entity_image_history` | `assignment_id` | assignment | **RESTRICT** | Delete city CASCADE assignments → **blocco** o orphan history | Cleanup ordinato | RPC delete ordering |
| `city_patron_gallery` | `city_id` | sì | **CASCADE** | Perdita galleria patrono | Conservare se categoria patrono/media | FK RESTRICT + soft city |
| `famous_person_photo_suggestions` | `city_id` | sì | **CASCADE** | | CONSERVA community | SET NULL / soft |
| `famous_person_suggestions` | `city_id` | sì | **CASCADE** | | idem | idem |
| `user_favorites` / visited | `city_id` | sì | **CASCADE** | UX | DELETE ok | opzionale SET NULL |
| `photo_submissions` | `city_id` | sì (nullable) | **NV migration repo** — deleteCity fa UPDATE null | Perde `city_id` | **Mantenere city_id** | STOP nulling; soft city |
| `pois` | `city_id` | sì nullable | **NV** — keep imposta null | Perde ID | **Mantenere city_id** | soft city |
| `city_people` | `city_id` | NOT NULL | **NV** | DELETE bulk | Categoria CONSERVA persone | soft city o DELETE solo se categoria CANCELLA |
| `sponsors` | `city_id` | | RPC detach | OK | OK | |
| `shops` | `city_id` | NOT NULL | | | **SEMPRE CANCELLA** | invariato |

#### C. Architettura target

| Elemento | Scelta |
|----------|--------|
| RPC | **`delete_city_admin(p_city_id uuid, p_options jsonb, p_admin_role text)`** — SECURITY DEFINER, **singola transazione** |
| Soft-delete | `cities.status = 'deleted_orphan'` **oppure** `deleted_at timestamptz` — riga **non** visibile pubblico; **`cities_registry.id` immutabile** |
| `city_id` su entità CONSERVA | **Invariato** (stesso testo FK verso registry/cities soft-deleted) |
| `content_reports` | **UPDATE none** — solo unlink opzionale da city live; **mai DELETE** |
| `entity_image_assignments` | **Nessun DELETE** se CONSERVA media/POI/patron |
| `entity_image_history` | Append-only; nessun DELETE |
| Storage | **Nessun** delete blob automatico su CONSERVA |
| Sponsor | `handle_city_deleted_for_sponsors` **mantenere** |
| Staging | `orphanCityStaging` **mantenere** |

**Controlli RPC:** `is_td_admin` + **`admin_all`** only; validazione `p_options` per categoria; rifiuto se report aperti **solo** se policy CANCELLA entità collegata (già pattern delete person).

#### D. Reactivation / reclaim

| Pezzo | Stato | Estensione |
|-------|--------|------------|
| `cities_registry` | **GIÀ PRESENTE** | ID stabile — recreate usa stesso `resolveCanonicalCityId` |
| `reclaimOrphanedItems` | **GIÀ PRESENTE** | Match **nome** photo/POI — **DA ESTENDERE:** relink per **`city_id`** esplicito su tabelle che oggi usano solo nome |
| Nuovo | **`relink_orphaned_city_content(p_city_id)`** | **CREARE** — POI/photo/assignments già con `city_id` ma city soft-deleted → ripristino riga `cities` + status live |

Flusso: **città eliminata (soft)** → contenuti con `city_id=X` → **insert/recreate** city `id=X` → RPC relink → immagini/storico/report riutilizzabili.

#### E. Ruoli

| Layer | Stato | Target |
|-------|--------|--------|
| UI delete button | **Assente** (modale non wired) | Visibile solo `currentUser.role === 'admin_all'` (`AdminSidebar` pattern L77) |
| Server | **Assente** | RPC rifiuta `admin_limited` |
| Bypass | Nessun altro caller `deleteCity` | Grep **OK** |

#### F. Matrice categorie modale (target prodotto)

| Categoria UI | CONSERVA ORFANO | CANCELLA | Immagini / assignment | content_reports |
|--------------|-----------------|----------|------------------------|-----------------|
| Foto Community & Media | `photo_submissions` keep `city_id`; assignments photo | DELETE submissions + storage policy | CONSERVA: assignments attivi | **Mai DELETE** |
| POI live | `pois` keep `city_id`; assignments POI | DELETE POI + D90 cleanup RPC | CONSERVA: entity_image_* | **Mai DELETE** |
| Patrono / galleria | `city_patron_gallery` + patron assignments | DELETE gallery + revoke | CONSERVA | **Mai DELETE** |
| Personaggi | **CONSERVA ORFANO** (decisione §38.6) | `delete_city_person_with_image_cleanup` solo se CANCELLA | CONSERVA: `city_people` + `city_id` + assignments + storico | **Mai DELETE** |
| Negozi | n/a | DELETE shops | n/a | n/a |
| Eventi/servizi/guide/operatori | opzionale CONSERVA futuro | DELETE (oggi sempre) | secondario | **Mai DELETE** |
| Riga `cities` | soft-delete / orphan flag | hard DELETE solo se tutto CANCELLA | — | — |

#### G. Ordine implementazione macrofase INT-09

1. **DB/FK** — soft-delete city; fix CASCADE → RESTRICT/SET NULL; `photo_submissions` keep city_id  
2. **RPC** `delete_city_admin` + `relink_orphaned_city_content`  
3. **Servizi** — sostituire `deleteCity` client con RPC; rimuovere DELETE legacy reports step  
4. **Ruoli** — guard UI + RPC  
5. **UI** — wire `DeleteCityOptionsModal` in CitiesManager; copy segnalazioni conservate  
6. **Reclaim** — estendere `reclaimOrphanedItems`  
7. **Test** integrazione + **E2E** delete CONSERVA → recreate same ID  

---

### PRONTO PER SVILUPPO — SPECIFICA OPERATIVA

| ID | Deliverable | Pronto? | Nota |
|----|-------------|---------|------|
| INT-POI-REAL-DISCOVERY-01 | Orchestratore + API WIKIMEDIA + batch hooks + toggle | **Sì — spec §37.1–37.2** | Dipende migration toggle |
| INT-WM-SOURCE-LINK-UI-01 | Link Commons tab Media | **Sì — spec §37.3** | Solo UI + read |
| INT-09 | City delete CONSERVA | **Sì — spec §37.4** | Migration FK obbligatoria prima RPC |
| INT-01 / INT-01b | D-22 guard + cascade | **Spec §36.6** | Dopo toggle Wikimedia |
| INT-REP-DECOM-01 | Legacy reports | **Spec §36.2** | |
| §35 Magic Add / Header / Sponsor notif | | **Sì** | Non ripetuto qui |

**Non pronto senza prerequisito:** cascade suspend completa (**INT-01b** prima di validare D-22 end-to-end POI).

---

### Tabella stato post-§37 / §38

| Voce | Decisione | Spec tecnica | Sviluppo |
|------|-----------|--------------|----------|
| POI auto-save vs pubblico vs verificato | Chiusa §38.1 | **§38.1** | Pronto |
| API WIKIMEDIA + ranking «migliore» | Chiusa §38.2 | **§38.2** | Pronto |
| Trigger A/B/C/D + NO Osservatorio | Chiusa §38.3–38.4 | **§38.3** | Pronto |
| Pipeline unica | Chiusa §38.5 | **§38.5** | Pronto |
| City delete Personaggi CONSERVA/CANCELLA | Chiusa §38.6 | **§37.4** + **§38.6** | Pronto |
| Toggle / link Media / D-22 | Chiusa §37.2–37.3 | §37 | Pronto |

---

## 38. PASSAGGIO DOCUMENTALE PRE-SVILUPPO — AUDIT + BIBBIA (2026-09-27)

**Scope:** audit repository, allineamento decisioni proprietario (auto-save, API WIKIMEDIA, trigger, pipeline unica, Personaggi delete), specifiche «COME SVILUPPARLO». **Zero** codice / migration / DB / RPC / UI in questa attività.

---

### 38.1 POI — Ricerca automatica: salvataggio automatico vs verificato vs pubblico

#### Decisione funzionale (chiusa)

Quando la ricerca automatica trova una foto che **supera tutti i controlli** della pipeline Wikimedia esistente → **salvataggio automatico** nel sistema **senza** click Admin «importa». L’Admin può eliminare/sostituire dopo. **Non** equivale ad attivazione pubblica: toggle Wikimedia **OFF** + D-22 invariati.

#### Motivo

Ridurre lavoro operativo su POI ad alta confidenza; mantenere fail-closed su ambiguità e licenze non auto-path.

#### Audit repository — tre concetti

| Concetto | Significato prodotto | Rappresentazione oggi | Gap |
|----------|---------------------|------------------------|-----|
| **Trovata e salvata** | File in Storage + riga `media_assets` (+ eventuale assignment non-primary) | Pipeline Persona: solo dopo conferma modale → `runCommonsDownloadPipeline` con `adminConfirmedQid` | **Auto:** nessun percorso senza conferma; `requiresAdminConfirm: true` fisso in `lookupWikidataP18Proposal` (L277) |
| **Verificata** | CC BY 4.0 auto-path → `transition_media_asset_status` → `active` + `record_image_verification_run` | `commonsDownloadPipeline.ts` L398–429: primary **solo** se `autoPath && assignToEntity !== false` | POI auto deve usare **`assignToEntity: 'gallery_only'`** (o equivalente) + toggle OFF |
| **Pubblicamente attiva (D-22)** | Primary `active` conteggiato in cascata | `entityPrimaryImageReadService` legge primary **active**; `resolvePoiDisplayImageUrl` placeholder se assente | **`wikimedia_public_enabled`** assente in DB; INT-01b esclude Wikimedia se toggle OFF |

**Problema:** oggi «salvata» e «primary pubblica» **collassano** per Personaggi su auto-path (`assignmentRole: 'primary'` L422). Per POI serve **separazione esplicita** toggle + ruolo assignment.

**Causa:** pipeline progettata per entità Persona con conferma Admin obbligatoria e primary al successo auto-path.

**Dati coinvolti:** `media_assets.asset_status` (`suspended` → `active`), `entity_image_assignments.assignment_role` (`primary` | `gallery`), `metadata.license_outcome`, `pois.wikimedia_public_enabled` (**da creare**), `record_image_verification_run`.

**Soluzione tecnica proposta (non implementare ora):**

1. **`poiRealImageDiscoveryService.runAutoPath`:** se `lookup` → `status: 'proposal'` **e** `!top.ambiguous` **e** score ≥ soglie già in lookup (≥40 entry, ≥90 → high confidence) → chiamare pipeline con `adminConfirmedQid: proposal.qid` (**conferma tecnica orchestratore**, non modale) — stesso pattern sicurezza metadati/licenza.
2. **`assignToEntity` policy POI:** auto → upsert **`gallery`** (o primary con `assignment_status` non current — **preferito gallery** per allineamento Patron gallery + D-22); **mai** primary active finché toggle OFF.
3. **Quarantena / coda verify:** asset `suspended` + **nessun** assignment → considerato «salvato in sistema» ma **non verificato** per auto-path; Admin agisce da tab Media / verify queue (come Persona L688–693).
4. **Tab Media UI:** distinguere badge **«In sistema (non pubblica)»** vs **«Pubblica Wikimedia (toggle ON)»**.

#### COSA SVILUPPARE

Orchestratore auto + estensione pipeline input `AssignmentPolicy` + toggle + guard D-22.

#### COSA ESISTE GIÀ

`wikidataLookupService`, `commonsDownloadPipeline`, `record_image_verification_run`, `upsertEntityImageAssignmentFromSource`, read primary POI.

#### COSA MANCA

`poiRealImageDiscoveryService`, colonna toggle, policy assignment gallery-only POI, INT-01b guard toggle, UI stati tab Media.

#### COME SVILUPPARLO

1. Migration `wikimedia_public_enabled` + documentare uso `assignment_role=gallery` per staged Wikimedia POI.  
2. Aggiungere a `CommonsDownloadPipelineInput` opzione es. `assignmentRole: 'primary' | 'gallery' | 'none'` (default Persona `primary`, POI auto `gallery`).  
3. Orchestratore: ramo `mode: 'auto'` → skip modale; ramo `mode: 'manual'` → modale §38.2.  
4. Resolver D-22: ignorare assignment Wikimedia POI se toggle false **anche** se primary esistesse per errore legacy.

#### FILE DA MODIFICARE

`commonsDownloadPipeline.ts`, `poiRealImageDiscoveryService.ts` (nuovo), `entityPrimaryImageReadService` / INT-01b resolver, `PoiMediaTab.tsx`, `poiWrite.ts` / RPC promote (default toggle).

#### FILE DA CREARE

`poiRealImageDiscoveryService.ts`, migration toggle (+ eventuale `poi_wikimedia_discovery_log` — vedi §38.2 tracciabilità).

#### DB / MIGRATION

`pois.wikimedia_public_enabled boolean NOT NULL DEFAULT false`; opzionale tabella log discovery (§38.2).

#### RPC

Riuso `save_poi_with_image_assignment`, `upsert_entity_image_assignment_from_source`, `transition_media_asset_status`, `record_image_verification_run`.

#### SERVIZI

Orchestratore unico; nessuna seconda pipeline Commons.

#### UI

Badge stato; toggle; no modale su auto OK.

#### DIPENDENZE

INT-01b per D-22 end-to-end.

#### ORDINE DI IMPLEMENTAZIONE

Migration toggle → policy pipeline → orchestratore auto → guard read → UI.

#### TEST

Unit: auto-path POI crea gallery non primary; toggle OFF → placeholder pubblico. Integration: quarantena senza assignment.

#### E2E

Crea POI → attesa job auto → tab Media mostra asset + toggle OFF → pubblico placeholder → toggle ON → foto Wikimedia in cascata se nessun livello superiore.

---

### 38.2 POI — Manuale «API WIKIMEDIA» e proposta «migliore»

#### Decisione funzionale (chiusa)

Pulsante **`API WIKIMEDIA`** in tab Media (`AdminPoiModal` / `PoiMediaTab`). Lista proposte trasparente; sistema indica **migliore** con criteri pipeline; Admin può scegliere altra proposta utilizzabile, rifiutare tutte; import **solo** dopo scelta.

#### Audit — criteri e dati oggi

| Elemento | Repository | Note |
|----------|------------|------|
| Ranking Wikidata entity | `scoreCandidate` + sort + gap ambiguità 25 pt (`wikidataLookupService.ts` L110–128, L164–180) | **Già presente** |
| Soglia minima | `matchScore < 40` → none (L305–309) | Auto non parte |
| Ambiguità entity | `topAmbiguous` se delta score < 25 | Fail-closed auto; manual mostra lista |
| P18 singolo | `pickP18FileTitle` preferred > normal; multi → ambiguous (L192–204) | Una proposta file per QID |
| Licenza / controlli | `parseCommonsLicenseMetadata` → `stepOutcomes`, `blockingReasons`, `isCcBy40AutoPathEligible` | Oggi **dopo** conferma, non in lista proposte |
| UI modale | `WikidataConfirmModal` — **una** proposal o lista **solo** QID (no P18 multipli, no licenza pre-download) | **Gap UX §38.2** |
| Ranking «migliore» | **Non esiste** etichetta; Persona usa prima proposal non ambigua | Da estendere |

#### A. Individuazione «migliore» (senza seconda pipeline)

1. **Fase Wikidata:** ordine = `matchScore` desc (già). **Migliore entity** = candidato #1 con `matchScore ≥ 40` e `ambiguous === false`.  
2. **Fase P18 per entity:** se un solo P18 usable → proposta; se P18 ambiguous → entity **non utilizzabile** in auto; in manual → mostrata come «P18 ambiguo».  
3. **Fase pre-import (manual):** per ogni entity top-N (max 5, come lookup ambiguo), risolvere P18 + **optional** `fetchCommonsExtMetadata` **senza download** per preview licenza → ordinare:  
   - (i) `isCcBy40AutoPathEligible` true prima;  
   - (ii) poi `matchScore`;  
   - (iii) poi `confidence` high > medium.  
4. **Migliore assoluta** = prima proposta con licenza **non bloccante** e P18 risolto; se solo quarantena possibile → «migliore utilizzabile con verifica Admin» (badge).

#### B–I (comportamento)

| Id | Regola |
|----|--------|
| **B** | Migliore = max `(autoPathEligible, matchScore, confidence)` come sopra |
| **C** | Altre proposte ordinate stessa chiave; badge «Alternativa» |
| **D** | Modale: testo generato da `lookupNotes`, score, esiti `stepOutcomes` post-metadata, `blockingReasons` |
| **E** | Non valide: mostrate grigie, pulsante import disabilitato, motivo da `blockingReasons` |
| **F** | Dubbie (ambiguità entity o P18): selezione manuale QID obbligatoria; no auto-save |
| **G** | Nessuna valida: messaggio + solo «Chiudi» / «Riprova» |
| **H** | Admin sceglie non-migliore: consentito se proposta **utilizzabile** (licenza non fail-closed o accetta quarantena) |
| **I** | Tracciabilità: persist **`poi_wikimedia_discovery_runs`** (jsonb: activation, candidates[], bestId, chosenId, adminUserId, timestamps) **oppure** append `entity_image_history` metadata — **preferita tabella run** per audit massivo |

#### COSA SVILUPPARE

`useWikimediaEntityImport` + modale multi-proposta (estensione `WikidataConfirmModal` o `PoiWikimediaProposalsModal`) + helper `rankWikimediaProposals` in `wikidataLookupService` o file dedicato **senza** duplicare download pipeline.

#### COSA ESISTE GIÀ

Lookup, modale base, pipeline post-confirm, license parser.

#### COSA MANCA

Preview multipla, metadata prefetch Commons in lookup manual, ranking UI, log run.

#### COME SVILUPPARLO

1. `discoverForPoi(manual)` → `lookupWikidataP18Proposal`; se ambiguous espandi fino a 5 QID; per ciascuno `fetchP18` + `fetchCommonsExtMetadata` + `parseCommonsLicenseMetadata` (no storage).  
2. `rankWikimediaProposals(proposals)` → best + ordered list.  
3. Modale mostra tabella/colonne: entity, score, motivo match (city in description, …), file, licenza, autore, esiti step, auto-path sì/no.  
4. On confirm → **unico** `runCommonsDownloadPipeline` con QID scelto.

#### FILE DA MODIFICARE

`PoiMediaTab.tsx`, `AdminPoiModal.tsx`, `WikidataConfirmModal.tsx` (props generiche), `wikidataLookupService.ts` (export rank helpers).

#### FILE DA CREARE

`useWikimediaEntityImport.ts`, `rankWikimediaProposals.ts` (o modulo in services/wikimedia), migration log opzionale.

#### DB / MIGRATION

Tabella log discovery (consigliata); nessun obbligo per MVP se log in `metadata` run verification.

#### RPC

Invariati fino a assignment.

#### SERVIZI

Stesso `runCommonsDownloadPipeline`.

#### UI

Pulsante **API WIKIMEDIA**; loading; modale proposte.

#### DIPENDENZE

§38.1 policy assignment.

#### ORDINE DI IMPLEMENTAZIONE

Dopo orchestratore base; manual prima o in parallelo a auto.

#### TEST

Fixture ambiguous → 3 card; best highlighted; blocked license → disabled import.

#### E2E

Admin apre POI → API WIKIMEDIA → vede best + motivazione → sceglie alternativa → asset in tab Media, toggle OFF.

---

### 38.3 Trigger automatici — testi reali pulsanti (audit)

| Decisione | Verifica repo | Esito |
|-----------|---------------|--------|
| **A Nascita** | `saveSinglePoi`, `promoteToLive`, Flash «Avvia Ricerca Flash», «Nuovo POI» | Confermato |
| **B Import DB** | Label **`SEND TO DB (BOZZE)`** (non «IMPORTA NEL DB» in UI); tooltip «Importa nel DB reale come Bozze» | Confermato |
| **C Bonifica** | Vedi tabella §38.4 riga Bonifica | Confermato |

**Idempotenza A+B:** `promoteToLive` chiama insert POI → se hook su ogni `saveSinglePoi`, doppio job con B. **Regola implementativa:** flag `suppressDiscovery` su `saveSinglePoi` durante `runPublishingService`, discovery solo con `activation: 'mass_import'` a fine promote per quell’id.

---

### 38.4 Altri flussi batch — audit completo (NO nuovi trigger automatici)

| FLUSSO | Schermata / azione | Cosa fa | POI coinvolti | Crea/modifica POI live? | Batch? | Potrebbe lanciare discovery? | Decisione da chiedere al proprietario |
|--------|-------------------|---------|---------------|-------------------------|--------|------------------------------|-------------------------------------|
| Import **SEND TO DB (BOZZE)** | Import Dashboard | `promoteToLive` draft | Selezionati staging | **Crea** live draft | Sì | **Sì — chiuso (B)** | — |
| Import **DEDUPLICA** | Import toolbar | `deduplicateStagingData` | Staging only | No live | Sì staging | No | — |
| Import **AI QUALITY** / **SEND TO READY** | Import toolbar | Analisi / status staging | Staging | No live | Sì | **No** (non è DB live) | — |
| **Bonifica Pro (Daily)** | Manager POI-DB toolbar | `executeDailyDeepScan` | Non «+» reliability | Modifica | Sì | **Sì — chiuso (C)** | — |
| **Bonifica (N)** | Manager POI-DB | `verifyDraftsBatch(targetIds)` | Selezionati | Modifica | Sì | **Sì — chiuso (C)** | — |
| **Magic Add** | Cities list / manager | AI POI draft + `verifyDraftsBatch` | Nuovi + draft | Crea + modifica | Sì | Coperto da **A+C** | — |
| **Complete City** | Cities | Arricchimento città; POI scan se flag | Draft esistenti | Modifica | Sì | Solo se step bonifica POI | — |
| **Flash AI Discovery** | Manager POI «NUOVO POI (AI)» | `generateDraftsOnly` | Nuovi draft | Crea | Sì | **A** on create | — |
| **Osservatorio Duplicati / Anomalie** | CitiesManager tab | Merge / fix anomalie | Live | Modifica/merge | Parziale | **No — escluso** | — |
| **Regional Analysis** | Cities modal | `saveSinglePoi` new | Nuovi | Crea | Sì | **A** on create (non aggiungere trigger separato) | — |
| **Reset Img** bulk | Manager POI toolbar | `bulkResetImages` | Selezionati | Svuota `imageUrl` / assignments? | Sì | Potenziale re-discovery | **Sì — vedi §38.12** |
| **Regenerate POI massivo** | PoiToolbar modal | Stub «in implementazione» | — | — | — | N/A | — |
| **Bonifica Personaggi** | CulturePeople | AI people | `city_people` | No POI | Sì | N/A POI | — |

**Presentazione domande proprietario:** solo **§38.12** (Reset Img).

---

### 38.5 Una sola pipeline — quattro attivazioni

**Confermato:** nascita (A), import bozze (B), bonifica (C), manuale API WIKIMEDIA (D) invocano **`poiRealImageDiscoveryService`** → stesso grafo:

`lookupWikidataP18Proposal` → (policy auto/manual) → `runCommonsDownloadPipeline` → Storage `verified_real/` | `quarantine/` → `media_assets` → `record_image_verification_run` → assignment (gallery vs primary per policy) → toggle `wikimedia_public_enabled` → D-22 via INT-01b.

**Riutilizzo Personaggi:** stessi file `wikidataLookupService.ts`, `commonsDownloadPipeline.ts`, `commonsLicenseParser.ts`, modale conferma; **nessun** fork licenza.

#### COSA SVILUPPARE / ESISTE / MANCA

| | |
|--|--|
| **SVILUPPARE** | Orchestratore + hook batch + manual UI |
| **ESISTE** | Pipeline Persona completa |
| **MANCA** | Entrypoint POI, toggle, ranking manual |

#### ORDINE

Orchestratore → migration toggle → hooks A/B/C → manual D → INT-01b.

---

### 38.6 City delete — Personaggi CONSERVA ORFANO / CANCELLA

#### Decisione (chiusa)

Personaggi: stessa scelta **CONSERVA ORFANO** | **CANCELLA** della modale City delete. CONSERVA: `city_people`, `city_id`, immagini, assignments, storico, `content_reports` intatti; reclaim su recreate stesso ID.

#### Audit

| Area | Stato repo |
|------|------------|
| UI | `DeleteCityOptionsModal.tsx` L243–262 — **SEMPRE CANCELLA** (testo obsoleto) |
| Lifecycle | `cityLifecycleService.deleteCity` step 5 — **DELETE** `city_people` sempre |
| RPC persona | `delete_city_person_with_image_cleanup` — per delete singolo person, **riusabile** per ramo CANCELLA bulk |
| FK | `city_people.city_id` NOT NULL — CONSERVA **non** delete people; richiede **soft-delete city** (§37.4) non hard DELETE `cities` con CASCADE |
| Reclaim | `reclaimOrphanedItems` by name — estendere `relink_orphaned_city_content` per `city_id` |

#### Coerenza §37.4

| Punto | Prima | Dopo §38 |
|-------|-------|----------|
| Matrice F Personaggi | «DA DEFINIRE» / always delete UI | CONSERVA/CANCELLA allineato POI |
| Step 5 deleteCity | DELETE sempre | RPC: DELETE people solo se `options.deletePeople` |
| Modale | Nota fissa | Toggle come `keepPOIs` |

**Contraddizione risolta in documentazione:** UI «sempre cancella» vs decisione CONSERVA — **nessuna** modifica codice fino a INT-09.

#### COSA SVILUPPARE

Modale toggle people; RPC `delete_city_admin` ramo people; soft-delete city.

#### FILE DA MODIFICARE

`DeleteCityOptionsModal.tsx`, `cityLifecycleService.ts`, `types/core.ts` (`CityDeleteOptions.keepPeople` o `peopleMode`), migration FK.

#### RPC

`delete_city_admin`; loop `delete_city_person_with_image_cleanup` se CANCELLA.

#### TEST / E2E

Delete CONSERVA people → recreate city same id → people visibili admin + immagini.

---

### 38.12 Domande ancora aperte (solo proprietario)

#### 1. Reset Img bulk — rilanciare discovery Wikimedia?

*(Audit UI/comportamento completo: **§39.1**.)*

1. **COSA DECIDERE:** Dopo **Reset Img** su POI selezionati, il sistema deve **automaticamente** rischedulare la ricerca Wikimedia?  
2. **PERCHÉ:** Oggi non è tra i trigger A/B/C; senza regola, POI restano senza foto finché bonifica/manuale.  
3. **Se A (sì auto):** reset → job discovery per ogni id (rischio carico API se reset massivo).  
4. **Se B (no):** solo bonifica / manuale / nascita nuova — comportamento prevedibile, meno sorprese API.

---

### 38.13 Chiusura passaggio documentale

| Deliverable | Stato |
|-------------|--------|
| Audit repository | **Completato** §38.1–38.6 |
| Decisioni verificate | Auto-save, manual ranking, trigger A/B/C/D, NO Osservatorio, Personaggi delete |
| SoT aggiornata | Execution §38 + patch §37 |
| Spec «COME SVILUPPARLO» | Schede in §38.1–38.2, §38.5–38.6 |

**Resta una domanda funzionale (§38.12).** Non usare chiusura «pronta per sviluppo» finché il proprietario non risponde su Reset Img **oppure** accetta default documentato (raccomandazione implementativa: **B — no auto**, discovery solo su bonifica/manuale/API esplicita).

*Documento aggiornato §38 — 2026-09-27. Nessun file applicativo, migration, DB write o UI modificato.*

---

## 39. PASSAGGIO DOCUMENTALE — RESET IMG, CITTÀ AI, COPERTINA HERO WIKIMEDIA (2026-09-27)

**Scope:** audit repository + documentazione pre-sviluppo. **Zero** codice / migration / DB / RPC / UI.

---

### 39.1 RESET IMG — audit obbligatorio (funzione reale)

#### Percorso UI (Admin non programmatore)

1. Accedi all’**area Admin** (sidebar sinistra).
2. Clicca **`Manager POI - DB`** (voce menu «Territorio» — icona database).
3. Nella pagina **Manager POI - DB** (titolo in testa), apri il tab **`Edit City`** (pulsante ambra con icona elenco — accanto ad «Aree Geografiche» e «Osservatorio Dati»).
4. Nella lista città, clicca **Edit** (matita) sulla riga della città desiderata → si apre l’**editor città** a schermo intero.
5. Nell’editor, apri il tab **`Punti Interesse`** (icona pin — ultima sezione POI, non confondere con tab «Media»).
6. Compare il **Manager POI** della città: in alto la barra grigia **«AI Assistant»** con i pulsanti viola/verdi.
7. Nella **stessa barra**, a destra del pulsante **`Bonifica Pro (Daily)`**, c’è il pulsante con icona immagine barrata e testo esatto **`Reset Img`** (maiuscole/minuscole come in UI: `Reset` + spazio + `Img`).
8. **Condizione:** il pulsante è **disabilitato** (grigio, opacità ridotta) finché **non** selezioni almeno un POI con la **checkbox** a sinistra dell’elenco (zona tab «TUTTI / Online / Bozze AI / Revisione»).

**Non compare** in: Import staging, Osservatorio, tab Media città, modale singolo POI.

| Voce | Valore audit |
|------|----------------|
| **Label UI esatta** | **`Reset Img`** (`PoiToolbar.tsx` L327) |
| **Tooltip** | **Nessuno** sul pulsante Reset Img |
| **Conferma / modale** | **No** — esecuzione immediata al click |
| **Singolo vs multiplo** | **Multiplo** — tutti i POI il cui id è in `selectedIds` |
| **Stub?** | **No** — implementazione completa in `usePoiActions.bulkResetImages` |

#### A. Cosa fa oggi

Per ogni POI selezionato:

1. Chiama **`saveSinglePoi({ ...poi, imageUrl: '' }, cityId, user)`** (`usePoiActions.ts` L113–137).
2. `saveSinglePoi` invoca RPC **`save_poi_with_image_assignment`** con **`p_image_url: null`** (nessun URL immagine nel payload).
3. La RPC (**migration `20260923153000`**, L458–506): imposta colonna legacy **`pois.image_url = NULL`**; se esiste un **primary assignment `active`**, lo marca **`removed`** / `is_current = false` e appende **`entity_image_history`** con motivo `image_cleared_on_save`.

#### B. Cosa NON fa

- **Non** elimina righe **`media_assets`** né file Storage.
- **Non** revoca assignment **gallery** (solo **primary** current active).
- **Non** tocca toggle Wikimedia (colonna non esiste ancora).
- **Non** avvia Wikimedia né alcun job AI immagini.
- **Non** scrive log Admin dedicato (solo history assignment se revoca primary).
- **Non** chiede conferma all’Admin.

#### C. Cosa succede ai dati immagine

| Layer | Effetto |
|-------|---------|
| UI POI / `imageUrl` in memoria | Stringa vuota dopo refresh |
| `pois.image_url` | **NULL** |
| Primary D90 | **Revocato** se presente |
| Gallery / altri assignment | **Invariati** |
| `media_assets` | **Invariati** (orfani possibili in catalogo) |
| Read pubblico POI | Tende a **placeholder** se primary revocato |

#### D. Rilancio automatico Wikimedia oggi

**No.** Nessun hook post-`bulkResetImages`.

#### E. Validità §38.12

La domanda era basata su una **funzione reale e cliccabile**, non su stub. Il reset **libera il primary** ma **non** cancella asset Wikimedia già materializzati.

#### Decisione proprietario (chiusa §40.1 — D-CONS-23)

**Reset Img NON avvia discovery Wikimedia.** Ricerca successiva solo via trigger POI approvati (A/B/C/D) e **`API WIKIMEDIA`** manuale.

---

### 39.2 Magic Add — percorso UI e nomi (audit)

| Tipo nome | Valore |
|-----------|--------|
| **Nome tecnico / codice** | `executeMagicAdd` (`useAiMagicCity.ts`); log interno **`MAGIC ADD`** o **`MAGIC ENRICHMENT`** (L119) |
| **Label pulsante principale** | **`+ Città (AI)`** — toolbar tab Edit City (`CitiesListTab.tsx` L425) |
| **Titolo modale** | **`Nuova Città AI`** (`CityGeneratorModal.tsx` L41) |
| **«Magic Add» visibile all’Admin?** | **No** come testo pulsante — solo processo/log |
| **«MAGIC ENRICHMENT» visibile?** | **No** in UI — solo riga log in `ProcessLogModal` |
| **«Nuova Città AI»** | **Sì** — titolo modale (equivalente prodotto di Magic Add) |

**Percorso A (standard):** Admin → sidebar **`Manager POI - DB`** → tab **`Edit City`** → pulsante viola **`+ Città (AI)`** → modale **`Nuova Città AI`** (nome città + POI per categoria) → conferma → **`ProcessLogModal`** con avanzamento step.

**Percorso B (mappa):** Admin → **`Manager POI - DB`** → tab **`Aree Geografiche`** → su città **MANCANTE** (rosso) pulsante **`COMPLETA CITTÀ (AI)`** sulla riga (**attenzione:** vedi §39.3 — chiama **`onMagicGenerate` = Magic Add**, non Complete City).

**Percorso C:** stesso tab mappa, click riga città mancante → stesso Magic Add.

**Conflitto nome esistente:** se città già in elenco (Bozza/Mancante), modale di conferma merge (`CitiesManager` L83–119) poi stesso `executeMagicAdd` con `existingCityId`.

**Cosa fa Magic Add (codice):** crea/aggiorna **città** (`saveCityDetails`), **POI draft** multi-categoria, **personaggi**, servizi/eventi/guide, bonifica servizi, **`verifyDraftsBatch`** POI; può ancora copiare **`defaultHero`** da `global_settings.hero_image` in `imageUrl`/`details.heroImage` (decisione chiusa §35: **da scollegare in sviluppo**, non in questo passaggio).

---

### 39.3 «+ Città (AI)» vs «COMPLETA CITTÀ (AI)» — audit reale

| | **`+ Città (AI)`** | **`COMPLETA CITTÀ (AI)`** |
|--|-------------------|---------------------------|
| **Dove (UI)** | Tab **Edit City**, toolbar destra | Tab **Edit City**, visibile **solo se 1 città selezionata** (checkbox) |
| **Componente** | `CitiesListTab` → `CityGeneratorModal` | `CitiesListTab` → `CompleteCityModal` |
| **Hook** | `executeMagicAdd` | `executeCompleteCity` |
| **Città nuova vs esistente** | Nome nuovo (o merge su esistente via conflitto) | **Sempre città già in DB** (id selezionato) |
| **Crea POI nuovi** | **Sì** (Flash per categoria) | **No** (`useAiCompleteCity` **non** chiama `saveSinglePoi`) |
| **Modifica POI esistenti** | Sì (bonifica/validazione batch) | Solo se opzione **Bonifica POI** → `verifyDraftsBatch` |
| **Copertina Hero** | Può impostare hero via `defaultHero` / esistente | Step **`Verifica Media (Hero)`** — **non** genera hero; solo log se assente |
| **Personaggi** | Genera in step 1 | Genera N (modale 5/10/15) |
| **Servizi/eventi/guide** | Sì | Sì (merge & fix) |
| **Wrapper uno dell’altro?** | **No** — flussi distinti | **No** |

**Trappola UI (DISCOVERY):** in **`Aree Geografiche`**, città **MANCANTE**, etichetta **`COMPLETA CITTÀ (AI)`** (`ZoneCard.tsx` L303) invoca **`onMagicGenerate`** → **`executeMagicAdd`**, **non** `executeCompleteCity`. Etichetta **fuorviante** rispetto al tab Edit City.

**Modale Complete City:** titolo **`Completa Città (AI)`**; opzioni personaggi + checkbox bonifica POI (`CompleteCityModal.tsx`).

---

### 39.4 Decisione nuova — Wikimedia Copertina Hero città (D-CONS-21)

#### Decisione funzionale (approvata documentazione §39)

- Ricerca immagini reali Wikimedia per **POI** (già §37–38) **e** per **Copertina Hero** città.
- **Stessa pipeline** sicurezza Personaggi/POI: `wikidataLookupService` → `commonsDownloadPipeline` → provenance/licenza/quarantena.
- **Nessuna** seconda logica licenza.

#### Audit — Copertina Hero oggi

| Aspetto | Repository |
|---------|------------|
| **Modello** | Colonne **`cities.hero_image`**, **`image_url`**, **`hero_status`**, crediti/licenza; JSON editor **`details.heroImage`**, **`details.gallery`** (`cityPayloadMapper.ts`, `cityReadService.ts`) |
| **UI Admin** | Editor città → tab **`Media`** → sezione **`Copertina Hero`** (`TabMedia.tsx` / `EditorMedia.tsx` — editor usa **`TabMedia`**) |
| **Upload** | `AdminImageInput`, Photo Inspector, rimuovi/ritaglia |
| **Galleria città** | Array `details.gallery` (MediaAsset[]) |
| **Assignment D90 entity `city`** | **Non verificato** — hero principalmente **campo città**, non `entity_image_assignments` per tipo city |
| **Magic Add / Complete City** | Magic Add può scrivere hero da config globale; Complete City **non** auto-hero (§39.3) |
| **Persona Wikimedia** | `usePeopleAI` + modale — **modello di riferimento** per sicurezza |

**Gap architetturale:** POI target usa **assignment gallery + toggle**; città oggi è **dual-write legacy hero_image**. Target: asset Wikimedia in **`media_assets`** + **candidate** (metadata o assignment futuro) + **`cities.wikimedia_hero_public_enabled`**; **`hero_image` pubblico** solo con toggle ON e regole prodotto (non sostituire foto Admin upload senza policy).

---

### 39.5 Toggle Wikimedia città (D-CONS-22)

| Regola | Dettaglio |
|--------|-----------|
| **Meccanismo** | Stessa **logica** POI §37.2: per-**entità**, non globale piattaforma |
| **Campo proposto** | **`cities.wikimedia_hero_public_enabled`** boolean NOT NULL DEFAULT **false** (migration futura) |
| **UI futura** | Sezione **Copertina Hero** — switch ON/OFF |
| **OFF** | Proposta/asset Wikimedia può esistere in sistema; **non** usata come copertina pubblica |
| **ON** | Abilitazione uso pubblico secondo regole già approvate (fail-closed, no quarantena non verificata) |

**Nota:** D-22 documentata per **POI** cascade; per **città** il read usa **`hero_image`** — guard implementativa da definire in INT (non confondere con toggle POI).

---

### 39.6 Copertina Hero — proposta Wikimedia Admin (progettazione)

Nella sezione **Copertina Hero** (tab Media), spazio dedicato (layout futuro):

- Badge **Wikimedia**; anteprima; fonte; autore; attribuzione; licenza; link **`source_url`** Commons; Q-id / file; esiti checklist; motivi blocco/dubbio.
- Pulsante manuale label **`API WIKIMEDIA`** (SoT §37.1 — **non** inventare altre label; in codice POI il pulsante **non esiste ancora**; Persona usa modale «Conferma Wikidata / Commons» senza pulsante omonimo).
- Toggle §39.5.

#### COSA SVILUPPARE

`cityRealImageDiscoveryService` (o estensione orchestratore unificato `realImageDiscoveryService` con `entityType: 'city' | 'poi'`), UI blocco hero Wikimedia, migration toggle città.

#### COSA ESISTE GIÀ

Pipeline Commons, tab Media hero, `saveCityDetails`.

#### COSA MANCA

Discovery city subject (label = nome città + regione/coords), storage candidate senza overwrite hero Admin, toggle, **`API WIKIMEDIA`** in TabMedia.

#### COME SVILUPPARLO

1. Migration toggle città.  
2. Lookup Wikidata soggetto = città (stesso servizio con `WikidataLookupSubject` cityName + description).  
3. Auto/manual policy: **`assignToEntity: false`** o scrittura su tabella staging **`city_wikimedia_hero_candidate`** (jsonb asset id + metadata) finché toggle ON non promuove a `hero_image`.  
4. **`skipIfAdminHero`:** se hero impostata da upload Admin (origin metadata o `hero_status=real` + non wikimedia) → skip auto.  
5. Riutilizzare ranking §38.2 per manual.

#### FILE DA MODIFICARE (futuro)

`TabMedia.tsx`, `cityPayloadMapper.ts`, `useAiMagicCity.ts` (rimuovere hero auto per §35 **e** hook discovery separato), `useAiCompleteCity.ts`.

#### FILE DA CREARE (futuro)

`cityRealImageDiscoveryService.ts` o generalizzazione orchestratore §38.5.

#### DB / MIGRATION

`wikimedia_hero_public_enabled`; opzionale json `wikimedia_hero_candidate_asset_id`.

#### RPC

Eventuale `save_city_hero_from_wikimedia_assignment` — valutare parity POI D90 (domanda §39.12 se serve RPC dedicata vs update `saveCityDetails`).

#### SERVIZI

Stessi Wikimedia §38.5.

#### UI

Blocco proposta + toggle + **`API WIKIMEDIA`**.

#### DIPENDENZE

Scollegamento Magic Add ↔ hero globale (§35); INT-POI parallel optional.

#### ORDINE

Toggle + candidate model → pipeline → manual UI → auto hooks → test.

#### TEST / E2E

Magic Add non imposta hero pubblica Wikimedia con toggle OFF; manual import → preview → toggle ON → card città mostra hero.

---

### 39.7 Trigger automatici Wikimedia **città** (audit flussi)

| Momento | Flusso | File | Adatto a discovery? | Comportamento se hook (proposta doc) |
|---------|--------|------|---------------------|--------------------------------------|
| Creazione città Magic Add | Step 1 `saveCityDetails` | `useAiMagicCity.ts` | **Sì (candidato)** | 1 lookup città; salva candidate; **non** sovrascrive hero Admin |
| Fine Magic Add | Dopo `verifyDraftsBatch` | idem | **Ridondante** con riga sopra — **idempotenza** |
| Complete City | Dopo `Verifica Media (Hero)` | `useAiCompleteCity.ts` L669 | **Sì** se hero assente | Discovery solo se `!heroImage.trim()` |
| Complete City | Altri step | | **No** |
| + Città Manuale | Primo save editor | `AdminCityEditor` | **Opzionale** — chiedere §39.12 |
| Import POI staging | `SEND TO DB` | | **No** (non crea città) |
| Bonifica POI | | | **No** (POI only) |

**Anti-duplicazione:** chiave `(city_id, content_hash)`; `skipIfCandidateExists`; non lanciare se hero Admin presente.

**D-22 città:** finché toggle OFF, read pubblico **non** deve usare candidate Wikimedia come hero (placeholder categoria città se già previsto).

---

### 39.8 Mappa Wikimedia (semplice)

| Flusso | Cosa fa (sintesi) | Wikimedia POI | Wikimedia Hero città |
|--------|-------------------|---------------|----------------------|
| **+ Città (AI)** / Magic Add | Crea/arricchisce città + POI + validazione | **Sì** (A/C §38) | **Sì** (auto §39.7 — decisione recepita) |
| **COMPLETA CITTÀ (AI)** | Arricchisce città esistente, no POI nuovi | Solo se bonifica POI opzionale | **Sì** se hero vuota (§39.7) |
| Nuovo POI / nascita | `saveSinglePoi` | **Sì** A | — |
| **SEND TO DB (BOZZE)** | Promote staging | **Sì** B | — |
| Bonifica POI | AI testi + save | **Sì** C | — |
| **API WIKIMEDIA** manuale | Admin | **Sì** D (POI) | **Sì** (Hero — §39.6) |
| **Osservatorio** | Merge/anomalie | **No** (chiuso) | **No** |
| **Reset Img** | Revoca primary POI | **Domanda aperta §39.1** | — |

---

### 39.9 Orchestratore unico (estensione §38.5)

Quattro attivazioni POI + **due modalità città** (auto batch Magic/Complete + manuale Hero **`API WIKIMEDIA`**) → **`realImageDiscoveryOrchestrator`** con parametro `entityType: 'poi' | 'city'`; stesso `commonsDownloadPipeline`; policy assignment diversa (POI gallery / city candidate).

---

### 39.10 Rischi e conflitti

| Rischio | Dettaglio |
|---------|-----------|
| **Label ZoneCard** | «COMPLETA CITTÀ (AI)» lancia Magic Add — confusione operativa |
| **Reset Img vs asset** | Catalogo Media conserva blob; primary revocato |
| **Hero legacy vs D90** | Città senza assignment pattern POI — migration/RPC da progettare |
| **Magic Add hero globale** | Contrasta §35 finché non scollegato — discovery **non** deve reintrodurre auto-foto via `defaultHero` |
| **Doppio trigger city** | Magic Add step 1 + Complete City — serve idempotenza |

---

### 39.11 Domande funzionali (§39 → chiuse in §40)

Le tre questioni elencate qui erano **aperte al §39**. **Chiusura definitiva:** Execution **§40.1–40.4** (D-CONS-23…26).

---

### 39.12 Stato passaggio §39

| Deliverable | Stato |
|-------------|--------|
| Audit Reset Img | **§39.1** (+ chiusura §40.1) |
| Audit Magic Add UI | **§39.2** |
| Audit + vs Completa | **§39.3** |
| Hero Wikimedia + toggle | **§39.4–39.6** (+ gerarchia §40.3–40.5) |
| Trigger città | **§39.7–39.8** (+ §40.2, §40.6) |
| SoT aggiornati | Master Plan Appendice K–L; Deep §40 |

*Documento aggiornato §39 — 2026-09-27. Nessun file applicativo modificato.*

---

## 40. CHIUSURA DECISIONI RESIDUE §39 (2026-09-27)

**Scope:** recepimento decisioni proprietario; audit coerenza; spec sviluppo futuro. **Zero** codice / DB / UI.

---

### 40.1 Reset Img — NON trigger Wikimedia (D-CONS-23) — CHIUSA

| Campo | Valore |
|-------|--------|
| **DECISIONE** | Dopo **Reset Img** (percorso §39.1) il sistema **NON** avvia discovery Wikimedia. |
| **MOTIVAZIONE** | Reset = pulizia primary legacy; discovery solo su trigger A/B/C/D e manuale **API WIKIMEDIA**. |
| **COMPORTAMENTO DESIDERATO** | Invariato reset auditato + **zero** job post-reset. |
| **COMPORTAMENTO ATTUALE** | Già **nessuna** chiamata Wikimedia (`usePoiActions.bulkResetImages`). |
| **GAP** | Nessuno funzionale; in sviluppo orchestratore **non** registrare hook su `bulkResetImages`. |
| **COSA SVILUPPARE** | Esplicito guard nel futuro `poiRealImageDiscoveryService`: `activation !== 'reset_img'`. |
| **COME** | Nessun listener post-reset; test regressione. |
| **FILE** | `usePoiActions.ts`, `poiRealImageDiscoveryService.ts` (futuro) |
| **DB/RPC** | Invariati |
| **DIPENDENZE** | INT-POI-REAL-DISCOVERY-01 |
| **ORDINE** | Con orchestratore POI |
| **TEST** | Reset Img su N POI → zero chiamate Wikidata/Commons |
| **E2E** | Seleziona POI → Reset Img → attesa → nessun asset Wikimedia nuovo |

**Regola SoT:** **Reset Img NON è un trigger automatico della discovery Wikimedia.**

---

### 40.2 «+ Città Manuale» — NON trigger Wikimedia Hero (D-CONS-24) — CHIUSA

| Campo | Valore |
|-------|--------|
| **DECISIONE** | **+ Città Manuale** (`CitiesListTab` → `onEdit('new')`, label **`+ Città Manuale`**) **non** avvia ricerca Wikimedia Copertina Hero. |
| **MOTIVAZIONE** | Creazione scheletro sotto controllo Admin; Wikimedia su richiesta o flussi AI approvati. |
| **DESIDERATO** | Save città vuota/manuale → hero discovery **skip**. |
| **ATTUALE** | Nessun hook Wikimedia (solo editor manuale). |
| **GAP** | Futuro orchestratore città: **non** agganciare `AdminCityEditor` first-save. |
| **COSA SVILUPPARE** | Allowlist trigger città: Magic Add, Complete City (§40.6), manuale **API WIKIMEDIA** — **escluso** `manual_city_create`. |
| **COME** | `cityRealImageDiscoveryService.schedule(..., { activation: 'magic_add' \| 'complete_city' \| 'manual_api' })` |
| **FILE** | `useAiMagicCity.ts`, `useAiCompleteCity.ts`, `TabMedia.tsx` (API), **non** `AdminCityEditor` save iniziale |
| **TRIGGER AUTO CITTÀ APPROVATI** | Magic Add (§39.7); Complete City hero assente (§39.7); **non** + Città Manuale; **non** Osservatorio; **non** Reset Img POI |

---

### 40.3 Gerarchia Copertina Hero città (D-CONS-25) — CHIUSA

| Campo | Valore |
|-------|--------|
| **DECISIONE** | Gerarchia **solo città** (Copertina Hero): **ADMIN → REAL/WIKIMEDIA → COMMUNITY → AI → PLACEHOLDER**. **Sponsor non applicato** alla Hero città. |
| **POI** | Invariata: **SPONSOR → ADMIN → …** (D-22 / §32). |
| **MOTIVAZIONE** | Sponsor è concetto POI; evitare confusione cascade città. |

**Esempi ufficiali (con toggle Wikimedia città — §40.4):**

| Caso | Admin hero | Wikimedia valida | Toggle ON | Esito pubblico |
|------|------------|------------------|-----------|----------------|
| 1 | Sì | Sì | Sì | **Admin** |
| 2 | No | Sì | Sì | **Wikimedia** |
| 3 | Sì | Sì | No | **Admin** (Wikimedia in pancia, non in cascata) |
| 4 | No | Sì | No | Community / AI / Placeholder per gerarchia |

---

### 40.4 Toggle ON = eleggibilità in gerarchia, senza «USA COME COPERTINA» (D-CONS-26) — CHIUSA

| Campo | Valore |
|-------|--------|
| **DECISIONE** | Toggle **`wikimedia_hero_public_enabled` ON** → foto Wikimedia **partecipa** al resolver gerarchia; **OFF** → esclusa. **Nessun** pulsante aggiuntivo «Usa come copertina». |
| **ON ≠** | Forzare sostituzione Admin se Admin valido resta (Caso 1 §40.3). |
| **Quattro passaggi distinti** | (1) discovery (2) salvataggio asset/candidate (3) toggle (4) **selezione Hero** via resolver gerarchia al read (o materializzazione controllata al toggle change). |

#### COSA SVILUPPARE

`resolveCityHeroDisplayUrl` (nome indicativo **INT-CITY-HERO-RESOLVER-01**) — **un solo** resolver, analogo spirito `entityPrimaryImageReadService` / D-22 POI.

#### COME SVILUPPARLO

1. Input: `cityId`, campi DB, candidate Wikimedia asset id, toggle, gallery, photo_submissions approvate, `hero_status` / origin metadata.  
2. Ordine: Admin se URL hero con origin admin/real upload; else se toggle ON e asset Wikimedia **active** eligible; else community (submission approvata collegata a hero — oggi parziale in `photoService`); else AI se marcata; else placeholder categoria città.  
3. **Non** scrivere `hero_image` automaticamente su discovery — candidate separata finché resolver non seleziona livello Wikimedia.  
4. Opzionale: on toggle OFF→ON, **refresh** cache read; on Admin upload, Wikimedia resta candidate ma non vince.

---

### 40.5 Audit tecnico — Hero città oggi vs target

| Aspetto | **Oggi (repository)** | **Target post-sviluppo** |
|---------|----------------------|---------------------------|
| **Selezione pubblica** | **`cityHeaderImageUrl`**: `heroImage` poi `imageUrl` (`resolveCityPresentation.ts` L12–18) — **2 campi**, no cascade | Resolver **D-CONS-25** + toggle Wikimedia |
| **CityHeader / pubblico** | `details.heroImage` diretto (`CityHeader.tsx` L194) | Usa URL risolto dal resolver |
| **CityCard listing** | `city.imageUrl` (`CityCard.tsx` L158) — **card** separata da hero | Allineare read listing a resolver o documentare card vs hero |
| **Admin upload** | `TabMedia` / `EditorMedia` → `saveCityDetails` → `hero_image` | Resta livello **ADMIN** |
| **Community** | `photoService` può impostare/rimuovere hero collegata a submission (`photoService.ts` L284+) | Livello **COMMUNITY** nel resolver |
| **AI hero** | Non generatore automatico (Complete City / EditorMedia) | Livello **AI** se `hero_status`/origin ai |
| **Wikimedia** | **Assente** | Candidate + toggle; livello **REAL/WIKIMEDIA** se ON |
| **Placeholder** | `ImageWithFallback` su URL vuoto | Livello **PLACEHOLDER** esplicito |
| **D-22 POI resolver** | `entityPrimaryImageReadService` — **non** usato per città | **Riutilizzare pattern**, non la stessa funzione POI |
| **Sponsor** | N/A su città | **Escluso** per decisione |

**Conflitto / rischio:** oggi **nessuna gerarchia** — chi scrive per ultimo su `hero_image` vince. Sviluppo deve **centralizzare** read pubblico senza seconda priorità parallela.

**File coinvolti (futuro):** `resolveCityPresentation.ts`, `cityReadService.ts` (`mapDbCityToDetails`), `CityHeader.tsx`, `CityCard.tsx`, `TabMedia.tsx`, `cityRealImageDiscoveryService.ts`, migration toggle §39.5.

**DB/RPC:** `cities.wikimedia_hero_public_enabled`; candidate asset id (colonna json o tabella); eventuale RPC save hero **solo** per upload Admin (invariato `saveCityDetails`).

---

### 40.6 Ricerca Wikimedia città — quattro passaggi (richiamo chiuso)

| Passaggio | Descrizione |
|-----------|-------------|
| **1 Discovery** | Magic Add post-save; Complete City se hero vuota; manuale **API WIKIMEDIA** |
| **2 Salvataggio** | Pipeline Commons → `media_assets` + candidate (non promuove hero pubblica da sola) |
| **3 Toggle** | Default OFF per città |
| **4 Selezione Hero** | Resolver §40.4 quando si renderizza / materializza read pubblico |

**Esclusi:** + Città Manuale, Osservatorio, Reset Img, Sponsor.

---

### 40.7 Anomalia UI Aree Geografiche (nota conservata)

In **Manager POI - DB → Aree Geografiche**, città **MANCANTE**, pulsante etichettato **`COMPLETA CITTÀ (AI)`** invoca **Magic Add** (`ZoneCard.tsx`). **Non** correggere in questo passaggio. **Nota:** ambiguità UI da riesaminare **a valle** degli sviluppi Wikimedia/hero.

---

### 40.8 Magic Add / Complete City — invariato §39

Decisioni §39.3, §35 (no auto-foto Magic Add via `hero_image` globale), flussi distinti — **non riaperti**. Wikimedia città **separata** dal vecchio `defaultHero`.

---

### 40.9 Stato decisionale post-§40

| ID | Decisione | Stato |
|----|-----------|--------|
| D-CONS-23 | Reset Img → no Wikimedia | **Chiusa** |
| D-CONS-24 | + Città Manuale → no auto Wikimedia | **Chiusa** |
| D-CONS-25 | Gerarchia Hero città (no Sponsor) | **Chiusa** |
| D-CONS-26 | Toggle ON = gerarchia; no «Usa come copertina» | **Chiusa** |

**Domande funzionali aperte:** **nessuna** emersa in §40.

**Gap solo tecnici (sviluppo):** INT-CITY-HERO-RESOLVER-01, INT-POI-REAL-DISCOVERY-01, migration toggle città/POI, allineamento CityCard vs hero resolver, decommission Magic Add ↔ `global_settings.hero_image` (§35).

*Documento aggiornato §40 — 2026-09-27. Nessun file applicativo modificato.*

---

## FINAL PRE-DEVELOPMENT TECHNICAL AUDIT (2026-09-27)

> **Riferimento operativo unico per avvio sviluppo.** Decisioni funzionali: §32–§40 + D-CONS + Master Plan. Questo addendum è **solo audit tecnico + piano esecutivo** (read-only repository al 2026-09-27).

---

### 41.1 Sintesi esecutiva

| Area | Pronto / riuso | Da creare | Blocco avvio Fase 1 |
|------|----------------|-----------|---------------------|
| A. POI Wikimedia | Pipeline Persona completa | Orchestratore + UI + toggle + D22 guard | **No** — ordine DB→servizi→UI |
| B. Città Hero Wikimedia | Pipeline Commons | Resolver Hero + candidate + toggle | **No** |
| C. City Delete CONSERVA | Modale UI (parziale), reclaim parziale | RPC atomica + FK + soft-delete | **Sì** — FK CASCADE va migrata **prima** delete CONSERVA in prod |
| D. Integrazione MF2/MF4 | `media_assets`, assignments, history | Estensioni policy ruolo gallery POI | **No** |
| E. Decommission | Documentato §35 | Magic Add hero, Applica Header, INT-13 | **No** (fase dedicata in coda piano) |

**BLOCCANTI PRIMA DELLO SVILUPPO (assoluti):** **NESSUN BLOCCANTE** che impedisca di **iniziare Fase 1** (migration schema + RPC design). **Vincolo:** INT-09 **non** andare in produzione finché migration FK (assignments/reports) **non** è applicata e verificata su DB target.

**DOMANDE FUNZIONALI APERTE:** **NESSUNA** (§40 + questo audit).

---

### 41.2 POI Wikimedia — stato repository

#### GIÀ PRONTO / RIUTILIZZABILE

| Componente | Path | Note |
|------------|------|------|
| Lookup Wikidata + score | `wikidataLookupService.ts` | `scoreCandidate`, soglia 40, ambiguità ±25, P18 |
| Licenza fail-closed | `commonsLicenseParser.ts` | CC BY 4.0 auto-path, `blockingReasons`, step outcomes |
| Download + Storage + asset | `commonsDownloadPipeline.ts` | Quarantena, `source_url`, `record_image_verification_run` |
| Modale Admin | `WikidataConfirmModal.tsx` | Q-id, P18, confidence, note; lista candidati ambigui |
| Flusso reference | `usePeopleAI.ts` L616–711 | Lookup → modale → pipeline → save person |
| Assignment write | `entityImageAssignmentWriteService.ts` | `assignmentRole: 'primary' \| 'gallery'` per `entityType: 'poi'` |
| D90 save POI | `save_poi_with_image_assignment` | Primary admin via RPC |
| Read primary batch | `entityPrimaryImageReadService.ts` | Cutover `imageUrl` POI da primary **active** |
| Provenance UI catalogo | `MediaAssetDetailPanel.tsx` | Link `source_url` |

#### DA CREARE

| Componente | Descrizione |
|------------|-------------|
| `poiRealImageDiscoveryService.ts` | **Unico orchestratore** — activations allowlist |
| `useWikimediaEntityImport.ts` | Stato modale POI (+ refactor Persona opzionale) |
| `rankWikimediaProposals.ts` (o export da lookup) | Ranking manual **senza** secondo algoritmo — riusa score + license prefetch |
| Migration | `pois.wikimedia_public_enabled boolean NOT NULL DEFAULT false` |
| Opzionale | `poi_wikimedia_discovery_runs` (tracciabilità §38.2) |

#### DA MODIFICARE

| File | Motivo |
|------|--------|
| `commonsDownloadPipeline.ts` | `assignmentRole` policy POI auto = **gallery**; param `adminConfirmedQid` orchestrator auto |
| `PoiMediaTab.tsx` | **`API WIKIMEDIA`**, toggle, preview, link Commons |
| `AdminPoiModal.tsx` | Wire hook discovery |
| `WikidataConfirmModal.tsx` | Multi-proposta + badge «migliore» |
| `useAiValidation.ts`, `importAutomationService.ts` / `promoteToLive`, `usePoiActions.ts`, `poiWrite.ts` (hook nascita) | Trigger B/C/A allowlist |
| `entityPrimaryImageReadService` + **INT-01b** | D-22: Sponsor→Admin→Real/Wikimedia (toggle ON)→… |
| `domain/poi/resolvePoiDisplayImageUrl.ts` | Oggi **non** D-22 — solo snapshot→catalog→placeholder |

#### DA RIMUOVERE / DECOMMISSION (coda piano §35)

| Item | Path |
|------|------|
| INT-13 portrait register | per audit §35 |
| `global_settings.hero_image` consumer Magic Add | `useAiMagicCity.ts` L70–75, L251–270 |
| Applica Header | `useAdminHeaderManager.ts`, `AdminHeaderManager.tsx` |

#### SOLO VERIFICARE (runtime DB)

| Item | Repo | DB live |
|------|------|---------|
| RPC `save_poi_with_image_assignment` | ✅ migration `20260923153000` | **Non verificato** in questa sessione |
| `upsert_entity_image_assignment_dual_write` | Usata da Wikimedia pipeline | **Non verificato** apply |
| Rigenerare `src/types/supabase.ts` | Dopo nuove migration | Obbligatorio post-migration |

#### Orchestratore unico — contratto

```text
discoverForPoi(poiId, { activation: 'on_create' | 'mass_import' | 'bonifica' | 'manual_api' })
  → lookupWikidataP18Proposal(subject from POI)
  → manual: rank + WikidataConfirmModal / PoiWikimediaProposalsModal
  → auto: if proposal && !ambiguous && pipeline OK → runCommonsDownloadPipeline(adminConfirmedQid programmatic)
  → POI auto: assignmentRole gallery + wikimedia_public_enabled false
  → skip: skipIfPrimaryHigherPriority, skipIfSameContentHash, suppress during promote batch (idempotenza B vs A)
```

**Trigger approvati (allowlist — nessun altro):**

| activation | Ingresso reale |
|------------|----------------|
| `on_create` | `saveSinglePoi` nuovo id; `promote_staging_poi_to_live` (con suppress duplicato se anche mass_import) |
| `mass_import` | `runPublishingService` → `promoteToLive` post-success |
| `bonifica` | `verifyDraftsBatch`; `executeDailyDeepScan` post-save; Complete City step bonifica POI |
| `manual_api` | `PoiMediaTab` pulsante **`API WIKIMEDIA`** |

**Esclusi (chiuso):** Osservatorio (`AnomalyInspector`, merge), **Reset Img**, qualsiasi hook generico non in tabella.

#### Altri flussi multi-POI (audit autonomo)

| Flusso | Dove | Batch? | Immagini oggi | Integrazione Wikimedia | Decisione proprietario |
|--------|------|--------|---------------|------------------------|------------------------|
| Flash AI Discovery | `useAiFlashSearch.generateDraftsOnly` | Sì, crea draft | `saveSinglePoi` vuoto | Coperto da **`on_create`** se orchestratore agganciato a nascita | **Non richiesta** — già «nascita POI» |
| Regional Analysis | `RegionalAnalysisModal` → `saveSinglePoi` | Sì, nuovi POI | Idem | Idem **`on_create`** | **Non richiesta** |
| City Audit | `CityAuditModal` | Sì | Idem | Idem | **Non richiesta** |
| Anomaly Inspector | Osservatorio | Singolo/batch fix | `saveSinglePoi` | **Escluso** per decisione | **Chiuso — NO** |
| fixTaxonomy | `usePoiActions` | Sì, tutti POI città | Solo categoria | **No** — non crea immagini | N/A |
| bulkStatusChange / bulkDelete | POI manager | Sì | Delete/status | **No** | N/A |
| merge_pois_observatory | Osservatorio | 2 POI | reconcile immagini | **No** trigger discovery | N/A |

**Dichiarazione:** **nessun altro batch reale** richiede **nuova decisione funzionale** oltre allowlist §41.2 se l’orchestratore rispetta **solo** le quattro activations (non hook globale su ogni `saveSinglePoi` senza classificazione — implementare **dispatch esplicito** dai caller approvati + nascita controllata).

---

### 41.3 POI — auto-save candidata vs pubblico (percorso target)

| Step | Dove vive | Oggi | Target |
|------|-----------|------|--------|
| Validazione/licenza | Pipeline | Persona: post-modale | Auto: stessa pipeline |
| Asset | `media_assets` | ✅ | ✅ |
| Assignment | `entity_image_assignments` | Auto-path Persona → **primary** | POI auto → **`gallery`** (unico current per ruolo gallery ammesso da schema) |
| Toggle | `pois.*` | **Assente** colonna | `wikimedia_public_enabled` default **false** |
| Primary pubblico | D90 + read | Primary active conta in cutover | Wikimedia **non** primary finché toggle OFF + INT-01b |
| Read pubblico | `resolvePoiDisplayImageUrl` | **Non** D-22 | INT-01b esclude Wikimedia se toggle OFF; placeholder se nessun livello |

**Regola:** auto-save **≠** pubblico. Pubblico = primary active selezionato da cascata D-22 con toggle ON per livello Wikimedia.

---

### 41.4 POI — API WIKIMEDIA manuale (UI audit)

| Domanda | Risposta repo |
|---------|---------------|
| Dove pulsante | **`PoiMediaTab.tsx`** — **assente** oggi; stessa modale **`AdminPoiModal`** (matita pubblica + Manager POI) |
| Modale esistente | **`WikidataConfirmModal`** — 1 proposal o lista Q-id; **no** licenza pre-download |
| Ranking esistente | **`scoreCandidate`** + sort — **unico** algoritmo; manual estende con prefetch Commons + `parseCommonsLicenseMetadata` |
| Migliore proposta | max `(eligible auto-path, matchScore, confidence)` — §38.2 |
| Scelta Admin | `confirmWikidataCommonsImport` pattern da `usePeopleAI` |
| Gap | Multi-row UI, motivi invalidità, log run |

**UI responsive/a11y:** riusare pattern `WikidataConfirmModal` (focus trap, ESC); lista proposte scrollabile mobile; loading su pulsante **`API WIKIMEDIA`**.

---

### 41.5 Città Hero — flusso attuale e resolver target

#### Writers Hero (audit)

| Writer | Path |
|--------|------|
| Admin upload | `TabMedia.tsx`, `EditorMedia.tsx` → `saveCityDetails` → `cityPayloadMapper` → `hero_image` |
| Magic Add | `useAiMagicCity.ts` → `defaultHero` / existing hero |
| Community | `photoService.ts` aggiorna hero collegata submission |
| AI auto hero | **Assente** (Complete City solo warn) |

#### Readers Hero (audit)

| Reader | Path | Logica |
|--------|------|--------|
| Public header | `CityHeader.tsx` | `details.heroImage` diretto |
| Listing card | `CityCard.tsx` | `city.imageUrl` (**card**, non hero) |
| MySpace helper | `resolveCityPresentation.cityHeaderImageUrl` | hero → imageUrl |
| Ranking | `rankingService.ts` | `hero_image` DB |

#### D90 city

**`entity_type` city NON esiste** in `entity_image_assignments` (solo person/poi/patron/photo_submission). Hero città = **legacy colonne** + JSON gallery.

#### Resolver target INT-CITY-HERO-RESOLVER-01

Gerarchia **senza Sponsor:** ADMIN → REAL/WIKIMEDIA (toggle ON) → COMMUNITY → AI → PLACEHOLDER.

**Origine Admin:** hero scritta via Admin upload (`hero_status`, path Storage, assenza flag wikimedia-only candidate).

**Wikimedia:** candidate `media_asset_id` + toggle; partecipa solo se ON e asset **active** eligible.

**Implementazione:** estendere read path (`cityReadService`, `cityHeaderImageUrl`, `CityHeader`) — **non** seconda tabella priorità.

---

### 41.6 Città — toggle Wikimedia (tecnico)

| Aspetto | Repo oggi | Sviluppo |
|---------|-----------|----------|
| Colonna | **Assente** in `supabase.ts` `cities.Row` | `wikimedia_hero_public_enabled boolean NOT NULL DEFAULT false` |
| Candidate | — | `wikimedia_hero_candidate_asset_id uuid` FK nullable **oppure** jsonb metadata |
| RLS `cities` | Esistente admin write | Estendere policy update toggle **admin** |
| UI | `TabMedia` Copertina Hero | Switch + blocco proposta Wikimedia |
| Pubblico | N/A | Resolver §41.5 |

**DB live:** stato migration **non verificato** in sessione.

---

### 41.7 Magic Add — punti scollegamento (§35)

| Punto | File | Azione sviluppo |
|-------|------|-----------------|
| `defaultHero` | `useAiMagicCity.ts` L70–75, L251–270 | Rimuovere uso; hero vuota se nessuna fonte valida |
| Config | `ConfigContext.tsx`, `settingsService.ts` | Stop read per Magic Add (Applica Header decom dopo) |
| Discovery città | Stesso hook | **Separato:** `cityRealImageDiscovery` post-`saveCityDetails` **senza** scrivere hero |

---

### 41.8 Reset Img / + Città Manuale — coerenza

| Decisione | Repo | Rischio indiretto |
|-----------|------|-------------------|
| Reset Img no WM | `bulkResetImages` → solo RPC clear | **Nessuno** |
| + Città Manuale no WM | `onEdit('new')` → editor senza generator | **Nessuno**; Complete City fa solo **log** lookup personaggi (L283), **non** POI/city hero pipeline |

---

### 41.9 City Delete — audit definitivo

| Elemento | Stato repo |
|----------|------------|
| `deleteCity` | `cityLifecycleService.ts` — **sequenziale, non atomico** |
| `DeleteCityOptionsModal` | Solo `keepUserPhotos`, `keepPOIs`; People **SEMPRE CANCELLA** UI+code L152–177 |
| Caller UI delete | **Nessuno** — modale **non wired** |
| `CityDeleteOptions` type | **2 flag** — manca people/patron/events/… |
| People delete | Always DELETE — **conflitto** D-CONS-20 |
| `content_reports` | FK **`ON DELETE CASCADE`** su `city_id` (`20260916130100`) — **viola** CONSERVA |
| `entity_image_assignments` | FK **`ON DELETE CASCADE`** (`20260916130000`) — **viola** CONSERVA |
| `photo_submissions` keep | Oggi **null** `city_id` — spec: **mantenere** `city_id` |
| RPC target | **`delete_city_admin`** — **non presente** in repo |
| Reclaim | `reclaimOrphanedItems` by name — estendere relink same id |
| Ruoli | Pattern `admin_all` altrove — **non** wired su delete città |

**Fattibilità RPC atomica:** **sì**, dopo migration FK (RESTRICT/soft-delete city) + soft-delete `cities`.

**Piano INT-09:** §37.4 + §40.6 invariato.

---

### 41.10 Integrazione sistema immagini (no architettura parallela)

| Pezzo | POI Wikimedia | Città Hero |
|-------|---------------|------------|
| `media_assets` | ✅ riuso | ✅ riuso |
| `entity_image_assignments` | gallery/primary POI | Candidate via asset ref; **no** entity_type city — hero column o future extension |
| `entity_image_history` | append RPC esistenti | idem |
| D90 POI | `save_poi_with_image_assignment` | N/A |
| Read | `entityPrimaryImageReadService` + INT-01b | **Nuovo** resolver Hero |
| Pipeline Wikimedia | **Una** `commonsDownloadPipeline` | **Stessa** |
| Moderation | `content_reports` | invariato |

---

### 41.11 DB / RPC / RLS — elenco migration & RPC (repo)

| ID | Tipo | Nome / oggetto | Stato repo |
|----|------|----------------|------------|
| M1 | migration | `pois.wikimedia_public_enabled` | **DA CREARE** |
| M2 | migration | `cities.wikimedia_hero_public_enabled` + candidate ref | **DA CREARE** |
| M3 | migration | FK `entity_image_assignments` → cities **RESTRICT** o soft-delete | **DA CREARE** |
| M4 | migration | FK `content_reports.city_id` **SET NULL** o soft-delete | **DA CREARE** |
| M5 | migration | `cities.deleted_at` / status orphan | **DA CREARE** |
| R1 | RPC create | `delete_city_admin` | **DA CREARE** |
| R2 | RPC create | `relink_orphaned_city_content` | **DA CREARE** |
| R3 | RPC modify | `upsert_poi_primary_image_assignment` / gallery helper POI | **VALUTARE** — gallery via `upsert_entity_image_assignment_dual_write` già ok |
| R4 | RPC | `save_poi_with_image_assignment` | **ESISTE** — default toggle su insert opzionale |
| Types | | `src/types/supabase.ts` | **Rigenerare** dopo M1–M5 |

**Storage:** bucket esistente `PUBLIC_BUCKET` in pipeline — **nessuna** nuova policy obbligatoria per MVP Wikimedia.

---

### 41.12 FILE SCOPE DEFINITIVO

| File / oggetto | Motivo | Tipo | Area | Dip. | Ord. |
|----------------|--------|------|------|------|------|
| `supabase/migrations/*_poi_wikimedia_toggle.sql` | toggle POI | CREARE | DB | — | 1 |
| `supabase/migrations/*_city_wikimedia_toggle.sql` | toggle + candidate city | CREARE | DB | — | 1 |
| `supabase/migrations/*_city_delete_fk_soft.sql` | CONSERVA ORFANO | CREARE | DB | — | 1 |
| `supabase/migrations/*_delete_city_admin.sql` | RPC delete | CREARE | DB/RPC | M3–M5 | 2 |
| `src/types/supabase.ts` | tipi | MODIFICARE | types | migrations | 2 |
| `src/services/poi/poiRealImageDiscoveryService.ts` | orchestratore POI | CREARE | core | M1 | 3 |
| `src/services/city/cityRealImageDiscoveryService.ts` | orchestratore city | CREARE | core | M2 | 3 |
| `src/services/wikimedia/commonsDownloadPipeline.ts` | gallery policy POI | MODIFICARE | core | — | 3 |
| `src/services/wikimedia/rankWikimediaProposals.ts` | ranking manual | CREARE | core | — | 3 |
| `src/hooks/admin/useWikimediaEntityImport.ts` | UI state | CREARE | UI | orchestrator | 4 |
| `src/components/admin/poiModal/PoiMediaTab.tsx` | API WIKIMEDIA + toggle | MODIFICARE | UI | M1 | 5 |
| `src/components/admin/wikimedia/WikidataConfirmModal.tsx` | multi-proposta | MODIFICARE | UI | — | 5 |
| `src/components/admin/wikimedia/WikimediaSourceLink.tsx` | link Commons | CREARE | UI | — | 5 |
| `src/components/admin/cityEditor/tabs/TabMedia.tsx` | Hero Wikimedia block | MODIFICARE | UI | M2 | 5 |
| `src/domain/city/resolveCityHeroDisplayUrl.ts` | gerarchia Hero | CREARE | read | M2 | 6 |
| `src/myspace/resolveCityPresentation.ts` | usa resolver | MODIFICARE | read | 6 | 6 |
| `src/components/city/CityHeader.tsx` | URL risolto | MODIFICARE | UI pub | 6 | 7 |
| `src/services/media/entityPrimaryImageReadService.ts` | D-22 guard | MODIFICARE | read | M1, INT-01b | 6 |
| `src/domain/poi/resolvePoiDisplayImageUrl.ts` o successor | D-22 | MODIFICARE | read | INT-01b | 6 |
| `src/hooks/admin/useAiValidation.ts` | bonifica hook | MODIFICARE | batch | orchestrator | 4 |
| `src/services/importAutomationService.ts` | mass import | MODIFICARE | batch | orchestrator | 4 |
| `src/hooks/admin/usePoiActions.ts` | daily bonifica | MODIFICARE | batch | orchestrator | 4 |
| `src/services/city/poi/poiWrite.ts` | nascita POI dispatch | MODIFICARE | write | orchestrator | 4 |
| `src/hooks/admin/useAiMagicCity.ts` | no defaultHero + city discovery | MODIFICARE | batch | M2, §35 | 8 |
| `src/hooks/admin/useAiCompleteCity.ts` | city discovery hero vuota | MODIFICARE | batch | M2 | 8 |
| `src/services/city/cityLifecycleService.ts` | replace con RPC | MODIFICARE | delete | R1 | 9 |
| `src/components/admin/cities/DeleteCityOptionsModal.tsx` | categorie CONSERVA | MODIFICARE | UI | R1 | 9 |
| `src/types/core.ts` | `CityDeleteOptions` esteso | MODIFICARE | types | — | 9 |
| `useAdminHeaderManager.ts` / Applica Header | decom | RIMUOVERE | decom | §35 | 10 |
| INT-13 code paths | decom | RIMUOVERE | decom | §35 | 10 |
| `merge_pois` / INT-MERGE-IMG-01 | survivor-only | MODIFICARE | RPC | — | parallelo se non fatto |

---

### 41.13 Ordine di sviluppo definitivo

1. **DB schema** M1–M5 (toggle POI/city + FK soft-delete) — apply su DB dev + rigenera tipi  
2. **RPC** `delete_city_admin`, `relink_orphaned_city_content` (INT-09) — può essere **wave 2** se priorità Wikimedia  
3. **Core pipeline policy** — `commonsDownloadPipeline` assignmentRole POI  
4. **Orchestrators** POI + City (allowlist activations)  
5. **INT-01 / INT-01b** D-22 POI read guard + toggle  
6. **INT-CITY-HERO-RESOLVER-01** + wiring public read  
7. **UI Admin** POI Media + City Media + source link  
8. **UI pubblica** CityHeader / CityCard alignment  
9. **Decommission** Magic Add hero + Applica Header + INT-13  
10. **Test** matrice §41.14  
11. **E2E** critici  

**Motivazione:** toggle e FK prima di scrivere dati Wikimedia/conservati; resolver dopo asset model; delete wave 2 accettabile se release split.

---

### 41.14 Matrice test

| Caso | Unit | Integration | DB/RLS | UI | E2E |
|------|------|-------------|--------|-----|-----|
| POI nuovo + auto candidate | ranking, skip | orchestrator mock | assignment gallery | — | create POI → asset in Media |
| Import BOZZE | — | promote + discovery | pois draft | — | Import dashboard |
| Bonifica | — | verifyDraftsBatch hook | — | — | Bonifica (N) |
| API WIKIMEDIA manual | rank | lookup+pipeline | — | modale | Admin pick proposal |
| Candidato invalido | license parser | quarantine | asset suspended | disabled import | — |
| Toggle POI OFF/ON | resolver | read service | column | switch | public placeholder vs WM |
| D-22 Admin vs WM | cascade fn | primary priority | — | — | sponsor/admin fixtures |
| Città Hero casi 1–4 §40.3 | resolver | — | cities | toggle | header image |
| Magic Add no foto | — | magic city save | hero null | — | process log |
| Reset Img | — | RPC revoke | history | — | no WM call |
| + Città Manuale | — | save city | — | — | no WM job |
| City Delete CONSERVA/CANCELLA | options parse | RPC | FK | modal | admin_all |
| Personaggi CONSERVA | — | delete_city_admin | people row | toggle | reclaim id |
| RLS reports | — | — | policy | — | — |
| Mobile/a11y | — | — | — | modale focus | smoke |

---

### 41.15 Rischi

**Durante sviluppo:** dual-write legacy `image_url`; merge victim transfer (INT-MERGE-IMG-01); quota Wikimedia API; idempotenza import+create.

**Non verificabile senza DB live:** migration apply status; RLS effettive su staging/prod; volume dati orphan reclaim.

---

### 41.16 DELTA RESIDUO

**A. Decisioni funzionali chiuse** — D-CONS-01…26, §32–§40, elenco user query (merge, D-22 POI, Sponsor, WM fail-closed, City delete, POI/city WM triggers, Reset Img, + Città Manuale, gerarchie, toggle, no «Usa come copertina», Osservatorio NO, Magic Add no auto-foto).

**B. Tecnica definita** — Orchestratore allowlist §41.2; POI gallery + toggle §41.3; manual ranking §41.4; city resolver §41.5; file scope §41.12; ordine §41.13.

**C. Tecnica da verificare in implementazione** — Stato migration su DB target; performance batch rate-limit; origine Admin vs legacy hero senza metadata (backfill opzionale); allineamento CityCard vs hero.

**D. Domande funzionali aperte** — **Vedi §42.13** (solo flussi batch **DA DECIDERE** dal Product Owner). Punto 1 (City nel sistema unificato) **chiuso** in §42.

---

## §42 — ADDENDUM CHIUSURA PRE-SVILUPPO (2026-09-27)

> **Scope:** audit + documentazione **solo**. Nessuna modifica applicativa.  
> **Non contraddice** D-CONS-01…26; **integra** §41 dove §41.6/§41.10 ipotizzavano candidate Hero **fuori** da `entity_image_assignments`.  
> **Decisione Product Owner:** Punto 1 **definitivo** → **D-CONS-27**.

### 42.1 Decisione definitiva — Città Wikimedia nel sistema immagini unificato (D-CONS-27)

| Elemento | Decisione |
|----------|-----------|
| Architettura | **Un solo** sistema: `media_assets` + `entity_image_assignments` — **nessuna** seconda pipeline né architettura parallela solo-candidate JSON |
| Entity | `entity_type = 'city'` (nuovo valore ammesso a livello DB/RPC) |
| Identità | `entity_id = cities.id` (text), `city_id = cities.id` — stesso schema territoriale di **patron** |
| Asset Wikimedia | Riga `media_assets` con provenance/licenza coerente con Personaggi/POI (Commons pipeline **unica**) |
| Collegamento | Assignment corrente verso la città; ruolo **`gallery`** per il candidato Wikimedia Hero (analogo POI gallery WM — D-CONS-15/16) |
| Tier Admin Hero | **`cities.hero_image`** (+ upload Admin) resta fonte tier **ADMIN** fino a eventuale migrazione opzionale Admin→assignment |
| Gerarchia pubblica | **Invariata** (D-CONS-25): ADMIN → REAL/WIKIMEDIA → COMMUNITY → AI → PLACEHOLDER — **no Sponsor** |
| Toggle | `wikimedia_hero_public_enabled` per-città, default **OFF** (D-CONS-22/26) — **non** sostituisce l’assignment |
| Magic Add / + Città Manuale | **Invariato** (D-CONS-01, D-CONS-24): nessuna auto-assegnazione foto città; discovery city **post-save** separata da `global_settings.hero_image` |

**Distinzioni obbligatorie (modello dati + resolver):**

| Concetto | Significato tecnico |
|----------|---------------------|
| **Immagine nel sistema** | `media_asset` **active** (o eligible) + `entity_image_assignments` corrente `entity_type=city`, `assignment_status` ≠ removed |
| **Candidato Wikimedia** | Asset Commons verificato + assignment **gallery** (origine wikimedia strutturale in `media_assets`) — **indipendente** dal toggle |
| **Immagine pubblicabile tier REAL/WM** | Toggle **ON** + asset/assignment eligible + resolver Hero non superato da tier superiori (ADMIN, poi COMMUNITY/AI/PLACEHOLDER) |
| **Toggle OFF** | Assignment e asset **restano**; resolver **salta** tier REAL/WIKIMEDIA |

Compatibilità **API WIKIMEDIA** manuale città (D-CONS-21): stessa pipeline sicurezza; proposta Admin → import → asset + assignment; **non** equivale a toggle ON.

---

### 42.2 Audit DB — supporto `city` oggi

| Oggetto | Stato repo (migration `20260916130000` e RPC dual-write) |
|---------|-----------------------------------------------------------|
| `entity_image_assignments.entity_type` CHECK | Solo `city_person`, `poi`, `patron`, `photo_submission` — **`city` assente** → **blocca** insert assignment città |
| `content_reports.entity_type` CHECK | Stessa whitelist — estendere se segnalazioni Hero città su assignment city |
| `upsert_entity_image_assignment_dual_write` | `RAISE` se tipo ∉ whitelist — **nessun** branch `city` |
| `append_entity_image_history` / dual-write history | Stessa whitelist |
| `delete_city_person_with_image_cleanup` / report RPC | Whitelist assignment — estendere |
| `entity_image_history.entity_type` | **text libero** (no CHECK) — ok |
| RLS `entity_image_assignments` | Policy admin generica — **ok** post-estensione tipo |
| Storage | Bucket pipeline Commons esistente — **nessun** bucket dedicato City |

**Vincolo che oggi impedisce `entity_type = city`:** CHECK tabella + validazioni RPC (elenco sopra). **Non** esiste impedimento su `media_assets` per contenere file Wikimedia di città.

**Migration/RPC/RLS previste (sviluppo futuro — non in questo passo):**

| ID | Oggetto | Azione |
|----|---------|--------|
| M-CITY-IMG-01 | `entity_image_assignments` (+ `content_reports` se necessario) | `ALTER` CHECK: aggiungere `'city'` |
| M-CITY-IMG-02 | `cities.wikimedia_hero_public_enabled` | Colonna toggle (già in piano §41.6 M2) — **senza** FK candidate parallela obbligatoria |
| R-CITY-IMG-01 | `upsert_entity_image_assignment_dual_write` | Branch `city`: `entity_id = city_id`, validazione FK `cities` |
| R-CITY-IMG-02 | RPC report/delete/cleanup | Includere `'city'` nelle whitelist |
| R-CITY-IMG-03 | (Opz.) RPC city-specific save | Valutare wrapper atomico città+assignment (allineamento D90) |
| READ | `resolveCityHeroDisplayUrl` / INT-CITY-HERO-RESOLVER-01 | Leggere assignment `city` gallery WM + legacy `hero_image` |

**Deprecazione documentale §41.6:** `wikimedia_hero_candidate_asset_id` su `cities` come SoT **non necessaria** se l’assignment `entity_type=city` è canonico; eventuale colonna cache **opzionale** (non decisione di questo passo).

---

### 42.3 Toggle OFF/ON × assignment × resolver Hero

1. **Discovery automatica city** (post-Magic/Complete/bonifica city — fuori scope auto per Manual/Reset): crea/aggiorna `media_assets` + assignment `city` gallery; toggle resta **OFF**.
2. **Toggle ON (Admin):** resolver include tier REAL/WIKIMEDIA se nessun ADMIN vince e asset eligible.
3. **Toggle OFF dopo ON:** tier WM escluso; assignment **non** cancellato (D-CONS-26 — no «Usa come copertina» obbligatorio).
4. **Admin upload hero:** scrittura `cities.hero_image` — tier ADMIN prevale su WM anche con toggle ON.

---

### 42.4 File / servizi coinvolti (City WM unificato)

| Area | Path / INT |
|------|------------|
| Discovery | `cityRealImageDiscoveryService.ts` (da creare §41.12) — stesso orchestratore pattern POI, activation allowlist separata |
| Pipeline | `commonsDownloadPipeline.ts`, `wikidataLookupService`, ranking/score esistenti |
| Write | `upsert_entity_image_assignment_dual_write` (esteso), eventuale `cityLifecycleService` / `saveCityDetails` — **no** secondo writer parallelo |
| Read | `resolveCityHeroDisplayUrl.ts`, `resolveCityPresentation.cityHeaderImageUrl`, `CityHeader.tsx` |
| UI Admin | `TabMedia.tsx` — toggle + blocco proposta; manuale **`API WIKIMEDIA`** (simmetrico POI) |
| DB types | `supabase.ts` post M-CITY-IMG-* |

---

### 42.5 Audit completo — flussi batch / ingressi POI (Punto 2)

**Legenda colonne:** **C** = crea nuovo POI live/DB · **M** = modifica POI esistente · **Orchestratore WM POI oggi** = **assente** (`poiRealImageDiscoveryService` non presente). **Trigger chiusi (D-CONS-18):** **A** nascita · **B** `SEND TO DB (BOZZE)` · **C** Bonifica · **D** API WIKIMEDIA manuale · **ESCL** = escluso per decisione chiusa.

| # | Nome reale (UI / log) | Avvio | Servizio / hook | C / M | Orchestratore WM oggi | Copertura trigger / stato PO | Hook discovery (se approvato) | Duplicati / rischi | Conflitti trigger chiusi |
|---|------------------------|-------|-----------------|-------|------------------------|------------------------------|-------------------------------|--------------------|-------------------------|
| 1 | **Nuovo POI** (modale Admin) | Manager POI → crea | `usePoiActions.savePoi` → `saveSinglePoi` | C (o M se id esistente) | No | **A** se insert nuovo id | Fine `saveSinglePoi` success (insert) | Bonifica successiva → **C** anche; serve idempotenza orchestratore | — |
| 2 | **Salva POI** (matita pubblica) | Modale Admin sito | `AdminModals` → `saveSinglePoi` | M (tipico) | No | **DA DECIDERE** (§42.10) | Post-save update | Se anche Bonifica → doppio **C** | — |
| 3 | **Ricerca Flash** / Discovery toolbar | `PoiToolbar` Discovery → categorie | `useAiFlashSearch.generateDraftsOnly` → `saveSinglePoi` | C (bozze) | No | **Coperto da A** (nascita POI) quando orchestratore agganci insert | Stesso hook §1 | Poi **C** Bonifica → secondo pass WM | — |
| 4 | **Magic Add** — step POI | ZoneCard / Complete flow | `useAiMagicCity` → `saveSinglePoi` | C | No | **Coperto da A** | Post-insert batch step | Opz. **C** in coda Magic (`verifyDraftsBatch`) | City hero WM **no** auto (D-CONS-24) |
| 5 | **CERCA POI** / City Audit | Strategic Map → `CityAuditModal` | `performCityAudit` → `saveSinglePoi` | C | No | **Coperto da A** | Dopo ogni insert audit | — | — |
| 6 | **Analisi Regionale AI** — import POI selezionati | `RegionalAnalysisModal` | `saveSinglePoi` per città zona | C | No | **Coperto da A** | Post-import loop | Multi-città = N insert | — |
| 7 | **Ricerca mirata** (`generateTargetedPois`) | **Esportato** da `useCityGenerator`, **nessun** pulsante UI trovato | `useAiTargetedSearch` → `saveSinglePoi` | C | No | **DA DECIDERE** (flusso dormiente / futuro UI) | Come Flash | Se riattivato = stesso rischio §3 | — |
| 8 | **Bonifica** `(N)` selezione | `PoiToolbar` | `verifyDraftsBatch` + targetIds | M | No | **Coperto da C** | Fine loop `saveSinglePoi` per POI bonificato | Ripetizione Bonifica → re-run **C** (idempotenza) | — |
| 9 | **Valida POI - Pro** / Bonifica massiva | Manager POI / Complete City opzione | `useAiValidation.verifyDraftsBatch` | M | No | **Coperto da C** | Come §8 | — | — |
| 10 | **Bonifica Pro (Daily)** | `PoiToolbar` | `usePoiActions.executeDailyDeepScan` → `enrichStagingPoi` + `saveSinglePoi` | M | No | **Coperto da C** | Post-save per POI nel batch | Loop batch + flag `+` — WM ripetibile su stesso POI se idempotenza assente | — |
| 11 | **SEND TO DB (BOZZE)** | Import dashboard toolbar | `useImportActions` → `runPublishingService` → `promoteToLive` | C (da staging) | No | **Coperto da B** | Post-`promoteToLive` success per item | `enrichStagingPoi` in promote + trigger B — coordinare un solo WM | — |
| 12 | **SCARICA OSM** | Import modal | `fetchOsmData` → staging | — | No | **Non candidato** (solo staging) | Solo dopo **B** | — | — |
| 13 | **Deduplica staging** | Import toolbar | `deduplicateStagingData` | — | No | **Non candidato** | — | — | — |
| 14 | **API WIKIMEDIA** (POI) | `PoiMediaTab` (previsto) | Manuale Admin + modale | M | No | **Coperto da D** | Click Admin post-lookup | — | — |
| 15 | **Reset Img** | `PoiToolbar` | `bulkResetImages` → `saveSinglePoi` imageUrl '' | M | No | **ESCL** (D-CONS-23) | — | — | Vietato auto WM |
| 16 | **Fix tassonomia** bulk | Toolbar POI | `usePoiActions.fixTaxonomy` → `saveSinglePoi` | M | No | **DA DECIDERE** | Post-save categoria | — | — |
| 17 | **Bulk status** draft/published | Toolbar POI | `bulkStatusChange` → `saveSinglePoi` | M | No | **DA DECIDERE** | Post-save | — | — |
| 18 | **Bulk delete** POI | Toolbar POI | `deleteSinglePoi` | — | No | **Non candidato** WM | — | — | — |
| 19 | **Osservatorio — Anomaly Inspector** salva | Observatory layout | `AnomalyInspector` → `saveSinglePoi` | M | No | **ESCL** (D-CONS-18 NO Osservatorio) | — | — | Chiuso |
| 20 | **Osservatorio — Merge POI** | Observatory | `merge_pois_observatory_atomic` | M | No | **ESCL** | — | — | Chiuso |
| 21 | **Complete City** | Modal Complete | `useAiCompleteCity` — **no** `saveSinglePoi` per POI | — | No | POI: solo **C** se poi Bonifica opzione; **non** crea POI diretti | Bonifica opz. → §9 | — | — |
| 22 | **Rigenerazione massiva POI** | `RegenerateConfirmModal` | Stub alert «in implementazione» | — | No | **Non operativo** | — | — | **DA DECIDERE** se/quando implementato |
| 23 | **Community POI** (`submit_community_poi`) | RPC DB legacy (non app) | **Nessun** caller `src/` | — | No | **ESCLUSA** — D-CONS-36; flusso = `suggestions` §44 | — | — | Chiuso |

**Coerenza architetturale (checklist):** un orchestratore POI · una pipeline Commons · auto-save proposta su trigger A/B/C · toggle OFF alla nascita · D-22 POI invariata · City Hero §42.1 · Reset/+Manuale/Osservatorio/API manuali come da decisioni chiuse.

---

### 42.6 Flussi già coperti dai trigger chiusi (senza duplicare decisione PO)

| Trigger | Flussi repo (§42.5) |
|---------|---------------------|
| **A — Nascita nuovo POI** | §3 Flash, §4 Magic Add POI, §5 City Audit, §6 Regional import POI, §1 Nuovo POI (insert) |
| **B — SEND TO DB (BOZZE)** | §11 promote/import massivo |
| **C — Bonifica** | §8–§10 (Valida Pro, selezione, Daily Deep Scan) |
| **D — API WIKIMEDIA manuale** | §14 (previsto UI) |
| **ESCL** | §15 Reset Img; §19–§20 Osservatorio; City WM auto su +Manuale/Reset (D-CONS-23/24) |

**Nota implementativa:** la **copertura** è per decisione funzionale; l’**aggancio** unico resta `poiRealImageDiscoveryService` con allowlist activation (§41.2) — **non** hook sparsi non approvati.

---

### 42.7 Flussi **DA DECIDERE** (solo elenco — nessuna scelta agente)

| # | Flusso | Motivo |
|---|--------|--------|
| D1 | Salva POI **modifica** Admin/matita (§2) | Non è nascita né Bonifica né import |
| D2 | **Fix tassonomia** bulk (§16) | Solo categoria — rilevante WM? |
| D3 | **Bulk status** (§17) | Cambio visibilità senza bonifica |
| D4 | **Ricerca mirata** `generateTargetedPois` (§7) | Codice presente, UI assente |
| D5 | **Rigenerazione massiva** (§22) | Feature non implementata |
| D6 | **submit_community_poi** (§23) | **Chiuso** — D-CONS-36 §44 (DA RIMUOVERE; Community = `suggestions`) |

---

### 42.8 OUTPUT FINALE OBBLIGATORIO (questo passo)

**1. Chiuso definitivamente**

- **D-CONS-27:** Città Wikimedia **dentro** `media_assets` + `entity_image_assignments` (`entity_type=city`); nessuna architettura parallela; toggle/resolver/Gerarchia Hero come decisioni precedenti.
- Audit DB: **cosa** estendere (CHECK + RPC whitelist + branch dual-write).
- Modello «in sistema» vs «pubblicabile» vs toggle.

**2. Flussi POI già coperti dai trigger esistenti**

- Nascita: Flash, Magic Add POI, City Audit, Regional import POI, Nuovo POI Admin.
- Import massivo: `SEND TO DB (BOZZE)`.
- Bonifica: Validazione Pro (massiva/selezione), Bonifica Pro Daily.
- Manuale: API WIKIMEDIA (UI da fare).

**3. Altri flussi trovati — DA DECIDERE**

- §42.7 (D1–D6).

**4. Bloccanti tecnici reali (pre-sviluppo documentato)**

| Blocco | Impatto |
|--------|---------|
| CHECK `entity_type` senza `city` | City WM unificato **richiede** migration M-CITY-IMG-01 + RPC R-CITY-IMG-01/02 |
| `poiRealImageDiscoveryService` assente | Trigger A/B/C **non** eseguibili fino a implementazione |
| `wikimedia_public_enabled` / city toggle colonne | Migration M1/M2 piano §41 |
| INT-09 CASCADE | **Prod** city delete CONSERVA — indipendente da WM ma blocca release delete |

**Non** blocca la redazione del piano né l’avvio Fase 1 WM su dev con migration.

---

### 42.9 Domande al Product Owner (§42.7)

**SUPERATE** — risposte in **§43** / Master **Appendice O** / **D-CONS-28…36** (2026-09-27).

---

*Fine §42 — ADDENDUM CHIUSURA PRE-SVILUPPO 2026-09-27.*

---

## §43 — AUDIT DECISIONI POI + TRIGGER WIKIMEDIA + LEGACY (2026-09-27)

> **Scope:** audit repo + documentazione. **Zero** modifiche applicative in questo passo.  
> **Decisioni PO:** D-CONS-28…36 (non contraddicono D-CONS-01…27).

### 43.1 Decisioni trigger Wikimedia — registrate (D-CONS-28…33)

| ID | Flusso | WM automatica | Motivo funzionale |
|----|--------|---------------|-------------------|
| D-CONS-28 | Salva modifica POI (`AdminPoiModal` → **`Salva Modifiche`**) | **NO** | Modifica entità esistente; immagine = scelta Admin/toggle/API manuale. |
| D-CONS-29 | Auto-Fix Tax (`PoiToolbar` **`Auto-Fix Tax`**) | **NO** | Solo riallineamento **categoria**; nessuna nascita POI. |
| D-CONS-30 | Pubblica / Bozza (`PoiList` barra selezione) | **NO** | Solo **stato** pubblicazione; non bonifica né creazione. |
| D-CONS-31 | Flash AI Discovery | **SÌ** (nuovi POI) | Ogni insert bozza = nascita POI (allineamento D-CONS-18 A). |
| D-CONS-32 | Analisi Regionale AI → import POI | **SÌ** (nuovi POI) | `saveSinglePoi` su bozze top-tier = nascita. |
| D-CONS-33 | Magic Add (step POI) | **SÌ** (nuovi POI) | Stesso criterio nascita; **escluso** hero città automatico (D-CONS-01/24). |

**Implementazione:** comportamento **futuro** via `poiRealImageDiscoveryService` + allowlist activation — **non** presente oggi.

---

### 43.2 PARTE A — Ricerca mirata vs Flash AI Discovery

#### Implementazione Ricerca mirata

| Aspetto | Evidenza repo |
|---------|---------------|
| File | `src/hooks/admin/useAiTargetedSearch.ts` |
| Entry | `generateTargetedPois(cityId, cityName, categoriesToSearch: Record<string, number>)` |
| Avvio UI | **Nessuno** — esportato da `useCityGenerator` L66–70, **zero** chiamate in `src/components/**` |
| AI | `suggestNewPois(cityName, [], \`Solo luoghi di tipo ${catId}\`, count, catId)` |
| Output POI | `status: 'draft'`, `aiReliability: 'low'`, `imageUrl: ''`, id `draft_*` |
| Persistenza | `saveSinglePoi` → stesso path POI live/DB della Flash |

#### Implementazione Flash AI Discovery

| Aspetto | Evidenza repo |
|---------|---------------|
| File | `src/hooks/admin/useAiFlashSearch.ts` |
| UI | `PoiToolbar`: **`NUOVO POI (AI)`** → pannello **`Flash AI Discovery`** → **`Avvia Ricerca Flash`** |
| Caller | `AdminPoiManager.handleAiGen` → `generateDraftsOnly(cityId, cityName, poiCount, categories)` |
| AI | `suggestNewPois(cityName, [], undefined, poiCount, cat.id)` — stesso modello Flash |
| Output POI | Identico pattern bozza + `saveSinglePoi` |

#### Differenze reali (non solo nome)

| # | Ricerca mirata | Flash |
|---|----------------|-------|
| 1 | Conteggio **per categoria** (`Record<catId, number>`) | **Stesso** conteggio per tutte le categorie selezionate (select 5/10/15/20) |
| 2 | Istruzione AI esplicita `Solo luoghi di tipo ${catId}` (3° arg) | 3° arg `undefined` (filtro via `categoryFilter` = cat.id) |
| 3 | Gestione errore `QUOTA_EXCEEDED_DAILY` nel catch | Catch generico |

**Valutazione:** differenza **non sufficiente** per mantenere un secondo flusso Admin: l’UI Flash copre l’esigenza «categorie multiple + quantità + bozze»; conteggio differenziato per categoria non è esposto né richiesto dal PO.

#### Caller e dipendenze

| Caller `generateTargetedPois` | Esiste |
|-------------------------------|--------|
| Componenti React | **No** |
| `useCityGenerator` re-export | Sì (facade morta) |
| Test / script | No (prod path) |
| Magic / Complete / Flash | **No** |

**Rimozione futura (D-CONS-34):** `useAiTargetedSearch.ts`; import + export in `useCityGenerator.ts`. **Nessun** blocco funzionale verificato.

**Decisione:** **RICERCA MIRATA — DA ELIMINARE.** Sostituto: **Flash AI Discovery**.

---

### 43.3 PARTE B — Rigenerazione massiva POI

| Aspetto | Evidenza |
|---------|----------|
| UI | `RegenerateConfirmModal.tsx` — titolo **Rigenerazione Totale POI**, CTA **`Cancella e Rigenera`** |
| Mount | `PoiToolbar.tsx` L257–263 se `showRegenModal` |
| Apertura modale | **`setShowRegenModal(true)` non compare in tutto `src/`** — percorso morto |
| On confirm | `handleRegeneratePois` → `alert('Funzionalità rigenerazione massiva in fase di implementazione.')` |
| Servizi backend | **Nessuno** |
| Workflow auto | **Nessuno** |

**Confronto flussi massivi attivi:** Flash (nuovi draft), Magic Add (nuovi draft + città), Regional (import POI), Bonifica Pro (modifica esistenti) — **coprono** l’intento operativo; rigenerazione «cancella e rigenera» non ha implementazione né entry point.

**Decisione (D-CONS-35):** **RIGENERAZIONE MASSIVA POI — DA ELIMINARE.**

**Rimozione futura:** `RegenerateConfirmModal.tsx`; stato/handler/import in `PoiToolbar.tsx`.

---

### 43.4 PARTE C — `submit_community_poi` vs + Contribuisci

#### Percorso utente verificato (+ Nuovo Luogo)

| Step | Evidenza |
|------|----------|
| UI città | `CityCategoryTab.tsx` — **`Contribuisci`** → **`Nuovo Luogo`** |
| Modale | `SuggestionModal.tsx` — **Tipologia Contributo**, **`Nuovo Luogo`** / **`Modifica Luogo`**, **`INVIA SEGNALAZIONE`** |
| Submit handler | `handleSubmit` → `addSuggestion({...})` (`community/suggestionService.ts`) |
| Storage | **`supabase.from('suggestions').insert`** — colonne `type`, `details_json`, `status: pending`, … |
| **`content_reports`** | **Non** usato per questo flusso (MF2 = abusi foto/entità — `AdminReportsCommunityTab` tab abusi) |
| Admin | `AdminDashboard` view **`Segnalazioni`** → `AdminReportsCommunityTab` → micro-tab **`Luoghi suggeriti`** → `AdminReportsCommunitySuggestionsPanel` filtro `types={['new_place']}` |
| Review | `SuggestionReviewModal` → `applySuggestion` / `updateSuggestionStatus` su tabella **`suggestions`** |

#### `submit_community_poi`

| Verifica | Risultato |
|----------|-----------|
| Caller in `src/` | **Solo** definizione tipi `src/types/supabase.ts` L6467 — **nessuna** invocazione |
| Migration SQL in repo | **Nessun** file `*.sql` con `submit_community_poi` |
| Edge Functions | **Non** trovata in audit `src/` |

**Conclusione:** percorso reale = **sistema `suggestions`** (legacy table name, flusso **attivo**). RPC **`submit_community_poi`** = **orphan** (probabilmente DB remoto / tipi rigenerati da schema non allineato al client).

**Non** due sistemi paralleli in app: **A** (`suggestions`) operativo; **B** (`submit_community_poi`) **non collegato**.

**Nota audit:** `applySuggestion` oggi marca **approved** — **non** invoca `saveSinglePoi` in `SuggestionReviewModal.tsx`. Creazione POI live post-approvazione = **passo Admin separato** (fuori scope WM all’invio community).

**Decisione (D-CONS-36):** **`public.submit_community_poi` — DA RIMUOVERE.** Dettaglio verifica DB remota e piano DROP: **§44** (2026-09-28 — decisione **definitivamente chiusa**).

---

### 43.5 Coerenza architetturale WM (invariata)

Un orchestratore POI · una pipeline Commons · D-CONS-18 (A/B/C/D + esclusioni) · Osservatorio/Reset/+Manuale invariati.

---

### 43.6 SPECIFICA SVILUPPO FUTURA (MacroFase WM POI — documento only)

#### A. Allowlist orchestratore (`poiRealImageDiscoveryService`)

| Activation | Flussi | WM |
|------------|--------|-----|
| `on_poi_insert` | Flash, Magic Add (POI step), Regional import POI, Nuovo POI Admin (insert), City Audit, SEND TO DB (B), … (D-CONS-18 A/B) | **SÌ** auto-save proposta, toggle OFF |
| `on_bonifica` | verifyDraftsBatch, Daily Deep Scan | **SÌ** (C) |
| `manual_api_wikimedia` | Pulsante API WIKIMEDIA | **SÌ** (D) proposta Admin |
| — | Salva modifica, Auto-Fix Tax, Pubblica/Bozza | **NO** |
| — | Community `addSuggestion` | **NO** (no POI in DB) |
| — | Reset Img, Osservatorio | **NO** (chiuso) |

#### B. Comportamenti per tipo operazione

| Operazione | Comportamento WM futuro |
|------------|-------------------------|
| Nascita nuovo POI (insert id nuovo) | Pipeline completa + assignment gallery + `wikimedia_public_enabled` default false |
| Modifica POI esistente | **Skip** discovery automatica |
| Solo categoria (Auto-Fix Tax) | **Skip** |
| Solo stato (Pubblica/Bozza) | **Skip** |
| Flash / Regional / Magic (solo insert POI) | **Run** discovery post-save success per ogni POI creato |
| Community approvazione | WM solo se implementazione futura **crea** POI via stesso hook `on_poi_insert` |

#### C. Wave decommission legacy (D-CONS-34…36) — **dopo** WM base

| Artefatto | Azione |
|-----------|--------|
| `useAiTargetedSearch.ts` | DELETE |
| `useCityGenerator` targeted export | RIMUOVERE |
| `RegenerateConfirmModal.tsx` + wiring `PoiToolbar` | DELETE |
| RPC `public.submit_community_poi` | DROP firma esatta — piano **§44.3** (presenza DB **confermata** 2026-09-28) |
| `supabase.ts` entry | Rigenerazione tipi post-DROP (INT-14 workflow) |
| `pois_staging` / `promote_staging_poi_to_live` | **NON** modificare (§44.2) |

#### D. Community — comportamento futuro documentato

1. Utente **`INVIA SEGNALAZIONE`** → riga `suggestions` pending.  
2. Admin **`Luoghi suggeriti`** → review → approve/reject.  
3. **WM:** non all’invio; eventuale WM quando POI **creato** in DB con stesso contratto nascita.  
4. **`content_reports`:** resta per abusi/segnalazioni MF2, non per nuovo luogo community.

---

### 43.7 Report audit — linguaggio semplice (Parti A–C)

Vedi risposta agente + tabella §43.8 sotto (allineata Master Appendice O).

### 43.8 Tabella decisioni

| Funzione | Stato attuale (audit) | Decisione |
|----------|----------------------|-----------|
| Salva modifica POI | Attivo (`Salva Modifiche`) | **NON Wikimedia** (D-CONS-28) |
| Auto-Fix Tax | Attivo | **NON Wikimedia** (D-CONS-29) |
| Pubblica / Bozza | Attivo | **NON Wikimedia** (D-CONS-30) |
| Ricerca mirata | Codice senza UI/caller | **DA ELIMINARE** (D-CONS-34) |
| Rigenerazione massiva POI | Modale mai aperta; stub alert | **DA ELIMINARE** (D-CONS-35) |
| `submit_community_poi` | RPC remota orphan; app = `suggestions` | **DA RIMUOVERE** — D-CONS-36 **chiusa** §44 |
| Flash AI Discovery | Attivo | **Wikimedia** su nuovi POI (D-CONS-31) |
| Analisi Regionale AI | Attivo | **Wikimedia** su nuovi POI (D-CONS-32) |
| Magic Add | Attivo | **Wikimedia** su nuovi POI (D-CONS-33) |

**Verifica D-CONS-36:** chiusa — vedi **§44** (Supabase remoto).

---

*Fine §43 — aggiornato 2026-09-28.*

---

## §44 — CHIUSURA D-CONS-36 — `public.submit_community_poi` (2026-09-28)

> **Scope:** documentazione + esito verifica SQL su DB remoto (Product Owner). **Nessuna** migration/codice in questo passo.

### 44.1 Esito verifica Supabase (definitivo)

| Elemento | Esito |
|----------|--------|
| Esistenza | `public.submit_community_poi` **presente** |
| Tipo | PL/pgSQL **`SECURITY DEFINER`** |
| Firma | `(p_city_id text, p_city_name text, p_poi_name text, p_category text, p_details jsonb)` → `uuid` |
| Comportamento legacy | Insert proposta POI su **`public.pois_staging`** |
| Privilegi | `EXECUTE` esposto (inclusi **`authenticated`**, **`anon`**) |
| Caller PG | **Nessuna** altra funzione |
| Trigger / view / MV / RLS | **Nessun** richiamo |
| Commenti funzioni | **Nessun** riferimento |
| Caller app (`src/`) | **Nessuno** (audit §43.4) |
| Migration repo | **Nessuna** definizione in `supabase/migrations/*.sql` |

### 44.2 Incompatibilità `pois_staging` + oggetti da **NON** toccare

La RPC legacy assume colonne **non presenti** nello schema attuale (`user_id`, `city_name`, `poi_id`, `type`, `status`, `details_json`). Schema vigente include tra l’altro: `osm_id`, `name`, `raw_category`, `coords_lat`, `coords_lng`, `processing_status`.

**Dati staging (verificati):** 1.423 righe — `new` 508, `ready` 363, `discarded` 294, `imported` 258; `source` NULL; periodo 2026-02-03 — 2026-06-01.

| Oggetto | Azione Consolidation |
|---------|---------------------|
| **`public.pois_staging`** (+ dati) | **CONSERVARE** |
| **`public.promote_staging_poi_to_live`** | **CONSERVARE** |
| **`public.submit_community_poi`** | **DROP** (solo questa) |

Flusso Community vigente: **`SuggestionModal`** → **`addSuggestion`** → **`public.suggestions`** → Admin **Luoghi suggeriti** (invariato).

### 44.3 D-CONS-36 — Decisione e intervento programmato

**Decisione funzionale:** **CHIUSA.** `public.submit_community_poi` → **DA RIMUOVERE**.

**Motivi (registro):**

1. Nessun chiamante applicativo.  
2. Community usa **`suggestions`**.  
3. Nessuna dipendenza DB rilevata.  
4. Incompatibile con `pois_staging` attuale.  
5. Non partecipa al flusso **`promote_staging_poi_to_live`**.

**Checklist futura implementazione Consolidation (wave decom RPC):**

| Step | Azione |
|------|--------|
| **A** | Verifica statica repo: `.rpc('submit_community_poi'`, Edge Functions, script, migration |
| **B** | Se zero caller attivi → migration dedicata **`DROP FUNCTION`** firma esatta ( **no `DROP CASCADE`** ) |
| **C** | Rigenerare `src/types/supabase.ts` (workflow INT-14 / progetto) |
| **D** | **Non** alterare flusso `suggestions` / UI Community |
| **E** | **Non** modificare `pois_staging` né `promote_staging_poi_to_live` |
| **F** | **No** `DROP CASCADE` |
| **G** | Post-apply: confermare assenza RPC; smoke Community + staging import/promote |

Se **A** trova caller attivo → documentare conflitto e risolvere **prima** del DROP (senza ripristinare RPC legacy).

### 44.4 Riferimenti incrociati

- Master **D-CONS-36**, **Appendice O §O.5**  
- §43.4 (percorso app), §43.6 C (wave decom)

---

*Fine §44 — 2026-09-28. Nessun file applicativo o DB modificato in questo passo.*
