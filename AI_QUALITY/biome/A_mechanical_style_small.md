# a-mechanical-style-small

> Dettaglio baseline Biome full-project. Dashboard: [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md)

| Campo | Valore |
|----|----|
| **Documento** | `AI_QUALITY/biome/A_mechanical_style_small.md` |
| **Categorie** | `lint/style/useConst`, `lint/correctness/useParseIntRadix`, `lint/style/useNodejsImportProtocol`, `lint/complexity/useLiteralKeys`, `lint/style/useTemplate`, `lint/style/useExponentiationOperator`, `lint/complexity/noUselessEscapeInRegex`, `lint/complexity/noUselessUndefinedInitialization`, `lint/complexity/noUselessSwitchCase`, `lint/complexity/noUselessFragments`, `lint/complexity/noUselessTernary`, `lint/complexity/noUselessLoneBlockStatements`, `lint/suspicious/noUselessEscapeInString`, `lint/suspicious/noEmptyInterface` |
| **Occorrenze (somma gruppo)** | **211** |
| **File unici nel gruppo** | **108** |
| **Livello** | **A** |
| **Ultimo aggiornamento** | 2026-08-03 |
| **Stato** | Baseline ufficiale — nessuna correzione applicata in questa attivita |

## `lint/style/useConst`

### Descrizione della regola

Variabili let mai riassegnate devono essere const.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/style/useConst` |
| **Occorrenze totali** | **31** |
| **Error** | 0 |
| **Warning** | 31 |
| **Info** | 0 |
| **File coinvolti** | **22** |
| **Livello di rischio** | **A** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

let→const su binding non riassegnati; meccanico.

### Strategia di correzione

Safe autofix useConst.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/components/admin/cityEditor/EditorGeneral.tsx` | 2 |
| `src/components/admin/cityEditor/tabs/TabGeneral.tsx` | 2 |
| `src/components/city/tabs/CityShowcaseTab.tsx` | 2 |
| `src/components/modals/HistoryModal.tsx` | 2 |
| `src/components/modals/PatronSaintModal.tsx` | 2 |
| `src/hooks/useCityList.ts` | 2 |
| `src/hooks/useDiaryLogic.ts` | 2 |
| `src/services/partnerIntegrationService.ts` | 2 |
| `src/services/settingsService.ts` | 2 |
| `src/components/admin/AdminUserManager.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabLogs.tsx` | 1 |
| `src/components/admin/PartnerDetailModal.tsx` | 1 |
| `src/components/aiPlanner/AiPlannerForm.tsx` | 1 |
| `src/components/city/tabs/CityCategoryTab.tsx` | 1 |
| `src/context/CityEditorContext.tsx` | 1 |
| `src/services/ai/aiPlanner.ts` | 1 |
| `src/services/ai/aiUtils.ts` | 1 |
| `src/services/city/cityReadService.ts` | 1 |
| `src/services/globalEventsService.ts` | 1 |
| `src/services/photoService.ts` | 1 |
| `src/services/sponsors/sponsorRequestsService.ts` | 1 |
| `src/utils/stringUtils.ts` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `src/components/admin/AdminUserManager.tsx` | 183 | warning | da correggere (Livello A) |
| 2 | `src/components/admin/cityEditor/EditorGeneral.tsx` | 56 | warning | da correggere (Livello A) |
| 3 | `src/components/admin/cityEditor/EditorGeneral.tsx` | 99 | warning | da correggere (Livello A) |
| 4 | `src/components/admin/cityEditor/tabs/TabGeneral.tsx` | 59 | warning | da correggere (Livello A) |
| 5 | `src/components/admin/cityEditor/tabs/TabGeneral.tsx` | 98 | warning | da correggere (Livello A) |
| 6 | `src/components/admin/cityEditor/tabs/TabLogs.tsx` | 12 | warning | da correggere (Livello A) |
| 7 | `src/components/admin/PartnerDetailModal.tsx` | 170 | warning | da correggere (Livello A) |
| 8 | `src/components/aiPlanner/AiPlannerForm.tsx` | 236 | warning | da correggere (Livello A) |
| 9 | `src/components/city/tabs/CityCategoryTab.tsx` | 251 | warning | da correggere (Livello A) |
| 10 | `src/components/city/tabs/CityShowcaseTab.tsx` | 34 | warning | da correggere (Livello A) |
| 11 | `src/components/city/tabs/CityShowcaseTab.tsx` | 38 | warning | da correggere (Livello A) |
| 12 | `src/components/modals/HistoryModal.tsx` | 31 | warning | da correggere (Livello A) |
| 13 | `src/components/modals/HistoryModal.tsx` | 53 | warning | da correggere (Livello A) |
| 14 | `src/components/modals/PatronSaintModal.tsx` | 54 | warning | da correggere (Livello A) |
| 15 | `src/components/modals/PatronSaintModal.tsx` | 64 | warning | da correggere (Livello A) |
| 16 | `src/context/CityEditorContext.tsx` | 155 | warning | da correggere (Livello A) |
| 17 | `src/hooks/useCityList.ts` | 66 | warning | da correggere (Livello A) |
| 18 | `src/hooks/useCityList.ts` | 67 | warning | da correggere (Livello A) |
| 19 | `src/hooks/useDiaryLogic.ts` | 209 | warning | da correggere (Livello A) |
| 20 | `src/hooks/useDiaryLogic.ts` | 210 | warning | da correggere (Livello A) |
| 21 | `src/services/ai/aiPlanner.ts` | 88 | warning | da correggere (Livello A) |
| 22 | `src/services/ai/aiUtils.ts` | 16 | warning | da correggere (Livello A) |
| 23 | `src/services/city/cityReadService.ts` | 314 | warning | da correggere (Livello A) |
| 24 | `src/services/globalEventsService.ts` | 79 | warning | da correggere (Livello A) |
| 25 | `src/services/partnerIntegrationService.ts` | 21 | warning | da correggere (Livello A) |
| 26 | `src/services/partnerIntegrationService.ts` | 66 | warning | da correggere (Livello A) |
| 27 | `src/services/photoService.ts` | 412 | warning | da correggere (Livello A) |
| 28 | `src/services/settingsService.ts` | 101 | warning | da correggere (Livello A) |
| 29 | `src/services/settingsService.ts` | 279 | warning | da correggere (Livello A) |
| 30 | `src/services/sponsors/sponsorRequestsService.ts` | 102 | warning | da correggere (Livello A) |
| 31 | `src/utils/stringUtils.ts` | 14 | warning | da correggere (Livello A) |

