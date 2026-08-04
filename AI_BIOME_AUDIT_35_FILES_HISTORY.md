# AI Biome Audit — Storico set 35 file

> Documento **storico** dell'audit Biome parziale su **35 file** (pre-baseline full-project).  
> **Non** è la Source of Truth ufficiale del debito Biome del progetto.

**Baseline ufficiale (unica SoT numerica):** [AI_BIOME_AUDIT.md](./AI_BIOME_AUDIT.md) — **6232** diagnostiche (Parte 1).

---
## Storico audit set 35 file (pre-baseline full-project)

> **Nota normativa:** questa sezione è **esclusivamente** lo storico di un audit **parziale** (35 file).  
> **Non** è la baseline ufficiale del progetto.  
> **Non** deve essere usata per misurare l’avanzamento globale della bonifica Biome.  
> L’unica baseline ufficiale resta quella della **Parte 1** (**6232** diagnostiche), finché non verrà rigenerata.
>
> **Contesto distinto dalla baseline globale** ([`AI_BIOME_AUDIT.md`](./AI_BIOME_AUDIT.md)).  
> Audit **parziale** su 35 file (WF-QUAL-01 / hardening progressivo).  
> I totali **339 / 207 / 132** di questa sezione **non** sostituiscono né aggiornano la baseline globale **6232**.  
> Path reale: `workspaceComposition/workspaceCompositionGraph.ts`.

## Stato generale (set 35 file)

| Campo | Valore |
|----|----|
| **Data audit** | 2026-08-03 |
| **Scope** | 35 file (lista audit precedente; path reale `workspaceComposition/workspaceCompositionGraph.ts`) |
| **Numero totale warning/diagnostiche (pre-batch)** | **339** (198 error · 138 warning · 3 info) |
| **Numero warning legacy (pre-batch)** | **~338** |
| **Numero warning introdotti recentemente (pre-batch)** | **1** (`useHookAtTopLevel` in `useDocumentSaveController.ts`) |
| **Numero warning risolti (Batch A + Batch A2)** | **207** (205 + 2) |
| **Numero warning ancora aperti (post Batch A2)** | **132** |

### Metodo

- Confronto WT vs mirror HEAD con regole equivalenti (`recommended` + domain `react`).
- Batch A applicato solo dopo validazione “zero rischio”.
- `useButtonType`: **non** autofix cieco — ogni `<button>` senza `type` classificato (form ancestry + presenza `onClick`); applicato solo se azione fuori `<form>`.

---

## Batch completati

### Batch A — Zero rischio (2026-08-03)

#### 1. `format`

| Campo | Valore |
|----|----|
| **Risolti** | 35 (+ riformattazione dei 15/16 file toccati da `useButtonType`) |
| **File coinvolti** | Tutti i 35 del set |
| **Esclusioni** | Nessuna |
| **Motivazione** | Solo formattazione; nessun cambio semantico |

#### 2. `assist/source/organizeImports`

| Campo | Valore |
|----|----|
| **Risolti** | 35 |
| **File coinvolti** | Tutti i 35 del set |
| **Esclusioni** | Nessuna |
| **Motivazione** | Solo riordino import |

#### 3. `lint/style/useImportType`

| Campo | Valore |
|----|----|
| **Risolti** | 61 (+ 2 residui `import { type X }` → `import type { X }` su `contentService.ts` / `useSuitcaseItemsMutations.ts`) |
| **File coinvolti** | 31 file del set (vedi audit pre-batch) |
| **Esclusioni** | Nessuna |
| **Motivazione** | Conversione solo dove Biome conferma uso esclusivamente tipizzato |

#### 4. `lint/a11y/useButtonType`

| Campo | Valore |
|----|----|
| **Risolti** | **60** |
| **File coinvolti** | 16 file UI (lista sotto) |
| **Esclusioni** | **1** |
| **Motivazione esclusione** | Vedi sotto |

**File modificati (type="button" aggiunto):**

