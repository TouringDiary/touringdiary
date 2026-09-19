# AI Image Management — Current State Audit

> **Fotografia tecnica dello stato attuale** del repository Touring Diary per la gestione immagini di Personaggi famosi e POI.  
> **Basato su:** analisi diretta del codice, migration SQL, tipi TypeScript — settembre 2026.  
> **Obiettivi e decisioni future:** `AI_IMAGE_MANAGEMENT_MASTER_PLAN.md`  
> **Ultimo aggiornamento audit:** 2026-09-19 (§41 atomicità entità + assignment; D90)

> ## ⚠️ REGOLA OBBLIGATORIA — LETTURA CONGIUNTA
>
> **PRIMA DI QUALSIASI SVILUPPO** relativo alla gestione immagini devono essere consultati **insieme**:
>
> 1. `AI_IMAGE_MANAGEMENT_MASTER_PLAN.md`
> 2. `AI_IMAGE_MANAGEMENT_AUDIT.md`
> 3. Il file **`AI_IMAGE_MANAGEMENT_MACROFASE_N_FILES.md`** della macrofase corrente
>
> I tre documenti devono essere **interpretati congiuntamente**.
> - Il **Master Plan** definisce decisioni e obiettivi approvati.
> - L'**Audit** descrive lo stato tecnico reale del repository e la progettazione preliminare.
> - Il file **MACROFASE_N_FILES** definisce file e ambiti tecnici della macrofase corrente.
>
> **Nessuno dei tre documenti deve essere interpretato isolatamente.**
>
> **Workflow pre-sviluppo:** (1) leggere i tre documenti → (2) technical design della macrofase → (3) verificare DB/RPC/RLS/Storage → (4) verificare perimetro file → (5) presentare cosa si intende modificare → (6) **attendere approvazione** → (7) solo dopo iniziare **SVILUPPO**.

### Legenda stati

| Simbolo | Significato |
|---------|-------------|
| 🟢 | ESISTENTE / PRONTO — funzionalità presente e utilizzabile |
| 🟡 | PARZIALMENTE ESISTENTE / DA COMPLETARE — infrastruttura parziale o non collegata |
| 🔴 | MANCANTE / DA SVILUPPARE — non presente nel repository |
| ⚪ | NON VERIFICATO — richiede controllo operativo esterno al repo |

---

## 1. Executive Summary

Touring Diary possiede oggi un **sistema immagini funzionante ma incompleto** rispetto al Master Plan target. I punti salienti:

### Personaggi famosi — stato attuale

- **Una sola foto ufficiale** per personaggio: `city_people.image_url` (+ opzionale `image_storage_path` solo per flussi community)
- **Generazione AI ritratto** operativa via Gemini (`generateHistoricalPortrait` → bucket `public-media/people_portraits/`)
- **Prompt AI** include istruzioni anti-fotorealismo (vista di spalle/silhouette) ma passa solo 3 variabili: nome, categoria, città
- **Nessuna** integrazione Wikidata/P18/Commons
- **Nessun** sistema placeholder dedicato Personaggi — fallback generico categoria `"discovery"`
- **Nessuna** dicitura AI nel modale pubblico
- **Nessun** storico immagini / motivazione rimozione
- **Community foto** con moderazione atomica (accept/block RPC) — parzialmente tracciata
- **Segnala abuso** Personaggi/Patrono: modali parziali — **no** hub Admin unificato, **no** sospensione immediata, **no** guest OTP (§35–§36)

### POI — stato attuale

- **Presentation Media** su `pois.image_url` con `image_status`, `image_credit`, `image_license`
- **Placeholder per categoria** funzionanti (`global_settings.category_placeholders`)
- **Upload Admin** via `AdminImageInput` → `public-media/admin_uploads/`
- **AI copyright check** (analisi, non generazione cover)
- **Nessuna** acquisizione automatica foto reali
- **Nessuna** integrazione Wikimedia

### Libreria Media — stato attuale

- Browser Storage per cartelle `public-media/*` — **NON** indice completo immagini Personaggi/POI
- Tab PEOPLE PORTRAITS mostra **solo** file in `people_portraits/` (max 100), **NON** tutte le immagini personaggi

### Gap principale vs Master Plan

| Area Master Plan | Stato |
|------------------|-------|
| Foto reali automatiche + policy CC BY | 🔴 Assente |
| Wikidata P18 pipeline | 🔴 Assente |
| Metadati provenienza unificati | 🔴 Assente |
| Dicitura AI modale | 🔴 Assente |
| Placeholder Personaggi macro-categoria | 🔴 Assente |
| Storico + motivazione rimozione | 🔴 Assente |
| Admin priority esplicita nel resolver | 🟡 Parziale (solo override manuale URL) |
| AI rappresentativa | 🟡 Parziale (prompt ok, metadati/UX no) |
| Placeholder POI | 🟢 Esistente |
| RPC upsert person | 🟢 Esistente e pushata |
| Hub Admin Segnalazioni (4 macro-tab) | 🔴 Assente — oggi frammentato |
| Segnala abuso unificato | 🟡 Parziale — modali Personaggio/Patrono separati |
| Community abuso foto Live/Galleria | 🔴 Assente |
| Stati NUOVO/OK/KO + entità/immagine | 🔴 Assente — enum legacy |

---

## 2. Stato per area

| Area | Stato | Motivazione sintetica |
|------|-------|----------------------|
| Gerarchia Admin → reale → AI → placeholder | 🟡 | Solo AI+URL manuale+community; nessun resolver unificato |
| Policy conservativa foto reali | 🔴 | Nessun recupero automatico foto reali |
| Allowlist CC BY | 🔴 | Nessuna verifica licenza automatica |
| Wikidata/P18/Commons | 🔴 | Zero riferimenti nel codice |
| AI rappresentativa Personaggi | 🟡 | Prompt con silhouette; no metadato/dicitura |
| AI POI cover | 🔴 | Solo copyright check, no generazione |
| Dicitura AI | 🔴 | Testo non presente in UI |
| Placeholder POI | 🟢 | `category_placeholders` + resolver |
| Placeholder Personaggi | 🔴 | Fallback discovery generico |
| Libreria Media completa | 🟡 | Storage browser, non governance index |
| Provenienza/attribuzione | 🟡 | POI ha credit/license; Personaggi no |
| Download foto reali Storage | 🔴 | Non implementato |
| Immagini scartate/accantonate | 🔴 | Non implementato |
| Storico rimozioni | 🔴 | Non implementato |
| Filtri territoriali | 🟢 | Esistenti Admin; non collegati a immagini archiviate |
| Data pubblicazione immagine | 🟡 | Solo `photo_submissions.published_at` |
| Community foto Personaggi | 🟢 | Suggestion + accept/block RPC |
| RPC upsert person | 🟢 | Migration presente e pushata |
| Verifica RPC post-push remoto | ⚪ | Non eseguita in questo audit |
| Hub Segnalazioni 4 macro-tab | 🔴 | Frammentato — §36.1 |
| Segnala abuso unificato | 🟡 | Modali Personaggio/Patrono — §36.5 |
| Stati NUOVO/OK/KO + entità/immagine | 🔴 | Enum legacy — §36.7 |
| Community abuso foto | 🔴 | Assente UI — §36.2 |

---

## 3. Libreria Media

### 3.1 Componenti e file

| Ruolo | Path |
|-------|------|
| UI principale | `src/components/admin/AdminAssetLibrary.tsx` |
| Routing Admin | `src/components/admin/AdminDashboard.tsx` — `case 'assets'` |
| Navigazione | `src/components/admin/layout/AdminSidebar.tsx` — label `"Libreria Media"` |
| Usage map | `src/services/mediaService.ts` — `getAssetUsageMap()` |
| Upload generico | `src/services/mediaService.ts` — `uploadPublicMedia()` |

**Non esiste** modulo separato "MediaLibrary" né tabella DB dedicata alle immagini.

### 3.2 Tab esistenti

Definiti in `AdminAssetLibrary.tsx` — array `FOLDERS`:

| Tab UI (uppercase) | Cartella Storage | Default |
|--------------------|------------------|---------|
| PEOPLE PORTRAITS | `people_portraits` | ✅ Sì |
| AI GENERATED | `ai_generated` | |
| GENERAL | `general` | |
| ADMIN ASSETS | `admin_assets` | |
| EDITED ASSETS | `edited_assets` | |
| SHOP PRODUCTS | `shop_products` | |
| COMMS ASSETS | `comms_assets` | |
| ONBOARDING ASSETS | `onboarding_assets` | |
| SOCIAL TEMPLATES | `social_templates` | |

**Bucket:** `public-media` (costante `BUCKET_NAME`).

**Label UI:** `folder.replace('_', ' ')` + CSS uppercase — solo il **primo** underscore viene sostituito.

### 3.3 Origine dati per tab

**Tutti i tab:** listing Storage via:

```typescript
supabase.storage.from('public-media').list(currentFolder, {
  limit: 100,
  offset: 0,
  sortBy: { column: 'created_at', order: 'desc' },
});
```

**Nessun tab interroga tabelle SQL** per il listing.

### 3.4 Overlay "IN USO" — `getAssetUsageMap()`

Scansiona URL in:

| # | Tabella | Campi | Context label |
|---|---------|-------|---------------|
| 1 | `cities` (via `fetchGlobalCityMediaInfo`) | hero, card, gallery | `City Card/Hero/Gallery: {name}` |
| 2 | `pois` | `name, image_url` | `POI: {name}` |
| 3 | **`city_people`** | `name, image_url` | `Person: {name}` |
| 4 | `shops` | `name, image_url` | `Shop: {name}` |
| 5 | `city_events` | `name, image_url` | `Event: {name}` |
| 6 | `city_guides` | `name, image_url` | `Guide: {name}` |
| 7 | `social_templates` | `name, bg_url` | `Template: {name}` |

Matching: URL normalizzato (strip query string). **`image_storage_path` non usato** nel matching.

### 3.5 Filtri UI

| Filtro | Logica |
|--------|--------|
| Tutti | Tutti i file del listing Storage |
| In Uso | URL presente in `usageMap` |
| Inutilizzati | URL assente da `usageMap` |

### 3.6 Delete

- `supabase.storage.from('public-media').remove([paths])`
- Warning se file "IN USO"
- **Non aggiorna** `city_people` o altre tabelle → rischio link rotti

### 3.7 Cartelle Storage NON esposte come tab

| Cartella | Uso |
|----------|-----|
| `famous_person_photo_suggestions/{userId}/` | Foto community Personaggi |
| `admin_uploads/` | Upload Admin generico (POI, patron) |
| `city_patron_gallery/{cityId}/` | Galleria patron |
| `patron_photo_suggestions/` | Suggerimenti patron |
| `viaggio_covers/{userId}/` | Copertine viaggio |

### 3.8 Risposta esplicita

> **PEOPLE PORTRAITS mostra tutte le immagini dei Personaggi?**

## **NO**

**Motivi verificati:**

1. Il tab lista **oggetti Storage** in `public-media/people_portraits/` — non righe `city_people`
2. Molte foto ufficiali personaggi **non** stanno in quella cartella:
   - Community accettate → `famous_person_photo_suggestions/`
   - URL esterni incollati manualmente
   - URL riusati cross-city da altre cartelle/domini
3. **Solo** `generateHistoricalPortrait` scrive in `people_portraits/` (verificato grep: 2 file sorgente)
4. **Limite 100 file** — nessuna paginazione
5. File orfani possibili (rigenerazione AI crea nuovo file, vecchio resta)
6. Un personaggio = 1 URL in DB; cartella può avere N file per stesso nome (rigenerazioni)

**Altri tab con immagini Personaggi:** nessuno elenca esplicitamente personaggi. Il tab AI GENERATED contiene output AI generici (es. `SafeArtPanel.tsx`), non necessariamente ritratti personaggi.

---

## 4. city_people

### 4.1 Schema rilevante (verificato `src/types/supabase.ts`)

| Colonna | Tipo | Note |
|---------|------|------|
| `image_url` | `text \| null` | Foto ufficiale — SoT display |
| `image_storage_path` | `text \| null` | Path Storage — **solo flussi community accept** |
| `image_is_placeholder` | `boolean \| null` | Esiste in DB — **quasi mai scritto dall'app** |
| `is_living` | `boolean` | NOT NULL, default true |
| `birth_year`, `birth_date` | | Usati prompt testo AI, **non** portrait |
| `death_year`, `death_date` | | Idem |
| `created_at` | timestamp | Creazione record, non pubblicazione immagine |

**Assenti:** `image_credit`, `image_license`, `image_status`, `image_origin`, `published_at`, `removed_at`, metadati provenienza.

### 4.2 Chi valorizza `image_url`

| Flusso | File | Meccanismo |
|--------|------|------------|
| Admin save manuale | `usePeopleData.ts` → `saveCityPerson` | URL paste in `CulturePersonCard` |
| AI import discovery | `usePeopleAI.importDiscoveryPerson` | `findExistingPortrait` → `generateHistoricalPortrait` → save |
| AI regenerate | `usePeopleAI.regeneratePortrait` | Nuovo ritratto → overwrite URL |
| Completeness recovery | `peopleCompletenessPipeline.ts` | Auto-genera se `imageUrl` mancante |
| Magic/Complete city | `useAiMagicCity.ts`, `useAiCompleteCity.ts` | Stesso pattern import |
| Culture regeneration | `editorCultureRegeneration.ts` | Stesso pattern |
| Community accept | RPC `accept_famous_person_photo_suggestion` | Atomico — URL + storage_path |
| Community block | RPC `block_famous_person_photo_report_and_clear` | Azzera URL + path |
| Cross-city reuse | `findExistingPortrait` | Copia URL esistente, no nuovo file |

**Persistenza:** `saveCityPerson` in `entitiesService.ts` → RPC `upsert_city_person_with_category_links` (fallback legacy se RPC assente).

### 4.3 Cosa NON scrive `saveCityPerson`

- `image_storage_path` — anche quando URL punta a `people_portraits/`
- `image_is_placeholder`
- Qualsiasi metadato provenienza

### 4.4 Percorso dati tipico — esempio Leonardo

```
Admin: Discovery "Leonardo da Vinci" in Firenze
    ↓
usePeopleAI.importDiscoveryPerson
    ↓
findExistingPortrait("Leonardo da Vinci")
    → SELECT city_people WHERE name ILIKE 'Leonardo da Vinci'
      AND image_url NOT NULL, limit 1, NO filtro city_id
    → Se trovato (es. da Milano): riusa URL esistente
    → Se non trovato: continua
    ↓
generateHistoricalPortrait("Leonardo da Vinci", "Pittore", "Firenze")
    → getAiPrompt('vision_portrait_historical', ...)
    → gemini-2.5-flash-image via gemini-task Edge
    → uploadPublicMedia → public-media/people_portraits/portrait_Leonardo_da_Vinci_{ts}.jpg
    ↓
ensureFamousPersonCompletenessWithAi (bio, date, imageUrl recovery)
    ↓
saveCityPerson → upsert_city_person_with_category_links
    → city_people.image_url = public URL
    ↓
Libreria Media PEOPLE PORTRAITS: file visibile SE nella top 100 recenti
Culture Corner: mostra image_url via ImageWithFallback
```

---

## 5. people_portraits

### 5.1 Natura

**Non è un bucket separato.** È una **cartella** dentro bucket `public-media`.

### 5.2 Writer (unico percorso verificato)

| File | Funzione |
|------|----------|
| `src/services/ai/aiVision.ts` | `generateHistoricalPortrait` → `uploadPublicMedia(file, 'people_portraits')` |

Naming file: `portrait_{sanitizedName}_{timestamp}.{ext}` poi wrappato da `uploadPublicMedia` come `{timestamp}_{filename}`.

### 5.3 Reader

| File | Uso |
|------|-----|
| `AdminAssetLibrary.tsx` | Listing tab PEOPLE PORTRAITS |
| UI pubblica/admin | Via `city_people.image_url` (URL pubblico) |
| `getAssetUsageMap` | Badge "Person: {name}" se URL match |

### 5.4 Relazione con city_people

- **1:N potenziale** — rigenerazioni creano nuovi file, un solo URL attivo in DB
- **Nessun vincolo FK** tra file Storage e riga personaggio
- **`image_storage_path` non popolato** per upload AI → impossibile cleanup automatico

### 5.5 Relazione con Libreria Media

- Tab PEOPLE PORTRAITS = vista parziale file cartella
- Usage overlay collega file → personaggio solo se URL coincide esattamente

---

## 6. findExistingPortrait

**File:** `src/services/mediaService.ts`

### Comportamento verificato

```typescript
supabase.from('city_people')
  .select('image_url')
  .ilike('name', personName)
  .neq('image_url', '')
  .not('image_url', 'is', null)
  .limit(1);
```

| Aspetto | Valore |
|---------|--------|
| Scope | **Globale** — nessun filtro `city_id` |
| Match | Case-insensitive exact name (`ilike`) |
| Ordine | **Non definito** — `limit(1)` senza ORDER BY |
| Esclusioni | URL contenenti `ui-avatars` |
| Non verifica | `image_storage_path`, `image_is_placeholder`, status publish, identità oltre nome |

### Callers

- `usePeopleAI.importDiscoveryPerson`
- `useAiCompleteCity.ts`
- `useAiMagicCity.ts`
- `editorCultureRegeneration.ts`

---

## 7. Importa + Foto

### 7.1 "Importa" — Discovery AI (Admin)

```
CulturePeopleDiscovery UI
    → usePeopleAI.runDiscovery
    → suggestCityPeople (testo AI, NO immagine)
    → Admin seleziona → importDiscoveryPerson
    → [vedi sezione 4.4]
```

**File chiave:** `src/hooks/admin/people/usePeopleAI.ts`

### 7.2 "Foto" — Community suggestion

```
Utente: CultureCornerModal
    → SuggestFamousPersonPhotoModal
    → createFamousPersonPhotoSuggestion
        uploadPublicMediaDetailed → famous_person_photo_suggestions/{userId}/
        RPC submit_famous_person_photo_suggestion (queue, NON tocca city_people)

Admin: AdminFamousPeopleManager
    → acceptFamousPersonPhotoSuggestion
        RPC accept_famous_person_photo_suggestion (atomico)
        → city_people.image_url + image_storage_path
        → deletePublicMediaByStoragePath(previous_path) best-effort

Reject: solo status suggestion, file resta
```

**File chiave:**
- `src/components/modals/SuggestFamousPersonPhotoModal.tsx`
- `src/services/famousPerson/famousPersonPhotoSuggestionService.ts`
- `src/components/admin/AdminFamousPeopleManager.tsx`
- Migration: `20260908130000_famous_person_moderation_atomic_rpcs.sql`

### 7.3 Photo abuse report

```
ReportFamousPersonPhotoAbuseModal
    → createFamousPersonPhotoReport (snapshot URL+path)
Admin → blockFamousPersonPhotoReportAndClearOfficialPhoto
    → RPC block_famous_person_photo_report_and_clear
    → clear solo se URL/path matchano snapshot
```

**Migration:** `20260907120000_block_famous_person_photo_report_atomic.sql`

---

## 8. Prompt AI attuale (ritratti Personaggi)

### 8.1 Entry point

**File:** `src/services/ai/aiVision.ts` — `generateHistoricalPortrait(personName, categoryLabel, cityName)`

### 8.2 Caricamento prompt

- **DB key:** `vision_portrait_historical` in tabella `ai_configs`
- **Loader:** `getAiPrompt()` in `src/services/aiConfigService.ts`
- **Variabili sostituite:** `{personName}`, `{categoryLabel}`, `{cityName}`
- **Alias legacy:** `{role}` (= categoryLabel se presente in template DB vecchi)
- **Seed in repo:** NON presente — fallback hardcoded se DB vuoto/errore

### 8.3 Fallback hardcoded (primario)

```
Genera un ritratto artistico (olio/affresco) di {personName}, {categoryLabel} a {cityName}. VISTA DI SPALLE O SILHOUETTE. VISO NON VISIBILE.
```

### 8.4 Fallback catch

```
Genera un ritratto artistico di {personName}, {categoryLabel} a {cityName}. Vista di spalle.
```

### 8.5 Dati passati vs disponibili

| Dato | Passato al prompt portrait? | Origine se disponibile altrove |
|------|------------------------------|-------------------------------|
| `personName` | ✅ Sì | Parametro diretto |
| `categoryLabel` | ✅ Sì | `resolvePortraitCategoryLabel` o slug→label |
| `cityName` | ✅ Sì | Contesto città Admin |
| `birthYear` / `birthDate` | ❌ No | `city_people`, prompt enrich/discovery |
| `deathYear` / `deathDate` | ❌ No | Idem |
| `isLiving` | ❌ No | Idem |
| `bio` / `fullBio` | ❌ No | Idem |
| `professione/ruolo` | 🟡 Indiretto | Solo via label categoria |
| `specific category slug` | ❌ No | Solo label risolta |
| `descrizione/epoca/contesto` | ❌ No | — |

### 8.6 Regole presenti nel prompt

| Regola Master Plan | Presente? |
|--------------------|-----------|
| Anti-fotorealismo | 🟡 "artistico (olio/affresco)" — non esplicito "non fotorealistico" |
| Volto non visibile | ✅ "VISTA DI SPALLE O SILHOUETTE. VISO NON VISIBILE." |
| Silhouette | ✅ |
| Figura di spalle | ✅ |
| Contesto epoca/ruolo | 🟡 Parziale via categoryLabel + cityName |
| Divieto imitare foto esistenti | ❌ Assente |
| Distinzione vivente/defunto | ❌ Assente |
| Istruzioni diritti legali | ❌ Assente |

