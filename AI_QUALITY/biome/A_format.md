# format

> Dettaglio baseline Biome full-project. Dashboard: [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md)

| Campo | Valore |
|----|----|
| **Documento** | `AI_QUALITY/biome/A_format.md` |
| **Categorie** | `format` |
| **Occorrenze (somma gruppo)** | **964** |
| **File unici nel gruppo** | **964** |
| **Livello** | **A** |
| **Ultimo aggiornamento** | 2026-08-03 |
| **Stato** | Baseline ufficiale — nessuna correzione applicata in questa attivita |

## `format`

### Descrizione della regola

Il file non rispetta la formattazione definita da biome.json / formatter Biome.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `format` |
| **Occorrenze totali** | **964** |
| **Error** | 964 |
| **Warning** | 0 |
| **Info** | 0 |
| **File coinvolti** | **964** |
| **Livello di rischio** | **A** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Formattazione Biome puramente meccanica; zero semantica.

### Strategia di correzione

`npx biome check --write` (solo format) o format per file.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `package.json` | 1 |
| `scripts/_bundle_audit_report.mjs` | 1 |
| `scripts/_bundle_import_trace.mjs` | 1 |
| `scripts/build-packing-domain-catalog.ts` | 1 |
| `scripts/check-layers.ts` | 1 |
| `scripts/checkMissingReactHooks.ts` | 1 |
| `scripts/generate-foundation-migration.ts` | 1 |
| `scripts/generate-foundation-review-docs.ts` | 1 |
| `scripts/generate-myworld-migration.ts` | 1 |
| `scripts/generate-packing-catalog-migrations.ts` | 1 |
| `scripts/generate-packing-seed.ts` | 1 |
| `scripts/migrate_regions.js` | 1 |
| `scripts/packing-domain-catalog-data.json` | 1 |
| `scripts/patch_supabase_types.cjs` | 1 |
| `scripts/patch_supabase_types.js` | 1 |
| `scripts/qa-macrofase-c.ts` | 1 |
| `scripts/run-dev-tunnel-hmr.mjs` | 1 |
| `scripts/seed_geo.js` | 1 |
| `scripts/smoke-collaboration-step4.ts` | 1 |
| `scripts/smoke-feature-flag-resolution.ts` | 1 |
| `scripts/smoke-mp02-step2.ts` | 1 |
| `scripts/smoke-mp02-step3.ts` | 1 |
| `scripts/smoke-myspace-viaggio-catalog.ts` | 1 |
| `scripts/smoke-viaggio-domain.ts` | 1 |
| `scripts/smoke-viaggio-step3.ts` | 1 |
| `scripts/smoke-viaggio-step5.ts` | 1 |
| `server/index.ts` | 1 |
| `server/middleware/cors.ts` | 1 |
| `server/routes/admin.routes.ts` | 1 |
| `server/routes/auth.routes.ts` | 1 |
| `server/routes/bootstrap.routes.ts` | 1 |
| `server/routes/city.routes.ts` | 1 |
| `server/routes/content.routes.ts` | 1 |
| `server/routes/health.routes.ts` | 1 |
| `server/routes/user.routes.ts` | 1 |
| `server/services/cityAdminService.ts` | 1 |
| `server/supabaseAdmin.ts` | 1 |
| `src/collaboration/guestGate.ts` | 1 |
| `src/collaboration/suitcaseResourceKind.ts` | 1 |
| `src/components/admin/AdminAiAssistant.tsx` | 1 |
| `src/components/admin/AdminCityEditor.tsx` | 1 |
| `src/components/admin/AdminCommunications.tsx` | 1 |
| `src/components/admin/AdminControlCenterAI.tsx` | 1 |
| `src/components/admin/AdminDashboard.tsx` | 1 |
| `src/components/admin/AdminGamification.tsx` | 1 |
| `src/components/admin/AdminHeaderManager.tsx` | 1 |
| `src/components/admin/AdminImageInput.tsx` | 1 |
| `src/components/admin/AdminItineraryEditor.tsx` | 1 |
| `src/components/admin/AdminPhotoInspector.tsx` | 1 |
| `src/components/admin/AdminPoiManager.tsx` | 1 |
| `src/components/admin/AdminPoiModal.tsx` | 1 |
| `src/components/admin/AdminRoleManager.tsx` | 1 |
| `src/components/admin/AdminSocialStudio.tsx` | 1 |
| `src/components/admin/AdminStatsDashboard.tsx` | 1 |
| `src/components/admin/AdminTaxonomyManager.tsx` | 1 |
| `src/components/admin/AdminUserManager.tsx` | 1 |
| `src/components/admin/affiliations/AffiliateAnalyticsTab.tsx` | 1 |
| `src/components/admin/affiliations/AffiliateOverviewCard.tsx` | 1 |
| `src/components/admin/AiEconomicsDashboard.tsx` | 1 |
| `src/components/admin/AiFieldHelper.tsx` | 1 |
| `src/components/admin/AiLimitsControlCenter.tsx` | 1 |
| `src/components/admin/cities/CitiesListTab.tsx` | 1 |
| `src/components/admin/cities/CityAuditModal.tsx` | 1 |
| `src/components/admin/cities/CityGeneratorModal.tsx` | 1 |
| `src/components/admin/cities/CompleteCityModal.tsx` | 1 |
| `src/components/admin/cities/DeleteCityOptionsModal.tsx` | 1 |
| `src/components/admin/cities/GeoCascadingFilters.tsx` | 1 |
| `src/components/admin/cities/ProcessLogModal.tsx` | 1 |
| `src/components/admin/cities/RegionalAnalysisModal.tsx` | 1 |
| `src/components/admin/cities/StrategicMapTab.tsx` | 1 |
| `src/components/admin/cities/ZoneCard.tsx` | 1 |
| `src/components/admin/CitiesManager.tsx` | 1 |
| `src/components/admin/cityEditor/culture/CultureHistory.tsx` | 1 |
| `src/components/admin/cityEditor/culture/CulturePatron.tsx` | 1 |
| `src/components/admin/cityEditor/culture/CulturePeople.tsx` | 1 |
| `src/components/admin/cityEditor/EditorGeneral.tsx` | 1 |
| `src/components/admin/cityEditor/EditorMedia.tsx` | 1 |
| `src/components/admin/cityEditor/EditorRatings.tsx` | 1 |
| `src/components/admin/cityEditor/FormFieldHelper.tsx` | 1 |
| `src/components/admin/cityEditor/services/EditorInfo.tsx` | 1 |
| `src/components/admin/cityEditor/services/ServiceEvents.tsx` | 1 |
| `src/components/admin/cityEditor/services/ServiceGeneric.tsx` | 1 |
| `src/components/admin/cityEditor/services/ServiceGuides.tsx` | 1 |
| `src/components/admin/cityEditor/services/ServiceOperators.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabCulture.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabGeneral.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabLogs.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabMedia.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabPois.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabRatings.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabServices.tsx` | 1 |
| `src/components/admin/common/AdminAiRuntimeBanner.tsx` | 1 |
| `src/components/admin/common/AdminGuideModal.tsx` | 1 |
| `src/components/admin/common/AdminMultiSelect.tsx` | 1 |
| `src/components/admin/common/AdminPageHeader.tsx` | 1 |
| `src/components/admin/common/AdminSectionCard.tsx` | 1 |
| `src/components/admin/communications/CommsHistory.tsx` | 1 |
| `src/components/admin/communications/CommsTemplates.tsx` | 1 |
| `src/components/admin/design/ComponentPreviewHost.tsx` | 1 |
| `src/components/admin/design/DesignSystemSettings.tsx` | 1 |
| `src/components/admin/design/editorTypes.ts` | 1 |
| `src/components/admin/design/foundation/FoundationPreviewComponents.tsx` | 1 |
| `src/components/admin/design/foundation/foundationPreviewMeta.ts` | 1 |
| `src/components/admin/design/PlaceholderGrid.tsx` | 1 |
| `src/components/admin/design/SafeArtPanel.tsx` | 1 |
| `src/components/admin/design/StyleEditor.tsx` | 1 |
| `src/components/admin/design/utilityCssValidation.ts` | 1 |
| `src/components/admin/economics/AdminAiAnalyticsV4.tsx` | 1 |
| `src/components/admin/economics/PricingManager.tsx` | 1 |
| `src/components/admin/economics/SustainabilityHelper.tsx` | 1 |
| `src/components/admin/foundation/FoundationSettingsPanel.tsx` | 1 |
| `src/components/admin/GlobalEventsManager.tsx` | 1 |
| `src/components/admin/import/components/ImportActionToolbar.tsx` | 1 |
| `src/components/admin/import/components/ImportFilterBar.tsx` | 1 |
| `src/components/admin/import/components/ImportReportModal.tsx` | 1 |
| `src/components/admin/import/components/ImportStatsBar.tsx` | 1 |
| `src/components/admin/import/components/ImportTable.tsx` | 1 |
| `src/components/admin/import/ImportDashboard.tsx` | 1 |
| `src/components/admin/import/ImportOsmModal.tsx` | 1 |
| `src/components/admin/ItineraryManager.tsx` | 1 |
| `src/components/admin/layout/AdminMobileHeader.tsx` | 1 |
| `src/components/admin/layout/AdminSidebar.tsx` | 1 |
| `src/components/admin/LoadingTipsManager.tsx` | 1 |
| `src/components/admin/marketing/AdminCreditPackages.tsx` | 1 |
| `src/components/admin/marketing/AiLimitsPanel.tsx` | 1 |
| `src/components/admin/marketing/CampaignsPanel.tsx` | 1 |
| `src/components/admin/marketing/PricingHistoryPanel.tsx` | 1 |
| `src/components/admin/marketing/PromoManagerModal.tsx` | 1 |
| `src/components/admin/myworld/MyWorldStyleSettingsPanel.tsx` | 1 |
| `src/components/admin/NewsTickerManager.tsx` | 1 |
| `src/components/admin/observatory/AnomalyInspector.tsx` | 1 |
| `src/components/admin/observatory/CityStatsGrid.tsx` | 1 |
| `src/components/admin/observatory/DuplicateResolver.tsx` | 1 |
| `src/components/admin/observatory/ObservatoryFilterDrawer.tsx` | 1 |
| `src/components/admin/observatory/ObservatoryLayout.tsx` | 1 |
| `src/components/admin/observatory/ObservatoryLegend.tsx` | 1 |
| `src/components/admin/observatory/ScheduleMatrix.tsx` | 1 |
| `src/components/admin/onboarding/OnboardingVisualEditor.tsx` | 1 |
| `src/components/admin/PartnerDetailModal.tsx` | 1 |
| `src/components/admin/PhotoModeration.tsx` | 1 |
| `src/components/admin/photos/PhotoFilters.tsx` | 1 |
| `src/components/admin/photos/PhotoMetadataModal.tsx` | 1 |
| `src/components/admin/photos/PhotoRow.tsx` | 1 |
| `src/components/admin/photos/PhotoTable.tsx` | 1 |
| `src/components/admin/platformControl/AuditHistoryPanel.tsx` | 1 |
| `src/components/admin/platformControl/FeatureFlagBooleanRow.tsx` | 1 |
| `src/components/admin/platformControl/FeatureFlagNumberRow.tsx` | 1 |
| `src/components/admin/platformControl/MaintenancePanel.tsx` | 1 |
| `src/components/admin/platformControl/MessageTemplateEditor.tsx` | 1 |
| `src/components/admin/platformControl/PlatformControlCenter.tsx` | 1 |
| `src/components/admin/platformControl/PlatformControlSection.tsx` | 1 |
| `src/components/admin/platformControl/PlatformControlTabBanner.tsx` | 1 |
| `src/components/admin/platformControl/SchedulePanel.tsx` | 1 |
| `src/components/admin/poiManager/BulkFixProgressModal.tsx` | 1 |
| `src/components/admin/poiManager/PoiList.tsx` | 1 |
| `src/components/admin/poiManager/PoiToolbar.tsx` | 1 |
| `src/components/admin/poiManager/RegenerateConfirmModal.tsx` | 1 |
| `src/components/admin/poiModal/PoiInfoTab.tsx` | 1 |
| `src/components/admin/poiModal/PoiLinksTab.tsx` | 1 |
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
| `src/components/admin/social/SocialCanvas.tsx` | 1 |
| `src/components/admin/social/SocialPreviewConfig.tsx` | 1 |
| `src/components/admin/sponsor/SponsorBulkActions.tsx` | 1 |
| `src/components/admin/sponsor/SponsorModals.tsx` | 1 |
| `src/components/admin/sponsor/SponsorTable.tsx` | 1 |
| `src/components/admin/sponsor/SponsorToolbar.tsx` | 1 |
| `src/components/admin/SponsorDashboardOverview.tsx` | 1 |
| `src/components/admin/SponsorFilters.tsx` | 1 |
| `src/components/admin/SponsorManager.tsx` | 1 |
| `src/components/admin/SuggestionManager.tsx` | 1 |
| `src/components/admin/userManager/AiLimitsTab.tsx` | 1 |
| `src/components/admin/userManager/CreateUserModal.tsx` | 1 |
| `src/components/admin/userManager/DeleteUserModal.tsx` | 1 |
| `src/components/admin/userManager/RlsFixModal.tsx` | 1 |
| `src/components/admin/userManager/UserSubscriptionsTab.tsx` | 1 |
| `src/components/admin/userManager/UserTable.tsx` | 1 |
| `src/components/admin/userManager/UserToolbar.tsx` | 1 |
| `src/components/admin/views/UserManagementView.tsx` | 1 |
| `src/components/ai/AiRuntimeBanner.tsx` | 1 |
| `src/components/aiPlanner/AiLoadingScreen.tsx` | 1 |
| `src/components/aiPlanner/AiPlannerForm.tsx` | 1 |
| `src/components/aiPlanner/AiPlannerTimeline.tsx` | 1 |
| `src/components/city/CityCard.tsx` | 1 |
| `src/components/city/CityDetailContent.tsx` | 1 |
| `src/components/city/CityHeader.tsx` | 1 |
| `src/components/city/CityHistory.tsx` | 1 |
| `src/components/city/components/CompassExploreButton.tsx` | 1 |
| `src/components/city/components/NearbyCitiesRow.tsx` | 1 |
| `src/components/city/gallery/GalleryGrid.tsx` | 1 |
| `src/components/city/gallery/GalleryLightbox.tsx` | 1 |
| `src/components/city/gallery/GallerySuccessModal.tsx` | 1 |
| `src/components/city/gallery/GalleryUploadModal.tsx` | 1 |
| `src/components/city/ShowcaseCards.tsx` | 1 |
| `src/components/city/tabs/CategorySponsorColumn.tsx` | 1 |
| `src/components/city/tabs/CityCategoryTab.tsx` | 1 |
| `src/components/city/tabs/CityGallery.tsx` | 1 |
| `src/components/city/tabs/CityShowcaseTab.tsx` | 1 |
| `src/components/city/WeatherWidget.tsx` | 1 |
| `src/components/collaboration/CollaborationManagementView.tsx` | 1 |
| `src/components/collaboration/collaborationShareDraft.ts` | 1 |
| `src/components/collaboration/CollaborationShareModal.tsx` | 1 |
| `src/components/collaboration/collaborationSharePipeline.ts` | 1 |
| `src/components/collaboration/collaborationSharePresentation.ts` | 1 |
| `src/components/collaboration/CollaborationShareWizard.tsx` | 1 |
| `src/components/collaboration/CollaborationUserInviteSearch.tsx` | 1 |
| `src/components/collaboration/CollaborationWizardFooter.tsx` | 1 |
| `src/components/collaboration/compositionSelectableRow.tsx` | 1 |
| `src/components/collaboration/live/CollaborationActivityFeed.tsx` | 1 |
| `src/components/collaboration/live/CollaborationLiveBar.tsx` | 1 |
| `src/components/collaboration/OptionCard.tsx` | 1 |
| `src/components/collaboration/SharedResourceIndicator.tsx` | 1 |
| `src/components/collaboration/useCollaborationInviteSearch.ts` | 1 |
| `src/components/collaboration/useCollaborationShareBootstrap.ts` | 1 |
| `src/components/collaboration/useCollaborationShareCompositionHandlers.ts` | 1 |
| `src/components/collaboration/useCollaborationShareResourceHandlers.ts` | 1 |
| `src/components/collaboration/useCollaborationShareWizardActions.ts` | 1 |
| `src/components/collaboration/useCollaborationWizardNavigation.ts` | 1 |
| `src/components/collaboration/workspace/WorkspaceInvitesSection.tsx` | 1 |
| `src/components/collaboration/workspace/WorkspaceMembersSection.tsx` | 1 |
| `src/components/collaboration/workspace/WorkspaceResourcePermissionSelect.tsx` | 1 |
| `src/components/collaboration/workspace/WorkspaceResourcesSection.tsx` | 1 |
| `src/components/collaboration/WorkspaceInviteStep.tsx` | 1 |
| `src/components/collaboration/WorkspacePickElementStep.tsx` | 1 |
| `src/components/collaboration/WorkspaceShareWizardSteps.tsx` | 1 |
| `src/components/common/AdPlaceholder.tsx` | 1 |
| `src/components/common/AnchoredPopover.tsx` | 1 |
| `src/components/common/BrandLogo.tsx` | 1 |
| `src/components/common/CitySelector.tsx` | 1 |
| `src/components/common/CustomCalendar.tsx` | 1 |
| `src/components/common/DeleteConfirmationModal.tsx` | 1 |
| `src/components/common/DraggableSlider.tsx` | 1 |
| `src/components/common/GlobalAlert.tsx` | 1 |
| `src/components/common/HorizontalScrollStrip.tsx` | 1 |
| `src/components/common/ImageWithFallback.tsx` | 1 |
| `src/components/common/MascotSvg.tsx` | 1 |
| `src/components/common/ModalLoading.tsx` | 1 |
| `src/components/common/PaginationControls.tsx` | 1 |
| `src/components/common/SmartFilterDrawer.tsx` | 1 |
| `src/components/common/StarRating.tsx` | 1 |
| `src/components/common/SwipeToDelete.tsx` | 1 |
| `src/components/community/liveFeed/LiveFeedCarousel.tsx` | 1 |
| `src/components/community/liveFeed/LiveFeedHero.tsx` | 1 |
| `src/components/community/liveFeed/LiveFeedToolbar.tsx` | 1 |
| `src/components/community/LiveFeedTab.tsx` | 1 |
| `src/components/community/QaForumTab.tsx` | 1 |
| `src/components/community/RankingTab.tsx` | 1 |
| `src/components/community/UserPhotoEditor.tsx` | 1 |
| `src/components/export/ExportLogo.tsx` | 1 |
| `src/components/features/checkout/CheckoutSuccessPage.tsx` | 1 |
| `src/components/features/diary/cityName.ts` | 1 |
| `src/components/features/diary/DiaryDay.tsx` | 1 |
| `src/components/features/diary/DiaryEmptyState.tsx` | 1 |
| `src/components/features/diary/DiaryHeader.tsx` | 1 |
| `src/components/features/diary/DiaryMemoCard.tsx` | 1 |
| `src/components/features/diary/DiaryModals.tsx` | 1 |
| `src/components/features/diary/DiaryTimeline.tsx` | 1 |
| `src/components/features/diary/header/DiaryHeaderDateRange.tsx` | 1 |
| `src/components/features/diary/header/DiaryHeaderInvalidDateModal.tsx` | 1 |
| `src/components/features/diary/header/DiaryHeaderProjectInput.tsx` | 1 |
| `src/components/features/diary/header/diaryHeaderTabs.css` | 1 |
| `src/components/features/diary/header/DiaryHeaderTabs.tsx` | 1 |
| `src/components/features/diary/header/DiaryHeaderToolbar.tsx` | 1 |
| `src/components/features/diary/header/DiaryHeaderUndoRedo.tsx` | 1 |
| `src/components/features/diary/ItineraryItemCard.tsx` | 1 |
| `src/components/features/diary/nationFlag.ts` | 1 |
| `src/components/features/diary/notes/DiaryNotesChecklistStatsBar.tsx` | 1 |
| `src/components/features/diary/notes/diaryNotesDocumentToPlainText.ts` | 1 |
| `src/components/features/diary/notes/diaryNotesEditor.css` | 1 |
| `src/components/features/diary/notes/DiaryNotesEditor.tsx` | 1 |
| `src/components/features/diary/notes/DiaryNotesLinkBubbleMenu.tsx` | 1 |
| `src/components/features/diary/notes/diaryNotesLinkUtils.ts` | 1 |
| `src/components/features/diary/notes/DiaryNotesPanel.tsx` | 1 |
| `src/components/features/diary/notes/DiaryNotesTabs.tsx` | 1 |
| `src/components/features/diary/notes/DiaryNotesToolbar.tsx` | 1 |
| `src/components/features/diary/notes/DiaryNoteTabMenu.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/AffiliateEditorialCenter.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/AffiliateSuggestionBox.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionReviewRow.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsModal.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsPanel.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsReviewStep.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsSetupStep.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/AssociationConfirmationModal.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/BlacklistModal.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/CategoryIconPicker.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/CategoryItemsGrid.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/CategoryMobileDialog.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/CategorySection.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/CategorySetupConfigurationModal.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/CategoryStatusFilter.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/CategorySuggestionPanel.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/CategoryToolbarNav.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/EditorialCenterTabs.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/HiddenCategoriesPanel.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/ItemDeleteConfirmationModal.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/LinkSuitcaseModal.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/NewCategoryPanel.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/OptionalCategoriesPanel.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/RecommendedSuitcaseModal.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SavedSuitcasesSection.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseCard.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseDashboard.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseDashboardGuideColumn.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/suitcaseDashboardPanelUi.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseEditorToolbar.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseEditorView.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseItemRow.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseOnboardingBox.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseSidePanel.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseStatusBox.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseToolbarGroup.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseToolbarProgressBox.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseUtils.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/tabs/AiCatalogTab.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/tabs/override/CategoryAccordion.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/tabs/override/PartnerLinksPanel.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/tabs/override/TemplateSelector.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/tabs/OverrideTab.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/tabs/StandardItemsTab.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/tabs/TemplateLibraryTab.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/tabs/TemplateSpecificItemsTab.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/TemplateRow.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/TemplateSelectorSection.tsx` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel.tsx` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/components/SuitcaseModals.tsx` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/components/SuitcaseToast.tsx` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelModals.ts` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelOptimisticUpdates.ts` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelShellLifecycle.ts` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelState.ts` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseActions.ts` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseAffiliate.ts` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseAssociationFlow.ts` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseEditorLogic.ts` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseHiddenCategories.ts` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseItemActions.ts` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseLifecycle.ts` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcasePanelClose.ts` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcasePanelComposition.ts` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcasePanelData.ts` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseSuggestions.ts` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseUndo.ts` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseUndoHandlers.ts` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/selectors/suitcaseSelectors.ts` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/types/sourceTab.ts` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/utils/duplicateCheck.ts` | 1 |
| `src/components/features/diary/PublishCommunityModal.tsx` | 1 |
| `src/components/features/diary/TravelDiary.tsx` | 1 |
| `src/components/gamification/RewardsFreezeNotice.tsx` | 1 |
| `src/components/home/CuratedGridSection.tsx` | 1 |
| `src/components/home/hero/components/FilterSelect.tsx` | 1 |
| `src/components/home/hero/components/HeroCollapsedBar.tsx` | 1 |
| `src/components/home/hero/components/HeroCompactInputShell.tsx` | 1 |
| `src/components/home/hero/components/HeroCompactTypingField.tsx` | 1 |
| `src/components/home/hero/components/HeroExpandableSection.tsx` | 1 |
| `src/components/home/hero/components/MultiFilterSelect.tsx` | 1 |
| `src/components/home/hero/components/SearchBar.tsx` | 1 |
| `src/components/home/hero/HeroAiModule.tsx` | 1 |
| `src/components/home/hero/heroCompactTokens.ts` | 1 |
| `src/components/home/hero/heroInspirationPhrases.ts` | 1 |
| `src/components/home/HeroSection.tsx` | 1 |
| `src/components/home/HomeContent.tsx` | 1 |
| `src/components/itineraries/ItinerariesExplorer.tsx` | 1 |
| `src/components/itineraries/ItinerariesList.tsx` | 1 |
| `src/components/itineraries/ItineraryDetail.tsx` | 1 |
| `src/components/itineraries/ItineraryReviews.tsx` | 1 |
| `src/components/layout/AppCoordinator.tsx` | 1 |
| `src/components/layout/AppRouter.tsx` | 1 |
| `src/components/layout/AppShell.tsx` | 1 |
| `src/components/layout/Header.tsx` | 1 |
| `src/components/layout/HeaderCreditsIndicator.tsx` | 1 |
| `src/components/layout/MainLayout.tsx` | 1 |
| `src/components/layout/MobileNavBar.tsx` | 1 |
| `src/components/layout/ModalManager.tsx` | 1 |
| `src/components/layout/ModalManagerTypes.ts` | 1 |
| `src/components/layout/modals/AdminModals.tsx` | 1 |
| `src/components/layout/modals/CoreModals.tsx` | 1 |
| `src/components/layout/modals/FeatureModals.tsx` | 1 |
| `src/components/layout/NarrativeCompass.tsx` | 1 |
| `src/components/layout/NewsTicker.tsx` | 1 |
| `src/components/layout/OnboardingWizard.tsx` | 1 |
| `src/components/layout/Sidebar.tsx` | 1 |
| `src/components/layout/StaticPage.tsx` | 1 |
| `src/components/modals/AddToItineraryModal.tsx` | 1 |
| `src/components/modals/AiItineraryModal.tsx` | 1 |
| `src/components/modals/AroundMeWizard.tsx` | 1 |
| `src/components/modals/BusinessCardModal.tsx` | 1 |
| `src/components/modals/cityInfo/CityEventsTab.tsx` | 1 |
| `src/components/modals/cityInfo/CityGuidesTab.tsx` | 1 |
| `src/components/modals/cityInfo/CityServicesTab.tsx` | 1 |
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
| `src/components/modals/ExportModal.tsx` | 1 |
| `src/components/modals/FullRankingsModal.tsx` | 1 |
| `src/components/modals/GeneralModals.tsx` | 1 |
| `src/components/modals/GlobalSectionView.tsx` | 1 |
| `src/components/modals/GpsAlertModal.tsx` | 1 |
| `src/components/modals/GpsErrorModal.tsx` | 1 |
| `src/components/modals/HistoryModal.tsx` | 1 |
| `src/components/modals/LevelUpModal.tsx` | 1 |
| `src/components/modals/LimitWarningModal.tsx` | 1 |
| `src/components/modals/MobileMoveModal.tsx` | 1 |
| `src/components/modals/PatronSaintModal.tsx` | 1 |
| `src/components/modals/PoiClaimModal.tsx` | 1 |
| `src/components/modals/poiDetail/PoiImageSection.tsx` | 1 |
| `src/components/modals/poiDetail/PoiInfoSection.tsx` | 1 |
| `src/components/modals/PoiDetailModal.tsx` | 1 |
| `src/components/modals/ProvinceModal.tsx` | 1 |
| `src/components/modals/QuotaExceededModal.tsx` | 1 |
| `src/components/modals/RemoveItemModal.tsx` | 1 |
| `src/components/modals/ReviewModal.tsx` | 1 |
| `src/components/modals/RoadbookModal.tsx` | 1 |
| `src/components/modals/SaveAsModal.tsx` | 1 |
| `src/components/modals/sectionPreview/PreviewGallery.tsx` | 1 |
| `src/components/modals/sectionPreview/PreviewHero.tsx` | 1 |
| `src/components/modals/sectionPreview/PreviewRatings.tsx` | 1 |
| `src/components/modals/sectionPreview/PreviewSidebar.tsx` | 1 |
| `src/components/modals/SectionPreviewModal.tsx` | 1 |
| `src/components/modals/SetUsernameModal.tsx` | 1 |
| `src/components/modals/ShareModal.tsx` | 1 |
| `src/components/modals/shell/BaseFullscreenModalShell.tsx` | 1 |
| `src/components/modals/sponsor/SponsorForm.tsx` | 1 |
| `src/components/modals/sponsor/SponsorPricingSelector.tsx` | 1 |
| `src/components/modals/sponsor/SponsorSuccess.tsx` | 1 |
| `src/components/modals/sponsor/SponsorTypeSelector.tsx` | 1 |
| `src/components/modals/SponsorModal.tsx` | 1 |
| `src/components/modals/SuggestionModal.tsx` | 1 |
| `src/components/modals/SuggestionReviewModal.tsx` | 1 |
| `src/components/modals/TimeConflictModal.tsx` | 1 |
| `src/components/modals/UnsavedChangesModal.tsx` | 1 |
| `src/components/modals/UserUpgradeModal.tsx` | 1 |
| `src/components/myspace/CreateDiaryModal.tsx` | 1 |
| `src/components/myspace/CreateSuitcaseModal.tsx` | 1 |
| `src/components/myspace/MySpaceCityThumbCollage.tsx` | 1 |
| `src/components/myspace/MySpaceExplorerRoot.tsx` | 1 |
| `src/components/myspace/MySpaceFavoritesRoot.tsx` | 1 |
| `src/components/myspace/MySpaceInvitesRoot.tsx` | 1 |
| `src/components/myspace/MySpaceMinimalShell.tsx` | 1 |
| `src/components/myspace/MySpaceRootNav.tsx` | 1 |
| `src/components/myspace/MySpaceToolsRoot.tsx` | 1 |
| `src/components/myspace/MySpaceTripsCatalog.tsx` | 1 |
| `src/components/myspace/MySpaceViaggioCoverPreview.tsx` | 1 |
| `src/components/myspace/MySpaceViaggioDeleteModal.tsx` | 1 |
| `src/components/myspace/RicordamiConfigModal.tsx` | 1 |
| `src/components/myspace/ViaggioAllegatiSection.tsx` | 1 |
| `src/components/myspace/ViaggioAssociationFields.tsx` | 1 |
| `src/components/myspace/ViaggioFolderShell.tsx` | 1 |
| `src/components/myspace/ViaggioMappaGoogleEmbed.tsx` | 1 |
| `src/components/myspace/ViaggioMappaSection.tsx` | 1 |
| `src/components/myspace/ViaggioRicordamiControl.tsx` | 1 |
| `src/components/myspace/ViaggioRicordiSection.tsx` | 1 |
| `src/components/myspace/ViaggioRoadbookSection.tsx` | 1 |
| `src/components/myworld/MyWorldBreadcrumb.tsx` | 1 |
| `src/components/myworld/MyWorldChooserPanel.tsx` | 1 |
| `src/components/pdf/PdfStyles.ts` | 1 |
| `src/components/pdf/RoadbookDocument.tsx` | 1 |
| `src/components/pdf/TravelDocument.tsx` | 1 |
| `src/components/photos/CommunityPhotoPublishModal.tsx` | 1 |
| `src/components/photos/CommunityPhotoWorkflow.tsx` | 1 |
| `src/components/photos/InAppCameraCapture.tsx` | 1 |
| `src/components/photos/PhotoAcquireDialog.tsx` | 1 |
| `src/components/platform/FeatureFlagPausedBanner.tsx` | 1 |
| `src/components/rankings/CityRow.tsx` | 1 |
| `src/components/rankings/PhotoGrid.tsx` | 1 |
| `src/components/rankings/PoiList.tsx` | 1 |
| `src/components/rankings/RankingFilters.tsx` | 1 |
| `src/components/save/DocumentSaveStatus.tsx` | 1 |
| `src/components/shop/BottegaSponsorCard.tsx` | 1 |
| `src/components/shop/ProductDetailOverlay.tsx` | 1 |
| `src/components/shop/ShopBioOverlay.tsx` | 1 |
| `src/components/shop/ShopCard.tsx` | 1 |
| `src/components/shop/ShopCategoryView.tsx` | 1 |
| `src/components/shop/ShopDetailView.tsx` | 1 |
| `src/components/shop/ShopHeader.tsx` | 1 |
| `src/components/shop/ShopHero.tsx` | 1 |
| `src/components/shop/ShopHomeView.tsx` | 1 |
| `src/components/shop/ShopInfo.tsx` | 1 |
| `src/components/shop/ShopPage.tsx` | 1 |
| `src/components/shop/ShopProducts.tsx` | 1 |
| `src/components/shop/ShopReviews.tsx` | 1 |
| `src/components/shop/ShopSponsorColumn.tsx` | 1 |
| `src/components/ui/controls/CloseButton.tsx` | 1 |
| `src/components/ui/header/HeaderPopover.tsx` | 1 |
| `src/components/user/BusinessShopManager.tsx` | 1 |
| `src/components/user/dashboard/UserFriendsTab.tsx` | 1 |
| `src/components/user/dashboard/UserMessagesTab.tsx` | 1 |
| `src/components/user/dashboard/UserNotificationsTab.tsx` | 1 |
| `src/components/user/dashboard/UserOverviewTab.tsx` | 1 |
| `src/components/user/dashboard/UserSettingsTab.tsx` | 1 |
| `src/components/user/dashboard/UserSharingTab.tsx` | 1 |
| `src/components/user/dashboard/UserSidebar.tsx` | 1 |
| `src/components/user/dashboard/UserSuitcasesTab.tsx` | 1 |
| `src/components/user/dashboard/UserWalletTab.tsx` | 1 |
| `src/components/user/profile/ProfileIdentityFields.tsx` | 1 |
| `src/components/user/referral/SocialCardGenerator.tsx` | 1 |
| `src/components/user/UserDashboard.tsx` | 1 |
| `src/components/workspace/global/GlobalWorkspacePanel.tsx` | 1 |
| `src/components/workspace/global/GlobalWorkspacePanelBody.tsx` | 1 |
| `src/components/workspace/global/sections/AllegatiCategoryPanel.tsx` | 1 |
| `src/components/workspace/global/sections/AllegatiSection.tsx` | 1 |
| `src/components/workspace/global/sections/AttivitaSection.tsx` | 1 |
| `src/components/workspace/global/sections/CondivisioneSection.tsx` | 1 |
| `src/components/workspace/global/sections/InvitiSection.tsx` | 1 |
| `src/components/workspace/global/sections/UtentiSection.tsx` | 1 |
| `src/components/workspace/global/sections/WorkspaceBlockedUsersSubsection.tsx` | 1 |
| `src/components/workspace/global/sections/WorkspaceCard.tsx` | 1 |
| `src/components/workspace/global/sections/WorkspaceSection.tsx` | 1 |
| `src/components/workspace/global/WorkspaceBinderTab.tsx` | 1 |
| `src/components/workspace/global/WorkspacePanelContext.tsx` | 1 |
| `src/components/workspace/global/WorkspaceSectionNav.tsx` | 1 |
| `src/components/workspace/global/WorkspaceViaggioShellNav.tsx` | 1 |
| `src/config/env.ts` | 1 |
| `src/constants/captionEmojis.ts` | 1 |
| `src/constants/geoConfig.ts` | 1 |
| `src/constants/governance.ts` | 1 |
| `src/constants/layout.ts` | 1 |
| `src/constants/planTypes.ts` | 1 |
| `src/constants/platformFeatureFlags.ts` | 1 |
| `src/constants/services.ts` | 1 |
| `src/constants/slidePanelMotion.ts` | 1 |
| `src/context/AiPlannerContext.tsx` | 1 |
| `src/context/AppProviders.tsx` | 1 |
| `src/context/BusinessContext.tsx` | 1 |
| `src/context/CityEditorContext.tsx` | 1 |
| `src/context/CollaborationLiveContext.tsx` | 1 |
| `src/context/ConfigContext.tsx` | 1 |
| `src/context/DiaryInteractionContext.tsx` | 1 |
| `src/context/GpsContext.tsx` | 1 |
| `src/context/InteractionContext.tsx` | 1 |
| `src/context/ItineraryContext.tsx` | 1 |
| `src/context/ModalContext.tsx` | 1 |
| `src/context/NavigationContext.tsx` | 1 |
| `src/context/PlatformControlContext.tsx` | 1 |
| `src/context/UIContext.tsx` | 1 |
| `src/context/useDiaryInteractionsContext.ts` | 1 |
| `src/context/useNavigation.ts` | 1 |
| `src/context/UserContext.tsx` | 1 |
| `src/data/ai/eventTaxonomy.ts` | 1 |
| `src/data/ai/prompts.ts` | 1 |
| `src/data/system/designRules.ts` | 1 |
| `src/data/system/designTokens.ts` | 1 |
| `src/data/system/foundationDesignRules.ts` | 1 |
| `src/data/system/foundationSettingsCatalog.ts` | 1 |
| `src/data/system/myWorldSettingsCatalog.ts` | 1 |
| `src/data/system/permissions.ts` | 1 |
| `src/data/ui/heroConstants.ts` | 1 |
| `src/domain/collaboration/permissions.ts` | 1 |
| `src/domain/collaboration/resourceInvite.ts` | 1 |
| `src/domain/collaboration/workspaceComposition.ts` | 1 |
| `src/domain/collaboration/workspacePermissions.ts` | 1 |
| `src/domain/designSystem/designSnapshot.ts` | 1 |
| `src/domain/diary/diaryAuthorTracking.ts` | 1 |
| `src/domain/diary/diaryNotesState.ts` | 1 |
| `src/domain/diary/itineraryDistance.ts` | 1 |
| `src/domain/diary/poiCatalogSync.ts` | 1 |
| `src/domain/gamification/rewardsGate.ts` | 1 |
| `src/domain/geo/nearestCity.ts` | 1 |
| `src/domain/packing/categorySetupUx.ts` | 1 |
| `src/domain/packing/itemDisplayOrder.ts` | 1 |
| `src/domain/packing/packingCategories.ts` | 1 |
| `src/domain/packing/packingDomainCatalog.ts` | 1 |
| `src/domain/packing/packingDomainCatalogValidation.ts` | 1 |
| `src/domain/packing/packingQaFixtures.ts` | 1 |
| `src/domain/packing/packingTemplateComposition.ts` | 1 |
| `src/domain/photos/assertPhotographWrite.ts` | 1 |
| `src/domain/photos/photoCaption.ts` | 1 |
| `src/domain/photos/photoFilters.ts` | 1 |
| `src/domain/photos/photograph.ts` | 1 |
| `src/domain/photos/photographQuery.ts` | 1 |
| `src/domain/photos/photoOfficial.ts` | 1 |
| `src/domain/placeholders/platformPlaceholderOrigin.ts` | 1 |
| `src/domain/placeholders/platformPlaceholderRegistry.ts` | 1 |
| `src/domain/platformControl/auditPresentation.ts` | 1 |
| `src/domain/platformControl/evaluateFeatureFlag.ts` | 1 |
| `src/domain/platformControl/platformAudience.ts` | 1 |
| `src/domain/platformControl/platformFlagCache.ts` | 1 |
| `src/domain/platformControl/scheduleClock.ts` | 1 |
| `src/domain/platformControl/scheduleRowStatus.ts` | 1 |
| `src/domain/poi/resolvePoiDisplayImageUrl.ts` | 1 |
| `src/domain/save/documentSaveRegistry.ts` | 1 |
| `src/domain/save/documentSaveTypes.ts` | 1 |
| `src/focus/exitGate/documentExitRegistry.ts` | 1 |
| `src/focus/FocusIdleBoundary.tsx` | 1 |
| `src/focus/FocusModeContext.tsx` | 1 |
| `src/focus/focusModeRegistry.ts` | 1 |
| `src/focus/focusWorkspacePresentation.ts` | 1 |
| `src/focus/useWorkspaceCloseRegistration.ts` | 1 |
| `src/focus/useWorkspaceSessionEnd.ts` | 1 |
| `src/focus/workspaceCloseRegistry.ts` | 1 |
| `src/focus/WorkspaceHost.tsx` | 1 |
| `src/focus/workspaceSessionRegistry.ts` | 1 |
| `src/hooks/admin/import/useImportActions.ts` | 1 |
| `src/hooks/admin/import/useImportData.ts` | 1 |
| `src/hooks/admin/people/usePeopleAI.ts` | 1 |
| `src/hooks/admin/people/usePeopleData.ts` | 1 |
| `src/hooks/admin/useAdminCityEditorLogic.ts` | 1 |
| `src/hooks/admin/useAffiliateAnalytics.ts` | 1 |
| `src/hooks/admin/useAiCompleteCity.ts` | 1 |
| `src/hooks/admin/useAiFlashSearch.ts` | 1 |
| `src/hooks/admin/useAiMagicCity.ts` | 1 |
| `src/hooks/admin/useAiTargetedSearch.ts` | 1 |
| `src/hooks/admin/useAiTaskRunner.ts` | 1 |
| `src/hooks/admin/useAiValidation.ts` | 1 |
| `src/hooks/admin/useDuplicateFinder.ts` | 1 |
| `src/hooks/admin/usePeopleManager.ts` | 1 |
| `src/hooks/admin/usePhotoModeration.ts` | 1 |
| `src/hooks/admin/usePoiActions.ts` | 1 |
| `src/hooks/admin/usePoiFilters.ts` | 1 |
| `src/hooks/admin/useServiceRegeneration.ts` | 1 |
| `src/hooks/admin/useSocialCanvasLogic.ts` | 1 |
| `src/hooks/admin/useSocialTemplates.ts` | 1 |
| `src/hooks/admin/useSponsorData.ts` | 1 |
| `src/hooks/admin/useSponsorStats.ts` | 1 |
| `src/hooks/admin/useStrategicMap.ts` | 1 |
| `src/hooks/collaboration/useCollaborationLiveSession.ts` | 1 |
| `src/hooks/community/useLiveFeedUpload.ts` | 1 |
| `src/hooks/core/useAppInitialization.ts` | 1 |
| `src/hooks/core/useAppUI.ts` | 1 |
| `src/hooks/core/useGpsManager.ts` | 1 |
| `src/hooks/features/useDiaryInteractions.ts` | 1 |
| `src/hooks/features/useNavigationController.ts` | 1 |
| `src/hooks/features/useShopNavigation.ts` | 1 |
| `src/hooks/features/useSponsorFormLogic.ts` | 1 |
| `src/hooks/photos/useCanCapturePhoto.ts` | 1 |
| `src/hooks/photos/useCommunityPhotoPublish.ts` | 1 |
| `src/hooks/save/useAppExitProtection.ts` | 1 |
| `src/hooks/save/useDiaryDocumentSave.ts` | 1 |
| `src/hooks/save/useSuitcaseDocumentSave.ts` | 1 |
| `src/hooks/suitcase/aiSuggestions.ts` | 1 |
| `src/hooks/suitcase/createWorkspaceFromConfiguration.ts` | 1 |
| `src/hooks/suitcase/useAffiliateGear.ts` | 1 |
| `src/hooks/suitcase/useHiddenCategories.ts` | 1 |
| `src/hooks/suitcase/useSuitcaseCrud.ts` | 1 |
| `src/hooks/suitcase/useSuitcaseLinking.ts` | 1 |
| `src/hooks/suitcase/useSuitcaseTemplates.ts` | 1 |
| `src/hooks/suitcase/useUserSuitcases.ts` | 1 |
| `src/hooks/ui/useBelowLg.ts` | 1 |
| `src/hooks/ui/useControlledSlidePanel.ts` | 1 |
| `src/hooks/ui/useFlipSwap.ts` | 1 |
| `src/hooks/ui/useHeroLogic.ts` | 1 |
| `src/hooks/ui/useHeroStackedLayout.ts` | 1 |
| `src/hooks/ui/useHideOnScrollDown.ts` | 1 |
| `src/hooks/ui/useMobileCompact.ts` | 1 |
| `src/hooks/ui/useMobileDetect.ts` | 1 |
| `src/hooks/ui/useMobileDiaryOverlayGeometry.ts` | 1 |
| `src/hooks/ui/useScrollUI.ts` | 1 |
| `src/hooks/ui/useTypingCycle.ts` | 1 |
| `src/hooks/useAdminData.ts` | 1 |
| `src/hooks/useAdminExport.ts` | 1 |
| `src/hooks/useAffiliate.ts` | 1 |
| `src/hooks/useAiGeneration.ts` | 1 |
| `src/hooks/useAIPlanner.ts` | 1 |
| `src/hooks/useAiRuntimeGate.ts` | 1 |
| `src/hooks/useAnchoredPortalPosition.ts` | 1 |
| `src/hooks/useAppRouter.ts` | 1 |
| `src/hooks/useAreRewardsEnabled.ts` | 1 |
| `src/hooks/useAutoRotateSuggestions.ts` | 1 |
| `src/hooks/useCityData.ts` | 1 |
| `src/hooks/useCityEditorForm.ts` | 1 |
| `src/hooks/useCityGallery.ts` | 1 |
| `src/hooks/useCityGenerator.ts` | 1 |
| `src/hooks/useCityList.ts` | 1 |
| `src/hooks/useCloseOnEscape.ts` | 1 |
| `src/hooks/useDiaryLogic.ts` | 1 |
| `src/hooks/useDiaryPoiCatalogUpdatePrompt.ts` | 1 |
| `src/hooks/useDiaryUndo.ts` | 1 |
| `src/hooks/useDocumentTitle.ts` | 1 |
| `src/hooks/useDynamicContent.ts` | 1 |
| `src/hooks/useDynamicStyles.ts` | 1 |
| `src/hooks/useFoundationStyles.ts` | 1 |
| `src/hooks/useGlobalModalEscape.ts` | 1 |
| `src/hooks/useJourneyPhase.ts` | 1 |
| `src/hooks/useLogoRasterizer.ts` | 1 |
| `src/hooks/useMyWorldStyles.ts` | 1 |
| `src/hooks/useNewsTicker.ts` | 1 |
| `src/hooks/useOpenAddElementToWorkspace.ts` | 1 |
| `src/hooks/useOpenCollaborationShare.ts` | 1 |
| `src/hooks/useOpenCreateWorkspace.ts` | 1 |
| `src/hooks/useOpenMyWorld.ts` | 1 |
| `src/hooks/useOpenWorkspaceFromViaggio.ts` | 1 |
| `src/hooks/usePagination.ts` | 1 |
| `src/hooks/usePartnerIntegrations.ts` | 1 |
| `src/hooks/usePersistedState.ts` | 1 |
| `src/hooks/usePlatformControlTypography.ts` | 1 |
| `src/hooks/usePoiForm.ts` | 1 |
| `src/hooks/useRankingsLogic.ts` | 1 |
| `src/hooks/useReferralTracking.ts` | 1 |
| `src/hooks/useResourcePermission.ts` | 1 |
| `src/hooks/useResourceWorkspaces.ts` | 1 |
| `src/hooks/useShare.ts` | 1 |
| `src/hooks/useSharedResourceIndicator.ts` | 1 |
| `src/hooks/useSponsorExport.ts` | 1 |
| `src/hooks/useSponsorLogic.ts` | 1 |
| `src/hooks/useSponsorModalLogic.ts` | 1 |
| `src/hooks/useSponsorModals.ts` | 1 |
| `src/hooks/useSponsorOperations.ts` | 1 |
| `src/hooks/useSuitcaseSystem.ts` | 1 |
| `src/hooks/useSystemMessage.ts` | 1 |
| `src/hooks/useUndoStack.ts` | 1 |
| `src/hooks/useUserDashboardData.ts` | 1 |
| `src/hooks/useVirtualWindow.ts` | 1 |
| `src/hooks/useWorkspaceDashboard.ts` | 1 |
| `src/hooks/useWorkspaceResourceNavigation.ts` | 1 |
| `src/index.css` | 1 |
| `src/index.tsx` | 1 |
| `src/layering/layerRegistry.ts` | 1 |
| `src/layering/resolveWorkspacePanelZIndex.ts` | 1 |
| `src/myspace/mySpaceNavMemory.ts` | 1 |
| `src/myspace/mySpaceRoots.ts` | 1 |
| `src/myworld/myWorldSession.ts` | 1 |
| `src/services/affiliateAdminService.ts` | 1 |
| `src/services/affiliateTrackingService.ts` | 1 |
| `src/services/ai.ts` | 1 |
| `src/services/ai/aiChat.ts` | 1 |
| `src/services/ai/aiEdgeErrors.ts` | 1 |
| `src/services/ai/aiGateway.ts` | 1 |
| `src/services/ai/aiLegacyPayload.ts` | 1 |
| `src/services/ai/aiPlanner.ts` | 1 |
| `src/services/ai/aiRuntimeStatus.ts` | 1 |
| `src/services/ai/aiText.ts` | 1 |
| `src/services/ai/aiUtils.ts` | 1 |
| `src/services/ai/aiVision.ts` | 1 |
| `src/services/ai/generators/cityContentGenerator.ts` | 1 |
| `src/services/ai/generators/listGenerator.ts` | 1 |
| `src/services/ai/generators/peopleGenerator.ts` | 1 |
| `src/services/ai/generators/poiGenerator.ts` | 1 |
| `src/services/ai/generators/qualityGenerator.ts` | 1 |
| `src/services/ai/legacyExtraQuotaCompat.ts` | 1 |
| `src/services/ai/providers/supabaseProvider.ts` | 1 |
| `src/services/ai/types.ts` | 1 |
| `src/services/ai/utils/taxonomyUtils.ts` | 1 |
| `src/services/aiConfigService.ts` | 1 |
| `src/services/aiPlannerService.ts` | 1 |
| `src/services/aiUsageService.ts` | 1 |
| `src/services/auth/authIdentity.ts` | 1 |
| `src/services/city/cityAdminApi.ts` | 1 |
| `src/services/city/cityCache.ts` | 1 |
| `src/services/city/cityIdService.ts` | 1 |
| `src/services/city/cityLifecycleService.ts` | 1 |
| `src/services/city/cityMediaService.ts` | 1 |
| `src/services/city/cityPayloadMapper.ts` | 1 |
| `src/services/city/cityReadService.ts` | 1 |
| `src/services/city/cityUpdateService.ts` | 1 |
| `src/services/city/cityWriteService.ts` | 1 |
| `src/services/city/entitiesService.ts` | 1 |
| `src/services/city/parsers/content/mergePatronDetailsFromAi.ts` | 1 |
| `src/services/city/parsers/content/parseLogs.ts` | 1 |
| `src/services/city/parsers/content/parsePatron.ts` | 1 |
| `src/services/city/parsers/content/parseRatings.ts` | 1 |
| `src/services/city/parsers/entities/famousPersonAudience.ts` | 1 |
| `src/services/city/parsers/entities/parseEvent.ts` | 1 |
| `src/services/city/parsers/entities/parseGuide.ts` | 1 |
| `src/services/city/parsers/entities/parsePerson.ts` | 1 |
| `src/services/city/parsers/entities/parseService.ts` | 1 |
| `src/services/city/parsers/entities/parseTourOperator.ts` | 1 |
| `src/services/city/parsers/media/parseGallery.ts` | 1 |
| `src/services/city/parsers/media/parseMediaAsset.ts` | 1 |
| `src/services/city/parsers/shared/ensureArray.ts` | 1 |
| `src/services/city/parsers/shared/ensureNumber.ts` | 1 |
| `src/services/city/parsers/shared/ensureString.ts` | 1 |
| `src/services/city/poi/poiMapper.ts` | 1 |
| `src/services/city/poi/poiRead.ts` | 1 |
| `src/services/city/poiService.ts` | 1 |
| `src/services/city/tourOperatorService.ts` | 1 |
| `src/services/cityService.ts` | 1 |
| `src/services/collaboration/collaborationLiveConfig.ts` | 1 |
| `src/services/collaboration/collaborationLivePresentation.ts` | 1 |
| `src/services/collaboration/collaborationNotificationPrefsService.ts` | 1 |
| `src/services/collaboration/collaborationNotificationService.ts` | 1 |
| `src/services/collaboration/collaborationProfileService.ts` | 1 |
| `src/services/collaboration/collaborationUserSearchService.ts` | 1 |
| `src/services/collaboration/diaryCollaborationService.ts` | 1 |
| `src/services/collaboration/domainEventService.ts` | 1 |
| `src/services/collaboration/friendService.ts` | 1 |
| `src/services/collaboration/index.ts` | 1 |
| `src/services/collaboration/permissionService.ts` | 1 |
| `src/services/collaboration/personalShareService.ts` | 1 |
| `src/services/collaboration/resourceInviteNotificationHelper.ts` | 1 |
| `src/services/collaboration/resourceInviteService.ts` | 1 |
| `src/services/collaboration/shareableResourceOwnerLookup.ts` | 1 |
| `src/services/collaboration/sharedResourceAclService.ts` | 1 |
| `src/services/collaboration/sharedResourceLockService.ts` | 1 |
| `src/services/collaboration/sharedResourceMappers.ts` | 1 |
| `src/services/collaboration/sharedResourceOwnershipVerifiers.ts` | 1 |
| `src/services/collaboration/sharedResourceService.ts` | 1 |
| `src/services/collaboration/suitcaseCollaborationService.ts` | 1 |
| `src/services/collaboration/userBlockService.ts` | 1 |
| `src/services/collaboration/workspaceAccessLookup.ts` | 1 |
| `src/services/collaboration/workspaceAttachmentService.ts` | 1 |
| `src/services/collaboration/workspaceComposition/index.ts` | 1 |
| `src/services/collaboration/workspaceComposition/materializeWorkspaceComposition.ts` | 1 |
| `src/services/collaboration/workspaceComposition/resolveWorkspaceCompositionBlueprint.ts` | 1 |
| `src/services/collaboration/workspaceComposition/resolveWorkspaceCompositionCatalog.ts` | 1 |
| `src/services/collaboration/workspaceCompositionService.ts` | 1 |
| `src/services/collaboration/workspaceEngineConfigService.ts` | 1 |
| `src/services/collaboration/workspaceInviteNotifications.ts` | 1 |
| `src/services/collaboration/workspaceInvitePersistence.ts` | 1 |
| `src/services/collaboration/workspaceInviteService.ts` | 1 |
| `src/services/collaboration/workspaceInviteValidation.ts` | 1 |
| `src/services/collaboration/workspaceMappers.ts` | 1 |
| `src/services/collaboration/workspaceMemberAclSync.ts` | 1 |
| `src/services/collaboration/workspaceMemberService.ts` | 1 |
| `src/services/collaboration/workspaceNotificationHelper.ts` | 1 |
| `src/services/collaboration/workspaceResourceLinkLookup.ts` | 1 |
| `src/services/collaboration/workspaceResourcePresentation.ts` | 1 |
| `src/services/collaboration/workspaceResourceService.ts` | 1 |
| `src/services/collaboration/workspaceService.ts` | 1 |
| `src/services/communicationService.ts` | 1 |
| `src/services/community/businessStatsService.ts` | 1 |
| `src/services/community/interactionService.ts` | 1 |
| `src/services/community/postService.ts` | 1 |
| `src/services/community/reviewService.ts` | 1 |
| `src/services/community/suggestionService.ts` | 1 |
| `src/services/communityService.ts` | 1 |
| `src/services/dataService.ts` | 1 |
| `src/services/gamificationService.ts` | 1 |
| `src/services/geo.ts` | 1 |
| `src/services/geoRegistryService.ts` | 1 |
| `src/services/globalEventsService.ts` | 1 |
| `src/services/importAutomationService.ts` | 1 |
| `src/services/importService.ts` | 1 |
| `src/services/marketingService.ts` | 1 |
| `src/services/mediaService.ts` | 1 |
| `src/services/myspace/favoritesEntityRead.ts` | 1 |
| `src/services/myspace/userFavoritesService.ts` | 1 |
| `src/services/myspace/userVisitedCitiesService.ts` | 1 |
| `src/services/notificationService.ts` | 1 |
| `src/services/partnerIntegrationService.ts` | 1 |
| `src/services/photoMapper.ts` | 1 |
| `src/services/photoService.ts` | 1 |
| `src/services/platformControl/messageTemplateService.ts` | 1 |
| `src/services/platformControl/platformControlMapper.ts` | 1 |
| `src/services/platformControl/platformControlService.ts` | 1 |
| `src/services/platformControl/resolvePlatformUserMessage.ts` | 1 |
| `src/services/profileService.ts` | 1 |
| `src/services/settingsService.ts` | 1 |
| `src/services/socialMarketingService.ts` | 1 |
| `src/services/sponsors/_internalTypes.ts` | 1 |
| `src/services/sponsors/index.ts` | 1 |
| `src/services/sponsors/sponsorActivationService.ts` | 1 |
| `src/services/sponsors/sponsorAdminStubs.ts` | 1 |
| `src/services/sponsors/sponsorContractsService.ts` | 1 |
| `src/services/sponsors/sponsorDashboardService.ts` | 1 |
| `src/services/sponsors/sponsorLegacyAdapter.ts` | 1 |
| `src/services/sponsors/sponsorMessagesService.ts` | 1 |
| `src/services/sponsors/sponsorRatingService.ts` | 1 |
| `src/services/sponsors/sponsorRequestsService.ts` | 1 |
| `src/services/sponsors/sponsorResolvers.ts` | 1 |
| `src/services/sponsors/sponsorStatsService.ts` | 1 |
| `src/services/sponsorService.ts` | 1 |
| `src/services/stagingService.ts` | 1 |
| `src/services/storageService.ts` | 1 |
| `src/services/subscriptionService.ts` | 1 |
| `src/services/suitcase/associateSuitcaseWithDiary.ts` | 1 |
| `src/services/suitcase/packingCatalogService.ts` | 1 |
| `src/services/suitcase/packingCompositionService.ts` | 1 |
| `src/services/suitcase/packingSeedService.ts` | 1 |
| `src/services/suitcase/prepareForAssociation.ts` | 1 |
| `src/services/suitcase/suitcaseAffiliateService.ts` | 1 |
| `src/services/suitcase/suitcaseCoreService.ts` | 1 |
| `src/services/suitcase/suitcaseDocumentSaveService.ts` | 1 |
| `src/services/suitcase/suitcaseEditorialService.ts` | 1 |
| `src/services/suitcase/suitcaseGuestService.ts` | 1 |
| `src/services/suitcase/suitcaseLinkingService.ts` | 1 |
| `src/services/suitcase/suitcaseRejectionsService.ts` | 1 |
| `src/services/suitcase/suitcaseTemplateService.ts` | 1 |
| `src/services/suitcaseService.ts` | 1 |
| `src/services/supabaseClient.ts` | 1 |
| `src/services/taxonomyService.ts` | 1 |
| `src/services/userService.ts` | 1 |
| `src/services/viaggio/resourceAssociationService.ts` | 1 |
| `src/services/viaggio/viaggioAttachmentService.ts` | 1 |
| `src/services/viaggio/viaggioCityService.ts` | 1 |
| `src/services/viaggio/viaggioDiaryService.ts` | 1 |
| `src/services/viaggio/viaggioMappaUnion.ts` | 1 |
| `src/services/viaggio/viaggioMappers.ts` | 1 |
| `src/services/viaggio/viaggioRicordamiService.ts` | 1 |
| `src/services/viaggio/viaggioRicordiDayStructure.ts` | 1 |
| `src/services/viaggio/viaggioRicordiService.ts` | 1 |
| `src/services/viaggio/viaggioRiepilogoService.ts` | 1 |
| `src/services/viaggio/viaggioService.ts` | 1 |
| `src/services/zoneService.ts` | 1 |
| `src/types/ai.ts` | 1 |
| `src/types/ai/cityGeneration.ts` | 1 |
| `src/types/cityPreview.ts` | 1 |
| `src/types/core.ts` | 1 |
| `src/types/database.ts` | 1 |
| `src/types/designSystem.ts` | 1 |
| `src/types/domain/index.ts` | 1 |
| `src/types/index.ts` | 1 |
| `src/types/marketing.ts` | 1 |
| `src/types/models/City.ts` | 1 |
| `src/types/models/Itinerary.ts` | 1 |
| `src/types/models/Media.ts` | 1 |
| `src/types/models/Social.ts` | 1 |
| `src/types/models/Sponsor.ts` | 1 |
| `src/types/models/Viaggio.ts` | 1 |
| `src/types/models/ViaggioAttachment.ts` | 1 |
| `src/types/partners.ts` | 1 |
| `src/types/platformControl.ts` | 1 |
| `src/types/shared.ts` | 1 |
| `src/types/shared/index.ts` | 1 |
| `src/types/shared/primitives.ts` | 1 |
| `src/types/shared/SponsorStatus.ts` | 1 |
| `src/types/subscriptions.ts` | 1 |
| `src/types/supabase.ts` | 1 |
| `src/types/users.ts` | 1 |
| `src/types/write/index.ts` | 1 |
| `src/types/write/poiForm.ts` | 1 |
| `src/utils/affiliateNetwork.ts` | 1 |
| `src/utils/aiAffiliateRenderer.ts` | 1 |
| `src/utils/common.ts` | 1 |
| `src/utils/countBadge.ts` | 1 |
| `src/utils/dateFormatters.ts` | 1 |
| `src/utils/deriveItineraryCityTypes.ts` | 1 |
| `src/utils/exportGenerators.ts` | 1 |
| `src/utils/fileValidation.ts` | 1 |
| `src/utils/formatRelativeActivity.ts` | 1 |
| `src/utils/guestSuitcaseHelper.ts` | 1 |
| `src/utils/heroCoverCollagePlan.ts` | 1 |
| `src/utils/imageOptimizer.ts` | 1 |
| `src/utils/itineraryAssociability.ts` | 1 |
| `src/utils/jsonSerialization.ts` | 1 |
| `src/utils/marketingTierUtils.ts` | 1 |
| `src/utils/media.ts` | 1 |
| `src/utils/pdfImagePipelineLog.ts` | 1 |
| `src/utils/pdfUtils.ts` | 1 |
| `src/utils/safeTypes.ts` | 1 |
| `src/utils/scheduleUtils.ts` | 1 |
| `src/utils/seo.ts` | 1 |
| `src/utils/sponsorValidation.ts` | 1 |
| `src/utils/stringUtils.ts` | 1 |
| `src/utils/suitcaseAssociation.ts` | 1 |
| `src/utils/suitcaseCategoryDelete.ts` | 1 |
| `src/utils/suitcaseDomain.ts` | 1 |
| `src/utils/tagDerivation.ts` | 1 |
| `src/utils/userUtils.ts` | 1 |
| `tsconfig.app.json` | 1 |
| `tsconfig.json` | 1 |
| `tsconfig.scripts.json` | 1 |
| `vite.config.ts` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

Occorrenze totali: **964** (sopra soglia elenco riga-per-riga). Inventario sintetico per file:

| File | Occorrenze | Decisione baseline per-file |
|---|---:|---|
| `package.json` | 1 | da correggere (1× Livello A) |
| `scripts/_bundle_audit_report.mjs` | 1 | da correggere (1× Livello A) |
| `scripts/_bundle_import_trace.mjs` | 1 | da correggere (1× Livello A) |
| `scripts/build-packing-domain-catalog.ts` | 1 | da correggere (1× Livello A) |
| `scripts/check-layers.ts` | 1 | da correggere (1× Livello A) |
| `scripts/checkMissingReactHooks.ts` | 1 | da correggere (1× Livello A) |
| `scripts/generate-foundation-migration.ts` | 1 | da correggere (1× Livello A) |
| `scripts/generate-foundation-review-docs.ts` | 1 | da correggere (1× Livello A) |
| `scripts/generate-myworld-migration.ts` | 1 | da correggere (1× Livello A) |
| `scripts/generate-packing-catalog-migrations.ts` | 1 | da correggere (1× Livello A) |
| `scripts/generate-packing-seed.ts` | 1 | da correggere (1× Livello A) |
| `scripts/migrate_regions.js` | 1 | da correggere (1× Livello A) |
| `scripts/packing-domain-catalog-data.json` | 1 | da correggere (1× Livello A) |
| `scripts/patch_supabase_types.cjs` | 1 | da correggere (1× Livello A) |
| `scripts/patch_supabase_types.js` | 1 | da correggere (1× Livello A) |
| `scripts/qa-macrofase-c.ts` | 1 | da correggere (1× Livello A) |
| `scripts/run-dev-tunnel-hmr.mjs` | 1 | da correggere (1× Livello A) |
| `scripts/seed_geo.js` | 1 | da correggere (1× Livello A) |
| `scripts/smoke-collaboration-step4.ts` | 1 | da correggere (1× Livello A) |
| `scripts/smoke-feature-flag-resolution.ts` | 1 | da correggere (1× Livello A) |
| `scripts/smoke-mp02-step2.ts` | 1 | da correggere (1× Livello A) |
| `scripts/smoke-mp02-step3.ts` | 1 | da correggere (1× Livello A) |
| `scripts/smoke-myspace-viaggio-catalog.ts` | 1 | da correggere (1× Livello A) |
| `scripts/smoke-viaggio-domain.ts` | 1 | da correggere (1× Livello A) |
| `scripts/smoke-viaggio-step3.ts` | 1 | da correggere (1× Livello A) |
| `scripts/smoke-viaggio-step5.ts` | 1 | da correggere (1× Livello A) |
| `server/index.ts` | 1 | da correggere (1× Livello A) |
| `server/middleware/cors.ts` | 1 | da correggere (1× Livello A) |
| `server/routes/admin.routes.ts` | 1 | da correggere (1× Livello A) |
| `server/routes/auth.routes.ts` | 1 | da correggere (1× Livello A) |
| `server/routes/bootstrap.routes.ts` | 1 | da correggere (1× Livello A) |
| `server/routes/city.routes.ts` | 1 | da correggere (1× Livello A) |
| `server/routes/content.routes.ts` | 1 | da correggere (1× Livello A) |
| `server/routes/health.routes.ts` | 1 | da correggere (1× Livello A) |
| `server/routes/user.routes.ts` | 1 | da correggere (1× Livello A) |
| `server/services/cityAdminService.ts` | 1 | da correggere (1× Livello A) |
| `server/supabaseAdmin.ts` | 1 | da correggere (1× Livello A) |
| `src/collaboration/guestGate.ts` | 1 | da correggere (1× Livello A) |
| `src/collaboration/suitcaseResourceKind.ts` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AdminAiAssistant.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AdminCityEditor.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AdminCommunications.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AdminControlCenterAI.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AdminDashboard.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AdminGamification.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AdminHeaderManager.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AdminImageInput.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AdminItineraryEditor.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AdminPhotoInspector.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AdminPoiManager.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AdminPoiModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AdminRoleManager.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AdminSocialStudio.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AdminStatsDashboard.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AdminTaxonomyManager.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AdminUserManager.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/affiliations/AffiliateAnalyticsTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/affiliations/AffiliateOverviewCard.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AiEconomicsDashboard.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AiFieldHelper.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/AiLimitsControlCenter.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cities/CitiesListTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cities/CityAuditModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cities/CityGeneratorModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cities/CompleteCityModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cities/DeleteCityOptionsModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cities/GeoCascadingFilters.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cities/ProcessLogModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cities/RegionalAnalysisModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cities/StrategicMapTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cities/ZoneCard.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/CitiesManager.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cityEditor/culture/CultureHistory.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cityEditor/culture/CulturePatron.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cityEditor/culture/CulturePeople.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cityEditor/EditorGeneral.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cityEditor/EditorMedia.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cityEditor/EditorRatings.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cityEditor/FormFieldHelper.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cityEditor/services/EditorInfo.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cityEditor/services/ServiceEvents.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cityEditor/services/ServiceGeneric.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cityEditor/services/ServiceGuides.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cityEditor/services/ServiceOperators.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cityEditor/tabs/TabCulture.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cityEditor/tabs/TabGeneral.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cityEditor/tabs/TabLogs.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cityEditor/tabs/TabMedia.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cityEditor/tabs/TabPois.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cityEditor/tabs/TabRatings.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/cityEditor/tabs/TabServices.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/common/AdminAiRuntimeBanner.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/common/AdminGuideModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/common/AdminMultiSelect.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/common/AdminPageHeader.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/common/AdminSectionCard.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/communications/CommsHistory.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/communications/CommsTemplates.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/design/ComponentPreviewHost.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/design/DesignSystemSettings.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/design/editorTypes.ts` | 1 | da correggere (1× Livello A) |
| `src/components/admin/design/foundation/FoundationPreviewComponents.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/design/foundation/foundationPreviewMeta.ts` | 1 | da correggere (1× Livello A) |
| `src/components/admin/design/PlaceholderGrid.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/design/SafeArtPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/design/StyleEditor.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/design/utilityCssValidation.ts` | 1 | da correggere (1× Livello A) |
| `src/components/admin/economics/AdminAiAnalyticsV4.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/economics/PricingManager.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/economics/SustainabilityHelper.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/foundation/FoundationSettingsPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/GlobalEventsManager.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/import/components/ImportActionToolbar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/import/components/ImportFilterBar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/import/components/ImportReportModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/import/components/ImportStatsBar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/import/components/ImportTable.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/import/ImportDashboard.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/import/ImportOsmModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/ItineraryManager.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/layout/AdminMobileHeader.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/layout/AdminSidebar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/LoadingTipsManager.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/marketing/AdminCreditPackages.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/marketing/AiLimitsPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/marketing/CampaignsPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/marketing/PricingHistoryPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/marketing/PromoManagerModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/myworld/MyWorldStyleSettingsPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/NewsTickerManager.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/observatory/AnomalyInspector.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/observatory/CityStatsGrid.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/observatory/DuplicateResolver.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/observatory/ObservatoryFilterDrawer.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/observatory/ObservatoryLayout.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/observatory/ObservatoryLegend.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/observatory/ScheduleMatrix.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/onboarding/OnboardingVisualEditor.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/PartnerDetailModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/PhotoModeration.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/photos/PhotoFilters.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/photos/PhotoMetadataModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/photos/PhotoRow.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/photos/PhotoTable.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/platformControl/AuditHistoryPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/platformControl/FeatureFlagBooleanRow.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/platformControl/FeatureFlagNumberRow.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/platformControl/MaintenancePanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/platformControl/MessageTemplateEditor.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/platformControl/PlatformControlCenter.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/platformControl/PlatformControlSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/platformControl/PlatformControlTabBanner.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/platformControl/SchedulePanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/poiManager/BulkFixProgressModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/poiManager/PoiList.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/poiManager/PoiToolbar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/poiManager/RegenerateConfirmModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/poiModal/PoiInfoTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/poiModal/PoiLinksTab.tsx` | 1 | da correggere (1× Livello A) |
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
| `src/components/admin/social/SocialCanvas.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/social/SocialPreviewConfig.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/sponsor/SponsorBulkActions.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/sponsor/SponsorModals.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/sponsor/SponsorTable.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/sponsor/SponsorToolbar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/SponsorDashboardOverview.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/SponsorFilters.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/SponsorManager.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/SuggestionManager.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/userManager/AiLimitsTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/userManager/CreateUserModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/userManager/DeleteUserModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/userManager/RlsFixModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/userManager/UserSubscriptionsTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/userManager/UserTable.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/userManager/UserToolbar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/admin/views/UserManagementView.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/ai/AiRuntimeBanner.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/aiPlanner/AiLoadingScreen.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/aiPlanner/AiPlannerForm.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/aiPlanner/AiPlannerTimeline.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/city/CityCard.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/city/CityDetailContent.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/city/CityHeader.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/city/CityHistory.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/city/components/CompassExploreButton.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/city/components/NearbyCitiesRow.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/city/gallery/GalleryGrid.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/city/gallery/GalleryLightbox.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/city/gallery/GallerySuccessModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/city/gallery/GalleryUploadModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/city/ShowcaseCards.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/city/tabs/CategorySponsorColumn.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/city/tabs/CityCategoryTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/city/tabs/CityGallery.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/city/tabs/CityShowcaseTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/city/WeatherWidget.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/CollaborationManagementView.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/collaborationShareDraft.ts` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/CollaborationShareModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/collaborationSharePipeline.ts` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/collaborationSharePresentation.ts` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/CollaborationShareWizard.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/CollaborationUserInviteSearch.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/CollaborationWizardFooter.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/compositionSelectableRow.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/live/CollaborationActivityFeed.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/live/CollaborationLiveBar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/OptionCard.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/SharedResourceIndicator.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/useCollaborationInviteSearch.ts` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/useCollaborationShareBootstrap.ts` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/useCollaborationShareCompositionHandlers.ts` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/useCollaborationShareResourceHandlers.ts` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/useCollaborationShareWizardActions.ts` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/useCollaborationWizardNavigation.ts` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/workspace/WorkspaceInvitesSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/workspace/WorkspaceMembersSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/workspace/WorkspaceResourcePermissionSelect.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/workspace/WorkspaceResourcesSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/WorkspaceInviteStep.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/WorkspacePickElementStep.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/collaboration/WorkspaceShareWizardSteps.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/common/AdPlaceholder.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/common/AnchoredPopover.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/common/BrandLogo.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/common/CitySelector.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/common/CustomCalendar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/common/DeleteConfirmationModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/common/DraggableSlider.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/common/GlobalAlert.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/common/HorizontalScrollStrip.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/common/ImageWithFallback.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/common/MascotSvg.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/common/ModalLoading.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/common/PaginationControls.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/common/SmartFilterDrawer.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/common/StarRating.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/common/SwipeToDelete.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/community/liveFeed/LiveFeedCarousel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/community/liveFeed/LiveFeedHero.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/community/liveFeed/LiveFeedToolbar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/community/LiveFeedTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/community/QaForumTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/community/RankingTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/community/UserPhotoEditor.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/export/ExportLogo.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/checkout/CheckoutSuccessPage.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/cityName.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/DiaryDay.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/DiaryEmptyState.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/DiaryHeader.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/DiaryMemoCard.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/DiaryModals.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/DiaryTimeline.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/header/DiaryHeaderDateRange.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/header/DiaryHeaderInvalidDateModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/header/DiaryHeaderProjectInput.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/header/diaryHeaderTabs.css` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/header/DiaryHeaderTabs.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/header/DiaryHeaderToolbar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/header/DiaryHeaderUndoRedo.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/ItineraryItemCard.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/nationFlag.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/notes/DiaryNotesChecklistStatsBar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/notes/diaryNotesDocumentToPlainText.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/notes/diaryNotesEditor.css` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/notes/DiaryNotesEditor.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/notes/DiaryNotesLinkBubbleMenu.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/notes/diaryNotesLinkUtils.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/notes/DiaryNotesPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/notes/DiaryNotesTabs.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/notes/DiaryNotesToolbar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/notes/DiaryNoteTabMenu.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/AffiliateEditorialCenter.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/AffiliateSuggestionBox.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionReviewRow.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsReviewStep.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsSetupStep.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/AssociationConfirmationModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/BlacklistModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/CategoryIconPicker.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/CategoryItemsGrid.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/CategoryMobileDialog.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/CategorySection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/CategorySetupConfigurationModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/CategoryStatusFilter.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/CategorySuggestionPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/CategoryToolbarNav.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/EditorialCenterTabs.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/HiddenCategoriesPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/ItemDeleteConfirmationModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/LinkSuitcaseModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/NewCategoryPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/OptionalCategoriesPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/RecommendedSuitcaseModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/SavedSuitcasesSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseCard.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseDashboard.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseDashboardGuideColumn.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/suitcaseDashboardPanelUi.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseEditorToolbar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseEditorView.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseItemRow.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseOnboardingBox.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseSidePanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseStatusBox.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseToolbarGroup.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseToolbarProgressBox.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseUtils.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/tabs/AiCatalogTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/tabs/override/CategoryAccordion.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/tabs/override/PartnerLinksPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/tabs/override/TemplateSelector.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/tabs/OverrideTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/tabs/StandardItemsTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/tabs/TemplateLibraryTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/tabs/TemplateSpecificItemsTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/TemplateRow.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/suitcase/TemplateSelectorSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/components/SuitcaseModals.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/components/SuitcaseToast.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelModals.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelOptimisticUpdates.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelShellLifecycle.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelState.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseActions.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseAffiliate.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseAssociationFlow.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseEditorLogic.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseHiddenCategories.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseItemActions.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseLifecycle.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcasePanelClose.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcasePanelComposition.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcasePanelData.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseSuggestions.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseUndo.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseUndoHandlers.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/selectors/suitcaseSelectors.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/types/sourceTab.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/utils/duplicateCheck.ts` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/PublishCommunityModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/features/diary/TravelDiary.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/gamification/RewardsFreezeNotice.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/home/CuratedGridSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/home/hero/components/FilterSelect.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/home/hero/components/HeroCollapsedBar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/home/hero/components/HeroCompactInputShell.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/home/hero/components/HeroCompactTypingField.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/home/hero/components/HeroExpandableSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/home/hero/components/MultiFilterSelect.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/home/hero/components/SearchBar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/home/hero/HeroAiModule.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/home/hero/heroCompactTokens.ts` | 1 | da correggere (1× Livello A) |
| `src/components/home/hero/heroInspirationPhrases.ts` | 1 | da correggere (1× Livello A) |
| `src/components/home/HeroSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/home/HomeContent.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/itineraries/ItinerariesExplorer.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/itineraries/ItinerariesList.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/itineraries/ItineraryDetail.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/itineraries/ItineraryReviews.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/layout/AppCoordinator.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/layout/AppRouter.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/layout/AppShell.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/layout/Header.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/layout/HeaderCreditsIndicator.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/layout/MainLayout.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/layout/MobileNavBar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/layout/ModalManager.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/layout/ModalManagerTypes.ts` | 1 | da correggere (1× Livello A) |
| `src/components/layout/modals/AdminModals.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/layout/modals/CoreModals.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/layout/modals/FeatureModals.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/layout/NarrativeCompass.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/layout/NewsTicker.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/layout/OnboardingWizard.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/layout/Sidebar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/layout/StaticPage.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/AddToItineraryModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/AiItineraryModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/AroundMeWizard.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/BusinessCardModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/cityInfo/CityEventsTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/cityInfo/CityGuidesTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/cityInfo/CityServicesTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/cityInfo/CityTourOperatorsTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/cityInfo/ServiceAiHunter.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/cityInfo/ServicesCategoryList.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/cityInfo/ServiceSidebar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/CityInfoModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/ConfirmClearModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/CultureCornerModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/DateChangeWarningModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/DuplicateResolutionModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/EmptyDiaryModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/ExportModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/FullRankingsModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/GeneralModals.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/GlobalSectionView.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/GpsAlertModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/GpsErrorModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/HistoryModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/LevelUpModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/LimitWarningModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/MobileMoveModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/PatronSaintModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/PoiClaimModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/poiDetail/PoiImageSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/poiDetail/PoiInfoSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/PoiDetailModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/ProvinceModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/QuotaExceededModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/RemoveItemModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/ReviewModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/RoadbookModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/SaveAsModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/sectionPreview/PreviewGallery.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/sectionPreview/PreviewHero.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/sectionPreview/PreviewRatings.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/sectionPreview/PreviewSidebar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/SectionPreviewModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/SetUsernameModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/ShareModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/shell/BaseFullscreenModalShell.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/sponsor/SponsorForm.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/sponsor/SponsorPricingSelector.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/sponsor/SponsorSuccess.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/sponsor/SponsorTypeSelector.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/SponsorModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/SuggestionModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/SuggestionReviewModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/TimeConflictModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/UnsavedChangesModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/modals/UserUpgradeModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/CreateDiaryModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/CreateSuitcaseModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/MySpaceCityThumbCollage.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/MySpaceExplorerRoot.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/MySpaceFavoritesRoot.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/MySpaceInvitesRoot.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/MySpaceMinimalShell.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/MySpaceRootNav.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/MySpaceToolsRoot.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/MySpaceTripsCatalog.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/MySpaceViaggioCoverPreview.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/MySpaceViaggioDeleteModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/RicordamiConfigModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/ViaggioAllegatiSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/ViaggioAssociationFields.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/ViaggioFolderShell.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/ViaggioMappaGoogleEmbed.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/ViaggioMappaSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/ViaggioRicordamiControl.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/ViaggioRicordiSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myspace/ViaggioRoadbookSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myworld/MyWorldBreadcrumb.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/myworld/MyWorldChooserPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/pdf/PdfStyles.ts` | 1 | da correggere (1× Livello A) |
| `src/components/pdf/RoadbookDocument.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/pdf/TravelDocument.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/photos/CommunityPhotoPublishModal.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/photos/CommunityPhotoWorkflow.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/photos/InAppCameraCapture.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/photos/PhotoAcquireDialog.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/platform/FeatureFlagPausedBanner.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/rankings/CityRow.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/rankings/PhotoGrid.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/rankings/PoiList.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/rankings/RankingFilters.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/save/DocumentSaveStatus.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/shop/BottegaSponsorCard.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/shop/ProductDetailOverlay.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/shop/ShopBioOverlay.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/shop/ShopCard.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/shop/ShopCategoryView.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/shop/ShopDetailView.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/shop/ShopHeader.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/shop/ShopHero.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/shop/ShopHomeView.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/shop/ShopInfo.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/shop/ShopPage.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/shop/ShopProducts.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/shop/ShopReviews.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/shop/ShopSponsorColumn.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/ui/controls/CloseButton.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/ui/header/HeaderPopover.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/user/BusinessShopManager.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/user/dashboard/UserFriendsTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/user/dashboard/UserMessagesTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/user/dashboard/UserNotificationsTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/user/dashboard/UserOverviewTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/user/dashboard/UserSettingsTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/user/dashboard/UserSharingTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/user/dashboard/UserSidebar.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/user/dashboard/UserSuitcasesTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/user/dashboard/UserWalletTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/user/profile/ProfileIdentityFields.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/user/referral/SocialCardGenerator.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/user/UserDashboard.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/GlobalWorkspacePanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/GlobalWorkspacePanelBody.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/sections/AllegatiCategoryPanel.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/sections/AllegatiSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/sections/AttivitaSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/sections/CondivisioneSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/sections/InvitiSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/sections/UtentiSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/sections/WorkspaceBlockedUsersSubsection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/sections/WorkspaceCard.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/sections/WorkspaceSection.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/WorkspaceBinderTab.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/WorkspacePanelContext.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/WorkspaceSectionNav.tsx` | 1 | da correggere (1× Livello A) |
| `src/components/workspace/global/WorkspaceViaggioShellNav.tsx` | 1 | da correggere (1× Livello A) |
| `src/config/env.ts` | 1 | da correggere (1× Livello A) |
| `src/constants/captionEmojis.ts` | 1 | da correggere (1× Livello A) |
| `src/constants/geoConfig.ts` | 1 | da correggere (1× Livello A) |
| `src/constants/governance.ts` | 1 | da correggere (1× Livello A) |
| `src/constants/layout.ts` | 1 | da correggere (1× Livello A) |
| `src/constants/planTypes.ts` | 1 | da correggere (1× Livello A) |
| `src/constants/platformFeatureFlags.ts` | 1 | da correggere (1× Livello A) |
| `src/constants/services.ts` | 1 | da correggere (1× Livello A) |
| `src/constants/slidePanelMotion.ts` | 1 | da correggere (1× Livello A) |
| `src/context/AiPlannerContext.tsx` | 1 | da correggere (1× Livello A) |
| `src/context/AppProviders.tsx` | 1 | da correggere (1× Livello A) |
| `src/context/BusinessContext.tsx` | 1 | da correggere (1× Livello A) |
| `src/context/CityEditorContext.tsx` | 1 | da correggere (1× Livello A) |
| `src/context/CollaborationLiveContext.tsx` | 1 | da correggere (1× Livello A) |
| `src/context/ConfigContext.tsx` | 1 | da correggere (1× Livello A) |
| `src/context/DiaryInteractionContext.tsx` | 1 | da correggere (1× Livello A) |
| `src/context/GpsContext.tsx` | 1 | da correggere (1× Livello A) |
| `src/context/InteractionContext.tsx` | 1 | da correggere (1× Livello A) |
| `src/context/ItineraryContext.tsx` | 1 | da correggere (1× Livello A) |
| `src/context/ModalContext.tsx` | 1 | da correggere (1× Livello A) |
| `src/context/NavigationContext.tsx` | 1 | da correggere (1× Livello A) |
| `src/context/PlatformControlContext.tsx` | 1 | da correggere (1× Livello A) |
| `src/context/UIContext.tsx` | 1 | da correggere (1× Livello A) |
| `src/context/useDiaryInteractionsContext.ts` | 1 | da correggere (1× Livello A) |
| `src/context/useNavigation.ts` | 1 | da correggere (1× Livello A) |
| `src/context/UserContext.tsx` | 1 | da correggere (1× Livello A) |
| `src/data/ai/eventTaxonomy.ts` | 1 | da correggere (1× Livello A) |
| `src/data/ai/prompts.ts` | 1 | da correggere (1× Livello A) |
| `src/data/system/designRules.ts` | 1 | da correggere (1× Livello A) |
| `src/data/system/designTokens.ts` | 1 | da correggere (1× Livello A) |
| `src/data/system/foundationDesignRules.ts` | 1 | da correggere (1× Livello A) |
| `src/data/system/foundationSettingsCatalog.ts` | 1 | da correggere (1× Livello A) |
| `src/data/system/myWorldSettingsCatalog.ts` | 1 | da correggere (1× Livello A) |
| `src/data/system/permissions.ts` | 1 | da correggere (1× Livello A) |
| `src/data/ui/heroConstants.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/collaboration/permissions.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/collaboration/resourceInvite.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/collaboration/workspaceComposition.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/collaboration/workspacePermissions.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/designSystem/designSnapshot.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/diary/diaryAuthorTracking.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/diary/diaryNotesState.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/diary/itineraryDistance.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/diary/poiCatalogSync.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/gamification/rewardsGate.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/geo/nearestCity.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/packing/categorySetupUx.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/packing/itemDisplayOrder.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/packing/packingCategories.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/packing/packingDomainCatalog.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/packing/packingDomainCatalogValidation.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/packing/packingQaFixtures.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/packing/packingTemplateComposition.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/photos/assertPhotographWrite.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/photos/photoCaption.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/photos/photoFilters.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/photos/photograph.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/photos/photographQuery.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/photos/photoOfficial.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/placeholders/platformPlaceholderOrigin.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/placeholders/platformPlaceholderRegistry.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/platformControl/auditPresentation.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/platformControl/evaluateFeatureFlag.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/platformControl/platformAudience.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/platformControl/platformFlagCache.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/platformControl/scheduleClock.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/platformControl/scheduleRowStatus.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/poi/resolvePoiDisplayImageUrl.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/save/documentSaveRegistry.ts` | 1 | da correggere (1× Livello A) |
| `src/domain/save/documentSaveTypes.ts` | 1 | da correggere (1× Livello A) |
| `src/focus/exitGate/documentExitRegistry.ts` | 1 | da correggere (1× Livello A) |
| `src/focus/FocusIdleBoundary.tsx` | 1 | da correggere (1× Livello A) |
| `src/focus/FocusModeContext.tsx` | 1 | da correggere (1× Livello A) |
| `src/focus/focusModeRegistry.ts` | 1 | da correggere (1× Livello A) |
| `src/focus/focusWorkspacePresentation.ts` | 1 | da correggere (1× Livello A) |
| `src/focus/useWorkspaceCloseRegistration.ts` | 1 | da correggere (1× Livello A) |
| `src/focus/useWorkspaceSessionEnd.ts` | 1 | da correggere (1× Livello A) |
| `src/focus/workspaceCloseRegistry.ts` | 1 | da correggere (1× Livello A) |
| `src/focus/WorkspaceHost.tsx` | 1 | da correggere (1× Livello A) |
| `src/focus/workspaceSessionRegistry.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/import/useImportActions.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/import/useImportData.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/people/usePeopleAI.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/people/usePeopleData.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/useAdminCityEditorLogic.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/useAffiliateAnalytics.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/useAiCompleteCity.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/useAiFlashSearch.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/useAiMagicCity.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/useAiTargetedSearch.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/useAiTaskRunner.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/useAiValidation.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/useDuplicateFinder.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/usePeopleManager.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/usePhotoModeration.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/usePoiActions.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/usePoiFilters.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/useServiceRegeneration.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/useSocialCanvasLogic.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/useSocialTemplates.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/useSponsorData.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/useSponsorStats.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/admin/useStrategicMap.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/collaboration/useCollaborationLiveSession.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/community/useLiveFeedUpload.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/core/useAppInitialization.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/core/useAppUI.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/core/useGpsManager.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/features/useDiaryInteractions.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/features/useNavigationController.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/features/useShopNavigation.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/features/useSponsorFormLogic.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/photos/useCanCapturePhoto.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/photos/useCommunityPhotoPublish.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/save/useAppExitProtection.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/save/useDiaryDocumentSave.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/save/useSuitcaseDocumentSave.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/suitcase/aiSuggestions.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/suitcase/createWorkspaceFromConfiguration.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/suitcase/useAffiliateGear.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/suitcase/useHiddenCategories.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/suitcase/useSuitcaseCrud.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/suitcase/useSuitcaseLinking.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/suitcase/useSuitcaseTemplates.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/suitcase/useUserSuitcases.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/ui/useBelowLg.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/ui/useControlledSlidePanel.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/ui/useFlipSwap.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/ui/useHeroLogic.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/ui/useHeroStackedLayout.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/ui/useHideOnScrollDown.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/ui/useMobileCompact.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/ui/useMobileDetect.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/ui/useMobileDiaryOverlayGeometry.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/ui/useScrollUI.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/ui/useTypingCycle.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useAdminData.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useAdminExport.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useAffiliate.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useAiGeneration.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useAIPlanner.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useAiRuntimeGate.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useAnchoredPortalPosition.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useAppRouter.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useAreRewardsEnabled.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useAutoRotateSuggestions.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useCityData.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useCityEditorForm.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useCityGallery.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useCityGenerator.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useCityList.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useCloseOnEscape.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useDiaryLogic.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useDiaryPoiCatalogUpdatePrompt.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useDiaryUndo.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useDocumentTitle.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useDynamicContent.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useDynamicStyles.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useFoundationStyles.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useGlobalModalEscape.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useJourneyPhase.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useLogoRasterizer.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useMyWorldStyles.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useNewsTicker.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useOpenAddElementToWorkspace.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useOpenCollaborationShare.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useOpenCreateWorkspace.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useOpenMyWorld.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useOpenWorkspaceFromViaggio.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/usePagination.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/usePartnerIntegrations.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/usePersistedState.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/usePlatformControlTypography.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/usePoiForm.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useRankingsLogic.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useReferralTracking.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useResourcePermission.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useResourceWorkspaces.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useShare.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useSharedResourceIndicator.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useSponsorExport.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useSponsorLogic.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useSponsorModalLogic.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useSponsorModals.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useSponsorOperations.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useSuitcaseSystem.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useSystemMessage.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useUndoStack.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useUserDashboardData.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useVirtualWindow.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useWorkspaceDashboard.ts` | 1 | da correggere (1× Livello A) |
| `src/hooks/useWorkspaceResourceNavigation.ts` | 1 | da correggere (1× Livello A) |
| `src/index.css` | 1 | da correggere (1× Livello A) |
| `src/index.tsx` | 1 | da correggere (1× Livello A) |
| `src/layering/layerRegistry.ts` | 1 | da correggere (1× Livello A) |
| `src/layering/resolveWorkspacePanelZIndex.ts` | 1 | da correggere (1× Livello A) |
| `src/myspace/mySpaceNavMemory.ts` | 1 | da correggere (1× Livello A) |
| `src/myspace/mySpaceRoots.ts` | 1 | da correggere (1× Livello A) |
| `src/myworld/myWorldSession.ts` | 1 | da correggere (1× Livello A) |
| `src/services/affiliateAdminService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/affiliateTrackingService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/ai.ts` | 1 | da correggere (1× Livello A) |
| `src/services/ai/aiChat.ts` | 1 | da correggere (1× Livello A) |
| `src/services/ai/aiEdgeErrors.ts` | 1 | da correggere (1× Livello A) |
| `src/services/ai/aiGateway.ts` | 1 | da correggere (1× Livello A) |
| `src/services/ai/aiLegacyPayload.ts` | 1 | da correggere (1× Livello A) |
| `src/services/ai/aiPlanner.ts` | 1 | da correggere (1× Livello A) |
| `src/services/ai/aiRuntimeStatus.ts` | 1 | da correggere (1× Livello A) |
| `src/services/ai/aiText.ts` | 1 | da correggere (1× Livello A) |
| `src/services/ai/aiUtils.ts` | 1 | da correggere (1× Livello A) |
| `src/services/ai/aiVision.ts` | 1 | da correggere (1× Livello A) |
| `src/services/ai/generators/cityContentGenerator.ts` | 1 | da correggere (1× Livello A) |
| `src/services/ai/generators/listGenerator.ts` | 1 | da correggere (1× Livello A) |
| `src/services/ai/generators/peopleGenerator.ts` | 1 | da correggere (1× Livello A) |
| `src/services/ai/generators/poiGenerator.ts` | 1 | da correggere (1× Livello A) |
| `src/services/ai/generators/qualityGenerator.ts` | 1 | da correggere (1× Livello A) |
| `src/services/ai/legacyExtraQuotaCompat.ts` | 1 | da correggere (1× Livello A) |
| `src/services/ai/providers/supabaseProvider.ts` | 1 | da correggere (1× Livello A) |
| `src/services/ai/types.ts` | 1 | da correggere (1× Livello A) |
| `src/services/ai/utils/taxonomyUtils.ts` | 1 | da correggere (1× Livello A) |
| `src/services/aiConfigService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/aiPlannerService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/aiUsageService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/auth/authIdentity.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/cityAdminApi.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/cityCache.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/cityIdService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/cityLifecycleService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/cityMediaService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/cityPayloadMapper.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/cityReadService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/cityUpdateService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/cityWriteService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/entitiesService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/parsers/content/mergePatronDetailsFromAi.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/parsers/content/parseLogs.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/parsers/content/parsePatron.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/parsers/content/parseRatings.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/parsers/entities/famousPersonAudience.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/parsers/entities/parseEvent.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/parsers/entities/parseGuide.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/parsers/entities/parsePerson.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/parsers/entities/parseService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/parsers/entities/parseTourOperator.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/parsers/media/parseGallery.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/parsers/media/parseMediaAsset.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/parsers/shared/ensureArray.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/parsers/shared/ensureNumber.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/parsers/shared/ensureString.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/poi/poiMapper.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/poi/poiRead.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/poiService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/city/tourOperatorService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/cityService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/collaborationLiveConfig.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/collaborationLivePresentation.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/collaborationNotificationPrefsService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/collaborationNotificationService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/collaborationProfileService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/collaborationUserSearchService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/diaryCollaborationService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/domainEventService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/friendService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/index.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/permissionService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/personalShareService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/resourceInviteNotificationHelper.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/resourceInviteService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/shareableResourceOwnerLookup.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/sharedResourceAclService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/sharedResourceLockService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/sharedResourceMappers.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/sharedResourceOwnershipVerifiers.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/sharedResourceService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/suitcaseCollaborationService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/userBlockService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/workspaceAccessLookup.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/workspaceAttachmentService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/workspaceComposition/index.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/workspaceComposition/materializeWorkspaceComposition.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/workspaceComposition/resolveWorkspaceCompositionBlueprint.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/workspaceComposition/resolveWorkspaceCompositionCatalog.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/workspaceCompositionService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/workspaceEngineConfigService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/workspaceInviteNotifications.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/workspaceInvitePersistence.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/workspaceInviteService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/workspaceInviteValidation.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/workspaceMappers.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/workspaceMemberAclSync.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/workspaceMemberService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/workspaceNotificationHelper.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/workspaceResourceLinkLookup.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/workspaceResourcePresentation.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/workspaceResourceService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/collaboration/workspaceService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/communicationService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/community/businessStatsService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/community/interactionService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/community/postService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/community/reviewService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/community/suggestionService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/communityService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/dataService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/gamificationService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/geo.ts` | 1 | da correggere (1× Livello A) |
| `src/services/geoRegistryService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/globalEventsService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/importAutomationService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/importService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/marketingService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/mediaService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/myspace/favoritesEntityRead.ts` | 1 | da correggere (1× Livello A) |
| `src/services/myspace/userFavoritesService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/myspace/userVisitedCitiesService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/notificationService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/partnerIntegrationService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/photoMapper.ts` | 1 | da correggere (1× Livello A) |
| `src/services/photoService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/platformControl/messageTemplateService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/platformControl/platformControlMapper.ts` | 1 | da correggere (1× Livello A) |
| `src/services/platformControl/platformControlService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/platformControl/resolvePlatformUserMessage.ts` | 1 | da correggere (1× Livello A) |
| `src/services/profileService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/settingsService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/socialMarketingService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/sponsors/_internalTypes.ts` | 1 | da correggere (1× Livello A) |
| `src/services/sponsors/index.ts` | 1 | da correggere (1× Livello A) |
| `src/services/sponsors/sponsorActivationService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/sponsors/sponsorAdminStubs.ts` | 1 | da correggere (1× Livello A) |
| `src/services/sponsors/sponsorContractsService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/sponsors/sponsorDashboardService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/sponsors/sponsorLegacyAdapter.ts` | 1 | da correggere (1× Livello A) |
| `src/services/sponsors/sponsorMessagesService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/sponsors/sponsorRatingService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/sponsors/sponsorRequestsService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/sponsors/sponsorResolvers.ts` | 1 | da correggere (1× Livello A) |
| `src/services/sponsors/sponsorStatsService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/sponsorService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/stagingService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/storageService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/subscriptionService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/suitcase/associateSuitcaseWithDiary.ts` | 1 | da correggere (1× Livello A) |
| `src/services/suitcase/packingCatalogService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/suitcase/packingCompositionService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/suitcase/packingSeedService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/suitcase/prepareForAssociation.ts` | 1 | da correggere (1× Livello A) |
| `src/services/suitcase/suitcaseAffiliateService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/suitcase/suitcaseCoreService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/suitcase/suitcaseDocumentSaveService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/suitcase/suitcaseEditorialService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/suitcase/suitcaseGuestService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/suitcase/suitcaseLinkingService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/suitcase/suitcaseRejectionsService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/suitcase/suitcaseTemplateService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/suitcaseService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/supabaseClient.ts` | 1 | da correggere (1× Livello A) |
| `src/services/taxonomyService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/userService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/viaggio/resourceAssociationService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/viaggio/viaggioAttachmentService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/viaggio/viaggioCityService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/viaggio/viaggioDiaryService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/viaggio/viaggioMappaUnion.ts` | 1 | da correggere (1× Livello A) |
| `src/services/viaggio/viaggioMappers.ts` | 1 | da correggere (1× Livello A) |
| `src/services/viaggio/viaggioRicordamiService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/viaggio/viaggioRicordiDayStructure.ts` | 1 | da correggere (1× Livello A) |
| `src/services/viaggio/viaggioRicordiService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/viaggio/viaggioRiepilogoService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/viaggio/viaggioService.ts` | 1 | da correggere (1× Livello A) |
| `src/services/zoneService.ts` | 1 | da correggere (1× Livello A) |
| `src/types/ai.ts` | 1 | da correggere (1× Livello A) |
| `src/types/ai/cityGeneration.ts` | 1 | da correggere (1× Livello A) |
| `src/types/cityPreview.ts` | 1 | da correggere (1× Livello A) |
| `src/types/core.ts` | 1 | da correggere (1× Livello A) |
| `src/types/database.ts` | 1 | da correggere (1× Livello A) |
| `src/types/designSystem.ts` | 1 | da correggere (1× Livello A) |
| `src/types/domain/index.ts` | 1 | da correggere (1× Livello A) |
| `src/types/index.ts` | 1 | da correggere (1× Livello A) |
| `src/types/marketing.ts` | 1 | da correggere (1× Livello A) |
| `src/types/models/City.ts` | 1 | da correggere (1× Livello A) |
| `src/types/models/Itinerary.ts` | 1 | da correggere (1× Livello A) |
| `src/types/models/Media.ts` | 1 | da correggere (1× Livello A) |
| `src/types/models/Social.ts` | 1 | da correggere (1× Livello A) |
| `src/types/models/Sponsor.ts` | 1 | da correggere (1× Livello A) |
| `src/types/models/Viaggio.ts` | 1 | da correggere (1× Livello A) |
| `src/types/models/ViaggioAttachment.ts` | 1 | da correggere (1× Livello A) |
| `src/types/partners.ts` | 1 | da correggere (1× Livello A) |
| `src/types/platformControl.ts` | 1 | da correggere (1× Livello A) |
| `src/types/shared.ts` | 1 | da correggere (1× Livello A) |
| `src/types/shared/index.ts` | 1 | da correggere (1× Livello A) |
| `src/types/shared/primitives.ts` | 1 | da correggere (1× Livello A) |
| `src/types/shared/SponsorStatus.ts` | 1 | da correggere (1× Livello A) |
| `src/types/subscriptions.ts` | 1 | da correggere (1× Livello A) |
| `src/types/supabase.ts` | 1 | da correggere (1× Livello A) |
| `src/types/users.ts` | 1 | da correggere (1× Livello A) |
| `src/types/write/index.ts` | 1 | da correggere (1× Livello A) |
| `src/types/write/poiForm.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/affiliateNetwork.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/aiAffiliateRenderer.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/common.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/countBadge.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/dateFormatters.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/deriveItineraryCityTypes.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/exportGenerators.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/fileValidation.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/formatRelativeActivity.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/guestSuitcaseHelper.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/heroCoverCollagePlan.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/imageOptimizer.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/itineraryAssociability.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/jsonSerialization.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/marketingTierUtils.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/media.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/pdfImagePipelineLog.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/pdfUtils.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/safeTypes.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/scheduleUtils.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/seo.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/sponsorValidation.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/stringUtils.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/suitcaseAssociation.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/suitcaseCategoryDelete.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/suitcaseDomain.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/tagDerivation.ts` | 1 | da correggere (1× Livello A) |
| `src/utils/userUtils.ts` | 1 | da correggere (1× Livello A) |
| `tsconfig.app.json` | 1 | da correggere (1× Livello A) |
| `tsconfig.json` | 1 | da correggere (1× Livello A) |
| `tsconfig.scripts.json` | 1 | da correggere (1× Livello A) |
| `vite.config.ts` | 1 | da correggere (1× Livello A) |

Nota: il dettaglio riga e riproducibile in qualsiasi momento con `npx biome check --reporter=json` filtrato sulla categoria.