- `src/components/admin/MarketingManager.tsx`
- `src/components/admin/cityEditor/EditorCulture.tsx`
- `src/components/admin/communications/AiChatAssistant.tsx`
- `src/components/admin/marketing/PricingPlansPanel.tsx`
- `src/components/features/diary/DiaryResourceCard.tsx`
- `src/components/features/diary/packing_list/suitcase/SuitcaseHeader.tsx`
- `src/components/features/diary/packing_list/suitcase/TemplatePreview.tsx`
- `src/components/features/diary/packing_list/suitcase/TripSuitcaseSection.tsx`
- `src/components/features/diary/packing_list/suitcase/tabs/GlobalSuggestionsTab.tsx` (6/7)
- `src/components/features/diary/packing_list/suitcase/tabs/override/ItemOverrideRow.tsx`
- `src/components/features/diary/packing_list/suitcase/tabs/override/ProductPicker.tsx`
- `src/components/home/hero/HeroFilterModule.tsx`
- `src/components/marketing/SponsorPlanCard.tsx`
- `src/components/modals/AuthModal.tsx` (solo pulsanti fuori dal `<form>`)
- `src/components/modals/BuyCreditsModal.tsx`
- `src/components/user/dashboard/UserReferralTab.tsx`

**Esclusione `useButtonType` (invariata volutamente):**

| File | Riga | Motivazione |
|----|-----:|----|
| `src/components/features/diary/packing_list/suitcase/tabs/GlobalSuggestionsTab.tsx` | 233 | `<button>` **senza `onClick`** (icona Trash). Non è un’azione chiara; potrebbe essere incompleto o non interattivo. Aggiungere `type="button"` non chiarisce il comportamento; richiede review funzionale dedicata. |

**Criterio applicato:**

- ✅ fuori da `<form>`
- ✅ presenza di `onClick` (azione esplicita: toggle, close, tab, filter, share, preview, ecc.)
- ❌ dentro `<form>` → escluso (nessun caso rimasto senza `type` nel form AuthModal: lo submit ha già `type="submit"`)
- ❌ senza `onClick` / dubbio → escluso

#### 5. `lint/correctness/noUnusedImports`

| Campo | Valore |
|----|----|
| **Risolti** | 14 |
| **File coinvolti** | 9 file (`EditorCulture`, `AiChatAssistant`, `PricingPlansPanel`, `BuyCreditsModal`, `UserReferralTab`, `categorySetup`, `useSuitcaseItemsMutations`, `contentService`, `observatoryService`) |
| **Esclusioni** | Nessuna dopo validazione |
| **Motivazione** | Solo import non usati; nessun side-effect import nel set |

### Batch A2 — Livello A rischio praticamente nullo (2026-08-03)

Categorie richieste: `useExportType`, `useConst`, `format`, `organizeImports`.

| Categoria | Pre | Post | Note |
|----|---:|---:|----|
| `format` | 0 | 0 | Già pulito sul set; nessuna modifica necessaria |
| `organizeImports` | 0 | 0 | Già pulito sul set; nessuna modifica necessaria |
| `useConst` | 1 | 0 | Applicato |
| `useExportType` | 1 | 0 | Applicato |

**Validazione pre-apply**

| Categoria | File:riga | Verifica | Esito |
|----|----|----|----|
| `useConst` | `itineraryService.ts:540` | `let userId = …` assegnato una sola volta, mai riassegnato | ✅ sicuro → `const` |
| `useExportType` | `aiAdminService.ts:5` | `export { type AdminProfileQuotaRow }` è re-export solo tipizzato | ✅ sicuro → `export type { … }` |

**Esclusioni:** nessuna.

**File modificati in Batch A2**

- `src/services/community/itineraryService.ts`
- `src/services/aiAdminService.ts`

**Warning eliminati in Batch A2:** **2**  
**Residuo Livello A sul set:** **0** (`format` / `organizeImports` / `useConst` / `useExportType`)

---

## Warning rimasti

Totale aperti sul set: **132**.

