# AI Biome Audit

Source of Truth ufficiale della bonifica Biome dell'**intero progetto** TouringDiary.

> Principio: l'obiettivo **non** è arrivare a zero warning.  
> Obiettivi: bloccare nuovo debito, ridurre il debito legacy con correzioni davvero sicure, evitare hack/suppressioni, zero regressioni.

I dettagli per categoria vivono in [`AI_QUALITY/`](./AI_QUALITY/README.md). Questo file è la **dashboard** / SoT globale.

### Come leggere questo documento

| Sezione | Contesto | Contatori |
|---------|----------|-----------|
| **Parte 1 — Baseline globale** | Intero repository Biome | **6232** diagnostiche (**unica SoT ufficiale**) |
| **Parte 2 — Roadmap bonifica globale** | Piano batch sul perimetro full-project | Batch P0–P9 sulla baseline **6232** |

**Storico audit parziale (35 file):** [`AI_BIOME_AUDIT_35_FILES_HISTORY.md`](./AI_BIOME_AUDIT_35_FILES_HISTORY.md)  
Contatori storici **339 / 207 / 132** — **non** sono la baseline globale e **non** misurano l’avanzamento della bonifica full-project.

---

# Parte 1 — Baseline globale (full project)

> SoT numerica ufficiale del debito Biome sul repository.  
> Snapshot: 2026-08-03 · `npx biome check --reporter=json --max-diagnostics=100000 .`

## Dashboard bonifica (full project)

| Campo | Valore |
|----|----|
| **Diagnostiche iniziali del progetto (baseline)** | **6232** |
| **Diagnostiche eliminate (dal baseline)** | **0** |
| **Diagnostiche residue** | **6232** |
| **Percentuale di riduzione complessiva** | **0.00%** |
| **Ultimo aggiornamento** | 2026-08-03 |
| **Stato corrente della bonifica** | Baseline ufficiale fotografata — **nessuna correzione codice** in questa attività; roadmap pronta |
| **Scope** | Intero perimetro Biome del repository (`biome.json` / `npx biome check .`) |
| **File Biome analizzati (unchanged+changed)** | 1126 unchanged / 0 changed |
| **File con almeno 1 diagnostica** | **1043** |
| **Categorie Biome distinte** | **51** |

### Contabilità per severity

| Severity | Conteggio |
|----|---:|
| **error** | **3795** |
| **warning** | **2259** |
| **info** | **178** |
| **Totale** | **6232** |

Verifica aritmetica severity: 3795 + 2259 + 178 = **6232** (atteso 6232).

### Contabilità per livello di sicurezza correzione

| Livello | Diagnostiche | Categorie | File (unici nel livello) | Natura |
|----|---:|---:|---:|----|
| **A** | **2823** | 17 | 1019 | Meccanico, zero rischio |
| **A/B** | **1211** | 7 | 314 | Quasi automatico, verifica breve |
| **B** | **1358** | 20 | 403 | Review funzionale / lettura codice |
| **C** | **840** | 7 | 289 | Review architetturale / type safety / React / security |
| **D** | **0** | 0 | 0 | Non correggere (policy / FP / prodotto) |
| **Totale** | **6232** | 51 | — | Deve coincidere con baseline |

Identità obbligata: A + A/B + B + C + D = **6232** = diagnostiche progetto **6232**.

---

## Indice documenti di dettaglio

