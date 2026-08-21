# AI Biome Audit

Source of Truth **operativa** del debito tecnico Biome e della pianificazione della sua bonifica sull'**intero progetto** TouringDiary.

> Principio: l'obiettivo **non** è arrivare a zero warning.  
> Obiettivi: bloccare nuovo debito, ridurre il debito legacy con correzioni davvero sicure, evitare hack/suppressioni, zero regressioni.  
> Ogni audit / batch futuro **aggiorna questo file** (stato corrente).  
> Lo storico concluso vive in [`AI_BIOME_HISTORY.md`](./AI_BIOME_HISTORY.md) (principale) e [`AI_BIOME_HISTORY_LEGACY.md`](./AI_BIOME_HISTORY_LEGACY.md) (dettaglio) — **non** sono SoT operativa.

I dettagli per categoria vivono in [`AI_QUALITY/`](./AI_QUALITY/README.md) (possono restare indietro rispetto allo snapshot corrente; la SoT numerica e strategica è **questo file**).

### Come leggere questo documento

| Sezione | Contesto |
|---------|----------|
| **Avanzamento per livello** | Progresso L0–L4 + totale progetto |
| **Parte 1 — Snapshot corrente** | Dashboard, severity, livelli, categorie **aperte** |
| **Parte 2 — Livelli attivi** | Strategia L0–L4 + categorie ancora aperte (L2/L3/L4 + residuo L0) |
| **Parte 2bis — Stato operativo** | Ciclo di vita della categoria |
| **Parte 3 — Roadmap aperta** | Prossimi batch (B2a…) |
| **Parte 3bis — Workflow** | Ciclo obbligatorio di governance |
| **Parte 3ter — Registro rilevante** | Decisioni ancora operative (+ link archivio completo) |
| **Parte 3quater — Validazione** | Gate post-bonifica |
| **Parte 4 — Stato del piano** | Avanzamento qualitativo corrente |
| **Parte 5 — Regole permanenti** | Vincoli non negoziabili |

**Archivio storico principale:** [`AI_BIOME_HISTORY.md`](./AI_BIOME_HISTORY.md) · **Legacy (dettaglio):** [`AI_BIOME_HISTORY_LEGACY.md`](./AI_BIOME_HISTORY_LEGACY.md)  
**Storico audit parziale (35 file):** [`AI_BIOME_AUDIT_35_FILES_HISTORY.md`](./AI_BIOME_AUDIT_35_FILES_HISTORY.md) — contatori **339 / 207 / 132**; **non** sono la baseline globale.

---

# Avanzamento per livello

> Sezione **permanente**. Aggiornare **automaticamente dopo ogni batch** futuro (e dopo ogni snapshot di chiusura accettata).

### Regola permanente — colonna **Iniziali** (congelata)

La colonna **Iniziali** per livello è la **fotografia iniziale del progetto** per la bonifica per-livello. È **congelata definitivamente** e **non dovrà mai più cambiare**.

| Livello | Iniziali (congelati) |
|---------|---------------------:|
| **L0** | **2802** |
| **L1** | **1233** |
| **L2** | **1764** |
| **L3** | **350** |
| **L4** | **8** |
| **Somma Iniziali per livello** | **6157** |

- **Totale iniziale progetto (baseline storica)** = **6232** (2026-08-03) — riferimento di progetto; non si ricalcola.
- I **75** = 6232 − 6157 sono diagnostiche già uscite dal perimetro **prima** del congelamento della classificazione per livello; non riassegnano né alterano gli Iniziali L0–L4.
- Dopo ogni batch cambiano **solo**: **Risolte**, **Residue**, **% completata**, e lo **Stato** (Parte 4 / stati operativi). **Mai** gli Iniziali.

| Livello | Iniziali | Risolte | Residue | % completata |
|---------|---------:|--------:|--------:|-------------:|
| **L0** | 2802 | 2784 | 18 | **99,36%*** |
| **L1** | 1233 | 0 | 0 | **100%**** |
| **L2** | 1764 | 1046 | 718 | **59,30%** |
| **L3** | 350 | 35 | 315 | **10,00%** |
| **L4** | 8 | 0 | 27 | **N/D*** |

\* L4: la percentuale di completamento non è calcolata sul valore Iniziali congelato (8), perché il livello ha ricevuto diagnostiche riclassificate dopo il congelamento: +18 da L1 Gruppo C e +1 `noBannedTypes`, portando il perimetro operativo corrente a 27. Con Risolte=0 e Residue=27, una percentuale basata sugli Iniziali congelati non sarebbe semanticamente rappresentativa. Gli Iniziali restano comunque definitivamente congelati a 8.

> **Nota colonna «Risolte» (L1 e livelli chiusi per riclassificazione):** per un livello chiuso **tramite riclassificazione**, «Risolte» **non** indica necessariamente fix di codice eseguiti su quel livello. La chiusura indica la **conclusione della classificazione** del livello; le diagnostiche riclassificate sono contabilizzate nel **livello di destinazione** (e nel totale progetto risolto). Esempio: L1 Iniziali **1233** / Risolte **0** / Residue **0** / **100%** = livello svuotato per riclassificazione, **non** 1233 fix L1.

### Dettaglio per livello

| Livello | Diagnostiche iniziali (congelate) | Diagnostiche risolte | Diagnostiche residue | Percentuale completata | Note |
|---------|----------------------------------:|---------------------:|---------------------:|-----------------------:|------|
| **L0** | 2802 | 2784 | 18 | 99,36%* | **COMPLETATO** come batch certificato (chiuso). Residui live **documentati** (non = nuovo batch): `format`×**13** + `organizeImports`×**5** |
| **L1** | 1233 | 0 | 0 | 100%** | Classificazione **CHIUSA** per riclassificazione (1215→L0 eseguito, 18→L4) — **non** per eliminazione via fix L1. Archivio → History |
| **L2** | 1764 | 1046 | 718 | 59,30% | **Focus corrente** — **B2a COMPLETATO** (0 any); **B2b IN CORSO** (**249**); B2c da aprire (**469**) |
| **L3** | 350 | 35 | 315 | 10,00% | Non iniziato come batch B3 (Δ snapshot; `useHookAtTopLevel` a 0) |
| **L4** | 8 | 0 | 27 | N/D* | +18 da L1 Gruppo C + `noBannedTypes`; non iniziato |

### Riepilogo finale progetto

| Metrica | Valore |
|---------|--------|
| **Totale iniziale progetto (baseline)** | **6232** |
| **Totale risolto** | **5154** |
| **Totale residuo** | **1078** |
| **Percentuale complessiva completata** | **82,70%** |

Identità progetto: baseline − risolto = residuo → 6232 − 5154 = **1078**.  
Somma residue per livello: 18 + 0 + 718 + 315 + 27 = **1078**.

\* % L0 vs Iniziali congelati (2784/2802). Le **1215** ex-L1 sono nel totale progetto risolto (non negli Iniziali L0).  
\*\* % L1 = livello svuotato per **riclassificazione** (non per fix codice). Iniziali restano 1233 (congelati). «Risolte = 0» è **corretto** e **non** significa «nessun lavoro»: il lavoro è stato la riclassificazione.  
Somma Iniziali per livello (congelata): 2802 + 1233 + 1764 + 350 + 8 = **6157** (immutabile).

---

# Parte 1 — Snapshot corrente (full project)

> SoT numerica ufficiale del debito Biome sul repository.  
> **Ultimo snapshot numerico ufficiale riconciliato: 2026-08-16** · `npx biome check --reporter=json --max-diagnostics=100000 .` → totale **1078** (errors=**610**, warnings=**468**, infos=**0**); file con diagnostiche=**377**; categorie vive=**27**; `noExplicitAny`=**0**; B2b **249** (file B2b **110**).  
> **Snapshot precedente ufficiale (storico):** **2026-08-13** · progetto **1213** · B2b **389**. Δ reale tra snapshot: progetto **−135** · B2b **−140** (nessuna attribution manuale).  
> **Eventi già chiusi PO e assorbiti nel nuovo snapshot (non ricostruire a mano):** Tranche A completa (A1…A7 + attempt); C-P3a (3 labels).  
> Checkpoint **nominato** post-esecuzione low-risk (storico): **2026-08-09** · progetto **1316** · B2b **431**.  
> Baseline ufficiale: **2026-08-03** · **6232** (congelata).  
> Snapshot intermedi e cronologia chiusa → [`AI_BIOME_HISTORY.md`](./AI_BIOME_HISTORY.md).

## Dashboard bonifica

| Campo | Valore |
|----|----|
| **Diagnostiche iniziali del progetto (baseline)** | **6232** |
| **Diagnostiche eliminate (dal baseline)** | **5154** |
| **Diagnostiche residue** | **1078** |
| **Percentuale di riduzione complessiva** | **82,70%** |
| **Ultimo aggiornamento** | **2026-08-16** · **snapshot numerico ufficiale: 2026-08-16** (**1078** / B2b **249**) · precedente storico **2026-08-13** (**1213** / B2b **389**) |
| **Stato corrente della bonifica** | **L0 COMPLETATO** · L1 **CHIUSA** · **B2a COMPLETATO** (0 any) · **B2b IN CORSO** (residuo ufficiale **249**; Tranche A **CHIUSA**/ACCETTATA PO; C-P3a **ACCETTATO PO**) · B2c/B3/B4 **non aperti** |
| **Scope** | Intero perimetro Biome (`biome.json` / `npx biome check .`) |
| **File con almeno 1 diagnostica** | **377** |
| **Categorie Biome distinte (vive)** | **27** (`useHookAtTopLevel` a 0 — uscita dalla tabella vive; `noExplicitAny` già chiusa) |

### Contabilità per severity (snapshot corrente)

| Severity | Baseline (2026-08-03) | Attuale (1078) | Δ vs baseline |
|----|---:|---:|---:|
| **error** | 3795 | **610** | −3185 |
| **warning** | 2259 | **468** | −1791 |
| **info** | 178 | **0** | −178 |
| **Totale** | 6232 | **1078** | **−5154** |

Verifica aritmetica severity: 610 + 468 + 0 = **1078**.  
Δ vs snapshot precedente 2026-08-13 (**1213** / E745 / W468): **−135** (E **−135**, W **0**).  
Colonne intermedie (Pre-L0 / Pre ex-L1 / post-B2a 1660 / post-B2b-BASSO 1432 / post-low-risk-A 1316 / 2026-08-13 **1213**) → History.

### Contabilità per livello di intervento

