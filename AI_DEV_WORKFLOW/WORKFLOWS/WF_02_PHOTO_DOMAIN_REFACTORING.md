# Photo Domain Refactoring – Working Document

> **Stato:** **Refactoring dominio Photo CONCLUSO** · verifica finale documentale ✓  
> **Workflow:** WF-02 · STEP-3 · Post-3.4  
> **Ultimo aggiornamento contenuto implementato:** 2026-07-21  
> **Uso:** documento di continuità tecnica tra chat. Descrive **solo** ciò che è stato implementato o deliberato.  
> **SSOT dominio media aggiornato:** `AI_CONTEXT/16_CITY_MEDIA_MANAGEMENT.md` (v2.1)  
>
> **Path documento:** `AI_DEV_WORKFLOW/WORKFLOWS/WF_02_PHOTO_DOMAIN_REFACTORING.md`

---

## 1. Obiettivo architetturale

### Problema iniziale

Nel prodotto coesistevano due nature di immagini senza un confine di dominio chiaro:

1. **Fotografie** — contenuti reali (Community UGC e Official editoriali), destinati a Live Feed, gallerie città, Esplora/Preview, Rankings, Lightbox.
2. **Placeholder** — asset grafici della piattaforma (categorie POI, valigia, hero/auth/social, ecc.), gestiti in Admin → **Asset Globali**, usati solo per riempire l’assenza di una foto reale.

Prima del refactoring:

- Entrambe le nature potevano finire (o essere trattate) vicino a `photo_submissions`.
- I consumer applicavano filtri **inconsistenti** (es. `media_status NOT IN (placeholder, missing)` in alcuni path; **assente** nei Rankings).
- Esistevano euristiche URL (`isPlaceholderUrl`) e flag `includePlaceholders` — workaround, non SoT.
- Le schermate rischiavano di “conoscere” i Placeholder, moltiplicando filtri e drift.

### Perché separare Photograph e Placeholder

Decisione di dominio (approvata PO): **l’origine determina la natura**.

| Famiglia | Natura | Dove vive | In gallerie foto? |
|----------|--------|-----------|-------------------|
| **Photograph** | Contenuto | Dominio Photo → `photo_submissions` | Sì |
| **Placeholder** | Asset piattaforma | Asset Globali → `global_settings` (+ storage `admin_assets`) | **Mai** |

`is_official` resta solo partizione **editoriale** dentro le Fotografie (Official vs Community). Non cambia la natura.

### Problemi che la separazione risolve

- Una sola regola di business, non filtri UI sparsi.
- Gallerie chiedono solo: «dammi le fotografie».
- Impedisce (in lettura già; in scrittura dal Blocco 4) che i Placeholder contaminino il dominio Photo.
- Estendibile: nuove gallerie riusano la stessa porta, senza reimparare i Placeholder.

---

## 2. Decisioni architetturali approvate

Queste decisioni sono **definitive** per questo refactoring:

1. **Placeholder = tutto ciò che nasce in Admin → Asset Globali** (origine, non nome file / path heuristics).
2. **Photograph = Official + Community** (contenuto in `photo_submissions`).
3. **Le gallerie non conoscono i Placeholder** — nessun filtro Placeholder nelle schermate.
4. **SoT Placeholder:** chiavi Asset Globali in `global_settings` (lista dominio `PLATFORM_PLACEHOLDER_SETTING_KEYS`).
5. **SoT lettura gallerie:** `listPhotographs` + `PHOTOGRAPH_READ_MEDIA_STATUS` (positive filter `media_status = 'real'`).
6. **Positive filtering**, non `NOT IN ('placeholder','missing')` nei path galleria.
7. **Nessun CHECK / trigger / vincolo DB** in questa fase (PO: prima dominio stabile, protezioni DB dopo).
8. **Nessun audit quantitativo DB** (dati di sviluppo non significativi).
9. **Admin moderazione** usa un path separato (`listPhotoSubmissionsForModeration`) — può vedere righe legacy non-fotografia per bonifica; **non** è una galleria.
10. **`image_status` su città/POI** resta stato di *display entità* (ha foto vera / usa placeholder a runtime) — ortogonale al dominio Photo.
11. **Default `mediaStatus` omesso = `real`** in scrittura Photo — allineato a `uploadCommunityPhoto` / `getOrCreate` / `createMediaAssetFromUrl` (documentato in `assertPhotographWrite`).
12. **Rankings foto** condividono la SoT dominio (`PHOTOGRAPH_READ_MEDIA_STATUS` + `filterPhotographs`); query dedicata per join `cities` (non duplicare la regola Placeholder).

