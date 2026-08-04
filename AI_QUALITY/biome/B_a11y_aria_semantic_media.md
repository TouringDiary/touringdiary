# a11y-aria-semantic

> Dettaglio baseline Biome full-project. Dashboard: [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md)

| Campo | Valore |
|----|----|
| **Documento** | `AI_QUALITY/biome/B_a11y_aria_semantic_media.md` |
| **Categorie** | `lint/a11y/useAriaPropsSupportedByRole`, `lint/a11y/useSemanticElements`, `lint/a11y/noSvgWithoutTitle`, `lint/a11y/noNoninteractiveElementToInteractiveRole`, `lint/a11y/useAltText`, `lint/a11y/useFocusableInteractive`, `lint/a11y/useValidAnchor` |
| **Occorrenze (somma gruppo)** | **44** |
| **File unici nel gruppo** | **37** |
| **Livello** | **B** |
| **Ultimo aggiornamento** | 2026-08-03 |
| **Stato** | Baseline ufficiale — nessuna correzione applicata in questa attivita |

## `lint/a11y/useAriaPropsSupportedByRole`

### Descrizione della regola

Proprieta ARIA devono essere supportate dal ruolo.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/a11y/useAriaPropsSupportedByRole` |
| **Occorrenze totali** | **13** |
| **Error** | 13 |
| **Warning** | 0 |
| **Info** | 0 |
| **File coinvolti** | **11** |
| **Livello di rischio** | **B** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Correzione ARIA richiede capire ruolo effettivo.

### Strategia di correzione

Allineare role e aria-* o cambiare elemento.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/components/features/diary/packing_list/suitcase/SuitcaseItemRow.tsx` | 2 |
| `src/components/user/dashboard/UserSuitcasesTab.tsx` | 2 |
| `src/components/admin/platformControl/PlatformControlTabBanner.tsx` | 1 |
| `src/components/collaboration/compositionSelectableRow.tsx` | 1 |
| `src/components/collaboration/live/CollaborationLiveBar.tsx` | 1 |
| `src/components/collaboration/SharedResourceIndicator.tsx` | 1 |
| `src/components/common/AnchoredPopover.tsx` | 1 |
| `src/components/common/HorizontalScrollStrip.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseCard.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseDashboardGuideColumn.tsx` | 1 |
| `src/components/modals/ExportModal.tsx` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `src/components/admin/platformControl/PlatformControlTabBanner.tsx` | 29 | error | da correggere (Livello B) |
| 2 | `src/components/collaboration/compositionSelectableRow.tsx` | 53 | error | da correggere (Livello B) |
| 3 | `src/components/collaboration/live/CollaborationLiveBar.tsx` | 15 | error | da correggere (Livello B) |
| 4 | `src/components/collaboration/SharedResourceIndicator.tsx` | 10 | error | da correggere (Livello B) |
| 5 | `src/components/common/AnchoredPopover.tsx` | 87 | error | da correggere (Livello B) |
| 6 | `src/components/common/HorizontalScrollStrip.tsx` | 63 | error | da correggere (Livello B) |
| 7 | `src/components/features/diary/packing_list/suitcase/SuitcaseCard.tsx` | 170 | error | da correggere (Livello B) |
| 8 | `src/components/features/diary/packing_list/suitcase/SuitcaseDashboardGuideColumn.tsx` | 47 | error | da correggere (Livello B) |
| 9 | `src/components/features/diary/packing_list/suitcase/SuitcaseItemRow.tsx` | 173 | error | da correggere (Livello B) |
| 10 | `src/components/features/diary/packing_list/suitcase/SuitcaseItemRow.tsx` | 199 | error | da correggere (Livello B) |
| 11 | `src/components/modals/ExportModal.tsx` | 643 | error | da correggere (Livello B) |
| 12 | `src/components/user/dashboard/UserSuitcasesTab.tsx` | 82 | error | da correggere (Livello B) |
| 13 | `src/components/user/dashboard/UserSuitcasesTab.tsx` | 89 | error | da correggere (Livello B) |

## `lint/a11y/useSemanticElements`

### Descrizione della regola

