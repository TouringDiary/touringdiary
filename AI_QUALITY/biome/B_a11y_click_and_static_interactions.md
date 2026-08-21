# a11y-click-static

> Dettaglio scheda Biome (click + static).  
> **Unica SoT numerica operativa:** [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md) — questa scheda **non** è dashboard.

---

## Stato corrente (rinvio SoT)

Le **numeriche operative ufficiali** (errors/warnings, B2b, file, categorie) sono **solo** in [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md).  
In caso di divergenza tra questa scheda e la SoT, **prevale la SoT**.

### Ultimo snapshot locale documentato in questa scheda (2026-08-08)

| Metrico | Valore |
|----|---:|
| `useKeyWithClickEvents` | **251** |
| `noStaticElementInteractions` | **229** |
| **Totale gruppo (snapshot scheda)** | **480** |

> Fotografia della scheda al **2026-08-08**. **Non** riscrivere queste cifre con contatori SoT successivi. **Non** trattarle come baseline 2026-08-03.

---

## Baseline storica 2026-08-03

> Fotografia iniziale full-project — **immutabile**.

| Metrico | Valore |
|----|---:|
| `useKeyWithClickEvents` | **263** |
| `noStaticElementInteractions` | **241** |
| **Totale gruppo** | **504** |
| File unici nel gruppo (baseline) | **151** |
| Livello | **B** / cluster **B2b** |

| Campo | Valore |
|----|----|
| **Documento** | `AI_QUALITY/biome/B_a11y_click_and_static_interactions.md` |
| **Categorie** | `lint/a11y/useKeyWithClickEvents`, `lint/a11y/noStaticElementInteractions` |
| **Ultimo aggiornamento documentale** | 2026-08-16 (allineamento review / FP) |

---

## Distinzione obbligatoria di governance

| Livello | Cosa misura | Cosa NON è |
|----|----|----|
| Baseline storica 504 (263+241) | Fotografia 2026-08-03 | Stato corrente |
| Snapshot scheda 480 (251+229) | Fotografia scheda 2026-08-08 | SoT ufficiale |
| SoT `AI_BIOME_AUDIT.md` | Conti live ufficiali | — |
| Review **101** location | Classificazione **qualitativa** | Nuova baseline / «101 problemi da correggere» |
| **18** FP intenzionali | KEEP / Livello D | Debito da bonificare / da sottrarre a mano dalla SoT |

**18 FP** → registro [`D_policy_and_false_positives.md`](./D_policy_and_false_positives.md) § «Biome — False Positives analizzati».

---

## Review manuale B2b — 101 location (2026-08-16)

> Classificazione qualitativa di **101 location** su `noStaticElementInteractions`.  
> **Non** è una nuova baseline Biome. **Non** equivale a «101 problemi aperti».  
> Decisioni: FP / LOW / LOW_COND / MED / ARCH.  
> Follow-up CARD / stopProp / specials (esito finale): [`BIOME_101_FOLLOWUP_AUDIT_CARD_STOPPROP_SPECIALS.md`](./BIOME_101_FOLLOWUP_AUDIT_CARD_STOPPROP_SPECIALS.md).

### FP intenzionali (18) — KEEP

| Macro | Risk | Location | Decisione |
|----|----|---:|----|
| `S-FP-DRAG` | FP | 6 | KEEP intenzionale — restano attivi; no `biome-ignore` / no rule off |
| `S-FP-POINTER` | FP | 11 | idem |
| `S-FP-CONTENT` | FP | 1 | idem |
| **Totale FP** | | **18** | Registrati in Livello D |

### Altre macro (review qualitativa — non baseline)

| Macro | Risk | Nota governance |
|----|----|----|
| `S-UPLOAD` | LOW_COND | Upload zone → file input |
| `S-HEADER-CTRL` | LOW | Header expand/sort → button |
| `S-ADD-TILE` | LOW | Tile aggiungi (prompt URL) → button |
| `S-SIMPLE-SELECT` | LOW | Chip/option/thumb → button |
| `S-DIMMER-DISMISS` | LOW_COND | Backdrop dismiss (pattern A1) |
| `S-LIGHTBOX-DISMISS` | LOW_COND | Lightbox dismiss (pattern A6) |
| `S-POPOVER-TRIG` | LOW_COND | Trigger popover → button+ref |
| `S-SURFACE-TOGGLE` | MED | Superficie collasso panel |
| `S-ONBOARDING` | MED | Wizard onboarding |
| `S-DUP-CONTROL` | MED | Controllo duplicato (es. Santo Patrono desktop) |
| `S-CALENDAR-TRIG` | MED | Trigger calendario Dal/Al |
| `S-NOTE-EDIT` | MED | Click-to-edit nota tappa |
| `S-HERO-EXPAND` | MED | Hero expand/collapse |
| `S-HERO-SUBMIT` | MED | Hero typing submit |
| `S-HERO-LIGHTBOX` | MED | LiveFeed hero lightbox |
| `S-SHIELD-NESTED` | MED | stopPropagation nested |
| `S-CARD-ROW` | ARCH | Card/row open + nesting |

> «101 location in review» ≠ «101 fix obbligatori» ≠ «nuova baseline».  
> Eventuali remediation vanno valutate macro per macro; non automaticamente aperte da questo elenco.

---

## `lint/a11y/useKeyWithClickEvents`

### Descrizione della regola

Elementi con onClick devono gestire anche tastiera.

