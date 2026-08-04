# useButtonType

> Dettaglio baseline Biome full-project. Dashboard: [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md)

| Campo | Valore |
|----|----|
| **Documento** | `AI_QUALITY/biome/AB_useButtonType.md` |
| **Categorie** | `lint/a11y/useButtonType` |
| **Occorrenze (somma gruppo)** | **852** |
| **File unici nel gruppo** | **206** |
| **Livello** | **A/B** |
| **Ultimo aggiornamento** | 2026-08-03 |
| **Stato** | Baseline ufficiale — nessuna correzione applicata in questa attivita |

## `lint/a11y/useButtonType`

### Descrizione della regola

Elementi button devono avere attributo type esplicito.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/a11y/useButtonType` |
| **Occorrenze totali** | **852** |
| **Error** | 852 |
| **Warning** | 0 |
| **Info** | 0 |
| **File coinvolti** | **206** |
| **Livello di rischio** | **A/B** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

type=button sicuro se c'e onClick/handler; senza handler puo mascherare bug submit. Verifica breve per bottone.

### Strategia di correzione

Classificare form ancestry + onClick; applicare type solo dove azione esplicita.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/components/admin/AdminHeaderManager.tsx` | 23 |
| `src/components/admin/communications/CommsTemplates.tsx` | 21 |
| `src/components/admin/poiManager/PoiToolbar.tsx` | 19 |
| `src/components/admin/cityEditor/culture/CulturePeople.tsx` | 18 |
| `src/components/admin/AdminGamification.tsx` | 14 |
| `src/components/admin/cities/ZoneCard.tsx` | 14 |
| `src/components/admin/cities/CitiesListTab.tsx` | 13 |
| `src/components/city/CityHeader.tsx` | 13 |
| `src/components/user/dashboard/UserSidebar.tsx` | 13 |
| `src/components/admin/AdminPhotoInspector.tsx` | 12 |
| `src/components/admin/observatory/ObservatoryFilterDrawer.tsx` | 12 |
| `src/components/features/diary/ItineraryItemCard.tsx` | 12 |
| `src/components/layout/Header.tsx` | 12 |
| `src/components/admin/AdminItineraryEditor.tsx` | 10 |
| `src/components/admin/sponsor/SponsorTable.tsx` | 10 |
| `src/components/admin/AdminPoiModal.tsx` | 9 |
| `src/components/admin/AiLimitsControlCenter.tsx` | 9 |
| `src/components/admin/NewsTickerManager.tsx` | 9 |
| `src/components/admin/onboarding/OnboardingVisualEditor.tsx` | 9 |
| `src/components/admin/poiManager/PoiList.tsx` | 9 |
| `src/components/admin/AdminCityEditor.tsx` | 8 |
| `src/components/admin/AdminSocialStudio.tsx` | 8 |
| `src/components/admin/AdminTaxonomyManager.tsx` | 8 |
| `src/components/admin/cityEditor/EditorGeneral.tsx` | 8 |
| `src/components/admin/photos/PhotoRow.tsx` | 8 |
| `src/components/city/tabs/CityCategoryTab.tsx` | 8 |
| `src/components/itineraries/ItinerariesExplorer.tsx` | 8 |
| `src/components/itineraries/ItineraryDetail.tsx` | 8 |
| `src/components/admin/cityEditor/EditorMedia.tsx` | 7 |
| `src/components/admin/cityEditor/tabs/TabGeneral.tsx` | 7 |
| `src/components/admin/cityEditor/tabs/TabMedia.tsx` | 7 |
| `src/components/admin/import/components/ImportActionToolbar.tsx` | 7 |
| `src/components/admin/sponsor/SponsorToolbar.tsx` | 7 |
| `src/components/aiPlanner/AiPlannerForm.tsx` | 7 |
| `src/components/modals/AiItineraryModal.tsx` | 7 |
| `src/components/modals/PoiClaimModal.tsx` | 7 |
| `src/components/modals/poiDetail/PoiInfoSection.tsx` | 7 |
| `src/components/admin/AdminImageInput.tsx` | 6 |
| `src/components/admin/cities/RegionalAnalysisModal.tsx` | 6 |
| `src/components/admin/cityEditor/services/ServiceEvents.tsx` | 6 |
| `src/components/admin/cityEditor/services/ServiceGuides.tsx` | 6 |
| `src/components/admin/cityEditor/services/ServiceOperators.tsx` | 6 |
| `src/components/admin/economics/PricingManager.tsx` | 6 |
| `src/components/admin/GlobalEventsManager.tsx` | 6 |
| `src/components/admin/observatory/AnomalyInspector.tsx` | 6 |
| `src/components/features/diary/header/DiaryHeaderProjectInput.tsx` | 6 |
| `src/components/features/diary/packing_list/suitcase/CategorySection.tsx` | 6 |
| `src/components/layout/MobileNavBar.tsx` | 6 |
| `src/components/modals/AddToItineraryModal.tsx` | 6 |
| `src/components/modals/cityInfo/ServicesCategoryList.tsx` | 6 |
| `src/components/modals/poiDetail/PoiImageSection.tsx` | 6 |
| `src/components/modals/SectionPreviewModal.tsx` | 6 |
| `src/components/modals/SuggestionReviewModal.tsx` | 6 |
| `src/components/user/BusinessShopManager.tsx` | 6 |
| `src/components/admin/AdminCommunications.tsx` | 5 |
| `src/components/admin/AdminStatsDashboard.tsx` | 5 |
| `src/components/admin/CitiesManager.tsx` | 5 |
| `src/components/admin/layout/AdminSidebar.tsx` | 5 |
| `src/components/admin/observatory/DuplicateResolver.tsx` | 5 |
| `src/components/admin/PartnerDetailModal.tsx` | 5 |
| `src/components/admin/poiModal/PoiInfoTab.tsx` | 5 |
| `src/components/city/components/NearbyCitiesRow.tsx` | 5 |
| `src/components/city/gallery/GalleryGrid.tsx` | 5 |
| `src/components/city/tabs/CityShowcaseTab.tsx` | 5 |
| `src/components/common/SmartFilterDrawer.tsx` | 5 |
| `src/components/community/QaForumTab.tsx` | 5 |
| `src/components/features/diary/DiaryTimeline.tsx` | 5 |
| `src/components/modals/AroundMeWizard.tsx` | 5 |
| `src/components/modals/PoiDetailModal.tsx` | 5 |
| `src/components/admin/cities/DeleteCityOptionsModal.tsx` | 4 |
| `src/components/admin/cities/StrategicMapTab.tsx` | 4 |
| `src/components/admin/cityEditor/services/ServiceGeneric.tsx` | 4 |
| `src/components/admin/common/AdminMultiSelect.tsx` | 4 |
| `src/components/admin/design/DesignSystemSettings.tsx` | 4 |
| `src/components/admin/import/ImportDashboard.tsx` | 4 |
| `src/components/admin/import/ImportOsmModal.tsx` | 4 |
| `src/components/admin/LoadingTipsManager.tsx` | 4 |
| `src/components/admin/marketing/AdminCreditPackages.tsx` | 4 |
| `src/components/admin/marketing/CampaignsPanel.tsx` | 4 |
| `src/components/admin/marketing/PromoManagerModal.tsx` | 4 |
| `src/components/admin/observatory/ObservatoryLayout.tsx` | 4 |
| `src/components/admin/views/UserManagementView.tsx` | 4 |
| `src/components/city/gallery/GalleryLightbox.tsx` | 4 |
| `src/components/common/CustomCalendar.tsx` | 4 |
| `src/components/features/diary/packing_list/suitcase/tabs/TemplateLibraryTab.tsx` | 4 |
| `src/components/itineraries/ItineraryReviews.tsx` | 4 |
| `src/components/modals/cityInfo/CityEventsTab.tsx` | 4 |
| `src/components/modals/cityInfo/CityTourOperatorsTab.tsx` | 4 |
| `src/components/modals/sectionPreview/PreviewHero.tsx` | 4 |
| `src/components/rankings/RankingFilters.tsx` | 4 |
| `src/components/user/dashboard/UserWalletTab.tsx` | 4 |
| `src/components/admin/AdminAiAssistant.tsx` | 3 |
| `src/components/admin/cities/CityAuditModal.tsx` | 3 |
| `src/components/admin/cities/ProcessLogModal.tsx` | 3 |
| `src/components/admin/cityEditor/services/EditorInfo.tsx` | 3 |
| `src/components/admin/PhotoModeration.tsx` | 3 |
| `src/components/admin/photos/PhotoFilters.tsx` | 3 |
| `src/components/admin/poiManager/BulkFixProgressModal.tsx` | 3 |
| `src/components/admin/social/AiBackgroundPanel.tsx` | 3 |
| `src/components/admin/SponsorDashboardOverview.tsx` | 3 |
| `src/components/admin/SuggestionManager.tsx` | 3 |
| `src/components/admin/userManager/UserTable.tsx` | 3 |
| `src/components/admin/userManager/UserToolbar.tsx` | 3 |
| `src/components/aiPlanner/AiPlannerTimeline.tsx` | 3 |
| `src/components/city/CityDetailContent.tsx` | 3 |
| `src/components/features/diary/packing_list/suitcase/NewCategoryPanel.tsx` | 3 |
| `src/components/modals/cityInfo/CityGuidesTab.tsx` | 3 |
| `src/components/modals/cityInfo/ServiceAiHunter.tsx` | 3 |
| `src/components/modals/LimitWarningModal.tsx` | 3 |
| `src/components/modals/ProvinceModal.tsx` | 3 |
| `src/components/shop/ShopHeader.tsx` | 3 |
| `src/components/shop/ShopHomeView.tsx` | 3 |
| `src/components/user/dashboard/UserMessagesTab.tsx` | 3 |
| `src/components/user/dashboard/UserNotificationsTab.tsx` | 3 |
| `src/components/user/dashboard/UserSettingsTab.tsx` | 3 |
| `src/components/user/UserDashboard.tsx` | 3 |
| `src/components/admin/cities/CityGeneratorModal.tsx` | 2 |
| `src/components/admin/cityEditor/culture/CultureHistory.tsx` | 2 |
| `src/components/admin/cityEditor/culture/CulturePatron.tsx` | 2 |
| `src/components/admin/cityEditor/EditorRatings.tsx` | 2 |
| `src/components/admin/cityEditor/tabs/TabRatings.tsx` | 2 |
| `src/components/admin/import/components/ImportTable.tsx` | 2 |
| `src/components/admin/observatory/CityStatsGrid.tsx` | 2 |
| `src/components/admin/poiManager/RegenerateConfirmModal.tsx` | 2 |
| `src/components/admin/settings/ArrayRenderer.tsx` | 2 |
| `src/components/admin/settings/PartnerIntegrationsPanel.tsx` | 2 |
| `src/components/admin/sponsor/SponsorBulkActions.tsx` | 2 |
| `src/components/admin/userManager/DeleteUserModal.tsx` | 2 |
| `src/components/city/CityHistory.tsx` | 2 |
| `src/components/common/PaginationControls.tsx` | 2 |
| `src/components/features/diary/DiaryMemoCard.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/AffiliateSuggestionBox.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsPanel.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsReviewStep.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsSetupStep.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/CategoryIconPicker.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseItemRow.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/tabs/AiCatalogTab.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/tabs/StandardItemsTab.tsx` | 2 |
| `src/components/home/CuratedGridSection.tsx` | 2 |
| `src/components/layout/OnboardingWizard.tsx` | 2 |
| `src/components/modals/cityInfo/ServiceSidebar.tsx` | 2 |
| `src/components/modals/CultureCornerModal.tsx` | 2 |
| `src/components/modals/GpsErrorModal.tsx` | 2 |
| `src/components/modals/LevelUpModal.tsx` | 2 |
| `src/components/modals/sectionPreview/PreviewGallery.tsx` | 2 |
| `src/components/shop/ShopCard.tsx` | 2 |
| `src/components/shop/ShopReviews.tsx` | 2 |
| `src/components/user/dashboard/UserSuitcasesTab.tsx` | 2 |
| `src/components/user/referral/SocialCardGenerator.tsx` | 2 |
| `src/components/admin/AdminPoiManager.tsx` | 1 |
| `src/components/admin/AdminRoleManager.tsx` | 1 |
| `src/components/admin/affiliations/AffiliateAnalyticsTab.tsx` | 1 |
| `src/components/admin/AiFieldHelper.tsx` | 1 |
| `src/components/admin/cities/CompleteCityModal.tsx` | 1 |
| `src/components/admin/cityEditor/FormFieldHelper.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabCulture.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabServices.tsx` | 1 |
| `src/components/admin/common/AdminGuideModal.tsx` | 1 |
| `src/components/admin/design/ComponentPreviewHost.tsx` | 1 |
| `src/components/admin/design/SafeArtPanel.tsx` | 1 |
| `src/components/admin/import/components/ImportFilterBar.tsx` | 1 |
| `src/components/admin/import/components/ImportReportModal.tsx` | 1 |
| `src/components/admin/ItineraryManager.tsx` | 1 |
| `src/components/admin/layout/AdminMobileHeader.tsx` | 1 |
| `src/components/admin/marketing/AiLimitsPanel.tsx` | 1 |
| `src/components/admin/marketing/PricingHistoryPanel.tsx` | 1 |
| `src/components/admin/poiModal/PoiLinksTab.tsx` | 1 |
| `src/components/admin/poiModal/PoiLogisticsTab.tsx` | 1 |
| `src/components/admin/settings/GlobalSettingsPanel.tsx` | 1 |
| `src/components/admin/settings/inputs/BooleanToggle.tsx` | 1 |
| `src/components/admin/settings/SettingsPage.tsx` | 1 |
| `src/components/admin/social/SocialPreviewConfig.tsx` | 1 |
| `src/components/admin/sponsor/SponsorModals.tsx` | 1 |
| `src/components/admin/SponsorFilters.tsx` | 1 |
| `src/components/admin/SponsorManager.tsx` | 1 |
| `src/components/admin/userManager/RlsFixModal.tsx` | 1 |
| `src/components/aiPlanner/AiLoadingScreen.tsx` | 1 |
| `src/components/city/components/CompassExploreButton.tsx` | 1 |
| `src/components/city/gallery/GallerySuccessModal.tsx` | 1 |
| `src/components/city/gallery/GalleryUploadModal.tsx` | 1 |
| `src/components/features/checkout/CheckoutSuccessPage.tsx` | 1 |
| `src/components/features/diary/DiaryDay.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseDashboard.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/tabs/GlobalSuggestionsTab.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/tabs/override/CategoryAccordion.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/tabs/override/TemplateSelector.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/tabs/TemplateSpecificItemsTab.tsx` | 1 |
| `src/components/home/hero/components/SearchBar.tsx` | 1 |
| `src/components/home/hero/HeroAiModule.tsx` | 1 |
| `src/components/home/HomeContent.tsx` | 1 |
| `src/components/itineraries/ItinerariesList.tsx` | 1 |
| `src/components/layout/HeaderCreditsIndicator.tsx` | 1 |
| `src/components/layout/modals/AdminModals.tsx` | 1 |
| `src/components/layout/modals/CoreModals.tsx` | 1 |
| `src/components/layout/Sidebar.tsx` | 1 |
| `src/components/modals/CityInfoModal.tsx` | 1 |
| `src/components/modals/GlobalSectionView.tsx` | 1 |
| `src/components/modals/GpsAlertModal.tsx` | 1 |
| `src/components/modals/HistoryModal.tsx` | 1 |
| `src/components/modals/sponsor/SponsorSuccess.tsx` | 1 |
| `src/components/rankings/PhotoGrid.tsx` | 1 |
| `src/components/shop/ProductDetailOverlay.tsx` | 1 |
| `src/components/shop/ShopBioOverlay.tsx` | 1 |
| `src/components/shop/ShopHero.tsx` | 1 |
| `src/components/user/dashboard/UserOverviewTab.tsx` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