Preferire elementi semantici a role ARIA equivalenti.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/a11y/useSemanticElements` |
| **Occorrenze totali** | **10** |
| **Error** | 10 |
| **Warning** | 0 |
| **Info** | 0 |
| **File coinvolti** | **10** |
| **Livello di rischio** | **B** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

role→elemento semantico puo alterare stile/CSS.

### Strategia di correzione

Sostituire con elemento nativo e adattare CSS.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/components/features/diary/notes/DiaryNotesPanel.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/CategorySection.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseCard.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseItemRow.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseToolbarGroup.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/TemplateRow.tsx` | 1 |
| `src/components/home/hero/components/HeroCompactTypingField.tsx` | 1 |
| `src/components/home/hero/HeroAiModule.tsx` | 1 |
| `src/components/modals/ReviewModal.tsx` | 1 |
| `src/components/myspace/MySpaceTripsCatalog.tsx` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `src/components/features/diary/notes/DiaryNotesPanel.tsx` | 145 | error | da correggere (Livello B) |
| 2 | `src/components/features/diary/packing_list/suitcase/CategorySection.tsx` | 78 | error | da correggere (Livello B) |
| 3 | `src/components/features/diary/packing_list/suitcase/SuitcaseCard.tsx` | 237 | error | da correggere (Livello B) |
| 4 | `src/components/features/diary/packing_list/suitcase/SuitcaseItemRow.tsx` | 236 | error | da correggere (Livello B) |
| 5 | `src/components/features/diary/packing_list/suitcase/SuitcaseToolbarGroup.tsx` | 32 | error | da correggere (Livello B) |
| 6 | `src/components/features/diary/packing_list/suitcase/TemplateRow.tsx` | 204 | error | da correggere (Livello B) |
| 7 | `src/components/home/hero/components/HeroCompactTypingField.tsx` | 93 | error | da correggere (Livello B) |
| 8 | `src/components/home/hero/HeroAiModule.tsx` | 179 | error | da correggere (Livello B) |
| 9 | `src/components/modals/ReviewModal.tsx` | 354 | error | da correggere (Livello B) |
| 10 | `src/components/myspace/MySpaceTripsCatalog.tsx` | 111 | error | da correggere (Livello B) |

## `lint/a11y/noSvgWithoutTitle`

### Descrizione della regola

SVG non decorative richiedono title accessibile.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/a11y/noSvgWithoutTitle` |
| **Occorrenze totali** | **9** |
| **Error** | 9 |
| **Warning** | 0 |
| **Info** | 0 |
| **File coinvolti** | **9** |
| **Livello di rischio** | **B** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

title/aria-label dipende da decorative vs informative.

### Strategia di correzione

title/aria-hidden per decorative.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/components/admin/onboarding/OnboardingVisualEditor.tsx` | 1 |
| `src/components/common/MascotSvg.tsx` | 1 |
| `src/components/export/ExportLogo.tsx` | 1 |
| `src/components/features/diary/ItineraryItemCard.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/AffiliateSuggestionBox.tsx` | 1 |
| `src/components/itineraries/ItinerariesExplorer.tsx` | 1 |
| `src/components/layout/Header.tsx` | 1 |
| `src/components/marketing/SponsorPlanCard.tsx` | 1 |
| `src/components/user/dashboard/UserReferralTab.tsx` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `src/components/admin/onboarding/OnboardingVisualEditor.tsx` | 316 | error | da correggere (Livello B) |
| 2 | `src/components/common/MascotSvg.tsx` | 74 | error | da correggere (Livello B) |
| 3 | `src/components/export/ExportLogo.tsx` | 36 | error | da correggere (Livello B) |
| 4 | `src/components/features/diary/ItineraryItemCard.tsx` | 271 | error | da correggere (Livello B) |
| 5 | `src/components/features/diary/packing_list/suitcase/AffiliateSuggestionBox.tsx` | 319 | error | da correggere (Livello B) |
| 6 | `src/components/itineraries/ItinerariesExplorer.tsx` | 300 | error | da correggere (Livello B) |
| 7 | `src/components/layout/Header.tsx` | 45 | error | da correggere (Livello B) |
| 8 | `src/components/marketing/SponsorPlanCard.tsx` | 87 | error | da correggere (Livello B) |
| 9 | `src/components/user/dashboard/UserReferralTab.tsx` | 37 | error | da correggere (Livello B) |