| Tipologia | Occorrenze | Classificazione | Gravità | Complessità | Batch vs review |
|----|---:|----|----|----|----|
| `noExplicitAny` | 22 | Legacy · Problema reale | Consigliato | Media–Complessa | Review dedicata |
| `noNonNullAssertion` | 17 | Legacy · Problema reale | Consigliato | Media | Review dedicata |
| `noLabelWithoutControl` | 14 | Legacy · Problema reale | Bloccante | Banale–Media | Batch a11y (review UI) |
| `useKeyWithClickEvents` | 14 | Legacy · Problema reale | Bloccante | Media | Review a11y (con `noStaticElementInteractions`) |
| `noUnusedVariables` | 11 | Legacy · misto | Consigliato | Banale–Media | Review (API vs dead code) |
| `noStaticElementInteractions` | 11 | Legacy · Problema reale | Bloccante | Media | Review a11y |
| `useExhaustiveDependencies` | 9 | Legacy · spesso discutibile | Bloccante | Media–Complessa | Review per effetto |
| `noUnusedFunctionParameters` | 5 | Legacy · misto/API | Consigliato | Banale–Media | Review |
| `noArrayIndexKey` | 4 | Legacy · spesso falso positivo | Bloccante* | Banale case-by-case | Review (liste statiche) |
| `useParseIntRadix` | 3 | Legacy | Pulizia futura (info) | Banale | Batch sicuro futuro |
| `useOptionalChain` | 3 | Legacy | Consigliato | Banale | Batch sicuro futuro |
| `noGlobalIsNan` | 3 | Legacy · Problema reale | Consigliato | Banale + attenzione semantica | Review riga-per-riga |
| `useAltText` | 3 | Legacy · Problema reale | Bloccante | Banale | Batch a11y |
| `noAutofocus` | 3 | Legacy · discutibile (UX) | Bloccante Biome | Media | Decisione prodotto |
| `useIterableCallbackReturn` | 3 | Legacy · Problema reale | Bloccante | Banale–Media | Review |
| `noSvgWithoutTitle` | 2 | Legacy · discutibile se decorativo | Bloccante | Banale | Review (`aria-hidden` vs title) |
| `useButtonType` | 1 | Legacy · escluso Batch A | Bloccante | Banale ma dubbio funzionale | Review `GlobalSuggestionsTab:233` |
| `useValidAnchor` | 1 | Legacy · Problema reale | Bloccante | Banale | Review |
| `noSwitchDeclarations` | 1 | Legacy · Problema reale | Bloccante | Banale | Review |
| `noShadowRestrictedNames` | 1 | Legacy · Problema reale | Bloccante | Banale | Review |
| `useHookAtTopLevel` | 1 | **Nuovo** (post-modifiche recenti) | Bloccante | Complessa | **Priorità 1 — review architetturale** |

\* `noArrayIndexKey`: errore Biome, ma rischio React spesso nullo su liste fisse.

---

## Note operative (set 35 file)

- Obiettivo del Batch A: **correzioni sicure**, non massimizzare il calo diagnostiche a ogni costo.
- Non introdotte suppressioni Biome / eslint-disable / ts-ignore.
- `AI_DELETED_CODE_REVIEW.md` va rigenerato per i file toccati da ogni attività (WF-RV-01); non è SoT di progetto.

---

## Classificazione per livello di sicurezza della correzione (residuo set 35 file)

> **Nota normativa — classificazione storica:**  
> Questa classificazione è **storica**: riflette esclusivamente le decisioni prese durante l’audit dei **35 file**.  
> **Non** sostituisce la classificazione ufficiale della baseline globale in [`AI_BIOME_AUDIT.md`](./AI_BIOME_AUDIT.md).  
> In particolare, **non** ridefinisce il Livello D: nella baseline full-project il Livello D è definito solo per categorie dichiarate **non correggibili a priori** ed è attualmente pari a **0** (vedi Parte 1 / `D_policy_and_false_positives.md`). I hit D di questo documento (es. `noArrayIndexKey`, `noAutofocus` sul residuo 132) restano decisioni **locali al set 35**, non policy globale.

> **Perimetro:** set auditato 35 file — **totale diagnostiche aperte = 132** (non la baseline globale 6232 in [`AI_BIOME_AUDIT.md`](./AI_BIOME_AUDIT.md)).  
> Principio: una correzione sta in un livello solo con ragionevole certezza di **nessuna regressione funzionale**, **nessun cambio runtime** e **nessuna alterazione architetturale**. In dubbio → livello più prudente.  
> La roadmap operativa di questo residuo è nella sezione **Roadmap** più sotto (proposta storica + roadmap storica dei batch pianificati sul set 35).