## `lint/correctness/useParseIntRadix`

### Descrizione della regola

parseInt deve specificare il radix.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/correctness/useParseIntRadix` |
| **Occorrenze totali** | **55** |
| **Error** | 0 |
| **Warning** | 0 |
| **Info** | 55 |
| **File coinvolti** | **32** |
| **Livello di rischio** | **A** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Aggiunta radix 10 esplicita; semantica invariata per decimali.

### Strategia di correzione

Aggiungere secondo argomento 10.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/components/admin/AdminPhotoInspector.tsx` | 4 |
| `src/components/admin/economics/PricingManager.tsx` | 4 |
| `src/components/admin/economics/SustainabilityHelper.tsx` | 4 |
| `src/components/admin/AdminGamification.tsx` | 3 |
| `src/components/admin/cities/RegionalAnalysisModal.tsx` | 3 |
| `src/components/aiPlanner/AiPlannerForm.tsx` | 3 |
| `src/components/admin/AdminSocialStudio.tsx` | 2 |
| `src/components/admin/cityEditor/culture/CulturePeople.tsx` | 2 |
| `src/components/admin/cityEditor/EditorCulture.tsx` | 2 |
| `src/components/admin/marketing/AdminCreditPackages.tsx` | 2 |
| `src/components/admin/marketing/AiLimitsPanel.tsx` | 2 |
| `src/components/admin/onboarding/OnboardingVisualEditor.tsx` | 2 |
| `src/components/features/diary/ItineraryItemCard.tsx` | 2 |
| `src/components/layout/OnboardingWizard.tsx` | 2 |
| `src/components/admin/AdminItineraryEditor.tsx` | 1 |
| `src/components/admin/cities/CitiesListTab.tsx` | 1 |
| `src/components/admin/cityEditor/EditorGeneral.tsx` | 1 |
| `src/components/admin/cityEditor/EditorRatings.tsx` | 1 |
| `src/components/admin/cityEditor/services/ServiceEvents.tsx` | 1 |
| `src/components/admin/cityEditor/services/ServiceGeneric.tsx` | 1 |
| `src/components/admin/cityEditor/services/ServiceGuides.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabGeneral.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabRatings.tsx` | 1 |
| `src/components/admin/LoadingTipsManager.tsx` | 1 |
| `src/components/admin/observatory/ObservatoryFilterDrawer.tsx` | 1 |
| `src/components/admin/poiModal/PoiLogisticsTab.tsx` | 1 |
| `src/components/admin/sponsor/SponsorToolbar.tsx` | 1 |
| `src/components/modals/AroundMeWizard.tsx` | 1 |
| `src/components/modals/cityInfo/ServiceAiHunter.tsx` | 1 |
| `src/components/modals/MobileMoveModal.tsx` | 1 |
| `src/components/modals/ProvinceModal.tsx` | 1 |
| `src/services/aiAdminService.ts` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `src/components/admin/AdminGamification.tsx` | 314 | info | da correggere (Livello A) |
| 2 | `src/components/admin/AdminGamification.tsx` | 380 | info | da correggere (Livello A) |
| 3 | `src/components/admin/AdminGamification.tsx` | 415 | info | da correggere (Livello A) |
| 4 | `src/components/admin/AdminItineraryEditor.tsx` | 380 | info | da correggere (Livello A) |
| 5 | `src/components/admin/AdminPhotoInspector.tsx` | 308 | info | da correggere (Livello A) |
| 6 | `src/components/admin/AdminPhotoInspector.tsx` | 319 | info | da correggere (Livello A) |
| 7 | `src/components/admin/AdminPhotoInspector.tsx` | 320 | info | da correggere (Livello A) |
| 8 | `src/components/admin/AdminPhotoInspector.tsx` | 321 | info | da correggere (Livello A) |
| 9 | `src/components/admin/AdminSocialStudio.tsx` | 152 | info | da correggere (Livello A) |
| 10 | `src/components/admin/AdminSocialStudio.tsx` | 159 | info | da correggere (Livello A) |
| 11 | `src/components/admin/cities/CitiesListTab.tsx` | 225 | info | da correggere (Livello A) |
| 12 | `src/components/admin/cities/RegionalAnalysisModal.tsx` | 430 | info | da correggere (Livello A) |
| 13 | `src/components/admin/cities/RegionalAnalysisModal.tsx` | 462 | info | da correggere (Livello A) |
| 14 | `src/components/admin/cities/RegionalAnalysisModal.tsx` | 481 | info | da correggere (Livello A) |
| 15 | `src/components/admin/cityEditor/culture/CulturePeople.tsx` | 269 | info | da correggere (Livello A) |
| 16 | `src/components/admin/cityEditor/culture/CulturePeople.tsx` | 353 | info | da correggere (Livello A) |
| 17 | `src/components/admin/cityEditor/EditorCulture.tsx` | 297 | info | da correggere (Livello A) |
| 18 | `src/components/admin/cityEditor/EditorCulture.tsx` | 476 | info | da correggere (Livello A) |
| 19 | `src/components/admin/cityEditor/EditorGeneral.tsx` | 295 | info | da correggere (Livello A) |
| 20 | `src/components/admin/cityEditor/EditorRatings.tsx` | 172 | info | da correggere (Livello A) |
| 21 | `src/components/admin/cityEditor/services/ServiceEvents.tsx` | 66 | info | da correggere (Livello A) |
| 22 | `src/components/admin/cityEditor/services/ServiceGeneric.tsx` | 75 | info | da correggere (Livello A) |
| 23 | `src/components/admin/cityEditor/services/ServiceGuides.tsx` | 64 | info | da correggere (Livello A) |
| 24 | `src/components/admin/cityEditor/tabs/TabGeneral.tsx` | 283 | info | da correggere (Livello A) |
| 25 | `src/components/admin/cityEditor/tabs/TabRatings.tsx` | 173 | info | da correggere (Livello A) |
| 26 | `src/components/admin/economics/PricingManager.tsx` | 281 | info | da correggere (Livello A) |
| 27 | `src/components/admin/economics/PricingManager.tsx` | 298 | info | da correggere (Livello A) |
| 28 | `src/components/admin/economics/PricingManager.tsx` | 312 | info | da correggere (Livello A) |
| 29 | `src/components/admin/economics/PricingManager.tsx` | 326 | info | da correggere (Livello A) |
| 30 | `src/components/admin/economics/SustainabilityHelper.tsx` | 77 | info | da correggere (Livello A) |
| 31 | `src/components/admin/economics/SustainabilityHelper.tsx` | 85 | info | da correggere (Livello A) |
| 32 | `src/components/admin/economics/SustainabilityHelper.tsx` | 98 | info | da correggere (Livello A) |
| 33 | `src/components/admin/economics/SustainabilityHelper.tsx` | 106 | info | da correggere (Livello A) |
| 34 | `src/components/admin/LoadingTipsManager.tsx` | 152 | info | da correggere (Livello A) |
| 35 | `src/components/admin/marketing/AdminCreditPackages.tsx` | 219 | info | da correggere (Livello A) |
| 36 | `src/components/admin/marketing/AdminCreditPackages.tsx` | 230 | info | da correggere (Livello A) |
| 37 | `src/components/admin/marketing/AiLimitsPanel.tsx` | 87 | info | da correggere (Livello A) |
| 38 | `src/components/admin/marketing/AiLimitsPanel.tsx` | 98 | info | da correggere (Livello A) |
| 39 | `src/components/admin/observatory/ObservatoryFilterDrawer.tsx` | 159 | info | da correggere (Livello A) |
| 40 | `src/components/admin/onboarding/OnboardingVisualEditor.tsx` | 422 | info | da correggere (Livello A) |
| 41 | `src/components/admin/onboarding/OnboardingVisualEditor.tsx` | 424 | info | da correggere (Livello A) |
| 42 | `src/components/admin/poiModal/PoiLogisticsTab.tsx` | 78 | info | da correggere (Livello A) |
| 43 | `src/components/admin/sponsor/SponsorToolbar.tsx` | 126 | info | da correggere (Livello A) |
| 44 | `src/components/aiPlanner/AiPlannerForm.tsx` | 334 | info | da correggere (Livello A) |
| 45 | `src/components/aiPlanner/AiPlannerForm.tsx` | 421 | info | da correggere (Livello A) |
| 46 | `src/components/aiPlanner/AiPlannerForm.tsx` | 500 | info | da correggere (Livello A) |
| 47 | `src/components/features/diary/ItineraryItemCard.tsx` | 98 | info | da correggere (Livello A) |
| 48 | `src/components/features/diary/ItineraryItemCard.tsx` | 99 | info | da correggere (Livello A) |
| 49 | `src/components/layout/OnboardingWizard.tsx` | 92 | info | da correggere (Livello A) |
| 50 | `src/components/layout/OnboardingWizard.tsx` | 93 | info | da correggere (Livello A) |
| 51 | `src/components/modals/AroundMeWizard.tsx` | 312 | info | da correggere (Livello A) |
| 52 | `src/components/modals/cityInfo/ServiceAiHunter.tsx` | 47 | info | da correggere (Livello A) |
| 53 | `src/components/modals/MobileMoveModal.tsx` | 106 | info | da correggere (Livello A) |
| 54 | `src/components/modals/ProvinceModal.tsx` | 229 | info | da correggere (Livello A) |
| 55 | `src/services/aiAdminService.ts` | 514 | info | da correggere (Livello A) |

