# a11y-forms-labels

> Dettaglio baseline Biome full-project. Dashboard: [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md)

| Campo | Valore |
|----|----|
| **Documento** | `AI_QUALITY/biome/B_a11y_labels_and_forms.md` |
| **Categorie** | `lint/a11y/noLabelWithoutControl`, `lint/a11y/noAutofocus` |
| **Occorrenze (somma gruppo)** | **257** |
| **File unici nel gruppo** | **88** |
| **Livello** | **B** |
| **Ultimo aggiornamento** | 2026-08-03 |
| **Stato** | Baseline ufficiale — nessuna correzione applicata in questa attivita |

## `lint/a11y/noLabelWithoutControl`

### Descrizione della regola

label deve essere associata a un controllo.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/a11y/noLabelWithoutControl` |
| **Occorrenze totali** | **240** |
| **Error** | 240 |
| **Warning** | 0 |
| **Info** | 0 |
| **File coinvolti** | **80** |
| **Livello di rischio** | **B** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

htmlFor/id o wrapping; review markup form.

### Strategia di correzione

Associare label al controllo.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/components/aiPlanner/AiPlannerForm.tsx` | 10 |
| `src/components/modals/SuggestionReviewModal.tsx` | 10 |
| `src/components/admin/AdminGamification.tsx` | 8 |
| `src/components/admin/AdminItineraryEditor.tsx` | 8 |
| `src/components/admin/poiModal/PoiInfoTab.tsx` | 8 |
| `src/components/admin/marketing/AdminCreditPackages.tsx` | 7 |
| `src/components/admin/sponsor/SponsorModals.tsx` | 7 |
| `src/components/admin/AdminSocialStudio.tsx` | 6 |
| `src/components/admin/cityEditor/tabs/TabGeneral.tsx` | 6 |
| `src/components/admin/settings/PartnerIntegrationsPanel.tsx` | 6 |
| `src/components/admin/userManager/CreateUserModal.tsx` | 6 |
| `src/components/admin/userManager/EditUserModal.tsx` | 6 |
| `src/components/admin/AdminPhotoInspector.tsx` | 5 |
| `src/components/admin/cityEditor/EditorGeneral.tsx` | 5 |
| `src/components/admin/communications/CommsTemplates.tsx` | 5 |
| `src/components/admin/economics/PricingManager.tsx` | 5 |
| `src/components/admin/economics/SustainabilityHelper.tsx` | 5 |
| `src/components/admin/NewsTickerManager.tsx` | 5 |
| `src/components/admin/poiModal/PoiLogisticsTab.tsx` | 5 |
| `src/components/features/diary/packing_list/suitcase/tabs/GlobalSuggestionsTab.tsx` | 5 |
| `src/components/modals/sponsor/SponsorForm.tsx` | 5 |
| `src/components/modals/SuggestionModal.tsx` | 5 |
| `src/components/admin/AdminTaxonomyManager.tsx` | 4 |
| `src/components/admin/observatory/ObservatoryFilterDrawer.tsx` | 4 |
| `src/components/admin/AiEconomicsDashboard.tsx` | 3 |
| `src/components/admin/AiLimitsControlCenter.tsx` | 3 |
| `src/components/admin/cityEditor/culture/CulturePatron.tsx` | 3 |
| `src/components/admin/cityEditor/EditorCulture.tsx` | 3 |
| `src/components/admin/design/StyleEditor.tsx` | 3 |
| `src/components/admin/LoadingTipsManager.tsx` | 3 |
| `src/components/myspace/RicordamiConfigModal.tsx` | 3 |
| `src/components/photos/CommunityPhotoPublishModal.tsx` | 3 |
| `src/components/admin/AdminImageInput.tsx` | 2 |
| `src/components/admin/cities/CityGeneratorModal.tsx` | 2 |
| `src/components/admin/cities/RegionalAnalysisModal.tsx` | 2 |
| `src/components/admin/import/ImportOsmModal.tsx` | 2 |
| `src/components/admin/marketing/AiLimitsPanel.tsx` | 2 |
| `src/components/admin/marketing/CampaignsPanel.tsx` | 2 |
| `src/components/admin/marketing/PromoManagerModal.tsx` | 2 |
| `src/components/admin/photos/PhotoMetadataModal.tsx` | 2 |
| `src/components/admin/poiManager/PoiToolbar.tsx` | 2 |
| `src/components/admin/poiModal/PoiMarketingTab.tsx` | 2 |
| `src/components/collaboration/CollaborationShareWizard.tsx` | 2 |
| `src/components/collaboration/WorkspaceShareWizardSteps.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/LinkSuitcaseModal.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/NewCategoryPanel.tsx` | 2 |
| `src/components/modals/AddToItineraryModal.tsx` | 2 |
| `src/components/modals/AroundMeWizard.tsx` | 2 |
| `src/components/modals/ExportModal.tsx` | 2 |
| `src/components/modals/MobileMoveModal.tsx` | 2 |
| `src/components/modals/PoiClaimModal.tsx` | 2 |
| `src/components/myspace/ViaggioRicordiSection.tsx` | 2 |
| `src/components/myspace/ViaggioRiepilogoSection.tsx` | 2 |
| `src/components/shop/ShopInfo.tsx` | 2 |
| `src/components/admin/cities/GeoCascadingFilters.tsx` | 1 |
| `src/components/admin/cities/StrategicMapTab.tsx` | 1 |
| `src/components/admin/cityEditor/culture/CulturePeople.tsx` | 1 |
| `src/components/admin/cityEditor/EditorRatings.tsx` | 1 |
| `src/components/admin/cityEditor/FormFieldHelper.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabRatings.tsx` | 1 |
| `src/components/admin/observatory/DuplicateResolver.tsx` | 1 |
| `src/components/admin/onboarding/OnboardingVisualEditor.tsx` | 1 |
| `src/components/admin/platformControl/SchedulePanel.tsx` | 1 |
| `src/components/admin/settings/inputs/BooleanToggle.tsx` | 1 |
| `src/components/admin/settings/inputs/NumberInput.tsx` | 1 |
| `src/components/admin/settings/inputs/StringInput.tsx` | 1 |
| `src/components/admin/social/SocialPreviewConfig.tsx` | 1 |
| `src/components/city/gallery/GalleryUploadModal.tsx` | 1 |
| `src/components/home/hero/components/FilterSelect.tsx` | 1 |
| `src/components/home/hero/components/MultiFilterSelect.tsx` | 1 |
| `src/components/itineraries/ItineraryDetail.tsx` | 1 |
| `src/components/modals/DuplicateResolutionModal.tsx` | 1 |
| `src/components/modals/SaveAsModal.tsx` | 1 |
| `src/components/myspace/ViaggioDiarioSection.tsx` | 1 |
| `src/components/myspace/ViaggioValigiaSection.tsx` | 1 |
| `src/components/user/BusinessShopManager.tsx` | 1 |
| `src/components/user/dashboard/UserFriendsTab.tsx` | 1 |
| `src/components/user/dashboard/UserSettingsTab.tsx` | 1 |
| `src/components/user/dashboard/UserSidebar.tsx` | 1 |
| `src/components/user/profile/ProfileIdentityFields.tsx` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

