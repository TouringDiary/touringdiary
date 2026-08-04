# b-suspicious

> Dettaglio baseline Biome full-project. Dashboard: [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md)

| Campo | Valore |
|----|----|
| **Documento** | `AI_QUALITY/biome/B_suspicious_iterable_shadow_assign.md` |
| **Categorie** | `lint/suspicious/useIterableCallbackReturn`, `lint/suspicious/noShadowRestrictedNames`, `lint/suspicious/noAssignInExpressions`, `lint/suspicious/noTemplateCurlyInString`, `lint/suspicious/noImplicitAnyLet` |
| **Occorrenze (somma gruppo)** | **62** |
| **File unici nel gruppo** | **44** |
| **Livello** | **B** |
| **Ultimo aggiornamento** | 2026-08-03 |
| **Stato** | Baseline ufficiale — nessuna correzione applicata in questa attivita |

## `lint/suspicious/useIterableCallbackReturn`

### Descrizione della regola

Return value nei callback di forEach/map usato in modo sospetto.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/suspicious/useIterableCallbackReturn` |
| **Occorrenze totali** | **33** |
| **Error** | 33 |
| **Warning** | 0 |
| **Info** | 0 |
| **File coinvolti** | **18** |
| **Livello di rischio** | **B** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

forEach return vs for..of/map; rischio cambio flusso.

### Strategia di correzione

for...of / map esplicito dopo lettura.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/hooks/admin/useAiCompleteCity.ts` | 4 |
| `src/services/mediaService.ts` | 4 |
| `src/hooks/admin/useAiMagicCity.ts` | 3 |
| `src/components/admin/GlobalEventsManager.tsx` | 2 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseAffiliate.ts` | 2 |
| `src/hooks/ui/useFlipSwap.ts` | 2 |
| `src/hooks/useCityList.ts` | 2 |
| `src/hooks/usePoiManager.ts` | 2 |
| `src/hooks/useSponsorOperations.ts` | 2 |
| `src/services/city/cityReadService.ts` | 2 |
| `scripts/qa-macrofase-c.ts` | 1 |
| `scripts/validate-packing-domain-catalog.ts` | 1 |
| `src/components/modals/cityInfo/CityEventsTab.tsx` | 1 |
| `src/hooks/useAdminExport.ts` | 1 |
| `src/services/aiAdminService.ts` | 1 |
| `src/services/city/cityLifecycleService.ts` | 1 |
| `src/services/suitcase/suitcaseTemplateService.ts` | 1 |
| `src/utils/deriveItineraryCityTypes.ts` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `scripts/qa-macrofase-c.ts` | 191 | error | da correggere (Livello B) |
| 2 | `scripts/validate-packing-domain-catalog.ts` | 19 | error | da correggere (Livello B) |
| 3 | `src/components/admin/GlobalEventsManager.tsx` | 86 | error | da correggere (Livello B) |
| 4 | `src/components/admin/GlobalEventsManager.tsx` | 87 | error | da correggere (Livello B) |
| 5 | `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseAffiliate.ts` | 83 | error | da correggere (Livello B) |
| 6 | `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseAffiliate.ts` | 84 | error | da correggere (Livello B) |
| 7 | `src/components/modals/cityInfo/CityEventsTab.tsx` | 26 | error | da correggere (Livello B) |
| 8 | `src/hooks/admin/useAiCompleteCity.ts` | 192 | error | da correggere (Livello B) |
| 9 | `src/hooks/admin/useAiCompleteCity.ts` | 193 | error | da correggere (Livello B) |
| 10 | `src/hooks/admin/useAiCompleteCity.ts` | 194 | error | da correggere (Livello B) |
| 11 | `src/hooks/admin/useAiCompleteCity.ts` | 195 | error | da correggere (Livello B) |
| 12 | `src/hooks/admin/useAiMagicCity.ts` | 259 | error | da correggere (Livello B) |
| 13 | `src/hooks/admin/useAiMagicCity.ts` | 267 | error | da correggere (Livello B) |
| 14 | `src/hooks/admin/useAiMagicCity.ts` | 268 | error | da correggere (Livello B) |
| 15 | `src/hooks/ui/useFlipSwap.ts` | 98 | error | da correggere (Livello B) |
| 16 | `src/hooks/ui/useFlipSwap.ts` | 99 | error | da correggere (Livello B) |
| 17 | `src/hooks/useAdminExport.ts` | 168 | error | da correggere (Livello B) |
| 18 | `src/hooks/useCityList.ts` | 105 | error | da correggere (Livello B) |
| 19 | `src/hooks/useCityList.ts` | 106 | error | da correggere (Livello B) |
| 20 | `src/hooks/usePoiManager.ts` | 173 | error | da correggere (Livello B) |
| 21 | `src/hooks/usePoiManager.ts` | 175 | error | da correggere (Livello B) |
| 22 | `src/hooks/useSponsorOperations.ts` | 62 | error | da correggere (Livello B) |
| 23 | `src/hooks/useSponsorOperations.ts` | 64 | error | da correggere (Livello B) |
| 24 | `src/services/aiAdminService.ts` | 408 | error | da correggere (Livello B) |
| 25 | `src/services/city/cityLifecycleService.ts` | 191 | error | da correggere (Livello B) |
| 26 | `src/services/city/cityReadService.ts` | 230 | error | da correggere (Livello B) |
| 27 | `src/services/city/cityReadService.ts` | 266 | error | da correggere (Livello B) |
| 28 | `src/services/mediaService.ts` | 133 | error | da correggere (Livello B) |
| 29 | `src/services/mediaService.ts` | 156 | error | da correggere (Livello B) |
| 30 | `src/services/mediaService.ts` | 159 | error | da correggere (Livello B) |
| 31 | `src/services/mediaService.ts` | 163 | error | da correggere (Livello B) |
| 32 | `src/services/suitcase/suitcaseTemplateService.ts` | 230 | error | da correggere (Livello B) |
| 33 | `src/utils/deriveItineraryCityTypes.ts` | 36 | error | da correggere (Livello B) |

## `lint/suspicious/noShadowRestrictedNames`

### Descrizione della regola

Shadowing di nomi riservati/globali (es. name).

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/suspicious/noShadowRestrictedNames` |
| **Occorrenze totali** | **15** |
| **Error** | 15 |
| **Warning** | 0 |
| **Info** | 0 |
| **File coinvolti** | **15** |
| **Livello di rischio** | **B** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Rename name/value/ecc. richiede aggiornare usi.

