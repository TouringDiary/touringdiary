# useExhaustiveDependencies

> Dettaglio baseline Biome full-project. Dashboard: [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md)

| Campo | Valore |
|----|----|
| **Documento** | `AI_QUALITY/biome/C_useExhaustiveDependencies.md` |
| **Categorie** | `lint/correctness/useExhaustiveDependencies` |
| **Occorrenze (somma gruppo)** | **204** |
| **File unici nel gruppo** | **110** |
| **Livello** | **C** |
| **Ultimo aggiornamento** | 2026-08-03 |
| **Stato** | Baseline ufficiale — nessuna correzione applicata in questa attivita |

## `lint/correctness/useExhaustiveDependencies`

### Descrizione della regola

Dipendenze di hook React incomplete o eccessive.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/correctness/useExhaustiveDependencies` |
| **Occorrenze totali** | **204** |
| **Error** | 204 |
| **Warning** | 0 |
| **Info** | 0 |
| **File coinvolti** | **110** |
| **Livello di rischio** | **C** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Deps React: rischio loop/stale closure; review architetturale/hook.

### Strategia di correzione

Review hook-by-hook; non autofix cieco.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/components/layout/ModalManager.tsx` | 18 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcasePanelData.ts` | 7 |
| `src/components/modals/PoiClaimModal.tsx` | 6 |
| `src/hooks/ui/useHeroLogic.ts` | 6 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseAffiliate.ts` | 5 |
| `src/components/admin/platformControl/SchedulePanel.tsx` | 4 |
| `src/hooks/admin/import/useImportActions.ts` | 4 |
| `src/hooks/useCityGallery.ts` | 4 |
| `src/components/admin/AdminTaxonomyManager.tsx` | 3 |
| `src/components/admin/PartnerDetailModal.tsx` | 3 |
| `src/components/admin/platformControl/MessageTemplateEditor.tsx` | 3 |
| `src/components/aiPlanner/AiPlannerForm.tsx` | 3 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcasePanelComposition.ts` | 3 |
| `src/components/itineraries/ItineraryDetail.tsx` | 3 |
| `src/components/modals/ExportModal.tsx` | 3 |
| `src/components/user/dashboard/UserMessagesTab.tsx` | 3 |
| `src/components/admin/AdminAiAssistant.tsx` | 2 |
| `src/components/admin/AdminControlCenterAI.tsx` | 2 |
| `src/components/admin/AdminPhotoInspector.tsx` | 2 |
| `src/components/admin/cityEditor/services/ServiceEvents.tsx` | 2 |
| `src/components/admin/cityEditor/services/ServiceGeneric.tsx` | 2 |
| `src/components/admin/cityEditor/services/ServiceGuides.tsx` | 2 |
| `src/components/admin/cityEditor/services/ServiceOperators.tsx` | 2 |
| `src/components/admin/GlobalEventsManager.tsx` | 2 |
| `src/components/admin/observatory/AnomalyInspector.tsx` | 2 |
| `src/components/common/ImageWithFallback.tsx` | 2 |
| `src/components/community/QaForumTab.tsx` | 2 |
| `src/components/features/diary/ItineraryItemCard.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/AffiliateSuggestionBox.tsx` | 2 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseItemActions.ts` | 2 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx` | 2 |
| `src/components/home/CuratedGridSection.tsx` | 2 |
| `src/components/itineraries/ItineraryReviews.tsx` | 2 |
| `src/components/layout/OnboardingWizard.tsx` | 2 |
| `src/components/modals/AddToItineraryModal.tsx` | 2 |
| `src/components/modals/AiItineraryModal.tsx` | 2 |
| `src/components/myspace/ViaggioRicordamiControl.tsx` | 2 |
| `src/components/user/dashboard/UserReferralTab.tsx` | 2 |
| `src/components/workspace/global/WorkspaceViaggioShellNav.tsx` | 2 |
| `src/context/CityEditorContext.tsx` | 2 |
| `src/context/ItineraryContext.tsx` | 2 |
| `src/context/UserContext.tsx` | 2 |
| `src/hooks/admin/usePhotoModeration.ts` | 2 |
| `src/hooks/admin/useSponsorData.ts` | 2 |
| `src/hooks/suitcase/useHiddenCategories.ts` | 2 |
| `src/hooks/usePartnerIntegrations.ts` | 2 |
| `src/hooks/useRankingsLogic.ts` | 2 |
| `src/hooks/useSponsorLogic.ts` | 2 |
| `src/components/admin/AdminCommunications.tsx` | 1 |
| `src/components/admin/AdminGamification.tsx` | 1 |
| `src/components/admin/AdminImageInput.tsx` | 1 |
| `src/components/admin/AiEconomicsDashboard.tsx` | 1 |
| `src/components/admin/cities/CitiesListTab.tsx` | 1 |
| `src/components/admin/cities/CityAuditModal.tsx` | 1 |
| `src/components/admin/cities/ProcessLogModal.tsx` | 1 |
| `src/components/admin/cityEditor/EditorCulture.tsx` | 1 |
| `src/components/admin/communications/AiChatAssistant.tsx` | 1 |
| `src/components/admin/communications/CommsTemplates.tsx` | 1 |
| `src/components/admin/design/StyleEditor.tsx` | 1 |
| `src/components/admin/economics/AdminAiAnalyticsV4.tsx` | 1 |
| `src/components/admin/economics/PricingManager.tsx` | 1 |
| `src/components/admin/import/ImportOsmModal.tsx` | 1 |
| `src/components/admin/LoadingTipsManager.tsx` | 1 |
| `src/components/admin/marketing/AdminCreditPackages.tsx` | 1 |
| `src/components/admin/MarketingManager.tsx` | 1 |
| `src/components/admin/NewsTickerManager.tsx` | 1 |
| `src/components/admin/observatory/ObservatoryLayout.tsx` | 1 |
| `src/components/admin/poiManager/PoiList.tsx` | 1 |
| `src/components/admin/SuggestionManager.tsx` | 1 |
| `src/components/city/tabs/CityCategoryTab.tsx` | 1 |
| `src/components/common/CitySelector.tsx` | 1 |
| `src/components/community/LiveFeedTab.tsx` | 1 |
| `src/components/community/UserPhotoEditor.tsx` | 1 |
| `src/components/features/diary/notes/DiaryNotesTabs.tsx` | 1 |
| `src/components/features/diary/notes/DiaryNoteTabMenu.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/CategoryItemsGrid.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/CategorySuggestionPanel.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseHeader.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseItemRow.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/TemplatePreview.tsx` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseUndo.ts` | 1 |
| `src/components/features/diary/TravelDiary.tsx` | 1 |
| `src/components/home/hero/components/HeroCompactTypingField.tsx` | 1 |
| `src/components/home/hero/HeroAiModule.tsx` | 1 |
| `src/components/home/HeroSection.tsx` | 1 |
| `src/components/itineraries/ItinerariesList.tsx` | 1 |
| `src/components/modals/AroundMeWizard.tsx` | 1 |
| `src/components/modals/AuthModal.tsx` | 1 |
| `src/components/modals/cityInfo/CityGuidesTab.tsx` | 1 |
| `src/components/modals/poiDetail/PoiImageSection.tsx` | 1 |
| `src/components/modals/ProvinceModal.tsx` | 1 |
| `src/components/modals/ReviewModal.tsx` | 1 |
| `src/components/modals/sponsor/SponsorForm.tsx` | 1 |
| `src/components/modals/SuggestionReviewModal.tsx` | 1 |
| `src/components/shop/ShopHero.tsx` | 1 |
| `src/components/ui/CarouselPositionIndicator.tsx` | 1 |
| `src/components/workspace/global/WorkspacePanelContext.tsx` | 1 |
| `src/context/BusinessContext.tsx` | 1 |
| `src/context/PlatformControlContext.tsx` | 1 |
| `src/hooks/admin/useAffiliateAnalytics.ts` | 1 |
| `src/hooks/core/useAppInitialization.ts` | 1 |
| `src/hooks/photos/useCommunityPhotoPublish.ts` | 1 |
| `src/hooks/save/useDocumentSaveController.ts` | 1 |
| `src/hooks/suitcase/useSuitcaseTemplates.ts` | 1 |
| `src/hooks/suitcase/useUserSuitcases.ts` | 1 |
| `src/hooks/useAppRouter.ts` | 1 |
| `src/hooks/useDiaryLogic.ts` | 1 |
| `src/hooks/usePagination.ts` | 1 |
| `src/hooks/useUserDashboardData.ts` | 1 |
| `src/hooks/useVirtualWindow.ts` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