### 8.7 Stack esecuzione

```
generateHistoricalPortrait
    → aiGateway.generateLegacy (feature: 'vision')
    → supabaseProvider.generate
    → supabase.functions.invoke('gemini-task')
    → Google Gemini gemini-2.5-flash-image
    → aspectRatio 3:4
    → extractInlineDataFromRaw
    → uploadPublicMedia('people_portraits')
```

**Gestione errori (verificata post-correzioni):**
- Quota exhausted → `asPortraitQuotaExceededError` — no retry inutili
- MIME/Base64 validation presente in `aiVision.ts`
- Image-only response handling in pipeline

---

## 9. AI policy attuale vs policy futura

| Requisito Master Plan | Stato |
|-----------------------|-------|
| AI rappresentativa non fotorealistica | 🟡 Prompt parziale |
| No somiglianza facciale precisa | 🟡 "viso non visibile" nel fallback |
| Metadato `generated_by_ai` | 🔴 Assente su city_people |
| Dicitura modale standard | 🔴 Assente |
| No imitazione foto esistenti | 🔴 Non nel prompt |
| POI AI cover illustrativa | 🔴 Non implementata |
| Fail to placeholder (non re-AI) | 🔴 Usa discovery placeholder generico |
| Tracciamento modello/prompt version | 🔴 Assente (solo log Edge generico) |

---

## 10. POI — gestione immagini attuale

### 10.1 Architettura

**Presentation Media** — separato da Photograph domain (`photo_submissions`).

**Doc:** `AI_CONTEXT/16_CITY_MEDIA_MANAGEMENT.md`, `WF_02_PHOTO_DOMAIN_REFACTORING.md`

### 10.2 Schema `public.pois`

| Colonna | Usata app |
|---------|-----------|
| `image_url` | ✅ |
| `image_status` | ✅ enum: `real` \| `placeholder` \| `missing` |
| `image_credit` | ✅ |
| `image_license` | ✅ (`own`, `cc`, `public`, `copyright`) |
| `image_is_placeholder` | ❌ In types, non usata app |

**Assenti:** gallery row-level (sempre `[]` in mapper), provenance fields, storico.

### 10.3 Display resolution

**Priority:** `imageUrl` → `catalogImageUrl` → category placeholder

**File:** `src/domain/poi/resolvePoiDisplayImageUrl.ts`, `ImageWithFallback.tsx`

**Consumers:** `CityGuide.tsx`, `ShowcaseCards.tsx`, `PoiImageSection.tsx`, `pdfUtils.ts`

### 10.4 Admin POI media

| File | Funzione |
|------|----------|
| `src/components/admin/poiModal/PoiMediaTab.tsx` | Tab media editor POI |
| `src/components/admin/AdminImageInput.tsx` | URL o upload file |
| `src/services/city/poi/poiWrite.ts` | Persist DB |

**Comportamenti:**
- Upload → compress → `uploadPublicMedia` → `public-media/admin_uploads/`
- URL esterno → `image_status: 'real'`
- Reset placeholder → clear URL, `image_status: 'placeholder'`
- **AI Copyright Check** — Gemini vision analizza licenza (`copyright`/`cc` hint), **non genera** immagine

### 10.5 Staging/OSM import

- `stagingService.ts` — imposta `image_url` a placeholder categoria da settings
- `promote_staging_poi` RPC — copia `image_url`, **non** status/credit/license
- `poiGenerator.ts` enrich — solo testo, **no** immagine

### 10.6 Photograph domain (adiacente)

- `photo_submissions` + bucket `community-photos`
- **Mai** usato come cover POI ufficiale
- `published_at` su approvazione foto community

### 10.7 Attribuzione modale POI

`PoiImageSection.tsx` — **non mostra** `image_credit`/`image_license` nel modale verificato (solo immagine via resolver). Metadati esistono in DB ma **UX attribuzione pubblica assente**.

---

## 11. Wikidata / P18 / Wikimedia

### Ricerca nel repository

| Termine | Risultati codice applicativo |
|---------|------------------------------|
| Wikidata | **0** |
| P18 | **0** |
| Wikimedia Commons | **0** |
| Commons API / Wikidata API / SPARQL | **0** |
| "commons" | Solo opzione UI "Creative Commons" in `AdminImageInput.tsx` |

### Stato: 🔴 MANCANTE / DA SVILUPPARE

Nessuna integrazione, nessun job fetch, nessun parser metadati Commons.

---

## 12. Placeholder

### 12.1 POI — 🟢 ESISTENTE

| Meccanismo | File |
|------------|------|
| Mappa per categoria | `global_settings.category_placeholders` |
| Registry keys | `src/domain/placeholders/platformPlaceholderOrigin.ts` |
| Resolver display | `resolvePoiDisplayImageUrl.ts` |
| Fallback errore | `ImageWithFallback.tsx` |
| Admin reset | `PoiMediaTab` → `image_status: 'placeholder'` |
| Staging default | `stagingService.ts` |
| Tombstone URL retired | `retired_platform_placeholder_urls` in settings |

### 12.2 Personaggi — 🔴 MANCANTE (dedicato)

| Meccanismo attuale | Dettaglio |
|--------------------|-----------|
| Publish gate | `imageUrl` required — `famousPersonCompleteness.ts` |
| Display fallback | `ImageWithFallback` default `category='discovery'` → placeholder generico |
| `image_is_placeholder` | Colonna DB — mai impostata `true` dall'app |
| `findExistingPortrait` | Esclude `ui-avatars.com` |

**Nessun** placeholder per macro-categoria Personaggi (attore, calciatore, ecc.).

### 12.3 Altri placeholder piattaforma

| Asset | Key/location |
|-------|--------------|
| Patron default | `default_patron_image` settings |
| Platform UI | `platformPlaceholderOrigin.ts` (hero, favicon, auth bg, ecc.) |
| Ad slots | `AdPlaceholder` — non correlati |

---

## 13. Source / License / Attribution

### 13.1 POI e Cities — 🟡 PARZIALE

| Campo | `pois` | `cities` | `city_people` |
|-------|--------|----------|---------------|
| `image_credit` | ✅ | ✅ | ❌ |
| `image_license` | ✅ | ✅ | ❌ |
| `image_status` | ✅ | ✅ (hero_status) | ❌ |

**UI Admin:** `AdminImageInput.tsx` — selector licenza + credit + AI copyright check

### 13.2 Personaggi — 🔴 MANCANTE

Nessun campo credit/license/provenance su `city_people`.

Community suggestion ha solo `rights_confirmed: boolean` (attestazione utente).

### 13.3 Campi assenti ovunque (richiesti Master Plan)

| Campo | Stato |
|-------|-------|
| `source_url` | 🔴 |
| `original_url` | 🔴 |
| `license_url` | 🔴 |
| `attribution_text` | 🔴 |
| `retrieved_at` | 🔴 |
| `verification_status` | 🔴 |
| `image_origin` enum | 🔴 |
| `wikidata_id` | 🔴 |
| `commons_file_id` | 🔴 |

### 13.4 Photograph domain

`photo_submissions.published_at` — solo tempo pubblicazione foto community, non presentation media POI/Personaggi.

---

## 14. Provenance — cosa viene tracciato oggi

| Flusso | Tracciamento |
|--------|--------------|
| AI portrait Personaggi | 🔴 Solo URL finale — no flag AI, no timestamp gen, no modello |
| Community foto Personaggi | 🟡 `storage_path` + `rights_confirmed` + RPC audit parziale |
| Admin URL paste Personaggi | 🔴 Solo URL string |
| POI upload Admin | 🟡 credit + license enum + status |
| POI staging | 🟡 Placeholder URL scritto in image_url |
| Cross-city reuse | 🔴 Nessuna provenienza del riuso |
| Abuse block Personaggi | 🟡 Snapshot in report + reason enum |

**Nessun modello unificato provenienza.**

---

## 15. Immagini rimosse — storico

### Stato: 🔴 MANCANTE

| Capacità | POI | Personaggi | Photos |
|----------|-----|------------|--------|
| History table | ❌ | ❌ | ❌ |
| Soft delete image | ❌ | ❌ (block clear = null) | ❌ hard delete |
| Versioni precedenti | ❌ | ❌ | ❌ |
| Ripristino | ❌ | ❌ | ❌ |

**Block foto Personaggi:** azzera URL corrente, non archivia versione precedente strutturata.

**Delete person:** `deleteCityPerson` — elimina riga, file Storage non cancellato.

**Asset library delete:** rimuove file Storage senza aggiornare DB.

---

## 16. Motivazione rimozione

### Stato: 🔴 MANCANTE (Presentation Media)

- **Personaggi block RPC:** `reason` enum su **report** (`copyright`, `other_rights`, `unauthorized`, `other`) — non motivazione Admin su rimozione volontaria
- **POI:** nessun campo motivazione rimozione immagine
- **Admin rimozione manuale URL:** nessun prompt motivazione

**Master Plan richiede:** motivazione obbligatoria + modificabile + audit trail — **tutto da sviluppare**.

---

## 17. Admin audit trail

| Sistema | Scope | Immagini POI/Personaggi? |
|---------|-------|--------------------------|
| `platform_control_audit` | Feature flags | ❌ |
| `sponsor_admin_audit_events` | Sponsor | ❌ |
| RPC accept/block person photo | Return JSON con previous URL | 🟡 Parziale, non queryable history |
| `approved_by`/`approved_at` | `city_patron_gallery` | Solo patron gallery |

**Stato: 🔴 MANCANTE** per audit trail immagini Presentation Media.

---

## 18. Filtri territoriali

### 18.1 Esistenti — 🟢

**Colonne `cities`:**

| Colonna DB | Label UI |
|------------|----------|
| `continent` | Continente |
| `nation` | Nazione |
| `admin_region` | Regione |
| `zone` | Zona turistica (string) |
| `region_id` | FK regions |
| `tourist_zone_id` | FK tourist_zones |

### 18.2 Implementazione

| Componente | File |
|------------|------|
| Cascading filters | `src/components/admin/cities/GeoCascadingFilters.tsx` |
| Observatory | `ObservatoryFilterDrawer.tsx`, `AnomalyInspector.tsx` |
| Sponsor | `SponsorFilters.tsx` |

### 18.3 Collegamento immagini

| Feature | Filtro geo + immagine? |
|---------|------------------------|
| Observatory `no_image` anomaly | 🟡 Sì — rileva POI senza imageUrl per città filtrate |
| Culture Corner Personaggi | ❌ Solo categoria + birth year |
| Archivio immagini rimosse | 🔴 Non esiste |
| Libreria Media | ❌ Nessun filtro territoriale |

**Gap:** filtri territoriali pronti ma **non collegati** a governance immagini archiviate/scartate.

---

## 19. Data pubblicazione

| Entità | Campo | Uso |
|--------|-------|-----|
| `photo_submissions` | `published_at` | 🟢 Set on approve — solo Photograph domain |
| `city_people` | `created_at` | Record creation — **non** pubblicazione immagine |
| `pois` | — | 🔴 Nessun `published_at` |
| Presentation media generale | — | 🔴 Assente |

**Distinzioni Master Plan** (recupero, upload Storage, assegnazione, pubblicazione): **non modellate**.

---

## 20. AI metadata

| Metadato | Stato |
|----------|-------|
| `generated_by_ai` flag DB | 🔴 |
| Modello AI in DB | 🔴 (log Edge interno non persistito) |
| Prompt version/hash | 🔴 |
| Timestamp generazione | 🔴 (solo `created_at` file Storage) |
| Feature tag | 🟡 `vision` passato a gemini-task — non salvato su entity |
| Dicitura AI in UI | 🔴 |

**Tipo `FamousPerson`:** campi `image_status` / `imageAsset` presenti nel type ma **`saveCityPerson` li ignora** per Personaggi.

---

## 21. Licenze

### 21.1 POI/Cities — 🟡 PARZIALE

- Enum manuale Admin: `own`, `cc`, `public`, `copyright`
- AI copyright **hint** via Gemini vision — non verifica strutturata CC BY
- **Nessuna** allowlist automatica
- **Nessuna** verifica URL licenza

### 21.2 Personaggi — 🔴 MANCANTE

- Nessun campo licenza su `city_people`
- Community: `rights_confirmed` boolean utente

### 21.3 Master Plan CC BY allowlist — 🔴 DA SVILUPPARE

---

## 22. Beni culturali

### Stato: 🔴 MANCANTE

- Nessun controllo specifico beni culturali italiani
- Nessuna regola configurabile per monumenti/musei
- POI category non mappata a policy cultural heritage
- AI copyright check generico — non distingue bene culturale

---

## 23. Immagini AI di terzi — riuso

### Stato attuale: 🔴 MANCANTE / DA SVILUPPARE (implementazione)

Verificato assenza di:

- Metadati licenza CC BY 4.0 persistiti su asset AI
- Copyright notice / attribuzione Touring Diary su immagini generate
- Condizioni riuso esposte in UI/modale
- Policy pubblica riutilizzo collegata ai metadati

**Policy funzionale:** ✅ **CHIUSA — D78** (Master Plan §12.1, §23): riuso terzi consentito sotto **CC BY 4.0** con attribuzione a Touring Diary.

**Implementazione:** prevista nella roadmap (Macrofasi 3–4). **Non** trattare come decisione aperta.

---

## 24. Admin priority

### Stato: 🟡 PARZIALE

| Meccanismo | Esiste? |
|------------|---------|
| Admin paste URL → overwrite | ✅ `CulturePersonCard` + save |
| Admin regenerate AI → overwrite | ✅ `regeneratePortrait` |
| Admin accept community → overwrite | ✅ RPC accept |
| Resolver esplicito priorità Admin > auto > AI > placeholder | 🔴 Assente — nessun campo `image_source_priority` |
| Admin remove con storico | 🔴 Assente |
| Admin upload file Personaggi | 🔴 Solo URL (Patron ha `AdminImageInput`) |

**In pratica:** Admin può sovrascrivere manualmente, ma **non c'è modello dati** che registri priorità e origine.

---

## 25. Pipeline completa attuale

### 25.1 Personaggi — flusso REALE oggi

```
┌─ DISCOVERY IMPORT ─────────────────────────────────────────────┐
│ suggestCityPeople (no image)                                    │
│   → findExistingPortrait (global by name)                       │
│   → if miss: generateHistoricalPortrait (Gemini image)        │
│   → ensureFamousPersonCompletenessWithAi                        │
│   → saveCityPerson (draft) via upsert_city_person RPC           │
└─────────────────────────────────────────────────────────────────┘

┌─ REGENERATE ───────────────────────────────────────────────────┐
│ Admin button → generateHistoricalPortrait → saveCityPerson      │
│ (old Storage file NOT deleted)                                  │
└─────────────────────────────────────────────────────────────────┘

┌─ MANUAL ───────────────────────────────────────────────────────┐
│ URL paste → savePersonChanges → saveCityPerson                    │
└─────────────────────────────────────────────────────────────────┘

┌─ COMMUNITY FOTO ───────────────────────────────────────────────┐
│ User upload → suggestion queue → Admin accept RPC               │
│ → image_url + image_storage_path                              │
└─────────────────────────────────────────────────────────────────┘

┌─ DISPLAY ──────────────────────────────────────────────────────┐
│ city_people.image_url → ImageWithFallback                       │
│ if missing/error → category 'discovery' placeholder             │
└─────────────────────────────────────────────────────────────────┘

ASSENTI: foto reali auto, Wikidata, policy licenze, dicitura AI,
         placeholder macro-categoria, storico, provenance
```

### 25.2 POI — flusso REALE oggi

```
┌─ ADMIN ────────────────────────────────────────────────────────┐
│ PoiMediaTab → AdminImageInput                                   │
│   URL or upload (admin_uploads/)                                │
│   optional AI copyright check                                   │
│   → poiWrite → pois.image_url + status + credit + license       │
└─────────────────────────────────────────────────────────────────┘

┌─ STAGING ──────────────────────────────────────────────────────┐
│ stagingService → category placeholder URL in image_url          │
│ promote_staging_poi RPC → copy image_url only                   │
└─────────────────────────────────────────────────────────────────┘

┌─ DISPLAY ──────────────────────────────────────────────────────┐
│ resolvePoiDisplayImageUrl                                       │
│   imageUrl → catalogImageUrl → category placeholder             │
│ ImageWithFallback on error                                      │
└─────────────────────────────────────────────────────────────────┘

ASSENTI: foto reali auto, Wikidata, AI cover, provenance completa,
         storico, attribuzione modale pubblica
```

---

## 26. Gap Analysis — Stato attuale vs Master Plan

| Obiettivo Master Plan | Già soddisfatto | Parziale | Non soddisfatto | Non verificabile |
|-----------------------|-----------------|----------|-----------------|------------------|
| §2 Obiettivo conservativo | | | ✅ | |
| §4 Flusso Personaggi target | | 🟡 AI only | ✅ | |
| §5 Flusso POI target | | 🟡 placeholder | ✅ | |
| §6 Foto reali pipeline | | | ✅ | |
| §7 CC BY allowlist | | | ✅ | |
| §8 Wikidata P18 | | | ✅ | |
| §9 Diritti distinti | | 🟡 POI license enum | ✅ | |
| §10 Beni culturali | | | ✅ | |
| §11 AI rappresentativa | | ✅ prompt | ✅ metadati | |
| §12 Dicitura AI | | | ✅ | |
| §13 Placeholder Personaggi | | | ✅ | |
| §14 Placeholder POI | ✅ | | | |
| §15 Priorità immagini | | 🟡 manual override | ✅ resolver | |
| §16 Libreria Media target | | ✅ storage browser | ✅ index | |
| §17 Provenienza | | 🟡 POI credit | ✅ Personaggi | |
| §18 Download Storage foto reali | | | ✅ | |
| §19 Scartate/accantonate | | | ✅ | |
| §20 Storico rimozioni | | | ✅ | |
| §21 Filtri territoriali | ✅ infra | | ✅ collegamento | |
| §22 Data pubblicazione | | 🟡 photos only | ✅ presentation | |
| §23 AI riuso terzi | | | ✅ | 🔴 gap impl. (D78 chiusa) |
| §24 Automazione E2E | | 🟡 AI portrait | ✅ | |
| §25 Admin governance | | 🟡 | ✅ | |
| §30 Migration RPC | ✅ | | | ⚪ post-push verify |
| §31–§38 Segnalazioni / stati / AI hub | | 🟡 modali parziali | ✅ hub 4 tab, stati, Community abuso, OTP | |

---

## 27. Funzionalità già riutilizzabili

**Sezione critica** — evitare duplicazioni nello sviluppo futuro.

### 27.1 Storage e upload

| Asset | File | Riutilizzo |
|-------|------|------------|
| `uploadPublicMedia` / `uploadPublicMediaDetailed` | `mediaService.ts` | Upload qualsiasi cartella `public-media` |
| `getAssetUsageMap` | `mediaService.ts` | Base per "in uso" / orphan detection |
| `deletePublicMediaByStoragePath` | `mediaService.ts` | Cleanup — estendere allowlist paths |
| Bucket `public-media` | Infra esistente | Foto reali verificate, AI, admin |

### 27.2 AI generation stack

| Asset | File | Riutilizzo |
|-------|------|------------|
| `generateHistoricalPortrait` | `aiVision.ts` | Base AI Personaggi — estendere metadati post-gen |
| `aiGateway.generateLegacy` | `aiGateway.ts` | Gateway unificato |
| `gemini-task` Edge | `supabase/functions/gemini-task/index.ts` | Image gen + quota handling |
| `getAiPrompt` | `aiConfigService.ts` | Prompt DB-configurable |
| Quota error handling | `aiEdgeErrors.ts` | Pattern fail-no-retry |

### 27.3 Personaggi CRUD e AI

| Asset | File | Riutilizzo |
|-------|------|------------|
| `saveCityPerson` + RPC upsert | `entitiesService.ts` | Extend payload metadati |
| `usePeopleAI` | `usePeopleAI.ts` | Hook orchestrazione — insert pipeline foto reali |
| `peopleCompletenessPipeline` | `peopleCompletenessPipeline.ts` | Recovery order — extend image step |
| `findExistingPortrait` | `mediaService.ts` | Base dedup — migliorare scope/identity |
| Community moderation RPCs | migrations 20260907-0813 | Pattern atomico accept/block |
| `famousPersonCompleteness` | domain | Publish gate |

### 27.4 POI media

| Asset | File | Riutilizzo |
|-------|------|------------|
| `resolvePoiDisplayImageUrl` | domain/poi | Extend con source-aware resolution |
| `AdminImageInput` | component | Credit/license UI — generalizzare a Personaggi |
| `PoiMediaTab` | component | Pattern editor media |
| `image_status` enum | DB + governance | Estendere a Personaggi |
| AI copyright check | `AdminImageInput` | Base analisi — non sostituisce policy CC BY |

### 27.5 Placeholder

| Asset | File | Riutilizzo |
|-------|------|------------|
| `category_placeholders` settings | `settingsService.ts` | Modello per placeholder Personaggi macro-cat |
| `platformPlaceholderOrigin.ts` | domain | Registry pattern |
| `ImageWithFallback` | component | Fallback chain |

### 27.6 Admin infra

| Asset | File | Riutilizzo |
|-------|------|------------|
| `AdminAssetLibrary` | component | Evolvere verso index DB + filtri |
| `GeoCascadingFilters` | component | Filtri archivio immagini |
| `AnomalyInspector` | component | Pattern `no_image` — extend ad archivio |

