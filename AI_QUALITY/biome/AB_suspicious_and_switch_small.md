# ab-suspicious-small

> Dettaglio baseline Biome full-project. Dashboard: [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md)

| Campo | Valore |
|----|----|
| **Documento** | `AI_QUALITY/biome/AB_suspicious_and_switch_small.md` |
| **Categorie** | `lint/suspicious/noGlobalIsNan`, `lint/suspicious/noDoubleEquals`, `lint/suspicious/noPrototypeBuiltins`, `lint/correctness/noSwitchDeclarations`, `lint/style/noDescendingSpecificity` |
| **Occorrenze (somma gruppo)** | **31** |
| **File unici nel gruppo** | **25** |
| **Livello** | **A/B** |
| **Ultimo aggiornamento** | 2026-08-03 |
| **Stato** | Baseline ufficiale — nessuna correzione applicata in questa attivita |

## `lint/suspicious/noGlobalIsNan`

### Descrizione della regola

Evitare isNaN globale; preferire Number.isNaN.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/suspicious/noGlobalIsNan` |
| **Occorrenze totali** | **17** |
| **Error** | 0 |
| **Warning** | 17 |
| **Info** | 0 |
| **File coinvolti** | **16** |
| **Livello di rischio** | **A/B** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Number.isNaN dopo Number(); breve check sul tipo del valore.

### Strategia di correzione

Sostituire isNaN(x) con Number.isNaN(Number(x)) dove appropriato.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/components/features/diary/DiaryHeader.tsx` | 2 |
| `src/components/admin/cities/CitiesListTab.tsx` | 1 |
| `src/components/admin/cityEditor/EditorCulture.tsx` | 1 |
| `src/components/admin/cityEditor/services/ServiceEvents.tsx` | 1 |
| `src/components/admin/cityEditor/services/ServiceGeneric.tsx` | 1 |
| `src/components/admin/cityEditor/services/ServiceGuides.tsx` | 1 |
| `src/components/admin/cityEditor/services/ServiceOperators.tsx` | 1 |
| `src/components/admin/LoadingTipsManager.tsx` | 1 |
| `src/components/admin/settings/inputs/NumberInput.tsx` | 1 |
| `src/components/aiPlanner/AiPlannerForm.tsx` | 1 |
| `src/components/features/diary/packing_list/suitcase/TripSuitcaseSection.tsx` | 1 |
| `src/hooks/admin/people/usePeopleData.ts` | 1 |
| `src/hooks/usePoiForm.ts` | 1 |
| `src/hooks/usePoiManager.ts` | 1 |
| `src/services/city/parsers/shared/ensureNumber.ts` | 1 |
| `src/utils/sponsorValidation.ts` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `src/components/admin/cities/CitiesListTab.tsx` | 254 | warning | da correggere (Livello A/B) |
| 2 | `src/components/admin/cityEditor/EditorCulture.tsx` | 298 | warning | da correggere (Livello A/B) |
| 3 | `src/components/admin/cityEditor/services/ServiceEvents.tsx` | 67 | warning | da correggere (Livello A/B) |
| 4 | `src/components/admin/cityEditor/services/ServiceGeneric.tsx` | 76 | warning | da correggere (Livello A/B) |
| 5 | `src/components/admin/cityEditor/services/ServiceGuides.tsx` | 65 | warning | da correggere (Livello A/B) |
| 6 | `src/components/admin/cityEditor/services/ServiceOperators.tsx` | 73 | warning | da correggere (Livello A/B) |
| 7 | `src/components/admin/LoadingTipsManager.tsx` | 153 | warning | da correggere (Livello A/B) |
| 8 | `src/components/admin/settings/inputs/NumberInput.tsx` | 22 | warning | da correggere (Livello A/B) |
| 9 | `src/components/aiPlanner/AiPlannerForm.tsx` | 335 | warning | da correggere (Livello A/B) |
| 10 | `src/components/features/diary/DiaryHeader.tsx` | 78 | warning | da correggere (Livello A/B) |
| 11 | `src/components/features/diary/DiaryHeader.tsx` | 291 | warning | da correggere (Livello A/B) |
| 12 | `src/components/features/diary/packing_list/suitcase/TripSuitcaseSection.tsx` | 65 | warning | da correggere (Livello A/B) |
| 13 | `src/hooks/admin/people/usePeopleData.ts` | 126 | warning | da correggere (Livello A/B) |
| 14 | `src/hooks/usePoiForm.ts` | 69 | warning | da correggere (Livello A/B) |
| 15 | `src/hooks/usePoiManager.ts` | 199 | warning | da correggere (Livello A/B) |
| 16 | `src/services/city/parsers/shared/ensureNumber.ts` | 9 | warning | da correggere (Livello A/B) |
| 17 | `src/utils/sponsorValidation.ts` | 33 | warning | da correggere (Livello A/B) |