> Classificazione per **strategia di bonifica**, non per gravità tecnica Biome.  
> Ogni categoria appartiene a **un solo** livello **alla volta** (stato corrente).

| Livello | Nome | Diagnostiche | Categorie | % sul totale | Natura strategica |
|----|----|---:|---:|---:|----|
| **L0** | Batch certificato | **18** | 2 residui (`format`×**13**, `organizeImports`×**5**) | 1,67% | **COMPLETATO** come batch certificato; residui live **documentati** (≠ nuovo batch autorizzato) |
| **L1** | Mini audit | **0** | 0 | 0% | **CHIUSA** |
| **L2** | Audit specialistico | **718** | 13 | 66,60% | **Focus corrente** — B2a **0**; B2b **249** IN CORSO; B2c **469** da aprire |
| **L3** | Revisione architetturale | **315** | 5 | 29,22% | Non in massa; `useHookAtTopLevel` a 0 (non è un batch B3) |
| **L4** | Casi singoli | **27** | 7 | 2,50% | +18 Gruppo C; + `noBannedTypes` |
| **Totale** | — | **1078** | 27 | 100% | Deve coincidere con residue |

Identità obbligata: L0 + L1 + L2 + L3 + L4 = **1078** (18+0+718+315+27).

### Indice documenti di dettaglio aperti (AI_QUALITY)

| Doc | Livello | Occ. correnti (SoT) | Note |
|----|----|---:|----|
| [`A_format.md`](./AI_QUALITY/biome/A_format.md) | L0 | scheda storica (**7** al momento della scheda) | **Non** allineata allo snapshot corrente. **SoT live `format` = 13** (Parte 1). Contatore scheda da riallineare in un passaggio successivo dedicato; **non** usare **7** come numerica corrente |
| [`C_noExplicitAny.md`](./AI_QUALITY/biome/C_noExplicitAny.md) | L2 | **446** | Baseline legacy (pre-esecuzione) |
| [`B2a_noExplicitAny_AUDIT.md`](./AI_QUALITY/biome/B2a_noExplicitAny_AUDIT.md) | L2 | **0** SoT | **B2a COMPLETATO** |
| [`B2a_R50_RESIDUAL_ANY_AUDIT.md`](./AI_QUALITY/biome/B2a_R50_RESIDUAL_ANY_AUDIT.md) | L2 | **0** live | **B2a COMPLETATO** (chiusura storica 1660) |
| [`B2a_BATCH_C_INDEX.md`](./AI_QUALITY/biome/B2a_BATCH_C_INDEX.md) | L2 | **143** classif. | Indice C1–C6; **Batch C completo** (C1–C6 ACCETTATI) |
| [`B2a_C3_START_PO_AUDIT.md`](./AI_QUALITY/biome/B2a_C3_START_PO_AUDIT.md) | L2 | **45** censiti / **0** residui context | **C3 ACCETTATO** — batch chiuso |
| [`B2a_C4_SERVICES_AUDIT.md`](./AI_QUALITY/biome/B2a_C4_SERVICES_AUDIT.md) | L2 | **15** live → **0** | **C4 ACCETTATO** — batch chiuso |
| [`B2a_C5_START_PO_AUDIT.md`](./AI_QUALITY/biome/B2a_C5_START_PO_AUDIT.md) | L2 | **8** live → **0** | **C5 ACCETTATO** — batch chiuso |
| [`B2a_C6_UTILS_AUDIT.md`](./AI_QUALITY/biome/B2a_C6_UTILS_AUDIT.md) | L2 | **15** live → **0** | **C6 ACCETTATO** — batch chiuso |
| [`B2a_C1_START_PO_AUDIT.md`](./AI_QUALITY/biome/B2a_C1_START_PO_AUDIT.md) | L2 | **71** → **0** | **C1 ACCETTATO** — Batch C completo |
| [`B2a_noExplicitAny_DELTA_RECONCILE.md`](./AI_QUALITY/biome/B2a_noExplicitAny_DELTA_RECONCILE.md) | L2 | −27 | Riconciliazione baseline 473→446 (conclusa) |
| [`B2b_A_TRANCHE_A_PATTERN_AUDIT.md`](./AI_QUALITY/biome/B2b_A_TRANCHE_A_PATTERN_AUDIT.md) | L2 | inventario A **123** | Pattern audit Tranche A — **non** dashboard live; **Tranche A CHIUSA**/ACCETTATA PO |
| [`B2b_389_RESIDUAL_PATTERN_AUDIT.md`](./AI_QUALITY/biome/B2b_389_RESIDUAL_PATTERN_AUDIT.md) | L2 | storico **389** | Audit pattern allo snapshot **2026-08-13** — **non** è il residuo live (**249**); classificazione storica |
| [`B_a11y_click_and_static_interactions.md`](./AI_QUALITY/biome/B_a11y_click_and_static_interactions.md) | L2 | scheda storica | Baseline sotto; live click+static = Parte 1 (**90**+**101**) |
| [`B_a11y_labels_and_forms.md`](./AI_QUALITY/biome/B_a11y_labels_and_forms.md) | L2/L4 | scheda storica | labels L2 live = Parte 1 (**39**); autofocus L4 |
| [`B_a11y_aria_semantic_media.md`](./AI_QUALITY/biome/B_a11y_aria_semantic_media.md) | L2/L4 | scheda storica | ARIA B2b live = Parte 1 (7+6+6) |
| [`B_noUnusedVariables.md`](./AI_QUALITY/biome/B_noUnusedVariables.md) | L2 | scheda storica | B2c — live Parte 1 |
| [`B_noUnusedFunctionParameters.md`](./AI_QUALITY/biome/B_noUnusedFunctionParameters.md) | L2 | scheda storica | B2c — live Parte 1 |
| [`B_useOptionalChain.md`](./AI_QUALITY/biome/B_useOptionalChain.md) | L2 | scheda storica | B2c — live Parte 1 |
| [`B_noArrayIndexKey.md`](./AI_QUALITY/biome/B_noArrayIndexKey.md) | L2 | scheda storica | B2c — live Parte 1 |
| [`B_suspicious_iterable_shadow_assign.md`](./AI_QUALITY/biome/B_suspicious_iterable_shadow_assign.md) | L2/L4 | — | B2c / L4 |
| [`C_useExhaustiveDependencies.md`](./AI_QUALITY/biome/C_useExhaustiveDependencies.md) | L3 | scheda storica | B3 — live Parte 1 |
| [`C_noNonNullAssertion.md`](./AI_QUALITY/biome/C_noNonNullAssertion.md) | L3 | scheda storica | B3 — live Parte 1 |
| [`C_hooks_security_parse_tsignore.md`](./AI_QUALITY/biome/C_hooks_security_parse_tsignore.md) | L3 | scheda storica | B3 — live Parte 1 (`useHookAtTopLevel` a 0) |
| [`D_policy_and_false_positives.md`](./AI_QUALITY/biome/D_policy_and_false_positives.md) | D | **18** FP intenzionali | `noStaticElementInteractions` drag/pointer/contentEditable — warning **attivi di proposito** (Biome 2.5.6) |

Indice completo (anche doc chiusi): [`AI_QUALITY/README.md`](./AI_QUALITY/README.md) · elenco storico in [`AI_BIOME_HISTORY.md`](./AI_BIOME_HISTORY.md).

---

## Contabilità per categoria Biome (categorie **aperte**)

> Solo categorie con occorrenze **> 0** (incl. residui L0 correnti).  
> Categorie a 0 → [`AI_BIOME_HISTORY.md`](./AI_BIOME_HISTORY.md) § Categorie chiuse.

| Categoria | Occ. | Err | Warn | Info | File | Livello | Stato op. | Δ vs baseline |
|----|---:|---:|---:|---:|---:|----|----|---:|
| `lint/correctness/useExhaustiveDependencies` | 187 | 187 | 0 | 0 | 99 | L3 | Non analizzata | −17 |
| `lint/correctness/noUnusedVariables` | 181 | 0 | 181 | 0 | 89 | L2 | Non analizzata (B2c) | −23 |
| `lint/style/noNonNullAssertion` | 108 | 0 | 108 | 0 | 29 | L3 | Non analizzata | −20 |
| `lint/correctness/noUnusedFunctionParameters` | 104 | 0 | 104 | 0 | 61 | L2 | Non analizzata (B2c) | −17 |
| `lint/a11y/noStaticElementInteractions` | 101 | 101 | 0 | 0 | 68 | L2 | B2b IN CORSO (snapshot **249**) | −140 |
| `lint/a11y/useKeyWithClickEvents` | 90 | 90 | 0 | 0 | 59 | L2 | B2b IN CORSO (snapshot **249**) | −173 |
| `lint/suspicious/noArrayIndexKey` | 69 | 69 | 0 | 0 | 53 | L2 | Non analizzata (B2c) | −13 |
| `lint/complexity/useOptionalChain` | 68 | 0 | 68 | 0 | 52 | L2 | Non analizzata (B2c) | −16 |
| `lint/a11y/noLabelWithoutControl` | 39 | 39 | 0 | 0 | 29 | L2 | B2b IN CORSO (snapshot **39**) | −201 |
| `lint/suspicious/useIterableCallbackReturn` | 26 | 26 | 0 | 0 | 16 | L2 | Non analizzata (B2c) | −7 |
| `lint/a11y/noAutofocus` | 17 | 17 | 0 | 0 | 14 | L4 | Non analizzata | 0 |
| `format` | 13 | 13 | 0 | 0 | 13 | L0 | Batch L0 **completato/chiuso**; residuo live **13** (≠ nuovo batch) | −951 |
| `lint/suspicious/noShadowRestrictedNames` | 13 | 13 | 0 | 0 | 13 | L2 | Non analizzata (B2c) | −2 |
| `lint/security/noDangerouslySetInnerHtml` | 9 | 9 | 0 | 0 | 9 | L3 | Non analizzata | −2 |
| `parse` | 9 | 9 | 0 | 0 | 1 | L3 | Non analizzata | 0 |
| `lint/suspicious/noImplicitAnyLet` | 8 | 8 | 0 | 0 | 6 | L2 | Non analizzata (B2c) | −1 |
| `lint/a11y/noNoninteractiveElementToInteractiveRole` | 7 | 7 | 0 | 0 | 7 | L2 | B2b IN CORSO (ARIA) | 0 |
| `lint/a11y/useAriaPropsSupportedByRole` | 6 | 6 | 0 | 0 | 5 | L2 | B2b IN CORSO (ARIA) | −7 |
| `lint/a11y/useSemanticElements` | 6 | 6 | 0 | 0 | 6 | L2 | B2b IN CORSO (ARIA) | −4 |
| `assist/source/organizeImports` | 5 | 5 | 0 | 0 | 5 | L0 | Residuo collaterale live (**5**); **non** batch L0 nuovo; **non** autofix | **+5** |
| `lint/suspicious/noTemplateCurlyInString` | 3 | 0 | 3 | 0 | 3 | L4 | Non analizzata | **+1** |
| `lint/suspicious/noAssignInExpressions` | 3 | 3 | 0 | 0 | 2 | L4 | Non analizzata | 0 |
| `lint/suspicious/noTsIgnore` | 2 | 0 | 2 | 0 | 1 | L3 | Non analizzata | 0 |
| `lint/style/noDescendingSpecificity` | 1 | 0 | 1 | 0 | 1 | L4 | Non analizzata | 0 |
| `lint/complexity/noBannedTypes` | 1 | 0 | 1 | 0 | 1 | L4 | Non analizzata | **+1 (nuova)** |
| `lint/a11y/useFocusableInteractive` | 1 | 1 | 0 | 0 | 1 | L4 | Non analizzata | 0 |
| `lint/a11y/useValidAnchor` | 1 | 1 | 0 | 0 | 1 | L4 | Non analizzata | 0 |