### Contabilita — baseline storica 2026-08-03

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/a11y/useKeyWithClickEvents` |
| **Occorrenze (baseline storica)** | **263** |
| **Error** | 263 |
| **Warning** | 0 |
| **Info** | 0 |
| **File coinvolti (baseline)** | **140** |
| **Livello di rischio** | **B** |
| **Stato alla baseline** | Aperto |
| **Decisione alla baseline** | da correggere *(storica — non decisione operativa corrente)* |

Snapshot scheda 2026-08-08 per questa regola: **251** (vedi sopra). Conti live → SoT.

### Motivazione della classificazione

A11y: aggiungere keyboard handler cambia UX; review funzionale.

### Strategia di correzione

Aggiungere onKeyDown/role o usare controllo nativo.

### Elenco completo file + occorrenze per file

> **Inventario baseline storico 2026-08-03.** La colonna decisione sotto è la decisione **alla baseline**, non lo stato operativo post-review.
| File | Occorrenze |
|---|---:|
| `src/components/modals/AiItineraryModal.tsx` | 11 |
| `src/components/home/hero/HeroAiModule.tsx` | 7 |
| `src/components/home/hero/HeroFilterModule.tsx` | 6 |
| `src/components/layout/Sidebar.tsx` | 6 |
| `src/components/modals/CultureCornerModal.tsx` | 5 |
| `src/components/admin/cities/DeleteCityOptionsModal.tsx` | 4 |
| `src/components/modals/PoiDetailModal.tsx` | 4 |
| `src/components/modals/ProvinceModal.tsx` | 4 |
| `src/components/modals/ReviewModal.tsx` | 4 |
| `src/components/modals/SectionPreviewModal.tsx` | 4 |
| `src/components/modals/SuggestionReviewModal.tsx` | 4 |
| `src/components/user/dashboard/UserWalletTab.tsx` | 4 |
| `src/components/admin/ItineraryManager.tsx` | 3 |
| `src/components/city/gallery/GalleryGrid.tsx` | 3 |
| `src/components/city/gallery/GalleryLightbox.tsx` | 3 |
| `src/components/city/ShowcaseCards.tsx` | 3 |
| `src/components/itineraries/ItinerariesExplorer.tsx` | 3 |
| `src/components/layout/OnboardingWizard.tsx` | 3 |
| `src/components/modals/AddToItineraryModal.tsx` | 3 |
| `src/components/modals/sectionPreview/PreviewHero.tsx` | 3 |
| `src/components/admin/communications/CommsTemplates.tsx` | 2 |
| `src/components/city/CityCard.tsx` | 2 |
| `src/components/collaboration/CollaborationShareModal.tsx` | 2 |
| `src/components/common/DeleteConfirmationModal.tsx` | 2 |
| `src/components/community/liveFeed/LiveFeedHero.tsx` | 2 |
| `src/components/features/diary/DiaryModals.tsx` | 2 |
| `src/components/features/diary/header/DiaryHeaderDateRange.tsx` | 2 |
| `src/components/features/diary/header/DiaryHeaderInvalidDateModal.tsx` | 2 |
| `src/components/features/diary/ItineraryItemCard.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsModal.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/AssociationConfirmationModal.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/BlacklistModal.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/CategoryMobileDialog.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/CategorySetupConfigurationModal.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/ItemDeleteConfirmationModal.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/LinkSuitcaseModal.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseHeader.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseItemRow.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/tabs/AiCatalogTab.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/tabs/StandardItemsTab.tsx` | 2 |
| `src/components/features/diary/packing_list/suitcase/tabs/TemplateSpecificItemsTab.tsx` | 2 |
| `src/components/modals/AroundMeWizard.tsx` | 2 |
| `src/components/modals/AuthModal.tsx` | 2 |
| `src/components/modals/BuyCreditsModal.tsx` | 2 |
| `src/components/modals/cityInfo/ServicesCategoryList.tsx` | 2 |
| `src/components/modals/CityInfoModal.tsx` | 2 |
| `src/components/modals/ConfirmClearModal.tsx` | 2 |
| `src/components/modals/DateChangeWarningModal.tsx` | 2 |
| `src/components/modals/DuplicateResolutionModal.tsx` | 2 |
| `src/components/modals/EmptyDiaryModal.tsx` | 2 |
| `src/components/modals/FullRankingsModal.tsx` | 2 |
| `src/components/modals/GpsAlertModal.tsx` | 2 |
| `src/components/modals/GpsErrorModal.tsx` | 2 |
| `src/components/modals/HistoryModal.tsx` | 2 |
| `src/components/modals/LevelUpModal.tsx` | 2 |
| `src/components/modals/LimitWarningModal.tsx` | 2 |
| `src/components/modals/MobileMoveModal.tsx` | 2 |
| `src/components/modals/PatronSaintModal.tsx` | 2 |
| `src/components/modals/PoiClaimModal.tsx` | 2 |
| `src/components/modals/QuotaExceededModal.tsx` | 2 |
| `src/components/modals/RemoveItemModal.tsx` | 2 |
| `src/components/modals/SaveAsModal.tsx` | 2 |
| `src/components/modals/ShareModal.tsx` | 2 |
| `src/components/modals/shell/BaseFullscreenModalShell.tsx` | 2 |
| `src/components/modals/SponsorModal.tsx` | 2 |
| `src/components/modals/TimeConflictModal.tsx` | 2 |
| `src/components/modals/UnsavedChangesModal.tsx` | 2 |
| `src/components/myspace/CreateDiaryModal.tsx` | 2 |
| `src/components/myspace/CreateSuitcaseModal.tsx` | 2 |
| `src/components/myspace/ResourceConflictCopyModal.tsx` | 2 |
| `src/components/shop/ProductDetailOverlay.tsx` | 2 |
| `src/components/shop/ShopBioOverlay.tsx` | 2 |
| `src/components/shop/ShopCard.tsx` | 2 |
| `src/components/shop/ShopPage.tsx` | 2 |
| `src/components/ui/header/HeaderPopover.tsx` | 2 |
| `src/components/user/UserDashboard.tsx` | 2 |
| `src/components/admin/AdminHeaderManager.tsx` | 1 |
| `src/components/admin/AdminPoiModal.tsx` | 1 |
| `src/components/admin/AdminSocialStudio.tsx` | 1 |
| `src/components/admin/AiFieldHelper.tsx` | 1 |
| `src/components/admin/cities/RegionalAnalysisModal.tsx` | 1 |
| `src/components/admin/cities/ZoneCard.tsx` | 1 |
| `src/components/admin/cityEditor/culture/CulturePeople.tsx` | 1 |
| `src/components/admin/cityEditor/EditorCulture.tsx` | 1 |
| `src/components/admin/cityEditor/EditorMedia.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabMedia.tsx` | 1 |
| `src/components/admin/economics/PricingManager.tsx` | 1 |
| `src/components/admin/GlobalEventsManager.tsx` | 1 |
| `src/components/admin/import/components/ImportStatsBar.tsx` | 1 |
| `src/components/admin/layout/AdminSidebar.tsx` | 1 |
| `src/components/admin/marketing/AdminCreditPackages.tsx` | 1 |
| `src/components/admin/marketing/CampaignsPanel.tsx` | 1 |
| `src/components/admin/observatory/AnomalyInspector.tsx` | 1 |
| `src/components/admin/observatory/ObservatoryFilterDrawer.tsx` | 1 |
| `src/components/admin/photos/PhotoRow.tsx` | 1 |
| `src/components/admin/poiManager/PoiList.tsx` | 1 |
| `src/components/admin/poiManager/RegenerateConfirmModal.tsx` | 1 |
| `src/components/admin/sponsor/SponsorTable.tsx` | 1 |
| `src/components/city/CityHeader.tsx` | 1 |
| `src/components/city/CityHistory.tsx` | 1 |
| `src/components/city/tabs/CityCategoryTab.tsx` | 1 |
| `src/components/common/AdPlaceholder.tsx` | 1 |
| `src/components/common/AnchoredPopover.tsx` | 1 |
| `src/components/common/ImageWithFallback.tsx` | 1 |
| `src/components/common/SmartFilterDrawer.tsx` | 1 |
| `src/components/community/liveFeed/LiveFeedCarousel.tsx` | 1 |
| `src/components/community/QaForumTab.tsx` | 1 |
| `src/components/community/UserPhotoEditor.tsx` | 1 |
| `src/components/features/diary/DiaryMemoCard.tsx` | 1 |
| `src/components/features/diary/DiaryResourceCard.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/RecommendedSuitcaseModal.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseSidePanel.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseStatusBox.tsx` | 1 |
| `src/components/home/CuratedGridSection.tsx` | 1 |
| `src/components/home/HomeContent.tsx` | 1 |
| `src/components/itineraries/ItinerariesList.tsx` | 1 |
| `src/components/itineraries/ItineraryDetail.tsx` | 1 |
| `src/components/layout/modals/AdminModals.tsx` | 1 |
| `src/components/layout/modals/CoreModals.tsx` | 1 |
| `src/components/modals/cityInfo/CityEventsTab.tsx` | 1 |
| `src/components/modals/sectionPreview/PreviewGallery.tsx` | 1 |
| `src/components/modals/sectionPreview/PreviewSidebar.tsx` | 1 |
| `src/components/modals/SetUsernameModal.tsx` | 1 |
| `src/components/modals/sponsor/SponsorForm.tsx` | 1 |
| `src/components/modals/UserUpgradeModal.tsx` | 1 |
| `src/components/myspace/MySpaceCityPickModal.tsx` | 1 |
| `src/components/myspace/RicordamiConfigModal.tsx` | 1 |
| `src/components/myspace/SuitcaseDiariesModal.tsx` | 1 |
| `src/components/myspace/ViaggioRicordamiControl.tsx` | 1 |
| `src/components/photos/CommunityPhotoPublishModal.tsx` | 1 |
| `src/components/photos/InAppCameraCapture.tsx` | 1 |
| `src/components/photos/PhotoAcquireDialog.tsx` | 1 |
| `src/components/rankings/CityRow.tsx` | 1 |
| `src/components/rankings/PhotoGrid.tsx` | 1 |
| `src/components/rankings/PoiList.tsx` | 1 |
| `src/components/shop/ShopHero.tsx` | 1 |
| `src/components/shop/ShopHomeView.tsx` | 1 |
| `src/components/shop/ShopProducts.tsx` | 1 |
| `src/components/user/BusinessShopManager.tsx` | 1 |
| `src/components/user/dashboard/UserNotificationsTab.tsx` | 1 |

### Analisi delle occorrenze

> Testo e tabelle seguenti = **contabilità / decisione alla baseline 2026-08-03**.  
> **Non** sono decisioni operative post-review 2026-08-16. Per FP / LOW / MED / ARCH vedi sezione «Review manuale B2b — 101 location» e [`D_policy_and_false_positives.md`](./D_policy_and_false_positives.md).

Ogni occorrenza della regola era trattata come debito legacy omogeneo a livello di **categoria** nella baseline. Eventuali escalation a Livello D avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

Occorrenze totali (baseline): **263** (sopra soglia elenco riga-per-riga). Inventario sintetico per file:

| File | Occorrenze | Decisione **baseline storica** (2026-08-03) |
|---|---:|---|
| `src/components/modals/AiItineraryModal.tsx` | 11 | baseline storica — da correggere (11× Livello B) |
| `src/components/home/hero/HeroAiModule.tsx` | 7 | baseline storica — da correggere (7× Livello B) |
| `src/components/home/hero/HeroFilterModule.tsx` | 6 | baseline storica — da correggere (6× Livello B) |
| `src/components/layout/Sidebar.tsx` | 6 | baseline storica — da correggere (6× Livello B) |
| `src/components/modals/CultureCornerModal.tsx` | 5 | baseline storica — da correggere (5× Livello B) |
| `src/components/admin/cities/DeleteCityOptionsModal.tsx` | 4 | baseline storica — da correggere (4× Livello B) |
| `src/components/modals/PoiDetailModal.tsx` | 4 | baseline storica — da correggere (4× Livello B) |
| `src/components/modals/ProvinceModal.tsx` | 4 | baseline storica — da correggere (4× Livello B) |
| `src/components/modals/ReviewModal.tsx` | 4 | baseline storica — da correggere (4× Livello B) |
| `src/components/modals/SectionPreviewModal.tsx` | 4 | baseline storica — da correggere (4× Livello B) |
| `src/components/modals/SuggestionReviewModal.tsx` | 4 | baseline storica — da correggere (4× Livello B) |
| `src/components/user/dashboard/UserWalletTab.tsx` | 4 | baseline storica — da correggere (4× Livello B) |
| `src/components/admin/ItineraryManager.tsx` | 3 | baseline storica — da correggere (3× Livello B) |
| `src/components/city/gallery/GalleryGrid.tsx` | 3 | baseline storica — da correggere (3× Livello B) |
| `src/components/city/gallery/GalleryLightbox.tsx` | 3 | baseline storica — da correggere (3× Livello B) |
| `src/components/city/ShowcaseCards.tsx` | 3 | baseline storica — da correggere (3× Livello B) |
| `src/components/itineraries/ItinerariesExplorer.tsx` | 3 | baseline storica — da correggere (3× Livello B) |
| `src/components/layout/OnboardingWizard.tsx` | 3 | baseline storica — da correggere (3× Livello B) |
| `src/components/modals/AddToItineraryModal.tsx` | 3 | baseline storica — da correggere (3× Livello B) |
| `src/components/modals/sectionPreview/PreviewHero.tsx` | 3 | baseline storica — da correggere (3× Livello B) |
| `src/components/admin/communications/CommsTemplates.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/city/CityCard.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/collaboration/CollaborationShareModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/common/DeleteConfirmationModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/community/liveFeed/LiveFeedHero.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/features/diary/DiaryModals.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/features/diary/header/DiaryHeaderDateRange.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/features/diary/header/DiaryHeaderInvalidDateModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/features/diary/ItineraryItemCard.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/features/diary/packing_list/suitcase/AssociationConfirmationModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/features/diary/packing_list/suitcase/BlacklistModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/features/diary/packing_list/suitcase/CategoryMobileDialog.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/features/diary/packing_list/suitcase/CategorySetupConfigurationModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/features/diary/packing_list/suitcase/ItemDeleteConfirmationModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/features/diary/packing_list/suitcase/LinkSuitcaseModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseHeader.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseItemRow.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/features/diary/packing_list/suitcase/tabs/AiCatalogTab.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/features/diary/packing_list/suitcase/tabs/StandardItemsTab.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/features/diary/packing_list/suitcase/tabs/TemplateSpecificItemsTab.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/AroundMeWizard.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/AuthModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/BuyCreditsModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/cityInfo/ServicesCategoryList.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/CityInfoModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/ConfirmClearModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/DateChangeWarningModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/DuplicateResolutionModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/EmptyDiaryModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/FullRankingsModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/GpsAlertModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/GpsErrorModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/HistoryModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/LevelUpModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/LimitWarningModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/MobileMoveModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/PatronSaintModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/PoiClaimModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/QuotaExceededModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/RemoveItemModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/SaveAsModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/ShareModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/shell/BaseFullscreenModalShell.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/SponsorModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/TimeConflictModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/UnsavedChangesModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/myspace/CreateDiaryModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/myspace/CreateSuitcaseModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/myspace/ResourceConflictCopyModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/shop/ProductDetailOverlay.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/shop/ShopBioOverlay.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/shop/ShopCard.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/shop/ShopPage.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/ui/header/HeaderPopover.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/user/UserDashboard.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/admin/AdminHeaderManager.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/AdminPoiModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/AdminSocialStudio.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/AiFieldHelper.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/cities/RegionalAnalysisModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/cities/ZoneCard.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/cityEditor/culture/CulturePeople.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/cityEditor/EditorCulture.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/cityEditor/EditorMedia.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/cityEditor/tabs/TabMedia.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/economics/PricingManager.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/GlobalEventsManager.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/import/components/ImportStatsBar.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/layout/AdminSidebar.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/marketing/AdminCreditPackages.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/marketing/CampaignsPanel.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/observatory/AnomalyInspector.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/observatory/ObservatoryFilterDrawer.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/photos/PhotoRow.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/poiManager/PoiList.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/poiManager/RegenerateConfirmModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/sponsor/SponsorTable.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/city/CityHeader.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/city/CityHistory.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/city/tabs/CityCategoryTab.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/common/AdPlaceholder.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/common/AnchoredPopover.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/common/ImageWithFallback.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/common/SmartFilterDrawer.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/community/liveFeed/LiveFeedCarousel.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/community/QaForumTab.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/community/UserPhotoEditor.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/features/diary/DiaryMemoCard.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/features/diary/DiaryResourceCard.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/suitcase/RecommendedSuitcaseModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseSidePanel.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseStatusBox.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/home/CuratedGridSection.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/home/HomeContent.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/itineraries/ItinerariesList.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/itineraries/ItineraryDetail.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/layout/modals/AdminModals.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/layout/modals/CoreModals.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/modals/cityInfo/CityEventsTab.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/modals/sectionPreview/PreviewGallery.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/modals/sectionPreview/PreviewSidebar.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/modals/SetUsernameModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/modals/sponsor/SponsorForm.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/modals/UserUpgradeModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/myspace/MySpaceCityPickModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/myspace/RicordamiConfigModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/myspace/SuitcaseDiariesModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/myspace/ViaggioRicordamiControl.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/photos/CommunityPhotoPublishModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/photos/InAppCameraCapture.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/photos/PhotoAcquireDialog.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/rankings/CityRow.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/rankings/PhotoGrid.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/rankings/PoiList.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/shop/ShopHero.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/shop/ShopHomeView.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/shop/ShopProducts.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/user/BusinessShopManager.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/user/dashboard/UserNotificationsTab.tsx` | 1 | baseline storica — da correggere (1× Livello B) |

Nota: il dettaglio riga e riproducibile in qualsiasi momento con `npx biome check --reporter=json` filtrato sulla categoria.

## `lint/a11y/noStaticElementInteractions`

> **FP intenzionali (2026-08-16):** **18** hit (`S-FP-DRAG`×6 + `S-FP-POINTER`×11 + `S-FP-CONTENT`×1) restano **attivi di proposito**.  
> Registro permanente: [`D_policy_and_false_positives.md`](./D_policy_and_false_positives.md) § «Biome — False Positives analizzati».  
> Non usare `biome-ignore` / non spegnere la regola.  
> Review qualitativa 101 location → sezione sopra; follow-up C/D/E → [`BIOME_101_FOLLOWUP_AUDIT_CARD_STOPPROP_SPECIALS.md`](./BIOME_101_FOLLOWUP_AUDIT_CARD_STOPPROP_SPECIALS.md).

### Descrizione della regola

Elementi non interattivi non dovrebbero avere handler di interazione senza ruolo adeguato.

### Contabilita — baseline storica 2026-08-03 vs snapshot scheda

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/a11y/noStaticElementInteractions` |
| **Occorrenze baseline storica (2026-08-03)** | **241** |
| **Snapshot scheda (2026-08-08)** | **229** |
| **Error (baseline)** | 241 |
| **Warning** | 0 |
| **Info** | 0 |
| **File coinvolti (baseline)** | **147** |
| **Livello di rischio** | **B** |
| **Stato alla baseline** | Aperto |
| **Decisione alla baseline** | da correggere *(storica — superata dalla review qualitativa; non trattare 241 come «tutti ancora da correggere»)* |

