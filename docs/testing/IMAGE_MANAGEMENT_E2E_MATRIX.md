# Image Management — Matrice E2E (Macrofase 5)

> Checklist click-per-click / operativa. Stato compilato post-sviluppo MF5 nel repository.
> Legenda: **PASS** (verificato statico/codice) · **NON VERIFICATO** (richiede staging/DB) · **FAIL**

| # | Scenario | Stato | Note |
|---|----------|-------|------|
| 1 | Personaggio con immagine Admin | NON VERIFICATO | Richiede Admin + città staging |
| 2 | Personaggio assignment-based | PASS | Cutover read `applyPrimaryImageCutoverForCityPeople` |
| 3 | Personaggio senza immagine | PASS | Parser + cutover no-op |
| 4 | Personaggio AI | NON VERIFICATO | Flusso `generateHistoricalPortrait` su staging |
| 5 | Personaggio placeholder | NON VERIFICATO | Asset globali + UI |
| 6 | Personaggio con report | NON VERIFICATO | Hub Segnalazioni staging |
| 7 | Immagine con report | NON VERIFICATO | content_reports + assignment |
| 8 | Report immagine + entità (Modello B) | NON VERIFICATO | MF2 su staging |
| 9 | Evidenza permanente | NON VERIFICATO | Storage report-evidence |
| 10 | SUSPENDED | PASS | `maskSuspendedPrimaryImagesForPeople` invariato |
| 11 | Patrono SUSPENDED → SUGGERISCI | NON VERIFICATO | UI Patrono staging |
| 12 | POI | NON VERIFICATO | Pubblico staging |
| 13 | Rivendica POI | PASS | Nessuna modifica `PoiClaimModal.tsx` in MF5 |
| 14 | Community | NON VERIFICATO | photo_submissions |
| 15 | Gallery | NON VERIFICATO | UI città |
| 16 | Lightbox | NON VERIFICATO | UI |
| 17 | Culture Corner | PASS | Wrapper report invariato; regeneration city-scoped portrait |
| 18 | Import AI city | PASS | Caller `findExistingPortrait(name, cityId)` |
| 19 | findExistingPortrait città corretta | PASS | Query `eq('city_id')` + ORDER deterministico |
| 20 | Stesso nome, città diverse | PASS | Scope city_id impedisce cross-city |
| 21 | Media Library / usage map | PASS | `buildAssetUsageMap` assignment + legacy |
| 22 | Backfill | NON VERIFICATO | Eseguire `scripts/backfill_media_assets_from_legacy.ts` dry-run su staging |
| 23 | Cutover read | PASS | entitiesService + cityReadService API path |
| 24 | Orphan dry-run | NON VERIFICATO | `scripts/cleanup_orphan_storage.ts` default dry-run |
| 25 | Regressioni flussi legacy | PASS | Dual-write write-path mantenuto §42.15 |

## Comandi tecnici MF5

```bash
npm run mf5:smoke
npm run check
npx tsx scripts/backfill_media_assets_from_legacy.ts
npx tsx scripts/backfill_media_assets_from_legacy.ts --verify
npx tsx scripts/cleanup_orphan_storage.ts
```

## Post-MF5 (D90 / §42.16)

Atomicità end-to-end entità + assignment: **fuori perimetro MF5** — documentata, non implementata.