## `lint/style/useNodejsImportProtocol`

### Descrizione della regola

I moduli built-in Node devono usare il protocollo node:.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/style/useNodejsImportProtocol` |
| **Occorrenze totali** | **22** |
| **Error** | 0 |
| **Warning** | 0 |
| **Info** | 22 |
| **File coinvolti** | **14** |
| **Livello di rischio** | **A** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Prefisso node: su built-in; risoluzione invariata.

### Strategia di correzione

Safe autofix useNodejsImportProtocol.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `scripts/generate-foundation-review-docs.ts` | 3 |
| `scripts/generate-packing-catalog-migrations.ts` | 3 |
| `scripts/build-packing-domain-catalog.ts` | 2 |
| `scripts/checkMissingReactHooks.ts` | 2 |
| `scripts/patch_supabase_types.cjs` | 2 |
| `scripts/patch_supabase_types.js` | 2 |
| `scripts/audit-wf13-suitcase-viaggio-links.ts` | 1 |
| `scripts/generate-foundation-migration.ts` | 1 |
| `scripts/generate-myworld-migration.ts` | 1 |
| `scripts/generate-packing-seed.ts` | 1 |
| `scripts/migrate_regions.js` | 1 |
| `scripts/seed_geo.js` | 1 |
| `src/utils/ensureNodePdfPolyfills.ts` | 1 |
| `vite.config.ts` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `scripts/audit-wf13-suitcase-viaggio-links.ts` | 7 | info | da correggere (Livello A) |
| 2 | `scripts/build-packing-domain-catalog.ts` | 5 | info | da correggere (Livello A) |
| 3 | `scripts/build-packing-domain-catalog.ts` | 6 | info | da correggere (Livello A) |
| 4 | `scripts/checkMissingReactHooks.ts` | 2 | info | da correggere (Livello A) |
| 5 | `scripts/checkMissingReactHooks.ts` | 3 | info | da correggere (Livello A) |
| 6 | `scripts/generate-foundation-migration.ts` | 2 | info | da correggere (Livello A) |
| 7 | `scripts/generate-foundation-review-docs.ts` | 5 | info | da correggere (Livello A) |
| 8 | `scripts/generate-foundation-review-docs.ts` | 6 | info | da correggere (Livello A) |
| 9 | `scripts/generate-foundation-review-docs.ts` | 7 | info | da correggere (Livello A) |
| 10 | `scripts/generate-myworld-migration.ts` | 11 | info | da correggere (Livello A) |
| 11 | `scripts/generate-packing-catalog-migrations.ts` | 9 | info | da correggere (Livello A) |
| 12 | `scripts/generate-packing-catalog-migrations.ts` | 10 | info | da correggere (Livello A) |
| 13 | `scripts/generate-packing-catalog-migrations.ts` | 11 | info | da correggere (Livello A) |
| 14 | `scripts/generate-packing-seed.ts` | 7 | info | da correggere (Livello A) |
| 15 | `scripts/migrate_regions.js` | 3 | info | da correggere (Livello A) |
| 16 | `scripts/patch_supabase_types.cjs` | 1 | info | da correggere (Livello A) |
| 17 | `scripts/patch_supabase_types.cjs` | 2 | info | da correggere (Livello A) |
| 18 | `scripts/patch_supabase_types.js` | 1 | info | da correggere (Livello A) |
| 19 | `scripts/patch_supabase_types.js` | 2 | info | da correggere (Livello A) |
| 20 | `scripts/seed_geo.js` | 3 | info | da correggere (Livello A) |
| 21 | `src/utils/ensureNodePdfPolyfills.ts` | 17 | info | da correggere (Livello A) |
| 22 | `vite.config.ts` | 1 | info | da correggere (Livello A) |

## `lint/complexity/useLiteralKeys`

### Descrizione della regola

Preferire property access letterale a bracket notation quando possibile.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/complexity/useLiteralKeys` |
| **Occorrenze totali** | **38** |
| **Error** | 0 |
| **Warning** | 0 |
| **Info** | 38 |
| **File coinvolti** | **8** |
| **Livello di rischio** | **A** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Bracket→dot su chiavi letterali valide; meccanico.