Occorrenze totali: **852** (sopra soglia elenco riga-per-riga). Inventario sintetico per file:

| File | Occorrenze | Decisione baseline per-file |
|---|---:|---|
| `src/components/admin/AdminHeaderManager.tsx` | 23 | da correggere (23× Livello A/B) |
| `src/components/admin/communications/CommsTemplates.tsx` | 21 | da correggere (21× Livello A/B) |
| `src/components/admin/poiManager/PoiToolbar.tsx` | 19 | da correggere (19× Livello A/B) |
| `src/components/admin/cityEditor/culture/CulturePeople.tsx` | 18 | da correggere (18× Livello A/B) |
| `src/components/admin/AdminGamification.tsx` | 14 | da correggere (14× Livello A/B) |
| `src/components/admin/cities/ZoneCard.tsx` | 14 | da correggere (14× Livello A/B) |
| `src/components/admin/cities/CitiesListTab.tsx` | 13 | da correggere (13× Livello A/B) |
| `src/components/city/CityHeader.tsx` | 13 | da correggere (13× Livello A/B) |
| `src/components/user/dashboard/UserSidebar.tsx` | 13 | da correggere (13× Livello A/B) |
| `src/components/admin/AdminPhotoInspector.tsx` | 12 | da correggere (12× Livello A/B) |
| `src/components/admin/observatory/ObservatoryFilterDrawer.tsx` | 12 | da correggere (12× Livello A/B) |
| `src/components/features/diary/ItineraryItemCard.tsx` | 12 | da correggere (12× Livello A/B) |
| `src/components/layout/Header.tsx` | 12 | da correggere (12× Livello A/B) |
| `src/components/admin/AdminItineraryEditor.tsx` | 10 | da correggere (10× Livello A/B) |
| `src/components/admin/sponsor/SponsorTable.tsx` | 10 | da correggere (10× Livello A/B) |
| `src/components/admin/AdminPoiModal.tsx` | 9 | da correggere (9× Livello A/B) |
| `src/components/admin/AiLimitsControlCenter.tsx` | 9 | da correggere (9× Livello A/B) |
| `src/components/admin/NewsTickerManager.tsx` | 9 | da correggere (9× Livello A/B) |
| `src/components/admin/onboarding/OnboardingVisualEditor.tsx` | 9 | da correggere (9× Livello A/B) |
| `src/components/admin/poiManager/PoiList.tsx` | 9 | da correggere (9× Livello A/B) |
| `src/components/admin/AdminCityEditor.tsx` | 8 | da correggere (8× Livello A/B) |
| `src/components/admin/AdminSocialStudio.tsx` | 8 | da correggere (8× Livello A/B) |
| `src/components/admin/AdminTaxonomyManager.tsx` | 8 | da correggere (8× Livello A/B) |
| `src/components/admin/cityEditor/EditorGeneral.tsx` | 8 | da correggere (8× Livello A/B) |
| `src/components/admin/photos/PhotoRow.tsx` | 8 | da correggere (8× Livello A/B) |
| `src/components/city/tabs/CityCategoryTab.tsx` | 8 | da correggere (8× Livello A/B) |
| `src/components/itineraries/ItinerariesExplorer.tsx` | 8 | da correggere (8× Livello A/B) |
| `src/components/itineraries/ItineraryDetail.tsx` | 8 | da correggere (8× Livello A/B) |
| `src/components/admin/cityEditor/EditorMedia.tsx` | 7 | da correggere (7× Livello A/B) |
| `src/components/admin/cityEditor/tabs/TabGeneral.tsx` | 7 | da correggere (7× Livello A/B) |
| `src/components/admin/cityEditor/tabs/TabMedia.tsx` | 7 | da correggere (7× Livello A/B) |
| `src/components/admin/import/components/ImportActionToolbar.tsx` | 7 | da correggere (7× Livello A/B) |
| `src/components/admin/sponsor/SponsorToolbar.tsx` | 7 | da correggere (7× Livello A/B) |
| `src/components/aiPlanner/AiPlannerForm.tsx` | 7 | da correggere (7× Livello A/B) |
| `src/components/modals/AiItineraryModal.tsx` | 7 | da correggere (7× Livello A/B) |
| `src/components/modals/PoiClaimModal.tsx` | 7 | da correggere (7× Livello A/B) |
| `src/components/modals/poiDetail/PoiInfoSection.tsx` | 7 | da correggere (7× Livello A/B) |
| `src/components/admin/AdminImageInput.tsx` | 6 | da correggere (6× Livello A/B) |
| `src/components/admin/cities/RegionalAnalysisModal.tsx` | 6 | da correggere (6× Livello A/B) |
| `src/components/admin/cityEditor/services/ServiceEvents.tsx` | 6 | da correggere (6× Livello A/B) |
| `src/components/admin/cityEditor/services/ServiceGuides.tsx` | 6 | da correggere (6× Livello A/B) |
| `src/components/admin/cityEditor/services/ServiceOperators.tsx` | 6 | da correggere (6× Livello A/B) |
| `src/components/admin/economics/PricingManager.tsx` | 6 | da correggere (6× Livello A/B) |
| `src/components/admin/GlobalEventsManager.tsx` | 6 | da correggere (6× Livello A/B) |
| `src/components/admin/observatory/AnomalyInspector.tsx` | 6 | da correggere (6× Livello A/B) |
| `src/components/features/diary/header/DiaryHeaderProjectInput.tsx` | 6 | da correggere (6× Livello A/B) |
| `src/components/features/diary/packing_list/suitcase/CategorySection.tsx` | 6 | da correggere (6× Livello A/B) |
| `src/components/layout/MobileNavBar.tsx` | 6 | da correggere (6× Livello A/B) |
| `src/components/modals/AddToItineraryModal.tsx` | 6 | da correggere (6× Livello A/B) |
| `src/components/modals/cityInfo/ServicesCategoryList.tsx` | 6 | da correggere (6× Livello A/B) |
| `src/components/modals/poiDetail/PoiImageSection.tsx` | 6 | da correggere (6× Livello A/B) |
| `src/components/modals/SectionPreviewModal.tsx` | 6 | da correggere (6× Livello A/B) |
| `src/components/modals/SuggestionReviewModal.tsx` | 6 | da correggere (6× Livello A/B) |
| `src/components/user/BusinessShopManager.tsx` | 6 | da correggere (6× Livello A/B) |
| `src/components/admin/AdminCommunications.tsx` | 5 | da correggere (5× Livello A/B) |
| `src/components/admin/AdminStatsDashboard.tsx` | 5 | da correggere (5× Livello A/B) |
| `src/components/admin/CitiesManager.tsx` | 5 | da correggere (5× Livello A/B) |
| `src/components/admin/layout/AdminSidebar.tsx` | 5 | da correggere (5× Livello A/B) |
| `src/components/admin/observatory/DuplicateResolver.tsx` | 5 | da correggere (5× Livello A/B) |
| `src/components/admin/PartnerDetailModal.tsx` | 5 | da correggere (5× Livello A/B) |
| `src/components/admin/poiModal/PoiInfoTab.tsx` | 5 | da correggere (5× Livello A/B) |
| `src/components/city/components/NearbyCitiesRow.tsx` | 5 | da correggere (5× Livello A/B) |
| `src/components/city/gallery/GalleryGrid.tsx` | 5 | da correggere (5× Livello A/B) |
| `src/components/city/tabs/CityShowcaseTab.tsx` | 5 | da correggere (5× Livello A/B) |
| `src/components/common/SmartFilterDrawer.tsx` | 5 | da correggere (5× Livello A/B) |
| `src/components/community/QaForumTab.tsx` | 5 | da correggere (5× Livello A/B) |
| `src/components/features/diary/DiaryTimeline.tsx` | 5 | da correggere (5× Livello A/B) |
| `src/components/modals/AroundMeWizard.tsx` | 5 | da correggere (5× Livello A/B) |
| `src/components/modals/PoiDetailModal.tsx` | 5 | da correggere (5× Livello A/B) |
| `src/components/admin/cities/DeleteCityOptionsModal.tsx` | 4 | da correggere (4× Livello A/B) |
| `src/components/admin/cities/StrategicMapTab.tsx` | 4 | da correggere (4× Livello A/B) |
| `src/components/admin/cityEditor/services/ServiceGeneric.tsx` | 4 | da correggere (4× Livello A/B) |
| `src/components/admin/common/AdminMultiSelect.tsx` | 4 | da correggere (4× Livello A/B) |
| `src/components/admin/design/DesignSystemSettings.tsx` | 4 | da correggere (4× Livello A/B) |
| `src/components/admin/import/ImportDashboard.tsx` | 4 | da correggere (4× Livello A/B) |
| `src/components/admin/import/ImportOsmModal.tsx` | 4 | da correggere (4× Livello A/B) |
| `src/components/admin/LoadingTipsManager.tsx` | 4 | da correggere (4× Livello A/B) |
| `src/components/admin/marketing/AdminCreditPackages.tsx` | 4 | da correggere (4× Livello A/B) |
| `src/components/admin/marketing/CampaignsPanel.tsx` | 4 | da correggere (4× Livello A/B) |
| `src/components/admin/marketing/PromoManagerModal.tsx` | 4 | da correggere (4× Livello A/B) |
| `src/components/admin/observatory/ObservatoryLayout.tsx` | 4 | da correggere (4× Livello A/B) |
| `src/components/admin/views/UserManagementView.tsx` | 4 | da correggere (4× Livello A/B) |
| `src/components/city/gallery/GalleryLightbox.tsx` | 4 | da correggere (4× Livello A/B) |
| `src/components/common/CustomCalendar.tsx` | 4 | da correggere (4× Livello A/B) |
| `src/components/features/diary/packing_list/suitcase/tabs/TemplateLibraryTab.tsx` | 4 | da correggere (4× Livello A/B) |
| `src/components/itineraries/ItineraryReviews.tsx` | 4 | da correggere (4× Livello A/B) |
| `src/components/modals/cityInfo/CityEventsTab.tsx` | 4 | da correggere (4× Livello A/B) |
| `src/components/modals/cityInfo/CityTourOperatorsTab.tsx` | 4 | da correggere (4× Livello A/B) |
| `src/components/modals/sectionPreview/PreviewHero.tsx` | 4 | da correggere (4× Livello A/B) |
| `src/components/rankings/RankingFilters.tsx` | 4 | da correggere (4× Livello A/B) |
| `src/components/user/dashboard/UserWalletTab.tsx` | 4 | da correggere (4× Livello A/B) |
| `src/components/admin/AdminAiAssistant.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/admin/cities/CityAuditModal.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/admin/cities/ProcessLogModal.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/admin/cityEditor/services/EditorInfo.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/admin/PhotoModeration.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/admin/photos/PhotoFilters.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/admin/poiManager/BulkFixProgressModal.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/admin/social/AiBackgroundPanel.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/admin/SponsorDashboardOverview.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/admin/SuggestionManager.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/admin/userManager/UserTable.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/admin/userManager/UserToolbar.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/aiPlanner/AiPlannerTimeline.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/city/CityDetailContent.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/features/diary/packing_list/suitcase/NewCategoryPanel.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/modals/cityInfo/CityGuidesTab.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/modals/cityInfo/ServiceAiHunter.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/modals/LimitWarningModal.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/modals/ProvinceModal.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/shop/ShopHeader.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/shop/ShopHomeView.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/user/dashboard/UserMessagesTab.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/user/dashboard/UserNotificationsTab.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/user/dashboard/UserSettingsTab.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/user/UserDashboard.tsx` | 3 | da correggere (3× Livello A/B) |
| `src/components/admin/cities/CityGeneratorModal.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/cityEditor/culture/CultureHistory.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/cityEditor/culture/CulturePatron.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/cityEditor/EditorRatings.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/cityEditor/tabs/TabRatings.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/import/components/ImportTable.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/observatory/CityStatsGrid.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/poiManager/RegenerateConfirmModal.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/settings/ArrayRenderer.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/settings/PartnerIntegrationsPanel.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/sponsor/SponsorBulkActions.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/userManager/DeleteUserModal.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/city/CityHistory.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/common/PaginationControls.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/features/diary/DiaryMemoCard.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/features/diary/packing_list/suitcase/AffiliateSuggestionBox.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsPanel.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsReviewStep.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsSetupStep.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/features/diary/packing_list/suitcase/CategoryIconPicker.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseItemRow.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/features/diary/packing_list/suitcase/tabs/AiCatalogTab.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/features/diary/packing_list/suitcase/tabs/StandardItemsTab.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/home/CuratedGridSection.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/layout/OnboardingWizard.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/modals/cityInfo/ServiceSidebar.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/modals/CultureCornerModal.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/modals/GpsErrorModal.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/modals/LevelUpModal.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/modals/sectionPreview/PreviewGallery.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/shop/ShopCard.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/shop/ShopReviews.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/user/dashboard/UserSuitcasesTab.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/user/referral/SocialCardGenerator.tsx` | 2 | da correggere (2× Livello A/B) |
| `src/components/admin/AdminPoiManager.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/AdminRoleManager.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/affiliations/AffiliateAnalyticsTab.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/AiFieldHelper.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/cities/CompleteCityModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/cityEditor/FormFieldHelper.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/cityEditor/tabs/TabCulture.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/cityEditor/tabs/TabServices.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/common/AdminGuideModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/design/ComponentPreviewHost.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/design/SafeArtPanel.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/import/components/ImportFilterBar.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/import/components/ImportReportModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/ItineraryManager.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/layout/AdminMobileHeader.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/marketing/AiLimitsPanel.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/marketing/PricingHistoryPanel.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/poiModal/PoiLinksTab.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/poiModal/PoiLogisticsTab.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/settings/GlobalSettingsPanel.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/settings/inputs/BooleanToggle.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/settings/SettingsPage.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/social/SocialPreviewConfig.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/sponsor/SponsorModals.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/SponsorFilters.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/SponsorManager.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/admin/userManager/RlsFixModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/aiPlanner/AiLoadingScreen.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/city/components/CompassExploreButton.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/city/gallery/GallerySuccessModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/city/gallery/GalleryUploadModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/features/checkout/CheckoutSuccessPage.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/features/diary/DiaryDay.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseDashboard.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/features/diary/packing_list/suitcase/tabs/GlobalSuggestionsTab.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/features/diary/packing_list/suitcase/tabs/override/CategoryAccordion.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/features/diary/packing_list/suitcase/tabs/override/TemplateSelector.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/features/diary/packing_list/suitcase/tabs/TemplateSpecificItemsTab.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/home/hero/components/SearchBar.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/home/hero/HeroAiModule.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/home/HomeContent.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/itineraries/ItinerariesList.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/layout/HeaderCreditsIndicator.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/layout/modals/AdminModals.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/layout/modals/CoreModals.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/layout/Sidebar.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/CityInfoModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/GlobalSectionView.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/GpsAlertModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/HistoryModal.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/modals/sponsor/SponsorSuccess.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/rankings/PhotoGrid.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/shop/ProductDetailOverlay.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/shop/ShopBioOverlay.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/shop/ShopHero.tsx` | 1 | da correggere (1× Livello A/B) |
| `src/components/user/dashboard/UserOverviewTab.tsx` | 1 | da correggere (1× Livello A/B) |

Nota: il dettaglio riga e riproducibile in qualsiasi momento con `npx biome check --reporter=json` filtrato sulla categoria.