## `lint/a11y/noNoninteractiveElementToInteractiveRole`

### Descrizione della regola

Elementi non interattivi non devono ricevere ruoli interattivi.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/a11y/noNoninteractiveElementToInteractiveRole` |
| **Occorrenze totali** | **7** |
| **Error** | 7 |
| **Warning** | 0 |
| **Info** | 0 |
| **File coinvolti** | **7** |
| **Livello di rischio** | **B** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Restruct markup; review a11y/UX.

### Strategia di correzione

Elemento interattivo nativo o pattern corretto.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/components/collaboration/WorkspacePickElementStep.tsx` | 1 |
| `src/components/myspace/MySpaceFavoritesRoot.tsx` | 1 |
| `src/components/myspace/MySpaceRootNav.tsx` | 1 |
| `src/components/myspace/ViaggioFolderShell.tsx` | 1 |
| `src/components/workspace/global/sections/AllegatiSection.tsx` | 1 |
| `src/components/workspace/global/WorkspaceSectionNav.tsx` | 1 |
| `src/components/workspace/global/WorkspaceViaggioShellNav.tsx` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `src/components/collaboration/WorkspacePickElementStep.tsx` | 56 | error | da correggere (Livello B) |
| 2 | `src/components/myspace/MySpaceFavoritesRoot.tsx` | 561 | error | da correggere (Livello B) |
| 3 | `src/components/myspace/MySpaceRootNav.tsx` | 22 | error | da correggere (Livello B) |
| 4 | `src/components/myspace/ViaggioFolderShell.tsx` | 218 | error | da correggere (Livello B) |
| 5 | `src/components/workspace/global/sections/AllegatiSection.tsx` | 46 | error | da correggere (Livello B) |
| 6 | `src/components/workspace/global/WorkspaceSectionNav.tsx` | 23 | error | da correggere (Livello B) |
| 7 | `src/components/workspace/global/WorkspaceViaggioShellNav.tsx` | 67 | error | da correggere (Livello B) |

## `lint/a11y/useAltText`

### Descrizione della regola

Immagini richiedono testo alternativo appropriato.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/a11y/useAltText` |
| **Occorrenze totali** | **3** |
| **Error** | 3 |
| **Warning** | 0 |
| **Info** | 0 |
| **File coinvolti** | **2** |
| **Livello di rischio** | **B** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

alt content e prodotto/contenuto.

### Strategia di correzione

alt significativo o alt vuoto se decorative.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/components/user/dashboard/UserReferralTab.tsx` | 2 |
| `src/components/admin/cityEditor/EditorCulture.tsx` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `src/components/admin/cityEditor/EditorCulture.tsx` | 514 | error | da correggere (Livello B) |
| 2 | `src/components/user/dashboard/UserReferralTab.tsx` | 402 | error | da correggere (Livello B) |
| 3 | `src/components/user/dashboard/UserReferralTab.tsx` | 451 | error | da correggere (Livello B) |

## `lint/a11y/useFocusableInteractive`

### Descrizione della regola

Elementi interattivi devono essere focusabili.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/a11y/useFocusableInteractive` |
| **Occorrenze totali** | **1** |
| **Error** | 1 |
| **Warning** | 0 |
| **Info** | 0 |
| **File coinvolti** | **1** |
| **Livello di rischio** | **B** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

tabIndex/focusability; review interazione.

### Strategia di correzione

Rendere focusabile o usare controllo nativo.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/components/features/diary/packing_list/suitcase/TemplateRow.tsx` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `src/components/features/diary/packing_list/suitcase/TemplateRow.tsx` | 84 | error | da correggere (Livello B) |

## `lint/a11y/useValidAnchor`

### Descrizione della regola

Anchor deve avere href valido o essere sostituito da button.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/a11y/useValidAnchor` |
| **Occorrenze totali** | **1** |
| **Error** | 1 |
| **Warning** | 0 |
| **Info** | 0 |
| **File coinvolti** | **1** |
| **Livello di rischio** | **B** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

href/button swap; review navigazione.

### Strategia di correzione

a con href o button.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/components/modals/AuthModal.tsx` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `src/components/modals/AuthModal.tsx` | 612 | error | da correggere (Livello B) |