### Strategia di correzione

Safe autofix useLiteralKeys.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/services/importService.ts` | 21 |
| `src/components/city/CityCard.tsx` | 5 |
| `src/services/sponsors/sponsorRequestsService.ts` | 4 |
| `src/components/features/diary/packing_list/suitcase/AffiliateSuggestionBox.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseUtils.tsx` | 2 |
| `src/services/city/cityCache.ts` | 2 |
| `src/components/features/diary/packing_list/suitcase/tabs/OverrideTab.tsx` | 1 |
| `src/hooks/admin/useAffiliateAnalytics.ts` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `src/components/city/CityCard.tsx` | 69 | info | da correggere (Livello A) |
| 2 | `src/components/city/CityCard.tsx` | 70 | info | da correggere (Livello A) |
| 3 | `src/components/city/CityCard.tsx` | 71 | info | da correggere (Livello A) |
| 4 | `src/components/city/CityCard.tsx` | 72 | info | da correggere (Livello A) |
| 5 | `src/components/city/CityCard.tsx` | 73 | info | da correggere (Livello A) |
| 6 | `src/components/features/diary/packing_list/suitcase/AffiliateSuggestionBox.tsx` | 68 | info | da correggere (Livello A) |
| 7 | `src/components/features/diary/packing_list/suitcase/AffiliateSuggestionBox.tsx` | 168 | info | da correggere (Livello A) |
| 8 | `src/components/features/diary/packing_list/suitcase/SuitcaseUtils.tsx` | 161 | info | da correggere (Livello A) |
| 9 | `src/components/features/diary/packing_list/suitcase/SuitcaseUtils.tsx` | 373 | info | da correggere (Livello A) |
| 10 | `src/components/features/diary/packing_list/suitcase/tabs/OverrideTab.tsx` | 70 | info | da correggere (Livello A) |
| 11 | `src/hooks/admin/useAffiliateAnalytics.ts` | 108 | info | da correggere (Livello A) |
| 12 | `src/services/city/cityCache.ts` | 33 | info | da correggere (Livello A) |
| 13 | `src/services/city/cityCache.ts` | 34 | info | da correggere (Livello A) |
| 14 | `src/services/importService.ts` | 177 | info | da correggere (Livello A) |
| 15 | `src/services/importService.ts` | 204 | info | da correggere (Livello A) |
| 16 | `src/services/importService.ts` | 205 | info | da correggere (Livello A) |
| 17 | `src/services/importService.ts` | 206 | info | da correggere (Livello A) |
| 18 | `src/services/importService.ts` | 207 | info | da correggere (Livello A) |
| 19 | `src/services/importService.ts` | 208 | info | da correggere (Livello A) |
| 20 | `src/services/importService.ts` | 209 | info | da correggere (Livello A) |
| 21 | `src/services/importService.ts` | 210 | info | da correggere (Livello A) |
| 22 | `src/services/importService.ts` | 211 | info | da correggere (Livello A) |
| 23 | `src/services/importService.ts` | 320 | info | da correggere (Livello A) |
| 24 | `src/services/importService.ts` | 325 | info | da correggere (Livello A) |
| 25 | `src/services/importService.ts` | 325 | info | da correggere (Livello A) |
| 26 | `src/services/importService.ts` | 325 | info | da correggere (Livello A) |
| 27 | `src/services/importService.ts` | 325 | info | da correggere (Livello A) |
| 28 | `src/services/importService.ts` | 325 | info | da correggere (Livello A) |
| 29 | `src/services/importService.ts` | 327 | info | da correggere (Livello A) |
| 30 | `src/services/importService.ts` | 328 | info | da correggere (Livello A) |
| 31 | `src/services/importService.ts` | 328 | info | da correggere (Livello A) |
| 32 | `src/services/importService.ts` | 329 | info | da correggere (Livello A) |
| 33 | `src/services/importService.ts` | 330 | info | da correggere (Livello A) |
| 34 | `src/services/importService.ts` | 339 | info | da correggere (Livello A) |
| 35 | `src/services/sponsors/sponsorRequestsService.ts` | 98 | info | da correggere (Livello A) |
| 36 | `src/services/sponsors/sponsorRequestsService.ts` | 98 | info | da correggere (Livello A) |
| 37 | `src/services/sponsors/sponsorRequestsService.ts` | 128 | info | da correggere (Livello A) |
| 38 | `src/services/sponsors/sponsorRequestsService.ts` | 128 | info | da correggere (Livello A) |

## `lint/style/useTemplate`

### Descrizione della regola

Preferire template literal alla concatenazione di stringhe.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/style/useTemplate` |
| **Occorrenze totali** | **22** |
| **Error** | 0 |
| **Warning** | 0 |
| **Info** | 22 |
| **File coinvolti** | **18** |
| **Livello di rischio** | **A** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Concatenazione→template string equivalente.