### Strategia di correzione

Rename locale + usi.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/components/admin/cities/GeoCascadingFilters.tsx` | 1 |
| `src/components/admin/cities/StrategicMapTab.tsx` | 1 |
| `src/components/admin/layout/AdminSidebar.tsx` | 1 |
| `src/components/city/CityHeader.tsx` | 1 |
| `src/components/features/diary/header/DiaryHeaderToolbar.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseUtils.tsx` | 1 |
| `src/components/itineraries/ItinerariesExplorer.tsx` | 1 |
| `src/components/myspace/MySpaceCityPickModal.tsx` | 1 |
| `src/components/myspace/MySpaceCityThumbCollage.tsx` | 1 |
| `src/components/myspace/MySpaceTripsCatalog.tsx` | 1 |
| `src/components/myspace/ViaggioMappaGoogleEmbed.tsx` | 1 |
| `src/components/shop/ShopPage.tsx` | 1 |
| `src/components/user/dashboard/UserSidebar.tsx` | 1 |
| `src/components/user/dashboard/UserTripsTab.tsx` | 1 |
| `src/services/ai/aiUtils.ts` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `src/components/admin/cities/GeoCascadingFilters.tsx` | 3 | error | da correggere (Livello B) |
| 2 | `src/components/admin/cities/StrategicMapTab.tsx` | 3 | error | da correggere (Livello B) |
| 3 | `src/components/admin/layout/AdminSidebar.tsx` | 3 | error | da correggere (Livello B) |
| 4 | `src/components/city/CityHeader.tsx` | 3 | error | da correggere (Livello B) |
| 5 | `src/components/features/diary/header/DiaryHeaderToolbar.tsx` | 2 | error | da correggere (Livello B) |
| 6 | `src/components/features/diary/packing_list/suitcase/SuitcaseUtils.tsx` | 14 | error | da correggere (Livello B) |
| 7 | `src/components/itineraries/ItinerariesExplorer.tsx` | 4 | error | da correggere (Livello B) |
| 8 | `src/components/myspace/MySpaceCityPickModal.tsx` | 3 | error | da correggere (Livello B) |
| 9 | `src/components/myspace/MySpaceCityThumbCollage.tsx` | 2 | error | da correggere (Livello B) |
| 10 | `src/components/myspace/MySpaceTripsCatalog.tsx` | 2 | error | da correggere (Livello B) |
| 11 | `src/components/myspace/ViaggioMappaGoogleEmbed.tsx` | 4 | error | da correggere (Livello B) |
| 12 | `src/components/shop/ShopPage.tsx` | 4 | error | da correggere (Livello B) |
| 13 | `src/components/user/dashboard/UserSidebar.tsx` | 3 | error | da correggere (Livello B) |
| 14 | `src/components/user/dashboard/UserTripsTab.tsx` | 1 | error | da correggere (Livello B) |
| 15 | `src/services/ai/aiUtils.ts` | 39 | error | da correggere (Livello B) |

## `lint/suspicious/noAssignInExpressions`

### Descrizione della regola

Assegnazione usata dentro espressioni.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/suspicious/noAssignInExpressions` |
| **Occorrenze totali** | **3** |
| **Error** | 3 |
| **Warning** | 0 |
| **Info** | 0 |
| **File coinvolti** | **2** |
| **Livello di rischio** | **B** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Assegnazione in if/while; va separata con cura.