`lint/suspicious/noExplicitAny` = **0** (categoria chiusa; fuori tabella aperte).  
`lint/correctness/useHookAtTopLevel` = **0** (uscita dalle vive; **non** è un batch B3 accettato — drift di snapshot).  
Verifica somma categorie vive: **1078** = totale progetto live.  
Verifica B2b: 101+90+39+7+6+6 = **249**.  
Verifica B2c: 181+104+69+68+26+13+8 = **469**.  
Verifica L3: 187+108+9+9+2 = **315**.  
Verifica L4: 17+3+3+1+1+1+1 = **27**.  
Verifica L0: 13+5 = **18**.

### Confronto con baseline (sintesi)

| Metrica | Baseline | Attuale | Δ vs baseline |
|----|---:|---:|---:|
| Totale diagnostiche | 6232 | **1078** | **−5154** |
| Categorie vive | 51 | **27** | −24 chiuse (`noExplicitAny` + `useHookAtTopLevel` uscite) |
| File con diagnostiche | 1043 | **377** | −666 |

### Metodo di generazione snapshot

```text
npx biome check --reporter=json --max-diagnostics=100000 .
```

- Baseline: 2026-08-03 · 6232  
- Snapshot SoT corrente: **2026-08-16** · **1078** · errors=**610**, warnings=**468**, infos=0 · file=**377** · B2b **249** · `noExplicitAny`=**0**  
- Snapshot precedente ufficiale (storico): **2026-08-13** · **1213** · B2b **389**  
- Checkpoint nominato B2b (post-esecuzione low-risk; ACCETTO PO low-risk A **2026-08-15**): **2026-08-09** · **1316** / B2b **431** → History  
- Snapshot storici intermedi (es. post-RP-Settings **1671**/`11`, chiusura B2a **1660**/`0`, post-B2b-BASSO **1432**) → History — **non** sono lo stato operativo corrente  
- Classificazione primaria: **strategia di bonifica** (L0–L4)  
- In dubbio sul livello: scegliere il livello **più cauto** (numero più alto)

---

# Parte 2 — Livelli di intervento (stato corrente)

> L’obiettivo **non** è classificare i warning per gravità tecnica.  
> L’obiettivo è classificarli per **strategia di bonifica**.  
> Ogni categoria Biome appartiene a **un solo** livello **alla volta**.

Ordine di lavoro sul debito corrente: **L0 → L1 → L2 → L3 → L4**  
(L0 batch storici chiusi; residui L0 documentati: `format`×13 + `organizeImports`×5; L1 chiusa; **B2a COMPLETATO** — `noExplicitAny` **0**, R50/RP-* tutti ACCETTATI; focus L2 = **B2b IN CORSO** (residuo ufficiale snapshot **249**; Tranche A **CHIUSA**/ACCETTATA PO; C-P3a **ACCETTATO PO**); B2c/B3/B4 non aperti.)

## I livelli NON sono statici

I livelli L0–L4 rappresentano lo **stato corrente** della categoria (o sottocategoria), **non** una classificazione definitiva.

### Ruolo di L1

1. **L1 serve a classificare** una categoria che sembra batch ma non è ancora certificata.
2. Al termine del **mini audit** la categoria viene **riclassificata**.
3. Può diventare: **L0** / **L2** / **L3** / **L4** / **D**.

### Ruolo di L2

1. Un **audit specialistico** suddivide una categoria in sottocategorie omogenee.
2. Ogni sottocategoria viene **riassegnata** a L0 / L1 / L3 / L4 / D.
3. La categoria madre può risultare **chiusa** (spezzata); i conti seguono le sottocategorie vive.

### Implicazioni

- Una categoria oggi in L2 può diventare domani un insieme di batch L0 + residui L4.
- Ogni cambio di livello **deve** essere annotato nel **Registro** (Parte 3ter / History) e nello **stato operativo** (Parte 2bis).

---

## L0 — COMPLETATO (residuo attivo)

| Campo | Valore |
|----|----|
| **Stato livello** | **COMPLETATO** — il batch/meccanismo L0 certificato è **chiuso**; **non** implica 0 residui live |
| **Residue correnti** | **18** — `format`×**13** + `organizeImports`×**5** |
| **`format` live** | **13** (SoT Parte 1). Una parte bloccata da `parse` su `src/index.css`; il resto = drift di snapshot. **Non** autorizza automaticamente una nuova bonifica L0 né autofix |
| **`organizeImports` live** | **5** — residuo **collaterale** documentato; **non** costituisce un nuovo batch L0 autorizzato; **non** bonificare automaticamente solo perché compare in tabella; resta documentato fino a eventuale decisione/batch specifico |
| **Blocco** | `format` su `src/index.css` bloccato da `parse` (L3) — **non** formattabile meccanicamente senza abilitare Tailwind/CSS parser o refactor CSS |
| **Drift post-B** | Riconciliato (−75): `organizeImports`×19 + `useImportType`×7 + `format`×49 → 0 |
| **Dettaglio batch accettati** | [`AI_BIOME_HISTORY.md`](./AI_BIOME_HISTORY.md) (sintesi) · [`AI_BIOME_HISTORY_LEGACY.md`](./AI_BIOME_HISTORY_LEGACY.md) § L0 / L1 |

**Cosa significa «Batch completato» per L0 / `format`:** il batch L0 precedentemente certificato e accettato è **concluso**. Eventuali residui live (**13** `format`, **5** `organizeImports`) restano **documentati** e **non** equivalgono a un nuovo batch pronto, né ad autorizzazione di autofix. Ulteriori residui seguono la governance corrente (audit/decisione/batch esplicito).

**Cosa significa L0 in generale:** categoria **autorizzata** per bonifica massiva solo quando certificata (batch certificato). Non implica esecuzione immediata.  
Requisiti: modifica meccanica; nessun impatto funzionale; nessun rischio architetturale.

---

## L1 — CHIUSA

Debito residuo L1 = **0**. Classificazione operativa **conclusa per riclassificazione** (non per 1233 fix L1). Cataloghi e appendix file → [`AI_BIOME_HISTORY_LEGACY.md`](./AI_BIOME_HISTORY_LEGACY.md). Vedi nota «Risolte» in Avanzamento per livello.

---

## L2 — Audit specialistico (**attivo**)

Categorie che **non** si correggono direttamente: prima audit → sottocategorie → riclassificazione.

| Categorie | Occ. | % sul residuo progetto |
|----|---:|---:|
| **13** | **718** | **66,60%** |

| Categoria | Occ. | File | Nota |
|----|---:|---:|----|
| `lint/a11y/noStaticElementInteractions` | 101 | 68 | **B2b** IN CORSO |
| `lint/a11y/useKeyWithClickEvents` | 90 | 59 | **B2b** IN CORSO |
| `lint/correctness/noUnusedVariables` | 181 | 89 | B2c (da aprire) |
| `lint/correctness/noUnusedFunctionParameters` | 104 | 61 | B2c (da aprire) |
| `lint/suspicious/noArrayIndexKey` | 69 | 53 | B2c (da aprire) |
| `lint/complexity/useOptionalChain` | 68 | 52 | B2c (da aprire) |
| `lint/a11y/noLabelWithoutControl` | 39 | 29 | **B2b** IN CORSO |
| `lint/suspicious/useIterableCallbackReturn` | 26 | 16 | B2c (da aprire) |
| `lint/suspicious/noShadowRestrictedNames` | 13 | 13 | B2c (da aprire) |
| `lint/suspicious/noImplicitAnyLet` | 8 | 6 | B2c (da aprire) |
| `lint/a11y/noNoninteractiveElementToInteractiveRole` | 7 | 7 | **B2b** IN CORSO (ARIA) |
| `lint/a11y/useAriaPropsSupportedByRole` | 6 | 5 | **B2b** IN CORSO (ARIA) |
| `lint/a11y/useSemanticElements` | 6 | 6 | **B2b** IN CORSO (ARIA) |

`noExplicitAny` = **0** (B2a chiuso).  
Verifica B2b: 101+90+39+7+6+6 = **249**.  
Verifica B2c: 181+104+69+68+26+13+8 = **469**.  
Verifica L2: 249+469 = **718**.

---

## L3 — Revisione architetturale (**attivo**, non iniziato)

Non in massa. Richiedono decisioni progettuali / sicurezza / modello React.

| Categorie | Occ. | % |
|----|---:|---:|
| **5** | **315** | **29,22%** |

#### `lint/correctness/useExhaustiveDependencies` — 187 · 99 file

| Campo | Contenuto |
|----|----|
| **Rischio** | Stale closure, loop di effetti, render non deterministici |
| **Motivo revisione** | Aggiungere/rimuovere deps cambia il runtime |
| **Dipendenze** | Stabilizzazione callback/valori; typecheck + smoke UI |

#### `lint/style/noNonNullAssertion` — 108 · 29 file

| Campo | Contenuto |
|----|----|
| **Rischio** | Crash runtime se l’invariante è falsa |
| **Motivo revisione** | Narrowing reale o redesign null |
| **Dipendenze** | Tipi di dominio; coerenza con `strict` TS |

#### `lint/correctness/useHookAtTopLevel` — **0** (uscita dalle vive)

