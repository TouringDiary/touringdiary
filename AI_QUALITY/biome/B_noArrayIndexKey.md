# noArrayIndexKey

> Dettaglio baseline Biome full-project. Dashboard: [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md)

| Campo | Valore |
|----|----|
| **Documento** | `AI_QUALITY/biome/B_noArrayIndexKey.md` |
| **Categorie** | `lint/suspicious/noArrayIndexKey` |
| **Occorrenze (somma gruppo)** | **82** |
| **File unici nel gruppo** | **61** |
| **Livello** | **B** |
| **Ultimo aggiornamento** | 2026-08-03 |
| **Stato** | Baseline ufficiale — nessuna correzione applicata in questa attivita |

## `lint/suspicious/noArrayIndexKey`

### Descrizione della regola

Uso dell'indice di array come key React.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/suspicious/noArrayIndexKey` |
| **Occorrenze totali** | **82** |
| **Error** | 82 |
| **Warning** | 0 |
| **Info** | 0 |
| **File coinvolti** | **61** |
| **Livello di rischio** | **B** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Key stabile richiede identita di dominio; non meccanico. Alcuni casi possono diventare D dopo review.

### Strategia di correzione

Key da id dominio; solo dopo review lista stabile/statica → D.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/components/modals/CultureCornerModal.tsx` | 7 |
| `src/components/itineraries/ItineraryDetail.tsx` | 3 |
| `src/components/modals/ExportModal.tsx` | 3 |
| `src/components/pdf/TravelDocument.tsx` | 3 |
| `src/components/admin/cities/ProcessLogModal.tsx` | 2 |
| `src/components/admin/cities/RegionalAnalysisModal.tsx` | 2 |
| `src/components/admin/cityEditor/culture/CulturePeople.tsx` | 2 |
| `src/components/admin/cityEditor/tabs/TabLogs.tsx` | 2 |
| `src/components/features/diary/DiaryTimeline.tsx` | 2 |
| `src/components/modals/poiDetail/PoiInfoSection.tsx` | 2 |
| `src/components/pdf/RoadbookDocument.tsx` | 2 |
| `src/components/shop/ShopHero.tsx` | 2 |
| `src/components/user/dashboard/UserMessagesTab.tsx` | 2 |
| `src/components/admin/AdminAiAssistant.tsx` | 1 |
| `src/components/admin/AdminItineraryEditor.tsx` | 1 |
| `src/components/admin/affiliations/AffiliateAnalyticsTab.tsx` | 1 |
| `src/components/admin/cities/CityAuditModal.tsx` | 1 |
| `src/components/admin/cityEditor/EditorCulture.tsx` | 1 |
| `src/components/admin/cityEditor/EditorMedia.tsx` | 1 |
| `src/components/admin/cityEditor/EditorRatings.tsx` | 1 |
| `src/components/admin/cityEditor/services/ServiceEvents.tsx` | 1 |
| `src/components/admin/cityEditor/services/ServiceGuides.tsx` | 1 |
| `src/components/admin/cityEditor/services/ServiceOperators.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabMedia.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabRatings.tsx` | 1 |
| `src/components/admin/economics/AdminAiAnalyticsV4.tsx` | 1 |
| `src/components/admin/import/ImportOsmModal.tsx` | 1 |
| `src/components/admin/marketing/PricingPlansPanel.tsx` | 1 |
| `src/components/admin/observatory/ScheduleMatrix.tsx` | 1 |
| `src/components/admin/PartnerDetailModal.tsx` | 1 |
| `src/components/aiPlanner/AiPlannerForm.tsx` | 1 |
| `src/components/aiPlanner/AiPlannerTimeline.tsx` | 1 |
| `src/components/city/CityCard.tsx` | 1 |
| `src/components/city/gallery/GalleryGrid.tsx` | 1 |
| `src/components/city/ShowcaseCards.tsx` | 1 |
| `src/components/city/WeatherWidget.tsx` | 1 |
| `src/components/common/SmartFilterDrawer.tsx` | 1 |
| `src/components/common/StarRating.tsx` | 1 |
| `src/components/features/diary/header/DiaryHeaderTabs.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsPanel.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsReviewStep.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/CategorySuggestionPanel.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseAscentProgressIndicator.tsx` | 1 |
| `src/components/home/CuratedGridSection.tsx` | 1 |
| `src/components/home/hero/HeroFilterModule.tsx` | 1 |
| `src/components/home/HomeContent.tsx` | 1 |
| `src/components/layout/Header.tsx` | 1 |
| `src/components/layout/NarrativeCompass.tsx` | 1 |
| `src/components/layout/OnboardingWizard.tsx` | 1 |
| `src/components/marketing/SponsorPlanCard.tsx` | 1 |
| `src/components/modals/AroundMeWizard.tsx` | 1 |
| `src/components/modals/cityInfo/CityTourOperatorsTab.tsx` | 1 |
| `src/components/modals/cityInfo/ServiceAiHunter.tsx` | 1 |
| `src/components/modals/DuplicateResolutionModal.tsx` | 1 |
| `src/components/modals/MobileMoveModal.tsx` | 1 |
| `src/components/modals/ProvinceModal.tsx` | 1 |
| `src/components/modals/sectionPreview/PreviewGallery.tsx` | 1 |
| `src/components/modals/sectionPreview/PreviewRatings.tsx` | 1 |
| `src/components/myworld/MyWorldBreadcrumb.tsx` | 1 |
| `src/components/shop/ShopReviews.tsx` | 1 |
| `src/components/ui/CarouselPositionIndicator.tsx` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

Occorrenze totali: **82** (sopra soglia elenco riga-per-riga). Inventario sintetico per file:

| File | Occorrenze | Decisione baseline per-file |
|---|---:|---|
| `src/components/modals/CultureCornerModal.tsx` | 7 | da correggere (7× Livello B) |
| `src/components/itineraries/ItineraryDetail.tsx` | 3 | da correggere (3× Livello B) |
| `src/components/modals/ExportModal.tsx` | 3 | da correggere (3× Livello B) |
| `src/components/pdf/TravelDocument.tsx` | 3 | da correggere (3× Livello B) |
| `src/components/admin/cities/ProcessLogModal.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/admin/cities/RegionalAnalysisModal.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/admin/cityEditor/culture/CulturePeople.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/admin/cityEditor/tabs/TabLogs.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/features/diary/DiaryTimeline.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/modals/poiDetail/PoiInfoSection.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/pdf/RoadbookDocument.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/shop/ShopHero.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/user/dashboard/UserMessagesTab.tsx` | 2 | da correggere (2× Livello B) |
| `src/components/admin/AdminAiAssistant.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/AdminItineraryEditor.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/affiliations/AffiliateAnalyticsTab.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/cities/CityAuditModal.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/cityEditor/EditorCulture.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/cityEditor/EditorMedia.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/cityEditor/EditorRatings.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/cityEditor/services/ServiceEvents.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/cityEditor/services/ServiceGuides.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/cityEditor/services/ServiceOperators.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/cityEditor/tabs/TabMedia.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/cityEditor/tabs/TabRatings.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/economics/AdminAiAnalyticsV4.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/import/ImportOsmModal.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/marketing/PricingPlansPanel.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/observatory/ScheduleMatrix.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/admin/PartnerDetailModal.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/aiPlanner/AiPlannerForm.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/aiPlanner/AiPlannerTimeline.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/city/CityCard.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/city/gallery/GalleryGrid.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/city/ShowcaseCards.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/city/WeatherWidget.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/common/SmartFilterDrawer.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/common/StarRating.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/features/diary/header/DiaryHeaderTabs.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsPanel.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsReviewStep.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/suitcase/CategorySuggestionPanel.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseAscentProgressIndicator.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/home/CuratedGridSection.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/home/hero/HeroFilterModule.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/home/HomeContent.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/layout/Header.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/layout/NarrativeCompass.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/layout/OnboardingWizard.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/marketing/SponsorPlanCard.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/modals/AroundMeWizard.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/modals/cityInfo/CityTourOperatorsTab.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/modals/cityInfo/ServiceAiHunter.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/modals/DuplicateResolutionModal.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/modals/MobileMoveModal.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/modals/ProvinceModal.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/modals/sectionPreview/PreviewGallery.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/modals/sectionPreview/PreviewRatings.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/myworld/MyWorldBreadcrumb.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/shop/ShopReviews.tsx` | 1 | da correggere (1× Livello B) |
| `src/components/ui/CarouselPositionIndicator.tsx` | 1 | da correggere (1× Livello B) |

Nota: il dettaglio riga e riproducibile in qualsiasi momento con `npx biome check --reporter=json` filtrato sulla categoria.