### Inventario residuo (conteggio ufficiale)

| Regola | N |
|----|---:|
| `lint/suspicious/noExplicitAny` | 22 |
| `lint/style/noNonNullAssertion` | 17 |
| `lint/a11y/noLabelWithoutControl` | 14 |
| `lint/a11y/useKeyWithClickEvents` | 14 |
| `lint/correctness/noUnusedVariables` | 11 |
| `lint/a11y/noStaticElementInteractions` | 11 |
| `lint/correctness/useExhaustiveDependencies` | 9 |
| `lint/correctness/noUnusedFunctionParameters` | 5 |
| `lint/suspicious/noArrayIndexKey` | 4 |
| `lint/correctness/useParseIntRadix` | 3 |
| `lint/complexity/useOptionalChain` | 3 |
| `lint/suspicious/noGlobalIsNan` | 3 |
| `lint/a11y/useAltText` | 3 |
| `lint/a11y/noAutofocus` | 3 |
| `lint/suspicious/useIterableCallbackReturn` | 3 |
| `lint/a11y/noSvgWithoutTitle` | 2 |
| `lint/a11y/useButtonType` | 1 |
| `lint/a11y/useValidAnchor` | 1 |
| `lint/correctness/noSwitchDeclarations` | 1 |
| `lint/suspicious/noShadowRestrictedNames` | 1 |
| `lint/correctness/useHookAtTopLevel` | 1 |
| **TOTALE** | **132** |

---

### LIVELLO A — Correzione totalmente meccanica

Zero regressioni · zero impatto runtime · applicabile automaticamente.

#### `lint/correctness/useParseIntRadix` — **3**

- **File:** `EditorCulture.tsx` (2), `aiAdminService.ts` (1)
- **Esclusioni:** nessuna
- **Motivazione livello A:** aggiungere `, 10` non cambia il parsing dei valori decimali usati in UI/admin; nessuna side-effect sulla logica.

#### `lint/correctness/noSwitchDeclarations` — **1**

- **File:** `UserReferralTab.tsx` (1)
- **Esclusioni:** nessuna
- **Motivazione livello A:** wrapping in blocco `{}` è puramente sintattico; nessun cambio di controllo di flusso se non si tocca il `case` logic.

**Subtotale Livello A: 4 diagnostiche · 2 categorie · 3 file**

---

### LIVELLO A/B — Quasi meccanica, brevissima verifica preventiva

#### `lint/complexity/useOptionalChain` — **3**

- **File:** `MarketingManager.tsx` (1), `SponsorPlanCard.tsx` (1), `contentService.ts` (1)
- **Verificare:** che il membro sinistro non sia un falsy “utile” (`0`, `''`) dove `a && a.b` ≠ `a?.b`.
- **Perché non A:** possibile differenza semantica su valori falsy non-nullish.

#### `lint/suspicious/noShadowRestrictedNames` — **1**

- **File:** `UserTripsTab.tsx` (1)
- **Verificare:** che il nome shadowato non sia un binding pubblico / export / API attesa da test o consumer.
- **Perché non A:** rename può rompere riferimenti esterni se il simbolo è intenzionale.

#### `lint/a11y/useAltText` — **3**

- **File:** `UserReferralTab.tsx` (2), `EditorCulture.tsx` (1)
- **Verificare:** immagine decorativa (`alt=""`) vs informativa (testo alt reale).
- **Perché non A:** scelta del testo alt è semantica/UX, non puramente meccanica.

#### `lint/a11y/noSvgWithoutTitle` — **2**

- **File:** `SponsorPlanCard.tsx` (1), `UserReferralTab.tsx` (1)
- **Verificare:** SVG decorativo (`aria-hidden`) vs icona con significato (`<title>` / `aria-label`).
- **Perché non A:** richiede decisione a11y minima sul ruolo dell’icona.

**Subtotale Livello A/B: 9 diagnostiche · 4 categorie · 6 file**  
(`MarketingManager`, `SponsorPlanCard`, `contentService`, `UserTripsTab`, `UserReferralTab`, `EditorCulture`)

---

### LIVELLO B — Richiede lettura del codice (non automatizzabile)

#### `lint/a11y/noLabelWithoutControl` — **14**