Categoria a 0 nello snapshot 2026-08-13. **Non** è un batch B3 accettato: drift di working tree / Quality Delta. Resta archiviata; non riaprire come residuo L3.

#### `lint/security/noDangerouslySetInnerHtml` — 9 · 9 file

| Campo | Contenuto |
|----|----|
| **Rischio** | XSS se contenuto non sanitizzato |
| **Motivo revisione** | Sanitizer, markdown pipeline, o rimozione HTML |
| **Dipendenze** | Provenienza contenuto; policy sicurezza |

#### `parse` — 9 · 1 file

| Campo | Contenuto |
|----|----|
| **Rischio** | Tooling cieco su porzioni di CSS |
| **Motivo revisione** | Limite parser Biome vs CSS da normalizzare |
| **Dipendenze** | `src/index.css`; **blocca il residuo L0 `format`×1** |

#### `lint/suspicious/noTsIgnore` — 2 · 1 file

| Campo | Contenuto |
|----|----|
| **Rischio** | Nasconde errori di tipo |
| **Motivo revisione** | Fix tipizzato o `@ts-expect-error` motivato (solo con decisione) |
| **Dipendenze** | `src/config/env.ts` |

---

## L4 — Casi singoli (**attivo**, non iniziato)

Hit-per-hit; affrontati **dopo** L2/L3 utili.

| Categorie | Occ. | % |
|----|---:|---:|
| **7** | **27** | **2,50%** |

| Categoria | Occ. | File | Nota |
|----|---:|---:|----|
| `lint/a11y/noAutofocus` | 17 | 14 | Ex L1 Gruppo C |
| `lint/suspicious/noAssignInExpressions` | 3 | 2 | Flusso assegnazione/condizione |
| `lint/suspicious/noTemplateCurlyInString` | 3 | 3 | `scripts/` |
| `lint/complexity/noBannedTypes` | 1 | 1 | `{}` type — hit singolo |
| `lint/style/noDescendingSpecificity` | 1 | 1 | Ex L1 Gruppo C |
| `lint/a11y/useFocusableInteractive` | 1 | 1 | Focusability |
| `lint/a11y/useValidAnchor` | 1 | 1 | `href` vs button |

**Regola L4:** i residui degli audit L1/L2 migrano qui con elenco esplicito.

---

# Parte 2bis — Stato operativo per categoria

Il livello dice *che strategia* applicare.  
Lo stato operativo dice *dove si trova* quella categoria nel ciclo di governance.

### Stati ammessi

| Stato | Significato |
|----|----|
| **Non analizzata** | Assegnata a un livello ma audit/revisione non avviati |
| **In audit** | Mini audit / audit specialistico / revisione in corso |
| **Classificata** | Audit concluso; livello/sottocategorie assegnati; bonifica non ancora autorizzata |
| **Batch pronto** | Certificata per esecuzione; **non** implica esecuzione immediata |
| **Batch completato** | Batch certificato **chiuso** (bonifica + validazione + accettazione OK). **Può** restare un residuo live documentato: **non** equivale a 0 hit e **non** apre da solo un nuovo batch |
| **Chiusa** | 0 occorrenze oppure chiusa come D / accettazione documentata |

### Regole di aggiornamento

1. Ogni audit **deve** aggiornare lo stato operativo delle categorie toccate.
2. Ogni passaggio rilevante va anche nel **Registro** (Parte 3ter + History).
3. L0 tipicamente: `Batch pronto` finché non eseguita.
4. Categoria a 0 hit → `Chiusa` (archiviare dettaglio in History se voluminoso).

### Sintesi stati (snapshot corrente)

Sulle **27 categorie vive** (`noExplicitAny` **Chiusa**; `useHookAtTopLevel` a 0 — fuori tabella):

| Stato op. | N. | Note |
|----|---:|----|
| Batch completato | 1 | `format` — batch L0 **chiuso**; residuo live **13** (parte bloccata da `parse` su `index.css`); **≠** nuovo batch |
| Batch pronto | 0 | — |
| Non analizzata | 19 | 7 B2c + 5 L3 + 7 L4 |
| Residuo collaterale L0 | 1 | `organizeImports`×**5** — documentato; **non** batch L0 nuovo; **non** autofix |
| In audit / IN CORSO | 6 | regole **B2b** a11y (click/static/labels/ARIA) — residuo live **249** |

> Sintesi stati: 1+0+19+1+6 = **27** categorie vive.

Fuori dal totale 27: categorie `Chiusa` (incluso `noExplicitAny` / B2a; `useHookAtTopLevel` a 0) → History.

---

# Parte 3 — Roadmap operativa

> I batch sotto **non** sono i Batch 1–10 dello storico 35 file ([`AI_BIOME_AUDIT_35_FILES_HISTORY.md`](./AI_BIOME_AUDIT_35_FILES_HISTORY.md)).  
> Dettaglio batch **COMPLETATI** (B0/B1) → [`AI_BIOME_HISTORY.md`](./AI_BIOME_HISTORY.md) (sintesi) · [`AI_BIOME_HISTORY_LEGACY.md`](./AI_BIOME_HISTORY_LEGACY.md) (integrale).

### Batch aperti / prossimi

| Batch | Livello | Contenuto | Diagn. | Modo | Stato |
|----|----|----|---:|----|----|
| **B2a** | L2 | `noExplicitAny` — A/B/C + R50 | **0** SoT | **COMPLETATO** | A+B+C + R1 + RP-* + **RP-Residual ACCETTATI**; ultimo hit Roadbook tipizzato; categoria **0** |
| **B2b** | L2 | a11y click/static/labels/ARIA | **249** (snapshot ufficiale 2026-08-16) | IN CORSO | Tranche A **CHIUSA**/ACCETTATA PO; C-P3a **ACCETTATO PO**; B2c **non aperto** |
| **B2c** | L2 | Unused vars/params + optional chain + array keys + suspicious | **469** | Audit → sotto-batch | **non aperto** (dopo stabilizzazione B2b) |
| **B3** | L3 | deps, `!`, HTML, parse, ts-ignore | **315** | Decisioni + fix mirati | non iniziato (`useHookAtTopLevel` a 0, non è un batch B3) |
| **B4** | L4 | Casi singoli + residui (+18 Gruppo C) | **27+** | Manuale finale | non iniziato |

### Batch conclusi (sintesi)

| Batch | Stato | Archivio |
|----|----|----|
| **B0a / B0b** | **COMPLETATO** | History § L0 |
| **B1a / B1b / B1c** | **COMPLETATO** (ACCETTO PO) | History § L1 / B1 |
| **B2a — Batch A** | **COMPLETATO** (ACCETTO PO) | −123 `noExplicitAny`; +7 collaterali `noGlobalIsNan` accettate (non riproposte) |
| **B2a — Batch B** | **COMPLETATO** (ACCETTO PO) | B-1…B-4 + Quality Delta; review architetturale OK; nessun nuovo debito |
| **B2a — Batch C2** | **COMPLETATO** (ACCETTO PO) | Parsers City (−7 `noExplicitAny`); Quality Delta OK; smoke OK; nessun nuovo debito |
| **B2a — Batch C3** | **COMPLETATO** (ACCETTO PO) | Domain Types + ModalContext tipizzato (`ModalPropsBag`); 0 `any` residui nei 3 context; Quality Delta OK; nessun nuovo debito |
| **B2a — Batch C4** | **COMPLETATO** (ACCETTO PO) | Services non-AI (−15 `noExplicitAny` live / 7 file → 0); riuso `GeoIdNameOption`/`ContactInfo`/`Json`; Quality Delta OK; nessun nuovo debito |
| **B2a — Batch C5** | **COMPLETATO** (ACCETTO PO) | Community (−8 `noExplicitAny` live / 2 file → 0); leftover B co-locati in `suggestionService`; Quality Delta OK |
| **B2a — Batch C6** | **COMPLETATO** (ACCETTO PO) | Utils/Undo/Rankings (−15 `noExplicitAny` live / 5 file → 0); QD FullRankingsModal/ImportStatsBar; residual B packing escluso |
| **B2a — Batch C1** | **COMPLETATO** (ACCETTO PO) | AI/Gemini (−71 `noExplicitAny` live / 19 file → 0); facade `useCityGenerator`; boundary-first; typecheck/build OK; Batch C completo |
| **B2a — R50 R1** | **COMPLETATO** (ACCETTO PO) | Service Regeneration (−10 `noExplicitAny` / 1 file → 0); riuso tipi C1; cast `SaveCity*` mantenuti |
| **B2a — R50 RP-Photo** | **COMPLETATO** (ACCETTO PO) | Photo pipeline (−6 `noExplicitAny` / 4 file → 0); riuso `DbPhotoSubmission` / `HistoryState`; QD PHOTO_FILTERS |
| **B2a — R50 RP-Pricing** | **COMPLETATO** (ACCETTO PO) | Pricing (−6 `noExplicitAny` / 2 file → 0); `PricingAiLimits` + `PricingManagerVersion`; QD `PLAN_TYPES` |
| **B2a — R50 RP-Mech** | **COMPLETATO** (ACCETTO PO) | Mech (−7 `noExplicitAny` / 7 file → 0); SmartFilterDrawer, Sidebar, useImportData, LoadingTipsManager, CityServicesTab, interactionService, useUserDashboardData |
| **B2a — R50 RP-Settings** | **COMPLETATO** (ACCETTO PO) | Settings (−10 `noExplicitAny` / 6 file → 0); content.routes, GlobalSettingsPanel, settingsService, SocialPreviewConfig, CampaignsPanel, useSocialTemplates; QD type guards GlobalSettingsPanel |
| **B2a — R50 RP-Residual** | **COMPLETATO** (ACCETTO PO) | Residual (−10 `noExplicitAny` / 8 file → 0); EventsAI+Undo+Core+cityCache/poiRead; Media `discovery`; QD Events/Suggestion; ultimo hit Roadbook tipizzato (`RoadbookSummary`) → **B2a = 0** |

Somma L0–L4 operative: **1078**.  
Verifica B2 (L2 a11y+unused+any): 0 + **249** + **469** = **718** (L2 live).

### Regole operative roadmap

1. Ogni batch aggiorna la dashboard Parte 1 e **Avanzamento per livello**.
2. Ogni batch aggiorna Parte 4.
3. Ogni audit aggiorna Parte 2, 2bis, 3ter (e archivia in History il dettaglio concluso).
4. Vietato introdurre suppressioni come scorciatoia.
5. Vietato “arrivare a zero” forzando fix rischiosi.
6. Dopo ogni attività codice: nuovo snapshot Biome e riconciliazione **in questo file**.
7. Seguire sempre Parte 3bis + 3quater.