---

## 3. Blocchi completati

### Blocco 1 — Piano tecnico (nessun codice di dominio)

| Campo | Contenuto |
|-------|-----------|
| **Obiettivo** | Piano architetturale approvato PO (separazione origine, unica porta lettura, harden scrittura, no filtri UI). |
| **File** | Nessuno di implementazione. |
| **Ottenuto** | Go-ahead con deroghe: skip audit DB; no CHECK/trigger in v1. |
| **Decisioni** | Vedi §2. |

### Blocco 2 — Contratto di dominio (puro)

| Campo | Contenuto |
|-------|-----------|
| **Obiettivo** | Codificare Photograph vs Placeholder senza wiring servizi/UI. |
| **File creati** | `src/domain/placeholders/platformPlaceholderOrigin.ts` |
| | `src/domain/placeholders/platformPlaceholderRegistry.ts` |
| | `src/domain/photos/photograph.ts` |
| | `src/domain/photos/assertPhotographWrite.ts` |
| **Ottenuto** | Predicati `isPhotograph` / registry origine / `evaluatePhotographWrite` + `assertPhotographWrite`. |
| **Decisioni** | `assertPhotographWrite` non riduplica logica: solo materializza `evaluatePhotographWrite` in `Error`. Default status omesso = `real` con commento esplicito. |

### Blocco 3 — Unica porta di lettura gallerie

| Campo | Contenuto |
|-------|-----------|
| **Obiettivo** | Tutte le gallerie usano logica Photo condivisa; schermate non conoscono Placeholder. |
| **File** | `src/domain/photos/photographQuery.ts` (**nuovo**) |
| | `src/services/photoService.ts` — `listPhotographs`, `listPhotoSubmissionsForModeration`; rimossi `fetchCommunityPhotos` / `fetchTopCityPhotos` |
| | `src/services/rankingService.ts` — vincolo dominio su ranking foto |
| | `src/services/city/cityMediaService.ts` — solo `isPhotographMediaAsset` |
| | `src/components/community/LiveFeedTab.tsx` |
| | `src/hooks/useCityGallery.ts` |
| | `src/components/modals/sectionPreview/PreviewGallery.tsx` |
| | `src/hooks/admin/usePhotoModeration.ts` |
| **Ottenuto** | Lettura gallerie unificata; Rankings allineati; admin fuori dalle gallerie. |
| **Decisioni** | Wrapper legacy rimossi (zero consumer). Errori TS in `rankingService` (RPC / `zone` null) **preesistenti**, non introdotti dal Blocco 3 — lasciati invariati. |

### Blocco 4 — Harden scrittura Photo

| Campo | Contenuto |
|-------|-----------|
| **Obiettivo** | Nessuna nuova riga non-Fotografia in `photo_submissions`; collegare assert + registry Asset Globali. |
| **File** | `src/services/settingsService.ts` — `getPlatformPlaceholderRegistry` / `getPlatformPlaceholderRegistryAsync` |
| | `src/services/photoService.ts` — assert su `uploadCommunityPhoto` e `getOrCreatePhotoSubmissionForUrl` |
| **Ottenuto** | Insert solo dopo `assertPhotographWrite`; existing `getOrCreate` non riespone non-fotografie (`canRegisterAsPhotograph`). |
| **Decisioni** | Registry da cache settings (origine chiavi dominio); bootstrap atteso via async helper. Nessun CHECK DB. |

### Blocco 5 — Euristiche URL / coerenza residuale

