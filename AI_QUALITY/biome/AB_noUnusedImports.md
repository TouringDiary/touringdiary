# noUnusedImports

> Dettaglio baseline Biome full-project. Dashboard: [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md)

| Campo | Valore |
|----|----|
| **Documento** | `AI_QUALITY/biome/AB_noUnusedImports.md` |
| **Categorie** | `lint/correctness/noUnusedImports` |
| **Occorrenze (somma gruppo)** | **328** |
| **File unici nel gruppo** | **231** |
| **Livello** | **A/B** |
| **Ultimo aggiornamento** | 2026-08-03 |
| **Stato** | Baseline ufficiale — nessuna correzione applicata in questa attivita |

## `lint/correctness/noUnusedImports`

### Descrizione della regola

Import non utilizzati nel file.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/correctness/noUnusedImports` |
| **Occorrenze totali** | **328** |
| **Error** | 0 |
| **Warning** | 328 |
| **Info** | 0 |
| **File coinvolti** | **231** |
| **Livello di rischio** | **A/B** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Quasi sempre sicuro; verificare side-effect import e re-export intenzionali.

### Strategia di correzione

Autofix + spot-check import con side effect.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/components/admin/cityEditor/tabs/TabServices.tsx` | 6 |
| `src/components/layout/Sidebar.tsx` | 5 |
| `src/components/admin/design/SafeArtPanel.tsx` | 4 |
| `src/components/admin/economics/PricingManager.tsx` | 4 |
| `src/components/admin/social/SocialPreviewConfig.tsx` | 4 |
| `src/components/user/BusinessShopManager.tsx` | 4 |
| `src/components/admin/AdminCityEditor.tsx` | 3 |
| `src/components/admin/AdminGamification.tsx` | 3 |
| `src/components/admin/AdminUserManager.tsx` | 3 |
| `src/components/admin/economics/AdminAiAnalyticsV4.tsx` | 3 |
| `src/components/admin/GlobalEventsManager.tsx` | 3 |
| `src/components/admin/import/components/ImportStatsBar.tsx` | 3 |
| `src/components/admin/observatory/DuplicateResolver.tsx` | 3 |
| `src/components/admin/PartnerDetailModal.tsx` | 3 |
| `src/components/itineraries/ItineraryDetail.tsx` | 3 |
| `src/components/layout/Header.tsx` | 3 |
| `src/components/modals/SuggestionReviewModal.tsx` | 3 |
| `src/components/shop/ShopPage.tsx` | 3 |
| `src/components/user/UserDashboard.tsx` | 3 |
| `src/hooks/admin/useAiMagicCity.ts` | 3 |
| `src/hooks/admin/usePhotoModeration.ts` | 3 |
| `src/hooks/core/useAppInitialization.ts` | 3 |
| `src/components/admin/AdminItineraryEditor.tsx` | 2 |
| `src/components/admin/AdminPhotoInspector.tsx` | 2 |
| `src/components/admin/AdminPoiModal.tsx` | 2 |
| `src/components/admin/AdminRoleManager.tsx` | 2 |
| `src/components/admin/AdminTaxonomyManager.tsx` | 2 |
| `src/components/admin/AiLimitsControlCenter.tsx` | 2 |
| `src/components/admin/cities/CompleteCityModal.tsx` | 2 |
| `src/components/admin/cities/DeleteCityOptionsModal.tsx` | 2 |
| `src/components/admin/cities/RegionalAnalysisModal.tsx` | 2 |
| `src/components/admin/CitiesManager.tsx` | 2 |
| `src/components/admin/cityEditor/services/EditorInfo.tsx` | 2 |
| `src/components/admin/economics/SustainabilityHelper.tsx` | 2 |
| `src/components/admin/import/components/ImportActionToolbar.tsx` | 2 |
| `src/components/admin/import/ImportOsmModal.tsx` | 2 |
| `src/components/admin/LoadingTipsManager.tsx` | 2 |
| `src/components/admin/marketing/AdminCreditPackages.tsx` | 2 |
| `src/components/admin/marketing/CampaignsPanel.tsx` | 2 |
| `src/components/admin/marketing/PricingHistoryPanel.tsx` | 2 |
| `src/components/admin/observatory/AnomalyInspector.tsx` | 2 |
| `src/components/admin/observatory/ScheduleMatrix.tsx` | 2 |
| `src/components/admin/onboarding/OnboardingVisualEditor.tsx` | 2 |
| `src/components/admin/poiManager/BulkFixProgressModal.tsx` | 2 |
| `src/components/admin/poiManager/RegenerateConfirmModal.tsx` | 2 |
| `src/components/admin/poiModal/PoiLinksTab.tsx` | 2 |
| `src/components/admin/poiModal/PoiLogisticsTab.tsx` | 2 |
| `src/components/admin/poiModal/PoiMarketingTab.tsx` | 2 |
| `src/components/admin/poiModal/PoiMediaTab.tsx` | 2 |
| `src/components/admin/sponsor/SponsorToolbar.tsx` | 2 |
| `src/components/admin/SponsorDashboardOverview.tsx` | 2 |
| `src/components/admin/SponsorManager.tsx` | 2 |
| `src/components/admin/userManager/UserSubscriptionsTab.tsx` | 2 |
| `src/components/aiPlanner/AiPlannerForm.tsx` | 2 |
| `src/components/city/tabs/CityShowcaseTab.tsx` | 2 |
| `src/components/common/SmartFilterDrawer.tsx` | 2 |
| `src/components/layout/OnboardingWizard.tsx` | 2 |
| `src/components/modals/FullRankingsModal.tsx` | 2 |
| `src/components/modals/sectionPreview/PreviewSidebar.tsx` | 2 |
| `src/components/modals/ShareModal.tsx` | 2 |
| `src/components/pdf/RoadbookDocument.tsx` | 2 |
| `src/hooks/admin/useAiCompleteCity.ts` | 2 |
| `src/services/photoService.ts` | 2 |
| `src/services/platformControl/platformControlService.ts` | 2 |
| `src/services/suitcase/suitcaseTemplateService.ts` | 2 |
| `src/utils/common.ts` | 2 |
| `scripts/build-packing-domain-catalog.ts` | 1 |
| `src/components/admin/AdminAiAssistant.tsx` | 1 |
| `src/components/admin/AdminCommunications.tsx` | 1 |
| `src/components/admin/AdminControlCenterAI.tsx` | 1 |
| `src/components/admin/AdminHeaderManager.tsx` | 1 |
| `src/components/admin/AdminImageInput.tsx` | 1 |
| `src/components/admin/AdminSocialStudio.tsx` | 1 |
| `src/components/admin/AdminStatsDashboard.tsx` | 1 |
| `src/components/admin/affiliations/AffiliateAnalyticsTab.tsx` | 1 |
| `src/components/admin/AiFieldHelper.tsx` | 1 |
| `src/components/admin/cities/CitiesListTab.tsx` | 1 |
| `src/components/admin/cities/CityAuditModal.tsx` | 1 |
| `src/components/admin/cities/CityGeneratorModal.tsx` | 1 |
| `src/components/admin/cities/ProcessLogModal.tsx` | 1 |
| `src/components/admin/cities/StrategicMapTab.tsx` | 1 |
| `src/components/admin/cityEditor/culture/CulturePeople.tsx` | 1 |
| `src/components/admin/cityEditor/EditorGeneral.tsx` | 1 |
| `src/components/admin/cityEditor/services/ServiceEvents.tsx` | 1 |
| `src/components/admin/cityEditor/services/ServiceGeneric.tsx` | 1 |
| `src/components/admin/cityEditor/services/ServiceGuides.tsx` | 1 |
| `src/components/admin/cityEditor/services/ServiceOperators.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabGeneral.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabLogs.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabMedia.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabPois.tsx` | 1 |
| `src/components/admin/common/AdminGuideModal.tsx` | 1 |
| `src/components/admin/communications/CommsHistory.tsx` | 1 |
| `src/components/admin/design/PlaceholderGrid.tsx` | 1 |
| `src/components/admin/import/components/ImportReportModal.tsx` | 1 |
| `src/components/admin/import/components/ImportTable.tsx` | 1 |
| `src/components/admin/ItineraryManager.tsx` | 1 |
| `src/components/admin/layout/AdminMobileHeader.tsx` | 1 |
| `src/components/admin/layout/AdminSidebar.tsx` | 1 |
| `src/components/admin/marketing/PromoManagerModal.tsx` | 1 |
| `src/components/admin/NewsTickerManager.tsx` | 1 |
| `src/components/admin/observatory/CityStatsGrid.tsx` | 1 |
| `src/components/admin/observatory/ObservatoryFilterDrawer.tsx` | 1 |
| `src/components/admin/observatory/ObservatoryLayout.tsx` | 1 |
| `src/components/admin/observatory/ObservatoryLegend.tsx` | 1 |
| `src/components/admin/PhotoModeration.tsx` | 1 |
| `src/components/admin/photos/PhotoFilters.tsx` | 1 |
| `src/components/admin/photos/PhotoTable.tsx` | 1 |
| `src/components/admin/poiManager/PoiList.tsx` | 1 |
| `src/components/admin/poiManager/PoiToolbar.tsx` | 1 |
| `src/components/admin/poiModal/PoiInfoTab.tsx` | 1 |
| `src/components/admin/settings/PartnerIntegrationsPanel.tsx` | 1 |
| `src/components/admin/social/AiBackgroundPanel.tsx` | 1 |
| `src/components/admin/sponsor/SponsorBulkActions.tsx` | 1 |
| `src/components/admin/sponsor/SponsorTable.tsx` | 1 |
| `src/components/admin/SuggestionManager.tsx` | 1 |
| `src/components/admin/userManager/RlsFixModal.tsx` | 1 |
| `src/components/admin/userManager/UserTable.tsx` | 1 |
| `src/components/admin/userManager/UserToolbar.tsx` | 1 |
| `src/components/admin/views/UserManagementView.tsx` | 1 |
| `src/components/ai/AiRuntimeBanner.tsx` | 1 |
| `src/components/aiPlanner/AiLoadingScreen.tsx` | 1 |
| `src/components/aiPlanner/AiPlannerTimeline.tsx` | 1 |
| `src/components/city/CityDetailContent.tsx` | 1 |
| `src/components/city/CityHeader.tsx` | 1 |
| `src/components/city/CityHistory.tsx` | 1 |
| `src/components/city/gallery/GallerySuccessModal.tsx` | 1 |
| `src/components/city/gallery/GalleryUploadModal.tsx` | 1 |
| `src/components/city/tabs/CityCategoryTab.tsx` | 1 |
| `src/components/city/tabs/CityGallery.tsx` | 1 |
| `src/components/city/WeatherWidget.tsx` | 1 |
| `src/components/collaboration/CollaborationShareWizard.tsx` | 1 |
| `src/components/collaboration/useCollaborationShareResourceHandlers.ts` | 1 |
| `src/components/common/BrandLogo.tsx` | 1 |
| `src/components/common/GlobalAlert.tsx` | 1 |
| `src/components/common/MascotSvg.tsx` | 1 |
| `src/components/common/ModalLoading.tsx` | 1 |
| `src/components/common/PaginationControls.tsx` | 1 |
| `src/components/common/StarRating.tsx` | 1 |
| `src/components/community/QaForumTab.tsx` | 1 |
| `src/components/community/RankingTab.tsx` | 1 |
| `src/components/features/diary/DiaryDay.tsx` | 1 |
| `src/components/features/diary/DiaryEmptyState.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsPanel.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/CategorySuggestionPanel.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseDashboard.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseEditorView.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseUtils.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/TemplateSelectorSection.tsx` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/components/SuitcaseModals.tsx` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx` | 1 |
| `src/components/home/hero/components/FilterSelect.tsx` | 1 |
| `src/components/home/hero/components/MultiFilterSelect.tsx` | 1 |
| `src/components/home/hero/components/SearchBar.tsx` | 1 |
| `src/components/home/hero/HeroAiModule.tsx` | 1 |
| `src/components/home/HomeContent.tsx` | 1 |
| `src/components/itineraries/ItinerariesExplorer.tsx` | 1 |
| `src/components/itineraries/ItinerariesList.tsx` | 1 |
| `src/components/itineraries/ItineraryReviews.tsx` | 1 |
| `src/components/layout/AppCoordinator.tsx` | 1 |
| `src/components/layout/HeaderCreditsIndicator.tsx` | 1 |
| `src/components/layout/MobileNavBar.tsx` | 1 |
| `src/components/modals/AiItineraryModal.tsx` | 1 |
| `src/components/modals/AroundMeWizard.tsx` | 1 |
| `src/components/modals/cityInfo/CityGuidesTab.tsx` | 1 |
| `src/components/modals/cityInfo/CityTourOperatorsTab.tsx` | 1 |
| `src/components/modals/cityInfo/ServiceAiHunter.tsx` | 1 |
| `src/components/modals/cityInfo/ServicesCategoryList.tsx` | 1 |
| `src/components/modals/cityInfo/ServiceSidebar.tsx` | 1 |
| `src/components/modals/CityInfoModal.tsx` | 1 |
| `src/components/modals/ConfirmClearModal.tsx` | 1 |
| `src/components/modals/CultureCornerModal.tsx` | 1 |
| `src/components/modals/DateChangeWarningModal.tsx` | 1 |
| `src/components/modals/DuplicateResolutionModal.tsx` | 1 |
| `src/components/modals/EmptyDiaryModal.tsx` | 1 |
| `src/components/modals/GlobalSectionView.tsx` | 1 |
| `src/components/modals/GpsAlertModal.tsx` | 1 |
| `src/components/modals/GpsErrorModal.tsx` | 1 |
| `src/components/modals/HistoryModal.tsx` | 1 |
| `src/components/modals/MobileMoveModal.tsx` | 1 |
| `src/components/modals/PatronSaintModal.tsx` | 1 |
| `src/components/modals/PoiClaimModal.tsx` | 1 |
| `src/components/modals/poiDetail/PoiImageSection.tsx` | 1 |
| `src/components/modals/poiDetail/PoiInfoSection.tsx` | 1 |
| `src/components/modals/PoiDetailModal.tsx` | 1 |
| `src/components/modals/RemoveItemModal.tsx` | 1 |
| `src/components/modals/ReviewModal.tsx` | 1 |
| `src/components/modals/RoadbookModal.tsx` | 1 |
| `src/components/modals/SaveAsModal.tsx` | 1 |
| `src/components/modals/sectionPreview/PreviewGallery.tsx` | 1 |
| `src/components/modals/sectionPreview/PreviewHero.tsx` | 1 |
| `src/components/modals/SectionPreviewModal.tsx` | 1 |
| `src/components/modals/sponsor/SponsorSuccess.tsx` | 1 |
| `src/components/modals/sponsor/SponsorTypeSelector.tsx` | 1 |
| `src/components/modals/SponsorModal.tsx` | 1 |
| `src/components/modals/TimeConflictModal.tsx` | 1 |
| `src/components/shop/BottegaSponsorCard.tsx` | 1 |
| `src/components/shop/ProductDetailOverlay.tsx` | 1 |
| `src/components/user/dashboard/UserMessagesTab.tsx` | 1 |
| `src/components/user/dashboard/UserSidebar.tsx` | 1 |
| `src/components/user/dashboard/UserWalletTab.tsx` | 1 |
| `src/components/user/referral/SocialCardGenerator.tsx` | 1 |
| `src/constants/layout.ts` | 1 |
| `src/constants/services.ts` | 1 |
| `src/context/AiPlannerContext.tsx` | 1 |
| `src/context/CityEditorContext.tsx` | 1 |
| `src/context/DiaryInteractionContext.tsx` | 1 |
| `src/context/GpsContext.tsx` | 1 |
| `src/context/InteractionContext.tsx` | 1 |
| `src/context/NavigationContext.tsx` | 1 |
| `src/data/system/designRules.ts` | 1 |
| `src/hooks/admin/useDuplicateFinder.ts` | 1 |
| `src/hooks/admin/usePoiActions.ts` | 1 |
| `src/hooks/features/useShopNavigation.ts` | 1 |
| `src/hooks/ui/useHeroLogic.ts` | 1 |
| `src/hooks/useAIPlanner.ts` | 1 |
| `src/hooks/useAppRouter.ts` | 1 |
| `src/hooks/useDiaryLogic.ts` | 1 |
| `src/hooks/useJourneyPhase.ts` | 1 |
| `src/hooks/useRankingsLogic.ts` | 1 |
| `src/index.tsx` | 1 |
| `src/services/city/cityReadService.ts` | 1 |
| `src/services/collaboration/collaborationProfileService.ts` | 1 |
| `src/services/collaboration/friendService.ts` | 1 |
| `src/services/globalEventsService.ts` | 1 |
| `src/services/sponsors/sponsorResolvers.ts` | 1 |
| `src/services/subscriptionService.ts` | 1 |
| `src/types/models/City.ts` | 1 |
| `src/types/write/index.ts` | 1 |
| `src/types/write/poiForm.ts` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