### 27.7 Display

| Asset | File | Riutilizzo |
|-------|------|------------|
| `CulturePersonDetailModal` | component | Aggiungere dicitura/attribuzione |
| `PoiImageSection` | component | Aggiungere credit/license display |
| `parseMediaAsset` | cityReadService | Modello MediaAsset — extend |

### 27.8 Segnalazione immagini (Personaggi — base riutilizzabile)

| Asset | File | Riutilizzo |
|-------|------|------------|
| Modale segnalazione | `ReportFamousPersonPhotoAbuseModal.tsx` | Evolvere UX + guest flow + anteprima |
| Service CRUD + block | `famousPersonPhotoReportService.ts` | Estendere auto-suspend, restore, POI |
| Tabella + RLS | `famous_person_photo_reports` | Base snapshot immagine — evolvere, non duplicare |
| Admin moderation | `AdminFamousPeopleManager.tsx` (tab reports) | Centralizzare con tab POI futuro |
| Pattern Patron (reference) | `ReportPatronPhotoAbuseModal.tsx` | Analogia guest/auth — non confondere con POI |

**Direzione Master Plan §31:** riutilizzare ed estendere — **non** costruire secondo motore.

---

## 28. Funzionalità mancanti

1. Integrazione Wikidata P18 → Commons API
2. Pipeline verifica licenza CC BY automatica
3. Modello dati provenance unificato (tabella `entity_images` o colonne estese)
4. Enum `image_origin` (admin, ai_generated, wikimedia_verified, community, placeholder, external)
5. Flag `generated_by_ai` + metadati modello/prompt
6. Dicitura AI nel modale Personaggi (e POI se AI cover)
7. Placeholder Personaggi per macro-categoria (asset statici)
8. Storico immagini con versioni
9. Motivazione obbligatoria rimozione Admin
10. Audit trail operatore + timestamp su operazioni immagine
11. Accantonamento/scarto foto candidate
12. UI Admin foto scartate filtrabili per territorio
13. Download automatico foto reali verificate
14. Attribuzione fonte sempre visibile modale (Personaggi + POI)
15. `image_storage_path` su tutti upload interni Personaggi
16. Orphan cleanup policy rigenerazione AI
17. Admin file upload Personaggi (`AdminImageInput`)
18. Resolver priorità immagine attiva
19. Campi `published_at` / `removed_at` presentation media
20. Controlli beni culturali
21. Controlli diritti persona oltre licenza file
22. AI cover POI (se approvata)
23. Policy riuso AI terzi (se decisa)
24. Paginazione Libreria Media + index oltre 100 file
25. Tab Libreria per `famous_person_photo_suggestions` e community assets
26. Sospensione automatica immagine alla segnalazione valida (§31.7 — oggi solo `pending`)
27. Flusso guest segnalazione: email + codice verifica, senza registrazione (§31.6)
28. ~~UX "Segnala immagine"~~ **ANNULLATO** — mantenere "Segnala abuso" (Master Plan D30); estendere punti UI §36.2
29. Admin rigetto segnalazione → ripristino immagine sospesa (§31.8)
30. Motivazione obbligatoria Admin alla conferma rimozione + note integrative (§31.8)
31. Segnalazione immagini POI — stesso motore Personaggi (§31.12)
32. Collegamento segnalazione ↔ metadati provenienza immagine (§31.13)
33. Storico completo contestazioni immagine — schema **`content_reports`** + storico (**Q19** tecnica chiusa §42.4; implementazione MF2/MF3)
35. Modello B doppia segnalazione — due righe Admin collegate (§37.1)
36. Conservazione permanente segnalazioni OK — dati + motivazione Admin (§37.2)
37. Snapshot/copia stabile fotografia esatta segnalata — non solo URL (§37.3)

---

## 29. Roadmap operativa

> **Unica roadmap vigente:** **5 MACROFASI** (Master Plan §38).  
> Perimetro file: `AI_IMAGE_MANAGEMENT_MACROFASE_1_FILES.md` … `_5_FILES.md`.  
> Progettazione tecnica: **§38**. Gap e stato reale: §1–§28, §35–§37.

```
MACROFASE 1 → TEST → MACROFASE 2 → TEST → MACROFASE 3 → TEST → MACROFASE 4 → TEST → MACROFASE 5
```

Non passare alla macrofase successiva senza TEST accettabile della precedente.

---

## 30. Dipendenze

```
MACROFASE 1 (Admin, stati, categorie, schema base)
    ↓ TEST
MACROFASE 2 (Segnalazioni, associazioni, modello B, OTP, Community…)
    ↓ TEST
MACROFASE 3 (Stati immagine, provenance, AI queue, notifiche)
    ↓ TEST
MACROFASE 4 (Wikimedia, Media Library, storico, snapshot)
    ↓ TEST
MACROFASE 5 (Consolidamento, regressioni, E2E)
```

**Dipendenze critiche:**

- Wikimedia **non** implementabile senza modello provenance + quarantine
- Storico **non** implementabile senza schema esteso origine immagine
- Dicitura AI **dipende** da flag `generated_by_ai` persistito
- Admin priority resolver **dipende** da `image_origin` + priority rules

---

## 31. Rischi

### 31.1 Tecnici

| Rischio | Impatto | Mitigazione |
|---------|---------|-------------|
| Orphan files Storage | Costo + confusione Libreria | Cleanup policy Macrofase 3–5 |
| `findExistingPortrait` non deterministico | Riuso URL errato cross-city | ORDER BY + identity key (Macrofase 5) |
| Libreria delete → broken URLs | UX rotta | Block delete if in use + DB update (Macrofase 4) |
| RPC/postgREST drift | Save failures | Verifica pre-MF1 (upsert_city_person ✅) |
| 100 file limit Libreria | Asset invisibili | Paginazione Macrofase 4 |

### 31.2 Architettura

| Rischio | Impatto | Mitigazione |
|---------|---------|-------------|
| Duplicazione logica POI/Personaggi | Manutenzione doppia | Shared `entityImageService` |
| Mixing Presentation/Photograph | Violazione WF-02 | Mantenere boundary |
| Schema metadati insufficiente | Re-migration | Design upfront §38 + Macrofase 1 |

### 31.3 Dati

| Rischio | Impatto | Mitigazione |
|---------|---------|-------------|
| URL esterni senza storage_path | Impossibile cleanup/verify | Normalizzare upload interni |
| Metadati licenza manuale POI inaccurati | Falsa sicurezza | Non presentare come verifica automatica |
| Cross-city name collision | Immagine persona sbagliata | Identity disambiguation |

### 31.4 Automazione

| Rischio | Impatto | Mitigazione |
|---------|---------|-------------|
| Falsi positivi CC BY parser | Uso non autorizzato | Policy conservativa fail-closed |
| Commons metadata incompleti | Attribuzione errata | Scarto se metadati insufficienti |
| Rate limit API Wikimedia | Pipeline bloccata | Queue + backoff |

### 31.5 Provenienza e diritti

| Rischio | Impatto | Mitigazione |
|---------|---------|-------------|
| CC BY ≠ diritti immagine persona | Controversie | Controlli aggiuntivi Master Plan |
| Persona defunta assunta libera | Controversie | No regola vivente/defunto automatica |
| Community `rights_confirmed` ≠ verifica | Abuso | Moderation + report flow (esistente) |
| AI portrait sembra foto reale | Misleading UX | Dicitura + prompt anti-fotorealismo |

### 31.6 Beni culturali

| Rischio | Impatto | Mitigazione |
|---------|---------|-------------|
| Licenza foto ≠ regole bene | Uso non consentito | Accantonamento + review Admin |
| Automazione insufficiente | Falsi OK | Fail-closed |

### 31.7 Falsa sicurezza

| Rischio | Descrizione |
|---------|-------------|
| AI copyright check POI | Hint Gemini ≠ verifica legale |
| `image_license: 'cc'` manuale | Admin select ≠ verifica CC BY |
| `rights_confirmed` community | Autodichiarazione utente |
| `published_at` photos | Non prova copyright presentation media |
| P18 futuro | Associato ≠ libero — documentare esplicitamente |

---

## 32. Questioni aperte — SUPERATA (2026-09-16)

> **Questa sezione è obsoleta.** Le decisioni funzionali sono **chiuse** nel Master Plan **§26 (D78–D89)** e mappate in **§27.1**. Le scelte tecniche sono in Master Plan **§42**. Audit **§40** riporta gap implementativi.

**Riferimento canonico unico:** `AI_IMAGE_MANAGEMENT_MASTER_PLAN.md` §27.1 + §42.

| Vecchio punto §32 | Stato |
|-------------------|-------|
| Schema metadati | 🔧 **§42.1–§42.2** |
| Bucket foto verificate | 🔧 **§42.8** |
| Wikidata lookup | 🔧 **§42.9** |
| Override Admin | ✅ **D82** |
| Placeholder asset | 🟡 design MF1 |
| AI cover POI | ✅ **D51/D63** default OFF |
| Licenze / riuso AI | ✅ **D78, D79** |
| SMS guest | ✅ **SUPERATA** — **D85** |
| Hub Segnalazioni | ✅ **§32** |

---

## 33. Ordine di implementazione consigliato

Ordine prudente allineato a dipendenze e valore:

| Step | Intervento | Razionale |
|------|------------|-----------|
| **1** | Verifica operativa RPC + smoke test save person | Base solida — già pushata |
| **2** | Design + migration schema metadati immagine | Sblocca tutto il resto |
| **3** | Flag AI + storage_path + origin su save Personaggi | Tracciabilità minima |
| **4** | Dicitura AI modale Personaggi | Compliance UX policy |
| **5** | Placeholder macro-categoria Personaggi | Fallback corretto senza re-AI |
| **6** | AdminImageInput upload Personaggi | Admin priority operativa |
| **7** | Orphan cleanup rigenerazione | Hygiene Storage |
| **8** | Storico + motivazione rimozione | Governance Master Plan |
| **9** | Attribuzione modale POI | Quick win — dati già in DB |
| **10** | Filtri territoriali archivio immagini | Riutilizza GeoCascadingFilters |
| **11** | Wikidata/Commons MVP (solo CC BY, fail-closed) | Alto valore, alto rischio — dopo governance |
| **12** | Quarantine UI Admin foto scartate | Completa pipeline foto reali |
| **13** | Libreria Media index DB + paginazione | Scalabilità |
| **14** | Consolidamento e verifiche implementative delle decisioni già approvate (D51/D63, D78, D79+) | Dopo stabilizzazione core |

**NON implementare in questo ordine senza:** review esplicita Master Plan + migration review + `npm run check`.

---

## Appendice A — Migration RPC — dettaglio verificato

**File:** `supabase/migrations/20260910180000_upsert_city_person_with_category_links.sql`

| Aspetto | Verificato |
|---------|------------|
| Funzione esiste nel repo | ✅ |
| Firma `upsert_city_person_with_category_links(p_person jsonb, p_specific_category_ids uuid[])` | ✅ |
| Coerenza con `entitiesService.saveCityPerson` | ✅ |
| Gestione `image_url` preserve on update | ✅ |
| Transazione category links | ✅ |
| Auth admin/service role | ✅ |
| Pushata al remoto | ✅ (per dichiarazione utente — migration list pulita) |
| Esistenza DB remota funzione | ✅ Verificata |
| Esposizione PostgREST (OPTIONS 200, Allow POST) | ✅ Verificata |
| Smoke test POST E2E salvataggio reale | ⚪ Non eseguito (eviterebbe modifica dati reali) |

---

## Appendice B — File indice audit

| Area | Path principali |
|------|-----------------|
| Libreria Media | `src/components/admin/AdminAssetLibrary.tsx` |
| Media service | `src/services/mediaService.ts` |
| AI portrait | `src/services/ai/aiVision.ts` |
| People AI hook | `src/hooks/admin/people/usePeopleAI.ts` |
| Completeness | `src/services/ai/generators/peopleCompletenessPipeline.ts` |
| Entities save | `src/services/city/entitiesService.ts` |
| POI display | `src/domain/poi/resolvePoiDisplayImageUrl.ts` |
| POI admin | `src/components/admin/poiModal/PoiMediaTab.tsx` |
| Admin image input | `src/components/admin/AdminImageInput.tsx` |
| Placeholders | `src/domain/placeholders/platformPlaceholderOrigin.ts` |
| Community foto | `src/services/famousPerson/famousPersonPhotoSuggestionService.ts` |
| Edge AI | `supabase/functions/gemini-task/index.ts` |
| Prompt config | `src/services/aiConfigService.ts` |
| Geo filters | `src/components/admin/cities/GeoCascadingFilters.tsx` |
| Media architecture | `AI_CONTEXT/16_CITY_MEDIA_MANAGEMENT.md` |

---

*Fine Audit — stato verificato al 2026-09-12. Per obiettivi e decisioni vedere `AI_IMAGE_MANAGEMENT_MASTER_PLAN.md`.*

---

## 34. Audit forense integrale del repository (secondo passaggio — 2026-09-12)

> **Metodo:** lettura diretta codice TypeScript/SQL, grep mirati, ricostruzione flussi end-to-end.  
> **Regola:** nessuna supposizione; ciò che non è verificabile nel repo è marcato **NON VERIFICATO**.  
> **Nota:** questa sezione **integra** (non sostituisce) le sezioni 1–33. Nessun contenuto precedente è stato rimosso.

Questa sezione risponde punto per punto al mandato di audit forense su Personaggi, POI e Libreria Media, e fornisce il **report strutturato obbligatorio** nelle sezioni A–I in calce.

---

### 34.1 LIBRERIA MEDIA — cosa mostra realmente (punto mandato §1)

#### Componente/pagina

| Elemento | Valore verificato |
|----------|-------------------|
| Label Admin | `"Libreria Media"` |
| Sidebar | `src/components/admin/layout/AdminSidebar.tsx` — `NavItem id="assets"` |
| Router | `src/components/admin/AdminDashboard.tsx` — `case 'assets': return <AdminAssetLibrary />` |
| Componente unico | `src/components/admin/AdminAssetLibrary.tsx` — **nessun sub-component per tab** |

#### Tab/categorie — elenco completo verificato

Array `FOLDERS` in `AdminAssetLibrary.tsx` (righe 29–39):

| # | Nome visualizzato (UI) | Cartella Storage | Tabella SQL listing | Bucket |
|---|------------------------|------------------|---------------------|--------|
| 1 | PEOPLE PORTRAITS | `people_portraits` | **Nessuna** | `public-media` |
| 2 | AI GENERATED | `ai_generated` | **Nessuna** | `public-media` |
| 3 | GENERAL | `general` | **Nessuna** | `public-media` |
| 4 | ADMIN ASSETS | `admin_assets` | **Nessuna** | `public-media` |
| 5 | EDITED ASSETS | `edited_assets` | **Nessuna** | `public-media` |
| 6 | SHOP PRODUCTS | `shop_products` | **Nessuna** | `public-media` |
| 7 | COMMS ASSETS | `comms_assets` | **Nessuna** | `public-media` |
| 8 | ONBOARDING ASSETS | `onboarding_assets` | **Nessuna** | `public-media` |
| 9 | SOCIAL TEMPLATES | `social_templates` | **Nessuna** | `public-media` |

**Non esiste catalogo/tabella media intermedia** per il listing dei tab. Ogni tab è un **browser di cartelle Storage**.

#### Query/fonte dati per tab (identica per tutti)

```typescript
// AdminAssetLibrary.tsx — loadFiles()
supabase.storage.from('public-media').list(currentFolder, {
  limit: 100,
  offset: 0,
  sortBy: { column: 'created_at', order: 'desc' },
});
```

Post-filtro: esclude file `.emptyFolderPlaceholder`.

#### Filtri e condizioni "in uso / inutilizzato"

| Filtro | Implementazione |
|--------|-----------------|
| Tutti | Tutti i file del listing Storage corrente |
| In Uso | URL file presente in `usageMap` da `getAssetUsageMap()` |
| Inutilizzati | URL file assente da `usageMap` |

`getAssetUsageMap()` (`mediaService.ts`) interroga **tabelle SQL** solo per l'overlay usage, **non** per popolare il listing:

- `cities` (hero/card/gallery via `fetchGlobalCityMediaInfo`)
- `pois.image_url`
- **`city_people.image_url`**
- `shops`, `city_events`, `city_guides`, `social_templates.bg_url`

Matching: URL normalizzato (strip query string). **`image_storage_path` non usato**.

#### PEOPLE PORTRAITS — risposta dimostrata dal codice

**Domanda:** PEOPLE PORTRAITS legge `city_people`? Bucket `people_portraits`? Tabella media? Combinazione?

**Risposta verificata:**

| Fonte | Usata per LISTING tab? | Usata per overlay IN USO? |
|-------|------------------------|---------------------------|
| Bucket `public-media/people_portraits/` | ✅ **SÌ — unica fonte listing** | — |
| Tabella `city_people` | ❌ **NO** | ✅ Sì (solo badge usage via URL match) |
| Tabella media dedicata | ❌ **NO — non esiste** | — |
| Combinazione listing | ❌ **NO** — solo Storage list | Overlay separato |

**Grep `people_portraits` in tutto il repository (verificato):** compare in **esattamente 2 file sorgente**:

1. `src/services/ai/aiVision.ts` — **scrittura** (upload)
2. `src/components/admin/AdminAssetLibrary.tsx` — **lettura** (tab default + list)

#### Tutte le immagini `city_people` compaiono in PEOPLE PORTRAITS?

**NO — dimostrato:**

1. Il tab **non legge** `city_people`; legge solo oggetti Storage nella cartella.
2. Foto ufficiali personaggi possono avere URL che **non** puntano a `people_portraits/`:
   - Community accettate → `famous_person_photo_suggestions/{userId}/`
   - URL esterni incollati manualmente (`CulturePersonCard.tsx` input testo)
   - Cross-city reuse → URL da qualsiasi origine
3. Limite **100 file** più recenti — nessuna paginazione.
4. Rigenerazioni AI creano **nuovi** file; il personaggio tiene **un solo** URL attivo.

#### Altri tab con immagini di personaggi famosi?

| Tab | Possibile overlap? | Verificato |
|-----|-------------------|------------|
| PEOPLE PORTRAITS | Ritratti AI in `people_portraits/` | ✅ Sì |
| AI GENERATED | Output generici (`SafeArtPanel.tsx` → `ai_generated/`) | 🟡 Possibile ma **non** catalogo personaggi |
| GENERAL / altri | Solo se file caricati manualmente lì | ❌ Non flusso personaggi |
| *(assente)* `famous_person_photo_suggestions/` | Foto community **non** esposte come tab | ✅ Cartella esiste, tab **no** |

**Conclusione:** **non esiste** oggi una "galleria di tutti i personaggi" nella Libreria Media.

#### Writer verificati per ogni cartella tab (contesto)

| Cartella tab | Chi scrive (file verificati) |
|--------------|------------------------------|
| `people_portraits` | `aiVision.ts` → `generateHistoricalPortrait` |
| `ai_generated` | `SafeArtPanel.tsx` |
| `general` | Default `uploadPublicMedia()` |
| `admin_assets` | `useAdminHeaderManager.ts` |
| `edited_assets` | `AdminPhotoInspector.tsx` |
| `shop_products` | `BusinessShopManager.tsx` |
| `comms_assets` | `CommsComposer.tsx` |
| `onboarding_assets` | `OnboardingVisualEditor.tsx` |
| `social_templates` | `AiBackgroundPanel.tsx` |

**Cartelle Storage rilevanti per personaggi ma NON in tab Libreria:**

- `famous_person_photo_suggestions/{userId}/` — `famousPersonPhotoSuggestionService.ts`
- `admin_uploads/` — upload generico Admin (POI, patron — **non** personaggi)

#### Sezione Admin correlata ma distinta: "Asset Globali"

- View Admin: `design_assets` → `AdminHeaderManager.tsx`
- Bucket: `public-media/admin_assets/`
- **Non** è Libreria Media; gestisce asset piattaforma/placeholder globali

---

### 34.2 CITY_PEOPLE — chi riempie `image_url` (punto mandato §2)

#### Mappa completa flussi verificati