### Strategia di correzione

Safe autofix useTemplate.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/components/admin/AdminGamification.tsx` | 3 |
| `src/hooks/useAdminExport.ts` | 2 |
| `src/utils/common.ts` | 2 |
| `scripts/_bundle_import_trace.mjs` | 1 |
| `scripts/check-layers.ts` | 1 |
| `scripts/generate-foundation-review-docs.ts` | 1 |
| `scripts/smoke-viaggio-domain.ts` | 1 |
| `server/routes/auth.routes.ts` | 1 |
| `src/components/admin/cityEditor/culture/CulturePeople.tsx` | 1 |
| `src/components/admin/observatory/CityStatsGrid.tsx` | 1 |
| `src/components/admin/photos/PhotoRow.tsx` | 1 |
| `src/components/admin/userManager/CreateUserModal.tsx` | 1 |
| `src/components/modals/cityInfo/CityGuidesTab.tsx` | 1 |
| `src/components/pdf/TravelDocument.tsx` | 1 |
| `src/hooks/admin/import/useImportActions.ts` | 1 |
| `src/services/suitcase/suitcaseEditorialService.ts` | 1 |
| `src/utils/exportGenerators.ts` | 1 |
| `src/utils/scheduleUtils.ts` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `scripts/_bundle_import_trace.mjs` | 43 | info | da correggere (Livello A) |
| 2 | `scripts/check-layers.ts` | 77 | info | da correggere (Livello A) |
| 3 | `scripts/generate-foundation-review-docs.ts` | 28 | info | da correggere (Livello A) |
| 4 | `scripts/smoke-viaggio-domain.ts` | 89 | info | da correggere (Livello A) |
| 5 | `server/routes/auth.routes.ts` | 40 | info | da correggere (Livello A) |
| 6 | `src/components/admin/AdminGamification.tsx` | 107 | info | da correggere (Livello A) |
| 7 | `src/components/admin/AdminGamification.tsx` | 129 | info | da correggere (Livello A) |
| 8 | `src/components/admin/AdminGamification.tsx` | 152 | info | da correggere (Livello A) |
| 9 | `src/components/admin/cityEditor/culture/CulturePeople.tsx` | 94 | info | da correggere (Livello A) |
| 10 | `src/components/admin/observatory/CityStatsGrid.tsx` | 140 | info | da correggere (Livello A) |
| 11 | `src/components/admin/photos/PhotoRow.tsx` | 30 | info | da correggere (Livello A) |
| 12 | `src/components/admin/userManager/CreateUserModal.tsx` | 52 | info | da correggere (Livello A) |
| 13 | `src/components/modals/cityInfo/CityGuidesTab.tsx` | 169 | info | da correggere (Livello A) |
| 14 | `src/components/pdf/TravelDocument.tsx` | 207 | info | da correggere (Livello A) |
| 15 | `src/hooks/admin/import/useImportActions.ts` | 122 | info | da correggere (Livello A) |
| 16 | `src/hooks/useAdminExport.ts` | 21 | info | da correggere (Livello A) |
| 17 | `src/hooks/useAdminExport.ts` | 172 | info | da correggere (Livello A) |
| 18 | `src/services/suitcase/suitcaseEditorialService.ts` | 257 | info | da correggere (Livello A) |
| 19 | `src/utils/common.ts` | 28 | info | da correggere (Livello A) |
| 20 | `src/utils/common.ts` | 29 | info | da correggere (Livello A) |
| 21 | `src/utils/exportGenerators.ts` | 338 | info | da correggere (Livello A) |
| 22 | `src/utils/scheduleUtils.ts` | 90 | info | da correggere (Livello A) |

## `lint/style/useExponentiationOperator`

### Descrizione della regola

Preferire operatore ** a Math.pow.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/style/useExponentiationOperator` |
| **Occorrenze totali** | **2** |
| **Error** | 0 |
| **Warning** | 0 |
| **Info** | 2 |
| **File coinvolti** | **1** |
| **Livello di rischio** | **A** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Math.pow→**; equivalente.

