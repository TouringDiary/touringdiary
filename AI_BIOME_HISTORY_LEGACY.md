# AI Biome History — Legacy (dettaglio congelato)

Archivio **estremamente dettagliato** della bonifica Biome full-project TouringDiary.

> **Non** è la Source of Truth operativa.  
> **Non** è l’archivio storico di consultazione quotidiana.  
> SoT viva: [`AI_BIOME_AUDIT.md`](./AI_BIOME_AUDIT.md)  
> Archivio storico principale (cronologia, decisioni, contabilità): [`AI_BIOME_HISTORY.md`](./AI_BIOME_HISTORY.md)

Questo file conserva **integralmente** i blocchi spostati dallo split documentale del **2026-08-06**:
- dettaglio completo batch conclusi L0 + L1 (cataloghi hit-per-hit, piano A/B/C, riclassificazione);
- appendici elenco file (`useButtonType` 205, `noUnusedImports` 230, …);
- testo pre-split congelato delle sezioni L2 / L3 / L4.

**Nessuna informazione eliminata** — solo spostamento da History → Legacy.

| Documento | Ruolo |
|-----------|--------|
| [`AI_BIOME_AUDIT.md`](./AI_BIOME_AUDIT.md) | SoT operativa viva |
| [`AI_BIOME_HISTORY.md`](./AI_BIOME_HISTORY.md) | Archivio storico principale (consultabile) |
| [`AI_BIOME_HISTORY_LEGACY.md`](./AI_BIOME_HISTORY_LEGACY.md) (questo file) | Dettaglio congelato / appendici |
| [`AI_BIOME_AUDIT_35_FILES_HISTORY.md`](./AI_BIOME_AUDIT_35_FILES_HISTORY.md) | Storico audit parziale 35 file |
| [`AI_QUALITY/README.md`](./AI_QUALITY/README.md) | Dettaglio per categoria |

---

# Indice Legacy