Occorrenze totali: **240** (sopra soglia elenco riga-per-riga). Inventario sintetico per file:

| File | Occorrenze | Decisione baseline per-file |
|---|---:|---|
| `src/components/aiPlanner/AiPlannerForm.tsx` | 10 | da correggere (10× Livello B) |
| `src/components/modals/SuggestionReviewModal.tsx` | 10 | da correggere (10× Livello B) |
| `src/components/admin/AdminGamification.tsx` | 8 | da correggere (8× Livello B) |
| `src/components/admin/AdminItineraryEditor.tsx` | 8 | da correggere (8× Livello B) |
| `src/components/admin/poiModal/PoiInfoTab.tsx` | 8 | da correggere (8× Livello B) |
| `src/components/admin/marketing/AdminCreditPackages.tsx` | 7 | da correggere (7× Livello B) |
| `src/components/admin/sponsor/SponsorModals.tsx` | 7 | da correggere (7× Livello B) |
| `src/components/admin/AdminSocialStudio.tsx` | 6 | da correggere (6× Livello B) |
| `src/components/admin/cityEditor/tabs/TabGeneral.tsx` | 6 | da correggere (6× Livello B) |
| `src/components/admin/settings/PartnerIntegrationsPanel.tsx` | 6 | da correggere (6× Livello B) |
| `src/components/admin/userManager/CreateUserModal.tsx` | 6 | da correggere (6× Livello B) |
| `src/components/admin/userManager/EditUserModal.tsx` | 6 | da correggere (6× Livello B) |
| `src/components/admin/AdminPhotoInspector.tsx` | 5 | da correggere (5× Livello B) |
| `src/components/admin/cityEditor/EditorGeneral.tsx` | 5 | da correggere (5× Livello B) |
| `src/components/admin/communications/CommsTemplates.tsx` | 5 | da correggere (5× Livello B) |
| `src/components/admin/economics/PricingManager.tsx` | 5 | da correggere (5× Livello B) |
| `src/components/admin/economics/SustainabilityHelper.tsx` | 5 | da correggere (5× Livello B) |
| `src/components/admin/NewsTickerManager.tsx` | 5 | da correggere (5× Livello B) |
| `src/components/admin/poiModal/PoiLogisticsTab.tsx` | 5 | da correggere (5× Livello B) |
| `src/components/features/diary/packing_list/suitcase/tabs/GlobalSuggestionsTab.tsx` | 5 | da correggere (5× Livello B) |
| `src/components/modals/sponsor/SponsorForm.tsx` | 5 | da correggere (5× Livello B) |
| `src/components/modals/SuggestionModal.tsx` | 5 | da correggere (5× Livello B) |
| `src/components/admin/AdminTaxonomyManager.tsx` | 4 | da correggere (4× Livello B) |
| `src/components/admin/observatory/ObservatoryFilterDrawer.tsx` | 4 | da correggere (4× Livello B) |
| `src/components/admin/AiEconomicsDashboard.tsx` | 3 | da correggere (3× Livello B) |
| `src/components/admin/AiLimitsControlCenter.tsx` | 3 | da correggere (3× Livello B) |
| `src/components/admin/cityEditor/culture/CulturePatron.tsx` | 3 | da correggere (3× Livello B) |
| `src/components/admin/cityEditor/EditorCulture.tsx` | 3 | da correggere (3× Livello B) |
| `src/components/admin/design/StyleEditor.tsx` | 3 | da correggere (3× Livello B) |
| `src/components/admin/LoadingTipsManager.tsx` | 3 | da correggere (3× Livello B) |
| `src/components/myspace/RicordamiConfigModal.tsx` | 3 | da correggere (3× Livello B) |
| `src/components/photos/CommunityPhotoPublishModal.tsx` | 3 | da correggere (3× Livello B) |
| `src/components/admin/AdminImageInput.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/admin/cities/CityGeneratorModal.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/admin/cities/RegionalAnalysisModal.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/admin/import/ImportOsmModal.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/admin/marketing/AiLimitsPanel.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/admin/marketing/CampaignsPanel.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/admin/marketing/PromoManagerModal.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/admin/photos/PhotoMetadataModal.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/admin/poiManager/PoiToolbar.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/admin/poiModal/PoiMarketingTab.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/collaboration/CollaborationShareWizard.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/collaboration/WorkspaceShareWizardSteps.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/features/diary/packing_list/suitcase/LinkSuitcaseModal.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/features/diary/packing_list/suitcase/NewCategoryPanel.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/modals/AddToItineraryModal.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/modals/AroundMeWizard.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/modals/ExportModal.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/modals/MobileMoveModal.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/modals/PoiClaimModal.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/myspace/ViaggioRicordiSection.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/myspace/ViaggioRiepilogoSection.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/shop/ShopInfo.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/admin/cities/GeoCascadingFilters.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/cities/StrategicMapTab.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/cityEditor/culture/CulturePeople.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/cityEditor/EditorRatings.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/cityEditor/FormFieldHelper.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/cityEditor/tabs/TabRatings.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/observatory/DuplicateResolver.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/onboarding/OnboardingVisualEditor.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/platformControl/SchedulePanel.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/settings/inputs/BooleanToggle.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/settings/inputs/NumberInput.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/settings/inputs/StringInput.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/social/SocialPreviewConfig.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/city/gallery/GalleryUploadModal.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/home/hero/components/FilterSelect.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/home/hero/components/MultiFilterSelect.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/itineraries/ItineraryDetail.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/modals/DuplicateResolutionModal.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/modals/SaveAsModal.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/myspace/ViaggioDiarioSection.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/myspace/ViaggioValigiaSection.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/user/BusinessShopManager.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/user/dashboard/UserFriendsTab.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/user/dashboard/UserSettingsTab.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/user/dashboard/UserSidebar.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/user/profile/ProfileIdentityFields.tsx` | 1 | da correggere (1× Livello B) |