| # | Flusso | Chi avvia | File logica | Origine immagine | Storage | DB | Libreria Media |
|---|--------|-----------|-------------|------------------|---------|-----|----------------|
| 1 | Admin URL paste + Salva | Admin UI | `CulturePersonCard.tsx` → `usePeopleData.savePersonChanges` → `entitiesService.saveCityPerson` | Input testo URL | ❌ Non obbligatorio | `city_people.image_url` via RPC upsert | Solo se URL punta a file in `people_portraits/` **e** file ∈ top 100 |
| 2 | Admin bozza vuota | Admin | `usePeopleData.addManualPerson` → `saveCityPerson` | `imageUrl: null` | — | NULL | — |
| 3 | Discovery import | Admin | `usePeopleAI.importDiscoveryPerson` | `findExistingPortrait` → o `generateHistoricalPortrait` | `people_portraits/` se AI | RPC upsert | File in tab se generato AI |
| 4 | Regenerate ritratto | Admin button | `usePeopleAI.regeneratePortrait` | Sempre nuova AI | Nuovo file `people_portraits/` | Overwrite URL | Nuovo file visibile; vecchio orfano |
| 5 | Completeness recovery | Pipeline auto | `peopleCompletenessPipeline.ensureFamousPersonCompletenessWithAi` | `generateHistoricalPortrait` se `imageUrl` mancante | `people_portraits/` | Via save downstream | Come sopra |
| 6 | Magic City people | Admin batch | `useAiMagicCity.ts` | `findExistingPortrait` pattern | Variabile | saveCityPerson | Variabile |
| 7 | Complete City people | Admin batch | `useAiCompleteCity.ts` | `findExistingPortrait` pattern | Variabile | saveCityPerson | Variabile |
| 8 | Culture regeneration | Admin tab | `editorCultureRegeneration.ts` | `findExistingPortrait` | Variabile | saveCityPerson | Variabile |
| 9 | Wipe & rewrite (bonifica) | Admin bulk | `usePeopleAI.wipeAndRewritePerson` | **Preserva** `imageUrl` esistente (riga 290, 312) | Non rigenera salvo recovery completeness | saveCityPerson | Invariato |
| 10 | Bulk publish/draft | Admin | `usePeopleAI.bulkUpdateStatus` | Non tocca immagine | — | status only | — |
| 11 | Community accept foto | Admin moderation | RPC `accept_famous_person_photo_suggestion` | `famous_person_photo_suggestions/` | Path in `image_storage_path` | URL + path + `image_is_placeholder=false` | **Non** in tab PEOPLE PORTRAITS (cartella diversa) |
| 12 | Abuse block clear | Admin/report | RPC `block_famous_person_photo_report_and_clear` | — | Best-effort delete path | URL=NULL, path=NULL | — |
| 13 | Accept person suggestion (no person) | Admin | RPC in `20260908130000` — INSERT person **senza** image_url | — | — | NULL image | — |
| 14 | Delete person | Admin | `usePeopleData.deletePerson` → `deleteCityPerson` | — | File Storage **non** cancellato | Row deleted | — |
| 15 | Legacy fallback upsert | Automatico se RPC assente | `saveCityPersonViaLegacyUpsert` | Payload client | — | `city_people` direct upsert | — |

**Persistenza centralizzata:** `entitiesService.saveCityPerson` mappa `person.imageUrl` → `payload.image_url` (trim, empty → null). RPC: `upsert_city_person_with_category_links`.

**NON scritto da `saveCityPerson`:** `image_storage_path`, `image_is_placeholder` (salvo RPC community).

#### Percorso dati canonico — diagramma testuale

```
ORIGINE IMMAGINE
    │
    ├─ [A] URL esterno incollato ──────────────────────────────┐
    ├─ [B] findExistingPortrait (URL da altra riga city_people)│
    ├─ [C] generateHistoricalPortrait (Gemini)                 │
    ├─ [D] Community suggestion accept (RPC)                   │
    │                                                           │
    ▼                                                           │
TRASFORMAZIONE                                                │
    ├─ [C] dataURL → File → compress implicit in upload       │
    ├─ [D] già in Storage suggestion folder                    │
    │                                                           │
    ▼                                                           │
STORAGE (se applicabile)                                       │
    ├─ [C] public-media/people_portraits/portrait_{name}_{ts} │
    ├─ [D] public-media/famous_person_photo_suggestions/...   │
    ├─ [A][B] possibilmente nessun file nostro                │
    │                                                           │
    ▼                                                           │
DATABASE                                                       │
    city_people.image_url (+ image_storage_path solo [D])  ◄───┘
    │
    ▼
LIBRERIA MEDIA
    PEOPLE PORTRAITS: SOLO file fisici in cartella people_portraits/ (max 100)
    Overlay IN USO: match URL ↔ city_people.image_url (qualsiasi origine URL)
```

---

### 34.3 PEOPLE_PORTRAITS — chi riempie il bucket/cartella (punto mandato §3)

> **Terminologia verificata:** `people_portraits` è una **cartella** dentro bucket **`public-media`**, non un bucket separato.

#### Scrittura (WRITE) — unico percorso applicativo verificato

| Operazione | Esiste? | File |
|------------|---------|------|
| Upload | ✅ | `aiVision.ts:209` — `uploadPublicMedia(file, 'people_portraits')` |
| Delete diretto cartella | ❌ | `deletePublicMediaByStoragePath` **esclude** `people_portraits/` (allowlist: patron + famous_person_photo_suggestions) |
| Update/in-place | ❌ | Non trovato |
| Copia da altro bucket | ❌ | `copyPublicMediaToFolder` esiste ma **non** usato per people_portraits |
| Generazione automatica | ✅ | Solo via `generateHistoricalPortrait` |
| Upload manuale Admin | ❌ | Personaggi admin ha solo URL paste — **no** `AdminImageInput` |

**Call chain upload:**

```
generateHistoricalPortrait
  → portraitUploadFileName(personName, dataUrl)
  → dataURLtoFile
  → uploadPublicMediaDetailed → path: people_portraits/{timestamp}_{safeName}
  → returns publicUrl
```

#### Lettura (READ)

| Consumer | Tipo lettura |
|----------|--------------|
| `AdminAssetLibrary.tsx` | Storage `.list('people_portraits')` |
| UI pubblica/admin personaggi | HTTP GET su public URL in `city_people.image_url` |
| `getAssetUsageMap()` | Scan `city_people.image_url` per badge (non legge Storage) |

#### Classificazione A/B/C/D (punto mandato)

| Opzione | Verdetto |
|---------|----------|
| **A)** Esclusivamente deposito ritratti personaggi | 🟡 **Quasi** — solo `generateHistoricalPortrait` scrive; nessun altro flusso verificato |
| **B)** Usato anche da altri flussi | ❌ **NO** — grep conferma 2 soli file |
| **C)** Libreria Media legge direttamente | ✅ **SÌ** — tab PEOPLE PORTRAITS |
| **D)** Sincronizzato con tabella/catalogo | ❌ **NO** — nessuna sync; solo URL in `city_people.image_url` |

---

### 34.4 FIND EXISTING PORTRAIT — analisi integrale (punto mandato §4)

**File:** `src/services/mediaService.ts:175-199`

| Aspetto | Comportamento verificato |
|---------|-------------------------|
| Cosa cerca | Prima riga con foto valida per nome |
| Tabella | `city_people` |
| Colonne | `image_url` (select only) |
| Consulta Storage | ❌ NO |
| Consulta catalogo media | ❌ NO |
| Consulta Libreria Media | ❌ NO |
| Match | `ilike('name', personName)` — case-insensitive **exact** string |
| Filtro città | ❌ **NO** — globale |
| Altri identificatori | ❌ NO (no Wikidata ID, no UUID persona) |
| Esclusioni | URL vuoti/null; URL con `ui-avatars` |
| Multi-risultato | `limit(1)` — **ordine non specificato** (indeterminato) |
| Se non trova | Ritorna `null` → caller procede con AI |

#### Esempio concreto — Leonardo a Firenze

```
1. Admin: Import discovery "Leonardo da Vinci" → Firenze
2. usePeopleAI.importDiscoveryPerson
3. findExistingPortrait("Leonardo da Vinci")
   → SELECT city_people.image_url WHERE name ILIKE 'Leonardo da Vinci'
     AND image_url NOT NULL LIMIT 1
   → CASO A: trova riga (es. Milano, URL unsplash o people_portraits)
     → seedImage = quell'URL → SALTA generateHistoricalPortrait
   → CASO B: non trova / solo ui-avatars
     → generateHistoricalPortrait("Leonardo da Vinci", "Pittore"|label, "Firenze")
     → upload people_portraits/ → seedImage = publicUrl
4. ensureFamousPersonCompletenessWithAi (bio, date; imageUrl recovery se ancora missing)
5. saveCityPerson → city_people.image_url = seedImage
6. Libreria Media: file visibile in PEOPLE PORTRAITS solo se CASO B e file ∈ top 100
```

---

### 34.5 Flusso completo "Importa + Foto" (punto mandato §5)

#### Percorso A — "Importa" (Discovery AI Admin)

```
CulturePeopleDiscovery.tsx
  → usePeopleAI.runDiscovery(query, count)
  → suggestCityPeople(cityName, existingNames, query, count)  [TESTO ONLY — no immagine]
  → discoveryResults in UI
  → Admin click Import → importDiscoveryPerson(person)
      → validateAiSpecificSlugs
      → findExistingPortrait(name) [globale]
      → if miss: generateHistoricalPortrait(name, categoryLabel, cityName)
          → catch quota: skipImageAiRecovery=true, continua senza foto
      → ensureFamousPersonCompletenessWithAi (recovery: bio → date → imageUrl, max 2 tentativi portrait)
      → toDraftFamousPersonSaveFields
      → saveCityPerson(cityId, newPerson)  [status draft]
      → reload list
```

**Dove entra l'immagine:** step `findExistingPortrait` / `generateHistoricalPortrait` **prima** del save; poi `imageUrl` nel payload save.

#### Percorso B — "Foto" (Community)

```
CultureCornerModal → SuggestFamousPersonPhotoModal
  → createFamousPersonPhotoSuggestion
      → uploadPublicMediaDetailed(file, 'famous_person_photo_suggestions/{userId}/')
      → RPC submit_famous_person_photo_suggestion
      → NON modifica city_people

AdminFamousPeopleManager
  → acceptFamousPersonPhotoSuggestion(suggestionId)
      → RPC accept_famous_person_photo_suggestion (atomico)
      → city_people.image_url + image_storage_path
      → client: deletePublicMediaByStoragePath(previous_path) best-effort
```

#### Percorso C — Alternativi

| Percorso | Immagine |
|----------|----------|
| Magic/Complete city | Stesso pattern findExisting → completeness → save |
| Regenerate manuale | Sempre nuova AI, overwrite URL |
| URL paste + Salva | URL qualsiasi, no validazione provenienza |
| Wipe & rewrite | **Non** rigenera immagine se già presente |

---

### 34.6 Prompt reale ritratto AI (punto mandato §6)

#### Catena costruzione prompt

```
generateHistoricalPortrait(personName, categoryLabel, cityName)
  → getAiPrompt('vision_portrait_historical', { personName, categoryLabel, cityName }, FALLBACK)
      → ai_configs.key = 'vision_portrait_historical' (DB — seed NON in repo)
      → sostituzione {personName}, {categoryLabel}, {cityName}
      → alias legacy commentato: {role} = categoryLabel se presente in DB vecchio
  → aiGateway.generateLegacy({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: dbPrompt }] } })
```

#### Tabella dati — cosa entra nel prompt portrait

| Dato | Passato al modello? | Origine | Punto inserimento |
|------|---------------------|---------|-------------------|
| Nome | ✅ SÌ | Parametro / `{personName}` | Corpo prompt |
| Epoca | ❌ NO | — | — |
| Data nascita | ❌ NO | `city_people.birth_date` esiste ma non usato | — |
| Anno nascita | ❌ NO | `city_people.birth_year` | — |
| Data morte | ❌ NO | `city_people.death_date` | — |
| Anno morte | ❌ NO | `city_people.death_year` | — |
| is_living | ❌ NO | `city_people.is_living` | — |
| Professione | 🟡 Indiretto | Solo via `categoryLabel` risolto | `{categoryLabel}` |
| Ruolo | 🟡 = categoryLabel | `resolvePortraitCategoryLabel` o slug→label import | `{categoryLabel}` |
| Categoria master | ❌ NO | Solo label specific primaria | — |
| Specific category | 🟡 Indiretto | Label prima specifica attiva | `{categoryLabel}` |
| Descrizione | ❌ NO | — | — |
| Biografia | ❌ NO | Usata in prompt enrich/discovery, **non** portrait | — |
| Città | ✅ SÌ | Contesto Admin `{cityName}` | Corpo prompt |
| Luogo/contesto storico | 🟡 Minimo | Solo città nel prompt | `{cityName}` |
| Altri metadati | ❌ NO | famousWorks, quote, ecc. | — |

**Nota:** `isLiving`, date, bio **sono** usati in `prompts.ts` per discovery/enrich/recover dates (`PEOPLE_JSON_SCHEMA_HINT`, `buildRecoverPersonDatesPrompt`) — **pipeline separata** dal portrait.

#### Testo fallback effettivo (se DB vuoto)

**Primario:**
```
Genera un ritratto artistico (olio/affresco) di {personName}, {categoryLabel} a {cityName}. VISTA DI SPALLE O SILHOUETTE. VISO NON VISIBILE.
```

**Catch:**
```
Genera un ritratto artistico di {personName}, {categoryLabel} a {cityName}. Vista di spalle.
```

#### Significato prompt finale (leggibile)

Il modello riceve istruzioni di generare un'**illustrazione pittorica** (stile olio/affresco) del personaggio nominato, associato alla sua categoria professionale e alla città corrente, con **vincolo esplicito** di non mostrare il volto (vista di spalle o silhouette). **Non** riceve dati biografici strutturati, stato vivente/defunto, né descrizioni testuali del personaggio.

**Contenuto DB `ai_configs` per key `vision_portrait_historical`:** ⚪ **NON VERIFICATO** — dipende da dati runtime remoto; se assente si usa fallback hardcoded.

---

### 34.7 Policy attuale ritratto AI (punto mandato §7)

| Istruzione policy target | Presente oggi? | Evidenza |
|--------------------------|----------------|----------|
| Volto non visibile | ✅ SÌ | "VISO NON VISIBILE" nel fallback |
| Persona di spalle | ✅ SÌ | "VISTA DI SPALLE" / "Vista di spalle" |
| Silhouette | ✅ SÌ | "SILHOUETTE" nel fallback primario |
| Figura non fotorealistica | 🟡 PARZIALE | "artistico (olio/affresco)" — non dice esplicitamente "non fotorealistico" |
| Rappresentazione evocativa | 🟡 PARZIALE | Implicito via stile artistico + categoria |
| Evitare fotografia realistica | ❌ NO | Non esplicitato |
| Evitare somiglianza facciale precisa | 🟡 PARZIALE | Via "viso non visibile", non via testo anti-somiglianza |
| Epoca storica | ❌ NO | Date non passate |
| Abbigliamento storico | ❌ NO | Non nel prompt |
| Contesto monumenti/luoghi | 🟡 PARZIALE | Solo nome città |
| Differenza vivente/defunto | ❌ NO | `is_living` non nel prompt portrait |
| Istruzioni diritti/copyright | ❌ NO | — |
| Divieto imitare foto esistenti | ❌ NO | — |

**Gap vs policy futura Master Plan:** mancano metadato `generated_by_ai`, dicitura modale, divieti espliciti anti-fotorealismo/anti-imitazione, uso controllato di epoca/contesto biografico.

---

### 34.8 POI — gestione immagini attuale (punto mandato §8)

*(Integra sezione 10 con dettaglio forense)*

| Canale | Verificato | File |
|--------|------------|------|
| Upload manuale Admin | ✅ | `AdminImageInput.tsx` → `admin_uploads/` |
| URL esterno Admin | ✅ | `PoiMediaTab.tsx` / `AdminImageInput` |
| Placeholder categoria | ✅ | `resolvePoiDisplayImageUrl`, staging |
| Staging/OSM import | ✅ Placeholder URL | `stagingService.ts`, RPC promote |
| AI generazione cover | ❌ | — |
| AI copyright analysis | ✅ Hint licenza | `AdminImageInput.analyzeCopyright` — Gemini 2.0 flash |
| Photograph domain | ✅ Separato | `photo_submissions` — **non** cover POI |
| Galleria POI row-level | ❌ | `poiMapper.ts`: `gallery: []` hardcoded |
| Wikidata/P18/Commons | ❌ | Grep zero match codice applicativo |

**Metadati POI persistiti:** `image_url`, `image_status`, `image_credit`, `image_license` — migration `20260515_poi_media_metadata.sql`.

**Modale pubblico POI:** `PoiImageSection.tsx` — mostra immagine via resolver; **non** mostra credit/license verificato.

---

### 34.9 Placeholder (punto mandato §9)

| Dominio | Esiste placeholder dedicato? | Meccanismo |
|---------|------------------------------|------------|
| POI | ✅ SÌ | `global_settings.category_placeholders` + runtime |
| Personaggi famosi | ❌ **NO dedicato** | `ImageWithFallback` default `category='discovery'` |
| Patron | ✅ SÌ | `default_patron_image`, `resolvePatronDisplayImageUrl` |
| Platform UI | ✅ SÌ | `platformPlaceholderOrigin.ts` |

**Personaggi — dichiarazione esplicita:** **non esiste** placeholder specifico per macro-categoria personaggio (attore, calciatore, ecc.).

---

### 34.10 Metadati immagini — campi esistenti (punto mandato §10)

#### Per tabella/entità (verificato `supabase.ts` + codice)

| Campo | city_people | pois | cities | photo_submissions | famous_person_photo_suggestions |
|-------|-------------|------|--------|-------------------|--------------------------------|
| image_url | ✅ | ✅ | ✅ | ✅ | ✅ |
| image_storage_path | ✅ | ❌ | ❌ | ❌ | ✅ storage_path |
| image_credit | ❌ | ✅ | ✅ | ❌ | ❌ |
| image_license | ❌ | ✅ | ✅ | ❌ | ❌ |
| image_status / hero_status | ❌* | ✅ | ✅ | media_status | ❌ |
| image_is_placeholder | ✅ (unused app) | types only | — | — | ❌ |
| published_at | ❌ | ❌ | ❌ | ✅ | ❌ |
| rights_confirmed | ❌ | ❌ | ❌ | ❌ | ✅ |
| source_url | ❌ | ❌ | ❌ | ❌ | ❌ |
| original_url | ❌ | ❌ | ❌ | ❌ | ❌ |
| author/creator | ❌ | ❌ | ❌ | ❌ | ❌ |
| license_url | ❌ | ❌ | ❌ | ❌ | ❌ |
| attribution | ❌ | ❌ | ❌ | ❌ | ❌ |
| provenance | ❌ | ❌ | ❌ | ❌ | ❌ |
| retrieved_at | ❌ | ❌ | ❌ | ❌ | ❌ |
| generated_by_ai | ❌ | ❌ | ❌ | ❌ | ❌ |
| ai_model / prompt | ❌ | ❌ | ❌ | ❌ | ❌ |
| removed_at | ❌ | ❌ | ❌ | ❌ | ❌ |

*Tipo `FamousPerson` ha `image_status`/`imageAsset` ma **`saveCityPerson` non persiste** per personaggi.

#### Strutture generiche riutilizzabili

| Struttura | File | Riutilizzabile per? |
|-----------|------|---------------------|
| `MediaAsset` interface | `types/models/Media.ts` | Modello credit/license/status — estendibile |
| `parseMediaAsset()` | `cityReadService.ts` | Parser URL+status+credit+license |
| `MEDIA_STATUS_VALUES` | `constants/governance.ts` | ⚠️ Drift: include `ai_generated`, `needs_review` non in DB enum verificato |
| Community moderation RPC pattern | migrations 20260907-0813 | Atomic accept/block + snapshot |
| `getAssetUsageMap()` | `mediaService.ts` | Usage tracking — base orphan detection |
| `publicMediaPathFromUrl()` | `mediaService.ts` | Reverse path da URL |
| Patron gallery `approved_by/at` | `city_patron_gallery` | Pattern audit parziale |

---

### 34.11 Libreria Media ↔ city_people — relazione (punto mandato §11)

#### Domanda: `city_people.image_url` appare automaticamente in PEOPLE PORTRAITS?

**NO — automaticamente NO.**

| Scenario | In tab PEOPLE PORTRAITS? | In overlay IN USO? |
|----------|--------------------------|-------------------|
| URL punta a `.../people_portraits/...` e file ∈ top 100 | ✅ File listato; ✅ badge se URL match | ✅ |
| URL punta a `famous_person_photo_suggestions/...` | ❌ Cartella non in tab | ✅ badge "Person: name" |
| URL esterno (unsplash, ecc.) | ❌ | ✅ badge se URL in usageMap |
| File in `people_portraits/` senza riga city_people | ✅ Listato come INUTILIZZATO | ❌ |

**Percorso quando SÌ visibile:** file creato da AI → Storage list → tab; usageMap collega URL ↔ person name da `city_people`.

---

### 34.12 P18 / Wikidata — ricerca stato attuale (punto mandato §12)

**Ricerca eseguita** su `.ts`, `.tsx`, `.sql`, `.md` del repository:

| Termine | Match codice applicativo |
|---------|-------------------------|
| P18 | 0 |
| Wikidata | 0 |
| Wikimedia / Wikimedia Commons | 0 |
| Commons API / Wikidata API / SPARQL | 0 |
| "commons" | Solo UI "Creative Commons" in `AdminImageInput.tsx` |
| "wiki" | Non correlato (path asset esterni) |

**Dichiarazione esplicita: NON ESISTE integrazione Wikidata/P18/Wikimedia Commons nel repository.**

---

### 34.13 Infrastruttura media governance già sviluppata (punto mandato §13)

