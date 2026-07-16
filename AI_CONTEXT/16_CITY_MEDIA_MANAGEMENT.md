# 🖼️ DOC 16: CITY MEDIA MANAGEMENT (v2.0 — CERTIFIED)

Questo documento descrive la pipeline di gestione, ottimizzazione e propagazione degli asset multimediali delle città, inclusa la **governance editoriale foto** (layer Official vs Community).

> Storico piano implementativo: `docs/_archive/media/implementationplan_foto.md`

---

## DESCRIZIONE SEMPLICE

Il sistema gestisce le foto delle città e dei luoghi, separa contenuti **ufficiali** da contenuti **community**, propaga le modifiche in tutta l'app e traccia l'utilizzo di ogni asset.

---

## GOVERNANCE FOTO: OFFICIAL VS COMMUNITY

### Layer editoriale

| Layer | Scopo | Governance |
|-------|--------|------------|
| **Touring Diary Official** | Hero, vetrina città, identità visiva, dati AI | `is_official: true` su `photo_submissions` |
| **Community** | UGC, live feed, varietà prospettive | `is_official: false`; ordinamento per like |

### Source of truth

- Colonna **`is_official`** su `photo_submissions` (boolean, non nullable in types).
- **Fallback legacy** in mapper: `is_official ?? (user_id === SYSTEM_USER_ID)` — paracadute temporaneo (`mediaService.mapDbPhotoSubmission`).

### Mapper

`mapDbPhotoSubmission` in `mediaService.ts` → domain `PhotoSubmission.isOfficial`.

**Nota:** `rankingService.ts` usa `is_official ?? false` senza fallback SYSTEM_USER_ID — inconsistenza minore documentata.

### Pipeline gallery città

**Hook:** `useCityGallery.ts`
- Split `officialPhotos` / `communityPhotos` per `isOfficial`
- `defaultTab`: `'official'` se official > 5, altrimenti `'community'`
- Top-10 partition: `topOfficial` vs `topCommunity` (approved, sorted)
- Paginazione solo su community

**UI:** `GalleryGrid.tsx` — tab switcher Official/Community; upload solo tab Community.

**Asset città non-DB:** `getCityOfficialMedia(city)` da DTO città (hero, gallery POI) — registrati via `getOrCreatePhotoSubmissionForUrl` con `is_official: true`.

### Admin e moderazione

- Promozione a ufficiale: `usePhotoModeration.handleToggleOfficial`
- Upload admin con toggle: `PhotoRow.tsx`, `LiveFeedTab.tsx`
- Normalizzazione `city_id` in promozione (obiettivo: eliminare dipendenza da `locationName`)

### Stato implementazione (certificato)

| Area | Stato |
|------|--------|
| Types + mapper + write `is_official` | ✅ Completato |
| Admin toggle / promozione | ✅ Completato |
| Gallery tab Official/Community | ✅ Completato |
| Hero enforcement solo `is_official` DB | ⚠️ Parziale — `PreviewHero` usa `city.details.heroImage` (DTO), non filtro DB |
| Rimozione fallback SYSTEM_USER_ID | 🔲 TODO |
| Solo `city_id` (no `locationName`) | 🔲 TODO parziale |

---

## PIPELINE RUNTIME: MEDIA PROPAGATION

1. **Trigger**: Admin aggiorna/elimina foto da galleria o `community_posts`.
2. **Hook**: `useCityGallery.ts`
3. **Service**: `mediaService.ts` — `propagatePhotoRemoval`, `syncPhotoDescriptionToCity`
4. **Logic**: Ricerca utilizzi URL in Cities, POIs, People, Shops, …
5. **Update**: Sostituzione URL o rimozione atomica
6. **Audit**: `getAssetUsageMap`
7. **UI**: Aggiornamento real-time

---

## COMPONENTI COINVOLTI

* **Services:** `mediaService.ts`, `photoService.ts`, `cityMediaService.ts`
* **Hooks:** `useCityGallery.ts`, `usePhotoModeration.ts`
* **UI:** `GalleryGrid.tsx`, `CityGallery.tsx`, `PreviewHero.tsx`, `PhotoModeration`
* **Storage:** `community-photos`, `public-media`
* **Tabelle:** `photo_submissions`, `cities`, `pois`, `city_people`, `shops`, `city_events`, `city_guides`, `community_posts`

---

## INTEGRAZIONE

* **Community Media:** Approvazione e promozione foto a Hero
* **Staging:** Immagini su POI importati
* **Design System:** Background template social (DOC 32)

---

## CRONOLOGIA

| Versione | Data | Modifiche |
|----------|------|-----------|
| 1.0 | — | Pipeline propagation |
| 2.0 | 2026-07-13 | WF-01: governance `is_official`, gallery partition, stato implementazione |