| Livello | Documento | Occorrenze |
|----|----|---:|
| A | [`AI_QUALITY/biome/A_format.md`](./AI_QUALITY/biome/A_format.md) | 964 |
| A | [`AI_QUALITY/biome/A_organizeImports.md`](./AI_QUALITY/biome/A_organizeImports.md) | 786 |
| A | [`AI_QUALITY/biome/A_useImportType.md`](./AI_QUALITY/biome/A_useImportType.md) | 862 |
| A | [`AI_QUALITY/biome/A_mechanical_style_small.md`](./AI_QUALITY/biome/A_mechanical_style_small.md) | 211 |
| A/B | [`AI_QUALITY/biome/AB_noUnusedImports.md`](./AI_QUALITY/biome/AB_noUnusedImports.md) | 328 |
| A/B | [`AI_QUALITY/biome/AB_useButtonType.md`](./AI_QUALITY/biome/AB_useButtonType.md) | 852 |
| A/B | [`AI_QUALITY/biome/AB_suspicious_and_switch_small.md`](./AI_QUALITY/biome/AB_suspicious_and_switch_small.md) | 31 |
| B | [`AI_QUALITY/biome/B_noUnusedVariables.md`](./AI_QUALITY/biome/B_noUnusedVariables.md) | 204 |
| B | [`AI_QUALITY/biome/B_noUnusedFunctionParameters.md`](./AI_QUALITY/biome/B_noUnusedFunctionParameters.md) | 121 |
| B | [`AI_QUALITY/biome/B_useOptionalChain.md`](./AI_QUALITY/biome/B_useOptionalChain.md) | 84 |
| B | [`AI_QUALITY/biome/B_a11y_click_and_static_interactions.md`](./AI_QUALITY/biome/B_a11y_click_and_static_interactions.md) | 504 |
| B | [`AI_QUALITY/biome/B_a11y_labels_and_forms.md`](./AI_QUALITY/biome/B_a11y_labels_and_forms.md) | 257 |
| B | [`AI_QUALITY/biome/B_a11y_aria_semantic_media.md`](./AI_QUALITY/biome/B_a11y_aria_semantic_media.md) | 44 |
| B | [`AI_QUALITY/biome/B_suspicious_iterable_shadow_assign.md`](./AI_QUALITY/biome/B_suspicious_iterable_shadow_assign.md) | 62 |
| B | [`AI_QUALITY/biome/B_noArrayIndexKey.md`](./AI_QUALITY/biome/B_noArrayIndexKey.md) | 82 |
| C | [`AI_QUALITY/biome/C_noExplicitAny.md`](./AI_QUALITY/biome/C_noExplicitAny.md) | 473 |
| C | [`AI_QUALITY/biome/C_useExhaustiveDependencies.md`](./AI_QUALITY/biome/C_useExhaustiveDependencies.md) | 204 |
| C | [`AI_QUALITY/biome/C_noNonNullAssertion.md`](./AI_QUALITY/biome/C_noNonNullAssertion.md) | 128 |
| C | [`AI_QUALITY/biome/C_hooks_security_parse_tsignore.md`](./AI_QUALITY/biome/C_hooks_security_parse_tsignore.md) | 35 |
| D | [`AI_QUALITY/biome/D_policy_and_false_positives.md`](./AI_QUALITY/biome/D_policy_and_false_positives.md) | 0 |

Indice completo: [`AI_QUALITY/README.md`](./AI_QUALITY/README.md)

---

## Contabilità per categoria Biome