| Infrastruttura | Dove | Operativa? | Legacy/Incomplete? | Riutilizzabile Personaggi/POI? |
|----------------|------|------------|--------------------|--------------------------------|
| Presentation vs Photograph boundary | `AI_CONTEXT/16`, `domain/photos/*` | ✅ Operativa | Current | ✅ Mantenere separazione |
| POI media_status + credit + license | `pois`, `PoiMediaTab`, `poiWrite.ts` | ✅ Operativa | Current | 🟡 Estendere modello a Personaggi |
| City hero/card media_status | `cities`, `EditorMedia.tsx` | ✅ Operativa | Current | Pattern status |
| Community photo moderation | `photo_submissions`, `photoService.ts` | ✅ Operativa | Current | ❌ Non per presentation media |
| Famous person photo suggestions | RPC + `AdminFamousPeopleManager` | ✅ Operativa | Current | ✅ Parziale provenance |
| Famous person photo reports/abuse | RPC block + snapshot | ✅ Operativa | Current | ✅ Pattern snapshot |
| Patron gallery + suggestions | `city_patron_gallery`, patron services | ✅ Operativa | Current | ✅ Pattern gallery |
| Libreria Media Storage browser | `AdminAssetLibrary` | ✅ Operativa | Incomplete vs vision | 🟡 Evolvere, non duplicare |
| Asset Globali (design_assets) | `AdminHeaderManager` | ✅ Operativa | Current | Placeholder platform |
| AI copyright check POI | `AdminImageInput.analyzeCopyright` | ✅ Operativa | Hint only — non verifica strutturata | 🟡 Non sostituisce policy CC BY |
| getAssetUsageMap | `mediaService.ts` | ✅ Operativa | No history | ✅ |
| image_is_placeholder columns | DB types | ❌ Quasi unused | Legacy drift | Decidere deprecare o wire |
| MEDIA_STATUS ai_generated/needs_review | `governance.ts` | 🟡 Types only drift | Non allineato DB enum | Allineare prima di usare |
| Platform audit tables | `platform_control_audit` | ✅ Operativa | Non image-specific | ❌ |
| photoService duplicate uploadPublicMedia | `photoService.ts:59` | ⚠️ Duplicato | Legacy parallel impl | Usare `mediaService.ts` SoT |

**Funzionalità già sviluppate per scopo "media governance" ma non unificate:** moderazione community Personaggi, metadati POI parziali, usage map, status enum — **nessun sistema unico provenance/storico**.

---

### 34.14 Report strutturato obbligatorio (punto mandato §14 — sezioni A–I)

#### A. LIBRERIA MEDIA

- **Tab:** 9 tab Storage-only (vedi §34.1)
- **Ciascuno mostra:** max 100 file `.list()` dalla cartella, ordinati `created_at DESC`
- **Fonte dati:** bucket `public-media/{folder}` — zero SQL per listing
- **PEOPLE PORTRAITS:** legge **solo** cartella `people_portraits/`; **non** `city_people`; **non** galleria completa personaggi

#### B. PERSONAGGI

- **Origini immagine:** URL paste, cross-city reuse, AI Gemini, community accept — §34.2
- **findExistingPortrait:** globale per nome, limit 1, indeterminato — §34.4
- **city_people.image_url:** SoT display; scritto via saveCityPerson + RPC community
- **people_portraits:** solo output AI; cartella in `public-media`
- **Flussi:** 15 percorsi mappati in tabella §34.2

#### C. PROMPT AI

- **Dati passati:** nome, categoryLabel, cityName — §34.6
- **Prompt effettivo:** fallback hardcoded verificato in `aiVision.ts:174-177`
- **Regole volto/retro:** presenti; epoca/defunto: assenti — §34.7

#### D. POI

- **Flussi:** admin upload/URL, staging placeholder, runtime category fallback — §34.8
- **Placeholder:** ✅ category map
- **Wikidata/P18:** ❌ assente

#### E. PROVENIENZA E LICENZE

- **Presenti:** POI/cities credit+license; community rights_confirmed
- **Assenti:** source_url, attribution, retrieved_at, generated_by_ai, unified provenance — §34.10

#### F. COSA ESISTE GIÀ (riutilizzabile)

1. Stack AI portrait completo (Gemini + upload + quota handling)
2. `saveCityPerson` + RPC upsert atomico category links
3. `findExistingPortrait` (da migliorare, non duplicare)
4. Community foto Personaggi con RPC atomici
5. POI `image_status` + credit + license + AdminImageInput
6. Placeholder POI category map
7. `getAssetUsageMap` + Libreria Media browser
8. `MediaAsset` type + parsers
9. Filtri territoriali Admin (`GeoCascadingFilters`)
10. Moderation abuse/report con snapshot URL+path

#### G. COSA MANCA (lacune reali)

1. Integrazione Wikidata/P18/Commons — zero codice
2. Pipeline foto reali automatiche + policy CC BY
3. Provenance unificata Personaggi
4. Dicitura AI modale
5. Placeholder Personaggi macro-categoria
6. Storico immagini + motivazione rimozione
7. Accantonamento foto candidate
8. Admin file upload Personaggi
9. `image_storage_path` su upload AI
10. Orphan cleanup `people_portraits/`
11. Resolver priorità Admin→reale→AI→placeholder
12. Attribuzione modale pubblica POI/Personaggi
13. Galleria Libreria Media completa personaggi
14. Tab/cartella community suggestions in Libreria
15. Paginazione Libreria (>100 file)

#### H. RISCHI / PUNTI DA VERIFICARE

| # | Punto | Stato |
|---|-------|-------|
| 1 | Contenuto DB `ai_configs.vision_portrait_historical` | ⚪ NON VERIFICATO runtime |
| 2 | RPC upsert — DB remoto + PostgREST | ✅ Verificati; POST E2E applicativo reale ⚪ non eseguito |
| 3 | RLS Storage cartella `people_portraits/` | ⚪ NON VERIFICATO (0 policy in migration grep) |
| 4 | Ordine `findExistingPortrait` limit 1 | 🔴 Indeterminato — rischio URL sbagliato |
| 5 | Delete file Libreria con URL ancora in city_people | 🔴 Link rotti |
| 6 | `MEDIA_STATUS_VALUES` drift vs DB | 🟡 Da allineare |
| 7 | `photoService.uploadPublicMedia` duplicato | 🟡 Quale SoT? |
| 8 | AI copyright POI presentato come "safe" | 🔴 Falsa sicurezza possibile |

#### I. MAPPA FINALE DEI FLUSSI

##### PERSONAGGI — stato attuale verificato

```
FOTO REALE ESISTENTE?
  → findExistingPortrait (city_people globale per nome)
  → da dove? altra riga city_people qualsiasi città
  → controllo diritti? ❌ NO
  → download? ❌ NO (riusa URL esistente)
  → Storage? solo se URL già punta a nostro Storage
  → city_people.image_url? ✅ SÌ (copia URL)
  → Libreria Media? solo se URL in people_portraits/ e file listato

Se findExistingPortrait null:
  → AI generateHistoricalPortrait
  → prompt? nome + categoryLabel + cityName (fallback anti-volto)
  → dati biografici? ❌ non nel prompt
  → Storage? ✅ people_portraits/
  → city_people.image_url? ✅
  → Libreria Media? ✅ file in tab (se top 100)

Se AI fallisce (null/quota):
  → placeholder Personaggi dedicato? ❌ NO
  → fallback display? ImageWithFallback category='discovery'
  → publish gate? imageUrl required — resta draft incompleto

Percorso parallelo COMMUNITY FOTO:
  → upload famous_person_photo_suggestions/
  → Admin accept RPC
  → city_people.image_url + image_storage_path
  → Libreria Media? ❌ cartella non in tab

Percorso ADMIN URL PASTE:
  → qualsiasi URL → city_people.image_url
  → nessuna validazione provenienza
```

##### POI — stato attuale verificato

```
IMMAGINE ESISTENTE?
  → Admin upload admin_uploads/ O URL esterno O staging placeholder
  → controllo diritti? 🟡 AI copyright hint opzionale (non strutturato)
  → download foto esterne? ❌ NO (salva URL)
  → Storage? ✅ se upload Admin
  → pois.image_url + image_status + credit + license
  → Libreria Media? solo se file in cartella tab corrispondente (es. admin_uploads NON ha tab dedicato — tab ADMIN ASSETS è admin_assets non admin_uploads)

Placeholder:
  → resolvePoiDisplayImageUrl → category_placeholders
  → image_status='placeholder' su reset Admin

Wikidata/P18: ❌ assente
AI cover: ❌ assente
```

---

*Fine sezione 34 — audit forense cumulativo. Nessun file codice modificato in questa attività.*

---

## 35. Sistema di segnalazione delle immagini (audit verificato — revisione 2026-09-14)

> **Metodo:** lettura diretta codice e migration SQL.  
> **Master Plan:** §31 e Appendice E.  
> **Regola:** distinzione netta tra **esistente verificato**, **parziale**, **mancante**, **obiettivo approvato**.

### 35.1 Executive summary — segnalazioni

| Area | Stato | Sintesi |
|------|-------|---------|
| Segnalazione Personaggi — infrastruttura base | 🟡 PARZIALE | Modale + tabella + Admin tab esistono; richiede auth; no sospensione auto |
| Segnalazione Personaggi — obiettivi revisione 2026-09-14 | 🔴 MANCANTE / DA SVILUPPARE | Guest email OTP, sospensione auto, UX rename, ripristino su rigetto |
| Segnalazione POI | 🔴 MANCANTE | Nessuna tabella/servizio/modale POI image report verificato |
| ~~Email pubblica configurabile~~ | ✅ **NON APPLICABILE** | **D88** — non prevista; assenza nel codice è corretta |
| Storico contestazioni completo | 🔴 **GAP IMPLEMENTATIVO** | Schema tecnico `content_reports` **chiuso** (§42.4); implementazione MF2/MF3 |

---

### 35.2 Personaggi Famosi — sistema esistente verificato

#### Componenti UI

| Componente | Path | Ruolo |
|------------|------|-------|
| Modale segnalazione | `src/components/modals/ReportFamousPersonPhotoAbuseModal.tsx` | Form segnalazione foto ufficiale |
| Trigger community | `src/components/modals/CultureCornerCommunity.tsx` | Pulsante "Segnala abuso" |
| Host modale | `src/components/modals/CultureCornerModal.tsx` | Integrazione Culture Corner |
| Gestione Admin | `src/components/admin/AdminFamousPeopleManager.tsx` | Tab `reports` — "Segnalazione Abuso" |

**Nota Admin routing:** le segnalazioni foto Personaggi sono in **Personaggi Famosi** (`AdminDashboard` → `famous_people` → `AdminFamousPeopleManager`), **non** nella voce sidebar Community **"Segnalazioni"** (`suggestions` → `SuggestionManager` — dominio diverso: suggerimenti POI/contenuti).

#### Servizio applicativo

**File:** `src/services/famousPerson/famousPersonPhotoReportService.ts`

| Funzione | Comportamento verificato |
|----------|-------------------------|
| `createFamousPersonPhotoReport` | Insert in `famous_person_photo_reports`; **richiede auth** (`supabase.auth.getUser()`) |
| `listFamousPersonPhotoReportsForAdmin` | Lista report per Admin |
| `rejectFamousPersonPhotoReport` | Status → `rejected` |
| `blockFamousPersonPhotoReportAndClearOfficialPhoto` | RPC atomica — **rimuove** foto ufficiale se coincide con snapshot |

#### Database

**Tabella:** `public.famous_person_photo_reports`  
**Migration:** `supabase/migrations/20260827140000_famous_person_community_moderation.sql`

| Colonna | Uso |
|---------|-----|
| `person_id` | Personaggio |
| `person_image_url` | **Snapshot URL immagine segnalata** |
| `person_image_storage_path` | **Snapshot path Storage** |
| `reporter_user_id` / `reporter_user_name` | Segnalante autenticato |
| `reason` | `copyright` \| `other_rights` \| `unauthorized` \| `other` |
| `notes` | Note libere segnalante |
| `status` | `pending` \| `in_review` \| `photo_blocked` \| `rejected` |
| `admin_notes` | Note Admin |

**RLS insert:** policy `fp_photo_reports_insert_authenticated` — **solo utenti autenticati**; validazione che snapshot coincida con `city_people.image_url` + `image_storage_path` correnti al momento insert.

#### Flusso utente attuale (verificato)

```
Culture Corner → "Segnala abuso"
  → ReportFamousPersonPhotoAbuseModal
  → if guest: messaggio "Accedi per segnalare" + pulsante Accedi
  → if authenticated:
      → anteprima immagine (img src=photo.imageUrl) ✅
      → scelta motivo + note
      → createFamousPersonPhotoReport
      → status pending
      → IMMAGINE RESTA PUBBLICATA ❌ (no sospensione automatica)
```

#### Flusso Admin attuale (verificato)

```
AdminFamousPeopleManager → tab reports
  → filtri: pending | in_review | photo_blocked | rejected | all
  → azioni:
      → "In revisione" (pending → in_review)
      → "Rifiuta segnalazione" → rejectFamousPersonPhotoReport (status rejected)
      → "Blocca foto" → blockFamousPersonPhotoReportAndClearOfficialPhoto
           → RPC azzera city_people.image_url + image_storage_path SE coincide snapshot
           → status photo_blocked
```

**Distinzione importante:** la **rimozione** foto avviene solo su **azione Admin "Blocca foto"**, **non** all'invio della segnalazione.

**RPC:** `block_famous_person_photo_report_and_clear` — migration `20260907120000_block_famous_person_photo_report_atomic.sql`

#### Cosa il sistema esistente soddisfa già (riutilizzabile)

| Requisito Master Plan §31 | Stato |
|---------------------------|-------|
| Riutilizzo infrastruttura esistente | 🟢 Base presente |
| Segnalazione legata a immagine specifica (snapshot URL+path) | 🟢 Parziale — snapshot al momento insert |
| Anteprima immagine nel modale | 🟢 Presente (linee 290–295 modal) |
| Motivi copyright/diritti/provenienza | 🟢 Parziale — enum reason copre copyright/rights |
| Conservazione segnalazione dopo decisione | 🟢 Record non cancellato |
| Gestione Admin | 🟢 Tab reports in AdminFamousPeopleManager |
| Utente autenticato — associazione account | 🟢 reporter_user_id |

#### Gap vs obiettivi approvati (Master Plan §31)

| Requisito | Stato Audit |
|-----------|-------------|
| Pulsante "Segnala abuso" (terminologia definitiva) | 🟢 Presente Personaggio/Patrono — estendere ad altri punti UI §36.2 |
| Modale tipologia Immagine/Personaggio + note obbligatorie | 🔴 Assente — oggi solo motivo+note opzionali |
| Guest senza registrazione | 🔴 Oggi: login obbligatorio |
| Email + codice verifica guest | 🔴 Assente |
| Sospensione automatica post-segnalazione | 🔴 Assente — immagine resta visibile |
| Rigetto Admin → ripristino immagine sospesa | 🔴 N/A oggi (no sospensione); reject non ripristina nulla |
| Conferma → motivazione obbligatoria | 🟡 Parziale — admin_notes opzionali su block/reject |
| Motivazioni integrabili senza cancellare storia | 🟡 Solo campo `admin_notes` singolo — no audit append |
| Collegamento metadati provenienza immagine | 🔴 Assente — snapshot URL/path only |
| Pulsante nel modale dettaglio personaggio (non solo community tab) | ⚪ DA VERIFICARE — oggi trigger principalmente CultureCornerCommunity |

---

### 35.3 POI — segnalazione immagini

**Verifica eseguita:** grep `poi_image_report`, `ReportPoi`, segnalazione immagine POI in `.ts`/`.tsx`/`.sql`.

| Risultato | Dettaglio |
|-----------|-----------|
| Tabella report immagine POI | 🔴 **NON TROVATA** |
| Modale "Segnala" su POI cover | 🔴 **NON TROVATO** |
| Servizio dedicato | 🔴 **NON TROVATO** |

**Riferimenti correlati ma NON equivalenti:**

| Sistema | Scope | File |
|---------|-------|------|
| `SuggestionManager` / sidebar "Segnalazioni" | Suggerimenti contenuto POI generici | `AdminDashboard` case `suggestions` |
| `PoiClaimModal` | Claim POI | Non segnalazione copyright immagine |
| `ReportPatronPhotoAbuseModal` | Galleria **Patron** | Sistema separato — `patron_photo_reports` |

**Conclusione POI:** **non esiste** oggi gestione segnalazione immagine POI equivalente a Personaggi. Obiettivo Master Plan §31.12: **estendere** sistema Personaggi.

---

### 35.4 UX — direzione approvata vs implementazione

| Elemento | Implementato oggi | Obiettivo approvato |
|----------|-------------------|---------------------|
| Terminologia comando | 🟢 "Segnala abuso" già in modali Personaggio/Patrono | Confermato Master Plan D30 |
| Modale target (tipologia, note obbligatorie) | 🔴 Assente | Da implementare §36.5 |

**NON dichiarare** funzionalità target come già implementate.

---

### 35.5 Utenti autenticati vs non autenticati

#### Autenticato — verificato

- `createFamousPersonPhotoReport` verifica `user.id === input.reporterUserId`
- Nome da `profiles.name` obbligatorio
- **Non** richiede re-inserimento email se già in account ✅ (coerente con obiettivo)

#### Non autenticato — gap

- Modale mostra solo "Accedi per segnalare un abuso" + `onOpenAuth`
- **Nessun** flusso email + codice verifica
- SMS/telefono: **assente** (corretto — non obbligatorio ora)

---

### 35.6 Sospensione automatica — gap critico

**Obiettivo approvato (Master Plan §31.7):** segnalazione valida → immagine sospesa automaticamente.

**Stato verificato:** 🔴 **NON IMPLEMENTATO**

Evidenza:

- `createFamousPersonPhotoReport` esegue solo `INSERT` con `status: 'pending'`
- **Nessun** update su `city_people.image_url`, flag sospensione, o `image_status`
- Personaggio resta `published` con immagine visibile

**Implicazione:** oggi l'Admin deve agire manualmente ("Blocca foto") per rimuovere l'immagine — diverso dal flusso target post-revisione.

---

### 35.7 Decisione Admin — stato attuale vs obiettivo

| Azione obiettivo | Esistente oggi | Gap |
|------------------|----------------|-----|
| A. Rigetta → ripristina immagine | `reject` → status `rejected` only | 🔴 No ripristino (no sospensione preliminare) |
| B. Conferma → rimuove + motivazione | `block` RPC → clear URL + `photo_blocked` | 🟡 Motivazione in `admin_notes` non obbligatoria a livello UI/DB |
| Note integrative successive | Campo `admin_notes` singolo | 🟡 No storico append-only motivazioni |

---

### 35.8 Conservazione segnalazione e storico

| Capacità | Stato |
|----------|-------|
| Report non eliminato su reject/block | 🟢 Verificato — UPDATE status, no DELETE |
| OK = chiusura senza cancellazione dati (D56) | 🔴 Gap — requisito approvato §37.2; implementazione incompleta |
| Fotografia esatta consultabile post-sostituzione (D57) | 🔴 Gap — oggi solo URL/path §37.3 |
| Ricostruzione catena completa (provenienza → segnalazione → decisione) | 🔴 Gap — manca modello provenienza + storico immagine (§15, §16 Audit) |
| Schema DB storico contestazioni | 🔧 **Tecnica chiusa** — **§42.4** `content_reports`; implementazione MF2/MF3 |

---

### 35.9 Canale segnalazioni — esclusivamente modale (D88)

**Decisione funzionale definitiva (Master Plan §31.10, D88):** **nessuna** email pubblica per le segnalazioni. Canale **unico** = modale **Segnala abuso**.

| Requisito | Stato repository | Nota |
|-----------|------------------|------|
| Modale Segnala abuso (Personaggio/Patrono parziale) | 🟡 Parziale | Modali legacy — unificazione MF2 |
| Guest email + OTP nel modale | 🔴 Assente | **D85** — MF2 |
| Email pubblica / contatto esterno / settings Admin | ✅ **Non richiesto** | **D88** — **non** implementare |
| Email guest nel modale = identificazione segnalante | 🔴 Assente | **≠** email pubblica |

**Verifica grep (2026-09-16):** nessuna «email pubblica segnalazioni» attesa nel codice — la sua assenza è **corretta** per design.

---

### 35.10 Tutela e provenienza — collegamento segnalazione

**Stato attuale:** report Personaggi conserva solo snapshot `person_image_url` + `person_image_storage_path` + metadati segnalante/motivo.

**Assenti nel flusso segnalazione:**

- fonte, licenza, autore, retrieved_at, verification_status, published_at, image_origin

**Coerenza Audit §13–§14:** gap provenienza **amplifica** il gap su contestazioni — obiettivo §31.13 richiede collegamento quando metadati esisteranno (Macrofase 3).

**Limite:** tracciabilità migliorata **≠** garanzia legale (Master Plan D27, §31.13).

---

### 35.11 Principio — non costruire da zero

| Asset esistente riutilizzabile | Path |
|-------------------------------|------|
| Modale segnalazione | `ReportFamousPersonPhotoAbuseModal.tsx` |
| Service CRUD + block RPC | `famousPersonPhotoReportService.ts` |
| Tabella + RLS | `famous_person_photo_reports` |
| Admin moderation UI | `AdminFamousPeopleManager.tsx` (tab reports) |
| Pattern snapshot immagine | RPC block + RLS insert validation |
| Pattern analogo Patron (reference) | `ReportPatronPhotoAbuseModal.tsx`, `patron_photo_reports` |

**Direzione approvata:** evolvere/estendere — **non** duplicare.

---

### 35.12 Gap Analysis — segnalazioni vs Master Plan §31

| Obiettivo §31 | Già soddisfatto | Parziale | Non soddisfatto |
|---------------|-----------------|----------|-----------------|
| Meccanismo segnalazione accessibile | | 🟡 solo auth | Guest |
| Riutilizzo sistema Personaggi | 🟢 base | | |
| UX "Segnala abuso" (terminologia definitiva) | 🟢 titolo modale oggi | | Estensione punti UI |
| Immagine specifica + anteprima | | 🟢 | |
| Guest email OTP | | | 🔴 |
| Sospensione automatica | | | 🔴 |
| Admin rigetta/ripristina | | | 🔴 |
| Admin conferma + motivazione obbligatoria | | 🟡 | |
| Conservazione segnalazione | 🟢 | | |
| Storico completo contestazione | | | 🔴 Gap implementativo — schema **§42.4** chiuso; MF2/MF3 |
| ~~Email pubblica configurabile~~ | ✅ **Non applicabile** | | **D88** — eliminata |
| Pulsante in modale immagine | | 🟡 community | Estensione modale dettaglio |
| POI stesso impianto | | | 🔴 |
| Admin centralizzato Personaggi+POI | | 🟡 solo Personaggi | Tab POI |
| Collegamento provenienza | | | 🔴 |