Nota: il dettaglio riga e riproducibile in qualsiasi momento con `npx biome check --reporter=json` filtrato sulla categoria.

## `lint/a11y/noAutofocus`

### Descrizione della regola

Evitare autofocus (accessibilita).

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/a11y/noAutofocus` |
| **Occorrenze totali** | **17** |
| **Error** | 17 |
| **Warning** | 0 |
| **Info** | 0 |
| **File coinvolti** | **14** |
| **Livello di rischio** | **B** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

autofocus puo essere intenzionale UX; review prodotto.

### Strategia di correzione

Rimuovere o giustificare (poi eventuale Livello D case-by-case).

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/components/features/diary/ItineraryItemCard.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/LinkSuitcaseModal.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseHeader.tsx` | 2 |
| `src/components/admin/cities/CityGeneratorModal.tsx` | 1 |
| `src/components/admin/marketing/PromoManagerModal.tsx` | 1 |
| `src/components/city/gallery/GalleryUploadModal.tsx` | 1 |
| `src/components/features/diary/DiaryMemoCard.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/CategorySection.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/CategorySetupConfigurationModal.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/NewCategoryPanel.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/tabs/override/ProductPicker.tsx` | 1 |
| `src/components/modals/SaveAsModal.tsx` | 1 |
| `src/components/myspace/CreateDiaryModal.tsx` | 1 |
| `src/components/myspace/CreateSuitcaseModal.tsx` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `src/components/admin/cities/CityGeneratorModal.tsx` | 47 | error | da correggere (Livello B) |
| 2 | `src/components/admin/marketing/PromoManagerModal.tsx` | 37 | error | da correggere (Livello B) |
| 3 | `src/components/city/gallery/GalleryUploadModal.tsx` | 35 | error | da correggere (Livello B) |
| 4 | `src/components/features/diary/DiaryMemoCard.tsx` | 59 | error | da correggere (Livello B) |
| 5 | `src/components/features/diary/ItineraryItemCard.tsx` | 418 | error | da correggere (Livello B) |
| 6 | `src/components/features/diary/ItineraryItemCard.tsx` | 431 | error | da correggere (Livello B) |
| 7 | `src/components/features/diary/packing_list/suitcase/CategorySection.tsx` | 165 | error | da correggere (Livello B) |
| 8 | `src/components/features/diary/packing_list/suitcase/CategorySetupConfigurationModal.tsx` | 488 | error | da correggere (Livello B) |
| 9 | `src/components/features/diary/packing_list/suitcase/LinkSuitcaseModal.tsx` | 133 | error | da correggere (Livello B) |
| 10 | `src/components/features/diary/packing_list/suitcase/LinkSuitcaseModal.tsx` | 152 | error | da correggere (Livello B) |
| 11 | `src/components/features/diary/packing_list/suitcase/NewCategoryPanel.tsx` | 43 | error | da correggere (Livello B) |
| 12 | `src/components/features/diary/packing_list/suitcase/SuitcaseHeader.tsx` | 282 | error | da correggere (Livello B) |
| 13 | `src/components/features/diary/packing_list/suitcase/SuitcaseHeader.tsx` | 370 | error | da correggere (Livello B) |
| 14 | `src/components/features/diary/packing_list/suitcase/tabs/override/ProductPicker.tsx` | 57 | error | da correggere (Livello B) |
| 15 | `src/components/modals/SaveAsModal.tsx` | 163 | error | da correggere (Livello B) |
| 16 | `src/components/myspace/CreateDiaryModal.tsx` | 174 | error | da correggere (Livello B) |
| 17 | `src/components/myspace/CreateSuitcaseModal.tsx` | 169 | error | da correggere (Livello B) |