| Categoria | Occ. | Err | Warn | Info | File | Livello | Dettaglio |
|----|---:|---:|---:|---:|---:|----|----|
| `format` | 964 | 964 | 0 | 0 | 964 | A | [`doc`](./AI_QUALITY/biome/A_format.md) |
| `lint/style/useImportType` | 862 | 0 | 862 | 0 | 585 | A | [`doc`](./AI_QUALITY/biome/A_useImportType.md) |
| `lint/a11y/useButtonType` | 852 | 852 | 0 | 0 | 206 | A/B | [`doc`](./AI_QUALITY/biome/AB_useButtonType.md) |
| `assist/source/organizeImports` | 786 | 786 | 0 | 0 | 786 | A | [`doc`](./AI_QUALITY/biome/A_organizeImports.md) |
| `lint/suspicious/noExplicitAny` | 473 | 0 | 473 | 0 | 183 | C | [`doc`](./AI_QUALITY/biome/C_noExplicitAny.md) |
| `lint/correctness/noUnusedImports` | 328 | 0 | 328 | 0 | 231 | A/B | [`doc`](./AI_QUALITY/biome/AB_noUnusedImports.md) |
| `lint/a11y/useKeyWithClickEvents` | 263 | 263 | 0 | 0 | 140 | B | [`doc`](./AI_QUALITY/biome/B_a11y_click_and_static_interactions.md) |
| `lint/a11y/noStaticElementInteractions` | 241 | 241 | 0 | 0 | 147 | B | [`doc`](./AI_QUALITY/biome/B_a11y_click_and_static_interactions.md) |
| `lint/a11y/noLabelWithoutControl` | 240 | 240 | 0 | 0 | 80 | B | [`doc`](./AI_QUALITY/biome/B_a11y_labels_and_forms.md) |
| `lint/correctness/noUnusedVariables` | 204 | 0 | 204 | 0 | 99 | B | [`doc`](./AI_QUALITY/biome/B_noUnusedVariables.md) |
| `lint/correctness/useExhaustiveDependencies` | 204 | 204 | 0 | 0 | 110 | C | [`doc`](./AI_QUALITY/biome/C_useExhaustiveDependencies.md) |
| `lint/style/noNonNullAssertion` | 128 | 0 | 128 | 0 | 35 | C | [`doc`](./AI_QUALITY/biome/C_noNonNullAssertion.md) |
| `lint/correctness/noUnusedFunctionParameters` | 121 | 0 | 121 | 0 | 72 | B | [`doc`](./AI_QUALITY/biome/B_noUnusedFunctionParameters.md) |
| `lint/complexity/useOptionalChain` | 84 | 0 | 84 | 0 | 59 | B | [`doc`](./AI_QUALITY/biome/B_useOptionalChain.md) |
| `lint/suspicious/noArrayIndexKey` | 82 | 82 | 0 | 0 | 61 | B | [`doc`](./AI_QUALITY/biome/B_noArrayIndexKey.md) |
| `lint/correctness/useParseIntRadix` | 55 | 0 | 0 | 55 | 32 | A | [`doc`](./AI_QUALITY/biome/A_mechanical_style_small.md) |
| `lint/complexity/useLiteralKeys` | 38 | 0 | 0 | 38 | 8 | A | [`doc`](./AI_QUALITY/biome/A_mechanical_style_small.md) |
| `lint/suspicious/useIterableCallbackReturn` | 33 | 33 | 0 | 0 | 18 | B | [`doc`](./AI_QUALITY/biome/B_suspicious_iterable_shadow_assign.md) |
| `lint/style/useConst` | 31 | 0 | 31 | 0 | 22 | A | [`doc`](./AI_QUALITY/biome/A_mechanical_style_small.md) |
| `lint/style/useNodejsImportProtocol` | 22 | 0 | 0 | 22 | 14 | A | [`doc`](./AI_QUALITY/biome/A_mechanical_style_small.md) |
| `lint/style/useTemplate` | 22 | 0 | 0 | 22 | 18 | A | [`doc`](./AI_QUALITY/biome/A_mechanical_style_small.md) |
| `lint/a11y/noAutofocus` | 17 | 17 | 0 | 0 | 14 | B | [`doc`](./AI_QUALITY/biome/B_a11y_labels_and_forms.md) |
| `lint/suspicious/noGlobalIsNan` | 17 | 0 | 17 | 0 | 16 | A/B | [`doc`](./AI_QUALITY/biome/AB_suspicious_and_switch_small.md) |
| `lint/complexity/noUselessLoneBlockStatements` | 15 | 0 | 0 | 15 | 5 | A | [`doc`](./AI_QUALITY/biome/A_mechanical_style_small.md) |
| `lint/suspicious/noShadowRestrictedNames` | 15 | 15 | 0 | 0 | 15 | B | [`doc`](./AI_QUALITY/biome/B_suspicious_iterable_shadow_assign.md) |
| `lint/a11y/useAriaPropsSupportedByRole` | 13 | 13 | 0 | 0 | 11 | B | [`doc`](./AI_QUALITY/biome/B_a11y_aria_semantic_media.md) |
| `lint/correctness/useHookAtTopLevel` | 13 | 13 | 0 | 0 | 4 | C | [`doc`](./AI_QUALITY/biome/C_hooks_security_parse_tsignore.md) |
| `lint/security/noDangerouslySetInnerHtml` | 11 | 11 | 0 | 0 | 11 | C | [`doc`](./AI_QUALITY/biome/C_hooks_security_parse_tsignore.md) |
| `lint/a11y/useSemanticElements` | 10 | 10 | 0 | 0 | 10 | B | [`doc`](./AI_QUALITY/biome/B_a11y_aria_semantic_media.md) |
| `lint/complexity/noUselessEscapeInRegex` | 10 | 0 | 0 | 10 | 6 | A | [`doc`](./AI_QUALITY/biome/A_mechanical_style_small.md) |
| `lint/a11y/noSvgWithoutTitle` | 9 | 9 | 0 | 0 | 9 | B | [`doc`](./AI_QUALITY/biome/B_a11y_aria_semantic_media.md) |
| `lint/suspicious/noImplicitAnyLet` | 9 | 9 | 0 | 0 | 7 | B | [`doc`](./AI_QUALITY/biome/B_suspicious_iterable_shadow_assign.md) |
| `parse` | 9 | 9 | 0 | 0 | 1 | C | [`doc`](./AI_QUALITY/biome/C_hooks_security_parse_tsignore.md) |
| `lint/a11y/noNoninteractiveElementToInteractiveRole` | 7 | 7 | 0 | 0 | 7 | B | [`doc`](./AI_QUALITY/biome/B_a11y_aria_semantic_media.md) |
| `lint/correctness/noSwitchDeclarations` | 6 | 6 | 0 | 0 | 3 | A/B | [`doc`](./AI_QUALITY/biome/AB_suspicious_and_switch_small.md) |
| `lint/complexity/noUselessUndefinedInitialization` | 5 | 0 | 0 | 5 | 5 | A | [`doc`](./AI_QUALITY/biome/A_mechanical_style_small.md) |
| `lint/suspicious/noPrototypeBuiltins` | 5 | 0 | 5 | 0 | 4 | A/B | [`doc`](./AI_QUALITY/biome/AB_suspicious_and_switch_small.md) |
| `lint/a11y/useAltText` | 3 | 3 | 0 | 0 | 2 | B | [`doc`](./AI_QUALITY/biome/B_a11y_aria_semantic_media.md) |
| `lint/complexity/noUselessFragments` | 3 | 0 | 0 | 3 | 3 | A | [`doc`](./AI_QUALITY/biome/A_mechanical_style_small.md) |
| `lint/complexity/noUselessSwitchCase` | 3 | 0 | 0 | 3 | 3 | A | [`doc`](./AI_QUALITY/biome/A_mechanical_style_small.md) |
| `lint/complexity/noUselessTernary` | 3 | 0 | 0 | 3 | 2 | A | [`doc`](./AI_QUALITY/biome/A_mechanical_style_small.md) |
| `lint/suspicious/noAssignInExpressions` | 3 | 3 | 0 | 0 | 2 | B | [`doc`](./AI_QUALITY/biome/B_suspicious_iterable_shadow_assign.md) |
| `lint/style/useExponentiationOperator` | 2 | 0 | 0 | 2 | 1 | A | [`doc`](./AI_QUALITY/biome/A_mechanical_style_small.md) |
| `lint/suspicious/noDoubleEquals` | 2 | 2 | 0 | 0 | 1 | A/B | [`doc`](./AI_QUALITY/biome/AB_suspicious_and_switch_small.md) |
| `lint/suspicious/noTemplateCurlyInString` | 2 | 0 | 2 | 0 | 2 | B | [`doc`](./AI_QUALITY/biome/B_suspicious_iterable_shadow_assign.md) |
| `lint/suspicious/noTsIgnore` | 2 | 0 | 2 | 0 | 1 | C | [`doc`](./AI_QUALITY/biome/C_hooks_security_parse_tsignore.md) |
| `lint/a11y/useFocusableInteractive` | 1 | 1 | 0 | 0 | 1 | B | [`doc`](./AI_QUALITY/biome/B_a11y_aria_semantic_media.md) |
| `lint/a11y/useValidAnchor` | 1 | 1 | 0 | 0 | 1 | B | [`doc`](./AI_QUALITY/biome/B_a11y_aria_semantic_media.md) |
| `lint/style/noDescendingSpecificity` | 1 | 0 | 1 | 0 | 1 | A/B | [`doc`](./AI_QUALITY/biome/AB_suspicious_and_switch_small.md) |
| `lint/suspicious/noEmptyInterface` | 1 | 1 | 0 | 0 | 1 | A | [`doc`](./AI_QUALITY/biome/A_mechanical_style_small.md) |
| `lint/suspicious/noUselessEscapeInString` | 1 | 0 | 1 | 0 | 1 | A | [`doc`](./AI_QUALITY/biome/A_mechanical_style_small.md) |