| Campo | Contenuto |
|-------|-----------|
| **Obiettivo** | Eliminare euristiche legacy basate su URL; SoT Placeholder = registry origine Asset Globali. |
| **File** | `src/utils/imageOptimizer.ts` — rimossa `isPlaceholderUrl` (zero consumer runtime) |
| **Verifiche** | `AdminHeaderManager` non importa/chiama Photo APIs (confermato). Consumer galleria già su `listPhotographs` / write assert. |
| **Fuori scope esplicito** | `isPlaceholderCityId` (ID città diario); euristica Unsplash/ui-avatars in `usePeopleAI` (pipeline ritratti AI, non Asset Globali); URL stock hardcodati su reset hero città (scrittura fallback, non detection). |
| **Ottenuto** | Nessuna API di detection Placeholder via substring URL nel dominio Photo/gallerie. |

---

## 4. Source of Truth attuali

| Regola | File responsabile | Note |
|--------|-------------------|------|
| Chiavi Asset Globali = Placeholder | `src/domain/placeholders/platformPlaceholderOrigin.ts` | `PLATFORM_PLACEHOLDER_SETTING_KEYS` (include `retired_platform_placeholder_urls`) |
| Registry URL Placeholder (origine) | `src/domain/placeholders/platformPlaceholderRegistry.ts` | attivi + retired; `mergeRetiredPlatformPlaceholderUrls` |
| Predicato Fotografia | `src/domain/photos/photograph.ts` | `isPhotograph`, `PHOTOGRAPH_MEDIA_STATUS = 'real'` |
| Decisione scrittura Photo | `src/domain/photos/assertPhotographWrite.ts` | `evaluatePhotographWrite` (SoT); `assertPhotographWrite` solo Error |
| Vincolo lettura gallerie | `src/domain/photos/photographQuery.ts` | `PHOTOGRAPH_READ_MEDIA_STATUS`, `filterPhotographs` |
| Porta lettura gallerie (runtime) | `src/services/photoService.ts` → `listPhotographs` | Sempre `.eq('media_status', real)` |
| Porta admin (non galleria) | `src/services/photoService.ts` → `listPhotoSubmissionsForModeration` | Nessun filtro fotografia |
| Registry runtime da settings | `src/services/settingsService.ts` → `getPlatformPlaceholderRegistry(Async)` / `retirePlatformPlaceholderUrls` | Bridge cache → dominio |
| Official media eleggibili per merge galleria | `src/services/city/cityMediaService.ts` | **Solo** Galleria Fotografica (`getCityPhotographicGalleryAssets`) |
| Display Placeholder su POI (non Photo) | `src/domain/poi/resolvePoiDisplayImageUrl.ts` + `ImageWithFallback` | Canale Platform Assets, corretto |

**Persistenza Placeholder:** ancora `global_settings` via AdminHeaderManager / `settingsService` (non nuova tabella).

---

## 5. API ormai deprecate

| API / helper | Stato | Azione |
|--------------|-------|--------|
| `fetchCommunityPhotos` | **Rimosso** (Blocco 3) | Non reintrodurre; usare `listPhotographs` |
| `fetchTopCityPhotos` | **Rimosso** (Blocco 3) | Non reintrodurre; usare `listPhotographs({ cityId, status: 'approved', limit: 10 })` |
| Flag `includePlaceholders` | **Rimosso** | Admin → `listPhotoSubmissionsForModeration` |
| Filtro negativo `.not('media_status', 'in', '("placeholder","missing")')` nei path galleria | **Sostituito** da positive filter | Non ripristinare nei consumer galleria |
| `isPlaceholderUrl` (`src/utils/imageOptimizer.ts`) | **Rimosso** (Blocco 5) | Usare `isPlatformPlaceholderUrl` + registry Asset Globali / `isPhotograph` |

---

## 6. Stato attuale del dominio

### Lettura (gallerie) — **migrata**

```
UI / hook → listPhotographs(options) → photo_submissions
              .eq(media_status, PHOTOGRAPH_READ_MEDIA_STATUS)
              → mapDbPhotoSubmission → filterPhotographs
```

