# 🖼️ DOC 16: CITY MEDIA MANAGEMENT (v2.3 — CERTIFIED)

Questo documento descrive la pipeline di gestione, ottimizzazione e propagazione degli asset multimediali delle città, inclusa la **governance editoriale foto** (layer Official vs Community), la **separazione Photograph vs Placeholder**, e la **separazione Photograph vs Presentation Media**.

> Storico piano implementativo: `docs/_archive/media/implementationplan_foto.md`  
> Continuità refactoring dual-family: `AI_DEV_WORKFLOW/WORKFLOWS/WF_02_PHOTO_DOMAIN_REFACTORING.md`

---

## DESCRIZIONE SEMPLICE

Il sistema gestisce le foto delle città e dei luoghi, separa contenuti **ufficiali** da contenuti **community**, distingue le **Fotografie** (solo gallerie fotografiche) dai **Placeholder** (asset piattaforma) e dai **Presentation Media** (Hero, Card, cover entità), propaga le modifiche in tutta l'app e traccia l'utilizzo di ogni asset.

---

## TRE FAMIGLIE MEDIA (CONTRATTO PIATTAFORMA)

| Famiglia | Natura | SoT tipica | In `photo_submissions` / gallerie Photo? |
|----------|--------|------------|------------------------------------------|
| **Photograph** | Fotografia caricata come tale | `photo_submissions` | **Sì** |
| **Placeholder** | Grafica piattaforma | Admin → Asset Globali → `global_settings` | **Mai** |
| **Presentation Media** | Media editoriale / presentazione | Campi entità (`hero_image`, `image_url` città/POI/Shop/…) | **Mai** |

### Sorgenti autorizzate al dominio Photograph (uniche)

1. **Galleria Fotografica della Città** — Admin → Manager → Città → Media → Galleria Fotografica (`cities.gallery` / `details.gallery`)
2. **Fotografie Community** — upload utente (`uploadCommunityPhoto`)
3. **Galleria / moderazione Admin** — gestione fotografie (`listPhotoSubmissionsForModeration`, upload admin)

### Presentation Media (esclusi da Photograph)

Hero Image, Card Anteprima, Banner, Cover, Thumbnail, immagine principale città/POI/Shop/Guide/Tour Operator/Eventi, qualsiasi media usato solo come presentazione editoriale.

**Invariante:** nessun path runtime può promuovere Presentation Media a Photograph (niente `getOrCreate` su Hero/Card/POI cover).

---

## DUAL-FAMILY: PHOTOGRAPH VS PLACEHOLDER

### Regola di business

| Famiglia | Natura | SoT | In gallerie fotografiche? |
|----------|--------|-----|---------------------------|
| **Photograph** | Contenuto reale | `photo_submissions` | Sì |
| **Placeholder** | Asset grafico piattaforma | Admin → **Asset Globali** → `global_settings` | **Mai** |

L’**origine** determina la natura Placeholder (Asset Globali ⇒ Placeholder). Non si deduce da nome file, path o euristiche URL.

### Registry Placeholder e origin tombstones

Il write-boundary Photo consulta un **registry di origine** costruito da `PLATFORM_PLACEHOLDER_SETTING_KEYS`:

| Sorgente | Chiave / forma | Ruolo |
|----------|----------------|--------|
| Asset Globali **attivi** | `hero_image`, `favicon_image`, `category_placeholders`, … | URL attualmente pubblicati in Admin → Asset Globali |
| **Origin tombstones** | `retired_platform_placeholder_urls` (`string[]`) | URL che *sono stati* Asset Globali e poi sostituiti/eliminati |

Regola: un URL pubblicato come Asset Globali resta **Placeholder by origin** per le scritture Photo anche se non è più nella mappa attiva.  
`retirePlatformPlaceholderUrls` scrive i tombstone **prima** del replace/delete settings.  
`evaluatePhotographWrite` / `assertPhotographWrite` negano `platform_placeholder_origin` se l’URL è nel registry (attivi **o** retired). Nessuna euristica su path storage.

`is_official` è solo partizione **editoriale** dentro le Fotografie (Official vs Community). Non cambia la natura e **non** significa “Hero/Card città”.

### Dominio (contratto)

| Responsabilità | File |
|----------------|------|
| Chiavi Asset Globali | `src/domain/placeholders/platformPlaceholderOrigin.ts` |
| Registry URL Placeholder (attivi + retired) | `src/domain/placeholders/platformPlaceholderRegistry.ts` |
| Predicato Fotografia | `src/domain/photos/photograph.ts` (`isPhotograph`, `media_status = 'real'`) |
| Write-boundary | `src/domain/photos/assertPhotographWrite.ts` |
| Read-boundary gallerie | `src/domain/photos/photographQuery.ts` (`PHOTOGRAPH_READ_MEDIA_STATUS`) |
| Candidati Official da città | `src/services/city/cityMediaService.ts` → **solo** Galleria Fotografica |