### Motivazioni sintesi per livello

#### Livello A — 2823 diagnostiche / 17 categorie

Correzione completamente meccanica, applicabile automaticamente.

- `assist/source/organizeImports` (786): Riordino import meccanico senza cambio binding.
- `format` (964): Formattazione Biome puramente meccanica; zero semantica.
- `lint/complexity/noUselessEscapeInRegex` (10): Rimozione escape inutili in regex.
- `lint/complexity/noUselessFragments` (3): Fragment inutili rimovibili senza cambio DOM.
- `lint/complexity/noUselessLoneBlockStatements` (15): Blocchi {} inutili rimovibili.
- `lint/complexity/noUselessSwitchCase` (3): Case ridondanti/fallthrough inutili rimovibili meccanicamente.
- `lint/complexity/noUselessTernary` (3): Ternari riducibili a espressione equivalente.
- `lint/complexity/noUselessUndefinedInitialization` (5): Rimozione =undefined ridondante.
- `lint/complexity/useLiteralKeys` (38): Bracket→dot su chiavi letterali valide; meccanico.
- `lint/correctness/useParseIntRadix` (55): Aggiunta radix 10 esplicita; semantica invariata per decimali.
- `lint/style/useConst` (31): let→const su binding non riassegnati; meccanico.
- `lint/style/useExponentiationOperator` (2): Math.pow→**; equivalente.
- `lint/style/useImportType` (862): Conversione import type-only; comportamento runtime invariato.
- `lint/style/useNodejsImportProtocol` (22): Prefisso node: su built-in; risoluzione invariata.
- `lint/style/useTemplate` (22): Concatenazione→template string equivalente.
- `lint/suspicious/noEmptyInterface` (1): Interface vuota convertibile in type; nessun merging dichiarato nel singolo hit.
- `lint/suspicious/noUselessEscapeInString` (1): Escape stringa inutile.

