# useOptionalChain

> Dettaglio baseline Biome full-project. Dashboard: [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md)

| Campo | Valore |
|----|----|
| **Documento** | `AI_QUALITY/biome/B_useOptionalChain.md` |
| **Categorie** | `lint/complexity/useOptionalChain` |
| **Occorrenze (somma gruppo)** | **84** |
| **File unici nel gruppo** | **59** |
| **Livello** | **B** |
| **Ultimo aggiornamento** | 2026-08-03 |
| **Stato** | Baseline ufficiale — nessuna correzione applicata in questa attivita |

## `lint/complexity/useOptionalChain`

### Descrizione della regola

Preferire optional chaining a catene &&.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/complexity/useOptionalChain` |
| **Occorrenze totali** | **84** |
| **Error** | 0 |
| **Warning** | 84 |
| **Info** | 0 |
| **File coinvolti** | **59** |
| **Livello di rischio** | **B** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

&&→?. puo cambiare short-circuit/falsy; serve lettura.

### Strategia di correzione

Riscrivere solo dove equivalenza falsy e verificata.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/hooks/useAiGeneration.ts` | 6 |
| `src/components/admin/cities/RegionalAnalysisModal.tsx` | 5 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseUtils.tsx` | 4 |
| `src/hooks/admin/useServiceRegeneration.ts` | 4 |
| `src/services/city/entitiesService.ts` | 4 |
| `src/components/city/CityDetailContent.tsx` | 2 |
| `src/components/modals/poiDetail/PoiInfoSection.tsx` | 2 |
| `src/domain/platformControl/platformFlagCache.ts` | 2 |
| `src/hooks/admin/useAiMagicCity.ts` | 2 |
| `src/hooks/useNewsTicker.ts` | 2 |
| `src/services/importService.ts` | 2 |
| `src/services/partnerIntegrationService.ts` | 2 |
| `scripts/checkMissingReactHooks.ts` | 1 |
| `server/routes/content.routes.ts` | 1 |
| `src/components/admin/AdminImageInput.tsx` | 1 |
| `src/components/admin/AdminItineraryEditor.tsx` | 1 |
| `src/components/admin/AdminPoiManager.tsx` | 1 |
| `src/components/admin/AdminStatsDashboard.tsx` | 1 |
| `src/components/admin/cities/GeoCascadingFilters.tsx` | 1 |
| `src/components/admin/cityEditor/culture/CulturePatron.tsx` | 1 |
| `src/components/admin/cityEditor/EditorRatings.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabRatings.tsx` | 1 |
| `src/components/admin/communications/CommsTemplates.tsx` | 1 |
| `src/components/admin/ItineraryManager.tsx` | 1 |
| `src/components/admin/MarketingManager.tsx` | 1 |
| `src/components/admin/NewsTickerManager.tsx` | 1 |
| `src/components/admin/platformControl/SchedulePanel.tsx` | 1 |
| `src/components/admin/poiModal/PoiInfoTab.tsx` | 1 |
| `src/components/admin/SuggestionManager.tsx` | 1 |
| `src/components/city/ShowcaseCards.tsx` | 1 |
| `src/components/city/tabs/CityShowcaseTab.tsx` | 1 |
| `src/components/community/QaForumTab.tsx` | 1 |
| `src/components/community/RankingTab.tsx` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseAffiliate.ts` | 1 |
| `src/components/itineraries/ItineraryDetail.tsx` | 1 |
| `src/components/layout/OnboardingWizard.tsx` | 1 |
| `src/components/marketing/SponsorPlanCard.tsx` | 1 |
| `src/components/modals/ExportModal.tsx` | 1 |
| `src/components/modals/UserUpgradeModal.tsx` | 1 |
| `src/components/user/BusinessShopManager.tsx` | 1 |
| `src/context/PlatformControlContext.tsx` | 1 |
| `src/hooks/photos/useCommunityPhotoPublish.ts` | 1 |
| `src/hooks/ui/useHeroLogic.ts` | 1 |
| `src/hooks/useDynamicContent.ts` | 1 |
| `src/hooks/usePartnerIntegrations.ts` | 1 |
| `src/hooks/useUndoStack.ts` | 1 |
| `src/myspace/mySpaceNavMemory.ts` | 1 |
| `src/services/ai/utils/taxonomyUtils.ts` | 1 |
| `src/services/city/cityReadService.ts` | 1 |
| `src/services/city/poi/poiRead.ts` | 1 |
| `src/services/city/tourOperatorService.ts` | 1 |
| `src/services/collaboration/collaborationNotificationService.ts` | 1 |
| `src/services/contentService.ts` | 1 |
| `src/services/mediaService.ts` | 1 |
| `src/services/photoService.ts` | 1 |
| `src/services/subscriptionService.ts` | 1 |
| `src/services/zoneService.ts` | 1 |
| `src/utils/affiliateNetwork.ts` | 1 |
| `src/utils/exportGenerators.ts` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