### Prossimo step

1. **Batch C (C1–C6) chiuso** — non riaprire salvo regressione dimostrata.  
2. **B2a `noExplicitAny` COMPLETATO** — residuo live **0**.  
3. **B2b IN CORSO** — residuo ufficiale snapshot **249** (2026-08-16). Precedente storico **389** (2026-08-13). Tranche A **CHIUSA**/ACCETTATA PO; C-P3a **ACCETTATO PO**.  
4. **Prossima attività L2:** bonifiche **solo** su macro-pattern **LOW / LOW_COND** emersi dall’audit `noStaticElementInteractions` (101) — **non** aprire B2c; **non** batch meccanici su card/ARCH.  
5. Audit pattern storico **389** (2026-08-13): [`B2b_389_RESIDUAL_PATTERN_AUDIT.md`](./AI_QUALITY/biome/B2b_389_RESIDUAL_PATTERN_AUDIT.md) — **non** è il residuo live.  
6. **B2c** — **non aperto**.  
7. Indice C (archivio): [`B2a_BATCH_C_INDEX.md`](./AI_QUALITY/biome/B2a_BATCH_C_INDEX.md).  
8. Mappa Tranche A: [`B2b_A_TRANCHE_A_PATTERN_AUDIT.md`](./AI_QUALITY/biome/B2b_A_TRANCHE_A_PATTERN_AUDIT.md) — **CHIUSA**.

---

# Parte 3bis — Workflow della bonifica

Questo workflow è **obbligatorio**.

- non si bonifica senza batch certificato;
- **dopo ogni modifica al codice** è obbligatoria la **validazione post-bonifica** (Parte 3quater);
- non si accetta il batch e non si aggiorna la SoT finché check, typecheck, build e smoke non sono **positivi** (salvo eccezione PO registrata);
- non si considera conclusa una bonifica senza accettazione e aggiornamento SoT;
- il dettaglio dei batch già accettati si **archivia** in [`AI_BIOME_HISTORY.md`](./AI_BIOME_HISTORY.md) (sintesi/decisioni) e, se voluminoso, in [`AI_BIOME_HISTORY_LEGACY.md`](./AI_BIOME_HISTORY_LEGACY.md), senza rimuovere le decisioni dal Registro completo.

```text
Nuovo snapshot Biome
        ↓
Classificazione
        ↓
Assegnazione livello (L0–L4 o D)
        ↓
Audit (se necessario: mini L1 / specialistico L2 / architetturale L3)
        ↓
Riclassificazione
        ↓
Batch certificato (stato → Batch pronto)
        ↓
Bonifica (modifica codice)
        ↓
VALIDAZIONE POST-BONIFICA (Parte 3quater)
  1. npm run check
  2. npm run typecheck
  3. build
  4. smoke test funzionali (checklist UI PO)
        ↓
Accettazione del batch
        ↓
Nuovo snapshot Biome
        ↓
Aggiornamento SoT viva (questo file)
        ↓
Archiviazione del dettaglio concluso in AI_BIOME_HISTORY.md (+ Legacy se voluminoso)
```

### Note sul ciclo

| Passo | Cosa fare | Dove si aggiorna |
|----|----|----|
| Snapshot | `npx biome check --reporter=json --max-diagnostics=100000 .` | Parte 1 + Avanzamento |
| Classificazione / livello | Assegnare o confermare strategia | Parte 2 |
| Audit | Mini / specialistico / architetturale | Parte 2 + stato `In audit` |
| Riclassificazione | Nuovo livello o sottocategorie | Parte 2 + Registro |
| Batch certificato | Autorizzare massa (L0) | Stato op. `Batch pronto` |
| Bonifica | Solo su batch certificati | Codice applicativo |
| Validazione | check → typecheck → build → smoke PO | Parte 3quater |
| Accettazione | Dopo validazione positiva (o eccezione PO) | Registro + stato operativo |
| SoT + History (+ Legacy) | Conti vivi qui; cronologia in History; dettaglio congelato in Legacy | Questo file + `AI_BIOME_HISTORY.md` + `AI_BIOME_HISTORY_LEGACY.md` |

---

# Parte 3ter — Registro delle decisioni (rilevante)

Ogni decisione di audit, riclassificazione, sottocategoria, promozione, D o chiusura formale **deve** essere registrata.

**Archivio completo (tutte le righe storiche):** [`AI_BIOME_HISTORY.md`](./AI_BIOME_HISTORY.md) § Registro.

Campi: Data · Categoria · Decisione · Motivazione · Livello finale · Sottocategorie.

### Decisioni ancora rilevanti operativamente

