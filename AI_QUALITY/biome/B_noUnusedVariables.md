# noUnusedVariables

> Dettaglio baseline Biome full-project. Dashboard: [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md)

| Campo | Valore |
|----|----|
| **Documento** | `AI_QUALITY/biome/B_noUnusedVariables.md` |
| **Categorie** | `lint/correctness/noUnusedVariables` |
| **Occorrenze (somma gruppo)** | **204** |
| **File unici nel gruppo** | **99** |
| **Livello** | **B** |
| **Ultimo aggiornamento** | 2026-08-03 |
| **Stato** | Baseline ufficiale — nessuna correzione applicata in questa attivita |

## `lint/correctness/noUnusedVariables`

### Descrizione della regola

Variabili dichiarate e non usate.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/correctness/noUnusedVariables` |
| **Occorrenze totali** | **204** |
| **Error** | 0 |
| **Warning** | 204 |
| **Info** | 0 |
| **File coinvolti** | **99** |
| **Livello di rischio** | **B** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Serve capire se binding e WIP, catch, o API contract; non auto-delete.

### Strategia di correzione

Review per binding; rimuovere / usare / prefix _.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx` | 22 |
| `src/components/admin/cityEditor/tabs/TabServices.tsx` | 10 |
| `src/services/storageService.ts` | 9 |
| `src/services/city/cityLifecycleService.ts` | 7 |
| `src/hooks/admin/import/useImportActions.ts` | 6 |
| `src/components/home/HeroSection.tsx` | 5 |
| `src/components/layout/AppRouter.tsx` | 5 |
| `src/services/ai/generators/poiGenerator.ts` | 5 |
| `src/components/admin/design/SafeArtPanel.tsx` | 4 |
| `src/components/admin/GlobalEventsManager.tsx` | 4 |
| `src/components/modals/SuggestionReviewModal.tsx` | 4 |
| `src/hooks/useAiGeneration.ts` | 4 |
| `src/services/ai/aiVision.ts` | 4 |
| `src/components/admin/cities/CitiesListTab.tsx` | 3 |
| `src/components/admin/cities/RegionalAnalysisModal.tsx` | 3 |
| `src/hooks/admin/usePoiActions.ts` | 3 |
| `src/services/importService.ts` | 3 |
| `src/services/mediaService.ts` | 3 |
| `src/components/admin/AdminPhotoInspector.tsx` | 2 |
| `src/components/admin/cityEditor/EditorCulture.tsx` | 2 |
| `src/components/admin/cityEditor/EditorRatings.tsx` | 2 |
| `src/components/admin/observatory/ObservatoryLayout.tsx` | 2 |
| `src/components/admin/social/SocialPreviewConfig.tsx` | 2 |
| `src/components/modals/poiDetail/PoiInfoSection.tsx` | 2 |
| `src/components/modals/SectionPreviewModal.tsx` | 2 |
| `src/components/user/dashboard/UserSidebar.tsx` | 2 |
| `src/context/BusinessContext.tsx` | 2 |
| `src/context/ItineraryContext.tsx` | 2 |
| `src/hooks/admin/people/usePeopleAI.ts` | 2 |
| `src/hooks/admin/people/usePeopleData.ts` | 2 |
| `src/hooks/admin/useAiMagicCity.ts` | 2 |
| `src/hooks/useCityList.ts` | 2 |
| `src/hooks/usePoiManager.ts` | 2 |
| `src/hooks/useUserDashboardData.ts` | 2 |
| `src/services/contentService.ts` | 2 |
| `src/services/photoService.ts` | 2 |
| `src/utils/exportGenerators.ts` | 2 |
| `scripts/seed_geo.js` | 1 |
| `src/components/admin/AdminCommunications.tsx` | 1 |
| `src/components/admin/AdminPoiManager.tsx` | 1 |
| `src/components/admin/AdminTaxonomyManager.tsx` | 1 |
| `src/components/admin/CitiesManager.tsx` | 1 |
| `src/components/admin/cityEditor/culture/CulturePatron.tsx` | 1 |
| `src/components/admin/cityEditor/EditorGeneral.tsx` | 1 |
| `src/components/admin/cityEditor/EditorMedia.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabCulture.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabGeneral.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabMedia.tsx` | 1 |
| `src/components/admin/NewsTickerManager.tsx` | 1 |
| `src/components/admin/observatory/AnomalyInspector.tsx` | 1 |
| `src/components/admin/observatory/ObservatoryFilterDrawer.tsx` | 1 |
| `src/components/admin/photos/PhotoRow.tsx` | 1 |
| `src/components/admin/poiManager/BulkFixProgressModal.tsx` | 1 |
| `src/components/admin/settings/PartnerIntegrationsPanel.tsx` | 1 |
| `src/components/admin/social/AiBackgroundPanel.tsx` | 1 |
| `src/components/admin/SponsorManager.tsx` | 1 |
| `src/components/admin/userManager/EditUserModal.tsx` | 1 |
| `src/components/admin/userManager/UserTable.tsx` | 1 |
| `src/components/city/tabs/CityCategoryTab.tsx` | 1 |
| `src/components/features/diary/DiaryHeader.tsx` | 1 |
| `src/components/features/diary/notes/DiaryNotesPanel.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/AffiliateSuggestionBox.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/tabs/OverrideTab.tsx` | 1 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseSuggestions.ts` | 1 |
| `src/components/layout/modals/AdminModals.tsx` | 1 |
| `src/components/layout/OnboardingWizard.tsx` | 1 |
| `src/components/modals/AiItineraryModal.tsx` | 1 |
| `src/components/modals/PoiClaimModal.tsx` | 1 |
| `src/components/modals/sponsor/SponsorForm.tsx` | 1 |
| `src/components/modals/SponsorModal.tsx` | 1 |
| `src/components/modals/UserUpgradeModal.tsx` | 1 |
| `src/components/myspace/ViaggioRicordamiControl.tsx` | 1 |
| `src/components/user/BusinessShopManager.tsx` | 1 |
| `src/components/user/dashboard/UserMessagesTab.tsx` | 1 |
| `src/components/user/dashboard/UserReferralTab.tsx` | 1 |
| `src/components/user/dashboard/UserSettingsTab.tsx` | 1 |
| `src/components/user/referral/SocialCardGenerator.tsx` | 1 |
| `src/config/env.ts` | 1 |
| `src/hooks/admin/useAiCompleteCity.ts` | 1 |
| `src/hooks/admin/useAiValidation.ts` | 1 |
| `src/hooks/admin/useDuplicateFinder.ts` | 1 |
| `src/hooks/admin/useSocialTemplates.ts` | 1 |
| `src/hooks/core/useAppInitialization.ts` | 1 |
| `src/hooks/features/useDiaryInteractions.ts` | 1 |
| `src/hooks/useDiaryLogic.ts` | 1 |
| `src/hooks/useDocumentTitle.ts` | 1 |
| `src/hooks/usePoiForm.ts` | 1 |
| `src/hooks/useSystemMessage.ts` | 1 |
| `src/services/ai/utils/taxonomyUtils.ts` | 1 |
| `src/services/community/interactionService.ts` | 1 |
| `src/services/community/itineraryService.ts` | 1 |
| `src/services/community/suggestionService.ts` | 1 |
| `src/services/gamificationService.ts` | 1 |
| `src/services/partnerIntegrationService.ts` | 1 |
| `src/services/rankingService.ts` | 1 |
| `src/services/shopService.ts` | 1 |
| `src/services/userService.ts` | 1 |
| `src/types/models/Sponsor.ts` | 1 |
| `src/utils/affiliateNetwork.ts` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

Occorrenze totali: **204** (sopra soglia elenco riga-per-riga). Inventario sintetico per file:

| File | Occorrenze | Decisione baseline per-file |
|---|---:|---|
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx` | 22 | da correggere (22× Livello B) |
| `src/components/admin/cityEditor/tabs/TabServices.tsx` | 10 | da correggere (10× Livello B) |
| `src/services/storageService.ts` | 9 | da correggere (9× Livello B) |
| `src/services/city/cityLifecycleService.ts` | 7 | da correggere (7× Livello B) |
| `src/hooks/admin/import/useImportActions.ts` | 6 | da correggere (6× Livello B) |
| `src/components/home/HeroSection.tsx` | 5 | da correggere (5× Livello B) |
| `src/components/layout/AppRouter.tsx` | 5 | da correggere (5× Livello B) |
| `src/services/ai/generators/poiGenerator.ts` | 5 | da correggere (5× Livello B) |
| `src/components/admin/design/SafeArtPanel.tsx` | 4 | da correggere (4× Livello B) |
| `src/components/admin/GlobalEventsManager.tsx` | 4 | da correggere (4× Livello B) |
| `src/components/modals/SuggestionReviewModal.tsx` | 4 | da correggere (4× Livello B) |
| `src/hooks/useAiGeneration.ts` | 4 | da correggere (4× Livello B) |
| `src/services/ai/aiVision.ts` | 4 | da correggere (4× Livello B) |
| `src/components/admin/cities/CitiesListTab.tsx` | 3 | da correggere (3× Livello B) |
| `src/components/admin/cities/RegionalAnalysisModal.tsx` | 3 | da correggere (3× Livello B) |
| `src/hooks/admin/usePoiActions.ts` | 3 | da correggere (3× Livello B) |
| `src/services/importService.ts` | 3 | da correggere (3× Livello B) |
| `src/services/mediaService.ts` | 3 | da correggere (3× Livello B) |
| `src/components/admin/AdminPhotoInspector.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/admin/cityEditor/EditorCulture.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/admin/cityEditor/EditorRatings.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/admin/observatory/ObservatoryLayout.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/admin/social/SocialPreviewConfig.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/modals/poiDetail/PoiInfoSection.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/modals/SectionPreviewModal.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/user/dashboard/UserSidebar.tsx` | 2 | da correggere (2× Livello B) |
| `src/context/BusinessContext.tsx` | 2 | da correggere (2× Livello B) |
| `src/context/ItineraryContext.tsx` | 2 | da correggere (2× Livello B) |
| `src/hooks/admin/people/usePeopleAI.ts` | 2 | da correggere (2× Livello B) |
| `src/hooks/admin/people/usePeopleData.ts` | 2 | da correggere (2× Livello B) |
| `src/hooks/admin/useAiMagicCity.ts` | 2 | da correggere (2× Livello B) |
| `src/hooks/useCityList.ts` | 2 | da correggere (2× Livello B) |
| `src/hooks/usePoiManager.ts` | 2 | da correggere (2× Livello B) |
| `src/hooks/useUserDashboardData.ts` | 2 | da correggere (2× Livello B) |
| `src/services/contentService.ts` | 2 | da correggere (2× Livello B) |
| `src/services/photoService.ts` | 2 | da correggere (2× Livello B) |
| `src/utils/exportGenerators.ts` | 2 | da correggere (2× Livello B) |
| `scripts/seed_geo.js` | 1 | da correggere (1× Livello B) |
| `src/components/admin/AdminCommunications.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/AdminPoiManager.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/AdminTaxonomyManager.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/CitiesManager.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/cityEditor/culture/CulturePatron.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/cityEditor/EditorGeneral.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/cityEditor/EditorMedia.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/cityEditor/tabs/TabCulture.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/cityEditor/tabs/TabGeneral.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/cityEditor/tabs/TabMedia.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/NewsTickerManager.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/observatory/AnomalyInspector.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/observatory/ObservatoryFilterDrawer.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/photos/PhotoRow.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/poiManager/BulkFixProgressModal.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/settings/PartnerIntegrationsPanel.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/social/AiBackgroundPanel.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/SponsorManager.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/userManager/EditUserModal.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/userManager/UserTable.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/city/tabs/CityCategoryTab.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/features/diary/DiaryHeader.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/features/diary/notes/DiaryNotesPanel.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/suitcase/AffiliateSuggestionBox.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/suitcase/tabs/OverrideTab.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseSuggestions.ts` | 1 | da correggere (1× Livello B) |
| `src/components/layout/modals/AdminModals.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/layout/OnboardingWizard.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/modals/AiItineraryModal.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/modals/PoiClaimModal.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/modals/sponsor/SponsorForm.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/modals/SponsorModal.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/modals/UserUpgradeModal.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/myspace/ViaggioRicordamiControl.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/user/BusinessShopManager.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/user/dashboard/UserMessagesTab.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/user/dashboard/UserReferralTab.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/user/dashboard/UserSettingsTab.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/user/referral/SocialCardGenerator.tsx` | 1 | da correggere (1× Livello B) |
| `src/config/env.ts` | 1 | da correggere (1× Livello B) |
| `src/hooks/admin/useAiCompleteCity.ts` | 1 | da correggere (1× Livello B) |
| `src/hooks/admin/useAiValidation.ts` | 1 | da correggere (1× Livello B) |
| `src/hooks/admin/useDuplicateFinder.ts` | 1 | da correggere (1× Livello B) |
| `src/hooks/admin/useSocialTemplates.ts` | 1 | da correggere (1× Livello B) |
| `src/hooks/core/useAppInitialization.ts` | 1 | da correggere (1× Livello B) |
| `src/hooks/features/useDiaryInteractions.ts` | 1 | da correggere (1× Livello B) |
| `src/hooks/useDiaryLogic.ts` | 1 | da correggere (1× Livello B) |
| `src/hooks/useDocumentTitle.ts` | 1 | da correggere (1× Livello B) |
| `src/hooks/usePoiForm.ts` | 1 | da correggere (1× Livello B) |
| `src/hooks/useSystemMessage.ts` | 1 | da correggere (1× Livello B) |
| `src/services/ai/utils/taxonomyUtils.ts` | 1 | da correggere (1× Livello B) |
| `src/services/community/interactionService.ts` | 1 | da correggere (1× Livello B) |
| `src/services/community/itineraryService.ts` | 1 | da correggere (1× Livello B) |
| `src/services/community/suggestionService.ts` | 1 | da correggere (1× Livello B) |
| `src/services/gamificationService.ts` | 1 | da correggere (1× Livello B) |
| `src/services/partnerIntegrationService.ts` | 1 | da correggere (1× Livello B) |
| `src/services/rankingService.ts` | 1 | da correggere (1× Livello B) |
| `src/services/shopService.ts` | 1 | da correggere (1× Livello B) |
| `src/services/userService.ts` | 1 | da correggere (1× Livello B) |
| `src/types/models/Sponsor.ts` | 1 | da correggere (1× Livello B) |
| `src/utils/affiliateNetwork.ts` | 1 | da correggere (1× Livello B) |

Nota: il dettaglio riga e riproducibile in qualsiasi momento con `npx biome check --reporter=json` filtrato sulla categoria.