- **File:** `EditUserModal.tsx` (6), `GlobalSuggestionsTab.tsx` (5), `EditorCulture.tsx` (3)
- **Review:** associare `htmlFor`/`id` o ristrutturare label senza cambiare layout.
- **Rischio:** rompere focus/labeling o layout form.

#### `lint/a11y/useKeyWithClickEvents` — **14**

- **File:** `HeroFilterModule.tsx` (6), `SuitcaseHeader.tsx` (2), `AuthModal.tsx` (2), `BuyCreditsModal.tsx` (2), `EditorCulture.tsx` (1), `DiaryResourceCard.tsx` (1)
- **Review:** preferire elemento semantico (`button`) o hit-area; non aggiungere solo `onKeyDown` cosmetico.
- **Rischio:** regressione UX/click nesting / focus trap.

#### `lint/a11y/noStaticElementInteractions` — **11**

- **File:** `HeroFilterModule.tsx` (6), `AuthModal.tsx` (2), `BuyCreditsModal.tsx` (2), `EditorCulture.tsx` (1)
- **Review:** stesso cluster di `useKeyWithClickEvents` (spesso le stesse superfici).
- **Rischio:** markup interattivo invalido o doppie azioni.

#### `lint/correctness/noUnusedVariables` — **11**

- **File:** `EditorCulture.tsx` (2), `usePoiManager.ts` (2), `contentService.ts` (2), `EditUserModal.tsx` (1), `UserReferralTab.tsx` (1), `itineraryService.ts` (1), `rankingService.ts` (1), `shopService.ts` (1)
- **Review:** dead code vs placeholder intenzionale / catch ignorato / binding per side-effect.
- **Rischio:** rimuovere simbolo ancora utile o mascherare errori.

#### `lint/correctness/noUnusedFunctionParameters` — **5**

- **File:** `AiChatAssistant.tsx` (2), `TripSuitcaseSection.tsx` (1), `UserReferralTab.tsx` (1), `usePoiManager.ts` (1)
- **Review:** firma pubblica/callback vs parametro davvero morto.
- **Rischio:** breaking change di API props/callback.

#### `lint/suspicious/noGlobalIsNan` — **3**

- **File:** `EditorCulture.tsx` (1), `TripSuitcaseSection.tsx` (1), `usePoiManager.ts` (1)
- **Review:** `isNaN` coerce; `Number.isNaN` no — verificare input non-number.
- **Rischio:** cambio di branch su `undefined`/`null`/stringhe.

#### `lint/suspicious/useIterableCallbackReturn` — **3**

- **File:** `usePoiManager.ts` (2), `aiAdminService.ts` (1)
- **Review:** `map` vs `forEach` vs `for...of` e uso del valore di ritorno.
- **Rischio:** array costruiti male o side-effect persi.

#### `lint/a11y/useValidAnchor` — **1**

- **File:** `AuthModal.tsx` (1)
- **Review:** `href="#"` / link finto vs `button`.
- **Rischio:** navigazione/accessibilità.

#### `lint/a11y/useButtonType` — **1**

- **File:** `GlobalSuggestionsTab.tsx` (1) — riga Trash senza `onClick`
- **Review:** ripristinare azione delete o rimuovere controllo morto; solo poi `type="button"`.
- **Rischio:** fingere un controllo operativo inesistente.

**Subtotale Livello B: 63 diagnostiche · 9 categorie · 15 file**

---

### LIVELLO C — Review architetturale

#### `lint/suspicious/noExplicitAny` — **22**

- **File:** `EditorCulture.tsx` (4), `PricingPlansPanel.tsx` (4), `HeroFilterModule.tsx` (4), `AiChatAssistant.tsx` (2), `itineraryService.ts` (2), `EditUserModal.tsx` (1), `DiaryResourceCard.tsx` (1), `TripSuitcaseSection.tsx` (1), `AuthModal.tsx` (1), `BuyCreditsModal.tsx` (1), `contentService.ts` (1)
- **Motivazione:** tipizzare `any` implica contratti di dominio/Supabase; tipi sbagliati possono forzare cast o rami errati.
- **Impatto:** confine dominio ↔ UI ↔ DB; non è un rename meccanico.