| Data | Categoria | Decisione | Motivazione | Livello finale | Sottocategorie |
|----|----|----|----|----|----|
| 2026-08-06 | L0 drift post-B | **Riconciliazione meccanica −75** | `organizeImports`×19 + `useImportType`×7 + `format`×49 autofix Biome. Escluso: `format`×1 su `src/index.css` (bloccato da `parse` L3 — non meccanico). Residue progetto **1892**. | L0 Batch completato | — |
| 2026-08-06 | **Audit architetturali** | **Regola permanente §21** | Ogni audit architetturale: sezione A UI/dominio (obbligatoria e autosufficiente) + sezione B codice. Utente non-developer. | — | Batch C |
| 2026-08-06 | **Audit architetturali** | **§21.1 + §22** | Percorsi UI = script QA reali; mini-batch solo con motivazione architetturale/di dominio/di rischio dimostrabile. | — | Batch C |
| 2026-08-04 | **Avanzamento per livello** | Iniziali L0–L4 **congelati** | L0=2802, L1=1233, L2=1764, L3=350, L4=8. Baseline 6232. Cambiano solo Risolte/Residue/%/Stato | — | — |
| 2026-08-04 | `noAutofocus`, `noDescendingSpecificity` | **→ L4** | Gruppo C fuori massa (18) | L4 | — |
| 2026-08-04 | `lint/complexity/noBannedTypes` | Assegnata a L4 | Hit singolo `{}` type | L4 | — |
| 2026-08-04 | **Batch L0 + B1a/B1b/B1c** | **ACCETTO PO** | Eccezione PO: `check`/`typecheck` ROSSI per **3** errori TS preesistenti. Residue **2134** | L0 Chiusa / Completato | — |
| 2026-08-04 | **Prossimo batch** | **B2a** focus | Audit classificazione chiusa; esecuzione tranche in attesa PO | L2 | B2a-T1…T8 |
| 2026-08-04 | **Split documentale** | SoT viva / History | `AI_BIOME_AUDIT.md` = operativa; `AI_BIOME_HISTORY.md` = archivio concluso; zero perdita info | — | — |
| 2026-08-06 | **Split History / Legacy** | Archivio consultabile / dettaglio | `AI_BIOME_HISTORY.md` = principale; `AI_BIOME_HISTORY_LEGACY.md` = L0/L1 + appendici + pre-split L2–L4 | — | — |
| 2026-08-04 | `noExplicitAny` | **Audit B2a classificazione CHIUSA** | 446 hit classificate: A=123, B=180, C=143, D=0. Inventario storico in `B2a_noExplicitAny_INVENTORY_446.md`; audit operativo in `B2a_noExplicitAny_AUDIT.md`. Nessun fix codice. | L2 Classificata | B2a-T1…T8 |
| 2026-08-05 | `noExplicitAny` | **B2a Batch A ACCETTATO** | −123 hit (catch/`unknown`, eventi, helper, timer). Residue SoT `noExplicitAny` **323**. Piano esecuzione: macro-batch A/B/C (B→B-1…B-4), non più T1–T8. | L2 In corso | A chiuso |
| 2026-08-05 | `noGlobalIsNan` | **7 bonifiche collaterali ACCETTATE** | Durante Batch A: `isNaN`→`Number.isNaN` in 7 file già fuori perimetro A. **Non riproposte** in B/C (categoria già Chiusa in B1c). File: `ensureNumber.ts`, `NumberInput.tsx`, `LoadingTipsManager.tsx`, `ServiceEvents.tsx`, `ServiceGuides.tsx`, `usePeopleData.ts`, `CitiesListTab.tsx` | L0 Chiusa | — |
| 2026-08-05 | `noExplicitAny` | **B2a Batch B — in review finale PO** | Codice B (B-1…B-4) + Quality Delta applicati; stato superseduto dall’ACCETTO del 2026-08-06 | L2 In corso | B (chiuso il 2026-08-06) |
| 2026-08-06 | `noExplicitAny` | **B2a Batch B ACCETTATO — batch chiuso** | ACCETTO PO; review architetturale completata; nessuna regressione; nessun nuovo debito tecnico; Quality Delta applicati. SoT: `noExplicitAny` **209**; progetto **1967**. Prossimo: audit Batch C (no fix codice). | L2 In corso | A+B chiusi |
| 2026-08-06 | `noExplicitAny` | **B2a Batch C2 ACCETTATO — batch chiuso** | ACCETTO PO; parsers City; Quality Delta + smoke OK; nessun nuovo debito. SoT: `noExplicitAny` **202**; progetto **1885**. Prossimo: audit PO **C3** (unico batch proposto; nessun fix finché ACCETTO). | L2 In corso | A+B+C2 chiusi |
| 2026-08-06 | `noExplicitAny` | **B2a Batch C3 — bonifica parziale (doc riallineata)** | Perimetro unico batch accettato; codice avanzato (−35 `noExplicitAny` sul gruppo C3). Residui **8** in `ModalContext`/`ConfigContext`/`CityEditorContext` (tipizzazione richiede consumer fuori inventario C3). SoT: `noExplicitAny` **167**; progetto **1851**. C3 **non chiuso**. | L2 In corso | C3 parziale |
| 2026-08-06 | `noExplicitAny` | **B2a Batch C3 ACCETTATO — batch chiuso** | Context Modal/Config/CityEditor tipizzati (0 `any` residui C3); `ModalPropsBag`; consumer allineati; Quality Delta OK; typecheck = soli 3 save-hook baseline; build OK. SoT: `noExplicitAny` **159**; progetto **1840**. Prossimo: audit PO **C4**. | L2 In corso | A+B+C2+C3 chiusi |
| 2026-08-07 | `noExplicitAny` | **B2a Batch C4 ACCETTATO — batch chiuso** | ACCETTO PO formale; Services tipizzati (−15 any / 7 file → 0); `GeoIdNameOption`, `ContactInfo`, `Json`; ImportStatsBar escluso (C6); C1 non toccato; Quality Delta OK; typecheck = soli 3 save-hook baseline. SoT: `noExplicitAny` **144**; progetto **1825**. Prossimo: audit PO **C5**. | L2 In corso | A+B+C2+C3+C4 chiusi |
| 2026-08-07 | `noExplicitAny` | **B2a Batch C5 ACCETTATO — batch chiuso** | Community (−8 any / 2 file → 0); leftover B co-locati in `suggestionService`; `interactionService` escluso. SoT sync con C6. | L2 In corso | A+B+C2–C5 chiusi |
| 2026-08-07 | `noExplicitAny` | **B2a Batch C6 ACCETTATO — batch chiuso** | Utils/Undo/Rankings (−15 any / 5 file → 0); QD FullRankingsModal + ImportStatsBar; `useFloatingPanelOptimisticUpdates` escluso (residuo B). SoT: `noExplicitAny` **121**; progetto **1799**. Prossimo: audit PO **C1**. | L2 In corso | A+B+C2–C6 chiusi |
| 2026-08-07 | `noExplicitAny` | **B2a Batch C1 — audit PO avvio** | Perimetro live **71**/19 (67 AI + 4 facade `useCityGenerator`). Piano boundary-first. Nessun fix codice. | L2 In audit | C1 audit |
| 2026-08-07 | `noExplicitAny` | **B2a Batch C1 — bonifica completata** | −71 any / 19 file → 0; boundary-first; typecheck/build OK; QD1–3 non necessari. SoT: `noExplicitAny` **50**; progetto **1714**. Attende ACCETTO chiusura. | L2 In corso | C1 bonifica OK |
| 2026-08-07 | `noExplicitAny` | **B2a Batch C1 ACCETTATO — Batch C completo** | ACCETTO PO formale; C1–C6 chiusi; perimetro AI **71→0**; SoT: `noExplicitAny` **50**; progetto **1714**. Prossimo: residui B / altri L2. | L2 In corso | A+B+C chiusi |
| 2026-08-07 | `noExplicitAny` | **B2a R50 — audit residui** | Inventario live **50**/28; mini-batch R1–R10. Doc: `B2a_R50_RESIDUAL_ANY_AUDIT.md`. | L2 In audit | R50 piano |
| 2026-08-07 | `noExplicitAny` | **B2a R50 R1 ACCETTATO — mini-batch chiuso** | ACCETTO PO; `useServiceRegeneration` **10→0**; Quality Delta: `Object.assign` e cast `SaveCity*` lasciati. SoT: `noExplicitAny` **40**; progetto **1704**. Prossimo: ACCETTO **R4**. | L2 In corso | A+B+C+R1 |
| 2026-08-07 | `noExplicitAny` | **B2a R50 — revisione piano operativo ACCETTATA** | Piano da ex R2–R10 → **8** batch **RP-*** (Settings=R5+R3; Mech=R7+3; CityRoad=cache+poi+Roadbook). Inventario/classificazioni invariati. Prossimo: ACCETTO **RP-Photo**. | L2 In corso | R50 RP-* |
| 2026-08-07 | `noExplicitAny` | **B2a R50 RP-Photo — bonifica completata** | −6 any / 4 file → 0; `DbPhotoSubmission`, `HistoryState['blurPoints']`, union filter tipizzate. SoT: `noExplicitAny` **34**; progetto **1698**. Attende ACCETTO chiusura. | L2 In corso | R1+RP-Photo |
| 2026-08-07 | `noExplicitAny` | **B2a R50 RP-Photo ACCETTATO — mini-batch chiuso** | ACCETTO PO; review/smoke/QG OK; nessuna regressione. SoT: `noExplicitAny` **34**; progetto **1698**. Prossimo: **RP-Pricing**. | L2 In corso | R1+RP-Photo chiusi |
| 2026-08-07 | `noExplicitAny` | **B2a R50 RP-Pricing — bonifica completata** | −6 any / 2 file → 0; `PricingAiLimits`; `PricingManagerVersion`. SoT: `noExplicitAny` **28**; progetto **1692**. Attende ACCETTO chiusura. | L2 In corso | RP-Pricing bonifica |
| 2026-08-07 | `noExplicitAny` | **B2a R50 RP-Pricing ACCETTATO — mini-batch chiuso** | ACCETTO PO; review/smoke/QG OK; QD `PLAN_TYPES`; ciclo validazione concluso. SoT: `noExplicitAny` **28**; progetto **1692**. Prossimo: **audit residuo R50**. | L2 In corso | R1+RP-Photo+RP-Pricing chiusi |
| 2026-08-07 | `noExplicitAny` | **B2a R50 — audit residuo → RP-Mech** | Audit residuo su **28** any: prossimo mini-batch = **RP-Mech** (7 hit / 7 file; rischio basso). Nessun fix in audit. | L2 In audit | R50 residuo |
| 2026-08-07 | `noExplicitAny` | **B2a R50 RP-Mech — bonifica completata** | −7 any / 7 file → 0; SmartFilterDrawer, Sidebar, useImportData, LoadingTipsManager, CityServicesTab, interactionService, useUserDashboardData. Live: `noExplicitAny` **21**; progetto **1682**. Attende ACCETTO chiusura. | L2 In corso | RP-Mech bonifica |
| 2026-08-07 | `noExplicitAny` | **B2a R50 RP-Mech ACCETTATO — mini-batch chiuso** | ACCETTO PO; review/smoke/QG OK; ciclo validazione concluso. SoT live: `noExplicitAny` **21**; progetto **1682** (errors=1157, warnings=525). Prossimo: **bonifica RP-Settings**. | L2 In corso | R1+RP-Photo+RP-Pricing+RP-Mech chiusi |
| 2026-08-07 | `noExplicitAny` | **B2a R50 RP-Settings — bonifica completata** | −10 any / 6 file → 0; content.routes, GlobalSettingsPanel, settingsService, SocialPreviewConfig, CampaignsPanel, useSocialTemplates. Live: `noExplicitAny` **11**; progetto **1671**. Attende ACCETTO PO chiusura. | L2 In corso | RP-Settings bonifica |
| 2026-08-07 | `noExplicitAny` | **B2a R50 RP-Settings ACCETTATO — mini-batch chiuso** | ACCETTO PO; review/smoke/QG OK; QD type guards `GlobalSettingsPanel`; ciclo validazione concluso. SoT live: `noExplicitAny` **11**; progetto **1671** (errors=1157, warnings=514). Prossimo: **audit PO perimetro RP-EventsAI**. | L2 In corso | R1+RP-Photo+RP-Pricing+RP-Mech+RP-Settings chiusi |
| 2026-08-07 | `noExplicitAny` | **B2a R50 — fusione piano RP-Residual** | Direzione PO: aperti EventsAI+Undo+Core+CityRoad fusi in **RP-Residual**. Bonifica scope **10**/8; live resta **11**/9. `RoadbookDocument.tsx` (L259) **escluso** — bug funzionale preesistente (summaryData vs citiesInfo → NaN/zero budget PDF); deferred audit Roadbook/PDF post tipaggio residuale. Stato al momento della fusione: **In audit PO**. Contatori allora **11**/1671. **Superseduta** dalla riga successiva (ACCETTO RP-Residual). | L2 In audit (storico) | RP-Residual |
| 2026-08-07 | `noExplicitAny` | **B2a R50 RP-Residual ACCETTATO — B2a COMPLETATO** | ACCETTO PO + bonifica **10→0** / 8 file; QD Events/Suggestion; ultimo hit Roadbook tipizzato (`RoadbookSummary`). Live storica chiusura B2a: `noExplicitAny` **0** / progetto **1660** (E1157/W503). Fix funzionale summary Roadbook **fuori** roadmap Biome. | L2 — B2a **Chiusa** | B2a = 0 |
| 2026-08-08 | a11y B2b | **B2b tranche BASSO + audit residuo** | Progetto live **1660→1432** (Δ **−228**); B2b **769→547** (Δ **−222**); `noExplicitAny` **0**. Residuo B2b auditato; prossimo sottoperimetro **modali/overlay/drawer**. B2c non aperto. | L2 In corso | B2b IN CORSO |
| 2026-08-09 | a11y B2b | **A1 ACCETTATO PO + tranche low-risk A eseguita** | A1 shell ACCETTATO; panel stopPropagation resta debito fuori A1 (2 hit). Low-risk A2/A3/A4/A5-auth/A6/A7-* (no attempt) applicati per contratti congelati — **attende ACCETTO PO**. Live **1432→1316** (Δ **−116**); B2b **547→431**; `noExplicitAny` **0**; E816/W500. Esclusi: A5-attempt, A7-attempt. | L2 In corso | B2b IN CORSO |
| 2026-08-13 | a11y B2b / SoT | **Riconciliazione snapshot live — non ACCETTO PO** | SoT allineata al repo: progetto **1213**; B2b **389**; E745/W468; file **414**; 27 cat. Δ **−103** vs checkpoint nominato 1316 = drift working tree / Quality Delta, **non** attribuito a un batch B2b nominato e **non** chiude la review PO della tranche low-risk A. `useHookAtTopLevel` a 0 (non batch B3). `format` 3→7. | L2 In corso | B2b IN CORSO |
| 2026-08-13 | a11y B2b | **Audit pattern 389 + fix overlay Delete Confirmation Admin** | Audit **solo classificazione** del residuo B2b 389: [`B2b_389_RESIDUAL_PATTERN_AUDIT.md`](./AI_QUALITY/biome/B2b_389_RESIDUAL_PATTERN_AUDIT.md). **Nessuna bonifica** dei 389. Overlay Manager POI-DB: chrome admin da `z-dropdown` (popover 14500) a `z-global-chrome` / local sticky/overlay; `--header-height: 0` in Admin view-mode. B2c non aperto. | L2 In corso | B2b IN CORSO |
| 2026-08-15 | a11y B2b | **B2b low-risk A ACCETTATA PO** | ACCETTO PO formale su A2–A7* (esclusi attempt; **114** hit già in codice). Nessuna ripresa codice. Snapshot SoT resta **1213** / B2b **389** (2026-08-13). B2c non aperto. | L2 In corso | B2b — low-risk A chiusa |
| 2026-08-15 | a11y B2b | **A5/A7-attempt ESEGUITI — attende ACCETTO PO** | Bonifica in codice target **4→0** (`AdminPoiModal` / `ReviewModal`). Comportamenti PO congelati preservati. **Non** ACCETTATO PO sui file definitivi. Numeri SoT **non** riconciliati (restano **1213** / **389**). B2c non aperto. | L2 In corso | B2b attempt |
| 2026-08-16 | a11y B2b | **C-P3a ESEGUITO + ACCETTO PO (non in snapshot)** | Micro-batch: **3** `noLabelWithoutControl` → **0** (Autore/Descrizione `AdminItineraryEditor`; Preferred Partners `GlobalSuggestionsTab`). Solo htmlFor/id. Contatori ufficiali restano **1213** / B2b **389** fino a nuovo snapshot. B2c non aperto. | L2 In corso | B2b C-P3a |
| 2026-08-16 | a11y B2b / SoT | **Promozione snapshot Biome ufficiale** | Nuovo snapshot reale: progetto **1078** (E610/W468); file **377**; cat. **27**; B2b **249** (101+90+39+7+6+6); B2c **469**; L0 **18**; L3 **315**. Precedente storico **1213** / B2b **389** (2026-08-13). Δ snapshot: progetto **−135**, B2b **−140** (nessuna attribution manuale). Tranche A chiusa PO; C-P3a assorbito. B2c non aperto. | L2 In corso | B2b **249** |