#### Livello A/B — 1211 diagnostiche / 7 categorie

Quasi automatico; brevissima verifica preventiva.

- `lint/a11y/useButtonType` (852): type=button sicuro se c'e onClick/handler; senza handler puo mascherare bug submit. Verifica breve per bottone.
- `lint/correctness/noSwitchDeclarations` (6): Scope block attorno a case; meccanico ma va verificato TDZ/shadowing.
- `lint/correctness/noUnusedImports` (328): Quasi sempre sicuro; verificare side-effect import e re-export intenzionali.
- `lint/style/noDescendingSpecificity` (1): CSS specificity; verificare cascade intenzionale.
- `lint/suspicious/noDoubleEquals` (2): ==→=== con check coercizione intenzionale.
- `lint/suspicious/noGlobalIsNan` (17): Number.isNaN dopo Number(); breve check sul tipo del valore.
- `lint/suspicious/noPrototypeBuiltins` (5): Object.hasOwn / Object.prototype.hasOwnProperty.call; breve verifica.

#### Livello B — 1358 diagnostiche / 20 categorie

Richiede lettura del codice e review funzionale.

- `lint/a11y/noAutofocus` (17): autofocus puo essere intenzionale UX; review prodotto.
- `lint/a11y/noLabelWithoutControl` (240): htmlFor/id o wrapping; review markup form.
- `lint/a11y/noNoninteractiveElementToInteractiveRole` (7): Restruct markup; review a11y/UX.
- `lint/a11y/noStaticElementInteractions` (241): Role/button vs elemento semantico; scelta UI.
- `lint/a11y/noSvgWithoutTitle` (9): title/aria-label dipende da decorative vs informative.
- `lint/a11y/useAltText` (3): alt content e prodotto/contenuto.
- `lint/a11y/useAriaPropsSupportedByRole` (13): Correzione ARIA richiede capire ruolo effettivo.
- `lint/a11y/useFocusableInteractive` (1): tabIndex/focusability; review interazione.
- `lint/a11y/useKeyWithClickEvents` (263): A11y: aggiungere keyboard handler cambia UX; review funzionale.
- `lint/a11y/useSemanticElements` (10): role→elemento semantico puo alterare stile/CSS.
- `lint/a11y/useValidAnchor` (1): href/button swap; review navigazione.
- `lint/complexity/useOptionalChain` (84): &&→?. puo cambiare short-circuit/falsy; serve lettura.
- `lint/correctness/noUnusedFunctionParameters` (121): Parametri possono essere parte di firma/callback; underscore o rimozione richiede review.
- `lint/correctness/noUnusedVariables` (204): Serve capire se binding e WIP, catch, o API contract; non auto-delete.
- `lint/suspicious/noArrayIndexKey` (82): Key stabile richiede identita di dominio; non meccanico. Alcuni casi possono diventare D dopo review.
- `lint/suspicious/noAssignInExpressions` (3): Assegnazione in if/while; va separata con cura.
- `lint/suspicious/noImplicitAnyLet` (9): Serve annotazione tipo corretta dal contesto.
- `lint/suspicious/noShadowRestrictedNames` (15): Rename name/value/ecc. richiede aggiornare usi.
- `lint/suspicious/noTemplateCurlyInString` (2): Puo essere stringa letterale intenzionale o bug template.
- `lint/suspicious/useIterableCallbackReturn` (33): forEach return vs for..of/map; rischio cambio flusso.

