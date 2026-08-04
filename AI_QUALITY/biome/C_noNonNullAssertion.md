# noNonNullAssertion

> Dettaglio baseline Biome full-project. Dashboard: [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md)

| Campo | Valore |
|----|----|
| **Documento** | `AI_QUALITY/biome/C_noNonNullAssertion.md` |
| **Categorie** | `lint/style/noNonNullAssertion` |
| **Occorrenze (somma gruppo)** | **128** |
| **File unici nel gruppo** | **35** |
| **Livello** | **C** |
| **Ultimo aggiornamento** | 2026-08-03 |
| **Stato** | Baseline ufficiale — nessuna correzione applicata in questa attivita |

## `lint/style/noNonNullAssertion`

### Descrizione della regola

Operatore non-null assertion (!).

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/style/noNonNullAssertion` |
| **Occorrenze totali** | **128** |
| **Error** | 0 |
| **Warning** | 128 |
| **Info** | 0 |
| **File coinvolti** | **35** |
| **Livello di rischio** | **C** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

! nasconde null; serve narrowing reale.

### Strategia di correzione

Narrowing / guard / optional; vietato ! cieco.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/hooks/admin/useAiCompleteCity.ts` | 17 |
| `src/components/admin/cityEditor/culture/CulturePeople.tsx` | 14 |
| `src/components/admin/cityEditor/EditorCulture.tsx` | 14 |
| `src/components/modals/poiDetail/PoiInfoSection.tsx` | 10 |
| `src/components/admin/cityEditor/services/ServiceGeneric.tsx` | 9 |
| `src/components/admin/cityEditor/services/ServiceEvents.tsx` | 6 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseItemActions.ts` | 6 |
| `src/components/admin/cityEditor/services/ServiceGuides.tsx` | 5 |
| `src/components/admin/cityEditor/services/ServiceOperators.tsx` | 5 |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx` | 4 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseCard.tsx` | 3 |
| `src/components/features/diary/packing_list/suitcase/SuitcaseDashboardGuideColumn.tsx` | 3 |
| `src/components/myspace/ViaggioDiarioSection.tsx` | 3 |
| `src/components/admin/ItineraryManager.tsx` | 2 |
| `src/components/admin/SponsorFilters.tsx` | 2 |
| `src/components/modals/cityInfo/ServicesCategoryList.tsx` | 2 |
| `src/components/modals/sponsor/SponsorPricingSelector.tsx` | 2 |
| `src/components/myspace/ViaggioRoadbookSection.tsx` | 2 |
| `src/domain/packing/categorySetup.ts` | 2 |
| `src/hooks/save/useSuitcaseDocumentSave.ts` | 2 |
| `src/components/admin/cityEditor/tabs/TabCulture.tsx` | 1 |
| `src/components/aiPlanner/AiPlannerTimeline.tsx` | 1 |
| `src/components/common/CustomCalendar.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/TemplateRow.tsx` | 1 |
| `src/components/modals/CultureCornerModal.tsx` | 1 |
| `src/components/user/BusinessShopManager.tsx` | 1 |
| `src/components/user/profile/UserAvatar.tsx` | 1 |
| `src/domain/packing/itemDisplayOrder.ts` | 1 |
| `src/hooks/admin/people/usePeopleAI.ts` | 1 |
| `src/hooks/admin/people/usePeopleData.ts` | 1 |
| `src/hooks/useAiGeneration.ts` | 1 |
| `src/services/community/itineraryService.ts` | 1 |
| `src/services/importService.ts` | 1 |
| `src/services/suitcase/associateSuitcaseWithDiary.ts` | 1 |
| `src/services/suitcase/prepareForAssociation.ts` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

Occorrenze totali: **128** (sopra soglia elenco riga-per-riga). Inventario sintetico per file:

| File | Occorrenze | Decisione baseline per-file |
|---|---:|---|
| `src/hooks/admin/useAiCompleteCity.ts` | 17 | da correggere (17× Livello C) |
| `src/components/admin/cityEditor/culture/CulturePeople.tsx` | 14 | da correggere (14× Livello C) |
| `src/components/admin/cityEditor/EditorCulture.tsx` | 14 | da correggere (14× Livello C) |
| `src/components/modals/poiDetail/PoiInfoSection.tsx` | 10 | da correggere (10× Livello C) |
| `src/components/admin/cityEditor/services/ServiceGeneric.tsx` | 9 | da correggere (9× Livello C) |
| `src/components/admin/cityEditor/services/ServiceEvents.tsx` | 6 | da correggere (6× Livello C) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useSuitcaseItemActions.ts` | 6 | da correggere (6× Livello C) |
| `src/components/admin/cityEditor/services/ServiceGuides.tsx` | 5 | da correggere (5× Livello C) |
| `src/components/admin/cityEditor/services/ServiceOperators.tsx` | 5 | da correggere (5× Livello C) |
| `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx` | 4 | da correggere (4× Livello C) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseCard.tsx` | 3 | da correggere (3× Livello C) |
| `src/components/features/diary/packing_list/suitcase/SuitcaseDashboardGuideColumn.tsx` | 3 | da correggere (3× Livello C) |
| `src/components/myspace/ViaggioDiarioSection.tsx` | 3 | da correggere (3× Livello C) |
| `src/components/admin/ItineraryManager.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/admin/SponsorFilters.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/modals/cityInfo/ServicesCategoryList.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/modals/sponsor/SponsorPricingSelector.tsx` | 2 | da correggere (2× Livello C) |
| `src/components/myspace/ViaggioRoadbookSection.tsx` | 2 | da correggere (2× Livello C) |
| `src/domain/packing/categorySetup.ts` | 2 | da correggere (2× Livello C) |
| `src/hooks/save/useSuitcaseDocumentSave.ts` | 2 | da correggere (2× Livello C) |
| `src/components/admin/cityEditor/tabs/TabCulture.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/aiPlanner/AiPlannerTimeline.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/common/CustomCalendar.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/features/diary/packing_list/suitcase/TemplateRow.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/modals/CultureCornerModal.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/user/BusinessShopManager.tsx` | 1 | da correggere (1× Livello C) |
| `src/components/user/profile/UserAvatar.tsx` | 1 | da correggere (1× Livello C) |
| `src/domain/packing/itemDisplayOrder.ts` | 1 | da correggere (1× Livello C) |
| `src/hooks/admin/people/usePeopleAI.ts` | 1 | da correggere (1× Livello C) |
| `src/hooks/admin/people/usePeopleData.ts` | 1 | da correggere (1× Livello C) |
| `src/hooks/useAiGeneration.ts` | 1 | da correggere (1× Livello C) |
| `src/services/community/itineraryService.ts` | 1 | da correggere (1× Livello C) |
| `src/services/importService.ts` | 1 | da correggere (1× Livello C) |
| `src/services/suitcase/associateSuitcaseWithDiary.ts` | 1 | da correggere (1× Livello C) |
| `src/services/suitcase/prepareForAssociation.ts` | 1 | da correggere (1× Livello C) |

Nota: il dettaglio riga e riproducibile in qualsiasi momento con `npx biome check --reporter=json` filtrato sulla categoria.