| Consumer | Come legge |
|----------|------------|
| Live Feed (`LiveFeedTab`) | `listPhotographs({ status: 'approved', withLikes: true })` |
| Galleria città (`useCityGallery`) | `listPhotographs({ withLikes: true })` + merge Official via `getCityPhotographicGalleryAssets` / `getOrCreate…` (solo Galleria Fotografica) |
| Preview / Esplora (`PreviewGallery`) | `listPhotographs({ cityId, status: 'approved', limit: 10 })` |
| Rankings foto | `getTopCommunityPhotos` + SoT dominio (`PHOTOGRAPH_READ_MEDIA_STATUS` / `filterPhotographs`) |
| Lightbox | Nessun fetch proprio — riceve `PhotoSubmission` già fotografici dai parent |

### Scrittura — **migrata (Blocco 4)**

| Entry | Comportamento |
|-------|---------------|
| `uploadCommunityPhoto` | Dopo `publicUrl`, `assertPhotographWrite` + registry Asset Globali; poi insert |
| `getOrCreatePhotoSubmissionForUrl` | Existing: `canRegisterAsPhotograph` o `null`. Create: `assertPhotographWrite` poi insert |
| Replace/delete Asset Globali | `retirePlatformPlaceholderUrls` **prima** di aggiornare settings (origine conservata) |

### Post-fix 2026-07-22 — Placeholder origin tombstones

Buco chiuso: `getOrCreate` poteva creare Photograph da URL Placeholder **orfani** (non più in settings correnti) se `mediaStatus=real`.  
Fix dominio: chiavi origin + registry includono `retired_platform_placeholder_urls`; Admin ritira URL su replace/delete; seed tombstone per orfani legacy già noti. Nessuna euristica path/`admin_assets`.

### Post-fix 2026-07-22 — Presentation Media esclusi da Photograph

Regola piattaforma: solo Galleria Fotografica città + Community + Admin foto.  
`getCityPhotographicGalleryAssets` sostituisce il merge Card/POI → Photo. Nessuna bonifica dati in questa fase.

### Moderazione

`usePhotoModeration` → `listPhotoSubmissionsForModeration('all')` — path admin, fuori dalle gallerie.

### Gallery / Preview / Ranking

Allineati in **lettura** (§ sopra). Preview/Gallery chiamano `getOrCreatePhotoSubmissionForUrl` per Official — ora protetto dal write-boundary (Blocco 4).

---

## 7. Blocchi ancora da eseguire

### Blocco 4 — Harden scrittura Photo — **COMPLETATO**

Vedi §3. Non rieseguire.

### Blocco 5 — Debito / euristiche / coerenza residuale — **COMPLETATO**

Vedi §3. Non rieseguire.

### Verifica finale / documentazione — **COMPLETATA**

| Campo | Contenuto |
|-------|-----------|
| **Obiettivo** | Audit codice + allineamento DOC 16 + checklist §10 |
| **Esito audit** | Nessun consumer legacy; nessuna euristica URL in gallerie; letture/scritture su porte dominio; nessuna duplicazione di regole |
| **Fix micro** | Rimosso import morto `MediaStatus` in `useCityGallery.ts` |
| **DOC 16** | Aggiornato a v2.1 (sezione Dual-family Photograph vs Placeholder) |

---

## 8. Invarianti architetturali

Non violare:

1. **Asset Globali ⇒ Placeholder** — mai `photo_submissions`.
2. **`photo_submissions` (gallerie) ⇒ solo Fotografie** (`media_status = 'real'` in lettura).
3. **Schermate galleria** non filtrano Placeholder e non importano registry Placeholder.
4. **Unica porta lettura gallerie:** `listPhotographs` (Rankings: stessa SoT dominio, query join dedicata).
5. **Admin moderazione ≠ galleria.**
6. **Natura ≠ `is_official`** — Official/Community sono sottofamiglie di Photograph.
7. **Niente euristiche URL** come SoT di Placeholder/Fotografia (`isPlaceholderUrl` rimossa).
8. **Niente filtri duplicati** per schermata.
9. **Niente CHECK/trigger** finché non deliberati in fase successiva.
10. **Foundation Design System e mobile-first** invariati da questo refactoring.

---

## 9. Debito tecnico fuori scope

Non appartiene a questo refactoring (non “fixare” come parte dei blocchi Photo vs Placeholder):