> Conti live ufficiali → [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md).  
> **241** resta inventario storico. **229** è snapshot scheda 2026-08-08. Né 241 né la review **101** sono la SoT.

### Motivazione della classificazione

Role/button vs elemento semantico; scelta UI. Post-review: decisioni per macro (FP / LOW / MED / ARCH), non omogenee «da correggere».

### Strategia di correzione

button/nativo o role+keyboard coerenti **solo** dove la review classifica un vero click-control. FP drag/pointer/contentEditable: **non** convertire in button.

### Elenco completo file + occorrenze per file

> **Inventario baseline storico 2026-08-03.** Non è la decisione operativa corrente.
| File | Occorrenze |
|---|---:|
| `src/components/modals/AiItineraryModal.tsx` | 11 |
| `src/components/home/hero/HeroAiModule.tsx` | 7 |
| `src/components/home/hero/HeroFilterModule.tsx` | 6 |
| `src/components/layout/Sidebar.tsx` | 6 |
| `src/components/modals/CultureCornerModal.tsx` | 5 |
| `src/components/modals/ProvinceModal.tsx` | 5 |
| `src/components/admin/cities/DeleteCityOptionsModal.tsx` | 4 |
| `src/components/admin/onboarding/OnboardingVisualEditor.tsx` | 4 |
| `src/components/modals/PoiDetailModal.tsx` | 4 |
| `src/components/modals/SectionPreviewModal.tsx` | 4 |
| `src/components/modals/SuggestionReviewModal.tsx` | 4 |
| `src/components/user/dashboard/UserWalletTab.tsx` | 4 |
| `src/components/city/gallery/GalleryGrid.tsx` | 3 |
| `src/components/city/gallery/GalleryLightbox.tsx` | 3 |
| `src/components/city/ShowcaseCards.tsx` | 3 |
| `src/components/itineraries/ItinerariesExplorer.tsx` | 3 |
| `src/components/layout/OnboardingWizard.tsx` | 3 |
| `src/components/admin/AdminItineraryEditor.tsx` | 2 |
| `src/components/admin/communications/CommsTemplates.tsx` | 2 |
| `src/components/admin/ItineraryManager.tsx` | 2 |
| `src/components/city/CityCard.tsx` | 2 |
| `src/components/community/liveFeed/LiveFeedHero.tsx` | 2 |
| `src/components/features/diary/header/DiaryHeaderDateRange.tsx` | 2 |
| `src/components/features/diary/ItineraryItemCard.tsx` | 2 |
| `src/components/features/diary/TravelDiary.tsx` | 2 |
| `src/components/modals/AroundMeWizard.tsx` | 2 |
| `src/components/modals/AuthModal.tsx` | 2 |
| `src/components/modals/BuyCreditsModal.tsx` | 2 |
| `src/components/modals/cityInfo/ServicesCategoryList.tsx` | 2 |
| `src/components/modals/CityInfoModal.tsx` | 2 |
| `src/components/modals/FullRankingsModal.tsx` | 2 |
| `src/components/modals/GpsAlertModal.tsx` | 2 |
| `src/components/modals/GpsErrorModal.tsx` | 2 |
| `src/components/modals/HistoryModal.tsx` | 2 |
| `src/components/modals/LevelUpModal.tsx` | 2 |
| `src/components/modals/LimitWarningModal.tsx` | 2 |
| `src/components/modals/PatronSaintModal.tsx` | 2 |
| `src/components/modals/PoiClaimModal.tsx` | 2 |
| `src/components/modals/QuotaExceededModal.tsx` | 2 |
| `src/components/modals/ReviewModal.tsx` | 2 |
| `src/components/modals/sectionPreview/PreviewHero.tsx` | 2 |
| `src/components/modals/shell/BaseFullscreenModalShell.tsx` | 2 |
| `src/components/modals/SponsorModal.tsx` | 2 |
| `src/components/shop/ProductDetailOverlay.tsx` | 2 |
| `src/components/shop/ShopBioOverlay.tsx` | 2 |
| `src/components/shop/ShopCard.tsx` | 2 |
| `src/components/shop/ShopPage.tsx` | 2 |
| `src/components/ui/header/HeaderPopover.tsx` | 2 |
| `src/components/user/UserDashboard.tsx` | 2 |
| `src/components/admin/AdminHeaderManager.tsx` | 1 |
| `src/components/admin/AdminPhotoInspector.tsx` | 1 |
| `src/components/admin/AdminPoiModal.tsx` | 1 |
| `src/components/admin/AdminSocialStudio.tsx` | 1 |
| `src/components/admin/AiFieldHelper.tsx` | 1 |
| `src/components/admin/cities/RegionalAnalysisModal.tsx` | 1 |
| `src/components/admin/cities/ZoneCard.tsx` | 1 |
| `src/components/admin/cityEditor/culture/CulturePeople.tsx` | 1 |
| `src/components/admin/cityEditor/EditorCulture.tsx` | 1 |
| `src/components/admin/cityEditor/EditorMedia.tsx` | 1 |
| `src/components/admin/cityEditor/tabs/TabMedia.tsx` | 1 |
| `src/components/admin/economics/PricingManager.tsx` | 1 |
| `src/components/admin/GlobalEventsManager.tsx` | 1 |
| `src/components/admin/import/components/ImportStatsBar.tsx` | 1 |
| `src/components/admin/layout/AdminSidebar.tsx` | 1 |
| `src/components/admin/marketing/AdminCreditPackages.tsx` | 1 |
| `src/components/admin/marketing/CampaignsPanel.tsx` | 1 |
| `src/components/admin/NewsTickerManager.tsx` | 1 |
| `src/components/admin/observatory/AnomalyInspector.tsx` | 1 |
| `src/components/admin/observatory/ObservatoryFilterDrawer.tsx` | 1 |
| `src/components/admin/photos/PhotoRow.tsx` | 1 |
| `src/components/admin/poiManager/RegenerateConfirmModal.tsx` | 1 |
| `src/components/city/CityHeader.tsx` | 1 |
| `src/components/city/CityHistory.tsx` | 1 |
| `src/components/city/tabs/CityCategoryTab.tsx` | 1 |
| `src/components/collaboration/CollaborationShareModal.tsx` | 1 |
| `src/components/common/AdPlaceholder.tsx` | 1 |
| `src/components/common/AnchoredPopover.tsx` | 1 |
| `src/components/common/DeleteConfirmationModal.tsx` | 1 |
| `src/components/common/DraggableSlider.tsx` | 1 |
| `src/components/common/ImageWithFallback.tsx` | 1 |
| `src/components/common/SmartFilterDrawer.tsx` | 1 |
| `src/components/community/liveFeed/LiveFeedCarousel.tsx` | 1 |
| `src/components/community/QaForumTab.tsx` | 1 |
| `src/components/community/UserPhotoEditor.tsx` | 1 |
| `src/components/features/diary/DiaryDay.tsx` | 1 |
| `src/components/features/diary/DiaryMemoCard.tsx` | 1 |
| `src/components/features/diary/DiaryModals.tsx` | 1 |
| `src/components/features/diary/DiaryTimeline.tsx` | 1 |
| `src/components/features/diary/header/DiaryHeaderInvalidDateModal.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsModal.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/AssociationConfirmationModal.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/BlacklistModal.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/CategoryMobileDialog.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/CategorySetupConfigurationModal.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/CategoryStatusFilter.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/CategorySuggestionPanel.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/ItemDeleteConfirmationModal.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/LinkSuitcaseModal.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/RecommendedSuitcaseModal.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseCard.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseItemRow.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseSidePanel.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseStatusBox.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/tabs/AiCatalogTab.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/tabs/StandardItemsTab.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/tabs/TemplateSpecificItemsTab.tsx` | 1 |
| `src/components/home/CuratedGridSection.tsx` | 1 |
| `src/components/home/HomeContent.tsx` | 1 |
| `src/components/itineraries/ItinerariesList.tsx` | 1 |
| `src/components/itineraries/ItineraryDetail.tsx` | 1 |
| `src/components/layout/modals/AdminModals.tsx` | 1 |
| `src/components/layout/modals/CoreModals.tsx` | 1 |
| `src/components/modals/AddToItineraryModal.tsx` | 1 |
| `src/components/modals/cityInfo/CityEventsTab.tsx` | 1 |
| `src/components/modals/ConfirmClearModal.tsx` | 1 |
| `src/components/modals/DateChangeWarningModal.tsx` | 1 |
| `src/components/modals/DuplicateResolutionModal.tsx` | 1 |
| `src/components/modals/EmptyDiaryModal.tsx` | 1 |
| `src/components/modals/MobileMoveModal.tsx` | 1 |
| `src/components/modals/RemoveItemModal.tsx` | 1 |
| `src/components/modals/SaveAsModal.tsx` | 1 |
| `src/components/modals/sectionPreview/PreviewGallery.tsx` | 1 |
| `src/components/modals/sectionPreview/PreviewSidebar.tsx` | 1 |
| `src/components/modals/SetUsernameModal.tsx` | 1 |
| `src/components/modals/ShareModal.tsx` | 1 |
| `src/components/modals/sponsor/SponsorForm.tsx` | 1 |
| `src/components/modals/TimeConflictModal.tsx` | 1 |
| `src/components/modals/UnsavedChangesModal.tsx` | 1 |
| `src/components/modals/UserUpgradeModal.tsx` | 1 |
| `src/components/myspace/CreateDiaryModal.tsx` | 1 |
| `src/components/myspace/CreateSuitcaseModal.tsx` | 1 |
| `src/components/myspace/MySpaceCityPickModal.tsx` | 1 |
| `src/components/myspace/ResourceConflictCopyModal.tsx` | 1 |
| `src/components/myspace/RicordamiConfigModal.tsx` | 1 |
| `src/components/myspace/SuitcaseDiariesModal.tsx` | 1 |
| `src/components/myspace/ViaggioRicordamiControl.tsx` | 1 |
| `src/components/photos/CommunityPhotoPublishModal.tsx` | 1 |
| `src/components/photos/InAppCameraCapture.tsx` | 1 |
| `src/components/photos/PhotoAcquireDialog.tsx` | 1 |
| `src/components/rankings/CityRow.tsx` | 1 |
| `src/components/rankings/PhotoGrid.tsx` | 1 |
| `src/components/rankings/PoiList.tsx` | 1 |
| `src/components/shop/ShopHero.tsx` | 1 |
| `src/components/shop/ShopHomeView.tsx` | 1 |
| `src/components/shop/ShopProducts.tsx` | 1 |
| `src/components/user/BusinessShopManager.tsx` | 1 |
| `src/components/user/dashboard/UserNotificationsTab.tsx` | 1 |