#### Livello C — 840 diagnostiche / 7 categorie

Review architetturale; puo toccare type safety, runtime, dominio o flussi React.

- `lint/correctness/useExhaustiveDependencies` (204): Deps React: rischio loop/stale closure; review architetturale/hook.
- `lint/correctness/useHookAtTopLevel` (13): Hook condizionali: richiede refactor struttura componente.
- `lint/security/noDangerouslySetInnerHtml` (11): XSS/sanitizzazione; review sicurezza contenuti.
- `lint/style/noNonNullAssertion` (128): ! nasconde null; serve narrowing reale.
- `lint/suspicious/noExplicitAny` (473): Sostituire any richiede tipi dominio; impatto type safety.
- `lint/suspicious/noTsIgnore` (2): @ts-ignore→fix tipizzato; puo rivelare errori reali.
- `parse` (9): Errori di parse: codice non valido o strumento; priorita alta, non cosmetic.

#### Livello D — 0 diagnostiche

Vedi [`AI_QUALITY/biome/D_policy_and_false_positives.md`](./AI_QUALITY/biome/D_policy_and_false_positives.md).  
Alla baseline: **0** hit in D (nessuna categoria intera dichiarata non-correggibile a priori).

---

## Metodo di generazione baseline

```text
npx biome check --reporter=json --max-diagnostics=100000 .
```

- Data snapshot: 2026-08-03
- Totale diagnostiche JSON: 6232
- Summary Biome: errors=3795, warnings=2259, infos=178
- Classificazione: per **sicurezza della correzione**, non per nome regola in isolamento
- In dubbio: livello più cauto

---

# Parte 2 — Roadmap bonifica globale (full project)

> Piano operativo sulla **baseline 6232** (Parte 1).  
> I batch P0–P9 di questa sezione **non** sono i Batch 1–10 dello storico set 35 file ([`AI_BIOME_AUDIT_35_FILES_HISTORY.md`](./AI_BIOME_AUDIT_35_FILES_HISTORY.md)).