Occorrenze totali: **204** (sopra soglia elenco riga-per-riga). Inventario sintetico per file:

| File | Occorrenze | Decisione baseline per-file |
|---|---:|---|
| `src/components/layout/ModalManager.tsx` | 18 | da correggere (18× Livello C) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcasePanelData.ts` | 7 | da correggere (7× Livello C) |
| `src/components/modals/PoiClaimModal.tsx` | 6 | da correggere (6× Livello C) |
| `src/hooks/ui/useHeroLogic.ts` | 6 | da correggere (6× Livello C) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseAffiliate.ts` | 5 | da correggere (5× Livello C) |
| `src/components/admin/platformControl/SchedulePanel.tsx` | 4 | da correggere (4× Livello C) |
| `src/hooks/admin/import/useImportActions.ts` | 4 | da correggere (4× Livello C) |
| `src/hooks/useCityGallery.ts` | 4 | da correggere (4× Livello C) |
| `src/components/admin/AdminTaxonomyManager.tsx` | 3 | da correggere (3× Livello C) |
| `src/components/admin/PartnerDetailModal.tsx` | 3 | da correggere (3× Livello C) |
| `src/components/admin/platformControl/MessageTemplateEditor.tsx` | 3 | da correggere (3× Livello C) |
| `src/components/aiPlanner/AiPlannerForm.tsx` | 3 | da correggere (3× Livello C) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcasePanelComposition.ts` | 3 | da correggere (3× Livello C) |
| `src/components/itineraries/ItineraryDetail.tsx` | 3 | da correggere (3× Livello C) |
| `src/components/modals/ExportModal.tsx` | 3 | da correggere (3× Livello C) |
| `src/components/user/dashboard/UserMessagesTab.tsx` | 3 | da correggere (3× Livello C) |
| `src/components/admin/AdminAiAssistant.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/admin/AdminControlCenterAI.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/admin/AdminPhotoInspector.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/admin/cityEditor/services/ServiceEvents.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/admin/cityEditor/services/ServiceGeneric.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/admin/cityEditor/services/ServiceGuides.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/admin/cityEditor/services/ServiceOperators.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/admin/GlobalEventsManager.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/admin/observatory/AnomalyInspector.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/common/ImageWithFallback.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/community/QaForumTab.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/features/diary/ItineraryItemCard.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/features/diary/packing_list/suitcase/AffiliateSuggestionBox.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseItemActions.ts` | 2 | da correggere (2× Livello C) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/home/CuratedGridSection.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/itineraries/ItineraryReviews.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/layout/OnboardingWizard.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/modals/AddToItineraryModal.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/modals/AiItineraryModal.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/myspace/ViaggioRicordamiControl.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/user/dashboard/UserReferralTab.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/workspace/global/WorkspaceViaggioShellNav.tsx` | 2 | da correggere (2× Livello C) |
| `src/context/CityEditorContext.tsx` | 2 | da correggere (2× Livello C) |
| `src/context/ItineraryContext.tsx` | 2 | da correggere (2× Livello C) |
| `src/context/UserContext.tsx` | 2 | da correggere (2× Livello C) |
| `src/hooks/admin/usePhotoModeration.ts` | 2 | da correggere (2× Livello C) |
| `src/hooks/admin/useSponsorData.ts` | 2 | da correggere (2× Livello C) |
| `src/hooks/suitcase/useHiddenCategories.ts` | 2 | da correggere (2× Livello C) |
| `src/hooks/usePartnerIntegrations.ts` | 2 | da correggere (2× Livello C) |
| `src/hooks/useRankingsLogic.ts` | 2 | da correggere (2× Livello C) |
| `src/hooks/useSponsorLogic.ts` | 2 | da correggere (2× Livello C) |
| `src/components/admin/AdminCommunications.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/AdminGamification.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/AdminImageInput.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/AiEconomicsDashboard.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/cities/CitiesListTab.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/cities/CityAuditModal.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/cities/ProcessLogModal.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/cityEditor/EditorCulture.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/communications/AiChatAssistant.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/communications/CommsTemplates.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/design/StyleEditor.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/economics/AdminAiAnalyticsV4.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/economics/PricingManager.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/import/ImportOsmModal.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/LoadingTipsManager.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/marketing/AdminCreditPackages.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/MarketingManager.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/NewsTickerManager.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/observatory/ObservatoryLayout.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/poiManager/PoiList.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/admin/SuggestionManager.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/city/tabs/CityCategoryTab.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/common/CitySelector.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/community/LiveFeedTab.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/community/UserPhotoEditor.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/features/diary/notes/DiaryNotesTabs.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/features/diary/notes/DiaryNoteTabMenu.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/features/diary/packing_list/suitcase/CategoryItemsGrid.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/features/diary/packing_list/suitcase/CategorySuggestionPanel.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseHeader.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseItemRow.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/features/diary/packing_list/suitcase/TemplatePreview.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseUndo.ts` | 1 | da correggere (1× Livello C) |
| `src/components/features/diary/TravelDiary.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/home/hero/components/HeroCompactTypingField.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/home/hero/HeroAiModule.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/home/HeroSection.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/itineraries/ItinerariesList.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/modals/AroundMeWizard.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/modals/AuthModal.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/modals/cityInfo/CityGuidesTab.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/modals/poiDetail/PoiImageSection.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/modals/ProvinceModal.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/modals/ReviewModal.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/modals/sponsor/SponsorForm.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/modals/SuggestionReviewModal.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/shop/ShopHero.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/ui/CarouselPositionIndicator.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/workspace/global/WorkspacePanelContext.tsx` | 1 | da correggere (1× Livello C) |
| `src/context/BusinessContext.tsx` | 1 | da correggere (1× Livello C) |
| `src/context/PlatformControlContext.tsx` | 1 | da correggere (1× Livello C) |
| `src/hooks/admin/useAffiliateAnalytics.ts` | 1 | da correggere (1× Livello C) |
| `src/hooks/core/useAppInitialization.ts` | 1 | da correggere (1× Livello C) |
| `src/hooks/photos/useCommunityPhotoPublish.ts` | 1 | da correggere (1× Livello C) |
| `src/hooks/save/useDocumentSaveController.ts` | 1 | da correggere (1× Livello C) |
| `src/hooks/suitcase/useSuitcaseTemplates.ts` | 1 | da correggere (1× Livello C) |
| `src/hooks/suitcase/useUserSuitcases.ts` | 1 | da correggere (1× Livello C) |
| `src/hooks/useAppRouter.ts` | 1 | da correggere (1× Livello C) |
| `src/hooks/useDiaryLogic.ts` | 1 | da correggere (1× Livello C) |
| `src/hooks/usePagination.ts` | 1 | da correggere (1× Livello C) |
| `src/hooks/useUserDashboardData.ts` | 1 | da correggere (1× Livello C) |
| `src/hooks/useVirtualWindow.ts` | 1 | da correggere (1× Livello C) |

Nota: il dettaglio riga e riproducibile in qualsiasi momento con `npx biome check --reporter=json` filtrato sulla categoria.