---

### 35.13 Piano sviluppo proposto (solo documentale — NON implementare)

| Step | Intervento | Dove | Dipendenze |
|------|------------|------|------------|
| 1 | ~~Rinomina "Segnala immagine"~~ **ANNULLATO** — mantenere "Segnala abuso" (Master Plan D30) | — | — |
| 2 | Stato `suspended` immagine + auto-suspend on valid report | DB migration + service + display resolver | Modello stato immagine (Q2) |
| 3 | Guest OTP (scelta tecnica post-verifica Supabase — §36.6) | Nuovo modulo + modal branch | Q26 |
| 4 | Admin reject → restore suspended image | `AdminFamousPeopleManager` + service | Step 2 |
| 5 | Motivazione obbligatoria on confirm block | Admin UI + RPC validation | Step 2 |
| 6 | Extend to POI — `content_reports` unificato | POI modal + Admin tab | §42.4 (MF2) |
| 7 | Link report ↔ provenance metadata | Entity image metadata (Macrofase 3) | Q2, §17 |

---

### 35.14 Verifiche post-sviluppo e gap implementativi (non decisioni funzionali)

| Tema | Tipo | Riferimento |
|------|------|-------------|
| Smoke test POST E2E RPC | ⚪ **VERIFICA POST-SVILUPPO** | **Q10** — MF5 staging |
| Schema/storico segnalazioni | 🔧 Tecnica chiusa · 🔴 Gap codice | **Q19**, **§42.4** — MF2/MF3 |
| Modello dati immagini | 🔧 Tecnica chiusa · 🔴 Gap codice | **Q2**, **§42.1–§42.2** |
| Placeholder Personaggi (Q9) | ✅ **Decisione chiusa** · 🔴 Asset MF1 | **D89** — Asset Globali |

---

*Fine sezione 35 — audit segnalazione immagini (cumulativo). Vedi §36 per piano operativo 2026-09-15.*

---

## 36. Infrastruttura centrale Segnalazioni — audit operativo (revisione 2026-09-15)

> **Master Plan:** §3.9, §32–§38, Appendice F.  
> **Metodo:** audit reale repository — nessun codice modificato in questa attività.  
> **Formato interventi:** PROBLEMA → DESIDERATO → SOLUZIONE → FILE → DB → DIPENDENZE → MACROFASE → TEST E2E.

### 36.0 Regola di lavoro futura (documentata)

| Regola | Riferimento |
|--------|-------------|
| Max **5 macrofasi** | Master Plan §38 |
| Ogni macrofase: **SVILUPPO** → **TEST** | Master Plan §3.9 |
| Test E2E post-sviluppo: click-per-click, no ricostruzione artificiale | Master Plan §3.9; Audit §36.10 |
| Lettura obbligatoria Master Plan + Audit prima di ogni macrofase | Master Plan §3.9 |
| Mappatura file obbligatoria per intervento | Questa sezione |

### 36.1 Admin Panel — stato attuale vs target

#### Navigazione attuale (verificata)

| Voce sidebar | ID | Componente | Gruppo | File |
|--------------|-----|------------|--------|------|
| Segnalazioni | `suggestions` | `SuggestionManager` | Community | `AdminSidebar.tsx` L285–290; `AdminDashboard.tsx` L342–343 |
| Personaggi Famosi | `famous_people` | `AdminFamousPeopleManager` | Territorio | L198–204; L352–353 |
| Santo Patrono | `patron_saint` | `AdminPatronSaintManager` | Territorio | L191–197; L350–351 |
| Foto & Moderazione | `photos` | `PhotoModeration` | Community | L298–304; L368–369 |

> **Nota (§40.4):** **Foto & Moderazione** = moderazione **upload** `photo_submissions` — **fuori scope** AI Image Management; **≠** Abuso Foto Community (MF2).

**Badge counts** (`AdminDashboard.tsx` L186–247):

| Badge | Service | Tabella/logica |
|-------|---------|----------------|
| `counts.suggestions` | `getPendingSuggestionCount()` | `suggestions.status = pending` |
| `counts.famousPeople` | `getPendingFamousPeopleAdminCount()` | somma suggestion+report Personaggi |
| `counts.patronSaint` | `getPendingPatronSaintAdminCount()` | somma suggestion+report Patrono |
| `counts.photos` | `getPendingPhotoCount()` | `photo_submissions.status = pending` |

#### Target Master Plan §32

```
Admin Panel → SEGNALAZIONI
├── COMMUNITY (Luoghi suggeriti | Errori segnalati | Abuso POI | Abuso foto Community [Live | Galleria])
├── SANTO PATRONO (Abuso personaggio | Abuso foto | Suggerimento foto | Suggerimento personaggio)
├── PERSONAGGIO FAMOSO (idem)
└── AI (Patrono | Personaggio | POI — coda VERIFICARE IMMAGINE AI)
```

#### Gap strutturale

| Elemento | Stato | Evidenza |
|----------|-------|----------|
| Hub unificato 4 macro-tab | 🔴 MANCANTE | Nessun componente equivalente |
| Micro-tab Community | 🔴 MANCANTE | `SuggestionManager` lista unica senza sotto-tab |
| Segnalazioni Personaggi in hub | 🟡 PARZIALE | In `AdminFamousPeopleManager` tab `reports` |
| Segnalazioni Patrono in hub | 🟡 PARZIALE | In `AdminPatronSaintManager` tab `reports` |
| Macro-tab AI | 🔴 MANCANTE | Nessuna coda VERIFICARE IMMAGINE AI |

**INTERVENTO proposto — shell hub Segnalazioni**

| Campo | Valore |
|-------|--------|
| PROBLEMA | Gestione frammentata su 4+ voci Admin |
| DESIDERATO | Un hub con 4 macro-tab §32 |
| FILE DA MODIFICARE | `AdminDashboard.tsx` (case `suggestions` → nuovo manager); `AdminSidebar.tsx` (badge unificato); **nuovo** `AdminReportsHub.tsx` (o evoluzione `SuggestionManager`) |
| ALTRI FILE | `AdminFamousPeopleManager.tsx`, `AdminPatronSaintManager.tsx` — estrarre tab in sotto-componenti riusabili |
| DIPENDENZE | Schema stati + `content_reports` §42.4; Macrofase 1–2 |
| MACROFASE | 1 — SVILUPPO |
| TEST E2E | Login Admin → Segnalazioni → verificare 4 macro-tab; badge conteggio coerente con voci NUOVE |

---

### 36.2 COMMUNITY — mappatura verificata

#### LUOGHI SUGGERITI / ERRORI SEGNALATI — oggi

| Aspetto | Verificato |
|---------|------------|
| Tabella | `suggestions` — `suggestionService.ts` |
| Tipi enum | `new_place`, `edit_info`, `history_culture` — `governance.ts` L114 |
| Admin UI | `SuggestionManager.tsx` — **unica lista**; filtri status `pending/processing/approved/rejected/all` |
| Etichetta tipo UI | Solo `new_place` → "Nuovo Luogo"; **tutto il resto** → "Correzione" L197–199 |
| Filtro per tipo | 🔴 **ASSENTE** — `history_culture` e `edit_info` non distinguibili in Admin |

**PROBLEMA:** Admin non separa "Luoghi suggeriti" vs "Errori segnalati" — tutto in un flusso.

**DESIDERATO:** Micro-tab separati §32.2.

**FILE:** `SuggestionManager.tsx`; eventuale split `CommunityPlacesSuggestionsTab.tsx` + `CommunityErrorsReportedTab.tsx`.

#### Modale pubblico errori — `SuggestionModal.tsx`

| Requisito Master Plan | Stato |
|-----------------------|-------|
| Tendina POI obbligatoria, iniziale `---` | 🔴 **ASSENTE** |
| Per `edit_info`: `poiId` da match nome POI L186–188 | 🟡 Parziale — solo se titolo coincide esattamente |
| Guest | Richiede login L275–290 |

**FILE DA MODIFICARE:** `SuggestionModal.tsx` — aggiungere `<select>` POI obbligatorio; validazione submit.

**Anche:** `CityDetailContent.tsx` L260+ (apertura modale con `existingPois`); `PoiClaimModal.tsx` L77–98 (report tab usa `addSuggestion` edit_info — **non** Segnala abuso centrale).

#### ABUSO FOTO COMMUNITY

| Punto UI | Segnala abuso | File |
|----------|---------------|------|
| City Gallery tab | 🔴 ASSENTE | `CityGallery.tsx`, `GalleryGrid.tsx`, `GalleryLightbox.tsx` |
| Community Live | 🔴 ASSENTE | nessun componente report in `src/components/community/` |
| Home Esplora → preview foto | 🔴 ASSENTE | `HomeContent.tsx` → `SectionPreviewModal` → `PreviewGallery.tsx` |
| Admin **Foto & Moderazione** (moderazione upload) | 🟢 ESISTE — **fuori scope** AI Image Management | `PhotoModeration.tsx` — **≠** abuso foto pubblicate (§40.4) |

**Tabella dati foto Community:** `photo_submissions` — status `pending/approved/rejected/city_deleted`.

**INTERVENTO:** estendere modello centrale §33 con `source_context`: `community_live` | `city_gallery`; servizio su `content_reports` (§42.4 — MF2).

**MACROFASE:** 2.

#### ABUSO POI vs Rivendica

| Flusso | File | Tabella | Rischio regressione |
|--------|------|---------|---------------------|
| **Rivendica** sponsor | `PoiClaimModal.tsx` tab `gold/silver/shop` | `sponsor_requests` | **NON TOCCARE** |
| **Segnala errore** POI | `PoiClaimModal.tsx` tab `report` | `suggestions` edit_info | Migrare a Segnala abuso §33 senza rompere tab sponsor |

**TEST E2E regressione Rivendica:** POI esistente → Rivendica → tab Gold → modale sponsor si apre → nessun errore console.

---

### 36.3 SANTO PATRONO — mappatura verificata

#### Admin oggi — `AdminPatronSaintManager.tsx`

| Tab attuale | Label | Contenuto |
|-------------|-------|-----------|
| `suggestions` | Segnalazioni foto | `patron_photo_suggestions` |
| `reports` | Segnalazioni abuso | `patron_photo_reports` |

**Mancanti vs target §32.5:** Abuso personaggio · Suggerimento personaggio (completo) — 🔴 non come micro-tab distinti.

#### Modale pubblico abuso foto — `ReportPatronPhotoAbuseModal.tsx`

| Campo | Stato |
|-------|-------|
| Titolo "Segnala abuso" | 🟢 L169 |
| Guest → Accedi | 🟢 L186–189 |
| Note | Opzionali L244 — **gap** (Master Plan: sempre obbligatorie) |
| Tipologia Immagine/Personaggio | 🔴 ASSENTE |
| Snapshot gallery photo | 🟢 `gallery_photo_id`, URL, path |

#### Stati Patrono (Master Plan §34.2, D72)

| Requisito | Stato repository |
|-----------|------------------|
| Colonna dedicata `cities.patron_editorial_status` (DRAFT/PUBLISHED/SUSPENDED/CANCELED) | 🔴 **Assente** — decisione **chiusa**; **NON** usare `patron_details` JSON |
| DRAFT/SUSPENDED → **SUGGERISCI** in pagina pubblica | 🔴 Gate assente in `PatronSaintModal` — implementazione **MF1** |
| NEEDS_CHECK su Patrono | N/A — **non** applicabile (decisione chiusa) |

**FILE coinvolti futuri:** `AdminPatronSaintManager.tsx`; modelli Patrono in `City.ts`; componenti città `CulturePatron.tsx`, `PatronSaintModal.tsx`.

**MACROFASE:** 1 (stati) + 2 (segnalazioni).

---

### 36.4 PERSONAGGIO FAMOSO — mappatura verificata

#### Admin oggi — `AdminFamousPeopleManager.tsx`

| Tab | Label | Service/table |
|-----|-------|---------------|
| `categories` | Categorie Personaggi | `AdminFamousPeopleCategoriesManager` embedded |
| `person_suggestions` | Suggerimento Personaggio | `famous_person_suggestions` |
| `photo_suggestions` | Suggerimento Foto | `famous_person_photo_suggestions` |
| `reports` | Segnalazione Abuso | `famous_person_photo_reports` |

**Mancante:** tab "Abuso personaggio" separato da "Abuso foto" — oggi solo abuso **foto**.

#### Modale pubblico — `ReportFamousPersonPhotoAbuseModal.tsx`

| Campo | Stato |
|-------|-------|
| Titolo "Segnala abuso" | 🟢 L264–265 |
| Anteprima immagine | 🟢 L290–295 |
| Auth obbligatoria guest | 🟢 L275–282 |
| Tipologia / note obbligatorie | 🔴 ASSENTE |
| Trigger | `CultureCornerCommunity.tsx` L83 "Segnala abuso" |

#### Migrazione categorie → Edit Città → Storia

| Elemento | File attuale | Target |
|----------|--------------|--------|
| Categorie embedded | `AdminFamousPeopleManager.tsx` L556–557 | `TabCulture.tsx` / `CulturePeople.tsx` |
| Pattern Tassonomia POI | `EditorInfo.tsx` L136–143 overlay + `AdminTaxonomyManager` | Replicare per `AdminFamousPeopleCategoriesManager` |
| Tab Storia | `AdminCityEditor.tsx` tab `culture` label "Storia" L54 | Host pulsante CATEGORIA PERSONAGGIO |

**Riferimenti da migrare prima di rimuovere menu:**

- `AdminSidebar.tsx` id `famous_people`
- `AdminDashboard.tsx` route `/admin/famous_people`
- Badge `counts.famousPeople` — spostare logica su hub Segnalazioni

**Grep consigliato pre-rimozione:** `famous_people`, `AdminFamousPeopleManager`, `navigate.*famous`

**MACROFASE:** 1.

---

### 36.5 Modello centrale Segnala abuso — gap vs modale target

| Requisito §33 | Personaggio | Patrono | POI | Community foto |
|---------------|-------------|---------|-----|----------------|
| Comando "Segnala abuso" | 🟢 | 🟢 gallery | 🔴 | 🔴 |
| Tipologia Immagine/Personaggio | 🔴 | 🔴 | 🔴 | 🔴 |
| Motivazione 4 valori | 🟢 enum | 🟢 | 🔴 | 🔴 |
| Note sempre obbligatorie | 🔴 | 🔴 | 🔴 | 🔴 |
| Guest email+OTP | 🔴 | 🔴 | 🔴 | 🔴 |
| Sospensione immediata oggetto segnalato (§34.4–§34.7) | 🔴 | 🔴 | 🔴 | 🔴 |

**SOLUZIONE concettuale:** generalizzare `ReportFamousPersonPhotoAbuseModal` → `ReportAbuseModal` con props `entityType`, `entityId`, `imageSnapshot`, `allowedTypologies`.

**FILE candidati base:**

- `src/components/modals/ReportFamousPersonPhotoAbuseModal.tsx` — evolvere
- `src/services/famousPerson/famousPersonPhotoReportService.ts` — pattern CRUD
- Migration `content_reports` — schema **§42.4 chiuso**; implementazione **MF2**

**MACROFASE:** 2.

---

### 36.6 Login / Guest / OTP — audit Supabase (aggiornato 2026-09-15)

**Decisione di progetto (Master Plan §33.6):**

- Utente loggato: **no** reinserimento email
- Guest: segnalazione **senza** registrazione; email + OTP/codice obbligatori
- **Tecnologia non fissata** — scelta autonoma in sviluppo dopo verifica Supabase
- Priorità: sicurezza → anti-spam → semplicità → integrazione → minima complessità
- Se Supabase nativo adeguato → preferirlo

| Componente | Stato repository | File |
|------------|------------------|------|
| Client OTP guest segnalazioni | 🔴 **ASSENTE** | nessun `signInWithOtp` in `src/` |
| Dev login OTP (non produzione) | 🟢 solo dev | `server/routes/auth.routes.ts` L6–93 |
| Prod dev login | 🔴 403 | L94–98 |
| Supabase config OTP | 🟢 config only | `supabase/config.toml` L226–228 |

**NON dichiarare OTP guest come implementato.** Il dev server OTP **≠** requisito finale produzione.

**GAP implementativo:** flusso guest completo — **Macrofase 2** (Q26 / §42.12: scelta tecnica **chiusa**, Supabase OTP preferito).

---

### 36.7 Stati — gap DB/codice vs Master Plan §34

#### Segnalazioni oggi

| Dominio | Stati attuali | Target |
|---------|---------------|--------|
| `famous_person_photo_reports` | `pending`, `in_review`, `photo_blocked`, `rejected` | NUOVO, IN VERIFICA, OK, KO |
| `patron_photo_reports` | idem | idem |
| `suggestions` | `pending`, `processing`, `approved`, `rejected` | NUOVO, IN VERIFICA, OK, KO (+ POI nuovo/modifica) |
| `photo_submissions` | `pending`, `approved`, `rejected`, `city_deleted` | distinto — moderazione upload |

**MIGRATION necessaria:** mapping enum + transizioni Admin UI.

#### Entità oggi

| Entità | Campo status | Valori oggi | Target (D39 — vocabolario canonico) |
|--------|--------------|-------------|-------------------------------------|
| `city_people` | `status` | `published`, `draft` | + **SUSPENDED**, **CANCELED** |
| `pois` | `status` | `published`, `draft`, `needs_check` | + **SUSPENDED**, **CANCELED**; **NEEDS_CHECK** già presente (solo POI) |
| Santo Patrono | — | **nessuno** | **`cities.patron_editorial_status`** (D72) — **NON** `patron_details` |

#### Immagini oggi

| Campo | Valori oggi | Target |
|-------|-------------|--------|
| `pois.image_status` | enum `real`, `placeholder`, `missing` | + ATTIVO, SOSPESO, RIPRISTINATO, SOSTITUITO, RIMOSSO, VERIFICARE IMMAGINE AI |
| `city_people` | no `image_status` dedicato | estensione schema Q2 / assignments MF2 |
| Governance drift | `MEDIA_STATUS_VALUES` include `ai_generated`, `needs_review` non in DB enum | allineare — Audit §32 Q10 |

**MACROFASE:** 1 (stati base) + 3 (immagine AI).

---

### 36.8 Visibilità pubblica — dove determinarla oggi

| Contenuto | Componente resolver | Logica status |
|-----------|---------------------|---------------|
| Personaggio modale | `CulturePersonDetailModal`, `CultureCornerModal` | `city_people.status === published'` in service report L73–98 |
| POI cover | `PoiImageSection`, resolver POI | `pois.status`, `image_status` |
| Patrono | `PatronSaintModal`, `CulturePatron` | `patron_details` — **nessun** `patron_editorial_status` (D72 gap) |
| Gallery foto | `GalleryGrid` | `photo_submissions.status === approved` |

**GAP:** nessun resolver "entità **SUSPENDED** → immagini nascoste"; segnalazione **solo Foto** non deve sospendere entità — da implementare MF2/MF3.

---

### 36.9 AI — stato attuale vs target §36 Master Plan

| Capacità | Stato | File |
|----------|-------|------|
| Generazione AI Personaggi | 🟢 | `aiVision.ts` `generateHistoricalPortrait` |
| Generazione AI Patrono | 🔴 | — |
| Generazione AI POI cover | 🔴 | solo copyright check |
| Modale SI/NO pre-AI | 🔴 | — |
| Stato VERIFICARE IMMAGINE AI | 🔴 | `needs_review` in governance ma non usato coerentemente |
| Coda Admin AI | 🔴 | — |
| Notifica badge AI | 🔴 | — |
| Dicitura AI pubblica | 🔴 | — |

**findExistingPortrait — bug confermato:**

```175:184:src/services/mediaService.ts
export const findExistingPortrait = async (personName: string): Promise<string | null> => {
  // ... query city_people WHERE name ILIKE personName, limit(1) — NO city_id
```

**Callers:** `usePeopleAI.ts` L168; `useAiCompleteCity.ts` L468,521; `useAiMagicCity.ts` L332; `editorCultureRegeneration.ts` L55.

**FIX target:** aggiungere parametro `cityId` — Macrofase 5.

**Filtri territoriali esistenti riutilizzabili:** `GeoCascadingFilters` — `AdminAssetLibrary.tsx`, `AnomalyInspector`.

---

### 36.10 Macrofasi — piano operativo ufficiale (approvato — Q27 chiusa)

> **5 MACROFASI** approvate (Master Plan §38). Ognuna: **SVILUPPO** → **TEST** (obbligatorio prima della successiva) → E2E sul codice realmente sviluppato.

#### MACROFASE 1 — STRUTTURA ADMIN + STATI + CATEGORIE