### Porte runtime

| Porta | Uso |
|-------|-----|
| `listPhotographs` (`photoService`) | **Unica** lettura gallerie (Live Feed, Galleria città, Preview/Esplora) |
| Rankings foto | Stessa SoT dominio (`PHOTOGRAPH_READ_MEDIA_STATUS` + `filterPhotographs`); query con join `cities` |
| `uploadCommunityPhoto` | Insert Community / Admin upload esplicito (dopo `assertPhotographWrite`) |
| `getOrCreatePhotoSubmissionForUrl` | Solo URL della **Galleria Fotografica** città (mai Presentation Media) |
| `updatePhotoData` | Se aggiorna `image_url`: stesso write-boundary (`assertPhotographWrite`) prima dell’update |
| `listPhotoSubmissionsForModeration` | Solo admin moderazione — **non** è una galleria |
| `getCityPhotographicGalleryAssets` | Solo `details.gallery` (Galleria Fotografica); alias deprecato `getCityOfficialMedia` |
| Display Placeholder POI | `resolvePoiDisplayImageUrl` / `ImageWithFallback` — canale Platform Assets, fuori dalle gallerie |
| Presentation città (Hero/Card) | `cities.hero_image` / `cities.image_url` — UI header/card, **fuori** da Photo |
| Eliminazione / replace Asset Globali | Clear/update `global_settings` + `retirePlatformPlaceholderUrls` (tombstone SoT) + `deleteAdminAssetByUrl` **best-effort** dopo Settings — **non** tocca `photo_submissions` |

### Invarianti

1. Placeholder non entrano in `photo_submissions` (insert **né** update di `image_url`), inclusi URL Asset Globali già sostituiti/eliminati (retired origin).
2. **Presentation Media** non entrano in `photo_submissions` e non sono mergeati nelle gallerie Photo.
3. Le schermate galleria non filtrano Placeholder/Presentation e non conoscono quei concetti.
4. Lettura gallerie: positive filter `media_status = 'real'` (non euristiche URL).
5. `image_status` su città/POI resta stato di *display entità* (ortogonale al dominio Photo).
6. Decisione scrittura Photo: esclusivamente `evaluatePhotographWrite` (materializzata da `assertPhotographWrite`); registry = origine permanente Placeholder (attivi + tombstone).

---

## GOVERNANCE FOTO: OFFICIAL VS COMMUNITY

### Layer editoriale

| Layer | Scopo | Governance |
|-------|--------|------------|
| **Touring Diary Official** | Fotografie della Galleria Fotografica città (e promozione editoriale di foto già in Photo) | `is_official: true` su `photo_submissions` |
| **Community** | UGC, live feed, varietà prospettive | `is_official: false`; ordinamento per like |

Hero / Card / cover entità **non** sono Official Photograph: restano Presentation Media.

### Source of truth

- Colonna **`is_official`** su `photo_submissions` (boolean, non nullable in types).
- **Fallback legacy** in mapper: `is_official ?? (user_id === SYSTEM_USER_ID)` — paracadute temporaneo (`mediaService.mapDbPhotoSubmission`).

### Mapper

`mapDbPhotoSubmission` in `mediaService.ts` → domain `PhotoSubmission.isOfficial`.

**Nota:** `rankingService.ts` usa `is_official ?? false` senza fallback SYSTEM_USER_ID — inconsistenza minore documentata.

### Pipeline gallery città

**Hook:** `useCityGallery.ts`
- Caricamento via **`listPhotographs`** (solo Fotografie)
- Split `officialPhotos` / `communityPhotos` per `isOfficial`
- `defaultTab`: `'official'` se official > 5, altrimenti `'community'`
- Top-10 partition: `topOfficial` vs `topCommunity` (approved, sorted)
- Paginazione solo su community
- Official da città: `getCityPhotographicGalleryAssets` → `getOrCreatePhotoSubmissionForUrl` (solo Galleria Fotografica; write-boundary attivo)

**UI:** `GalleryGrid.tsx` — tab switcher Official/Community; upload solo tab Community.

### Admin e moderazione

- Lista admin: `listPhotoSubmissionsForModeration` (può includere legacy non-fotografia per bonifica)
- Promozione a ufficiale: `usePhotoModeration.handleToggleOfficial`
- **Workflow fotografico Community unico** (Live Feed + Galleria città) — step UX:
  1. **Pubblica Foto** → `PhotoAcquireDialog` (Scatta / Galleria; Scatta disabilitato su desktop)
  2. **Scatta** → `InAppCameraCapture` (`getUserMedia` in-page; **non** `<input capture>` di sistema — evita background del tab / reload HMR in tunnel mobile)
  3. **Editor** (`UserPhotoEditor`) — pannello Regola + pannello **Filtri** (preset)
  4. **Metadati** (`CommunityPhotoPublishModal`) — stessa schermata su entrambi gli entry-point
  5. **Pubblica** → `uploadCommunityPhoto` → `photo_submissions` (solo derivato finale; originale solo in memoria sessione)