### Analisi delle occorrenze

> Testo e tabelle seguenti = **contabilità / decisione alla baseline 2026-08-03** per `noStaticElementInteractions`.  
> **Non** sono decisioni operative post-review. I **18 FP** e le macro LOW/MED/ARCH sono nella sezione «Review manuale B2b — 101 location» e in [`D_policy_and_false_positives.md`](./D_policy_and_false_positives.md).

Ogni occorrenza era trattata come debito legacy omogeneo a livello di **categoria** nella baseline. Escalation a Livello D solo dopo review puntuale.

Occorrenze totali (baseline storica): **241**. Inventario sintetico per file:

| File | Occorrenze | Decisione **baseline storica** (2026-08-03) |
|---|---:|---|
| `src/components/modals/AiItineraryModal.tsx` | 11 | baseline storica — da correggere (11× Livello B) |
| `src/components/home/hero/HeroAiModule.tsx` | 7 | baseline storica — da correggere (7× Livello B) |
| `src/components/home/hero/HeroFilterModule.tsx` | 6 | baseline storica — da correggere (6× Livello B) |
| `src/components/layout/Sidebar.tsx` | 6 | baseline storica — da correggere (6× Livello B) |
| `src/components/modals/CultureCornerModal.tsx` | 5 | baseline storica — da correggere (5× Livello B) |
| `src/components/modals/ProvinceModal.tsx` | 5 | baseline storica — da correggere (5× Livello B) |
| `src/components/admin/cities/DeleteCityOptionsModal.tsx` | 4 | baseline storica — da correggere (4× Livello B) |
| `src/components/admin/onboarding/OnboardingVisualEditor.tsx` | 4 | baseline storica — da correggere (4× Livello B) |
| `src/components/modals/PoiDetailModal.tsx` | 4 | baseline storica — da correggere (4× Livello B) |
| `src/components/modals/SectionPreviewModal.tsx` | 4 | baseline storica — da correggere (4× Livello B) |
| `src/components/modals/SuggestionReviewModal.tsx` | 4 | baseline storica — da correggere (4× Livello B) |
| `src/components/user/dashboard/UserWalletTab.tsx` | 4 | baseline storica — da correggere (4× Livello B) |
| `src/components/city/gallery/GalleryGrid.tsx` | 3 | baseline storica — da correggere (3× Livello B) |
| `src/components/city/gallery/GalleryLightbox.tsx` | 3 | baseline storica — da correggere (3× Livello B) |
| `src/components/city/ShowcaseCards.tsx` | 3 | baseline storica — da correggere (3× Livello B) |
| `src/components/itineraries/ItinerariesExplorer.tsx` | 3 | baseline storica — da correggere (3× Livello B) |
| `src/components/layout/OnboardingWizard.tsx` | 3 | baseline storica — da correggere (3× Livello B) |
| `src/components/admin/AdminItineraryEditor.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/admin/communications/CommsTemplates.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/admin/ItineraryManager.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/city/CityCard.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/community/liveFeed/LiveFeedHero.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/features/diary/header/DiaryHeaderDateRange.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/features/diary/ItineraryItemCard.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/features/diary/TravelDiary.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/AroundMeWizard.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/AuthModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/BuyCreditsModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/cityInfo/ServicesCategoryList.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/CityInfoModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/FullRankingsModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/GpsAlertModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/GpsErrorModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/HistoryModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/LevelUpModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/LimitWarningModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/PatronSaintModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/PoiClaimModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/QuotaExceededModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/ReviewModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/sectionPreview/PreviewHero.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/shell/BaseFullscreenModalShell.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/modals/SponsorModal.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/shop/ProductDetailOverlay.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/shop/ShopBioOverlay.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/shop/ShopCard.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/shop/ShopPage.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/ui/header/HeaderPopover.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/user/UserDashboard.tsx` | 2 | baseline storica — da correggere (2× Livello B) |
| `src/components/admin/AdminHeaderManager.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/AdminPhotoInspector.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/AdminPoiModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/AdminSocialStudio.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/AiFieldHelper.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/cities/RegionalAnalysisModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/cities/ZoneCard.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/cityEditor/culture/CulturePeople.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/cityEditor/EditorCulture.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/cityEditor/EditorMedia.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/cityEditor/tabs/TabMedia.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/economics/PricingManager.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/GlobalEventsManager.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/import/components/ImportStatsBar.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/layout/AdminSidebar.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/marketing/AdminCreditPackages.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/marketing/CampaignsPanel.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/NewsTickerManager.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/observatory/AnomalyInspector.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/observatory/ObservatoryFilterDrawer.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/photos/PhotoRow.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/admin/poiManager/RegenerateConfirmModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/city/CityHeader.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/city/CityHistory.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/city/tabs/CityCategoryTab.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/collaboration/CollaborationShareModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/common/AdPlaceholder.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/common/AnchoredPopover.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/common/DeleteConfirmationModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/common/DraggableSlider.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/common/ImageWithFallback.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/common/SmartFilterDrawer.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/community/liveFeed/LiveFeedCarousel.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/community/QaForumTab.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/community/UserPhotoEditor.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/features/diary/DiaryDay.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/features/diary/DiaryMemoCard.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/features/diary/DiaryModals.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/features/diary/DiaryTimeline.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/features/diary/header/DiaryHeaderInvalidDateModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/suitcase/AiSuggestionsModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/suitcase/AssociationConfirmationModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/suitcase/BlacklistModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/suitcase/CategoryMobileDialog.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/suitcase/CategorySetupConfigurationModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/suitcase/CategoryStatusFilter.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/suitcase/CategorySuggestionPanel.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/suitcase/ItemDeleteConfirmationModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/suitcase/LinkSuitcaseModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/suitcase/RecommendedSuitcaseModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseCard.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseItemRow.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseSidePanel.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseStatusBox.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/suitcase/tabs/AiCatalogTab.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/suitcase/tabs/StandardItemsTab.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/features/diary/packing_list/suitcase/tabs/TemplateSpecificItemsTab.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/home/CuratedGridSection.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/home/HomeContent.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/itineraries/ItinerariesList.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/itineraries/ItineraryDetail.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/layout/modals/AdminModals.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/layout/modals/CoreModals.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/modals/AddToItineraryModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/modals/cityInfo/CityEventsTab.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/modals/ConfirmClearModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/modals/DateChangeWarningModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/modals/DuplicateResolutionModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/modals/EmptyDiaryModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/modals/MobileMoveModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/modals/RemoveItemModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/modals/SaveAsModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/modals/sectionPreview/PreviewGallery.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/modals/sectionPreview/PreviewSidebar.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/modals/SetUsernameModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/modals/ShareModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/modals/sponsor/SponsorForm.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/modals/TimeConflictModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/modals/UnsavedChangesModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/modals/UserUpgradeModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/myspace/CreateDiaryModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/myspace/CreateSuitcaseModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/myspace/MySpaceCityPickModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/myspace/ResourceConflictCopyModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/myspace/RicordamiConfigModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/myspace/SuitcaseDiariesModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/myspace/ViaggioRicordamiControl.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/photos/CommunityPhotoPublishModal.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/photos/InAppCameraCapture.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/photos/PhotoAcquireDialog.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/rankings/CityRow.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/rankings/PhotoGrid.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/rankings/PoiList.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/shop/ShopHero.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/shop/ShopHomeView.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/shop/ShopProducts.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/user/BusinessShopManager.tsx` | 1 | baseline storica — da correggere (1× Livello B) |
| `src/components/user/dashboard/UserNotificationsTab.tsx` | 1 | baseline storica — da correggere (1× Livello B) |

Nota: il dettaglio riga e riproducibile in qualsiasi momento con `npx biome check --reporter=json` filtrato sulla categoria.

