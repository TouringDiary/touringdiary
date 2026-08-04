# c-hooks-security-parse

> Dettaglio baseline Biome full-project. Dashboard: [`AI_BIOME_AUDIT.md`](../../AI_BIOME_AUDIT.md)

| Campo | Valore |
|----|----|
| **Documento** | `AI_QUALITY/biome/C_hooks_security_parse_tsignore.md` |
| **Categorie** | `lint/correctness/useHookAtTopLevel`, `lint/security/noDangerouslySetInnerHtml`, `lint/suspicious/noTsIgnore`, `parse` |
| **Occorrenze (somma gruppo)** | **35** |
| **File unici nel gruppo** | **17** |
| **Livello** | **C** |
| **Ultimo aggiornamento** | 2026-08-03 |
| **Stato** | Baseline ufficiale — nessuna correzione applicata in questa attivita |

## `lint/correctness/useHookAtTopLevel`

### Descrizione della regola

Hook React non chiamati al top level del componente.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/correctness/useHookAtTopLevel` |
| **Occorrenze totali** | **13** |
| **Error** | 13 |
| **Warning** | 0 |
| **Info** | 0 |
| **File coinvolti** | **4** |
| **Livello di rischio** | **C** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Hook condizionali: richiede refactor struttura componente.

### Strategia di correzione

Estrarre sotto-componenti / unconditional hooks.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/components/modals/SuggestionReviewModal.tsx` | 6 |
| `src/components/modals/SectionPreviewModal.tsx` | 5 |
| `src/components/modals/FullRankingsModal.tsx` | 1 |
| `src/hooks/save/useDocumentSaveController.ts` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `src/components/modals/FullRankingsModal.tsx` | 52 | error | da correggere (Livello C) |
| 2 | `src/components/modals/SectionPreviewModal.tsx` | 57 | error | da correggere (Livello C) |
| 3 | `src/components/modals/SectionPreviewModal.tsx` | 63 | error | da correggere (Livello C) |
| 4 | `src/components/modals/SectionPreviewModal.tsx` | 66 | error | da correggere (Livello C) |
| 5 | `src/components/modals/SectionPreviewModal.tsx` | 72 | error | da correggere (Livello C) |
| 6 | `src/components/modals/SectionPreviewModal.tsx` | 88 | error | da correggere (Livello C) |
| 7 | `src/components/modals/SuggestionReviewModal.tsx` | 74 | error | da correggere (Livello C) |
| 8 | `src/components/modals/SuggestionReviewModal.tsx` | 84 | error | da correggere (Livello C) |
| 9 | `src/components/modals/SuggestionReviewModal.tsx` | 85 | error | da correggere (Livello C) |
| 10 | `src/components/modals/SuggestionReviewModal.tsx` | 86 | error | da correggere (Livello C) |
| 11 | `src/components/modals/SuggestionReviewModal.tsx` | 90 | error | da correggere (Livello C) |
| 12 | `src/components/modals/SuggestionReviewModal.tsx` | 103 | error | da correggere (Livello C) |
| 13 | `src/hooks/save/useDocumentSaveController.ts` | 200 | error | da correggere (Livello C) |

## `lint/security/noDangerouslySetInnerHtml`

### Descrizione della regola