#### `lint/style/noNonNullAssertion` — **17**

- **File:** `EditorCulture.tsx` (14), `categorySetup.ts` (2), `itineraryService.ts` (1)
- **Motivazione:** rimuovere `!` richiede narrowing reale o gestione assenza; può cambiare throw/branch.
- **Impatto:** invarianti di dominio e flussi di errore.

#### `lint/correctness/useExhaustiveDependencies` — **9**

- **File:** `UserReferralTab.tsx` (2), `EditorCulture.tsx` (1), `AiChatAssistant.tsx` (1), `MarketingManager.tsx` (1), `SuitcaseHeader.tsx` (1), `TemplatePreview.tsx` (1), `AuthModal.tsx` (1), `useDocumentSaveController.ts` (1)
- **Motivazione:** aggiungere dipendenze può causare loop, refetch, reset state; rimuoverle può lasciare stale closure.
- **Impatto:** ciclo di vita React / data loading.

#### `lint/correctness/useHookAtTopLevel` — **1**

- **File:** `useDocumentSaveController.ts` (1)
- **Motivazione:** violazione Rules of Hooks; richiede ristrutturazione del flusso, non un fix locale.
- **Impatto:** architettura dell’hook di salvataggio documenti (unica regressione “nuova” nota).

**Subtotale Livello C: 49 diagnostiche · 4 categorie · 14 file**

---

### LIVELLO D — Non correggere (ora)

#### `lint/suspicious/noArrayIndexKey` — **4**

- **File:** `EditorCulture.tsx` (1), `PricingPlansPanel.tsx` (1), `HeroFilterModule.tsx` (1), `SponsorPlanCard.tsx` (1)
- **Motivazione:** nel set auditato sono tipicamente liste UI fisse/stabili; l’indice è chiave sicura. Correggere “per Biome” con key artificiali è anti-pattern già scartato. Se una lista risulta dinamica → promuovere a Livello B.

#### `lint/a11y/noAutofocus` — **3**

- **File:** `SuitcaseHeader.tsx` (2), `ProductPicker.tsx` (1)
- **Motivazione:** autofocus spesso intenzionale (focus input titolo / picker). È decisione di prodotto/UX, non debito tecnico da azzerare.

**Subtotale Livello D: 7 diagnostiche · 2 categorie · 5 file**

---

### Riepilogo contabile (deve sommare a 132)

| Livello | Diagnostiche | Categorie Biome | Categorie | File coinvolti (unione) |
|----|---:|---:|----|---:|
| **A** | **4** | 2 | `useParseIntRadix`, `noSwitchDeclarations` | 3 |
| **A/B** | **9** | 4 | `useOptionalChain`, `noShadowRestrictedNames`, `useAltText`, `noSvgWithoutTitle` | 6 |
| **B** | **63** | 9 | `noLabelWithoutControl`, `useKeyWithClickEvents`, `noStaticElementInteractions`, `noUnusedVariables`, `noUnusedFunctionParameters`, `noGlobalIsNan`, `useIterableCallbackReturn`, `useValidAnchor`, `useButtonType` | 15 |
| **C** | **49** | 4 | `noExplicitAny`, `noNonNullAssertion`, `useExhaustiveDependencies`, `useHookAtTopLevel` | 14 |
| **D** | **7** | 2 | `noArrayIndexKey`, `noAutofocus` | 5 |
| **TOTALE** | **132** | **21** | — | — |

Verifica aritmetica: `4 + 9 + 63 + 49 + 7 = 132`.

---

## Roadmap derivante dall'audit storico (set 35 file)

> Piano batch sul residuo **132** del set 35 file (sezione Storico sopra).
> **Non** confondere con i batch P0–P9 della roadmap globale in [AI_BIOME_AUDIT.md](./AI_BIOME_AUDIT.md).

## Roadmap proposta (storico — set 35 file)