- Orchestrazione: `useCommunityPhotoPublish` + `CommunityPhotoWorkflow`
- Domini invariati: **un solo dominio Foto**; **un solo dominio Like**
- Centro di Controllo = SoT blocco upload: `feature.moderation.photos` + `feature.moderation.community_posts`
- `AdminPhotoInspector` **fuori scope** (strumento admin invariato)
- Upload admin con toggle Official: `PhotoRow.tsx`
- Normalizzazione `city_id` in promozione (obiettivo: eliminare dipendenza da `locationName`)
- Tab Media città: Hero/Card = Presentation; **Galleria Fotografica** = unica sorgente città verso Photo

### Stato implementazione (certificato)

| Area | Stato |
|------|--------|
| Types + mapper + write `is_official` | ✅ Completato |
| Admin toggle / promozione | ✅ Completato |
| Gallery tab Official/Community | ✅ Completato |
| Dual-family Photograph / Placeholder | ✅ Completato (WF-02 Post-3.4) |
| Presentation Media esclusi da Photo (no auto-promote) | ✅ Completato (codice; bonifica dati legacy separata) |
| `listPhotographs` unica porta gallerie | ✅ Completato |
| Write-boundary + registry Asset Globali (attivi + retired) | ✅ Completato |
| `updatePhotoData` sotto write-boundary | ✅ Completato |
| Euristica `isPlaceholderUrl` rimossa | ✅ Completato |
| Hero enforcement solo `is_official` DB | ⚠️ Parziale — `PreviewHero` / `CityHeader` usano DTO Presentation (`heroImage`), corretto per la nuova regola |
| Rimozione fallback SYSTEM_USER_ID | 🔲 TODO |
| Bonifica legacy Presentation già in `photo_submissions` | 🔲 TODO (dati; fuori da questa fase codice) |
| Solo `city_id` (no `locationName`) | 🔲 TODO parziale |

---

## PIPELINE RUNTIME: MEDIA PROPAGATION

1. **Trigger**: Admin aggiorna/elimina foto da galleria o `community_posts`.
2. **Hook**: `useCityGallery.ts`
3. **Service**: `mediaService.ts` / `photoService.ts` — `propagatePhotoRemoval`, `syncPhotoDescriptionToCity`
4. **Logic**: Ricerca utilizzi URL in Cities, POIs, People, Shops, …
5. **Update**: Sostituzione URL o rimozione atomica
6. **Audit**: `getAssetUsageMap`
7. **UI**: Aggiornamento real-time

---

## COMPONENTI COINVOLTI

* **Domain:** `domain/photos/*`, `domain/placeholders/*`
* **Services:** `mediaService.ts`, `photoService.ts`, `cityMediaService.ts`, `settingsService.ts` (registry Placeholder)
* **Hooks:** `useCityGallery.ts`, `usePhotoModeration.ts`, `useCommunityPhotoPublish.ts`
* **UI:** `GalleryGrid.tsx`, `CityGallery.tsx`, `LiveFeedTab.tsx`, `PreviewGallery.tsx`, `PreviewHero.tsx`, `PhotoModeration`
* **Storage:** `community-photos`, `public-media` (`admin_assets` per Asset Globali)
* **Tabelle:** `photo_submissions`, `cities`, `pois`, `city_people`, `shops`, `city_events`, `city_guides`, `community_posts`, `global_settings` (Placeholder SoT)

---

## INTEGRAZIONE

* **Community Media:** Approvazione e promozione editoriale **dentro** Photograph (`is_official`); Hero/Card restano Presentation Media
* **Staging:** Immagini su POI importati = Presentation (non Photo)
* **Design System / Asset Globali:** Placeholder di categoria e background (DOC 32 Foundation invariato per questo track)
* **Favicon (Asset Globali):** chiave `favicon_image` in `global_settings`; Admin → Asset Globali → Favicon (stesso `AdminPhotoInspector` / `admin_assets`); runtime `GET /favicon.ico` (Express, sempre HTTP 200) + `<link rel="icon" href="/favicon.ico" sizes="any" />` in `index.html`
* **Rankings:** foto via SoT dominio Photograph

---

## CRONOLOGIA

| Versione | Data | Modifiche |
|----------|------|-----------|
| 1.0 | — | Pipeline propagation |
| 2.0 | 2026-07-13 | WF-01: governance `is_official`, gallery partition, stato implementazione |
| 2.1 | 2026-07-21 | WF-02: dual-family Photograph vs Placeholder; `listPhotographs`; write-boundary; rimozione euristiche URL |
| 2.2 | 2026-07-22 | Origin tombstones (`retired_platform_placeholder_urls`); write-boundary anche su `updatePhotoData` |
| 2.3 | 2026-07-22 | Presentation Media esclusi da Photograph; solo Galleria Fotografica città + Community + Admin foto |