Uso di dangerouslySetInnerHTML (rischio XSS).

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/security/noDangerouslySetInnerHtml` |
| **Occorrenze totali** | **11** |
| **Error** | 11 |
| **Warning** | 0 |
| **Info** | 0 |
| **File coinvolti** | **11** |
| **Livello di rischio** | **C** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

XSS/sanitizzazione; review sicurezza contenuti.

### Strategia di correzione

Sanitize o eliminare HTML crudo; review security.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/components/admin/AdminItineraryEditor.tsx` | 1 |
| `src/components/admin/common/AdminGuideModal.tsx` | 1 |
| `src/components/admin/design/ComponentPreviewHost.tsx` | 1 |
| `src/components/admin/NewsTickerManager.tsx` | 1 |
| `src/components/layout/NewsTicker.tsx` | 1 |
| `src/components/layout/StaticPage.tsx` | 1 |
| `src/components/modals/AiItineraryModal.tsx` | 1 |
| `src/components/modals/EmptyDiaryModal.tsx` | 1 |
| `src/components/modals/HistoryModal.tsx` | 1 |
| `src/components/modals/PatronSaintModal.tsx` | 1 |
| `src/components/modals/sponsor/SponsorSuccess.tsx` | 1 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `src/components/admin/AdminItineraryEditor.tsx` | 565 | error | da correggere (Livello C) |
| 2 | `src/components/admin/common/AdminGuideModal.tsx` | 49 | error | da correggere (Livello C) |
| 3 | `src/components/admin/design/ComponentPreviewHost.tsx` | 82 | error | da correggere (Livello C) |
| 4 | `src/components/admin/NewsTickerManager.tsx` | 341 | error | da correggere (Livello C) |
| 5 | `src/components/layout/NewsTicker.tsx` | 85 | error | da correggere (Livello C) |
| 6 | `src/components/layout/StaticPage.tsx` | 94 | error | da correggere (Livello C) |
| 7 | `src/components/modals/AiItineraryModal.tsx` | 93 | error | da correggere (Livello C) |
| 8 | `src/components/modals/EmptyDiaryModal.tsx` | 71 | error | da correggere (Livello C) |
| 9 | `src/components/modals/HistoryModal.tsx` | 121 | error | da correggere (Livello C) |
| 10 | `src/components/modals/PatronSaintModal.tsx` | 117 | error | da correggere (Livello C) |
| 11 | `src/components/modals/sponsor/SponsorSuccess.tsx` | 31 | error | da correggere (Livello C) |

## `lint/suspicious/noTsIgnore`

### Descrizione della regola

Direttive @ts-ignore / equivalenti.

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `lint/suspicious/noTsIgnore` |
| **Occorrenze totali** | **2** |
| **Error** | 0 |
| **Warning** | 2 |
| **Info** | 0 |
| **File coinvolti** | **1** |
| **Livello di rischio** | **C** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

@ts-ignore→fix tipizzato; puo rivelare errori reali.

### Strategia di correzione

Rimuovere ignore e tipizzare correttamente.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/config/env.ts` | 2 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `src/config/env.ts` | 19 | warning | da correggere (Livello C) |
| 2 | `src/config/env.ts` | 21 | warning | da correggere (Livello C) |

## `parse`

### Descrizione della regola

Il parser Biome non riesce ad analizzare il file (sintassi / contenuto).

### Contabilita

| Campo | Valore |
|----|----|
| **Categoria Biome** | `parse` |
| **Occorrenze totali** | **9** |
| **Error** | 9 |
| **Warning** | 0 |
| **Info** | 0 |
| **File coinvolti** | **1** |
| **Livello di rischio** | **C** |
| **Stato bonifica** | Aperto (baseline) |
| **Decisione finale baseline** | da correggere |

### Motivazione della classificazione

Errori di parse: codice non valido o strumento; priorita alta, non cosmetic.

### Strategia di correzione

Riparare sintassi / isolare file; sblocca lint sul file.

### Elenco completo file + occorrenze per file

| File | Occorrenze |
|---|---:|
| `src/index.css` | 9 |

### Analisi delle occorrenze

Ogni occorrenza della regola e trattata come debito legacy omogeneo a livello di **categoria** nella baseline. L'analisi per file sotto e la contabilita operativa; eventuali escalation a Livello D (falso positivo / decisione prodotto) avvengono solo dopo review puntuale e vanno registrate in `D_policy_and_false_positives.md`.

| # | File | Riga | Severity | Decisione baseline |
|---:|---|---:|---|---|
| 1 | `src/index.css` | 3 | error | da correggere (Livello C) |
| 2 | `src/index.css` | 150 | error | da correggere (Livello C) |
| 3 | `src/index.css` | 154 | error | da correggere (Livello C) |
| 4 | `src/index.css` | 172 | error | da correggere (Livello C) |
| 5 | `src/index.css` | 179 | error | da correggere (Livello C) |
| 6 | `src/index.css` | 183 | error | da correggere (Livello C) |
| 7 | `src/index.css` | 187 | error | da correggere (Livello C) |
| 8 | `src/index.css` | 192 | error | da correggere (Livello C) |
| 9 | `src/index.css` | 196 | error | da correggere (Livello C) |