| ID | Intervento | FILE principali | DB |
|----|------------|-----------------|-----|
| 1.1 | Shell `AdminReportsHub` 4 macro-tab | `AdminDashboard.tsx`, nuovo hub component | — |
| 1.2 | Spostare Categorie Personaggio in Edit Città Storia | `TabCulture.tsx`, `AdminFamousPeopleCategoriesManager.tsx` | — |
| 1.3 | Legenda stati Admin | hub component | — |
| 1.4 | Migration stati entità base + Patrono | — | `city_people.status`, `pois.status` extend; **`cities.patron_editorial_status`** (D72) |
| 1.5 | Split SuggestionManager micro-tab Community | `SuggestionManager.tsx` | — |

**TEST E2E (precondizioni: Admin loggato, città con categorie personaggio esistenti):**

1. Admin Panel → Segnalazioni → vedere tab COMMUNITY / SANTO PATRONO / PERSONAGGIO FAMOSO / AI.
2. Manager POI-DB → apri città → Storia → CATEGORIA PERSONAGGIO → stessa UI categorie di prima.
3. Segnalazioni → legenda visibile con NUOVO, IN VERIFICA, OK, KO.

#### MACROFASE 2 — SEGNALAZIONI, SUGGERIMENTI E FLUSSI CENTRALI

| ID | Intervento | FILE | DB |
|----|------------|------|-----|
| 2.1 | Modale unificato Segnala abuso | evoluzione `ReportFamousPersonPhotoAbuseModal.tsx` | report tables |
| 2.2 | **Modello B** — due righe collegate Immagine+Personaggio | hub Admin + `content_reports` §42.4 | `report_group_id` |
| 2.3 | Conservazione OK + snapshot foto esatta | services + storage storico | Q24 |
| 2.4 | Guest OTP (scelta tecnica post-verifica Supabase) | nuovo service + modal branch | Q26 |
| 2.5 | Punti UI Community/Galleria/Esplora | `GalleryLightbox.tsx`, `GalleryGrid.tsx`, `PreviewGallery.tsx` | `source_context` |
| 2.6 | Sospensione immediata on submit | services + entity update | status fields |
| 2.7 | Micro-tab Community/Patrono/Personaggio in hub | estratti da manager esistenti | — |
| 2.8 | POI select obbligatorio modale errori | `SuggestionModal.tsx` | `suggestions.poi_id` |

**TEST E2E (precondizioni: personaggio **PUBLISHED** con foto, utente guest):**

1. **Solo Foto:** Segnala abuso → tipologia Immagine → submit → associazione/foto **SUSPENDED**; Personaggio resta **PUBLISHED** e visibile; foto non mostrata.
2. **Solo Personaggio:** Segnala abuso → tipologia Personaggio → submit → Personaggio **SUSPENDED**; Personaggio e immagini **non** visibili.
3. Admin → Abuso foto (caso 1) → KO + motivazione → associazione **RIPRISTINATA**; foto visibile se Personaggio **PUBLISHED**.
4. Admin → evidenza immutabile consultabile (introdotta **MF2**, non MF4).
5. **Regressione:** POI → Rivendica → tab Gold → flusso sponsor OK.

#### MACROFASE 3 — STATI IMMAGINI + PROVENIENZA + AI + CODE + NOTIFICHE

| ID | Intervento | FILE |
|----|------------|------|
| 3.1 | Enum stati immagine + VERIFICARE IMMAGINE AI | migration + governance.ts |
| 3.2 | Modale SI/NO AI creazione | hook creazione personaggio/poi/patron |
| 3.3 | Coda macro-tab AI + filtri territoriali | nuovo `AdminAiImageReviewTab.tsx` |
| 3.4 | Badge notifiche | `AdminSidebar.tsx`, `AdminDashboard.refreshCounts` |
| 3.5 | Resolver entità>immagine | display components |

#### MACROFASE 4 — FOTO REALI + WIKIDATA/COMMONS + MEDIA LIBRARY + STORICO

- Wikidata/P18 · Commons · CC BY · provenance · Media Library · storico immagini
- Arricchimento consultazione evidenza già conservata in **MF2** (D57, Q24) — **non** prima introduzione retention
- Dipende da Q2, Q7

#### MACROFASE 5 — CONSOLIDAMENTO + REGRESSIONI + E2E FINALE

| ID | Intervento | FILE |
|----|------------|------|
| 5.1 | `findExistingPortrait(personName, cityId)` | `mediaService.ts` + 4 callers |
| 5.2 | Rimozione menu Personaggi Famosi | `AdminSidebar.tsx`, grep refs |
| 5.3 | Test regressione completi | — |

---

### 36.11 Documenti — riferimenti obsoleti corretti

| Riferimento obsoleto | Azione |
|---------------------|--------|
| "Segnala immagine" (§35 Audit, revisione 2026-09-14) | **Superato** — usare "Segnala abuso" |
| Admin centralizzato solo Personaggi+POI (§35.12) | **Esteso** — hub 4 macro-tab §32 |
| Fase A-bis step 1 rename UX | **Annullato** |

`AI_DELETED_CODE_REVIEW.md`: contenuto su review codice AI in corso — **non richiede** aggiornamento per decisioni documentali (§43 prompt).

---

### 36.12 Question — stato post-allineamento 2026-09-16

> **Riferimento canonico:** Master Plan **§27.1**. Le voci sotto sono **allineate** — non trattare come decisioni funzionali aperte.

| # | Stato | Riferimento |
|---|-------|-------------|
| Q19 | 🔧 Tecnica chiusa | Master **§42.4** — `content_reports` |
| Q23–Q27 | ✅ Chiuse | §37, §38 |
| Q24 | 🔧 Tecnica chiusa | **§42.5** — MF2 |
| Q26 | 🔧 Tecnica chiusa | **§42.12** — Supabase OTP |
| Q1, Q4, Q21 | ✅ Chiuse / SUPERATA | **D78, D79, D85** |

---

### 36.13 Verifica finale checklist (2026-09-15)

| Controllo | Esito documentazione |
|-----------|---------------------|
| 4 macro-tab Segnalazioni | ✅ Master §32 + Audit §36.1 |
| Micro-tab Community incl. Live/Galleria | ✅ |
| Segnala abuso (non Segnala immagine) | ✅ D30 corretto |
| Note sempre obbligatorie | ✅ gap documentato |
| Stati NUOVO/OK/KO + entità + immagine | ✅ §34 + §36.7 |
| VERIFICARE IMMAGINE AI | ✅ |
| Priorità entità > immagine | ✅ |
| Rivendica non toccato | ✅ §36.2 |
| OTP guest non inventato | ✅ §36.6 |
| File reali citati | ✅ |
| Macrofasi + E2E | ✅ §36.10 |
| Argomenti rimandati preservati | ✅ §35.14 + §36.12 |
| Stati entità D39 (DRAFT/PUBLISHED/SUSPENDED/CANCELED; NEEDS_CHECK solo POI) | ✅ §34.2 + §39.1 |
| Segnalazione → SUSPENDED automatico (D33, D73, D74) | ✅ §34.4–§34.7 + §39.2 |
| Patrono `cities.patron_editorial_status` (D72) | ✅ §39.3 — gap repo documentato |
| media_assets D75–D77 + evidenza MF2 (D70) | ✅ §39.4–§39.5 + §41 Master |

---

*Fine sezione 36 — audit operativo cumulativo. Vedi §37 per revisione 2026-09-15.*

---

## 37. Revisione decisioni definitive (2026-09-15)

> **Allineamento:** Master Plan §35.2, §31.9, §33.6, §38.  
> **Tipo:** decisioni di progetto approvate + gap repository verificati.

### 37.1 Modello B — segnalazione doppia Immagine + Personaggio

**DECISIONE DI PROGETTO APPROVATA** (non ipotesi):

- Admin vede **due righe/elementi collegati** (Abuso immagine · Abuso personaggio)
- Gestione **indipendente** — Admin sceglie ordine; chiusura una ≠ chiusura automatica dell'altra
- Collegamento alla segnalazione originaria **sempre consultabile**
- Regole visibilità KO/OK: Master Plan §35.1

**Stato repository — GAP:**

| Aspetto | Oggi | Gap |
|---------|------|-----|
| Modale utente tipologia Immagine+Personaggio | 🔴 Assente | Da implementare Macrofase 2 |
| Admin due righe collegate | 🔴 Assente | `famous_person_photo_reports` = **una riga** per report foto |
| Collegamento parent/child report | 🔴 Assente | Schema **§42.4 chiuso**; implementazione MF2 |

**INTERVENTO:** introdurre rappresentazione amministrativa **separata** delle due componenti con riferimento reciproco + `report_group_id` (schema `content_reports` — §42.4).

**MACROFASE:** 2 — SVILUPPO / TEST.

### 37.2 Conservazione permanente segnalazioni OK (D56)

**DECISIONE APPROVATA:** segnalazione **OK** = chiusura amministrativa — **NON** eliminazione dati.

**Stato repository — GAP:**

| Capacità | Oggi | Gap |
|----------|------|-----|
| Report non DELETE su decisione | 🟢 UPDATE status | OK |
| Dati entità al momento segnalazione | 🟡 Parziale | Snapshot limitato URL/path personaggio |
| Motivazione Admin obbligatoria su OK | 🔴 | `admin_notes` opzionale |
| Admin decisore + timestamp decisione | 🟡 | `updated_at` generico |
| Audit trail completo | 🔴 | Q11–Q14 |

**MACROFASE:** 2 (evidenza permanente) + 4 (arricchimento storico/consultazione).

### 37.3 Fotografia esatta segnalata — URL vs contenuto (D57, D70 — chiusa)

**Decisione funzionale definitiva (D70):** la fotografia esatta segnalata deve essere **conservata permanentemente** con la segnalazione e restare consultabile — **non** solo URL.

**Distinzione audit:**

| Approccio | Stato oggi | Sufficiente? |
|-----------|------------|--------------|
| URL/path in `person_image_url` + `person_image_storage_path` | 🟢 Personaggi/Patrono report | 🔴 **No** — URL mutevole |
| Evidenza immutabile (copia/snapshot/hash + metadati) | 🔴 Assente | **Target MF2** — meccanismo tecnico Q24 |

**MACROFASE:** **2** (implementazione evidenza); **4** (arricchimento audit trail — non prima introduzione retention).

### 37.4 Guest OTP — requisito vs repository

Vedi §36.6 aggiornato. **Non implementato.** Scelta tecnica delegata allo sviluppo Macrofase 2.

### 37.5 Hub Admin — denominazione

Denominazione definitiva: **Admin Panel → Segnalazioni** (non "Segnalazioni immagini").

Oggi: voce sidebar `suggestions` → `SuggestionManager` — **non** ancora hub §32.

### 37.6 Checklist coerenza Master Plan ↔ Audit

| Punto | Coerente |
|-------|----------|
| Modello B doppia segnalazione | ✅ |
| OK ≠ cancellazione | ✅ |
| Foto esatta consultabile | ✅ gap documentato |
| OTP non implementato | ✅ |
| 5 macrofasi approvate | ✅ |
| Roadmap unica 5 macrofasi | ✅ §29 |
| Admin Panel → Segnalazioni | ✅ |

---

*Fine sezione 37 — revisione 2026-09-15.*

---

## 38. Progettazione tecnica preliminare (A–X)

> **Scopo:** traccia tecnica **preliminare** (pre-MF) — coerente con Master Plan §39 e decisioni D59–D68.  
> **Prevalenza:** dove il Master Plan **§42** definisce già la scelta tecnica, **§42 prevale**; la colonna «Proposta» qui è traccia storica/preliminare, **non** decisione aperta.  
> **Verifica repository:** migration `supabase/migrations/`, servizi `src/services/`, modali report, Admin. **Nessun codice modificato** in questa attività documentale.

### Legenda tabella audit

| Colonna | Significato |
|---------|-------------|
| **Oggi** | Stato verificato nel repo |
| **Gap** | Mancanza rispetto al target approvato |
| **Proposta** | Direzione tecnica consigliata |
| **Macrofase** | Quando implementare |
| **Robustezza** | Perché evita fragilità URL-only / duplicazioni |

---

### A. Modello autonomo della fotografia (D59)

| | |
|--|--|
| **Oggi** | Foto **embedded** su entità: `city_people.image_url` + `image_storage_path`; `pois.image_url` + metadati; Patrono = JSON galleria + `city_patron_gallery`. Nessuna tabella `media_assets`. |
| **Gap** | Nessun ID fotografia stabile; impossibile governare provenienza/stato/history indipendenti; riuso cross-entity solo via URL (`findExistingPortrait` per **nome**, non per asset). |
| **Proposta** | Tabella **`media_assets`**: `id` (uuid PK), `storage_bucket`, `storage_path`, `content_hash` (sha256 opzionale), `origin_type` (admin \| ai \| wikimedia \| community \| placeholder), `license_code`, `generated_by_ai`, `is_placeholder`, `asset_status` (enum stati immagine §5 Master), `created_at`, `metadata` jsonb. File fisico in Storage referenziato **solo** da path immutabile o versionato. |
| **DB** | Migration nuova MF1 (schema base) + MF3 (stati completi). |
| **File** | `supabase/migrations/*_media_assets.sql`, `src/services/media/mediaAssetService.ts` (nuovo), `src/types/supabase.ts` (rigenerazione). |
| **Rischi** | Migrazione legacy; dual-write transitorio. |
| **Robustezza** | Identità foto = PK, non URL mutabile. |
| **Macrofase** | **1** (schema) · **3** (governance stati) |

---

### B. Relazione fotografia ↔ entità (D60)

| | |
|--|--|
| **Oggi** | Relazione implicita 1:1 personaggio–foto su `city_people`; POI idem; Patrono via `gallery_photo_id` nei report. |
| **Gap** | Nessuna **associazione esplicita** governabile; segnalazione agganciata a `person_id` + snapshot URL, non a un link first-class. |
| **Proposta** | Tabella **`entity_image_assignments`**: `id`, `media_asset_id` FK, `entity_type` (`city_person` \| `poi` \| `patron`), `entity_id`, `city_id`, `assignment_role` (`primary` \| `gallery` \| …), `assignment_status`, `is_current`, `replaced_by_assignment_id`, timestamps. Segnalazione **target** = `assignment_id` (o coppia entity+assignment). |
| **Indici** | `(media_asset_id, is_current)`, `(entity_type, entity_id, is_current)`, `(city_id, entity_type)`. |
| **File** | Migration MF2; servizi report; Admin report modal. |
| **Rischi** | Backfill da colonne legacy. |
| **Robustezza** | Ogni utilizzo è riga auditabile; sostituzione = nuova assignment + chain `replaced_by`. |
| **Macrofase** | **2** |

---

### C. Stessa fotografia in più contesti

| | |
|--|--|
| **Oggi** | `findExistingPortrait(name)` riusa URL da **qualsiasi** `city_people` con stesso nome (`mediaService.ts`); `getAssetUsageMap()` join **per URL** su people/pois/patron — incompleto, limit 100 Storage. |
| **Gap** | Nessun modello multi-assignment; riuso non governato; delete asset non blocca utilizzi multipli in modo affidabile. |
| **Proposta** | Una riga `media_assets`; N righe `entity_image_assignments`. Riuso = stesso `media_asset_id` su più assignment. Resolver immagine entità legge assignment `is_current=true`. |
| **File** | `mediaService.ts`, `usePeopleAI.ts`, `entitiesService.ts`, MF4 Media Library. |
| **Rischi** | Orphan Storage se si elimina asset con N assignment. |
| **Robustezza** | FK + vincolo "no hard delete se assignment attiva". |
| **Macrofase** | **2** (modello) · **4** (catalogo) · **5** (findExistingPortrait fix) |

---

### D. Doppia segnalazione Personaggio + Immagine — modello B (§35.2)

| | |
|--|--|
| **Oggi** | `famous_person_photo_reports`: **una riga** per abuso foto; nessun abuso personaggio separato; `patron_photo_reports` simile. Status: `pending/in_review/photo_blocked/rejected` ≠ NUOVO/OK/KO approvati. |
| **Gap** | Modello B assente; regole KO/OK entità vs immagine non implementate; nessun `parent_report_id`. |
| **Proposta** | Tabella unificata **`content_reports`** (o estensione tabelle esistenti con colonna comune): `id`, `report_group_id` (uuid origine submit utente), `parent_report_id` nullable, `report_kind` (`entity_abuse` \| `image_abuse`), `assignment_id`, `entity_type`, `entity_id`, `status` (NUOVO/IN_VERIFICA/OK/KO), motivazioni obbligatorie, `reporter_*`, snapshot refs. Submit utente con Immagine+Personaggio → **2 righe** stesso `report_group_id`. Admin gestisce indipendentemente; RPC atomiche per transizioni stato con lock `FOR UPDATE`. |
| **Regole visibilità** | Implementare come **state machine** documentata Master §35.1 — entità prevale su immagine. |
| **File** | `ReportFamousPersonPhotoAbuseModal.tsx` (tipologia multi-select), nuovi servizi report, Admin hub MF2, migration MF2. |
| **Race** | Optimistic lock su `status` + `updated_at`; RPC `transition_report_status` rifiuta se stato cambiato. |
| **Macrofase** | **2** |

---

### E. Conservazione fotografia esatta segnalata (D57)

| | |
|--|--|
| **Oggi** | Snapshot **URL/path** in `person_image_url`, `person_image_storage_path` su report — sufficiente solo finché file non muta. |
| **Gap** | Sostituzione/rimozione foto invalida prova; URL esterno non controllato. |
| **Scelta tecnica (chiusa §42.5)** | Bucket privato **`report-evidence`**; RPC `capture_report_evidence` al submit; campi `evidence_storage_path`, `evidence_content_hash`, `evidence_captured_at`. Admin UI legge **sempre** l'evidenza, non l'URL live. Implementazione **MF2**. |
| **Retention (DF-2 chiusa)** | **Permanente** insieme alla segnalazione — anche dopo OK, sostituzione o rimozione immagine live. |
| **Sicurezza** | RLS: solo admin + service role; no public URL. |
| **Macrofase** | **2** (capture) · **4** (audit trail completo) |

---

### F. Snapshot / history

| | |
|--|--|
| **Oggi** | Nessuna `entity_image_history`; sostituzione sovrascrive `city_people.image_url`. |
| **Gap** | Impossibile ricostruire timeline assignment; conflitto con audit segnalazioni. |
| **Scelta tecnica (chiusa §42.6)** | `entity_image_assignments` con chain `replaced_by`; **`entity_image_history`** append-only (D84). Report evidence separata (§42.5). Schema MF3/MF4; UI consultazione MF4. |
| **Macrofase** | **4** |

---

### G. Stati immagine

| | |
|--|--|
| **Oggi** | `MEDIA_STATUS_VALUES` in `governance.ts` (`real`, `placeholder`, `ai_generated`, …) — **non** allineati agli stati approvati (ATTIVO, SOSPESO, RIPRISTINATO, SOSTITUITO, RIMOSSO, VERIFICARE IMMAGINE AI). `image_is_placeholder` su `city_people` scritto solo in RPC accept suggestion; **mai letto** in app TS. |
| **Gap** | Due vocabolari; stati immagine non governano visibilità entità. |
| **Proposta** | Enum DB `image_asset_status` su `media_assets.asset_status`; transizioni via RPC. `image_is_placeholder` / `generated_by_ai` / `origin_type` restano **dimensioni distinte** (D66) — non conflating con stato lifecycle. |
| **Macrofase** | **3** |

---

### H. Stati associazione

| | |
|--|--|
| **Oggi** | Assente — implicito "current image on entity". |
| **Gap** | Segnalazione non può agire solo su un link senza toccare asset globale. |
| **Proposta** | `assignment_status`: `active`, `suspended`, `removed`, `replaced`. Segnalazione in corso → sospende **assignment** target; altre assignment stesso asset inalterate (D61). |
| **Macrofase** | **2** |

---

### I. Provenance

| | |
|--|--|
| **Oggi** | POI: campi parziali su write; Personaggi: nessun `image_origin` persistito; AI: flag runtime non sempre salvato. |
| **Gap** | Priorità immagine §12 non verificabile a runtime in modo strutturato. |
| **Proposta** | Su `media_assets`: `origin_type`, `source_ref` (wikidata Q-id, commons file, admin user id), `license_code`, `license_verified_at`, `generated_by_ai`. Resolver priorità: admin > real verified > ai > placeholder. |
| **Macrofase** | **3** |

---

### J. Media Library come catalogo (D67)

| | |
|--|--|
| **Oggi** | `AdminAssetLibrary.tsx`: listing Storage top **100** file; `getAssetUsageMap()` per URL — senza paginazione/filtri entity. |
| **Gap** | Non catalogo relazionale; non raggiunge entità da asset. |
| **Proposta** | Vista Admin su `media_assets` JOIN assignments COUNT; drill-down per entità/città; filtri origine/stato/territorio; paginazione server-side. |
| **File** | `AdminAssetLibrary.tsx`, `mediaService.ts`, nuovo `mediaCatalogService.ts`. |
| **Macrofase** | **4** |

---

### K. Wikidata / P18 / Commons (D64)

| | |
|--|--|
| **Oggi** | **Zero** integrazione applicativa Wikidata/Commons verificata nel repo. |
| **Gap** | Pipeline discovery + quarantine assente. |
| **Proposta** | Servizio `wikimediaLookupService`: search → candidate → **Admin confirm** → download controllato → `media_assets` con `origin_type=wikimedia`, `license_code` da parser Commons → se dubbio → `VERIFICARE IMMAGINE AI` + coda (D10). **Mai** auto-publish da P18. |
| **Macrofase** | **4** |

---

### L. Guest OTP Supabase (§33.6)