| Debito | Note |
|--------|------|
| Errori TS `rankingService` su RPC `get_ranked_cities` (L49, L60, L101) | Preesistenti; typing RPC / Json |
| Errori TS `buildHierarchy` `zone: string \| null` vs `undefined` (L142, L218) | Preesistenti; anche su path POI non toccato |
| Fallback `SYSTEM_USER_ID` in `mapDbPhotoSubmission` | Documentato in DOC 16 come TODO legacy |
| Hero Preview da DTO vs solo Official DB | Gap DOC 16 preesistente |
| Cleanup massivo righe legacy in DB | Skip deliberato PO (dati di test) |
| CHECK / trigger su `photo_submissions` | Fase successiva post-stabilizzazione |
| Tabella dedicata `platform_assets` | Evoluzione futura opzionale; SoT attuale = `global_settings` |
| Audit A Collaboration / residui Audit B CC | Track WF-02 separati |
| Errori TS `StyleRule` in `settingsService` (Design System) | Preesistenti; fuori Photo dual-family |
| Euristica Unsplash/ui-avatars in `usePeopleAI` | Pipeline ritratti AI personaggi — non Placeholder Asset Globali |
| `isPlaceholderCityId` | ID città placeholder nel diario — dominio diverso |
| URL stock Unsplash su reset hero città | Scrittura fallback legacy; non detection; eventuale allineamento ad Asset Globali = track separato |

---

## 10. Checklist finale

Dichiarare il dominio Photo **completamente migrato** solo quando:

- [x] Contratto dominio Photograph / Placeholder esistente (Blocco 2)
- [x] Registry Placeholder basato su origine Asset Globali (Blocco 2)
- [x] Assert scrittura definito come SoT decisione (Blocco 2)
- [x] `listPhotographs` unica porta gallerie (Blocco 3)
- [x] Live Feed / Galleria città / Preview / Rankings in lettura allineati (Blocco 3)
- [x] Admin moderazione su path separato (Blocco 3)
- [x] Wrapper `fetchCommunityPhotos` / `fetchTopCityPhotos` rimossi (Blocco 3)
- [x] Write path: `uploadCommunityPhoto` hardenato (Blocco 4)
- [x] Write path: `getOrCreatePhotoSubmissionForUrl` hardenato (Blocco 4)
- [x] Registry runtime collegato alle settings Asset Globali in scrittura (Blocco 4)
- [x] `isPlaceholderUrl` rimosso / non usato come regola dominio (Blocco 5)
- [x] Asset Globali verificato: zero chiamate al dominio Photo (Blocco 5)
- [x] Audit finale codice: nessun consumer legacy / euristiche galleria / porte unificate (verifica finale)
- [x] `AI_CONTEXT/16_CITY_MEDIA_MANAGEMENT.md` aggiornato v2.1 (verifica finale)
- [x] Nessun filtro Placeholder residuo nelle schermate galleria (verifica finale)
- [ ] Collaudo manuale runtime Official + Community + Live Feed + Rankings + Lightbox (**raccomandato PO**, fuori codice)

---

## Appendice A — Mappa file dominio (implementati)

```
src/domain/placeholders/
  platformPlaceholderOrigin.ts
  platformPlaceholderRegistry.ts
src/domain/photos/
  photograph.ts
  assertPhotographWrite.ts
  photographQuery.ts
  photoOfficial.ts          (preesistente — Official toggle / metadata)
  photoCaption.ts           (preesistente)
  photoFilters.ts           (preesistente — filtri editor canvas, non Placeholder)
src/services/
  settingsService.ts        — getPlatformPlaceholderRegistry(Async)
  photoService.ts           — listPhotographs + write assert
```

## Appendice B — Ripresa lavori

1. Leggere questo documento.
2. Refactoring dual-family **concluso in codice + DOC 16**. Eventuale collaudo manuale runtime a cura PO.
3. Non reintrodurre `fetchCommunityPhotos` / filtri UI Placeholder / euristiche URL come SoT.
4. Debito fuori scope: vedi §9 (CHECK DB, SYSTEM_USER_ID, Hero DTO, ecc.).