### Strategia di correzione

Safe autofix useExponentiationOperator.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/services/importService.ts` | 2 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `src/services/importService.ts` | 97 | info | da correggere (Livello A) |
| 2 | `src/services/importService.ts` | 123 | info | da correggere (Livello A) |

## `lint/complexity/noUselessEscapeInRegex`

### Descrizione della regola

Escape inutili in literal regex.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/complexity/noUselessEscapeInRegex` |
| **Occorrenze totali** | **10** |
| **Error** | 0 |
| **Warning** | 0 |
| **Info** | 10 |
| **File coinvolti** | **6** |
| **Livello di rischio** | **A** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Rimozione escape inutili in regex.

### Strategia di correzione

Safe autofix noUselessEscapeInRegex.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/components/modals/CultureCornerModal.tsx` | 4 |
| `src/components/admin/cityEditor/tabs/TabLogs.tsx` | 2 |
| `scripts/seed_geo.js` | 1 |
| `src/components/pdf/RoadbookDocument.tsx` | 1 |
| `src/services/viaggio/viaggioAttachmentService.ts` | 1 |
| `src/services/viaggio/viaggioRicordiService.ts` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `scripts/seed_geo.js` | 9 | info | da correggere (Livello A) |
| 2 | `src/components/admin/cityEditor/tabs/TabLogs.tsx` | 14 | info | da correggere (Livello A) |
| 3 | `src/components/admin/cityEditor/tabs/TabLogs.tsx` | 15 | info | da correggere (Livello A) |
| 4 | `src/components/modals/CultureCornerModal.tsx` | 72 | info | da correggere (Livello A) |
| 5 | `src/components/modals/CultureCornerModal.tsx` | 91 | info | da correggere (Livello A) |
| 6 | `src/components/modals/CultureCornerModal.tsx` | 106 | info | da correggere (Livello A) |
| 7 | `src/components/modals/CultureCornerModal.tsx` | 117 | info | da correggere (Livello A) |
| 8 | `src/components/pdf/RoadbookDocument.tsx` | 280 | info | da correggere (Livello A) |
| 9 | `src/services/viaggio/viaggioAttachmentService.ts` | 65 | info | da correggere (Livello A) |
| 10 | `src/services/viaggio/viaggioRicordiService.ts` | 201 | info | da correggere (Livello A) |

## `lint/complexity/noUselessUndefinedInitialization`

### Descrizione della regola

Inizializzazione esplicita a undefined ridondante.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/complexity/noUselessUndefinedInitialization` |
| **Occorrenze totali** | **5** |
| **Error** | 0 |
| **Warning** | 0 |
| **Info** | 5 |
| **File coinvolti** | **5** |
| **Livello di rischio** | **A** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Rimozione =undefined ridondante.