| | |
|--|--|
| **Oggi** | Nessun `signInWithOtp` in `src/`. OTP dev-only in `server/routes/auth.routes.ts`. Report richiedono utente autenticato (`reporter_user_id`). |
| **Gap** | Guest non può segnalare con email verificata senza account app. |
| **Requisito funzionale (DF-1 chiusa)** | Guest: email + OTP, senza registrazione manuale app. Autenticato: no re-input email. |
| **Progettazione tecnica (non decisione Paolo)** | Preferire **Supabase OTP nativo** se compatibile con requisito e architettura. Verificare config Auth (Email OTP). Se insufficiente: documentare limite e alternativa più sicura (es. Edge Function + tabella verifica guest). |
| **Proposta MF2** | Implementazione in Macrofase 2 dopo verifica tecnica. |
| **Macrofase** | **2** |

---

### M. Placeholder categoria + generale (D65)

| | |
|--|--|
| **Oggi** | POI: `global_settings.category_placeholders` (`settingsService.ts`). Personaggi: **nessun** equivalente; fallback generico categoria `discovery` via `ImageWithFallback`. |
| **Gap** | Asset Globali senza sezione Personaggi; nuove categorie senza fallback garantito. |
| **Proposta** | Chiave `global_settings.famous_person_category_placeholders` (map category_id → url/path) + `famous_person_general_placeholder`. Resolver: categoria → generale → never null. Admin UI in Asset Globali MF1. |
| **Macrofase** | **1** |

---

### N. AI queue e VERIFICARE IMMAGINE AI (D10)

| | |
|--|--|
| **Oggi** | Stato non presente in DB/app; nessuna coda Admin dedicata; notifiche assenti. |
| **Gap** | Foto dubbia potrebbe essere usata (violazione regola forte). |
| **Proposta** | `asset_status = verify_ai_image` su `media_assets`; Admin tab AI → Personaggio con filtri geo (continente/paese/regione/zona/città); badge notifica **solo** conteggio questo stato. |
| **Macrofase** | **3** |

---

### O. Notifiche

| | |
|--|--|
| **Oggi** | Conteggi parziali in `AdminFamousPeopleManager` tabs; nessun hub centralizzato. |
| **Gap** | Struttura §32 non riflessa in sidebar/badge. |
| **Proposta** | `AdminReportsHub` aggrega query per macro-tab/micro-tab; materialized counts o RPC `get_report_queue_counts`. |
| **Macrofase** | **1** (shell) · **2** (dati reali) · **3** (AI queue) |

---

### P. Storage

| | |
|--|--|
| **Oggi** | Bucket `people_portraits/`, community folders, `admin_uploads/`; path su entità; RPC block clear path. |
| **Gap** | Orphan files; cartelle non tabbed in Libreria; evidence bucket assente. |
| **Scelta tecnica (chiusa §42.5)** | Bucket/policy `report-evidence` (private, RLS admin-only); naming `{entity_type}/{entity_id}/{asset_id}.ext`; implementazione **MF2**. |
| **Macrofase** | **2** (evidence) · **4** (cleanup policy) · **5** |

---

### Q. RLS

| | |
|--|--|
| **Oggi** | RLS su `famous_person_photo_reports`, suggestions — pattern Patron (`20260827140000_*`). Admin via service role / policy admin. |
| **Gap** | Nuove tabelle `media_assets`, `assignments`, `content_reports` senza policy. |
| **Proposta** | Stesso pattern: SELECT pubblico solo asset pubblicati via view; write admin/service; evidence admin-only. |
| **Macrofase** | **1–2** per tabella introdotta |

---

### R. Migration / RPC

| | |
|--|--|
| **Oggi** | `upsert_city_person_with_category_links` — **esistenza DB ✅**, PostgREST ✅, POST E2E ⚪. `block_famous_person_photo_report_and_clear` atomic. |
| **Proposta nuove RPC** | `create_content_report_group`, `transition_report_status`, `get_report_admin_context` (alert utilizzi), `assign_media_to_entity`, `capture_report_evidence`. |
| **Macrofase** | **1–2** |

---

### S. Compatibilità strutture esistenti

| | |
|--|--|
| **Strategia (DF-3 chiusa)** | Backfill **necessario** — strategia tecnica **§42.15** (dual-write MF2 → batch MF5); MF1–2 solo predisposizioni non distruttive. |
| **Patron/POI** | Stesso modello assignment; patron gallery → assignment `role=gallery`. |
| **PoiClaimModal** | **Non toccare** (Rivendica/Gold/Silver/Bottega). |

---

### T. Eliminazione/archiviazione asset in uso

| | |
|--|--|
| **Oggi** | Delete Storage possibile; `getAssetUsageMap` incompleto. |
| **Proposta** | RPC `safe_archive_media_asset`: rifiuta se esiste assignment `active` o evidence report aperto; soft-delete flag su asset. |
| **Macrofase** | **4** |

---

### U. Sostituzione e ripristino

| | |
|--|--|
| **Oggi** | Accept suggestion / block report sovrascrivono URL; RPC atomic clear. |
| **Proposta** | Nuova assignment + `replaced_by` chain; stato asset precedente `SOSTITUITO`; ripristino = riattivare assignment storica o nuova assignment da asset `RIPRISTINATO`. |
| **Macrofase** | **3** |

---

### V. Race condition e consistenza

| | |
|--|--|
| **Oggi** | RPC moderation controlla stato report vs foto corrente (`person_image_url` match). |
| **Proposta** | Estendere: lock report row; verifica `assignment_id` + hash evidence vs current; messaggio conflitto esplicito (già pattern in `famousPersonPhotoReportService.ts`). |
| **Macrofase** | **2** |

---

### W. Regressioni flussi esistenti

| | |
|--|--|
| **Perimetro critico** | `CultureCornerModal`, `ReportFamousPersonPhotoAbuseModal`, `PoiClaimModal`, `SuggestionModal`, AI portrait `usePeopleAI`, import city AI, public city gallery. |
| **MF5** | E2E matrix + fix `findExistingPortrait`; verifica RPC upsert smoke test opzionale su staging. |

---

### X. Alert Admin altri utilizzi (D61)

| | |
|--|--|
| **Oggi** | Nessun alert; Admin vede solo riga report corrente. |
| **Gap** | Admin non vede cross-city / cross-entity stessa foto. |
| **Proposta** | RPC/vista **`get_report_admin_context(p_report_id)`** restituisce: (1) associazione segnalata con stato; (2) altre assignment **stesso entity_id** (personaggio) altre città con city_name + status; (3) altre assignment **stesso media_asset_id** con entity label + city; (4) flag se asset/evidence differisce da current (sostituita/rimossa). **Una query** con JOIN + subquery aggregata — evitare N+1. Indici §38.B. UI: blocco informativo non dismissable nel modal Admin MF2. |
| **Se foto sostituita** | Mostrare evidence snapshot + nota "immagine live diversa"; link assignment storiche. |
| **File** | Admin report detail component MF2, migration RPC MF2. |
| **Macrofase** | **2** |

---

### 38.1 Riepilogo tabelle proposte (indicativo)

| Tabella | Macrofase intro |
|---------|-----------------|
| `media_assets` | 1 |
| `entity_image_assignments` | 2 |
| `content_reports` (+ evidence cols) | 2 |
| `entity_image_history` (append-only, D84 / §42.6) | 3–4 |
| `global_settings` keys placeholder | 1 |

---

### 38.2 Verifiche DB/RPC/RLS/Storage eseguite (2026-09-15)

| Oggetto | Esito |
|---------|--------|
| `city_people.image_url`, `image_storage_path`, `image_is_placeholder` | ✅ Colonne in migration/types |
| `famous_person_photo_reports` schema + RLS | ✅ `20260827140000_*` |
| `patron_photo_reports` | ✅ types + service |
| `media_assets`, `entity_image_assignments` | 🔴 **Assenti** in migrations |
| `upsert_city_person_with_category_links` | ✅ DB + PostgREST; POST E2E ⚪ |
| `signInWithOtp` in app | 🔴 Assente |
| Wikidata/Commons code | 🔴 Assente |
| `category_placeholders` POI | ✅ `global_settings` |
| Placeholder Personaggi | 🔴 Assente |

---

## STATO DELLE DECISIONI FUNZIONALI

> **Stato (2026-09-16):** **nessuna decisione funzionale aperta** per Paolo sui temi trattati in questa sezione (OTP, evidenza segnalazione, backfill, riuso AI D78, licenze D79, schema segnalazioni Q19/§42.4).  
> Resta aperta solo **Q10** — **VERIFICA POST-SVILUPPO** (MF5), non decisione funzionale.  
> I dettagli tecnici corrispondenti sono in §38, Master Plan §42 e nelle macrofasi.

---

## Decisioni funzionali chiuse — classificazione (2026-09-15)

### DF-1 — Guest OTP ✅ CHIUSA (funzionale)

| | |
|--|--|
| **Decisione funzionale** | Utente guest può segnalare con **email + OTP** senza registrazione manuale all'app. Requisito **approvato**. |
| **Non è decisione di Paolo** | Scelta tra Supabase OTP nativo vs alternativa custom, gestione record `auth.users`, messaggi UX tecnici. |
| **Progettazione tecnica** | §38.L — privilegiare Supabase nativo se compatibile; altrimenti documentare limite e alternativa più sicura. **Macrofase 2.** |

### DF-2 — Evidenza fotografica esatta segnalata ✅ CHIUSA (funzionale)

| | |
|--|--|
| **Decisione funzionale definitiva** | **SÌ:** la fotografia esatta segnalata dall'utente deve rimanere **conservata permanentemente** insieme alla relativa segnalazione. |
| **Significato** | L'Admin deve sempre poter consultare la **precisa immagine** vista/segnalata dall'utente, anche se l'immagine live viene sostituita, rimossa, sospesa, ripristinata o se cambia l'associazione. |
| **Vincolo** | **Non** è sufficiente salvare solo l'URL corrente (può mutare o sparire). Serve **evidenza immutabile** (copia/snapshot/hash + metadati identificativi). |
| **Progettazione tecnica** | Meccanismo concreto (bucket, path, hash, RPC) — **Macrofase 2**. MF4 può arricchire consultazione/storico, **non** introdurre per la prima volta la retention. |

### DF-3 — Backfill legacy ✅ CHIUSA (funzionale)

| | |
|--|--|
| **Decisione funzionale** | Il backfill dei dati legacy verso `media_assets` + assignments è **necessario**; va eseguito con la strategia **tecnicamente più sicura**, minimizzando rischio su dati e flussi esistenti, **senza** modifiche distruttive/irreversibili non necessarie. |
| **Strategia tecnica** | Master Plan **§42.15** — dual-write MF2, batch incrementale MF5, cutover post-E2E. |
| **Progettazione tecnica** | **Macrofase 5** (predisposizioni MF1–2). |

---

### 38.3 Progettazione tecnica Macrofase 1

Dettaglio operativo file-per-file, verifiche repository e perimetro shell vs MF2: **`AI_IMAGE_MANAGEMENT_MACROFASE_1_FILES.md`** → sezione *Progettazione tecnica MF1*. **In attesa approvazione Paolo** prima di SVILUPPO.

---

## 39. Allineamento modello stati, segnalazioni e media_assets (2026-09-15)

> **Fonte decisioni:** Master Plan §34, §35, §41; D39, D72–D77. **Repository verificato** — nessun codice modificato.

### 39.1 Vocabolario stati entità (D39)

Canonico: **DRAFT · PUBLISHED · SUSPENDED · NEEDS_CHECK · CANCELED**. NEEDS_CHECK **solo POI**. **Non** usare BOZZA/PUBBLICATO/ANNULLATO come modello definitivo.

### 39.2 Segnalazione → SUSPENDED (D33) — gap implementativo

| Regola | Repository oggi |
|--------|-----------------|
| Ricezione segnalazione → **SUSPENDED** immediato sull'oggetto segnalato | 🔴 **Assente** — solo INSERT report `pending` |
| Solo **Foto** Personaggio/Patrono → **non** sospende entità | 🔴 N/A (nessun assignment) |
| Solo **entità** → entità SUSPENDED, immagini nascoste | 🔴 Assente |
| Patrono SUSPENDED → **SUGGERISCI** (status editoriale D49) | 🔴 Assente — gate **MF1** (`PatronSaintModal`) |
| Stesso `media_asset`, altri contesti | 🔴 Non governato |

**MF impattate:** **MF1** (schema `patron_editorial_status` + gate pubblico DRAFT/SUSPENDED → **SUGGERISCI**); **MF2** (sospensione da segnalazione, `content_reports`, evidenza §42.4–42.5).

### 39.3 Santo Patrono — struttura e status (D72)

- Patrono **non** è tabella entità separata: `cities.patron_details` + `city_patron_gallery` + tabelle moderazione.
- Status editoriale **chiuso:** colonna **`cities.patron_editorial_status`** — **non** JSON, **non** nuova tabella.
- **Gap:** colonna assente; parser/mapper/read da estendere (`cityReadService`, `cityPayloadMapper`, `PatronSaintModal`).

### 39.4 media_assets (D75–D77)

| Decisione | Gap repository |
|-----------|----------------|
| Asset distinti su sostituzione | 🔴 UPDATE in-place su `city_people.image_url` |
| Cronologia permanente | 🔴 Assente |
| Provenance centralizzata | 🔴 Distribuita su POI/personaggi |
| Associazione con stato proprio | 🔴 Assente |
| RLS: Admin gestisce; public legge pubblicati; evidence privata | 🔴 `media_assets` ed evidence assenti |

### 39.5 Evidenza permanente (D70/DF-2)

**MF2** introduce conservazione immutabile; **MF4** solo arricchimento — coerente con Master Plan §31.9.1.

---

*Fine sezione 39 — allineamento 2026-09-15.*

---

*Fine sezione 38–39 — progettazione e allineamento 2026-09-15. Nessun file codice applicativo modificato.*

---

## 40. Allineamento decisioni definitive 2026-09-16

> **Fonte:** Master Plan D78–D89, §6–§7, §12.1, §27, §31.10, §32.7, §34.5, §42. **Repository verificato** — nessun codice applicativo modificato in questa attività documentale.

### 40.1 Licenze

| Decisione | Gap repository |
|-----------|----------------|
| **D78** AI riuso terzi CC BY 4.0 + attribuzione TD | 🔴 Non persistito su asset AI |
| **D79** Solo CC BY 4.0 auto-path; altre licenze registrate + manuale | 🔴 Parser/allowlist assente |
| **D80** Pipeline per-step tracciabile | 🔴 Assente — solo concetti parziali POI |

### 40.2 VERIFICARE IMMAGINE AI e override

| Decisione | Gap |
|-----------|-----|
| **D81** Coda Admin Segnalazioni → AI; motivazione AI ≠ Admin | 🔴 Stato/coda assenti |
| **D82** Override tracciato | 🔴 Assente |

### 40.3 Guest OTP (D85)

| Requisito | Repository |
|-----------|------------|
| Stesso modale; email → OTP → verifica → INVIA | 🔴 Assente |
| No SMS/telefono/registrazione | ✅ Nessun flusso SMS in `src/` |
| ~~Email pubblica Admin come canale segnalazioni~~ | **SUPERATA** — **D88** (canale unico modale; guest OTP = **D85**) |

### 40.4 Foto & Moderazione vs Abuso Foto Community (verifica repository — chiusa 2026-09-16)

**Verdetto:** **due flussi distinti**.

| Aspetto | Moderazione upload (`PhotoModeration`) | Abuso Foto Community (target MF2) |
|---------|----------------------------------------|-----------------------------------|
| Scopo | Approvare/rifiutare **upload** utente su `photo_submissions` | Segnalare **abuso** su foto **già pubblicate** |
| Tabella | `photo_submissions` | `content_reports` (MF2) |
| UI Admin oggi | `AdminSidebar` → `photos` → `PhotoModeration.tsx` | 🔴 Assente |
| UI pubblica ingresso | Upload: `LiveFeedTab`, `CityGallery` → `useCommunityPhotoPublish` → `uploadCommunityPhoto` | 🔴 Nessun Segnala abuso su foto Community |
| Stati workflow | `pending` · `approved` · `rejected` · `city_deleted` | Segnalazione: NUOVO → IN VERIFICA → OK/KO (MF2) |
| Perimetro progetto | **FUORI SCOPE** — non modificare in AI Image Management | **IN SCOPE** — MF2 |

**Dopo approvazione upload:** `updatePhotoStatusInDb` imposta `status=approved` e `published_at`; Live Feed legge `listPhotographs({ status: 'approved' })`; Galleria città mostra foto `approved` (+ pending proprie dell'utente).

**Conseguenza documentale:** nessuna ricollocazione di `PhotoModeration` nel hub Segnalazioni; nessuna attività MF su Foto & Moderazione.

### 40.5 Scelte tecniche §42 — stato

| §42 | Tema | MF |
|-----|------|-----|
| 42.1–42.2 | `media_assets`, `entity_image_assignments` | 1–2 |
| 42.4–42.5 | `content_reports`, `report-evidence` | 2 |
| 42.12 | Supabase OTP guest | 2 |
| 42.13 | `image_verification_runs/steps` | 3–4 |
| 42.6 | `entity_image_history` | 3–4 |
| 42.10–42.11 | `people_portraits`, `image_is_placeholder` | 5 backfill |
| 42.16 | Atomicità operazioni applicative entità + assignment (**D90**) | Post-MF5 (§41) |

### 40.6 §27 Audit — allineamento

Le voci **Q1, Q3–Q4, Q8–Q9, Q11–Q14, Q18–Q21, Q24–Q27, Q20 (superata/D88)** nel Master Plan §27.1 risultano **chiuse**, **superate** o **tecniche chiuse** — **non** riportare come «decisioni da prendere». Resta aperta solo **verifica post-sviluppo**: **Q10** (MF5).

---

*Fine sezione 40 — allineamento 2026-09-16.*

---

## 41. Atomicità entità + image assignment — gap architetturale (2026-09-19)

> **Fonte requisito:** Master Plan **D90**, **§42.16**, **Q28**. **Repository verificato** — nessun codice modificato in questa attività.

### 41.1 Distinzione A / B

| | Tema | Copertura documentale |
|--|------|------------------------|
| **A** | Dual-write / backfill / cutover legacy → MF2 | **§42.15**, **D71** — migrazione dati |
| **B** | Atomicità **end-to-end** di una singola operazione applicativa (entità + assignment) | **§42.16**, **D90** — **non** coperto da §42.15 |

Prima del 2026-09-19 il requisito **(B)** **non** compariva esplicitamente nel Master Plan né nelle macrofasi; esistevano solo pattern atomici **locali** (es. RPC moderation community, `upsert_city_person_with_category_links` per category links — Audit §V, §38).

### 41.2 Flusso verificato — Santo Patrono primary (`saveCityDetails`)

| Step | Componente | Boundary |
|------|------------|----------|
| 1 | `src/services/city/cityWriteService.ts` — `saveCityDetails()` | Client |
| 2 | `src/services/city/cityAdminApi.ts` — `callCityAdminApi()` | HTTP → `PATCH ${VITE_API_URL}/api/admin/cities/:cityId/details` |
| 3 | `server/routes/admin.routes.ts` | Express handler |
| 4 | `server/services/cityAdminService.ts` — `persistCityDetails()` | `supabaseAdmin` UPDATE/INSERT **`cities`** (nessuna RPC dual-write, nessuna transazione con `entity_image_assignments`) |
| 5 | `upsertEntityImageAssignmentDualWrite()` / `revokePatronPrimaryAssignment()` | Client Supabase / `mf2Rpc` — **operazione separata** post-PATCH |

**Verdetto:** **atomicità end-to-end non disponibile** con l'architettura attuale per questo flusso.

### 41.3 Consistency gap (esempi)

| Scenario | Esito possibile |
|----------|-----------------|
| PATCH City **OK**, dual-write/revoca MF2 **fallisce** | Legacy `cities` / `patron_details` aggiornato; assignment primary MF2 invariato o obsoleto |
| PATCH City **fallisce** | MF2 non invocato — coerente |
| MF2 **OK** dopo PATCH già committato | Coerente se entrambi successo |

Il client attuale **non** finge successo su errore MF2; **non** può però garantire rollback del PATCH City.

### 41.4 Altri writer MF2 (stesso classificazione B)

Pattern analogo (legacy + RPC/client separati) su: `entitiesService.saveCityPerson`, `photoService.updatePhotoData`, `cityPatronGalleryService`, `uploadCommunityPhoto` — atomici **solo** dove una **singola RPC/transazione DB** copre entità+immagine (es. moderation RPC). **Non** assumere atomicità globale dal solo dual-write §42.15.

### 41.5 Macrofasi MF3–MF5

| MF | Copertura atomicità (B) |
|----|-------------------------|
| **MF3** | Pipeline verifica, stati immagine, placeholder write — **no** unificazione transazionale City Admin + assignment |
| **MF4** | Wikidata, Media Library, storico — **no** |
| **MF5** | Backfill §42.15, E2E, cutover — **follow-up D90** documentato in `AI_IMAGE_MANAGEMENT_MACROFASE_5_FILES.md` |

### 41.6 Anticipo prima di MF5?

**Non richiesto** per obiettivi MF1–MF4 già chiusi: dual-write transitorio + fail-loud restano sufficienti per il perimetro approvato. Anticipo dell'implementazione **§42.16** → **solo** decisione esplicita (es. se cutover MF5 o E2E matrix evidenziassero divergenze sistematiche in produzione).

---

*Fine sezione 41 — verifica architetturale 2026-09-19.*
Aggiornato al 19.09.2026
