# noExplicitAny

> Dettaglio baseline Biome full-project. Dashboard: [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md)

| Campo | Valore |
|----|----|
| **Documento** | `AI_QUALITY/biome/C_noExplicitAny.md` |
| **Categorie** | `lint/suspicious/noExplicitAny` |
| **Occorrenze (somma gruppo)** | **473** |
| **File unici nel gruppo** | **183** |
| **Livello** | **C** |
| **Ultimo aggiornamento** | 2026-08-03 |
| **Stato** | Baseline ufficiale — nessuna correzione applicata in questa attivita |

## `lint/suspicious/noExplicitAny`

### Descrizione della regola

Uso esplicito del tipo any.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/suspicious/noExplicitAny` |
| **Occorrenze totali** | **473** |
| **Error** | 0 |
| **Warning** | 473 |
| **Info** | 0 |
| **File coinvolti** | **183** |
| **Livello di rischio** | **C** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Sostituire any richiede tipi dominio; impatto type safety.

### Strategia di correzione

Tipizzare per dominio; batch piccoli con typecheck.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/hooks/admin/useAiMagicCity.ts` | 20 |
| `src/components/admin/AdminStatsDashboard.tsx` | 15 |
| `src/hooks/admin/useServiceRegeneration.ts` | 12 |
| `src/hooks/useRankingsLogic.ts` | 10 |
| `src/components/admin/cities/CitiesListTab.tsx` | 9 |
| `src/components/admin/economics/AdminAiAnalyticsV4.tsx` | 8 |
| `src/components/itineraries/ItineraryDetail.tsx` | 8 |
| `src/services/ai/generators/poiGenerator.ts` | 8 |
| `src/services/community/suggestionService.ts` | 8 |
| `src/context/CityEditorContext.tsx` | 7 |
| `src/hooks/admin/useAiCompleteCity.ts` | 7 |
| `src/services/ai/aiPlanner.ts` | 7 |
| `server/routes/bootstrap.routes.ts` | 6 |
| `server/routes/content.routes.ts` | 6 |
| `src/components/admin/cities/RegionalAnalysisModal.tsx` | 6 |
| `src/components/admin/cityEditor/services/ServiceEvents.tsx` | 6 |
| `src/components/admin/onboarding/OnboardingVisualEditor.tsx` | 6 |
| `src/components/layout/modals/AdminModals.tsx` | 6 |
| `src/components/modals/FullRankingsModal.tsx` | 6 |
| `src/hooks/useSponsorOperations.ts` | 6 |
| `src/components/admin/cityEditor/services/ServiceGeneric.tsx` | 5 |
| `src/components/admin/cityEditor/services/ServiceGuides.tsx` | 5 |
| `src/components/admin/marketing/PricingHistoryPanel.tsx` | 5 |
| `src/components/admin/settings/GlobalSettingsPanel.tsx` | 5 |
| `src/components/home/HomeContent.tsx` | 5 |
| `src/context/ConfigContext.tsx` | 5 |
| `src/hooks/admin/usePhotoModeration.ts` | 5 |
| `src/services/ai/generators/listGenerator.ts` | 5 |
| `src/services/geo.ts` | 5 |
| `src/types/models/Sponsor.ts` | 5 |
| `src/components/admin/AdminGamification.tsx` | 4 |
| `src/components/admin/cityEditor/EditorCulture.tsx` | 4 |
| `src/components/admin/cityEditor/EditorRatings.tsx` | 4 |
| `src/components/admin/cityEditor/tabs/TabRatings.tsx` | 4 |
| `src/components/admin/marketing/PricingPlansPanel.tsx` | 4 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/components/SuitcaseModals.tsx` | 4 |
| `src/components/home/hero/HeroFilterModule.tsx` | 4 |
| `src/context/ModalContext.tsx` | 4 |
| `src/hooks/useCityGenerator.ts` | 4 |
| `src/services/dataService.ts` | 4 |
| `src/services/globalEventsService.ts` | 4 |
| `src/services/importService.ts` | 4 |
| `src/components/admin/AdminItineraryEditor.tsx` | 3 |
| `src/components/admin/AiFieldHelper.tsx` | 3 |
| `src/components/admin/GlobalEventsManager.tsx` | 3 |
| `src/components/admin/LoadingTipsManager.tsx` | 3 |
| `src/components/admin/settings/ArrayRenderer.tsx` | 3 |
| `src/components/admin/SponsorDashboardOverview.tsx` | 3 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseEditorLogic.ts` | 3 |
| `src/components/modals/ExportModal.tsx` | 3 |
| `src/components/modals/SuggestionReviewModal.tsx` | 3 |
| `src/components/user/dashboard/UserOverviewTab.tsx` | 3 |
| `src/constants/services.ts` | 3 |
| `src/hooks/admin/import/useImportActions.ts` | 3 |
| `src/hooks/admin/people/usePeopleAI.ts` | 3 |
| `src/hooks/admin/useAiFlashSearch.ts` | 3 |
| `src/hooks/admin/useAiValidation.ts` | 3 |
| `src/hooks/useUndoStack.ts` | 3 |
| `src/utils/safeTypes.ts` | 3 |
| `src/utils/seo.ts` | 3 |
| `src/components/admin/AdminPhotoInspector.tsx` | 2 |
| `src/components/admin/AdminTaxonomyManager.tsx` | 2 |
| `src/components/admin/cities/CityAuditModal.tsx` | 2 |
| `src/components/admin/cityEditor/FormFieldHelper.tsx` | 2 |
| `src/components/admin/communications/AiChatAssistant.tsx` | 2 |
| `src/components/admin/economics/PricingManager.tsx` | 2 |
| `src/components/admin/import/components/ImportStatsBar.tsx` | 2 |
| `src/components/admin/marketing/CampaignsPanel.tsx` | 2 |
| `src/components/admin/NewsTickerManager.tsx` | 2 |
| `src/components/admin/photos/PhotoFilters.tsx` | 2 |
| `src/components/admin/settings/FieldRenderer.tsx` | 2 |
| `src/components/admin/settings/ObjectRenderer.tsx` | 2 |
| `src/components/admin/settings/PartnerIntegrationsPanel.tsx` | 2 |
| `src/components/admin/userManager/CreateUserModal.tsx` | 2 |
| `src/components/city/tabs/CityCategoryTab.tsx` | 2 |
| `src/components/modals/cityInfo/CityEventsTab.tsx` | 2 |
| `src/components/modals/cityInfo/ServiceAiHunter.tsx` | 2 |
| `src/components/modals/sectionPreview/PreviewRatings.tsx` | 2 |
| `src/components/user/dashboard/UserNotificationsTab.tsx` | 2 |
| `src/components/user/UserDashboard.tsx` | 2 |
| `src/data/ai/prompts.ts` | 2 |
| `src/hooks/admin/useAiTargetedSearch.ts` | 2 |
| `src/hooks/admin/useAiTaskRunner.ts` | 2 |
| `src/services/ai/generators/peopleGenerator.ts` | 2 |
| `src/services/city/cityLifecycleService.ts` | 2 |
| `src/services/city/parsers/media/parseGallery.ts` | 2 |
| `src/services/city/poi/poiRead.ts` | 2 |
| `src/services/community/itineraryService.ts` | 2 |
| `src/services/importAutomationService.ts` | 2 |
| `src/services/partnerIntegrationService.ts` | 2 |
| `src/types/models/City.ts` | 2 |
| `server/routes/admin.routes.ts` | 1 |
| `server/routes/auth.routes.ts` | 1 |
| `server/routes/city.routes.ts` | 1 |
| `server/routes/user.routes.ts` | 1 |
| `src/components/admin/AdminAiAssistant.tsx` | 1 |
| `src/components/admin/AdminPoiManager.tsx` | 1 |
| `src/components/admin/AdminSocialStudio.tsx` | 1 |
| `src/components/admin/AdminUserManager.tsx` | 1 |
| `src/components/admin/cities/StrategicMapTab.tsx` | 1 |
| `src/components/admin/cities/ZoneCard.tsx` | 1 |
| `src/components/admin/cityEditor/culture/CultureHistory.tsx` | 1 |
| `src/components/admin/cityEditor/culture/CulturePatron.tsx` | 1 |
| `src/components/admin/cityEditor/EditorGeneral.tsx` | 1 |
| `src/components/admin/cityEditor/services/ServiceOperators.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabCulture.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabGeneral.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabLogs.tsx` | 1 |
| `src/components/admin/communications/CommsTemplates.tsx` | 1 |
| `src/components/admin/design/SafeArtPanel.tsx` | 1 |
| `src/components/admin/import/ImportDashboard.tsx` | 1 |
| `src/components/admin/import/ImportOsmModal.tsx` | 1 |
| `src/components/admin/observatory/AnomalyInspector.tsx` | 1 |
| `src/components/admin/observatory/CityStatsGrid.tsx` | 1 |
| `src/components/admin/poiModal/PoiInfoTab.tsx` | 1 |
| `src/components/admin/poiModal/PoiLinksTab.tsx` | 1 |
| `src/components/admin/settings/inputs/BooleanToggle.tsx` | 1 |
| `src/components/admin/settings/inputs/NumberInput.tsx` | 1 |
| `src/components/admin/settings/inputs/StringInput.tsx` | 1 |
| `src/components/admin/social/SocialPreviewConfig.tsx` | 1 |
| `src/components/admin/userManager/EditUserModal.tsx` | 1 |
| `src/components/admin/userManager/UserToolbar.tsx` | 1 |
| `src/components/aiPlanner/AiPlannerTimeline.tsx` | 1 |
| `src/components/city/gallery/GalleryLightbox.tsx` | 1 |
| `src/components/city/tabs/CityShowcaseTab.tsx` | 1 |
| `src/components/common/SmartFilterDrawer.tsx` | 1 |
| `src/components/features/diary/DiaryModals.tsx` | 1 |
| `src/components/features/diary/DiaryResourceCard.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsPanel.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SavedSuitcasesSection.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/TripSuitcaseSection.tsx` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelOptimisticUpdates.ts` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseUndoHandlers.ts` | 1 |
| `src/components/layout/Sidebar.tsx` | 1 |
| `src/components/modals/AuthModal.tsx` | 1 |
| `src/components/modals/BuyCreditsModal.tsx` | 1 |
| `src/components/modals/cityInfo/CityServicesTab.tsx` | 1 |
| `src/components/modals/CultureCornerModal.tsx` | 1 |
| `src/components/modals/RoadbookModal.tsx` | 1 |
| `src/components/modals/sectionPreview/PreviewSidebar.tsx` | 1 |
| `src/components/modals/SectionPreviewModal.tsx` | 1 |
| `src/components/modals/SuggestionModal.tsx` | 1 |
| `src/components/pdf/RoadbookDocument.tsx` | 1 |
| `src/components/shop/ShopHeader.tsx` | 1 |
| `src/components/shop/ShopHomeView.tsx` | 1 |
| `src/components/shop/ShopPage.tsx` | 1 |
| `src/context/BusinessContext.tsx` | 1 |
| `src/data/ai/eventTaxonomy.ts` | 1 |
| `src/hooks/admin/import/useImportData.ts` | 1 |
| `src/hooks/admin/people/usePeopleData.ts` | 1 |
| `src/hooks/admin/useSocialCanvasLogic.ts` | 1 |
| `src/hooks/admin/useSocialTemplates.ts` | 1 |
| `src/hooks/core/useAppInitialization.ts` | 1 |
| `src/hooks/core/useGpsManager.ts` | 1 |
| `src/hooks/useAiGeneration.ts` | 1 |
| `src/hooks/useCityData.ts` | 1 |
| `src/hooks/useDiaryLogic.ts` | 1 |
| `src/hooks/useDiaryUndo.ts` | 1 |
| `src/hooks/useShare.ts` | 1 |
| `src/hooks/useUserDashboardData.ts` | 1 |
| `src/index.tsx` | 1 |
| `src/services/affiliateTrackingService.ts` | 1 |
| `src/services/ai/generators/qualityGenerator.ts` | 1 |
| `src/services/city/cityCache.ts` | 1 |
| `src/services/city/parsers/content/parseRatings.ts` | 1 |
| `src/services/city/parsers/entities/parseEvent.ts` | 1 |
| `src/services/city/parsers/entities/parseGuide.ts` | 1 |
| `src/services/city/parsers/entities/parseService.ts` | 1 |
| `src/services/city/parsers/entities/parseTourOperator.ts` | 1 |
| `src/services/city/parsers/shared/ensureNumber.ts` | 1 |
| `src/services/city/parsers/shared/ensureString.ts` | 1 |
| `src/services/city/poi/poiMapper.ts` | 1 |
| `src/services/community/interactionService.ts` | 1 |
| `src/services/contentService.ts` | 1 |
| `src/services/mediaService.ts` | 1 |
| `src/services/photoMapper.ts` | 1 |
| `src/services/settingsService.ts` | 1 |
| `src/services/socialMarketingService.ts` | 1 |
| `src/services/sponsors/sponsorStatsService.ts` | 1 |
| `src/services/supabaseClient.ts` | 1 |
| `src/types/core.ts` | 1 |
| `src/types/subscriptions.ts` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