### Strategia di correzione

Estrarre assegnazione prima del test.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `scripts/_bundle_import_trace.mjs` | 2 |
| `src/utils/stringUtils.ts` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `scripts/_bundle_import_trace.mjs` | 75 | error | da correggere (Livello B) |
| 2 | `scripts/_bundle_import_trace.mjs` | 80 | error | da correggere (Livello B) |
| 3 | `src/utils/stringUtils.ts` | 14 | error | da correggere (Livello B) |

## `lint/suspicious/noTemplateCurlyInString`

### Descrizione della regola

Sequenza ${} dentro stringa non-template.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/suspicious/noTemplateCurlyInString` |
| **Occorrenze totali** | **2** |
| **Error** | 0 |
| **Warning** | 2 |
| **Info** | 0 |
| **File coinvolti** | **2** |
| **Livello di rischio** | **B** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Puo essere stringa letterale intenzionale o bug template.

### Strategia di correzione

Verificare intent; template o escape.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `scripts/smoke-mp02-step2.ts` | 1 |
| `scripts/smoke-mp02-step3.ts` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `scripts/smoke-mp02-step2.ts` | 55 | warning | da correggere (Livello B) |
| 2 | `scripts/smoke-mp02-step3.ts` | 94 | warning | da correggere (Livello B) |

## `lint/suspicious/noImplicitAnyLet`

### Descrizione della regola

Variabile let senza tipo ne inizializzatore (implicit any).

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/suspicious/noImplicitAnyLet` |
| **Occorrenze totali** | **9** |
| **Error** | 9 |
| **Warning** | 0 |
| **Info** | 0 |
| **File coinvolti** | **7** |
| **Livello di rischio** | **B** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Serve annotazione tipo corretta dal contesto.

### Strategia di correzione

Annotare tipo o inizializzare.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/services/collaboration/resourceInviteService.ts` | 2 |
| `src/services/collaboration/workspaceInviteService.ts` | 2 |
| `src/components/admin/cities/RegionalAnalysisModal.tsx` | 1 |
| `src/components/admin/poiModal/PoiInfoTab.tsx` | 1 |
| `src/components/modals/SectionPreviewModal.tsx` | 1 |
| `src/services/sponsors/sponsorRequestsService.ts` | 1 |
| `src/services/storageService.ts` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `src/components/admin/cities/RegionalAnalysisModal.tsx` | 116 | error | da correggere (Livello B) |
| 2 | `src/components/admin/poiModal/PoiInfoTab.tsx` | 18 | error | da correggere (Livello B) |
| 3 | `src/components/modals/SectionPreviewModal.tsx` | 103 | error | da correggere (Livello B) |
| 4 | `src/services/collaboration/resourceInviteService.ts` | 206 | error | da correggere (Livello B) |
| 5 | `src/services/collaboration/resourceInviteService.ts` | 207 | error | da correggere (Livello B) |
| 6 | `src/services/collaboration/workspaceInviteService.ts` | 201 | error | da correggere (Livello B) |
| 7 | `src/services/collaboration/workspaceInviteService.ts` | 202 | error | da correggere (Livello B) |
| 8 | `src/services/sponsors/sponsorRequestsService.ts` | 32 | error | da correggere (Livello B) |
| 9 | `src/services/storageService.ts` | 92 | error | da correggere (Livello B) |