## Roadmap bonifica (full project)

Ordine consigliato: esaurire A → A/B → B → C; promuovere a D solo con registro esplicito.

| Batch | Livello | Categorie (sintesi) | Warning/diagn. eliminabili | File | Rischio | Auto | Semi | Manuale |
|----|----|----|---:|----|----|----|----|----|
| Batch P0 — Format & imports meccanici | A | format, assist/source/organizeImports | 1750 | vedi doc A_format + A_organizeImports | Zero | Si | No | No |
| Batch P1 — Style A residui | A | lint/style/useImportType, lint/style/useConst, lint/correctness/useParseIntRadix, lint/style/useNodejsImportProtocol, lint/complexity/useLiteralKeys, lint/style/useTemplate, lint/style/useExponentiationOperator, lint/complexity/*useless*, lint/suspicious/noUselessEscapeInString, lint/suspicious/noEmptyInterface | 1073 | multipli (vedi doc A_*) | Zero / trascurabile | Si | Spot-check | No |
| Batch P2 — Unused imports | A/B | lint/correctness/noUnusedImports | 328 | 231 | Basso (side-effect import) | Prevalente | Si | Raro |
| Batch P3 — useButtonType classificato | A/B | lint/a11y/useButtonType | 852 | 206 | Basso se classificato; medio se cieco | No | Si | Casi senza onClick |
| Batch P4 — A/B suspicious piccoli | A/B | noGlobalIsNan, noDoubleEquals, noPrototypeBuiltins, noSwitchDeclarations, noDescendingSpecificity | 31 | vedi AB_suspicious_and_switch_small.md | Basso | Parziale | Si | Pochi |
| Batch P5 — Unused vars/params + optional chain | B | noUnusedVariables, noUnusedFunctionParameters, useOptionalChain | 409 | vedi B_* | Medio | No | No | Si |
| Batch P6 — A11y strutturale | B | useKeyWithClickEvents, noStaticElementInteractions, labels, ARIA/media | 805 | vedi B_a11y_* | Medio (UX) | No | No | Si |
| Batch P7 — Suspicious B + array index keys | B | useIterableCallbackReturn, shadow, assign, noArrayIndexKey, ... | 144 | vedi B_suspicious_* + B_noArrayIndexKey | Medio | No | No | Si |
| Batch P8 — Type safety & React deps | C | noExplicitAny, useExhaustiveDependencies, noNonNullAssertion | 805 | vedi C_* | Alto | No | No | Si + typecheck |
| Batch P9 — Hooks / security / parse / ts-ignore | C | useHookAtTopLevel, noDangerouslySetInnerHtml, noTsIgnore, parse | 35 | 4 | Alto | No | No | Si |

Somma diagnostiche nei batch P0–P9 (solo A/A/B/B/C operativi): deve coprire **6232** (tutto tranne D).

### Regole operative roadmap

1. Ogni batch aggiorna la dashboard della Parte 1 (eliminate / residue / %).
2. Ogni batch aggiorna il documento di dettaglio delle categorie toccate.
3. Vietato introdurre suppressioni come scorciatoia.
4. Vietato “arrivare a zero” forzando fix rischiosi.
5. Dopo ogni attività codice: rigenerare snapshot Biome e riconciliare i conti.

---

## Documenti correlati

| Documento | Ruolo |
|-----------|--------|
| [`AI_BIOME_AUDIT.md`](./AI_BIOME_AUDIT.md) (questo file) | **SoT ufficiale** baseline globale + roadmap P0–P9 |
| [`AI_BIOME_AUDIT_35_FILES_HISTORY.md`](./AI_BIOME_AUDIT_35_FILES_HISTORY.md) | Storico audit parziale 35 file (Batch A/A2, residuo 132, roadmap Batch 1–10) |
| [`AI_QUALITY/README.md`](./AI_QUALITY/README.md) | Indice dettaglio per categoria Biome |