### Strategia di correzione

Safe autofix noUselessUndefinedInitialization.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/components/modals/SuggestionModal.tsx` | 1 |
| `src/context/BusinessContext.tsx` | 1 |
| `src/hooks/useAiGeneration.ts` | 1 |
| `src/services/city/cityReadService.ts` | 1 |
| `src/services/sponsors/sponsorResolvers.ts` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `src/components/modals/SuggestionModal.tsx` | 139 | info | da correggere (Livello A) |
| 2 | `src/context/BusinessContext.tsx` | 179 | info | da correggere (Livello A) |
| 3 | `src/hooks/useAiGeneration.ts` | 170 | info | da correggere (Livello A) |
| 4 | `src/services/city/cityReadService.ts` | 78 | info | da correggere (Livello A) |
| 5 | `src/services/sponsors/sponsorResolvers.ts` | 213 | info | da correggere (Livello A) |

## `lint/complexity/noUselessSwitchCase`

### Descrizione della regola

Case di switch inutili / ridondanti.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/complexity/noUselessSwitchCase` |
| **Occorrenze totali** | **3** |
| **Error** | 0 |
| **Warning** | 0 |
| **Info** | 3 |
| **File coinvolti** | **3** |
| **Livello di rischio** | **A** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Case ridondanti/fallthrough inutili rimovibili meccanicamente.

### Strategia di correzione

Safe autofix / rimozione case inutili.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/components/admin/cities/ZoneCard.tsx` | 1 |
| `src/components/admin/ItineraryManager.tsx` | 1 |
| `src/services/globalEventsService.ts` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `src/components/admin/cities/ZoneCard.tsx` | 78 | info | da correggere (Livello A) |
| 2 | `src/components/admin/ItineraryManager.tsx` | 656 | info | da correggere (Livello A) |
| 3 | `src/services/globalEventsService.ts` | 66 | info | da correggere (Livello A) |

## `lint/complexity/noUselessFragments`

### Descrizione della regola

Fragment React inutili.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/complexity/noUselessFragments` |
| **Occorrenze totali** | **3** |
| **Error** | 0 |
| **Warning** | 0 |
| **Info** | 3 |
| **File coinvolti** | **3** |
| **Livello di rischio** | **A** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Fragment inutili rimovibili senza cambio DOM.

### Strategia di correzione