Occorrenze totali: **84** (sopra soglia elenco riga-per-riga). Inventario sintetico per file:

| File | Occorrenze | Decisione baseline per-file |
|---|---:|---|
| `src/hooks/useAiGeneration.ts` | 6 | da correggere (6× Livello B) |
| `src/components/admin/cities/RegionalAnalysisModal.tsx` | 5 | da correggere (5× Livello B) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseUtils.tsx` | 4 | da correggere (4× Livello B) |
| `src/hooks/admin/useServiceRegeneration.ts` | 4 | da correggere (4× Livello B) |
| `src/services/city/entitiesService.ts` | 4 | da correggere (4× Livello B) |
| `src/components/city/CityDetailContent.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/modals/poiDetail/PoiInfoSection.tsx` | 2 | da correggere (2× Livello B) |
| `src/domain/platformControl/platformFlagCache.ts` | 2 | da correggere (2× Livello B) |
| `src/hooks/admin/useAiMagicCity.ts` | 2 | da correggere (2× Livello B) |
| `src/hooks/useNewsTicker.ts` | 2 | da correggere (2× Livello B) |
| `src/services/importService.ts` | 2 | da correggere (2× Livello B) |
| `src/services/partnerIntegrationService.ts` | 2 | da correggere (2× Livello B) |
| `scripts/checkMissingReactHooks.ts` | 1 | da correggere (1× Livello B) |
| `server/routes/content.routes.ts` | 1 | da correggere (1× Livello B) |
| `src/components/admin/AdminImageInput.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/AdminItineraryEditor.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/AdminPoiManager.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/AdminStatsDashboard.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/cities/GeoCascadingFilters.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/cityEditor/culture/CulturePatron.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/cityEditor/EditorRatings.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/cityEditor/tabs/TabRatings.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/communications/CommsTemplates.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/ItineraryManager.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/MarketingManager.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/NewsTickerManager.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/platformControl/SchedulePanel.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/poiModal/PoiInfoTab.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/SuggestionManager.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/city/ShowcaseCards.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/city/tabs/CityShowcaseTab.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/community/QaForumTab.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/community/RankingTab.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseAffiliate.ts` | 1 | da correggere (1× Livello B) |
| `src/components/itineraries/ItineraryDetail.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/layout/OnboardingWizard.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/marketing/SponsorPlanCard.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/modals/ExportModal.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/modals/UserUpgradeModal.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/user/BusinessShopManager.tsx` | 1 | da correggere (1× Livello B) |
| `src/context/PlatformControlContext.tsx` | 1 | da correggere (1× Livello B) |
| `src/hooks/photos/useCommunityPhotoPublish.ts` | 1 | da correggere (1× Livello B) |
| `src/hooks/ui/useHeroLogic.ts` | 1 | da correggere (1× Livello B) |
| `src/hooks/useDynamicContent.ts` | 1 | da correggere (1× Livello B) |
| `src/hooks/usePartnerIntegrations.ts` | 1 | da correggere (1× Livello B) |
| `src/hooks/useUndoStack.ts` | 1 | da correggere (1× Livello B) |
| `src/myspace/mySpaceNavMemory.ts` | 1 | da correggere (1× Livello B) |
| `src/services/ai/utils/taxonomyUtils.ts` | 1 | da correggere (1× Livello B) |
| `src/services/city/cityReadService.ts` | 1 | da correggere (1× Livello B) |
| `src/services/city/poi/poiRead.ts` | 1 | da correggere (1× Livello B) |
| `src/services/city/tourOperatorService.ts` | 1 | da correggere (1× Livello B) |
| `src/services/collaboration/collaborationNotificationService.ts` | 1 | da correggere (1× Livello B) |
| `src/services/contentService.ts` | 1 | da correggere (1× Livello B) |
| `src/services/mediaService.ts` | 1 | da correggere (1× Livello B) |
| `src/services/photoService.ts` | 1 | da correggere (1× Livello B) |
| `src/services/subscriptionService.ts` | 1 | da correggere (1× Livello B) |
| `src/services/zoneService.ts` | 1 | da correggere (1× Livello B) |
| `src/utils/affiliateNetwork.ts` | 1 | da correggere (1× Livello B) |
| `src/utils/exportGenerators.ts` | 1 | da correggere (1× Livello B) |

Nota: il dettaglio riga e riproducibile in qualsiasi momento con `npx biome check --reporter=json` filtrato sulla categoria.

