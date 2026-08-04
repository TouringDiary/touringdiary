# useImportType

> Dettaglio baseline Biome full-project. Dashboard: [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md)

| Campo | Valore |
|----|----|
| **Documento** | `AI_QUALITY/biome/A_useImportType.md` |
| **Categorie** | `lint/style/useImportType` |
| **Occorrenze (somma gruppo)** | **862** |
| **File unici nel gruppo** | **585** |
| **Livello** | **A** |
| **Ultimo aggiornamento** | 2026-08-03 |
| **Stato** | Baseline ufficiale — nessuna correzione applicata in questa attivita |

## `lint/style/useImportType`

### Descrizione della regola

Import usati solo come tipi devono usare la sintassi import type.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/style/useImportType` |
| **Occorrenze totali** | **862** |
| **Error** | 0 |
| **Warning** | 862 |
| **Info** | 0 |
| **File coinvolti** | **585** |
| **Livello di rischio** | **A** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Conversione import type-only; comportamento runtime invariato.

### Strategia di correzione

Safe autofix Biome useImportType.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/components/features/diary/packing_list/suitcase/SuitcaseEditorView.tsx` | 7 |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsModal.tsx` | 6 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseDashboard.tsx` | 5 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseAssociationFlow.ts` | 5 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseSuggestions.ts` | 5 |
| `src/services/suitcase/suitcaseCoreService.ts` | 5 |
| `src/components/city/gallery/GalleryGrid.tsx` | 4 |
| `src/components/features/diary/packing_list/suitcase/AffiliateSuggestionBox.tsx` | 4 |
| `src/components/features/diary/packing_list/suitcase/tabs/OverrideTab.tsx` | 4 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseActions.ts` | 4 |
| `src/components/admin/affiliations/AffiliateAnalyticsTab.tsx` | 3 |
| `src/components/admin/layout/AdminSidebar.tsx` | 3 |
| `src/components/admin/sponsor/SponsorModals.tsx` | 3 |
| `src/components/admin/SuggestionManager.tsx` | 3 |
| `src/components/admin/userManager/AiLimitsTab.tsx` | 3 |
| `src/components/community/LiveFeedTab.tsx` | 3 |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsReviewStep.tsx` | 3 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseCard.tsx` | 3 |
| `src/components/features/diary/packing_list/suitcase/tabs/override/PartnerLinksPanel.tsx` | 3 |
| `src/components/features/diary/packing_list/suitcase/tabs/TemplateSpecificItemsTab.tsx` | 3 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts` | 3 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseEditorLogic.ts` | 3 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseItemActions.ts` | 3 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcasePanelData.ts` | 3 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseUndo.ts` | 3 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseUndoHandlers.ts` | 3 |
| `src/components/home/HomeContent.tsx` | 3 |
| `src/components/modals/poiDetail/PoiInfoSection.tsx` | 3 |
| `src/components/modals/SectionPreviewModal.tsx` | 3 |
| `src/components/modals/sponsor/SponsorPricingSelector.tsx` | 3 |
| `src/components/modals/UserUpgradeModal.tsx` | 3 |
| `src/components/rankings/CityRow.tsx` | 3 |
| `src/components/shop/ShopHero.tsx` | 3 |
| `src/components/shop/ShopProducts.tsx` | 3 |
| `src/components/user/BusinessShopManager.tsx` | 3 |
| `src/components/user/dashboard/UserOverviewTab.tsx` | 3 |
| `src/components/user/dashboard/UserSuitcasesTab.tsx` | 3 |
| `src/context/CityEditorContext.tsx` | 3 |
| `src/hooks/admin/useServiceRegeneration.ts` | 3 |
| `src/hooks/features/useSponsorFormLogic.ts` | 3 |
| `src/hooks/suitcase/useHiddenCategories.ts` | 3 |
| `src/hooks/useDiaryUndo.ts` | 3 |
| `src/hooks/useSponsorLogic.ts` | 3 |
| `src/services/ai/aiPlanner.ts` | 3 |
| `src/services/city/entitiesService.ts` | 3 |
| `src/services/city/poi/poiMapper.ts` | 3 |
| `src/services/city/tourOperatorService.ts` | 3 |
| `src/services/notificationService.ts` | 3 |
| `src/services/partnerIntegrationService.ts` | 3 |
| `src/services/photoService.ts` | 3 |
| `src/services/suitcase/packingCompositionService.ts` | 3 |
| `src/services/suitcase/suitcaseAffiliateService.ts` | 3 |
| `src/services/suitcase/suitcaseEditorialService.ts` | 3 |
| `src/services/suitcase/suitcaseTemplateService.ts` | 3 |
| `src/types/models/Sponsor.ts` | 3 |
| `src/components/admin/AdminCityEditor.tsx` | 2 |
| `src/components/admin/AdminImageInput.tsx` | 2 |
| `src/components/admin/AdminItineraryEditor.tsx` | 2 |
| `src/components/admin/AdminPoiManager.tsx` | 2 |
| `src/components/admin/affiliations/AffiliateOverviewCard.tsx` | 2 |
| `src/components/admin/cities/CitiesListTab.tsx` | 2 |
| `src/components/admin/cities/GeoCascadingFilters.tsx` | 2 |
| `src/components/admin/cities/ZoneCard.tsx` | 2 |
| `src/components/admin/CitiesManager.tsx` | 2 |
| `src/components/admin/cityEditor/culture/CultureHistory.tsx` | 2 |
| `src/components/admin/cityEditor/culture/CulturePatron.tsx` | 2 |
| `src/components/admin/cityEditor/culture/CulturePeople.tsx` | 2 |
| `src/components/admin/cityEditor/EditorGeneral.tsx` | 2 |
| `src/components/admin/cityEditor/EditorMedia.tsx` | 2 |
| `src/components/admin/cityEditor/tabs/TabCulture.tsx` | 2 |
| `src/components/admin/cityEditor/tabs/TabGeneral.tsx` | 2 |
| `src/components/admin/cityEditor/tabs/TabMedia.tsx` | 2 |
| `src/components/admin/communications/CommsTemplates.tsx` | 2 |
| `src/components/admin/LoadingTipsManager.tsx` | 2 |
| `src/components/admin/marketing/AiLimitsPanel.tsx` | 2 |
| `src/components/admin/NewsTickerManager.tsx` | 2 |
| `src/components/admin/onboarding/OnboardingVisualEditor.tsx` | 2 |
| `src/components/admin/photos/PhotoRow.tsx` | 2 |
| `src/components/admin/platformControl/PlatformControlCenter.tsx` | 2 |
| `src/components/admin/poiManager/PoiList.tsx` | 2 |
| `src/components/admin/poiManager/PoiToolbar.tsx` | 2 |
| `src/components/admin/poiModal/PoiInfoTab.tsx` | 2 |
| `src/components/admin/poiModal/PoiLinksTab.tsx` | 2 |
| `src/components/admin/social/SocialCanvas.tsx` | 2 |
| `src/components/admin/sponsor/SponsorTable.tsx` | 2 |
| `src/components/admin/userManager/CreateUserModal.tsx` | 2 |
| `src/components/city/CityCard.tsx` | 2 |
| `src/components/city/components/NearbyCitiesRow.tsx` | 2 |
| `src/components/city/ShowcaseCards.tsx` | 2 |
| `src/components/city/tabs/CategorySponsorColumn.tsx` | 2 |
| `src/components/city/tabs/CityCategoryTab.tsx` | 2 |
| `src/components/city/tabs/CityGallery.tsx` | 2 |
| `src/components/collaboration/CollaborationShareModal.tsx` | 2 |
| `src/components/common/AnchoredPopover.tsx` | 2 |
| `src/components/common/CitySelector.tsx` | 2 |
| `src/components/common/ImageWithFallback.tsx` | 2 |
| `src/components/features/diary/DiaryDay.tsx` | 2 |
| `src/components/features/diary/DiaryHeader.tsx` | 2 |
| `src/components/features/diary/DiaryMemoCard.tsx` | 2 |
| `src/components/features/diary/DiaryModals.tsx` | 2 |
| `src/components/features/diary/DiaryTimeline.tsx` | 2 |
| `src/components/features/diary/header/DiaryHeaderDateRange.tsx` | 2 |
| `src/components/features/diary/header/DiaryHeaderProjectInput.tsx` | 2 |
| `src/components/features/diary/ItineraryItemCard.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsSetupStep.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/BlacklistModal.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/CategorySetupConfigurationModal.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/CategorySuggestionPanel.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/LinkSuitcaseModal.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/RecommendedSuitcaseModal.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/SavedSuitcasesSection.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseEditorToolbar.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseItemRow.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseStatusBox.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/tabs/AiCatalogTab.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/tabs/override/TemplateSelector.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/tabs/StandardItemsTab.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/tabs/TemplateLibraryTab.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/TemplateRow.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/TemplateSelectorSection.tsx` | 2 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/components/SuitcaseModals.tsx` | 2 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/components/SuitcaseToast.tsx` | 2 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelOptimisticUpdates.ts` | 2 |
| `src/components/home/CuratedGridSection.tsx` | 2 |
| `src/components/home/hero/components/SearchBar.tsx` | 2 |
| `src/components/itineraries/ItinerariesList.tsx` | 2 |
| `src/components/layout/ModalManager.tsx` | 2 |
| `src/components/layout/modals/FeatureModals.tsx` | 2 |
| `src/components/layout/NewsTicker.tsx` | 2 |
| `src/components/layout/OnboardingWizard.tsx` | 2 |
| `src/components/modals/AddToItineraryModal.tsx` | 2 |
| `src/components/modals/AroundMeWizard.tsx` | 2 |
| `src/components/modals/cityInfo/CityEventsTab.tsx` | 2 |
| `src/components/modals/cityInfo/CityServicesTab.tsx` | 2 |
| `src/components/modals/cityInfo/CityTourOperatorsTab.tsx` | 2 |
| `src/components/modals/cityInfo/ServicesCategoryList.tsx` | 2 |
| `src/components/modals/CityInfoModal.tsx` | 2 |
| `src/components/modals/FullRankingsModal.tsx` | 2 |
| `src/components/modals/PoiDetailModal.tsx` | 2 |
| `src/components/modals/ProvinceModal.tsx` | 2 |
| `src/components/modals/sectionPreview/PreviewGallery.tsx` | 2 |
| `src/components/modals/SponsorModal.tsx` | 2 |
| `src/components/modals/SuggestionModal.tsx` | 2 |
| `src/components/pdf/TravelDocument.tsx` | 2 |
| `src/components/rankings/PhotoGrid.tsx` | 2 |
| `src/components/rankings/PoiList.tsx` | 2 |
| `src/components/rankings/RankingFilters.tsx` | 2 |
| `src/components/shop/BottegaSponsorCard.tsx` | 2 |
| `src/components/shop/ProductDetailOverlay.tsx` | 2 |
| `src/components/shop/ShopBioOverlay.tsx` | 2 |
| `src/components/shop/ShopCard.tsx` | 2 |
| `src/components/shop/ShopCategoryView.tsx` | 2 |
| `src/components/shop/ShopDetailView.tsx` | 2 |
| `src/components/shop/ShopHeader.tsx` | 2 |
| `src/components/shop/ShopHomeView.tsx` | 2 |
| `src/components/shop/ShopInfo.tsx` | 2 |
| `src/components/shop/ShopReviews.tsx` | 2 |
| `src/components/shop/ShopSponsorColumn.tsx` | 2 |
| `src/components/user/dashboard/UserNotificationsTab.tsx` | 2 |
| `src/components/user/UserDashboard.tsx` | 2 |
| `src/context/AiPlannerContext.tsx` | 2 |
| `src/context/BusinessContext.tsx` | 2 |
| `src/context/DiaryInteractionContext.tsx` | 2 |
| `src/context/InteractionContext.tsx` | 2 |
| `src/context/ItineraryContext.tsx` | 2 |
| `src/hooks/admin/people/usePeopleAI.ts` | 2 |
| `src/hooks/admin/useAiCompleteCity.ts` | 2 |
| `src/hooks/admin/useAiFlashSearch.ts` | 2 |
| `src/hooks/admin/useAiMagicCity.ts` | 2 |
| `src/hooks/admin/useAiTargetedSearch.ts` | 2 |
| `src/hooks/admin/useAiValidation.ts` | 2 |
| `src/hooks/admin/usePhotoModeration.ts` | 2 |
| `src/hooks/admin/useSocialTemplates.ts` | 2 |
| `src/hooks/admin/useSponsorStats.ts` | 2 |
| `src/hooks/suitcase/aiSuggestions.ts` | 2 |
| `src/hooks/suitcase/useAffiliateGear.ts` | 2 |
| `src/hooks/useCityGenerator.ts` | 2 |
| `src/hooks/useDiaryLogic.ts` | 2 |
| `src/hooks/usePoiForm.ts` | 2 |
| `src/hooks/useSponsorModalLogic.ts` | 2 |
| `src/services/affiliateAdminService.ts` | 2 |
| `src/services/ai/generators/cityContentGenerator.ts` | 2 |
| `src/services/ai/generators/poiGenerator.ts` | 2 |
| `src/services/city/cityLifecycleService.ts` | 2 |
| `src/services/city/cityPayloadMapper.ts` | 2 |
| `src/services/city/cityReadService.ts` | 2 |
| `src/services/city/poi/poiRead.ts` | 2 |
| `src/services/community/postService.ts` | 2 |
| `src/services/marketingService.ts` | 2 |
| `src/services/socialMarketingService.ts` | 2 |
| `src/services/sponsors/sponsorRequestsService.ts` | 2 |
| `src/services/stagingService.ts` | 2 |
| `src/services/suitcase/associateSuitcaseWithDiary.ts` | 2 |
| `src/services/suitcase/packingCatalogService.ts` | 2 |
| `src/services/suitcase/packingSeedService.ts` | 2 |
| `src/services/zoneService.ts` | 2 |
| `src/types/models/City.ts` | 2 |
| `src/types/models/Itinerary.ts` | 2 |
| `src/types/models/Media.ts` | 2 |
| `src/types/write/poiForm.ts` | 2 |
| `src/utils/deriveItineraryCityTypes.ts` | 2 |
| `src/utils/jsonSerialization.ts` | 2 |
| `src/utils/suitcaseCategoryDelete.ts` | 2 |
| `src/components/admin/AdminCommunications.tsx` | 1 |
| `src/components/admin/AdminDashboard.tsx` | 1 |
| `src/components/admin/AdminGamification.tsx` | 1 |
| `src/components/admin/AdminHeaderManager.tsx` | 1 |
| `src/components/admin/AdminPhotoInspector.tsx` | 1 |
| `src/components/admin/AdminPoiModal.tsx` | 1 |
| `src/components/admin/AdminRoleManager.tsx` | 1 |
| `src/components/admin/AdminStatsDashboard.tsx` | 1 |
| `src/components/admin/AdminTaxonomyManager.tsx` | 1 |
| `src/components/admin/AdminUserManager.tsx` | 1 |
| `src/components/admin/AiEconomicsDashboard.tsx` | 1 |
| `src/components/admin/cities/CityAuditModal.tsx` | 1 |
| `src/components/admin/cities/DeleteCityOptionsModal.tsx` | 1 |
| `src/components/admin/cities/ProcessLogModal.tsx` | 1 |
| `src/components/admin/cities/RegionalAnalysisModal.tsx` | 1 |
| `src/components/admin/cities/StrategicMapTab.tsx` | 1 |
| `src/components/admin/cityEditor/EditorRatings.tsx` | 1 |
| `src/components/admin/cityEditor/FormFieldHelper.tsx` | 1 |
| `src/components/admin/cityEditor/services/EditorInfo.tsx` | 1 |
| `src/components/admin/cityEditor/services/ServiceOperators.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabPois.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabRatings.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabServices.tsx` | 1 |
| `src/components/admin/common/AdminAiRuntimeBanner.tsx` | 1 |
| `src/components/admin/common/AdminMultiSelect.tsx` | 1 |
| `src/components/admin/common/AdminPageHeader.tsx` | 1 |
| `src/components/admin/common/AdminSectionCard.tsx` | 1 |
| `src/components/admin/communications/CommsHistory.tsx` | 1 |
| `src/components/admin/design/ComponentPreviewHost.tsx` | 1 |
| `src/components/admin/design/DesignSystemSettings.tsx` | 1 |
| `src/components/admin/design/foundation/FoundationPreviewComponents.tsx` | 1 |
| `src/components/admin/design/StyleEditor.tsx` | 1 |
| `src/components/admin/foundation/FoundationSettingsPanel.tsx` | 1 |
| `src/components/admin/import/components/ImportFilterBar.tsx` | 1 |
| `src/components/admin/import/components/ImportTable.tsx` | 1 |
| `src/components/admin/import/ImportDashboard.tsx` | 1 |
| `src/components/admin/import/ImportOsmModal.tsx` | 1 |
| `src/components/admin/ItineraryManager.tsx` | 1 |
| `src/components/admin/marketing/AdminCreditPackages.tsx` | 1 |
| `src/components/admin/marketing/CampaignsPanel.tsx` | 1 |
| `src/components/admin/marketing/PricingHistoryPanel.tsx` | 1 |
| `src/components/admin/myworld/MyWorldStyleSettingsPanel.tsx` | 1 |
| `src/components/admin/observatory/AnomalyInspector.tsx` | 1 |
| `src/components/admin/observatory/CityStatsGrid.tsx` | 1 |
| `src/components/admin/observatory/DuplicateResolver.tsx` | 1 |
| `src/components/admin/observatory/ObservatoryFilterDrawer.tsx` | 1 |
| `src/components/admin/observatory/ObservatoryLayout.tsx` | 1 |
| `src/components/admin/observatory/ScheduleMatrix.tsx` | 1 |
| `src/components/admin/PartnerDetailModal.tsx` | 1 |
| `src/components/admin/PhotoModeration.tsx` | 1 |
| `src/components/admin/photos/PhotoFilters.tsx` | 1 |
| `src/components/admin/photos/PhotoMetadataModal.tsx` | 1 |
| `src/components/admin/photos/PhotoTable.tsx` | 1 |
| `src/components/admin/platformControl/AuditHistoryPanel.tsx` | 1 |
| `src/components/admin/platformControl/FeatureFlagBooleanRow.tsx` | 1 |
| `src/components/admin/platformControl/FeatureFlagNumberRow.tsx` | 1 |
| `src/components/admin/platformControl/MaintenancePanel.tsx` | 1 |
| `src/components/admin/platformControl/MessageTemplateEditor.tsx` | 1 |
| `src/components/admin/platformControl/PlatformControlSection.tsx` | 1 |
| `src/components/admin/platformControl/PlatformControlTabBanner.tsx` | 1 |
| `src/components/admin/platformControl/SchedulePanel.tsx` | 1 |
| `src/components/admin/poiModal/PoiLogisticsTab.tsx` | 1 |
| `src/components/admin/poiModal/PoiMarketingTab.tsx` | 1 |
| `src/components/admin/poiModal/PoiMediaTab.tsx` | 1 |
| `src/components/admin/settings/ArrayRenderer.tsx` | 1 |
| `src/components/admin/settings/FieldRenderer.tsx` | 1 |
| `src/components/admin/settings/GlobalSettingsPanel.tsx` | 1 |
| `src/components/admin/settings/inputs/BooleanToggle.tsx` | 1 |
| `src/components/admin/settings/inputs/NumberInput.tsx` | 1 |
| `src/components/admin/settings/inputs/StringInput.tsx` | 1 |
| `src/components/admin/settings/ObjectRenderer.tsx` | 1 |
| `src/components/admin/settings/PartnerIntegrationsPanel.tsx` | 1 |
| `src/components/admin/settings/SettingsPage.tsx` | 1 |
| `src/components/admin/settings/WorkspaceEngineSettingsPanel.tsx` | 1 |
| `src/components/admin/social/AiBackgroundPanel.tsx` | 1 |
| `src/components/admin/sponsor/SponsorToolbar.tsx` | 1 |
| `src/components/admin/SponsorDashboardOverview.tsx` | 1 |
| `src/components/admin/SponsorFilters.tsx` | 1 |
| `src/components/admin/SponsorManager.tsx` | 1 |
| `src/components/admin/userManager/UserSubscriptionsTab.tsx` | 1 |
| `src/components/admin/userManager/UserTable.tsx` | 1 |
| `src/components/admin/views/UserManagementView.tsx` | 1 |
| `src/components/aiPlanner/AiLoadingScreen.tsx` | 1 |
| `src/components/aiPlanner/AiPlannerForm.tsx` | 1 |
| `src/components/city/CityDetailContent.tsx` | 1 |
| `src/components/city/CityHeader.tsx` | 1 |
| `src/components/city/CityHistory.tsx` | 1 |
| `src/components/city/components/CompassExploreButton.tsx` | 1 |
| `src/components/city/tabs/CityShowcaseTab.tsx` | 1 |
| `src/components/city/WeatherWidget.tsx` | 1 |
| `src/components/collaboration/CollaborationLastEditorLine.tsx` | 1 |
| `src/components/collaboration/CollaborationManagementView.tsx` | 1 |
| `src/components/collaboration/CollaborationShareWizard.tsx` | 1 |
| `src/components/collaboration/CollaborationUserInviteSearch.tsx` | 1 |
| `src/components/collaboration/CollaborationWizardFooter.tsx` | 1 |
| `src/components/collaboration/compositionSelectableRow.tsx` | 1 |
| `src/components/collaboration/live/CollaborationActivityFeed.tsx` | 1 |
| `src/components/collaboration/live/CollaborationLiveBar.tsx` | 1 |
| `src/components/collaboration/live/CollaborationLockBanner.tsx` | 1 |
| `src/components/collaboration/OptionCard.tsx` | 1 |
| `src/components/collaboration/SharedResourceIndicator.tsx` | 1 |
| `src/components/collaboration/useCollaborationShareCompositionHandlers.ts` | 1 |
| `src/components/collaboration/workspace/WorkspaceInvitesSection.tsx` | 1 |
| `src/components/collaboration/workspace/WorkspaceMembersSection.tsx` | 1 |
| `src/components/collaboration/workspace/WorkspaceQuickAccess.tsx` | 1 |
| `src/components/collaboration/workspace/WorkspaceResourcePermissionSelect.tsx` | 1 |
| `src/components/collaboration/workspace/WorkspaceResourcesSection.tsx` | 1 |
| `src/components/collaboration/WorkspaceInviteStep.tsx` | 1 |
| `src/components/collaboration/WorkspacePickElementStep.tsx` | 1 |
| `src/components/collaboration/WorkspaceShareWizardSteps.tsx` | 1 |
| `src/components/common/AdPlaceholder.tsx` | 1 |
| `src/components/common/CustomCalendar.tsx` | 1 |
| `src/components/common/DeleteConfirmationModal.tsx` | 1 |
| `src/components/common/DraggableSlider.tsx` | 1 |
| `src/components/common/HorizontalScrollStrip.tsx` | 1 |
| `src/components/common/SmartFilterDrawer.tsx` | 1 |
| `src/components/common/SwipeToDelete.tsx` | 1 |
| `src/components/community/liveFeed/LiveFeedCarousel.tsx` | 1 |
| `src/components/community/liveFeed/LiveFeedHero.tsx` | 1 |
| `src/components/community/liveFeed/LiveFeedToolbar.tsx` | 1 |
| `src/components/community/QaForumTab.tsx` | 1 |
| `src/components/community/RankingTab.tsx` | 1 |
| `src/components/community/UserPhotoEditor.tsx` | 1 |
| `src/components/export/ExportLogo.tsx` | 1 |
| `src/components/features/checkout/CheckoutSuccessPage.tsx` | 1 |
| `src/components/features/diary/cityName.ts` | 1 |
| `src/components/features/diary/header/DiaryHeaderInvalidDateModal.tsx` | 1 |
| `src/components/features/diary/header/DiaryHeaderTabs.tsx` | 1 |
| `src/components/features/diary/header/DiaryHeaderToolbar.tsx` | 1 |
| `src/components/features/diary/header/DiaryHeaderUndoRedo.tsx` | 1 |
| `src/components/features/diary/header/DiaryToolbarPopoverHeader.tsx` | 1 |
| `src/components/features/diary/nationFlag.ts` | 1 |
| `src/components/features/diary/notes/DiaryNotesLinkBubbleMenu.tsx` | 1 |
| `src/components/features/diary/notes/DiaryNotesTabs.tsx` | 1 |
| `src/components/features/diary/notes/DiaryNotesToolbar.tsx` | 1 |
| `src/components/features/diary/notes/DiaryNoteTabMenu.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/AffiliateEditorialCenter.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionReviewRow.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsPanel.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/AssociationConfirmationModal.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/CategoryItemsGrid.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/CategoryMobileDialog.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/CategoryPanelsHeader.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/CategorySection.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/CategoryStatusFilter.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/EditorialCenterTabs.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/GuestDraftBanner.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/HiddenCategoriesPanel.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/ItemDeleteConfirmationModal.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/MoveItemCategoryPopover.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/NewCategoryPanel.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/OptionalCategoriesPanel.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseAscentProgressIndicator.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseDashboardGuideColumn.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/suitcaseDashboardPanelUi.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseMobileSuggestionsDrawer.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseOnboardingBox.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseSidePanel.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseToolbarGroup.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseToolbarProgressBox.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseUtils.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/tabs/override/CategoryAccordion.tsx` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel.tsx` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelModals.ts` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseAffiliate.ts` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseLifecycle.ts` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/selectors/suitcaseSelectors.ts` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/utils/duplicateCheck.ts` | 1 |
| `src/components/features/diary/PublishCommunityModal.tsx` | 1 |
| `src/components/features/diary/TravelDiary.tsx` | 1 |
| `src/components/gamification/RewardsFreezeNotice.tsx` | 1 |
| `src/components/home/hero/components/HeroCollapsedBar.tsx` | 1 |
| `src/components/home/hero/components/HeroCompactInputShell.tsx` | 1 |
| `src/components/home/hero/components/HeroCompactTypingField.tsx` | 1 |
| `src/components/home/hero/components/HeroExpandableSection.tsx` | 1 |
| `src/components/home/HeroSection.tsx` | 1 |
| `src/components/itineraries/ItinerariesExplorer.tsx` | 1 |
| `src/components/itineraries/ItineraryDetail.tsx` | 1 |
| `src/components/itineraries/ItineraryReviews.tsx` | 1 |
| `src/components/layout/AppRouter.tsx` | 1 |
| `src/components/layout/AppShell.tsx` | 1 |
| `src/components/layout/HeaderCreditsIndicator.tsx` | 1 |
| `src/components/layout/ModalManagerTypes.ts` | 1 |
| `src/components/layout/modals/AdminModals.tsx` | 1 |
| `src/components/layout/NarrativeCompass.tsx` | 1 |
| `src/components/layout/Sidebar.tsx` | 1 |
| `src/components/layout/StaticPage.tsx` | 1 |
| `src/components/modals/AiItineraryModal.tsx` | 1 |
| `src/components/modals/cityInfo/CityGuidesTab.tsx` | 1 |
| `src/components/modals/CultureCornerModal.tsx` | 1 |
| `src/components/modals/DuplicateResolutionModal.tsx` | 1 |
| `src/components/modals/EmptyDiaryModal.tsx` | 1 |
| `src/components/modals/ExportModal.tsx` | 1 |
| `src/components/modals/GlobalSectionView.tsx` | 1 |
| `src/components/modals/HistoryModal.tsx` | 1 |
| `src/components/modals/LimitWarningModal.tsx` | 1 |
| `src/components/modals/MobileMoveModal.tsx` | 1 |
| `src/components/modals/PatronSaintModal.tsx` | 1 |
| `src/components/modals/PoiClaimModal.tsx` | 1 |
| `src/components/modals/poiDetail/PoiImageSection.tsx` | 1 |
| `src/components/modals/QuotaExceededModal.tsx` | 1 |
| `src/components/modals/RemoveItemModal.tsx` | 1 |
| `src/components/modals/ReviewModal.tsx` | 1 |
| `src/components/modals/sectionPreview/PreviewHero.tsx` | 1 |
| `src/components/modals/sectionPreview/PreviewRatings.tsx` | 1 |
| `src/components/modals/SetUsernameModal.tsx` | 1 |
| `src/components/modals/shell/BaseFullscreenModalShell.tsx` | 1 |
| `src/components/modals/sponsor/SponsorForm.tsx` | 1 |
| `src/components/modals/sponsor/SponsorTypeSelector.tsx` | 1 |
| `src/components/modals/SuggestionReviewModal.tsx` | 1 |
| `src/components/modals/TimeConflictModal.tsx` | 1 |
| `src/components/modals/UnsavedChangesModal.tsx` | 1 |
| `src/components/myspace/CreateDiaryModal.tsx` | 1 |
| `src/components/myspace/CreateSuitcaseModal.tsx` | 1 |
| `src/components/myspace/FavoriteBookmarkButton.tsx` | 1 |
| `src/components/myspace/MySpaceCityPickModal.tsx` | 1 |
| `src/components/myspace/MySpaceCityThumbCollage.tsx` | 1 |
| `src/components/myspace/MySpaceExplorerRoot.tsx` | 1 |
| `src/components/myspace/MySpaceFavoritesRoot.tsx` | 1 |
| `src/components/myspace/MySpaceInvitesRoot.tsx` | 1 |
| `src/components/myspace/MySpaceMinimalShell.tsx` | 1 |
| `src/components/myspace/MySpaceRootNav.tsx` | 1 |
| `src/components/myspace/MySpaceSectionHeader.tsx` | 1 |
| `src/components/myspace/MySpaceToolsRoot.tsx` | 1 |
| `src/components/myspace/MySpaceTripsCatalog.tsx` | 1 |
| `src/components/myspace/MySpaceViaggioCityThumbButton.tsx` | 1 |
| `src/components/myspace/MySpaceViaggioCoverPreview.tsx` | 1 |
| `src/components/myspace/MySpaceViaggioDeleteModal.tsx` | 1 |
| `src/components/myspace/ResourceConflictCopyModal.tsx` | 1 |
| `src/components/myspace/RicordamiConfigModal.tsx` | 1 |
| `src/components/myspace/SuitcaseDiariesModal.tsx` | 1 |
| `src/components/myspace/ViaggioAllegatiSection.tsx` | 1 |
| `src/components/myspace/ViaggioAssociationFields.tsx` | 1 |
| `src/components/myspace/ViaggioDiarioSection.tsx` | 1 |
| `src/components/myspace/ViaggioFolderShell.tsx` | 1 |
| `src/components/myspace/ViaggioMappaGoogleEmbed.tsx` | 1 |
| `src/components/myspace/ViaggioMappaSection.tsx` | 1 |
| `src/components/myspace/ViaggioRicordamiControl.tsx` | 1 |
| `src/components/myspace/ViaggioRicordiSection.tsx` | 1 |
| `src/components/myspace/ViaggioRiepilogoSection.tsx` | 1 |
| `src/components/myspace/ViaggioRoadbookSection.tsx` | 1 |
| `src/components/myspace/ViaggioSectionPlaceholder.tsx` | 1 |
| `src/components/myspace/ViaggioValigiaSection.tsx` | 1 |
| `src/components/myworld/MyWorldChooserPanel.tsx` | 1 |
| `src/components/pdf/RoadbookDocument.tsx` | 1 |
| `src/components/photos/CommunityPhotoPublishModal.tsx` | 1 |
| `src/components/photos/CommunityPhotoWorkflow.tsx` | 1 |
| `src/components/photos/InAppCameraCapture.tsx` | 1 |
| `src/components/photos/PhotoAcquireDialog.tsx` | 1 |
| `src/components/platform/FeatureFlagPausedBanner.tsx` | 1 |
| `src/components/save/SaveMenuPopover.tsx` | 1 |
| `src/components/shop/ShopPage.tsx` | 1 |
| `src/components/ui/CarouselPositionIndicator.tsx` | 1 |
| `src/components/ui/controls/CloseButton.tsx` | 1 |
| `src/components/ui/CountBadge.tsx` | 1 |
| `src/components/ui/header/HeaderPopover.tsx` | 1 |
| `src/components/user/dashboard/UserFriendsTab.tsx` | 1 |
| `src/components/user/dashboard/UserMessagesTab.tsx` | 1 |
| `src/components/user/dashboard/UserSettingsTab.tsx` | 1 |
| `src/components/user/dashboard/UserSharingTab.tsx` | 1 |
| `src/components/user/dashboard/UserWalletTab.tsx` | 1 |
| `src/components/user/profile/ProfileIdentityFields.tsx` | 1 |
| `src/components/user/profile/UserAvatar.tsx` | 1 |
| `src/components/user/referral/SocialCardGenerator.tsx` | 1 |
| `src/components/workspace/global/GlobalWorkspacePanel.tsx` | 1 |
| `src/components/workspace/global/GlobalWorkspacePanelBody.tsx` | 1 |
| `src/components/workspace/global/GlobalWorkspacePanelRoot.tsx` | 1 |
| `src/components/workspace/global/sections/AllegatiCategoryPanel.tsx` | 1 |
| `src/components/workspace/global/sections/AllegatiSection.tsx` | 1 |
| `src/components/workspace/global/sections/AttivitaSection.tsx` | 1 |
| `src/components/workspace/global/sections/CondivisioneSection.tsx` | 1 |
| `src/components/workspace/global/sections/InvitiSection.tsx` | 1 |
| `src/components/workspace/global/sections/UtentiSection.tsx` | 1 |
| `src/components/workspace/global/sections/WorkspaceBlockedUsersSubsection.tsx` | 1 |
| `src/components/workspace/global/sections/WorkspaceCard.tsx` | 1 |
| `src/components/workspace/global/sections/WorkspaceSection.tsx` | 1 |
| `src/components/workspace/global/WorkspaceActiveContextBar.tsx` | 1 |
| `src/components/workspace/global/WorkspaceBinderTab.tsx` | 1 |
| `src/components/workspace/global/WorkspaceSectionNav.tsx` | 1 |
| `src/components/workspace/global/WorkspaceViaggioShellNav.tsx` | 1 |
| `src/context/AppProviders.tsx` | 1 |
| `src/context/CollaborationLiveContext.tsx` | 1 |
| `src/context/ConfigContext.tsx` | 1 |
| `src/context/GpsContext.tsx` | 1 |
| `src/context/ModalContext.tsx` | 1 |
| `src/context/NavigationContext.tsx` | 1 |
| `src/context/PlatformControlContext.tsx` | 1 |
| `src/context/UIContext.tsx` | 1 |
| `src/context/UserContext.tsx` | 1 |
| `src/domain/packing/categorySetupUx.ts` | 1 |
| `src/domain/packing/itemDisplayOrder.ts` | 1 |
| `src/focus/FocusModeContext.tsx` | 1 |
| `src/focus/FocusOverlay.tsx` | 1 |
| `src/hooks/admin/import/useImportActions.ts` | 1 |
| `src/hooks/admin/import/useImportData.ts` | 1 |
| `src/hooks/admin/people/usePeopleData.ts` | 1 |
| `src/hooks/admin/useAdminCityEditorLogic.ts` | 1 |
| `src/hooks/admin/useAffiliateAnalytics.ts` | 1 |
| `src/hooks/admin/useDuplicateFinder.ts` | 1 |
| `src/hooks/admin/usePoiActions.ts` | 1 |
| `src/hooks/admin/usePoiFilters.ts` | 1 |
| `src/hooks/admin/useSocialCanvasLogic.ts` | 1 |
| `src/hooks/admin/useSponsorData.ts` | 1 |
| `src/hooks/admin/useStrategicMap.ts` | 1 |
| `src/hooks/core/useAppInitialization.ts` | 1 |
| `src/hooks/features/useDiaryInteractions.ts` | 1 |
| `src/hooks/features/useNavigationController.ts` | 1 |
| `src/hooks/features/useShopNavigation.ts` | 1 |
| `src/hooks/save/useDiaryDocumentSave.ts` | 1 |
| `src/hooks/save/useSuitcaseDocumentSave.ts` | 1 |
| `src/hooks/suitcase/createWorkspaceFromConfiguration.ts` | 1 |
| `src/hooks/suitcase/useSuitcaseCrud.ts` | 1 |
| `src/hooks/suitcase/useSuitcaseTemplates.ts` | 1 |
| `src/hooks/suitcase/useUserSuitcases.ts` | 1 |
| `src/hooks/ui/useHeroLogic.ts` | 1 |
| `src/hooks/ui/useScrollUI.ts` | 1 |
| `src/hooks/useAdminData.ts` | 1 |
| `src/hooks/useAdminExport.ts` | 1 |
| `src/hooks/useAiGeneration.ts` | 1 |
| `src/hooks/useAIPlanner.ts` | 1 |
| `src/hooks/useAppRouter.ts` | 1 |
| `src/hooks/useCityData.ts` | 1 |
| `src/hooks/useCityGallery.ts` | 1 |
| `src/hooks/useCityList.ts` | 1 |
| `src/hooks/useDynamicStyles.ts` | 1 |
| `src/hooks/useJourneyPhase.ts` | 1 |
| `src/hooks/usePersistedState.ts` | 1 |
| `src/hooks/useRankingsLogic.ts` | 1 |
| `src/hooks/useSponsorExport.ts` | 1 |
| `src/hooks/useSponsorModals.ts` | 1 |
| `src/hooks/useSponsorOperations.ts` | 1 |
| `src/hooks/useSystemMessage.ts` | 1 |
| `src/hooks/useUserDashboardData.ts` | 1 |
| `src/services/ai/aiGateway.ts` | 1 |
| `src/services/ai/aiUtils.ts` | 1 |
| `src/services/ai/generators/qualityGenerator.ts` | 1 |
| `src/services/ai/providers/supabaseProvider.ts` | 1 |
| `src/services/ai/utils/taxonomyUtils.ts` | 1 |
| `src/services/aiConfigService.ts` | 1 |
| `src/services/aiPlannerService.ts` | 1 |
| `src/services/city/cityMediaService.ts` | 1 |
| `src/services/city/cityUpdateService.ts` | 1 |
| `src/services/city/cityWriteService.ts` | 1 |
| `src/services/city/parsers/content/parsePatron.ts` | 1 |
| `src/services/city/parsers/entities/parseEvent.ts` | 1 |
| `src/services/city/parsers/entities/parseGuide.ts` | 1 |
| `src/services/city/parsers/entities/parsePerson.ts` | 1 |
| `src/services/city/parsers/entities/parseService.ts` | 1 |
| `src/services/city/parsers/entities/parseTourOperator.ts` | 1 |
| `src/services/city/parsers/media/parseGallery.ts` | 1 |
| `src/services/city/parsers/media/parseMediaAsset.ts` | 1 |
| `src/services/communicationService.ts` | 1 |
| `src/services/community/reviewService.ts` | 1 |
| `src/services/community/suggestionService.ts` | 1 |
| `src/services/importService.ts` | 1 |
| `src/services/photoMapper.ts` | 1 |
| `src/services/sponsors/sponsorContractsService.ts` | 1 |
| `src/services/subscriptionService.ts` | 1 |
| `src/services/suitcase/prepareForAssociation.ts` | 1 |
| `src/services/suitcase/suitcaseDocumentSaveService.ts` | 1 |
| `src/services/suitcase/suitcaseGuestService.ts` | 1 |
| `src/services/suitcase/suitcaseRejectionsService.ts` | 1 |
| `src/services/supabaseClient.ts` | 1 |
| `src/services/taxonomyService.ts` | 1 |
| `src/services/userService.ts` | 1 |
| `src/types/database.ts` | 1 |
| `src/types/shared/primitives.ts` | 1 |
| `src/types/shared/SponsorStatus.ts` | 1 |
| `src/types/suitcase.ts` | 1 |
| `src/utils/aiAffiliateRenderer.ts` | 1 |
| `src/utils/common.ts` | 1 |
| `src/utils/exportGenerators.ts` | 1 |
| `src/utils/guestSuitcaseHelper.ts` | 1 |
| `src/utils/itineraryAssociability.ts` | 1 |
| `src/utils/media.ts` | 1 |
| `src/utils/pdfUtils.ts` | 1 |
| `src/utils/scheduleUtils.ts` | 1 |
| `src/utils/sponsorValidation.ts` | 1 |
| `src/utils/suitcaseAssociation.ts` | 1 |
| `src/utils/suitcaseDomain.ts` | 1 |
| `src/utils/tagDerivation.ts` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