1. [Dettaglio batch conclusi L0 + L1](#dettaglio-batch-conclusi-l0--l1)
2. [Testo pre-split L2 / L3 / L4 (congelato)](#testo-pre-split-l2--l3--l4-congelato)

---

# Dettaglio batch conclusi (L0 + L1)

> Testo integrale delle sezioni «LIVELLO 0» e «LIVELLO 1» della SoT pre-split (include cataloghi hit-per-hit, piano A/B/C, riclassificazione formale, appendix elenchi file).

## LIVELLO 0 — Batch certificato — **COMPLETATO**

Comprende **esclusivamente** categorie **certificate** come correggibili in massa con rischio praticamente nullo.

### Stato ufficiale

| Campo | Valore |
|----|----|
| **Stato livello** | **COMPLETATO** |
| **Accettazione PO** | **SÌ** (2026-08-04) |
| **Diagnostiche iniziali L0** | 2802 |
| **Diagnostiche risolte** | 2801 |
| **Diagnostiche residue** | **1** (`format` su `src/index.css`) |
| **% completata** | **99,96%** |

### Cosa significa L0 (e cosa non significa)

- **Significa:** la categoria è **autorizzata** per una futura bonifica massiva. È un batch **certificato**, non un’ipotesi.
- **Non significa:** che verrà corretta **immediatamente**. L’esecuzione resta una decisione di pianificazione (Parte 3 / Stato del piano).
- Finché lo stato operativo è `Batch pronto`, il debito è **pronto all’esecuzione** ma **non ancora bonificato**.
- Solo dopo l’esecuzione del batch lo stato passa a `Batch completato` / `Chiusa` (e si aggiorna lo snapshot).

Requisiti di certificazione (tutti obbligatori):

- modifica meccanica;
- nessun impatto funzionale;
- nessun rischio architetturale;
- nessuna analisi preventiva ulteriore necessaria (già soddisfatta o non richiesta).

| Categorie (pre-batch) | Occ. pre | File | % totale pre |
|----|---:|---:|---:|
| **17** | **2802** | (multipli; format/imports dominanti) | **45,5%** degli Iniziali per livello (6157) |

### Categorie L0 — esito post-batch

| Categoria | Warning pre | Residue | Motivazione | Eccezioni / note | Stato op. |
|----|---:|---:|----|----|----|
| `format` | 961 | **1** | Solo formattazione Biome | Residuo su `src/index.css` bloccato da diagnostiche `parse` (L3) — non risolvibile da format finché parse non è affrontato | Batch completato |
| `lint/style/useImportType` | 852 | 0 | Import type-only; runtime invariato | — | Chiusa |
| `assist/source/organizeImports` | 780 | 0 | Riordino import senza cambio binding | — | Chiusa |
| `lint/correctness/useParseIntRadix` | 53 | 0 | Radix `10` | — | Chiusa |
| `lint/complexity/useLiteralKeys` | 38 | 0 | Bracket → dot | — | Chiusa |
| `lint/style/useConst` | 31 | 0 | `let`→`const` | — | Chiusa |
| `lint/style/useNodejsImportProtocol` | 22 | 0 | Prefisso `node:` | — | Chiusa |
| `lint/style/useTemplate` | 22 | 0 | Concat → template | — | Chiusa |
| `lint/complexity/noUselessLoneBlockStatements` | 15 | 0 | Blocchi inutili | Fix manuali meccanici su smoke scripts dove autofix non applicava | Chiusa |
| `lint/complexity/noUselessEscapeInRegex` | 10 | 0 | Escape inutili | — | Chiusa |
| `lint/complexity/noUselessUndefinedInitialization` | 5 | 0 | `= undefined` ridondante | — | Chiusa |
| `lint/complexity/noUselessFragments` | 3 | 0 | Fragment inutili | — | Chiusa |
| `lint/complexity/noUselessSwitchCase` | 3 | 0 | Case ridondanti | — | Chiusa |
| `lint/complexity/noUselessTernary` | 3 | 0 | Ternario → espressione | Fix manuale meccanico su `useSuitcaseCrud.ts` | Chiusa |
| `lint/style/useExponentiationOperator` | 2 | 0 | `Math.pow` → `**` | — | Chiusa |
| `lint/suspicious/noEmptyInterface` | 1 | 0 | Interface vuota → `type` | — | Chiusa |
| `lint/suspicious/noUselessEscapeInString` | 1 | 0 | Escape stringa inutile | — | Chiusa |

**Esito L0:** −2801 diagnostiche; livello **COMPLETATO** con 1 residuo esplicitamente bloccato da L3/`parse`.  
**Validazione:** build OK; smoke PO accettato; `npm run check` / `typecheck` restano ROSSI per **3 errori TS preesistenti** (non introdotti da L0) — eccezione registrata (Parte 3ter).

---

## LIVELLO 1 — Classificazione operativa **CHIUSA**

Categorie che sembravano batch e richiedevano classificazione.  
**Stato (2026-08-04):** classificazione operativa **completata**.  
Le categorie promuovibili (Gruppi A+B) sono state **riclassificate a L0**, poi **eseguite e accettate** (B1a/B1b/B1c — 1215 diag. a 0).  
Le non-promuovibili (Gruppo C) restano in **L4**.  
L1 come contenitore di debito residuo è **vuoto** (0 diagnostiche).

| Categorie residue in L1 | Occ. | % sul totale corrente |
|----|---:|---:|
| **0** | **0** | **0%** |

### Verdetto chiusura classificazione L1 (SoT)

| Domanda | Risposta | Motivazione |
|----|----|----|
| Audit strategico (9/9) | **SI** | Schede + catalogo operativo hit-per-hit |
| Chiusura classificazione operativa | **SI** | Gruppo B catalogato completamente; A chiuso; C → L4 |
| Batch L0 da promozione L1 | **Batch completato / ACCETTATO** | **1215** diagnostiche eliminate (B1a+B1b+B1c); Quality Delta + smoke + review architetturale OK |

### Catalogo operativo Gruppo B — esito finale (hit-per-hit)

#### 1) `lint/a11y/useButtonType` — 851 · 205 file

Analisi: tutte le **851** diagnostiche (location Biome → tag `<button` + profondità `<form`/`<Form` nel file).

| Classe | Criterio | Diagn. | File | Destino |
|----|----|---:|---:|----|
| **A** | button nativo **fuori** da `<form`/`<Form` | **851** | **205** | **L0 batch** (`type="button"`) |
| **B** | button dentro form | **0** | **0** | — |
| **C** | custom / `createElement` | **0** | **0** | — |

Motivazione: nei 205 file con hit **non esiste alcun** tag `<form` / `<Form`; tutti gli hit sono `<button` nativi; nessun `React.createElement('button')`.

| Totale | Batch L0 immediato | Manuali |
|---:|---:|---:|
| 851 | **851** | **0** |

Elenco file (205): vedi appendix sotto «Elenco file useButtonType».

#### 2) `lint/correctness/noUnusedImports` — 326 · 230 file

Analisi: tutte le **326** diagnostiche; statement `import` ricostruito dalla location.

| Classe | Criterio | Diagn. | File | Destino |
|----|----|---:|---:|----|
| **A** | binding realmente inutilizzato | **326** | **230** | **L0 batch** (autofix UNSAFE) |
| **B** | import side-effect (`import 'mod'`) | **0** | **0** | — |
| **C** | import CSS | **0** | **0** | — |
| **D** | altra eccezione (direttive TS/polyfill) | **0** | **0** | — |

Motivazione: Biome segnala solo binding unused; tra gli hit **zero** side-effect puri, **zero** CSS, **zero** direttive `@ts-expect-error` sull'import.

| Totale | Eliminabili in batch | Manuali / eccezioni |
|---:|---:|---:|
| 326 | **326** | **0** |

Elenco file (230): vedi appendix sotto «Elenco file noUnusedImports».

#### 3) `lint/suspicious/noGlobalIsNan` — 16 · 15 file

| # | File:riga | Argomento | Classe | Motivazione |
|---:|----|----|----|----|
| 1 | `LoadingTipsManager.tsx:188` | `newOrder` | **A** | `parseInt(...,10)` → già `number` |
| 2 | `CitiesListTab.tsx:321` | `d.getTime()` | **A** | `Date#getTime()` → `number` |
| 3 | `EditorCulture.tsx:383` | `newRank` | **A** | `Number.parseInt` → `number` |
| 4 | `ServiceEvents.tsx:79` | `newRank` | **A** | `parseInt` → `number` |
| 5 | `ServiceGeneric.tsx:96` | `newRank` | **A** | `parseInt` → `number` |
| 6 | `ServiceGuides.tsx:73` | `newRank` | **A** | `parseInt` → `number` |
| 7 | `ServiceOperators.tsx:75` | `newRank` | **A** | `parseInt` → `number` |
| 8 | `NumberInput.tsx:20` | `num` | **A** | `parseFloat` → `number` |
| 9 | `AiPlannerForm.tsx:381` | `val` | **A** | `parseInt` → `number` |
| 10 | `DiaryHeader.tsx:76` | `date.getTime()` | **A** | `number` |
| 11 | `DiaryHeader.tsx:319` | `newDate.getTime()` | **A** | `number` |
| 12 | `usePeopleData.ts:134` | `newRank` | **A** | parametro tipizzato `number` |
| 13 | `usePoiForm.ts:57` | `num` | **A** | `parseFloat` → `number` |
| 14 | `usePoiManager.ts:193` | `num` | **A** | `parseInt` → `number` |
| 15 | `ensureNumber.ts:8` | `n` | **A** | `Number(val)` → `number` |
| 16 | `sponsorValidation.ts:33` | `amount` | **A** | dopo null-check: `number` |

Classe B (dipende da coercizione di `isNaN` globale): **0**.

| Totale | Batch L0 (`Number.isNaN`) | Manuali |
|---:|---:|---:|
| 16 | **16** | **0** |

#### 4) `lint/a11y/noSvgWithoutTitle` — 9 · 9 file

| File | Classe | Motivazione | Fix batch |
|----|----|----|----|
| `OnboardingVisualEditor.tsx` | **A decorativo** | Linea guida editor, `pointer-events-none` | `aria-hidden` |
| `MascotSvg.tsx` | **B informativo** | Mascotte brand standalone | `title` / `aria-label` |
| `ExportLogo.tsx` | **B informativo** | Logo export PDF/DOCX | `title` / `aria-label` |
| `ItineraryItemCard.tsx` | **A decorativo** | Curva connettore timeline, `pointer-events-none` | `aria-hidden` |
| `AffiliateSuggestionBox.tsx` | **A decorativo** | 5 stelle sempre piene, non legate a rating | `aria-hidden` |
| `ItinerariesExplorer.tsx` | **A decorativo** | Bordo marching-ants; testo già nel DOM | `aria-hidden` |
| `Header.tsx` | **A decorativo** | Icona in button con testo «Guida all'uso» | `aria-hidden` |
| `SponsorPlanCard.tsx` | **A decorativo** | Check accanto a testo feature | `aria-hidden` |
| `UserReferralTab.tsx` | **A decorativo** | Icona in button con `title="WhatsApp"` | `aria-hidden` |

| Totale | Batch (7 dec + 2 inf) | Manuali |
|---:|---:|---:|
| 9 | **9** | **0** |

Sotto-batch L0: **B1c-svg-dec** (7) · **B1c-svg-inf** (2). Nessun autofix Biome.

#### 5) `lint/suspicious/noPrototypeBuiltins` — 5 · 4 file

Tutti i 5 hit usano `Object.prototype.hasOwnProperty.call(target, key)` → fix SAFE `Object.hasOwn(target, key)`.

| File:riga | Target | Classe | Motivazione |
|----|----|----|----|
| `ReviewModal.tsx:77` | `err` | **A batch** | equivalente `Object.hasOwn` |
| `focusModeRegistry.ts:108` | `WORKSPACE_BY_MODAL_KEY` | **A batch** | object letterale proprio |
| `useAffiliateAnalytics.ts:113` | `sourcesMap` | **A batch** | `Record` proprio |
| `storageService.ts:80` | `memoryStore` | **A batch** | store proprio |
| `storageService.ts:140` | `sessionMemoryStore` | **A batch** | store proprio |

Eccezioni: **0**.

| Totale | Batch L0 | Manuali |
|---:|---:|---:|
| 5 | **5** | **0** |

### Tabelle finali per regola (Gruppo B)

| Regola | Diagn. | File | Casi batch | Casi manuali | Eccezioni |
|----|---:|---:|---:|---:|----|
| `useButtonType` | 851 | 205 | **851** | 0 | nessuna |
| `noUnusedImports` | 326 | 230 | **326** | 0 | nessuna |
| `noGlobalIsNan` | 16 | 15 | **16** | 0 | nessuna |
| `noSvgWithoutTitle` | 9 | 9 | **9** | 0 | 7 dec + 2 inf (entrambi batch) |
| `noPrototypeBuiltins` | 5 | 4 | **5** | 0 | nessuna |
| **Totale Gruppo B** | **1207** | — | **1207** | **0** | **0** |

### Riepilogo complessivo Gruppo B

| Metrica | Valore |
|----|----|
| Diagnostiche iniziali Gruppo B | **1207** |
| Promosse a L0 (`Batch pronto`) | **1207** |
| Restano L4 da Gruppo B | **0** |
| Diventano D | **0** |
| Nuove sottocategorie | **B1c-svg-dec** (7), **B1c-svg-inf** (2) — entrambe L0 |

### Piano A / B / C — stato post-chiusura

#### Gruppo A → L0 `Batch pronto`

| Categoria | Diagn. | File |
|----|---:|---:|
| `noSwitchDeclarations` | 6 | 3 |
| `noDoubleEquals` | 2 | 1 |
| **Totale A** | **8** | |

#### Gruppo B → L0 `Batch pronto` (catalogato)

| Categoria | Diagn. | File |
|----|---:|---:|
| `useButtonType` | 851 | 205 |
| `noUnusedImports` | 326 | 230 |
| `noGlobalIsNan` | 16 | 15 |
| `noSvgWithoutTitle` | 9 | 9 |
| `noPrototypeBuiltins` | 5 | 4 |
| **Totale B** | **1207** | |

#### Gruppo C → L4 (fuori batch massivi)

| Categoria | Diagn. | File | Destino |
|----|---:|---:|----|
| `noAutofocus` | 17 | 14 | L4 |
| `noDescendingSpecificity` | 1 | 1 | L4 |
| **Totale C** | **18** | | |

**Totale L0 da promozione L1 (A+B):** **1215**.  
**Totale migrato a L4 (C):** **18**.

### Riclassificazione formale (livelli)

| Categoria | Da | A | Stato op. |
|----|----|----|----|
| `useButtonType` | L1 | **L0** | **Chiusa** (0; batch accettato) |
| `noUnusedImports` | L1 | **L0** | **Chiusa** (0; batch accettato) |
| `noGlobalIsNan` | L1 | **L0** | **Chiusa** (0; batch accettato) |
| `noSvgWithoutTitle` | L1 | **L0** | **Chiusa** (0; batch accettato) |
| `noPrototypeBuiltins` | L1 | **L0** | **Chiusa** (0; batch accettato) |
| `noSwitchDeclarations` | L1 | **L0** | **Chiusa** (0; batch accettato) |
| `noDoubleEquals` | L1 | **L0** | **Chiusa** (0; batch accettato) |
| `noAutofocus` | L1 | **L4** | Non analizzata |
| `noDescendingSpecificity` | L1 | **L4** | Non analizzata |

### Appendix — Elenco file useButtonType (205)

- `src/components/admin/AdminAiAssistant.tsx`
- `src/components/admin/AdminCityEditor.tsx`
- `src/components/admin/AdminCommunications.tsx`
- `src/components/admin/AdminGamification.tsx`
- `src/components/admin/AdminHeaderManager.tsx`
- `src/components/admin/AdminImageInput.tsx`
- `src/components/admin/AdminItineraryEditor.tsx`
- `src/components/admin/AdminPhotoInspector.tsx`
- `src/components/admin/AdminPoiManager.tsx`
- `src/components/admin/AdminPoiModal.tsx`
- `src/components/admin/AdminRoleManager.tsx`
- `src/components/admin/AdminSocialStudio.tsx`
- `src/components/admin/AdminStatsDashboard.tsx`
- `src/components/admin/AdminTaxonomyManager.tsx`
- `src/components/admin/AiFieldHelper.tsx`
- `src/components/admin/AiLimitsControlCenter.tsx`
- `src/components/admin/CitiesManager.tsx`
- `src/components/admin/GlobalEventsManager.tsx`
- `src/components/admin/ItineraryManager.tsx`
- `src/components/admin/LoadingTipsManager.tsx`
- `src/components/admin/NewsTickerManager.tsx`
- `src/components/admin/PartnerDetailModal.tsx`
- `src/components/admin/PhotoModeration.tsx`
- `src/components/admin/SponsorDashboardOverview.tsx`
- `src/components/admin/SponsorFilters.tsx`
- `src/components/admin/SponsorManager.tsx`
- `src/components/admin/SuggestionManager.tsx`
- `src/components/admin/affiliations/AffiliateAnalyticsTab.tsx`
- `src/components/admin/cities/CitiesListTab.tsx`
- `src/components/admin/cities/CityAuditModal.tsx`
- `src/components/admin/cities/CityGeneratorModal.tsx`
- `src/components/admin/cities/CompleteCityModal.tsx`
- `src/components/admin/cities/DeleteCityOptionsModal.tsx`
- `src/components/admin/cities/ProcessLogModal.tsx`
- `src/components/admin/cities/RegionalAnalysisModal.tsx`
- `src/components/admin/cities/StrategicMapTab.tsx`
- `src/components/admin/cities/ZoneCard.tsx`
- `src/components/admin/cityEditor/EditorGeneral.tsx`
- `src/components/admin/cityEditor/EditorMedia.tsx`
- `src/components/admin/cityEditor/EditorRatings.tsx`
- `src/components/admin/cityEditor/FormFieldHelper.tsx`
- `src/components/admin/cityEditor/culture/CultureHistory.tsx`
- `src/components/admin/cityEditor/culture/CulturePatron.tsx`
- `src/components/admin/cityEditor/culture/CulturePeople.tsx`
- `src/components/admin/cityEditor/services/EditorInfo.tsx`
- `src/components/admin/cityEditor/services/ServiceEvents.tsx`
- `src/components/admin/cityEditor/services/ServiceGeneric.tsx`
- `src/components/admin/cityEditor/services/ServiceGuides.tsx`
- `src/components/admin/cityEditor/services/ServiceOperators.tsx`
- `src/components/admin/cityEditor/tabs/TabCulture.tsx`
- `src/components/admin/cityEditor/tabs/TabGeneral.tsx`
- `src/components/admin/cityEditor/tabs/TabMedia.tsx`
- `src/components/admin/cityEditor/tabs/TabRatings.tsx`
- `src/components/admin/cityEditor/tabs/TabServices.tsx`
- `src/components/admin/common/AdminGuideModal.tsx`
- `src/components/admin/common/AdminMultiSelect.tsx`
- `src/components/admin/communications/CommsTemplates.tsx`
- `src/components/admin/design/ComponentPreviewHost.tsx`
- `src/components/admin/design/DesignSystemSettings.tsx`
- `src/components/admin/design/SafeArtPanel.tsx`
- `src/components/admin/economics/PricingManager.tsx`
- `src/components/admin/import/ImportDashboard.tsx`
- `src/components/admin/import/ImportOsmModal.tsx`
- `src/components/admin/import/components/ImportActionToolbar.tsx`
- `src/components/admin/import/components/ImportFilterBar.tsx`
- `src/components/admin/import/components/ImportReportModal.tsx`
- `src/components/admin/import/components/ImportTable.tsx`
- `src/components/admin/layout/AdminMobileHeader.tsx`
- `src/components/admin/layout/AdminSidebar.tsx`
- `src/components/admin/marketing/AdminCreditPackages.tsx`
- `src/components/admin/marketing/AiLimitsPanel.tsx`
- `src/components/admin/marketing/CampaignsPanel.tsx`
- `src/components/admin/marketing/PromoManagerModal.tsx`
- `src/components/admin/observatory/AnomalyInspector.tsx`
- `src/components/admin/observatory/CityStatsGrid.tsx`
- `src/components/admin/observatory/DuplicateResolver.tsx`
- `src/components/admin/observatory/ObservatoryFilterDrawer.tsx`
- `src/components/admin/observatory/ObservatoryLayout.tsx`
- `src/components/admin/onboarding/OnboardingVisualEditor.tsx`
- `src/components/admin/photos/PhotoFilters.tsx`
- `src/components/admin/photos/PhotoRow.tsx`
- `src/components/admin/poiManager/BulkFixProgressModal.tsx`
- `src/components/admin/poiManager/PoiList.tsx`
- `src/components/admin/poiManager/PoiToolbar.tsx`
- `src/components/admin/poiManager/RegenerateConfirmModal.tsx`
- `src/components/admin/poiModal/PoiInfoTab.tsx`
- `src/components/admin/poiModal/PoiLinksTab.tsx`
- `src/components/admin/poiModal/PoiLogisticsTab.tsx`
- `src/components/admin/settings/ArrayRenderer.tsx`
- `src/components/admin/settings/GlobalSettingsPanel.tsx`
- `src/components/admin/settings/PartnerIntegrationsPanel.tsx`
- `src/components/admin/settings/SettingsPage.tsx`
- `src/components/admin/settings/inputs/BooleanToggle.tsx`
- `src/components/admin/social/AiBackgroundPanel.tsx`
- `src/components/admin/social/SocialPreviewConfig.tsx`
- `src/components/admin/sponsor/SponsorBulkActions.tsx`
- `src/components/admin/sponsor/SponsorModals.tsx`
- `src/components/admin/sponsor/SponsorTable.tsx`
- `src/components/admin/sponsor/SponsorToolbar.tsx`
- `src/components/admin/userManager/DeleteUserModal.tsx`
- `src/components/admin/userManager/RlsFixModal.tsx`
- `src/components/admin/userManager/UserTable.tsx`
- `src/components/admin/userManager/UserToolbar.tsx`
- `src/components/admin/views/UserManagementView.tsx`
- `src/components/aiPlanner/AiLoadingScreen.tsx`
- `src/components/aiPlanner/AiPlannerForm.tsx`
- `src/components/aiPlanner/AiPlannerTimeline.tsx`
- `src/components/city/CityDetailContent.tsx`
- `src/components/city/CityHeader.tsx`
- `src/components/city/CityHistory.tsx`
- `src/components/city/components/CompassExploreButton.tsx`
- `src/components/city/components/NearbyCitiesRow.tsx`
- `src/components/city/gallery/GalleryGrid.tsx`
- `src/components/city/gallery/GalleryLightbox.tsx`
- `src/components/city/gallery/GallerySuccessModal.tsx`
- `src/components/city/gallery/GalleryUploadModal.tsx`
- `src/components/city/tabs/CityCategoryTab.tsx`
- `src/components/city/tabs/CityShowcaseTab.tsx`
- `src/components/common/CustomCalendar.tsx`
- `src/components/common/PaginationControls.tsx`
- `src/components/common/SmartFilterDrawer.tsx`
- `src/components/community/QaForumTab.tsx`
- `src/components/features/checkout/CheckoutSuccessPage.tsx`
- `src/components/features/diary/DiaryDay.tsx`
- `src/components/features/diary/DiaryMemoCard.tsx`
- `src/components/features/diary/DiaryTimeline.tsx`
- `src/components/features/diary/ItineraryItemCard.tsx`
- `src/components/features/diary/header/DiaryHeaderProjectInput.tsx`
- `src/components/features/diary/packing_list/suitcase/AffiliateSuggestionBox.tsx`
- `src/components/features/diary/packing_list/suitcase/AiSuggestionsPanel.tsx`
- `src/components/features/diary/packing_list/suitcase/AiSuggestionsReviewStep.tsx`
- `src/components/features/diary/packing_list/suitcase/AiSuggestionsSetupStep.tsx`
- `src/components/features/diary/packing_list/suitcase/CategoryIconPicker.tsx`
- `src/components/features/diary/packing_list/suitcase/CategorySection.tsx`
- `src/components/features/diary/packing_list/suitcase/NewCategoryPanel.tsx`
- `src/components/features/diary/packing_list/suitcase/SuitcaseDashboard.tsx`
- `src/components/features/diary/packing_list/suitcase/SuitcaseItemRow.tsx`
- `src/components/features/diary/packing_list/suitcase/tabs/AiCatalogTab.tsx`
- `src/components/features/diary/packing_list/suitcase/tabs/GlobalSuggestionsTab.tsx`
- `src/components/features/diary/packing_list/suitcase/tabs/StandardItemsTab.tsx`
- `src/components/features/diary/packing_list/suitcase/tabs/TemplateLibraryTab.tsx`
- `src/components/features/diary/packing_list/suitcase/tabs/TemplateSpecificItemsTab.tsx`
- `src/components/features/diary/packing_list/suitcase/tabs/override/CategoryAccordion.tsx`
- `src/components/features/diary/packing_list/suitcase/tabs/override/TemplateSelector.tsx`
- `src/components/home/CuratedGridSection.tsx`
- `src/components/home/HomeContent.tsx`
- `src/components/home/hero/HeroAiModule.tsx`
- `src/components/home/hero/components/SearchBar.tsx`
- `src/components/itineraries/ItinerariesExplorer.tsx`
- `src/components/itineraries/ItinerariesList.tsx`
- `src/components/itineraries/ItineraryDetail.tsx`
- `src/components/itineraries/ItineraryReviews.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/HeaderCreditsIndicator.tsx`
- `src/components/layout/MobileNavBar.tsx`
- `src/components/layout/OnboardingWizard.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/modals/AdminModals.tsx`
- `src/components/layout/modals/CoreModals.tsx`
- `src/components/modals/AddToItineraryModal.tsx`
- `src/components/modals/AiItineraryModal.tsx`
- `src/components/modals/AroundMeWizard.tsx`
- `src/components/modals/CityInfoModal.tsx`
- `src/components/modals/CultureCornerModal.tsx`
- `src/components/modals/GlobalSectionView.tsx`
- `src/components/modals/GpsAlertModal.tsx`
- `src/components/modals/GpsErrorModal.tsx`
- `src/components/modals/HistoryModal.tsx`
- `src/components/modals/LevelUpModal.tsx`
- `src/components/modals/LimitWarningModal.tsx`
- `src/components/modals/PoiClaimModal.tsx`
- `src/components/modals/PoiDetailModal.tsx`
- `src/components/modals/ProvinceModal.tsx`
- `src/components/modals/SectionPreviewModal.tsx`
- `src/components/modals/SuggestionReviewModal.tsx`
- `src/components/modals/cityInfo/CityEventsTab.tsx`
- `src/components/modals/cityInfo/CityGuidesTab.tsx`
- `src/components/modals/cityInfo/CityTourOperatorsTab.tsx`
- `src/components/modals/cityInfo/ServiceAiHunter.tsx`
- `src/components/modals/cityInfo/ServiceSidebar.tsx`
- `src/components/modals/cityInfo/ServicesCategoryList.tsx`
- `src/components/modals/poiDetail/PoiImageSection.tsx`
- `src/components/modals/poiDetail/PoiInfoSection.tsx`
- `src/components/modals/sectionPreview/PreviewGallery.tsx`
- `src/components/modals/sectionPreview/PreviewHero.tsx`
- `src/components/modals/sponsor/SponsorSuccess.tsx`
- `src/components/rankings/PhotoGrid.tsx`
- `src/components/rankings/RankingFilters.tsx`
- `src/components/shop/ProductDetailOverlay.tsx`
- `src/components/shop/ShopBioOverlay.tsx`
- `src/components/shop/ShopCard.tsx`
- `src/components/shop/ShopHeader.tsx`
- `src/components/shop/ShopHero.tsx`
- `src/components/shop/ShopHomeView.tsx`
- `src/components/shop/ShopReviews.tsx`
- `src/components/user/BusinessShopManager.tsx`
- `src/components/user/UserDashboard.tsx`
- `src/components/user/dashboard/UserMessagesTab.tsx`
- `src/components/user/dashboard/UserNotificationsTab.tsx`
- `src/components/user/dashboard/UserOverviewTab.tsx`
- `src/components/user/dashboard/UserSettingsTab.tsx`
- `src/components/user/dashboard/UserSidebar.tsx`
- `src/components/user/dashboard/UserSuitcasesTab.tsx`
- `src/components/user/dashboard/UserWalletTab.tsx`
- `src/components/user/referral/SocialCardGenerator.tsx`

### Appendix — Elenco file noUnusedImports (230)

- `scripts/build-packing-domain-catalog.ts`
- `src/components/admin/AdminAiAssistant.tsx`
- `src/components/admin/AdminCityEditor.tsx`
- `src/components/admin/AdminCommunications.tsx`
- `src/components/admin/AdminControlCenterAI.tsx`
- `src/components/admin/AdminGamification.tsx`
- `src/components/admin/AdminHeaderManager.tsx`
- `src/components/admin/AdminImageInput.tsx`
- `src/components/admin/AdminItineraryEditor.tsx`
- `src/components/admin/AdminPhotoInspector.tsx`
- `src/components/admin/AdminPoiModal.tsx`
- `src/components/admin/AdminRoleManager.tsx`
- `src/components/admin/AdminSocialStudio.tsx`
- `src/components/admin/AdminStatsDashboard.tsx`
- `src/components/admin/AdminTaxonomyManager.tsx`
- `src/components/admin/AdminUserManager.tsx`
- `src/components/admin/AiFieldHelper.tsx`
- `src/components/admin/AiLimitsControlCenter.tsx`
- `src/components/admin/CitiesManager.tsx`
- `src/components/admin/GlobalEventsManager.tsx`
- `src/components/admin/ItineraryManager.tsx`
- `src/components/admin/LoadingTipsManager.tsx`
- `src/components/admin/NewsTickerManager.tsx`
- `src/components/admin/PartnerDetailModal.tsx`
- `src/components/admin/PhotoModeration.tsx`
- `src/components/admin/SponsorDashboardOverview.tsx`
- `src/components/admin/SponsorManager.tsx`
- `src/components/admin/SuggestionManager.tsx`
- `src/components/admin/affiliations/AffiliateAnalyticsTab.tsx`
- `src/components/admin/cities/CitiesListTab.tsx`
- `src/components/admin/cities/CityAuditModal.tsx`
- `src/components/admin/cities/CityGeneratorModal.tsx`
- `src/components/admin/cities/CompleteCityModal.tsx`
- `src/components/admin/cities/DeleteCityOptionsModal.tsx`
- `src/components/admin/cities/ProcessLogModal.tsx`
- `src/components/admin/cities/RegionalAnalysisModal.tsx`
- `src/components/admin/cities/StrategicMapTab.tsx`
- `src/components/admin/cityEditor/EditorGeneral.tsx`
- `src/components/admin/cityEditor/culture/CulturePeople.tsx`
- `src/components/admin/cityEditor/services/EditorInfo.tsx`
- `src/components/admin/cityEditor/services/ServiceEvents.tsx`
- `src/components/admin/cityEditor/services/ServiceGeneric.tsx`
- `src/components/admin/cityEditor/services/ServiceGuides.tsx`
- `src/components/admin/cityEditor/services/ServiceOperators.tsx`
- `src/components/admin/cityEditor/tabs/TabGeneral.tsx`
- `src/components/admin/cityEditor/tabs/TabLogs.tsx`
- `src/components/admin/cityEditor/tabs/TabMedia.tsx`
- `src/components/admin/cityEditor/tabs/TabPois.tsx`
- `src/components/admin/cityEditor/tabs/TabServices.tsx`
- `src/components/admin/common/AdminGuideModal.tsx`
- `src/components/admin/communications/CommsHistory.tsx`
- `src/components/admin/design/PlaceholderGrid.tsx`
- `src/components/admin/design/SafeArtPanel.tsx`
- `src/components/admin/economics/AdminAiAnalyticsV4.tsx`
- `src/components/admin/economics/PricingManager.tsx`
- `src/components/admin/economics/SustainabilityHelper.tsx`
- `src/components/admin/import/ImportOsmModal.tsx`
- `src/components/admin/import/components/ImportActionToolbar.tsx`
- `src/components/admin/import/components/ImportReportModal.tsx`
- `src/components/admin/import/components/ImportStatsBar.tsx`
- `src/components/admin/import/components/ImportTable.tsx`
- `src/components/admin/layout/AdminMobileHeader.tsx`
- `src/components/admin/layout/AdminSidebar.tsx`
- `src/components/admin/marketing/AdminCreditPackages.tsx`
- `src/components/admin/marketing/CampaignsPanel.tsx`
- `src/components/admin/marketing/PromoManagerModal.tsx`
- `src/components/admin/observatory/AnomalyInspector.tsx`
- `src/components/admin/observatory/CityStatsGrid.tsx`
- `src/components/admin/observatory/DuplicateResolver.tsx`
- `src/components/admin/observatory/ObservatoryFilterDrawer.tsx`
- `src/components/admin/observatory/ObservatoryLayout.tsx`
- `src/components/admin/observatory/ObservatoryLegend.tsx`
- `src/components/admin/observatory/ScheduleMatrix.tsx`
- `src/components/admin/onboarding/OnboardingVisualEditor.tsx`
- `src/components/admin/photos/PhotoFilters.tsx`
- `src/components/admin/photos/PhotoTable.tsx`
- `src/components/admin/poiManager/BulkFixProgressModal.tsx`
- `src/components/admin/poiManager/PoiList.tsx`
- `src/components/admin/poiManager/PoiToolbar.tsx`
- `src/components/admin/poiManager/RegenerateConfirmModal.tsx`
- `src/components/admin/poiModal/PoiInfoTab.tsx`
- `src/components/admin/poiModal/PoiLinksTab.tsx`
- `src/components/admin/poiModal/PoiLogisticsTab.tsx`
- `src/components/admin/poiModal/PoiMarketingTab.tsx`
- `src/components/admin/poiModal/PoiMediaTab.tsx`
- `src/components/admin/settings/PartnerIntegrationsPanel.tsx`
- `src/components/admin/social/AiBackgroundPanel.tsx`
- `src/components/admin/social/SocialPreviewConfig.tsx`
- `src/components/admin/sponsor/SponsorBulkActions.tsx`
- `src/components/admin/sponsor/SponsorTable.tsx`
- `src/components/admin/sponsor/SponsorToolbar.tsx`
- `src/components/admin/userManager/RlsFixModal.tsx`
- `src/components/admin/userManager/UserSubscriptionsTab.tsx`
- `src/components/admin/userManager/UserTable.tsx`
- `src/components/admin/userManager/UserToolbar.tsx`
- `src/components/admin/views/UserManagementView.tsx`
- `src/components/ai/AiRuntimeBanner.tsx`
- `src/components/aiPlanner/AiLoadingScreen.tsx`
- `src/components/aiPlanner/AiPlannerForm.tsx`
- `src/components/aiPlanner/AiPlannerTimeline.tsx`
- `src/components/city/CityDetailContent.tsx`
- `src/components/city/CityHeader.tsx`
- `src/components/city/CityHistory.tsx`
- `src/components/city/WeatherWidget.tsx`
- `src/components/city/gallery/GallerySuccessModal.tsx`
- `src/components/city/gallery/GalleryUploadModal.tsx`
- `src/components/city/tabs/CityCategoryTab.tsx`
- `src/components/city/tabs/CityGallery.tsx`
- `src/components/city/tabs/CityShowcaseTab.tsx`
- `src/components/collaboration/CollaborationShareWizard.tsx`
- `src/components/collaboration/useCollaborationShareResourceHandlers.ts`
- `src/components/common/BrandLogo.tsx`
- `src/components/common/GlobalAlert.tsx`
- `src/components/common/MascotSvg.tsx`
- `src/components/common/ModalLoading.tsx`
- `src/components/common/PaginationControls.tsx`
- `src/components/common/SmartFilterDrawer.tsx`
- `src/components/common/StarRating.tsx`
- `src/components/community/QaForumTab.tsx`
- `src/components/community/RankingTab.tsx`
- `src/components/features/diary/DiaryDay.tsx`
- `src/components/features/diary/DiaryEmptyState.tsx`
- `src/components/features/diary/packing_list/SuitcaseFloatingPanel/SuitcaseFloatingPanelBody.tsx`
- `src/components/features/diary/packing_list/SuitcaseFloatingPanel/components/SuitcaseModals.tsx`
- `src/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelUndoIntegration.ts`
- `src/components/features/diary/packing_list/suitcase/AiSuggestionsPanel.tsx`
- `src/components/features/diary/packing_list/suitcase/CategorySuggestionPanel.tsx`
- `src/components/features/diary/packing_list/suitcase/SuitcaseDashboard.tsx`
- `src/components/features/diary/packing_list/suitcase/SuitcaseEditorView.tsx`
- `src/components/features/diary/packing_list/suitcase/SuitcaseUtils.tsx`
- `src/components/features/diary/packing_list/suitcase/TemplateSelectorSection.tsx`
- `src/components/home/HomeContent.tsx`
- `src/components/home/hero/HeroAiModule.tsx`
- `src/components/home/hero/components/FilterSelect.tsx`
- `src/components/home/hero/components/MultiFilterSelect.tsx`
- `src/components/home/hero/components/SearchBar.tsx`
- `src/components/itineraries/ItinerariesExplorer.tsx`
- `src/components/itineraries/ItinerariesList.tsx`
- `src/components/itineraries/ItineraryDetail.tsx`
- `src/components/itineraries/ItineraryReviews.tsx`
- `src/components/layout/AppCoordinator.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/HeaderCreditsIndicator.tsx`
- `src/components/layout/MobileNavBar.tsx`
- `src/components/layout/OnboardingWizard.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/modals/AiItineraryModal.tsx`
- `src/components/modals/AroundMeWizard.tsx`
- `src/components/modals/CityInfoModal.tsx`
- `src/components/modals/ConfirmClearModal.tsx`
- `src/components/modals/CultureCornerModal.tsx`
- `src/components/modals/DateChangeWarningModal.tsx`
- `src/components/modals/DuplicateResolutionModal.tsx`
- `src/components/modals/EmptyDiaryModal.tsx`
- `src/components/modals/FullRankingsModal.tsx`
- `src/components/modals/GlobalSectionView.tsx`
- `src/components/modals/GpsAlertModal.tsx`
- `src/components/modals/GpsErrorModal.tsx`
- `src/components/modals/HistoryModal.tsx`
- `src/components/modals/MobileMoveModal.tsx`
- `src/components/modals/PatronSaintModal.tsx`
- `src/components/modals/PoiClaimModal.tsx`
- `src/components/modals/PoiDetailModal.tsx`
- `src/components/modals/RemoveItemModal.tsx`
- `src/components/modals/ReviewModal.tsx`
- `src/components/modals/RoadbookModal.tsx`
- `src/components/modals/SaveAsModal.tsx`
- `src/components/modals/SectionPreviewModal.tsx`
- `src/components/modals/ShareModal.tsx`
- `src/components/modals/SponsorModal.tsx`
- `src/components/modals/SuggestionReviewModal.tsx`
- `src/components/modals/TimeConflictModal.tsx`
- `src/components/modals/cityInfo/CityGuidesTab.tsx`
- `src/components/modals/cityInfo/CityTourOperatorsTab.tsx`
- `src/components/modals/cityInfo/ServiceAiHunter.tsx`
- `src/components/modals/cityInfo/ServiceSidebar.tsx`
- `src/components/modals/cityInfo/ServicesCategoryList.tsx`
- `src/components/modals/poiDetail/PoiImageSection.tsx`
- `src/components/modals/poiDetail/PoiInfoSection.tsx`
- `src/components/modals/sectionPreview/PreviewGallery.tsx`
- `src/components/modals/sectionPreview/PreviewHero.tsx`
- `src/components/modals/sectionPreview/PreviewSidebar.tsx`
- `src/components/modals/sponsor/SponsorSuccess.tsx`
- `src/components/modals/sponsor/SponsorTypeSelector.tsx`
- `src/components/pdf/RoadbookDocument.tsx`
- `src/components/shop/BottegaSponsorCard.tsx`
- `src/components/shop/ProductDetailOverlay.tsx`
- `src/components/shop/ShopPage.tsx`
- `src/components/user/BusinessShopManager.tsx`
- `src/components/user/UserDashboard.tsx`
- `src/components/user/dashboard/UserMessagesTab.tsx`
- `src/components/user/dashboard/UserSidebar.tsx`
- `src/components/user/dashboard/UserWalletTab.tsx`
- `src/components/user/referral/SocialCardGenerator.tsx`
- `src/constants/layout.ts`
- `src/constants/services.ts`
- `src/context/AiPlannerContext.tsx`
- `src/context/CityEditorContext.tsx`
- `src/context/DiaryInteractionContext.tsx`
- `src/context/GpsContext.tsx`
- `src/context/InteractionContext.tsx`
- `src/context/NavigationContext.tsx`
- `src/data/system/designRules.ts`
- `src/hooks/admin/useAiCompleteCity.ts`
- `src/hooks/admin/useAiMagicCity.ts`
- `src/hooks/admin/useDuplicateFinder.ts`
- `src/hooks/admin/usePhotoModeration.ts`
- `src/hooks/admin/usePoiActions.ts`
- `src/hooks/core/useAppInitialization.ts`
- `src/hooks/features/useShopNavigation.ts`
- `src/hooks/ui/useHeroLogic.ts`
- `src/hooks/useAIPlanner.ts`
- `src/hooks/useAppRouter.ts`
- `src/hooks/useDiaryLogic.ts`
- `src/hooks/useJourneyPhase.ts`
- `src/hooks/useRankingsLogic.ts`
- `src/index.tsx`
- `src/services/city/cityReadService.ts`
- `src/services/collaboration/collaborationProfileService.ts`
- `src/services/collaboration/friendService.ts`
- `src/services/globalEventsService.ts`
- `src/services/photoService.ts`
- `src/services/platformControl/platformControlService.ts`
- `src/services/sponsors/sponsorResolvers.ts`
- `src/services/subscriptionService.ts`
- `src/services/suitcase/suitcaseTemplateService.ts`
- `src/types/models/City.ts`
- `src/types/write/index.ts`
- `src/types/write/poiForm.ts`
- `src/utils/common.ts`

---

---

---

# Testo pre-split L2 / L3 / L4 (congelato)

> Testo delle sezioni L2/L3/L4 come presenti nella SoT **unificata** immediatamente prima dello split documentale.  
> I **conteggi operativi correnti** vivono solo in [`AI_BIOME_AUDIT.md`](./AI_BIOME_AUDIT.md) (alcune tabelle sotto risultano numericamente obsolete rispetto allo snapshot 2134 — conservate per integrità storica).

## LIVELLO 2 — Audit specialistico (testo pre-split)

Categorie che **non** si correggono direttamente.

Prima devono essere suddivise in **sottocategorie**. L’obiettivo è trasformare una grossa categoria in **più unità indipendenti**; ciascuna unità riceve poi un livello proprio (L0 / L1 / L3 / L4 / D).

**L2 è uno stato di lavoro**, non una destinazione permanente: al termine dell’audit specialistico la categoria madre viene **riclassificata** (spezzata) e le sottocategorie vivono con il proprio livello e stato operativo.

| Categorie | Occ. | % totale |
|----|---:|---:|
| **14** | **1765** | **52,56%** |

### Categorie L2 (invariate nella strategia; conteggi aggiornati)

| Categoria | Occ. | File | Nota |
|----|---:|---:|----|
| `lint/suspicious/noExplicitAny` | 452 | 174 | Dominante L2 |
| `lint/a11y/useKeyWithClickEvents` | 262 | 139 | Cluster a11y click |
| `lint/a11y/noLabelWithoutControl` | 240 | 80 | Form/labels |
| `lint/a11y/noStaticElementInteractions` | 240 | 146 | Cluster a11y static |
| `lint/correctness/noUnusedVariables` | 199 | 96 | Drift post-L0 (− vs pre) |
| `lint/correctness/noUnusedFunctionParameters` | 119 | 71 | Drift post-L0 |
| `lint/complexity/useOptionalChain` | 84 | 59 | — |
| `lint/suspicious/noArrayIndexKey` | 81 | 60 | — |
| `lint/suspicious/useIterableCallbackReturn` | 33 | 18 | — |
| `lint/suspicious/noShadowRestrictedNames` | 15 | 15 | — |
| `lint/a11y/useAriaPropsSupportedByRole` | 13 | 11 | — |
| `lint/a11y/useSemanticElements` | 10 | 10 | — |
| `lint/suspicious/noImplicitAnyLet` | 10 | 8 | Drift +1 vs baseline |
| `lint/a11y/noNoninteractiveElementToInteractiveRole` | 7 | 7 | — |

Dettaglio sottocategorie / obiettivo audit: invariato rispetto alla pianificazione precedente (audit specialistico **non iniziato**).

## LIVELLO 3 — Revisione architetturale (testo pre-split)

Categorie che richiedono **ragionamento progettuale**.

Non si affrontano in massa. Richiedono decisioni architetturali, di sicurezza o di modello React/type-safety.

| Categorie | Occ. | % totale |
|----|---:|---:|
| **6** | **350** | **10,42%** |

### Categorie L3

#### `lint/correctness/useExhaustiveDependencies` — 202 · 109 file

| Campo | Contenuto |
|----|----|
| **Rischio** | Stale closure, loop di effetti, render non deterministici |
| **Motivo revisione** | Aggiungere/rimuovere deps cambia il runtime; serve modello di ownership dello state |
| **Dipendenze** | Stabilizzazione callback/valori; eventuale refactor hook; typecheck + smoke UI |

#### `lint/style/noNonNullAssertion` — 114 · 34 file

| Campo | Contenuto |
|----|----|
| **Rischio** | Crash runtime se l’invariante è falsa |
| **Motivo revisione** | Serve narrowing reale o redesign del flusso null |
| **Dipendenze** | Tipi di dominio; eventuali guard; coerenza con `strict` TS |

#### `lint/correctness/useHookAtTopLevel` — 12 · 3 file

| Campo | Contenuto |
|----|----|
| **Rischio** | Violazione Rules of Hooks → comportamento React indefinito |
| **Motivo revisione** | Richiede estrazione sotto-componenti / unconditional hooks |
| **Dipendenze** | Struttura componente; file: `SuggestionReviewModal.tsx`, `SectionPreviewModal.tsx`, `FullRankingsModal.tsx` |

#### `lint/security/noDangerouslySetInnerHtml` — 11 · 11 file

| Campo | Contenuto |
|----|----|
| **Rischio** | XSS se contenuto non sanitizzato |
| **Motivo revisione** | Decisione: sanitizer, markdown pipeline, o rimozione HTML |
| **Dipendenze** | Provenienza contenuto; policy sicurezza; componenti ticker/guide/modali |

#### `parse` — 9 · 1 file

| Campo | Contenuto |
|----|----|
| **Rischio** | Tooling cieco su porzioni di CSS; possibile sintassi non supportata |
| **Motivo revisione** | Capire se è limite parser Biome o CSS da normalizzare |
| **Dipendenze** | `src/index.css`; **blocca anche il residuo L0 `format`** |

#### `lint/suspicious/noTsIgnore` — 2 · 1 file

| Campo | Contenuto |
|----|----|
| **Rischio** | Nasconde errori di tipo reali |
| **Motivo revisione** | Sostituire con fix tipizzato o `@ts-expect-error` motivato (solo con decisione esplicita) |
| **Dipendenze** | `src/config/env.ts`; contratto env |

## LIVELLO 4 — Casi singoli (testo pre-split)

Tutto ciò che **inevitabilmente** va verificato manualmente, hit per hit.

Queste categorie (e i residui degli audit L1/L2) si affrontano **solo dopo** aver completato i livelli precedenti, così il rumore di fondo non nasconde i casi davvero unici.

| Categorie | Occ. | % totale |
|----|---:|---:|
| **5** | **9** | **0,27%** |

### Categorie L4 (nucleo attuale)

| Categoria | Warning | File | Nota |
|----|---:|---:|----|
| `lint/suspicious/noAssignInExpressions` | 3 | 2 | Separare assegnazione da condizione con cura del flusso |
| `lint/suspicious/noTemplateCurlyInString` | 3 | 3 | Regressione storica vs baseline (+1); file in `scripts/` |
| `lint/complexity/noBannedTypes` | 1 | 1 | **Nuova** post-L0 — `{}` come type in `AffiliateEditorialCenter.tsx`; fix SAFE Biome ma hit singolo → L4 |
| `lint/a11y/useFocusableInteractive` | 1 | 1 | Focusability / tabIndex |
| `lint/a11y/useValidAnchor` | 1 | 1 | `href` vs button; navigazione |

**Regola L4:** i residui degli audit L1/L2 (es. button in-form particolari, `any` irriducibili, key su liste statiche accettate) **migrano qui** con elenco esplicito; non restano nascosti nelle categorie madri.

> Nota post-split: la SoT viva elenca **7** categorie L4 / **27** occorrenze (include `noAutofocus` + `noDescendingSpecificity` da Gruppo C). La tabella sopra è la fotografia «nucleo» pre-riconciliazione esplicita nella sezione L4 unificata.

---