1. **P0 — `useHookAtTopLevel`** (`useDocumentSaveController.ts`): unica regressione chiara; review architetturale Rules of Hooks.
2. **P1 — Cluster a11y clickable:** `noStaticElementInteractions` + `useKeyWithClickEvents` (+ `noLabelWithoutControl` / `useAltText`) per schermata (`HeroFilterModule`, `AuthModal`, `BuyCreditsModal`, …).
3. **P2 — Batch stile sicuro residuo:** `useOptionalChain`, `useParseIntRadix` (Livello A già chiuso: `useConst` / `useExportType` / `format` / `organizeImports`).
4. **P3 — TS hardening:** `noExplicitAny`, `noNonNullAssertion` (file per file).
5. **P4 — Effects:** `useExhaustiveDependencies` con review runtime.
6. **P5 — Case speciali:** `noArrayIndexKey`, `noAutofocus`, `noSvgWithoutTitle`, `GlobalSuggestionsTab:233` (`useButtonType` escluso), `noGlobalIsNan`, `useIterableCallbackReturn`, unused params/vars API.

---

## Roadmap storica dei batch pianificati (set 35 file)

> Pianificazione definita durante l’audit storico del set 35 file.  
> **Non** sostituisce la roadmap ufficiale P0–P9 in [`AI_BIOME_AUDIT.md`](./AI_BIOME_AUDIT.md).  
> Mantenuta esclusivamente per preservare il contesto storico dell’attività.

Ordine pensato (all’epoca) per **massima sicurezza** e per impedire nuovo debito, non per azzerare i warning.

| # | Livello | Categorie | Warning eliminabili | File (stima unione) | Rischio | Modalità |
|----|----|----|---:|---:|----|----|
| **Batch 1** | A | `useParseIntRadix`, `noSwitchDeclarations` | **4** | 3 | Praticamente nullo | Completamente automatico (con smoke check) |
| **Batch 2** | A/B | `useOptionalChain`, `noShadowRestrictedNames` | **4** | 4 | Molto basso | Semi-automatico (verifica falsy / rename) |
| **Batch 3** | A/B | `useAltText`, `noSvgWithoutTitle` | **5** | 3 | Basso (a11y copy) | Semi-automatico |
| **Batch 4** | B | Cluster clickable: `noStaticElementInteractions` + `useKeyWithClickEvents` | **25** | 6 | Medio (UX/focus) | Completamente manuale (per schermata) |
| **Batch 5** | B | `noLabelWithoutControl` + `useValidAnchor` + `useButtonType` residuo | **16** | 4 | Medio (form/a11y) | Completamente manuale |
| **Batch 6** | B | `noUnusedVariables` + `noUnusedFunctionParameters` | **16** | 10 | Medio-basso (API) | Completamente manuale |
| **Batch 7** | B | `noGlobalIsNan` + `useIterableCallbackReturn` | **6** | 4 | Medio (semantica) | Completamente manuale |
| **Batch 8** | C | `useHookAtTopLevel` | **1** | 1 | Alto se sbagliato | Completamente manuale / architetturale (**priorità qualitativa**) |
| **Batch 9** | C | `useExhaustiveDependencies` | **9** | 8 | Alto (loop/stale) | Completamente manuale |
| **Batch 10** | C | `noNonNullAssertion` poi `noExplicitAny` | **39** | ~12 | Alto (dominio) | Completamente manuale, file-per-file |
| **—** | D | `noArrayIndexKey`, `noAutofocus` | **0** (tenere) | 5 | N/A | Non correggere finché non cambia il prodotto/lista |

**Nota Batch 8:** numericamente piccolo, ma va affrontato prima dei grandi batch C tipizzazione se si vuole chiudere la sola regressione “nuova” nota (`useDocumentSaveController`).

**Regola di governo:** ogni nuovo codice nel set deve nascere già conforme ai Livelli A–B evitabili; il debito Livello C/D si smonta solo a batch dedicati, mai “di passaggio”.

---

## Documenti correlati

| Documento | Ruolo |
|-----------|--------|
| [`AI_BIOME_AUDIT.md`](./AI_BIOME_AUDIT.md) | **SoT ufficiale** baseline globale **6232** + roadmap P0–P9 |
| [`AI_BIOME_AUDIT_35_FILES_HISTORY.md`](./AI_BIOME_AUDIT_35_FILES_HISTORY.md) (questo file) | Storico audit parziale 35 file |
| [`AI_QUALITY/README.md`](./AI_QUALITY/README.md) | Indice dettaglio per categoria Biome |