Safe autofix noUselessFragments.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/components/admin/photos/PhotoRow.tsx` | 1 |
| `src/components/city/CityDetailContent.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/RecommendedSuitcaseModal.tsx` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `src/components/admin/photos/PhotoRow.tsx` | 156 | info | da correggere (Livello A) |
| 2 | `src/components/city/CityDetailContent.tsx` | 340 | info | da correggere (Livello A) |
| 3 | `src/components/features/diary/packing_list/suitcase/RecommendedSuitcaseModal.tsx` | 367 | info | da correggere (Livello A) |

## `lint/complexity/noUselessTernary`

### Descrizione della regola

Operatore ternario riducibile.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/complexity/noUselessTernary` |
| **Occorrenze totali** | **3** |
| **Error** | 0 |
| **Warning** | 0 |
| **Info** | 3 |
| **File coinvolti** | **2** |
| **Livello di rischio** | **A** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Ternari riducibili a espressione equivalente.

### Strategia di correzione

Safe autofix noUselessTernary.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/services/myspace/userFavoritesService.ts` | 2 |
| `src/hooks/suitcase/useSuitcaseCrud.ts` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `src/hooks/suitcase/useSuitcaseCrud.ts` | 74 | info | da correggere (Livello A) |
| 2 | `src/services/myspace/userFavoritesService.ts` | 141 | info | da correggere (Livello A) |
| 3 | `src/services/myspace/userFavoritesService.ts` | 144 | info | da correggere (Livello A) |

## `lint/complexity/noUselessLoneBlockStatements`

### Descrizione della regola

Blocchi statement inutili.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/complexity/noUselessLoneBlockStatements` |
| **Occorrenze totali** | **15** |
| **Error** | 0 |
| **Warning** | 0 |
| **Info** | 15 |
| **File coinvolti** | **5** |
| **Livello di rischio** | **A** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Blocchi {} inutili rimovibili.

### Strategia di correzione

Safe autofix noUselessLoneBlockStatements.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `scripts/smoke-mp02-step3.ts` | 6 |
| `scripts/smoke-mp02-step2.ts` | 4 |
| `scripts/smoke-viaggio-step3.ts` | 2 |
| `scripts/smoke-viaggio-step5.ts` | 2 |
| `scripts/smoke-collaboration-step4.ts` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `scripts/smoke-collaboration-step4.ts` | 30 | info | da correggere (Livello A) |
| 2 | `scripts/smoke-mp02-step2.ts` | 37 | info | da correggere (Livello A) |
| 3 | `scripts/smoke-mp02-step2.ts` | 105 | info | da correggere (Livello A) |
| 4 | `scripts/smoke-mp02-step2.ts` | 158 | info | da correggere (Livello A) |
| 5 | `scripts/smoke-mp02-step2.ts` | 176 | info | da correggere (Livello A) |
| 6 | `scripts/smoke-mp02-step3.ts` | 58 | info | da correggere (Livello A) |
| 7 | `scripts/smoke-mp02-step3.ts` | 76 | info | da correggere (Livello A) |
| 8 | `scripts/smoke-mp02-step3.ts` | 105 | info | da correggere (Livello A) |
| 9 | `scripts/smoke-mp02-step3.ts` | 129 | info | da correggere (Livello A) |
| 10 | `scripts/smoke-mp02-step3.ts` | 143 | info | da correggere (Livello A) |
| 11 | `scripts/smoke-mp02-step3.ts` | 182 | info | da correggere (Livello A) |
| 12 | `scripts/smoke-viaggio-step3.ts` | 31 | info | da correggere (Livello A) |
| 13 | `scripts/smoke-viaggio-step3.ts` | 42 | info | da correggere (Livello A) |
| 14 | `scripts/smoke-viaggio-step5.ts` | 57 | info | da correggere (Livello A) |
| 15 | `scripts/smoke-viaggio-step5.ts` | 65 | info | da correggere (Livello A) |

## `lint/suspicious/noUselessEscapeInString`

### Descrizione della regola

Escape inutili in stringhe.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/suspicious/noUselessEscapeInString` |
| **Occorrenze totali** | **1** |
| **Error** | 0 |
| **Warning** | 1 |
| **Info** | 0 |
| **File coinvolti** | **1** |
| **Livello di rischio** | **A** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Escape stringa inutile.

### Strategia di correzione

Rimuovere escape ridondante.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/services/aiPlannerService.ts` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `src/services/aiPlannerService.ts` | 14 | warning | da correggere (Livello A) |

## `lint/suspicious/noEmptyInterface`

### Descrizione della regola

Interface TypeScript vuota.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/suspicious/noEmptyInterface` |
| **Occorrenze totali** | **1** |
| **Error** | 1 |
| **Warning** | 0 |
| **Info** | 0 |
| **File coinvolti** | **1** |
| **Livello di rischio** | **A** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Interface vuota convertibile in type; nessun merging dichiarato nel singolo hit.

### Strategia di correzione

Sostituire con type alias o rimuovere se dead.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/components/features/diary/packing_list/suitcase/AffiliateEditorialCenter.tsx` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `src/components/features/diary/packing_list/suitcase/AffiliateEditorialCenter.tsx` | 6 | error | da correggere (Livello A) |