## `lint/suspicious/noDoubleEquals`

### Descrizione della regola

Evitare == / != a favore di === / !==.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/suspicious/noDoubleEquals` |
| **Occorrenze totali** | **2** |
| **Error** | 2 |
| **Warning** | 0 |
| **Info** | 0 |
| **File coinvolti** | **1** |
| **Livello di rischio** | **A/B** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

==→=== con check coercizione intenzionale.

### Strategia di correzione

=== salvo null-check intenzionali (== null).

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/utils/common.ts` | 2 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `src/utils/common.ts` | 44 | error | da correggere (Livello A/B) |
| 2 | `src/utils/common.ts` | 44 | error | da correggere (Livello A/B) |

## `lint/suspicious/noPrototypeBuiltins`

### Descrizione della regola

Non chiamare builtins direttamente su Object.prototype tramite istanze.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/suspicious/noPrototypeBuiltins` |
| **Occorrenze totali** | **5** |
| **Error** | 0 |
| **Warning** | 5 |
| **Info** | 0 |
| **File coinvolti** | **4** |
| **Livello di rischio** | **A/B** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Object.hasOwn / Object.prototype.hasOwnProperty.call; breve verifica.

### Strategia di correzione

Safe rewrite prototype builtins.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/services/storageService.ts` | 2 |
| `src/components/modals/ReviewModal.tsx` | 1 |
| `src/focus/focusModeRegistry.ts` | 1 |
| `src/hooks/admin/useAffiliateAnalytics.ts` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `src/components/modals/ReviewModal.tsx` | 81 | warning | da correggere (Livello A/B) |
| 2 | `src/focus/focusModeRegistry.ts` | 108 | warning | da correggere (Livello A/B) |
| 3 | `src/hooks/admin/useAffiliateAnalytics.ts` | 105 | warning | da correggere (Livello A/B) |
| 4 | `src/services/storageService.ts` | 74 | warning | da correggere (Livello A/B) |
| 5 | `src/services/storageService.ts` | 133 | warning | da correggere (Livello A/B) |

## `lint/correctness/noSwitchDeclarations`

### Descrizione della regola

Declarazioni lessicali in case senza blocco scope.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/correctness/noSwitchDeclarations` |
| **Occorrenze totali** | **6** |
| **Error** | 6 |
| **Warning** | 0 |
| **Info** | 0 |
| **File coinvolti** | **3** |
| **Livello di rischio** | **A/B** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Scope block attorno a case; meccanico ma va verificato TDZ/shadowing.

### Strategia di correzione

Avvolgere case body in {}.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/hooks/useDiaryUndo.ts` | 3 |
| `src/components/city/tabs/CityCategoryTab.tsx` | 2 |
| `src/components/user/dashboard/UserReferralTab.tsx` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `src/components/city/tabs/CityCategoryTab.tsx` | 292 | error | da correggere (Livello A/B) |
| 2 | `src/components/city/tabs/CityCategoryTab.tsx` | 293 | error | da correggere (Livello A/B) |
| 3 | `src/components/user/dashboard/UserReferralTab.tsx` | 157 | error | da correggere (Livello A/B) |
| 4 | `src/hooks/useDiaryUndo.ts` | 75 | error | da correggere (Livello A/B) |
| 5 | `src/hooks/useDiaryUndo.ts` | 76 | error | da correggere (Livello A/B) |
| 6 | `src/hooks/useDiaryUndo.ts` | 107 | error | da correggere (Livello A/B) |

## `lint/style/noDescendingSpecificity`

### Descrizione della regola

Selettori CSS con specificita discendente rispetto a regole precedenti.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/style/noDescendingSpecificity` |
| **Occorrenze totali** | **1** |
| **Error** | 0 |
| **Warning** | 1 |
| **Info** | 0 |
| **File coinvolti** | **1** |
| **Livello di rischio** | **A/B** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

CSS specificity; verificare cascade intenzionale.

### Strategia di correzione

Riordinare selettori o alzare specificita in modo consapevole.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/components/features/diary/notes/diaryNotesEditor.css` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `src/components/features/diary/notes/diaryNotesEditor.css` | 84 | warning | da correggere (Livello A/B) |