Occorrenze totali: **862** (sopra soglia elenco riga-per-riga). Inventario sintetico per file:

| File | Occorrenze | Decisione baseline per-file |
|---|---:|---|
| `src/components/features/diary/packing_list/suitcase/SuitcaseEditorView.tsx` | 7 | da correggere (7× Livello A) |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsModal.tsx` | 6 | da correggere (6× Livello A) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseDashboard.tsx` | 5 | da correggere (5× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseAssociationFlow.ts` | 5 | da correggere (5× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseSuggestions.ts` | 5 | da correggere (5× Livello A) |
| `src/services/suitcase/suitcaseCoreService.ts` | 5 | da correggere (5× Livello A) |
| `src/components/city/gallery/GalleryGrid.tsx` | 4 | da correggere (4× Livello A) |
| `src/components/features/diary/packing_list/suitcase/AffiliateSuggestionBox.tsx` | 4 | da correggere (4× Livello A) |
| `src/components/features/diary/packing_list/suitcase/tabs/OverrideTab.tsx` | 4 | da correggere (4× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseActions.ts` | 4 | da correggere (4× Livello A) |
| `src/components/admin/affiliations/AffiliateAnalyticsTab.tsx` | 3 | da correggere (3× Livello A) |
| `src/components/admin/layout/AdminSidebar.tsx` | 3 | da correggere (3× Livello A) |
| `src/components/admin/sponsor/SponsorModals.tsx` | 3 | da correggere (3× Livello A) |
| `src/components/admin/SuggestionManager.tsx` | 3 | da correggere (3× Livello A) |
| `src/components/admin/userManager/AiLimitsTab.tsx` | 3 | da correggere (3× Livello A) |
| `src/components/community/LiveFeedTab.tsx` | 3 | da correggere (3× Livello A) |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsReviewStep.tsx` | 3 | da correggere (3× Livello A) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseCard.tsx` | 3 | da correggere (3× Livello A) |
| `src/components/features/diary/packing_list/suitcase/tabs/override/PartnerLinksPanel.tsx` | 3 | da correggere (3× Livello A) |
| `src/components/features/diary/packing_list/suitcase/tabs/TemplateSpecificItemsTab.tsx` | 3 | da correggere (3× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts` | 3 | da correggere (3× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseEditorLogic.ts` | 3 | da correggere (3× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseItemActions.ts` | 3 | da correggere (3× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcasePanelData.ts` | 3 | da correggere (3× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseUndo.ts` | 3 | da correggere (3× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseUndoHandlers.ts` | 3 | da correggere (3× Livello A) |
| `src/components/home/HomeContent.tsx` | 3 | da correggere (3× Livello A) |
| `src/components/modals/poiDetail/PoiInfoSection.tsx` | 3 | da correggere (3× Livello A) |
| `src/components/modals/SectionPreviewModal.tsx` | 3 | da correggere (3× Livello A) |
| `src/components/modals/sponsor/SponsorPricingSelector.tsx` | 3 | da correggere (3× Livello A) |
| `src/components/modals/UserUpgradeModal.tsx` | 3 | da correggere (3× Livello A) |
| `src/components/rankings/CityRow.tsx` | 3 | da correggere (3× Livello A) |
| `src/components/shop/ShopHero.tsx` | 3 | da correggere (3× Livello A) |
| `src/components/shop/ShopProducts.tsx` | 3 | da correggere (3× Livello A) |
| `src/components/user/BusinessShopManager.tsx` | 3 | da correggere (3× Livello A) |
| `src/components/user/dashboard/UserOverviewTab.tsx` | 3 | da correggere (3× Livello A) |
| `src/components/user/dashboard/UserSuitcasesTab.tsx` | 3 | da correggere (3× Livello A) |
| `src/context/CityEditorContext.tsx` | 3 | da correggere (3× Livello A) |
| `src/hooks/admin/useServiceRegeneration.ts` | 3 | da correggere (3× Livello A) |
| `src/hooks/features/useSponsorFormLogic.ts` | 3 | da correggere (3× Livello A) |
| `src/hooks/suitcase/useHiddenCategories.ts` | 3 | da correggere (3× Livello A) |
| `src/hooks/useDiaryUndo.ts` | 3 | da correggere (3× Livello A) |
| `src/hooks/useSponsorLogic.ts` | 3 | da correggere (3× Livello A) |
| `src/services/ai/aiPlanner.ts` | 3 | da correggere (3× Livello A) |
| `src/services/city/entitiesService.ts` | 3 | da correggere (3× Livello A) |
| `src/services/city/poi/poiMapper.ts` | 3 | da correggere (3× Livello A) |
| `src/services/city/tourOperatorService.ts` | 3 | da correggere (3× Livello A) |
| `src/services/notificationService.ts` | 3 | da correggere (3× Livello A) |
| `src/services/partnerIntegrationService.ts` | 3 | da correggere (3× Livello A) |
| `src/services/photoService.ts` | 3 | da correggere (3× Livello A) |
| `src/services/suitcase/packingCompositionService.ts` | 3 | da correggere (3× Livello A) |
| `src/services/suitcase/suitcaseAffiliateService.ts` | 3 | da correggere (3× Livello A) |
| `src/services/suitcase/suitcaseEditorialService.ts` | 3 | da correggere (3× Livello A) |
| `src/services/suitcase/suitcaseTemplateService.ts` | 3 | da correggere (3× Livello A) |
| `src/types/models/Sponsor.ts` | 3 | da correggere (3× Livello A) |
| `src/components/admin/AdminCityEditor.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/AdminImageInput.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/AdminItineraryEditor.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/AdminPoiManager.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/affiliations/AffiliateOverviewCard.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/cities/CitiesListTab.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/cities/GeoCascadingFilters.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/cities/ZoneCard.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/CitiesManager.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/cityEditor/culture/CultureHistory.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/cityEditor/culture/CulturePatron.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/cityEditor/culture/CulturePeople.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/cityEditor/EditorGeneral.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/cityEditor/EditorMedia.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/cityEditor/tabs/TabCulture.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/cityEditor/tabs/TabGeneral.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/cityEditor/tabs/TabMedia.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/communications/CommsTemplates.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/LoadingTipsManager.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/marketing/AiLimitsPanel.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/NewsTickerManager.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/onboarding/OnboardingVisualEditor.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/photos/PhotoRow.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/platformControl/PlatformControlCenter.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/poiManager/PoiList.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/poiManager/PoiToolbar.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/poiModal/PoiInfoTab.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/poiModal/PoiLinksTab.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/social/SocialCanvas.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/sponsor/SponsorTable.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/admin/userManager/CreateUserModal.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/city/CityCard.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/city/components/NearbyCitiesRow.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/city/ShowcaseCards.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/city/tabs/CategorySponsorColumn.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/city/tabs/CityCategoryTab.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/city/tabs/CityGallery.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/collaboration/CollaborationShareModal.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/common/AnchoredPopover.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/common/CitySelector.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/common/ImageWithFallback.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/features/diary/DiaryDay.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/features/diary/DiaryHeader.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/features/diary/DiaryMemoCard.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/features/diary/DiaryModals.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/features/diary/DiaryTimeline.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/features/diary/header/DiaryHeaderDateRange.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/features/diary/header/DiaryHeaderProjectInput.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/features/diary/ItineraryItemCard.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsSetupStep.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/features/diary/packing_list/suitcase/BlacklistModal.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/features/diary/packing_list/suitcase/CategorySetupConfigurationModal.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/features/diary/packing_list/suitcase/CategorySuggestionPanel.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/features/diary/packing_list/suitcase/LinkSuitcaseModal.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/features/diary/packing_list/suitcase/RecommendedSuitcaseModal.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/features/diary/packing_list/suitcase/SavedSuitcasesSection.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseEditorToolbar.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseItemRow.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseStatusBox.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/features/diary/packing_list/suitcase/tabs/AiCatalogTab.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/features/diary/packing_list/suitcase/tabs/override/TemplateSelector.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/features/diary/packing_list/suitcase/tabs/StandardItemsTab.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/features/diary/packing_list/suitcase/tabs/TemplateLibraryTab.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/features/diary/packing_list/suitcase/TemplateRow.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/features/diary/packing_list/suitcase/TemplateSelectorSection.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/components/SuitcaseModals.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/components/SuitcaseToast.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelOptimisticUpdates.ts` | 2 | da correggere (2× Livello A) |
| `src/components/home/CuratedGridSection.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/home/hero/components/SearchBar.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/itineraries/ItinerariesList.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/layout/ModalManager.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/layout/modals/FeatureModals.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/layout/NewsTicker.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/layout/OnboardingWizard.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/modals/AddToItineraryModal.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/modals/AroundMeWizard.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/modals/cityInfo/CityEventsTab.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/modals/cityInfo/CityServicesTab.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/modals/cityInfo/CityTourOperatorsTab.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/modals/cityInfo/ServicesCategoryList.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/modals/CityInfoModal.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/modals/FullRankingsModal.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/modals/PoiDetailModal.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/modals/ProvinceModal.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/modals/sectionPreview/PreviewGallery.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/modals/SponsorModal.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/modals/SuggestionModal.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/pdf/TravelDocument.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/rankings/PhotoGrid.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/rankings/PoiList.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/rankings/RankingFilters.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/shop/BottegaSponsorCard.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/shop/ProductDetailOverlay.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/shop/ShopBioOverlay.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/shop/ShopCard.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/shop/ShopCategoryView.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/shop/ShopDetailView.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/shop/ShopHeader.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/shop/ShopHomeView.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/shop/ShopInfo.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/shop/ShopReviews.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/shop/ShopSponsorColumn.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/user/dashboard/UserNotificationsTab.tsx` | 2 | da correggere (2× Livello A) |
| `src/components/user/UserDashboard.tsx` | 2 | da correggere (2× Livello A) |
| `src/context/AiPlannerContext.tsx` | 2 | da correggere (2× Livello A) |
| `src/context/BusinessContext.tsx` | 2 | da correggere (2× Livello A) |
| `src/context/DiaryInteractionContext.tsx` | 2 | da correggere (2× Livello A) |
| `src/context/InteractionContext.tsx` | 2 | da correggere (2× Livello A) |
| `src/context/ItineraryContext.tsx` | 2 | da correggere (2× Livello A) |
| `src/hooks/admin/people/usePeopleAI.ts` | 2 | da correggere (2× Livello A) |
| `src/hooks/admin/useAiCompleteCity.ts` | 2 | da correggere (2× Livello A) |
| `src/hooks/admin/useAiFlashSearch.ts` | 2 | da correggere (2× Livello A) |
| `src/hooks/admin/useAiMagicCity.ts` | 2 | da correggere (2× Livello A) |
| `src/hooks/admin/useAiTargetedSearch.ts` | 2 | da correggere (2× Livello A) |
| `src/hooks/admin/useAiValidation.ts` | 2 | da correggere (2× Livello A) |
| `src/hooks/admin/usePhotoModeration.ts` | 2 | da correggere (2× Livello A) |
| `src/hooks/admin/useSocialTemplates.ts` | 2 | da correggere (2× Livello A) |
| `src/hooks/admin/useSponsorStats.ts` | 2 | da correggere (2× Livello A) |
| `src/hooks/suitcase/aiSuggestions.ts` | 2 | da correggere (2× Livello A) |
| `src/hooks/suitcase/useAffiliateGear.ts` | 2 | da correggere (2× Livello A) |
| `src/hooks/useCityGenerator.ts` | 2 | da correggere (2× Livello A) |
| `src/hooks/useDiaryLogic.ts` | 2 | da correggere (2× Livello A) |
| `src/hooks/usePoiForm.ts` | 2 | da correggere (2× Livello A) |
| `src/hooks/useSponsorModalLogic.ts` | 2 | da correggere (2× Livello A) |
| `src/services/affiliateAdminService.ts` | 2 | da correggere (2× Livello A) |
| `src/services/ai/generators/cityContentGenerator.ts` | 2 | da correggere (2× Livello A) |
| `src/services/ai/generators/poiGenerator.ts` | 2 | da correggere (2× Livello A) |
| `src/services/city/cityLifecycleService.ts` | 2 | da correggere (2× Livello A) |
| `src/services/city/cityPayloadMapper.ts` | 2 | da correggere (2× Livello A) |
| `src/services/city/cityReadService.ts` | 2 | da correggere (2× Livello A) |
| `src/services/city/poi/poiRead.ts` | 2 | da correggere (2× Livello A) |
| `src/services/community/postService.ts` | 2 | da correggere (2× Livello A) |
| `src/services/marketingService.ts` | 2 | da correggere (2× Livello A) |
| `src/services/socialMarketingService.ts` | 2 | da correggere (2× Livello A) |
| `src/services/sponsors/sponsorRequestsService.ts` | 2 | da correggere (2× Livello A) |
| `src/services/stagingService.ts` | 2 | da correggere (2× Livello A) |
| `src/services/suitcase/associateSuitcaseWithDiary.ts` | 2 | da correggere (2× Livello A) |
| `src/services/suitcase/packingCatalogService.ts` | 2 | da correggere (2× Livello A) |
| `src/services/suitcase/packingSeedService.ts` | 2 | da correggere (2× Livello A) |
| `src/services/zoneService.ts` | 2 | da correggere (2× Livello A) |
| `src/types/models/City.ts` | 2 | da correggere (2× Livello A) |
| `src/types/models/Itinerary.ts` | 2 | da correggere (2× Livello A) |
| `src/types/models/Media.ts` | 2 | da correggere (2× Livello A) |
| `src/types/write/poiForm.ts` | 2 | da correggere (2× Livello A) |
| `src/utils/deriveItineraryCityTypes.ts` | 2 | da correggere (2× Livello A) |
| `src/utils/jsonSerialization.ts` | 2 | da correggere (2× Livello A) |
| `src/utils/suitcaseCategoryDelete.ts` | 2 | da correggere (2× Livello A) |
| `src/components/admin/AdminCommunications.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AdminDashboard.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AdminGamification.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AdminHeaderManager.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AdminPhotoInspector.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AdminPoiModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AdminRoleManager.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AdminStatsDashboard.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AdminTaxonomyManager.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AdminUserManager.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AiEconomicsDashboard.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cities/CityAuditModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cities/DeleteCityOptionsModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cities/ProcessLogModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cities/RegionalAnalysisModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cities/StrategicMapTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cityEditor/EditorRatings.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cityEditor/FormFieldHelper.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cityEditor/services/EditorInfo.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cityEditor/services/ServiceOperators.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cityEditor/tabs/TabPois.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cityEditor/tabs/TabRatings.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cityEditor/tabs/TabServices.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/common/AdminAiRuntimeBanner.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/common/AdminMultiSelect.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/common/AdminPageHeader.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/common/AdminSectionCard.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/communications/CommsHistory.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/design/ComponentPreviewHost.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/design/DesignSystemSettings.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/design/foundation/FoundationPreviewComponents.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/design/StyleEditor.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/foundation/FoundationSettingsPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/import/components/ImportFilterBar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/import/components/ImportTable.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/import/ImportDashboard.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/import/ImportOsmModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/ItineraryManager.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/marketing/AdminCreditPackages.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/marketing/CampaignsPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/marketing/PricingHistoryPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/myworld/MyWorldStyleSettingsPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/observatory/AnomalyInspector.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/observatory/CityStatsGrid.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/observatory/DuplicateResolver.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/observatory/ObservatoryFilterDrawer.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/observatory/ObservatoryLayout.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/observatory/ScheduleMatrix.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/PartnerDetailModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/PhotoModeration.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/photos/PhotoFilters.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/photos/PhotoMetadataModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/photos/PhotoTable.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/platformControl/AuditHistoryPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/platformControl/FeatureFlagBooleanRow.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/platformControl/FeatureFlagNumberRow.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/platformControl/MaintenancePanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/platformControl/MessageTemplateEditor.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/platformControl/PlatformControlSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/platformControl/PlatformControlTabBanner.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/platformControl/SchedulePanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/poiModal/PoiLogisticsTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/poiModal/PoiMarketingTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/poiModal/PoiMediaTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/settings/ArrayRenderer.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/settings/FieldRenderer.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/settings/GlobalSettingsPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/settings/inputs/BooleanToggle.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/settings/inputs/NumberInput.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/settings/inputs/StringInput.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/settings/ObjectRenderer.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/settings/PartnerIntegrationsPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/settings/SettingsPage.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/settings/WorkspaceEngineSettingsPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/social/AiBackgroundPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/sponsor/SponsorToolbar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/SponsorDashboardOverview.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/SponsorFilters.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/SponsorManager.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/userManager/UserSubscriptionsTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/userManager/UserTable.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/views/UserManagementView.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/aiPlanner/AiLoadingScreen.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/aiPlanner/AiPlannerForm.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/city/CityDetailContent.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/city/CityHeader.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/city/CityHistory.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/city/components/CompassExploreButton.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/city/tabs/CityShowcaseTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/city/WeatherWidget.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/CollaborationLastEditorLine.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/CollaborationManagementView.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/CollaborationShareWizard.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/CollaborationUserInviteSearch.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/CollaborationWizardFooter.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/compositionSelectableRow.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/live/CollaborationActivityFeed.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/live/CollaborationLiveBar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/live/CollaborationLockBanner.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/OptionCard.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/SharedResourceIndicator.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/useCollaborationShareCompositionHandlers.ts` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/workspace/WorkspaceInvitesSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/workspace/WorkspaceMembersSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/workspace/WorkspaceQuickAccess.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/workspace/WorkspaceResourcePermissionSelect.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/workspace/WorkspaceResourcesSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/WorkspaceInviteStep.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/WorkspacePickElementStep.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/WorkspaceShareWizardSteps.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/common/AdPlaceholder.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/common/CustomCalendar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/common/DeleteConfirmationModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/common/DraggableSlider.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/common/HorizontalScrollStrip.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/common/SmartFilterDrawer.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/common/SwipeToDelete.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/community/liveFeed/LiveFeedCarousel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/community/liveFeed/LiveFeedHero.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/community/liveFeed/LiveFeedToolbar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/community/QaForumTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/community/RankingTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/community/UserPhotoEditor.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/export/ExportLogo.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/checkout/CheckoutSuccessPage.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/cityName.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/header/DiaryHeaderInvalidDateModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/header/DiaryHeaderTabs.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/header/DiaryHeaderToolbar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/header/DiaryHeaderUndoRedo.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/header/DiaryToolbarPopoverHeader.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/nationFlag.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/notes/DiaryNotesLinkBubbleMenu.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/notes/DiaryNotesTabs.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/notes/DiaryNotesToolbar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/notes/DiaryNoteTabMenu.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/AffiliateEditorialCenter.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionReviewRow.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/AssociationConfirmationModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/CategoryItemsGrid.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/CategoryMobileDialog.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/CategoryPanelsHeader.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/CategorySection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/CategoryStatusFilter.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/EditorialCenterTabs.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/GuestDraftBanner.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/HiddenCategoriesPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/ItemDeleteConfirmationModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/MoveItemCategoryPopover.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/NewCategoryPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/OptionalCategoriesPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseAscentProgressIndicator.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseDashboardGuideColumn.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/suitcaseDashboardPanelUi.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseMobileSuggestionsDrawer.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseOnboardingBox.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseSidePanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseToolbarGroup.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseToolbarProgressBox.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseUtils.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/tabs/override/CategoryAccordion.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelModals.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseAffiliate.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseLifecycle.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/selectors/suitcaseSelectors.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/utils/duplicateCheck.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/PublishCommunityModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/TravelDiary.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/gamification/RewardsFreezeNotice.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/home/hero/components/HeroCollapsedBar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/home/hero/components/HeroCompactInputShell.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/home/hero/components/HeroCompactTypingField.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/home/hero/components/HeroExpandableSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/home/HeroSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/itineraries/ItinerariesExplorer.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/itineraries/ItineraryDetail.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/itineraries/ItineraryReviews.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/layout/AppRouter.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/layout/AppShell.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/layout/HeaderCreditsIndicator.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/layout/ModalManagerTypes.ts` | 1 | da correggere (1× Livello A) |
| `src/components/layout/modals/AdminModals.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/layout/NarrativeCompass.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/layout/Sidebar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/layout/StaticPage.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/AiItineraryModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/cityInfo/CityGuidesTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/CultureCornerModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/DuplicateResolutionModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/EmptyDiaryModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/ExportModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/GlobalSectionView.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/HistoryModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/LimitWarningModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/MobileMoveModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/PatronSaintModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/PoiClaimModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/poiDetail/PoiImageSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/QuotaExceededModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/RemoveItemModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/ReviewModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/sectionPreview/PreviewHero.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/sectionPreview/PreviewRatings.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/SetUsernameModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/shell/BaseFullscreenModalShell.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/sponsor/SponsorForm.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/sponsor/SponsorTypeSelector.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/SuggestionReviewModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/TimeConflictModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/UnsavedChangesModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/CreateDiaryModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/CreateSuitcaseModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/FavoriteBookmarkButton.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/MySpaceCityPickModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/MySpaceCityThumbCollage.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/MySpaceExplorerRoot.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/MySpaceFavoritesRoot.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/MySpaceInvitesRoot.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/MySpaceMinimalShell.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/MySpaceRootNav.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/MySpaceSectionHeader.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/MySpaceToolsRoot.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/MySpaceTripsCatalog.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/MySpaceViaggioCityThumbButton.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/MySpaceViaggioCoverPreview.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/MySpaceViaggioDeleteModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/ResourceConflictCopyModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/RicordamiConfigModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/SuitcaseDiariesModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/ViaggioAllegatiSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/ViaggioAssociationFields.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/ViaggioDiarioSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/ViaggioFolderShell.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/ViaggioMappaGoogleEmbed.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/ViaggioMappaSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/ViaggioRicordamiControl.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/ViaggioRicordiSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/ViaggioRiepilogoSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/ViaggioRoadbookSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/ViaggioSectionPlaceholder.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/ViaggioValigiaSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myworld/MyWorldChooserPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/pdf/RoadbookDocument.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/photos/CommunityPhotoPublishModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/photos/CommunityPhotoWorkflow.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/photos/InAppCameraCapture.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/photos/PhotoAcquireDialog.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/platform/FeatureFlagPausedBanner.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/save/SaveMenuPopover.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/shop/ShopPage.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/ui/CarouselPositionIndicator.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/ui/controls/CloseButton.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/ui/CountBadge.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/ui/header/HeaderPopover.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/user/dashboard/UserFriendsTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/user/dashboard/UserMessagesTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/user/dashboard/UserSettingsTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/user/dashboard/UserSharingTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/user/dashboard/UserWalletTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/user/profile/ProfileIdentityFields.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/user/profile/UserAvatar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/user/referral/SocialCardGenerator.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/GlobalWorkspacePanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/GlobalWorkspacePanelBody.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/GlobalWorkspacePanelRoot.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/sections/AllegatiCategoryPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/sections/AllegatiSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/sections/AttivitaSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/sections/CondivisioneSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/sections/InvitiSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/sections/UtentiSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/sections/WorkspaceBlockedUsersSubsection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/sections/WorkspaceCard.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/sections/WorkspaceSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/WorkspaceActiveContextBar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/WorkspaceBinderTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/WorkspaceSectionNav.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/WorkspaceViaggioShellNav.tsx` | 1 | da correggere (1× Livello A) |
| `src/context/AppProviders.tsx` | 1 | da correggere (1× Livello A) |
| `src/context/CollaborationLiveContext.tsx` | 1 | da correggere (1× Livello A) |
| `src/context/ConfigContext.tsx` | 1 | da correggere (1× Livello A) |
| `src/context/GpsContext.tsx` | 1 | da correggere (1× Livello A) |
| `src/context/ModalContext.tsx` | 1 | da correggere (1× Livello A) |
| `src/context/NavigationContext.tsx` | 1 | da correggere (1× Livello A) |
| `src/context/PlatformControlContext.tsx` | 1 | da correggere (1× Livello A) |
| `src/context/UIContext.tsx` | 1 | da correggere (1× Livello A) |
| `src/context/UserContext.tsx` | 1 | da correggere (1× Livello A) |
| `src/domain/packing/categorySetupUx.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/packing/itemDisplayOrder.ts` | 1 | da correggere (1× Livello A) |
| `src/focus/FocusModeContext.tsx` | 1 | da correggere (1× Livello A) |
| `src/focus/FocusOverlay.tsx` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/import/useImportActions.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/import/useImportData.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/people/usePeopleData.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/useAdminCityEditorLogic.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/useAffiliateAnalytics.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/useDuplicateFinder.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/usePoiActions.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/usePoiFilters.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/useSocialCanvasLogic.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/useSponsorData.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/useStrategicMap.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/core/useAppInitialization.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/features/useDiaryInteractions.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/features/useNavigationController.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/features/useShopNavigation.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/save/useDiaryDocumentSave.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/save/useSuitcaseDocumentSave.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/suitcase/createWorkspaceFromConfiguration.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/suitcase/useSuitcaseCrud.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/suitcase/useSuitcaseTemplates.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/suitcase/useUserSuitcases.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/ui/useHeroLogic.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/ui/useScrollUI.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useAdminData.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useAdminExport.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useAiGeneration.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useAIPlanner.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useAppRouter.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useCityData.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useCityGallery.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useCityList.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useDynamicStyles.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useJourneyPhase.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/usePersistedState.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useRankingsLogic.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useSponsorExport.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useSponsorModals.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useSponsorOperations.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useSystemMessage.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useUserDashboardData.ts` | 1 | da correggere (1× Livello A) |
| `src/services/ai/aiGateway.ts` | 1 | da correggere (1× Livello A) |
| `src/services/ai/aiUtils.ts` | 1 | da correggere (1× Livello A) |
| `src/services/ai/generators/qualityGenerator.ts` | 1 | da correggere (1× Livello A) |
| `src/services/ai/providers/supabaseProvider.ts` | 1 | da correggere (1× Livello A) |
| `src/services/ai/utils/taxonomyUtils.ts` | 1 | da correggere (1× Livello A) |
| `src/services/aiConfigService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/aiPlannerService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/cityMediaService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/cityUpdateService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/cityWriteService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/parsers/content/parsePatron.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/parsers/entities/parseEvent.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/parsers/entities/parseGuide.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/parsers/entities/parsePerson.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/parsers/entities/parseService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/parsers/entities/parseTourOperator.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/parsers/media/parseGallery.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/parsers/media/parseMediaAsset.ts` | 1 | da correggere (1× Livello A) |
| `src/services/communicationService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/community/reviewService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/community/suggestionService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/importService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/photoMapper.ts` | 1 | da correggere (1× Livello A) |
| `src/services/sponsors/sponsorContractsService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/subscriptionService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/suitcase/prepareForAssociation.ts` | 1 | da correggere (1× Livello A) |
| `src/services/suitcase/suitcaseDocumentSaveService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/suitcase/suitcaseGuestService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/suitcase/suitcaseRejectionsService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/supabaseClient.ts` | 1 | da correggere (1× Livello A) |
| `src/services/taxonomyService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/userService.ts` | 1 | da correggere (1× Livello A) |
| `src/types/database.ts` | 1 | da correggere (1× Livello A) |
| `src/types/shared/primitives.ts` | 1 | da correggere (1× Livello A) |
| `src/types/shared/SponsorStatus.ts` | 1 | da correggere (1× Livello A) |
| `src/types/suitcase.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/aiAffiliateRenderer.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/common.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/exportGenerators.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/guestSuitcaseHelper.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/itineraryAssociability.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/media.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/pdfUtils.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/scheduleUtils.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/sponsorValidation.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/suitcaseAssociation.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/suitcaseDomain.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/tagDerivation.ts` | 1 | da correggere (1× Livello A) |

Nota: il dettaglio riga e riproducibile in qualsiasi momento con `npx biome check --reporter=json` filtrato sulla categoria.

