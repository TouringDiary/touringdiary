# noUnusedFunctionParameters

> Dettaglio baseline Biome full-project. Dashboard: [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md)

| Campo | Valore |
|----|----|
| **Documento** | `AI_QUALITY/biome/B_noUnusedFunctionParameters.md` |
| **Categorie** | `lint/correctness/noUnusedFunctionParameters` |
| **Occorrenze (somma gruppo)** | **121** |
| **File unici nel gruppo** | **72** |
| **Livello** | **B** |
| **Ultimo aggiornamento** | 2026-08-03 |
| **Stato** | Baseline ufficiale — nessuna correzione applicata in questa attivita |

## `lint/correctness/noUnusedFunctionParameters`

### Descrizione della regola

Parametri di funzione non usati.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/correctness/noUnusedFunctionParameters` |
| **Occorrenze totali** | **121** |
| **Error** | 0 |
| **Warning** | 121 |
| **Info** | 0 |
| **File coinvolti** | **72** |
| **Livello di rischio** | **B** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Parametri possono essere parte di firma/callback; underscore o rimozione richiede review.

### Strategia di correzione

Review firma; _prefix o rimozione se locale.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts` | 9 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseLifecycle.ts` | 7 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseDashboard.tsx` | 5 |
| `src/components/city/CityHeader.tsx` | 4 |
| `src/data/ai/prompts.ts` | 4 |
| `server/routes/bootstrap.routes.ts` | 3 |
| `src/components/admin/affiliations/AffiliateAnalyticsTab.tsx` | 3 |
| `src/components/city/gallery/GalleryGrid.tsx` | 3 |
| `src/components/layout/modals/FeatureModals.tsx` | 3 |
| `src/hooks/admin/useDuplicateFinder.ts` | 3 |
| `src/components/admin/AdminPhotoInspector.tsx` | 2 |
| `src/components/admin/cities/RegionalAnalysisModal.tsx` | 2 |
| `src/components/admin/cityEditor/culture/CulturePeople.tsx` | 2 |
| `src/components/admin/communications/AiChatAssistant.tsx` | 2 |
| `src/components/admin/import/components/ImportActionToolbar.tsx` | 2 |
| `src/components/admin/userManager/UserTable.tsx` | 2 |
| `src/components/city/CityDetailContent.tsx` | 2 |
| `src/components/city/tabs/CityShowcaseTab.tsx` | 2 |
| `src/components/features/diary/DiaryDay.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/CategorySuggestionPanel.tsx` | 2 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseActions.ts` | 2 |
| `src/components/layout/modals/AdminModals.tsx` | 2 |
| `src/components/layout/Sidebar.tsx` | 2 |
| `src/components/shop/ShopDetailView.tsx` | 2 |
| `src/hooks/useCityGenerator.ts` | 2 |
| `server/routes/auth.routes.ts` | 1 |
| `server/routes/content.routes.ts` | 1 |
| `server/routes/health.routes.ts` | 1 |
| `src/components/admin/affiliations/AffiliateOverviewCard.tsx` | 1 |
| `src/components/admin/cities/ZoneCard.tsx` | 1 |
| `src/components/admin/cityEditor/services/EditorInfo.tsx` | 1 |
| `src/components/admin/import/ImportOsmModal.tsx` | 1 |
| `src/components/admin/poiManager/PoiToolbar.tsx` | 1 |
| `src/components/admin/userManager/UserToolbar.tsx` | 1 |
| `src/components/admin/views/UserManagementView.tsx` | 1 |
| `src/components/city/components/NearbyCitiesRow.tsx` | 1 |
| `src/components/city/ShowcaseCards.tsx` | 1 |
| `src/components/city/tabs/CityCategoryTab.tsx` | 1 |
| `src/components/city/WeatherWidget.tsx` | 1 |
| `src/components/common/AdPlaceholder.tsx` | 1 |
| `src/components/features/diary/DiaryHeader.tsx` | 1 |
| `src/components/features/diary/DiaryMemoCard.tsx` | 1 |
| `src/components/features/diary/header/DiaryHeaderDateRange.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/AffiliateSuggestionBox.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseEditorView.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/TripSuitcaseSection.tsx` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseEditorLogic.ts` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseItemActions.ts` | 1 |
| `src/components/home/HomeContent.tsx` | 1 |
| `src/components/layout/AppShell.tsx` | 1 |
| `src/components/layout/MobileNavBar.tsx` | 1 |
| `src/components/modals/FullRankingsModal.tsx` | 1 |
| `src/components/modals/SectionPreviewModal.tsx` | 1 |
| `src/components/modals/SuggestionReviewModal.tsx` | 1 |
| `src/components/shop/ShopPage.tsx` | 1 |
| `src/components/user/BusinessShopManager.tsx` | 1 |
| `src/components/user/dashboard/UserMessagesTab.tsx` | 1 |
| `src/components/user/dashboard/UserReferralTab.tsx` | 1 |
| `src/components/user/UserDashboard.tsx` | 1 |
| `src/focus/exitGate/evaluateExitGate.ts` | 1 |
| `src/hooks/admin/useAiFlashSearch.ts` | 1 |
| `src/hooks/admin/useAiTargetedSearch.ts` | 1 |
| `src/hooks/admin/useAiValidation.ts` | 1 |
| `src/hooks/suitcase/useSuitcaseCrud.ts` | 1 |
| `src/hooks/useCityGallery.ts` | 1 |
| `src/hooks/useDiaryLogic.ts` | 1 |
| `src/hooks/usePoiManager.ts` | 1 |
| `src/services/ai/generators/cityContentGenerator.ts` | 1 |
| `src/services/city/cityCache.ts` | 1 |
| `src/services/city/poi/poiMapper.ts` | 1 |
| `src/services/community/suggestionService.ts` | 1 |
| `src/services/sponsors/sponsorRequestsService.ts` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

Occorrenze totali: **121** (sopra soglia elenco riga-per-riga). Inventario sintetico per file:

| File | Occorrenze | Decisione baseline per-file |
|---|---:|---|
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts` | 9 | da correggere (9× Livello B) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseLifecycle.ts` | 7 | da correggere (7× Livello B) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseDashboard.tsx` | 5 | da correggere (5× Livello B) |
| `src/components/city/CityHeader.tsx` | 4 | da correggere (4× Livello B) |
| `src/data/ai/prompts.ts` | 4 | da correggere (4× Livello B) |
| `server/routes/bootstrap.routes.ts` | 3 | da correggere (3× Livello B) |
| `src/components/admin/affiliations/AffiliateAnalyticsTab.tsx` | 3 | da correggere (3× Livello B) |
| `src/components/city/gallery/GalleryGrid.tsx` | 3 | da correggere (3× Livello B) |
| `src/components/layout/modals/FeatureModals.tsx` | 3 | da correggere (3× Livello B) |
| `src/hooks/admin/useDuplicateFinder.ts` | 3 | da correggere (3× Livello B) |
| `src/components/admin/AdminPhotoInspector.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/admin/cities/RegionalAnalysisModal.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/admin/cityEditor/culture/CulturePeople.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/admin/communications/AiChatAssistant.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/admin/import/components/ImportActionToolbar.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/admin/userManager/UserTable.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/city/CityDetailContent.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/city/tabs/CityShowcaseTab.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/features/diary/DiaryDay.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/features/diary/packing_list/suitcase/CategorySuggestionPanel.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseActions.ts` | 2 | da correggere (2× Livello B) |
| `src/components/layout/modals/AdminModals.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/layout/Sidebar.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/shop/ShopDetailView.tsx` | 2 | da correggere (2× Livello B) |
| `src/hooks/useCityGenerator.ts` | 2 | da correggere (2× Livello B) |
| `server/routes/auth.routes.ts` | 1 | da correggere (1× Livello B) |
| `server/routes/content.routes.ts` | 1 | da correggere (1× Livello B) |
| `server/routes/health.routes.ts` | 1 | da correggere (1× Livello B) |
| `src/components/admin/affiliations/AffiliateOverviewCard.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/cities/ZoneCard.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/cityEditor/services/EditorInfo.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/import/ImportOsmModal.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/poiManager/PoiToolbar.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/userManager/UserToolbar.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/views/UserManagementView.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/city/components/NearbyCitiesRow.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/city/ShowcaseCards.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/city/tabs/CityCategoryTab.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/city/WeatherWidget.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/common/AdPlaceholder.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/features/diary/DiaryHeader.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/features/diary/DiaryMemoCard.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/features/diary/header/DiaryHeaderDateRange.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/suitcase/AffiliateSuggestionBox.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseEditorView.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/suitcase/TripSuitcaseSection.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseEditorLogic.ts` | 1 | da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseItemActions.ts` | 1 | da correggere (1× Livello B) |
| `src/components/home/HomeContent.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/layout/AppShell.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/layout/MobileNavBar.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/modals/FullRankingsModal.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/modals/SectionPreviewModal.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/modals/SuggestionReviewModal.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/shop/ShopPage.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/user/BusinessShopManager.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/user/dashboard/UserMessagesTab.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/user/dashboard/UserReferralTab.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/user/UserDashboard.tsx` | 1 | da correggere (1× Livello B) |
| `src/focus/exitGate/evaluateExitGate.ts` | 1 | da correggere (1× Livello B) |
| `src/hooks/admin/useAiFlashSearch.ts` | 1 | da correggere (1× Livello B) |
| `src/hooks/admin/useAiTargetedSearch.ts` | 1 | da correggere (1× Livello B) |
| `src/hooks/admin/useAiValidation.ts` | 1 | da correggere (1× Livello B) |
| `src/hooks/suitcase/useSuitcaseCrud.ts` | 1 | da correggere (1× Livello B) |
| `src/hooks/useCityGallery.ts` | 1 | da correggere (1× Livello B) |
| `src/hooks/useDiaryLogic.ts` | 1 | da correggere (1× Livello B) |
| `src/hooks/usePoiManager.ts` | 1 | da correggere (1× Livello B) |
| `src/services/ai/generators/cityContentGenerator.ts` | 1 | da correggere (1× Livello B) |
| `src/services/city/cityCache.ts` | 1 | da correggere (1× Livello B) |
| `src/services/city/poi/poiMapper.ts` | 1 | da correggere (1× Livello B) |
| `src/services/community/suggestionService.ts` | 1 | da correggere (1× Livello B) |
| `src/services/sponsors/sponsorRequestsService.ts` | 1 | da correggere (1× Livello B) |

Nota: il dettaglio riga e riproducibile in qualsiasi momento con `npx biome check --reporter=json` filtrato sulla categoria.