> Le **decisioni** successive si aggiungono come nuove righe qui; a chiusura di un ciclo voluminoso si archivia il dettaglio in History **senza cancellare** le righe dal Registro completo in History.

---

# Parte 3quater — Validazione post-bonifica (obbligatoria)

> Gate permanente.  
> **Vietato** considerare conclusa una bonifica finché la sequenza non è positiva — **salvo eccezione PO** registrata.

## Sequenza obbligatoria (ordine fisso)

| # | Passo | Comando / azione | Esito richiesto |
|---:|----|----|----|
| 1 | Gate qualità | `npm run check` | Positivo |
| 2 | Gate tipi | `npm run typecheck` | Positivo |
| 3 | Build | `npm run build` | Positiva |
| 4 | Smoke test funzionali | Checklist UI PO | Positivi / accettati |
| 5 | Accettazione del batch | Conferma PO | Solo dopo 1–4 (o eccezione) |
| 6 | Aggiornamento SoT | Snapshot + questo file (+ archivio History se concluso) | Solo dopo accettazione |

Esito validazione batch L0 già chiuso → [`AI_BIOME_HISTORY.md`](./AI_BIOME_HISTORY.md) § Esito validazione.

## Divieto di chiusura anticipata

Una bonifica **non è conclusa** finché check, typecheck, build e smoke non sono positivi (salvo eccezione PO). Solo dopo accettazione si aggiorna la SoT.

## Checklist smoke per il Product Owner (obbligo AI)

Al termine di **ogni** bonifica che ha toccato codice, l’AI **deve** produrre una checklist navigabile per il PO.

### Requisiti

- Solo **azioni UI** (niente dettagli di patch/file/regole).
- **Dinamica** sulle aree toccate dal batch.
- Ampiezza proporzionale al rischio (meccanico → breve; UI/hook → estesa).

### Campi obbligatori per ogni test

| Campo | Contenuto |
|----|----|
| **Nome del test** | Titolo breve |
| **Obiettivo** | Cosa confermare in linguaggio prodotto |
| **Percorso UI** | Click dopo click |
| **Risultato atteso** | Cosa il PO deve vedere |
| **Motivo** | Collegamento alle aree toccate |
| **Aree correlate** | Flussi vicini da controllare |

### Modello

```text
### Test: <Nome del test>

- Obiettivo: …
- Percorso UI:
  1. …
  2. …
- Risultato atteso: …
- Motivo (in relazione al batch): …
- Aree correlate: …
```

| Esito smoke | Effetto |
|----|----|
| Tutti OK (PO) | Si può accettare il batch |
| Uno o più KO | Bonifica non accettabile; fix o rollback |
| Checklist assente | Attività incompleta — non chiudibile |

---

# Parte 4 — Stato del piano

> Aggiornare a **ogni** audit e batch concluso.

| Livello | Nome | Categorie | Diagnostiche | % sul totale | Stato |
|----|----|---:|---:|---:|----|
| **L0** | Batch certificato | 2 vive | 18 | 1,67% | **completato** come batch (chiuso); residui live documentati: `format`×**13** + `organizeImports`×**5** (≠ nuovo batch) |
| **L1** | Mini audit | 0 | 0 | 0% | **completato** (chiusura per **riclassificazione**, non 1233 fix L1) |
| **L2** | Audit specialistico | 13 | 718 | 66,60% | **in corso** — B2a **0**; **B2b 249 IN CORSO**; B2c **469** da aprire |
| **L3** | Revisione architetturale | 5 | 315 | 29,22% | **non iniziato** |
| **L4** | Casi singoli | 7 | 27 | 2,50% | **non iniziato** |
| **Totale** | — | **27** | **1078** | **100%** | focus = **B2b** (snapshot **249**); Tranche A **CHIUSA**; `noExplicitAny` **0** |

### Legenda stati (per livello aggregato)

| Stato | Significato |
|----|----|
| `non iniziato` | Nessun lavoro su quel livello |
| `in analisi` | Audit/revisione in corso |
| `in corso` | Fix/batch aperti |
| `completato` | Livello/batch certificato **chiuso**. Può restare residuo live documentato (es. L0 `format`×13): **non** = nuovo batch automatico; per L1 = chiusura per riclassificazione |

### Diario (solo eventi operativi recenti)

| Data | Evento | Residue | Note |
|----|----|---:|----|
| 2026-08-04 | **ACCETTO PO B1a/B1b/B1c** | **2134** | Prossimo = **B2a** |
| 2026-08-04 | **Split SoT / History** | **2134** | Viva = questo file; archivio = `AI_BIOME_HISTORY.md` |
| 2026-08-04 | **B2a audit classificazione CHIUSA** | **2134** | `noExplicitAny` A=123 B=180 C=143 D=0; tranche non eseguite |
| 2026-08-05 | **B2a Batch A ACCETTATO** | **2011** | −123 `noExplicitAny`; +7 collaterali `noGlobalIsNan` accettate |
| 2026-08-05 | **B2a Batch B in review finale** | **2011** SoT | Review aperta (superseduta dall’ACCETTO del 2026-08-06) |
| 2026-08-06 | **B2a Batch B ACCETTATO — chiuso** | **1967** | ACCETTO PO; `noExplicitAny` **209**; Quality Delta OK; nessun nuovo debito; prossimo = audit C |
| 2026-08-06 | **Split History / Legacy** | **1967** | Dettaglio L0/L1 + appendici → `AI_BIOME_HISTORY_LEGACY.md` |
| 2026-08-06 | **Riconciliazione drift L0** | **1892** | −75 meccaniche; escluso `format`×1 `index.css` (`parse`) |
| 2026-08-06 | **Regola permanente audit UI/dominio** | **1892** | SoT §21; avvio Batch C = audit PO C2 (nessun fix) |
| 2026-08-06 | **§21.1 percorsi QA + §22 no frammentazione** | **1892** | Affinamento metodologia; C2 rivalutato come unico batch |
| 2026-08-06 | **B2a Batch C2 ACCETTATO — chiuso** | **1885** | −7 `noExplicitAny`; Quality Delta + smoke OK; prossimo = audit PO **C3** (unico batch proposto) |
| 2026-08-06 | **B2a Batch C3 — bonifica parziale (doc sync)** | **1851** | Codice già avanzato (−35 any); 8 residui context; SoT riallineata; C3 non chiuso |
| 2026-08-06 | **B2a Batch C3 ACCETTATO — chiuso** | **1840** | Context tipizzati (−8 any); ModalPropsBag; Quality Delta OK; prossimo = audit PO **C4** |
| 2026-08-07 | **B2a Batch C4 ACCETTATO — chiuso** | **1825** | ACCETTO PO; Services tipizzati (−15 any / 7 file → 0); Quality Delta OK; prossimo = audit PO **C5** |
| 2026-08-07 | **B2a Batch C5 ACCETTATO — chiuso** | — | Community (−8 any / 2 file → 0); sync SoT con C6 |
| 2026-08-07 | **B2a Batch C6 ACCETTATO — chiuso** | **1799** | Utils (−15 any / 5 file → 0); `noExplicitAny` **121**; prossimo = audit PO **C1** |
| 2026-08-07 | **B2a Batch C1 — audit PO avvio** | **1799** | Perimetro live **71**/19 (+ facade); piano boundary-first; nessun fix |
| 2026-08-07 | **B2a Batch C1 — bonifica completata** | **1714** | −71 any / 19→0; `noExplicitAny` **50**; attende ACCETTO chiusura |
| 2026-08-07 | **B2a Batch C1 ACCETTATO — Batch C completo** | **1714** | ACCETTO PO; C1–C6 chiusi; `noExplicitAny` **50**; prossimo = residui any R50 |
| 2026-08-07 | **B2a R50 — audit residui** | **1714** | Piano mini-batch R1–R10 su **50** any / 28 file |
| 2026-08-07 | **B2a R50 R1 ACCETTATO — chiuso** | **1704** | −10 any (`useServiceRegeneration`→0); `noExplicitAny` **40**; prossimo = ACCETTO **R4** |
| 2026-08-07 | **B2a R50 — piano RP-* ACCETTATO** | **1704** | Revisione operativa 9→8 aperti; somma hit **40**; prossimo = ACCETTO **RP-Photo** |
| 2026-08-07 | **B2a R50 RP-Photo — bonifica completata** | **1698** | −6 any / 4 file → 0; `noExplicitAny` **34**; attende ACCETTO chiusura; prossimo = **RP-Pricing** |
| 2026-08-07 | **B2a R50 RP-Photo ACCETTATO — chiuso** | **1698** | ACCETTO PO; smoke/QG OK; `noExplicitAny` **34**; prossimo = **RP-Pricing** |
| 2026-08-07 | **B2a R50 RP-Pricing — bonifica completata** | **1692** | −6 any / 2 file → 0; `noExplicitAny` **28**; attende ACCETTO chiusura |
| 2026-08-07 | **B2a R50 RP-Pricing ACCETTATO — chiuso** | **1692** | ACCETTO PO; smoke/QG/QD OK; `noExplicitAny` **28**; prossimo = **audit residuo R50** |
| 2026-08-07 | **B2a R50 — audit residuo → RP-Mech** | **1689** live | Audit residuo: prossimo = **RP-Mech** (7/7); SoT ancora **1692**/`28` fino a chiusura Mech |
| 2026-08-07 | **B2a R50 RP-Mech — bonifica completata** | **1682** | −7 any / 7 file → 0; `noExplicitAny` **21**; attende ACCETTO chiusura |
| 2026-08-07 | **B2a R50 RP-Mech ACCETTATO — chiuso** | **1682** | ACCETTO PO; smoke/QG OK; `noExplicitAny` **21**; prossimo = **bonifica RP-Settings** |
| 2026-08-07 | **B2a R50 RP-Settings — bonifica completata** | **1671** | −10 any / 6 file → 0; `noExplicitAny` **11**; attende ACCETTO PO chiusura |
| 2026-08-07 | **B2a R50 RP-Settings ACCETTATO — chiuso** | **1671** | ACCETTO PO; QD type guards GlobalSettingsPanel; `noExplicitAny` **11**; errors=1157, warnings=514; prossimo = **audit PO RP-EventsAI** |
| 2026-08-07 | **B2a R50 — fusione piano RP-Residual** | **1671** | EventsAI+Undo+Core+CityRoad → **RP-Residual** (In audit PO al momento; bonifica **10**/8); Roadbook deferred; live allora **11**/9; **superseduta** da ACCETTO Residual / B2a chiuso |
| 2026-08-07 | **B2a R50 RP-Residual ACCETTATO — B2a chiuso** | **1660** | −10 any / 8 file → 0; QD Events/Suggestion; ultimo hit Roadbook tipizzato (`RoadbookSummary`); `noExplicitAny` **0**; errors=1157, warnings=503; prossimo = **audit PO B2b** |
| 2026-08-08 | **B2b — tranche BASSO bonificata + audit residuo** | **1432** | Progetto **1660→1432** (Δ **−228**); B2b **769→547** (Δ **−222**); `noExplicitAny` **0**; E932/W500; residuo B2b auditato (181 file); prossimo sottoperimetro = **modali/overlay/drawer** |
| 2026-08-09 | **B2b A1 ACCETTATO + low-risk A eseguita (review PO)** | **1316** | A1 ACCETTATO; low-risk A2–A7* (no attempt) in codice — **non** ACCETTATA PO; B2b **547→431** (Δ **−116**); E816/W500; `noExplicitAny` **0** |
| 2026-08-13 | **Riconciliazione snapshot live (non ACCETTO PO)** | **1213** | Live `biome check --reporter=json`: **1213** (E745/W468); file **414**; cat. **27**; B2b **389**; B2c **471**; L3 **318**; L0 **8** (`format`×7). Δ vs 1316 = **−103** (working tree / Quality Delta, **non** batch B2b nominato). `useHookAtTopLevel` a 0. Tranche low-risk A allora ancora in attesa ACCETTO PO. |
| 2026-08-15 | **B2b low-risk A ACCETTATA PO** | **1213*** | ACCETTO PO formale su A2–A7* (esclusi attempt; **114** hit già in codice). Nessuna ripresa codice. Snapshot numerico invariato rispetto a 2026-08-13 (*). B2c non aperto. |
| 2026-08-15 | **B2b A5/A7-attempt ESEGUITI** | **1213*** | Bonifica target **4→0** in codice (`AdminPoiModal` / `ReviewModal`). Comportamenti PO congelati preservati. **Attende ACCETTO PO** file definitivi. Snapshot SoT invariato (*). B2c non aperto. |
| 2026-08-16 | **B2b C-P3a ESEGUITO (ACCETTO PO)** | **1213*** | Micro-batch C-P3a: **3** `noLabelWithoutControl` → **0** (Autore/Descrizione + Preferred Partners). Solo htmlFor/id. **Non** riconciliato nei contatori 1213/389 (*). B2c non aperto. |
| 2026-08-16 | **Promozione snapshot Biome ufficiale** | **1078** | Live `biome check --reporter=json`: **1078** (E610/W468); file **377**; cat. **27**; B2b **249**; B2c **469**; L0 **18**; L3 **315**. Δ vs 1213 = **−135**; B2b **389→249** (Δ **−140**). Nessuna attribution manuale. Tranche A chiusa; C-P3a assorbito. |