Occorrenze totali: **328** (sopra soglia elenco riga-per-riga). Inventario sintetico per file:

| File | Occorrenze | Decisione baseline per-file |
|---|---:|---|
| `src/components/admin/cityEditor/tabs/TabServices.tsx` | 6 | da correggere (6× Livello A/B) |
| `src/components/layout/Sidebar.tsx` | 5 | da correggere (5× Livello A/B) |
| `src/components/admin/design/SafeArtPanel.tsx` | 4 | da correggere (4× Livello A/B) |
| `src/components/admin/economics/PricingManager.tsx` | 4 | da correggere (4× Livello A/B) |
| `src/components/admin/social/SocialPreviewConfig.tsx` | 4 | da correggere (4× Livello A/B) |
| `src/components/user/BusinessShopManager.tsx` | 4 | da correggere (4× Livello A/B) |
| `src/components/admin/AdminCityEditor.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/admin/AdminGamification.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/admin/AdminUserManager.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/admin/economics/AdminAiAnalyticsV4.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/admin/GlobalEventsManager.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/admin/import/components/ImportStatsBar.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/admin/observatory/DuplicateResolver.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/admin/PartnerDetailModal.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/itineraries/ItineraryDetail.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/layout/Header.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/modals/SuggestionReviewModal.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/shop/ShopPage.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/user/UserDashboard.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/hooks/admin/useAiMagicCity.ts` | 3 | da correggere (3× Livello A/B) |
| `src/hooks/admin/usePhotoModeration.ts` | 3 | da correggere (3× Livello A/B) |
| `src/hooks/core/useAppInitialization.ts` | 3 | da correggere (3× Livello A/B) |
| `src/components/admin/AdminItineraryEditor.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/AdminPhotoInspector.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/AdminPoiModal.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/AdminRoleManager.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/AdminTaxonomyManager.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/AiLimitsControlCenter.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/cities/CompleteCityModal.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/cities/DeleteCityOptionsModal.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/cities/RegionalAnalysisModal.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/CitiesManager.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/cityEditor/services/EditorInfo.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/economics/SustainabilityHelper.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/import/components/ImportActionToolbar.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/import/ImportOsmModal.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/LoadingTipsManager.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/marketing/AdminCreditPackages.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/marketing/CampaignsPanel.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/marketing/PricingHistoryPanel.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/observatory/AnomalyInspector.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/observatory/ScheduleMatrix.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/onboarding/OnboardingVisualEditor.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/poiManager/BulkFixProgressModal.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/poiManager/RegenerateConfirmModal.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/poiModal/PoiLinksTab.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/poiModal/PoiLogisticsTab.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/poiModal/PoiMarketingTab.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/poiModal/PoiMediaTab.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/sponsor/SponsorToolbar.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/SponsorDashboardOverview.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/SponsorManager.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/userManager/UserSubscriptionsTab.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/aiPlanner/AiPlannerForm.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/city/tabs/CityShowcaseTab.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/common/SmartFilterDrawer.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/layout/OnboardingWizard.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/modals/FullRankingsModal.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/modals/sectionPreview/PreviewSidebar.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/modals/ShareModal.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/pdf/RoadbookDocument.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/hooks/admin/useAiCompleteCity.ts` | 2 | da correggere (2× Livello A/B) |
| `src/services/photoService.ts` | 2 | da correggere (2× Livello A/B) |
| `src/services/platformControl/platformControlService.ts` | 2 | da correggere (2× Livello A/B) |
| `src/services/suitcase/suitcaseTemplateService.ts` | 2 | da correggere (2× Livello A/B) |
| `src/utils/common.ts` | 2 | da correggere (2× Livello A/B) |
| `scripts/build-packing-domain-catalog.ts` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/AdminAiAssistant.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/AdminCommunications.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/AdminControlCenterAI.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/AdminHeaderManager.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/AdminImageInput.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/AdminSocialStudio.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/AdminStatsDashboard.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/affiliations/AffiliateAnalyticsTab.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/AiFieldHelper.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/cities/CitiesListTab.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/cities/CityAuditModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/cities/CityGeneratorModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/cities/ProcessLogModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/cities/StrategicMapTab.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/cityEditor/culture/CulturePeople.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/cityEditor/EditorGeneral.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/cityEditor/services/ServiceEvents.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/cityEditor/services/ServiceGeneric.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/cityEditor/services/ServiceGuides.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/cityEditor/services/ServiceOperators.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/cityEditor/tabs/TabGeneral.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/cityEditor/tabs/TabLogs.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/cityEditor/tabs/TabMedia.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/cityEditor/tabs/TabPois.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/common/AdminGuideModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/communications/CommsHistory.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/design/PlaceholderGrid.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/import/components/ImportReportModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/import/components/ImportTable.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/ItineraryManager.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/layout/AdminMobileHeader.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/layout/AdminSidebar.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/marketing/PromoManagerModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/NewsTickerManager.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/observatory/CityStatsGrid.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/observatory/ObservatoryFilterDrawer.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/observatory/ObservatoryLayout.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/observatory/ObservatoryLegend.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/PhotoModeration.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/photos/PhotoFilters.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/photos/PhotoTable.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/poiManager/PoiList.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/poiManager/PoiToolbar.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/poiModal/PoiInfoTab.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/settings/PartnerIntegrationsPanel.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/social/AiBackgroundPanel.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/sponsor/SponsorBulkActions.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/sponsor/SponsorTable.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/SuggestionManager.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/userManager/RlsFixModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/userManager/UserTable.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/userManager/UserToolbar.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/views/UserManagementView.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/ai/AiRuntimeBanner.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/aiPlanner/AiLoadingScreen.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/aiPlanner/AiPlannerTimeline.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/city/CityDetailContent.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/city/CityHeader.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/city/CityHistory.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/city/gallery/GallerySuccessModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/city/gallery/GalleryUploadModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/city/tabs/CityCategoryTab.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/city/tabs/CityGallery.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/city/WeatherWidget.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/collaboration/CollaborationShareWizard.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/collaboration/useCollaborationShareResourceHandlers.ts` | 1 | da correggere (1× Livello A/B) |
| `src/components/common/BrandLogo.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/common/GlobalAlert.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/common/MascotSvg.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/common/ModalLoading.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/common/PaginationControls.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/common/StarRating.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/community/QaForumTab.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/community/RankingTab.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/features/diary/DiaryDay.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/features/diary/DiaryEmptyState.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsPanel.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/features/diary/packing_list/suitcase/CategorySuggestionPanel.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseDashboard.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseEditorView.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseUtils.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/features/diary/packing_list/suitcase/TemplateSelectorSection.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/components/SuitcaseModals.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts` | 1 | da correggere (1× Livello A/B) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/home/hero/components/FilterSelect.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/home/hero/components/MultiFilterSelect.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/home/hero/components/SearchBar.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/home/hero/HeroAiModule.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/home/HomeContent.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/itineraries/ItinerariesExplorer.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/itineraries/ItinerariesList.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/itineraries/ItineraryReviews.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/layout/AppCoordinator.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/layout/HeaderCreditsIndicator.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/layout/MobileNavBar.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/AiItineraryModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/AroundMeWizard.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/cityInfo/CityGuidesTab.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/cityInfo/CityTourOperatorsTab.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/cityInfo/ServiceAiHunter.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/cityInfo/ServicesCategoryList.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/cityInfo/ServiceSidebar.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/CityInfoModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/ConfirmClearModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/CultureCornerModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/DateChangeWarningModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/DuplicateResolutionModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/EmptyDiaryModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/GlobalSectionView.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/GpsAlertModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/GpsErrorModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/HistoryModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/MobileMoveModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/PatronSaintModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/PoiClaimModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/poiDetail/PoiImageSection.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/poiDetail/PoiInfoSection.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/PoiDetailModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/RemoveItemModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/ReviewModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/RoadbookModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/SaveAsModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/sectionPreview/PreviewGallery.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/sectionPreview/PreviewHero.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/SectionPreviewModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/sponsor/SponsorSuccess.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/sponsor/SponsorTypeSelector.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/SponsorModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/TimeConflictModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/shop/BottegaSponsorCard.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/shop/ProductDetailOverlay.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/user/dashboard/UserMessagesTab.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/user/dashboard/UserSidebar.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/user/dashboard/UserWalletTab.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/user/referral/SocialCardGenerator.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/constants/layout.ts` | 1 | da correggere (1× Livello A/B) |
| `src/constants/services.ts` | 1 | da correggere (1× Livello A/B) |
| `src/context/AiPlannerContext.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/context/CityEditorContext.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/context/DiaryInteractionContext.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/context/GpsContext.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/context/InteractionContext.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/context/NavigationContext.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/data/system/designRules.ts` | 1 | da correggere (1× Livello A/B) |
| `src/hooks/admin/useDuplicateFinder.ts` | 1 | da correggere (1× Livello A/B) |
| `src/hooks/admin/usePoiActions.ts` | 1 | da correggere (1× Livello A/B) |
| `src/hooks/features/useShopNavigation.ts` | 1 | da correggere (1× Livello A/B) |
| `src/hooks/ui/useHeroLogic.ts` | 1 | da correggere (1× Livello A/B) |
| `src/hooks/useAIPlanner.ts` | 1 | da correggere (1× Livello A/B) |
| `src/hooks/useAppRouter.ts` | 1 | da correggere (1× Livello A/B) |
| `src/hooks/useDiaryLogic.ts` | 1 | da correggere (1× Livello A/B) |
| `src/hooks/useJourneyPhase.ts` | 1 | da correggere (1× Livello A/B) |
| `src/hooks/useRankingsLogic.ts` | 1 | da correggere (1× Livello A/B) |
| `src/index.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/services/city/cityReadService.ts` | 1 | da correggere (1× Livello A/B) |
| `src/services/collaboration/collaborationProfileService.ts` | 1 | da correggere (1× Livello A/B) |
| `src/services/collaboration/friendService.ts` | 1 | da correggere (1× Livello A/B) |
| `src/services/globalEventsService.ts` | 1 | da correggere (1× Livello A/B) |
| `src/services/sponsors/sponsorResolvers.ts` | 1 | da correggere (1× Livello A/B) |
| `src/services/subscriptionService.ts` | 1 | da correggere (1× Livello A/B) |
| `src/types/models/City.ts` | 1 | da correggere (1× Livello A/B) |
| `src/types/write/index.ts` | 1 | da correggere (1× Livello A/B) |
| `src/types/write/poiForm.ts` | 1 | da correggere (1× Livello A/B) |

Nota: il dettaglio riga e riproducibile in qualsiasi momento con `npx biome check --reporter=json` filtrato sulla categoria.