Occorrenze totali: **473** (sopra soglia elenco riga-per-riga). Inventario sintetico per file:

| File | Occorrenze | Decisione baseline per-file |
|---|---:|---|
| `src/hooks/admin/useAiMagicCity.ts` | 20 | da correggere (20× Livello C) |
| `src/components/admin/AdminStatsDashboard.tsx` | 15 | da correggere (15× Livello C) |
| `src/hooks/admin/useServiceRegeneration.ts` | 12 | da correggere (12× Livello C) |
| `src/hooks/useRankingsLogic.ts` | 10 | da correggere (10× Livello C) |
| `src/components/admin/cities/CitiesListTab.tsx` | 9 | da correggere (9× Livello C) |
| `src/components/admin/economics/AdminAiAnalyticsV4.tsx` | 8 | da correggere (8× Livello C) |
| `src/components/itineraries/ItineraryDetail.tsx` | 8 | da correggere (8× Livello C) |
| `src/services/ai/generators/poiGenerator.ts` | 8 | da correggere (8× Livello C) |
| `src/services/community/suggestionService.ts` | 8 | da correggere (8× Livello C) |
| `src/context/CityEditorContext.tsx` | 7 | da correggere (7× Livello C) |
| `src/hooks/admin/useAiCompleteCity.ts` | 7 | da correggere (7× Livello C) |
| `src/services/ai/aiPlanner.ts` | 7 | da correggere (7× Livello C) |
| `server/routes/bootstrap.routes.ts` | 6 | da correggere (6× Livello C) |
| `server/routes/content.routes.ts` | 6 | da correggere (6× Livello C) |
| `src/components/admin/cities/RegionalAnalysisModal.tsx` | 6 | da correggere (6× Livello C) |
| `src/components/admin/cityEditor/services/ServiceEvents.tsx` | 6 | da correggere (6× Livello C) |
| `src/components/admin/onboarding/OnboardingVisualEditor.tsx` | 6 | da correggere (6× Livello C) |
| `src/components/layout/modals/AdminModals.tsx` | 6 | da correggere (6× Livello C) |
| `src/components/modals/FullRankingsModal.tsx` | 6 | da correggere (6× Livello C) |
| `src/hooks/useSponsorOperations.ts` | 6 | da correggere (6× Livello C) |
| `src/components/admin/cityEditor/services/ServiceGeneric.tsx` | 5 | da correggere (5× Livello C) |
| `src/components/admin/cityEditor/services/ServiceGuides.tsx` | 5 | da correggere (5× Livello C) |
| `src/components/admin/marketing/PricingHistoryPanel.tsx` | 5 | da correggere (5× Livello C) |
| `src/components/admin/settings/GlobalSettingsPanel.tsx` | 5 | da correggere (5× Livello C) |
| `src/components/home/HomeContent.tsx` | 5 | da correggere (5× Livello C) |
| `src/context/ConfigContext.tsx` | 5 | da correggere (5× Livello C) |
| `src/hooks/admin/usePhotoModeration.ts` | 5 | da correggere (5× Livello C) |
| `src/services/ai/generators/listGenerator.ts` | 5 | da correggere (5× Livello C) |
| `src/services/geo.ts` | 5 | da correggere (5× Livello C) |
| `src/types/models/Sponsor.ts` | 5 | da correggere (5× Livello C) |
| `src/components/admin/AdminGamification.tsx` | 4 | da correggere (4× Livello C) |
| `src/components/admin/cityEditor/EditorCulture.tsx` | 4 | da correggere (4× Livello C) |
| `src/components/admin/cityEditor/EditorRatings.tsx` | 4 | da correggere (4× Livello C) |
| `src/components/admin/cityEditor/tabs/TabRatings.tsx` | 4 | da correggere (4× Livello C) |
| `src/components/admin/marketing/PricingPlansPanel.tsx` | 4 | da correggere (4× Livello C) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/components/SuitcaseModals.tsx` | 4 | da correggere (4× Livello C) |
| `src/components/home/hero/HeroFilterModule.tsx` | 4 | da correggere (4× Livello C) |
| `src/context/ModalContext.tsx` | 4 | da correggere (4× Livello C) |
| `src/hooks/useCityGenerator.ts` | 4 | da correggere (4× Livello C) |
| `src/services/dataService.ts` | 4 | da correggere (4× Livello C) |
| `src/services/globalEventsService.ts` | 4 | da correggere (4× Livello C) |
| `src/services/importService.ts` | 4 | da correggere (4× Livello C) |
| `src/components/admin/AdminItineraryEditor.tsx` | 3 | da correggere (3× Livello C) |
| `src/components/admin/AiFieldHelper.tsx` | 3 | da correggere (3× Livello C) |
| `src/components/admin/GlobalEventsManager.tsx` | 3 | da correggere (3× Livello C) |
| `src/components/admin/LoadingTipsManager.tsx` | 3 | da correggere (3× Livello C) |
| `src/components/admin/settings/ArrayRenderer.tsx` | 3 | da correggere (3× Livello C) |
| `src/components/admin/SponsorDashboardOverview.tsx` | 3 | da correggere (3× Livello C) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseEditorLogic.ts` | 3 | da correggere (3× Livello C) |
| `src/components/modals/ExportModal.tsx` | 3 | da correggere (3× Livello C) |
| `src/components/modals/SuggestionReviewModal.tsx` | 3 | da correggere (3× Livello C) |
| `src/components/user/dashboard/UserOverviewTab.tsx` | 3 | da correggere (3× Livello C) |
| `src/constants/services.ts` | 3 | da correggere (3× Livello C) |
| `src/hooks/admin/import/useImportActions.ts` | 3 | da correggere (3× Livello C) |
| `src/hooks/admin/people/usePeopleAI.ts` | 3 | da correggere (3× Livello C) |
| `src/hooks/admin/useAiFlashSearch.ts` | 3 | da correggere (3× Livello C) |
| `src/hooks/admin/useAiValidation.ts` | 3 | da correggere (3× Livello C) |
| `src/hooks/useUndoStack.ts` | 3 | da correggere (3× Livello C) |
| `src/utils/safeTypes.ts` | 3 | da correggere (3× Livello C) |
| `src/utils/seo.ts` | 3 | da correggere (3× Livello C) |
| `src/components/admin/AdminPhotoInspector.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/admin/AdminTaxonomyManager.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/admin/cities/CityAuditModal.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/admin/cityEditor/FormFieldHelper.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/admin/communications/AiChatAssistant.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/admin/economics/PricingManager.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/admin/import/components/ImportStatsBar.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/admin/marketing/CampaignsPanel.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/admin/NewsTickerManager.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/admin/photos/PhotoFilters.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/admin/settings/FieldRenderer.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/admin/settings/ObjectRenderer.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/admin/settings/PartnerIntegrationsPanel.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/admin/userManager/CreateUserModal.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/city/tabs/CityCategoryTab.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/modals/cityInfo/CityEventsTab.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/modals/cityInfo/ServiceAiHunter.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/modals/sectionPreview/PreviewRatings.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/user/dashboard/UserNotificationsTab.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/user/UserDashboard.tsx` | 2 | da correggere (2× Livello C) |
| `src/data/ai/prompts.ts` | 2 | da correggere (2× Livello C) |
| `src/hooks/admin/useAiTargetedSearch.ts` | 2 | da correggere (2× Livello C) |
| `src/hooks/admin/useAiTaskRunner.ts` | 2 | da correggere (2× Livello C) |
| `src/services/ai/generators/peopleGenerator.ts` | 2 | da correggere (2× Livello C) |
| `src/services/city/cityLifecycleService.ts` | 2 | da correggere (2× Livello C) |
| `src/services/city/parsers/media/parseGallery.ts` | 2 | da correggere (2× Livello C) |
| `src/services/city/poi/poiRead.ts` | 2 | da correggere (2× Livello C) |
| `src/services/community/itineraryService.ts` | 2 | da correggere (2× Livello C) |
| `src/services/importAutomationService.ts` | 2 | da correggere (2× Livello C) |
| `src/services/partnerIntegrationService.ts` | 2 | da correggere (2× Livello C) |
| `src/types/models/City.ts` | 2 | da correggere (2× Livello C) |
| `server/routes/admin.routes.ts` | 1 | da correggere (1× Livello C) |
| `server/routes/auth.routes.ts` | 1 | da correggere (1× Livello C) |
| `server/routes/city.routes.ts` | 1 | da correggere (1× Livello C) |
| `server/routes/user.routes.ts` | 1 | da correggere (1× Livello C) |
| `src/components/admin/AdminAiAssistant.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/AdminPoiManager.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/AdminSocialStudio.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/AdminUserManager.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/cities/StrategicMapTab.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/cities/ZoneCard.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/cityEditor/culture/CultureHistory.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/cityEditor/culture/CulturePatron.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/cityEditor/EditorGeneral.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/cityEditor/services/ServiceOperators.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/cityEditor/tabs/TabCulture.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/cityEditor/tabs/TabGeneral.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/cityEditor/tabs/TabLogs.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/communications/CommsTemplates.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/design/SafeArtPanel.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/import/ImportDashboard.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/import/ImportOsmModal.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/observatory/AnomalyInspector.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/observatory/CityStatsGrid.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/poiModal/PoiInfoTab.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/poiModal/PoiLinksTab.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/settings/inputs/BooleanToggle.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/settings/inputs/NumberInput.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/settings/inputs/StringInput.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/social/SocialPreviewConfig.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/userManager/EditUserModal.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/userManager/UserToolbar.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/aiPlanner/AiPlannerTimeline.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/city/gallery/GalleryLightbox.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/city/tabs/CityShowcaseTab.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/common/SmartFilterDrawer.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/features/diary/DiaryModals.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/features/diary/DiaryResourceCard.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsPanel.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/features/diary/packing_list/suitcase/SavedSuitcasesSection.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/features/diary/packing_list/suitcase/TripSuitcaseSection.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelOptimisticUpdates.ts` | 1 | da correggere (1× Livello C) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts` | 1 | da correggere (1× Livello C) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseUndoHandlers.ts` | 1 | da correggere (1× Livello C) |
| `src/components/layout/Sidebar.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/modals/AuthModal.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/modals/BuyCreditsModal.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/modals/cityInfo/CityServicesTab.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/modals/CultureCornerModal.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/modals/RoadbookModal.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/modals/sectionPreview/PreviewSidebar.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/modals/SectionPreviewModal.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/modals/SuggestionModal.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/pdf/RoadbookDocument.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/shop/ShopHeader.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/shop/ShopHomeView.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/shop/ShopPage.tsx` | 1 | da correggere (1× Livello C) |
| `src/context/BusinessContext.tsx` | 1 | da correggere (1× Livello C) |
| `src/data/ai/eventTaxonomy.ts` | 1 | da correggere (1× Livello C) |
| `src/hooks/admin/import/useImportData.ts` | 1 | da correggere (1× Livello C) |
| `src/hooks/admin/people/usePeopleData.ts` | 1 | da correggere (1× Livello C) |
| `src/hooks/admin/useSocialCanvasLogic.ts` | 1 | da correggere (1× Livello C) |
| `src/hooks/admin/useSocialTemplates.ts` | 1 | da correggere (1× Livello C) |
| `src/hooks/core/useAppInitialization.ts` | 1 | da correggere (1× Livello C) |
| `src/hooks/core/useGpsManager.ts` | 1 | da correggere (1× Livello C) |
| `src/hooks/useAiGeneration.ts` | 1 | da correggere (1× Livello C) |
| `src/hooks/useCityData.ts` | 1 | da correggere (1× Livello C) |
| `src/hooks/useDiaryLogic.ts` | 1 | da correggere (1× Livello C) |
| `src/hooks/useDiaryUndo.ts` | 1 | da correggere (1× Livello C) |
| `src/hooks/useShare.ts` | 1 | da correggere (1× Livello C) |
| `src/hooks/useUserDashboardData.ts` | 1 | da correggere (1× Livello C) |
| `src/index.tsx` | 1 | da correggere (1× Livello C) |
| `src/services/affiliateTrackingService.ts` | 1 | da correggere (1× Livello C) |
| `src/services/ai/generators/qualityGenerator.ts` | 1 | da correggere (1× Livello C) |
| `src/services/city/cityCache.ts` | 1 | da correggere (1× Livello C) |
| `src/services/city/parsers/content/parseRatings.ts` | 1 | da correggere (1× Livello C) |
| `src/services/city/parsers/entities/parseEvent.ts` | 1 | da correggere (1× Livello C) |
| `src/services/city/parsers/entities/parseGuide.ts` | 1 | da correggere (1× Livello C) |
| `src/services/city/parsers/entities/parseService.ts` | 1 | da correggere (1× Livello C) |
| `src/services/city/parsers/entities/parseTourOperator.ts` | 1 | da correggere (1× Livello C) |
| `src/services/city/parsers/shared/ensureNumber.ts` | 1 | da correggere (1× Livello C) |
| `src/services/city/parsers/shared/ensureString.ts` | 1 | da correggere (1× Livello C) |
| `src/services/city/poi/poiMapper.ts` | 1 | da correggere (1× Livello C) |
| `src/services/community/interactionService.ts` | 1 | da correggere (1× Livello C) |
| `src/services/contentService.ts` | 1 | da correggere (1× Livello C) |
| `src/services/mediaService.ts` | 1 | da correggere (1× Livello C) |
| `src/services/photoMapper.ts` | 1 | da correggere (1× Livello C) |
| `src/services/settingsService.ts` | 1 | da correggere (1× Livello C) |
| `src/services/socialMarketingService.ts` | 1 | da correggere (1× Livello C) |
| `src/services/sponsors/sponsorStatsService.ts` | 1 | da correggere (1× Livello C) |
| `src/services/supabaseClient.ts` | 1 | da correggere (1× Livello C) |
| `src/types/core.ts` | 1 | da correggere (1× Livello C) |
| `src/types/subscriptions.ts` | 1 | da correggere (1× Livello C) |

Nota: il dettaglio riga e riproducibile in qualsiasi momento con `npx biome check --reporter=json` filtrato sulla categoria.