Diario completo → [`AI_BIOME_HISTORY.md`](./AI_BIOME_HISTORY.md).

---

# Parte 5 — Regole permanenti

1. **Nessun fix solo per far tacere Biome.** Ogni modifica deve migliorare realmente architettura, funzione, type safety, a11y reale o manutenibilità.
2. **Nessuna suppressione senza decisione esplicita** (policy D / Registro).
3. **Nessun hack.**
4. **Nessun workaround** volto solo a silenziare il linter.
5. **Ogni modifica deve migliorare realmente il codice.**
6. **SoT operativa = questo file.** Lo storico concluso va in [`AI_BIOME_HISTORY.md`](./AI_BIOME_HISTORY.md); il dettaglio congelato in [`AI_BIOME_HISTORY_LEGACY.md`](./AI_BIOME_HISTORY_LEGACY.md). Non si crea una terza SoT numerica.
7. **Una categoria = un solo livello alla volta** (L0–L4 o D). In dubbio: livello più cauto.
8. **L0 = batch certificato**, non esecuzione automatica.
9. **Workflow (Parte 3bis) + validazione (Parte 3quater) obbligatori.**
10. **Vietato chiudere una bonifica** senza check · typecheck · build · smoke positivi — **salvo eccezione PO** nel Registro.
11. **Dopo ogni bonifica codice:** checklist smoke navigabile per il PO.
12. **Ogni decisione rilevante** va nel Registro (rilevante qui + completo in History).
13. **Ogni categoria ha uno stato operativo** (Parte 2bis).
14. **Ordine corrente:** **B2a COMPLETATO**; procedere con **B2b** (non aprire B2c finché B2b non stabilizzato); non anticipare L3/L4 per “pulire numeri” se L2 produce ancora riclassificazioni utili.
15. **`AI_QUALITY/biome/*`** = supporto; se divergono, prevale questo file fino al riallineamento.
16. **Baseline 6232** resta il riferimento storico di partenza del progetto.
17. **«Avanzamento per livello»** si aggiorna dopo ogni batch accettato.
18. **Iniziali congelati:** L0=2802, L1=1233, L2=1764, L3=350, L4=8.
19. **L1 chiusa; B1 accettati; B2a COMPLETATO** (`noExplicitAny` **0**). Focus corrente: **B2b**. **Snapshot ufficiale:** **1078** / B2b **249** (2026-08-16). Precedente storico: **1213** / B2b **389** (2026-08-13). Tranche A **CHIUSA**/ACCETTATA PO; C-P3a **ACCETTATO PO**. B2c **non aperto**.
20. **Split documentale:** contenuto concluso → History; contenuto operativo → questo file; **zero perdita** di informazione.
21. **Audit architetturali orientati a UI e dominio (obbligatorio).** L’utente **non** è uno sviluppatore e **non** ragiona sul codice. Ogni audit architetturale (in particolare Batch C / L2–L3 a rischio dominio) deve essere spiegato **principalmente** dal punto di vista della **UI** e del **dominio**. Per ogni area analizzata descrivere sempre: (1) dove si trova la funzionalità nell’app; (2) come un utente ci arriva, click dopo click; (3) il flusso completo dall’inizio alla fine; (4) in quale punto di quel flusso interviene il pezzo sotto audit; (5) conseguenze di una modifica errata; (6) come verificare manualmente dalla UI; (7) quali schermate/percorsi saranno interessati dal futuro batch. **Non** dare per scontato la conoscenza di file, hook, servizi, parser o tipi TypeScript: il codice è solo implementazione tecnica. Ogni audit si organizza in **A) Visione funzionale (UI e dominio)** — sufficiente da sola per comprendere il problema senza leggere codice — e **B) Visione tecnica (codice)**.

    **21.1 Percorsi UI = script QA reali (obbligatorio).** I percorsi click-dopo-click **non** possono essere frasi generiche («aprire una città», «controllare i rating»). Devono essere **eseguibili da un tester QA** che non conosce il codice: nomi di voci di menu/pulsanti/tab/sezioni come in UI; città di test indicata (o «città di test indicata dal PO»); passi numerati completi (anche ritorno e percorso Admin). Ogni audit deve contenere **almeno un** percorso QA completamente navigabile. Se manca un’informazione (etichetta esatta, schermata, flusso reale), l’audit deve **dichiararlo esplicitamente** invece di usare descrizioni vaghe.

22. **Filosofia batch: raggruppare, non frammentare (obbligatorio, anche Batch C).** La bonifica Biome privilegia pattern omogenei e **pochi** cicli audit → implementazione → review → test → accettazione. Un gruppo C1…C6 **non** va suddiviso in ulteriori mini-batch se non esiste una **motivazione architetturale, di dominio o di rischio dimostrabile**. La suddivisione è l’**eccezione**, non la regola. «È più prudente» **non** basta: occorre mostrare dipendenza concreta, comportamento diverso in UI, o rischio non gestibile in un unico smoke. In assenza di tali motivi → **un unico batch omogeneo** con checklist QA unica.

---

## Documenti correlati

| Documento | Ruolo |
|-----------|--------|
| [`AI_BIOME_AUDIT.md`](./AI_BIOME_AUDIT.md) (questo file) | **SoT operativa** — stato corrente, dashboard, roadmap aperta, workflow, regole |
| [`AI_BIOME_HISTORY.md`](./AI_BIOME_HISTORY.md) | **Archivio storico principale** (diario, decisioni, contabilità, snapshot) |
| [`AI_BIOME_HISTORY_LEGACY.md`](./AI_BIOME_HISTORY_LEGACY.md) | **Legacy** — dettaglio congelato (L0/L1, appendici file, testo pre-split L2–L4) |
| [`AI_BIOME_AUDIT_35_FILES_HISTORY.md`](./AI_BIOME_AUDIT_35_FILES_HISTORY.md) | Storico audit parziale 35 file (non baseline globale) |
| [`AI_QUALITY/README.md`](./AI_QUALITY/README.md) | Indice dettaglio per categoria (supporto; può restare indietro) |
| [`AI_DEV_WORKFLOW/WORKFLOWS/WF_QUAL_01_QUALITY_TOOLCHAIN_SOT.md`](./AI_DEV_WORKFLOW/WORKFLOWS/WF_QUAL_01_QUALITY_TOOLCHAIN_SOT.md) | SoT toolchain qualità (`npm run check` / Biome CLI) |

Gerarchia documentale
AI_BIOME_AUDIT
        ↓
AI_BIOME_HISTORY
        ↓
AI_QUALITY/*